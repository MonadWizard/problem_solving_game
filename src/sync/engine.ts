import type { LocalState } from '../lib/types'
import type { CloudAdapter } from './cloud'
import { mergeProgress } from './merge'
import { flushQueue } from './queue'
import { setSyncNotifier, useGameStore } from '../store/gameStore'

/**
 * Login merge (sync architecture step 2): fetch cloud → merge with local →
 * push the full merged state up (server-side merges are idempotent, so
 * re-pushing rows the cloud already has is safe and guarantees nothing
 * local-only is left behind) → return the merged state for rendering.
 * The queue is cleared: everything it contained is covered by the push.
 */
export async function onLogin(local: LocalState, cloud: CloudAdapter): Promise<LocalState> {
  const remote = await cloud.fetchState()
  const merged = mergeProgress(local, remote)

  await cloud.upsertSolves(merged.solves)
  await cloud.insertEvents(merged.events)
  await cloud.upsertItems(merged.items)

  const displayName = remote.meta?.displayName ?? local.displayName
  const leetcodeUsername = remote.meta?.leetcodeUsername ?? local.leetcodeUsername
  if ((displayName && !remote.meta?.displayName) || (leetcodeUsername && !remote.meta?.leetcodeUsername)) {
    await cloud.upsertMeta({
      displayName: displayName ?? undefined,
      leetcodeUsername: leetcodeUsername ?? undefined,
    })
  }

  return { ...local, ...merged, displayName, leetcodeUsername, queue: [] }
}

/**
 * App-open reconcile while logged in (step 4): flush any queued offline
 * writes first, then pull the cloud and merge — cloud wins for rows this
 * device has never seen; nothing local is ever lost.
 */
export async function reconcileOnOpen(local: LocalState, cloud: CloudAdapter): Promise<LocalState> {
  const flushed = await flushQueue(local, cloud)
  const remote = await cloud.fetchState()
  const merged = mergeProgress(flushed, remote)
  return {
    ...flushed,
    ...merged,
    displayName: flushed.displayName ?? remote.meta?.displayName ?? null,
    leetcodeUsername: flushed.leetcodeUsername ?? remote.meta?.leetcodeUsername ?? null,
  }
}

/**
 * Wires the write-through pipeline (step 3): after every local mutation the
 * game store notifies us and we flush the persisted queue in the background;
 * the browser 'online' event retries anything left from offline play.
 */
export function attachSyncEngine(cloud: CloudAdapter): () => void {
  let flushing = false

  async function flush() {
    if (flushing) return
    flushing = true
    try {
      const { local, replaceLocal } = useGameStore.getState()
      if (local.queue.length === 0) return
      const next = await flushQueue(local, cloud)
      if (next !== local) {
        // Preserve any ops enqueued while we were flushing.
        const current = useGameStore.getState().local
        const flushedCount = local.queue.length - next.queue.length
        replaceLocal({ ...current, queue: current.queue.slice(flushedCount) })
      }
    } finally {
      flushing = false
    }
  }

  const onOnline = () => void flush()
  setSyncNotifier(() => void flush())
  window.addEventListener('online', onOnline)
  void flush()

  return () => {
    setSyncNotifier(null)
    window.removeEventListener('online', onOnline)
  }
}

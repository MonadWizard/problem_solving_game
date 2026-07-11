import type { LocalState, QueueOp } from '../lib/types'
import type { CloudAdapter } from './cloud'

/**
 * Flush the persisted offline queue to the cloud, oldest first.
 * At-least-once delivery: an op is removed only after its push succeeds;
 * on the first failure we stop and keep the rest (order preserved).
 * Safe because every CloudAdapter write is idempotent.
 */
export async function flushQueue(state: LocalState, cloud: CloudAdapter): Promise<LocalState> {
  const remaining = [...state.queue]
  while (remaining.length > 0) {
    const op = remaining[0]
    try {
      await pushOp(op, cloud)
    } catch {
      break
    }
    remaining.shift()
  }
  return remaining.length === state.queue.length ? state : { ...state, queue: remaining }
}

async function pushOp(op: QueueOp, cloud: CloudAdapter): Promise<void> {
  switch (op.kind) {
    case 'solve':
      return cloud.upsertSolves([op.solve])
    case 'event':
      return cloud.insertEvents([op.event])
    case 'items':
      return cloud.upsertItems(op.items)
    case 'meta':
      return cloud.upsertMeta(op.meta)
  }
}

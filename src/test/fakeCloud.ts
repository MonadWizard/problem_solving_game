import type { GameEvent, ItemsState, ProgressState, Solve } from '../lib/types'
import type { CloudAdapter, CloudMeta } from '../sync/cloud'
import { mergeEvents, mergeItems, mergeSolves } from '../sync/merge'

/**
 * In-memory stand-in for the Supabase backend with the same idempotent write
 * semantics as supabase/schema.sql (merge_solves, event upsert-by-uuid,
 * merge_items). `offline` makes every call throw, simulating lost connectivity.
 */
export class FakeCloud implements CloudAdapter {
  solves: Solve[] = []
  events: GameEvent[] = []
  items: ItemsState = {}
  meta: CloudMeta | null = null
  offline = false
  writes = 0

  private check() {
    if (this.offline) throw new Error('network down')
  }

  async fetchState(): Promise<ProgressState & { meta: CloudMeta | null }> {
    this.check()
    return {
      solves: [...this.solves],
      events: [...this.events],
      items: { ...this.items },
      meta: this.meta ? { ...this.meta } : null,
    }
  }

  async upsertSolves(solves: Solve[]): Promise<void> {
    this.check()
    this.writes++
    this.solves = mergeSolves(this.solves, solves)
  }

  async insertEvents(events: GameEvent[]): Promise<void> {
    this.check()
    this.writes++
    this.events = mergeEvents(this.events, events)
  }

  async upsertItems(items: ItemsState): Promise<void> {
    this.check()
    this.writes++
    this.items = mergeItems(this.items, items)
  }

  async upsertMeta(meta: { displayName?: string; leetcodeUsername?: string }): Promise<void> {
    this.check()
    this.writes++
    this.meta = {
      displayName: meta.displayName ?? this.meta?.displayName ?? null,
      leetcodeUsername: meta.leetcodeUsername ?? this.meta?.leetcodeUsername ?? null,
      totalXp: this.meta?.totalXp ?? 0,
    }
  }

  state(): ProgressState {
    return { solves: [...this.solves], events: [...this.events], items: { ...this.items } }
  }
}

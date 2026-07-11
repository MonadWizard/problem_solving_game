import type { GameEvent, ItemsState, ProgressState, Solve } from '../lib/types'

export interface CloudMeta {
  displayName: string | null
  leetcodeUsername: string | null
  totalXp: number
}

/**
 * Everything the sync engine needs from a backend. Implementations MUST be
 * idempotent per call (safe under at-least-once queue delivery):
 * - upsertSolves: upsert on (journey_id, slug)
 * - insertEvents: upsert on the client-generated uuid
 * - upsertItems: merge-with-max against the stored value, never blind write
 */
export interface CloudAdapter {
  fetchState(): Promise<ProgressState & { meta: CloudMeta | null }>
  upsertSolves(solves: Solve[]): Promise<void>
  insertEvents(events: GameEvent[]): Promise<void>
  upsertItems(items: ItemsState): Promise<void>
  upsertMeta(meta: { displayName?: string; leetcodeUsername?: string }): Promise<void>
}

import type { SupabaseClient } from '@supabase/supabase-js'
import type { GameEvent, ItemsState, JourneyId, ProgressState, Solve } from '../lib/types'
import type { CloudAdapter, CloudMeta } from './cloud'

interface ProgressRow {
  journey_id: number
  problem_slug: string
  solved_at: string
  seconds_taken: number | null
  starred: boolean
}

interface EventRow {
  id: string
  event_type: GameEvent['type']
  ref_slug: string | null
  happened_at: string
}

/**
 * CloudAdapter over Supabase. Write idempotency lives server-side:
 * merge_solves/merge_items RPCs apply the same merge rules as src/sync/merge.ts
 * (earliest solved_at, starred OR, per-key max) and user_events upserts on the
 * client uuid. total_xp is recomputed by triggers — never written from here.
 */
export function makeSupabaseCloud(client: SupabaseClient, userId: string): CloudAdapter {
  return {
    async fetchState(): Promise<ProgressState & { meta: CloudMeta | null }> {
      const [progress, events, meta] = await Promise.all([
        client.from('user_progress').select('journey_id, problem_slug, solved_at, seconds_taken, starred'),
        client.from('user_events').select('id, event_type, ref_slug, happened_at'),
        client.from('user_meta').select('display_name, leetcode_username, items, total_xp').maybeSingle(),
      ])
      if (progress.error) throw progress.error
      if (events.error) throw events.error
      if (meta.error) throw meta.error

      return {
        solves: (progress.data as ProgressRow[]).map((r) => ({
          journeyId: r.journey_id as JourneyId,
          slug: r.problem_slug,
          solvedAt: r.solved_at,
          secondsTaken: r.seconds_taken,
          starred: r.starred,
        })),
        events: (events.data as EventRow[]).map((r) => ({
          id: r.id,
          type: r.event_type,
          refSlug: r.ref_slug,
          happenedAt: r.happened_at,
        })),
        items: (meta.data?.items as ItemsState | undefined) ?? {},
        meta: meta.data
          ? {
              displayName: meta.data.display_name,
              leetcodeUsername: meta.data.leetcode_username,
              totalXp: meta.data.total_xp,
            }
          : null,
      }
    },

    async upsertSolves(solves: Solve[]): Promise<void> {
      if (!solves.length) return
      const { error } = await client.rpc('merge_solves', {
        p_solves: solves.map((s) => ({
          journey_id: s.journeyId,
          problem_slug: s.slug,
          solved_at: s.solvedAt,
          seconds_taken: s.secondsTaken,
          starred: s.starred,
        })),
      })
      if (error) throw error
    },

    async insertEvents(events: GameEvent[]): Promise<void> {
      if (!events.length) return
      const { error } = await client.from('user_events').upsert(
        events.map((e) => ({
          id: e.id,
          user_id: userId,
          event_type: e.type,
          ref_slug: e.refSlug,
          happened_at: e.happenedAt,
        })),
        { onConflict: 'id', ignoreDuplicates: true },
      )
      if (error) throw error
    },

    async upsertItems(items: ItemsState): Promise<void> {
      const { error } = await client.rpc('merge_items', { p_items: items })
      if (error) throw error
    },

    async upsertMeta(meta: { displayName?: string; leetcodeUsername?: string }): Promise<void> {
      const { error } = await client.rpc('set_meta', {
        p_display_name: meta.displayName ?? null,
        p_leetcode_username: meta.leetcodeUsername ?? null,
      })
      if (error) throw error
    },
  }
}

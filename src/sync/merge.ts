import type { GameEvent, ItemsState, ProgressState, Solve } from '../lib/types'

/**
 * THE merge invariants (property-tested; see .claude/skills/supabase-sync):
 * idempotent, commutative, never loses a solved problem, and XP never
 * double-counts because it is derived from the merged logs afterwards.
 * Every rule below must preserve those properties — e.g. items use per-key
 * max (not sum), because summing would double counts on re-merge.
 */

const solveKey = (s: Solve): string => `${s.journeyId}:${s.slug}`

export function mergeSolves(a: Solve[], b: Solve[]): Solve[] {
  const map = new Map<string, Solve>()
  for (const s of [...a, ...b]) {
    const key = solveKey(s)
    const prev = map.get(key)
    if (!prev) {
      map.set(key, { ...s })
      continue
    }
    const earlier = Date.parse(s.solvedAt) < Date.parse(prev.solvedAt) ? s : prev
    const seconds = [prev.secondsTaken, s.secondsTaken].filter((x): x is number => x !== null)
    map.set(key, {
      journeyId: prev.journeyId,
      slug: prev.slug,
      solvedAt: earlier.solvedAt,
      secondsTaken: seconds.length ? Math.min(...seconds) : null,
      starred: prev.starred || s.starred,
    })
  }
  return [...map.values()].sort((x, y) => solveKey(x).localeCompare(solveKey(y)))
}

export function mergeEvents(a: GameEvent[], b: GameEvent[]): GameEvent[] {
  const map = new Map<string, GameEvent>()
  for (const e of [...a, ...b]) map.set(e.id, { ...e })
  return [...map.values()].sort(
    (x, y) => Date.parse(x.happenedAt) - Date.parse(y.happenedAt) || x.id.localeCompare(y.id),
  )
}

export function mergeItems(a: ItemsState, b: ItemsState): ItemsState {
  const out: ItemsState = {}
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    out[key] = Math.max(a[key] ?? 0, b[key] ?? 0)
  }
  return out
}

export function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  return {
    solves: mergeSolves(a.solves, b.solves),
    events: mergeEvents(a.events, b.events),
    items: mergeItems(a.items, b.items),
  }
}

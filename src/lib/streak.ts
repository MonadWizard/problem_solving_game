import type { GameEvent } from './types'

/** Local-calendar day key, e.g. "2026-07-12". */
export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const SOLVE_TYPES = new Set(['solve', 'boss_win', 'ghost_win'])

/**
 * Daily solve streak, derived from the event log (never a stored counter, so
 * it survives merges). Walking back from today: an active day extends the
 * streak; a day covered by a `freeze_used` event bridges the chain without
 * counting; today being empty does not break the streak.
 */
export function computeStreak(events: GameEvent[], now: Date = new Date()): number {
  const active = new Set<string>()
  const frozen = new Set<string>()
  for (const e of events) {
    const key = dayKey(new Date(e.happenedAt))
    if (SOLVE_TYPES.has(e.type)) active.add(key)
    else if (e.type === 'freeze_used') frozen.add(key)
  }

  let streak = 0
  const cursor = new Date(now)
  if (!active.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  for (;;) {
    const key = dayKey(cursor)
    if (active.has(key)) streak++
    else if (!frozen.has(key)) break
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** True when the streak is about to break: yesterday empty, day before active. */
export function streakAtRisk(events: GameEvent[], now: Date = new Date()): boolean {
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const withYesterdayFrozen: GameEvent[] = [
    ...events,
    { id: 'probe', type: 'freeze_used', refSlug: null, happenedAt: yesterday.toISOString() },
  ]
  return computeStreak(events, now) === 0 && computeStreak(withYesterdayFrozen, now) > 0
}

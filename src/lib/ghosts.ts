import type { GameEvent } from './types'

/** Spaced-repetition waves: days after a boss win when its ghost returns. */
export const GHOST_WAVES = [7, 21, 60] as const

export interface DueGhost {
  slug: string
  wave: 1 | 2 | 3
  dueAt: string
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Ghost ships due for a re-fight. For each beaten boss (earliest boss_win per
 * slug), each wave becomes due `GHOST_WAVES[i]` days later and is cleared by a
 * ghost_win for that slug at/after its due time. Returns the earliest pending
 * wave per slug.
 */
export function dueGhosts(events: GameEvent[], now: Date = new Date()): DueGhost[] {
  const firstBossWin = new Map<string, number>()
  for (const e of events) {
    if (e.type !== 'boss_win' || !e.refSlug) continue
    const t = Date.parse(e.happenedAt)
    const prev = firstBossWin.get(e.refSlug)
    if (prev === undefined || t < prev) firstBossWin.set(e.refSlug, t)
  }

  const due: DueGhost[] = []
  for (const [slug, wonAt] of firstBossWin) {
    for (let i = 0; i < GHOST_WAVES.length; i++) {
      const dueAt = wonAt + GHOST_WAVES[i] * DAY_MS
      if (now.getTime() < dueAt) break
      const cleared = events.some(
        (e) => e.type === 'ghost_win' && e.refSlug === slug && Date.parse(e.happenedAt) >= dueAt,
      )
      if (!cleared) {
        due.push({ slug, wave: (i + 1) as 1 | 2 | 3, dueAt: new Date(dueAt).toISOString() })
        break
      }
    }
  }
  return due
}

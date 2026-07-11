import type { Problem, ProgressState } from './types'
import { problemKey } from '../data/curriculum'

export const GHOST_BONUS_XP = 150
export const CHEST_BONUS_XP = 50

/** Cumulative XP required to reach level N. */
export function xpForLevel(n: number): number {
  return n * n * 100
}

export function levelForXp(totalXp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, totalXp) / 100))
}

export function xpToNextLevel(total: number): { level: number; current: number; needed: number } {
  const level = levelForXp(total)
  return {
    level,
    current: total - xpForLevel(level),
    needed: xpForLevel(level + 1) - xpForLevel(level),
  }
}

/**
 * Canonical XP derivation — the ONLY way XP is computed client-side.
 * Mirrors the server-side trigger formula (see supabase/schema.sql):
 * solve XP from the problem table + flat event bonuses. Because it is a
 * pure function of the merged logs, merging devices can never double-count.
 */
export function totalXp(state: ProgressState, problems: Map<string, Problem>): number {
  let xp = 0
  for (const s of state.solves) {
    xp += problems.get(problemKey(s.journeyId, s.slug))?.xp ?? 0
  }
  for (const e of state.events) {
    if (e.type === 'ghost_win') xp += GHOST_BONUS_XP
    else if (e.type === 'chest' && e.refSlug === 'xp') xp += CHEST_BONUS_XP
    else if (e.type === 'haste_bonus' && e.refSlug) xp += problems.get(e.refSlug)?.xp ?? 0
  }
  return xp
}

export function formatBounty(xp: number): string {
  return `₿ ${xp.toLocaleString('en-US')}`
}

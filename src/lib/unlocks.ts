import type { Island, Journey, ProgressState } from './types'

function solvedSlugs(j: Journey, state: ProgressState): Set<string> {
  return new Set(state.solves.filter((s) => s.journeyId === j.id).map((s) => s.slug))
}

export function islandProgress(
  j: Journey,
  islandId: string,
  state: ProgressState,
): { solved: number; total: number } {
  const solved = solvedSlugs(j, state)
  const probs = j.problems.filter((p) => p.island_id === islandId)
  return { solved: probs.filter((p) => solved.has(p.slug)).length, total: probs.length }
}

export function islandComplete(j: Journey, islandId: string, state: ProgressState): boolean {
  const { solved, total } = islandProgress(j, islandId, state)
  return total > 0 && solved === total
}

export function quizPassed(islandId: string, state: ProgressState): boolean {
  return state.events.some((e) => e.type === 'quiz_pass' && e.refSlug === islandId)
}

function previousIsland(j: Journey, islandId: string): Island | null {
  const island = j.islands.find((i) => i.id === islandId)
  if (!island) throw new Error(`unknown island ${islandId}`)
  return j.islands.find((i) => i.order === island.order - 1) ?? null
}

/**
 * Journey 1: an island unlocks when the previous one is 100% solved AND its
 * pattern-gate quiz is passed (a synced quiz_pass event, so unlock state
 * resumes on any device). Journey 2 isles unlock sequentially by completion.
 * Journey 3 (The Abyss) has no gating at all — every company island is
 * unlocked immediately, since companies aren't a learning progression.
 */
export function islandUnlocked(j: Journey, islandId: string, state: ProgressState): boolean {
  if (j.id === 3) return true
  const prev = previousIsland(j, islandId)
  if (!prev) return true
  if (!islandComplete(j, prev.id, state)) return false
  return j.id === 1 ? quizPassed(prev.id, state) : true
}

export function journeyComplete(j: Journey, state: ProgressState): boolean {
  const solved = solvedSlugs(j, state)
  return j.problems.every((p) => solved.has(p.slug))
}

/** The Blind Sea has no completion gate — available from the start, same as The First Sea. */
export function journey2Unlocked(_j1: Journey, _state: ProgressState): boolean {
  return true
}

export function completedIslands(j: Journey, state: ProgressState): Island[] {
  return j.islands.filter((i) => islandComplete(j, i.id, state))
}

export type ShipTier = 'dinghy' | 'sloop' | 'brig' | 'galleon'

export function shipTier(j1: Journey, state: ProgressState): ShipTier {
  const n = completedIslands(j1, state).length
  if (n >= 14) return 'galleon'
  if (n >= 9) return 'brig'
  if (n >= 4) return 'sloop'
  return 'dinghy'
}

export const SHIP_TIER_LABEL: Record<ShipTier, string> = {
  dinghy: 'Dinghy',
  sloop: 'Sloop',
  brig: 'Brig',
  galleon: 'Galleon',
}

/** First unlocked-but-incomplete island — where the ship is sailing. */
export function currentIsland(j: Journey, state: ProgressState): Island | null {
  for (const island of [...j.islands].sort((a, b) => a.order - b.order)) {
    if (!islandComplete(j, island.id, state) && islandUnlocked(j, island.id, state)) return island
  }
  return null
}

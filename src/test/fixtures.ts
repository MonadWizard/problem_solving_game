import type {
  Difficulty,
  GameEvent,
  Journey,
  JourneyId,
  LocalState,
  ProgressState,
  Solve,
} from '../lib/types'

const XP: Record<Difficulty, number> = { easy: 100, medium: 250, hard: 500 }

let uid = 0
export const nextId = (): string => `test-${++uid}`

/** Tiny journey: islands as [id, problemCount], one boss (last), patterns "<islandId>-pat". */
export function makeJourney(id: JourneyId, islands: [string, number][]): Journey {
  const j: Journey = { id, name: `Journey ${id}`, islands: [], problems: [] }
  islands.forEach(([islandId, count], i) => {
    j.islands.push({ id: islandId, name: `${islandId} Island`, order: i + 1 })
    for (let k = 1; k <= count; k++) {
      const boss = k === count
      const difficulty: Difficulty = boss ? 'hard' : 'medium'
      j.problems.push({
        slug: `${islandId}-p${k}`,
        title: `${islandId} Problem ${k}`,
        difficulty,
        island_id: islandId,
        order: k,
        xp: XP[difficulty] * (boss ? 2 : 1),
        pattern: `${islandId}-pat`,
        is_boss: boss,
        leetcode_url: `https://leetcode.com/problems/${islandId}-p${k}/`,
      })
    }
  })
  return j
}

export function makeSolve(overrides: Partial<Solve> & { slug: string }): Solve {
  return { journeyId: 1, solvedAt: '2026-07-01T10:00:00.000Z', secondsTaken: null, starred: false, ...overrides }
}

export function makeEvent(overrides: Partial<GameEvent> & { type: GameEvent['type'] }): GameEvent {
  return { id: nextId(), refSlug: null, happenedAt: '2026-07-01T10:00:00.000Z', ...overrides }
}

export function progress(overrides: Partial<ProgressState> = {}): ProgressState {
  return { solves: [], events: [], items: {}, ...overrides }
}

export function localState(overrides: Partial<LocalState> = {}): LocalState {
  return {
    version: 1,
    solves: [],
    events: [],
    items: {},
    displayName: null,
    leetcodeUsername: null,
    hasteUntil: null,
    attempts: {},
    pausedAttempts: {},
    queue: [],
    ...overrides,
  }
}

/** Solve every problem of a journey (optionally emitting quiz_pass for all islands). */
export function solveAll(j: Journey, withQuizzes = true): ProgressState {
  const state = progress()
  for (const p of j.problems) {
    state.solves.push(makeSolve({ journeyId: j.id, slug: p.slug }))
  }
  if (withQuizzes && j.id === 1) {
    for (const island of j.islands) {
      state.events.push(makeEvent({ type: 'quiz_pass', refSlug: island.id }))
    }
  }
  return state
}

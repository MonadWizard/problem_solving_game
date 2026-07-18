import { create } from 'zustand'
import type {
  GameEvent,
  ItemsState,
  JourneyId,
  LocalState,
  Problem,
  ProgressState,
  QueueOp,
} from '../lib/types'
import { loadCurriculum, indexProblems, problemKey, type Curriculum } from '../data/curriculum'
import { defaultLocalState, loadLocal, saveLocal } from './localStore'
import { mergeProgress } from '../sync/merge'
import { pickWeighted } from '../lib/rng'
import { streakAtRisk } from '../lib/streak'
import { shipTier, type ShipTier } from '../lib/unlocks'

/** Sync engine registers here to flush the queue after each local write. */
let notifySync: (() => void) | null = null
export function setSyncNotifier(fn: (() => void) | null): void {
  notifySync = fn
}

/** Injectable randomness so store behavior is testable. */
let random: () => number = Math.random
export function setRandom(fn: () => number): void {
  random = fn
}

const newEvent = (type: GameEvent['type'], refSlug: string | null, happenedAt?: string): GameEvent => ({
  id: crypto.randomUUID(),
  type,
  refSlug,
  happenedAt: happenedAt ?? new Date().toISOString(),
})

export interface GameStore {
  ready: boolean
  curriculum: Curriculum | null
  problems: Map<string, Problem>
  local: LocalState
  /** Last chest drop id, for the toast. */
  lastChest: string | null
  lastBossDrop: string | null
  /** Ship tier just reached by the most recent solve, for the celebration toast. Never persisted or synced. */
  lastShipTierUp: ShipTier | null
  /** Oracle-revealed problem keys (device-local, not synced). */
  revealed: string[]

  init(): Promise<void>
  replaceLocal(next: LocalState): void
  markSolved(journeyId: JourneyId, slug: string): void
  passQuiz(islandId: string): void
  /** Re-solve a ghost ship (spaced-repetition boss). Grants the ghost_win XP bonus. */
  defeatGhost(slug: string): void
  startAttempt(journeyId: JourneyId, slug: string): void
  /** Freeze the clock on a running attempt. */
  pauseAttempt(journeyId: JourneyId, slug: string): void
  /** Continue a paused attempt from where it was frozen. */
  resumeAttempt(journeyId: JourneyId, slug: string): void
  /** Clear an attempt entirely (free — no item cost), back to the un-started state. */
  resetAttempt(journeyId: JourneyId, slug: string): void
  /** Spend a Rewind Fruit to restart a failed timed attempt. */
  rewindAttempt(journeyId: JourneyId, slug: string): boolean
  /** Spend an Oracle Fruit to reveal a problem's pattern. */
  revealPattern(journeyId: JourneyId, slug: string): boolean
  /** Activate the Haste Fruit: 2x XP for 24h. */
  eatHasteFruit(): boolean
  setMeta(meta: { displayName?: string; leetcodeUsername?: string }): void
  importProgress(p: ProgressState): void
  dismissChest(): void
}

export const useGameStore = create<GameStore>((set, get) => {
  function commit(local: LocalState, ops: QueueOp[], extra: Partial<GameStore> = {}) {
    const next = { ...local, queue: [...local.queue, ...ops] }
    saveLocal(next)
    set({ local: next, ...extra })
    if (ops.length) notifySync?.()
  }

  return {
    ready: false,
    curriculum: null,
    problems: new Map(),
    local: defaultLocalState(),
    lastChest: null,
    lastBossDrop: null,
    lastShipTierUp: null,
    revealed: [],

    async init() {
      const curriculum = await loadCurriculum()
      const local = loadLocal()
      set({ curriculum, problems: indexProblems(curriculum), local, ready: true })

      // Auto-use a Streak Freeze when yesterday broke the chain.
      if (streakAtRisk(local.events) && (local.items.streak_freeze ?? 0) > 0) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(12, 0, 0, 0)
        const ev = newEvent('freeze_used', null, yesterday.toISOString())
        const items: ItemsState = { ...local.items, streak_freeze: local.items.streak_freeze - 1 }
        commit(
          { ...local, events: [...local.events, ev], items },
          [{ kind: 'event', event: ev }, { kind: 'items', items }],
        )
      }
    },

    replaceLocal(next) {
      saveLocal(next)
      set({ local: next })
    },

    markSolved(journeyId, slug) {
      const { curriculum, problems, local } = get()
      const problem = problems.get(problemKey(journeyId, slug))
      if (!curriculum || !problem) return
      if (local.solves.some((s) => s.journeyId === journeyId && s.slug === slug)) return

      const j1 = curriculum.journeys[1]
      const prevTier = shipTier(j1, local)

      const now = new Date()
      const key = problemKey(journeyId, slug)
      const ops: QueueOp[] = []
      const events = [...local.events]
      let items = local.items
      const pushEvent = (e: GameEvent) => {
        events.push(e)
        ops.push({ kind: 'event', event: e })
      }

      // Timed attempt (journey 2): star when solved within the limit.
      let secondsTaken: number | null = null
      let starred = false
      const attempts = { ...local.attempts }
      const pausedAttempts = { ...local.pausedAttempts }
      const startedAt = attempts[key]
      if (startedAt) {
        const pausedAt = pausedAttempts[key]
        const endTime = pausedAt ? Date.parse(pausedAt) : now.getTime()
        secondsTaken = Math.max(1, Math.round((endTime - Date.parse(startedAt)) / 1000))
        starred = problem.time_limit_seconds !== undefined && secondsTaken <= problem.time_limit_seconds
        delete attempts[key]
        delete pausedAttempts[key]
      }

      const solve = { journeyId, slug, solvedAt: now.toISOString(), secondsTaken, starred }
      ops.push({ kind: 'solve', solve })
      pushEvent(newEvent('solve', slug))
      if (problem.is_boss) pushEvent(newEvent('boss_win', slug))
      if (local.hasteUntil && Date.parse(local.hasteUntil) > now.getTime()) {
        pushEvent(newEvent('haste_bonus', key))
      }

      // Treasure chest after every solve.
      const chest = pickWeighted(curriculum.items.chest_table, random()).drop
      pushEvent(newEvent('chest', chest))
      if (chest !== 'xp') items = { ...items, [chest]: (items[chest] ?? 0) + 1 }

      // Rare cursed-fruit drop from bosses.
      let bossDrop: string | null = null
      if (problem.is_boss) {
        bossDrop = pickWeighted(curriculum.items.boss_drops, random()).drop
        items = { ...items, [bossDrop]: (items[bossDrop] ?? 0) + 1 }
      }
      if (items !== local.items) ops.push({ kind: 'items', items })

      const nextLocal = { ...local, solves: [...local.solves, solve], events, items, attempts, pausedAttempts }
      const nextTier = shipTier(j1, nextLocal)

      commit(nextLocal, ops, {
        lastChest: chest,
        lastBossDrop: bossDrop,
        lastShipTierUp: nextTier !== prevTier ? nextTier : null,
      })
    },

    passQuiz(islandId) {
      const { local } = get()
      if (local.events.some((e) => e.type === 'quiz_pass' && e.refSlug === islandId)) return
      const ev = newEvent('quiz_pass', islandId)
      commit({ ...local, events: [...local.events, ev] }, [{ kind: 'event', event: ev }])
    },

    defeatGhost(slug) {
      const { local } = get()
      const ev = newEvent('ghost_win', slug)
      commit({ ...local, events: [...local.events, ev] }, [{ kind: 'event', event: ev }])
    },

    startAttempt(journeyId, slug) {
      const { local } = get()
      const key = problemKey(journeyId, slug)
      if (local.attempts[key]) return
      commit({ ...local, attempts: { ...local.attempts, [key]: new Date().toISOString() } }, [])
    },

    pauseAttempt(journeyId, slug) {
      const { local } = get()
      const key = problemKey(journeyId, slug)
      if (!local.attempts[key] || local.pausedAttempts[key]) return
      commit(
        { ...local, pausedAttempts: { ...local.pausedAttempts, [key]: new Date().toISOString() } },
        [],
      )
    },

    resumeAttempt(journeyId, slug) {
      const { local } = get()
      const key = problemKey(journeyId, slug)
      const pausedAt = local.pausedAttempts[key]
      const startedAt = local.attempts[key]
      if (!pausedAt || !startedAt) return
      // Shift the start time forward by however long it sat paused, so the
      // remaining time (not the wall-clock elapsed) continues from here.
      const pausedMs = Date.now() - Date.parse(pausedAt)
      const shiftedStart = new Date(Date.parse(startedAt) + pausedMs).toISOString()
      const pausedAttempts = { ...local.pausedAttempts }
      delete pausedAttempts[key]
      commit(
        { ...local, attempts: { ...local.attempts, [key]: shiftedStart }, pausedAttempts },
        [],
      )
    },

    resetAttempt(journeyId, slug) {
      const { local } = get()
      const key = problemKey(journeyId, slug)
      if (!local.attempts[key]) return
      const attempts = { ...local.attempts }
      const pausedAttempts = { ...local.pausedAttempts }
      delete attempts[key]
      delete pausedAttempts[key]
      commit({ ...local, attempts, pausedAttempts }, [])
    },

    rewindAttempt(journeyId, slug) {
      const { local } = get()
      if ((local.items.rewind_fruit ?? 0) < 1) return false
      const key = problemKey(journeyId, slug)
      const items = { ...local.items, rewind_fruit: local.items.rewind_fruit - 1 }
      const pausedAttempts = { ...local.pausedAttempts }
      delete pausedAttempts[key]
      commit(
        { ...local, items, attempts: { ...local.attempts, [key]: new Date().toISOString() }, pausedAttempts },
        [{ kind: 'items', items }],
      )
      return true
    },

    revealPattern(journeyId, slug) {
      const { local, revealed } = get()
      const key = problemKey(journeyId, slug)
      if (revealed.includes(key)) return true
      if ((local.items.oracle_fruit ?? 0) < 1) return false
      const items = { ...local.items, oracle_fruit: local.items.oracle_fruit - 1 }
      commit({ ...local, items }, [{ kind: 'items', items }], { revealed: [...revealed, key] })
      return true
    },

    eatHasteFruit() {
      const { local } = get()
      if ((local.items.haste_fruit ?? 0) < 1) return false
      const items = { ...local.items, haste_fruit: local.items.haste_fruit - 1 }
      const hasteUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      commit({ ...local, items, hasteUntil }, [{ kind: 'items', items }])
      return true
    },

    setMeta(meta) {
      const { local } = get()
      commit(
        {
          ...local,
          displayName: meta.displayName ?? local.displayName,
          leetcodeUsername: meta.leetcodeUsername ?? local.leetcodeUsername,
        },
        [{ kind: 'meta', meta }],
      )
    },

    importProgress(p) {
      const { local } = get()
      const merged = mergeProgress(local, p)
      // Push everything the import added; cloud upserts are idempotent.
      const ops: QueueOp[] = [
        ...merged.solves.map((solve) => ({ kind: 'solve' as const, solve })),
        ...merged.events.map((event) => ({ kind: 'event' as const, event })),
        { kind: 'items' as const, items: merged.items },
      ]
      commit({ ...local, ...merged }, ops)
    },

    dismissChest() {
      set({ lastChest: null, lastBossDrop: null, lastShipTierUp: null })
    },
  }
})

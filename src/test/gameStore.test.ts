import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setRandom, useGameStore } from '../store/gameStore'
import { defaultLocalState } from '../store/localStore'
import { mockDataFetch } from './mockFetch'

mockDataFetch()

async function freshStore() {
  localStorage.clear()
  useGameStore.setState({
    ready: false,
    local: defaultLocalState(),
    lastChest: null,
    lastBossDrop: null,
    revealed: [],
  })
  await useGameStore.getState().init()
  return useGameStore
}

beforeEach(async () => {
  setRandom(() => 0) // chest roll -> first table entry ('xp'); boss drop -> 'rewind_fruit'
  await freshStore()
})

const state = () => useGameStore.getState()

describe('gameStore.markSolved', () => {
  it('records the solve, a solve event, an xp chest, and queue ops (local-first)', () => {
    state().markSolved(1, 'two-sum')
    const { local, lastChest } = state()
    expect(local.solves).toHaveLength(1)
    expect(local.solves[0]).toMatchObject({ journeyId: 1, slug: 'two-sum', starred: false })
    expect(local.events.map((e) => e.type)).toEqual(['solve', 'chest'])
    expect(lastChest).toBe('xp')
    expect(local.queue.map((op) => op.kind)).toEqual(['solve', 'event', 'event'])
    // Written through to localStorage immediately.
    expect(JSON.parse(localStorage.getItem('tga:v1')!).solves).toHaveLength(1)
  })

  it('is idempotent per problem', () => {
    state().markSolved(1, 'two-sum')
    state().markSolved(1, 'two-sum')
    expect(state().local.solves).toHaveLength(1)
  })

  it('boss solves add boss_win and a cursed-fruit drop', () => {
    state().markSolved(1, 'longest-consecutive-sequence') // arrays-hashing boss
    const { local, lastBossDrop } = state()
    expect(local.events.map((e) => e.type)).toContain('boss_win')
    expect(lastBossDrop).toBe('rewind_fruit')
    expect(local.items.rewind_fruit).toBe(1)
  })

  it('non-xp chest drops grant the item', () => {
    setRandom(() => 0.999) // last chest entry: ship_part_figurehead
    state().markSolved(1, 'two-sum')
    expect(state().local.items.ship_part_figurehead).toBe(1)
    expect(state().lastChest).toBe('ship_part_figurehead')
  })

  it('emits haste_bonus while the Haste Fruit is active', () => {
    useGameStore.setState({
      local: { ...state().local, items: { haste_fruit: 1 } },
    })
    expect(state().eatHasteFruit()).toBe(true)
    state().markSolved(1, 'two-sum')
    const bonus = state().local.events.find((e) => e.type === 'haste_bonus')
    expect(bonus?.refSlug).toBe('1:two-sum')
  })
})

describe('timed attempts (journey 2)', () => {
  it('stars a solve finished within the limit and records seconds', () => {
    vi.useFakeTimers()
    const slug = state().curriculum!.journeys[2].problems[0].slug
    state().startAttempt(2, slug)
    vi.advanceTimersByTime(60_000)
    state().markSolved(2, slug)
    const solve = state().local.solves[0]
    expect(solve.starred).toBe(true)
    expect(solve.secondsTaken).toBe(60)
    vi.useRealTimers()
  })

  it('does not star an overtime solve', () => {
    vi.useFakeTimers()
    const problem = state().curriculum!.journeys[2].problems[0]
    state().startAttempt(2, problem.slug)
    vi.advanceTimersByTime((problem.time_limit_seconds! + 5) * 1000)
    state().markSolved(2, problem.slug)
    expect(state().local.solves[0].starred).toBe(false)
    vi.useRealTimers()
  })

  it('rewindAttempt consumes a Rewind Fruit and restarts the clock', () => {
    const slug = state().curriculum!.journeys[2].problems[0].slug
    expect(state().rewindAttempt(2, slug)).toBe(false) // none owned
    useGameStore.setState({ local: { ...state().local, items: { rewind_fruit: 1 } } })
    expect(state().rewindAttempt(2, slug)).toBe(true)
    expect(state().local.items.rewind_fruit).toBe(0)
    expect(state().local.attempts[`2:${slug}`]).toBeDefined()
  })
})

describe('quiz + items + meta', () => {
  it('passQuiz emits one synced quiz_pass event per island', () => {
    state().passQuiz('arrays-hashing')
    state().passQuiz('arrays-hashing')
    expect(state().local.events.filter((e) => e.type === 'quiz_pass')).toHaveLength(1)
  })

  it('revealPattern consumes an Oracle Fruit once per problem', () => {
    expect(state().revealPattern(2, 'x')).toBe(false)
    useGameStore.setState({ local: { ...state().local, items: { oracle_fruit: 1 } } })
    expect(state().revealPattern(2, 'x')).toBe(true)
    expect(state().revealPattern(2, 'x')).toBe(true) // already revealed, no second charge
    expect(state().local.items.oracle_fruit).toBe(0)
  })

  it('setMeta stores and enqueues profile fields', () => {
    state().setMeta({ displayName: 'Dread Pirate Rakib' })
    expect(state().local.displayName).toBe('Dread Pirate Rakib')
    expect(state().local.queue.at(-1)).toEqual({
      kind: 'meta',
      meta: { displayName: 'Dread Pirate Rakib' },
    })
  })

  it('importProgress merges (never overwrites) and re-enqueues for the cloud', () => {
    state().markSolved(1, 'two-sum')
    const queueBefore = state().local.queue.length
    state().importProgress({
      solves: [
        { journeyId: 1, slug: 'contains-duplicate', solvedAt: '2026-01-01T00:00:00.000Z', secondsTaken: null, starred: false },
      ],
      events: [],
      items: { streak_freeze: 3 },
    })
    const { local } = state()
    expect(local.solves.map((s) => s.slug).sort()).toEqual(['contains-duplicate', 'two-sum'])
    expect(local.items.streak_freeze).toBe(3)
    expect(local.queue.length).toBeGreaterThan(queueBefore)
  })
})

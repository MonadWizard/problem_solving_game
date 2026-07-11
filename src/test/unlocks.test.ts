import { describe, expect, it } from 'vitest'
import {
  currentIsland,
  islandComplete,
  islandProgress,
  islandUnlocked,
  journey2Unlocked,
  shipTier,
} from '../lib/unlocks'
import { makeEvent, makeJourney, makeSolve, progress, solveAll } from './fixtures'

const j1 = makeJourney(1, [
  ['first', 2],
  ['second', 2],
  ['third', 2],
])
const j2 = makeJourney(2, [
  ['isle1', 2],
  ['isle2', 2],
])

describe('journey 1 unlock chain (completion + quiz_pass gate)', () => {
  it('unlocks only the first island initially', () => {
    const state = progress()
    expect(islandUnlocked(j1, 'first', state)).toBe(true)
    expect(islandUnlocked(j1, 'second', state)).toBe(false)
  })

  it('keeps the next island locked until the quiz is passed', () => {
    const state = progress({
      solves: [makeSolve({ slug: 'first-p1' }), makeSolve({ slug: 'first-p2' })],
    })
    expect(islandComplete(j1, 'first', state)).toBe(true)
    expect(islandUnlocked(j1, 'second', state)).toBe(false)

    state.events.push(makeEvent({ type: 'quiz_pass', refSlug: 'first' }))
    expect(islandUnlocked(j1, 'second', state)).toBe(true)
    expect(islandUnlocked(j1, 'third', state)).toBe(false)
  })

  it('tracks island progress and the current island', () => {
    const state = progress({ solves: [makeSolve({ slug: 'first-p1' })] })
    expect(islandProgress(j1, 'first', state)).toEqual({ solved: 1, total: 2 })
    expect(currentIsland(j1, state)?.id).toBe('first')
  })
})

describe('journey 2 gating', () => {
  it('unlocks only after journey 1 is 100% complete', () => {
    expect(journey2Unlocked(j1, progress())).toBe(false)
    expect(journey2Unlocked(j1, solveAll(j1))).toBe(true)
  })

  it('isles unlock sequentially by completion, no quiz needed', () => {
    const state = progress({
      solves: [
        makeSolve({ journeyId: 2, slug: 'isle1-p1' }),
        makeSolve({ journeyId: 2, slug: 'isle1-p2' }),
      ],
    })
    expect(islandUnlocked(j2, 'isle2', state)).toBe(true)
  })
})

describe('ship progression', () => {
  const big = makeJourney(1, Array.from({ length: 16 }, (_, i) => [`is${i + 1}`, 1] as [string, number]))
  const solveIslands = (n: number) =>
    progress({
      solves: Array.from({ length: n }, (_, i) => makeSolve({ slug: `is${i + 1}-p1` })),
    })

  it('upgrades dinghy → sloop → brig → galleon at 4/9/14 islands', () => {
    expect(shipTier(big, solveIslands(0))).toBe('dinghy')
    expect(shipTier(big, solveIslands(3))).toBe('dinghy')
    expect(shipTier(big, solveIslands(4))).toBe('sloop')
    expect(shipTier(big, solveIslands(9))).toBe('brig')
    expect(shipTier(big, solveIslands(14))).toBe('galleon')
    expect(shipTier(big, solveIslands(16))).toBe('galleon')
  })
})

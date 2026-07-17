import { describe, expect, it } from 'vitest'
import { formatBounty, levelForXp, totalXp, xpForLevel, xpToNextLevel } from '../lib/xp'
import { indexProblems, problemKey } from '../data/curriculum'
import { makeEvent, makeJourney, makeSolve, progress } from './fixtures'

describe('level math (level N needs cumulative N*N*100 XP)', () => {
  it('computes level boundaries', () => {
    expect(levelForXp(0)).toBe(0)
    expect(levelForXp(99)).toBe(0)
    expect(levelForXp(100)).toBe(1)
    expect(levelForXp(399)).toBe(1)
    expect(levelForXp(400)).toBe(2)
    expect(levelForXp(900)).toBe(3)
    expect(levelForXp(12400)).toBe(11)
  })

  it('is consistent with xpForLevel', () => {
    for (const n of [1, 2, 5, 30]) {
      expect(levelForXp(xpForLevel(n))).toBe(n)
      expect(levelForXp(xpForLevel(n) - 1)).toBe(n - 1)
    }
  })

  it('reports progress to next level', () => {
    expect(xpToNextLevel(450)).toEqual({ level: 2, current: 50, needed: 500 })
  })

  it('formats bounty', () => {
    expect(formatBounty(12400)).toBe('₿ 12,400')
    expect(formatBounty(0)).toBe('₿ 0')
  })
})

describe('totalXp derivation', () => {
  const j1 = makeJourney(1, [['a', 3]]) // a-p1 250, a-p2 250, a-p3 boss 1000
  const problems = indexProblems({
    journeys: { 1: j1, 2: makeJourney(2, [['z', 1]]), 3: makeJourney(3, [['z', 1]]) },
  })

  it('sums solved problem XP including boss double', () => {
    const state = progress({
      solves: [makeSolve({ slug: 'a-p1' }), makeSolve({ slug: 'a-p3' })],
    })
    expect(totalXp(state, problems)).toBe(250 + 1000)
  })

  it('adds event bonuses: ghost +150, xp chest +50, haste_bonus doubles the solve', () => {
    const state = progress({
      solves: [makeSolve({ slug: 'a-p1' })],
      events: [
        makeEvent({ type: 'ghost_win', refSlug: 'a-p3' }),
        makeEvent({ type: 'chest', refSlug: 'xp' }),
        makeEvent({ type: 'chest', refSlug: 'ship_part_sail' }), // non-xp chest: no bonus
        makeEvent({ type: 'haste_bonus', refSlug: problemKey(1, 'a-p1') }),
      ],
    })
    expect(totalXp(state, problems)).toBe(250 + 150 + 50 + 250)
  })

  it('ignores unknown slugs instead of crashing', () => {
    const state = progress({ solves: [makeSolve({ slug: 'ghost-of-a-problem' })] })
    expect(totalXp(state, problems)).toBe(0)
  })
})

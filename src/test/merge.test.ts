import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { mergeItems, mergeProgress, mergeSolves } from '../sync/merge'
import { totalXp } from '../lib/xp'
import { indexProblems } from '../data/curriculum'
import type { GameEvent, ItemsState, ProgressState, Solve } from '../lib/types'
import { makeJourney } from './fixtures'

// ---------- arbitraries ----------

const SLUGS = ['a-p1', 'a-p2', 'a-p3', 'b-p1', 'b-p2'] as const

const arbSolve: fc.Arbitrary<Solve> = fc.record({
  journeyId: fc.constantFrom(1 as const, 2 as const),
  slug: fc.constantFrom(...SLUGS),
  solvedAt: fc
    .date({ min: new Date('2026-01-01'), max: new Date('2026-12-31'), noInvalidDate: true })
    .map((d) => d.toISOString()),
  secondsTaken: fc.option(fc.integer({ min: 1, max: 5000 }), { nil: null }),
  starred: fc.boolean(),
})

const arbEvent: fc.Arbitrary<GameEvent> = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom(
    'solve' as const,
    'boss_win' as const,
    'ghost_win' as const,
    'quiz_pass' as const,
    'chest' as const,
  ),
  refSlug: fc.option(fc.constantFrom(...SLUGS, 'xp'), { nil: null }),
  happenedAt: fc
    .date({ min: new Date('2026-01-01'), max: new Date('2026-12-31'), noInvalidDate: true })
    .map((d) => d.toISOString()),
})

const arbItems: fc.Arbitrary<ItemsState> = fc.dictionary(
  fc.constantFrom('streak_freeze', 'haste_fruit', 'oracle_fruit', 'ship_part_sail'),
  fc.integer({ min: 0, max: 9 }),
)

const arbProgress: fc.Arbitrary<ProgressState> = fc.record({
  solves: fc.array(arbSolve, { maxLength: 12 }),
  events: fc.array(arbEvent, { maxLength: 12 }),
  items: arbItems,
})

// Canonical form: merge with itself normalizes ordering/duplicate keys,
// letting us compare states structurally.
const canon = (p: ProgressState) => mergeProgress(p, p)

const problems = indexProblems({
  journeys: { 1: makeJourney(1, [['a', 3], ['b', 2]]), 2: makeJourney(2, [['a', 3], ['b', 2]]) },
})

const solvedKeys = (p: ProgressState) => new Set(p.solves.map((s) => `${s.journeyId}:${s.slug}`))

// ---------- properties ----------

describe('merge properties (the sync bible — never weaken)', () => {
  it('is idempotent: merge(a, a) ≡ a (canonical)', () => {
    fc.assert(
      fc.property(arbProgress, (a) => {
        expect(canon(mergeProgress(a, a))).toEqual(canon(a))
      }),
    )
  })

  it('re-merging changes nothing: merge(merge(a,b), b) ≡ merge(a,b)', () => {
    fc.assert(
      fc.property(arbProgress, arbProgress, (a, b) => {
        const once = mergeProgress(a, b)
        expect(mergeProgress(once, b)).toEqual(once)
      }),
    )
  })

  it('is commutative: merge(a, b) ≡ merge(b, a)', () => {
    fc.assert(
      fc.property(arbProgress, arbProgress, (a, b) => {
        expect(mergeProgress(a, b)).toEqual(mergeProgress(b, a))
      }),
    )
  })

  it('never loses a solved problem (result ⊇ a ∪ b)', () => {
    fc.assert(
      fc.property(arbProgress, arbProgress, (a, b) => {
        const merged = solvedKeys(mergeProgress(a, b))
        for (const key of [...solvedKeys(a), ...solvedKeys(b)]) {
          expect(merged.has(key)).toBe(true)
        }
      }),
    )
  })

  it('never double-counts XP: max(xp(a), xp(b)) ≤ xp(merged) ≤ xp(a) + xp(b)', () => {
    fc.assert(
      fc.property(arbProgress, arbProgress, (a, b) => {
        const ca = canon(a)
        const cb = canon(b)
        const xpA = totalXp(ca, problems)
        const xpB = totalXp(cb, problems)
        const xpMerged = totalXp(mergeProgress(ca, cb), problems)
        expect(xpMerged).toBeGreaterThanOrEqual(Math.max(xpA, xpB))
        expect(xpMerged).toBeLessThanOrEqual(xpA + xpB)
      }),
    )
  })

  it('merging a device with itself twice never inflates XP', () => {
    fc.assert(
      fc.property(arbProgress, (a) => {
        const xp = totalXp(canon(a), problems)
        expect(totalXp(mergeProgress(canon(a), canon(a)), problems)).toBe(xp)
      }),
    )
  })
})

describe('merge field rules', () => {
  const base: Solve = {
    journeyId: 1,
    slug: 'a-p1',
    solvedAt: '2026-03-05T10:00:00.000Z',
    secondsTaken: 300,
    starred: false,
  }

  it('earliest solvedAt wins, stars OR, secondsTaken min non-null', () => {
    const other: Solve = {
      ...base,
      solvedAt: '2026-03-01T10:00:00.000Z',
      secondsTaken: null,
      starred: true,
    }
    expect(mergeSolves([base], [other])).toEqual([
      { ...base, solvedAt: other.solvedAt, secondsTaken: 300, starred: true },
    ])
  })

  it('items merge with per-key max (cautious cap)', () => {
    expect(mergeItems({ streak_freeze: 2, haste_fruit: 1 }, { streak_freeze: 1, oracle_fruit: 3 }))
      .toEqual({ streak_freeze: 2, haste_fruit: 1, oracle_fruit: 3 })
  })
})

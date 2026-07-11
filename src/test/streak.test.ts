import { describe, expect, it } from 'vitest'
import { computeStreak, streakAtRisk } from '../lib/streak'
import { makeEvent } from './fixtures'

const NOW = new Date('2026-07-12T20:00:00') // local time

const solveOn = (day: string) => makeEvent({ type: 'solve', happenedAt: `${day}T12:00:00` })
const freezeOn = (day: string) => makeEvent({ type: 'freeze_used', happenedAt: `${day}T12:00:00` })

describe('computeStreak (derived from the solve log)', () => {
  it('is 0 with no events', () => {
    expect(computeStreak([], NOW)).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    const events = [solveOn('2026-07-10'), solveOn('2026-07-11'), solveOn('2026-07-12')]
    expect(computeStreak(events, NOW)).toBe(3)
  })

  it('does not break when today has no solve yet', () => {
    const events = [solveOn('2026-07-10'), solveOn('2026-07-11')]
    expect(computeStreak(events, NOW)).toBe(2)
  })

  it('breaks on a gap without a freeze', () => {
    const events = [solveOn('2026-07-09'), solveOn('2026-07-12')]
    expect(computeStreak(events, NOW)).toBe(1)
  })

  it('bridges exactly one missed day per freeze_used event', () => {
    const events = [solveOn('2026-07-09'), solveOn('2026-07-10'), freezeOn('2026-07-11'), solveOn('2026-07-12')]
    expect(computeStreak(events, NOW)).toBe(3)
  })

  it('counts boss and ghost wins as active days', () => {
    const events = [
      makeEvent({ type: 'boss_win', happenedAt: '2026-07-11T09:00:00' }),
      makeEvent({ type: 'ghost_win', happenedAt: '2026-07-12T09:00:00' }),
    ]
    expect(computeStreak(events, NOW)).toBe(2)
  })

  it('multiple solves in one day count once', () => {
    const events = [solveOn('2026-07-12'), solveOn('2026-07-12')]
    expect(computeStreak(events, NOW)).toBe(1)
  })
})

describe('streakAtRisk', () => {
  it('flags yesterday-empty with an older chain', () => {
    expect(streakAtRisk([solveOn('2026-07-10')], NOW)).toBe(true)
  })
  it('is false when the streak is alive or fully dead', () => {
    expect(streakAtRisk([solveOn('2026-07-11')], NOW)).toBe(false)
    expect(streakAtRisk([solveOn('2026-07-01')], NOW)).toBe(false)
    expect(streakAtRisk([], NOW)).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { onLogin, reconcileOnOpen } from '../sync/engine'
import { totalXp } from '../lib/xp'
import { indexProblems } from '../data/curriculum'
import { FakeCloud } from './fakeCloud'
import { localState, makeEvent, makeJourney, makeSolve } from './fixtures'
import type { ProgressState } from '../lib/types'

const problems = indexProblems({
  journeys: { 1: makeJourney(1, [['a', 3], ['b', 3]]), 2: makeJourney(2, [['c', 2]]) },
})

const rendered = (s: ProgressState): ProgressState => ({
  solves: [...s.solves].sort((x, y) => `${x.journeyId}:${x.slug}`.localeCompare(`${y.journeyId}:${y.slug}`)),
  events: [...s.events].sort((x, y) => x.id.localeCompare(y.id)),
  items: s.items,
})

describe('cross-device resume (the hard requirement)', () => {
  it('device A solves 3 offline → logs in → device B logs in → identical state', async () => {
    const cloud = new FakeCloud()

    // Device A plays as a guest (offline/local only).
    const deviceA = localState({
      solves: [
        makeSolve({ slug: 'a-p1', solvedAt: '2026-07-01T08:00:00.000Z' }),
        makeSolve({ slug: 'a-p2', solvedAt: '2026-07-02T08:00:00.000Z' }),
        makeSolve({ slug: 'a-p3', solvedAt: '2026-07-03T08:00:00.000Z' }), // boss
      ],
      events: [
        makeEvent({ type: 'solve', refSlug: 'a-p1', happenedAt: '2026-07-01T08:00:00.000Z' }),
        makeEvent({ type: 'boss_win', refSlug: 'a-p3', happenedAt: '2026-07-03T08:00:00.000Z' }),
        makeEvent({ type: 'quiz_pass', refSlug: 'a', happenedAt: '2026-07-03T09:00:00.000Z' }),
      ],
      items: { streak_freeze: 1, oracle_fruit: 1 },
      displayName: 'Captain A',
    })

    const mergedA = await onLogin(deviceA, cloud)

    // Device B: fresh install, logs into the same account.
    const mergedB = await onLogin(localState(), cloud)

    expect(rendered(mergedB)).toEqual(rendered(mergedA))
    expect(mergedB.displayName).toBe('Captain A')
    expect(totalXp(mergedB, problems)).toBe(totalXp(mergedA, problems))
    // Everything device A did is visible on device B: solves, unlocks, items.
    expect(mergedB.solves.map((s) => s.slug).sort()).toEqual(['a-p1', 'a-p2', 'a-p3'])
    expect(mergedB.events.some((e) => e.type === 'quiz_pass' && e.refSlug === 'a')).toBe(true)
    expect(mergedB.items).toEqual({ streak_freeze: 1, oracle_fruit: 1 })
  })

  it('login merge unions device and cloud progress (earliest wins, stars OR)', async () => {
    const cloud = new FakeCloud()
    await onLogin(
      localState({
        solves: [makeSolve({ slug: 'a-p1', solvedAt: '2026-07-05T00:00:00.000Z', starred: true })],
      }),
      cloud,
    )

    const local = localState({
      solves: [
        makeSolve({ slug: 'a-p1', solvedAt: '2026-07-01T00:00:00.000Z' }), // earlier, unstarred
        makeSolve({ slug: 'b-p1' }),
      ],
    })
    const merged = await onLogin(local, cloud)

    const ap1 = merged.solves.find((s) => s.slug === 'a-p1')!
    expect(ap1.solvedAt).toBe('2026-07-01T00:00:00.000Z')
    expect(ap1.starred).toBe(true)
    expect(merged.solves).toHaveLength(2)
    // Local-only row was pushed up.
    expect(cloud.solves.map((s) => s.slug).sort()).toEqual(['a-p1', 'b-p1'])
  })

  it('re-login is idempotent (same state, no XP inflation)', async () => {
    const cloud = new FakeCloud()
    const once = await onLogin(
      localState({ solves: [makeSolve({ slug: 'a-p1' })], items: { streak_freeze: 2 } }),
      cloud,
    )
    const twice = await onLogin(once, cloud)
    expect(rendered(twice)).toEqual(rendered(once))
    expect(totalXp(twice, problems)).toBe(totalXp(once, problems))
  })

  it('reconcileOnOpen flushes the offline queue, then pulls cloud-only rows', async () => {
    const cloud = new FakeCloud()
    // Another device already synced these:
    await onLogin(localState({ solves: [makeSolve({ slug: 'b-p2' })] }), cloud)

    // This device queued a solve while offline.
    const solve = makeSolve({ slug: 'a-p2' })
    const local = localState({ solves: [solve], queue: [{ kind: 'solve', solve }] })

    const next = await reconcileOnOpen(local, cloud)
    expect(next.queue).toEqual([])
    expect(next.solves.map((s) => s.slug).sort()).toEqual(['a-p2', 'b-p2'])
    expect(cloud.solves.map((s) => s.slug).sort()).toEqual(['a-p2', 'b-p2'])
  })

  it('queued offline writes end in the same cloud state as online writes', async () => {
    const online = new FakeCloud()
    const solve = makeSolve({ slug: 'a-p1' })
    const event = makeEvent({ type: 'solve', refSlug: 'a-p1' })
    await online.upsertSolves([solve])
    await online.insertEvents([event])

    const offlineFirst = new FakeCloud()
    offlineFirst.offline = true
    let state = localState({
      solves: [solve],
      events: [event],
      queue: [
        { kind: 'solve', solve },
        { kind: 'event', event },
      ],
    })
    state = await (await import('../sync/queue')).flushQueue(state, offlineFirst)
    expect(state.queue).toHaveLength(2)
    offlineFirst.offline = false
    state = await (await import('../sync/queue')).flushQueue(state, offlineFirst)

    expect(offlineFirst.state()).toEqual(online.state())
  })
})

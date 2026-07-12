import { describe, expect, it } from 'vitest'
import { flushQueue } from '../sync/queue'
import { FakeCloud } from './fakeCloud'
import { localState, makeEvent, makeSolve } from './fixtures'
import type { QueueOp } from '../lib/types'

const ops = (): QueueOp[] => [
  { kind: 'solve', solve: makeSolve({ slug: 'two-sum' }) },
  { kind: 'event', event: makeEvent({ type: 'solve', refSlug: 'two-sum' }) },
  { kind: 'solve', solve: makeSolve({ slug: '3sum', starred: true }) },
  { kind: 'items', items: { streak_freeze: 2 } },
  { kind: 'meta', meta: { displayName: 'Rakib' } },
]

describe('offline retry queue', () => {
  it('flushes everything when online and empties the queue', async () => {
    const cloud = new FakeCloud()
    const next = await flushQueue(localState({ queue: ops() }), cloud)
    expect(next.queue).toEqual([])
    expect(cloud.solves.map((s) => s.slug).sort()).toEqual(['3sum', 'two-sum'])
    expect(cloud.items).toEqual({ streak_freeze: 2 })
    expect(cloud.meta?.displayName).toBe('Rakib')
  })

  it('keeps unflushed ops (in order) when the network dies', async () => {
    const cloud = new FakeCloud()
    cloud.offline = true
    const state = localState({ queue: ops() })
    const next = await flushQueue(state, cloud)
    expect(next.queue).toEqual(state.queue)
    expect(cloud.solves).toEqual([])
  })

  it('offline-then-flush produces the identical cloud state to always-online', async () => {
    // Same op list replayed on both paths — this proves that delaying
    // delivery (not regenerating it) never changes the end state.
    const opsList = ops()

    // Path A: always online.
    const alwaysOnline = new FakeCloud()
    await flushQueue(localState({ queue: opsList }), alwaysOnline)

    // Path B: goes offline first (nothing is delivered), then recovers.
    const flaky = new FakeCloud()
    flaky.offline = true
    let state = await flushQueue(localState({ queue: opsList }), flaky)
    expect(state.queue).toEqual(opsList) // confirmed nothing got through
    flaky.offline = false
    state = await flushQueue(state, flaky)
    expect(state.queue).toEqual([])

    expect(flaky.state()).toEqual(alwaysOnline.state())
  })

  it('redelivering the same ops twice never duplicates rows or inflates items', async () => {
    const cloud = new FakeCloud()
    const state = localState({ queue: ops() })
    await flushQueue(state, cloud)
    await flushQueue(state, cloud)
    expect(cloud.solves).toHaveLength(2)
    expect(cloud.events).toHaveLength(1)
    expect(cloud.items).toEqual({ streak_freeze: 2 })
  })
})

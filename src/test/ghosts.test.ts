import { describe, expect, it } from 'vitest'
import { dueGhosts } from '../lib/ghosts'
import { makeEvent } from './fixtures'

const bossWin = (slug: string, iso: string) =>
  makeEvent({ type: 'boss_win', refSlug: slug, happenedAt: iso })
const ghostWin = (slug: string, iso: string) =>
  makeEvent({ type: 'ghost_win', refSlug: slug, happenedAt: iso })

const at = (iso: string) => new Date(iso)

describe('dueGhosts (7/21/60-day spaced repetition)', () => {
  it('is empty before the first wave', () => {
    const events = [bossWin('kraken', '2026-07-01T00:00:00.000Z')]
    expect(dueGhosts(events, at('2026-07-07T23:00:00.000Z'))).toEqual([])
  })

  it('surfaces wave 1 after 7 days', () => {
    const events = [bossWin('kraken', '2026-07-01T00:00:00.000Z')]
    const due = dueGhosts(events, at('2026-07-08T01:00:00.000Z'))
    expect(due).toHaveLength(1)
    expect(due[0]).toMatchObject({ slug: 'kraken', wave: 1 })
  })

  it('a ghost_win clears the wave; wave 2 returns at day 21', () => {
    const events = [
      bossWin('kraken', '2026-07-01T00:00:00.000Z'),
      ghostWin('kraken', '2026-07-09T00:00:00.000Z'),
    ]
    expect(dueGhosts(events, at('2026-07-10T00:00:00.000Z'))).toEqual([])
    const due = dueGhosts(events, at('2026-07-23T00:00:00.000Z'))
    expect(due).toHaveLength(1)
    expect(due[0]).toMatchObject({ slug: 'kraken', wave: 2 })
  })

  it('reports the earliest pending wave when several lapsed', () => {
    const events = [bossWin('kraken', '2026-01-01T00:00:00.000Z')]
    const due = dueGhosts(events, at('2026-07-01T00:00:00.000Z'))
    expect(due[0]).toMatchObject({ slug: 'kraken', wave: 1 })
  })

  it('tracks multiple bosses independently', () => {
    const events = [
      bossWin('kraken', '2026-06-20T00:00:00.000Z'),
      bossWin('serpent', '2026-07-10T00:00:00.000Z'),
    ]
    const due = dueGhosts(events, at('2026-07-01T00:00:00.000Z'))
    expect(due.map((d) => d.slug)).toEqual(['kraken'])
  })
})

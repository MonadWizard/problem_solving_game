import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultLocalState, loadLocal, saveLocal, STORAGE_KEY } from '../store/localStore'
import { localState, makeSolve } from './fixtures'

beforeEach(() => localStorage.clear())

describe('localStore (versioned localStorage persistence)', () => {
  it('returns a fresh default state when empty', () => {
    expect(loadLocal()).toEqual(defaultLocalState())
  })

  it('round-trips state', () => {
    const state = localState({ solves: [makeSolve({ slug: 'two-sum' })], items: { streak_freeze: 2 } })
    saveLocal(state)
    expect(loadLocal()).toEqual(state)
  })

  it('recovers from corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadLocal()).toEqual(defaultLocalState())
  })

  it('discards unknown schema versions', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, solves: [1] }))
    expect(loadLocal()).toEqual(defaultLocalState())
  })

  it('fills fields missing from older snapshots', () => {
    const partial = { version: 1, solves: [makeSolve({ slug: 'two-sum' })] }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(partial))
    const loaded = loadLocal()
    expect(loaded.solves).toEqual(partial.solves)
    expect(loaded.queue).toEqual([])
    expect(loaded.attempts).toEqual({})
  })

  it('falls back to memory when localStorage throws', () => {
    const state = localState({ displayName: 'Rakib' })
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    saveLocal(state)
    const spy2 = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('unavailable')
    })
    expect(loadLocal()).toEqual(state)
    spy.mockRestore()
    spy2.mockRestore()
  })
})

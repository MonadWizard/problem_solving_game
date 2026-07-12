import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('verify (off by default)', () => {
  it('confirmSolve proceeds without network calls when no worker URL is configured', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const { verificationAvailable, confirmSolve } = await import('../lib/verify')
    expect(verificationAvailable).toBe(false)
    await expect(confirmSolve('someone', 'two-sum')).resolves.toBe(true)
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})

describe('verify (worker configured)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_VERIFY_WORKER_URL', 'https://verify.example.test')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('reports solved when the worker finds a match', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ checked: true, solved: true }), { status: 200 })),
    )
    const { verifyRecentlySolved } = await import('../lib/verify')
    await expect(verifyRecentlySolved('rakib', 'two-sum')).resolves.toEqual({ checked: true, solved: true })
  })

  it('falls back to honor-system on a network error (checked: false)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      }),
    )
    const { verifyRecentlySolved } = await import('../lib/verify')
    await expect(verifyRecentlySolved('rakib', 'two-sum')).resolves.toEqual({ checked: false, solved: false })
  })

  it('confirmSolve proceeds silently when a match is found', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ checked: true, solved: true }), { status: 200 })),
    )
    const confirmSpy = vi.spyOn(window, 'confirm')
    const { confirmSolve } = await import('../lib/verify')
    await expect(confirmSolve('rakib', 'two-sum')).resolves.toBe(true)
    expect(confirmSpy).not.toHaveBeenCalled()
  })

  it('confirmSolve asks the user when checked and no match is found, honoring their answer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ checked: true, solved: false }), { status: 200 })),
    )
    const { confirmSolve } = await import('../lib/verify')

    vi.spyOn(window, 'confirm').mockReturnValue(false)
    await expect(confirmSolve('rakib', 'two-sum')).resolves.toBe(false)

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await expect(confirmSolve('rakib', 'two-sum')).resolves.toBe(true)
  })

  it('confirmSolve skips the check entirely when no LeetCode username is set', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const { confirmSolve } = await import('../lib/verify')
    await expect(confirmSolve(null, 'two-sum')).resolves.toBe(true)
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

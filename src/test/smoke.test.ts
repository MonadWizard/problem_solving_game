import { describe, expect, it } from 'vitest'

describe('toolchain smoke', () => {
  it('runs under jsdom with localStorage available', () => {
    localStorage.setItem('smoke', 'ok')
    expect(localStorage.getItem('smoke')).toBe('ok')
    localStorage.removeItem('smoke')
  })
})

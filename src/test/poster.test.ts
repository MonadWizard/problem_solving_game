import { describe, expect, it } from 'vitest'
import { generateAvatarSvg } from '../lib/poster'

describe('generateAvatarSvg', () => {
  it('is deterministic for the same seed', () => {
    expect(generateAvatarSvg('Captain Rakib')).toBe(generateAvatarSvg('Captain Rakib'))
  })

  it('varies across seeds', () => {
    expect(generateAvatarSvg('Captain Rakib')).not.toBe(generateAvatarSvg('Bosun Segfault'))
  })

  it('produces valid, sized SVG markup', () => {
    const svg = generateAvatarSvg('guest', 100)
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 100 100"/)
    expect(svg).toContain('</svg>')
  })

  it('never crashes on an empty seed', () => {
    expect(() => generateAvatarSvg('')).not.toThrow()
  })
})

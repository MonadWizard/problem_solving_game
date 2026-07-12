import { describe, expect, it } from 'vitest'
import { pathHeight, snakeLayout, toPixels } from '../lib/layout'

describe('snakeLayout', () => {
  it('runs left-to-right on even rows, right-to-left on odd rows', () => {
    expect(snakeLayout(8, 4)).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 3, row: 0 },
      { col: 3, row: 1 },
      { col: 2, row: 1 },
      { col: 1, row: 1 },
      { col: 0, row: 1 },
    ])
  })

  it('handles counts that do not fill the last row', () => {
    const points = snakeLayout(6, 4)
    expect(points).toHaveLength(6)
    expect(points[4]).toEqual({ col: 3, row: 1 })
    expect(points[5]).toEqual({ col: 2, row: 1 })
  })
})

describe('toPixels / pathHeight', () => {
  it('spaces columns evenly within the margins', () => {
    const pts = toPixels(snakeLayout(4, 4), 4, 800, 150, 100, 70)
    expect(pts[0]).toEqual({ x: 100, y: 70 })
    expect(pts[3]).toEqual({ x: 700, y: 70 })
  })

  it('computes total height from row count', () => {
    expect(pathHeight(16, 4, 150, 70)).toBe(70 * 2 + 3 * 150)
    expect(pathHeight(1, 4, 150, 70)).toBe(140)
  })
})

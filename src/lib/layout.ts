export interface GridPoint {
  col: number
  row: number
}

/**
 * Snake layout: islands run left-to-right, then wrap to the next row
 * reversed, like a board-game trail. Used to place island nodes on the
 * SVG sea chart regardless of journey length (16 islands or 8 isles).
 */
export function snakeLayout(count: number, colsPerRow: number): GridPoint[] {
  const points: GridPoint[] = []
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / colsPerRow)
    const rawCol = i % colsPerRow
    const col = row % 2 === 1 ? colsPerRow - 1 - rawCol : rawCol
    points.push({ col, row })
  }
  return points
}

export interface PixelPoint {
  x: number
  y: number
}

/** Converts a snake grid into SVG pixel coordinates within a viewBox. */
export function toPixels(
  points: GridPoint[],
  colsPerRow: number,
  viewBoxWidth: number,
  rowHeight: number,
  marginX = 80,
  marginY = 70,
): PixelPoint[] {
  const usableWidth = viewBoxWidth - marginX * 2
  const step = colsPerRow > 1 ? usableWidth / (colsPerRow - 1) : 0
  return points.map((p) => ({
    x: marginX + p.col * step,
    y: marginY + p.row * rowHeight,
  }))
}

export function pathHeight(count: number, colsPerRow: number, rowHeight: number, marginY = 70): number {
  const rows = Math.ceil(count / colsPerRow)
  return marginY * 2 + (rows - 1) * rowHeight
}

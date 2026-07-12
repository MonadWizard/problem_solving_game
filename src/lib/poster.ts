import { hashSeed, mulberry32 } from './rng'

const PALETTE = ['#2a7fa3', '#d9a52e', '#7c3aed', '#dc2626', '#059669', '#0891b2']

/** Deterministic 5-column symmetric identicon, colored by a hash of the seed. */
export function generateAvatarSvg(seed: string, size = 120): string {
  const rand = mulberry32(hashSeed(seed || 'anonymous pirate'))
  const bg = PALETTE[Math.floor(rand() * PALETTE.length)]
  const cols = 5
  const cell = size / cols
  let cells = ''
  for (let row = 0; row < cols; row++) {
    for (let col = 0; col < Math.ceil(cols / 2); col++) {
      if (rand() <= 0.55) continue
      const mirrorCol = cols - 1 - col
      cells += `<rect x="${col * cell}" y="${row * cell}" width="${cell}" height="${cell}" fill="#f0e2c4" />`
      if (mirrorCol !== col) {
        cells += `<rect x="${mirrorCol * cell}" y="${row * cell}" width="${cell}" height="${cell}" fill="#f0e2c4" />`
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${bg}" />${cells}</svg>`
}

export interface PosterData {
  displayName: string
  bounty: string
  title: string
  shipTier: string
  level: number
}

/** Draws the bounty poster onto a canvas. Async: the avatar is rasterized from SVG. */
export async function renderPoster(canvas: HTMLCanvasElement, data: PosterData): Promise<void> {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width
  const H = canvas.height

  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#f0e2c4'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#3f2a1d'
  ctx.lineWidth = 8
  ctx.strokeRect(4, 4, W - 8, H - 8)

  ctx.fillStyle = '#3f2a1d'
  ctx.textAlign = 'center'
  ctx.font = 'bold 30px Georgia, serif'
  ctx.fillText('WANTED', W / 2, 46)

  const avatarSize = 140
  const svg = generateAvatarSvg(data.displayName, avatarSize)
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    const img = await loadImage(url)
    ctx.drawImage(img, W / 2 - avatarSize / 2, 66, avatarSize, avatarSize)
  } finally {
    URL.revokeObjectURL(url)
  }

  ctx.font = 'bold 24px Georgia, serif'
  ctx.fillText(data.displayName || 'Anonymous Pirate', W / 2, 246)

  ctx.font = 'italic 18px Georgia, serif'
  ctx.fillText(data.title, W / 2, 274)

  ctx.font = 'bold 34px Georgia, serif'
  ctx.fillStyle = '#a3781d'
  ctx.fillText(data.bounty, W / 2, 322)

  ctx.font = '16px Georgia, serif'
  ctx.fillStyle = '#3f2a1d'
  ctx.fillText(`Level ${data.level} · ${data.shipTier}`, W / 2, 352)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('failed to load avatar image'))
    img.src = src
  })
}

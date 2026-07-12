/**
 * Singleton SVG filter/gradient defs for procedural textures — mounted once in Layout.
 * Consumers reference via e.g. `filter="url(#parchment-grain)"` or `fill="url(#water-shimmer)"`,
 * supplying the actual color themselves (CSS custom properties) so dark mode reflows for free.
 */
export default function TextureDefs() {
  return (
    <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden focusable="false">
      <defs>
        {/* Alpha-only grain — apply to a rect/fill using a theme color; the noise modulates its opacity. */}
        <filter id="parchment-grain" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={3} stitchTiles="stitch" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
        </filter>
        <filter id="wood-grain" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.015 0.2" numOctaves={3} seed={7} result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.45 0" />
        </filter>
        <linearGradient id="water-shimmer" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-sea-700)" stopOpacity={0.55} />
          <stop offset="50%" stopColor="var(--color-sea-400)" stopOpacity={0.25} />
          <stop offset="100%" stopColor="var(--color-sea-700)" stopOpacity={0.55} />
        </linearGradient>
      </defs>
    </svg>
  )
}

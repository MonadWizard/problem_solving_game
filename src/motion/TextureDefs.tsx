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

        {/* Deep-ocean base for the ambient site background: dark at both edges, a
            lighter mid-band, same opacity weighting as water-shimmer above so overall
            page brightness doesn't shift. */}
        <linearGradient id="ocean-depth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-sea-950)" stopOpacity={0.55} />
          <stop offset="50%" stopColor="var(--color-sea-700)" stopOpacity={0.25} />
          <stop offset="100%" stopColor="var(--color-sea-950)" stopOpacity={0.55} />
        </linearGradient>

        {/* One smooth up-down swell, drawn so its right edge slope matches its left
            edge slope — tiles horizontally with no visible seam. Never painted
            directly (no fill/stroke set); each wave-swell-N pattern below tints it
            via <use fill="...">. */}
        <path id="wave-swell-path" d="M0,30 C30,10 90,10 120,30 C150,50 210,50 240,30 L240,60 L0,60 Z" />

        <pattern id="wave-swell-1" width={240} height={60} patternUnits="userSpaceOnUse">
          <use href="#wave-swell-path" fill="var(--color-sea-400)" />
        </pattern>
        <pattern id="wave-swell-2" width={240} height={60} patternUnits="userSpaceOnUse">
          <use href="#wave-swell-path" fill="var(--color-sea-500)" />
        </pattern>
        <pattern id="wave-swell-3" width={240} height={60} patternUnits="userSpaceOnUse">
          <use href="#wave-swell-path" fill="var(--color-sea-700)" />
        </pattern>
        <pattern id="wave-swell-4" width={240} height={60} patternUnits="userSpaceOnUse">
          <use href="#wave-swell-path" fill="var(--color-sea-900)" />
        </pattern>
      </defs>
    </svg>
  )
}

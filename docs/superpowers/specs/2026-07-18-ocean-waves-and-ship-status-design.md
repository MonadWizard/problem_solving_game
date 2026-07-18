# Ocean wave background + more visible boat leveling

## Problem

The site-wide ambient background (`Layout.tsx`) is a single flat gradient rect with one
subtle 18s side-to-side drift (`shimmer-drift`) — it doesn't read as ocean, just a tinted
watermark. Separately, the "ship gets bigger as you solve more problems" mechanic already
exists (`shipTier` in `src/lib/unlocks.ts`, rendered by `ShipSprite.tsx`) but is only visible
as a small SVG element inside the map, with no name/label and no moment of celebration when
it upgrades — so the core "gain power by solving" feeling is easy to miss.

## Goal

1. Make the ambient background feel like a deep ocean: multiple wave layers, moving in mixed
   directions (some left→right, some right→left) at different speeds and offsets so they
   don't look synchronized, using smooth undulating swell shapes rather than flat bands.
2. Surface the ship tier as a persistent, named readout on the map screen.
3. Celebrate ship tier upgrades with a toast, reusing the existing chest/boss-drop toast
   pattern.

## Non-goals

- No changes to `shipTier` thresholds, XP/level formulas, or any other game-balance rule
  (game-design skill territory — untouched).
- No new illustration assets or animation libraries — pure SVG `<pattern>` + CSS keyframes,
  consistent with the existing `wood-grain`/`parchment-grain`/`water-shimmer` defs in
  `TextureDefs.tsx`.
- Ship status readout stays on `MapScreen` only — not added to the global header or other
  screens, since ship tier is map/journey-1-specific state, not global nav chrome.
- No foam/crest highlight lines (considered and declined — plain smooth swells keep it calm
  and keep text behind it readable).

## 1. Wave background

### `src/motion/TextureDefs.tsx`

Add an SVG `<pattern id="wave-swell">` — a horizontally tileable smooth swell built from a
single cubic-bezier "up-down" pair repeated so the pattern's right edge slope matches its
left edge slope (seamless tiling). Pattern is a `<path>` filled with `currentColor`, so each
consuming `<rect>` supplies its own color via CSS `color`, matching how `water-shimmer`
already delegates color to CSS custom properties. One shared pattern definition, reused by
all four wave layers at different scale via each layer's own `<rect>` transform — avoids
duplicating the path data four times.

### `src/components/Layout.tsx`

Replace the single `<rect fill="url(#water-shimmer)">` with:

- One base `<rect>` using a new vertical gradient def `ocean-depth` (sea-950 → sea-700 →
  sea-950) for the deep-water base tone, dark and light theme both handled via existing
  `--color-sea-*` custom properties (no new colors needed).
- Four `<rect fill="url(#wave-swell)">` layers, each wrapped in its own CSS class
  (`.wave-layer-1` … `.wave-layer-4`) controlling: vertical position (`transform:
  translateY(...)`, spreading the four layers down the viewport), opacity (0.05–0.12 range,
  darker/lower layers more opaque per the depth cue), and `color` (sea-800/700/500/400,
  darkest at the back).

### `src/index.css`

Four new keyframe pairs (or one parameterized pattern via CSS custom properties —
`--wave-dir` sign and `--wave-duration`) driving `translateX` from `0` to `±(pattern tile
width)`, so the loop is seamless. Concretely:

```css
@keyframes wave-flow-right { to { transform: translateX(var(--wave-tile, 240px)); } }
@keyframes wave-flow-left  { to { transform: translateX(calc(var(--wave-tile, 240px) * -1)); } }

.wave-layer-1 { animation: wave-flow-right 42s linear infinite; animation-delay: -11s; }
.wave-layer-2 { animation: wave-flow-left  61s linear infinite; animation-delay: -34s; }
.wave-layer-3 { animation: wave-flow-right 78s linear infinite; animation-delay: -5s;  }
.wave-layer-4 { animation: wave-flow-left  97s linear infinite; animation-delay: -52s; }
```

Durations, delays, and directions are hand-picked constants (not runtime `Math.random()`) —
deterministic, no hydration/SSR concerns, and "random order" is achieved by the layers being
visibly out of phase and moving opposite ways, not by literal randomness. Negative
`animation-delay` starts each layer mid-cycle immediately on load instead of all four
starting from the same pose.

Already covered for free: the existing global
`@media (prefers-reduced-motion: reduce)` rule (index.css) collapses all animation durations
to ~0, so reduced-motion users get a static (but still layered/deep) background with no
extra JS branching needed.

### Readability

Layers stay in the same low-opacity range as today's `water-shimmer` (0.05–0.15) and sit
behind all content (`-z-10`, `pointer-events-none`, unchanged). No change to text contrast
anywhere.

## 2. Persistent ship status

### `src/screens/MapScreen.tsx`

In the existing top stat bar (the flex row currently showing bounty/level and streak,
`MapScreen.tsx` lines ~58-75), add a third readout: a small `ShipSprite` (rendered at a fixed
tier-independent scale, in a tiny inline `<svg>`) plus the tier name, e.g. "⛵ Sloop". Tier
comes from `shipTier(j1, local)`, already computed for `SeaChart`. A capitalized display name
map (`dinghy` → "Dinghy", etc.) lives alongside `shipTier` in `src/lib/unlocks.ts` as a small
exported `SHIP_TIER_LABEL` record — content-ish but small enough to be plain code, same
treatment as `HULL_WIDTH`/`MAST_COUNT` in `ShipSprite.tsx`, not curriculum JSON.

## 3. Level-up celebration

### `src/store/gameStore.ts`

`markSolved` is the only place `completedIslands`/`shipTier` can change (island completion is
solve-count-only; quiz-passing only affects unlock gating, not completion). Compute
`shipTier(curriculum.journeys[1], local)` before building the new solve/local state and again
after; if they differ, pass `lastShipTierUp: newTier` into `commit`'s `extra` param — same
ephemeral, non-persisted, non-synced pattern already used by `lastChest`/`lastBossDrop`
(cleared by `dismissChest`). This does not touch `ProgressState`/sync/merge — it's UI-only
signal, consistent with golden rule 5 (derived game state stays derived; this is a transient
notification flag, never written to `local` or the queue).

### `src/components/ChestToast.tsx`

Add a third condition alongside the existing `chestItem`/`bossItem` lines: when
`lastShipTierUp` is set, render "⛵ Your ship is now a **{label}**!" using the same
`SHIP_TIER_LABEL` map. Extend the `showing` check and `dismissChest` to include/clear
`lastShipTierUp`, matching the existing 5s auto-dismiss timer. No new component needed — same
toast, one more optional line, same `ParticleBurst` celebration treatment.

## Testing

- `src/lib/unlocks.ts`: existing `shipTier` tests (if any) unaffected; add a small test for
  `SHIP_TIER_LABEL` covering all four tiers if a test file for unlocks already exists,
  otherwise skip (not worth a new test file for a label lookup table).
- `src/store/gameStore.ts` / existing store tests: add a case verifying `lastShipTierUp` is
  set when a solve crosses a tier threshold (e.g. the 4th island-completing solve) and stays
  `null`/unset otherwise, following whatever pattern existing `markSolved` tests use.
- Wave background and ship status readout are visual-only — verified manually via `npm run
  dev` (dark + light theme, reduced-motion emulation), not unit tested, consistent with how
  `shimmer-drift`/`route-dash` have no tests today.

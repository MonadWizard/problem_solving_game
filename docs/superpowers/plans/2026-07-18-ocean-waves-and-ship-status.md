# Ocean Waves and Ship Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the site-wide ambient background into a layered, mixed-direction wave ocean, and make the existing ship-tier-up-as-you-solve mechanic visible via a persistent status readout and a level-up celebration toast.

**Architecture:** Pure SVG `<pattern>`/`<use>` defs (extending the existing `TextureDefs.tsx` texture-def convention) + CSS `transform`/`animation` keyframes for the waves (no new deps, automatically covered by the existing global `prefers-reduced-motion` override). Ship tier surfaces via a small lookup table in `unlocks.ts`, an ephemeral (non-persisted) `lastShipTierUp` store field set inside `markSolved`, and two small UI additions reusing the existing `ShipSprite`/`ChestToast` components.

**Tech Stack:** React + TypeScript, Zustand store, Tailwind v4 (`@theme` CSS custom properties), Vitest.

## Global Constraints

- Golden rule 1: all curriculum/story/item content lives in `public/data/*.json` — none of this work touches that; `SHIP_TIER_LABEL` is UI code (same treatment as the existing `HULL_WIDTH`/`MAST_COUNT` tables in `ShipSprite.tsx`), not curriculum data.
- Golden rule 5: game state (XP, level, streak, unlocks) must stay *derived* from synced solves/events — `lastShipTierUp` is never written to `local`/the sync queue, exactly like the existing `lastChest`/`lastBossDrop` fields it sits beside.
- Mobile-first, dark theme default, reduced-motion respected (CLAUDE.md rule 6) — all wave animation is plain CSS `animation`, already caught by the existing blanket `@media (prefers-reduced-motion: reduce)` rule in `src/index.css`.
- No new dependencies.

---

## File Structure

- Modify `src/lib/unlocks.ts` — add `SHIP_TIER_LABEL` display-name lookup next to `ShipTier`/`shipTier`.
- Modify `src/store/gameStore.ts` — add `lastShipTierUp: ShipTier | null` state field, computed in `markSolved`, cleared in `dismissChest`.
- Modify `src/components/ChestToast.tsx` — render a third celebration line when `lastShipTierUp` is set.
- Modify `src/screens/MapScreen.tsx` — add a persistent ship-tier readout (mini `ShipSprite` + label) to the existing stat bar.
- Modify `src/motion/TextureDefs.tsx` — add `ocean-depth` gradient, a shared `wave-swell-path`, and four colored `wave-swell-N` patterns built from it via `<use>`.
- Modify `src/components/Layout.tsx` — replace the single background rect with the `ocean-depth` base + four animated wave-layer rects.
- Modify `src/index.css` — add the `wave-flow-left`/`wave-flow-right` keyframes and four `.wave-layer-N` classes.
- Modify `src/test/unlocks.test.ts` — cover `SHIP_TIER_LABEL`.
- Modify `src/test/gameStore.test.ts` — cover `lastShipTierUp` transitions.

---

### Task 1: Ship tier display names

**Files:**
- Modify: `src/lib/unlocks.ts:63-69`
- Test: `src/test/unlocks.test.ts`

**Interfaces:**
- Produces: `SHIP_TIER_LABEL: Record<ShipTier, string>`, exported from `src/lib/unlocks.ts`, keyed by the existing `ShipTier` union (`'dinghy' | 'sloop' | 'brig' | 'galleon'`).

- [ ] **Step 1: Write the failing test**

Add to `src/test/unlocks.test.ts`, inside the existing `describe('ship progression', ...)` block (after the last `it`, before the closing `})` — see current file lines 78-93):

```ts
  it('has a display label for every tier', () => {
    expect(SHIP_TIER_LABEL.dinghy).toBe('Dinghy')
    expect(SHIP_TIER_LABEL.sloop).toBe('Sloop')
    expect(SHIP_TIER_LABEL.brig).toBe('Brig')
    expect(SHIP_TIER_LABEL.galleon).toBe('Galleon')
  })
```

Update the import at the top of the file (line 2-9) to include `SHIP_TIER_LABEL`:

```ts
import {
  currentIsland,
  islandComplete,
  islandProgress,
  islandUnlocked,
  journey2Unlocked,
  shipTier,
  SHIP_TIER_LABEL,
} from '../lib/unlocks'
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/unlocks.test.ts`
Expected: FAIL — `SHIP_TIER_LABEL` is not exported from `../lib/unlocks`.

- [ ] **Step 3: Write minimal implementation**

In `src/lib/unlocks.ts`, immediately after the existing `shipTier` function (current lines 63-69):

```ts
export const SHIP_TIER_LABEL: Record<ShipTier, string> = {
  dinghy: 'Dinghy',
  sloop: 'Sloop',
  brig: 'Brig',
  galleon: 'Galleon',
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/unlocks.test.ts`
Expected: PASS (all tests in the file, including the new one).

- [ ] **Step 5: Commit**

```bash
git add src/lib/unlocks.ts src/test/unlocks.test.ts
git commit -m "feat: add ship tier display labels"
```

---

### Task 2: Detect ship tier-ups in the store

**Files:**
- Modify: `src/store/gameStore.ts:1-16` (imports, interface), `src/store/gameStore.ts:79-90` (initial state), `src/store/gameStore.ts:112-169` (`markSolved`), `src/store/gameStore.ts:287-289` (`dismissChest`)
- Test: `src/test/gameStore.test.ts`

**Interfaces:**
- Consumes: `shipTier(j1: Journey, state: ProgressState): ShipTier` and `type ShipTier` from `../lib/unlocks` (existing, used already by `SeaChart.tsx`).
- Produces: `GameStore.lastShipTierUp: ShipTier | null` — the tier just reached by the most recent `markSolved` call, or `null` if that solve didn't cross a tier threshold. Cleared by `dismissChest()`, same lifecycle as `lastChest`/`lastBossDrop`.

- [ ] **Step 1: Write the failing test**

Add to `src/test/gameStore.test.ts`, as a new `describe` block after the existing `describe('gameStore.markSolved', ...)` block (after line 71):

```ts
describe('ship tier-up detection', () => {
  it('sets lastShipTierUp only on the solve that crosses a tier threshold', () => {
    const j1 = state().curriculum!.journeys[1]
    const islands = [...j1.islands].sort((a, b) => a.order - b.order).slice(0, 4)
    const problemsByIsland = islands.map((isl) => j1.problems.filter((p) => p.island_id === isl.id))

    problemsByIsland.forEach((probs, islandIdx) => {
      const isLastIsland = islandIdx === problemsByIsland.length - 1
      probs.forEach((problem, problemIdx) => {
        const isFinalSolve = isLastIsland && problemIdx === probs.length - 1
        state().markSolved(1, problem.slug)
        if (isFinalSolve) {
          expect(state().lastShipTierUp).toBe('sloop')
        } else {
          expect(state().lastShipTierUp).toBeNull()
        }
      })
    })
  })

  it('does not re-fire on the next solve once the toast would have been dismissed', () => {
    const j1 = state().curriculum!.journeys[1]
    const islands = [...j1.islands].sort((a, b) => a.order - b.order).slice(0, 4)
    for (const isl of islands) {
      for (const p of j1.problems.filter((pr) => pr.island_id === isl.id)) {
        state().markSolved(1, p.slug)
      }
    }
    expect(state().lastShipTierUp).toBe('sloop')

    const fifthIsland = [...j1.islands].sort((a, b) => a.order - b.order)[4]
    const nextProblem = j1.problems.find((p) => p.island_id === fifthIsland.id)!
    state().markSolved(1, nextProblem.slug)
    expect(state().lastShipTierUp).toBeNull()
  })
})
```

Also update the state-reset object in `freshStore()` (current lines 10-16) to include the new field:

```ts
  useGameStore.setState({
    ready: false,
    local: defaultLocalState(),
    lastChest: null,
    lastBossDrop: null,
    lastShipTierUp: null,
    revealed: [],
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/gameStore.test.ts -t "ship tier-up"`
Expected: FAIL with a TypeScript/runtime error — `lastShipTierUp` does not exist on the store state.

- [ ] **Step 3: Write minimal implementation**

In `src/store/gameStore.ts`, update the import on line 11 to also pull in `shipTier`/`ShipTier`:

```ts
import { loadCurriculum, indexProblems, problemKey, type Curriculum } from '../data/curriculum'
import { defaultLocalState, loadLocal, saveLocal } from './localStore'
import { mergeProgress } from '../sync/merge'
import { pickWeighted } from '../lib/rng'
import { streakAtRisk } from '../lib/streak'
import { shipTier, type ShipTier } from '../lib/unlocks'
```

In the `GameStore` interface (current lines 36-69), add the field next to `lastBossDrop` (current line 43):

```ts
  /** Last chest drop id, for the toast. */
  lastChest: string | null
  lastBossDrop: string | null
  /** Ship tier just reached by the most recent solve, for the celebration toast. Never persisted or synced. */
  lastShipTierUp: ShipTier | null
```

In the store's initial state object (current lines 79-86), add the field next to `lastBossDrop`:

```ts
    ready: false,
    curriculum: null,
    problems: new Map(),
    local: defaultLocalState(),
    lastChest: null,
    lastBossDrop: null,
    lastShipTierUp: null,
    revealed: [],
```

In `markSolved` (current lines 112-169): compute the tier before mutating (right after the existing early-return guard on line 115), and compute it again on the post-solve state right before `commit`. Replace the whole method body with:

```ts
    markSolved(journeyId, slug) {
      const { curriculum, problems, local } = get()
      const problem = problems.get(problemKey(journeyId, slug))
      if (!curriculum || !problem) return
      if (local.solves.some((s) => s.journeyId === journeyId && s.slug === slug)) return

      const j1 = curriculum.journeys[1]
      const prevTier = shipTier(j1, local)

      const now = new Date()
      const key = problemKey(journeyId, slug)
      const ops: QueueOp[] = []
      const events = [...local.events]
      let items = local.items
      const pushEvent = (e: GameEvent) => {
        events.push(e)
        ops.push({ kind: 'event', event: e })
      }

      // Timed attempt (journey 2): star when solved within the limit.
      let secondsTaken: number | null = null
      let starred = false
      const attempts = { ...local.attempts }
      const pausedAttempts = { ...local.pausedAttempts }
      const startedAt = attempts[key]
      if (startedAt) {
        const pausedAt = pausedAttempts[key]
        const endTime = pausedAt ? Date.parse(pausedAt) : now.getTime()
        secondsTaken = Math.max(1, Math.round((endTime - Date.parse(startedAt)) / 1000))
        starred = problem.time_limit_seconds !== undefined && secondsTaken <= problem.time_limit_seconds
        delete attempts[key]
        delete pausedAttempts[key]
      }

      const solve = { journeyId, slug, solvedAt: now.toISOString(), secondsTaken, starred }
      ops.push({ kind: 'solve', solve })
      pushEvent(newEvent('solve', slug))
      if (problem.is_boss) pushEvent(newEvent('boss_win', slug))
      if (local.hasteUntil && Date.parse(local.hasteUntil) > now.getTime()) {
        pushEvent(newEvent('haste_bonus', key))
      }

      // Treasure chest after every solve.
      const chest = pickWeighted(curriculum.items.chest_table, random()).drop
      pushEvent(newEvent('chest', chest))
      if (chest !== 'xp') items = { ...items, [chest]: (items[chest] ?? 0) + 1 }

      // Rare cursed-fruit drop from bosses.
      let bossDrop: string | null = null
      if (problem.is_boss) {
        bossDrop = pickWeighted(curriculum.items.boss_drops, random()).drop
        items = { ...items, [bossDrop]: (items[bossDrop] ?? 0) + 1 }
      }
      if (items !== local.items) ops.push({ kind: 'items', items })

      const nextLocal = { ...local, solves: [...local.solves, solve], events, items, attempts, pausedAttempts }
      const nextTier = shipTier(j1, nextLocal)

      commit(nextLocal, ops, {
        lastChest: chest,
        lastBossDrop: bossDrop,
        lastShipTierUp: nextTier !== prevTier ? nextTier : null,
      })
    },
```

In `dismissChest` (current lines 287-289), clear the new field too:

```ts
    dismissChest() {
      set({ lastChest: null, lastBossDrop: null, lastShipTierUp: null })
    },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/gameStore.test.ts`
Expected: PASS (all tests in the file, including the two new ones).

- [ ] **Step 5: Commit**

```bash
git add src/store/gameStore.ts src/test/gameStore.test.ts
git commit -m "feat: detect ship tier-ups in markSolved"
```

---

### Task 3: Level-up celebration toast

**Files:**
- Modify: `src/components/ChestToast.tsx`

**Interfaces:**
- Consumes: `GameStore.lastShipTierUp` (Task 2), `SHIP_TIER_LABEL` (Task 1) from `../lib/unlocks`.

- [ ] **Step 1: Implement**

Replace the full contents of `src/components/ChestToast.tsx`:

```tsx
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useGameStore } from '../store/gameStore'
import { SHIP_TIER_LABEL } from '../lib/unlocks'
import ParticleBurst from '../motion/ParticleBurst'
import { SPRING_BOUNCY } from '../motion/transitions'

const RARITY_LABEL: Record<string, string> = { common: '', rare: '✨ Rare!', epic: '🌟 Epic!' }

export default function ChestToast() {
  const lastChest = useGameStore((s) => s.lastChest)
  const lastBossDrop = useGameStore((s) => s.lastBossDrop)
  const lastShipTierUp = useGameStore((s) => s.lastShipTierUp)
  const curriculum = useGameStore((s) => s.curriculum)
  const dismissChest = useGameStore((s) => s.dismissChest)

  const showing = (!!lastChest || !!lastBossDrop || !!lastShipTierUp) && !!curriculum

  useEffect(() => {
    if (!showing) return
    const t = setTimeout(dismissChest, 5000)
    return () => clearTimeout(t)
  }, [showing, dismissChest])

  const chestItem =
    showing && lastChest && lastChest !== 'xp' ? curriculum!.items.items.find((i) => i.id === lastChest) : null
  const bossItem = showing && lastBossDrop ? curriculum!.items.items.find((i) => i.id === lastBossDrop) : null
  const shipLabel = showing && lastShipTierUp ? SHIP_TIER_LABEL[lastShipTierUp] : null

  return (
    <AnimatePresence>
      {showing && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 40, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          transition={SPRING_BOUNCY}
          className="fixed bottom-4 left-1/2 z-40 w-full max-w-sm rounded-lg border border-gold-500/60 bg-parchment p-4 text-sea-950 shadow-xl dark:bg-sea-900 dark:text-sea-50"
        >
          <ParticleBurst seed={String(lastChest ?? lastBossDrop ?? lastShipTierUp)} />
          <button
            type="button"
            onClick={dismissChest}
            aria-label="Dismiss"
            className="float-right rounded px-1 hover:bg-black/5 dark:hover:bg-white/10"
          >
            ✕
          </button>
          {lastChest === 'xp' && <p className="text-sm">📦 Treasure chest: +50 bonus XP!</p>}
          {chestItem && (
            <p className="text-sm">
              📦 Treasure chest: <strong>{chestItem.name}</strong> — {chestItem.effect}
            </p>
          )}
          {bossItem && (
            <p className="mt-1 text-sm">
              {RARITY_LABEL[bossItem.rarity]} Boss drop: <strong>{bossItem.name}</strong> — {bossItem.effect}
            </p>
          )}
          {shipLabel && (
            <p className="mt-1 text-sm">
              ⛵ Your ship is now a <strong>{shipLabel}</strong>!
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Run the full test suite to confirm no regression**

Run: `npx vitest run`
Expected: PASS — `ChestToast` has no dedicated test file today (unchanged), so this step just confirms nothing else broke.

- [ ] **Step 3: Commit**

```bash
git add src/components/ChestToast.tsx
git commit -m "feat: celebrate ship tier-ups in the chest toast"
```

---

### Task 4: Persistent ship status readout on the map screen

**Files:**
- Modify: `src/screens/MapScreen.tsx:1-9` (imports), `src/screens/MapScreen.tsx:58-75` (stat bar)

**Interfaces:**
- Consumes: `shipTier`, `SHIP_TIER_LABEL` from `../lib/unlocks` (Task 1 + existing), `ShipSprite` from `../components/ShipSprite` (existing, `HULL_WIDTH`/`MAST_COUNT` bounding box: hull spans roughly x -26..26, masts extend up to y -40, hull bottom at y 0).

- [ ] **Step 1: Implement**

In `src/screens/MapScreen.tsx`, update imports (current lines 1-9) to add:

```ts
import SeaChart from '../components/SeaChart'
import ShipSprite from '../components/ShipSprite'
import IslandList from '../components/IslandList'
import AnimatedNumber from '../motion/AnimatedNumber'
import { shipTier, SHIP_TIER_LABEL } from '../lib/unlocks'
```

Inside the component body, after `const streak = computeStreak(local.events)` (current line 53), add:

```ts
  const tier = shipTier(j1, local)
```

Replace the stat bar's inner content (current lines 64-74) to insert the ship readout between the XP block and the streak line:

```tsx
        <div className="relative">
          <p className="font-display text-lg font-bold text-gold-500 dark:text-gold-400">
            <AnimatedNumber value={xp} format={formatBounty} />
          </p>
          <p className="text-xs opacity-70">
            Level {level} · <AnimatedNumber value={current} />/{needed} XP to next level
          </p>
        </div>
        <div className="relative flex items-center gap-1.5 text-sm" aria-label={`Ship: ${SHIP_TIER_LABEL[tier]}`}>
          <svg viewBox="-28 -42 56 46" width="28" height="23" aria-hidden focusable="false">
            <ShipSprite tier={tier} />
          </svg>
          <span>{SHIP_TIER_LABEL[tier]}</span>
        </div>
        <p className="relative text-sm" aria-label={`${streak} day streak`}>
          🔥 {streak} day{streak === 1 ? '' : 's'}
        </p>
```

- [ ] **Step 2: Run the full test suite to confirm no regression**

Run: `npx vitest run`
Expected: PASS — `MapScreen` has no dedicated test file today; confirms nothing else broke.

- [ ] **Step 3: Manual check**

Run: `npm run dev`, open the Map screen. Expected: a small ship icon + "Dinghy" label appears in the stat bar between the XP readout and the streak counter, in both light and dark theme.

- [ ] **Step 4: Commit**

```bash
git add src/screens/MapScreen.tsx
git commit -m "feat: show persistent ship tier readout on the map screen"
```

---

### Task 5: Wave pattern + deep-ocean gradient defs

**Files:**
- Modify: `src/motion/TextureDefs.tsx`

**Interfaces:**
- Produces: SVG defs `ocean-depth` (linearGradient), `wave-swell-path` (path, referenced via `<use>`, not painted directly), and `wave-swell-1`..`wave-swell-4` (patterns, each tinted a different sea shade) — all referenced by `Layout.tsx` in Task 6 as `fill="url(#...)"`.

- [ ] **Step 1: Implement**

Replace the full contents of `src/motion/TextureDefs.tsx`:

```tsx
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
```

- [ ] **Step 2: Run the full test suite to confirm no regression**

Run: `npx vitest run`
Expected: PASS — this file has no dedicated test; confirms nothing else broke.

- [ ] **Step 3: Commit**

```bash
git add src/motion/TextureDefs.tsx
git commit -m "feat: add deep-ocean gradient and wave-swell pattern defs"
```

---

### Task 6: Animated wave layers in the site background

**Files:**
- Modify: `src/components/Layout.tsx:41-48`
- Modify: `src/index.css` (append)

**Interfaces:**
- Consumes: `#ocean-depth`, `#wave-swell-1`..`#wave-swell-4` (Task 5).

- [ ] **Step 1: Implement — Layout.tsx**

In `src/components/Layout.tsx`, replace the background `<svg>` block (current lines 41-48):

```tsx
      {/* Ambient background: deep-ocean gradient + four wave-swell layers, each its own
          speed/direction/delay so they never look synchronized. Purely decorative. */}
      <svg className="pointer-events-none fixed inset-0 -z-10 h-full w-full" aria-hidden focusable="false">
        <rect width="100%" height="100%" fill="url(#ocean-depth)" className="route-dash-bg" />
        <rect
          x={-240}
          y="10%"
          width="calc(100% + 480px)"
          height={60}
          fill="url(#wave-swell-1)"
          className="wave-layer wave-layer-1"
        />
        <rect
          x={-240}
          y="35%"
          width="calc(100% + 480px)"
          height={60}
          fill="url(#wave-swell-2)"
          className="wave-layer wave-layer-2"
        />
        <rect
          x={-240}
          y="60%"
          width="calc(100% + 480px)"
          height={60}
          fill="url(#wave-swell-3)"
          className="wave-layer wave-layer-3"
        />
        <rect
          x={-240}
          y="85%"
          width="calc(100% + 480px)"
          height={60}
          fill="url(#wave-swell-4)"
          className="wave-layer wave-layer-4"
        />
      </svg>
```

- [ ] **Step 2: Implement — index.css**

In `src/index.css`, append after the existing `shimmer-drift` keyframes block (current lines 67-74, right before `.self-row-glow`):

```css
.wave-layer {
  will-change: transform;
}

.wave-layer-1 {
  opacity: 0.1;
  animation: wave-flow-right 42s linear infinite;
  animation-delay: -11s;
}

.wave-layer-2 {
  opacity: 0.09;
  animation: wave-flow-left 61s linear infinite;
  animation-delay: -34s;
}

.wave-layer-3 {
  opacity: 0.12;
  animation: wave-flow-right 78s linear infinite;
  animation-delay: -5s;
}

.wave-layer-4 {
  opacity: 0.15;
  animation: wave-flow-left 97s linear infinite;
  animation-delay: -52s;
}

@keyframes wave-flow-right {
  to {
    transform: translateX(240px);
  }
}

@keyframes wave-flow-left {
  to {
    transform: translateX(-240px);
  }
}
```

Note: each wave `<rect>` is deliberately 240px wider than the viewport on both sides (`x={-240}`, `width: calc(100% + 480px)`, matching the 240px pattern tile) so a ±240px translate never exposes a gap at either edge — that's what makes the loop seamless in both directions.

- [ ] **Step 3: Run the full test suite to confirm no regression**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 4: Manual check**

Run: `npm run dev`. Expected, on every screen (background is global via `Layout.tsx`):
- Four faint wavy horizontal bands visible over the base gradient, at different heights, moving continuously — two drifting left→right, two drifting right→left, clearly out of phase with each other (not a single uniform current).
- Text and UI remain fully readable (waves stay low-opacity, behind all content).
- Check both light and dark theme via the theme toggle.
- In devtools, emulate `prefers-reduced-motion: reduce` — all wave motion should freeze to static bands.

- [ ] **Step 5: Commit**

```bash
git add src/components/Layout.tsx src/index.css
git commit -m "feat: layered mixed-direction wave background"
```

---

### Task 7: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `npx vitest run`
Expected: PASS, all files.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: succeeds (catches anything the dev server tolerates but a production build wouldn't, e.g. unused imports under stricter settings).

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`. Walk through: Map screen shows the ship-tier readout in the stat bar and the wave background behind it; toggle theme; toggle Map/List view; confirm no layout shift or overlap from the new stat-bar item on a narrow (mobile-width) viewport via devtools responsive mode.

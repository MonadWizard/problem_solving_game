# About Page Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `AboutScreen` from four paragraphs of text into a visual, icon-driven page that explains the game loop, the three journeys (and why they're named what they are), and every item's power — while keeping the existing legal/coverage disclaimer verbatim in a de-emphasized "Fine print" section.

**Architecture:** Two data changes (a new `public/data/lore.json` for About-page copy that doesn't fit curriculum/item schemas, plus an `icon` field added to each entry in the existing `public/data/items.json`) feed a rewritten `AboutScreen.tsx`. A new tiny loader `src/data/lore.ts` mirrors the existing `fetchJson` pattern in `src/data/curriculum.ts` but stays separate from `loadCurriculum()`, since lore is static page copy, not game-state data. `AboutScreen` fetches lore itself on mount and reads items from the already-loaded `useGameStore((s) => s.curriculum)`.

**Tech Stack:** React + TypeScript, Zustand (`useGameStore`), `motion/react` (existing `RevealList`/`RevealItem` + inline `whileInView` pattern), Vitest for schema tests, Tailwind utility classes matching existing `sea-*`/`gold-*` tokens.

## Global Constraints

- Data-driven content: all curriculum, story, and item content lives in `public/data/*.json`. Components never hardcode content. (CLAUDE.md golden rule 1)
- No copyrighted IP: original pirate world only. (CLAUDE.md golden rule 2)
- Mobile-first, dark theme default, reduced-motion respected. (CLAUDE.md golden rule 6)
- The existing "Honest coverage statement", attribution, no-copyrighted-IP, and guest/sync paragraphs in `AboutScreen.tsx` must be preserved **verbatim** — only their visual placement/emphasis changes.
- No new illustration/SVG assets — icons are emoji only, consistent with the rest of the app.
- No changes to game mechanics, XP/level/streak formulas, item drop logic, routing, or nav.
- `npm run typecheck`, `npm run lint`, and `npm test` must all pass after every task.

---

### Task 1: Add `icon` to every item in `items.json` and to the `Item` type

**Files:**
- Modify: `public/data/items.json`
- Modify: `src/lib/types.ts:95-102` (the `ItemDef` interface)
- Modify: `src/test/curriculum.test.ts:159-173` (the `describe('items.json')` block)

**Interfaces:**
- Produces: `ItemDef.icon?: string` — an optional emoji field later tasks (the `AboutScreen` fruits/loot grid) read via `curriculum.items.items[i].icon`.

- [ ] **Step 1: Write the failing test**

Add this assertion inside the existing `describe('items.json')` block in `src/test/curriculum.test.ts` (right after the existing `it('defines the core items', ...)` block, before the closing of the `describe`):

```ts
  it('gives every item an emoji icon', () => {
    for (const item of items.items) {
      expect(item.icon, `icon for ${item.id}`).toBeDefined()
      expect(item.icon!.length).toBeGreaterThan(0)
    }
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/curriculum.test.ts -t "gives every item an emoji icon"`
Expected: FAIL — `item.icon` is `undefined` for every item (field doesn't exist yet in items.json, and doesn't typecheck yet either since `ItemDef` has no `icon` field).

- [ ] **Step 3: Add `icon?: string` to the `ItemDef` interface**

In `src/lib/types.ts`, change:

```ts
export interface ItemDef {
  id: string
  name: string
  rarity: 'common' | 'rare' | 'epic'
  kind: 'fruit' | 'utility' | 'cosmetic' | 'ship_part'
  description: string
  effect: string
}
```

to:

```ts
export interface ItemDef {
  id: string
  name: string
  rarity: 'common' | 'rare' | 'epic'
  kind: 'fruit' | 'utility' | 'cosmetic' | 'ship_part'
  description: string
  effect: string
  icon?: string
}
```

- [ ] **Step 4: Add an `icon` field to every entry in `public/data/items.json`**

Rewrite `public/data/items.json` to (only change: one `"icon"` line added per item; `chest_table`/`boss_drops` untouched):

```json
{
  "items": [
    {
      "id": "rewind_fruit",
      "name": "Rewind Fruit",
      "rarity": "rare",
      "kind": "fruit",
      "description": "A spiral-skinned cursed fruit that tastes like last Tuesday.",
      "effect": "Retry a failed boss timer without losing your streak.",
      "icon": "⏪"
    },
    {
      "id": "oracle_fruit",
      "name": "Oracle Fruit",
      "rarity": "rare",
      "kind": "fruit",
      "description": "Its seeds whisper. Eat one and the fog thins for a moment.",
      "effect": "Reveal the hidden pattern hint of one problem (once).",
      "icon": "🔮"
    },
    {
      "id": "haste_fruit",
      "name": "Haste Fruit",
      "rarity": "epic",
      "kind": "fruit",
      "description": "Crackles with storm-light. Your hands move before your thoughts.",
      "effect": "Double XP from every solve for 24 hours.",
      "icon": "⚡"
    },
    {
      "id": "streak_freeze",
      "name": "Streak Freeze",
      "rarity": "common",
      "kind": "utility",
      "description": "A shard of never-melting ice from the Frozen Latitudes.",
      "effect": "Protects your streak for one missed day (used automatically).",
      "icon": "🧊"
    },
    {
      "id": "cosmetic_jolly_flag",
      "name": "Jolly Algorithm Flag",
      "rarity": "common",
      "kind": "cosmetic",
      "description": "A flag stitched with a skull wearing reading glasses.",
      "effect": "Cosmetic bragging rights on your bounty poster shelf.",
      "icon": "🏴"
    },
    {
      "id": "cosmetic_lantern",
      "name": "Wayfinder Lantern",
      "rarity": "common",
      "kind": "cosmetic",
      "description": "Burns brighter the closer you sail to The One Solution.",
      "effect": "Cosmetic bragging rights on your bounty poster shelf.",
      "icon": "🏮"
    },
    {
      "id": "ship_part_sail",
      "name": "Stormcloth Sail",
      "rarity": "common",
      "kind": "ship_part",
      "description": "Woven from squall-silk. Catches even the laziest wind.",
      "effect": "A ship part for your growing vessel.",
      "icon": "⛵"
    },
    {
      "id": "ship_part_cannon",
      "name": "Debugger Cannon",
      "rarity": "common",
      "kind": "ship_part",
      "description": "Fires concentrated print statements at approaching bugs.",
      "effect": "A ship part for your growing vessel.",
      "icon": "💣"
    },
    {
      "id": "ship_part_figurehead",
      "name": "Turtle-and-Hare Figurehead",
      "rarity": "common",
      "kind": "ship_part",
      "description": "Two carved racers forever chasing each other around the prow.",
      "effect": "A ship part for your growing vessel.",
      "icon": "🐢"
    }
  ],
  "chest_table": [
    { "drop": "xp", "weight": 45 },
    { "drop": "streak_freeze", "weight": 15 },
    { "drop": "cosmetic_jolly_flag", "weight": 10 },
    { "drop": "cosmetic_lantern", "weight": 10 },
    { "drop": "ship_part_sail", "weight": 7 },
    { "drop": "ship_part_cannon", "weight": 7 },
    { "drop": "ship_part_figurehead", "weight": 6 }
  ],
  "boss_drops": [
    { "drop": "rewind_fruit", "weight": 30 },
    { "drop": "oracle_fruit", "weight": 30 },
    { "drop": "haste_fruit", "weight": 20 },
    { "drop": "streak_freeze", "weight": 20 }
  ]
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/test/curriculum.test.ts`
Expected: PASS (all tests in the file, including the new one)

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add public/data/items.json src/lib/types.ts src/test/curriculum.test.ts
git commit -m "feat: add emoji icon field to items for About page display"
```

---

### Task 2: Create `lore.json` data + `lore.ts` loader

**Files:**
- Create: `public/data/lore.json`
- Create: `src/data/lore.ts`
- Test: `src/test/curriculum.test.ts` (new `describe('lore.json')` block, same file/pattern as the existing data-schema tests)

**Interfaces:**
- Consumes: `JourneyId` type (`1 | 2 | 3`) from `src/lib/types.ts:29`.
- Produces: `LoreData` interface and `loadLore(): Promise<LoreData>` from `src/data/lore.ts`, used by Task 3's `AboutScreen`.

- [ ] **Step 1: Write the failing test**

Add this new `describe` block to `src/test/curriculum.test.ts`, after the existing `describe('story.json', ...)` block. It needs its own import and read, so add near the top of the file (with the other `read<T>(...)` calls at lines 8-12):

```ts
import type { LoreData } from '../data/lore'
```

(add to the existing `import type { ItemsData, Journey, Problem, StoryData } from '../lib/types'` line's neighborhood — as a separate import line, since `LoreData` lives in `src/data/lore.ts`, not `src/lib/types.ts`)

and add, alongside the existing `const items = read<ItemsData>('items')` line:

```ts
const lore = read<LoreData>('lore')
```

then append this new `describe` block at the end of the file:

```ts
describe('lore.json', () => {
  it('has a blurb for all three journeys', () => {
    for (const id of [1, 2, 3] as const) {
      const j = lore.journeys[id]
      expect(j, `lore for journey ${id}`).toBeDefined()
      expect(j.icon.length).toBeGreaterThan(0)
      expect(j.tagline.length).toBeGreaterThan(0)
      expect(j.source.length).toBeGreaterThan(0)
      expect(j.blurb.length).toBeGreaterThan(0)
    }
  })

  it('has at least one core-mechanic explainer', () => {
    expect(lore.mechanics.length).toBeGreaterThan(0)
    for (const m of lore.mechanics) {
      expect(m.icon.length).toBeGreaterThan(0)
      expect(m.name.length).toBeGreaterThan(0)
      expect(m.blurb.length).toBeGreaterThan(0)
    }
  })

  it('has an ordered how-it-works step flow', () => {
    expect(lore.how_it_works.length).toBeGreaterThan(0)
    expect(lore.how_it_works.map((s) => s.step)).toEqual(
      lore.how_it_works.map((_, k) => k + 1),
    )
    for (const s of lore.how_it_works) {
      expect(s.icon.length).toBeGreaterThan(0)
      expect(s.text.length).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/curriculum.test.ts -t "lore.json"`
Expected: FAIL — cannot resolve `../data/lore` (module doesn't exist yet) and `public/data/lore.json` doesn't exist (ENOENT).

- [ ] **Step 3: Create `src/data/lore.ts`**

```ts
import type { JourneyId } from '../lib/types'

export interface LoreJourneyEntry {
  icon: string
  tagline: string
  source: string
  blurb: string
}

export interface LoreMechanic {
  icon: string
  name: string
  blurb: string
}

export interface LoreStep {
  step: number
  icon: string
  text: string
}

export interface LoreData {
  journeys: Record<JourneyId, LoreJourneyEntry>
  mechanics: LoreMechanic[]
  how_it_works: LoreStep[]
}

let cache: Promise<LoreData> | null = null

/** Static About-page copy — separate from loadCurriculum() since it isn't game-state data. */
export function loadLore(): Promise<LoreData> {
  cache ??= fetch(`${import.meta.env.BASE_URL}data/lore.json`).then((res) => {
    if (!res.ok) throw new Error(`Failed to load lore.json: ${res.status}`)
    return res.json() as Promise<LoreData>
  })
  return cache
}
```

- [ ] **Step 4: Create `public/data/lore.json`**

```json
{
  "journeys": {
    "1": {
      "icon": "🗺️",
      "tagline": "Calm-ish teaching waters",
      "source": "NeetCode 150",
      "blurb": "Where every rookie starts — foundational patterns, no clock running."
    },
    "2": {
      "icon": "🌫️",
      "tagline": "Fog everywhere — charts show no patterns",
      "source": "Blind 75 · timed",
      "blurb": "The hint is hidden by default. Solve against the clock or spend an Oracle Fruit to see the pattern."
    },
    "3": {
      "icon": "🕳️",
      "tagline": "The rumored third sea",
      "source": "Hard problems · timed",
      "blurb": "Where the toughest bosses wait. Not for the faint of heart."
    }
  },
  "mechanics": [
    { "icon": "💰", "name": "Bounty (XP)", "blurb": "Earned from every solve. Total bounty sets your level." },
    { "icon": "📈", "name": "Level", "blurb": "Rises automatically as your bounty grows." },
    { "icon": "🔥", "name": "Streak", "blurb": "Consecutive days solved — always derived from your log, never a device counter." },
    { "icon": "⭐", "name": "Star", "blurb": "Earned by beating a timed problem's clock." },
    { "icon": "☠", "name": "Boss fights", "blurb": "Each island ends in a boss problem — the only source of cursed fruit." },
    { "icon": "🗺️", "name": "Map vs List", "blurb": "Toggle between the visual sea chart and a plain keyboard-friendly list." }
  ],
  "how_it_works": [
    { "step": 1, "icon": "🧭", "text": "Pick an island" },
    { "step": 2, "icon": "💻", "text": "Solve the real problem on LeetCode" },
    { "step": 3, "icon": "✅", "text": "Mark it solved here" },
    { "step": 4, "icon": "🏆", "text": "Earn XP, streaks, and loot" }
  ]
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/test/curriculum.test.ts`
Expected: PASS (all tests, including the three new `lore.json` tests)

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add public/data/lore.json src/data/lore.ts src/test/curriculum.test.ts
git commit -m "feat: add lore.json data + loadLore() for About page copy"
```

---

### Task 3: Rewrite `AboutScreen.tsx` as a visual, card-driven page

**Files:**
- Modify: `src/screens/AboutScreen.tsx` (full rewrite)

**Interfaces:**
- Consumes:
  - `loadLore(): Promise<LoreData>` from `src/data/lore.ts` (Task 2)
  - `LoreData` type from `src/data/lore.ts` (Task 2)
  - `useGameStore((s) => s.curriculum)` — existing store selector, `curriculum.journeys[1|2|3].name` and `curriculum.items.items` (each with `.icon`, `.name`, `.effect` per Task 1)
  - `RevealList`, `RevealItem` from `../motion/RevealList` (existing, used identically in `src/components/ItemShelf.tsx`)
- Produces: default-exported `AboutScreen` component, unchanged public interface (no props), still mounted at `/about` via existing router config — no router changes needed.

- [ ] **Step 1: Confirm current behavior before changing it**

Run the app and visually check the existing `/about` page renders (baseline, so the "it still works" check in Step 4 has something to compare against):

Run: `npm run dev`
Visit: `http://localhost:5173/#/about` (adjust port if different)
Expected: current 4-paragraph About page renders with no console errors.

Stop the dev server (Ctrl+C) before continuing.

- [ ] **Step 2: Replace `src/screens/AboutScreen.tsx` in full**

```tsx
import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useGameStore } from '../store/gameStore'
import { loadLore, type LoreData } from '../data/lore'
import { RevealList, RevealItem } from '../motion/RevealList'

const CARD = 'rounded-lg border border-sea-200 dark:border-sea-800 p-4'

export default function AboutScreen() {
  const reduced = useReducedMotion()
  const curriculum = useGameStore((s) => s.curriculum)
  const [lore, setLore] = useState<LoreData | null>(null)

  useEffect(() => {
    void loadLore().then(setLore)
  }, [])

  const reveal = reduced
    ? { initial: { opacity: 1 }, whileInView: { opacity: 1 } }
    : { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 } }
  const sectionProps = { ...reveal, viewport: { once: true, amount: 0.2 }, transition: { duration: 0.4, ease: 'easeOut' as const } }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 text-sm leading-relaxed">
      <div>
        <h1 className="font-display text-2xl font-bold">About The Grand Algorithm</h1>
        <motion.p {...sectionProps} className="mt-3">
          The Grand Algorithm is a pirate-adventure roadmap layered on top of{' '}
          <a href="https://leetcode.com" target="_blank" rel="noopener noreferrer" className="underline">
            LeetCode
          </a>
          . You don't solve problems here — every island node links out to the real problem on LeetCode. This site
          only tracks your progress, XP, streaks, and items once you mark a problem solved.
        </motion.p>
      </div>

      {lore && (
        <motion.section {...sectionProps}>
          <h2 className="mb-3 font-display text-lg font-bold">How it works</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {lore.how_it_works.map((step) => (
              <div key={step.step} className={`${CARD} text-center`}>
                <div className="text-2xl">{step.icon}</div>
                <p className="mt-2 text-xs opacity-80">{step.text}</p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {lore && curriculum && (
        <motion.section {...sectionProps}>
          <h2 className="mb-3 font-display text-lg font-bold">The three seas</h2>
          <RevealList as="div" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {([1, 2, 3] as const).map((id) => {
              const j = lore.journeys[id]
              return (
                <RevealItem key={id} as="div" className={CARD}>
                  <div className="text-2xl">{j.icon}</div>
                  <p className="mt-1 font-medium">{curriculum.journeys[id].name}</p>
                  <p className="text-xs italic opacity-70">{j.tagline}</p>
                  <span className="mt-2 inline-block rounded-full bg-sea-500/10 px-2 py-0.5 text-xs text-sea-700 dark:bg-sea-400/10 dark:text-sea-300">
                    {j.source}
                  </span>
                  <p className="mt-2 text-xs opacity-80">{j.blurb}</p>
                </RevealItem>
              )
            })}
          </RevealList>
        </motion.section>
      )}

      {curriculum && (
        <motion.section {...sectionProps}>
          <h2 className="mb-3 font-display text-lg font-bold">Cursed fruits & loot</h2>
          <RevealList as="div" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {curriculum.items.items.map((item) => (
              <RevealItem key={item.id} as="div" className={CARD}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </div>
                <p className="mt-1 text-xs opacity-80">{item.effect}</p>
              </RevealItem>
            ))}
          </RevealList>
        </motion.section>
      )}

      {lore && (
        <motion.section {...sectionProps}>
          <h2 className="mb-3 font-display text-lg font-bold">Core mechanics</h2>
          <RevealList as="div" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {lore.mechanics.map((m) => (
              <RevealItem key={m.name} as="div" className={CARD}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{m.icon}</span>
                  <span className="font-medium">{m.name}</span>
                </div>
                <p className="mt-1 text-xs opacity-80">{m.blurb}</p>
              </RevealItem>
            ))}
          </RevealList>
        </motion.section>
      )}

      <motion.section {...sectionProps} className="text-xs opacity-70">
        <h2 className="mb-2 font-display text-sm font-bold opacity-90">Fine print</h2>

        <div className="rounded-lg border border-gold-500/50 bg-gold-500/10 p-4">
          <p className="font-medium">Honest coverage statement</p>
          <p className="mt-1 opacity-90">
            The First Sea covers 150 problems (the NeetCode 150 set) and The Blind Sea covers 75 more (the Blind 75
            set) — together roughly all the interview patterns you're likely to be asked about. That is <em>not</em>{' '}
            the same as all ~3,500 problems on LeetCode. Finishing both seas is a strong foundation, not full
            coverage of the platform.
          </p>
        </div>

        <p className="mt-3">
          Curriculum groupings are based on the widely-shared community lists "NeetCode 150" and "Blind 75". This
          project is not affiliated with, endorsed by, or connected to LeetCode, NeetCode, or any individual curator
          of those lists — the names are used only to describe which public, well-known problem sets are covered.
        </p>

        <p className="mt-3">
          The pirate world, characters, and story are original writing made for this project — see the world bible
          in <code>.claude/skills/pirate-lore/SKILL.md</code> if you're curious how it's put together. No
          copyrighted characters, names, or artwork from any existing franchise are used.
        </p>

        <p className="mt-3">
          Guest play works fully offline in your browser. Signing in (optional) syncs your progress across devices
          via Supabase, governed by row-level security so only you can ever read or write your own data.
        </p>
      </motion.section>
    </div>
  )
}
```

- [ ] **Step 3: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors

- [ ] **Step 4: Manual visual check**

Run: `npm run dev`
Visit: `http://localhost:5173/#/about` (adjust port to whatever the dev server prints)

Verify:
- "How it works" shows 4 step cards with icons.
- "The three seas" shows 3 cards — The First Sea 🗺️, The Blind Sea 🌫️, The Abyss 🕳️ — each with a tagline, a source badge, and a blurb.
- "Cursed fruits & loot" shows all 9 items from `items.json` with their icons and effect text (Oracle Fruit 🔮 "Reveal the hidden pattern hint of one problem (once)." among them).
- "Core mechanics" shows 6 cards (Bounty, Level, Streak, Star, Boss fights, Map vs List).
- "Fine print" at the bottom still contains the exact original disclaimer text (Honest coverage statement box, attribution paragraph, no-IP paragraph, guest/sync paragraph), just visually smaller/muted.
- Toggle dark/light theme (🌙/☀️ in the nav) — page remains readable in both.
- No console errors.

Stop the dev server (Ctrl+C) when done.

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: PASS (all existing tests plus the new ones from Tasks 1–2; nothing in `AboutScreen.tsx` breaks other suites since no other file imports it)

- [ ] **Step 6: Commit**

```bash
git add src/screens/AboutScreen.tsx
git commit -m "feat: redesign About page as visual card grid (journeys, fruits, mechanics)"
```

---

## Self-Review Notes

- **Spec coverage:** lore.json shape (Task 2) ✓, items.json icon extension + type (Task 1) ✓, AboutScreen sections in spec order — intro, how-it-works, three seas, fruits/loot, core mechanics, fine print (Task 3) ✓, verbatim disclaimer preserved (Task 3, Step 2) ✓, emoji-only icons (Tasks 1 & 2 data) ✓, reduced-motion respected (Task 3 reuses existing `reveal`/`useReducedMotion` pattern) ✓, no test file added for AboutScreen itself since it's static JSX (schema tests cover the data it depends on) ✓.
- **Type consistency:** `ItemDef.icon` (Task 1) is read as `item.icon` in Task 3's fruits/loot grid — matches. `LoreData.journeys: Record<JourneyId, LoreJourneyEntry>` (Task 2) is indexed with `lore.journeys[id]` for `id` of type `1 | 2 | 3` in Task 3 — matches `JourneyId`. `loadLore()` return type `Promise<LoreData>` matches the `useState<LoreData | null>` + `.then(setLore)` usage in Task 3.
- **Task independence:** Task 1 and Task 2 don't depend on each other and could be done in either order; Task 3 depends on both being complete (it imports `loadLore`/`LoreData` from Task 2 and reads `.icon` from items populated in Task 1).

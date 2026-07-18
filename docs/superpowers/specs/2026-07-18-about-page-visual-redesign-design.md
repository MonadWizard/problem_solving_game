# About page visual redesign

## Problem

The current `AboutScreen` is four paragraphs of plain text: a LeetCode-linkage explainer,
an "honest coverage" disclaimer, an attribution paragraph, a no-copyrighted-IP paragraph,
and a guest/sync paragraph. It never explains the pirate naming (why "The First Sea", "The
Blind Sea", "The Abyss"), never explains what any of the cursed fruits/items actually do, and
never visually walks through the core game loop (XP, level, streak, star, boss fights, map vs
list). Users asked directly what the lore names mean and why the pattern-reveal button only
ever mentions Oracle Fruit — information that exists in code/data but isn't surfaced on the
page meant to explain the platform.

## Goal

Redesign the About page to be visual-first: icon-driven card grids explaining the platform's
loop, the three journeys (seas) and why they're named what they are, and every item's power —
with the existing legal/coverage disclaimer preserved verbatim but de-emphasized to a "Fine
print" section at the bottom.

## Non-goals

- No changes to game mechanics, XP/level/streak formulas, or item drop logic.
- No new illustration/SVG assets — icons are emoji, consistent with the rest of the app
  (🔥 streak, ⭐ star, ☠ logo, 🌙/☀️ theme toggle already use this convention).
- No changes to routing, nav, or other screens.
- Not adding automated tests for this screen (it has none today; it's static content, same
  as the current implementation).

## Data changes (golden rule: content lives in `public/data/*.json`, never hardcoded)

### New file: `public/data/lore.json`

Holds About-page copy that doesn't belong in curriculum/item schemas — journey taglines, core
mechanic explainers, and the "how it works" step flow. Item names/effects already live in
`items.json` and are not duplicated here.

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
    { "icon": "🔥", "name": "Streak", "blurb": "Consecutive days solved — never a device counter, always derived from your log." },
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

### Extend `public/data/items.json`

Add one `icon` field to each of the 9 existing item entries — no other fields change:

| id | icon |
|---|---|
| `rewind_fruit` | ⏪ |
| `oracle_fruit` | 🔮 |
| `haste_fruit` | ⚡ |
| `streak_freeze` | 🧊 |
| `cosmetic_jolly_flag` | 🏴 |
| `cosmetic_lantern` | 🏮 |
| `ship_part_sail` | ⛵ |
| `ship_part_cannon` | 💣 |
| `ship_part_figurehead` | 🐢 |

### `ItemsData` / `Item` type (`src/lib/types.ts`)

Add optional `icon?: string` to the `Item` interface so the new field is typed. Optional
because it's presentational only — nothing in game logic depends on it.

## Code changes

### New: `src/data/lore.ts`

```ts
export interface LoreData {
  journeys: Record<'1' | '2' | '3', { icon: string; tagline: string; source: string; blurb: string }>
  mechanics: { icon: string; name: string; blurb: string }[]
  how_it_works: { step: number; icon: string; text: string }[]
}

let cache: Promise<LoreData> | null = null

export function loadLore(): Promise<LoreData> {
  cache ??= fetch(`${import.meta.env.BASE_URL}data/lore.json`).then((res) => {
    if (!res.ok) throw new Error(`Failed to load lore.json: ${res.status}`)
    return res.json() as Promise<LoreData>
  })
  return cache
}
```

Mirrors the exact `fetchJson` pattern in `src/data/curriculum.ts`, but kept separate from
`loadCurriculum()` — lore is static About-page copy, not part of game-state derivation, and
`Curriculum` is intentionally scoped to what `markSolved`/XP derivation needs.

### Rewrite: `src/screens/AboutScreen.tsx`

- Fetches lore itself: `useEffect` + `useState<LoreData | null>` calling `loadLore()` once on
  mount (matches the lightweight, single-purpose data-fetch pattern already used per-screen
  elsewhere in the app; no need to route through the global Zustand store since this screen
  doesn't need reactive updates).
- Reads items via `useGameStore((s) => s.curriculum)` (already loaded app-wide) for the
  fruits/loot grid — no duplicate fetch.
- Renders, in order:
  1. **Intro** — existing first paragraph, unchanged.
  2. **How it works** — 4-step horizontal flow from `lore.how_it_works`, icon + text per step,
     connected with a simple arrow/divider between steps (wraps to 2x2 on narrow screens).
  3. **The three seas** — 3-card grid, one per journey: `icon`, journey `name` (from
     `curriculum.journeys[id].name`, not duplicated in lore.json), `tagline`, `source` badge,
     `blurb`.
  4. **Cursed fruits & loot** — card grid over `curriculum.items.items`, each showing `icon`,
     `name`, `effect` (both already in items.json — no new copy authored).
  5. **Core mechanics** — icon+name+blurb grid from `lore.mechanics`.
  6. **Fine print** — the existing "Honest coverage statement" box, attribution paragraph,
     no-copyrighted-IP paragraph, and guest/sync paragraph, **verbatim**, under a small
     `<h2>Fine print</h2>`, styled with muted/smaller text (`text-xs opacity-70` container) so
     it visually reads as a footnote rather than the page's main content.
- All new sections reuse the existing `reveal`/`useReducedMotion` fade-up-on-scroll pattern
  already present in the current file, applied per-card via the existing `RevealList`/
  `RevealItem` motion components used in `ItemShelf.tsx` (for stagger) rather than duplicating
  motion boilerplate.
- Card styling reuses existing tokens already used elsewhere: `rounded-lg border
  border-sea-200 dark:border-sea-800 p-4`.
- Loading state: while `lore` is null or `curriculum` is null, render nothing extra beyond the
  intro paragraph (no spinner — this mirrors how `MapScreen` handles its own `!ready` case,
  but About's static intro text can render immediately since it needs no data).

## Testing

No test file exists for `AboutScreen` today and none is being added — this is static
presentational content, consistent with current coverage. `npm run typecheck` and `npm run
lint` must pass; `npm test` must stay green (no game-state logic touched).

## Rollout

Single self-contained change: two data files (one new, one extended), one new tiny loader
module, one type addition, one screen rewrite. No migration concerns (lore.json is new, and
guests/synced users are unaffected since nothing here touches `local` state).

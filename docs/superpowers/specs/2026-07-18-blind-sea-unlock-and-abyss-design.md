# Blind Sea unlock fix + The Abyss (journey 3)

Date: 2026-07-18

## Part A — Unlock The Blind Sea for everyone

Currently `journey2Unlocked(j1, state)` in [src/lib/unlocks.ts](../../../src/lib/unlocks.ts) requires
`journeyComplete(j1, state)` (100% of The First Sea solved). This gate is removed: the Blind Sea is
available from the start, same as The First Sea.

**Changes:**
- `journey2Unlocked` always returns `true`. Keep it as a named export (rather than inlining `true` at the
  call site) so the intent ("Blind Sea has no completion gate") stays documented in code.
- `MapScreen.tsx`: the Blind Sea tab is never `disabled`, drops the 🔒 glyph and the
  "Complete The First Sea to unlock" title tooltip.
- `journeyComplete()` itself is unchanged — still used for ship tier / other completion checks.
- Update `unlocks.test.ts`: the existing assertion `journey2Unlocked(j1, progress()) === false` on an
  empty state becomes `true`; keep (or repurpose) the "all solved" case as a no-op sanity check.

No data, sync, or XP changes. No new tests beyond updating the existing one.

## Part B — The Abyss (journey 3: company-tagged problems)

The Abyss already exists as a disabled, "Coming soon" placeholder tab in `MapScreen.tsx` and is named
in the world bible (`pirate-lore` skill) as "a rumored third sea." This builds it out as a real,
fully-integrated third journey, unlocked for everyone immediately (no gate, matching Part A's spirit).

### Content

- **20 companies** (islands), each named `"<Company> Island"` per the existing island-naming convention:
  Google, Meta, Amazon, Apple, Netflix, Microsoft, Uber, LinkedIn, Bloomberg, Adobe, Salesforce, Oracle,
  ByteDance/TikTok, Airbnb, Goldman Sachs, DoorDash, X/Twitter, Pinterest, Nvidia, Walmart.
- **15 problems per company** (14 regular + 1 boss = last problem, order N, `is_boss: true`, 2× XP),
  mixed easy/medium/hard. **300 problems total.**
- Problems are **real, existing LeetCode problems** (correct slug/title/difficulty/URL), curated from
  public knowledge of commonly-cited company interview questions. This is a **best-effort curated list,
  not a verified real-time "asked between 2020–2026" frequency ranking** — that data is LeetCode's
  proprietary/paywalled "company tag" feature and isn't accessible. This caveat is implementation detail
  only, not player-facing copy.
- A LeetCode slug may legitimately repeat across journeys (e.g. a problem already in The First Sea also
  appears under a company island) — this is fine because XP/solve tracking keys on `(journeyId, slug)`,
  confirmed via `problemKey()` in `src/data/curriculum.ts` and `totalXp()` in `src/lib/xp.ts`. Slugs must
  only be unique *within* journey 3.
- Every problem still carries a `pattern` field (it's a required field on the `Problem` type, not
  optional). Confirmed during planning that `pattern` is *not* Journey-2-specific: `ProblemRow.tsx` and
  `BossCard.tsx` show the "Pattern: … reveal with Oracle Fruit" UI whenever `time_limit_seconds` is
  present, regardless of journey id. Since the Abyss uses timed attempts (below), its problems will show
  this UI too — each problem gets a real topic tag (e.g. "hash map", "two pointers", "dp"), and Oracle
  Fruit / pattern-reveal works on Abyss problems for free, with no new code.
- No story/flavor text (`story.json`) for Abyss islands — out of scope per user decision. `story` lookups
  in `IslandScreen.tsx` are already optional (`story && ...`, `story?.boss_intro ?? ''`), so islands
  render correctly with no story entry.

### Timed attempts (stars)

Abyss reuses the Blind Sea's timed-attempt mechanic to simulate real interview conditions per company:
- Every problem gets `time_limit_seconds`: easy 900, medium 1800, hard 2700 (same tiers as journey 2).
- The existing "Start attempt" → `starred: true` flow (attempt tracked in `ProgressState.attempts`,
  solve within the limit marks the solve row starred) is reused as-is — no new mechanic code needed.
  Confirmed during planning (grepped `gameStore.ts`, `ProblemRow.tsx`, `BossCard.tsx`) that every timed-
  attempt/star/pattern-reveal check keys off `problem.time_limit_seconds !== undefined`, never off
  `journeyId === 2` — the only journey-2-specific code in the whole feature turned out to be the tab
  styling in `MapScreen.tsx` itself, which this design already changes.

### Data file

New `public/data/journey3.json`, same shape as `journey1.json`/`journey2.json`:
```jsonc
{
  "id": 3,
  "name": "The Abyss",
  "islands": [ { "id": "google", "name": "Google Island", "order": 1 }, /* ...20 total */ ],
  "problems": [ {
    "slug": "...", "title": "...", "difficulty": "easy|medium|hard",
    "island_id": "google", "order": 1, "xp": 100, "is_boss": false,
    "leetcode_url": "https://leetcode.com/problems/.../",
    "time_limit_seconds": 900
  } /* ...300 total */ ]
}
```

### Types & unlock logic

- `JourneyId` in `src/lib/types.ts`: `1 | 2` → `1 | 2 | 3`.
- `islandUnlocked()` in `src/lib/unlocks.ts`: currently branches quiz-gating only for `j.id === 1`
  (journey 2 unlocks sequentially by completion, no quiz). Add a third branch so journey 3 islands are
  **always unlocked, no sequential gating** — companies aren't a learning progression, players can jump
  to any company immediately: `if (j.id === 3) return true` before the existing previous-island check.
- No new "journey 3 unlocked" gate function needed — the Abyss tab itself has no prerequisite, so
  `MapScreen.tsx` just always renders it enabled (remove the `cursor-not-allowed`, "Coming soon" title,
  and disabled styling on that tab).

### Wiring

- `src/data/curriculum.ts`: fetch `journey3.json` alongside 1/2 (`fetchJson<Journey>('journey3')`),
  include `c.journeys[3]` wherever `[c.journeys[1], c.journeys[2]]` is iterated (e.g. building the
  slug→problem map).
- `MapScreen.tsx`: tab type becomes `1 | 2 | 3` (drop the separate `'abyss'` string-tab special case);
  the third tab reuses `SeaChart`/`IslandList` exactly like tabs 1/2 (`journey={j3}`), same Map/List view
  toggle applies (currently hidden for the `'abyss'` tab — that special case goes away).

### Sync

No schema migration required — `journey_id` is a plain `smallint` in `supabase/schema.sql`, not
constrained to 1/2. `mergeProgress` and the offline queue are already generic over `(journeyId, slug)`
pairs. After `journey3.json` is added:
1. Run `node scripts/gen-seed.mjs` to regenerate `supabase/seed.sql` with journey-3 rows.
2. Re-run `supabase/seed.sql` in the Supabase SQL editor (upsert, safe to re-run) so the `problems`
   reference table (and its XP triggers) know about the new rows.

### Tests

- `src/test/curriculum.test.ts`: add journey-3 invariants mirroring the existing J1/J2 checks — 20
  islands, 15 problems each (300 total), unique slugs within the journey, every `island_id` exists,
  `order` contiguous per island, boss is always last, every problem has `time_limit_seconds` matching its
  difficulty tier.
- `src/test/unlocks.test.ts`: update the Blind-Sea-always-unlocked assertion (Part A); add a case
  asserting every journey-3 island is unlocked regardless of progress state.
- `npx vitest run src/test/curriculum.test.ts src/test/unlocks.test.ts src/test/merge.test.ts` after data
  + logic changes (merge tests included because journey 3 introduces new `(journeyId, slug)` pairs into
  the property-tested merge space, even though the merge code itself doesn't change).

### Explicitly out of scope

- Story/flavor text per company island.
- Per-company boss "creatures" / narrative (bosses exist mechanically — last problem, 2× XP — but no
  boss-intro copy, since there's no story.json entry).
- Ship tier / title effects (both stay Journey-1-only, unchanged).
- Any UI surfacing of "why these problems for this company" or sourcing methodology (the best-effort
  caveat above is a build note, not player-facing text).

## Addendum (2026-07-18): 100 companies, 50 problems each, role/recency tags

Per explicit user request ("top 100 companies, each company 50 problems... which job title use this").
This **supersedes** the "20 companies / 300 problems / unique-within-journey" numbers above; everything
else in this doc (no gate, no story.json, timed-attempt reuse, `pattern` field requirement, sync story)
still holds.

- **100 companies, 50 problems each (5000 total)**: 16 easy / 24 medium / 10 hard (last hard = boss, 2× XP).
  The original 20 companies keep their exact, already-shipped 15 problems (including the original boss)
  as a subset, re-ordered so the boss lands last at order 50 instead of 15.
- **Slug uniqueness scope changed from journey-wide to per-island.** The original design required slugs
  unique across all of journey 3. At 5000 problems that would require 5000 distinct, correctly-labeled
  real LeetCode problems — infeasible without inventing slugs (the confidently-real, well-known pool tops
  out around 400–450). Real interview question banks also legitimately overlap heavily across companies
  in reality (e.g. "Two Sum" is asked everywhere), so per-island-only uniqueness is arguably the more
  honest model, not just the pragmatic one. `src/test/curriculum.test.ts` now checks journey-3 slugs are
  unique per island; journeys 1 & 2 keep the journey-wide check.
- **New `roles` (string[]) and `recency` (string) fields per problem** — see the curriculum skill's
  journey3.json section for the exact scheme. These are generic, difficulty/domain-derived tags, not
  scraped per-company interview logs — there is no accessible source for that at this scale (same
  proprietary-data caveat as the original design's problem curation).
- **Canonical regeneration**: `scripts/gen-abyss-data.mjs` was rewritten in place (still the source of
  truth, same pattern as `gen-seed.mjs`) — bigger company list, bigger problem pools, the roles/recency
  tagging, and the reuse-aware per-company selection described above. Re-run it after any further Abyss
  data edits; it's idempotent (reads the current `journey3.json` to preserve existing per-company slugs
  before topping up to 50).

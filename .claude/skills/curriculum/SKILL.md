---
name: curriculum
description: Data JSON schemas, validation rules, and XP rules for journey/items/story data
---

# Curriculum Data

All content lives in `public/data/`. Loaded at runtime by `src/data/curriculum.ts` (fetches relative to `import.meta.env.BASE_URL`). Validated by `src/test/curriculum.test.ts` — run it after ANY data edit: `npx vitest run src/test/curriculum.test.ts`.

## journey1.json / journey2.json

```jsonc
{
  "id": 1,                      // 1 = The First Sea (NeetCode 150), 2 = The Blind Sea (Blind 75)
  "name": "The First Sea",
  "islands": [ { "id": "arrays-hashing", "name": "Arrays & Hashing Island", "order": 1 } ],
  "problems": [ {
    "slug": "two-sum",          // REAL LeetCode slug, unique within the journey
    "title": "Two Sum",
    "difficulty": "easy",       // easy | medium | hard
    "island_id": "arrays-hashing",
    "order": 1,                 // contiguous 1..N within its island
    "xp": 100,
    "pattern": "hash map",      // journey 2 stores it but the UI hides it
    "is_boss": false,           // exactly ONE boss per island, always the LAST problem
    "leetcode_url": "https://leetcode.com/problems/two-sum/",
    "time_limit_seconds": 900   // journey 2 ONLY: easy 900, medium 1800, hard 2700
  } ]
}
```

## XP rules (must match `src/lib/xp.ts` and the validation test)

- easy 100, medium 250, hard 500; **boss = 2×** its difficulty value (bake the doubled number into `xp`).
- Level N requires cumulative `N*N*100` XP ⇒ `level = floor(sqrt(totalXp/100))`.
- Event bonuses: `ghost_win` +150, `chest` with refSlug `xp` +50, `haste_bonus` + the problem's xp again.

## Island structure invariants (enforced by tests)

- Journey 1: exactly 16 islands, counts 12,8,8,8,8,10,14,7,9,3,12,8,12,11,8,12 (150 total, the NeetCode 150).
- Journey 2: 8 islands "Blind Isle 1..8", sizes 10,9,9,9,10,9,9,10 (75 total, the Blind 75), topics deliberately mixed.
- Journey 3: exactly 100 islands (one per company), 50 problems each (5000 total, 16 easy/24 medium/10 hard incl. boss).
- Unique slugs per journey for journeys 1 & 2. Journey 3 only requires slugs unique **within an island** —
  real interview problems are legitimately reused across companies, so the same slug may appear on many
  company islands. Every `island_id` exists; `order` contiguous per island; boss last.

## journey3.json — The Abyss (company islands)

Same problem shape as above, plus two illustrative fields (no `time_limit_seconds` gating them out — journey 3
uses the journey-2 time tiers):

```jsonc
{
  "roles": ["SWE II / Mid-Level", "Data / ML Engineer"], // target seniority band(s) for this difficulty,
                                                          // plus one domain-flavor role for the company
  "recency": "classic, evergreen"                        // "classic, evergreen" | "commonly asked"
}
```

These are **generic, difficulty-derived tags** (easy → New Grad/SWE I, medium → SWE II, hard → Senior/Staff,
boss also gets Staff/Principal; domain flavor — fintech/dataml/gaming/infra/hardware/commerce/saas — adds one
extra role to medium/hard problems), not scraped per-company interview logs. There is no public, verifiable
source for "company X asked role Y this problem on date Z" at this scale — don't add specific dated claims
here; keep new entries within this same illustrative scheme. `public/data/journey3.json` was bulk-generated
by a one-off script (not checked in) that reused the curated slug pool from journey1/journey3 plus a
supplemental list of well-known real LeetCode problems, deterministically assigned per company.

Journey 3 companies have **no `story.json` entries** — `IslandScreen` treats story as optional and The Abyss
is intentionally story-free (companies aren't a narrative progression). Don't add story entries for them.

## items.json

`{ "items": [{ id, name, rarity: common|rare|epic, kind: fruit|utility|cosmetic|ship_part, description, effect }], "chest_table": [{ drop, weight }] }`
Item ids in code: `rewind_fruit`, `oracle_fruit`, `haste_fruit`, `streak_freeze`. Chest drops: `xp`, `cosmetic_*`, `ship_part_*`.

## story.json

Per journey-1 island id: `{ "arrival": [3-5 lines, teaches the concept in-world], "boss_intro": "...", "complete": "...", "title": "<player title earned>" }`. Journey 2 isles use `blind-isle-N` keys with shorter entries. Original writing only (see pirate-lore skill).

## Adding data

If the Supabase backend is in use, regenerate the problems seed after any journey edit: `node scripts/gen-seed.mjs` → re-run `supabase/seed.sql` in the SQL editor (upserts, safe to re-run).

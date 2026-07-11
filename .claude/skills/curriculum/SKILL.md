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
- Unique slugs per journey; every `island_id` exists; `order` contiguous per island; boss last.

## items.json

`{ "items": [{ id, name, rarity: common|rare|epic, kind: fruit|utility|cosmetic|ship_part, description, effect }], "chest_table": [{ drop, weight }] }`
Item ids in code: `rewind_fruit`, `oracle_fruit`, `haste_fruit`, `streak_freeze`. Chest drops: `xp`, `cosmetic_*`, `ship_part_*`.

## story.json

Per journey-1 island id: `{ "arrival": [3-5 lines, teaches the concept in-world], "boss_intro": "...", "complete": "...", "title": "<player title earned>" }`. Journey 2 isles use `blind-isle-N` keys with shorter entries. Original writing only (see pirate-lore skill).

## Adding data

If the Supabase backend is in use, regenerate the problems seed after any journey edit: `node scripts/gen-seed.mjs` → re-run `supabase/seed.sql` in the SQL editor (upserts, safe to re-run).

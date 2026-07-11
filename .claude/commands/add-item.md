---
description: Add a bonus item end-to-end (data + effect + drop source + UI)
---

Add a bonus item. Read `.claude/skills/game-design/SKILL.md` (item effects) and `.claude/skills/supabase-sync/SKILL.md` (merge rules) first.

Steps:
1. `public/data/items.json`: add `{id, name, rarity, kind, description, effect}` (original name — pirate-lore rules). Add to `chest_table` or boss drop weights if it drops.
2. Effect wiring: items are counters in `ItemsState` (merged per-key **max** — never make an effect depend on summing counts across devices). Consuming = decrement + usually emit an event (uuid id) so the consumption syncs.
3. UI: `ItemShelf` on the profile renders from items.json automatically; add a "use" handler in `src/store/gameStore.ts` if it's activatable.
4. Tests: extend `src/test/localStore.test.ts` (or the relevant lib test) for the effect; run `npm test`.
5. Commit: `feat: add <item> item`.

$ARGUMENTS

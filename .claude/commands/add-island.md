---
description: Add an island (or problems to one) — JSON edits only, never component code
---

Add an island or problems to a journey. **Data-only change** — read `.claude/skills/curriculum/SKILL.md` first.

Steps:
1. Edit `public/data/journey<1|2>.json`: add the island to `islands` (next `order`) and its problems (real LeetCode slugs, correct difficulty, `xp` from the table — boss ×2, boss LAST with `is_boss: true`, `order` contiguous). Journey 2 problems also need `time_limit_seconds` (900/1800/2700).
2. Add a story.json entry for the island id (arrival 3–5 lines teaching the concept, boss_intro, complete, title) following `.claude/skills/pirate-lore/SKILL.md`.
3. If island counts changed, update the expected counts in `src/test/curriculum.test.ts` (they are intentionally exact).
4. Validate: `npx vitest run src/test/curriculum.test.ts`.
5. If Supabase is live: `node scripts/gen-seed.mjs` and re-run `supabase/seed.sql`.
6. Commit: `content: add <name> island`.

$ARGUMENTS

# The Grand Algorithm

Gamified pirate-adventure DSA roadmap over LeetCode: users sail island-to-island (each island = one concept, NeetCode 150 / Blind 75), mark problems solved on LeetCode, earn XP/levels/streaks/items. Local-first (guests fully offline via localStorage) with Supabase sync once logged in; deployed to GitHub Pages by Actions.

## Golden rules (never break)

1. **Data-driven content**: all curriculum, story, and item content lives in `public/data/*.json`. Components never hardcode content.
2. **No copyrighted IP**: original pirate world only. No One Piece (or other franchise) names, characters, or artwork.
3. **Free tier only**: GitHub Pages, Supabase free tier, optional Cloudflare Worker free tier. Only the Supabase anon key ships to the client.
4. **Guest mode always works**, including when Supabase env vars are missing entirely.
5. **Cross-device resume is sacred**: all game state (XP, level, streak, unlocks, stars, items) is *derived* from synced logs (solves + events + items) — never stored as device-local counters. The merge must stay **idempotent and commutative** (see `.claude/skills/supabase-sync/SKILL.md`); property tests in `src/test/merge.test.ts` enforce this. Never weaken them.
6. **Mobile-first**, dark theme default, reduced-motion respected, keyboard-navigable list alternative to the map.

## Where knowledge lives

- `.claude/skills/curriculum/SKILL.md` — data JSON schemas, validation rules, XP rules
- `.claude/skills/game-design/SKILL.md` — XP/level formulas, streak, items, unlock logic
- `.claude/skills/pirate-lore/SKILL.md` — world bible, tone, naming rules
- `.claude/skills/supabase-sync/SKILL.md` — schema, RLS, merge algorithm, offline queue (the sync bible)
- `.claude/skills/deploy/SKILL.md` — Pages + Actions, base path, hash routing + OAuth callback
- `.claude/specs/architecture.md` — module map, state management, data flow
- `.claude/specs/roadmap.md` — done / next

## Commands

`npm run dev` · `npm run build` · `npm test` (vitest run) · `npm run lint` · `npm run typecheck`

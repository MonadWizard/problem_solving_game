---
description: Release checklist — test, build, push, verify Pages deploy
---

Release the current state to production (GitHub Pages).

1. Clean tree: `git status` — commit or stash everything first.
2. Quality gates (all must pass):
   - `npm run typecheck`
   - `npm run lint`
   - `npm test`
   - `npm run build`
3. Sanity-preview the build: `npm run preview` — check map loads, an island opens, mark-solved works as guest.
4. Push: `git push origin main`.
5. Verify deploy: watch the "Deploy to GitHub Pages" run (`gh run watch`), then open the Pages URL; hard-refresh; confirm login works (OAuth redirect returns to the app) and cloud progress appears.
6. If data changed and Supabase is live: `node scripts/gen-seed.mjs`, run `supabase/seed.sql` in the SQL editor.
7. Update `.claude/specs/roadmap.md` (move shipped items to Done).

$ARGUMENTS

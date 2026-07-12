# The Grand Algorithm

A pirate-adventure roadmap over LeetCode: sail island-to-island (each island teaches one DSA concept), mark problems solved, earn XP/levels/streaks/items. Guests play fully offline in the browser; signing in (optional) syncs progress across devices via Supabase.

Coverage: 150 problems from the NeetCode 150 set (learn mode, "The First Sea") and 75 from the Blind 75 set, shuffled across topics (interview mode, "The Blind Sea"). See `/about` in the app for the honest coverage statement.

## Quick start (guest mode, no setup)

```bash
npm install
npm run dev
```

Open the printed local URL. Guest mode works with zero configuration — everything is local to your browser (`localStorage`).

## Full setup (cross-device sync, auth, leaderboard)

All optional. Skip this section to just run the app as a guest.

### 1. Create a Supabase project

[supabase.com](https://supabase.com) → New project (free tier). From Settings → API, copy the **Project URL** and the **anon public** key — these are the only two values that ever ship to the client; Row Level Security is what actually protects data.

### 2. Run the schema

SQL Editor → paste and run `supabase/schema.sql`, then `supabase/seed.sql`. Full details, including what each RPC/trigger does and why, are in `supabase/SETUP.md`.

### 3. Enable auth providers

Authentication → Providers → enable Google and/or GitHub (each needs its own OAuth app on that provider's side; email/password is on by default as the fallback).

Authentication → URL Configuration → Site URL = your deployed Pages URL **with a trailing slash** (e.g. `https://you.github.io/grand-algorithm/`); add the same to Redirect URLs, plus `http://localhost:5173/` for local dev.

### 4. Local dev env

```bash
cp .env.example .env.local
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

### 5. Deploy

Repo → Settings → Pages → Source = **GitHub Actions** (that's the only manual step; the workflow does the rest).

Repo → Settings → Secrets and variables → Actions → **Variables** tab, add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_VERIFY_WORKER_URL` (optional, see below)
- `VITE_BASE` (optional — only if not deploying to `/grand-algorithm/`, see below)

Push to `main`. The workflow (`.github/workflows/deploy.yml`) installs, typechecks, tests, builds, and deploys to Pages.

## Routing and the Pages base path

- **Hash routing** (`#/island/1/...`): GitHub Pages serves only real files, so a path-based route would 404 on refresh. Hash URLs always load `index.html`. It's also why the Supabase OAuth callback works without a 404-redirect trick — the `?code=` query precedes the `#`, so it's picked up on any route. Full rationale in `.claude/skills/deploy/SKILL.md`.
- **Base path**: project pages serve from `/<repo>/`, so `vite.config.ts` defaults `base` to `/grand-algorithm/`. If your repo has a different name, deploying to a user/org page, or using a custom domain, set the `VITE_BASE` repo variable (`/` for a custom domain or user page).

## Optional: LeetCode verification worker

Off by default — "Mark solved" is honor-system. See `worker/README.md` to deploy the Cloudflare Worker and set `VITE_VERIFY_WORKER_URL`.

## Commands

```
npm run dev         # local dev server
npm run build        # typecheck + production build
npm test              # vitest run
npm run typecheck
npm run lint
```

## Project structure & extending

- `.claude/skills/curriculum/SKILL.md` — data JSON schemas, validation rules, XP rules
- `.claude/skills/game-design/SKILL.md` — XP/level formulas, streak, items, unlock logic
- `.claude/skills/pirate-lore/SKILL.md` — world bible, tone, naming rules
- `.claude/skills/supabase-sync/SKILL.md` — schema, RLS, merge algorithm, offline queue
- `.claude/skills/deploy/SKILL.md` — Pages + Actions, base path, routing/OAuth notes
- `.claude/specs/architecture.md` — module map, state management, data flow
- `.claude/specs/roadmap.md` — done / next
- `.claude/commands/{add-island,add-item,release}.md` — task-specific checklists

## Remaining manual steps after cloning this repo

These cannot be automated from the codebase — they require console/dashboard access:

1. **Supabase**: create the project, run `schema.sql` + `seed.sql`, enable OAuth providers, set redirect URLs (steps 1–3 above). Skip entirely to stay guest-only.
2. **GitHub repo settings**: Settings → Pages → Source = GitHub Actions. Settings → Secrets and variables → Actions → Variables: add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `VITE_VERIFY_WORKER_URL` / `VITE_BASE`.
3. **First push to `main`** triggers the deploy workflow; watch it under the Actions tab.
4. **Optional verification worker**: `cd worker && npx wrangler deploy`, then set `VITE_VERIFY_WORKER_URL` to the printed URL (see `worker/README.md`).

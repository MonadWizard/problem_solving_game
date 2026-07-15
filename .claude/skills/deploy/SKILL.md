---
name: deploy
description: GitHub Pages + Actions deployment, Vite base path, SPA routing choice, OAuth callback notes
---

# Deploy

## Pipeline

`.github/workflows/deploy.yml`: push to `main` → npm ci → typecheck → vitest run → vite build → official Pages flow (`actions/configure-pages` → `actions/upload-pages-artifact` on `dist/` → `actions/deploy-pages`). Requires repo Settings → Pages → Source = **GitHub Actions**, and workflow permissions `pages: write`, `id-token: write`.

## Env

Build-time env comes from repo **Actions variables** (Settings → Secrets and variables → Actions → Variables): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, optional `VITE_VERIFY_WORKER_URL`, optional `VITE_BASE`. All are safe to expose (anon key is public by design). If Supabase vars are missing the app builds and runs in guest-only mode — never break this.

## Base path

Project pages serve from `https://<user>.github.io/<repo>/`, so Vite `base` must be `/<repo>/`. `vite.config.ts` defaults to `/grand-algorithm/` **unless `public/CNAME` exists**, in which case it auto-defaults to `/` (a custom domain serves from its own root) — this detection is load-bearing: a CNAME add/remove with no matching `VITE_BASE` change once shipped a blank site (assets 404ing under `/grand-algorithm/` while served from the domain root). `VITE_BASE` env var still overrides both defaults, needed for a **user/org page** (`<user>.github.io`, no CNAME) which also serves from root. Data fetches must use `import.meta.env.BASE_URL` prefix (curriculum loader does).

## SPA routing: hash router (chosen deliberately)

We use `createHashRouter`. Why, vs the 404.html redirect trick:
- Pages serves only real files; `/island/1/stack` would 404 server-side. Hash URLs (`/#/island/1/stack`) always load `index.html` — zero server config, no flash-redirect hack, survives custom domains unchanged.
- **OAuth compatibility**: Supabase PKCE redirects to `https://site/<base>/?code=...` — query precedes the `#`, so supabase-js `detectSessionInUrl` finds it on any route and the hash router is untouched. With the 404 trick the callback lands on 404.html and the code can be lost on the meta-refresh. This is the main reason.
Trade-off accepted: uglier URLs, no per-route SSR/OG (irrelevant for a logged-in SPA).

## Supabase OAuth redirect URLs (console, manual)

Authentication → URL Configuration: Site URL = the Pages URL **including trailing slash** (e.g. `https://user.github.io/grand-algorithm/`); add the same to Redirect URLs, plus `http://localhost:5173/` for dev. Enable Google + GitHub providers with their own client id/secret (their callback is the `https://<project>.supabase.co/auth/v1/callback` URL, not ours).

## Release checklist

see `.claude/commands/release.md`.

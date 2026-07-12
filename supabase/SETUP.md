# Supabase setup

Free tier is enough for this project. Guest mode works with none of this done — only do it when you want cross-device sync, auth, and the leaderboard.

## 1. Create the project

1. [supabase.com](https://supabase.com) → New project. Note the **Project URL** and the **anon public** API key (Settings → API) — only these two are ever shipped to the client.

## 2. Run the schema

SQL Editor → paste and run `supabase/schema.sql` (tables, RLS policies, XP triggers, merge RPCs, leaderboard functions). Then paste and run `supabase/seed.sql` (generated from the curriculum JSON — regenerate with `node scripts/gen-seed.mjs` whenever an island/problem changes, and re-run it; it's an idempotent upsert).

## 3. Enable auth providers

Authentication → Providers:
- **Google**: create an OAuth client in Google Cloud Console, set the authorized redirect URI to the value Supabase shows on this page, paste client id/secret back into Supabase.
- **GitHub**: same flow via a GitHub OAuth App (Settings → Developer settings → OAuth Apps).
- **Email**: already on by default (used as the fallback).

Authentication → URL Configuration:
- **Site URL**: your Pages URL including trailing slash, e.g. `https://<user>.github.io/grand-algorithm/`.
- **Redirect URLs**: add the same URL, plus `http://localhost:5173/` for local dev.

See `.claude/skills/deploy/SKILL.md` for why the trailing slash and hash-router combination matters for the OAuth callback.

## 4. Repo variables (for CI)

GitHub repo → Settings → Secrets and variables → Actions → **Variables** tab:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_VERIFY_WORKER_URL` (optional, only if you deployed `/worker`)

These are safe to store as plain variables (not secrets) — the anon key is meant to be public; RLS is what actually protects data.

## 5. Verify RLS

Quick sanity check in the SQL editor: `select * from user_progress;` as the `postgres` role will show every row (expected — that's the superuser). What matters is that the **anon**/**authenticated** roles can't cross users; test this from the app by logging in as two different accounts on two browsers and confirming neither sees the other's profile stats or raw rows (the leaderboard functions are the only cross-user reads, and they expose only display_name + xp).

## Local dev

Copy `.env.example` to `.env.local`, fill in the same two values, `npm run dev`. Leave them unset and the app runs fully in guest mode (no login, no sync, no leaderboard) — this must always work.

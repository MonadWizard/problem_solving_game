# LeetCode verification worker (optional)

Off by default — "Mark solved" is honor-system unless you deploy this and set `VITE_VERIFY_WORKER_URL`. Free tier only (Cloudflare Workers free plan: 100,000 requests/day).

## What it does

Proxies LeetCode's public GraphQL API (`recentAcSubmissionList`) so the frontend can check whether a player's recent accepted submissions include the problem they just clicked "Mark solved" on. If the check can't confirm it (network hiccup, username not set, or the problem just isn't in the last 20 ACs), the app quietly falls back to honor-system — it never blocks a solve, only asks for confirmation when it actively finds no match.

## Deploy

```bash
cd worker
npx wrangler deploy
```

This prints a `https://grand-algorithm-verify.<your-subdomain>.workers.dev` URL.

## Wire it up

Set `VITE_VERIFY_WORKER_URL` to that URL:
- Locally: add it to `.env.local`.
- On GitHub Pages: add it as a repo Actions **variable** (Settings → Secrets and variables → Actions → Variables) named `VITE_VERIFY_WORKER_URL`.

Leave it unset to keep verification off — the frontend checks for its presence and skips straight to honor-system if it's missing (see `src/lib/verify.ts`).

## Local test

```bash
cd worker
npx wrangler dev
curl "http://localhost:8787/?username=<a-real-leetcode-username>&slug=two-sum"
```

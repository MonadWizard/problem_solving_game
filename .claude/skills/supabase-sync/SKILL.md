---
name: supabase-sync
description: Supabase schema, RLS policies, merge algorithm, offline queue — the sync bible. Read before touching src/sync/ or supabase/.
---

# Supabase Sync — The Sync Bible

Cross-device resume is the product's hard requirement. Read this fully before changing `src/sync/*`, `src/store/*`, or `supabase/*`.

## Architecture: local-first, cloud-truth-once-logged-in

1. **Guest**: every write goes to the local store only (`src/store/localStore.ts`, key `tga:v1`, versioned).
2. **On login** (`onLogin` in `src/sync/engine.ts`): fetch cloud → `mergeProgress(local, cloud)` → push rows the cloud lacks → render merged.
3. **After login**: write-through — local first (instant UI), then the op is appended to the persisted **offline queue** and flushed in the background.
4. **On app open while logged in**: `reconcileOnOpen` pulls cloud and merges (cloud wins for rows this device lacks).
5. Supabase session persisted (supabase-js default localStorage persistence + PKCE).

## Merge invariants (property-tested in src/test/merge.test.ts — NEVER weaken)

- **Idempotent**: `merge(a, a) ≡ a`; re-running a sync can never change state.
- **Commutative**: `merge(a, b) ≡ merge(b, a)` for solve sets.
- **Never loses** a solved problem: result ⊇ a ∪ b by (journeyId, slug).
- **Never double-counts XP**: XP is *derived* from the merged set, never summed across devices.

Field rules: `solvedAt` = earliest; `starred` = OR; `secondsTaken` = min of non-nulls; events union by client-generated uuid `id`; items per-key **max** (the "cautious cap" — sum would break idempotence).

**Why logs, not counters:** streak, unlocks (quiz_pass events), XP, ghost schedules are all recomputed from solves+events, so any device that has the rows has the exact state. If you add a feature, store its raw fact as a row/event, never a counter.

## Offline queue (`src/sync/queue.ts`)

`QueueOp = solve | event | items | meta`, persisted inside LocalState. Flush on: successful login, app open, `window 'online'`, after each write. Failed ops stay queued (at-least-once). Safe because every push is **idempotent**: solves upsert on PK `(user_id, journey_id, problem_slug)`; events upsert on client uuid; items/meta merged with max/latest.

## Schema (supabase/schema.sql — run in SQL editor, then seed.sql)

- `user_progress(user_id, journey_id, problem_slug, solved_at, seconds_taken, starred)` PK (user_id, journey_id, problem_slug).
- `user_events(id uuid PK, user_id, event_type, ref_slug, happened_at)` — append-only; uuid comes from the client for idempotent retries.
- `user_meta(user_id PK, display_name, leetcode_username, items jsonb, total_xp, updated_at)`.
- `problems(journey_id, slug, xp, difficulty)` — reference data seeded from the journey JSONs (`node scripts/gen-seed.mjs`), so **XP is computed server-side by triggers**; clients cannot forge `total_xp` (a BEFORE UPDATE trigger reverts direct changes).
- RLS on all user tables: users select/insert/update ONLY their own rows (`auth.uid() = user_id`).
- Leaderboards: SECURITY DEFINER functions `leaderboard_alltime()` / `leaderboard_weekly()` returning only `(display_name, xp)` — deliberate deviation from a security-invoker view, which under own-rows RLS would show the caller only; user_id/email never exposed.

## Adding a synced fact — checklist

1. Represent it as a solve field or a new `event_type` (uuid id!). 2. Extend merge if a new field (keep commutative/idempotent; add property test). 3. Add queue op only if a new table. 4. Update triggers if it affects XP. 5. Run `npx vitest run src/test/merge.test.ts src/test/sync.test.ts src/test/queue.test.ts`.

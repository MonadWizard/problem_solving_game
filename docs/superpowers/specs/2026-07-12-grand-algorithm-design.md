# The Grand Algorithm — Design Spec (v2 — Supabase + cross-device resume)

> User-provided master spec, treated as the approved design. Deviations (with reasons) are listed at the bottom.

Build a complete, production-ready, gamified DSA learning website called **The Grand Algorithm** and set up automated deployment to GitHub Pages via GitHub Actions. Before writing any code, create the `.claude/` directory structure described in Section 9 so the project is maintainable and extendable with minimal tokens later.

## 1. Product concept

A pirate-adventure roadmap layered on top of LeetCode. Users do NOT solve problems on our site — every problem node links out to LeetCode. Users mark problems solved; we track progress, XP, levels, streaks, and items. Original pirate world (NO One Piece or any copyrighted characters, names, or artwork — all characters, item names, and art must be original).

Premise: a rookie programmer-pirate sails the Grand Line of problems toward the legendary treasure "The One Solution". Islands are named after the concept they teach (e.g. "Sliding Window Island") so users never memorize invented names.

## 2. Tech stack (all free tier)

- **Frontend**: Vite + React + TypeScript, Tailwind CSS. Single-page app.
- **Hosting**: GitHub Pages, deployed by GitHub Actions on push to `main`.
- **Auth + database**: **Supabase** — Google and GitHub OAuth via supabase-js (PKCE flow) plus email/password as fallback. Postgres with Row Level Security. Only the anon key ships to the client.
- **CROSS-DEVICE RESUME IS A HARD REQUIREMENT**: a logged-in user who opens the site on any other device MUST see their exact journey state — solved problems, XP, level, streak, items, current island, journey 2 stars — after login, with no manual steps. Architecture and tests must prove this (see Section 6).
- **Local working copy**: localStorage-backed store module (versioned schema). Guests can play fully offline/local; login is prompted contextually ("Save your voyage — sign in to sync across devices") and merges local progress into the account.
- **LeetCode verification (optional module, feature-flagged OFF by default)**: a Cloudflare Worker (code included in `/worker`, not auto-deployed) proxying LeetCode GraphQL `recentAcSubmissionList` to verify accepted submissions. Frontend uses it only if `VITE_VERIFY_WORKER_URL` is set; otherwise "Mark solved" is honor-system.
- No paid services anywhere.

## 3. Curriculum data (static JSON in /public/data — data is content, never hardcode in components)

**`journey1.json` — "The First Sea" (NeetCode 150, learn mode)**
16 islands in this order, island id = concept slug, display name = "<Concept> Island":
1. Arrays & Hashing (12) 2. Two Pointers (8) 3. Sliding Window (8) 4. Stack (8) 5. Binary Search (8) 6. Linked List (10) 7. Trees (14) 8. Heap / Priority Queue (7) 9. Backtracking (9) 10. Tries (3) 11. Graphs (12) 12. Advanced Graphs (8) 13. 1-D Dynamic Programming (12) 14. 2-D Dynamic Programming (11) 15. Greedy (8) 16. Intervals & Endgame (12)
NeetCode 150 problem set mapped to these islands. Last problem of each island has `"is_boss": true` (hardest of that island).
Problem schema: `{ slug, title, difficulty, island_id, order, xp, pattern, is_boss, leetcode_url }`. XP: easy 100, medium 250, hard 500, boss ×2.

**`journey2.json` — "The Blind Sea" (Blind 75, interview mode)**
Blind 75 shuffled ACROSS topics into 8 mixed islands ("Blind Isle 1"–"Blind Isle 8", ~9–10 each). Extra field: `time_limit_seconds` (easy 900, medium 1800, hard 2700). Pattern stored but hidden in journey 2 UI. Journey 2 locks until Journey 1 is 100% complete. Timed attempts: "Start attempt" starts countdown; solve within limit = star.

**`items.json`** — Cursed Fruits (rare, from boss wins): Rewind Fruit (retry failed boss timer without losing streak), Oracle Fruit (reveal pattern hint once), Haste Fruit (2× XP for 24h). Treasure chest drops after each solve (random: small XP bonus, cosmetic flag, ship part). Streak Freeze — protects streak for 1 missed day.

**`story.json`** — per-island: 3–5 line arrival story teaching the concept in-world, boss intro line, island-complete line. Original writing, adventure-anime tone.

## 4. Game systems

- **XP & Level**: level derived (never stored client-side as truth); level N requires cumulative `N*N*100` XP. Bounty = total XP, shown as "₿ 12,400".
- **Bounty poster**: profile card with generated SVG avatar, bounty, current title (titles per island cleared). Canvas render + "Download poster" button.
- **Streak**: daily solve streak with streak-freeze support, flame counter. Computed from the solve log (dates), NOT stored as a counter — survives sync/merge.
- **Ship progression**: SVG ship upgrading at milestones (dinghy → sloop → brig → galleon), shown on the map.
- **Map**: sea-chart style SVG, islands as nodes on a winding route, locked islands greyed, animated dotted ship path to next island (respect prefers-reduced-motion). Click island → island screen.
- **Island screen**: ordered problem nodes; each = title, difficulty chip, XP, "Open on LeetCode" (new tab), "Mark solved". Boss node styled dramatically with an HP bar filling as the island's other problems are completed.
- **Pattern gate**: on island completion (journey 1), a 3-question multiple-choice quiz generated from curriculum metadata; must pass to unlock next island.
- **Ghost ship raids (spaced repetition)**: beaten bosses reappear 7/21/60 days later; re-solve grants bonus XP.
- **Leaderboard** (logged-in): weekly + all-time tabs, ranked by XP.

## 5. Supabase schema

Tables `user_progress` (PK user_id, journey_id, problem_slug), `user_events` (append-only), `user_meta` (items jsonb, total_xp maintained server-side by trigger). RLS on all: users select/insert/update ONLY their own rows; user_meta.total_xp not directly updatable by clients. Leaderboard readable by authenticated users; never expose email or user_id.

## 6. Sync architecture (implement exactly)

Local-first with cloud as source of truth once logged in:
1. **Guest mode**: writes go to local store only.
2. **On login**: fetch cloud → merge with local: union of solved rows (upsert on PK), earliest `solved_at` wins per problem, stars OR-ed, items merged cautiously (cap consumables — merge must stay idempotent), XP recomputed server-side from progress rows. Push merged local-only rows up. Render merged state.
3. **After login**: write-through — local first (instant UI), then background upsert to Supabase with an offline retry queue (persisted, flushed on reconnect; upserts idempotent by PK).
4. **On app open while logged in**: pull fresh cloud state and reconcile (cloud wins for rows the device doesn't have).
5. **Session persistence**: Supabase session persisted.

**Required tests (Vitest)**: merge property tests — idempotent, commutative for solve sets, never loses a solved problem, never double-counts XP; offline queue flush produces identical cloud state to online writes. Integration test: device A solves 3 offline → logs in → device B logs in → device B state equals device A state.

## 7. Routes

`/` map (tabs: The First Sea / The Blind Sea locked-until-complete / "The Abyss" coming soon) · `/island/:journeyId/:islandId` · `/profile` (bounty poster, items, stats, export/import progress JSON, connect LeetCode username) · `/leaderboard` · `/about` (honest coverage statement).

## 8. Deployment

- `.github/workflows/deploy.yml`: push to main → install, typecheck, test, build, deploy (configure-pages + upload-pages-artifact + deploy-pages).
- Vite `base` for project pages (`/<repo-name>/`), README note for custom domain (base `/`).
- SPA routing: **hash router** (chosen — see deploy skill for rationale; OAuth `?code=` param precedes the `#` so PKCE callback works on Pages without a 404 trick).
- Env via repo Actions variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VERIFY_WORKER_URL` (optional). Graceful guest-only mode if missing.
- README: full setup (Supabase project, schema.sql, OAuth providers + redirect URLs, repo variables, Pages), local dev, optional Worker guide.

## 9. .claude/ directory (created FIRST)

settings.json; commands: add-island.md, add-item.md, release.md; skills: curriculum, game-design, pirate-lore, supabase-sync, deploy; specs: architecture.md, roadmap.md. Root CLAUDE.md with golden rules.

## 10. Quality bar

TypeScript strict; ESLint; Vitest (XP/level, streak-from-log, full merge/sync suite, quiz generator, curriculum validation). Mobile-first; dark default + light toggle; keyboard-navigable list alternative to map; reduced-motion; alt text. All content in JSON. Logical commits. Finish with full build + list of remaining manual steps.

Build order: `.claude/` + CLAUDE.md → scaffold → data files → local store → map → island screen → progress/XP → streak/items → journey 2 timers → Supabase auth + sync engine + tests → leaderboard → bounty poster → polish → CI/CD.

---

## Approved deviations (engineering decisions within the spec's intent)

1. **Leaderboard via SECURITY DEFINER functions, not a security-invoker view.** RLS on `user_meta` restricts each user to their own row, so a security-invoker view would show only the caller. A definer function returning only `(display_name, total_xp)` satisfies the real requirement: leaderboard visible to authenticated users, email/user_id never exposed.
2. **`problems` reference table in Postgres**, seeded from the curriculum JSON by a generated `supabase/seed.sql`, so the `total_xp` trigger can compute XP server-side (clients cannot forge XP). Weekly leaderboard sums XP of the week's solves via the same table.
3. **Item merge uses per-item `max`, not sum** — the spec's own property tests require idempotent/commutative merging; summing double-counts on re-merge. `max` is the cautious cap.

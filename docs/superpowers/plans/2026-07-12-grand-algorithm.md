# The Grand Algorithm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gamified pirate-themed DSA roadmap over LeetCode with local-first play, Supabase-backed cross-device resume, and GitHub Pages CI/CD.

**Architecture:** Local-first store (versioned localStorage) is the working copy; a pure merge module reconciles it with Supabase (cloud is truth once logged in) via write-through + offline retry queue. All game state (streak, unlocks, XP) is **derived from logs** (solves + events), never stored as counters, so merge is idempotent/commutative. All content lives in `/public/data/*.json`.

**Tech Stack:** Vite + React 18 + TypeScript strict, Tailwind CSS v4, react-router (HashRouter), zustand, @supabase/supabase-js, Vitest + fast-check, ESLint.

## Global Constraints

- Free tier only; only the Supabase **anon** key ships to the client.
- No copyrighted IP (no One Piece names/characters/art) — original pirate world.
- Guest mode must always work, including with Supabase env vars absent.
- Cross-device resume is sacred: unlock/streak/XP state must be derivable from synced rows (solves + events + items), never device-local counters.
- Data-driven: components never hardcode curriculum/story/item content.
- XP: easy 100, medium 250, hard 500; boss = 2× (pre-baked into JSON `xp`).
- Level N requires cumulative `N*N*100` XP ⇒ `level = floor(sqrt(totalXp/100))`.
- TypeScript `strict: true`; mobile-first; dark default + light toggle; prefers-reduced-motion respected; keyboard-navigable list alternative to the SVG map.
- Hash routing (GH Pages SPA + OAuth `?code=` callback compatibility).
- Vite `base: '/<repo>/'` via env `VITE_BASE` fallback `'/grand-algorithm/'`.
- Commit after each task with a clear message.

## Core shared types (source of truth for all tasks)

```ts
// src/lib/types.ts
export type Difficulty = 'easy' | 'medium' | 'hard';
export interface Problem {
  slug: string; title: string; difficulty: Difficulty; island_id: string;
  order: number; xp: number; pattern: string; is_boss: boolean;
  leetcode_url: string; time_limit_seconds?: number;
}
export interface Island { id: string; name: string; order: number }
export interface Journey { id: 1 | 2; name: string; islands: Island[]; problems: Problem[] }

export interface Solve {
  journeyId: 1 | 2; slug: string; solvedAt: string;      // ISO
  secondsTaken: number | null; starred: boolean;
}
export type EventType = 'solve' | 'boss_win' | 'ghost_win' | 'freeze_used' | 'quiz_pass' | 'chest' | 'haste_bonus';
export interface GameEvent { id: string; type: EventType; refSlug: string | null; happenedAt: string }
export type ItemsState = Record<string, number>;         // itemId -> count (cosmetics: 0/1)
export interface ProgressState { solves: Solve[]; events: GameEvent[]; items: ItemsState }
export interface LocalState extends ProgressState {
  version: 1;
  displayName: string | null; leetcodeUsername: string | null;
  hasteUntil: string | null;
  queue: QueueOp[];
}
export type QueueOp =
  | { kind: 'solve'; solve: Solve }
  | { kind: 'event'; event: GameEvent }
  | { kind: 'items'; items: ItemsState }
  | { kind: 'meta'; meta: { displayName?: string; leetcodeUsername?: string } };
```

**Derivation rules (used everywhere):**
- `totalXp = Σ problem.xp over solved slugs (per journey) + Σ event bonuses` (ghost_win +150, chest +50 when refSlug==='xp', haste_bonus + problem.xp again).
- Streak from solve/ghost dates + freeze_used gap-fill; today-missing doesn't break.
- J1 island unlocked ⟺ first island, or previous island 100% solved AND has `quiz_pass` event for previous island id. J2 unlocked ⟺ J1 100%; J2 isles sequential by completion.
- Ship: J1 islands completed 0–3 dinghy, 4–8 sloop, 9–13 brig, 14+ galleon.

---

### Task 1: `.claude/` knowledge base + CLAUDE.md + repo hygiene

**Files:** Create `.claude/settings.json`, `.claude/commands/{add-island,add-item,release}.md`, `.claude/skills/{curriculum,game-design,pirate-lore,supabase-sync,deploy}/SKILL.md`, `.claude/specs/{architecture,roadmap}.md`, `CLAUDE.md`, `.gitignore`.

- [ ] Write all skill files with the real rules from this plan (XP table, level formula, merge invariants, unlock derivations, JSON schemas, hash-router/OAuth rationale, Pages base path). pirate-lore: world bible (Captain Nullptr the mentor, the Compiler King antagonist, "The One Solution" treasure), tone guide, NO-copyrighted-IP rule.
- [ ] CLAUDE.md: summary, golden rules (data-driven; no copyrighted IP; free tier; guest mode always works; never break merge invariants — merge stays idempotent+commutative; mobile-first), pointers to each skill.
- [ ] Commit: `docs: add .claude knowledge base and CLAUDE.md`

### Task 2: Scaffold — Vite + React + TS strict + Tailwind + Vitest + ESLint + HashRouter shell

**Files:** `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/lib/types.ts`, placeholder routes `/, /island/:journeyId/:islandId, /profile, /leaderboard, /about`, `src/test/smoke.test.ts`.

- [ ] `npm create vite@latest . -- --template react-ts`; add tailwindcss + @tailwindcss/vite, react-router, zustand, @supabase/supabase-js, vitest, @testing-library/react, jsdom, fast-check.
- [ ] `vite.config.ts`: `base: process.env.VITE_BASE ?? '/grand-algorithm/'`, tailwind plugin, vitest config (`environment: 'jsdom'`).
- [ ] HashRouter with the 5 routes and a Layout (nav, dark-default theme via `class` on html, light toggle persisted).
- [ ] Verify: `npm run build` and `npx vitest run` pass; commit `chore: scaffold app shell`.

### Task 3: Curriculum + content JSON, loader, validation tests

**Files:** `public/data/journey1.json`, `public/data/journey2.json`, `public/data/items.json`, `public/data/story.json`, `src/data/curriculum.ts` (loader + in-memory index), `src/test/curriculum.test.ts`.

**Journey JSON shape:** `{ "id": 1, "name": "The First Sea", "islands": [{id,name,order}...], "problems": [Problem...] }`.

- [ ] Author journey1.json: all 150 real NeetCode-150 problems, correct slugs/titles/difficulty, mapped to the 16 spec islands with exact counts (12,8,8,8,8,10,14,7,9,3,12,8,12,11,8,12). Math&Geo/Bit problems absorbed into nearest-fit islands and "Intervals & Endgame". Last problem per island `is_boss: true` (a Hard where available), xp doubled. `leetcode_url = https://leetcode.com/problems/<slug>/`.
- [ ] Author journey2.json: the real Blind 75 seeded-shuffled across "Blind Isle 1–8" (sizes 10,9,9,9,10,9,9,10), each problem with `time_limit_seconds` 900/1800/2700 by difficulty; last of each isle is boss.
- [ ] items.json (`{id,name,rarity,kind,description,effect}`): rewind_fruit, oracle_fruit, haste_fruit, streak_freeze, chest table (xp/cosmetic/ship_part weights).
- [ ] story.json: per J1 island `{arrival: string[3-5 lines teaching concept], boss_intro, complete, title}`; J2 isles get short generic lines; original writing.
- [ ] Test (write first): loads both journeys from disk (`fs.readFileSync('public/data/...')`), asserts schema, unique slugs per journey, island ordering contiguous, exact island counts, exactly one boss per island placed last, XP matches difficulty table (boss 2×), every `island_id` exists, J2 has time limits. Verify fail → author data → pass.
- [ ] Commit: `feat: curriculum, items and story data with validation`

### Task 4: Game math libs (TDD): xp.ts, streak.ts, quiz.ts, ghosts.ts, unlocks.ts

**Files:** `src/lib/{xp,streak,quiz,ghosts,unlocks}.ts`, tests per module in `src/test/`.

**Interfaces (produced, relied on by all later tasks):**
```ts
// xp.ts
levelForXp(totalXp: number): number                  // floor(sqrt(xp/100))
xpToNextLevel(totalXp: number): { level: number; current: number; needed: number }
totalXp(state: ProgressState, problemsBySlug: Map<string, Problem>): number
formatBounty(xp: number): string                     // "₿ 12,400"
// streak.ts
computeStreak(events: GameEvent[], now: Date): number  // freeze_used fills gaps; today optional
// quiz.ts
generateQuiz(islandId: string, journey: Journey, seed: number): QuizQuestion[]  // 3 Qs, 4 options, 1 correct-per-island-pattern
// ghosts.ts
dueGhosts(events: GameEvent[], now: Date): { slug: string; wave: 1|2|3 }[]      // 7/21/60d after boss_win, cleared by later ghost_win
// unlocks.ts
islandUnlocked(j: Journey, islandId: string, state: ProgressState): boolean
journey2Unlocked(j1: Journey, state: ProgressState): boolean
islandProgress(j: Journey, islandId: string, state: ProgressState): { solved: number; total: number }
shipTier(j1: Journey, state: ProgressState): 'dinghy'|'sloop'|'brig'|'galleon'
```
- [ ] For each module: failing tests (level boundaries 0/100/400/900; streak with gaps, freezes, today-unsolved; quiz determinism by seed, no duplicate options, correct answer's pattern matches island; ghost waves due/cleared; unlock chains incl. quiz_pass requirement) → implement → pass → commit `feat: core game math`.

### Task 5: Local store (versioned localStorage) + game store

**Files:** `src/store/localStore.ts`, `src/store/gameStore.ts` (zustand), `src/test/localStore.test.ts`.

```ts
// localStore.ts
loadLocal(): LocalState            // migrates/inits versioned 'tga:v1' key; storage failures → in-memory
saveLocal(s: LocalState): void
// gameStore.ts (zustand) — actions ALL write local first, enqueue cloud op second:
markSolved(journeyId, slug, opts?: {secondsTaken?: number; starred?: boolean})
  // idempotent; appends solve + 'solve' event (+boss_win, +chest event w/ deterministic-ish drop, +haste_bonus if active)
passQuiz(islandId); startAttempt(slug); useItem(id); setMeta(...)
```
- [ ] Tests: round-trip, corrupt JSON recovery, markSolved idempotence, boss solve emits boss_win + chest. Implement, pass, commit `feat: local-first store`.

### Task 6: Merge module + property tests (fast-check)

**Files:** `src/sync/merge.ts`, `src/test/merge.test.ts` — THE sync bible; keep pure.

```ts
mergeSolves(a: Solve[], b: Solve[]): Solve[]   // key journey:slug; earliest solvedAt; starred OR; secondsTaken = min non-null
mergeEvents(a: GameEvent[], b: GameEvent[]): GameEvent[]  // union by id
mergeItems(a: ItemsState, b: ItemsState): ItemsState      // per-key max (cautious cap, idempotent)
mergeProgress(a: ProgressState, b: ProgressState): ProgressState
```
- [ ] Property tests (fast-check arbitraries for Solve/GameEvent/Items): `merge(a,a)≡a` (idempotent), `merge(a,b)≡merge(b,a)` (commutative solve sets), `merge` superset: every solved slug in a or b is in result; `totalXp(merge(a,b)) ≤ totalXp(a)+totalXp(b)` and `≥ max` (never double-counts / never loses). Unit: earliest-wins, star OR. Commit `feat: merge engine with property tests`.

### Task 7: Cloud adapter, offline queue, sync engine + integration tests

**Files:** `src/sync/cloud.ts` (CloudAdapter interface + SupabaseCloud), `src/sync/supabaseClient.ts` (null when env missing → guest-only), `src/sync/queue.ts`, `src/sync/engine.ts`, `src/test/{queue,sync}.test.ts` with `FakeCloud`.

```ts
interface CloudAdapter {
  fetchState(): Promise<ProgressState & { meta: { displayName: string|null; leetcodeUsername: string|null; totalXp: number } | null }>
  upsertSolves(s: Solve[]): Promise<void>; insertEvents(e: GameEvent[]): Promise<void>
  upsertItems(items: ItemsState): Promise<void>; upsertMeta(m): Promise<void>
}
flushQueue(state: LocalState, cloud: CloudAdapter): Promise<LocalState>  // at-least-once; op stays on failure
onLogin(local: LocalState, cloud: CloudAdapter): Promise<LocalState>     // fetch → mergeProgress → push local-only diff → return merged
reconcileOnOpen(local, cloud): Promise<LocalState>                       // pull + merge (cloud wins for unseen rows)
```
- [ ] Tests: queue flush after simulated failures ⇒ cloud state identical to always-online run; **integration: device A (own LocalState) solves 3 offline → onLogin(A) → onLogin(fresh device B) ⇒ B's rendered ProgressState deep-equals A's**; re-login idempotent. Engine wires `window 'online'` + app-open reconcile + supabase `onAuthStateChange`. Commit `feat: sync engine with offline queue`.

### Task 8: Supabase backend artifacts

**Files:** `supabase/schema.sql`, `supabase/SETUP.md`, `scripts/gen-seed.mjs` → `supabase/seed.sql`.

- [ ] schema.sql: spec's three tables + `id uuid` PK on user_events + `problems(journey_id, slug, xp, difficulty)` reference table; RLS enable + own-rows policies (user_meta UPDATE policy via trigger-guard: `total_xp` changes rejected unless from trigger — use a BEFORE UPDATE trigger forcing total_xp to old value for non-definer paths); `recompute_total_xp(uid)` + AFTER INSERT triggers on user_progress/user_events (solve xp from problems table; ghost_win +150; chest xp +50; haste_bonus + problem xp); SECURITY DEFINER `leaderboard_alltime()` / `leaderboard_weekly()` returning only (display_name, xp), granted to authenticated.
- [ ] gen-seed.mjs reads both journey JSONs → INSERT ... ON CONFLICT DO UPDATE rows into problems.
- [ ] Commit `feat: supabase schema, RLS, xp triggers, seed generator`.

### Task 9: Auth UI + contextual login prompt

**Files:** `src/auth/AuthProvider.tsx`, `src/components/AuthMenu.tsx`, `src/components/SavePrompt.tsx`.

- [ ] Google + GitHub OAuth (PKCE) + email/password fallback form; session persisted (supabase default); on SIGNED_IN → `onLogin` merge → toast "Voyage synced". Guest banner after 3rd solve: "Save your voyage — sign in to sync across devices." Graceful hidden state when supabase client is null. Commit.

### Task 10: Map screen (journey tabs, SVG sea chart, ship, list alternative)

**Files:** `src/screens/MapScreen.tsx`, `src/components/{SeaChart,ShipSprite,IslandNode,GhostShip}.tsx`.

- [ ] Tabs: The First Sea / The Blind Sea (locked w/ tooltip until J1 100%) / The Abyss (coming soon). Winding SVG route, island nodes (locked grey + lock icon; progress ring), animated dashed path to current island (`@media (prefers-reduced-motion)` disables), ship sprite by `shipTier`, due ghost ships rendered on route. Toggleable accessible `<ol>` list view (default on small screens if map unusable; both keyboard-navigable). Ghost node → confirm fight → LeetCode link + mark re-solved (ghost_win). Commit.

### Task 11: Island screen + boss + pattern-gate quiz + journey-2 timed attempts

**Files:** `src/screens/IslandScreen.tsx`, `src/components/{ProblemRow,BossCard,QuizModal,AttemptTimer,ChestToast}.tsx`.

- [ ] Story arrival panel (story.json), ordered ProblemRows (title, difficulty chip, xp, "Open on LeetCode" new-tab `rel=noopener`, Mark solved w/ undo-less confirm), boss card w/ HP bar = 1 - solvedOthers/total, boss_intro line, dramatic styling. J1 completion → QuizModal (3 Qs, must get all 3; retry allowed; emits quiz_pass). J2: pattern hidden, "Start attempt" → countdown (persist attempt start in localState so refresh keeps it) → mark solved within limit ⇒ starred + star UI; Rewind Fruit offers boss-timer retry w/o streak loss; Oracle Fruit reveals pattern hint. Chest toast after each solve. Commit.

### Task 12: Profile: bounty poster, items, stats, export/import, LeetCode username

**Files:** `src/screens/ProfileScreen.tsx`, `src/components/{BountyPoster,ItemShelf,StatGrid}.tsx`, `src/lib/poster.ts` (SVG avatar gen from name-hash + canvas render + download PNG).

- [ ] Poster: parchment SVG, generated avatar, "WANTED", display name, `formatBounty`, current title (last cleared island's story title), download via canvas. Items with counts + use buttons; stats (level bar, streak flame, solves by difficulty); export/import JSON backup (import = mergeProgress, never overwrite). Commit.

### Task 13: Leaderboard + About

**Files:** `src/screens/{LeaderboardScreen,AboutScreen}.tsx`.

- [ ] Weekly/all-time tabs via `rpc('leaderboard_weekly'|'leaderboard_alltime')`; login-gated with friendly prompt; highlights self by display_name. About: honest coverage statement ("150 problems ≈ all interview patterns; not all 3,500 LeetCode problems"), credits NeetCode/Blind 75 lists, no-affiliation note. Commit.

### Task 14: Verification worker (flagged OFF) 

**Files:** `worker/verify.js`, `worker/wrangler.toml`, `worker/README.md`, `src/lib/verify.ts`.

- [ ] Worker proxies LeetCode GraphQL `recentAcSubmissionList(username, limit:20)` with CORS + small cache. `verify.ts`: only if `VITE_VERIFY_WORKER_URL` set → check slug in recent ACs before honoring "Mark solved" (else honor-system). Commit.

### Task 15: Polish + a11y pass

- [ ] Dark/light audit, focus rings, alt text, aria labels on map nodes, reduced-motion everywhere, mobile layouts, 404 guard route, empty states. `npm run lint`, `tsc --noEmit`, full `vitest run`. Commit.

### Task 16: CI/CD + README + final verification

**Files:** `.github/workflows/deploy.yml`, `README.md`.

- [ ] deploy.yml: push→main: setup-node 22 + npm ci + typecheck + `vitest run` + build (env from repo **vars**) + configure-pages/upload-pages-artifact/deploy-pages, `permissions: pages: write, id-token: write`.
- [ ] README: hash-router rationale, full Supabase setup (project → schema.sql + seed.sql → enable Google/GitHub providers → redirect URLs incl. Pages URL), repo variables, enable Pages (GitHub Actions source), custom-domain base note, local dev, worker guide, manual-steps checklist.
- [ ] Final: full build + tests green; list remaining manual steps in final report. Commit.

## Self-review notes
- Spec coverage checked section-by-section; deviations documented in the spec file (leaderboard definer fns, problems table, item-merge=max).
- Type names consistent across tasks (ProgressState/LocalState/CloudAdapter/GameEvent.id).
- quiz_pass as synced event guarantees cross-device unlock state (spec §2 hard requirement).

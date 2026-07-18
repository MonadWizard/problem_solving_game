# The Abyss expansion — roles/recency UI, harder problems, multi-judge sourcing

Date: 2026-07-18

Builds on `docs/superpowers/specs/2026-07-18-blind-sea-unlock-and-abyss-design.md` (original 20-company
design + its "100 companies, 50 problems, roles/recency" addendum, both already shipped). This spec covers
four independent-but-bundled changes requested together: surfacing the existing `roles`/`recency` fields in
the UI, raising the hard-problem share with design/OOD content, adding a third recency bucket for genuinely
newer problems, and sourcing a slice of hard problems from Codeforces/HackerRank alongside LeetCode.

## 1. Surface roles/recency in the UI

`ProblemRow.tsx` and `BossCard.tsx` currently render title, difficulty badge, XP, and the Oracle-Fruit-gated
pattern line — `problem.roles`/`problem.recency` are never displayed anywhere, even though every journey-3
problem already carries them.

- Add a row of small pills below the title/difficulty/XP line: one pill per `problem.roles` entry, plus one
  recency pill when `problem.recency` is set.
- **Not gated** — always visible, no Oracle Fruit cost. This is prep/context info, not a solving hint, so it
  shouldn't cost an item (unlike `pattern`, which stays gated as-is).
- Renders only when the fields are present, so journeys 1/2 (which never set `roles`/`recency`) are visually
  unchanged.
- Styling: reuse the existing pill pattern (`rounded-full px-2 py-0.5 text-xs`) already used for the
  difficulty badge, in a muted/secondary color so it doesn't compete with difficulty/XP.

## 2. Difficulty rebalance — more hard/advanced problems

Per company: **16 easy / 24 medium / 20 hard** (was 16/24/10), boss still the last hard problem (order 60
instead of 50). **60 problems/company × 100 companies = 6,000 total** (was 5,000). Easy/medium counts are
unchanged — this is additive, not a trim, since the existing pools (135 easy, 174 medium available) already
comfortably cover the unchanged counts and there's no reason to shrink beginner/mid-level coverage to make
room for advanced content.

The existing `HARD` + `HARD_EXTRA` pool has 72 real, correctly-labeled LeetCode hard problems (only 10/company
drawn today, so most of the increase needs no new curation). On top of that pool, add a small **DESIGN_HARD**
pool: real LeetCode problems that are genuinely **Hard** difficulty (not Medium — e.g. NOT LRU Cache or Design
Twitter, which are Medium) and design/OOD-flavored, such as LFU Cache, Design In-Memory File System, Design
Search Autocomplete System, All O`one Data Structure, Design Skiplist. Only entries the implementer can
personally verify are real and correctly labeled Hard go in; when in doubt, drop rather than guess.

Per-company hard-tier composition (20 slots, order doesn't encode this — it's just a selection quota):
roughly 5 from `DESIGN_HARD`, 4 "recently popular" (§3), 3 Codeforces, 3 HackerRank (§4), remainder (~5) from
the existing classic `HARD`/`HARD_EXTRA` pool. Exact split is a selection-algorithm parameter, not a strict
contract — small variance is fine as long as totals reach 20 and slugs stay unique within the company.

## 3. Recency — third bucket

`recency` becomes a 3-value scheme: `"classic, evergreen"` | `"commonly asked"` | `"recently popular"`.
Add a curated `RECENT_MEDIUM`/`RECENT_HARD` pool (~20-25 problems total) of genuinely newer real LeetCode
problems (2022-2025 additions) for the medium/hard tiers only — easy tier stays 100% classic pool, no
"recently popular" easy problems, since beginner prep is inherently canonical. Problems drawn from these
pools get `recency: 'recently popular'` regardless of the existing `ICONIC` classic-evergreen check. Same
caveat as the original scheme (curriculum skill, journey3.json section): generic/illustrative, not a
per-company dated claim — no "Company X asked this in March 2025" copy anywhere.

## 4. Codeforces + HackerRank sourcing

- New optional field on `Problem` (`src/lib/types.ts`): `source?: 'leetcode' | 'codeforces' | 'hackerrank'`.
  Absent means `leetcode` — journeys 1/2 and the untouched majority of journey 3 never set it, so this is a
  zero-touch addition for existing data.
- **`leetcode_url` field name is kept as-is** even when it holds a Codeforces/HackerRank URL (it becomes "the
  external judge URL" in practice for that minority of entries). Renaming would touch 3 data files (150 + 75
  + 6000 entries), `types.ts`, `curriculum.ts`, `ProblemRow.tsx`, `BossCard.tsx`, both gen scripts, and two
  skill docs, for a cosmetic-only win. Accepted as documented debt rather than a rename.
- Curated `CF_HARD`/`HR_HARD` pools (~15-20 entries each), difficulty-mapped from each platform's own rating/
  label (not force-fit to "hard" — e.g. a Codeforces problem only goes in if its actual rating is
  medium/hard-equivalent, a HackerRank problem only if HackerRank itself labels it Medium/Hard). Only
  problems the implementer can confidently verify (correct title, correct URL, correct difficulty per that
  platform's own listing) are included; when unsure, drop rather than guess.
- `recency` for CF/HR entries defaults to `"commonly asked"` (they're established judge staples, not framed
  as "recently popular" unless independently verified as such).
- **UI**: the "Open on LeetCode" button (`ProblemRow.tsx`, `BossCard.tsx`) becomes source-aware: "Open on
  LeetCode" / "Open on Codeforces" / "Open on HackerRank", keyed off `problem.source ?? 'leetcode'`.
- **Verification stays LeetCode-only.** `confirmSolve()` (`src/lib/verify.ts`) is called from `ProblemRow.tsx`
  and `BossCard.tsx` as `confirmSolve(local.leetcodeUsername, problem.slug)`. Add a guard at each call site
  (or inside `confirmSolve` via a new parameter) so verification is skipped — falling straight to the existing
  honor-system `return true` — whenever `problem.source` is `'codeforces'` or `'hackerrank'`. Without this,
  every CF/HR solve would spuriously trigger "we couldn't find this in your recent LeetCode submissions" since
  the worker only ever checks LeetCode's API. No worker/backend changes.

## Data generation

`scripts/gen-abyss-data.mjs` is rewritten in place again (same pattern as its two prior revisions): new pool
arrays (`DESIGN_HARD`, `RECENT_MEDIUM`, `RECENT_HARD`, `CF_HARD`, `HR_HARD`), `HARD_N` raised 10→20, the
per-company hard-tier selection logic extended to draw the §2 quota across pools instead of one flat pick,
`recency()` extended for the new bucket and pool-based override, `toProblem()` extended to emit `source` when
not leetcode. Script stays idempotent (reads existing `journey3.json`, preserves already-shipped per-company
slugs before topping up) — same guarantee as today, extended to top up 50→60 instead of creating from scratch.

After regeneration: run `node scripts/gen-seed.mjs` to refresh `supabase/seed.sql` (confirmed the seed script
only reads `slug`/`xp`/`difficulty`/`journey_id` — `roles`, `recency`, `source`, `pattern` are frontend-only
and need no schema/seed changes).

## Tests & docs

- `src/test/curriculum.test.ts`: journey-3 invariants become 60 problems/company (16/24/20), 6000 total;
  `recency` check accepts the 3-value enum; new check that `source`, when present, is one of
  `leetcode`/`codeforces`/`hackerrank` and `leetcode_url` is still a non-empty string regardless of source.
- `.claude/skills/curriculum/SKILL.md`: update the journey3.json section (60/company, 6000 total, `source`
  field, 3-value recency, brief note on the design/CF/HR sub-pools).
- `npx vitest run src/test/curriculum.test.ts src/test/merge.test.ts` after data changes (merge tests included
  per the existing convention — new `(journeyId, slug)` pairs enter the property-tested merge space even
  though merge logic itself doesn't change).
- No new unlock/XP logic — `islandUnlocked`, `totalXp`, ship tier, etc. are all untouched; hard-problem XP
  (500, boss 1000) and time limit (2700s) already apply uniformly by difficulty regardless of source.

## Explicitly out of scope

- Verified, dated, per-company interview provenance (no public source at this scale — same caveat as the
  original design).
- Renaming `leetcode_url` to a generic field name.
- Per-judge solve verification for Codeforces/HackerRank (stays honor-system, same as LeetCode-without-worker
  today).
- Story/flavor text for Abyss islands (unchanged prior decision — still story-free).
- Changing the original 20 companies' already-shipped easy/medium problems or the original boss slugs — only
  additive (new hard-tier slots) and the roles/recency/pill UI touch them.

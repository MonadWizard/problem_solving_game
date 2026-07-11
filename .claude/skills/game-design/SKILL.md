---
name: game-design
description: XP/level formulas, streak rules, item effects, unlock logic — the game balance bible
---

# Game Design

Implementations live in `src/lib/{xp,streak,quiz,ghosts,unlocks}.ts`; every rule here has a test. All state is derived from logs — see golden rule 5 in CLAUDE.md.

## XP & Level

- Problem XP: easy 100 / medium 250 / hard 500; boss ×2 (pre-baked in JSON).
- `totalXp(state, problemsBySlug)` = Σ xp of solved problems + event bonuses (`ghost_win` +150, `chest` refSlug `xp` +50, `haste_bonus` + problem xp).
- Level N needs cumulative `N*N*100` XP ⇒ `levelForXp = floor(sqrt(xp/100))`. Level 1 at 100, 2 at 400, 3 at 900…
- Bounty = total XP shown as `₿ 12,400` (`formatBounty`).

## Streak (`computeStreak(events, now)`)

- Active days = local-calendar dates of `solve`/`ghost_win`/`boss_win` events.
- Walk back from today: today active or not (today missing does NOT break — streak counts from yesterday); each earlier missing day may be covered by a `freeze_used` event dated that day, else streak ends.
- Streak Freeze item: auto-consumed (with toast) when yesterday is empty, a freeze is owned, and the streak would otherwise break: emit `freeze_used` event dated yesterday + decrement item.

## Items (ids fixed, content in items.json)

- `rewind_fruit` (rare, boss drop): retry a failed journey-2 boss timer without losing streak.
- `oracle_fruit` (rare, boss drop): reveal the pattern hint once (journey 2 hides patterns).
- `haste_fruit` (epic, boss drop): 2× XP for 24h — sets `hasteUntil`; each solve during it emits a `haste_bonus` event (that's what doubles the XP, sync-safely).
- `streak_freeze` (common, chest drop): see streak.
- Chest after every solve: weighted roll from `chest_table` (small XP bonus event, cosmetic flag, ship part).
- Boss win: emits `boss_win` event + rare fruit drop (weighted).

## Unlocks (`unlocks.ts`)

- J1 island unlocked ⟺ first island, OR previous island 100% solved AND `quiz_pass` event exists for the previous island (pattern gate: 3 MCQs from curriculum metadata, need 3/3, retry allowed, seeded by island id).
- Journey 2 unlocked ⟺ Journey 1 100% solved. Blind isles unlock sequentially by completion (no quiz).
- Journey 2 stars: solve marked within `time_limit_seconds` of "Start attempt" ⇒ `starred: true` on the solve row.
- Ship tier by J1 islands completed: 0–3 dinghy, 4–8 sloop, 9–13 brig, 14+ galleon.
- Titles: earned per cleared island, text from story.json `title`; current title = latest cleared island's.

## Ghost ships (spaced repetition, `ghosts.ts`)

Each `boss_win` at time t spawns ghost waves due at t+7d, t+21d, t+60d. A wave is pending if `now >= due` and no `ghost_win` for that slug after its due time. Re-solving grants +150 XP via the `ghost_win` event.

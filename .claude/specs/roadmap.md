# Roadmap

## Done (v1, 2026-07-12)

- Journey 1 "The First Sea" (NeetCode 150, 16 concept islands, pattern-gate quizzes, bosses)
- Journey 2 "The Blind Sea" (Blind 75, 8 mixed isles, timed attempts + stars, locked until J1 100%)
- XP/levels/bounty, streak+freeze, items (cursed fruits, chests, ship parts), ghost-ship raids
- Local-first guest mode; Supabase auth (Google/GitHub/email) + merge sync + offline queue (property-tested)
- Leaderboard (weekly/all-time), bounty poster, export/import backup
- GitHub Pages CI/CD; optional LeetCode verification worker (flag OFF)

## Next

- **The Abyss** (journey 3): candidate content — hard-set (NeetCode All hards) or company-tagged voyages; needs curriculum design first.
- **Verification worker GA**: deploy guide → default ON when `VITE_VERIFY_WORKER_URL` set; add "verified" badge on solves.
- **Bangla i18n**: extract UI strings to a locale file; story.json gains per-locale variants (schema: `{ "en": {...}, "bn": {...} }`).
- Cosmetics actually rendered on ship/poster (ship parts currently collect only).
- PWA/offline caching of data JSONs.

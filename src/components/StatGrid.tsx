import { useGameStore } from '../store/gameStore'
import { totalXp, xpToNextLevel } from '../lib/xp'
import { computeStreak } from '../lib/streak'
import type { Difficulty } from '../lib/types'

export default function StatGrid() {
  const local = useGameStore((s) => s.local)
  const problems = useGameStore((s) => s.problems)
  const curriculum = useGameStore((s) => s.curriculum)
  if (!curriculum) return null

  const xp = totalXp(local, problems)
  const { level, current, needed } = xpToNextLevel(xp)
  const streak = computeStreak(local.events)

  const byDifficulty: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 }
  for (const s of local.solves) {
    const p = problems.get(`${s.journeyId}:${s.slug}`)
    if (p) byDifficulty[p.difficulty]++
  }

  const tiles = [
    { label: `Level (${current}/${needed} XP)`, value: String(level) },
    { label: 'Day streak', value: `🔥 ${streak}` },
    { label: 'Problems solved', value: String(local.solves.length) },
    { label: 'Easy / Medium / Hard', value: `${byDifficulty.easy} / ${byDifficulty.medium} / ${byDifficulty.hard}` },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-lg border border-sea-200 p-3 text-center dark:border-sea-800">
          <p className="text-xl font-bold">{t.value}</p>
          <p className="text-xs opacity-70">{t.label}</p>
        </div>
      ))}
    </div>
  )
}

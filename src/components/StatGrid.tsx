import { motion, useReducedMotion } from 'motion/react'
import { useGameStore } from '../store/gameStore'
import { totalXp, xpToNextLevel } from '../lib/xp'
import { computeStreak } from '../lib/streak'
import type { Difficulty } from '../lib/types'
import AnimatedNumber from '../motion/AnimatedNumber'
import { SPRING_SNAPPY } from '../motion/transitions'

export default function StatGrid() {
  const local = useGameStore((s) => s.local)
  const problems = useGameStore((s) => s.problems)
  const curriculum = useGameStore((s) => s.curriculum)
  const reduced = useReducedMotion()
  if (!curriculum) return null

  const xp = totalXp(local, problems)
  const { level, current, needed } = xpToNextLevel(xp)
  const streak = computeStreak(local.events)

  const byDifficulty: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 }
  for (const s of local.solves) {
    const p = problems.get(`${s.journeyId}:${s.slug}`)
    if (p) byDifficulty[p.difficulty]++
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-lg border border-sea-200 p-3 text-center dark:border-sea-800">
        <p className="text-xl font-bold">
          <AnimatedNumber value={level} />
        </p>
        <p className="text-xs opacity-70">Level</p>
        <div className="mx-auto mt-2 h-1.5 w-full max-w-[6rem] overflow-hidden rounded-full bg-sea-200 dark:bg-sea-800">
          <motion.div
            className="h-full bg-gold-400"
            animate={{ width: `${needed > 0 ? (current / needed) * 100 : 0}%` }}
            transition={reduced ? { duration: 0 } : SPRING_SNAPPY}
          />
        </div>
        <p className="mt-1 text-xs opacity-70">
          {current}/{needed} XP
        </p>
      </div>
      <div className="rounded-lg border border-sea-200 p-3 text-center dark:border-sea-800">
        <p className="text-xl font-bold">
          🔥 <AnimatedNumber value={streak} />
        </p>
        <p className="text-xs opacity-70">Day streak</p>
      </div>
      <div className="rounded-lg border border-sea-200 p-3 text-center dark:border-sea-800">
        <p className="text-xl font-bold">
          <AnimatedNumber value={local.solves.length} />
        </p>
        <p className="text-xs opacity-70">Problems solved</p>
      </div>
      <div className="rounded-lg border border-sea-200 p-3 text-center dark:border-sea-800">
        <p className="text-xl font-bold">
          {byDifficulty.easy} / {byDifficulty.medium} / {byDifficulty.hard}
        </p>
        <p className="text-xs opacity-70">Easy / Medium / Hard</p>
      </div>
    </div>
  )
}

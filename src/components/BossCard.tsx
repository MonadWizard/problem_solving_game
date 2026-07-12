import type { JourneyId, Problem } from '../lib/types'
import { useGameStore } from '../store/gameStore'
import AttemptTimer from './AttemptTimer'

export default function BossCard({
  problem,
  journeyId,
  solved,
  starred,
  bossIntro,
  hpPct,
}: {
  problem: Problem
  journeyId: JourneyId
  solved: boolean
  starred: boolean
  bossIntro: string
  /** 1 = full health, 0 = weakened by every other island problem being solved. */
  hpPct: number
}) {
  const local = useGameStore((s) => s.local)
  const markSolved = useGameStore((s) => s.markSolved)
  const startAttempt = useGameStore((s) => s.startAttempt)
  const rewindAttempt = useGameStore((s) => s.rewindAttempt)
  const revealPattern = useGameStore((s) => s.revealPattern)
  const revealed = useGameStore((s) => s.revealed)

  const key = `${journeyId}:${problem.slug}`
  const timed = problem.time_limit_seconds !== undefined
  const attemptStart = local.attempts[key]
  const isRevealed = revealed.includes(key)
  const overtime =
    !!timed &&
    !!attemptStart &&
    !solved &&
    (Date.now() - Date.parse(attemptStart)) / 1000 > problem.time_limit_seconds!

  return (
    <div className="rounded-xl border-2 border-red-500/50 bg-red-500/5 p-5 dark:bg-red-950/20">
      {bossIntro && <p className="mb-3 text-sm italic opacity-80">{bossIntro}</p>}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold">☠ {problem.title} — Island Boss</h3>
        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold capitalize text-red-700 dark:text-red-400">
          {problem.difficulty} · {problem.xp} XP
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Boss HP"
        aria-valuenow={Math.round(hpPct * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mb-3 h-3 w-full overflow-hidden rounded-full bg-sea-200 dark:bg-sea-800"
      >
        <div className="h-full bg-red-500 transition-[width]" style={{ width: `${hpPct * 100}%` }} />
      </div>
      {timed && (
        <p className="mb-3 text-xs opacity-70">
          Pattern:{' '}
          {isRevealed ? (
            problem.pattern
          ) : (
            <button
              type="button"
              onClick={() => revealPattern(journeyId, problem.slug)}
              disabled={(local.items.oracle_fruit ?? 0) < 1}
              className="underline disabled:no-underline disabled:opacity-50"
            >
              reveal with Oracle Fruit ({local.items.oracle_fruit ?? 0})
            </button>
          )}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {timed &&
          !solved &&
          (attemptStart ? (
            <AttemptTimer startedAt={attemptStart} limitSeconds={problem.time_limit_seconds!} />
          ) : (
            <button
              type="button"
              onClick={() => startAttempt(journeyId, problem.slug)}
              className="rounded border border-sea-300 px-3 py-1.5 text-sm dark:border-sea-600"
            >
              Start attempt
            </button>
          ))}
        {overtime && (local.items.rewind_fruit ?? 0) > 0 && (
          <button
            type="button"
            onClick={() => rewindAttempt(journeyId, problem.slug)}
            className="rounded border border-purple-400 px-3 py-1.5 text-sm text-purple-700 dark:text-purple-300"
          >
            Use Rewind Fruit ({local.items.rewind_fruit}) — retry the clock
          </button>
        )}
        <a
          href={problem.leetcode_url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-sea-300 px-3 py-1.5 text-sm hover:bg-sea-100 dark:border-sea-600 dark:hover:bg-sea-800"
        >
          Open on LeetCode
        </a>
        <button
          type="button"
          disabled={solved}
          onClick={() => markSolved(journeyId, problem.slug)}
          className="rounded bg-gold-500 px-3 py-1.5 text-sm font-semibold text-sea-950 hover:bg-gold-400 disabled:cursor-default disabled:opacity-50"
        >
          {solved ? (starred ? 'Defeated ⭐' : 'Defeated') : 'Mark solved'}
        </button>
      </div>
    </div>
  )
}

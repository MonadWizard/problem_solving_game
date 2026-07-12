import type { JourneyId, Problem } from '../lib/types'
import { useGameStore } from '../store/gameStore'
import { confirmSolve } from '../lib/verify'
import AttemptTimer from './AttemptTimer'

const DIFF_STYLE: Record<Problem['difficulty'], string> = {
  easy: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  medium: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
  hard: 'bg-red-500/20 text-red-700 dark:text-red-400',
}

export default function ProblemRow({
  problem,
  journeyId,
  solved,
  starred,
}: {
  problem: Problem
  journeyId: JourneyId
  solved: boolean
  starred: boolean
}) {
  const local = useGameStore((s) => s.local)
  const markSolved = useGameStore((s) => s.markSolved)
  const startAttempt = useGameStore((s) => s.startAttempt)
  const revealPattern = useGameStore((s) => s.revealPattern)
  const revealed = useGameStore((s) => s.revealed)

  const key = `${journeyId}:${problem.slug}`
  const timed = problem.time_limit_seconds !== undefined
  const attemptStart = local.attempts[key]
  const isRevealed = revealed.includes(key)

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sea-200 px-4 py-3 dark:border-sea-800">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{problem.title}</span>
          {starred && <span aria-label="Solved within the time limit">⭐</span>}
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${DIFF_STYLE[problem.difficulty]}`}>
            {problem.difficulty}
          </span>
          <span className="text-xs opacity-70">{problem.xp} XP</span>
        </div>
        {timed && (
          <p className="text-xs opacity-70">
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
      </div>
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
          onClick={async () => {
            if (await confirmSolve(local.leetcodeUsername, problem.slug)) markSolved(journeyId, problem.slug)
          }}
          className="rounded bg-gold-500 px-3 py-1.5 text-sm font-semibold text-sea-950 hover:bg-gold-400 disabled:cursor-default disabled:opacity-50"
        >
          {solved ? 'Solved' : 'Mark solved'}
        </button>
      </div>
    </li>
  )
}

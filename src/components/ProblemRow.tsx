import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'motion/react'
import type { JourneyId, Problem } from '../lib/types'
import { useGameStore } from '../store/gameStore'
import { confirmSolve } from '../lib/verify'
import AttemptControls from './AttemptControls'
import ParticleBurst from '../motion/ParticleBurst'

const DIFF_STYLE: Record<Problem['difficulty'], string> = {
  easy: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  medium: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
  hard: 'bg-red-500/20 text-red-700 dark:text-red-400',
}

const OPEN_LABEL: Record<'leetcode' | 'codeforces' | 'hackerrank', string> = {
  leetcode: 'Open on LeetCode',
  codeforces: 'Open on Codeforces',
  hackerrank: 'Open on HackerRank',
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
  const revealPattern = useGameStore((s) => s.revealPattern)
  const revealed = useGameStore((s) => s.revealed)
  const reduced = useReducedMotion()

  const key = `${journeyId}:${problem.slug}`
  const timed = problem.time_limit_seconds !== undefined
  const isRevealed = revealed.includes(key)

  const [burst, setBurst] = useState(false)
  const prevSolved = useRef(solved)
  const solveButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!prevSolved.current && solved) {
      setBurst(true)
      if (!reduced && solveButtonRef.current) {
        animate(solveButtonRef.current, { scale: [1, 1.2, 1] }, { duration: 0.4, ease: 'easeOut' })
      }
    }
    prevSolved.current = solved
  }, [solved, reduced])

  return (
    <div className="relative flex flex-col gap-3 rounded-lg border border-sea-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-sea-800">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{problem.title}</span>
          {starred && <span aria-label="Solved within the time limit">⭐</span>}
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${DIFF_STYLE[problem.difficulty]}`}>
            {problem.difficulty}
          </span>
          <span className="text-xs opacity-70">{problem.xp} XP</span>
        </div>
        {(problem.roles?.length || problem.recency) && (
          <div className="flex flex-wrap items-center gap-1">
            {problem.roles?.map((role) => (
              <span
                key={role}
                className="rounded-full bg-sea-500/10 px-2 py-0.5 text-xs text-sea-700 dark:bg-sea-400/10 dark:text-sea-300"
              >
                {role}
              </span>
            ))}
            {problem.recency && (
              <span className="rounded-full bg-sea-500/10 px-2 py-0.5 text-xs text-sea-700 dark:bg-sea-400/10 dark:text-sea-300">
                {problem.recency}
              </span>
            )}
          </div>
        )}
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
        <AttemptControls problem={problem} journeyId={journeyId} solved={solved} />
        <a
          href={problem.leetcode_url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-sea-300 px-3 py-1.5 text-sm hover:bg-sea-100 dark:border-sea-600 dark:hover:bg-sea-800"
        >
          {OPEN_LABEL[problem.source ?? 'leetcode']}
        </a>
        <button
          ref={solveButtonRef}
          type="button"
          disabled={solved}
          onClick={async () => {
            const shouldVerify = !problem.source || problem.source === 'leetcode'
            const proceed = shouldVerify ? await confirmSolve(local.leetcodeUsername, problem.slug) : true
            if (proceed) markSolved(journeyId, problem.slug)
          }}
          className="rounded bg-gold-500 px-3 py-1.5 text-sm font-semibold text-sea-950 transition-transform hover:bg-gold-400 active:scale-95 disabled:cursor-default disabled:opacity-50"
        >
          {solved ? 'Solved' : 'Mark solved'}
        </button>
      </div>
      {burst && <ParticleBurst seed={key} onComplete={() => setBurst(false)} />}
    </div>
  )
}

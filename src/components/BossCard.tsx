import { useEffect, useRef, useState } from 'react'
import { animate, motion, useReducedMotion } from 'motion/react'
import type { JourneyId, Problem } from '../lib/types'
import { useGameStore } from '../store/gameStore'
import { confirmSolve } from '../lib/verify'
import AttemptControls from './AttemptControls'
import ParticleBurst from '../motion/ParticleBurst'
import { SPRING_SNAPPY } from '../motion/transitions'

const OPEN_LABEL: Record<'leetcode' | 'codeforces' | 'hackerrank', string> = {
  leetcode: 'Open on LeetCode',
  codeforces: 'Open on Codeforces',
  hackerrank: 'Open on HackerRank',
}

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
  const rewindAttempt = useGameStore((s) => s.rewindAttempt)
  const revealPattern = useGameStore((s) => s.revealPattern)
  const revealed = useGameStore((s) => s.revealed)
  const reduced = useReducedMotion()

  const key = `${journeyId}:${problem.slug}`
  const timed = problem.time_limit_seconds !== undefined
  const attemptStart = local.attempts[key]
  const pausedAt = local.pausedAttempts[key]
  const isRevealed = revealed.includes(key)
  const overtimeClock = pausedAt ? Date.parse(pausedAt) : Date.now()
  const overtime =
    !!timed &&
    !!attemptStart &&
    !solved &&
    (overtimeClock - Date.parse(attemptStart)) / 1000 > problem.time_limit_seconds!

  const [defeatBurst, setDefeatBurst] = useState(false)
  const prevHpPct = useRef(hpPct)
  const prevSolved = useRef(solved)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!reduced && cardRef.current && hpPct < prevHpPct.current) {
      animate(cardRef.current, { x: [0, -6, 6, -4, 4, 0] }, { duration: 0.4, ease: 'easeOut' })
    }
    prevHpPct.current = hpPct
  }, [hpPct, reduced])

  useEffect(() => {
    if (!prevSolved.current && solved) setDefeatBurst(true)
    prevSolved.current = solved
  }, [solved])

  return (
    <div ref={cardRef} className="relative rounded-xl border-2 border-red-500/50 bg-red-500/5 p-5 dark:bg-red-950/20">
      {defeatBurst && <ParticleBurst seed={key} count={24} onComplete={() => setDefeatBurst(false)} />}
      {bossIntro && <p className="mb-3 text-sm italic opacity-80">{bossIntro}</p>}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold">☠ {problem.title} — Island Boss</h3>
        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold capitalize text-red-700 dark:text-red-400">
          {problem.difficulty} · {problem.xp} XP
        </span>
      </div>
      {(problem.roles?.length || problem.recency) && (
        <div className="mb-3 flex flex-wrap items-center gap-1">
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
      <div
        role="progressbar"
        aria-label="Boss HP"
        aria-valuenow={Math.round(hpPct * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mb-3 h-3 w-full overflow-hidden rounded-full bg-sea-200 dark:bg-sea-800"
      >
        <motion.div
          className="h-full bg-red-500"
          animate={{ width: `${hpPct * 100}%` }}
          transition={reduced ? { duration: 0 } : SPRING_SNAPPY}
        />
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
        <AttemptControls problem={problem} journeyId={journeyId} solved={solved} />
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
          {OPEN_LABEL[problem.source ?? 'leetcode']}
        </a>
        <button
          type="button"
          disabled={solved}
          onClick={async () => {
            const shouldVerify = !problem.source || problem.source === 'leetcode'
            const proceed = shouldVerify ? await confirmSolve(local.leetcodeUsername, problem.slug) : true
            if (proceed) markSolved(journeyId, problem.slug)
          }}
          className="rounded bg-gold-500 px-3 py-1.5 text-sm font-semibold text-sea-950 hover:bg-gold-400 disabled:cursor-default disabled:opacity-50"
        >
          {solved ? (starred ? 'Defeated ⭐' : 'Defeated') : 'Mark solved'}
        </button>
      </div>
    </div>
  )
}

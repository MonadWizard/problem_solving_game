import type { JourneyId, Problem } from '../lib/types'
import { useGameStore } from '../store/gameStore'
import AttemptTimer from './AttemptTimer'

const ICON_BTN =
  'flex h-7 w-7 items-center justify-center rounded border border-sea-300 text-sm leading-none disabled:cursor-default disabled:opacity-30 dark:border-sea-600'

/** Compact play/pause/reset icon cluster for a timed attempt, plus the running clock. */
export default function AttemptControls({
  problem,
  journeyId,
  solved,
}: {
  problem: Problem
  journeyId: JourneyId
  solved: boolean
}) {
  const local = useGameStore((s) => s.local)
  const startAttempt = useGameStore((s) => s.startAttempt)
  const pauseAttempt = useGameStore((s) => s.pauseAttempt)
  const resumeAttempt = useGameStore((s) => s.resumeAttempt)
  const resetAttempt = useGameStore((s) => s.resetAttempt)

  if (problem.time_limit_seconds === undefined || solved) return null

  const key = `${journeyId}:${problem.slug}`
  const startedAt = local.attempts[key]
  const pausedAt = local.pausedAttempts[key]
  const running = !!startedAt && !pausedAt

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label={pausedAt ? 'Resume attempt' : 'Start attempt'}
        title={pausedAt ? 'Resume attempt' : 'Start attempt'}
        disabled={running}
        onClick={() =>
          pausedAt ? resumeAttempt(journeyId, problem.slug) : startAttempt(journeyId, problem.slug)
        }
        className={ICON_BTN}
      >
        ▶
      </button>
      <button
        type="button"
        aria-label="Pause attempt"
        title="Pause attempt"
        disabled={!running}
        onClick={() => pauseAttempt(journeyId, problem.slug)}
        className={ICON_BTN}
      >
        ⏸
      </button>
      <button
        type="button"
        aria-label="Reset attempt"
        title="Reset attempt"
        disabled={!startedAt}
        onClick={() => resetAttempt(journeyId, problem.slug)}
        className={ICON_BTN}
      >
        ↺
      </button>
      {startedAt && (
        <AttemptTimer startedAt={startedAt} limitSeconds={problem.time_limit_seconds} pausedAt={pausedAt} />
      )}
    </div>
  )
}

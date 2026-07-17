import { useEffect, useState } from 'react'

export default function AttemptTimer({
  startedAt,
  limitSeconds,
  pausedAt,
}: {
  startedAt: string
  limitSeconds: number
  /** ISO time the attempt was paused. While set, the clock is frozen. */
  pausedAt?: string
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (pausedAt) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [pausedAt])

  const frozenAt = pausedAt ? Date.parse(pausedAt) : now
  const elapsed = Math.floor((frozenAt - Date.parse(startedAt)) / 1000)
  const remaining = limitSeconds - elapsed
  const overtime = remaining < 0
  const display = Math.abs(remaining)
  const mm = Math.floor(display / 60)
  const ss = display % 60

  return (
    <span
      role="timer"
      aria-live="polite"
      className={`font-mono text-sm ${overtime ? 'font-semibold text-red-600 dark:text-red-400' : ''} ${pausedAt ? 'opacity-60' : ''}`}
    >
      {overtime ? '+' : ''}
      {mm}:{String(ss).padStart(2, '0')}
      {pausedAt && ' ⏸'}
    </span>
  )
}

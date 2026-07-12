import { useEffect, useState } from 'react'

export default function AttemptTimer({ startedAt, limitSeconds }: { startedAt: string; limitSeconds: number }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const elapsed = Math.floor((now - Date.parse(startedAt)) / 1000)
  const remaining = limitSeconds - elapsed
  const overtime = remaining < 0
  const display = Math.abs(remaining)
  const mm = Math.floor(display / 60)
  const ss = display % 60

  return (
    <span
      role="timer"
      aria-live="polite"
      className={`font-mono text-sm ${overtime ? 'font-semibold text-red-600 dark:text-red-400' : ''}`}
    >
      {overtime ? '+' : ''}
      {mm}:{String(ss).padStart(2, '0')}
    </span>
  )
}

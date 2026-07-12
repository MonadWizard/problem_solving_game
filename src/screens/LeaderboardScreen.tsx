import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../sync/supabaseClient'
import { useGameStore } from '../store/gameStore'
import { formatBounty } from '../lib/xp'

interface Row {
  display_name: string
  total_xp: number
}

type Range = 'alltime' | 'weekly'

export default function LeaderboardScreen() {
  const { user, syncAvailable, loading } = useAuth()
  const local = useGameStore((s) => s.local)
  const [range, setRange] = useState<Range>('alltime')
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !supabase) {
      setRows(null)
      return
    }
    let cancelled = false
    setRows(null)
    setError(null)
    supabase
      .rpc(range === 'weekly' ? 'leaderboard_weekly' : 'leaderboard_alltime')
      .then(({ data, error: rpcError }) => {
        if (cancelled) return
        if (rpcError) setError(rpcError.message)
        else setRows((data as Row[] | null) ?? [])
      })
    return () => {
      cancelled = true
    }
  }, [range, user])

  if (!syncAvailable) {
    return (
      <div className="rounded-lg border border-sea-200 p-6 text-center opacity-70 dark:border-sea-800">
        <p>The leaderboard needs sync to be configured for this deployment.</p>
      </div>
    )
  }

  if (loading) return <p className="p-6 text-center opacity-70">Loading…</p>

  if (!user) {
    return (
      <div className="rounded-lg border border-sea-200 p-6 text-center dark:border-sea-800">
        <p className="opacity-80">Sign in to see how your bounty stacks up against other pirates.</p>
      </div>
    )
  }

  return (
    <div>
      <div role="tablist" aria-label="Leaderboard range" className="mb-4 flex gap-2">
        <button
          role="tab"
          aria-selected={range === 'alltime'}
          onClick={() => setRange('alltime')}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            range === 'alltime' ? 'bg-sea-600 text-white' : 'border border-sea-300 dark:border-sea-700'
          }`}
        >
          All-time
        </button>
        <button
          role="tab"
          aria-selected={range === 'weekly'}
          onClick={() => setRange('weekly')}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            range === 'weekly' ? 'bg-sea-600 text-white' : 'border border-sea-300 dark:border-sea-700'
          }`}
        >
          This week
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {!error && rows === null && <p className="text-sm opacity-70">Loading…</p>}
      {rows && rows.length === 0 && (
        <p className="text-sm opacity-70">No bounties posted {range === 'weekly' ? 'this week' : 'yet'}.</p>
      )}
      {rows && rows.length > 0 && (
        <ol className="flex flex-col gap-1">
          {rows.map((r, i) => {
            const isSelf = !!local.displayName && r.display_name === local.displayName
            return (
              <li
                key={i}
                className={`flex items-center justify-between rounded-lg border px-4 py-2 ${
                  isSelf ? 'border-gold-500 bg-gold-500/10' : 'border-sea-200 dark:border-sea-800'
                }`}
              >
                <span>
                  #{i + 1} {r.display_name}
                  {isSelf && ' (you)'}
                </span>
                <span className="font-semibold text-gold-600 dark:text-gold-400">{formatBounty(r.total_xp)}</span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

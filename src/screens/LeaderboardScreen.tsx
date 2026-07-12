import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../sync/supabaseClient'
import { useGameStore } from '../store/gameStore'
import { formatBounty } from '../lib/xp'
import { RevealList, RevealItem } from '../motion/RevealList'

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
  const prevRanks = useRef<Map<string, number>>(new Map())
  const rankChanges = useRef<Map<string, number>>(new Map())

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

  useEffect(() => {
    if (!rows) return
    const changes = new Map<string, number>()
    rows.forEach((r, i) => {
      const prev = prevRanks.current.get(r.display_name)
      if (prev !== undefined && prev !== i) changes.set(r.display_name, prev - i)
    })
    rankChanges.current = changes
    const next = new Map<string, number>()
    rows.forEach((r, i) => next.set(r.display_name, i))
    prevRanks.current = next
  }, [rows])

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
      <div role="tablist" aria-label="Leaderboard range" className="relative mb-4 flex gap-2">
        <button
          role="tab"
          aria-selected={range === 'alltime'}
          onClick={() => setRange('alltime')}
          className={`relative rounded-full px-4 py-2 text-sm font-medium ${
            range === 'alltime' ? 'text-white' : 'border border-sea-300 dark:border-sea-700'
          }`}
        >
          {range === 'alltime' && (
            <motion.span
              layoutId="leaderboard-tab-pill"
              className="absolute inset-0 rounded-full bg-sea-600"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          <span className="relative">All-time</span>
        </button>
        <button
          role="tab"
          aria-selected={range === 'weekly'}
          onClick={() => setRange('weekly')}
          className={`relative rounded-full px-4 py-2 text-sm font-medium ${
            range === 'weekly' ? 'text-white' : 'border border-sea-300 dark:border-sea-700'
          }`}
        >
          {range === 'weekly' && (
            <motion.span
              layoutId="leaderboard-tab-pill"
              className="absolute inset-0 rounded-full bg-sea-600"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          <span className="relative">This week</span>
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
        <RevealList as="ol" className="flex flex-col gap-1">
          {rows.map((r, i) => {
            const isSelf = !!local.displayName && r.display_name === local.displayName
            const change = rankChanges.current.get(r.display_name)
            return (
              <RevealItem
                key={i}
                as="li"
                className={`flex items-center justify-between rounded-lg border px-4 py-2 ${
                  isSelf ? 'self-row-glow border-gold-500 bg-gold-500/10' : 'border-sea-200 dark:border-sea-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  #{i + 1} {r.display_name}
                  {isSelf && ' (you)'}
                  {change !== undefined && change !== 0 && (
                    <span
                      className={change > 0 ? 'text-emerald-500' : 'text-red-500'}
                      aria-label={change > 0 ? `Up ${change} ranks` : `Down ${-change} ranks`}
                    >
                      {change > 0 ? '▲' : '▼'}
                    </span>
                  )}
                </span>
                <span className="font-semibold text-gold-600 dark:text-gold-400">{formatBounty(r.total_xp)}</span>
              </RevealItem>
            )
          })}
        </RevealList>
      )}
    </div>
  )
}

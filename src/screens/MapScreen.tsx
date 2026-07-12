import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { totalXp, xpToNextLevel, formatBounty } from '../lib/xp'
import { computeStreak } from '../lib/streak'
import { journey2Unlocked } from '../lib/unlocks'
import SeaChart from '../components/SeaChart'
import IslandList from '../components/IslandList'

type Tab = 1 | 2 | 'abyss'

function usePersisted<T extends string>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      return (localStorage.getItem(key) as T) || initial
    } catch {
      return initial
    }
  })
  const set = (v: T) => {
    setValue(v)
    try {
      localStorage.setItem(key, v)
    } catch {
      /* storage unavailable */
    }
  }
  return [value, set]
}

export default function MapScreen() {
  const ready = useGameStore((s) => s.ready)
  const curriculum = useGameStore((s) => s.curriculum)
  const problems = useGameStore((s) => s.problems)
  const local = useGameStore((s) => s.local)
  const init = useGameStore((s) => s.init)
  const [tab, setTab] = usePersisted<string>('tga:journeyTab', '1')
  const [view, setView] = usePersisted<'map' | 'list'>('tga:mapView', 'map')

  useEffect(() => {
    if (!ready) void init()
  }, [ready, init])

  if (!ready || !curriculum) {
    return <p className="p-6 text-center opacity-70">Charting the seas…</p>
  }

  const j1 = curriculum.journeys[1]
  const j2 = curriculum.journeys[2]
  const j2Unlocked = journey2Unlocked(j1, local)
  const xp = totalXp(local, problems)
  const { level, current, needed } = xpToNextLevel(xp)
  const streak = computeStreak(local.events)
  const activeTab: Tab = tab === '2' ? 2 : tab === 'abyss' ? 'abyss' : 1

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sea-200 px-4 py-3 dark:border-sea-800">
        <div>
          <p className="font-display text-lg font-bold text-gold-500 dark:text-gold-400">{formatBounty(xp)}</p>
          <p className="text-xs opacity-70">
            Level {level} · {current}/{needed} XP to next level
          </p>
        </div>
        <p className="text-sm" aria-label={`${streak} day streak`}>
          🔥 {streak} day{streak === 1 ? '' : 's'}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Journey" className="flex gap-2">
          <button
            role="tab"
            aria-selected={activeTab === 1}
            onClick={() => setTab('1')}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              activeTab === 1 ? 'bg-sea-600 text-white' : 'border border-sea-300 dark:border-sea-700'
            }`}
          >
            The First Sea
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 2}
            disabled={!j2Unlocked}
            title={j2Unlocked ? undefined : 'Complete The First Sea to unlock'}
            onClick={() => j2Unlocked && setTab('2')}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              activeTab === 2
                ? 'bg-sea-600 text-white'
                : j2Unlocked
                  ? 'border border-sea-300 dark:border-sea-700'
                  : 'cursor-not-allowed border border-sea-200 opacity-50 dark:border-sea-800'
            }`}
          >
            The Blind Sea {!j2Unlocked && '🔒'}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'abyss'}
            onClick={() => setTab('abyss')}
            className="cursor-not-allowed rounded-full border border-sea-200 px-4 py-2 text-sm font-medium opacity-50 dark:border-sea-800"
            title="Coming soon"
          >
            The Abyss
          </button>
        </div>

        {activeTab !== 'abyss' && (
          <div className="flex gap-1 rounded-full border border-sea-300 p-1 text-xs dark:border-sea-700">
            <button
              onClick={() => setView('map')}
              aria-pressed={view === 'map'}
              className={`rounded-full px-3 py-1 ${view === 'map' ? 'bg-sea-600 text-white' : ''}`}
            >
              Map
            </button>
            <button
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              className={`rounded-full px-3 py-1 ${view === 'list' ? 'bg-sea-600 text-white' : ''}`}
            >
              List
            </button>
          </div>
        )}
      </div>

      {activeTab === 'abyss' ? (
        <p className="rounded-lg border border-sea-200 p-6 text-center opacity-70 dark:border-sea-800">
          The Abyss is uncharted. Coming soon.
        </p>
      ) : (
        <div>
          {view === 'map' ? (
            <SeaChart journey={activeTab === 1 ? j1 : j2} j1={j1} state={local} />
          ) : (
            <IslandList journey={activeTab === 1 ? j1 : j2} state={local} />
          )}
        </div>
      )}
    </div>
  )
}

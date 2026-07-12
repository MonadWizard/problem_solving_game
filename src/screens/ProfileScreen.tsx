import { useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { totalXp, xpToNextLevel, formatBounty } from '../lib/xp'
import { completedIslands, shipTier } from '../lib/unlocks'
import BountyPoster from '../components/BountyPoster'
import StatGrid from '../components/StatGrid'
import ItemShelf from '../components/ItemShelf'
import type { ProgressState } from '../lib/types'

function currentTitle(
  curriculum: NonNullable<ReturnType<typeof useGameStore.getState>['curriculum']>,
  local: ReturnType<typeof useGameStore.getState>['local'],
): string {
  const j1Cleared = completedIslands(curriculum.journeys[1], local)
  const j2Cleared = completedIslands(curriculum.journeys[2], local)
  const latest = j2Cleared.length > 0 ? j2Cleared[j2Cleared.length - 1] : j1Cleared.at(-1)
  return latest ? curriculum.story[latest.id]?.title ?? 'Rookie Pirate' : 'Rookie Pirate'
}

function isProgressLike(v: unknown): v is ProgressState {
  if (!v || typeof v !== 'object') return false
  const obj = v as Record<string, unknown>
  return Array.isArray(obj.solves) && Array.isArray(obj.events) && typeof obj.items === 'object'
}

export default function ProfileScreen() {
  const ready = useGameStore((s) => s.ready)
  const curriculum = useGameStore((s) => s.curriculum)
  const problems = useGameStore((s) => s.problems)
  const local = useGameStore((s) => s.local)
  const setMeta = useGameStore((s) => s.setMeta)
  const importProgress = useGameStore((s) => s.importProgress)

  const [name, setName] = useState(local.displayName ?? '')
  const [leetcode, setLeetcode] = useState(local.leetcodeUsername ?? '')
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  if (!ready || !curriculum) {
    return <p className="p-6 text-center opacity-70">Charting the seas…</p>
  }

  const xp = totalXp(local, problems)
  const { level } = xpToNextLevel(xp)
  const tier = shipTier(curriculum.journeys[1], local)
  const title = currentTitle(curriculum, local)

  function exportProgress() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      displayName: local.displayName,
      leetcodeUsername: local.leetcodeUsername,
      solves: local.solves,
      events: local.events,
      items: local.items,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `grand-algorithm-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result))
        if (!isProgressLike(parsed)) throw new Error('not a valid backup file')
        importProgress(parsed)
        setImportMessage('Backup merged into your voyage.')
      } catch {
        setImportMessage('That file could not be read as a Grand Algorithm backup.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">
        <BountyPoster data={{ displayName: local.displayName ?? '', bounty: formatBounty(xp), title, shipTier: tier, level }} />
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setMeta({ displayName: name, leetcodeUsername: leetcode })
          }}
          className="flex w-full max-w-xs flex-col gap-3"
        >
          <label className="flex flex-col gap-1 text-sm">
            Display name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Anonymous Pirate"
              className="rounded border border-sea-300 bg-transparent px-2 py-1 dark:border-sea-600"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            LeetCode username
            <input
              value={leetcode}
              onChange={(e) => setLeetcode(e.target.value)}
              placeholder="your-leetcode-handle"
              className="rounded border border-sea-300 bg-transparent px-2 py-1 dark:border-sea-600"
            />
          </label>
          <button
            type="submit"
            className="self-start rounded bg-sea-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sea-500"
          >
            Save
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Voyage stats</h2>
        <StatGrid />
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Items</h2>
        <ItemShelf />
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Backup</h2>
        <p className="mb-3 text-sm opacity-70">
          Export your progress as a JSON file, or import one to merge it back in (nothing is ever overwritten).
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportProgress}
            className="rounded border border-sea-300 px-3 py-2 text-sm dark:border-sea-600"
          >
            Export progress
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="rounded border border-sea-300 px-3 py-2 text-sm dark:border-sea-600"
          >
            Import progress
          </button>
          <input ref={fileInput} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
        </div>
        {importMessage && <p role="status" className="mt-2 text-sm">{importMessage}</p>}
      </section>
    </div>
  )
}

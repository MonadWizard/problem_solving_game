import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useGameStore } from '../store/gameStore'
import { RevealList, RevealItem } from '../motion/RevealList'

const SEEN_ITEMS_KEY = 'tga:seenItems'

function loadSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_ITEMS_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export default function ItemShelf() {
  const curriculum = useGameStore((s) => s.curriculum)
  const local = useGameStore((s) => s.local)
  const eatHasteFruit = useGameStore((s) => s.eatHasteFruit)
  const reduced = useReducedMotion()
  const seen = useRef<Set<string> | null>(null)
  if (seen.current === null) seen.current = loadSeenIds()

  const owned = curriculum ? curriculum.items.items.filter((i) => (local.items[i.id] ?? 0) > 0) : []
  const ownedIds = owned.map((i) => i.id).join(',')

  useEffect(() => {
    const set = seen.current!
    let changed = false
    for (const id of ownedIds ? ownedIds.split(',') : []) {
      if (!set.has(id)) {
        set.add(id)
        changed = true
      }
    }
    if (changed) {
      try {
        localStorage.setItem(SEEN_ITEMS_KEY, JSON.stringify([...set]))
      } catch {
        /* storage unavailable */
      }
    }
  }, [ownedIds])

  if (!curriculum) return null

  const hasteActive = !!local.hasteUntil && Date.parse(local.hasteUntil) > Date.now()

  if (owned.length === 0) {
    return <p className="text-sm opacity-70">No items yet — solve problems and defeat bosses to find some.</p>
  }

  return (
    <RevealList as="ul" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {owned.map((item) => {
        const isNew = !seen.current!.has(item.id)
        return (
          <RevealItem key={item.id} as="li" className="relative overflow-hidden rounded-lg border border-sea-200 p-3 dark:border-sea-800">
            {isNew && !reduced && (
              <motion.div
                className="pointer-events-none absolute inset-0 z-10"
                style={{
                  background: 'linear-gradient(115deg, transparent 40%, rgba(238,193,79,0.55) 50%, transparent 60%)',
                }}
                initial={{ x: '-120%' }}
                animate={{ x: '120%' }}
                transition={{ duration: 1, ease: 'easeInOut' }}
              />
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{item.name}</span>
              <span className="shrink-0 text-xs opacity-70">×{local.items[item.id]}</span>
            </div>
            <p className="mt-1 text-xs opacity-70">{item.effect}</p>
            {item.id === 'haste_fruit' && (
              <button
                type="button"
                onClick={() => eatHasteFruit()}
                disabled={hasteActive}
                className="mt-2 rounded border border-gold-500 px-2 py-1 text-xs font-medium text-gold-600 disabled:opacity-50 dark:text-gold-400"
              >
                {hasteActive ? 'Active!' : 'Eat now (2× XP for 24h)'}
              </button>
            )}
          </RevealItem>
        )
      })}
    </RevealList>
  )
}

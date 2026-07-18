import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useGameStore } from '../store/gameStore'
import { SHIP_TIER_LABEL } from '../lib/unlocks'
import ParticleBurst from '../motion/ParticleBurst'
import { SPRING_BOUNCY } from '../motion/transitions'

const RARITY_LABEL: Record<string, string> = { common: '', rare: '✨ Rare!', epic: '🌟 Epic!' }

export default function ChestToast() {
  const lastChest = useGameStore((s) => s.lastChest)
  const lastBossDrop = useGameStore((s) => s.lastBossDrop)
  const lastShipTierUp = useGameStore((s) => s.lastShipTierUp)
  const curriculum = useGameStore((s) => s.curriculum)
  const dismissChest = useGameStore((s) => s.dismissChest)

  const showing = (!!lastChest || !!lastBossDrop || !!lastShipTierUp) && !!curriculum

  useEffect(() => {
    if (!showing) return
    const t = setTimeout(dismissChest, 5000)
    return () => clearTimeout(t)
  }, [showing, dismissChest])

  const chestItem =
    showing && lastChest && lastChest !== 'xp' ? curriculum!.items.items.find((i) => i.id === lastChest) : null
  const bossItem = showing && lastBossDrop ? curriculum!.items.items.find((i) => i.id === lastBossDrop) : null
  const shipLabel = showing && lastShipTierUp ? SHIP_TIER_LABEL[lastShipTierUp] : null

  return (
    <AnimatePresence>
      {showing && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 40, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          transition={SPRING_BOUNCY}
          className="fixed bottom-4 left-1/2 z-40 w-full max-w-sm rounded-lg border border-gold-500/60 bg-parchment p-4 text-sea-950 shadow-xl dark:bg-sea-900 dark:text-sea-50"
        >
          <ParticleBurst seed={String(lastChest ?? lastBossDrop ?? lastShipTierUp)} />
          <button
            type="button"
            onClick={dismissChest}
            aria-label="Dismiss"
            className="float-right rounded px-1 hover:bg-black/5 dark:hover:bg-white/10"
          >
            ✕
          </button>
          {lastChest === 'xp' && <p className="text-sm">📦 Treasure chest: +50 bonus XP!</p>}
          {chestItem && (
            <p className="text-sm">
              📦 Treasure chest: <strong>{chestItem.name}</strong> — {chestItem.effect}
            </p>
          )}
          {bossItem && (
            <p className="mt-1 text-sm">
              {RARITY_LABEL[bossItem.rarity]} Boss drop: <strong>{bossItem.name}</strong> — {bossItem.effect}
            </p>
          )}
          {shipLabel && (
            <p className="mt-1 text-sm">
              ⛵ Your ship is now a <strong>{shipLabel}</strong>!
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

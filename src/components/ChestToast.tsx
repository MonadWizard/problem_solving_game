import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

const RARITY_LABEL: Record<string, string> = { common: '', rare: '✨ Rare!', epic: '🌟 Epic!' }

export default function ChestToast() {
  const lastChest = useGameStore((s) => s.lastChest)
  const lastBossDrop = useGameStore((s) => s.lastBossDrop)
  const curriculum = useGameStore((s) => s.curriculum)
  const dismissChest = useGameStore((s) => s.dismissChest)

  useEffect(() => {
    if (!lastChest && !lastBossDrop) return
    const t = setTimeout(dismissChest, 5000)
    return () => clearTimeout(t)
  }, [lastChest, lastBossDrop, dismissChest])

  if ((!lastChest && !lastBossDrop) || !curriculum) return null

  const chestItem = lastChest && lastChest !== 'xp' ? curriculum.items.items.find((i) => i.id === lastChest) : null
  const bossItem = lastBossDrop ? curriculum.items.items.find((i) => i.id === lastBossDrop) : null

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-40 w-full max-w-sm -translate-x-1/2 rounded-lg border border-gold-500/60 bg-parchment p-4 text-sea-950 shadow-xl dark:bg-sea-900 dark:text-sea-50"
    >
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
    </div>
  )
}

import { useGameStore } from '../store/gameStore'

export default function ItemShelf() {
  const curriculum = useGameStore((s) => s.curriculum)
  const local = useGameStore((s) => s.local)
  const eatHasteFruit = useGameStore((s) => s.eatHasteFruit)
  if (!curriculum) return null

  const owned = curriculum.items.items.filter((i) => (local.items[i.id] ?? 0) > 0)
  const hasteActive = !!local.hasteUntil && Date.parse(local.hasteUntil) > Date.now()

  if (owned.length === 0) {
    return <p className="text-sm opacity-70">No items yet — solve problems and defeat bosses to find some.</p>
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {owned.map((item) => (
        <li key={item.id} className="rounded-lg border border-sea-200 p-3 dark:border-sea-800">
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
        </li>
      ))}
    </ul>
  )
}

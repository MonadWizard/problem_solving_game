import { Link } from 'react-router-dom'
import type { Journey, ProgressState } from '../lib/types'
import { islandComplete, islandProgress, islandUnlocked } from '../lib/unlocks'

/** Keyboard-navigable, screen-reader-friendly alternative to the SVG sea chart. */
export default function IslandList({ journey, state }: { journey: Journey; state: ProgressState }) {
  const islands = [...journey.islands].sort((a, b) => a.order - b.order)

  return (
    <ol className="flex flex-col gap-2">
      {islands.map((island) => {
        const unlocked = islandUnlocked(journey, island.id, state)
        const complete = islandComplete(journey, island.id, state)
        const { solved, total } = islandProgress(journey, island.id, state)

        const body = (
          <div
            className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
              complete
                ? 'border-gold-500/60 bg-gold-500/10'
                : unlocked
                  ? 'border-sea-300 hover:bg-sea-100 dark:border-sea-700 dark:hover:bg-sea-800'
                  : 'border-sea-200 opacity-60 dark:border-sea-800'
            }`}
          >
            <span className="font-medium">{island.name}</span>
            <span className="text-sm">
              {unlocked ? (complete ? '★ Complete' : `${solved} / ${total}`) : '🔒 Locked'}
            </span>
          </div>
        )

        return (
          <li key={island.id}>
            {unlocked ? (
              <Link
                to={`/island/${journey.id}/${island.id}`}
                className="block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400"
              >
                {body}
              </Link>
            ) : (
              <div aria-disabled="true">{body}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

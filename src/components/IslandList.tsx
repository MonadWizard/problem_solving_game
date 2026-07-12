import { Link } from 'react-router-dom'
import type { Journey, ProgressState } from '../lib/types'
import { islandComplete, islandProgress, islandUnlocked } from '../lib/unlocks'
import { RevealList, RevealItem } from '../motion/RevealList'

/** Keyboard-navigable, screen-reader-friendly alternative to the SVG sea chart. */
export default function IslandList({ journey, state }: { journey: Journey; state: ProgressState }) {
  const islands = [...journey.islands].sort((a, b) => a.order - b.order)

  return (
    <RevealList as="ol" className="flex flex-col gap-2">
      {islands.map((island) => {
        const unlocked = islandUnlocked(journey, island.id, state)
        const complete = islandComplete(journey, island.id, state)
        const { solved, total } = islandProgress(journey, island.id, state)

        const body = (
          <div
            className={`relative flex items-center justify-between overflow-hidden rounded-lg border px-4 py-3 ${
              complete
                ? 'border-gold-500/60 bg-gold-500/10'
                : unlocked
                  ? 'border-sea-300 hover:bg-sea-100 dark:border-sea-700 dark:hover:bg-sea-800'
                  : 'border-sea-200 opacity-60 dark:border-sea-800'
            }`}
          >
            {complete && (
              <div
                className="pointer-events-none absolute inset-0 opacity-15"
                style={{ filter: 'url(#parchment-grain)', backgroundColor: 'var(--color-parchment)' }}
                aria-hidden
              />
            )}
            <span className="relative font-medium">{island.name}</span>
            <span className="relative text-sm">
              {unlocked ? (complete ? '★ Complete' : `${solved} / ${total}`) : '🔒 Locked'}
            </span>
          </div>
        )

        return (
          <RevealItem key={island.id} as="li">
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
          </RevealItem>
        )
      })}
    </RevealList>
  )
}

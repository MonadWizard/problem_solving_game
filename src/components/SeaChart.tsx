import type { Journey, Problem, ProgressState } from '../lib/types'
import { dueGhosts } from '../lib/ghosts'
import { currentIsland, islandComplete, islandProgress, islandUnlocked, shipTier } from '../lib/unlocks'
import { pathHeight, snakeLayout, toPixels } from '../lib/layout'
import IslandNode from './IslandNode'
import ShipSprite from './ShipSprite'
import GhostShip from './GhostShip'

const COLS_PER_ROW = 4
const ROW_HEIGHT = 150
const VIEW_WIDTH = 800

export default function SeaChart({
  journey,
  j1,
  state,
}: {
  journey: Journey
  /** Journey 1, needed for ship-tier progression even while viewing Journey 2. */
  j1: Journey
  state: ProgressState
}) {
  const islands = [...journey.islands].sort((a, b) => a.order - b.order)
  const grid = snakeLayout(islands.length, COLS_PER_ROW)
  const points = toPixels(grid, COLS_PER_ROW, VIEW_WIDTH, ROW_HEIGHT)
  const height = pathHeight(islands.length, COLS_PER_ROW, ROW_HEIGHT)

  const current = currentIsland(journey, state)
  const currentIndex = current ? islands.findIndex((i) => i.id === current.id) : islands.length - 1
  const shipPoint = points[Math.max(0, currentIndex)] ?? points[0]

  const bossBySlug = new Map<string, Problem>()
  for (const p of journey.problems) if (p.is_boss) bossBySlug.set(p.slug, p)
  const ghosts = dueGhosts(state.events).filter((g) => bossBySlug.has(g.slug))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
      className="w-full text-sea-900 dark:text-sea-100"
      role="img"
      aria-label={`${journey.name} route map`}
    >
      <path d={pathD} fill="none" stroke="currentColor" strokeOpacity={0.5} strokeWidth={3} strokeLinejoin="round" />
      <path
        d={pathD}
        fill="none"
        stroke="#eec14f"
        strokeWidth={2}
        strokeLinejoin="round"
        className="route-dash"
      />

      {islands.map((island, i) => {
        const unlocked = islandUnlocked(journey, island.id, state)
        const complete = islandComplete(journey, island.id, state)
        const { solved, total } = islandProgress(journey, island.id, state)
        return (
          <IslandNode
            key={island.id}
            island={island}
            journeyId={journey.id}
            x={points[i].x}
            y={points[i].y}
            unlocked={unlocked}
            complete={complete}
            solved={solved}
            total={total}
            isCurrent={current?.id === island.id}
          />
        )
      })}

      {ghosts.map((g) => {
        const idx = islands.findIndex((i) => i.id === bossBySlug.get(g.slug)!.island_id)
        if (idx === -1) return null
        const p = points[idx]
        return (
          <GhostShip key={g.slug} problem={bossBySlug.get(g.slug)!} wave={g.wave} x={p.x + 26} y={p.y - 26} />
        )
      })}

      <g transform={`translate(${shipPoint.x} ${shipPoint.y - 34})`}>
        <ShipSprite tier={shipTier(j1, state)} />
      </g>
    </svg>
  )
}

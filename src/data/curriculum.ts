import type { ItemsData, Journey, JourneyId, Problem, StoryData } from '../lib/types'

export interface Curriculum {
  journeys: Record<JourneyId, Journey>
  items: ItemsData
  story: StoryData
}

let cache: Promise<Curriculum> | null = null

async function fetchJson<T>(name: string): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`)
  if (!res.ok) throw new Error(`Failed to load ${name}.json: ${res.status}`)
  return res.json() as Promise<T>
}

export function loadCurriculum(): Promise<Curriculum> {
  cache ??= Promise.all([
    fetchJson<Journey>('journey1'),
    fetchJson<Journey>('journey2'),
    fetchJson<Journey>('journey3'),
    fetchJson<ItemsData>('items'),
    fetchJson<StoryData>('story'),
  ]).then(([j1, j2, j3, items, story]) => ({ journeys: { 1: j1, 2: j2, 3: j3 }, items, story }))
  return cache
}

/** Key for cross-journey problem lookup: `${journeyId}:${slug}`. */
export function problemKey(journeyId: JourneyId, slug: string): string {
  return `${journeyId}:${slug}`
}

/** Index problems of all three journeys by problemKey — the lookup XP derivation uses. */
export function indexProblems(c: Pick<Curriculum, 'journeys'>): Map<string, Problem> {
  const map = new Map<string, Problem>()
  for (const j of [c.journeys[1], c.journeys[2], c.journeys[3]]) {
    for (const p of j.problems) map.set(problemKey(j.id, p.slug), p)
  }
  return map
}

export function islandProblems(j: Journey, islandId: string): Problem[] {
  return j.problems.filter((p) => p.island_id === islandId).sort((a, b) => a.order - b.order)
}

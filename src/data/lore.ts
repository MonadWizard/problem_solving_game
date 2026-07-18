import type { JourneyId } from '../lib/types'

export interface LoreJourneyEntry {
  icon: string
  tagline: string
  source: string
  blurb: string
}

export interface LoreMechanic {
  icon: string
  name: string
  blurb: string
}

export interface LoreStep {
  step: number
  icon: string
  text: string
}

export interface LoreData {
  journeys: Record<JourneyId, LoreJourneyEntry>
  mechanics: LoreMechanic[]
  how_it_works: LoreStep[]
}

let cache: Promise<LoreData> | null = null

/** Static About-page copy — separate from loadCurriculum() since it isn't game-state data. */
export function loadLore(): Promise<LoreData> {
  cache ??= fetch(`${import.meta.env.BASE_URL}data/lore.json`).then((res) => {
    if (!res.ok) throw new Error(`Failed to load lore.json: ${res.status}`)
    return res.json() as Promise<LoreData>
  })
  return cache
}

import type { LocalState } from '../lib/types'

export const STORAGE_KEY = 'tga:v1'

export function defaultLocalState(): LocalState {
  return {
    version: 1,
    solves: [],
    events: [],
    items: {},
    displayName: null,
    leetcodeUsername: null,
    hasteUntil: null,
    attempts: {},
    queue: [],
  }
}

/** In-memory fallback when localStorage is unavailable (private mode, etc.). */
let memory: LocalState | null = null

export function loadLocal(): LocalState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return memory ?? defaultLocalState()
    const parsed = JSON.parse(raw) as Partial<LocalState>
    if (parsed.version !== 1) return defaultLocalState()
    // Fill any missing fields so older snapshots keep working.
    return { ...defaultLocalState(), ...parsed, version: 1 }
  } catch {
    return memory ?? defaultLocalState()
  }
}

export function saveLocal(state: LocalState): void {
  memory = state
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* quota/unavailable: memory fallback already updated */
  }
}

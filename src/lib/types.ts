export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Problem {
  slug: string
  title: string
  difficulty: Difficulty
  island_id: string
  order: number
  xp: number
  pattern: string
  is_boss: boolean
  leetcode_url: string
  /** Journeys 2 and 3 only: timed-attempt limit. */
  time_limit_seconds?: number
  /** Journey 3 only: illustrative target-role bands (not scraped interview data). */
  roles?: string[]
  /** Journey 3 only: "classic, evergreen" | "commonly asked" | "recently popular". */
  recency?: string
  /** Journey 3 only: which judge this problem is from. Absent means leetcode. */
  source?: 'leetcode' | 'codeforces' | 'hackerrank'
}

export interface Island {
  id: string
  name: string
  order: number
}

export type JourneyId = 1 | 2 | 3

export interface Journey {
  id: JourneyId
  name: string
  islands: Island[]
  problems: Problem[]
}

/** One solved problem. Primary key: (journeyId, slug). */
export interface Solve {
  journeyId: JourneyId
  slug: string
  /** ISO timestamp. On merge conflicts the EARLIEST wins. */
  solvedAt: string
  secondsTaken: number | null
  /** Journey 2: solved within the time limit. OR-ed on merge. */
  starred: boolean
}

export type EventType =
  | 'solve'
  | 'boss_win'
  | 'ghost_win'
  | 'freeze_used'
  | 'quiz_pass'
  | 'chest'
  | 'haste_bonus'

/** Append-only log entry. `id` is a client-generated uuid so cloud retries are idempotent. */
export interface GameEvent {
  id: string
  type: EventType
  refSlug: string | null
  happenedAt: string
}

/** itemId -> count. Cosmetics/ship parts use 0/1. Merged per-key with max. */
export type ItemsState = Record<string, number>

/** Everything that syncs. All derived state (XP, streak, unlocks) computes from this. */
export interface ProgressState {
  solves: Solve[]
  events: GameEvent[]
  items: ItemsState
}

export type QueueOp =
  | { kind: 'solve'; solve: Solve }
  | { kind: 'event'; event: GameEvent }
  | { kind: 'items'; items: ItemsState }
  | { kind: 'meta'; meta: { displayName?: string; leetcodeUsername?: string } }

export interface LocalState extends ProgressState {
  version: 1
  displayName: string | null
  leetcodeUsername: string | null
  /** ISO expiry of the Haste Fruit 2x-XP window, if active. */
  hasteUntil: string | null
  /** Journey 2 running attempts: slug -> ISO start time. Device-local by design. */
  attempts: Record<string, string>
  /** Paused attempts: key -> ISO time the pause happened. Presence means paused. Device-local. */
  pausedAttempts: Record<string, string>
  queue: QueueOp[]
}

export interface ItemDef {
  id: string
  name: string
  rarity: 'common' | 'rare' | 'epic'
  kind: 'fruit' | 'utility' | 'cosmetic' | 'ship_part'
  description: string
  effect: string
}

export interface ChestDrop {
  drop: string
  weight: number
}

export interface ItemsData {
  items: ItemDef[]
  chest_table: ChestDrop[]
  boss_drops: ChestDrop[]
}

export interface IslandStory {
  arrival: string[]
  boss_intro: string
  complete: string
  title: string
}

export type StoryData = Record<string, IslandStory>

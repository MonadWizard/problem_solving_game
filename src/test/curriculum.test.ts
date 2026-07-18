import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { ItemsData, Journey, Problem, StoryData } from '../lib/types'

const read = <T>(name: string): T =>
  JSON.parse(readFileSync(`public/data/${name}.json`, 'utf8')) as T

const j1 = read<Journey>('journey1')
const j2 = read<Journey>('journey2')
const j3 = read<Journey>('journey3')
const items = read<ItemsData>('items')
const story = read<StoryData>('story')

const XP: Record<Problem['difficulty'], number> = { easy: 100, medium: 250, hard: 500 }

// Spec-mandated island sizes, in order.
const J1_SIZES = [12, 8, 8, 8, 8, 10, 14, 7, 9, 3, 12, 8, 12, 11, 8, 12]
const J2_SIZES = [10, 9, 9, 9, 10, 9, 9, 10]
const J3_SIZES = Array(100).fill(60)

function validateJourney(j: Journey, sizes: number[], uniqueScope: 'journey' | 'island' = 'journey') {
  it('has contiguous island ordering', () => {
    expect(j.islands.map((i) => i.order)).toEqual(sizes.map((_, k) => k + 1))
  })

  it('has the spec island sizes', () => {
    const counts = j.islands.map((i) => j.problems.filter((p) => p.island_id === i.id).length)
    expect(counts).toEqual(sizes)
  })

  if (uniqueScope === 'journey') {
    it('has unique slugs', () => {
      const slugs = j.problems.map((p) => p.slug)
      expect(new Set(slugs).size).toBe(slugs.length)
    })
  } else {
    // Journey 3 (The Abyss) models real interview problems, which are legitimately
    // reused across companies — so slugs only need to be unique within an island.
    it('has slugs unique within each island', () => {
      for (const island of j.islands) {
        const slugs = j.problems.filter((p) => p.island_id === island.id).map((p) => p.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
      }
    })
  }

  it('has valid problem schema and XP table values', () => {
    const islandIds = new Set(j.islands.map((i) => i.id))
    for (const p of j.problems) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/)
      expect(p.title.length).toBeGreaterThan(0)
      expect(['easy', 'medium', 'hard']).toContain(p.difficulty)
      expect(islandIds.has(p.island_id)).toBe(true)
      expect(p.pattern.length).toBeGreaterThan(0)
      if (p.source === 'hackerrank') {
        expect(p.leetcode_url).toBe(`https://www.hackerrank.com/challenges/${p.slug}/problem`)
      } else if (p.source === 'codeforces') {
        expect(p.leetcode_url).toMatch(/^https:\/\/codeforces\.com\//)
      } else {
        expect(p.leetcode_url).toBe(`https://leetcode.com/problems/${p.slug}/`)
      }
      expect(p.xp).toBe(XP[p.difficulty] * (p.is_boss ? 2 : 1))
    }
  })

  it('has per-island contiguous problem order with exactly one boss, placed last', () => {
    for (const island of j.islands) {
      const probs = j.problems
        .filter((p) => p.island_id === island.id)
        .sort((a, b) => a.order - b.order)
      expect(probs.map((p) => p.order)).toEqual(probs.map((_, k) => k + 1))
      expect(probs.filter((p) => p.is_boss).length).toBe(1)
      expect(probs[probs.length - 1].is_boss).toBe(true)
    }
  })
}

describe('journey1 — The First Sea', () => {
  it('is journey 1 with 16 islands and 150 problems', () => {
    expect(j1.id).toBe(1)
    expect(j1.islands.length).toBe(16)
    expect(j1.problems.length).toBe(150)
  })
  validateJourney(j1, J1_SIZES)

  it('names islands after their concept', () => {
    for (const island of j1.islands) expect(island.name).toMatch(/ Island$/)
  })

  it('has no time limits (learn mode)', () => {
    for (const p of j1.problems) expect(p.time_limit_seconds).toBeUndefined()
  })
})

describe('journey2 — The Blind Sea', () => {
  it('is journey 2 with 8 isles and 75 problems', () => {
    expect(j2.id).toBe(2)
    expect(j2.islands.length).toBe(8)
    expect(j2.problems.length).toBe(75)
  })
  validateJourney(j2, J2_SIZES)

  it('has time limits by difficulty (900/1800/2700)', () => {
    const LIMIT = { easy: 900, medium: 1800, hard: 2700 }
    for (const p of j2.problems) expect(p.time_limit_seconds).toBe(LIMIT[p.difficulty])
  })

  it('mixes topics within every isle', () => {
    for (const island of j2.islands) {
      const patterns = new Set(
        j2.problems.filter((p) => p.island_id === island.id).map((p) => p.pattern),
      )
      expect(patterns.size).toBeGreaterThan(2)
    }
  })
})

describe('journey3 — The Abyss', () => {
  it('is journey 3 with 100 islands and 6000 problems', () => {
    expect(j3.id).toBe(3)
    expect(j3.islands.length).toBe(100)
    expect(j3.problems.length).toBe(6000)
  })
  validateJourney(j3, J3_SIZES, 'island')

  it('names islands after their company', () => {
    for (const island of j3.islands) expect(island.name).toMatch(/ Island$/)
  })

  it('has time limits by difficulty (900/1800/2700), same tiers as journey 2', () => {
    const LIMIT = { easy: 900, medium: 1800, hard: 2700 }
    for (const p of j3.problems) expect(p.time_limit_seconds).toBe(LIMIT[p.difficulty])
  })

  it('tags every problem with illustrative target roles and a recency bucket', () => {
    for (const p of j3.problems) {
      expect(Array.isArray(p.roles)).toBe(true)
      expect(p.roles?.length).toBeGreaterThan(0)
      expect(['classic, evergreen', 'commonly asked', 'recently popular']).toContain(p.recency)
    }
  })

  it('has a valid source when present', () => {
    for (const p of j3.problems) {
      if (p.source !== undefined) expect(['leetcode', 'codeforces', 'hackerrank']).toContain(p.source)
    }
  })

  it('has 16 easy / 24 medium / 20 hard per company', () => {
    for (const island of j3.islands) {
      const probs = j3.problems.filter((p) => p.island_id === island.id)
      const counts = { easy: 0, medium: 0, hard: 0 }
      for (const p of probs) counts[p.difficulty as 'easy' | 'medium' | 'hard']++
      expect(counts).toEqual({ easy: 16, medium: 24, hard: 20 })
    }
  })
})

describe('items.json', () => {
  it('defines the core items', () => {
    const ids = items.items.map((i) => i.id)
    for (const required of ['rewind_fruit', 'oracle_fruit', 'haste_fruit', 'streak_freeze']) {
      expect(ids).toContain(required)
    }
  })
  it('gives every item an emoji icon', () => {
    for (const item of items.items) {
      expect(item.icon, `icon for ${item.id}`).toBeDefined()
      expect(item.icon!.length).toBeGreaterThan(0)
    }
  })
  it('has weighted chest and boss drop tables', () => {
    expect(items.chest_table.length).toBeGreaterThan(2)
    expect(items.boss_drops.length).toBeGreaterThan(2)
    for (const d of [...items.chest_table, ...items.boss_drops]) {
      expect(d.weight).toBeGreaterThan(0)
    }
  })
})

describe('story.json', () => {
  it('covers every island in both journeys', () => {
    for (const island of [...j1.islands, ...j2.islands]) {
      const s = story[island.id]
      expect(s, `story for ${island.id}`).toBeDefined()
      expect(s.arrival.length).toBeGreaterThanOrEqual(3)
      expect(s.arrival.length).toBeLessThanOrEqual(5)
      expect(s.boss_intro.length).toBeGreaterThan(0)
      expect(s.complete.length).toBeGreaterThan(0)
      expect(s.title.length).toBeGreaterThan(0)
    }
  })
})

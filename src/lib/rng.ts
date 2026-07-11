/** Deterministic PRNG (mulberry32) — quizzes and drops stay reproducible in tests. */
export function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Stable 32-bit hash for turning strings into seeds. */
export function hashSeed(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h | 0
}

export function pickWeighted<T extends { weight: number }>(table: T[], roll: number): T {
  const total = table.reduce((sum, t) => sum + t.weight, 0)
  let r = roll * total
  for (const entry of table) {
    r -= entry.weight
    if (r < 0) return entry
  }
  return table[table.length - 1]
}

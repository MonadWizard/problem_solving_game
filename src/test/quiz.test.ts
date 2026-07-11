import { describe, expect, it } from 'vitest'
import { generateQuiz } from '../lib/quiz'
import { makeJourney } from './fixtures'

const journey = makeJourney(1, [
  ['alpha', 5],
  ['beta', 5],
  ['gamma', 5],
  ['delta', 5],
])

describe('generateQuiz (pattern gate)', () => {
  const quiz = generateQuiz('alpha', journey, 42)

  it('produces 3 questions with 4 unique options each', () => {
    expect(quiz.length).toBe(3)
    for (const q of quiz) {
      expect(q.options.length).toBe(4)
      expect(new Set(q.options).size).toBe(4)
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(4)
    }
  })

  it('correct answers come from the island and match the prompted pattern', () => {
    for (const q of quiz) {
      const correctTitle = q.options[q.correctIndex]
      const problem = journey.problems.find((p) => p.title === correctTitle)
      expect(problem?.island_id).toBe('alpha')
      expect(q.prompt).toContain(problem!.pattern)
    }
  })

  it('distractors come from other islands with different patterns', () => {
    for (const q of quiz) {
      const distractors = q.options.filter((_, i) => i !== q.correctIndex)
      for (const title of distractors) {
        const problem = journey.problems.find((p) => p.title === title)
        expect(problem?.island_id).not.toBe('alpha')
        expect(problem?.pattern).not.toBe('alpha-pat')
      }
    }
  })

  it('is deterministic per seed and varies across seeds', () => {
    expect(generateQuiz('alpha', journey, 42)).toEqual(quiz)
    const other = generateQuiz('alpha', journey, 43)
    expect(JSON.stringify(other)).not.toBe(JSON.stringify(quiz))
  })
})

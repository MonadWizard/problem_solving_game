import type { Journey } from './types'
import { mulberry32 } from './rng'

export interface QuizQuestion {
  prompt: string
  options: string[]
  correctIndex: number
}

/**
 * Pattern-gate quiz: 3 multiple-choice questions generated from curriculum
 * metadata. Each asks which title is a <pattern> problem, where the correct
 * answer comes from the completed island and distractors from other islands
 * with different patterns. Deterministic for a given seed.
 */
export function generateQuiz(islandId: string, journey: Journey, seed: number): QuizQuestion[] {
  const rand = mulberry32(seed)
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]

  const islandProbs = journey.problems.filter((p) => p.island_id === islandId)
  if (islandProbs.length === 0) throw new Error(`unknown island ${islandId}`)

  const questions: QuizQuestion[] = []
  const usedCorrect = new Set<string>()
  for (let q = 0; q < 3; q++) {
    const candidates = islandProbs.filter((p) => !usedCorrect.has(p.slug))
    const correct = pick(candidates.length ? candidates : islandProbs)
    usedCorrect.add(correct.slug)

    const distractorPool = journey.problems.filter(
      (p) => p.island_id !== islandId && p.pattern !== correct.pattern,
    )
    const distractors = new Map<string, string>()
    while (distractors.size < 3) {
      const d = pick(distractorPool)
      if (d.title !== correct.title) distractors.set(d.slug, d.title)
    }

    const options = [correct.title, ...distractors.values()]
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[options[i], options[j]] = [options[j], options[i]]
    }
    questions.push({
      prompt: `Which of these is a “${correct.pattern}” problem?`,
      options,
      correctIndex: options.indexOf(correct.title),
    })
  }
  return questions
}

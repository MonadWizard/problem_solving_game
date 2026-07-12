import { useId, useMemo, useState } from 'react'
import type { Journey } from '../lib/types'
import { generateQuiz } from '../lib/quiz'
import { hashSeed } from '../lib/rng'
import { useGameStore } from '../store/gameStore'

export default function QuizModal({
  islandId,
  journey,
  onClose,
}: {
  islandId: string
  journey: Journey
  onClose: () => void
}) {
  const passQuiz = useGameStore((s) => s.passQuiz)
  const [attempt, setAttempt] = useState(0)
  const quiz = useMemo(
    () => generateQuiz(islandId, journey, hashSeed(islandId) + attempt),
    [islandId, journey, attempt],
  )
  const [answers, setAnswers] = useState<number[]>(() => Array(quiz.length).fill(-1))
  const [submitted, setSubmitted] = useState(false)
  const titleId = useId()

  const allCorrect = quiz.every((q, i) => answers[i] === q.correctIndex)
  const canSubmit = answers.every((a) => a >= 0)

  function submit() {
    setSubmitted(true)
    if (quiz.every((q, i) => answers[i] === q.correctIndex)) passQuiz(islandId)
  }

  function retry() {
    setAttempt((a) => a + 1)
    setAnswers(Array(quiz.length).fill(-1))
    setSubmitted(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-lg border border-sea-200 bg-parchment p-5 text-sea-950 shadow-xl dark:border-sea-700 dark:bg-sea-900 dark:text-sea-50"
      >
        <h2 id={titleId} className="mb-1 font-display text-lg font-bold">
          Pattern Gate
        </h2>
        <p className="mb-4 text-sm opacity-80">
          Answer all three correctly to chart a course to the next island.
        </p>

        <div className="flex flex-col gap-4">
          {quiz.map((q, qi) => (
            <fieldset key={qi}>
              <legend className="mb-2 text-sm font-medium">{q.prompt}</legend>
              <div className="flex flex-col gap-1">
                {q.options.map((opt, oi) => {
                  const isRight = submitted && oi === q.correctIndex
                  const isWrong = submitted && answers[qi] === oi && oi !== q.correctIndex
                  return (
                    <label
                      key={oi}
                      className={`flex items-center gap-2 rounded border px-2 py-1.5 text-sm ${
                        isRight
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : isWrong
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-sea-300 dark:border-sea-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`quiz-q${qi}`}
                        disabled={submitted}
                        checked={answers[qi] === oi}
                        onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                      />
                      {opt}
                    </label>
                  )
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {!submitted && (
            <button
              type="button"
              disabled={!canSubmit}
              onClick={submit}
              className="rounded bg-gold-500 px-3 py-2 text-sm font-semibold text-sea-950 disabled:opacity-50"
            >
              Submit
            </button>
          )}
          {submitted && !allCorrect && (
            <button
              type="button"
              onClick={retry}
              className="rounded border border-sea-300 px-3 py-2 text-sm dark:border-sea-600"
            >
              Try again
            </button>
          )}
          {submitted && allCorrect && (
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-gold-500 px-3 py-2 text-sm font-semibold text-sea-950"
            >
              Onward!
            </button>
          )}
          {!(submitted && allCorrect) && (
            <button
              type="button"
              onClick={onClose}
              className="rounded px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              Later
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

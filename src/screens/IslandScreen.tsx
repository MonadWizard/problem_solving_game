import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { JourneyId } from '../lib/types'
import { useGameStore } from '../store/gameStore'
import { islandComplete, islandProgress, islandUnlocked, quizPassed } from '../lib/unlocks'
import ProblemRow from '../components/ProblemRow'
import BossCard from '../components/BossCard'
import QuizModal from '../components/QuizModal'
import { RevealList, RevealItem } from '../motion/RevealList'

export default function IslandScreen() {
  const { journeyId: journeyIdParam, islandId } = useParams()
  const ready = useGameStore((s) => s.ready)
  const curriculum = useGameStore((s) => s.curriculum)
  const local = useGameStore((s) => s.local)
  const [showQuiz, setShowQuiz] = useState(false)

  if (!ready || !curriculum) {
    return <p className="p-6 text-center opacity-70">Charting the seas…</p>
  }

  const journeyId = (journeyIdParam === '2' ? 2 : 1) as JourneyId
  const journey = curriculum.journeys[journeyId]
  const island = journey.islands.find((i) => i.id === islandId)

  if (!island) {
    return (
      <div className="p-6 text-center">
        <p className="mb-3">Unknown island.</p>
        <Link to="/" className="underline">
          Back to the map
        </Link>
      </div>
    )
  }

  if (!islandUnlocked(journey, island.id, local)) {
    return (
      <div className="p-6 text-center">
        <p className="mb-3">🔒 {island.name} is still shrouded in fog.</p>
        <Link to="/" className="underline">
          Back to the map
        </Link>
      </div>
    )
  }

  const story = curriculum.story[island.id]
  const problems = journey.problems.filter((p) => p.island_id === island.id).sort((a, b) => a.order - b.order)
  const boss = problems.find((p) => p.is_boss)
  const rest = problems.filter((p) => !p.is_boss)
  const solveFor = (slug: string) => local.solves.find((s) => s.journeyId === journeyId && s.slug === slug)

  const complete = islandComplete(journey, island.id, local)
  const quizDone = quizPassed(island.id, local)
  const { solved: solvedCount, total } = islandProgress(journey, island.id, local)
  const bossSolved = boss ? !!solveFor(boss.slug) : false
  const otherSolved = boss ? solvedCount - (bossSolved ? 1 : 0) : solvedCount
  const otherTotal = boss ? total - 1 : total
  const hpPct = otherTotal > 0 ? Math.max(0, 1 - otherSolved / otherTotal) : bossSolved ? 0 : 1

  return (
    <div>
      <Link to="/" className="mb-4 inline-block text-sm underline opacity-70 hover:opacity-100">
        ← Back to the map
      </Link>
      <h1 className="mb-3 font-display text-2xl font-bold">{island.name}</h1>

      {story && (
        <div className="mb-5 rounded-lg border border-sea-200 bg-sea-50 p-4 text-sm italic dark:border-sea-800 dark:bg-sea-900/40">
          {story.arrival.map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-2' : ''}>
              {line}
            </p>
          ))}
        </div>
      )}

      {journey.id === 1 && complete && !quizDone && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold-500/60 bg-gold-500/10 px-4 py-3 text-sm">
          <p>
            <strong>Island complete!</strong> Pass the pattern quiz to chart a course onward.
          </p>
          <button
            type="button"
            onClick={() => setShowQuiz(true)}
            className="rounded bg-gold-500 px-3 py-1.5 font-semibold text-sea-950 hover:bg-gold-400"
          >
            Take the quiz
          </button>
        </div>
      )}
      {journey.id === 1 && complete && quizDone && story && (
        <p className="mb-5 rounded-lg border border-gold-500/40 bg-gold-500/5 p-4 text-sm">{story.complete}</p>
      )}

      <RevealList as="ul" className="flex flex-col gap-2">
        {rest.map((p) => {
          const solve = solveFor(p.slug)
          return (
            <RevealItem key={p.slug} as="li">
              <ProblemRow problem={p} journeyId={journeyId} solved={!!solve} starred={solve?.starred ?? false} />
            </RevealItem>
          )
        })}
      </RevealList>

      {boss && (
        <div className="mt-4">
          <BossCard
            problem={boss}
            journeyId={journeyId}
            solved={bossSolved}
            starred={solveFor(boss.slug)?.starred ?? false}
            bossIntro={story?.boss_intro ?? ''}
            hpPct={hpPct}
          />
        </div>
      )}

      {showQuiz && <QuizModal islandId={island.id} journey={journey} onClose={() => setShowQuiz(false)} />}
    </div>
  )
}

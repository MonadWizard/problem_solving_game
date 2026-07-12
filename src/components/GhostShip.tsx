import { useId, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Problem } from '../lib/types'
import { useGameStore } from '../store/gameStore'

const WAVE_LABEL = { 1: 'first', 2: 'second', 3: 'third' } as const

export default function GhostShip({
  problem,
  wave,
  x,
  y,
}: {
  problem: Problem
  wave: 1 | 2 | 3
  x: number
  y: number
}) {
  const [open, setOpen] = useState(false)
  const defeatGhost = useGameStore((s) => s.defeatGhost)
  const titleId = useId()

  return (
    <>
      <g transform={`translate(${x} ${y})`}>
        <foreignObject x={-14} y={-14} width={28} height={28} className="overflow-visible">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-label={`Ghost ship: re-fight ${problem.title}`}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-sea-100/60 bg-sea-950/80 text-base text-sea-100 shadow-md hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400"
          >
            👻
          </button>
        </foreignObject>
      </g>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-lg border border-sea-200 bg-parchment p-5 text-sea-950 shadow-xl dark:border-sea-700 dark:bg-sea-900 dark:text-sea-50"
            >
              <h2 id={titleId} className="mb-2 font-display text-lg font-bold">
                A ghost ship rises!
              </h2>
              <p className="mb-4 text-sm">
                The {WAVE_LABEL[wave]}-wave echo of <strong>{problem.title}</strong> has returned. Re-solve it on
                LeetCode for a bonus.
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={problem.leetcode_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-sea-300 px-3 py-2 text-sm font-medium hover:bg-sea-100 dark:border-sea-600 dark:hover:bg-sea-800"
                >
                  Open on LeetCode
                </a>
                <button
                  type="button"
                  onClick={() => {
                    defeatGhost(problem.slug)
                    setOpen(false)
                  }}
                  className="rounded bg-gold-500 px-3 py-2 text-sm font-semibold text-sea-950 hover:bg-gold-400"
                >
                  Mark re-solved (+150 XP)
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Not yet
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

import { useEffect, useRef } from 'react'
import { renderPoster, type PosterData } from '../lib/poster'
import TiltCard from '../motion/TiltCard'

export default function BountyPoster({ data }: { data: PosterData }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (ref.current) void renderPoster(ref.current, data)
  }, [data])

  function download() {
    const canvas = ref.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'grand-algorithm-bounty-poster.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <TiltCard>
        <canvas
          ref={ref}
          width={360}
          height={400}
          className="max-w-full rounded-lg border border-sea-300 shadow-lg dark:border-sea-700"
          aria-label={`Bounty poster for ${data.displayName || 'Anonymous Pirate'}, ${data.bounty}`}
          role="img"
        />
      </TiltCard>
      <button
        type="button"
        onClick={download}
        className="rounded bg-gold-500 px-4 py-2 text-sm font-semibold text-sea-950 hover:bg-gold-400"
      >
        Download poster
      </button>
    </div>
  )
}

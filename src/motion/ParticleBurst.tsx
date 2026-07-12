import { useEffect, useMemo } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { hashSeed, mulberry32 } from '../lib/rng'

const COLORS = ['#eec14f', '#f5d67a', '#2a7fa3', '#ffffff']
const BURST_SECONDS = 0.6

/** One-shot celebratory particle burst, anchored to a `relative` parent. Self-removes via onComplete. */
export default function ParticleBurst({
  seed = 'burst',
  count = 12,
  onComplete,
}: {
  seed?: string
  count?: number
  onComplete?: () => void
}) {
  const reduced = useReducedMotion()
  const capped =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches ? Math.min(count, 8) : count

  const particles = useMemo(() => {
    const rand = mulberry32(hashSeed(seed))
    return Array.from({ length: capped }, (_, i) => {
      const angle = rand() * Math.PI * 2
      const distance = 24 + rand() * 30
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        color: COLORS[Math.floor(rand() * COLORS.length)],
        size: 4 + rand() * 4,
      }
    })
  }, [seed, capped])

  useEffect(() => {
    if (!onComplete) return
    const t = setTimeout(onComplete, reduced ? 0 : BURST_SECONDS * 1000)
    return () => clearTimeout(t)
  }, [onComplete, reduced])

  if (reduced) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-visible" aria-hidden>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{ width: p.size, height: p.size, backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.4 }}
          transition={{ duration: BURST_SECONDS, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import type { Island, JourneyId } from '../lib/types'
import { SPRING_SNAPPY } from '../motion/transitions'

interface IslandNodeProps {
  island: Island
  journeyId: JourneyId
  x: number
  y: number
  unlocked: boolean
  complete: boolean
  solved: number
  total: number
  isCurrent: boolean
}

const RADIUS = 22

export default function IslandNode({
  island,
  journeyId,
  x,
  y,
  unlocked,
  complete,
  solved,
  total,
  isCurrent,
}: IslandNodeProps) {
  const reduced = useReducedMotion()
  const pct = total > 0 ? solved / total : 0
  const circumference = 2 * Math.PI * RADIUS
  const label = `${island.name} — ${unlocked ? `${solved} of ${total} solved${complete ? ', complete' : ''}` : 'locked'}`

  const wasUnlocked = useRef(unlocked)
  const justUnlocked = !wasUnlocked.current && unlocked
  useEffect(() => {
    wasUnlocked.current = unlocked
  }, [unlocked])

  const content = (
    <motion.g
      whileHover={unlocked ? { scale: 1.06 } : undefined}
      whileTap={unlocked ? { scale: 0.95 } : undefined}
      initial={justUnlocked ? { scale: 0.6, opacity: 0 } : false}
      animate={justUnlocked ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1 }}
      transition={reduced ? { duration: 0 } : SPRING_SNAPPY}
    >
      <circle r={RADIUS + 5} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={4} />
      {unlocked && (
        <motion.circle
          r={RADIUS + 5}
          fill="none"
          stroke={complete ? '#eec14f' : '#2a7fa3'}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={reduced ? { duration: 0 } : SPRING_SNAPPY}
          transform="rotate(-90 0 0)"
        />
      )}
      {justUnlocked && !reduced && (
        <motion.circle
          r={RADIUS + 5}
          fill="none"
          stroke="#eec14f"
          strokeWidth={6}
          initial={{ opacity: 0.9, scale: 1 }}
          animate={{ opacity: 0, scale: 1.8 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      )}
      <circle
        r={RADIUS}
        className={unlocked ? (complete ? 'fill-gold-400' : 'fill-sea-500') : 'fill-sea-300 dark:fill-sea-800'}
        stroke={isCurrent ? '#eec14f' : 'currentColor'}
        strokeOpacity={isCurrent ? 1 : 0.3}
        strokeWidth={isCurrent ? 3 : 1}
      />
      {unlocked ? (
        complete ? (
          <text textAnchor="middle" dominantBaseline="central" fontSize={20}>
            ★
          </text>
        ) : (
          <text textAnchor="middle" dominantBaseline="central" fontSize={14} fill="white">
            {solved}/{total}
          </text>
        )
      ) : (
        <text textAnchor="middle" dominantBaseline="central" fontSize={18}>
          🔒
        </text>
      )}
      <text y={RADIUS + 22} textAnchor="middle" fontSize={12} className="fill-current">
        {island.name.replace(/ Island$/, '').replace(/^Blind Isle /, 'Isle ')}
      </text>
    </motion.g>
  )

  if (!unlocked) {
    return (
      <g transform={`translate(${x} ${y})`} aria-label={label} role="img" opacity={0.6}>
        {content}
      </g>
    )
  }

  return (
    <Link
      to={`/island/${journeyId}/${island.id}`}
      aria-label={label}
      className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400"
    >
      <g transform={`translate(${x} ${y})`}>{content}</g>
    </Link>
  )
}

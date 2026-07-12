import type { ShipTier } from '../lib/unlocks'

const HULL_WIDTH: Record<ShipTier, number> = { dinghy: 26, sloop: 34, brig: 42, galleon: 52 }
const MAST_COUNT: Record<ShipTier, number> = { dinghy: 1, sloop: 1, brig: 2, galleon: 3 }

/**
 * A <g> fragment, not a nested <svg> — its local origin (0,0) is the keel
 * (waterline contact point), so callers can position it with one predictable
 * translate instead of reasoning through a second nested viewBox.
 */
export default function ShipSprite({ tier, className }: { tier: ShipTier; className?: string }) {
  const width = HULL_WIDTH[tier]
  const masts = MAST_COUNT[tier]
  const deckY = -10

  return (
    <g className={className} role="img" aria-label={`Your ship: the ${tier}`}>
      <path
        d={`M ${-width / 2} ${deckY} Q 0 0 ${width / 2} ${deckY} L ${width / 2 - 4} ${deckY - 8} L ${-width / 2 + 4} ${deckY - 8} Z`}
        fill="#3f2a1d"
        stroke="#1c120b"
        strokeWidth={1}
      />
      {Array.from({ length: masts }, (_, i) => {
        const x = masts === 1 ? 0 : -8 + i * 8
        return (
          <g key={i}>
            <line x1={x} y1={deckY - 8} x2={x} y2={deckY - 30} stroke="#1c120b" strokeWidth={1.5} />
            <path
              d={`M ${x} ${deckY - 28} L ${x + 10} ${deckY - 16} L ${x} ${deckY - 16} Z`}
              fill="#f0e2c4"
              stroke="#1c120b"
              strokeWidth={0.5}
            />
          </g>
        )
      })}
    </g>
  )
}

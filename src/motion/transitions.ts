import type { Transition } from 'motion/react'

export const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 400, damping: 30 }
export const SPRING_BOUNCY: Transition = { type: 'spring', stiffness: 300, damping: 15 }
export const EASE_OUT: Transition = { ease: 'easeOut', duration: 0.25 }

export const DURATION = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
} as const

/** Collapses any transition to a no-op duration when reduced motion is requested. */
export function withReducedMotion(reduced: boolean, transition: Transition): Transition {
  return reduced ? { duration: 0 } : transition
}

/** Stagger delay for N children, capped so long lists (16 islands, 20 problems) stay snappy. */
export function staggerFor(count: number, totalBudget = 0.4): number {
  if (count <= 0) return 0
  return Math.min(0.05, totalBudget / count)
}

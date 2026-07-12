import { Children, type ElementType, type ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { staggerFor } from './transitions'

const containerHidden: Variants = { hidden: {}, visible: {} }
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}
const itemVariantsReduced: Variants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
}

/** Staggered-mount wrapper for lists (problem rows, items, leaderboard rows, islands). */
export function RevealList({
  as = 'ul',
  className,
  children,
}: {
  as?: ElementType
  className?: string
  children: ReactNode
}) {
  const reduced = useReducedMotion()
  const count = Children.count(children)
  const MotionTag = motion[as as keyof typeof motion] as ElementType

  return (
    <MotionTag
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        ...containerHidden,
        visible: { transition: { staggerChildren: reduced ? 0 : staggerFor(count) } },
      }}
    >
      {children}
    </MotionTag>
  )
}

export function RevealItem({
  as = 'li',
  className,
  children,
}: {
  as?: ElementType
  className?: string
  children: ReactNode
}) {
  const reduced = useReducedMotion()
  const MotionTag = motion[as as keyof typeof motion] as ElementType

  return (
    <MotionTag
      className={className}
      variants={reduced ? itemVariantsReduced : itemVariants}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
    >
      {children}
    </MotionTag>
  )
}

import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'motion/react'

export default function AnimatedNumber({
  value,
  format,
}: {
  value: number
  format?: (n: number) => string
}) {
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(value)
  const first = useRef(true)

  useEffect(() => {
    if (reduced || first.current) {
      first.current = false
      setDisplay(value)
      return
    }
    const controls = animate(display, value, {
      type: 'spring',
      stiffness: 90,
      damping: 20,
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduced])

  const rounded = Math.round(display)
  return <span>{format ? format(rounded) : rounded}</span>
}

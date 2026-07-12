import { motion, useReducedMotion } from 'motion/react'

export default function AboutScreen() {
  const reduced = useReducedMotion()
  const reveal = reduced
    ? { initial: { opacity: 1 }, whileInView: { opacity: 1 } }
    : { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 } }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 text-sm leading-relaxed">
      <h1 className="font-display text-2xl font-bold">About The Grand Algorithm</h1>

      <motion.p {...reveal} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
        The Grand Algorithm is a pirate-adventure roadmap layered on top of{' '}
        <a href="https://leetcode.com" target="_blank" rel="noopener noreferrer" className="underline">
          LeetCode
        </a>
        . You don't solve problems here — every island node links out to the real problem on LeetCode. This site
        only tracks your progress, XP, streaks, and items once you mark a problem solved.
      </motion.p>

      <motion.div
        {...reveal}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="rounded-lg border border-gold-500/50 bg-gold-500/10 p-4"
      >
        <p className="font-medium">Honest coverage statement</p>
        <p className="mt-1 opacity-90">
          The First Sea covers 150 problems (the NeetCode 150 set) and The Blind Sea covers 75 more (the Blind 75
          set) — together roughly all the interview patterns you're likely to be asked about. That is <em>not</em>{' '}
          the same as all ~3,500 problems on LeetCode. Finishing both seas is a strong foundation, not full
          coverage of the platform.
        </p>
      </motion.div>

      <motion.p {...reveal} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
        Curriculum groupings are based on the widely-shared community lists "NeetCode 150" and "Blind 75". This
        project is not affiliated with, endorsed by, or connected to LeetCode, NeetCode, or any individual curator
        of those lists — the names are used only to describe which public, well-known problem sets are covered.
      </motion.p>

      <motion.p {...reveal} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
        The pirate world, characters, and story are original writing made for this project — see the world bible
        in <code>.claude/skills/pirate-lore/SKILL.md</code> if you're curious how it's put together. No
        copyrighted characters, names, or artwork from any existing franchise are used.
      </motion.p>

      <motion.p
        {...reveal}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="opacity-70"
      >
        Guest play works fully offline in your browser. Signing in (optional) syncs your progress across devices
        via Supabase, governed by row-level security so only you can ever read or write your own data.
      </motion.p>
    </div>
  )
}

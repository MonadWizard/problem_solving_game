import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useGameStore } from '../store/gameStore'
import { loadLore, type LoreData } from '../data/lore'
import { RevealList, RevealItem } from '../motion/RevealList'

const CARD = 'rounded-lg border border-sea-200 dark:border-sea-800 p-4'

export default function AboutScreen() {
  const reduced = useReducedMotion()
  const curriculum = useGameStore((s) => s.curriculum)
  const [lore, setLore] = useState<LoreData | null>(null)

  useEffect(() => {
    void loadLore().then(setLore)
  }, [])

  const reveal = reduced
    ? { initial: { opacity: 1 }, whileInView: { opacity: 1 } }
    : { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 } }
  const sectionProps = {
    ...reveal,
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.4, ease: 'easeOut' as const },
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 text-sm leading-relaxed">
      <div>
        <h1 className="font-display text-2xl font-bold">About The Grand Algorithm</h1>
        <motion.p {...sectionProps} className="mt-3">
          The Grand Algorithm is a pirate-adventure roadmap layered on top of{' '}
          <a href="https://leetcode.com" target="_blank" rel="noopener noreferrer" className="underline">
            LeetCode
          </a>
          . You don't solve problems here — every island node links out to the real problem on LeetCode. This site
          only tracks your progress, XP, streaks, and items once you mark a problem solved.
        </motion.p>
      </div>

      {lore && (
        <motion.section {...sectionProps}>
          <h2 className="mb-3 font-display text-lg font-bold">How it works</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {lore.how_it_works.map((step) => (
              <div key={step.step} className={`${CARD} text-center`}>
                <div className="text-2xl">{step.icon}</div>
                <p className="mt-2 text-xs opacity-80">{step.text}</p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {lore && curriculum && (
        <motion.section {...sectionProps}>
          <h2 className="mb-3 font-display text-lg font-bold">The three seas</h2>
          <RevealList as="div" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {([1, 2, 3] as const).map((id) => {
              const j = lore.journeys[id]
              return (
                <RevealItem key={id} as="div" className={CARD}>
                  <div className="text-2xl">{j.icon}</div>
                  <p className="mt-1 font-medium">{curriculum.journeys[id].name}</p>
                  <p className="text-xs italic opacity-70">{j.tagline}</p>
                  <span className="mt-2 inline-block rounded-full bg-sea-500/10 px-2 py-0.5 text-xs text-sea-700 dark:bg-sea-400/10 dark:text-sea-300">
                    {j.source}
                  </span>
                  <p className="mt-2 text-xs opacity-80">{j.blurb}</p>
                </RevealItem>
              )
            })}
          </RevealList>
        </motion.section>
      )}

      {curriculum && (
        <motion.section {...sectionProps}>
          <h2 className="mb-3 font-display text-lg font-bold">Cursed fruits & loot</h2>
          <RevealList as="div" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {curriculum.items.items.map((item) => (
              <RevealItem key={item.id} as="div" className={CARD}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </div>
                <p className="mt-1 text-xs opacity-80">{item.effect}</p>
              </RevealItem>
            ))}
          </RevealList>
        </motion.section>
      )}

      {lore && (
        <motion.section {...sectionProps}>
          <h2 className="mb-3 font-display text-lg font-bold">Core mechanics</h2>
          <RevealList as="div" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {lore.mechanics.map((m) => (
              <RevealItem key={m.name} as="div" className={CARD}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{m.icon}</span>
                  <span className="font-medium">{m.name}</span>
                </div>
                <p className="mt-1 text-xs opacity-80">{m.blurb}</p>
              </RevealItem>
            ))}
          </RevealList>
        </motion.section>
      )}

      <motion.section {...sectionProps} className="text-xs opacity-70">
        <h2 className="mb-2 font-display text-sm font-bold opacity-90">Fine print</h2>

        <div className="rounded-lg border border-gold-500/50 bg-gold-500/10 p-4">
          <p className="font-medium">Honest coverage statement</p>
          <p className="mt-1 opacity-90">
            The First Sea covers 150 problems (the NeetCode 150 set) and The Blind Sea covers 75 more (the Blind 75
            set) — together roughly all the interview patterns you're likely to be asked about. That is <em>not</em>{' '}
            the same as all ~3,500 problems on LeetCode. Finishing both seas is a strong foundation, not full
            coverage of the platform.
          </p>
        </div>

        <p className="mt-3">
          Curriculum groupings are based on the widely-shared community lists "NeetCode 150" and "Blind 75". This
          project is not affiliated with, endorsed by, or connected to LeetCode, NeetCode, or any individual curator
          of those lists — the names are used only to describe which public, well-known problem sets are covered.
        </p>

        <p className="mt-3">
          The pirate world, characters, and story are original writing made for this project — see the world bible
          in <code>.claude/skills/pirate-lore/SKILL.md</code> if you're curious how it's put together. No
          copyrighted characters, names, or artwork from any existing franchise are used.
        </p>

        <p className="mt-3">
          Guest play works fully offline in your browser. Signing in (optional) syncs your progress across devices
          via Supabase, governed by row-level security so only you can ever read or write your own data.
        </p>
      </motion.section>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import AuthMenu from './AuthMenu'
import SavePrompt from './SavePrompt'
import ChestToast from './ChestToast'
import TextureDefs from '../motion/TextureDefs'
import PageTransition from '../motion/PageTransition'

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('tga:theme', dark ? 'dark' : 'light')
    } catch {
      /* storage unavailable */
    }
  }, [dark])
  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      className="rounded-full border border-sea-300 px-3 py-1 text-sm dark:border-sea-700"
      aria-pressed={!dark}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}

const navLink = ({ isActive }: { isActive: boolean }) =>
  `rounded px-2 py-1 text-sm font-medium transition-transform hover:scale-105 hover:text-gold-400 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400 ${
    isActive ? 'text-gold-400' : ''
  }`

export default function Layout() {
  return (
    <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-3 sm:px-6">
      <TextureDefs />
      {/* Ambient background: deep-ocean gradient + four wave-swell layers, each its own
          speed/direction/delay so they never look synchronized. Purely decorative. */}
      <svg className="pointer-events-none fixed inset-0 -z-10 h-full w-full" aria-hidden focusable="false">
        <rect width="100%" height="100%" fill="url(#ocean-depth)" className="route-dash-bg" />
        <rect
          x={-240}
          y="10%"
          width="calc(100% + 480px)"
          height={60}
          fill="url(#wave-swell-1)"
          className="wave-layer wave-layer-1"
        />
        <rect
          x={-240}
          y="35%"
          width="calc(100% + 480px)"
          height={60}
          fill="url(#wave-swell-2)"
          className="wave-layer wave-layer-2"
        />
        <rect
          x={-240}
          y="60%"
          width="calc(100% + 480px)"
          height={60}
          fill="url(#wave-swell-3)"
          className="wave-layer wave-layer-3"
        />
        <rect
          x={-240}
          y="85%"
          width="calc(100% + 480px)"
          height={60}
          fill="url(#wave-swell-4)"
          className="wave-layer wave-layer-4"
        />
      </svg>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-sea-200 py-3 dark:border-sea-800">
        <NavLink to="/" className="font-display text-xl font-bold tracking-wide text-sea-700 dark:text-gold-300">
          ☠ The Grand Algorithm
        </NavLink>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-3">
          <NavLink to="/" end className={navLink}>
            Map
          </NavLink>
          <NavLink to="/profile" className={navLink}>
            Profile
          </NavLink>
          <NavLink to="/leaderboard" className={navLink}>
            Leaderboard
          </NavLink>
          <NavLink to="/about" className={navLink}>
            About
          </NavLink>
          <AuthMenu />
          <ThemeToggle />
        </nav>
      </header>
      <main className="relative flex-1 py-4">
        <SavePrompt />
        <PageTransition>
          <Outlet />
        </PageTransition>
        <ChestToast />
      </main>
      <footer className="border-t border-sea-200 py-3 text-center text-xs opacity-70 dark:border-sea-800">
        Chart your course. Solve on LeetCode. Claim The One Solution.
      </footer>
    </div>
  )
}

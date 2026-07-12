import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import AuthMenu from './AuthMenu'
import SavePrompt from './SavePrompt'

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
  `rounded px-2 py-1 text-sm font-medium hover:text-gold-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400 ${
    isActive ? 'text-gold-400' : ''
  }`

export default function Layout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-3 sm:px-6">
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
      <main className="flex-1 py-4">
        <SavePrompt />
        <Outlet />
      </main>
      <footer className="border-t border-sea-200 py-3 text-center text-xs opacity-70 dark:border-sea-800">
        Chart your course. Solve on LeetCode. Claim The One Solution.
      </footer>
    </div>
  )
}

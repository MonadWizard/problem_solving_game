import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useGameStore } from '../store/gameStore'
import AuthModal from './AuthModal'

const SOLVES_BEFORE_PROMPT = 3

export default function SavePrompt() {
  const { user, loading, syncAvailable } = useAuth()
  const ready = useGameStore((s) => s.ready)
  const solveCount = useGameStore((s) => s.local.solves.length)
  const [dismissed, setDismissed] = useState(false)
  const [showModal, setShowModal] = useState(false)

  if (!syncAvailable || !ready || loading || user || dismissed || solveCount < SOLVES_BEFORE_PROMPT) {
    return null
  }

  return (
    <div
      role="status"
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold-500/60 bg-gold-500/10 px-4 py-3 text-sm"
    >
      <p>
        <strong>Save your voyage</strong> — sign in to sync your progress across devices.
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="rounded bg-gold-500 px-3 py-1 font-semibold text-sea-950 hover:bg-gold-400"
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="rounded px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10"
        >
          ✕
        </button>
      </div>
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

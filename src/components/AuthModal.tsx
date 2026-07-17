import { useId } from 'react'
import { useAuth } from '../auth/AuthProvider'

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { signInWithGoogle } = useAuth()
  const titleId = useId()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-lg border border-sea-200 bg-parchment p-5 text-sea-950 shadow-xl dark:border-sea-700 dark:bg-sea-900 dark:text-sea-50"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id={titleId} className="font-display text-lg font-bold">
            Save your voyage
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400"
          >
            ✕
          </button>
        </div>

        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          className="flex w-full items-center justify-center gap-2 rounded border border-sea-300 px-3 py-2 text-sm font-medium hover:bg-sea-100 dark:border-sea-600 dark:hover:bg-sea-800"
        >
          Continue with Google
        </button>
      </div>
    </div>
  )
}

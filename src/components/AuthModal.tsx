import { useId, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { signInWithGoogle, signInWithGithub, signInWithEmail, signUpWithEmail } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)
  const titleId = useId()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = mode === 'signin' ? await signInWithEmail(email, password) : await signUpWithEmail(email, password)
    setBusy(false)
    if (result.error) setError(result.error)
    else if (mode === 'signup') setConfirmSent(true)
    else onClose()
  }

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

        {confirmSent ? (
          <p className="text-sm">Check your email to confirm your account, then sign in.</p>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="rounded border border-sea-300 px-3 py-2 text-sm font-medium hover:bg-sea-100 dark:border-sea-600 dark:hover:bg-sea-800"
              >
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => void signInWithGithub()}
                className="rounded border border-sea-300 px-3 py-2 text-sm font-medium hover:bg-sea-100 dark:border-sea-600 dark:hover:bg-sea-800"
              >
                Continue with GitHub
              </button>
            </div>

            <div className="mb-4 flex items-center gap-2 text-xs opacity-60">
              <div className="h-px flex-1 bg-current" />
              or
              <div className="h-px flex-1 bg-current" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded border border-sea-300 bg-transparent px-2 py-1 dark:border-sea-600"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Password
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded border border-sea-300 bg-transparent px-2 py-1 dark:border-sea-600"
                />
              </label>
              {error && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="rounded bg-gold-500 px-3 py-2 text-sm font-semibold text-sea-950 hover:bg-gold-400 disabled:opacity-60"
              >
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="mt-3 text-xs underline opacity-80 hover:opacity-100"
            >
              {mode === 'signin' ? "New here? Create an account" : 'Already sailing with us? Sign in'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

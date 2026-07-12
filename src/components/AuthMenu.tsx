import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import AuthModal from './AuthModal'

export default function AuthMenu() {
  const { user, loading, syncAvailable, signOut } = useAuth()
  const [showModal, setShowModal] = useState(false)

  if (!syncAvailable) return null
  if (loading) return <span className="text-xs opacity-60">Loading…</span>

  if (user) {
    return (
      <button
        type="button"
        onClick={() => void signOut()}
        className="rounded px-2 py-1 text-sm hover:text-gold-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400"
        title={user.email ?? undefined}
      >
        Sign out
      </button>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="rounded px-2 py-1 text-sm hover:text-gold-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400"
      >
        Sign in
      </button>
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  )
}

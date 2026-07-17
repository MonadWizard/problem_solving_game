import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, syncAvailable } from '../sync/supabaseClient'
import { makeSupabaseCloud } from '../sync/supabaseCloud'
import { attachSyncEngine, onLogin, reconcileOnOpen } from '../sync/engine'
import { useGameStore } from '../store/gameStore'

interface AuthContextValue {
  user: User | null
  /** True until the initial session check (and merge, if logged in) settles. */
  loading: boolean
  /** False when Supabase env vars are absent — guest-only deployment. */
  syncAvailable: boolean
  signInWithGoogle(): Promise<void>
  signOut(): Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// Redirect back to the app's own base URL: query params (the OAuth ?code=)
// precede the hash, so the PKCE callback is picked up on any hash route.
// See .claude/skills/deploy/SKILL.md.
const redirectTo = () => window.location.origin + import.meta.env.BASE_URL

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(syncAvailable)

  useEffect(() => {
    let cancelled = false
    let detachSync: (() => void) | null = null
    // The game store (curriculum + local progress) must load regardless of
    // whether sync is configured — guest mode always works (golden rule 4).
    const initDone = useGameStore.getState().init()

    if (!supabase) {
      void initDone.then(() => {
        if (!cancelled) setLoading(false)
      })
      return () => {
        cancelled = true
      }
    }

    const client = supabase // narrow once; closures below can't see the outer null-check
    const { data: sub } = client.auth.onAuthStateChange((event, session) => {
      if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return
      void (async () => {
        await initDone
        if (cancelled) return

        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null)
          detachSync?.()
          detachSync = null
          setLoading(false)
          return
        }

        const cloud = makeSupabaseCloud(client, session.user.id)
        // A fresh sign-in pushes every local-only row (step 2 of the sync
        // architecture); a restored session just reconciles (step 4) —
        // cheaper, since most rows are already in sync.
        const merged =
          event === 'SIGNED_IN'
            ? await onLogin(useGameStore.getState().local, cloud)
            : await reconcileOnOpen(useGameStore.getState().local, cloud)
        if (cancelled) return

        useGameStore.getState().replaceLocal(merged)
        setUser(session.user)
        detachSync?.()
        detachSync = attachSyncEngine(cloud)
        setLoading(false)
      })()
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
      detachSync?.()
    }
  }, [])

  const value: AuthContextValue = {
    user,
    loading,
    syncAvailable,
    async signInWithGoogle() {
      await supabase?.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo() } })
    },
    async signOut() {
      await supabase?.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

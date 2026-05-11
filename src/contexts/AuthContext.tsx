'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// ── Types ────────────────────────────────────────────────────────
export interface TandemUser {
  id: string
  name: string
  email: string
  start_weight_lbs: number | null
  goal_weight_lbs: number | null
  height_inches: number | null
  program_type: string
  theme_color: string
  current_week: number
}

interface AuthContextValue {
  user: User | null                 // Supabase auth user
  profile: TandemUser | null        // public.users row for current user
  partner: TandemUser | null        // the other user
  loading: boolean
  validated: boolean                // true once getUser() server check has resolved at least once
  sendLoginCode:  (email: string) => Promise<{ error: string | null }>
  verifyLoginCode: (email: string, token: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

// ── Context ──────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

// ── Provider ─────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  // Stable Supabase client across renders — createBrowserClient is not a
  // singleton, so wrapping in useState prevents new instances every render.
  const [supabase] = useState(() => createClient())

  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<TandemUser | null>(null)
  const [partner, setPartner] = useState<TandemUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [validated, setValidated] = useState(false)

  const fetchProfiles = useCallback(async (authUser: User) => {
    // Fetch all users in one query (there are only 2)
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, start_weight_lbs, goal_weight_lbs, height_inches, program_type, theme_color, current_week')

    if (error || !data) {
      console.error('[AuthContext] fetchProfiles error:', error)
      return
    }

    const me = data.find((u) => u.id === authUser.id) ?? null
    const other = data.find((u) => u.id !== authUser.id) ?? null

    setProfile(me as TandemUser | null)
    setPartner(other as TandemUser | null)
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    await fetchProfiles(user)
  }, [user, fetchProfiles])

  // Boot — getUser() is the sole source of truth. The onAuthStateChange listener
  // ignores INITIAL_SESSION (stale localStorage) and TOKEN_REFRESHED (no profile change)
  // to avoid a redirect ping-pong with the middleware.
  useEffect(() => {
    let mounted = true

    supabase.auth.getUser()
      .then(({ data: { user: authUser } }) => {
        if (!mounted) return
        if (!authUser) {
          setUser(null)
          setValidated(true)
          setLoading(false)
          return
        }
        setUser(authUser)
        setValidated(true)
        fetchProfiles(authUser).finally(() => {
          if (mounted) setLoading(false)
        })
      })
      .catch(() => {
        if (!mounted) return
        setUser(null)
        setValidated(true)
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return
        if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return

        const authUser = session?.user ?? null
        setUser(authUser)
        if (authUser) {
          setLoading(true)
          fetchProfiles(authUser).finally(() => {
            if (mounted) setLoading(false)
          })
        } else {
          setProfile(null)
          setPartner(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sendLoginCode = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
    if (error) return { error: error.message }
    return { error: null }
  }

  const verifyLoginCode = async (email: string, token: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setPartner(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, partner, loading, validated, sendLoginCode, verifyLoginCode, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

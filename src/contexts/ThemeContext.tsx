'use client'

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'

// ── Context ──────────────────────────────────────────────────────
interface ThemeContextValue {
  userColor: string
  partnerColor: string
}

const BRAND_GREEN = '#1B5E38'

const ThemeContext = createContext<ThemeContextValue>({
  userColor: BRAND_GREEN,
  partnerColor: BRAND_GREEN,
})

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}

// ── Provider ─────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile, partner } = useAuth()

  const userColor    = profile?.theme_color  ?? BRAND_GREEN
  const partnerColor = partner?.theme_color  ?? BRAND_GREEN

  // Inject the current user's color as a CSS variable on :root
  useEffect(() => {
    document.documentElement.style.setProperty('--user-color', userColor)
  }, [userColor])

  return (
    <ThemeContext.Provider value={{ userColor, partnerColor }}>
      {children}
    </ThemeContext.Provider>
  )
}

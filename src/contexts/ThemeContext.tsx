'use client'

import { createContext, useContext, type ReactNode } from 'react'

// ── Context ──────────────────────────────────────────────────────
interface ThemeContextValue {
  userColor: string
  partnerColor: string
}

// Forest green is hard-locked — never driven by user profile data
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
  // Theme is always forest green — no dynamic override from user profile.
  // The CSS variable --user-color is hardcoded in globals.css.
  return (
    <ThemeContext.Provider value={{ userColor: BRAND_GREEN, partnerColor: BRAND_GREEN }}>
      {children}
    </ThemeContext.Provider>
  )
}

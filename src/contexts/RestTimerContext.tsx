'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface RestTimerCtx {
  secondsLeft:  number
  durationSecs: number | null
  exerciseName: string | null
  isActive:     boolean
  startTimer:   (seconds: number, exerciseName: string) => void
  cancelTimer:  () => void
}

// ── Storage keys ──────────────────────────────────────────────────────────────

const K_END  = 'tandem:rest:endTs'
const K_DUR  = 'tandem:rest:durationSecs'
const K_NAME = 'tandem:rest:exerciseName'

// ── Context ───────────────────────────────────────────────────────────────────

const RestTimerContext = createContext<RestTimerCtx | null>(null)

export function useRestTimer(): RestTimerCtx {
  const ctx = useContext(RestTimerContext)
  if (!ctx) throw new Error('useRestTimer must be used inside <RestTimerProvider>')
  return ctx
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [endTs,        setEndTs]        = useState<number | null>(null)
  const [durationSecs, setDurationSecs] = useState<number | null>(null)
  const [exerciseName, setExerciseName] = useState<string | null>(null)
  const [secondsLeft,  setSecondsLeft]  = useState(0)
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const notifyTimeout  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Rehydrate from localStorage on mount ────────────────────────────────────
  useEffect(() => {
    const storedEnd  = localStorage.getItem(K_END)
    const storedDur  = localStorage.getItem(K_DUR)
    const storedName = localStorage.getItem(K_NAME)
    if (!storedEnd) return

    const end = parseInt(storedEnd, 10)
    if (end <= Date.now()) {
      localStorage.removeItem(K_END)
      localStorage.removeItem(K_DUR)
      localStorage.removeItem(K_NAME)
      return
    }

    setEndTs(end)
    setDurationSecs(storedDur ? parseInt(storedDur, 10) : null)
    setExerciseName(storedName)

    // Reschedule notification for remaining time
    const remaining = Math.max(0, end - Date.now())
    notifyTimeout.current = setTimeout(() => fireNotification(storedName), remaining)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tick loop ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!endTs) {
      setSecondsLeft(0)
      return
    }

    const tick = () => {
      // Always read from localStorage to survive stale closure across re-renders
      const stored = localStorage.getItem(K_END)
      const ts     = stored ? parseInt(stored, 10) : endTs
      const left   = Math.max(0, Math.ceil((ts - Date.now()) / 1000))
      setSecondsLeft(left)

      if (left === 0) {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
        setEndTs(null)
        setDurationSecs(null)
        setExerciseName(null)
        localStorage.removeItem(K_END)
        localStorage.removeItem(K_DUR)
        localStorage.removeItem(K_NAME)
      }
    }

    tick()
    intervalRef.current = setInterval(tick, 500)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [endTs])

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function fireNotification(name: string | null) {
    if (typeof window === 'undefined') return
    if (Notification.permission === 'granted') {
      new Notification('Rest done — next set!', {
        body:      name ?? 'Time to lift.',
        tag:       'tandem-rest',
        renotify:  false,
        icon:      '/favicon.ico',
      })
    }
  }

  // ── startTimer ───────────────────────────────────────────────────────────────

  const startTimer = useCallback((seconds: number, name: string) => {
    if (typeof window === 'undefined') return

    // Request notification permission from within the user-gesture call chain
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Clear any existing timer
    if (intervalRef.current)   clearInterval(intervalRef.current)
    if (notifyTimeout.current) clearTimeout(notifyTimeout.current)

    const end = Date.now() + seconds * 1000

    localStorage.setItem(K_END,  String(end))
    localStorage.setItem(K_DUR,  String(seconds))
    localStorage.setItem(K_NAME, name)

    setEndTs(end)
    setDurationSecs(seconds)
    setExerciseName(name)

    notifyTimeout.current = setTimeout(() => fireNotification(name), seconds * 1000)
  }, [])

  // ── cancelTimer ──────────────────────────────────────────────────────────────

  const cancelTimer = useCallback(() => {
    if (intervalRef.current)   clearInterval(intervalRef.current)
    if (notifyTimeout.current) clearTimeout(notifyTimeout.current)
    intervalRef.current   = null
    notifyTimeout.current = null

    localStorage.removeItem(K_END)
    localStorage.removeItem(K_DUR)
    localStorage.removeItem(K_NAME)

    setEndTs(null)
    setDurationSecs(null)
    setExerciseName(null)
    setSecondsLeft(0)
  }, [])

  const isActive = secondsLeft > 0

  return (
    <RestTimerContext.Provider value={{
      secondsLeft,
      durationSecs,
      exerciseName,
      isActive,
      startTimer,
      cancelTimer,
    }}>
      {children}
    </RestTimerContext.Provider>
  )
}

'use client'

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LoggedSet {
  setNumber:    number
  weightLbs:    number
  reps:         number
  estimated1rm: number
  isPr:         boolean
}

interface WorkoutSessionCtx {
  sessionId:     string | null
  completedSets: Record<string, LoggedSet[]>
  totalSets:     number
  newPrs:        number
  isComplete:    boolean
  logSet: (
    exerciseName: string,
    weightLbs:    number,
    reps:         number,
    rpe?:         number,
  ) => Promise<LoggedSet>
  markComplete: () => Promise<void>
}

// ── Context ───────────────────────────────────────────────────────────────────

const WorkoutSessionContext = createContext<WorkoutSessionCtx | null>(null)

export function useWorkoutSession(): WorkoutSessionCtx {
  const ctx = useContext(WorkoutSessionContext)
  if (!ctx) throw new Error('useWorkoutSession must be used inside <WorkoutSessionProvider>')
  return ctx
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function WorkoutSessionProvider({
  children,
  dayType,
  userId,
}: {
  children: ReactNode
  dayType:  string
  userId:   string
}) {
  const supabase = createClient()

  // Refs avoid stale-closure issues in callbacks — no re-render needed
  const sessionIdRef  = useRef<string | null>(null)
  const setCountRef   = useRef<Record<string, number>>({})
  const startedAtRef  = useRef<number | null>(null)

  const [sessionId, setSessionId]       = useState<string | null>(null)
  const [completedSets, setCompletedSets] = useState<Record<string, LoggedSet[]>>({})
  const [isComplete, setIsComplete]     = useState(false)

  // ── ensureSession ───────────────────────────────────────────────────────────
  // Lazily creates (or retrieves) today's workout_sessions row.
  // Caches the ID in a ref so subsequent calls are instant.

  const ensureSession = useCallback(async (): Promise<string> => {
    if (sessionIdRef.current) return sessionIdRef.current

    const today = new Date().toISOString().split('T')[0]

    // Check for an existing session for today
    const { data: existing } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('session_date', today)
      .maybeSingle()

    if (existing?.id) {
      sessionIdRef.current = existing.id
      setSessionId(existing.id)
      return existing.id
    }

    // Create a new session
    const { data: created, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id:      userId,
        session_date: today,
        day_type:     dayType,
        completed:    false,
      })
      .select('id')
      .single()

    if (error || !created) throw new Error('Failed to create workout session')

    sessionIdRef.current = created.id
    setSessionId(created.id)
    return created.id
  }, [supabase, userId, dayType])

  // ── logSet ──────────────────────────────────────────────────────────────────
  // Ensures a session exists, inserts the set row, returns enriched result.
  // DB triggers auto-populate estimated_1rm_lbs and is_pr.

  const logSet = useCallback(async (
    exerciseName: string,
    weightLbs:    number,
    reps:         number,
    rpe?:         number,
  ): Promise<LoggedSet> => {
    const sid = await ensureSession()

    // Track start time on first set
    if (!startedAtRef.current) startedAtRef.current = Date.now()

    const setNumber = (setCountRef.current[exerciseName] ?? 0) + 1
    setCountRef.current[exerciseName] = setNumber

    const { data, error } = await supabase
      .from('sets')
      .insert({
        session_id:    sid,
        user_id:       userId,
        exercise_name: exerciseName,
        set_number:    setNumber,
        weight_lbs:    weightLbs,
        reps,
        rpe:           rpe ?? null,
      })
      .select('id, estimated_1rm_lbs, is_pr')
      .single()

    if (error || !data) throw new Error('Failed to log set')

    const logged: LoggedSet = {
      setNumber,
      weightLbs,
      reps,
      estimated1rm: data.estimated_1rm_lbs ?? 0,
      isPr:         data.is_pr ?? false,
    }

    setCompletedSets(prev => ({
      ...prev,
      [exerciseName]: [...(prev[exerciseName] ?? []), logged],
    }))

    return logged
  }, [ensureSession, supabase, userId])

  // ── markComplete ────────────────────────────────────────────────────────────
  // Flips completed = true on the session row, triggering the streak DB update.

  const markComplete = useCallback(async () => {
    const sid = await ensureSession()

    const durationMinutes = startedAtRef.current
      ? Math.max(1, Math.round((Date.now() - startedAtRef.current) / 60_000))
      : null

    await supabase
      .from('workout_sessions')
      .update({
        completed: true,
        ...(durationMinutes ? { duration_minutes: durationMinutes } : {}),
      })
      .eq('id', sid)

    setIsComplete(true)
  }, [ensureSession, supabase])

  // ── Derived ─────────────────────────────────────────────────────────────────

  const totalSets = Object.values(completedSets).reduce((n, sets) => n + sets.length, 0)
  const newPrs    = Object.values(completedSets).flat().filter(s => s.isPr).length

  return (
    <WorkoutSessionContext.Provider value={{
      sessionId,
      completedSets,
      totalSets,
      newPrs,
      isComplete,
      logSet,
      markComplete,
    }}>
      {children}
    </WorkoutSessionContext.Provider>
  )
}

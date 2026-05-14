'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useWorkoutSession, type LoggedSet } from '@/contexts/WorkoutSessionContext'
import { useRestTimer } from '@/contexts/RestTimerContext'
import { calcRM } from '@/lib/overload'
import type { Recommendation } from '@/lib/overload'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SetRow {
  weight: string
  reps:   string
  done:   boolean
  logged?: LoggedSet
}

interface Props {
  exerciseName:   string
  isCompound:     boolean
  targetSets:     number
  recommendation: Recommendation | null
  restSeconds?:   number
  userId:         string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function roundTo5(n: number): number {
  return Math.round(n / 5) * 5
}

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SetLogger({
  exerciseName,
  targetSets,
  recommendation,
  restSeconds,
  userId,
}: Props) {
  const { logSet } = useWorkoutSession()
  const { secondsLeft, durationSecs, exerciseName: timerExercise, startTimer, cancelTimer } = useRestTimer()
  const supabase = useRef(createClient()).current

  const defaultWeight = recommendation?.weight != null
    ? String(roundTo5(recommendation.weight))
    : ''

  const makeEmptyRow = (): SetRow => ({ weight: defaultWeight, reps: '', done: false })

  const [rows, setRows] = useState<SetRow[]>(
    Array.from({ length: Math.max(targetSets, 1) }, makeEmptyRow)
  )
  const [liveRM, setLiveRM] = useState<number | null>(null)
  const [logging, setLogging] = useState<number | null>(null) // index being logged

  // ── Note persistence ──────────────────────────────────────────────────────
  const [note, setNote] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let mounted = true
    supabase
      .from('exercise_notes')
      .select('note')
      .eq('user_id', userId)
      .eq('exercise_name', exerciseName)
      .maybeSingle()
      .then(({ data }) => {
        if (mounted && data?.note) setNote(data.note)
      })
    return () => { mounted = false }
  }, [exerciseName, userId, supabase])

  const saveNote = useCallback((value: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      supabase.from('exercise_notes').upsert(
        { user_id: userId, exercise_name: exerciseName, note: value, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,exercise_name' }
      )
    }, 800)
  }, [supabase, userId, exerciseName])

  const handleNoteChange = (v: string) => {
    setNote(v)
    saveNote(v)
  }

  // ── Live 1RM update ───────────────────────────────────────────────────────

  function handleWeightOrRepsChange(idx: number, field: 'weight' | 'reps', value: string) {
    setRows(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
    // Update live 1RM from this row
    const row = rows[idx]
    const w = parseFloat(field === 'weight' ? value : row.weight)
    const r = parseInt(field === 'reps'   ? value : row.reps, 10)
    if (!isNaN(w) && !isNaN(r) && r > 0 && w > 0) {
      setLiveRM(calcRM(w, r))
    }
  }

  // ── Log a set row ─────────────────────────────────────────────────────────

  const handleCheck = async (idx: number) => {
    const row = rows[idx]
    const w = parseFloat(row.weight)
    const r = parseInt(row.reps, 10)
    if (isNaN(w) || isNaN(r) || r < 1 || w < 0) return
    if (logging !== null) return

    setLogging(idx)
    try {
      const logged = await logSet(exerciseName, w, r)
      setRows(prev => {
        const next = [...prev]
        next[idx] = { ...next[idx], done: true, logged }
        return next
      })
      setLiveRM(logged.estimated1rm || null)
      if (restSeconds) startTimer(restSeconds, exerciseName)
    } catch (err) {
      console.error('[SetLogger] logSet failed:', err)
    } finally {
      setLogging(null)
    }
  }

  const addRow = () => setRows(prev => [...prev, makeEmptyRow()])

  // ── Timer display ─────────────────────────────────────────────────────────
  const isMyTimer = timerExercise === exerciseName && secondsLeft > 0
  const progress  = (durationSecs && durationSecs > 0) ? (secondsLeft / durationSecs) : 0

  // ── Completed count ───────────────────────────────────────────────────────
  const doneCount = rows.filter(r => r.done).length

  return (
    <div className="space-y-3">

      {/* Live 1RM bar */}
      {liveRM !== null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
            <span style={{ color: 'var(--set-active)' }}>Live 1RM</span>
            <span className="font-mono text-white/60">{Math.round(liveRM)} lbs</span>
          </div>
          <div className="h-0.5 w-full rounded-full" style={{ backgroundColor: 'rgba(124,58,237,0.20)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min((liveRM / 500) * 100, 100)}%`, backgroundColor: 'var(--set-active)' }}
            />
          </div>
        </div>
      )}

      {/* Set grid header */}
      <div className="grid grid-cols-[36px_1fr_1fr_52px_36px] gap-1.5 text-[9px] text-white/30 uppercase tracking-widest px-0.5">
        <span>Set</span>
        <span>LBS</span>
        <span>Reps</span>
        <span className="text-right">Vol</span>
        <span />
      </div>

      {/* Set rows */}
      <div className="space-y-1.5">
        {rows.map((row, idx) => {
          const isDone    = row.done
          const isActive  = !isDone && idx === rows.findIndex(r => !r.done)
          const vol       = (() => {
            const w = parseFloat(row.weight)
            const r = parseInt(row.reps, 10)
            return (!isNaN(w) && !isNaN(r)) ? w * r : null
          })()

          const borderColor = isDone
            ? 'var(--set-done)'
            : isActive
              ? 'var(--set-active)'
              : 'rgba(255,255,255,0.10)'

          const textColor = isDone
            ? '#1B5E38'
            : isActive
              ? '#7C3AED'
              : 'rgba(255,255,255,0.30)'

          return (
            <div
              key={idx}
              className="grid grid-cols-[36px_1fr_1fr_52px_36px] gap-1.5 items-center"
            >
              {/* Set label */}
              <span
                className="text-xs font-mono font-bold text-center"
                style={{ color: textColor }}
              >
                S{idx + 1}
              </span>

              {/* Weight input */}
              <input
                type="number"
                value={row.weight}
                onChange={e => handleWeightOrRepsChange(idx, 'weight', e.target.value)}
                disabled={isDone}
                placeholder="lbs"
                className="w-full rounded px-2 py-2 text-center text-sm font-mono font-bold disabled:opacity-60 focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${borderColor}`,
                  color: isDone ? '#1B5E38' : isActive ? '#7C3AED' : 'white',
                }}
              />

              {/* Reps input */}
              <input
                type="number"
                value={row.reps}
                onChange={e => handleWeightOrRepsChange(idx, 'reps', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCheck(idx)}
                disabled={isDone}
                placeholder="reps"
                className="w-full rounded px-2 py-2 text-center text-sm font-mono font-bold disabled:opacity-60 focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${borderColor}`,
                  color: isDone ? '#1B5E38' : isActive ? '#7C3AED' : 'white',
                }}
              />

              {/* Volume */}
              <span className="text-right text-[10px] font-mono text-white/40 tabular-nums">
                {vol !== null ? vol.toLocaleString() : '—'}
              </span>

              {/* Check button */}
              <button
                onClick={() => handleCheck(idx)}
                disabled={isDone || logging === idx}
                className="w-8 h-8 rounded flex items-center justify-center transition-all"
                style={{
                  backgroundColor: isDone ? 'rgba(27,94,56,0.20)' : isActive ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${borderColor}`,
                }}
              >
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B5E38" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : logging === idx ? (
                  <span className="text-[10px] text-white/40">…</span>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Action row: +Set | Plates | 1RM */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          onClick={addRow}
          className="py-2 text-[10px] font-tight font-bold italic uppercase tracking-wide rounded transition-colors"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.50)', border: '1px dashed rgba(255,255,255,0.15)' }}
        >
          + Set
        </button>
        <button
          className="py-2 text-[10px] font-tight font-bold italic uppercase tracking-wide rounded transition-colors"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.50)', border: '1px dashed rgba(255,255,255,0.15)' }}
        >
          🏋 Plates
        </button>
        <button
          className="py-2 text-[10px] font-tight font-bold italic uppercase tracking-wide rounded transition-colors"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.50)', border: '1px dashed rgba(255,255,255,0.15)' }}
        >
          📊 1RM
        </button>
      </div>

      {/* Rest timer — embedded, only shows for THIS exercise */}
      {isMyTimer && (
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="text-[10px] text-white/40 uppercase tracking-widest w-10">REST</span>
          <span className="font-mono text-2xl font-bold tabular-nums" style={{ color: 'var(--user-color)' }}>
            {fmt(secondsLeft)}
          </span>
          <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%`, backgroundColor: 'var(--user-color)' }}
            />
          </div>
          <button
            onClick={cancelTimer}
            className="text-[10px] text-white/40 border border-white/15 px-2 py-1 rounded uppercase tracking-widest hover:text-white/70 transition-colors"
          >
            Skip
          </button>
        </div>
      )}

      {/* Notes */}
      <textarea
        value={note}
        onChange={e => handleNoteChange(e.target.value)}
        placeholder="Notes — feel, pain level, weight adjustments..."
        rows={2}
        className="w-full rounded px-3 py-2.5 text-sm resize-none focus:outline-none transition-colors placeholder:text-white/20"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.75)',
        }}
      />

    </div>
  )
}

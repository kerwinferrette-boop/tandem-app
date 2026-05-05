'use client'

/**
 * Manual Apple Health data entry form.
 *
 * iOS native bridge note: A future iOS WKWebView integration would call
 * POST /api/health-sync with a HealthKit payload — this form is the web fallback
 * for manual entry when the native bridge is unavailable.
 */

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ReadinessInput } from '@/lib/readiness'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  userId:          string
  /** Called after a successful save so parent can update ReadinessScore. */
  onSave?: (data: ReadinessInput) => void
}

interface FormState {
  hrv_ms:           string
  hrv_7day_avg_ms:  string
  sleep_hours:      string
  rhr_bpm:          string
  baseline_rhr_bpm: string
  steps:            string
  weight_lbs:       string
  body_fat_pct:     string
  calories_burned:  string
  active_minutes:   string
  notes:            string
}

const EMPTY: FormState = {
  hrv_ms:           '',
  hrv_7day_avg_ms:  '',
  sleep_hours:      '',
  rhr_bpm:          '',
  baseline_rhr_bpm: '',
  steps:            '',
  weight_lbs:       '',
  body_fat_pct:     '',
  calories_burned:  '',
  active_minutes:   '',
  notes:            '',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function n(s: string): number | null {
  const v = parseFloat(s)
  return isNaN(v) ? null : v
}

function i(s: string): number | null {
  const v = parseInt(s, 10)
  return isNaN(v) ? null : v
}

// ── Field sub-component (module scope — must not be inside HealthDataForm) ────

interface FieldProps {
  label:       string
  unit?:       string
  placeholder: string
  step?:       string
  value:       string
  onChange:    (value: string) => void
}

function Field({ label, unit, placeholder, step = 'any', value, onChange }: FieldProps) {
  return (
    <div>
      <label className="block text-[10px] text-white/40 uppercase tracking-widest font-tight font-bold italic mb-1">
        {label}
        {unit && <span className="text-white/25 ml-1 normal-case not-italic font-normal">({unit})</span>}
      </label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full bg-white/5 border border-white/20 px-3 py-2
          text-sm text-white placeholder:text-white/25
          focus:outline-none focus:border-[var(--user-color)]
          transition-colors
        "
      />
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HealthDataForm({ userId, onSave }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [form,    setForm]    = useState<FormState>(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  function update(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setSaved(false)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

    const { error: dbError } = await supabase
      .from('health_snapshots')
      .upsert({
        user_id:          userId,
        snapshot_date:    today,
        hrv_ms:           n(form.hrv_ms),
        hrv_7day_avg_ms:  n(form.hrv_7day_avg_ms),
        sleep_hours:      n(form.sleep_hours),
        rhr_bpm:          i(form.rhr_bpm),
        baseline_rhr_bpm: i(form.baseline_rhr_bpm),
        steps:            i(form.steps),
        weight_lbs:       n(form.weight_lbs),
        body_fat_pct:     n(form.body_fat_pct),
        calories_burned:  i(form.calories_burned),
        active_minutes:   i(form.active_minutes),
        notes:            form.notes || null,
      }, {
        onConflict: 'user_id,snapshot_date',
      })

    setSaving(false)

    if (dbError) {
      setError(dbError.message)
      return
    }

    setSaved(true)

    // Notify parent with readiness-relevant fields
    if (onSave) {
      onSave({
        hrv_ms:           n(form.hrv_ms)           ?? 0,
        hrv_7day_avg_ms:  n(form.hrv_7day_avg_ms)  ?? 0,
        sleep_hours:      n(form.sleep_hours)       ?? 0,
        rhr_bpm:          i(form.rhr_bpm)           ?? 0,
        baseline_rhr_bpm: i(form.baseline_rhr_bpm)  ?? 0,
        steps:            i(form.steps)             ?? 0,
      })
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="border border-white/10 bg-white/5 p-4 space-y-5">

      <h3 className="font-tight font-bold italic uppercase tracking-tight text-[var(--user-color)] text-sm">
        Log Health Data
      </h3>

      {/* HRV */}
      <div className="space-y-3">
        <div className="text-[10px] text-white/25 uppercase tracking-widest">Heart Rate Variability</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Today's HRV"   unit="ms"  placeholder="e.g. 58" value={form.hrv_ms}          onChange={v => update('hrv_ms', v)} />
          <Field label="7-Day Avg HRV" unit="ms"  placeholder="e.g. 52" value={form.hrv_7day_avg_ms} onChange={v => update('hrv_7day_avg_ms', v)} />
        </div>
      </div>

      {/* Sleep */}
      <Field label="Sleep" unit="hrs" placeholder="e.g. 7.5" step="0.5" value={form.sleep_hours} onChange={v => update('sleep_hours', v)} />

      {/* Heart rate */}
      <div className="space-y-3">
        <div className="text-[10px] text-white/25 uppercase tracking-widest">Resting Heart Rate</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Today's RHR"  unit="bpm" placeholder="e.g. 62" step="1" value={form.rhr_bpm}          onChange={v => update('rhr_bpm', v)} />
          <Field label="Baseline RHR" unit="bpm" placeholder="e.g. 58" step="1" value={form.baseline_rhr_bpm} onChange={v => update('baseline_rhr_bpm', v)} />
        </div>
      </div>

      {/* Activity */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Steps"          placeholder="e.g. 7400" step="1" value={form.steps}          onChange={v => update('steps', v)} />
        <Field label="Active Minutes" placeholder="e.g. 45"   step="1" value={form.active_minutes} onChange={v => update('active_minutes', v)} />
      </div>

      {/* Body */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Weight"   unit="lbs" placeholder="e.g. 225.5" value={form.weight_lbs}   onChange={v => update('weight_lbs', v)} />
        <Field label="Body Fat" unit="%"   placeholder="e.g. 18.2"  value={form.body_fat_pct} onChange={v => update('body_fat_pct', v)} />
      </div>

      {/* Calories */}
      <Field label="Calories Burned" unit="kcal" placeholder="e.g. 2800" step="1" value={form.calories_burned} onChange={v => update('calories_burned', v)} />

      {/* Notes */}
      <div>
        <label className="block text-[10px] text-white/40 uppercase tracking-widest font-tight font-bold italic mb-1">
          Notes
        </label>
        <textarea
          value={form.notes}
          onChange={e => { update('notes', e.target.value) }}
          placeholder="How are you feeling today?"
          rows={2}
          className="
            w-full bg-white/5 border border-white/20 px-3 py-2
            text-sm text-white placeholder:text-white/25 resize-none
            focus:outline-none focus:border-[var(--user-color)]
            transition-colors
          "
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-xs uppercase tracking-wide">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="
          w-full py-3 border text-xs font-tight font-bold italic uppercase tracking-tight
          transition-all duration-150
          border-[var(--user-color)] bg-[var(--user-color)]/10 text-[var(--user-color)]
          hover:bg-[var(--user-color)]/20
          disabled:opacity-40 disabled:cursor-not-allowed
        "
      >
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Health Data'}
      </button>

    </form>
  )
}

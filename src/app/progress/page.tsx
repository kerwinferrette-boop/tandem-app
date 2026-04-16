// ── /progress ─────────────────────────────────────────────────────────────────
// Server component — fetches user weight data + PRs, renders progress view.

import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import WeightThermometer  from '@/components/progress/WeightThermometer'
import PRHistory          from '@/components/progress/PRHistory'
import type { PersonalRecord } from '@/components/progress/PRHistory'

export const dynamic = 'force-dynamic'

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProgressPage() {
  const supabase = await createClient()

  // ── Auth guard ─────────────────────────────────────────────────────────────

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── Fetch user profile ─────────────────────────────────────────────────────

  const { data: profile } = await supabase
    .from('users')
    .select('name, start_weight_lbs, goal_weight_lbs')
    .eq('id', user.id)
    .single()

  // ── Fetch most recent weight from health_snapshots ─────────────────────────

  const { data: latestSnapshot } = await supabase
    .from('health_snapshots')
    .select('weight_lbs, snapshot_date')
    .eq('user_id', user.id)
    .not('weight_lbs', 'is', null)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  // ── Fetch personal records ─────────────────────────────────────────────────

  const { data: prs } = await supabase
    .from('personal_records')
    .select('exercise_name, best_weight_lbs, best_reps, estimated_1rm_lbs, achieved_at')
    .eq('user_id', user.id)
    .order('exercise_name', { ascending: true })

  // ── Derived values ─────────────────────────────────────────────────────────

  const startLbs   = profile?.start_weight_lbs ?? 0
  const goalLbs    = profile?.goal_weight_lbs  ?? 0
  const currentLbs = latestSnapshot?.weight_lbs ?? startLbs

  const records: PersonalRecord[] = (prs ?? []) as PersonalRecord[]

  const hasWeightData = startLbs > 0 && goalLbs > 0

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--carbon-grey,#1A1A1A)] text-white">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Page header */}
        <div className="space-y-1">
          <h1 className="font-tight font-bold italic uppercase tracking-tight text-2xl text-white">
            Progress
          </h1>
          {profile?.name && (
            <p className="text-[10px] text-white/30 uppercase tracking-widest">
              {profile.name.split(' ')[0]}&apos;s journey
            </p>
          )}
        </div>

        {/* Weight thermometer */}
        {hasWeightData ? (
          <WeightThermometer
            startLbs={startLbs}
            currentLbs={currentLbs}
            goalLbs={goalLbs}
          />
        ) : (
          <div className="border border-white/10 bg-white/5 p-6 text-center space-y-2">
            <p className="text-white/30 text-sm uppercase tracking-widest font-tight font-bold italic">
              Weight data unavailable
            </p>
            <p className="text-white/20 text-xs">
              Log health data to track weight progress
            </p>
          </div>
        )}

        {/* Personal records */}
        <PRHistory records={records} />

      </div>
    </div>
  )
}

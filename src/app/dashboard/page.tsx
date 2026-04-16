import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { OverloadRow } from '@/components/workout/ExerciseList'
import WorkoutDashboard from '@/components/workout/WorkoutDashboard'
import RM_Calculator from '@/components/tools/RM_Calculator'
import PlateCalculator from '@/components/tools/PlateCalculator'

// ── Types ─────────────────────────────────────────────────────────────────────

interface OverloadViewRow {
  exercise_name:                string
  recommended_next_weight_lbs:  number
  recommendation:               string
  min_reps_hit:                 number
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()

  // ── Auth guard ──────────────────────────────────────────────────────────────
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  // ── Fetch user profile ──────────────────────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, name, program_type, current_week, theme_color')
    .eq('id', authUser.id)
    .single()

  if (profileError || !profile) redirect('/login')

  // ── Fetch progressive overload recommendations ──────────────────────────────
  const { data: overloadRows } = await supabase
    .from('progressive_overload_recommendations')
    .select('exercise_name, recommended_next_weight_lbs, recommendation, min_reps_hit')
    .eq('user_id', authUser.id)

  // Build keyed map for O(1) lookup in ExerciseList
  const overloadMap: Record<string, OverloadRow> = {}
  for (const row of (overloadRows ?? []) as OverloadViewRow[]) {
    overloadMap[row.exercise_name] = {
      recommended_next_weight_lbs: row.recommended_next_weight_lbs,
      recommendation:              row.recommendation,
      min_reps_hit:                row.min_reps_hit,
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const firstName = profile.name?.split(' ')[0] ?? 'Athlete'

  return (
    <main className="min-h-screen bg-[#1A1A1A] text-white">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-10">

        {/* Greeting */}
        <div>
          <p className="text-[var(--user-color)] text-xs font-tight font-bold italic uppercase tracking-widest mb-1">
            Today&apos;s Session
          </p>
          <h1 className="font-tight font-bold italic uppercase tracking-tight text-white text-3xl leading-tight">
            Let&apos;s work,<br />{firstName}.
          </h1>
        </div>

        {/* Workout dashboard — client component */}
        <WorkoutDashboard
          user={{
            id:           profile.id,
            program_type: profile.program_type ?? 'build_muscle',
            current_week: profile.current_week ?? 1,
          }}
          overloadMap={overloadMap}
        />

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] text-white/25 font-tight font-bold italic uppercase tracking-widest">
            Tools
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Tools */}
        <div className="space-y-4">
          <RM_Calculator />
          <PlateCalculator />
        </div>

      </div>
    </main>
  )
}

import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { OverloadRow } from '@/components/workout/ExerciseList'
import WorkoutDashboard  from '@/components/workout/WorkoutDashboard'
import RM_Calculator     from '@/components/tools/RM_Calculator'
import PlateCalculator   from '@/components/tools/PlateCalculator'

export const dynamic = 'force-dynamic'

interface OverloadViewRow {
  exercise_name:               string
  recommended_next_weight_lbs: number
  recommendation:              string
  min_reps_hit:                number
}

export default async function TrainPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, program_type, current_week')
    .eq('id', authUser.id)
    .single()

  if (profileError || !profile) redirect('/login')

  const { data: overloadRows } = await supabase
    .from('progressive_overload_recommendations')
    .select('exercise_name, recommended_next_weight_lbs, recommendation, min_reps_hit')
    .eq('user_id', authUser.id)

  const overloadMap: Record<string, OverloadRow> = {}
  for (const row of (overloadRows ?? []) as OverloadViewRow[]) {
    overloadMap[row.exercise_name] = {
      recommended_next_weight_lbs: row.recommended_next_weight_lbs,
      recommendation:              row.recommendation,
      min_reps_hit:                row.min_reps_hit,
    }
  }

  return (
    <main className="min-h-screen text-white" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-6">

        <div>
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--user-color)' }}>
            Today&apos;s Session
          </p>
          <h1 className="font-tight font-black italic uppercase tracking-tight text-white text-3xl leading-tight">
            Train
          </h1>
        </div>

        <WorkoutDashboard
          user={{
            id:           profile.id,
            program_type: profile.program_type ?? 'build_muscle',
            current_week: profile.current_week ?? 1,
          }}
          overloadMap={overloadMap}
        />

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] text-white/20 font-tight font-bold italic uppercase tracking-widest">
            Tools
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="space-y-4">
          <RM_Calculator />
          <PlateCalculator />
        </div>

      </div>
    </main>
  )
}

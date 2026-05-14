import { redirect }    from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient    from './ProfileClient'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, email, program_type, current_week, program_weeks, start_weight_lbs, goal_weight_lbs')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const today = new Date().toISOString().slice(0, 10)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  // Today's health snapshot
  const { data: todaySnap } = await supabase
    .from('health_snapshots')
    .select('weight_lbs, steps, sleep_hours, hrv_ms, rhr_bpm, calories_burned, active_minutes, body_fat_pct')
    .eq('user_id', user.id)
    .eq('snapshot_date', today)
    .maybeSingle()

  // Last 7 days for weekly summary
  const { data: weekSnaps } = await supabase
    .from('health_snapshots')
    .select('weight_lbs, steps, sleep_hours, hrv_ms')
    .eq('user_id', user.id)
    .gte('snapshot_date', sevenDaysAgo)
    .order('snapshot_date', { ascending: false })

  // Compute weekly averages
  const snaps = weekSnaps ?? []
  const avg = (arr: (number | null)[]) => {
    const vals = arr.filter((v): v is number => v !== null)
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null
  }
  const weekStats = {
    avg_weight: avg(snaps.map(s => s.weight_lbs)),
    total_steps: snaps.reduce((sum, s) => sum + (s.steps ?? 0), 0),
    avg_sleep:   avg(snaps.map(s => s.sleep_hours)),
    avg_hrv:     avg(snaps.map(s => s.hrv_ms)),
  }

  return (
    <ProfileClient
      profile={{
        id:            profile.id,
        name:          profile.name,
        email:         profile.email,
        program_type:  profile.program_type ?? 'build_muscle',
        current_week:  profile.current_week ?? 1,
        program_weeks: profile.program_weeks ?? 12,
        start_weight:  profile.start_weight_lbs ?? null,
        goal_weight:   profile.goal_weight_lbs ?? null,
      }}
      todaySnap={todaySnap ?? null}
      weekStats={weekStats}
    />
  )
}

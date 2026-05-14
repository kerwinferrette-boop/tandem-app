'use client'

import { useRouter } from 'next/navigation'
import { useAuth }   from '@/contexts/AuthContext'
import HealthDataForm from '@/components/health/HealthDataForm'

const GOAL_LABELS: Record<string, string> = {
  fat_burn:     'Fat Burn',
  build_muscle: 'Build Muscle',
  transform:    'Transform',
}

interface ProfileData {
  id:            string
  name:          string
  email:         string
  program_type:  string
  current_week:  number
  program_weeks: number
  start_weight:  number | null
  goal_weight:   number | null
}

interface TodaySnap {
  weight_lbs:      number | null
  steps:           number | null
  sleep_hours:     number | null
  hrv_ms:          number | null
  rhr_bpm:         number | null
  calories_burned: number | null
  active_minutes:  number | null
  body_fat_pct:    number | null
}

interface WeekStats {
  avg_weight:  number | null
  total_steps: number
  avg_sleep:   number | null
  avg_hrv:     number | null
}

interface Props {
  profile:   ProfileData
  todaySnap: TodaySnap | null
  weekStats: WeekStats
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="p-4 rounded-lg space-y-1"
      style={{ backgroundColor: '#1A2035', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="text-[9px] text-white/35 uppercase tracking-widest">{label}</div>
      <div className="font-mono font-bold text-sm tabular-nums" style={{ color: 'var(--user-color)' }}>
        {value}
      </div>
    </div>
  )
}

export default function ProfileClient({ profile, todaySnap, weekStats }: Props) {
  const { signOut } = useAuth()
  const router      = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const firstName  = profile.name?.split(' ')[0] ?? 'Athlete'
  const goalLabel  = GOAL_LABELS[profile.program_type] ?? profile.program_type

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-lg mx-auto px-4 pt-8 pb-24 space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-tight font-black italic text-white flex-shrink-0"
            style={{ backgroundColor: 'var(--user-color)' }}
          >
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-tight font-black italic uppercase tracking-tight text-white text-2xl leading-tight">
              {firstName}
            </h1>
            <p className="text-[10px] text-white/35 uppercase tracking-widest">{profile.email}</p>
          </div>
        </div>

        {/* Goals */}
        <div className="space-y-3">
          <p className="text-[10px] text-white/35 uppercase tracking-widest">Goals</p>
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Program"      value={goalLabel} />
            <StatTile label="Week"         value={`${profile.current_week} / ${profile.program_weeks}`} />
            <StatTile label="Start Weight" value={profile.start_weight ? `${profile.start_weight} lbs` : '—'} />
            <StatTile label="Goal Weight"  value={profile.goal_weight  ? `${profile.goal_weight} lbs`  : '—'} />
          </div>
        </div>

        {/* Today's health data */}
        <div className="space-y-3">
          <p className="text-[10px] text-white/35 uppercase tracking-widest">Today</p>
          {todaySnap ? (
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Weight"          value={todaySnap.weight_lbs      ? `${todaySnap.weight_lbs} lbs`       : '—'} />
              <StatTile label="Steps"           value={todaySnap.steps           ? todaySnap.steps.toLocaleString()     : '—'} />
              <StatTile label="Sleep"           value={todaySnap.sleep_hours     ? `${todaySnap.sleep_hours} hrs`       : '—'} />
              <StatTile label="HRV"             value={todaySnap.hrv_ms          ? `${todaySnap.hrv_ms} ms`            : '—'} />
              <StatTile label="Resting HR"      value={todaySnap.rhr_bpm         ? `${todaySnap.rhr_bpm} bpm`          : '—'} />
              <StatTile label="Calories Burned" value={todaySnap.calories_burned ? `${todaySnap.calories_burned} kcal` : '—'} />
              <StatTile label="Active Minutes"  value={todaySnap.active_minutes  ? `${todaySnap.active_minutes} min`   : '—'} />
              <StatTile label="Body Fat"        value={todaySnap.body_fat_pct    ? `${todaySnap.body_fat_pct}%`        : '—'} />
            </div>
          ) : (
            <div
              className="p-4 rounded-lg text-center text-white/30 text-xs uppercase tracking-widest"
              style={{ backgroundColor: '#1A2035', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              No data logged today
            </div>
          )}
        </div>

        {/* 7-day summary */}
        <div className="space-y-3">
          <p className="text-[10px] text-white/35 uppercase tracking-widest">This Week (7-day avg)</p>
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Avg Weight" value={weekStats.avg_weight  ? `${weekStats.avg_weight} lbs`  : '—'} />
            <StatTile label="Total Steps" value={weekStats.total_steps ? weekStats.total_steps.toLocaleString() : '—'} />
            <StatTile label="Avg Sleep"  value={weekStats.avg_sleep   ? `${weekStats.avg_sleep} hrs`   : '—'} />
            <StatTile label="Avg HRV"    value={weekStats.avg_hrv     ? `${weekStats.avg_hrv} ms`      : '—'} />
          </div>
        </div>

        {/* Log health data */}
        <div className="space-y-3">
          <p className="text-[10px] text-white/35 uppercase tracking-widest">Log Health Data</p>
          <p className="text-[10px] text-white/20 leading-relaxed">
            Enter data from Apple Health, MyFitnessPal, or your scale. Updates today&apos;s snapshot above.
          </p>
          <HealthDataForm userId={profile.id} />
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 rounded-lg text-sm font-tight font-bold italic uppercase tracking-tight transition-opacity hover:opacity-80"
          style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.50)' }}
        >
          Sign Out
        </button>

      </div>
    </div>
  )
}

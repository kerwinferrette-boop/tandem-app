import { redirect } from 'next/navigation'
import Link         from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Day label lookup matching WorkoutDashboard's DAY_MAP (Mon=0,Tue=1,Thu=2,Fri=3)
const DAY_LABELS: Record<number, string> = { 1: 'Mon', 2: 'Tue', 4: 'Thu', 5: 'Fri' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, name, program_type, current_week, program_weeks, goal_weight_lbs')
    .eq('id', authUser.id)
    .single()

  if (profileError || !profile) redirect('/login')

  const { count: daysWorkedOut } = await supabase
    .from('workout_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', authUser.id)
    .eq('completed', true)

  const { data: todaySnap } = await supabase
    .from('health_snapshots')
    .select('weight_lbs, steps, sleep_hours')
    .eq('user_id', authUser.id)
    .eq('snapshot_date', new Date().toISOString().slice(0, 10))
    .maybeSingle()

  const firstName   = profile.name?.split(' ')[0] ?? 'Athlete'
  const currentWeek = profile.current_week ?? 1
  const totalWeeks  = profile.program_weeks ?? 12
  const goalWeight  = profile.goal_weight_lbs ?? null
  const todayLabel  = DAY_LABELS[new Date().getDay()] ?? 'Today'

  return (
    <main className="min-h-screen text-white" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-8">

        {/* ── App header ───────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--user-color)' }}
            >
              <span className="font-tight font-black italic text-white text-sm leading-none tracking-tighter">Ti</span>
            </div>
            <span className="font-tight font-black italic uppercase tracking-tight text-white text-xl leading-none">
              TANDEM
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: 'var(--user-color)', color: 'white' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span className="text-[10px] font-tight font-bold uppercase tracking-widest">
                WK {currentWeek}
              </span>
            </div>
            <Link
              href="/profile"
              className="w-8 h-8 rounded-full border flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ borderColor: 'var(--user-color)', color: 'var(--user-color)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* ── Greeting ─────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--user-color)' }}>
            Overview
          </p>
          <h1 className="font-tight font-black italic uppercase tracking-tight text-white text-4xl leading-tight">
            Let&apos;s work,<br />{firstName}.
          </h1>
        </div>

        {/* ── Stats row ────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Week',        value: `${currentWeek} / ${totalWeeks}` },
            { label: 'Sessions',    value: String(daysWorkedOut ?? 0) },
            { label: 'Goal Weight', value: goalWeight ? `${goalWeight} lbs` : '—' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="p-3 rounded-lg text-center space-y-1"
              style={{ backgroundColor: 'rgba(27,94,56,0.10)', border: '1px solid rgba(27,94,56,0.25)' }}
            >
              <div className="text-[9px] text-white/40 uppercase tracking-widest">{label}</div>
              <div className="font-mono font-bold text-sm tabular-nums" style={{ color: 'var(--user-color)' }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Today's training card ─────────────────────────────── */}
        <Link
          href="/train"
          className="flex items-center justify-between p-5 rounded-lg transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--user-color)' }}>
              {todayLabel} · Start Session
            </p>
            <p className="font-tight font-black italic uppercase tracking-tight text-white text-lg leading-tight">
              Today&apos;s Training
            </p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

        {/* ── Today's health snapshot (if logged) ──────────────── */}
        {todaySnap && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Weight',  value: todaySnap.weight_lbs  ? `${todaySnap.weight_lbs} lbs` : '—' },
              { label: 'Steps',   value: todaySnap.steps        ? todaySnap.steps.toLocaleString()  : '—' },
              { label: 'Sleep',   value: todaySnap.sleep_hours  ? `${todaySnap.sleep_hours} hrs`    : '—' },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="p-3 rounded-lg text-center space-y-1"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="text-[9px] text-white/35 uppercase tracking-widest">{label}</div>
                <div className="font-mono font-bold text-sm tabular-nums" style={{ color: 'var(--user-color)' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Log health link ───────────────────────────────────── */}
        <Link
          href="/profile"
          className="flex items-center justify-between p-4 rounded-lg transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div>
            <div className="font-tight font-bold italic uppercase tracking-tight text-white text-sm">
              {todaySnap ? 'Health Data' : 'Log Today\'s Health'}
            </div>
            <div className="text-[10px] text-white/35 uppercase tracking-widest mt-0.5">
              {todaySnap ? 'Weight · Steps · Sleep · HRV' : 'Weight, steps, sleep, HRV'}
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

      </div>
    </main>
  )
}

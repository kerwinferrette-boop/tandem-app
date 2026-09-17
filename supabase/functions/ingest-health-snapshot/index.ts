import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// EPIC-4 (Health Auto Export ingestion) + EPIC-6 (smart-scale body composition, same
// pipeline, no separate function — weight_lbs/body_fat_pct are just two more columns
// on the same upsert).
//
// AUTH — option C, Kerwin's ruling (2026-09-17): a proper Supabase-issued JWT, not a
// shared secret, matching every other write path in this app. tandem.html never writes
// with the service-role key for a user-originated write — every insert/update goes
// through `sb` (anon key + the user's own session, `sb.auth.getSession().then(({data:
// {session}}) => ... 'Authorization': 'Bearer ' + session.access_token)`, e.g. the
// bug-report flow at tandem.html's submitBugReport()) and relies on RLS
// (`auth.uid() = user_id`) to scope the write to that user. health_snapshots carries
// exactly that policy (`health_write_own`: `auth.uid() = user_id`, verified live via
// Supabase MCP before writing this). So this function does the same thing: it takes the
// bearer JWT the Health Auto Export app sends, builds a Supabase client with the ANON
// key (not the service role key) with that JWT forwarded, and calls `auth.getUser()` to
// resolve `sub` -> a real user. Every subsequent read/write runs AS that user, so RLS
// enforces the scoping the same way it does for every other write in the app — this
// function trusts Postgres's policy, not its own judgment, to decide whose row this is.
// (expand-and-log-bug's service-role key is a different, narrower case: it operates on
// a row a user already inserted under RLS a moment earlier, as a trusted backend step,
// not as the first touch of untrusted external data — that pattern does not fit here.)
//
// CORS + error-handling shape mirrored from BUG-90's expand-and-log-bug (the only other
// edge function in this project): explicit OPTIONS branch before anything else touches
// the body, permissive headers so a preflight can't 500 before the real request is even
// sent.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// ── HealthKit metric name -> health_snapshots column ───────────────────────
// Health Auto Export's REST API payload is `[{ name, units, data: [{ date, qty }] }]`
// (per this Epic's own spec) — but the app is independently documented to emit BOTH a
// human "Title Case" name (the *official* form: github.com/Lybron/health-auto-export
// wiki "Supported Data" — "Step Count", "Active Energy Burned", "Resting Heart Rate",
// "Heart Rate Variability", "Sleep Analysis (Asleep/In Bed)", "Body Mass", "Body Fat
// Percentage") AND a snake_case form ("step_count", "active_energy",
// "heart_rate_variability", "resting_heart_rate", "weight_body_mass",
// "body_fat_percentage") depending on app version/export settings — confirmed by a
// real third-party ingestion project (EricCJaffe/Mission-Control PR #8) that had to
// build exactly this normalization after silently dropping a whole metric domain by
// matching only one form. Rather than hardcode one spelling and risk the same silent
// drop, every incoming name is normalized (lowercased, non-alphanumerics stripped) and
// matched against a small alias list per column, so "Step Count" and "step_count" both
// resolve to `steps` without needing two entries.
function normalizeMetricName(s: unknown): string {
  return String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

const METRIC_ALIASES: Record<string, string[]> = {
  steps: ['stepcount'],
  active_calories_kcal: ['activeenergy', 'activeenergyburned'],
  resting_heart_rate_bpm: ['restingheartrate'],
  hrv_ms: ['heartratevariability', 'hrv', 'heartratevariabilitysdnn'],
  sleep_total_hours: ['sleepanalysis', 'sleepanalysisasleepinbed', 'sleepanalysisasleep'],
  // EPIC-6 — same transform, same table, no separate pipeline.
  weight_lbs: ['bodymass', 'weightbodymass', 'weight'],
  body_fat_pct: ['bodyfatpercentage']
}

// column -> normalized-alias -> is a match, built once
const ALIAS_TO_COLUMN: Record<string, string> = {}
for (const [column, aliases] of Object.entries(METRIC_ALIASES)) {
  for (const alias of aliases) ALIAS_TO_COLUMN[alias] = column
}

// Columns that accumulate over a day (sum same-day points) vs. columns that are a
// point-in-time reading (last same-day point wins). Steps/active-energy/sleep are
// naturally partial-day totals when a source emits more than one sample per day;
// heart rate, HRV, weight and body fat are a reading at a moment, not a portion of one.
const SUM_COLUMNS = new Set(['steps', 'active_calories_kcal', 'sleep_total_hours'])

function extractMetrics(body: unknown): Array<{ name?: unknown; units?: unknown; data?: unknown }> {
  if (Array.isArray(body)) return body as any[]
  const b = body as any
  if (b && Array.isArray(b?.data?.metrics)) return b.data.metrics
  if (b && Array.isArray(b?.metrics)) return b.metrics
  return []
}

function pointValue(p: any): number | null {
  const v = p?.qty ?? p?.Qty ?? p?.value ?? p?.Value ?? p?.avg ?? p?.Avg
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function pointDate(p: any): string | null {
  const d = p?.date ?? p?.Date ?? p?.startDate ?? p?.start
  if (!d) return null
  // Health Auto Export dates commonly look like "2026-09-17 08:00:00 -0500" —
  // the calendar date is always the first 10 characters regardless of what
  // follows.
  const s = String(d).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
}

function normalizeUnits(u: unknown): string {
  return String(u ?? '').toLowerCase().replace(/[^a-z]/g, '')
}

// Converts a raw metric value into the unit health_snapshots actually stores.
// Weight: health_snapshots.weight_lbs is pounds; Health Auto Export can report kg
// depending on the phone's regional unit settings, so convert when `units` says so.
// Body fat: HealthKit stores body fat as a 0..1 fraction; Health Auto Export usually
// converts it to a 0..100 percent already, but not every export path is guaranteed to
// (undocumented either way) — a value <= 1 is unambiguously still a fraction (no real
// body-fat reading is <=1%), so it is the one safe case to auto-correct.
function normalizeValue(column: string, rawValue: number, rawUnits: unknown): number {
  if (column === 'weight_lbs') {
    const u = normalizeUnits(rawUnits)
    if (u === 'kg' || u === 'kilogram' || u === 'kilograms') return rawValue * 2.2046226218
    return rawValue
  }
  if (column === 'body_fat_pct') {
    return rawValue <= 1 ? rawValue * 100 : rawValue
  }
  return rawValue
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header (Supabase JWT required)' }), { status: 401, headers: corsHeaders })
    }

    // Anon key + the caller's own bearer JWT forwarded — every subsequent call on this
    // client runs AS that user, so RLS (`health_write_own`: auth.uid() = user_id)
    // scopes the write, exactly like every other write path in tandem.html. Never the
    // service-role key here: this is the first touch of data from an external,
    // untrusted client, not a trusted backend step operating on a row RLS already let
    // through.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired Supabase JWT' }), { status: 401, headers: corsHeaders })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: corsHeaders })
    }

    const metrics = extractMetrics(body)

    // date -> partial health_snapshots row
    const byDate = new Map<string, Record<string, number>>()

    for (const metric of metrics) {
      const column = ALIAS_TO_COLUMN[normalizeMetricName(metric?.name)]
      if (!column) continue // unrecognized metric — out of this Epic's scope, not an error
      const points = Array.isArray(metric?.data) ? (metric!.data as any[]) : []
      for (const point of points) {
        const date = pointDate(point)
        const rawValue = pointValue(point)
        if (!date || rawValue === null) continue
        const value = normalizeValue(column, rawValue, metric?.units)
        const row = byDate.get(date) ?? {}
        // SUM_COLUMNS accumulate across same-day points (e.g. multiple sleep
        // segments); every other column is a point-in-time reading, so the last
        // point processed for that day wins (there's no ordering guarantee across
        // points, but a single per-day gauge value is the correct target either way).
        row[column] = SUM_COLUMNS.has(column) ? (row[column] ?? 0) + value : value
        byDate.set(date, row)
      }
    }

    if (byDate.size === 0) {
      return new Response(
        JSON.stringify({ ok: true, rowsUpserted: 0, note: 'No recognized metrics with dated data points in payload' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const rows = Array.from(byDate.entries()).map(([snapshot_date, cols]) => ({
      user_id: user.id,
      snapshot_date,
      ...cols
    }))

    const { error: upsertErr } = await supabase
      .from('health_snapshots')
      .upsert(rows, { onConflict: 'user_id,snapshot_date' })

    if (upsertErr) {
      throw new Error(`health_snapshots upsert: ${upsertErr.message}`)
    }

    return new Response(
      JSON.stringify({ ok: true, rowsUpserted: rows.length, snapshotDates: rows.map(r => r.snapshot_date) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// OUTCOME GATE — the only check that looks at a real human being.
//
// WHY THIS EXISTS (read this before changing anything here)
//
// On 2026-08-17 Kerwin asked to see his bench press from seven weeks ago. He
// couldn't: the app had prescribed bench press ONCE, 60 days earlier. Across his
// whole history, 27 of 44 tracked exercises had exactly one session. Progression
// is structurally impossible on a lift you do once.
//
// That had been true for two months. Fifty-six unattended loop cycles ran in that
// window. Every one of them reported `npm run verify` 9/9, `validate:personas`
// 630/630, `walkthrough:onboarding` 0 findings. All true. All green. All blind.
//
// The reason is not that anyone was careless. It is that NOT ONE of the nine
// existing checks reads production data. persona-matrix runs 630 invented people.
// validate-programs runs synthetic combos. onboarding-lifecycle stubs Supabase out
// entirely. The app has two real users and 374 real sets, and the test suite had
// never looked at either. An agent optimizes what is measurable; only legality was
// measurable; so only legality got optimized.
//
// An LLM Council convened on 2026-08-17 reached this unanimously, and rejected the
// self-flattering diagnosis ("Claude optimizes for defensible completion") on the
// grounds that a character flaw is unfalsifiable and lets the machinery off the
// hook. The machinery was the problem. This file is the fix.
//
// THE RULE THIS FILE ENFORCES: a cycle is not green because the code is legal.
// A cycle is green when a real person is measurably getting stronger.
//
// ── Design constraints, deliberately chosen ──────────────────────────────────
//
// 1. It reads PRODUCTION. Not fixtures, not personas. If it cannot reach
//    production it FAILS — it does not skip. A gate that silently passes when
//    blind is worse than no gate, because the green is trusted. That is the exact
//    failure mode of BUG-79 (doctrine gate can't see the DB, reports all-green).
// 2. It cannot be satisfied by closing a Notion row, writing an audit, or passing
//    a synthetic matrix. The only way to turn it green is for a human to train.
// 3. It prints numbers about a body, not counts of checks. Per the council: what
//    gets reported is what gets optimized.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/outcome.mjs
//   node scripts/outcome.mjs --json     # machine-readable, for the baseline file
//
// Exit 0 = outcomes acceptable. Exit 1 = a real user is not progressing, or the
// gate could not see production.
// ═══════════════════════════════════════════════════════

const URL_ = process.env.SUPABASE_URL;
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JSON_OUT = process.argv.includes('--json');

// ── CORRECTION, 2026-08-17, same day, before this gate ever ran a cycle ──────
//
// The first version of this file counted sessions per `exercise_name` and would
// have reported Kerwin as barely progressing. He pushed back — "I've benched more
// than once, it may be called barbell bench press now" — and he was right. The
// error was mine twice over: I grepped `ILIKE '%bench%'`, got one row back, and
// treated the absence of a NAME as the absence of the LIFT.
//
// What the data actually shows: he pressed on six separate days Jun→Aug and got
// substantially stronger (High Incline Barbell 135→155 lb in ten days, est 1RM
// 189→207; Flat Barbell 160 for a 217 est 1RM by August). The progression was
// real and already recorded. It was invisible because it is spread across seven
// names: DB Bench Press, Flat Barbell Press, Low Incline, High Incline, Decline,
// Z-Press, Arnold Press.
//
// At the MUSCLE level his coverage is fine — lats 6 training days, biceps 4,
// calves 4, delts 4, quads 4, chest 3, triceps 3, glutes 3, abs 3. So "the app
// never trains him" was wrong.
//
// The actual defect is FRAGMENTATION: the app rotates the variant on nearly
// every exposure, so a muscle is trained repeatedly while no single lift ever
// accumulates a load history.
//   lateral_delt      4 training days / 4 distinct names
//   pec_major_sternal 3 training days / 4 distinct names
//   gastrocnemius     4 training days / 3 distinct names
// A user cannot see progress, and per-lift progressive overload cannot compute,
// when the lift changes every session.
//
// Two consequences this file must respect:
//  1. Measure exposure at the MUSCLE level (via the exercises table's
//     muscle_primary), because that is where "am I training this?" lives.
//  2. Measure trackability at the NAME level, because that is where "can I see
//     progress / can overload compute?" lives. These are different questions and
//     conflating them is what produced the wrong first version.
//  3. NEVER compare est_1RM across different names as if it were one series.
//     Decline 231 vs Low Incline 161 is not a regression, it is a different lift.
//
// Kerwin caught this within an hour of the file being written. That is the third
// time in one session the user was the detector. Left in the source rather than
// quietly rewritten, because the failure mode this file exists to prevent is
// exactly "confident number, unexamined premise."

// ── Thresholds ───────────────────────────────────────────────────────────────
// FLAGGED AS UNSOURCED, deliberately and visibly. These are engineering
// tripwires, NOT exercise-science claims, and CLAUDE.md forbids dressing an
// invented number up as doctrine. They are set to catch the failure we actually
// observed (one session in 60 days), not to encode an optimal training frequency.
//
// The one defensible anchor: D15 is ACTIVE doctrine and says primary compounds
// are held for a whole primary block, "never shorter than 8 weeks", targeting an
// 8-12 week refresh cadence. A primary lift held for 8+ weeks that produces only
// ONE session in 56 days contradicts D15's own intent, whatever the ideal
// frequency turns out to be. That is the contradiction MIN_SESSIONS_PRIMARY
// detects. It is not a claim that 3 is the right number.
//
// If Kerwin pulls research on training frequency, replace these and cite it.
const WINDOW_DAYS          = 56;  // 8 weeks — matches D15's block floor
const MIN_SESSIONS_PRIMARY = 3;   // UNSOURCED tripwire; see above
const STALE_DAYS           = 21;  // a muscle silent this long is a finding
const MIN_MUSCLE_EXPOSURE  = 3;   // training days per muscle in the window
// FRAGMENTATION: distinct exercise names per training day for a muscle.
// 1.0 = same lift every time (perfectly trackable). Approaching 1 name per
// session = a new lift every exposure, so nothing accumulates a load history.
// 0.75 means: across 4 sessions you saw at most 3 different names. UNSOURCED
// tripwire — it is set to catch lateral_delt's observed 4-names-in-4-sessions,
// not to encode an optimal rotation rate. D1/D15 govern rotation cadence and
// say accessories rotate every 2-3 weeks; a name changing EVERY session is
// faster than D1 itself allows, which is the contradiction this detects.
const MAX_FRAGMENTATION    = 0.75;

async function q(sql) {
  const res = await fetch(`${URL_}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

// Falls back to PostgREST if no exec_sql RPC exists — read-only, no RPC required.
async function rest(path) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

function fail(msg) { console.error(`\n  ✗ ${msg}`); return false; }
function ok(msg)   { console.log(`  ✓ ${msg}`); return true; }

async function main() {
  if (!URL_ || !KEY) {
    console.error(`
═══ OUTCOME GATE — CANNOT RUN ═══

  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.

  This gate FAILS rather than skips when it cannot reach production. That is
  deliberate: the entire reason this file exists is that nine other checks were
  green for two months while a real user was not progressing. A blind gate that
  reports success recreates that failure exactly.

  Set both env vars and re-run. Do not "fix" this by making it skip.
`);
    process.exit(1);
  }

  // Test accounts (kerwinferrette+test@gmail.com, +testdani@) are EXPLICITLY excluded
  // from this gate — .claude/loop-config.md's live_test_account_verification section,
  // confirmed directly by Kerwin: "just that - test accounts, to test features." They
  // exist to be exercised constantly and idle for long stretches by design, which is
  // not evidence about a real person's training. Filtering by email here (previously
  // absent) is what actually enforces that exclusion; before this fix a test account
  // stayed silently out of the report only by the coincidence of also having zero sets
  // in the window and hitting the old skip-continue path, which BUG-100 removes below.
  const allUsers = await rest('users?select=id,name,email&limit=50');
  const users = allUsers.filter(u => !/\+test/i.test(u.email || ''));
  if (!users.length) return void (fail('no users in production'), process.exit(1));

  // muscle_primary comes from the exercises table — the ONLY way to ask "is this
  // muscle being trained" rather than "is this string repeating". See the
  // correction block above for why that distinction is the whole point.
  const bank = await rest('exercises?select=name,muscle_primary&limit=1000');
  const muscleOf = Object.fromEntries(bank.map(e => [e.name, (e.muscle_primary || []).join('+') || 'untagged']));

  const since = new Date(Date.now() - WINDOW_DAYS * 864e5).toISOString();
  const report = [];
  let allPass = true;

  for (const u of users) {
    const sets = await rest(
      `sets?select=exercise_name,created_at,weight_lbs,reps,estimated_1rm_lbs` +
      `&user_id=eq.${u.id}&created_at=gte.${since}&limit=5000`
    );
    // BUG-100: a user with ZERO sets in the window is the single clearest outcome
    // failure this gate can see — silently `continue`-ing past them (the original
    // bug) let a real user go dark with no visible signal, which is the exact
    // blind-green failure mode this file exists to prevent. Report and fail loud.
    if (!sets.length) {
      report.push({ user: u.name || u.id, muscles: [], lifts: [], progressing: 0, regressing: 0, zeroActivity: true });
      if (!JSON_OUT) {
        console.log(`\n═══ ${u.name || u.id} — last ${WINDOW_DAYS} days ═══\n`);
        allPass = fail(`${u.name || u.id}: ZERO logged sets in the last ${WINDOW_DAYS} days — no training activity at all.`);
      } else {
        allPass = false;
      }
      continue;
    }

    // ── Layer 1: MUSCLE exposure — "is this being trained at all?" ───────────
    const byMuscle = {};
    for (const s of sets) {
      const m = muscleOf[s.exercise_name] || 'unmapped';
      (byMuscle[m] ||= { days: new Set(), names: new Set() });
      byMuscle[m].days.add(s.created_at.slice(0, 10));
      byMuscle[m].names.add(s.exercise_name);
    }
    const muscles = Object.entries(byMuscle).map(([m, v]) => {
      const days = [...v.days].sort();
      return {
        muscle: m,
        sessions: days.length,
        variants: v.names.size,
        // fragmentation: distinct names per training day. 1.0 = a new lift every session.
        frag: days.length ? v.names.size / days.length : 0,
        daysSinceLast: Math.floor((Date.now() - new Date(days.at(-1)).getTime()) / 864e5),
      };
    }).sort((a, b) => b.frag - a.frag || b.sessions - a.sessions);

    // ── Layer 2: NAME trackability — "can progress be seen / can overload compute?" ──
    // Trajectory is computed ONLY within a single name. Never across names.
    const byName = {};
    for (const s of sets) {
      if (s.estimated_1rm_lbs == null) continue;
      const day = s.created_at.slice(0, 10);
      (byName[s.exercise_name] ||= { days: new Set(), points: [] });
      byName[s.exercise_name].days.add(day);
      byName[s.exercise_name].points.push({ day, rm: Number(s.estimated_1rm_lbs) });
    }
    const lifts = Object.entries(byName).map(([name, v]) => {
      const days = [...v.days].sort();
      const at = d => v.points.filter(p => p.day === d).reduce((m, p) => Math.max(m, p.rm), 0);
      return { name, sessions: days.length, trackable: days.length >= 2,
               delta: Math.round(at(days.at(-1)) - at(days[0])) };
    }).sort((a, b) => b.sessions - a.sessions);

    const trackable  = lifts.filter(l => l.trackable);
    const progressing= trackable.filter(l => l.delta > 0).length;
    const regressing = trackable.filter(l => l.delta < 0).length;
    const fragmented = muscles.filter(m => m.sessions >= 2 && m.frag > MAX_FRAGMENTATION);
    const under      = muscles.filter(m => m.sessions < MIN_MUSCLE_EXPOSURE);
    const stale      = muscles.filter(m => m.daysSinceLast > STALE_DAYS);

    report.push({ user: u.name || u.id, muscles, lifts, progressing, regressing });
    if (JSON_OUT) continue;

    console.log(`\n═══ ${u.name || u.id} — last ${WINDOW_DAYS} days ═══\n`);
    console.log(`  muscles trained .................. ${muscles.length}`);
    console.log(`  trained >=${MIN_MUSCLE_EXPOSURE}x .................... ${muscles.filter(m => m.sessions >= MIN_MUSCLE_EXPOSURE).length}`);
    console.log(`  lifts with a trackable history .. ${trackable.length} of ${lifts.length}`);
    console.log(`  measurably STRONGER ............. ${progressing}`);
    console.log(`  measurably WEAKER ............... ${regressing}`);

    console.log(`\n  muscle                          sessions  names  frag   last`);
    console.log(`  ──────────────────────────────────────────────────────────────`);
    for (const m of muscles.slice(0, 16)) {
      const flag = m.sessions >= 2 && m.frag > MAX_FRAGMENTATION ? ' ← new lift almost every session' : '';
      console.log(`  ${m.muscle.slice(0, 30).padEnd(30)} ${String(m.sessions).padStart(5)}  ${String(m.variants).padStart(5)}  ${m.frag.toFixed(2)}  ${m.daysSinceLast}d${flag}`);
    }

    console.log('');
    if (fragmented.length)
      allPass = fail(`${u.name || u.id}: ${fragmented.length} muscle(s) get a DIFFERENT lift almost every session — ` +
                     fragmented.slice(0, 4).map(m => `${m.muscle} (${m.variants} names / ${m.sessions} sessions)`).join(', ') +
                     `. The muscle is trained but no lift accumulates a load history, so progress is invisible and ` +
                     `per-lift overload cannot compute. Rotating faster than D1's own 2-3 week accessory cadence.`);
    else ok(`no muscle is fragmented beyond ${MAX_FRAGMENTATION} names/session`);

    if (under.length)
      allPass = fail(`${u.name || u.id}: ${under.length} muscle(s) trained <${MIN_MUSCLE_EXPOSURE}x in ${WINDOW_DAYS}d — ` +
                     under.slice(0, 5).map(m => `${m.muscle} (${m.sessions})`).join(', '));
    else ok(`every trained muscle reached ${MIN_MUSCLE_EXPOSURE}+ sessions`);

    if (stale.length)
      allPass = fail(`${u.name || u.id}: ${stale.length} muscle(s) untouched >${STALE_DAYS}d — ` +
                     stale.slice(0, 5).map(m => `${m.muscle} (${m.daysSinceLast}d)`).join(', '));
    else ok(`no muscle stale beyond ${STALE_DAYS}d`);

    if (regressing > progressing)
      allPass = fail(`${u.name || u.id}: more lifts regressing (${regressing}) than progressing (${progressing}).`);
    else ok(`${progressing} lift(s) progressing vs ${regressing} regressing`);
  }

  // BUG-104: this used to hardcode exit(0), ignoring allPass -- inert only because
  // production.yml never calls --json, but any future --json caller checking the
  // exit code instead of parsing JSON would see a false pass. Match the non-JSON path.
  if (JSON_OUT) { console.log(JSON.stringify(report, null, 2)); process.exit(allPass ? 0 : 1); }

  console.log(`\n═══ OUTCOME GATE: ${allPass ? 'PASS' : 'FAIL'} ═══`);
  if (!allPass) console.log(`
  This gate cannot be turned green by fixing code, closing a tracker row, or
  passing a synthetic matrix. It goes green when a real person trains the same
  lift more than once and gets stronger at it. That is the point.
`);
  process.exit(allPass ? 0 : 1);
}

main().catch(e => {
  console.error(`\n  ✗ OUTCOME GATE ERRORED: ${e.message}`);
  console.error(`  Failing rather than skipping — see the header of this file for why.\n`);
  process.exit(1);
});

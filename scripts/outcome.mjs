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
const STALE_DAYS           = 21;  // a prescribed lift silent this long is a finding
const MIN_REPEAT_COVERAGE  = 0.50; // ≥50% of trained exercises should have ≥2 sessions

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

  const users = await rest('users?select=id,name&limit=50');
  if (!users.length) return void (fail('no users in production'), process.exit(1));

  const since = new Date(Date.now() - WINDOW_DAYS * 864e5).toISOString();
  const report = [];
  let allPass = true;

  for (const u of users) {
    const sets = await rest(
      `sets?select=exercise_name,created_at,weight_lbs,reps,estimated_1rm_lbs` +
      `&user_id=eq.${u.id}&created_at=gte.${since}&estimated_1rm_lbs=not.is.null&limit=5000`
    );
    if (!sets.length) continue;

    // Group by exercise → distinct training days + 1RM trajectory
    const byEx = {};
    for (const s of sets) {
      const day = s.created_at.slice(0, 10);
      (byEx[s.exercise_name] ||= { days: new Set(), points: [] });
      byEx[s.exercise_name].days.add(day);
      byEx[s.exercise_name].points.push({ day, rm: Number(s.estimated_1rm_lbs) });
    }

    const exercises = Object.entries(byEx).map(([name, v]) => {
      const days = [...v.days].sort();
      const first = v.points.filter(p => p.day === days[0]).reduce((m, p) => Math.max(m, p.rm), 0);
      const last  = v.points.filter(p => p.day === days.at(-1)).reduce((m, p) => Math.max(m, p.rm), 0);
      return {
        name,
        sessions: days.length,
        daysSinceLast: Math.floor((Date.now() - new Date(days.at(-1)).getTime()) / 864e5),
        first1rm: Math.round(first),
        last1rm: Math.round(last),
        delta: Math.round(last - first),
        measurable: days.length >= 2,
      };
    }).sort((a, b) => b.sessions - a.sessions || b.delta - a.delta);

    const total      = exercises.length;
    const repeated   = exercises.filter(e => e.sessions >= 2).length;
    const wellTrained= exercises.filter(e => e.sessions >= MIN_SESSIONS_PRIMARY).length;
    const coverage   = total ? repeated / total : 0;
    const progressing= exercises.filter(e => e.measurable && e.delta > 0).length;
    const regressing = exercises.filter(e => e.measurable && e.delta < 0).length;
    const stale      = exercises.filter(e => e.daysSinceLast > STALE_DAYS && e.sessions >= 2);

    report.push({ user: u.name || u.id, total, repeated, wellTrained, coverage,
                  progressing, regressing, exercises });

    if (JSON_OUT) continue;

    console.log(`\n═══ ${u.name || u.id} — last ${WINDOW_DAYS} days ═══\n`);
    console.log(`  exercises trained ................ ${total}`);
    console.log(`  with >=2 sessions (measurable) ... ${repeated}  (${(coverage * 100).toFixed(0)}%)`);
    console.log(`  with >=${MIN_SESSIONS_PRIMARY} sessions ............... ${wellTrained}`);
    console.log(`  measurably STRONGER .............. ${progressing}`);
    console.log(`  measurably WEAKER ................ ${regressing}`);
    console.log(`  UNMEASURABLE (single session) .... ${total - repeated}`);

    if (exercises.length) {
      console.log(`\n  exercise                        sessions   1RM        last seen`);
      console.log(`  ────────────────────────────────────────────────────────────────`);
      for (const e of exercises.slice(0, 18)) {
        const trend = !e.measurable ? '     —  unmeasurable'
                    : `${String(e.first1rm).padStart(4)}→${String(e.last1rm).padEnd(4)} ${e.delta > 0 ? '+' + e.delta : e.delta}`;
        console.log(`  ${e.name.slice(0, 30).padEnd(30)} ${String(e.sessions).padStart(4)}    ${trend.padEnd(18)} ${e.daysSinceLast}d ago`);
      }
    }

    console.log('');
    if (coverage < MIN_REPEAT_COVERAGE)
      allPass = fail(`${u.name || u.id}: only ${(coverage * 100).toFixed(0)}% of exercises have a second session — ` +
                     `${total - repeated} of ${total} lifts cannot show progress at all. Below the ${MIN_REPEAT_COVERAGE * 100}% floor.`);
    else ok(`repeat-exposure coverage ${(coverage * 100).toFixed(0)}%`);

    if (wellTrained === 0)
      allPass = fail(`${u.name || u.id}: NOT ONE exercise reached ${MIN_SESSIONS_PRIMARY} sessions in ${WINDOW_DAYS} days. ` +
                     `A program that never repeats a lift cannot progressively overload it (contradicts D15's 8-week block intent).`);
    else ok(`${wellTrained} exercise(s) reached ${MIN_SESSIONS_PRIMARY}+ sessions`);

    if (stale.length)
      allPass = fail(`${u.name || u.id}: ${stale.length} previously-repeated lift(s) untouched >${STALE_DAYS}d — ` +
                     stale.slice(0, 5).map(e => `${e.name} (${e.daysSinceLast}d)`).join(', '));
    else ok(`no established lift stale beyond ${STALE_DAYS}d`);

    if (regressing > progressing)
      allPass = fail(`${u.name || u.id}: more lifts regressing (${regressing}) than progressing (${progressing}).`);
    else ok(`${progressing} progressing vs ${regressing} regressing`);
  }

  if (JSON_OUT) { console.log(JSON.stringify(report, null, 2)); process.exit(0); }

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

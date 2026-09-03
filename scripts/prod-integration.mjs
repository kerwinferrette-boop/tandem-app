#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// PRODUCTION INTEGRATION GATE — does the BACKEND work, end to end?
//
// WHY THIS EXISTS, and why it is separate from scripts/outcome.mjs.
//
// The outcome gate asks "is a real human getting stronger?". Only Kerwin training
// can turn it green. For a while that was also the only check touching production,
// which meant his gym attendance gated backend correctness. He named the problem
// directly (2026-09-03): "I get it, I haven't worked out. How does that stop what's
// going on in the backend? This was the point of the user matrix & user stories,
// was to have infinite test runs." He is right — those are two different questions
// and they need two different exit codes.
//
// So: this file answers the SECOND question, using the two TEST ACCOUNTS he
// explicitly authorised for exactly this. It blocks, because nothing a human does
// or fails to do in a gym can affect it. outcome.mjs reports without blocking,
// because nothing this repo does can turn it green.
//
// WHAT IT CATCHES THAT NOTHING ELSE CAN. Every other gate runs against synthetic
// data: persona-matrix invents 630 people, validate-programs runs synthetic combos,
// onboarding-lifecycle stubs Supabase out entirely. None of them can see a schema
// drift, a broken trigger, a desynced exercise bank, or a write path that stores
// the wrong string. Those defects only exist in production, so a test that never
// reaches production cannot find them.
//
// SAFETY — read before editing.
//   * Writes are allowlisted to TWO test-account UUIDs, asserted per write. A typo
//     cannot reach Kerwin's 294 sets or Dani's 36. The allowlist is checked, not
//     trusted: assertAllowed() is proven to throw before this gate is relied on.
//   * The write is deliberately chosen so the sets trigger produces NO side effect:
//     a lift the account already has a PR for, at a load that cannot beat it. So
//     cleanup is one row, not a cascade into personal_records.
//   * Cleanup is VERIFIED by re-reading, never assumed, and runs in a finally block
//     so a mid-run failure still cleans up.
//   * Fails closed with no credentials, exactly like outcome.mjs and d17-db-sweep.mjs.
//     Never make this skip to get a green — that is the BUG-79 failure mode.
//
// Usage:  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run integration
// ═══════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const URL_ = process.env.SUPABASE_URL;
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ── The allowlist. These two accounts, and nothing else, ever. ────────────────
const TEST_ACCOUNTS = {
  'Test Kerwin': 'e5074b4c-3808-4338-aeb7-b9db59d61f49',
  'Test Dani':   '39619377-4753-45ac-ac3c-7ff253345bbd',
};
const ALLOWED = new Set(Object.values(TEST_ACCOUNTS));
function assertAllowed(userId, what) {
  if (!ALLOWED.has(userId))
    throw new Error(`REFUSED: ${what} targeted ${userId}, which is not a test account. ` +
                    `This gate may only write to: ${[...ALLOWED].join(', ')}`);
  return userId;
}

let failures = 0;
const ok   = (m) => console.log(`  ✓ ${m}`);
const fail = (m) => { console.error(`  ✗ ${m}`); failures++; };

if (!URL_ || !KEY) {
  console.error(`\n═══ PRODUCTION INTEGRATION GATE — CANNOT RUN ═══\n
  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.

  This FAILS rather than skips. A gate that reports success while blind is worse
  than no gate, because the green is trusted (BUG-79). Set both and re-run; do
  not "fix" this by making it skip.\n`);
  process.exit(1);
}

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
async function rest(path, init = {}) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
  if (!res.ok) throw new Error(`${init.method || 'GET'} ${path} -> ${res.status} ${await res.text()}`);
  const t = await res.text();
  return t ? JSON.parse(t) : null;
}

// ── Load the SHIPPED client functions, not copies of them ────────────────────
// calcRM lives in tandem.html's inline app block. Re-implementing it here would let
// the gate drift from the thing it is testing, so extract and run the real one.
function loadClientFns() {
  const html = readFileSync(join(root, 'tandem.html'), 'utf8');
  const m = html.match(/function calcRM\(w, r\) \{[\s\S]*?\n\}/);
  if (!m) throw new Error('could not extract calcRM from tandem.html — the gate cannot verify D12');
  return vm.runInNewContext(`${m[0]}; ({ calcRM })`, {});
}
function loadBank() {
  const src = readFileSync(join(root, 'programs.js'), 'utf8');
  return vm.runInNewContext(`(function(){ ${src}; return EXERCISE_BANK; })()`, {});
}

console.log('\n═══ PRODUCTION INTEGRATION GATE ═══');
console.log(`  target: ${URL_}`);
console.log(`  writes allowlisted to ${ALLOWED.size} test accounts\n`);

const bank = loadBank();
const { calcRM } = loadClientFns();
let created = null;   // set row id, for the finally-block cleanup

try {
  // ── A2 · EXERCISE_BANK ↔ exercises drift ───────────────────────────────────
  // The mirror has a generator (scripts/sync-exercise-bank.mjs) but nothing ever
  // checked it stayed in sync — "asserted, not enforced". Measured by hand on
  // 2026-09-03 and found clean; this makes that a standing guarantee.
  console.log('A2 · exercise bank ↔ database');
  const dbRows = await rest('exercises?select=slug,name,muscle_primary,muscle_secondary&limit=1000');
  const bankSlugs = Object.keys(bank);
  if (dbRows.length !== bankSlugs.length)
    fail(`row count drift: bank ${bankSlugs.length} vs db ${dbRows.length}`);
  else ok(`row count matches (${dbRows.length})`);

  const canon = (a) => [...new Set(a || [])].sort().join(',');
  const dbBySlug = Object.fromEntries(dbRows.map(r => [r.slug, r]));
  const drift = [];
  for (const slug of bankSlugs) {
    const b = bank[slug], d = dbBySlug[slug];
    if (!d) { drift.push(`${slug}: missing from db`); continue; }
    if (canon(b.muscleGroups?.primary) !== canon(d.muscle_primary))
      drift.push(`${slug}: primary bank[${canon(b.muscleGroups?.primary)}] != db[${canon(d.muscle_primary)}]`);
    if (canon(b.muscleGroups?.secondary) !== canon(d.muscle_secondary))
      drift.push(`${slug}: secondary bank[${canon(b.muscleGroups?.secondary)}] != db[${canon(d.muscle_secondary)}]`);
  }
  if (drift.length) { fail(`${drift.length} slug(s) drifted:`); drift.slice(0, 8).forEach(d => console.error(`      ${d}`)); }
  else ok('muscle tags identical on every slug');

  // ── A3 · write round-trip ──────────────────────────────────────────────────
  // Targets BUG-49 (exercise_name written as a SLUG, not the display name) and
  // BUG-16 (sets saved locally, never pushed) — two open P1s that only a real
  // write can see. Also asserts the DB trigger's 1RM agrees with the client's
  // calcRM, which is D12's whole subject.
  console.log('\nA3 · write round-trip (test account only)');
  const uid = assertAllowed(TEST_ACCOUNTS['Test Kerwin'], 'round-trip insert');
  const LIFT = 'Low Incline Barbell Press';   // account already holds a 196 lb PR here
  const W = 45, R = 5;                        // est 1RM 52.5 — cannot beat 196, so no PR write

  const prBefore = await rest(`personal_records?user_id=eq.${uid}&exercise_name=eq.${encodeURIComponent(LIFT)}&select=best_estimated_1rm_lbs`);
  const inserted = await rest('sets', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([{ user_id: uid, exercise_name: LIFT, set_number: 99, weight_lbs: W, reps: R }]),
  });
  created = inserted?.[0]?.id || null;
  if (!created) { fail('insert returned no row id — the write path is broken'); }
  else {
    ok(`inserted set ${created}`);
    const [row] = await rest(`sets?id=eq.${created}&select=exercise_name,weight_lbs,reps,estimated_1rm_lbs,is_pr`);
    if (!row) fail('inserted row could not be read back (BUG-16 class: write accepted but not persisted)');
    else {
      // BUG-49: the stored string must be the bank DISPLAY NAME, not a slug.
      const byName = Object.values(bank).some(e => e.name === row.exercise_name);
      if (!byName) fail(`exercise_name '${row.exercise_name}' does not resolve to a bank display name (BUG-49 class)`);
      else ok(`exercise_name stored as a resolvable display name`);

      // D12: the trigger's 1RM must agree with the shipped client calcRM.
      const want = Math.round(calcRM(W, R) * 10) / 10;
      const got  = Number(row.estimated_1rm_lbs);
      if (Math.abs(want - got) > 0.15) fail(`1RM divergence — client calcRM ${want}, db trigger ${got} (D12)`);
      else ok(`db trigger 1RM ${got} agrees with client calcRM ${want} (D12)`);

      if (row.is_pr) fail('is_pr set true on a load well under the existing PR — trigger PR logic regressed');
      else ok('no spurious PR flag');
    }
    const prAfter = await rest(`personal_records?user_id=eq.${uid}&exercise_name=eq.${encodeURIComponent(LIFT)}&select=best_estimated_1rm_lbs`);
    if (JSON.stringify(prBefore) !== JSON.stringify(prAfter)) fail('personal_records changed — the write had an unintended side effect');
    else ok('personal_records untouched');
  }

  // ── A4 · D27 history projection ────────────────────────────────────────────
  // The continuity path shipped 2026-09-03 (08fb886) with no production-side test.
  console.log('\nA4 · D27 lift-history projection');
  const hSets = await rest(`sets?user_id=eq.${uid}&select=exercise_name,created_at&limit=1000`);
  const days = {};
  for (const s of hSets) {
    const e = Object.values(bank).find(x => x.name.toLowerCase() === String(s.exercise_name || '').toLowerCase());
    if (!e) continue;
    (days[e.name] ||= new Set()).add(String(s.created_at).slice(0, 10));
  }
  const counts = Object.fromEntries(Object.entries(days).map(([k, v]) => [k, v.size]));
  const n = Object.keys(counts).length;
  if (!n) fail('history projection produced zero lifts for a test account that has sets — D27 would silently no-op');
  else if (Object.values(counts).some(c => !Number.isInteger(c) || c < 1)) fail('history projection produced a non-positive session count');
  else ok(`projection resolved ${n} lift(s), all counts >= 1`);

} catch (e) {
  fail(`gate threw: ${e.message}`);
} finally {
  // ── Cleanup, verified by re-reading ───────────────────────────────────────
  if (created) {
    console.log('\ncleanup');
    try {
      await rest(`sets?id=eq.${created}`, { method: 'DELETE' });
      const gone = await rest(`sets?id=eq.${created}&select=id`);
      if (gone && gone.length) fail(`cleanup FAILED — set ${created} still present. Delete it by hand.`);
      else ok(`test row ${created} removed and verified gone`);
    } catch (e) { fail(`cleanup threw: ${e.message} — set ${created} may remain`); }
  }
}

console.log('');
if (failures) {
  console.error(`${failures} INTEGRATION FAILURE(S) — the backend is not behaving against production.\n`);
  process.exit(1);
}
console.log('Production integration gate PASS — backend verified end to end.\n');
process.exit(0);

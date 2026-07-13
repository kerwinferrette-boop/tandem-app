// lastsets-churn-smoke.mjs
// Regression guard for the 2026-07-13 "phantom 47.5 / phantom PR" defect.
//
// Root cause it locks down:
//   1. tandem_lastsets was keyed by bank slot-id. Slot-ids are recycled across
//      program rotations, so getRecommendation could read a DIFFERENT movement's
//      last set (e.g. a 45-lb Row) and prescribe 45 + 2.5 = 47.5 for Incline DB
//      Curl — a weight the user never lifted on that exercise.
//   2. The Supabase -> localStorage PR/lastsets sync used an all-or-nothing
//      empty-guard, so a PR written on one device was invisible on another that
//      already had any local data (the desync behind the phantom PR).
//
// This test extracts the LIVE saveSetLS from tandem.html (no re-implementation)
// and asserts the churn-immunity invariant behaviorally, then asserts the
// source-level invariants for the read path and the merge-sync. Exit 0 = safe.
//
// Run: node scripts/lastsets-churn-smoke.mjs

import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(path.join(root, 'tandem.html'), 'utf8');

let failures = 0;
function check(label, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);
  if (!cond) failures++;
}

// ── 1. Extract the live saveSetLS function body ──
const startMarker = 'function saveSetLS(';
const startIdx = html.indexOf(startMarker);
if (startIdx === -1) { console.error('could not find saveSetLS'); process.exit(1); }
// function ends at the first line that is exactly "}" at column 0 after the start
const endIdx = html.indexOf('\n}', startIdx);
const saveSetLSSrc = html.slice(startIdx, endIdx + 2);

// ── 2. Run it against an in-memory LS stub ──
const store = {};
const LS = {
  get: (k) => (k in store ? JSON.parse(JSON.stringify(store[k])) : null),
  set: (k, v) => { store[k] = JSON.parse(JSON.stringify(v)); },
};
const ctx = vm.createContext({ LS, Date, Math, JSON });
vm.runInContext(saveSetLSSrc + '\nthis.saveSetLS = saveSetLS;', ctx);
const saveSetLS = ctx.saveSetLS;

// ── 3. Churn scenario ──
// Old rotation: slot 'd3s2' held Barbell Row, logged at 45 x 12.
saveSetLS('d3s2', 45, 12, 'Barbell Row');
// New rotation reuses slot id 'd3s2' for Incline DB Curl. The prescription read
// is by NAME, so Incline DB Curl must have NO inherited history.
const ls = LS.get('tandem_lastsets') || {};

check('Row set stored under its NAME', ls['Barbell Row']?.weight === 45);
check('lastset carries a name field (enables id-fallback safety)', ls['Barbell Row']?.name === 'Barbell Row');
check('Incline DB Curl inherits NO set from the recycled slot-id',
  ls['Incline DB Curl'] === undefined);
// The engine reads lastSets[exName]; for a churned exercise that is undefined,
// which routes to "First session" — NOT weight + 2.5. Assert the read key:
const readMatch = /const entry = exName \? lastSets\[exName\] : lastSets\[exId\]/.test(html);
check('getRecommendation reads lastsets by exName (not raw exId)', readMatch);

// ── 4. Merge-sync invariants (no more empty-guard, PR takes max, lastset newest-date) ──
check('PR empty-guard removed',
  !/!Object\.keys\(LS\.get\('tandem_prs'\) \|\| \{\}\)\.length/.test(html));
check('lastsets empty-guard removed',
  !/!Object\.keys\(LS\.get\('tandem_lastsets'\) \|\| \{\}\)\.length/.test(html));
check('PR sync merges with higher-of (monotonic)',
  /v > prs\[r\.exercise_name\]/.test(html));
check('lastsets sync merges newest-date-wins',
  /r\.data\.date > cur\.date/.test(html));

// ── 5. Legacy id-keyed entry is retired on a name write ──
const store2key = LS.get('tandem_lastsets');
saveSetLS('d3s2', 30, 10, 'Incline DB Curl'); // now the slot legitimately holds the curl
const after = LS.get('tandem_lastsets');
check('Incline DB Curl now stored under its name after a real log',
  after['Incline DB Curl']?.weight === 30);
check('legacy id-keyed entry deleted (cannot be read via id fallback)',
  after['d3s2'] === undefined);

console.log(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILURE(S)'}`);
process.exit(failures === 0 ? 0 : 1);

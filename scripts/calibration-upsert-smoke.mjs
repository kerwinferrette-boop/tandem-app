#!/usr/bin/env node
/**
 * calibration-upsert-smoke.mjs — BUG-57 regression guard.
 *
 * WHAT IT LOCKS DOWN
 * computeCalibration1RMs() gated its personal_records upsert on
 *     .filter(name => best1RMs[name] > (existingMap[name] || 0))
 * which could NEVER pass. `sets` carries the trigger sets_apply_1rm_and_pr, which writes
 * best_estimated_1rm_lbs live DURING the session — so by the time finishSession() reaches
 * this function, the DB already holds the identical calcRM value it is about to compute.
 * existingMap[name] === best1RMs[name], `>` is false, `rows` is empty, NO upsert fires, and
 * is_calibrated / calibration_session_id / week_targets are never written — while the
 * users.calibration_complete = true write immediately below fires unconditionally.
 * Measured on prod 2026-09-24: Kerwin has calibration_complete = true and 51 PR rows, of
 * which only 6 carry is_calibrated.
 *
 * WHY THIS IS BEHAVIORAL AND NOT A GREP
 * The defect is a predicate that is always false — perfectly valid syntax, and invisible to
 * any source-read that does not also know what the database trigger did first. It is the
 * exact class CLAUDE.md means by "verify by running, not by reading". So this harness slices
 * the REAL computeCalibration1RMs out of tandem.html (no re-implementation) and executes it
 * against the prod-observed condition.
 *
 * SCOPE, stated rather than implied: sb and computeWeekTargets are stubbed. calcRM is the
 * real one. Stubbing computeWeekTargets is deliberate and makes the test STRONGER, not
 * weaker — it records the oneRM it was handed, which is how we assert week_targets is
 * derived from max(new, existing) rather than from the session estimate. The progression
 * curve itself is D11's gate's job, not this one's.
 *
 * Run: node scripts/calibration-upsert-smoke.mjs
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(path.join(root, 'tandem.html'), 'utf8');

let failures = 0;
const check = (label, cond) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`); if (!cond) failures++; };

// ── Slice the live functions, no re-implementation ──
function slice(marker) {
  const i = html.indexOf(marker);
  if (i === -1) { console.error(`could not find ${marker}`); process.exit(1); }
  const j = html.indexOf('\n}', i);
  return html.slice(i, j + 2);
}
const calibSrc = slice('async function computeCalibration1RMs(');
const calcRMSrc = slice('function calcRM(');

// ── Stub Supabase: enough to observe what the function would write ──
const SESSION = 'sess-uuid-1';
const USER = 'user-uuid-1';
// Three real sets. The trigger has ALREADY stored the identical calcRM for the first two.
const SESSION_SETS = [
  { exercise_name: 'Barbell Row',     weight_lbs: 135, reps: 10 }, // calcRM -> 180
  { exercise_name: 'Flat Barbell Press', weight_lbs: 155, reps: 8 }, // calcRM -> 196
  { exercise_name: 'Barbell Back Squat', weight_lbs: 225, reps: 5 }, // calcRM -> 263, control
];
const rm = (w, r) => Math.round(w * (1 + r / 30));
const EXISTING = {
  'Barbell Row': rm(135, 10),          // trigger-equal — the prod condition
  'Flat Barbell Press': rm(155, 8),    // trigger-equal
  'Barbell Back Squat': 400,           // genuinely higher historical PR — must not regress
};

function makeCtx() {
  const captured = { upserts: [], userUpdates: [], weekTargetInputs: [] };
  const sb = {
    from(table) {
      const api = {
        _t: table, _sel: null,
        select(cols) { this._sel = cols; return this; },
        eq() { return this; },
        in() { return this; },
        single() {
          if (this._t === 'users') return Promise.resolve({ data: { calibration_complete: false } });
          return Promise.resolve({ data: null });
        },
        upsert(rows, opts) { captured.upserts.push({ table: this._t, rows, opts }); return Promise.resolve({ data: rows }); },
        update(patch) { captured.userUpdates.push({ table: this._t, patch }); return this; },
        then(res) {
          if (this._t === 'sets') return Promise.resolve({ data: SESSION_SETS }).then(res);
          if (this._t === 'personal_records') {
            return Promise.resolve({
              data: Object.entries(EXISTING).map(([exercise_name, v]) => ({ exercise_name, best_estimated_1rm_lbs: v }))
            }).then(res);
          }
          return Promise.resolve({ data: null }).then(res);
        },
      };
      return api;
    },
  };
  const ctx = {
    sb, console,
    cfg: { goal: 'build_muscle', weeks: 8 },
    computeWeekTargets(oneRM) { captured.weekTargetInputs.push(oneRM); return { 2: oneRM * 0.67 }; },
    Math, Object, Promise, Number, parseFloat, parseInt,
  };
  vm.createContext(ctx);
  vm.runInContext(calcRMSrc + '\n' + calibSrc, ctx);
  return { ctx, captured };
}

// ── Run the real function ──
const { ctx, captured } = makeCtx();
await ctx.computeCalibration1RMs(SESSION, USER);

const prUpserts = captured.upserts.filter(u => u.table === 'personal_records');
const rows = prUpserts.flatMap(u => u.rows);

check('an upsert to personal_records was issued at all (pre-fix: ZERO — this is the bug)', prUpserts.length === 1);
check(`one row per session exercise (expected 3, got ${rows.length})`, rows.length === 3);
check('every row carries is_calibrated = true', rows.length > 0 && rows.every(r => r.is_calibrated === true));
check('every row carries calibration_session_id', rows.length > 0 && rows.every(r => r.calibration_session_id === SESSION));
check('every row carries week_targets', rows.length > 0 && rows.every(r => r.week_targets != null));

const byName = Object.fromEntries(rows.map(r => [r.exercise_name, r]));
check('trigger-equal exercise IS written (the case the old filter silently dropped)',
      !!byName['Barbell Row'] && byName['Barbell Row'].best_estimated_1rm_lbs === rm(135, 10));
check('a genuinely higher historical PR is NOT regressed (400 stays 400)',
      !!byName['Barbell Back Squat'] && byName['Barbell Back Squat'].best_estimated_1rm_lbs === 400);
check('week_targets derived from the STORED best, not the session estimate (400, not 263)',
      captured.weekTargetInputs.includes(400));
check('users.calibration_complete is still marked', captured.userUpdates.some(u => u.patch?.calibration_complete === true));

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);

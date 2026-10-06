#!/usr/bin/env node
/**
 * bug193-live-row-verification.mjs — BUG-193 verified against PRODUCTION data.
 *
 * WHY A SEPARATE SCRIPT, AND WHY IT IS *NOT* IN `npm run verify`
 * --------------------------------------------------------------
 * cfg-builder-smoke.mjs (which IS in verify) proves cfgFromUserRow carries every
 * field — against a FIXTURE row this repo wrote. That cannot prove the live
 * `users` table actually has those columns, or that they hold what the builder
 * expects. This script closes that gap. It embeds a DATED SNAPSHOT of a real row,
 * so wiring it into verify would make a stale snapshot a ship gate. Run it by hand
 * when the cloud-restore path changes.
 *
 * WHAT WAS DONE, 2026-09-30 (loop-config `live_test_account_verification`)
 * -----------------------------------------------------------------------
 * `npm run integration` fails closed without SUPABASE_SERVICE_ROLE_KEY, which is
 * not set in this container, so the documented fallback was used: Supabase MCP
 * (own auth), against the allowlisted test account ONLY
 * (kerwinferrette+test@gmail.com, e5074b4c-…). Kerwin's and Dani's real accounts
 * were never read or written.
 *
 * 1. LIVE SHAPE, checked against information_schema: all 20 columns
 *    cfgFromUserRow reads exist on public.users. `max_db` does NOT exist —
 *    confirming BUG-192's cloud half is still owed, as claimed.
 * 2. `injuries` was NULL on BOTH test accounts. A rebuild yielding
 *    `injuries: null` is INDISTINGUISHABLE from the bug, so a read-only check
 *    would have passed for the wrong reason. A full profile was seeded
 *    (injuries='left knee', weeks=8, sex, weights, height, age, secondary_goal),
 *    the verification run, then every field restored to its exact pre-test value
 *    and confirmed by an independent re-read of BOTH accounts.
 * 3. RESULT: all 12 previously-dropped fields survive the rebuild from the live
 *    row; `cfg.injuries` carries; `weeks` is the real 8, not the 12-week default;
 *    and the real generator produced 32 exercises with ZERO knee-contraindicated
 *    lifts.
 * 4. THE CONTROL IS THE POINT ([E]). Re-running with injuries dropped — the
 *    pre-fix restore behaviour — the same generator prescribes **Step-Up** and
 *    **Leg Extension**, both matched by INJURY_RULES' knee ban
 *    (programs.js: /lunge|bulgarian|step-up|hack squat|leg extension|sissy/i).
 *    Without [E], [D] could have passed merely because the program never
 *    contained a lunge. That is what makes this evidence rather than a green tick.
 *
 * TO REFRESH: re-read the row from production, replace the `row` literal, and
 * re-run. If `injuries` is null again, seed it first or [D] proves nothing.
 */

import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve from the repo root, not the cwd — this lives in scripts/ now.
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f) => readFileSync(path.join(ROOT, f), 'utf8');

const row = {
  id: 'e5074b4c-3808-4338-aeb7-b9db59d61f49',
  program_goal: 'build_muscle', program_days_per_week: 4, program_weeks: 8,
  sex: 'M', fitness_level: 'intermediate', equipment: 'full_gym',
  muscle_emphasis: 'balanced', workout_duration_minutes: 60,
  preferred_workout_time: 'morning', injuries: 'left knee', secondary_goal: 'run_5k',
  current_weight_lbs: '200', goal_weight_lbs: '190', height_inches: '70', age: 35,
  program_start_date: '2026-06-11', theme_color: '#1B5E38',
  onboarding_estimates: {}, program_source: 'generated', current_week: 1,
};

let fail = 0;
const check = (l, c, d) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${l}${c || !d ? '' : `\n      ${d}`}`); if (!c) fail++; };

// 1. the LIVE builder, from the shipped file
const html = read('tandem.html');
const i = html.indexOf('function cfgFromUserRow(');
const src = html.slice(i, html.indexOf('\n}', i) + 2);
const ctx = { canonicalGoal: g => (g === 'burn_fat' ? 'fat_burn' : g) };
vm.createContext(ctx);
new vm.Script(src + '\nthis.__b = cfgFromUserRow;').runInContext(ctx);

// A fresh-device restore has NO incumbent cfg — that is the path BUG-193 broke.
const cfg = ctx.__b(row, undefined);

console.log('── the 12 fields the pre-fix restore path silently dropped ──');
const twelve = {
  weeks: 8, equipment: 'full_gym', emphasis: 'balanced', workout_duration_minutes: 60,
  preferred_workout_time: 'morning', injuries: 'left knee', secondary_goal: 'run_5k',
  targetWeight: '190', heightIn: '70', startDate: '2026-06-11', themeColor: '#1B5E38',
};
const bad = Object.entries(twelve).filter(([k, v]) => String(cfg[k]) !== String(v));
check(`[A] all survive the rebuild from the LIVE row (${Object.keys(twelve).length} checked + onboardingEstimates)`,
  bad.length === 0 && cfg.onboardingEstimates !== undefined,
  bad.map(([k, v]) => `${k}: expected ${JSON.stringify(v)}, got ${JSON.stringify(cfg[k])}`).join('\n      '));
check('[B] SAFETY: cfg.injuries carries the live value', cfg.injuries === 'left knee',
  `got ${JSON.stringify(cfg.injuries)} — this is the field the code twice calls a SAFETY invariant`);
check('[C] weeks is the real 8, not the 12-week default', cfg.weeks === 8, `got ${cfg.weeks}`);

// 2. does it reach the ENGINE? run the real generator with the rebuilt cfg.
const KNEE_BAN = /lunge|bulgarian|step-up|hack squat|leg extension|sissy/i;
const pg = new vm.Script(read('programs.js') + '\nthis.__getProgram = getProgram;');
const pctx = { console, window: {} }; vm.createContext(pctx); pg.runInContext(pctx);

const names = (injuries) => {
  const prog = pctx.__getProgram(cfg.goal, cfg.days, cfg.weeks, cfg.sex, cfg.equipment,
    cfg.emphasis, injuries, 0, { week: 1 }, cfg.experience, {},
    cfg.workout_duration_minutes, cfg.weight, cfg.targetWeight) || [];
  const out = [];
  prog.forEach(d => (d.blocks || []).forEach(b => (b.exs || []).forEach(e => e?.name && out.push(e.name))));
  return out;
};

const withInjury = names(cfg.injuries);
const leaked = withInjury.filter(n => KNEE_BAN.test(n));
check(`[D] SAFETY AT THE ENGINE: no knee-contraindicated lift in ${withInjury.length} generated exercises`,
  leaked.length === 0, `LEAKED: ${[...new Set(leaked)].join(', ')}`);

// 3. CONTROL — without this, [D] could pass simply because the program never
// contains a lunge. Simulate the pre-fix restore (injuries dropped to null).
const asBug = names(null);
const wouldLeak = [...new Set(asBug.filter(n => KNEE_BAN.test(n)))];
check('[E] CONTROL: with injuries dropped (the pre-fix behaviour) the ban IS violated',
  wouldLeak.length > 0,
  'nothing knee-contraindicated appears even unfiltered, so [D] proves nothing — pick a different injury');
if (wouldLeak.length) console.log(`      pre-fix would have prescribed: ${wouldLeak.join(', ')}`);

console.log(fail === 0 ? '\nBUG-193 live-row verification: PASS' : `\nBUG-193 live-row verification: ${fail} FAILURE(S)`);
process.exit(fail === 0 ? 0 : 1);

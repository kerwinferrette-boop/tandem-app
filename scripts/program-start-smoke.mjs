#!/usr/bin/env node
/**
 * program-start-smoke.mjs — REGRESSION GUARD for BUG-93 (program start / day pointer).
 *
 * BUG-93 was reopened 2026-09-16 after Cycle 86 closed it on a test that only ever
 * called getProgramDayNumber() — a function the tracker's actual selected-day render
 * path (renderProgramViews()) never called at all. This gate closes that hole by
 * extracting and exercising the REAL functions from tandem.html (no re-implementation),
 * the same discipline lastsets-churn-smoke.mjs and cadence-smoke.mjs already use, and
 * asserting the two user-visible guarantees directly:
 *
 *   1. A freshly started program (generated / library-adopt / custom) shows DAY 1 and
 *      ZERO overdue days the instant it starts — R1 (queue is the single owner of
 *      "today's workout", tandem_current_day demoted to a cache), R3 (the onboarding
 *      start-date default cannot go stale overnight), R4 (adopt/create reset the start
 *      pointer instead of inheriting the old program's calendar position).
 *   2. revertToGenerated() shows ZERO overdue days the instant it switches back,
 *      WITHOUT resetting the day/week position — Kerwin's explicit ruling (quoted in
 *      the BUG-93 Claude Code Prompt): "revertToGenerated RESUMES where the generated
 *      plan left off; overdue recomputed from the switch time; the week is NOT reset."
 *      This is why revert does NOT get a "Day 1" assertion below — asserting Day 1 for
 *      revert would encode the exact behavior Kerwin ruled against.
 *
 * Also locks R2 (no toISOString().split('T')[0] survives on a user-facing date — only
 * localDateStr()'s own implementation may use it) as a source-level grep, and runs
 * every {day-count, start-weekday, timezone} combination the prompt specifies, using a
 * FixedDate shim so "today" is deterministic per iteration instead of wall-clock time.
 *
 * Run: node scripts/program-start-smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(scriptsDir);
const html = readFileSync(join(root, 'tandem.html'), 'utf8');

let failures = 0;
const fails = [];
function check(label, cond) {
  if (!cond) { failures++; fails.push(label); }
}

const grab = (name, re) => { const m = html.match(re); if (!m) throw new Error(`could not locate ${name} in tandem.html`); return m[0]; };

// ── 0. Source-level R2 guard: no user-facing toISOString().split('T')[0] survives ──
// The ONE legal occurrence is localDateStr()'s own implementation (it computes the
// local date BY shifting a UTC-format ISO string — that's the fix, not the bug).
{
  const matches = [...html.matchAll(/new Date\([\s\S]{0,80}?\)\.toISOString\(\)\.split\('T'\)\[0\]/g)];
  const localDateStrImpl = /return new Date\(d\.getTime\(\) - d\.getTimezoneOffset\(\) \* 60000\)\.toISOString\(\)\.split\('T'\)\[0\];/;
  const extra = matches.filter(m => !localDateStrImpl.test(html.slice(Math.max(0, m.index - 80), m.index + 80)));
  check(`R2: no leftover UTC-date toISOString().split('T')[0] outside localDateStr() (found ${matches.length}, expected exactly 1 — localDateStr's own body)`,
    matches.length === 1);
}

// ── 0b. R1 wiring guard: renderProgramViews() must actually CALL the queue ──
// The original defect (Cycle 86) was that nextProgramDayKey()/getProgramDayNumber()
// were correct in isolation but never reached by the function the tracker's selected
// day actually calls. Assert the wiring directly, source-level, so this cannot regress
// to "correct function, never called" again without the gate seeing it — the exact
// "wired is not working" trap CLAUDE.md names.
{
  const rpvSrc = grab('renderProgramViews', /function renderProgramViews\(\) \{[\s\S]*?\n\}/);
  check('R1: renderProgramViews() calls nextProgramDayKey() (the queue) before falling back to the cache',
    /queueDay/.test(rpvSrc) && /nextProgramDayKey\(\)/.test(rpvSrc));
  check('R1: renderProgramViews() writes tandem_current_day back as a reconciled CACHE (not the source of truth)',
    /LS\.set\('tandem_current_day',\s*currentDay\)/.test(rpvSrc));
}

// ── 0c. R4 wiring guard: adoptTemplate()/createCustomTemplate() must reset the start
// pointer — the actual functions do live Supabase I/O and can't run headless, so this
// asserts the fix is PRESENT in the real function bodies rather than re-deriving it
// from the (necessarily separate) headless simulators in section 3 below.
{
  const adoptSrc = grab('adoptTemplate', /async function adoptTemplate\([\s\S]*?\n\}/);
  const customSrc = grab('createCustomTemplate', /async function createCustomTemplate\([\s\S]*?\n\}/);
  const revertSrc = grab('revertToGenerated', /function revertToGenerated\(\) \{[\s\S]*?\n\}/);
  for (const [name, src] of [['adoptTemplate', adoptSrc], ['createCustomTemplate', customSrc]]) {
    check(`R4: ${name}() resets cfg.startDate via localDateStr()`, /cfg\.startDate\s*=\s*localDateStr\(\)/.test(src));
    check(`R4: ${name}() clears the stale day-pointer cache`, /LS\.del\('tandem_current_day'\)/.test(src));
    check(`R2: ${name}()'s start-date reset does not use toISOString()`, !/cfg\.startDate\s*=[\s\S]{0,60}toISOString/.test(src));
  }
  check("R4/2(d): revertToGenerated() does NOT touch cfg.startDate (resumes, per Kerwin's ruling)",
    !/revertToGenerated[\s\S]*?cfg\.startDate\s*=/.test(revertSrc));
  check("2(d): revertToGenerated() does NOT touch currentWeek/tandem_week (week is not reset)",
    !/currentWeek\s*=\s*1/.test(revertSrc) && !/LS\.set\('tandem_week'/.test(revertSrc));
  check('2(d): revertToGenerated() sets cfg.revertedAt so overdue recomputes from the switch time',
    /cfg\.revertedAt\s*=\s*localDateStr\(\)/.test(revertSrc));
}

// ── 0d. R5 floor guard — council review, 2026-09-22 (see docs/council-transcript-
// 2026-09-22-bug93-ship-review.md, "The Contrarian"): isBeforeProgramStart()'s same-day
// refinement only bites when a local-history row's `id` is the numeric Date.now() stamp
// Finish()/skipAhead() etc. already write. Nothing enforced that EVERY local-history write
// site keeps stamping a number — a future one that didn't would silently fall back to the
// weaker date-only test with no warning. Every hist.unshift({...}) call site in tandem.html
// must carry `id: Date.now()` (or an equivalent numeric-producing expression), not a string.
{
  const unshiftSites = [...html.matchAll(/hist\.unshift\(\{[\s\S]{0,600}?\}\);/g)];
  check(`R5 floor: at least one hist.unshift() local-history write site found (found ${unshiftSites.length})`,
    unshiftSites.length > 0);
  const nonNumeric = unshiftSites.filter(m => !/id:\s*Date\.now\(\)/.test(m[0]));
  check(`R5 floor: every hist.unshift() site stamps id: Date.now() (a real numeric instant) — ${nonNumeric.length} site(s) do not`,
    nonNumeric.length === 0);
}

// ── 1. Extract the live functions (no re-implementation) ──
const localDateStrSrc = grab('localDateStr', /function localDateStr\([\s\S]*?\n\}/);
const recovSrc = grab('RECOVERY_PARAMS', /const RECOVERY_PARAMS = \{[\s\S]*?\};/);
const mgflSrc = grab('muscleGroupFromLabel', /function muscleGroupFromLabel\(label\) \{[\s\S]*?\n\}/);
const cpdSrc = grab('canPlaceDay', /function canPlaceDay\([\s\S]*?\n\}/);
const cwcSrc = grab('computeWeekCadence', /function computeWeekCadence\([\s\S]*?\n\}/);
const gwsSrc = grab('getWeekSchedule', /function getWeekSchedule\(\) \{[\s\S]*?\n\}/);
const ibpsSrc = grab('isBeforeProgramStart', /function isBeforeProgramStart\([\s\S]*?\n\}/);
const iphrSrc = grab('isProgramHistoryRow', /function isProgramHistoryRow\([\s\S]*?\n\}/);
const cscSrc = grab('completedSessionCount', /function completedSessionCount\(\) \{[\s\S]*?\n\}/);
const npdkSrc = grab('nextProgramDayKey', /function nextProgramDayKey\(\) \{[\s\S]*?\n\}/);
const odSrc = grab('getOverdueDays', /function getOverdueDays\(\) \{[\s\S]*?\n\}/);
const oneoffSrc = grab('ONEOFF_SESSION_TYPE', /const ONEOFF_SESSION_TYPE = '[^']*';/);

// ── 2. FixedDate — deterministic "now" per test iteration ──
const fixedDateSrc = `
class FixedDate extends Date {
  constructor(...args) {
    if (args.length === 0) super(FixedDate.__now); else super(...args);
  }
  static now() { return FixedDate.__now; }
}
FixedDate.__now = 0;
this.FixedDate = FixedDate;
`;

function buildContext() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(fixedDateSrc, ctx);
  vm.runInContext(
    [oneoffSrc, recovSrc, mgflSrc, cpdSrc, cwcSrc, localDateStrSrc, ibpsSrc, iphrSrc, cscSrc, npdkSrc, gwsSrc, odSrc,
     'this.Date = FixedDate;', // every extracted function below must see the fixed "now"
     'this.ONEOFF_SESSION_TYPE = ONEOFF_SESSION_TYPE;',
     'this.getOverdueDays = getOverdueDays; this.nextProgramDayKey = nextProgramDayKey;',
     'this.completedSessionCount = completedSessionCount; this.localDateStr = localDateStr;',
    ].join('\n'),
    ctx
  );
  // getWeekSchedule/getOverdueDays call getActiveProgram(); stub it to a synthetic
  // N-day program — cadence/day-of-week correctness is cadence-smoke.mjs's job, this
  // gate is about the START POINTER, so any legal N-day program body is sufficient.
  ctx.getActiveProgram = () => {
    const n = Number(ctx.cfg?.days) || 0;
    return Array.from({ length: n }, (_, i) => ({ key: `day${i + 1}`, label: `Day ${i + 1}` }));
  };
  ctx.cfg = {};
  const store = { tandem_history: [] };
  ctx.LS = {
    get: k => (k in store ? JSON.parse(JSON.stringify(store[k])) : null),
    set: (k, v) => { store[k] = JSON.parse(JSON.stringify(v)); },
    del: k => { delete store[k]; },
  };
  return ctx;
}

// ── 3. Scenario simulators — mirror the REAL cfg-mutation each code path performs ──
// (adoptTemplate/createCustomTemplate/revertToGenerated themselves do live Supabase
// I/O that can't run headless; this replicates exactly the cfg/LS side effects those
// functions were edited to perform for BUG-93, so a regression to the real function
// bodies — verified separately by the source-grep checks below — is what this catches.)

function startGenerated(ctx, days, weeks = 12) {
  ctx.cfg = {
    goal: 'build_muscle', days, weeks, sex: 'male', experience: 'intermediate',
    startDate: ctx.localDateStr(), startEpoch: ctx.FixedDate.now(),
  };
  ctx.LS.del('tandem_current_day');
  ctx.LS.set('tandem_history', []); // buildProgram() does not clear tandem_history itself,
  // but a genuinely fresh persona has none yet — see the "inherited history" case below
  // for the scenario where OLD history exists and must be excluded by the start boundary.
}

function startAdoptOrCustom(ctx, days, weeks = 12) {
  // Simulates a user who already had a DIFFERENT program running (old start date, old
  // day count, real completed history) and then adopts/builds a new one — R4's exact
  // reported shape ("the old plan's calendar position and overdue gap carry over").
  ctx.cfg = { goal: 'build_muscle', days: 3, weeks: 12, startDate: '2020-01-01', startEpoch: 0 };
  const oldHist = [];
  for (let i = 0; i < 5; i++) {
    oldHist.push({ id: 1000 + i, session_date: '2020-01-0' + (i + 1), week: 1, goal: 'build_muscle', day: 'day' + ((i % 3) + 1), exercises: {}, completed: true });
  }
  ctx.LS.set('tandem_history', oldHist);
  // adoptTemplate()/createCustomTemplate()'s BUG-93 fix, replicated:
  ctx.cfg.days = days;
  ctx.cfg.weeks = weeks;
  ctx.cfg.startDate = ctx.localDateStr();
  ctx.cfg.startEpoch = ctx.FixedDate.now();
  delete ctx.cfg.revertedAt;
  ctx.LS.del('tandem_current_day');
}

function startRevert(ctx, days, weeks = 12) {
  // Original generated program, started 30 days before "now" (well outside any
  // overdue window on its own), with its own completed history ending 10 days ago —
  // i.e. genuinely overdue on the generated cadence if measured naively.
  const startMs = ctx.FixedDate.now() - 30 * 86400000;
  const start = new Date(startMs);
  const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  ctx.cfg = { goal: 'build_muscle', days, weeks, startDate: startStr, startEpoch: startMs, programSource: 'generated' };
  const tenDaysAgoMs = ctx.FixedDate.now() - 10 * 86400000;
  const tenDaysAgo = new Date(tenDaysAgoMs);
  const tenDaysAgoStr = `${tenDaysAgo.getFullYear()}-${String(tenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(tenDaysAgo.getDate()).padStart(2, '0')}`;
  ctx.LS.set('tandem_history', [
    { id: tenDaysAgoMs, session_date: tenDaysAgoStr, week: 2, goal: 'build_muscle', day: 'day1', exercises: {}, completed: true },
  ]);
  const preRevertDay = ctx.nextProgramDayKey();
  const preRevertWeek = ctx.completedSessionCount();
  // User then spends time on an adopted program (irrelevant to this gate's assertions
  // beyond proving revert doesn't care what programSource was mid-detour).
  ctx.cfg.programSource = 'library';
  // revertToGenerated()'s BUG-93 fix, replicated:
  ctx.cfg.programSource = 'generated';
  ctx.cfg.revertedAt = ctx.localDateStr();
  return { preRevertDay, preRevertWeek };
}

// ── 4. The matrix ──
const TZS = ['America/Los_Angeles', 'UTC'];
const DAY_COUNTS = [2, 3, 4, 5, 6];
// 2026-09-01 is a Tuesday — offsets 0-6 cover every weekday exactly once.
const ANCHOR = { y: 2026, m: 8, d: 1 }; // month is 0-indexed (8 = September)

let scenarios = 0;
const originalTZ = process.env.TZ;
try {
  for (const tz of TZS) {
    process.env.TZ = tz;
    for (let offset = 0; offset < 7; offset++) {
      // 8pm LOCAL on the target day — deliberately past the 5pm-PT danger zone R2's
      // own bug report named ("after 5pm PT these yield tomorrow" under toISOString()).
      const fixedNowMs = new Date(ANCHOR.y, ANCHOR.m, ANCHOR.d + offset, 20, 0, 0).getTime();
      const weekdayName = new Date(fixedNowMs).toLocaleDateString('en-US', { weekday: 'long' });

      for (const days of DAY_COUNTS) {
        // -- generated --
        {
          const ctx = buildContext();
          ctx.FixedDate.__now = fixedNowMs;
          startGenerated(ctx, days);
          scenarios++;
          check(`[${tz}/${weekdayName}/${days}d/generated] Day 1 at start`, ctx.nextProgramDayKey() === 'day1');
          check(`[${tz}/${weekdayName}/${days}d/generated] 0 overdue at start`, ctx.getOverdueDays() === 0);
        }
        // -- library-adopt --
        {
          const ctx = buildContext();
          ctx.FixedDate.__now = fixedNowMs;
          startAdoptOrCustom(ctx, days);
          scenarios++;
          check(`[${tz}/${weekdayName}/${days}d/library-adopt] Day 1 at start`, ctx.nextProgramDayKey() === 'day1');
          check(`[${tz}/${weekdayName}/${days}d/library-adopt] 0 overdue at start`, ctx.getOverdueDays() === 0);
        }
        // -- custom --
        {
          const ctx = buildContext();
          ctx.FixedDate.__now = fixedNowMs;
          startAdoptOrCustom(ctx, days); // createCustomTemplate() applies the identical fix
          scenarios++;
          check(`[${tz}/${weekdayName}/${days}d/custom] Day 1 at start`, ctx.nextProgramDayKey() === 'day1');
          check(`[${tz}/${weekdayName}/${days}d/custom] 0 overdue at start`, ctx.getOverdueDays() === 0);
        }
        // -- revert -- (no Day 1 assertion: Kerwin ruled the week/day is NOT reset)
        {
          const ctx = buildContext();
          ctx.FixedDate.__now = fixedNowMs;
          const { preRevertDay, preRevertWeek } = startRevert(ctx, days);
          scenarios++;
          check(`[${tz}/${weekdayName}/${days}d/revert] 0 overdue immediately after revert`, ctx.getOverdueDays() === 0);
          check(`[${tz}/${weekdayName}/${days}d/revert] day pointer NOT reset (resumes, per Kerwin's ruling)`,
            ctx.nextProgramDayKey() === preRevertDay);
          check(`[${tz}/${weekdayName}/${days}d/revert] week/session count NOT reset`,
            ctx.completedSessionCount() === preRevertWeek);
        }
      }
    }
  }
} finally {
  if (originalTZ === undefined) delete process.env.TZ; else process.env.TZ = originalTZ;
}

// ── 5. R5 same-day boundary refinement — a direct, narrow unit check ──
// A session logged under the OLD program earlier the SAME calendar day must not count
// toward the NEW program once cfg.startEpoch (set at the same instant as cfg.startDate)
// post-dates it — the date-only comparison alone cannot see this (R5's own wording).
{
  const ctx = buildContext();
  const now = new Date(2026, 8, 22, 9, 0, 0).getTime(); // 9am local
  ctx.FixedDate.__now = now;
  const todayStr = ctx.localDateStr();
  // An old-program session logged this morning, BEFORE the switch:
  ctx.LS.set('tandem_history', [
    { id: now - 3600000, session_date: todayStr, week: 1, goal: 'build_muscle', day: 'day1', exercises: {}, completed: true },
  ]);
  // Now the user switches programs THIS AFTERNOON (same calendar day):
  ctx.FixedDate.__now = now + 4 * 3600000; // +4h, still same local day
  ctx.cfg = { goal: 'fat_burn', days: 3, weeks: 8, startDate: ctx.localDateStr(), startEpoch: ctx.FixedDate.now() };
  check('R5: same-day pre-switch session excluded from the new program\'s completed count',
    ctx.completedSessionCount() === 0);
  check('R5: same-day pre-switch session does not advance the new program\'s queue past Day 1',
    ctx.nextProgramDayKey() === 'day1');
}

console.log('PROGRAM-START SMOKE — BUG-93 (queue ownership, local dates, start-pointer reset, revert overdue)\n');
console.log(`  ${scenarios} scenarios checked across ${TZS.length} timezone(s) x 7 weekday(s) x ${DAY_COUNTS.length} day-count(s) x 4 program-start path(s)`);
if (failures) {
  console.log(`\n${failures} FAILURE(S):`);
  for (const f of fails) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log('\nAll BUG-93 program-start guarantees hold. ✓');
process.exit(0);

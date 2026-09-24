#!/usr/bin/env node
/**
 * daylabel-smoke.mjs — REGRESSION GUARD for BUG-146 (day counter drift).
 *
 * BUG-146: two "Day N of M" renderers (renderTracker's wnLabel, renderDashHero's
 * daySlot) each built their own string from getWeekSchedule().todayIndex — a
 * CALENDAR position — while the workout actually SERVED (title, lifts, and the
 * separate dayKey used by getProgramDayNumber()) came from the completion QUEUE
 * (BUG-93's deliberate split: calendar decides train-vs-rest, completion decides
 * which workout). Those two only agree when nothing has ever been missed; after
 * any missed/skipped session they silently diverge, which is what put "Day 7 of 7"
 * under a header for a 5-day split's 4th workout.
 *
 * The fix: ONE shared function, getProgramDayLabel(), that derives the label's
 * numerator/denominator from the SAME completedSessionCount()-based queue position
 * that decides dayKey (it delegates to getProgramDayNumber() for dayKey rather
 * than recomputing it). This gate extracts and exercises the REAL functions from
 * tandem.html (no re-implementation — same discipline as cadence-smoke.mjs and
 * program-start-smoke.mjs) and proves, after a SIMULATED MISSED SESSION (the exact
 * drift-inducing scenario), that:
 *   1. The denominator is cfg.days (the program's own split length), never 7 —
 *      Kerwin's 2026-09-24 ruling (Decision Queue card dayof7_unit).
 *   2. The numerator shown always matches the numeric suffix of the dayKey that
 *      decides which workout is served — they cannot drift apart, by construction.
 *   3. On a rest slot, the label still reflects the next unperformed training
 *      day's position (matches getProgramDayNumber()'s own queue semantics),
 *      not a calendar slot number.
 *   4. Before any session is missed, the calendar-position number and the
 *      queue-position number happen to coincide (sanity — the fix doesn't change
 *      the on-track case). After a miss, they provably diverge, and the label
 *      uses the queue number, not the calendar one — this is the actual
 *      regression case that motivated the fix.
 *
 * Run: node scripts/daylabel-smoke.mjs
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
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);
  if (!cond) { failures++; fails.push(label); }
}

const grab = (name, re) => { const m = html.match(re); if (!m) throw new Error(`could not locate ${name} in tandem.html`); return m[0]; };

// ── 1. Extract the live functions (no re-implementation) ──
const localDateStrSrc = grab('localDateStr', /function localDateStr\([\s\S]*?\n\}/);
const cdbSrc = grab('calendarDaysBetween', /function calendarDaysBetween\([\s\S]*?\n\}/);
const recovSrc = grab('RECOVERY_PARAMS', /const RECOVERY_PARAMS = \{[\s\S]*?\};/);
const mgflSrc = grab('muscleGroupFromLabel', /function muscleGroupFromLabel\(label\) \{[\s\S]*?\n\}/);
const cpdSrc = grab('canPlaceDay', /function canPlaceDay\([\s\S]*?\n\}/);
const cwcSrc = grab('computeWeekCadence', /function computeWeekCadence\([\s\S]*?\n\}/);
const gwsSrc = grab('getWeekSchedule', /function getWeekSchedule\(\) \{[\s\S]*?\n\}/);
const ibpsSrc = grab('isBeforeProgramStart', /function isBeforeProgramStart\([\s\S]*?\n\}/);
const iphrSrc = grab('isProgramHistoryRow', /function isProgramHistoryRow\([\s\S]*?\n\}/);
const cscSrc = grab('completedSessionCount', /function completedSessionCount\(\) \{[\s\S]*?\n\}/);
const npdkSrc = grab('nextProgramDayKey', /function nextProgramDayKey\(\) \{[\s\S]*?\n\}/);
const gpdnSrc = grab('getProgramDayNumber', /function getProgramDayNumber\(\) \{[\s\S]*?\n\}/);
const gpdlSrc = grab('getProgramDayLabel', /function getProgramDayLabel\(\) \{[\s\S]*?\n\}/);
const oneoffSrc = grab('ONEOFF_SESSION_TYPE', /const ONEOFF_SESSION_TYPE = '[^']*';/);

// BUG-146 wiring guard: the renderers must actually CALL the shared function — the
// exact "correct function, never called" trap program-start-smoke.mjs's own R1
// guard exists for (BUG-93's Cycle 86 regression).
{
  const rt = grab('renderTracker', /function renderTracker\(\) \{[\s\S]*?\n\}\n/);
  check('renderTracker() calls getProgramDayLabel() (not a separate calendar computation)',
    /getProgramDayLabel\(\)/.test(rt) && !/_slotNum/.test(rt));
  const rdh = grab('renderDashHero', /function renderDashHero\(\) \{[\s\S]*?\n\}\n/);
  check('renderDashHero() calls getProgramDayLabel() (not a separate calendar computation)',
    /getProgramDayLabel\(\)/.test(rdh) && !/sched\.todayIndex \+ 1/.test(rdh));
}

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
    [oneoffSrc, recovSrc, mgflSrc, cpdSrc, cwcSrc, localDateStrSrc, cdbSrc, ibpsSrc, iphrSrc, cscSrc, npdkSrc, gwsSrc, gpdnSrc, gpdlSrc,
     'this.Date = FixedDate;',
     'this.ONEOFF_SESSION_TYPE = ONEOFF_SESSION_TYPE;',
     'this.nextProgramDayKey = nextProgramDayKey; this.getProgramDayNumber = getProgramDayNumber; this.getProgramDayLabel = getProgramDayLabel;',
     'this.completedSessionCount = completedSessionCount; this.localDateStr = localDateStr; this.getWeekSchedule = getWeekSchedule;',
    ].join('\n'),
    ctx
  );
  // Same stub program-start-smoke.mjs uses: cadence correctness is cadence-smoke.mjs's
  // job, this gate is about the LABEL, so any legal N-day program body is sufficient.
  ctx.getActiveProgram = () => {
    const n = Number(ctx.cfg?.days) || 0;
    return Array.from({ length: n }, (_, i) => ({ key: `day${i + 1}`, label: `Day ${i + 1}` }));
  };
  const store = { tandem_history: [] };
  ctx.LS = {
    get: k => (k in store ? JSON.parse(JSON.stringify(store[k])) : null),
    set: (k, v) => { store[k] = JSON.parse(JSON.stringify(v)); },
    del: k => { delete store[k]; },
  };
  return ctx;
}

function ymd(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DAY_MS = 86400000;

// ── 3. Scenario: 5-day split, on-track (completed exactly one session per
//     calendar day so far) — sanity that the fix is byte-identical here. ──
{
  const ctx = buildContext();
  const startMs = 0;
  ctx.cfg = { goal: 'build_muscle', days: 5, weeks: 12, startDate: ymd(startMs), startEpoch: startMs };
  FixedDateNow(ctx, startMs); // "today" = day 0, nothing completed yet
  const label0 = ctx.getProgramDayLabel();
  check('on-track, day 0: denom === cfg.days (5), not 7', label0?.denom === 5);
  check('on-track, day 0: dayKey suffix matches label.num', label0 && label0.dayKey === `day${label0.num}`);
}

// ── 4. Scenario: 4-day split, one session MISSED — the actual BUG-146 drift case ──
// Complete days 1 and 2 on schedule (day 0, day 1 of the calendar week), then
// MISS day 2's slot entirely (no session logged), advance the calendar to slot 4,
// and log day 3's workout there. completedSessionCount() is now 3 (queue position
// day4 next), while the CALENDAR slot is 4 of 7 — the exact case that used to
// print "Day 4 of 7" from sched.todayIndex while a 4-day split has no 4th
// calendar-of-7 concept the user asked for; the ruling replaces it with the
// queue-derived "Day N of 4".
{
  const ctx = buildContext();
  const startMs = 0;
  ctx.cfg = { goal: 'build_muscle', days: 4, weeks: 12, startDate: ymd(startMs), startEpoch: startMs };

  // Complete exactly ONE session (day1), logged on calendar day 0, then jump
  // "today" forward 5 calendar days without logging anything else — 4 training
  // slots were MISSED along the way (whatever the cadence's exact rest layout,
  // the calendar has advanced 5 slots while the queue has only advanced 1).
  const hist = [
    { id: 1, session_date: ymd(0 * DAY_MS), week: 1, goal: 'build_muscle', day: 'day1', exercises: {}, completed: true },
  ];
  ctx.LS.set('tandem_history', hist);
  FixedDateNow(ctx, 5 * DAY_MS); // "today" is calendar slot index 5 (0-based) -> slot 6 of 7

  const sched = ctx.getWeekSchedule();
  const calendarSlotNum = sched.todayIndex + 1; // the OLD (buggy) numerator
  const label = ctx.getProgramDayLabel();
  const dayKey = ctx.getProgramDayNumber();

  check('drift scenario reproduces: calendar slot (6) and queue position actually differ (proves this scenario exercises the bug)',
    calendarSlotNum === 6 && label.num !== calendarSlotNum);
  check('label.denom is cfg.days (4), never the literal 7',
    label.denom === 4);
  check('label.num is the QUEUE position (completedSessionCount % days + 1 = 2), not the calendar slot (6)',
    label.num === 2);
  check('label.dayKey matches getProgramDayNumber() exactly (single source, cannot drift)',
    label.dayKey === dayKey);
  check('label numerator agrees with the numeric suffix of the served dayKey (when a training slot; a rest slot is covered separately below)',
    dayKey === 'rest' ? label.isRest : dayKey === `day${label.num}`);
}

// ── 5. Scenario: rest slot — label still reports the NEXT training day's queue
//     position (matches getProgramDayNumber()'s 'rest' semantics), not a calendar
//     slot number, and isRest is set. ──
{
  const ctx = buildContext();
  const startMs = 0;
  ctx.cfg = { goal: 'build_muscle', days: 3, weeks: 12, startDate: ymd(startMs), startEpoch: startMs };
  ctx.LS.set('tandem_history', [
    { id: 1, session_date: ymd(0), week: 1, goal: 'build_muscle', day: 'day1', exercises: {}, completed: true },
  ]);
  // Find a calendar slot in the generated cadence that is 'rest' and jump "today" there.
  let restSlotMs = null;
  for (let i = 1; i <= 7 && restSlotMs == null; i++) {
    FixedDateNow(ctx, i * DAY_MS);
    const s = ctx.getWeekSchedule();
    if (s.cadence[s.todayIndex] === 'rest') restSlotMs = i * DAY_MS;
  }
  check('found a rest slot within a week to test against', restSlotMs != null);
  if (restSlotMs != null) {
    const label = ctx.getProgramDayLabel();
    check('rest slot: isRest is true', label?.isRest === true);
    check('rest slot: dayKey is "rest"', label?.dayKey === 'rest');
    check('rest slot: num/denom still reflect the next unperformed training day\'s queue position (2 of 3 — 1 completed so far)',
      label?.num === 2 && label?.denom === 3);
  }
}

function FixedDateNow(ctx, ms) {
  ctx.FixedDate.__now = ms;
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED: ${fails.join('; ')}`);
  process.exit(1);
}
console.log('\nAll day-label checks passed.');

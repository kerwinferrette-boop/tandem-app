#!/usr/bin/env node
/**
 * old-workout-position-smoke.mjs — BUG-264 guard. Static + vm, no browser.
 *
 * Kerwin's ruling, 2026-11-15, verbatim: "It should log in my history, but not move where
 * I'm at" / "Make that the rule for old workouts that get saved across the app" / "Not just
 * one offs" / "And should go across Dani, myself, & anyone else who wants to use the app".
 *
 * A workout dated before the user's CURRENT program start, of any session type, saved by
 * any path, stays in history and never moves the program position. One home:
 * isBeforeProgramStart(), adapted for raw rows by isFromBeforeCurrentProgram().
 *
 *   [O1] the queue (day and week) is identical with and without old workouts of every type,
 *        for two users with DIFFERENT program starts — the rule reads each user's own cfg.
 *   [O2] the old workouts still count as history: they are in tandem_history and the
 *        all-time completed total the server keeps is not what the queue reads.
 *   [O3] isFromBeforeCurrentProgram(): true for an old row of every session type, false for
 *        a current row, false when the user has no program start.
 *   [O4] Start never resumes into an open row from before the current program.
 *   [O5] every position reader applies the rule: completedSessionCount, programQueuePosition,
 *        getOverdueDays (isBeforeProgramStart) and both pointer caches + the resume path
 *        (isFromBeforeCurrentProgram).
 *   [O6] nothing in the rule or the server sweep is keyed to an account: no uuid literal in
 *        either, and the sweep writes workout_sessions only — never users or a program field.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(join(root, 'tandem.html'), 'utf8');
const fails = [];
const check = (id, ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${id} ${msg}`); if (!ok) fails.push(id); };
const grab = (name, re) => { const m = html.match(re); if (!m) throw new Error(`could not locate ${name}`); return m[0]; };
const fn = (name) => grab(name, new RegExp(`(?:async )?function ${name}\\([\\s\\S]*?\\n\\}`));

const src = [
  grab('ONEOFF_SESSION_TYPE', /const ONEOFF_SESSION_TYPE = '[^']*';/),
  grab('VOID_SESSION_TYPES', /const VOID_SESSION_TYPES = [^\n]*\nfunction isVoidSessionType[^\n]*/),
  ...['localDateStr', 'isProgramHistoryRow', 'isVoidHistoryRow', 'isBeforeProgramStart', 'isFromBeforeCurrentProgram',
    'completedSessionCount', 'programQueuePosition', 'deriveProgramWeek', 'nextProgramDayKey', 'startOrResumeSession'].map(fn),
].join('\n');

function ctxFor(startDate, days = 5) {
  const store = {}, raw = new Map();
  const ctx = {
    console: { log() {}, warn() {}, error() {} }, Date, Math, Number, String, isNaN, Promise, Error,
    cfg: { days, weeks: 12, startDate }, currentWeek: 1, currentDay: 'day1', currentUser: { id: 'any-user' },
    getPhase: () => null, document: { getElementById: () => null },
    LS: { get: k => store[k] ?? null, set: (k, v) => { store[k] = v; } },
    LSraw: { get: k => raw.has(k) ? raw.get(k) : null, set: (k, v) => raw.set(k, v), del: k => raw.delete(k) },
  };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  return ctx;
}
const row = (id, d, day, extra = {}) => ({ id, session_date: d, day_type: day, day, session_type: 'strength', completed: true, created_at: d + 'T15:00:00Z', ...extra });
const OLD_TYPES = [
  row('old-strength', '2026-08-05', 'day3'),
  row('old-credited', '2026-10-05', 'day2'),                                  // server-side credit / auto-finish
  row('old-oneoff', '2026-10-06', 'chest', { session_type: 'oneoff' }),
  row('old-journal', '2026-10-07', 'day4', { backdated: true }),
  row('old-null-type', '2026-10-08', 'day1', { session_type: null }),
  row('old-skip', '2026-10-09', 'day1', { session_type: 'skipped', completed: false }),
  { id: 1790000000000, session_date: '2026-10-10', day: 'day5', exercises: { a: [{ set: 1, w: 100, r: 5 }] } }, // a late local Finish
];
const where = (ctx, hist) => { ctx.LS.set('tandem_history', hist); return `${ctx.deriveProgramWeek()}/${ctx.nextProgramDayKey()}/${ctx.completedSessionCount()}`; };

{ // [O1] [O2]
  const users = [
    { start: '2026-11-04', current: [row('a', '2026-11-04', 'day1'), row('b', '2026-11-05', 'day2')] },
    { start: '2026-10-11', current: [row('c', '2026-10-12', 'day1'), row('d', '2026-10-14', 'day2'), row('e', '2026-10-16', 'day3')] },
  ];
  const res = users.map(u => {
    const ctx = ctxFor(u.start);
    const only = where(ctx, u.current);
    const withOld = where(ctx, [...OLD_TYPES, ...u.current]);
    return { only, withOld, kept: ctx.LS.get('tandem_history').length };
  });
  check('[O1]', res.every(r => r.only === r.withOld) && res[0].only !== res[1].only,
    `old workouts of every type move nothing, per user (${res.map(r => `${r.only} vs ${r.withOld}`).join('; ')})`);
  check('[O2]', res.every((r, i) => r.kept === OLD_TYPES.length + users[i].current.length),
    `old workouts stay in history (${res.map(r => r.kept).join(', ')} rows kept)`);
}
{ // [O3]
  const ctx = ctxFor('2026-11-04');
  const types = ['strength', 'oneoff', 'skipped', 'abandoned', null, undefined];
  const oldAll = types.every(t => ctx.isFromBeforeCurrentProgram({ id: 'x', session_date: '2026-10-01', session_type: t }));
  const curNone = types.every(t => !ctx.isFromBeforeCurrentProgram({ id: 'x', session_date: '2026-11-04', session_type: t }));
  const noStart = !ctxFor(null).isFromBeforeCurrentProgram({ id: 'x', session_date: '2026-10-01' });
  check('[O3]', oldAll && curNone && noStart, `old rows of every type are old, current rows are not, no program start means nothing is old (${oldAll}/${curNone}/${noStart})`);
}
{ // [O4]
  const ctx = ctxFor('2026-11-04');
  const inserts = [];
  ctx.sb = { from: () => { const c = {
    select: () => c, eq: () => c,
    maybeSingle: () => Promise.resolve({ data: { id: 'old-open', notes: null, session_type: 'strength', session_date: '2026-10-05' }, error: null }),
    insert: (r) => { inserts.push(r); return c; },
    single: () => Promise.resolve({ data: { id: 'new-1' }, error: null }) }; return c; } };
  ctx.LSraw.set('tandem_active_session_id', 'old-open');
  const id = await ctx.startOrResumeSession();
  check('[O4]', id === 'new-1' && inserts.length === 1, `Start does not resume into an open row from an old program (resumed=${id}, inserts=${inserts.length})`);
}
{ // [O5]
  const body = (name) => fn(name);
  const direct = ['completedSessionCount', 'programQueuePosition', 'getOverdueDays'].every(n => /isBeforeProgramStart\(/.test(body(n)));
  const lastDone = /const lastDone = sessions\?\.find\([\s\S]{0,300}?isFromBeforeCurrentProgram\(s\)/.test(html);
  const boot = /if \(lastSession && !isFromBeforeCurrentProgram\(lastSession\)\)/.test(html);
  const resume = /isFromBeforeCurrentProgram\(_resumeRow\)/.test(body('startOrResumeSession'));
  const ptrWrites = (html.match(/LS\.set\('tandem_current_day'/g) || []).length;
  check('[O5]', direct && lastDone && boot && resume && ptrWrites === 4,
    `every position reader applies the rule (counters=${direct}, sync pointer=${lastDone}, boot pointer=${boot}, resume=${resume}, pointer sites=${ptrWrites}/4)`);
}
{ // [O6]
  const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const m27 = readFileSync(join(root, 'migrations', '0027_bug261_auto_finish_stale_sessions.sql'), 'utf8').replace(/--.*$/gm, '');
  const rule = fn('isFromBeforeCurrentProgram') + fn('isBeforeProgramStart') + fn('programQueuePosition');
  const updates = [...m27.matchAll(/\bupdate\s+([a-z_.]+)/gi)].map(m => m[1]);
  check('[O6]', !uuid.test(rule) && !uuid.test(m27) && updates.length > 0 && updates.every(t => t === 'public.workout_sessions')
    && !/current_week|program_start|day_type\s*=/.test(m27),
    `no account-specific id anywhere in the rule or the sweep; the sweep updates only ${[...new Set(updates)].join(', ')}`);
}

if (fails.length) { console.log(`\nBUG-264 old-workout position smoke FAILED: ${fails.join(' ')}`); process.exit(1); }
console.log('\nBUG-264 old-workout position smoke: all assertions hold');

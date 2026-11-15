#!/usr/bin/env node
/**
 * skip-then-start-smoke.mjs — BUG-261 guard. Static + vm, no browser, so it runs anywhere.
 *
 * The defect (VERIFIED in prod, 2026-11-15): skipAhead() wrote a session_type='skipped'
 * row for today, and the next Start tap failed 23505 on the one-program-row-per-day index,
 * which only exempted one-offs. Kerwin's ruling: "A skipped day should not count as a
 * workout that day. It should count as me skipping it" — keep the skip, free the slot.
 *
 * Runs the REAL startOrResumeSession() / claimTodaysProgramRow() from tandem.html against a
 * fake workout_sessions table that ENFORCES the unique index, under both the pre-0026 and
 * the 0026 predicate, plus the REAL history functions the program queue reads.
 *
 *   [T1] new index: skip, then Start -> a real session is minted for today, the skip row
 *        is untouched and still 'skipped'.
 *   [T2] a stored pointer to the skipped row is never resumed into.
 *   [T3] old index: skip, then Start -> no conversion of the skip, and the user is told
 *        why (userMessage), not "try again".
 *   [T4] an OPEN real row for today with no local pointer -> 23505 resumes into it, no
 *        second row.
 *   [T5] an 'abandoned' row (server sweep) is reopened and resumed, not duplicated.
 *   [T6] a COMPLETED program row today -> userMessage says it is already finished.
 *   [T7] startWorkoutTimer() surfaces e.userMessage.
 *   [H1] local history: a skip and a real workout on the same day + day key keep separate
 *        keys, and the real one counts (the old union let completed:false uncount it).
 *   [H2] an open cloud twin hydrated mid-workout cannot uncount the finished local row.
 *   [H3] a cloud row the server completed later (auto-finish / hand repair) PROMOTES the
 *        stale local completed:false copy, and the queue advances.
 *   [Q1]-[Q6] BUG-262: Skip ahead forfeits the slot it skipped (and only that one): the queue
 *        and week move on, a stale or duplicate skip moves nothing, a skip is never volume.
 *   [M1] migrations/0026 frees the slot for 'skipped' and still exempts one-offs.
 *   [M2] migrations/0027 sweeps from the LAST SET, closes zero-set rows without credit,
 *        excludes one-offs and skips, revokes client EXECUTE, and is scheduled.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(join(root, 'tandem.html'), 'utf8');
const fails = [];
const check = (id, ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${id} ${msg}`); if (!ok) fails.push(id); };
const grab = (name, re) => { const m = html.match(re); if (!m) throw new Error(`could not locate ${name} in tandem.html`); return m[0]; };

const src = [
  grab('ONEOFF_SESSION_TYPE', /const ONEOFF_SESSION_TYPE = '[^']*';/),
  grab('VOID_SESSION_TYPES', /const VOID_SESSION_TYPES = [^\n]*\nfunction isVoidSessionType[^\n]*/),
  grab('localDateStr', /function localDateStr\([\s\S]*?\n\}/),
  grab('startOrResumeSession', /async function startOrResumeSession\(\) \{[\s\S]*?\n\}/),
  grab('claimTodaysProgramRow', /async function claimTodaysProgramRow\([\s\S]*?\n\}/),
  grab('startWorkoutTimer', /async function startWorkoutTimer\(\) \{[\s\S]*?\n\}/),
  grab('isProgramHistoryRow', /function isProgramHistoryRow\([\s\S]*?\n\}/),
  grab('isVoidHistoryRow', /function isVoidHistoryRow\([\s\S]*?\n\}/),
  grab('isBeforeProgramStart', /function isBeforeProgramStart\([\s\S]*?\n\}/),
  grab('isFromBeforeCurrentProgram', /function isFromBeforeCurrentProgram\([\s\S]*?\n\}/),
  grab('completedSessionCount', /function completedSessionCount\(\) \{[\s\S]*?\n\}/),
  grab('programQueuePosition', /function programQueuePosition\(\) \{[\s\S]*?\n\}/),
  grab('deriveProgramWeek', /function deriveProgramWeek\(\) \{[\s\S]*?\n\}/),
  grab('nextProgramDayKey', /function nextProgramDayKey\(\) \{[\s\S]*?\n\}/),
  grab('_historyDateKey', /function _historyDateKey\([\s\S]*?\n\}/),
  grab('_historyRowKey', /function _historyRowKey\([\s\S]*?\n\}/),
  grab('_historySortKey', /function _historySortKey\([\s\S]*?\n\}/),
  grab('_historyIsMidnightTwin', /const HISTORY_TWIN_MAX_MS[\s\S]*?function _historyIsMidnightTwin\([\s\S]*?\n\}/),
  grab('dedupeLocalHistory', /function dedupeLocalHistory\([\s\S]*?\n\}/),
  grab('historyDisplayDate', /function historyDisplayDate\([\s\S]*?\n\}/),
  grab('exercisesFromCloudSets', /function exercisesFromCloudSets\([\s\S]*?\n\}/),
  grab('historyExLabel', /function historyExLabel\([\s\S]*?\n\}/),
  grab('historyRowFromCloudSession', /function historyRowFromCloudSession\([\s\S]*?\n\}/),
  grab('mergeCloudSessionsIntoHistory', /function mergeCloudSessionsIntoHistory\([\s\S]*?\n\}/),
].join('\n');

const UID = 'u-1';

// A workout_sessions table that enforces the partial unique index the way Postgres does.
function makeDb(exempt) {
  const rows = [];
  let n = 0;
  const occupies = (r) => r.session_type == null || !exempt.includes(r.session_type);
  const clash = (cand) => occupies(cand) && rows.some(r => r !== cand && occupies(r)
    && r.user_id === cand.user_id && r.session_date === cand.session_date);
  function q() {
    const f = []; let op = 'select', payload = null, orderDesc = false;
    const match = () => rows.filter(r => f.every(fn => fn(r)));
    const run = () => {
      if (op === 'insert') {
        const row = { id: 'row-' + (++n), session_type: 'strength', created_at: new Date(Date.now() + n).toISOString(), ...payload };
        if (clash(row)) return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "workout_sessions_user_date_program_key"' } };
        rows.push(row); return { data: { id: row.id }, error: null };
      }
      if (op === 'update') {
        for (const r of match()) { const before = { ...r }; Object.assign(r, payload);
          if (clash(r)) { Object.assign(r, before); return { data: null, error: { code: '23505' } }; } }
        return { data: null, error: null };
      }
      let out = match().slice().sort((a, b) => a.created_at < b.created_at ? -1 : 1);
      if (orderDesc) out.reverse();
      return { data: out, error: null };
    };
    const c = {
      select: () => c, limit: () => c,
      eq: (k, v) => { f.push(r => r[k] === v); return c; },
      neq: (k, v) => { f.push(r => r[k] !== v); return c; },
      order: (k, o) => { orderDesc = o && o.ascending === false; return c; },
      insert: (p) => { op = 'insert'; payload = p; return c; },
      update: (p) => { op = 'update'; payload = p; return c; },
      single: () => Promise.resolve(run()),
      maybeSingle: () => { const r = run(); return Promise.resolve({ data: (r.data || [])[0] || null, error: r.error }); },
      then: (res, rej) => Promise.resolve(run()).then(res, rej),
    };
    return c;
  }
  return { rows, sb: { from: () => q() } };
}

function ctxFor(db) {
  const ls = new Map(), store = { tandem_history: [] };
  const ctx = {
    console: { log() {}, warn() {}, error() {} }, Date, Math, JSON, Promise, Error, Object, Array, Number, String, Set, Map, isNaN,
    sb: db ? db.sb : null, currentUser: { id: UID }, cfg: { goal: 'build_muscle', weeks: 8, days: 4, startDate: null },
    currentWeek: 1, currentDay: 'day3', getPhase: () => ({ name: 'Accumulation' }),
    LSraw: { get: k => ls.has(k) ? ls.get(k) : null, set: (k, v) => ls.set(k, v), del: k => ls.delete(k) },
    LS: { get: k => store[k] ?? null, set: (k, v) => { store[k] = v; }, del: k => { delete store[k]; } },
    toasts: [], renderSessionTimer() {}, document: { getElementById: () => null },
  };
  ctx.showToast = (m) => ctx.toasts.push(m);
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx;
}
const today = (ctx) => vm.runInContext('localDateStr()', ctx);
const OLD = ['oneoff'], NEW = ['oneoff', 'skipped'];
const skipRow = (d) => ({ user_id: UID, session_date: d, day_type: 'day2', completed: false, session_type: 'skipped' });

(async () => {
  { // [T1] [T2]
    const db = makeDb(NEW); const ctx = ctxFor(db); const d = today(ctx);
    db.rows.push({ id: 'skip-1', created_at: '2026-11-15T18:47:33Z', ...skipRow(d) });
    ctx.LSraw.set('tandem_active_session_id', 'skip-1');
    let id = null, err = null;
    try { id = await ctx.startOrResumeSession(); } catch (e) { err = e; }
    const real = db.rows.filter(r => r.session_type !== 'skipped');
    check('[T1]', !err && real.length === 1 && real[0].session_date === d && db.rows.find(r => r.id === 'skip-1').session_type === 'skipped',
      `skip then Start mints a real session and keeps the skip (err=${err && (err.message || err.code)}, real rows=${real.length})`);
    check('[T2]', id && id !== 'skip-1', `never resumes into the skipped row (resumed id=${id})`);
  }
  { // [T3]
    const db = makeDb(OLD); const ctx = ctxFor(db); const d = today(ctx);
    db.rows.push({ id: 'skip-1', created_at: '2026-11-15T18:47:33Z', ...skipRow(d) });
    let err = null; try { await ctx.startOrResumeSession(); } catch (e) { err = e; }
    check('[T3]', err && /skip/i.test(err.userMessage || '') && db.rows.length === 1 && db.rows[0].session_type === 'skipped',
      `old index: the skip is not converted and the user is told why (msg="${err && err.userMessage}")`);
  }
  { // [T4]
    const db = makeDb(NEW); const ctx = ctxFor(db); const d = today(ctx);
    db.rows.push({ id: 'open-1', user_id: UID, session_date: d, completed: false, session_type: 'strength', created_at: '2026-11-15T10:00:00Z' });
    let id = null, err = null; try { id = await ctx.startOrResumeSession(); } catch (e) { err = e; }
    check('[T4]', !err && id === 'open-1' && db.rows.length === 1 && ctx.LSraw.get('tandem_active_session_id') === 'open-1',
      `23505 on an open real row resumes it, no duplicate (id=${id}, rows=${db.rows.length})`);
  }
  { // [T5]
    const db = makeDb(NEW); const ctx = ctxFor(db); const d = today(ctx);
    db.rows.push({ id: 'ab-1', user_id: UID, session_date: d, completed: false, session_type: 'abandoned', created_at: '2026-11-15T08:00:00Z' });
    let id = null, err = null; try { id = await ctx.startOrResumeSession(); } catch (e) { err = e; }
    check('[T5]', !err && id === 'ab-1' && db.rows.length === 1 && db.rows[0].session_type === 'strength',
      `an abandoned row is reopened and resumed, not duplicated (id=${id}, type=${db.rows[0].session_type})`);
  }
  { // [T6]
    const db = makeDb(NEW); const ctx = ctxFor(db); const d = today(ctx);
    db.rows.push({ id: 'done-1', user_id: UID, session_date: d, completed: true, session_type: 'strength', created_at: '2026-11-15T08:00:00Z' });
    let err = null; try { await ctx.startOrResumeSession(); } catch (e) { err = e; }
    check('[T6]', err && /already finished/i.test(err.userMessage || '') && db.rows.length === 1,
      `a completed day says so instead of "try again" (msg="${err && err.userMessage}")`);
  }
  { // [T7]
    const db = makeDb(OLD); const ctx = ctxFor(db); const d = today(ctx);
    db.rows.push({ id: 'skip-1', created_at: '2026-11-15T18:47:33Z', ...skipRow(d) });
    await ctx.startWorkoutTimer();
    check('[T7]', ctx.toasts.length === 1 && /skip/i.test(ctx.toasts[0]), `Start shows the specific reason (toast="${ctx.toasts[0]}")`);
  }

  { // [H1] skip + real workout, same day and day key
    const ctx = ctxFor(null);
    const hist = [
      { id: 1700000002000, session_date: '2026-11-15', day: 'day2', exercises: { a: [{ set: 1, w: 100, r: 5 }] } },
      { id: 1700000001000, session_date: '2026-11-15', day: 'day2', completed: false, skipped: true, exercises: {} },
    ];
    const out = ctx.dedupeLocalHistory(hist);
    ctx.LS.set('tandem_history', out);
    const count = ctx.completedSessionCount();
    check('[H1]', out.length === 2 && count === 1, `skip and workout keep separate keys; the workout counts (rows=${out.length}, counted=${count})`);
  }
  { // [H2] open cloud twin hydrated mid-workout vs the finished local row
    const ctx = ctxFor(null);
    const hist = [
      { id: 1700000009000, session_date: '2026-11-05', day: 'day2', exercises: { a: [{ set: 1, w: 100, r: 5 }] } },
      { id: 'c213', session_date: '2026-11-05', day_type: 'day2', day: 'day2', completed: false, session_type: 'strength', exercises: { a: [{ set: 1, w: 100, r: 5 }] } },
    ];
    const out = ctx.dedupeLocalHistory(hist);
    ctx.LS.set('tandem_history', out);
    check('[H2]', out.length === 1 && ctx.completedSessionCount() === 1, `an open twin cannot uncount a finished session (rows=${out.length}, counted=${ctx.completedSessionCount()})`);
  }
  { // [H3] the server finished it later; the local copy was hydrated while still open
    const ctx = ctxFor(null);
    const local = [
      { id: 'acc1', session_date: '2026-11-04', day_type: 'day1', day: 'day1', completed: true, session_type: 'strength' },
      { id: 'c213', session_date: '2026-11-05', day_type: 'day2', day: 'day2', completed: false, session_type: 'strength' },
    ];
    const cloud = [
      { id: 'acc1', session_date: '2026-11-04', day_type: 'day1', completed: true, session_type: 'strength', created_at: '2026-11-05T05:33:28Z' },
      { id: 'c213', session_date: '2026-11-05', day_type: 'day2', completed: true, total_volume_lbs: 26160, session_type: 'strength', created_at: '2026-11-06T03:44:26Z' },
    ];
    ctx.LS.set('tandem_history', local);
    const before = ctx.nextProgramDayKey();
    const merged = ctx.mergeCloudSessionsIntoHistory(local, cloud, {});
    ctx.LS.set('tandem_history', merged);
    check('[H3]', before === 'day2' && ctx.nextProgramDayKey() === 'day3',
      `a server-side completion reaches the queue (before=${before}, after=${ctx.nextProgramDayKey()})`);
  }

  { // [Q1]-[Q6] BUG-262: "Skip ahead" forfeits the served slot
    const ctx = ctxFor(null);
    const run = (days, hist) => { ctx.cfg.days = days; ctx.LS.set('tandem_history', hist);
      return { next: ctx.nextProgramDayKey(), week: ctx.deriveProgramWeek(), done: ctx.completedSessionCount() }; };
    const done = (date, day, id) => ({ id, session_date: date, day, exercises: { a: [{ set: 1, w: 100, r: 5 }] } });
    const skip = (date, day, id) => ({ id, session_date: date, day, completed: false, skipped: true, exercises: {} });
    let r = run(4, [done('2026-11-01', 'day1', 1000), skip('2026-11-02', 'day2', 2000)]);
    check('[Q1]', r.next === 'day3' && r.done === 1, `skipping the served day moves the queue on (next=${r.next}, completed=${r.done})`);
    r = run(5, [done('2026-11-04', 'day1', 1000), done('2026-11-05', 'day2', 2000), skip('2026-11-15', 'day2', 3000)]);
    const stale = r.next;
    r = run(5, [done('2026-11-04', 'day1', 1000), done('2026-11-05', 'day2', 2000), skip('2026-11-15', 'day2', 3000), done('2026-11-15', 'day3', 4000)]);
    check('[Q2]', stale === 'day3' && r.next === 'day4', `a skip of an already-done day forfeits nothing (Kerwin's 2026-11-15 case: before day3=${stale}, after=${r.next})`);
    r = run(4, [done('2026-11-01', 'day1', 1000), skip('2026-11-02', 'day2', 2000),
      { id: 'cloud-skip', session_date: '2026-11-02', day_type: 'day2', day: 'day2', completed: false, session_type: 'skipped', created_at: '2026-11-02T18:00:00Z' }]);
    check('[Q3]', r.next === 'day3', `a duplicate skip row moves the queue once (next=${r.next})`);
    check('[Q4]', r.done === 1, `a skip never counts as a completed session (completed=${r.done})`);
    r = run(4, [done('2026-11-01', 'day1', 1), done('2026-11-02', 'day2', 2), done('2026-11-03', 'day3', 3), skip('2026-11-04', 'day4', 4)]);
    check('[Q5]', r.next === 'day1' && r.week === 2, `skipping the week's last workout starts the next week (next=${r.next}, week=${r.week})`);
    r = run(4, [done('2026-11-01', 'day1', 1)]);
    check('[Q6]', r.next === 'day2', `a missed day with no skip is still delayed, not dropped (next=${r.next})`);
  }

  { // [M1] [M2]
    const m26 = readFileSync(join(root, 'migrations', '0026_bug261_skipped_frees_program_slot.sql'), 'utf8').replace(/--.*$/gm, '');
    check('[M1]', /create unique index workout_sessions_user_date_program_key[\s\S]*session_type not in \('oneoff', 'skipped'\)/i.test(m26),
      '0026 frees the program slot for skipped rows and still exempts one-offs');
    const m27 = readFileSync(join(root, 'migrations', '0027_bug261_auto_finish_stale_sessions.sql'), 'utf8').replace(/--.*$/gm, '');
    const ok = /interval '6 hours'/.test(m27)
      && /having max\(s\.created_at\) < now\(\) - p_idle/.test(m27)          // clock runs from the LAST SET
      && /set session_type = 'abandoned'[\s\S]*not exists \(select 1 from public\.sets/.test(m27) // zero sets: closed
      && !/'abandoned'[\s\S]{0,80}completed\s*=\s*true/.test(m27)             // ...never credited
      && (m27.match(/not in \('oneoff', 'skipped', 'abandoned'\)/g) || []).length === 2
      && /revoke all on function public\.auto_finish_stale_sessions[\s\S]*from anon, authenticated/.test(m27)
      && /cron\.schedule\(\s*'tandem-auto-finish-stale-sessions'/.test(m27);
    check('[M2]', ok, '0027 credits from the last set, closes zero-set rows uncredited, skips one-offs/skips, revokes client EXECUTE, is scheduled');
  }

  if (fails.length) { console.log(`\nBUG-261 skip-then-start smoke FAILED: ${fails.join(' ')}`); process.exit(1); }
  console.log('\nBUG-261 skip-then-start smoke: all assertions hold');
})().catch(e => { console.error(e); process.exit(1); });

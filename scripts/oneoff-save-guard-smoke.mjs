#!/usr/bin/env node
/**
 * oneoff-save-guard-smoke.mjs — BUG-170 regression guard.
 *
 * logSet() returns early for `oneoff-` ids (finishOneOff() owns their session_type='oneoff'
 * write). saveExerciseToCloud() — reached by the per-exercise Save button — had no such
 * guard, so saving a one-off upserted into the PROGRAM day's workout_sessions row
 * (currentCloudSessionId / currentDay / currentWeek) and filed the sets there.
 *
 * BEHAVIORAL, not source-grep: the real function body is extracted from tandem.html and
 * EXECUTED against a recording fake Supabase client. Asserts (1) a oneoff- id performs no
 * workout_sessions/sets write and leaves currentCloudSessionId untouched, (2) a regular
 * program id still reaches the session upsert (the guard must not swallow normal saves).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(path.join(root, 'tandem.html'), 'utf8');
const start = html.indexOf('async function saveExerciseToCloud(');
const end = html.indexOf('async function manualSaveExercise(');
if (start < 0 || end < 0) { console.log('FAIL  could not locate saveExerciseToCloud'); process.exit(1); }
const fnSrc = html.slice(start, end);

let failures = 0;
const check = (label, cond) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`); if (!cond) failures++; };

async function run(id) {
  const writes = [];
  const chain = (table) => {
    const q = {
      upsert: (p) => { writes.push({ table, op: 'upsert', p }); return q; },
      insert: (p) => { writes.push({ table, op: 'insert', p }); return Promise.resolve({ error: null }); },
      select: () => q, eq: () => q,
      in: () => Promise.resolve({ data: [], error: null }),
      single: () => Promise.resolve({ data: { id: 'new-session' }, error: null }),
    };
    return q;
  };
  const ctx = {
    currentUser: { id: 'u1' }, sb: { from: chain },
    sessionSetsMap: { [id]: [{ w: '100', r: '5', set: 1, name: 'Bench Press' }] },
    sessionStartTime: 1, currentWeek: 1, currentDay: 'push', cfg: { goal: 'strength' },
    currentCloudSessionId: 'PROGRAM-SESSION', localDateStr: () => '2026-10-05',
    currentSessionNotes: () => null, calcRM: (w, r) => w * (1 + r / 30),
    showToast: () => {}, console, Math, Set, parseFloat, parseInt,
  };
  vm.createContext(ctx);
  vm.runInContext(fnSrc + '\nthis.__fn = saveExerciseToCloud;', ctx);
  await ctx.__fn(id);
  return { writes, sessionId: ctx.currentCloudSessionId };
}

const one = await run('oneoff-strength-0');
check('one-off id: no workout_sessions/sets write at all', one.writes.length === 0);
check('one-off id: program currentCloudSessionId left untouched', one.sessionId === 'PROGRAM-SESSION');
const reg = await run('bm-bench');
check('program id: still upserts the program session', reg.writes.some(w => w.table === 'workout_sessions' && w.op === 'upsert'));
check('program id: still inserts its sets', reg.writes.some(w => w.table === 'sets' && w.op === 'insert'));

// BUG-170 follow-up: the per-card Save control must not be rendered for oneoff- cards (a
// toast-only button is the reorderWeek() shape). SOURCE-level: the render template line that
// emits manualSaveExercise(...) must be gated on the oneoff- prefix.
const saveLine = html.split('\n').find(l => l.includes("manualSaveExercise('${ex.id}')")) || '';
check("one-off cards: Save control is gated off for oneoff- ids in the card template",
  /oneoff-/.test(saveLine) && /startsWith\('oneoff-'\)/.test(saveLine));

console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
process.exit(failures ? 1 : 0);

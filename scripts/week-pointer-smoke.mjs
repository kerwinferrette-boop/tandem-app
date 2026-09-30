#!/usr/bin/env node
/**
 * week-pointer-smoke.mjs — BUG-196 regression guard: the "Today" button moves.
 *
 * WHY THIS EXISTS
 * ---------------
 * resetWeek() was a bare renderTracker() with the comment "just re-render
 * current". The tracker's "Today" button therefore repainted whichever week you
 * had browsed to and never moved the pointer. It LOOKED functional — the view
 * visibly repaints — which is exactly why a write-side handler audit scored it
 * healthy (docs/control-reachability-audit-2026-09-30.md §D8).
 *
 * The subtle part, and the reason this is a gate: the obvious fix,
 * currentWeekFromStorage(), does NOT work. changeWeek() persists the BROWSED
 * week into tandem_week, so that helper's Math.max(stored, derived) hands back
 * the very week the user is trying to leave. Anyone "simplifying" resetWeek() to
 * use it will silently reintroduce the bug, and the view will still repaint, so
 * nothing will look wrong.
 *
 * HARD (fails the gate):
 *   [A] from a browsed-forward week, resetWeek() moves to the real program week
 *   [B] it PERSISTS that week (as changeWeek does), so a reload does not undo it
 *   [C] it does not use currentWeekFromStorage() (see above)
 *   [D] with an unknown program shape it leaves the pointer alone, not 1
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(path.join(root, 'tandem.html'), 'utf8');

let failures = 0;
const check = (label, cond, detail) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond || !detail ? '' : `\n      ${detail}`}`);
  if (!cond) failures++;
};

const grab = (name) => {
  const i = html.indexOf(`function ${name}(`);
  if (i === -1) { console.error(`could not find ${name}`); process.exit(1); }
  return html.slice(i, html.indexOf('\n}', i) + 2);
};
const resetWeekSrc = grab('resetWeek');
// Strip whole-line comments before pattern-matching the body. resetWeek's own
// comment NAMES currentWeekFromStorage in order to warn against it, and check
// [C] flagged that sentence as a call site on the first run — the third time in
// this session that scanning prose for code produced a false positive.
const resetWeekCode = resetWeekSrc.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');

function run({ stored, days, weeks, completed, currentWeek }) {
  const store = { tandem_week: stored };
  const ctx = {
    LS: { get: (k) => store[k], set: (k, v) => { store[k] = v; } },
    cfg: days == null ? {} : { days, weeks },
    completedSessionCount: () => completed,
    renderTracker: () => {},
    currentWeek,
  };
  vm.createContext(ctx);
  new vm.Script(grab('deriveProgramWeek') + '\n' + resetWeekSrc + '\nthis.__r = resetWeek;').runInContext(ctx);
  ctx.__r();
  return { currentWeek: ctx.currentWeek, persisted: store.tandem_week };
}

// [A]+[B] browsed forward to week 5; 5 completed sessions at 4/wk => real week 2
const a = run({ stored: 5, days: 4, weeks: 12, completed: 5, currentWeek: 5 });
check('[A] "Today" moves from the browsed week to the real program week',
  a.currentWeek === 2, `currentWeek is ${a.currentWeek}, expected 2`);
check('[B] the new week is persisted (survives a reload, as changeWeek does)',
  a.persisted === 2, `tandem_week is ${a.persisted}, expected 2`);

// [C] the trap: currentWeekFromStorage() would return max(5, 2) = 5
check('[C] resetWeek does not call currentWeekFromStorage (its max() defeats the fix)',
  !/currentWeekFromStorage\s*\(/.test(resetWeekCode),
  'changeWeek persists the browsed week, so max(stored, derived) returns the week being left');

// [D] unknown program shape: leave the pointer alone rather than snapping to 1
const d = run({ stored: 7, days: null, weeks: null, completed: 0, currentWeek: 7 });
check('[D] unknown program shape leaves the stored week alone (no snap to 1)',
  d.currentWeek === 7, `currentWeek is ${d.currentWeek}, expected 7`);

// [E] the pre-fix body must not come back
check('[E] resetWeek is not a bare re-render again',
  /LS\.set\(\s*'tandem_week'/.test(resetWeekCode),
  'resetWeek no longer persists a week — it has regressed to the pre-BUG-196 no-op');

console.log(failures === 0 ? '\nweek-pointer-smoke: PASS' : `\nweek-pointer-smoke: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);

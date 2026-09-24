#!/usr/bin/env node
/**
 * exercise-name-write-smoke.mjs — BUG-49 regression guard.
 *
 * WHAT IT LOCKS DOWN
 * Two write sites shipped the bank SLOT id into sets.exercise_name instead of the
 * movement's name:
 *   saveExerciseToCloud()            `exercise_name: id`
 *   finishSession()'s C11 rescue     `exercise_name: exId`
 * Everything downstream is name-keyed — getRecommendation's lastsets lookup (C7/BUG-45),
 * the PR key, computeCalibration1RMs' best1RMs map — and slot ids are RECYCLED across
 * rotations, so such a row is not merely wrong-keyed, it is unstably wrong-keyed. The
 * server-side trigger sets_apply_1rm_and_pr then propagates it into personal_records.
 * Measured on prod 2026-09-24: 4 sets rows and 1 personal_records row keyed 'tr-row'.
 *
 * WHY THIS FILE EXISTS AT ALL, stated plainly because it is the point:
 * BUG-49's Notion row credited scripts/lastsets-churn-smoke.mjs as its guard. That script
 * was run at HEAD with BOTH defects live and returned ALL PASS, exit 0 — it covers
 * localStorage keying and the PR merge and cannot see an insert payload. A guard that
 * cannot fail on the bug it claims to cover is worse than no guard, because it manufactures
 * confidence. This one was proven to fail on the pre-fix source before being trusted.
 *
 * SCOPE, honestly: this is a SOURCE-level check. It asserts the value expression at every
 * `exercise_name:` object key resolves from something name-bearing. It does not execute the
 * write path (that needs a live Supabase and a browser). It is therefore a guard against
 * the defect RETURNING, not a proof that the runtime write is correct.
 *
 * Run: node scripts/exercise-name-write-smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(path.join(root, 'tandem.html'), 'utf8');

let failures = 0;
const check = (label, cond) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`); if (!cond) failures++; };

// Strip // line comments so prose ABOUT the old bug (which quotes the bad code on purpose)
// is never mistaken for the bug itself. Block comments are left alone — none wrap a payload.
const code = html.split('\n').map(l => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n');

// Every object-literal `exercise_name:` key and the expression assigned to it.
const sites = [...code.matchAll(/exercise_name:\s*([^,\n}]+)/g)]
  .map(m => ({ expr: m[1].trim(), line: code.slice(0, m.index).split('\n').length }));

check(`found exercise_name write sites (got ${sites.length})`, sites.length >= 5);

// A value is acceptable only if it resolves from a NAME. `s.name || id` is acceptable:
// the fallback fires solely when the card heading was unreadable or the snapshot predates
// the name stamp, and dropping a logged set would be strictly worse than an id-keyed one.
const NAME_BEARING = /^(name|rawName|prExName|s\.name(\s*\|\|\s*\w+)?|exName)$/;

for (const { expr, line } of sites) {
  check(`tandem.html:${line} — exercise_name is name-bearing, not a slot id  (${expr})`,
        NAME_BEARING.test(expr));
}

// The two specific regressions, named so a failure message points at the right history.
check('saveExerciseToCloud no longer writes a bare `id`',
      !/exercise_name:\s*id\s*,/.test(code));
check("finishSession's C11 rescue no longer writes a bare `exId`",
      !/exercise_name:\s*exId\s*,/.test(code));

// ── Follow-on: the two writers now share a key, so Save must not blind-insert ──
// logSet() inserts each set live; saveExerciseToCloud() re-sends the whole exercise.
// Once exercise_name agrees between them (the fix above), a blind re-insert produces a
// real duplicate group — the shape migrations/0017's unique index forbids and the shape
// that required a 19-row manual repair on 2026-09-24. Assert the dedupe read is present.
const saveFn = code.slice(code.indexOf('async function saveExerciseToCloud('),
                          code.indexOf('async function manualSaveExercise('));
check('saveExerciseToCloud reads existing cloud sets before inserting',
      /from\('sets'\)[\s\S]{0,200}?\.select\(\s*['"]exercise_name,\s*set_number['"]\s*\)/.test(saveFn));
check('saveExerciseToCloud filters setRows against what is already in the cloud',
      /\.filter\(\s*r\s*=>\s*!present\.has\(/.test(saveFn));
check('saveExerciseToCloud no longer inserts setRows unconditionally',
      !/\.insert\(setRows\)/.test(saveFn));
check('a failed dedupe read aborts rather than falling through to a blind insert',
      /if\s*\(readErr\)\s*throw readErr;/.test(saveFn));

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);

#!/usr/bin/env node
/**
 * pr-write-notnull-smoke.mjs — BUG-263 guard. Static, no browser.
 *
 * The defect (VERIFIED in prod edge logs, 2026-11-06 and 2026-11-15): every set logged fired
 * POST /rest/v1/personal_records -> 400, "null value in column achieved_weight_lbs violates
 * not-null constraint". syncPRs() upserted {user_id, exercise_name, best_estimated_1rm_lbs,
 * updated_at}; PostgREST's upsert is INSERT ... ON CONFLICT, and Postgres checks NOT NULL on
 * the proposed INSERT row before the conflict arbiter, so a partial row fails even when the
 * row exists. computeCalibration1RMs() had the same shape (prod 2026-09-24: 6 of 51 PR rows
 * calibrated). The NOT NULL columns, read from information_schema on 2026-11-15:
 * user_id is nullable; exercise_name, best_estimated_1rm_lbs, achieved_weight_lbs,
 * achieved_reps, achieved_date are NOT NULL. This gate CANNOT see Postgres: if that schema
 * changes, change REQUIRED below in the same commit.
 *
 *   [N1] syncPRs() is gone and nothing calls it (the sets trigger owns personal_records).
 *   [N2] exactly the two known client write sites exist: logSet()'s PR upsert and
 *        computeCalibration1RMs()'s calibration upsert. A third must be reviewed and
 *        enumerated here before it ships.
 *   [N3] logSet()'s upsert literal carries every NOT NULL column.
 *   [N4] computeCalibration1RMs()'s rows carry every NOT NULL column (behaviour is run in
 *        scripts/calibration-upsert-smoke.mjs; this pins the source shape).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(join(root, 'tandem.html'), 'utf8');
// Strip // line comments so prose that names a function cannot satisfy or fail a check.
const code = html.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
const REQUIRED = ['exercise_name', 'best_estimated_1rm_lbs', 'achieved_weight_lbs', 'achieved_reps', 'achieved_date'];
const fails = [];
const check = (id, ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${id} ${msg}`); if (!ok) fails.push(id); };

check('[N1]', !/function syncPRs\(/.test(code) && !/\bsyncPRs\(/.test(code),
  'syncPRs() is deleted and nothing calls it');

const sites = [...code.matchAll(/from\('personal_records'\)\s*\.(upsert|insert)\(/g)].map(m => m.index);
check('[N2]', sites.length === 2, `exactly 2 client personal_records write sites (found ${sites.length})`);

const logSetAt = code.indexOf('function logSet(');
const logSetEnd = code.indexOf('\n}\n', logSetAt);
const logSetPr = sites.find(i => i > logSetAt && i < logSetEnd);
const literal = logSetPr == null ? '' : code.slice(logSetPr, code.indexOf('}', logSetPr) + 1);
check('[N3]', !!literal && REQUIRED.every(k => new RegExp(`\\b${k}:`).test(literal)),
  `logSet()'s PR upsert carries ${REQUIRED.join(', ')}`);

const calAt = code.indexOf('async function computeCalibration1RMs(');
const calSrc = calAt === -1 ? '' : code.slice(calAt, code.indexOf('\n}\n', calAt));
const rowsAt = calSrc.indexOf('return {', calSrc.indexOf('const rows = exNames'));
const rowLit = rowsAt === -1 ? '' : calSrc.slice(rowsAt, calSrc.indexOf('};', rowsAt));
check('[N4]', !!rowLit && REQUIRED.every(k => new RegExp(`\\b${k}:`).test(rowLit)),
  `computeCalibration1RMs()'s upsert rows carry ${REQUIRED.join(', ')}`);

if (fails.length) { console.log(`\nBUG-263 PR-write NOT NULL smoke FAILED: ${fails.join(' ')}`); process.exit(1); }
console.log('\nBUG-263 PR-write NOT NULL smoke: all assertions hold');

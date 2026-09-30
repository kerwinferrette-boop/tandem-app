#!/usr/bin/env node
/**
 * cfg-field-parity-smoke.mjs — the seam gate. Every field written to `cfg`
 * must survive a cloud rebuild.
 *
 * WHY THIS EXISTS — a regression this branch created and its own gates could not see
 * ------------------------------------------------------------------------------------
 * cfgFromUserRow() returns a COMPLETE REPLACEMENT cfg and its callers assign it
 * wholesale (`cfg = cfgFromUserRow(...)` then `LS.set('tandem_cfg', cfg)`). So any
 * cfg field that no `users` column backs is ERASED on every cloud rebuild unless it
 * is carried forward explicitly.
 *
 * BUG-192 made `cfg.maxDb` the durable home for the max-dumbbell cap. BUG-193 made
 * both cloud paths share one builder — which did not build maxDb. syncFromCloud()
 * runs on app boot for any signed-in user (tandem.html:10461) and on scope change
 * (:2739), so the cap was erased on essentially EVERY LOAD; sessionStorage is empty
 * in a fresh tab, so resolveMaxDb() fell to 0 and dumbbell prescriptions went
 * UNCAPPED — precisely the bug BUG-192 was filed to fix.
 *
 * Both commits passed their own smoke gates, and `verify` was 35/35 green, because
 * every gate was scoped to a single bug and NONE looked at the seam between two.
 * It was caught by llm-council on the pre-ship gate, not by any check. This gate is
 * the mechanism fix: it watches the CONTRACT (every cfg writer is carried), not any
 * one field.
 *
 * `startEpoch` and `revertedAt` are the same shape and PRE-DATE this branch — both
 * are read (:8985, :9142) and were silently lost on every cloud rebuild before the
 * class had a name.
 *
 * HARD (fails the gate):
 *   [A] every `cfg.X =` writer in tandem.html is a key cfgFromUserRow produces,
 *       or is listed in TRANSIENT below with a reason
 *   [B] the builder takes an incumbent-cfg argument at all
 *   [C] both cloud callers actually PASS it (a builder that can carry but is called
 *       without the incumbent carries nothing)
 *   [D] executed for real: local-only fields survive a rebuild, and row data still
 *       wins over a stale incumbent
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// cfg fields deliberately NOT carried across a cloud rebuild. Adding a name here is
// a claim that losing it on every signed-in load is CORRECT — say why.
const TRANSIENT = {
  // (empty today: every cfg writer is either row-derived or carried)
};

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const raw = readFileSync(path.join(root, 'tandem.html'), 'utf8');
// SC-35: strip comments first — this file's comments quote `cfg.maxDb =` etc.
const code = raw.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');

let failures = 0;
const check = (label, cond, detail) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond || !detail ? '' : `\n      ${detail}`}`);
  if (!cond) failures++;
};

const bStart = code.indexOf('function cfgFromUserRow(');
if (bStart === -1) { console.error('cfgFromUserRow not found'); process.exit(1); }
const builderSrc = code.slice(bStart, code.indexOf('\n}', bStart) + 2);

// Keys the builder produces
const produced = new Set([...builderSrc.matchAll(/^\s{4}([a-zA-Z_][a-zA-Z0-9_]*)\s*:/gm)].map(m => m[1]));
// Every field anything assigns to cfg
const written = new Set([...code.matchAll(/\bcfg\.([a-zA-Z_][a-zA-Z0-9_]*)\s*=(?!=)/g)].map(m => m[1]));

const orphans = [...written].filter(f => !produced.has(f) && !(f in TRANSIENT)).sort();
check(`[A] every cfg writer survives a cloud rebuild (${written.size} writers, ${produced.size} produced)`,
  orphans.length === 0,
  orphans.map(f => `cfg.${f} is assigned somewhere but cfgFromUserRow does not produce it — it is\n      ERASED on every syncFromCloud(). Either derive it from the row, carry it from\n      the incumbent, or add it to TRANSIENT with a reason.`).join('\n      '));

check('[B] the builder accepts an incumbent cfg', /function cfgFromUserRow\(\s*\w+\s*,\s*\w+\s*\)/.test(builderSrc),
  'no second parameter — nothing can be carried across the replace');

const callers = [...code.matchAll(/cfgFromUserRow\(([^)]*)\)/g)].map(m => m[1].trim());
const bare = callers.filter(a => !a.includes(','));
check(`[C] every caller passes the incumbent (${callers.length} call sites)`, bare.length === 0,
  bare.map(a => `cfgFromUserRow(${a}) — called with one argument, so local-only fields are dropped`).join('\n      '));

// [D] run it
const ctx = { canonicalGoal: (g) => g };
vm.createContext(ctx);
new vm.Script(builderSrc + '\nthis.__b = cfgFromUserRow;').runInContext(ctx);
const build = ctx.__b;
const row = { program_goal: 'transform', program_days_per_week: 4, program_weeks: 8, injuries: 'knee' };
const prev = { maxDb: 25, startEpoch: 1727000000000, revertedAt: '2026-09-01', goal: 'stale' };
const out = build(row, prev);

check('[D1] the dumbbell cap survives a cloud rebuild (the BUG-192/193 regression)',
  out.maxDb === 25, `maxDb is ${JSON.stringify(out.maxDb)} — a fresh tab would prescribe UNCAPPED dumbbells`);
check('[D2] startEpoch survives (pre-program history filter, :8985)', out.startEpoch === 1727000000000);
check('[D3] revertedAt survives (revert notice, :9142)', out.revertedAt === '2026-09-01');
check('[D4] row data still WINS over a stale incumbent', out.goal === 'transform',
  `goal is ${JSON.stringify(out.goal)} — carrying must not shadow the authoritative row`);
check('[D5] no incumbent is safe (first ever login)', build(row, undefined).maxDb === null);
check('[D6] injuries still rebuilt from the row (BUG-193 SAFETY invariant)', out.injuries === 'knee');

console.log(failures === 0 ? '\ncfg-field-parity-smoke: PASS' : `\ncfg-field-parity-smoke: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);

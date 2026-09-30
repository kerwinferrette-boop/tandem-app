#!/usr/bin/env node
/**
 * settings-persistence-smoke.mjs — BUG-192 + BUG-194 regression guard.
 *
 * WHY THESE SHARE ONE GATE
 * ------------------------
 * Both are the same defect: a value the UI shows as set is written to one store
 * and read from another, so the surface claims a setting the engine never sees.
 * Grouping them keeps the rule in one home instead of two near-identical smokes.
 *
 * BUG-192 — Today's Setup persisted the equipment TIER three durable ways but
 * kept the max-dumbbell CAP in sessionStorage alone. On a fresh tab the tier
 * still read "Hotel · Small DB" while resolveMaxDb() returned 0, so dumbbell
 * prescriptions went UNCAPPED. Safety-adjacent: it prescribes load the user's
 * gym does not have.
 *
 * BUG-194 — saveProfileStats had three breaks in ~16 lines: current_weight_lbs
 * was missing from its upsert payload (so a Settings edit never reached the
 * cloud); goal weight went to profile.goalWeight but never to the keys
 * getActiveProgram() reads at :3596 (cfg.targetWeight ?? cfg.goalWeight), so the
 * D29 weight-delta cardio gate could not see the edit; and the modal hydrated
 * height from cfg.height_inches, a snake_case key NOTHING in the file ever sets.
 *
 * HARD (fails the gate):
 *   [A] saveProfileStats' upsert carries current_weight_lbs
 *   [B] it writes the cfg key the generator actually reads
 *   [C] the phantom cfg.height_inches read is gone and stays gone
 *   [D] applySetupSelection persists the cap durably (cfg.maxDb)
 *   [E]+[F] resolveMaxDb falls back to cfg.maxDb — asserted by RUNNING it
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(path.join(root, 'tandem.html'), 'utf8');
// Prose that names a key is not a use of it — this gate's own comments name
// cfg.height_inches in order to warn against it.
const code = html.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');

let failures = 0;
const check = (label, cond, detail) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond || !detail ? '' : `\n      ${detail}`}`);
  if (!cond) failures++;
};
const grab = (name) => {
  const i = code.indexOf(`function ${name}(`);
  if (i === -1) { console.error(`could not find ${name}`); process.exit(1); }
  return code.slice(i, code.indexOf('\n}', i) + 2);
};

// ── BUG-194 ──
const stats = grab('saveProfileStats');
check('[A] BUG-194 saveProfileStats upserts current_weight_lbs',
  /current_weight_lbs\s*:/.test(stats),
  'an edited current weight never reaches users.current_weight_lbs — lost on a new device');
check('[B] BUG-194 goal weight lands on the cfg key the generator reads',
  /cfg\.targetWeight\s*=/.test(stats),
  'getActiveProgram() reads (cfg.targetWeight ?? cfg.goalWeight) at :3596; writing only profile.goalWeight hides the edit from the D29 cardio gate');
check('[C] BUG-194 the phantom cfg.height_inches read is gone',
  !/cfg\.height_inches/.test(code),
  'cfg.height_inches is never SET anywhere (cfg uses heightIn/height), so reading it renders a blank input');

// ── BUG-192 ──
const setup = grab('applySetupSelection');
check('[D] BUG-192 applySetupSelection persists the DB cap durably',
  /cfg\.maxDb\s*=/.test(setup),
  'the cap lived in sessionStorage only while the tier persisted 3 ways — a reload silently uncapped');

const resolveSrc = grab('resolveMaxDb');
check('[E] BUG-192 resolveMaxDb consults the durable value',
  /cfg\??\.maxDb/.test(resolveSrc.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n')),
  'resolveMaxDb reads sessionStorage only, so the durable cap is never used');

// [F] run it for real — the session store is EMPTY, as on a fresh tab
function resolved({ session, cfgMaxDb }) {
  const ctx = {
    sessionStorage: { getItem: (k) => (k === 'eq_max_db' && session != null ? String(session) : null) },
    cfg: { maxDb: cfgMaxDb },
  };
  vm.createContext(ctx);
  new vm.Script(resolveSrc + '\nthis.__f = resolveMaxDb;').runInContext(ctx);
  return ctx.__f();
}
check('[F] BUG-192 a fresh tab with a durable 25 lb cap resolves to 25, not 0',
  resolved({ session: null, cfgMaxDb: 25 }) === 25,
  `got ${resolved({ session: null, cfgMaxDb: 25 })} — this is the uncapped-prescription regression`);
check('[F2] an explicit session override still wins over the durable value',
  resolved({ session: 40, cfgMaxDb: 25 }) === 40);
check('[F3] no cap anywhere still means 0 (uncapped is the honest default)',
  resolved({ session: null, cfgMaxDb: null }) === 0);

console.log(failures === 0 ? '\nsettings-persistence-smoke: PASS' : `\nsettings-persistence-smoke: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);

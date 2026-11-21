#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// inventory-reconciliation-smoke.mjs — BUG-108 (owner), covering BUG-161 and BUG-130.
//
// THE DEFECT. programs.js has MORE THAN ONE inventory of exercises and, before this gate,
// nothing reconciled them. EXERCISE_BANK is what the generator selects from and what
// bankIndexByName() (tandem.html) / bankEntryByName() (programs.js) resolve by EXACT name (D20
// recovery, D27 continuity, D31 variety, per-exercise set counts, muscle tags). The app ALSO
// prescribes from these hard-coded inventories, all covered here:
//   programs          getProgram()-local static library (male)
//   femalePrograms    getProgram()-local static library (female) — chosen by
//                     `const activePrograms = isFemale ? femalePrograms : programs;`
//   SUBSTITUTIONS     getProgram()-local pool, consumed by the dedupeConsecutiveDays backfill
//                     (NOT the injury path; that is getExerciseSubstitutes(), bank-drawn)
//   PRESS_ALTERNATES  getProgram()-local swap list for dedupePressingBuild5
//   build5_fallback   build5's inline hard-coded Shoulders + Arms day (`base4.shouldersArmsDay || {...}`)
//   TEMPLATES         buildDynamicProgram()-local slot templates (groups only, no names)
// The BUG-108 prompt named the first three + TEMPLATES; the independent verifier found the other two
// (2026-11-21) and they were added rather than left as a scope note. NOT covered: any exercise list
// in tandem.html (follow-up, stated so nobody reads this gate as covering it).
//
// HOW IT READS THEM (runtime values, not a text grep). They are function-LOCAL consts, unreachable
// from a vm context, so this script injects one capture statement into an in-memory copy of
// programs.js, asserts every anchor matched EXACTLY once (exit 2 with "update the anchor" if not),
// runs getProgram() and buildDynamicProgram() once each, and walks the captured objects. The build5
// fallback is an inline literal and is evaluated from its own source text. Nothing on disk changes.
//
// THE SETS (BUG-108 prompt, step 1):
//   (A) PRESCRIBED-BUT-UNBANKED — every exercise name in ANY of the four inventories that is
//       not an EXERCISE_BANK name, with a per-inventory hit count.
//   (D) LIBRARY DIVERGENCE — every exercise name in `programs` but not `femalePrograms`, or the
//       reverse. Reported both directions.
//   (B) BANKED-BUT-UNSELECTED and (C) TAG-REACHABLE-BUT-NEVER-RETURNED are deliberately NOT
//       re-derived here: scripts/selection-reachability-smoke.mjs already sweeps getProgram()
//       over the 1050-combo persona matrix x weeks 1-24 and ratchets the never-selected set,
//       and scripts/reachability-smoke.mjs asserts every bank entry is tag-reachable, so its
//       never-selected set IS set (C). A second sweep here would be a second home for the same
//       rule (CLAUDE.md "one rule, one home"). R6 below asserts that owner stays registered.
//   TEMPLATES carries slot `groups`, not exercise names; R5 asserts that stays true, so a
//       future name added to a template cannot slip past set (A) unseen.
//
// THE RATCHET (mirrors selection-reachability-smoke's S1/S2; fixture is the one home):
//   R1  (A) may not GROW: an unbanked name absent from the baseline fails.
//   R2  (A) stale: a baseline (A) name that is now banked or no longer prescribed fails —
//       ratchet it down with --write-baseline so the improvement is locked in.
//   R3  (D) may not grow / R3s (D) stale, same rules, per direction.
//   R4  every baseline entry carries a tracker row id and a one-line reason.
//   R5  TEMPLATES slots carry no `name` field (see above).
//   R6  scripts/verify.mjs still registers selection-reachability-smoke.mjs (owner of B/C).
//   R7  anti-vacuity: each inventory yielded >= its committed floor of exercise objects, TEMPLATES
//       >= its floor of slots, the bank is non-empty; a MISSING floor fails (never defaults).
//   R8  fail-closed shape: every object with a string `name` in an inventory must have an `id` or a
//       `badge`; anything else fails instead of going uncounted (the first draft counted only
//       objects with `sets`/`r` and silently missed all 24 cardio entries — verifier, 2026-11-21).
//   R9  source cross-check: per inventory, named objects walked == `name:` keys in its source text.
//
// Regenerate ONLY with `node scripts/inventory-reconciliation-smoke.mjs --write-baseline`, and
// only when a set SHRANK. --write-baseline refuses to add an entry unless --allow-growth is
// also passed, and never invents a reason: new entries get reason 'UNREVIEWED' and fail R4
// until a human writes one. Never hand-edit to make it green.
//
// MUTATION RECORD (each assertion individually, every mutation shown to have LANDED) is in
// the commit body that introduced this file.
// ═══════════════════════════════════════════════════════
import vm from 'vm';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const here = fileURLToPath(import.meta.url);
const root = join(dirname(here), '..');
const PROGRAMS = process.env.INVENTORY_PROGRAMS_JS || join(root, 'programs.js');
const BASELINE = process.env.INVENTORY_BASELINE || join(root, 'scripts', 'fixtures', 'inventory-reconciliation-baseline.json');
const VERIFY = process.env.INVENTORY_VERIFY || join(root, 'scripts', 'verify.mjs');   // env overrides exist for mutation tests only
const WRITE = process.argv.includes('--write-baseline');
const ALLOW_GROWTH = process.argv.includes('--allow-growth');

const fails = [];
const fail = m => fails.push(m);

// ── 1. instrument an in-memory copy ────────────────────────────────────────────────────
const SRC = readFileSync(PROGRAMS, 'utf8');
let code = SRC;
const ANCHOR_HELP = 'An anchor is a literal line of programs.js this gate hooks into. If you renamed or ' +
  'reformatted it, UPDATE THE ANCHOR in scripts/inventory-reconciliation-smoke.mjs to match; do not delete the check.';
function anchorAt(src, anchor) {
  const n = src.split(anchor).length - 1;
  if (n !== 1) { console.error(`FATAL: anchor matched ${n} times (need exactly 1): ${anchor}\n  ${ANCHOR_HELP}`); process.exit(2); }
  return src.indexOf(anchor);
}
// end index of the bracketed literal that starts at `open` (string/comment aware)
function literalEnd(src, open) {
  let depth = 0, i = open;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 1; continue; }
    if (c === "'" || c === '"' || c === '`') {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++;
      continue;
    }
    if (c === '[' || c === '{' || c === '(') depth++;
    else if (c === ']' || c === '}' || c === ')') { depth--; if (depth === 0) return i; }
  }
  return -1;
}
// source text of the literal opened by the last char of `anchor` (used by R9's cross-check)
function literalText(src, anchor) {
  const open = anchorAt(src, anchor) + anchor.length - 1;
  const end = literalEnd(src, open);
  if (end < 0) { console.error(`FATAL: could not find the end of the literal at: ${anchor}\n  ${ANCHOR_HELP}`); process.exit(2); }
  return src.slice(open, end + 1);
}
// Declaration ORDER is load-bearing: programs, SUBSTITUTIONS, PRESS_ALTERNATES and femalePrograms are
// all getProgram()-local consts declared BEFORE the activePrograms line, so they are in scope there.
// Moving one below that line makes the capture throw and this gate fail (it does not pass silently).
anchorAt(code, 'const activePrograms = isFemale ? femalePrograms : programs;');
code = code.replace('const activePrograms = isFemale ? femalePrograms : programs;',
  'const activePrograms = isFemale ? femalePrograms : programs; __inv.programs = programs; __inv.femalePrograms = femalePrograms; ' +
  '__inv.SUBSTITUTIONS = SUBSTITUTIONS; __inv.PRESS_ALTERNATES = PRESS_ALTERNATES;');
{
  const anchor = 'const TEMPLATES = [';
  const start = anchorAt(code, anchor) + anchor.length - 1;
  const end = literalEnd(code, start);
  if (end < 0 || code[end + 1] !== ';') { console.error(`FATAL: could not find the end of the TEMPLATES literal\n  ${ANCHOR_HELP}`); process.exit(2); }
  code = code.slice(0, end + 2) + ' __inv.TEMPLATES = TEMPLATES;' + code.slice(end + 2);
}
const __inv = {};
const ctx = vm.runInNewContext(
  `(function() { ${code}; return { getProgram, buildDynamicProgram, EXERCISE_BANK }; })()`, { console, __inv });
// One call captures every library: all four are unconditional literals (no early return precedes
// them, verified 2026-11-21); only the activePrograms SELECTION depends on sex.
try { ctx.getProgram('build_muscle', 4, 12, 'male', 'full_gym', 'balanced', [], null, { week: 1, phase: 0 }); }
catch (e) { fail(`getProgram() threw while capturing inventories: ${e.message}`); }
try { ctx.buildDynamicProgram('build_muscle', 4, 12, 'male', 'full_gym', 'balanced', [], null, { week: 1, phase: 0 }); }
catch (e) { fail(`buildDynamicProgram() threw while capturing TEMPLATES: ${e.message}`); }
for (const k of ['programs', 'femalePrograms', 'SUBSTITUTIONS', 'PRESS_ALTERNATES', 'TEMPLATES'])
  if (!__inv[k]) { console.error(`FATAL: ${k} was not captured — the injected statement never ran`); process.exit(2); }
// build5's hard-coded Shoulders + Arms day is an inline literal (`base4.shouldersArmsDay || {...}`),
// not a named const, so it is evaluated from its source text. It is the emergency fallback when the
// bank cannot fill the day, i.e. it is reachable exactly when the bank is thin.
const SRC_TEXT = {
  programs: literalText(SRC, 'const programs = {'),
  femalePrograms: literalText(SRC, 'const femalePrograms = {'),
  SUBSTITUTIONS: literalText(SRC, 'const SUBSTITUTIONS = ['),
  PRESS_ALTERNATES: literalText(SRC, 'const PRESS_ALTERNATES = ['),
  build5_fallback: literalText(SRC, 'base4.shouldersArmsDay || {'),
};
try { __inv.build5_fallback = vm.runInNewContext('(' + SRC_TEXT.build5_fallback + ')', {}); }
catch (e) { console.error(`FATAL: build5 fallback literal did not evaluate standalone: ${e.message}`); process.exit(2); }

// ── 2. walk ────────────────────────────────────────────────────────────────────────────
// FAIL-CLOSED classification (R8). Every object carrying a string `name` inside these inventories must
// be an exercise object (it has an `id` or a `badge`); anything else is an unrecognised shape and fails,
// so a new exercise shape cannot go uncounted. (The first draft counted only objects with `sets`/`r`
// and silently missed every cardio entry — they carry `duration` — caught by the independent verifier.)
const bankNames = new Set(Object.values(ctx.EXERCISE_BANK).map(e => e.name));
function exerciseNames(root, inv) {
  const out = new Map(); let objs = 0, named = 0; const seen = new Set();
  (function walk(v) {
    if (!v || typeof v !== 'object' || seen.has(v)) return;
    seen.add(v);
    if (typeof v.name === 'string') {
      named++;
      if ('id' in v || 'badge' in v) { objs++; out.set(v.name, (out.get(v.name) || 0) + 1); }
      else fail(`R8 ${inv}: object named '${v.name}' has neither id nor badge — unrecognised shape; classify it in this script`);
    }
    for (const x of Array.isArray(v) ? v : Object.values(v)) walk(x);
  })(root);
  return { names: out, objs, named };
}
const INV = ['programs', 'femalePrograms', 'SUBSTITUTIONS', 'PRESS_ALTERNATES', 'build5_fallback'];
const scanned = Object.fromEntries(INV.map(k => [k, exerciseNames(__inv[k], k)]));
// R9 — source cross-check: the captured name-bearing object count equals the number of `name:` keys in
// that declaration's source text. A capture or walk that drops objects cannot match the text.
for (const k of INV) {
  const lit = (SRC_TEXT[k].match(/[{,]\s*name\s*:/g) || []).length;
  if (lit !== scanned[k].named) fail(`R9 ${k}: source has ${lit} name: keys but the walk saw ${scanned[k].named} named objects`);
}

const setA = {};   // name -> {inventory: hits}
for (const k of INV) for (const [n, c] of scanned[k].names)
  if (!bankNames.has(n)) (setA[n] ||= {})[k] = c;
const male = scanned.programs.names, female = scanned.femalePrograms.names;
const setD = {
  programs_only: [...male.keys()].filter(n => !female.has(n)).sort(),
  femalePrograms_only: [...female.keys()].filter(n => !male.has(n)).sort(),
};

// R5 — TEMPLATES must not prescribe names
let slots = 0;
for (const t of __inv.TEMPLATES) for (const s of t.slots || []) {
  slots++;
  if ('name' in s) fail(`R5 TEMPLATES ${t.key} slot carries a name ('${s.name}') — set (A) does not walk TEMPLATES names; extend this script before adding one`);
}

// ── 3. report ──────────────────────────────────────────────────────────────────────────
console.log(`inventory reconciliation — bank ${bankNames.size} names; exercise objects scanned: ` +
  INV.map(k => `${k} ${scanned[k].objs} (${scanned[k].names.size} names)`).join(', ') + `; TEMPLATES ${slots} slots`);
console.log(`  (A) prescribed-but-unbanked: ${Object.keys(setA).length}`);
for (const [n, by] of Object.entries(setA).sort()) console.log(`      ${n}: ` + Object.entries(by).map(([k, c]) => `${k} x${c}`).join(', '));
console.log(`  (D) library divergence: programs-only ${setD.programs_only.length}, femalePrograms-only ${setD.femalePrograms_only.length}`);
for (const d of ['programs_only', 'femalePrograms_only']) for (const n of setD[d]) console.log(`      ${d}: ${n}`);
console.log('  (B)/(C) owned by scripts/selection-reachability-smoke.mjs (not re-derived here)');

// ── 4. baseline / ratchet ──────────────────────────────────────────────────────────────
const prev = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : null;
if (WRITE) {
  const growth = [];
  const keepReason = (sec, n) => prev?.[sec]?.find?.(e => e.name === n);
  const mk = (sec, names) => names.map(n => {
    const p = keepReason(sec, n);
    if (!p) growth.push(`${sec}:${n}`);
    return { name: n, row: p?.row || 'UNREVIEWED', reason: p?.reason || 'UNREVIEWED' };
  });
  const out = {
    _comment: 'BUG-108 inventory reconciliation baseline. Regenerate only via --write-baseline (see scripts/inventory-reconciliation-smoke.mjs header). Never hand-edit to go green.',
    floors: prev?.floors || {},
    A: mk('A', Object.keys(setA).sort()).map(e => ({ ...e, hits: setA[e.name] })),
    D_programs_only: mk('D_programs_only', setD.programs_only),
    D_femalePrograms_only: mk('D_femalePrograms_only', setD.femalePrograms_only),
  };
  if (growth.length && prev && !ALLOW_GROWTH) { console.error(`REFUSED: --write-baseline would ADD ${growth.join(', ')}; pass --allow-growth with a written reason`); process.exit(1); }
  writeFileSync(BASELINE, JSON.stringify(out, null, 2) + '\n');
  console.log(`wrote ${BASELINE}`);
  process.exit(0);
}
if (!prev) { fail(`no baseline at ${BASELINE}`); }
else {
  const cmp = (sec, live, label) => {
    const base = new Set((prev[sec] || []).map(e => e.name));
    for (const n of live) if (!base.has(n)) fail(`${label} GREW: '${n}' is new (fix it, or record it with a tracker row and reason)`);
    for (const n of base) if (!live.includes(n)) fail(`${label} STALE: '${n}' is no longer in the set — ratchet down with --write-baseline`);
    for (const e of prev[sec] || []) if (!/^(BUG|EPIC)-\d+/.test(e.row || '') || !e.reason || e.reason === 'UNREVIEWED')
      fail(`R4 ${sec} '${e.name}' has no tracker row id / reason`);
  };
  cmp('A', Object.keys(setA), 'R1/R2 (A) prescribed-but-unbanked');
  cmp('D_programs_only', setD.programs_only, 'R3 (D) programs-only');
  cmp('D_femalePrograms_only', setD.femalePrograms_only, 'R3 (D) femalePrograms-only');
  const fl = prev.floors || {};
  for (const k of [...INV, 'TEMPLATES_slots']) {
    const got = k === 'TEMPLATES_slots' ? slots : scanned[k].objs;
    if (!Number.isInteger(fl[k]) || fl[k] < 1) fail(`R7 no committed floor for ${k} (a missing floor must fail, never default)`);
    else if (got < fl[k]) fail(`R7 ${k} yielded ${got} < floor ${fl[k]}`);
  }
  if (bankNames.size === 0) fail('R7 EXERCISE_BANK is empty');
}
if (!/selection-reachability-smoke\.mjs/.test(readFileSync(VERIFY, 'utf8')))
  fail('R6 scripts/verify.mjs no longer registers selection-reachability-smoke.mjs, the owner of sets (B)/(C)');

if (fails.length) { console.error(`\nINVENTORY RECONCILIATION FAILED (${fails.length}):`); for (const f of fails) console.error('  ✗ ' + f); process.exit(1); }
console.log('inventory reconciliation PASS');

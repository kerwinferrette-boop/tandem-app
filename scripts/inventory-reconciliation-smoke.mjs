#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// inventory-reconciliation-smoke.mjs — BUG-108 (owner), covering BUG-161 and BUG-130.
//
// THE DEFECT. programs.js has MORE THAN ONE inventory of exercises and, before this gate,
// nothing reconciled them. EXERCISE_BANK is what the generator selects from and what
// bankIndexByName() resolves (D20 recovery, D27 continuity, D31 variety, per-exercise set
// counts, muscle tags). The app ALSO prescribes from four other places:
//   programs        getProgram()-local static library (male)
//   femalePrograms  getProgram()-local static library (female) — chosen by
//                   `const activePrograms = isFemale ? femalePrograms : programs;`
//   SUBSTITUTIONS   getProgram()-local pool, consumed by the dedupeConsecutiveDays backfill
//                   (NOT the injury path; injury substitution is getExerciseSubstitutes(),
//                   which draws from EXERCISE_BANK)
//   TEMPLATES       buildDynamicProgram()-local slot templates
// A name can sit in one of those and not in the bank, and the two static libraries can drift
// apart by sex. Every other gate was blind to both.
//
// HOW IT READS THEM (runtime values, not a text grep). All four are function-LOCAL consts, so
// they are unreachable from a vm context. This script injects one capture statement after each
// declaration into an in-memory copy of programs.js, asserts each anchor matched EXACTLY once
// (SC-45: a mutation/injection that did not land must fail, not pass), runs getProgram() and
// buildDynamicProgram() once each, and walks the captured objects. Nothing on disk is changed.
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
//   R7  anti-vacuity: each of programs / femalePrograms / SUBSTITUTIONS yielded >= its
//       committed floor of exercise objects, TEMPLATES >= its floor of slots, and the bank is
//       non-empty — so a capture that silently grabbed an empty object cannot read as clean.
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
let code = readFileSync(PROGRAMS, 'utf8');
function injectAfter(anchor, stmt) {
  const n = code.split(anchor).length - 1;
  if (n !== 1) { console.error(`FATAL: anchor matched ${n} times (need exactly 1): ${anchor}`); process.exit(2); }
  code = code.replace(anchor, anchor + stmt);
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
injectAfter('const activePrograms = isFemale ? femalePrograms : programs;',
  ' __inv.programs = programs; __inv.femalePrograms = femalePrograms; __inv.SUBSTITUTIONS = SUBSTITUTIONS;');
{
  const anchor = 'const TEMPLATES = [';
  const n = code.split(anchor).length - 1;
  if (n !== 1) { console.error(`FATAL: anchor matched ${n} times (need exactly 1): ${anchor}`); process.exit(2); }
  const start = code.indexOf(anchor) + anchor.length - 1;
  const end = literalEnd(code, start);
  if (end < 0 || code[end + 1] !== ';') { console.error('FATAL: could not find the end of the TEMPLATES literal'); process.exit(2); }
  code = code.slice(0, end + 2) + ' __inv.TEMPLATES = TEMPLATES;' + code.slice(end + 2);
}
const __inv = {};
const ctx = vm.runInNewContext(
  `(function() { ${code}; return { getProgram, buildDynamicProgram, EXERCISE_BANK }; })()`, { console, __inv });
try { ctx.getProgram('build_muscle', 4, 12, 'male', 'full_gym', 'balanced', [], null, { week: 1, phase: 0 }); }
catch (e) { fail(`getProgram() threw while capturing inventories: ${e.message}`); }
try { ctx.buildDynamicProgram('build_muscle', 4, 12, 'male', 'full_gym', 'balanced', [], null, { week: 1, phase: 0 }); }
catch (e) { fail(`buildDynamicProgram() threw while capturing TEMPLATES: ${e.message}`); }
for (const k of ['programs', 'femalePrograms', 'SUBSTITUTIONS', 'TEMPLATES'])
  if (!__inv[k]) { console.error(`FATAL: ${k} was not captured — the injected statement never ran`); process.exit(2); }

// ── 2. walk ────────────────────────────────────────────────────────────────────────────
const bankNames = new Set(Object.values(ctx.EXERCISE_BANK).map(e => e.name));
function exerciseNames(root) {
  const out = new Map(); let objs = 0; const seen = new Set();
  (function walk(v) {
    if (!v || typeof v !== 'object' || seen.has(v)) return;
    seen.add(v);
    if (typeof v.name === 'string' && ('sets' in v || 'r' in v)) {
      objs++; out.set(v.name, (out.get(v.name) || 0) + 1);
    }
    for (const x of Array.isArray(v) ? v : Object.values(v)) walk(x);
  })(root);
  return { names: out, objs };
}
const INV = ['programs', 'femalePrograms', 'SUBSTITUTIONS'];
const scanned = Object.fromEntries(INV.map(k => [k, exerciseNames(__inv[k])]));

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
  for (const k of INV) if (!(scanned[k].objs >= (fl[k] || 1))) fail(`R7 ${k} yielded ${scanned[k].objs} exercise objects < floor ${fl[k] || 1}`);
  if (!(slots >= (fl.TEMPLATES_slots || 1))) fail(`R7 TEMPLATES yielded ${slots} slots < floor ${fl.TEMPLATES_slots || 1}`);
  if (bankNames.size === 0) fail('R7 EXERCISE_BANK is empty');
}
if (!/selection-reachability-smoke\.mjs/.test(readFileSync(VERIFY, 'utf8')))
  fail('R6 scripts/verify.mjs no longer registers selection-reachability-smoke.mjs, the owner of sets (B)/(C)');

if (fails.length) { console.error(`\nINVENTORY RECONCILIATION FAILED (${fails.length}):`); for (const f of fails) console.error('  ✗ ' + f); process.exit(1); }
console.log('inventory reconciliation PASS');

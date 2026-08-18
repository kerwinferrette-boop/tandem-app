#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// movement-families-check.mjs — proves MOVEMENT_FAMILIES is a total,
// non-overlapping partition of EXERCISE_BANK.
//
// MOVEMENT_FAMILIES is INERT DATA (see its header comment in programs.js — it
// populates the never-populated v0.5 `movement_pattern` / `canonical_lift`
// fields ahead of any migration). Nothing reads it yet, so no behavioural test
// can cover it. These are the invariants that CAN be proven today:
//
//   R1  Every EXERCISE_BANK slug appears in at least one family (none missing).
//   R2  No slug appears in two or more families (exactly one, not at least one).
//   R3  Every declared variant slug actually exists in EXERCISE_BANK.
//   R4  Every family declares label / pattern / canonicalLift / non-empty
//       variants, and no family key is duplicated by a duplicate variant list.
//   R5  Every non-null `pattern` is one of the eight values Exercise Science
//       Schema v0.5 Part 3 Table 1 enumerates verbatim. `null` is the explicit
//       "v0.5 enum has no value for this" marker (core / conditioning).
//   R6  Every non-null `canonicalLift` is one of the five barbell lifts v0.5's
//       own load_coefficient table names. Nothing invented.
//   R7  MOVEMENT_FAMILIES stays inert: no other identifier in programs.js or
//       tandem.html reads it.
//
// Run: node scripts/movement-families-check.mjs
// Exit 0 = partition proven. Exit 1 = one or more rules failed.
// ═══════════════════════════════════════════════════════
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = readFileSync(join(root, 'programs.js'), 'utf8');

const { EXERCISE_BANK, MOVEMENT_FAMILIES } = vm.runInNewContext(
  `(function(){ ${src}; return { EXERCISE_BANK, MOVEMENT_FAMILIES }; })()`,
  { console }
);

// v0.5 Part 3, Table 1 `exercises`, verbatim enum.
const V05_PATTERNS = ['horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull',
                      'squat', 'hinge', 'carry', 'isolation'];
// v0.5 Part 3, load_coefficient derivation table — the only canonical lifts named.
const V05_CANONICAL_LIFTS = ['Barbell Bench Press', 'Barbell Squat', 'Barbell Deadlift',
                             'Weighted Pull-up', 'Barbell Overhead Press'];

const failures = [];
const fail = (rule, msg) => failures.push(`${rule}: ${msg}`);

const bankSlugs = Object.keys(EXERCISE_BANK);
const famKeys = Object.keys(MOVEMENT_FAMILIES);

// ── R4: shape ────────────────────────────────────────────
for (const key of famKeys) {
  const f = MOVEMENT_FAMILIES[key];
  if (!f || typeof f !== 'object') { fail('R4', `family '${key}' is not an object`); continue; }
  if (typeof f.label !== 'string' || !f.label) fail('R4', `family '${key}' has no label`);
  if (!('pattern' in f)) fail('R4', `family '${key}' has no pattern key`);
  if (!('canonicalLift' in f)) fail('R4', `family '${key}' has no canonicalLift key`);
  if (!Array.isArray(f.variants) || f.variants.length === 0) fail('R4', `family '${key}' has no variants`);
  else if (new Set(f.variants).size !== f.variants.length) fail('R4', `family '${key}' repeats a variant internally`);
}

// ── R5 / R6: values come from v0.5, nothing invented ─────
for (const key of famKeys) {
  const f = MOVEMENT_FAMILIES[key] || {};
  if (f.pattern !== null && !V05_PATTERNS.includes(f.pattern))
    fail('R5', `family '${key}' pattern '${f.pattern}' is not in the v0.5 movement_pattern enum`);
  if (f.canonicalLift !== null && !V05_CANONICAL_LIFTS.includes(f.canonicalLift))
    fail('R6', `family '${key}' canonicalLift '${f.canonicalLift}' is not named by v0.5's load_coefficient table`);
}

// ── R3: declared variants exist / R2: no slug in two families ──
const owner = new Map();          // slug -> [family keys]
for (const key of famKeys) {
  for (const slug of (MOVEMENT_FAMILIES[key] || {}).variants || []) {
    if (!Object.prototype.hasOwnProperty.call(EXERCISE_BANK, slug))
      fail('R3', `family '${key}' declares variant '${slug}' which is NOT in EXERCISE_BANK`);
    if (!owner.has(slug)) owner.set(slug, []);
    owner.get(slug).push(key);
  }
}
for (const [slug, keys] of owner) {
  if (keys.length > 1) fail('R2', `slug '${slug}' appears in ${keys.length} families: ${keys.join(', ')}`);
}

// ── R1: no bank slug left out ────────────────────────────
const missing = bankSlugs.filter(s => !owner.has(s));
for (const slug of missing) fail('R1', `slug '${slug}' (${EXERCISE_BANK[slug].name}) is in NO family`);

// ── R7: inertness — nothing reads MOVEMENT_FAMILIES ──────
const html = readFileSync(join(root, 'tandem.html'), 'utf8');
const declLine = /^\s*const MOVEMENT_FAMILIES\s*=/m;
const readsInPrograms = src.split('\n')
  .map((line, i) => ({ line, n: i + 1 }))
  .filter(({ line }) => line.includes('MOVEMENT_FAMILIES'))
  .filter(({ line }) => !declLine.test(line) && !/^\s*(\/\/|\*|\/\*)/.test(line.trimStart()));
for (const { line, n } of readsInPrograms)
  fail('R7', `programs.js:${n} references MOVEMENT_FAMILIES outside its declaration — it must stay inert: ${line.trim()}`);
if (html.includes('MOVEMENT_FAMILIES'))
  fail('R7', 'tandem.html references MOVEMENT_FAMILIES — it must stay inert');

// ── Report ───────────────────────────────────────────────
const patternCounts = {};
for (const key of famKeys) {
  const p = String((MOVEMENT_FAMILIES[key] || {}).pattern);
  const n = ((MOVEMENT_FAMILIES[key] || {}).variants || []).length;
  patternCounts[p] = (patternCounts[p] || 0) + n;
}

console.log('── MOVEMENT_FAMILIES partition check ──');
console.log(`EXERCISE_BANK slugs : ${bankSlugs.length}`);
console.log(`families            : ${famKeys.length}`);
console.log(`slugs claimed       : ${owner.size}`);
console.log('');
console.log('slugs per v0.5 movement_pattern:');
for (const p of [...V05_PATTERNS, 'null']) {
  if (patternCounts[p]) console.log(`  ${p.padEnd(16)} ${String(patternCounts[p]).padStart(3)}`);
}
console.log('');
console.log('families per canonical lift (v0.5 load_coefficient table):');
for (const cl of V05_CANONICAL_LIFTS) {
  const fams = famKeys.filter(k => MOVEMENT_FAMILIES[k].canonicalLift === cl);
  console.log(`  ${cl.padEnd(22)} ${fams.join(', ') || '(none)'}`);
}
const nullCl = famKeys.filter(k => MOVEMENT_FAMILIES[k].canonicalLift === null).length;
console.log(`  ${'(null — no barbell eq.)'.padEnd(22)} ${nullCl} families`);
console.log('');

if (failures.length) {
  console.log(`FAIL — ${failures.length} violation(s):`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log('PASS — R1 no slug missing · R2 no slug in two families · R3 every variant exists');
console.log('       R4 shape ok · R5 patterns ⊆ v0.5 enum · R6 canonical lifts ⊆ v0.5 table');
console.log('       R7 inert (nothing reads it)');

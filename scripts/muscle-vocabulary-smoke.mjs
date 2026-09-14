#!/usr/bin/env node
/**
 * muscle-vocabulary-smoke.mjs — SHAPE + SPELLING gate for EXERCISE_BANK muscle tags
 * (EPIC-026 Phase 4; convention: docs/muscle-tag-convention.md).
 *
 * WHY THIS EXISTS
 * ---------------
 * Muscle tags fail SILENTLY. `groupsMatch` (D19) does a prefix test and nothing
 * validates the tag, so a misspelling produces no error, no warning, and no gate
 * failure — the exercise just stops being reachable by the slot it was written for
 * and nobody finds out until an audit weeks later. Two of these shipped
 * (`hamstring_bicep_femoris`, `hamstring_semimembranous`) and lived in the bank
 * until they were caught by eye. From here they fail the build.
 *
 * The same silence covers the shape of the field: an entry with an empty `primary`
 * is unreachable by construction, and an entry with no `secondary` is either a
 * deliberate refusal to fabricate or an oversight — and reading the file cannot
 * tell you which. This gate forces that distinction to be written down.
 *
 * WHAT IT CHECKS (all HARD — any failure fails the build)
 *   [A] every entry has a non-empty `primary`. No exemptions, ever: a slot selects
 *       on tags, so an entry with none is dead on arrival.
 *   [B] every entry has a non-empty `secondary`, EXCEPT categories in
 *       SECONDARY_OPTIONAL_CATEGORIES and entries in NO_SECONDARY_EXEMPT.
 *   [C] every tag used is a member of MUSCLE_VOCABULARY. This is the typo gate.
 *   [D] no stale exemption — an entry in NO_SECONDARY_EXEMPT that no longer exists,
 *       or that has since acquired a secondary, FAILS. The ratchet turns one way
 *       (the rule reachability-smoke.mjs [C] established).
 *   [E] no stale vocabulary — a declared tag that no bank entry uses FAILS, so the
 *       constant tracks the bank instead of accumulating dead terms.
 *
 * WHAT IT DOES NOT CHECK, DELIBERATELY
 *   · REACHABILITY. "Can a slot select this tag?" is owned completely by
 *     scripts/reachability-smoke.mjs. Two files asserting one rule is the drift
 *     CLAUDE.md's "one rule, one home" forbids — and the precedent is right here in
 *     this repo: D19 exists because ONE rule got copied into TWO places.
 *   · ANATOMICAL CORRECTNESS. Membership in the vocabulary is a spelling claim.
 *     Whether `tricep_medial` is the right tag for a given lift is an
 *     exercise-science question that no string comparison can answer. A green run
 *     means "no typos, no missing fields" — never "the tags are true".
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import {
  MUSCLE_VOCABULARY,
  SECONDARY_OPTIONAL_CATEGORIES,
  NO_SECONDARY_EXEMPT,
} from './lib/muscle-vocabulary.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = readFileSync(join(root, 'programs.js'), 'utf8');

// Extract the bank LIVE — never a copied list (same technique as the audit).
const ctx = { window: {}, document: { querySelectorAll: () => [] },
              localStorage: { getItem: () => null, setItem: () => {} } };
vm.createContext(ctx);
vm.runInContext(src + ';globalThis.__X = { bank: EXERCISE_BANK };', ctx);
const { bank } = ctx.__X;
const slugs = Object.keys(bank);
if (slugs.length < 100) throw new Error(`Bank suspiciously small (${slugs.length}) — extraction broken?`);

const VOCAB = new Set(MUSCLE_VOCABULARY);
const OPTIONAL = new Set(SECONDARY_OPTIONAL_CATEGORIES);
const primaryOf = (s) => bank[s].muscleGroups?.primary || [];
const secondaryOf = (s) => bank[s].muscleGroups?.secondary || [];

const failures = [];
const used = new Set();

for (const s of slugs) {
  const primary = primaryOf(s);
  const secondary = secondaryOf(s);
  const category = bank[s].category;

  // [A] primary is mandatory, no exemptions
  if (!primary.length) failures.push(`"${s}" has an EMPTY primary — no slot can ever select it`);

  // [B] secondary is mandatory outside the written exemptions
  if (!secondary.length && !OPTIONAL.has(category) && !(s in NO_SECONDARY_EXEMPT))
    failures.push(
      `"${s}" [${category}] has no secondary and no written exemption — either tag it, ` +
      `or add it to NO_SECONDARY_EXEMPT with the reason it cannot be tagged`);

  // [C] the typo gate
  for (const t of [...primary, ...secondary]) {
    used.add(t);
    if (!VOCAB.has(t))
      failures.push(`"${s}" uses tag "${t}", which is not in MUSCLE_VOCABULARY — typo, or a new term that must be declared (with its reason) in scripts/lib/muscle-vocabulary.mjs`);
  }
}

// [D] the exemption ratchet — one way only
for (const s of Object.keys(NO_SECONDARY_EXEMPT)) {
  if (!(s in bank)) failures.push(`stale NO_SECONDARY_EXEMPT entry "${s}" — no longer in the bank; remove it`);
  else if (secondaryOf(s).length) failures.push(`stale NO_SECONDARY_EXEMPT entry "${s}" — it now HAS a secondary; remove it (gap closed)`);
}

// [E] the vocabulary tracks the bank, it does not accumulate
for (const t of MUSCLE_VOCABULARY)
  if (!used.has(t)) failures.push(`declared tag "${t}" is used by ZERO bank entries — remove it from MUSCLE_VOCABULARY, or tag the entry that needs it`);

// ── Report ──────────────────────────────────────────────────────────────────
const noSecondary = slugs.filter(s => !secondaryOf(s).length);
console.log('MUSCLE-TAG VOCABULARY GATE — shape + spelling (EPIC-026 Phase 4)\n');
console.log(`  ${slugs.length} bank entries · ${MUSCLE_VOCABULARY.length} declared tags · ${used.size} in use`);
console.log(`  entries with no secondary: ${noSecondary.length} (${noSecondary.map(s => `${s}[${bank[s].category}]`).join(', ') || 'none'})`);
console.log(`  secondary OPTIONAL for category: ${SECONDARY_OPTIONAL_CATEGORIES.join(', ')} — measured 0/1942 output effect, no consumer, no source (Wave-1D ruling)`);

console.log('\n  WRITTEN EXEMPTIONS (each is a refusal to fabricate, not a to-do):');
for (const [s, why] of Object.entries(NO_SECONDARY_EXEMPT)) console.log(`    · ${s}\n        ${why}`);

if (failures.length) {
  console.log(`\n${failures.length} VOCABULARY VIOLATION(S):`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log('\nEvery entry has a primary, every secondary is present or exempted, every tag is declared. ✓');
process.exit(0);

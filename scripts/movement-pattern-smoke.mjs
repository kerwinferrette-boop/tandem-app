#!/usr/bin/env node
/**
 * movement-pattern-smoke.mjs — INTEGRITY gate for MOVEMENT_PATTERN
 * (council ruling R2, docs/council-science-application-2026-09-14.md).
 *
 * WHY THIS EXISTS
 * ---------------
 * R2's rule — "no two compounds in one session share a movement pattern" — is
 * enforced by `patternClash`, which asks `MOVEMENT_PATTERN_BY_NAME.get(e.name)`.
 * That lookup FAILS OPEN. A slug typo, a renamed bank entry, or a newly added
 * compound that nobody classified all produce `null`, and `null` means "clashes
 * with nothing" — the exercise becomes permanently exempt from the rule, silently,
 * with every gate green. That is the same failure shape as the muscle-tag typos
 * (`hamstring_bicep_femoris`) that lived in the bank until someone spotted them by
 * eye, and it is why this file exists rather than a comment saying "keep it in sync".
 *
 * WHAT IT CHECKS (all HARD)
 *   [A] every MOVEMENT_PATTERN key resolves to a real EXERCISE_BANK slug.
 *   [B] every classified entry is `category === 'compound'`. Isolation/core/cardio
 *       are unclassified BY DESIGN (R2 is a compound-selection rule); classifying
 *       one would silently widen the rule past its ruling.
 *   [C] every compound in the bank IS classified. This is the direction that
 *       matters most: adding a compound without a pattern is the failure-open case.
 *   [D] every pattern VALUE is in the closed PATTERNS set — the typo gate on the
 *       other side of the colon. `'horizontal_pul'` would otherwise create a
 *       private pattern that clashes with nothing.
 *   [E] bank entry NAMES are unique. MOVEMENT_PATTERN_BY_NAME is keyed by name
 *       (select()/bank() iterate Object.values, so the slug is not on the entry),
 *       so two entries sharing a name would let one silently overwrite the other.
 *
 * WHAT IT DOES NOT CHECK, DELIBERATELY
 *   · WHETHER A CLASSIFICATION IS CORRECT. "Is the incline press horizontal_push?"
 *     is a judgment, argued and recorded at MOVEMENT_PATTERN's declaration, not a
 *     string comparison. Green here means "the table and the bank agree on what
 *     exists" — never "the patterns are right".
 *   · WHETHER THE RULE FIRES. That is generated-output behavior and belongs to
 *     program-snapshot.mjs (change detector) and the measured numbers in the
 *     commit body. One rule, one home.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

// The closed set of pattern names. Adding one is a deliberate act: it means a
// movement exists that none of these eight describe, which is a science claim that
// belongs in MOVEMENT_PATTERN's provenance comment before it belongs here.
const PATTERNS = new Set([
  'horizontal_push', 'vertical_push',
  'horizontal_pull', 'vertical_pull',
  'squat', 'lunge', 'hinge', 'bridge',
]);

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = readFileSync(join(root, 'programs.js'), 'utf8');

// Extract LIVE from programs.js — never a copied list.
const ctx = { window: {}, document: { querySelectorAll: () => [] },
              localStorage: { getItem: () => null, setItem: () => {} } };
vm.createContext(ctx);
vm.runInContext(src + ';globalThis.__X = { bank: EXERCISE_BANK, table: MOVEMENT_PATTERN };', ctx);
const { bank, table } = ctx.__X;
const slugs = Object.keys(bank);
if (slugs.length < 100) throw new Error(`Bank suspiciously small (${slugs.length}) — extraction broken?`);

const failures = [];
const compounds = slugs.filter(s => bank[s].category === 'compound');

// [A] + [B] — the table points at real compounds
for (const [slug, pattern] of Object.entries(table)) {
  if (!(slug in bank)) {
    failures.push(`MOVEMENT_PATTERN key "${slug}" is not a bank slug — typo, or the entry was renamed/removed. It classifies nothing, so every lift it was meant to cover now fails OPEN (null pattern = clashes with nothing).`);
    continue;
  }
  const cat = bank[slug].category;
  if (cat !== 'compound')
    failures.push(`"${slug}" is classified "${pattern}" but its category is "${cat}", not compound. R2 is a compound-selection rule; classifying non-compounds widens it past the ruling.`);
  // [D] the value-side typo gate
  if (!PATTERNS.has(pattern))
    failures.push(`"${slug}" has pattern "${pattern}", which is not in the closed PATTERNS set. A private pattern name clashes with nothing and silently exempts the lift.`);
}

// [C] — the direction that fails open: an unclassified compound
for (const s of compounds)
  if (!(s in table))
    failures.push(`compound "${s}" (${bank[s].name}) has NO movement pattern — patternClash() scores it 0 against everything, so R2 cannot see it. Classify it in MOVEMENT_PATTERN, or state why it is not a pattern.`);

// [E] — name uniqueness, because the runtime index is name-keyed
const byName = new Map();
for (const s of slugs) {
  const n = bank[s].name;
  if (byName.has(n))
    failures.push(`bank name collision: "${n}" is used by both "${byName.get(n)}" and "${s}". MOVEMENT_PATTERN_BY_NAME is keyed by NAME, so one silently overwrites the other.`);
  else byName.set(n, s);
}

// ── Report ──────────────────────────────────────────────────────────────────
const counts = {};
for (const p of Object.values(table)) counts[p] = (counts[p] || 0) + 1;
console.log('MOVEMENT-PATTERN INTEGRITY GATE — council R2 (2026-09-14)\n');
console.log(`  ${slugs.length} bank entries · ${compounds.length} compounds · ${Object.keys(table).length} classified`);
console.log(`  ${[...PATTERNS].map(p => `${p}:${counts[p] || 0}`).join(' · ')}`);
console.log(`\n  NOT classified by design: isolation/core/cardio (${slugs.length - compounds.length} entries).`);
console.log('  R2 governs compound selection only; movementPattern() returns null elsewhere and the clash rank is a no-op.');

if (failures.length) {
  console.log(`\n${failures.length} MOVEMENT-PATTERN VIOLATION(S):`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log('\nTable and bank compounds are 1:1 in both directions; every pattern name is declared; names are unique. ✓');
process.exit(0);

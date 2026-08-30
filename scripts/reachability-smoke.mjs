#!/usr/bin/env node
/**
 * reachability-smoke.mjs — REGRESSION GUARD for slot reachability of EXERCISE_BANK
 * (EPIC-026 Wave 2; loop-config.md §1 "Regression stop").
 *
 * WHY THIS EXISTS
 * ---------------
 * An exercise that no slot can ever select is dead inventory: it costs bank
 * maintenance, it shows up in every audit, and the user never sees it. BUG-87 fixed
 * the *collision* half of groupsMatch (`quad` no longer matches `quadratus_lumborum`);
 * nothing guards the *reachability* half — that a newly-added bank entry is actually
 * selectable by some slot. `band-external-rotation` was merged 2026-08-24 with a
 * single primary tag (`external_rotator`) that no slot requests, and shipped dead.
 * This gate makes that class of mistake fail loudly at ship time instead of showing
 * up in an audit weeks later.
 *
 * WHAT IT IS NOT
 * --------------
 * This is a REACHABILITY guard, not a taxonomy-correctness gate. It cannot tell you
 * whether a muscle tag is anatomically right, or whether a slot *should* request a
 * given group — those are exercise-science questions answered by Notion + the
 * research corpus, not by string matching. It only answers: "can any slot select
 * this exercise, and did that answer get worse since last ship?"
 *
 * THE RATCHET
 * -----------
 * Known-open gaps are listed in OPEN_GAPS with the ruling that blocks each one. They
 * are printed on every run so they stay visible, and they are the ONLY tolerated
 * violations. Anything new fails the gate. Removing an entry from OPEN_GAPS is the
 * deliberate act of closing it; a green run with a stale allowlist is caught because
 * an OPEN_GAPS entry that no longer reproduces ALSO fails (the ratchet only turns
 * one way).
 *
 * HARD (fails the gate):
 *   [A] every EXERCISE_BANK entry is selectable by >=1 slot, except OPEN_GAPS.exercises
 *   [B] no NEW orphan tag beyond OPEN_GAPS.orphanTags
 *   [C] every OPEN_GAPS entry still reproduces (no stale allowlist)
 *   [D] D19's two groupsMatch copies are present and neither has regressed to the
 *       pre-BUG-87 bare-prefix fallback (mirrors audit-muscle-tags.mjs's self-check
 *       so it runs inside `npm run verify`, which the read-only audit does not)
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = readFileSync(join(root, 'programs.js'), 'utf8');

// ── Known-open gaps. Each needs a SOURCE or a Kerwin ruling, not a code change.
//    Sources checked and found silent: research-report (8).pdf and
//    "Exercise Science Framework…docx" contain ZERO occurrences of external
//    rotation / rotator cuff / serratus / trapezius / adductor / hip flexor /
//    clavicular. Inventing a hierarchy to close these would be fabrication.
const OPEN_GAPS = {
  exercises: {
    'band-external-rotation':
      'primary [external_rotator] is requested by no slot. EPIC-026 Phase 1 §6 rejected ' +
      '`external_rotator` as "not a muscle; no ER exercise in the bank" — that rationale is ' +
      'now STALE (this entry is a dedicated ER exercise, merged 64938b6 2026-08-24 with its ' +
      'intake-gated mapping verbatim). Closing needs a ruling on whether a program slot may ' +
      'request dedicated glenohumeral external rotation. Repo research is silent.',
  },
  // Orphan tags are NOT all defects. Three distinct kinds, kept separate on purpose:
  orphanTags: {
    // (i) secondary-only — correct by design. audit-muscle-tags.mjs:132 states the rule:
    //     "secondary tags describe involvement, not the slot the exercise is selected for."
    //     EPIC-026 §6 "Keep but exclude from any D6b volume target".
    core:              'secondary-only descriptive tag — correct that no slot targets it (§6 "keep but exclude")',
    psoas:             'secondary-only descriptive tag — correct that no slot targets it',
    serratus_anterior: 'secondary-only descriptive tag — correct that no slot targets it (§6 "keep but exclude")',
    supraspinatus:     'secondary-only descriptive tag — correct that no slot targets it (§6 "keep but exclude")',
    // (ii) primary tag, but every carrier is reachable via a sibling tag — no lost inventory.
    //      EPIC-026 §6: "Do NOT rename delts, traps, or the calf family… the benefit is a
    //      parent ['delt']/['trap'] slot no template wants and the science argues against."
    lower_trap:        'all 4 carriers reachable via posterior_delt/rhomboid/lat_dorsi; §6 forbids a parent `trap` slot',
    middle_trap:       'sole carrier prone-t-raise reachable via posterior_delt/rhomboid; §6 forbids a parent `trap` slot',
    hip_flexor:        'all 3 carriers reachable via rectus_abdominis/transverse_abdominis',
    adductor:          'all 3 carriers reachable via glute/quad/oblique tags; EPIC-026 §7.5 open question for Kerwin (split magnus vs longus/brevis?)',
    // (iii) blocked on a citation that does not exist.
    upper_pec:         'BUG-85 — landmine-press is reachable via anterior_delt/tricep, but `upper_pec` is a §4 duplicate of `pec_major_clavicular`. Retagging asserts a regional pec bias that is UNVERIFIED (no landmine-press EMG study found). Blocked on a citation.',
    external_rotator:  'see OPEN_GAPS.exercises["band-external-rotation"] — same blocking ruling',
  },
};

// ── Extract the bank + slot vocabulary LIVE (same technique as audit-muscle-tags.mjs) ──
const ctx = { window: {}, document: { querySelectorAll: () => [] },
              localStorage: { getItem: () => null, setItem: () => {} } };
vm.createContext(ctx);
vm.runInContext(src + `;globalThis.__X = { bank: EXERCISE_BANK, focusSlots: FOCUS_SLOTS,
  oneoffCore: ONEOFF_CORE_GROUPS, oneoffCardio: ONEOFF_CARDIO_GROUPS };`, ctx);
const { bank, focusSlots, oneoffCore, oneoffCardio } = ctx.__X;
const slugs = Object.keys(bank);
if (slugs.length < 100) throw new Error(`Bank suspiciously small (${slugs.length}) — extraction broken?`);

const tagsOf = (s) => [...(bank[s].muscleGroups?.primary || []), ...(bank[s].muscleGroups?.secondary || [])];

// The live rule, verbatim from programs.js (post-BUG-87: anchored prefix only).
const matches = (tag, group) => tag === group || tag.startsWith(group + '_');

const requested = new Set();
for (const slots of Object.values(focusSlots)) for (const [a, b] of slots) { if (a) requested.add(a); if (b) requested.add(b); }
for (const g of oneoffCore) requested.add(g);
for (const g of oneoffCardio) requested.add(g);
for (const m of src.matchAll(/groups:\s*\[([^\]]*)\]/g))
  for (const x of m[1].matchAll(/'([^']+)'/g)) requested.add(x[1]);
{
  const i = src.indexOf('const CORE_GROUPS');
  if (i !== -1) for (const x of src.slice(i, src.indexOf('];', i)).matchAll(/'([^']+)'/g)) requested.add(x[1]);
}
const REQ = [...requested];
if (!REQ.length) throw new Error('no slot groups extracted — slot scan broken?');

const reachable = (s) => tagsOf(s).some(t => REQ.some(g => matches(t, g)));
const VOCAB = [...new Set(slugs.flatMap(tagsOf))].sort();

const failures = [];

// [A] every bank entry selectable by >=1 slot
const unreachable = slugs.filter(s => !reachable(s));
for (const s of unreachable)
  if (!(s in OPEN_GAPS.exercises))
    failures.push(`NEW dead inventory: "${s}" [${tagsOf(s).join(', ')}] is selectable by ZERO slots`);

// [B] no new orphan tag
const orphans = VOCAB.filter(t => !REQ.some(g => matches(t, g)));
for (const t of orphans)
  if (!(t in OPEN_GAPS.orphanTags))
    failures.push(`NEW orphan tag: "${t}" exists in the bank but no slot can reach it`);

// [C] no stale allowlist — the ratchet only turns one way
for (const s of Object.keys(OPEN_GAPS.exercises))
  if (!(s in bank)) failures.push(`stale OPEN_GAPS.exercises entry "${s}" — no longer in the bank; remove it`);
  else if (reachable(s)) failures.push(`stale OPEN_GAPS.exercises entry "${s}" — now reachable; remove it (gap closed)`);
for (const t of Object.keys(OPEN_GAPS.orphanTags)) {
  if (!VOCAB.includes(t)) failures.push(`stale OPEN_GAPS.orphanTags entry "${t}" — no longer in the vocabulary; remove it`);
  else if (!orphans.includes(t)) failures.push(`stale OPEN_GAPS.orphanTags entry "${t}" — now reachable; remove it (gap closed)`);
}

// [D] D19's paired groupsMatch copies, and no pre-BUG-87 regression
const fixedCount = [...src.matchAll(/a === g \|\| a\.startsWith\(g\s*\+\s*'_'\)\)\)/g)].length;
const regressed = /a\.startsWith\(g\s*\+\s*'_'\)\s*\|\|\s*a\.startsWith\(g\)\)/.test(src);
if (fixedCount !== 2) failures.push(`expected exactly 2 anchored groupsMatch copies (D19), found ${fixedCount}`);
if (regressed) failures.push('BUG-87 regression: the bare `|| a.startsWith(g)` fallback is back in programs.js');

// ── Report ──────────────────────────────────────────────────────────────────
console.log('SLOT REACHABILITY GUARD — no bank entry ships dead (EPIC-026 Wave 2)\n');
console.log(`  ${slugs.length} bank entries · ${VOCAB.length} muscle tags · ${REQ.length} distinct slot groups`);
console.log(`  reachable: ${slugs.length - unreachable.length}/${slugs.length} · orphan tags: ${orphans.length} · anchored groupsMatch copies: ${fixedCount}`);

console.log('\n  KNOWN-OPEN GAPS (tolerated; each needs a source or a Kerwin ruling, NOT a code change):');
for (const [s, why] of Object.entries(OPEN_GAPS.exercises)) console.log(`    · exercise ${s}\n        ${why}`);
for (const [t, why] of Object.entries(OPEN_GAPS.orphanTags)) console.log(`    · tag ${t.padEnd(18)} ${why}`);

if (failures.length) {
  console.log(`\n${failures.length} REACHABILITY REGRESSION(S):`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log('\nNo new dead inventory, no new orphan tags, no stale allowlist entries. ✓');
process.exit(0);

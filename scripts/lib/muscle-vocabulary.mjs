/**
 * muscle-vocabulary.mjs — the CLOSED set of legal `EXERCISE_BANK` muscle tags.
 *
 * WHY A CLOSED SET
 * ----------------
 * `groupsMatch` (D19) matches a slot group `g` against a tag `a` with
 * `a === g || a.startsWith(g + '_')`. Nothing validates `a`. So a typo does not
 * throw, does not warn, and does not fail any gate — it silently becomes an orphan
 * tag that no slot can reach, and the exercise quietly loses eligibility it was
 * meant to have. That is not hypothetical: `hamstring_bicep_femoris` (missing the
 * `s` in `biceps`) and `hamstring_semimembranous` (should be `semimembranosus`)
 * both shipped and sat in the bank until EPIC-026 Phase 3a found them by eye.
 *
 * A closed vocabulary makes the next one a build failure instead of an audit
 * finding. Adding a genuinely new muscle term is a deliberate act: add it here,
 * with the reason, in the same commit that first uses it.
 *
 * WHAT THIS IS NOT
 * ----------------
 * Membership is a SPELLING claim, never an anatomical one. This file cannot tell
 * you whether `tricep_medial` is the right tag for an exercise — only that it is a
 * term the project has agreed exists. The convention that governs *which* term an
 * entry should carry is `docs/muscle-tag-convention.md`; the science behind it is
 * Notion + the research corpus. See that doc §6 ("what is enforced, what is
 * judgment") before treating a green run as correctness.
 *
 * REACHABILITY LIVES SOMEWHERE ELSE, ON PURPOSE
 * ---------------------------------------------
 * "Can any slot select this tag?" is already owned, completely, by
 * `scripts/reachability-smoke.mjs` ([A] dead inventory, [B] orphan tags, [C] the
 * no-stale-allowlist ratchet). Re-asserting it here would make two files claim one
 * rule, which is exactly the drift CLAUDE.md's "one rule, one home" forbids and
 * which D19's two `groupsMatch` copies exist to police. This module owns SHAPE and
 * SPELLING; that one owns REACHABILITY.
 *
 * Consumers: scripts/muscle-vocabulary-smoke.mjs (enforcing, in `npm run verify`)
 *            scripts/audit-muscle-tags.mjs (reporting, read-only)
 */

/**
 * Every tag legally usable in `muscleGroups.primary` or `.secondary`.
 * Derived from the live bank at 179 entries (EPIC-026 Phase 3d, 2026-09-14) and
 * frozen as the declared set from that point forward.
 */
export const MUSCLE_VOCABULARY = Object.freeze([
  'adductor',
  'anterior_delt',
  'bicep',
  'bicep_brachii',
  'bicep_brachii_long_head',
  'bicep_brachii_short_head',
  'brachialis',
  'brachioradialis',
  'calf',
  'core',
  'erector_spinae',
  'external_rotator',
  'full_body',
  'gastrocnemius',
  'glute_max',
  'glute_medius',
  'hamstring',
  'hamstring_biceps_femoris',
  'hamstring_semimembranosus',
  'hamstring_semitendinosus',
  'hip_flexor',
  'lat_dorsi',
  'lateral_delt',
  'lower_trap',
  'middle_trap',
  'oblique_external',
  'oblique_internal',
  'pec_major_clavicular',
  'pec_major_sternal',
  'posterior_delt',
  'psoas',
  'quad',
  'quad_rectus_femoris',
  'quad_vastus',
  'quad_vastus_lateralis',
  'quad_vastus_medialis',
  'quadratus_lumborum',
  'rectus_abdominis',
  'rectus_abdominis_lower',
  'rhomboid',
  'serratus_anterior',
  'soleus',
  'supraspinatus',
  'transverse_abdominis',
  'tricep',
  'tricep_lateral',
  'tricep_long_head',
  'tricep_medial',
  'upper_trap',
]);

/**
 * Categories for which `secondary` is OPTIONAL.
 *
 * The wording matters and it is deliberately "optional", NOT "must be empty":
 * three cardio entries legitimately carry secondaries today, and a rule that
 * forbade them would demand a deletion nobody asked for.
 *
 * Basis (EPIC-026 Wave-1D ruling): cardio secondary tags were MEASURED at 0/1942
 * effect on generated output, have no consumer, and no repo or Notion source
 * assigns muscle involvement to steady-state modalities. Adding them would be
 * uncited data that nothing reads. So the gate declines to demand them.
 */
export const SECONDARY_OPTIONAL_CATEGORIES = Object.freeze(['cardio']);

/**
 * Non-cardio entries that ship with NO `secondary`, each because filling it would
 * mean fabricating a citation. This is a refusal list, not a to-do list.
 *
 * It ratchets one way, in the shape reachability-smoke.mjs [C] established: an
 * entry listed here that HAS acquired a secondary fails the gate, so closing a gap
 * forces the allowlist to shrink instead of quietly going stale.
 */
export const NO_SECONDARY_EXEMPT = Object.freeze({
  'frog-pump':
    'Wave-1C proposed `glute_medius` and marked it UNVERIFIED — coaching sources only, ' +
    'no EMG study located. Tagging it would assert an activation claim no source makes.',
  'band-external-rotation':
    'Wave-1D proposed `posterior_delt` and REJECTED it: measured, it changes 336 of 1942 ' +
    'generated outputs. That is a selection change wearing a tagging change\'s clothes, and ' +
    'it needs a ruling, not a tag.',
});

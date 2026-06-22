# Program Validator Harness - Spec

Owner: Kerwin Ferrette
Opened: 2026-06-18
Status: Scoped (hand to Claude Code to build Tier 1)

## Why this exists

Right now there is no definition of what a *valid* workout plan is. The 2/3/5-day plans are
generated mechanically from a single 4-day base (`build2`, `ppl`, `build5` in `programs.js`),
and nothing checks the output. A broken plan is structurally indistinguishable from a good one
until a human scrolls the UI. That human has been Kerwin. This harness turns "Kerwin notices it
by eye" into "the build catches it automatically."

Concrete example it must catch: the transform 5-day plan puts Arnold Press, Incline DB Curl, and
Tricep Rope Pushdown on both Day 3 and Day 4, because `build5()` inserts a Shoulders+Arms day and
then reuses the base "Pull + Push" day verbatim, and that base day already contains those lifts.

## Architecture: two tiers

### Tier 1 - Deterministic validator (BUILD THIS FIRST)

Pure code, no LLM. A Node script that imports `getProgram`, expands every combination, and runs
hard assertions. Deterministic rules belong in code, never in a model: a 20-line assertion catches
this every time and never gets bored.

- Location: `scripts/validate-programs.mjs`
- Run via: `npm run validate:programs`
- Behavior: prints a readable report (which goal / day-count / phase / sex failed which rule),
  exits non-zero on any failure so it can gate CI and the TPM loop.
- Must NOT modify `programs.js` - read only.

Expansion matrix:

- goals: `fat_burn`, `build_muscle`, `transform`
- days: `2`, `3`, `4`, `5`
- sex: `male`, `female`
- program lengths (for phase checks): `4`, `6`, `8`, `12` weeks

### Tier 2 - Science-review subagent (LATER)

An LLM pass for the soft judgment a validator cannot encode. Feed it the expanded plan plus the
`Exercise Science Framework for Adaptive Workout Pr.docx`. It reasons about things like: does this
split make physiological sense, is weekly set volume per muscle inside MEV-MAV-MRV, does exercise
selection actually match the stated goal. Output is advisory, not a hard gate.

### Loop integration (LATER)

Wire Tier 1 into the tandem-tpm QA loop so it runs every session and auto-files any new failure to
the Notion Bug Log instead of waiting for a human to catch it.

## Tier 1 invariants (the hard rules)

Each rule reports goal, day-count, sex, and the offending exercise/day so failures are actionable.

1. **No exercise on consecutive days.** For each goal x day-count, no exercise `id` (or normalized
   name) may appear on day N and day N+1. This is the rule that catches the Arnold Press bug.
2. **Frequency ceiling.** No single exercise appears more than 2x within one microcycle (the week's
   day set). Configurable constant `MAX_EX_FREQ = 2`.
3. **Compound before isolation.** Within every session, all `compound:true` exercises must be
   ordered before `compound:false` ones. (Framework Section 2: large/multi-joint before small/single-joint.)
4. **Volume bands per muscle.** Approximate weekly set count per primary muscle group must fall
   within configurable MEV-MRV bands. Start permissive (warn, do not fail) until the muscle-tagging
   is trusted. Bands sourced from the Framework (hypertrophy practical minimum ~10 sets/muscle/week,
   advanced 15-20+). Requires a muscle tag per exercise - if not present, add a lookup map in the
   validator, do not pollute `programs.js` yet.
5. **Phase coverage.** For program lengths 4/6/8/12, every week `1..N` must map to exactly one
   phase (no gaps, no overlaps). This catches the current bug where a 6-week program only ever
   reaches Foundation+Build because phases are pinned to absolute weeks.
6. **Mesocycle floor.** No phase may be shorter than 3 weeks once length-scaling lands. (Framework:
   mesocycles 4-6 weeks; 2-week blocks are below the evidence floor. This is why Kerwin's 2/2/2 idea
   gets snapped up to 3/3 for a 6-week program.)
7. **Phase variation** (activate after the redesign lands exercise variation): adjacent phases must
   differ in at least one primary compound per goal. Catches the "same lifts, only reps change"
   problem.

## Acceptance criteria

- Running `validate:programs` against the CURRENT `programs.js` FAILS, and the report names the
  transform 5-day consecutive-day duplicates (Arnold Press, Incline DB Curl, Tricep Rope Pushdown).
  This proves the harness catches the real, known bug.
- After the generator-dedup bug fix lands, the same command exits 0 for rules 1-3 and 5-6.
- The script has zero new runtime dependencies for the app itself (dev-only is fine).

## Notes / open questions

- Muscle tagging for rule 4 does not exist in `programs.js` today. Build it as a separate lookup in
  the validator first; only migrate tags into the data model if the redesign epic decides to.
- Rules 6 and 7 depend on the Program Engine Redesign epic. Ship rules 1-5 now; gate 6-7 behind a
  flag until the redesign provides length-scaling and exercise variation.

## Related Notion items

- BUG: "5-day plan generator double-books exercises on consecutive days"
- EPIC: "Program Engine Redesign - Goal-Differentiated Splits, Exercise Variation Across Phases, Length-Scaled Periodization"
- EPIC: "Program Validator Harness - Deterministic Invariant Checks + Science-Review Subagent"

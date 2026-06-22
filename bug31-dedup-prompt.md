# BUG-31 - 5-day generator double-books exercises on consecutive days

Paste this into Claude Code. Build the EPIC-24 validator FIRST if it does not exist yet - it is the acceptance test for this fix.

## Context

Tandem, `programs.js`. `getProgram(goal, days, weeks, sex)` builds plans. The 2/3/5-day plans are derived mechanically from a hand-authored 4-day base via `build2()` (L615), `ppl()` (L561), and `build5()` (L577). These copy blocks by spread with NO dedup step.

## The bug (verified against current programs.js)

`build5()` (L577-612) inserts a dedicated "Shoulders + Arms" day3 (`shoulders`: ids `s5-ap` Arnold Press, `s5-lat` Cable Lateral Raise, `s5-fp` Face Pull, `s5-ohe` Tricep Overhead Extension, `s5-pd` Tricep Rope Pushdown, `s5-ic` Incline DB Curl, `s5-hc` Hammer Curl), then at L609-611 returns:

```js
return [ua, la, shoulders,
  {...ub, key:'day4', label: ub.label.replace(/^Day \d+/, 'Day 4')},
  {...lb, key:'day5', label: lb.label.replace(/^Day \d+/, 'Day 5')}];
```

It reuses the 4-day base's day3 (`ub`, the "Pull + Push" upper day) verbatim as day4. For `goal=transform`, that base upper-B day ALREADY contains Arnold Press (`tr-press`), Incline DB Curl, and Tricep Rope Pushdown. Result: those three movements land on BOTH day3 and day4 - consecutive training days.

CRITICAL: the collision is by EXERCISE NAME, not id. `s5-ap` and `tr-press` are different ids but the same lift ("Arnold Press"). Dedup MUST normalize on `name.trim().toLowerCase()`, not id.

`build_muscle` and `fat_burn` do not exhibit this because their day3 is pull-only (no pressing). The generic generator only breaks on transform's mixed-upper (antagonist Push+Pull / Pull+Push) structure. The same defect class lurks in `ppl()` and `build2()`.

## Task - surgical dedup only (NOT the full redesign; that is EPIC-23)

1. Add a helper `dedupeConsecutiveDays(days, { wrap = false, minPerDay = 4 })` that:
   - normalizes each exercise by `name.trim().toLowerCase()`;
   - walks adjacent day pairs (and `day[last] -> day[0]` only if `wrap === true`; leave `wrap=false` here, since real schedules interleave rest days);
   - removes from the LATER day any exercise whose normalized name already appears on the earlier day;
   - preserves block structure and compound-before-isolation ordering within each day;
   - returns the cleaned `days`.
2. Backfill guard: if removal drops a day below `minPerDay`, pull replacements from a small per-goal `SUBSTITUTIONS` pool (keyed by muscle/movement pattern) that are not already used on that day or the adjacent day. Do NOT introduce a new consecutive-day collision while backfilling. If no clean substitute exists, leave the day short rather than re-colliding, and log a warning.
3. Apply the helper at the END of `build5()`, `ppl()`, and `build2()` before returning.
4. Do NOT touch the hand-authored 4-day bases, `getPhase`, or the `getProgram` signature.

## Constraints

Pure JS, no new runtime deps. Keep exported `getProgram` identical. Keep ids stable where unchanged.

## Verify (hard gate)

- Run `npm run validate:programs` (EPIC-24 harness). Before this fix it FAILS, naming transform 5-day Arnold Press / Incline DB Curl / Tricep Rope Pushdown on consecutive days. After this fix it must exit 0 for rule 1 (no exercise on consecutive days) across every goal x day-count x sex combination.
- Spot check `getProgram('transform',5,12,'male')` and `('transform',5,12,'female')`: day3 and day4 share zero exercise names; every day has >= `minPerDay` exercises.
- `node --check programs.js` clean.

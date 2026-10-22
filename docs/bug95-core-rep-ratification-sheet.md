# BUG-95 core-rep ratification sheet

**Status: UNRATIFIED. The flat default (`DEFAULT_REPS`, 10) is still in force and is UNCITED.**
This sheet is a request for a decision, not a decision. No number in the right-hand column has been
authored, suggested or ported by the code; the column is empty on purpose and Kerwin fills it.

Scope ruling: `bug95_council = plumbing_now_values_later`, Kerwin, 2026-10-01. Measured 2026-10-13 at
`521dd6f` plus the BUG-95 plumbing commit. Every number below was produced by running the code (extracting the
`isCore:true` literals from `programs.js` and sweeping `getProgram` + `buildDynamicProgram` over the 1050-combo
`scripts/lib/persona-combos.mjs` matrix), not copied from the Notion row. They differ from the row's older
counts, which were measured before the bank grew.

## How to read it

- **Legacy static value(s):** the `r` found in the hand-authored static programs (the `isCore:true` literals in
  `getProgram`'s `programs` / `femalePrograms`), as `r : number-of-entries`. Those static programs are not
  reachable in the 1050-combo sweep today (0 of 80 static core ids appear in any generated output); they serve
  only as the fallback when the generator returns nothing. They are history, **not a source**.
- **Collides:** the static programs carry more than one value for the same movement.
- **Absent:** no static program carries the movement at all, so there is no legacy value to look at.
- **Emitted:** how many core entries of that movement the two generators emit across the 1050 combos, all at
  the flat default today.

## Rep-based core movements (21 rows: 20 in `EXERCISE_BANK` + 1 static-only)

| # | Movement | Bank key | Tier | Legacy static value(s) found (r : entries) | Collides? | Absent from static programs? | Emitted in sweep (getProgram / buildDynamicProgram) | KERWIN'S NUMBER (reps) |
|---|---|---|---|---|---|---|---|---|
| 1 | Dead Bug | dead-bug | home | 10 : 14 | no | no | 910 / 1050 | |
| 2 | Bird Dog | bird-dog | home | 10 : 4 | no | no | 840 / 1050 | |
| 3 | Ab Wheel Rollout | ab-wheel-rollout | home | 8 : 8 | no | no | 1260 / 1050 | |
| 4 | Cable Crunch | cable-crunch | full_gym | 12 : 4 ; 15 : 2 | **COLLIDES** | no | 70 / 0 | |
| 5 | Hanging Knee Raise | hanging-knee-raise | hotel_gym | 10 : 4 ; 12 : 5 | **COLLIDES** | no | 0 / 0 | |
| 6 | Reverse Crunch | reverse-crunch | home | 12 : 2 ; 15 : 6 | **COLLIDES** | no | 70 / 0 | |
| 7 | Pallof Press | pallof-press | full_gym | 12 : 4 | no | no | 420 / 350 | |
| 8 | Russian Twist | russian-twist | home | - | no | **ABSENT** | 0 / 0 | |
| 9 | Dragon Flag | dragon-flag | hotel_gym | - | no | **ABSENT** | 70 / 0 | |
| 10 | Hanging Leg Raise | hanging-leg-raise | hotel_gym | 10 : 1 | no | no | 0 / 0 | |
| 11 | Weighted Decline Sit-Up | weighted-decline-sit-up | hotel_gym | - | no | **ABSENT** | 280 / 350 | |
| 12 | Cable Woodchopper | cable-woodchopper | full_gym | - | no | **ABSENT** | 0 / 0 | |
| 13 | Machine Ab Crunch | machine-ab-crunch | full_gym | - | no | **ABSENT** | 0 / 0 | |
| 14 | Standing Cable Oblique Crunch | standing-cable-oblique-crunch | full_gym | - | no | **ABSENT** | 0 / 0 | |
| 15 | Landmine Rotation | landmine-rotation | full_gym | - | no | **ABSENT** | 70 / 0 | |
| 16 | Toes-to-Bar | toes-to-bar | hotel_gym | - | no | **ABSENT** | 0 / 0 | |
| 17 | Bicycle Crunch | bicycle-crunch | home | - | no | **ABSENT** | 1120 / 1050 | |
| 18 | V-Up | v-up | home | - | no | **ABSENT** | 0 / 0 | |
| 19 | Standing Cable Crunch | standing-cable-crunch | full_gym | - | no | **ABSENT** | 0 / 0 | |
| 20 | Hanging Oblique Raise | hanging-oblique-raise | hotel_gym | - | no | **ABSENT** | 0 / 0 | |
| 21 | Back Extension | (none - static only) | - | 12 : 4 ; 15 : 6 | **COLLIDES** | no | cannot be emitted (not in EXERCISE_BANK) | |

**Tally.** 5 clean (one legacy value): Dead Bug, Bird Dog, Ab Wheel Rollout, Pallof Press, Hanging Leg Raise.
**4 COLLIDE:** Cable Crunch (12 vs 15), Hanging Knee Raise (10 vs 12), Reverse Crunch (12 vs 15), Back Extension
(12 vs 15; static-only, not in the bank, so no generator can emit it). **12 ABSENT:** Russian Twist, Dragon Flag,
Weighted Decline Sit-Up, Cable Woodchopper, Machine Ab Crunch, Standing Cable Oblique Crunch, Landmine Rotation,
Toes-to-Bar, Bicycle Crunch, V-Up, Standing Cable Crunch, Hanging Oblique Raise.

Of the 10 distinct rep-based core movements the generators actually emitted in the sweep: 4 clean (Dead Bug,
Bird Dog, Ab Wheel Rollout, Pallof Press), 2 collide (Cable Crunch, Reverse Crunch), 4 absent (Bicycle Crunch,
Dragon Flag, Weighted Decline Sit-Up, Landmine Rotation).

## Timed core movements (5, listed for completeness, no number requested)

Plank 60 s, Side Plank 45 s, Hollow Body Hold 30 s, Copenhagen Plank 30 s, McGill Curl-Up 10 s. These are each
entry's own `secs`, authored by Kerwin 2026-07-13; the sources are silent on isometric durations (D25). Tagged
`authored-secs-uncited`. They are not part of this request, but the same "uncited" label applies.

## What is still blocked on Kerwin (not solved here)

1. The per-movement values and their dated decision record.
2. What to do where the legacy values collide (rows 4, 5, 6, 21).
3. Whether saved user programs migrate to new values or freeze at what they were generated with.
4. Whether the rehab movements (Dead Bug at minimum) need a safety pass before any value changes.

## How a ratified value will plug in (no code for it exists yet)

A future change, in one commit: adds a tag value for the ratified basis to `RX_BASES`, sets that tag on the
movement's bank entry together with the value and its citation, teaches `defaultPrescription` to read it, and
adds the numeric assertion to `scripts/core-rx-provenance-smoke.mjs`. Until then the fallback is the flat default.

## Appendix A - exact Notion edit text (NOT applied; this session writes no Notion)

**Where:** Exercise Science Research Canonical Reference (`399ca37f935b8172acaafc541b703726`), add a dated
section; amend the D6 and D10 notes in the Programming Doctrine mirror to point at it. BUG-95 row, `Code Fix`
property: append the "Plumbing" paragraph. Do not flip Status.

> **2026-10-13 - Core-block carve-out (BUG-95).** The rep bands in this reference (and DOCTRINE D10) were
> written for LOADED resistance work and do not apply to core. Per-goal variation of core reps is REJECTED:
> applying a loaded band to core is an extrapolation with a citation costume. Core is excluded from D6 volume by
> `!e.isCore` as a declared carve-out, and core SETS and core VOLUME remain ungoverned. The current flat core rep
> default of 10 is an UNCITED value, shipped to every rep-based core slot of every generated program; it is not a
> neutral default. It stays in force only as the fallback until Kerwin ratifies per-movement values in a dated
> decision record. Sources searched, all silent on core reps: DOCTRINE.md, research-report (8).pdf, Exercise
> Science Framework docx/csv, Exercise Science Schema v0.5, 5-Goal Taxonomy, this reference. Every core entry
> declares a prescription provenance tag (`rxBasis`); a form-only gate asserts the tag and deliberately asserts
> no numeric band.

> **Plumbing (BUG-95 Code Fix addendum, 2026-10-13).** Provenance tag `rxBasis` on all 25 bank core entries and
> all 80 static core literals; `prescriptionBasis()` reads it with the existing behaviour as fallback; gate
> `scripts/core-rx-provenance-smoke.mjs` (`npm run verify`). Output byte-identical: 1050 combos x (getProgram +
> buildDynamicProgram) full-JSON identical before/after, program-snapshot unchanged. Values unratified; fallback
> still in force. Still blocked on Kerwin: the values and decision record, collision handling, saved-program
> migrate-or-freeze, rehab safety pass.

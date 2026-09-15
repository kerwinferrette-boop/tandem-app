# The science is in the repo. It does not reach the program.

**Status: EVIDENCE, not a ruling.** Every DID row below was produced by **running the engine** and
reading its output (SC-03), not by reading source. Every SHOULD row cites a document that already
exists in this project. Nothing here is my own physiology claim.

This document exists to answer one question Kerwin asked directly:

> *"If you have the science, how is it not being applied? Why is it not being applied?"*

The answer is in §0. The rest is the inventory.

---

## 0. Why it is not being applied

Three mechanisms, each verifiable:

1. **Nothing forbids ignoring it.** `doctrine.mjs` has 26 ACTIVE invariants. **`oneRmFactor`
   appears zero times in it.** No invariant constrains exercise *selection*, split design, per-muscle
   weekly frequency, per-session volume magnitude, or within-block ordering. D6 checks only that
   volume is *ordered* across goals (`transform ≥ build_muscle ≥ fat_burn`) — never that any number
   is right. A gate that cannot see a rule cannot protect it, and every rule below is invisible.

2. **Four invariants are PENDING, which means they assert nothing.** D4b, D6b, D8, D28 are written
   down, tiered, and inert. **D6b is the MEV/MAV/MRV volume-landmark invariant.** It has been
   "documented" for months and enforces zero bytes.

3. **The skill's exit condition is "flag it."** `CLAUDE.md` §3 and the `exercise-science-research`
   skill both terminate at *"STOP. Flag the gap."* Flagging is therefore a legitimate completed
   state. Every item in §1 was flagged correctly, at least once, and then nothing happened —
   `docs/self-corrections.md` and the Notion Science Audit (2026-07-22) both contain live entries
   that have been open since they were written.

The failure is not ignorance. It is that **identifying a gap and closing it are two different
tasks, and only the first one was ever required.**

---

## 1. Documented in this project, absent from the engine

| # | SHOULD (source) | DID (measured) |
|---|---|---|
| G1 | **5 goals**, incl. `strength` (1-5 reps, 85-100% 1RM, 3-5 min rest) and `maintenance` — Notion *5-Goal Taxonomy* | **3 goals exist.** `doctrine.mjs:50` enumerates `fat_burn`/`build_muscle`/`transform`. `strength` and `maintenance` are unreachable. |
| G2 | **MEV/MAV/MRV per goal** — Hypertrophy 10/12-15/20+, Strength 4-6/6-8/10-12, Fat Loss 8/10-12/15+ sets·muscle·wk — v0.5 + docx §1 | **No volume-landmark table exists in code.** D6b is PENDING. |
| G3 | **Volume scales with training age** — Beg 6-8/9-12/15, Int 10-12/12-16/20, Adv 12-15/15-20+/30+ — Canonical Ref §1 | `experience` changes **nothing** in generated output. Verified across the 630-combo matrix. |
| G4 | **Full weight formula** `floor(1rm × load_coef × intensity_pct × skill_mod × sex_mod / incr) × incr`; skill_mod 0.85/1.00/1.05 — v0.5 Part 4 | `seedWeight()` is a **10-entry name matrix + a 4-entry equipment base × `oneRmFactor`**. No intensity_pct, no skill_mod, no sex_mod, no 1RM. |
| G5 | **Per-exercise load coefficients** (Bench 1.00, DB Bench 0.76, Leg Press 1.27, Goblet 0.17…) — v0.5 Part 3 | Not present in `EXERCISE_BANK`. **48 of 63 loadable compounds carry `oneRmFactor: null`**, so 12 barbell compounds all seed to an identical 95 M / 55 F. |
| G6 | ~~**Sex differentiation**: women 10-15 reps vs men 6-12~~ — **RETRACTED 2026-09-14**, see below | **Sex changes starting weight and nothing else** — and that is CORRECT. |
| G7 | ~~**Rest**: hypertrophy 60-90 s upper isolation / 90-120 s lower compound — PDF §3 p.6 [1]~~ — **INVERTED 2026-09-14**, see below | `PHASES.build_muscle` late-phase `restComp` = **135 s then 150 s** — which is DEFENSIBLE. |
| G8 | **Experience branching** (beginner machine-first, wider ranges, longer rest) — EPIC-8 | Planned/superseded. Unapplied. |
| G9 | **Ordering**: "large before small, multiple-joint before single-joint" — PDF §2 p.5 [8] | **Satisfied.** 0 of 360 sessions place a non-core compound after an isolation. This is the one rule the engine does honour. |

### Corrections after independent verification — `docs/citation-verification-2026-09-14.md` (2026-09-14)

Two rows above were **wrong in the direction of the arrow**, and the corrections matter more than
most of the gaps, because acting on either as written would have made the app worse. Struck rather
than deleted, per SC-02.

- **G6 is RETRACTED.** "Women 10-15 reps vs men 6-12" has **no support** and is contradicted by
  Roberts/Nuckols/Krieger 2020 (*JSCR*; same protocols, hypertrophy ES = 0.07 ± 0.06, P = 0.31,
  I² = 0) **and by this repo's own PDF §5**: *"Programming (rep ranges, frequencies, volumes) should
  be identical between sexes for equivalent goals; differences emerge only in load percentages."*
  The engine's current behaviour — identical reps and sets, differing only in starting load — is
  what the science says. **G6 was not a gap. Applying it would have shipped a falsehood.** The
  female 60-70% strength standards come from calculator sites `[31]`-`[36]`: engineering seeds, not
  science. Encode as a negative rule too: **no menstrual-cycle-phase periodization** (PMC10076834,
  PMC4236309).
- **G7 is INVERTED.** The cited 60-90/90-120 s band traces to **`[1]` tailoredcoachingmethod.com, a
  blog**, and its 90-120 s compound figure is **below** ACSM 2009's stated **2-3 min for multi-joint
  ("core") exercises** and contrary to Schoenfeld et al. 2016 (*JSCR* 30(7):1805-1812: longer rest
  produced greater strength AND hypertrophy). **The shipped 135-150 s sits inside ACSM's band.** The
  ruling `DOCTRINE.md:63` says is owed should retire the blog band, not the shipped value.
- **G3 and G2 are downgraded to UNVERIFIED / practitioner guidance.** The training-age volume ladder
  traces to a blog `[14]` and a calculator `[34]`; MEV/MAV/MRV is RP terminology with **no
  peer-reviewed validation found**. That `experience` changes nothing in output is still a real gap
  — but D6b may not be promoted on these numbers.
- **The hard-set blocker is half-cleared.** Pelland et al. 2025 (*Sports Med*, PMID 41343037) counts
  indirect sets at **0.5 ("fractional")** and reports that weighting fit hypertrophy better than 1.0
  or 0. **What counts as a "hard set" at all is still undefined** in any source reached.
- **Upstream, and the reason all of the above happened:** roughly a third of `research-report (8)
  .pdf`'s 54 sources are blogs, calculator sites or content farms — including the sole sources for
  rest intervals, weekly volume landmarks and every female strength standard. **An invariant whose
  only provenance is that PDF is not cited.** §5's tier labels must be read with that in mind.
- **ACSM 2009 is itself superseded** by the April 2026 stand (PMID 41843416, 137 systematic reviews,
  first update in 17 years). This repo cites nothing from it.

## 2. What the engine actually does instead

All measured.

- **Reps are goal-invariant inside the engine.** `defaultPrescription()` returns a flat
  `DEFAULT_REPS = 10` for every weighted lift on **both** paths. Goal enters reps **only at render**,
  via `effectiveReps(getPhase(...))`. Measured: `reps:10` on 756/756 weekly and 186/186 one-off
  prescriptions, identical across all three goals. **Consequence: a one-off day rendered outside a
  program surface carries `r=10` and no goal signature at all.**

- **`oneRmFactor` is the 4th comparator key, in both copies** (`select()` `:2118-2141`,
  `bank()` `:2332-2348`):
  `recentPenalty → isFresh → primaryMatchRank → oneRmFactor DESC → equipmentAvailabilityRank → name`.
  It is a **load-estimation coefficient being used as a relevance signal.** `programs.js:517-521`
  already admits this: *"The real fix is separating load-scaling from selection-priority into two
  fields; flagged as a future refactor, not done here."*

- **The Decline/Flat contradiction** (the case Kerwin caught by eye). Generated full_gym male chest
  day: `Decline Barbell Press 4×10 @100` → `Flat Barbell Press 4×10 @135` → `Cable Low-to-High Fly
  3×10 @35` = **11 pec-primary sets**. Decline wins slot 0 because `oneRmFactor` 1.07 > Flat's 1.00.
  Flat is a named `SEED_WEIGHTS` entry (135, factor never consulted); Decline is not, so it gets
  `95 × 1.07 → 100`. **The engine ranks Decline first because it claims you are 7% stronger on it,
  then prescribes 26% less weight.** Both claims come from the same field.
  Structural cause: `FOCUS_SLOTS.chest[0]` and `[1]` are **identical** requests
  (`["pec_major","pec","compound"]`), so two compound pec presses are guaranteed by construction.

- **Duplicate compound patterns**: 108/360 weekly sessions (30%) and 60/162 one-off (37%).
  `Assisted Pull-Up + Barbell Row` ×30 weekly, `Barbell Back Squat + Front Squat` ×6,
  `Decline + Flat Barbell Press` ×6 one-off. Cause is the same shape: `TEMPLATES.day3` asks
  `primary` for `['lat_dorsi']` and `secondary` for `['lat_dorsi','rhomboid']`.

- **Volume**: 90 of 1,620 group-session cells (5.6%) exceed 10 sets for one muscle in a single
  session. Weekly maxima: delts 32, back 24, chest 24, **core 36** — core is never scaled by
  `GOAL_VOLUME`.

- **Splits are governed by nothing.** 2d `Full Body A/B`; 3d PPL; 4d Upper-Push/Lower-Hinge/
  Upper-Pull/Lower-Quad; 5d +Shoulders+Arms; 6d PPL×2 +Hinge/Quad. Measured coverage holes:
  **at 2 d/wk hamstrings, biceps and triceps receive ZERO primary sets; at 3 d/wk hamstrings and
  calves receive zero. At 4 d and 5 d chest and back are each trained once per week while delts get
  2-3.** No invariant states which groups compose a day or what frequency a muscle is owed.

- **New computed-and-discarded instance**: 18 `Incline Push-Up` (`sub-ipu`, authored `rest:45`)
  render at `phase.restAcc`, because `honorAuthoredRest()` is called on the static-fallback return
  (`tandem.html:4318`) and never on the generated return (`:4304`).

- **Seed-load provenance**, 72 compounds: MATRIX 10 · BASE×factor 49 · cable-skips-factor 4 ·
  **ZERO 9**. Three inversions ship today: Decline BB 100 < Flat BB 135; Decline DB 32.5 < DB Bench
  50 (M); Decline DB 15 < DB Bench 20 (F). Female Stiff-Leg DL 55 vs RDL 35 — same movement pattern,
  57% apart, and the **opposite direction from the male table.**

## 3. Conflicts a ruling must resolve (I cannot)

1. v0.5's **goal-specific deload cadence** vs D4's **uniform 4-6 wk**.
2. `PHASES.build_muscle` restComp **135/150 s** vs the cited **90-120 s**.
3. Hypertrophy **6-12** (June doc) vs **8-15** (July doc). Notion says prefer July; nothing enforces it.
4. **Two competing MEV/MAV/MRV tables** in Notion.
5. The docx asserts **antagonist pairing** and *"supersets must not compromise primary lift loads"*
   with **no citation marker**, while the PDF explicitly states it contains **no systematic superset
   analysis**. Direct conflict between two in-repo sources.
6. Notion Science Audit 2026-07-22 already records four live should≠did gaps, all unruled:
   `PHASES.fat_burn` bottoms at 8·7·6, `PHASES.build_muscle` at 6·5·4, weekly sets goal-invariant,
   direct arm volume below MEV.

## 4. Where the sources genuinely run out — flagged, never filled

Stated so silence is not mistaken for permission:

- The corpus contains **no 1RM formula at all.** `calcRM` (Epley) has no basis in it.
- **No progressive-overload increment**, **no per-session volume cap**, **no weekly per-muscle
  frequency rule**, **no split-day exercise assignment**, and **1 of 20** Goal×Frequency
  combinations worked out.
- The PDF is explicit: *"The research provides no specific guidance on accessory exercise selection
  by goal."* And it offers **no guidance on ordering two compound variants of the same pattern** —
  "decline", "incline" and "flat bench" appear nowhere in the corpus (grep-verified).
- **Periodization Spec Parts D-H are declared unrecoverable by the page itself** ("Do not cite them").
- `notion-ai-search` is unavailable on this plan, so Notion coverage is keyword-bounded, and
  "Named Program Variants" could not be enumerated.

These are the items that require **external corroboration** (NSCA — the governing body for the NCAA
D1 standard Kerwin named — plus Renaissance Periodization, Schoenfeld/Baz-Valle, ACSM), not
invention.

## 5. Doctrine coverage, stated plainly

ACTIVE: D1-D3, D4-D7, D9-D27 (26). PENDING, asserting nothing: **D4b, D6b, D8, D28.**

`doctrine.mjs` structurally **cannot** see: Postgres, the render layer, nested or renamed helpers,
whether a citation says what it claims, runtime state, free-text semantics, PENDING invariants,
cross-copy duplication, or its own tier map's truthfulness.

SCIENCE_DEFAULT tier: D6, D10, D14, D15, D21, D27. **D15's 8-12 wk ceiling is uncited** (Kerwin's
ruling) and carries a pinned allowlist `'23wk[10,13]'` that exists solely because real programs
violate it. **D21 has no citation at all.**

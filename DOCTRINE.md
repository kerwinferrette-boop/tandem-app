# Tandem Programming Doctrine — the law every code change obeys

**Notion is the source of truth. This file is its executable mirror. `scripts/doctrine.mjs`
enforces it in `npm run verify`. All three stay in sync — `tandem-tpm` reconciles them.**

This exists because the app once drifted into re-rolling exercises weekly (incoherent, un-trackable)
while passing every structural gate — because nothing tested *doctrine*, only *legality*. That can no
longer happen: a change that violates the ACTIVE invariants below cannot ship.

## Source-of-truth Notion docs (authoritative — read before touching the program engine)
- **5-Goal Taxonomy** — the only valid goals + each goal's signature · `399ca37f935b81f193b4dd0d13775888`
- **Programming Architecture Reference** — skill-level exercise library, men-vs-women structure · `37aca37f935b811b90c7c880631c66a8`
- **Exercise Science Schema v0.5** — MEV/MAV/MRV, deload cadence, splits, superset schema, formula · `37bca37f935b81cb9478e4906ada58c9`
- **Competitive Strategy** — the brand/moat this all serves · `37aca37f935b814da680d8af798d51a0`
- **Periodization & Structured Program Engine spec — Parts A–C (residue transcription)** · `3a7ca37f935b81c3b6e0d6f7a9d9618f` — the original Parts A–H prose doc is confirmed nonexistent; Parts A–C were transcribed 2026-07-24 from executable residue (DELOAD_TABLE, doctrine gate comments, superset layer). Parts D–H are unrecoverable: NEVER cite them.
- **D16 · Two-tier doctrine + science_overrides sovereignty (EPIC-031)** · `3a7ca37f935b81ce8e88dff8a505fb12`
- **D4 · Deload cadence bounds + the ≤7wk single-block exemption (EPIC-033 F3)** · `3b3ca37f935b81e98b06e5f9516dd29c`

## The binding invariants (mirrored into `scripts/doctrine.mjs`)

| ID | Invariant | Status | Source |
|----|-----------|--------|--------|
| **D1** | Exercise selection is stable **within a mesocycle block** and refreshes only at block boundaries — never re-rolled weekly. Rotation cadence is now tiered by role (see D15): this governs accessories; primary/secondary compounds are stricter (D15). | ✅ ACTIVE | Spec Part A; variation research |
| **D2** | Only the canonical goals exist; each live goal generates a legal, non-empty program. | ✅ ACTIVE | 5-Goal Taxonomy |
| **D3** | Compound (multi-joint) work precedes isolation within every training day. | ✅ ACTIVE | ACSM progression models [8] |
| **D4** | A deload appears every 4–6 weeks, as the block-final week, at reduced volume (~40–50% sets cut, load held). The cadence is bounded on **both** sides: consecutive deloads are never closer than 4 weeks nor further apart than 6 (the gap is the *mesocycle length*, not the count of consecutive loading weeks). **Named exemption:** a program of **≤7 weeks is a single mesocycle** and carries no internal deload — its only reduced-volume week is the block-final one, which D14 then converts into a realization week. The exemption is bounded at T≤7 and does not extend to any longer program. The lower bound does NOT apply to the trailing tail after the last deload (11wk legitimately ends 1 week after its last deload — wk11 is its peak/test week). | ✅ ACTIVE | Spec Part B; v0.5 deload table; **D4 amendment page** `3b3ca37f935b81e98b06e5f9516dd29c` (RP §accumulation-to-MRV; Coleman et al. 2024 PMC10809978) |
| **D4b** | Deload cadence scales with training age — advanced trainees reach systemic MRV sooner and need a shorter accumulation block than beginners (RP: 3–4wk advanced vs up to 12wk beginner). `cfg.experience` exists but nothing in the deload layer consumes it. **Documented, not enforced**: promoting this needs Kerwin's ruling AND a cited source for the per-experience numbers — they are deliberately NOT invented here. | ⏳ when ruled | D4 amendment page `3b3ca37f935b81e98b06e5f9516dd29c` §5; RP "Progressing for Hypertrophy" |
| **D5** | Transform (antagonist supersets) and Fat Burn (short-rest circuits) are superset-driven; supersets never touch the primary compound block. | ✅ ACTIVE | 5-Goal Taxonomy; v0.5 |
| **D6** | Weekly working volume scales by goal in MEV order: Transform ≥ Build Muscle ≥ Fat Burn (v1 — goal differentiation). | ✅ ACTIVE | v0.5 volume table |
| **D6b** | Per-muscle weekly volume within the goal's MEV..MRV band + within-block MEV→MRV ramp. | ⏳ per-length meso | v0.5 volume table; Findings 3-remainder, 4 |
| **D7** | Per-length mesocycle layout (4–12 wk) matches the spec Part B table verbatim (deload-week placement). | ✅ ACTIVE | Spec Part B |
| **D8** | Strength uses zero supersets on primary lifts; Maintenance caps at MAV. | ⏳ when added | 5-Goal Taxonomy |
| **D9** | One-off "Build Me a Workout" is compound-first, tier-legal, dup-free — but EXEMPT by design from D1/D4/D7 (a single session is *allowed* to vary; that's its purpose). | ✅ ACTIVE | Home-Screen Program Builders |
| **D10** | Rep schemes honor each goal's band: Fat Burn ≥10 (high-rep circuits), Build Muscle 6–15 (hypertrophy, never 1–5 strength), Transform 8–12 (mixed). | ✅ ACTIVE | 5-Goal Taxonomy; research §Rep Ranges |
| **D11** | Monotonic progressive overload: the prescribed %1RM curve rises-or-holds every week and never dips ("reps down, weight up"); deloads are volume cuts (D4), not intensity dips. The 1RM driving the prescription is a **measurement** of real performance (running-max `calcRM`), never a scheduled ±% ratchet. | ✅ ACTIVE | research-report(8) §3 %1RM bands; progressive-overload principle |
| **D12** | 1RM estimation selects formula by rep range — Epley ≤12 reps, Mayhew above — instead of one linear formula for every set; the estimate is monotonic non-decreasing in reps at a fixed weight (more reps never shows a lower max). | ✅ ACTIVE | research-report(9) (Valyu, 2026-07-23) §1RM formula selection; monotonicity is an engineering correctness constraint, not a science claim |
| **D13** | Deload intensity is goal-specific: Build Muscle (Hypertrophy) deloads drop %1RM to the 60–70% band; Transform and Fat Burn deloads MAINTAIN intensity (volume-cut only). The stored/measured 1RM is never lowered by a deload regardless (D11). | ✅ ACTIVE | research-report(9) (Valyu, 2026-07-23) §Deload Intensity Management by Goal; Kerwin's explicit sign-off 2026-07-23 |
| **D14** | A deload week that is also the program's final week (every length except 11wk) is a REALIZATION week, not a light week: same reduced volume, but HIGH intensity (~90% 1RM) and LOW reps (a top single/triple/five) for every goal — tagged `day.realization`, never `day.deload`. | ✅ ACTIVE | Spec Part B (already named this pattern for the 11wk program); Kerwin's question 2026-07-23, "why would week 12 ... be a deload, instead of an all out max week?" |
| **D15** | Primary/secondary compound exercises are FIXED for the whole program (never rotate at block boundaries). Accessory rotation is tiered: the closest-pattern accessory per slot (acc1) rotates ~every 4-6 weeks; remaining isolation accessories rotate ~every 2-3 weeks (block boundary, D1's existing cadence). | ✅ ACTIVE | Spec Part A ("Primary compounds: fixed for the whole program" — already approved, never implemented); research-report(9) (Valyu, 2026-07-23) §Exercise Variation and Rotation Cadence |
| **D16** | Doctrine is two-tier. **SAFETY** invariants (D3 compound-first, injury filter, equipment tier, D11/D12 earned-only 1RM, never-superset-the-primary-block) bind EVERY program path — generated, authored, adopted; no override exists. **SCIENCE_DEFAULT** invariants (D1/D15 rotation, D4/D13/D14 deload shape, D6 volume order, D10 rep bands, superset-required clause of D5) bind the generated path; an authored program may deviate ONLY via a `science_overrides` key that matches an existing `program_principles` row (claim + rationale + citation). Override without principle row = hard fail in the doctrine gate AND at the DB trigger. Sovereignty without a cited principle is a D16 failure, not a loophole. | ✅ ACTIVE | D16 Notion page `3a7ca37f935b81ce8e88dff8a505fb12`; EPIC-031 plan §3; loop-config §Two-tier doctrine |

**D7 promotion note (2026-07-30):** researched before promoting, not assumed. The only recoverable
Part B content (Notion "Periodization & Structured Program Engine Spec — Parts A–C, residue
transcription") is the deload-week table itself, already implemented as D4/D14; Parts D–H are
explicitly flagged unrecoverable there, with no further scope claimed. D4 already checked
`deloadWeeks(T)`'s structural properties but never pinned the literal per-length values — D7 closes
exactly that one gap (`scripts/doctrine.mjs`), nothing more. If a future session recovers more of
the original spec, D7 may need to widen again.

PENDING invariants are law already — they're documented in the gate and become blocking the moment the
phase that makes them true ships. **Never weaken the gate to make a change pass. Never delete a PENDING.**
If the doctrine itself changes, change it in Notion first, then mirror here and in `doctrine.mjs` together.

## The rule for every Epic / Bug / QA entry
Every program-touching change must (a) name the governing Notion doc above, (b) state how it conforms to
the relevant D-invariant(s), and (c) pass `npm run verify` (which now includes the doctrine gate). A change
that re-rolls lifts weekly, drops a required deload/superset, or invents a non-canonical goal is **wrong by
definition** — not a judgment call.

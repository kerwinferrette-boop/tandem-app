# Research: "Focus this lift" — exercise-science + architecture grounding

**Scope:** Research only. No changes made to `tandem.html` or `programs.js`. Produced per
CLAUDE.md's Prime Directive and the `exercise-science-research` skill (source-first, no
program-logic fact stated from memory). Feature under research: Notion Epic
`3ddca37f935b817f8ff8d6fa1e1aec44` (EPIC-58, "Home/Plan/Log/Settings Nav Restructure + Muscle-Focus
Log Tab") — a Log-tab button that flags a lift as "focus," biasing future program generation toward
that lift's tagged muscle groups.

**Sources consulted, in the skill's mandated order:** `/DOCTRINE.md` → Notion (5-Goal Taxonomy,
Programming Architecture Reference, Exercise Science Schema v0.5, Periodization spec, and the
**Exercise Science Research — Canonical Reference**, Notion `399ca37f935b8172acaafc541b703726`,
which the project's own doctrine treats as the single source of truth superseding v0.5's Part 2
figures) → `research-report (8).pdf` + `Exercise Science Framework…docx/.csv` (repo) →
`council-transcript-2026-09-14-synergy-selection.md` (prior citable council verdict, directly
on-topic) → `programs.js` (current implementation, read directly, not inferred).

---

## Q1 — Is there a science-backed simultaneous-focus cap? Pure addition or does it require redistribution?

### SHOULD (per source)
- **D6b (ACTIVE, `DOCTRINE.md` line 40)**: per-muscle weekly volume must clear the goal's **MEV**
  floor (build_muscle 10, fat_burn 8, transform 10 sets/muscle/wk), sourced from **Canonical
  Reference §1**. Critically, **D6b's own text states MAV/MRV are "documented below, not
  gated — the source states them as open-ended ranges"** (`"20+"`, `"15+"`, `"18+"`). There is
  **no gated ceiling** on per-muscle volume anywhere in the current doctrine.
- **D6c (PENDING, `DOCTRINE.md` line 41)**: "within-block MEV→MRV ramp" is explicitly flagged as
  needing a numeric week-by-week cadence that **no source supplies**. This is the doctrine slot
  that would eventually govern "how much can volume for one muscle grow over time" — it is open,
  not built.
- `research-report (8).pdf` and `Exercise Science Framework…docx` were searched directly
  (keywords: `specializ`, `priorit`, `focus`, `emphas`, `simultaneous`, `concurrent focus`,
  `multiple muscle`) and are **confirmed silent** on simultaneous multi-muscle-group
  specialization/focus training generally — none of the "specializ" hits refer to a training
  protocol; they refer to needing more specialized *research sources*. No number for "how many
  muscle groups can be boosted at once" exists in any repo source.
- **Canonical Reference §1** (cited via D6b) does establish that **total weekly volume per
  muscle — not frequency — is the primary hypertrophy driver**, which bears on *how* volume
  should be delivered (Q2) but does not address a simultaneous-target count.
- The **2026-09-14 council** (`council-transcript-2026-09-14-synergy-selection.md`), while framed
  around a different bug (`oneRmFactor` tiebreak), ruled directly on the closest analogous
  mechanism — a coverage-seeking, per-muscle-underserved-wins selection score. Its Chairman
  synthesis names an explicit, load-bearing constraint that applies here without modification:
  *"a coverage-seeking ('most underserved wins') mechanism [needs] the identical soft-fallback
  pattern BUG-116's fix already established (never let the stricter rule empty a pool; fall back
  to the coarser rule when it would)"* — i.e., D18's non-starvation guarantee is a hard
  requirement for ANY new per-muscle steering mechanism, focus included.

### COULD (alternatives / tradeoffs found in source)
- **Redistribution** (take volume from non-focus muscles to fund the focus muscle) is never
  discussed anywhere in the corpus. It is not rejected — it is simply absent.
- **Pure addition** is the more source-compatible default only in the narrow sense that D6b's
  probe (`resolveGoalVolume`) already derives sets-per-exercise so the **worst-served** muscle
  clears MEV independently of any other muscle's total — nothing in that formula requires taking
  from one muscle to give to another. But this is a MEV-floor guarantee, not evidence that
  pure addition is *safe at the MRV end* — because MRV isn't gated (see above), pure addition has
  no existing ceiling check to violate, which is a gap, not a green light.
- Structurally, Tandem's day templates use **fixed exercise slots** (`FOCUS_SLOTS`,
  `programs.js:1896-1906`). Adding volume to a focus muscle without touching another muscle's
  slot only has two forms: (a) more sets on an exercise already occupying a slot for that muscle,
  or (b) a new slot/exercise, which either lengthens the session or displaces a slot currently
  assigned elsewhere. **No source discusses session-length or slot-count budget constraints.**
  This is a genuine architecture fork the science does not decide.

### OPEN GAPS (flagged, not invented)
1. **No numeric or structural simultaneous-focus cap exists in any source.** MRV is explicitly
   ungated (D6b), and D6c (the ramp that would eventually bound growth) is PENDING with no
   numeric cadence. Shipping a focus feature that stacks additively across multiple simultaneous
   targets has no doctrine backstop today. **Recommend before ship:** either (a) do the research
   work to promote D6c with a real MRV ceiling (exercise-science-research skill, not this
   document), or (b) treat "how many simultaneous focuses to allow" as a **product/UX guardrail
   decision**, not a science-derived number — this is a genuine judgment call the science doesn't
   decide → **`llm-council` candidate**, not a Kerwin ask, since the sources are silent and there
   are real architecture tradeoffs (session length vs. slot displacement) that need adjudication.
2. **Pure-addition vs. redistribution is unresolved and is an architecture fork, not a science
   question.** Recommend `llm-council` if/when this is scoped for implementation — same
   reasoning as (1): the fixed-slot day-template structure makes "pure addition" non-trivial in
   practice, and no source rules on session-length policy.
3. D6c's still-PENDING status means any volume-add mechanism for focus is building on top of an
   admittedly incomplete doctrine layer. Not blocking, but should be named as a dependency in the
   Epic, not silently assumed complete.

---

## Q2 — Should focus manifest as volume, selection-priority, frequency, or a combination?

### SHOULD (per source)
- **Canonical Reference §6, "Plateau-Breaking Logic"** (per D6b's citation trail, the project's
  stated single source of truth) gives the closest directly-relevant sequence found in any
  source: a readiness check, THEN **"shift rep range / substitute variation / add volume, or add
  frequency"**, escalating to a deload only if the problem persists. Read structurally, this
  orders levers as: **exercise-selection change first**, **volume or frequency as the next-tier
  escalation** — not volume as the default first move.
- **Canonical Reference §1** (again via D6b's citation) states plainly: *"total weekly volume per
  muscle — not frequency — is the primary hypertrophy driver... 2x/week and 4x/week per muscle
  produce equivalent hypertrophy when volume is matched."* This means an isolated **frequency**
  increase (e.g., an extra focus-only session) has **no independent benefit** per this source
  unless it is the delivery vehicle for more total volume — frequency alone is not a productive
  lever.
- **D20 (ACTIVE)** is a direct, already-shipped architectural precedent for a **selection-priority**
  mechanism: `getSingleDay`'s steering block (`opts.recentExposure`, `steeringActive`,
  `isRecent()`, `recentPenalty()`, `select()`) reorders an already-legal candidate pool by a
  per-muscle signal, **never** hard-excluding — the exact "reorder, never empty a slot" shape a
  focus-priority boost would need.
- **D27 (ACTIVE)** — exercise-selection continuity across regenerations — is a second, independent
  precedent for priority-based (not volume-based) bias already living in the codebase.
- **D18 (ACTIVE)** — non-empty candidate pool guarantee — binds any new steering term the same way
  it binds D20's today.
- **D1/D15 (ACTIVE)** — primary/secondary compounds are held stable for a whole primary block
  (8-12wk minimum). A focus mechanism that reprioritizes *which* exercise fills a slot must not
  cause a mid-block re-roll of the primary compound outside D15's refresh cadence.
- The **2026-09-14 council's** Phase 1 recommendation (accepted synthesis, not just one advisor)
  is a **selection-time comparator score** built on a per-user, per-muscle **weekly volume
  ledger**, positioned in an explicit precedence chain: eligibility filter → new score → D20
  recency → `oneRmFactor` → equipment tiebreak. This is a directly transferable, already-endorsed
  architecture for exactly the shape of "weight generation toward an under/over-served muscle" —
  it was designed for a different bug, but the mechanism is what a focus-bias term should extend.

### COULD (alternatives / tradeoffs, per source)
- **Pure volume increase** (raise the effective MEV/target for focus muscles): risky per Q1's
  finding that MRV is ungated — nothing stops this from silently exceeding a recovery ceiling the
  doctrine hasn't numbered yet (D6c PENDING).
- **Pure frequency increase** (add a focus-specific session/day): contradicted by Canonical
  Reference §1's frequency-equivalence finding *unless* frequency is purely a volume-delivery
  mechanism (spreading the same or more total sets across more sessions), not an independent
  booster.
- **Selection-priority first, volume/frequency as escalation** is the best-supported synthesis of
  Canonical Reference §6's ordering plus the already-live D20/D27/council-Phase-1 architecture —
  but this is a **synthesis across sources**, not one citation that names this exact combination
  for a "focus" feature. Flagging explicitly: this reasoning is mine, built from the cited
  sources, not a directly-quoted ruling. It should get its own should/could/did audit once
  implementation is actually scoped, per CLAUDE.md.

### OPEN GAPS
- No source names "Focus this lift" or ranks these three levers for this specific feature. The
  answer above is a reasoned synthesis, not a single citable ruling — treat it as a strong
  starting hypothesis for implementation, re-validate with its own audit at build time.

---

## Q3 — Existing programs.js owners a focus boost must extend, not duplicate

Per "one rule, one home" (CLAUDE.md) and the council's own convergent finding (*"no doctrine gate
proposed for the new rule... precisely the kind of silo 'one rule, one home' exists to prevent"*),
here is every existing owner a focus mechanism touches:

| Concern | Owner | Location | Notes |
|---|---|---|---|
| Per-muscle weekly volume ledger | `computeMuscleWeeklyVolume()` | `programs.js:2789-2802` | **The designated extension point.** Its own comment (`programs.js:2786-2788`) states it is "consumed by D6b's assertion AND... the Synergy-Aware Exercise Selection Epic's Phase 1 ledger, not two competing implementations." A focus feature needing per-muscle volume awareness should read from/extend this, not build a parallel tracker. Currently only consumed by `resolveGoalVolume()`'s unit-volume probe — the council's Phase 1 selection-time consumer was designed but is **not yet wired into a live comparator**. |
| Per-muscle MEV floor + goal volume table | `VOLUME_LANDMARKS` | `programs.js:2759-2761` | D6b's data owner (MEV only; MAV/MRV are comments, not gated values). |
| Sets-per-exercise derivation | `GOAL_VOLUME` / `resolveGoalVolume()` / `applyGoalVolume()` | `programs.js:~2682-2748` | Single owner of "how many sets per exercise, per goal, per day-count." Any focus-driven set increase must flow through here, not a second hand-tuned table (this is exactly the kind of "flat table vs. derived" mistake D6b's own history (the 90/216-failing flat `GOAL_VOLUME`) already paid for once). |
| Canonical muscle-group token list | `MAJOR_MUSCLE_GROUP_TOKENS` | `programs.js` (near `VOLUME_LANDMARKS`) | Consumed by the MEV probe; a focus target's muscle group must resolve against this same token set. |
| Anchored muscle-tag matching | `groupsMatch()` / `primaryOnlyMatch()` (D19) | `programs.js` | Must be reused unmodified to match a focus-target muscle against `EXERCISE_BANK` tags — this is the exact function BUG-87 proved unsafe to reimplement ad hoc (unanchored `startsWith`). |
| One-off engine's existing per-muscle steering | `getSingleDay()`'s `select()` steering block (D20) | `programs.js:~1983-2085+` | The one live precedent for "reorder a legal pool by a per-muscle signal, never exclude." The shape a focus-bias term should mirror. |
| Periodized engine's candidate pool / tiebreak chain | `bank()` inside `buildDynamicProgram()` | `programs.js:~2280-2360` | Currently has D18 fallback, D19 matching, a narrow OR-slot coverage tiebreak (D6b's BUG-117-shape fix), `oneRmFactor`, `EQUIPMENT_AVAILABILITY_RANK` — **but no D20-equivalent general per-muscle priority steering.** This is the real gap: a focus feature needs a **new comparator term added to `bank()`'s existing precedence chain**, not a new parallel selection function. |
| Deload cadence | `DELOAD_TABLE` / `deloadWeeks()` (D4) | `programs.js:~2670-2848` region | Any volume increase from focus must still respect scheduled deload cadence — a focus boost must not delay/disable a due deload. |
| Namespace collision to flag explicitly | `FOCUS_SLOTS` | `programs.js:1896-1906` | **Not related to the new feature** — this is the existing day-template/body-part split table (chest/back/legs/etc). The literal name "focus" is already in use for something else in this file. Implementers must not confuse or overload this table; the new feature needs its own name in code even if the product calls it "Focus this lift." |

**Architecture roadmap already agreed by Kerwin**: the 2026-09-14 council's Phase 1 design
(selection-time comparator reading a per-user per-muscle weekly-volume ledger, precedence-ordered
above D20/`oneRmFactor`) is the accepted shape for "bias generation toward a specified muscle." A
focus-bias term should be built as an **instance of that already-approved design**, extending
`computeMuscleWeeklyVolume()` and `bank()`'s existing comparator chain — not a new mechanism.

---

## Summary of open gaps requiring a decision before implementation

1. No source bounds the number of simultaneous focus targets — MRV is ungated, D6c is PENDING.
   Needs either a real D6c research pass or an explicit product-level guardrail; recommend
   `llm-council` if a number is needed without new research, since it's a genuine judgment call.
2. Pure-addition vs. redistribution is an unaddressed architecture fork (fixed slot templates)
   with no ruling in any source — recommend `llm-council`.
3. The volume/selection/frequency manifestation answer (Q2) is a reasoned synthesis across
   Canonical Reference §1/§6 + D20/D27/council-Phase-1, not one direct citation naming this
   combination for this feature — re-audit with its own should/could/did once implementation is
   scoped.
4. `bank()` (periodized engine) has no D20-equivalent priority-steering mechanism today — this is
   confirmed by reading the code, not inferred, and is the concrete extension point Wave work
   would need to add.

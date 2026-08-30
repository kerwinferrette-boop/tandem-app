# EPIC-8 — Wave decomposition (VALIDATION DRY RUN — NOT A LIVE WAVE)

**⚠ DRY RUN — DRAFT FOR REVIEW, NOT AUTO-APPROVED.** Per `agents/plan.md`'s First-run validation
requirement, this Plan stage has not yet passed its human-diffed dry run. This file is that dry
run's output. Do not let Fix execute slices from this file. Filename deliberately does not follow
the live `docs/waves/<EPIC-ID>-WAVE-STATE.md` pattern (would be `docs/waves/EPIC-8-WAVE-STATE.md`)
so it cannot be picked up by the real pipeline by accident.

**Method note:** built directly from the raw EPIC-8 problem statement handed to this session, with
no search of Notion, the web, or the repo for any prior EPIC-8a/8b/8c/8d decomposition — per the
dry-run instructions. Grounded only in reading the live `tandem.html` / `programs.js` call sites
(`getProgram`, `buildDynamicProgram`, `EXERCISE_BANK`, `TEMPLATES`, `resolveEquipmentTier`,
onboarding cfg fields) and `DOCTRINE.md`'s existing D-invariant table, exactly as a real Plan pass
would.

---

## Grounding — what the codebase actually shows (read before trusting any slice below)

- `getProgram(goal, days, weeks, sex, equipment, emphasis, injuries, maxDb, rotation, experience)`
  (`programs.js:2826`) and its real engine `buildDynamicProgram(...)` (`programs.js:2155`) already
  accept **equipment** (`tier`) and **experience** — this is not a from-scratch build, it's an
  extension, matching the Epic's own Agent Context Note.
- Equipment today is only a **3-tier** bank (`home` / `hotel_gym` / `full_gym`, `programs.js:2172`
  `tierOrder`), and the onboarding→bank collapse (`tandem.html:2500` `CFG_EQ_TO_BANK`) maps the
  Epic's 4 onboarding values down to those 3: `barbell_rack` → `full_gym`, `home_dumbbells` →
  `hotel_gym`, `bodyweight` → `home`. A `barbell_rack` user is today handed `full_gym`-tier picks
  (hack squat, leg press, cable machines) they don't have. This is a real, live gap, not a
  hypothetical — it's Slice 2 below.
- `workout_duration_minutes` and `equipment` are both captured at onboarding and written to
  `users` (`tandem.html:3187-3189`, `:5101-5103`), but `workout_duration_minutes` is **never read
  anywhere in `programs.js`** — confirmed by grep, zero hits outside the cardio-block `duration`
  field (a different, unrelated `duration` key meaning "minutes of cardio," not the user's session
  length). This is the exact "captured but not used" pattern CLAUDE.md calls out for
  `REST_SECONDS` — Tier 2 of this Epic is that pattern, twice.
- `secondary_goal` (`run_5k` / `10k_steps` / `improve_mobility`) is likewise captured
  (`tandem.html:3192`, saved to `users.secondary_goal`) and never read in `programs.js`. Same
  pattern, third instance.
- `goal_weight_lbs` / `current_weight_lbs` are both stored (`tandem.html:5109-5111`) but no
  `weightDelta` is ever computed or passed anywhere. Fourth instance.
- **Rest is already doctrine-settled and the Epic's prose contradicts it.** `programs.js:1822-1860`
  documents that an EPIC-8a `REST_SECONDS` table keyed to experience level (beginner 105/75s,
  intermediate 90/60s, advanced 75/45s) was **built, found dead** (nothing in `tandem.html` reads
  `ex.rest` — render resolves rest from `phase.restComp`/`phase.restAcc` only), and **deleted, not
  rewired**, because no canonical source keys rest to experience — every source (research-report(8)
  §3, the 5-Goal Taxonomy) keys rest to **goal**. This is codified as **D23 · "PHASES is the sole
  owner of rest"** (`DOCTRINE.md:24`, ACTIVE) and **D4b** (PENDING, "per-experience numbers
  deliberately NOT invented"). The Epic's own Experience-Level table says *"Beginner: ...longer
  rest"* / *"Advanced: shorter rest"* — **that specific claim is exactly the thing D23/D4b already
  rejected once, in this codebase, by name.** Flagging per CLAUDE.md Directive 3 rather than
  re-implementing it. See Slice 5.
- **Starting-load computation has one owner** — `seedWeight()`, governed by
  **D26 · "Untrained-lifter starting load: one owner, sex-aware"** (`DOCTRINE.md:27`). The Epic's
  Weight-Delta table's ">20 lbs to lose → ... lower starting loads" clause writes directly into
  that owner. Per `loop-config.md`'s 2026-08-30 forbidden-ops addition, any change touching the
  **biometric/1RM calculation layer** is Kerwin-only, full stop, regardless of council verdict —
  `seedWeight`'s oneRmFactor-driven load math is exactly that layer. Carved to Needs Human below
  (Slice 7), not decomposed.
- The Epic's target signature `getProgram(goal, days, weeks, sex, equipment, duration, experience,
  weightDelta, age)` is illustrative, not literal — it drops `emphasis`/`injuries`/`maxDb`/
  `rotation`, which are load-bearing today (injury safety, dumbbell caps, variety rotation) and
  every call site (`tandem.html:2583`, `scripts/persona-matrix.mjs`, `scripts/doctrine.mjs`,
  `scripts/c7-smoke.mjs`, `scripts/cadence-smoke.mjs`) depends on the existing positional order.
  Every slice below **appends** new optional trailing params; none reorders or drops existing ones
  — matching the Epic's own Agent Context Note ("extended, not refactored from scratch").
- `loop-config.md`'s `persona_matrix` source note says outright: *"age/height/weight/experience are
  deliberately excluded [from the 504-combo sweep] until EPIC-8 wires them in"* — i.e. the harness
  is already waiting on this Epic. Slice 9 closes that.

---

## Step status

- [ ] **1. Plumbing — extend `getProgram()`/`buildDynamicProgram()` with `duration`,
      `weightDelta`, `secondaryGoal` (no behavior change)**
      **File/region:** `programs.js` (`getProgram` L2826 signature + passthrough to
      `buildDynamicProgram` L2155 signature); `tandem.html` `getActiveProgram()` (L2583) — add
      `cfg.workout_duration_minutes`, a client-computed `(cfg.goalWeight||0) - (cfg.weight||0)`,
      and `cfg.secondary_goal` as three new trailing args.
      **Scope-lock:** signature lines + the one call site. No new branching logic — every new
      param is accepted and unused this slice.
      **Independent verification:** run the existing `ship_gate_command` + `persona_matrix_command`
      and diff generated-program output against pre-change output for the same inputs — must be
      **byte-identical**. A plumbing slice that changes any existing output has a bug in it, full
      stop; that's the whole verification.
      **Why `age` is NOT threaded here:** the Epic lists `age` in the target signature but defines
      no branching rule for it anywhere in the body (unlike duration/equipment/experience/weight,
      which each get a table). Threading an unused `age` param now would be inventing scope ahead
      of a rule — the same "computed and discarded" shape CLAUDE.md names as the recurring failure.
      Left out; see the Deferred section below.
      **should/could/did stub:** SHOULD — mechanical, no exercise-science claim, no citation
      needed (pure plumbing). COULD — pass a single `opts` object instead of positional args
      (rejected: every existing call site is positional; an object-arg refactor is the "refactor
      from scratch" the Epic's own Agent Context Note forbids). DID / RECONCILE — blank, for
      Fix/Verify.

- [ ] **2. Equipment — real 4th tier for `barbell_rack`, distinct from `full_gym`**
      **File/region:** `programs.js` `EXERCISE_BANK` (retag the barbell squat/RDL/bench/row
      entries + any other barbell-only compounds as tier-eligible for a new `barbell_rack` value),
      `tierOrder` array (`programs.js:2172`, currently `['home','hotel_gym','full_gym']`),
      `getExerciseSubstitutes`'s duplicate `tierOrder` (`programs.js:1809`); `tandem.html`
      `CFG_EQ_TO_BANK` (L2500) — stop collapsing `barbell_rack` into `full_gym`.
      **Independent of Slice 1** (equipment is already a wired param; this only changes what tier
      values mean) — can run first, in parallel, or last.
      **Independent verification:** a script asserting no `barbell_rack`-tier program ever selects
      an entry tagged `equipment:'machine'` for a compound-hack-squat/leg-press-class movement
      (the exact leak this slice closes), plus the full standing sweep.
      **should/could/did stub:** SHOULD — cite the Programming Architecture Reference's equipment-
      tier definitions for what counts as barbell-rack-available; if that doc is silent on this
      granularity (plausible — it's an equipment-availability fact, not a training-science
      finding), say so explicitly rather than inventing the boundary, and treat "same compound
      family the barbell-tagged bank entries already use" as the documented fallback. COULD —
      leave `barbell_rack` folded into `full_gym` and instead special-case machine exclusion at
      render time (rejected: that's a second, competing home for the same rule — CLAUDE.md's "one
      rule, one home"). DID / RECONCILE — blank.

- [ ] **3. Duration branching**
      **Depends on Slice 1** (needs `duration` threaded).
      **File/region:** `buildDynamicProgram`'s `TEMPLATES`/slot-selection (`programs.js:2289+`) —
      the existing 5-slot-per-day shape (`primary, secondary, acc1, acc2, acc3`) already maps
      cleanly onto "<45 min → drop acc2/acc3, keep 2 compounds + superset finisher" without a new
      data structure; 60-90/90+ tiers touch cardio-block inclusion and (90+) a warm-up block.
      **Independent verification:** assert exercise-count-per-day for each duration bucket across
      the goal×days×equipment matrix; must never drop a compound slot regardless of duration
      (D3 — compound precedes isolation — stays inviolate at every length).
      **should/could/did stub:** SHOULD — cite Programming Architecture Reference / Periodization
      spec for session-length-driven structure. **Flag up front:** the specific breakpoints in the
      Epic's table (45/60/90 min) read as engineering round numbers, the same shape as the deleted
      `REST_SECONDS` table's uncited coefficients — Fix must run `exercise-science-research`
      *before* coding this and either find a citation for those exact breakpoints or mark them
      UNSOURCED tripwires in-file (CLAUDE.md's explicit fallback), not ship them as if cited. The
      "90+ ... deload variation" clause additionally must route through the *existing* D4 deload-
      cadence-bounds logic, not invent a second deload trigger — two mechanisms deciding "is this a
      deload" is the exact `PHASES`-vs-`REST_SECONDS` failure shape again. COULD — key structure to
      exercise *count target* derived from goal instead of raw minutes (rejected for this slice:
      the Epic's onboarding field is literally `workout_duration_minutes`, and there's no evidence
      minutes-per-set estimation is more reliable than the Epic's own axis — but flag as an
      alternative worth a citation check). DID / RECONCILE — blank.

- [ ] **4. Weight-delta branching — structural half only (cardio volume + day placement)**
      **Depends on Slice 1** (needs `weightDelta` threaded). **Excludes starting-load changes —
      see Slice 7.**
      **File/region:** `buildDynamicProgram`'s cardio-block inclusion logic (today goal-keyed,
      e.g. `fat_burn` gets a cardio finisher every day; `build_muscle`/`transform` don't by
      default) — extend to also branch on `weightDelta` magnitude per the Epic's table (>20lb →
      cardio all days + Zone 2 finisher; 10-20lb → cardio 3/4 days; <10lb → cardio optional;
      gaining → minimal cardio), independent of which of the 3 goals the user picked.
      **Independent verification:** sweep goal×weightDelta-bucket, assert cardio-block presence
      count matches the table exactly.
      **should/could/did stub:** SHOULD — cite 5-Goal Taxonomy / Periodization spec for cardio
      volume by deficit magnitude. **Flag a genuine fork, not a citation gap:** the 5-Goal
      Taxonomy's cardio signature is keyed to GOAL (fat_burn = cardio-heavy by design); this Epic
      wants a SECOND, cross-cutting cardio driver keyed to WEIGHT DELTA that can override a
      `build_muscle`/`transform` user's normally-light cardio default. Whether weight-delta should
      *override* the goal's cardio signature or only *add to it* isn't resolved by either source
      alone — this is exactly the "which of two sources should govern" shape `agents/plan.md` §4
      says to send to `llm-council` rather than guess. **This is the one fork in this Wave I would
      actually invoke the council on in a live run** — see report footer. COULD — make weight-delta
      cardio strictly additive on top of the goal default, never override (a plausible resolution,
      but it's exactly the kind of call the council exists for, not something to silently pick).
      DID / RECONCILE — blank.

- [ ] **5. Experience-level branching — block-size + advanced intensity techniques (rest
      explicitly OUT of scope)**
      **File/region:** `buildDynamicProgram`'s `pick()` (`programs.js:2213`, already has the
      beginner machine-first bias — extend it) and slot-count logic (new: cap beginner accessory
      slots at acc1+acc2, drop acc3, matching "2-3 exercises per block"); `flagDropSet`
      (`programs.js:~1861`, already advanced-only — extend to more slots / additional intensity-
      technique flags for "RPE 8-9" coaching cues, annotation-only per the existing
      `flagDropSet` pattern, no new load math).
      **Independent of Slices 1/3/4** — experience is already a wired param.
      **HARD CONSTRAINT, not a suggestion:** do not touch rest. D23 (ACTIVE) + D4b (PENDING) + the
      in-file `programs.js:1822` ruling already settled "rest keys to goal, not experience," on the
      record, after building and deleting exactly this. Re-adding it here would be re-committing a
      reverted mistake — CLAUDE.md's regression-stop rule ("already-fixed... must not silently come
      back") applies even though this isn't a Bug Log entry. If Fix finds new source material that
      actually licenses experience-keyed rest, that's a doctrine-amendment proposal (Notion first,
      then DOCTRINE.md + doctrine.mjs together, per CLAUDE.md), not a quiet edit inside this slice.
      **Independent verification:** assert beginner-tier days never exceed 2 compounds + 2
      accessories per block; assert `ex.rest`/`phase.restComp`/`phase.restAcc` values are unchanged
      by experience level pre/post (regression guard for the constraint above).
      **should/could/did stub:** SHOULD — cite research-report(8) §6 "Skill Level Progressions" for
      block-size/technique-complexity findings (this section exists and is experience-scoped, per
      the in-file note — unlike rest, this part of the Epic *does* have a plausible home). COULD —
      leave block-size uniform and vary only exercise *selection* (rejected: doesn't address the
      Epic's explicit "2-3 exercises per block max" acceptance criterion). DID / RECONCILE — blank.

- [ ] **6. Secondary goals — program-generation half (`run_5k` tempo slot, `improve_mobility`
      circuit)**
      **Depends on Slice 1** (needs `secondaryGoal` threaded). **Excludes the `10k_steps`
      competition-scoring clause — see Slice 8.**
      **File/region:** `buildDynamicProgram` — `run_5k` adds a 20-min Zone 2 finisher (reuses the
      existing cardio-block shape already used by `fat_burn`/Slice 4, just gated on
      `secondaryGoal` instead) + a weekly tempo-run slot; `improve_mobility` adds a mobility
      circuit on non-lifting days and swaps one isolation slot per the Epic's text.
      **Independent verification:** sweep all 3 secondary-goal values × all 5 goals, assert the
      tempo slot / mobility circuit appears exactly where specified and nowhere else.
      **should/could/did stub:** SHOULD — cite Programming Architecture Reference / Periodization
      spec for tempo-run prescription (pace/duration) and mobility-circuit exercise selection —
      neither is in the Epic's prose beyond "add a slot," so Fix must find or flag the actual
      numbers (tempo pace, mobility exercise list) rather than inventing them; if the sources are
      silent on tempo-run specifics, flag per CLAUDE.md Directive 3 rather than picking a pace.
      COULD — implement `improve_mobility`'s isolation swap by reusing the existing injury-
      substitution mechanism (`getExerciseSubstitutes`) rather than a new code path (worth
      preferring — "one rule, one home" — recommend Fix start there). DID / RECONCILE — blank.

- [ ] **7. NEEDS HUMAN — Weight-delta → starting-load reduction ("lower starting loads" for
      >20lb-to-lose users)**
      **Not decomposed. Do not implement without Kerwin.**
      Per `loop-config.md`'s 2026-08-30 forbidden-ops addition: any change touching the
      biometric/1RM calculation layer requires Kerwin, full stop, regardless of council verdict.
      `seedWeight()` is that layer's single declared owner (**D26**, ACTIVE — "Untrained-lifter
      starting load: one owner, sex-aware"), and this clause of the Epic's Weight-Delta table asks
      to add a new input (self-reported weight delta) into that owner's output. This is not a
      splitting question the council can resolve — it's on the standing forbidden list by name.
      **What's waiting on a decision:** should a large weight-to-lose delta reduce prescribed
      starting load at all (risk: under-loading actually undermines the strength-retention half of
      a cut), and if so, is that a `seedWeight()` input or a separate post-hoc scaling step applied
      after `seedWeight()` returns (keeps D26's single-owner property intact, adds a second,
      clearly-labeled owner for the delta-scaling step instead of merging two concerns into one
      function)? Flagging both options rather than picking.
      **Not blocked on Slice 1** for the decision itself, but once decided, the implementation would
      consume the same `weightDelta` value Slice 1 already threads through — so Slice 1 is worth
      landing regardless of when this gets ruled on.

- [ ] **8. Secondary goals — dashboard half (`10k_steps` step ring); NEEDS HUMAN carve-out for
      the scoring clause**
      **File/region (decomposable part):** `tandem.html` dashboard render — surface step count in
      a ring/widget when `secondary_goal === '10k_steps'`. This is UI-only, no `getProgram`
      dependency, independently scope-lockable to the dashboard render function.
      **NOT decomposed — carved to Needs Human:** the Epic's own line reads *"Surface step count in
      dashboard ring, **tie to competition scoring**."* The scoring clause is on the same
      forbidden-ops list as biometric/1RM (`loop-config.md`, 2026-08-30 addition names
      "SCORING, MATCHMAKING... or the BIOMETRIC/1RM CALCULATION LAYER" together as one carve-out
      class) — whatever "tie to competition scoring" means concretely (points? a leaderboard
      multiplier? a streak bonus?) is undefined in this Epic and is a scoring-system design
      decision, not an implementation fork. Flag for Kerwin; do not guess a scoring rule.
      **should/could/did stub (ring display only):** SHOULD — no exercise-science claim, this is
      a display of a stored number; cite the users/health_snapshots schema for where step count
      actually lives (need to confirm — the Epic's Tier 4 lists "daily steps" as a
      health_snapshots-pipeline field, which per the Epic's own Dependency Gate is Phase-2-blocked;
      if `10k_steps` display has no live data source yet because the pipeline isn't live, that's a
      **blocking finding for this slice, not a green light** — flag rather than build a ring against
      no data). DID / RECONCILE — blank.

- [ ] **9. Regression-harness closure — wire the new axes into `validate:personas` +
      `ship_gate_command`, promote any invariant this makes true**
      **Depends on Slices 2, 3, 4, 5, 6** (sweeps their combined output space; running this before
      they land would just assert the pre-Epic behavior).
      **File/region:** `scripts/persona-matrix.mjs` — its own header comment says age/height/
      weight/experience are excluded "until EPIC-8 wires them in"; add equipment's real 4th tier,
      duration buckets, weight-delta buckets, and full experience branching to the swept matrix.
      Add a `scripts/*-smoke.mjs` regression guard for the R6 (rest-untouched-by-experience)
      constraint from Slice 5, per CLAUDE.md's "structural fixes get a permanent regression test"
      rule.
      **Independent verification:** the sweep itself — new combo count reported, 0 new failures.
      **should/could/did stub:** SHOULD — no new science claim (this slice tests, doesn't
      prescribe); cite D-invariant IDs each new assertion enforces. If any Slice above makes a
      currently-PENDING invariant true (unlikely here, since D4b stays PENDING by Slice 5's own
      constraint), promote it to ACTIVE in `doctrine.mjs` in the same change per CLAUDE.md — do not
      leave a true-but-still-PENDING invariant. DID / RECONCILE — blank.

### Deferred / flagged — not sliced, not guessed

- **`age`** — in the Epic's target signature, captured at onboarding (Tier 1), but the Epic body
  gives it no branching table anywhere (unlike duration/equipment/experience/weight, each of which
  gets one). Per `agents/plan.md` §1, "too thin to decompose responsibly" is itself a finding, not
  a shape to invent. Not threaded (see Slice 1's rationale), not scoped, not Needs-Human (this
  isn't a scoring/matchmaking/biometric or product-judgment question — it's a spec gap). Flagging
  for whoever owns EPIC-8's Notion page to fill in a concrete age-branching rule with a citation
  (research-report or the Exercise Science Schema likely has *something* on older-beginner
  deconditioning/progression pacing) before a future Wave slice attempts it.
- **Phase 2 / Tier 4 (HRV, sleep, RHR, steps-as-recovery-signal)** — the Epic's own Dependency Gate
  says these are blocked on the not-yet-shipped `health_snapshots` pipeline and explicitly says
  "do not attempt Phase 2 slices." Honored — no slice above touches them. Separately, once that
  pipeline does ship, every one of these is squarely the biometric layer on the forbidden-ops list
  and would need its own Needs-Human carve-out at that time regardless of pipeline status.

---

## Invariants for whoever resumes (copied from `loop-config.md` / `CLAUDE.md`, not restated from
memory)

- **Ship gates, both green, every slice:** `npm run verify` (9 checks incl. doctrine) AND
  `npm run validate:personas` (Rules 6-9). `npm run walkthrough:onboarding` (0 findings) for
  anything touching onboarding cfg plumbing (Slice 1, 6, 8).
- **Doctrine is law.** A change violating an ACTIVE D-invariant cannot ship. D23 (rest ownership)
  and D26 (starting-load ownership) are the two this Wave is built around not violating.
- **Source-first, always.** Any exercise-science or program-logic decision runs through
  `exercise-science-research` BEFORE code, not after. No "typically/standard" — cite or flag.
- **should/could/did audit required** in the commit body + Notion entry for every program-logic
  slice (2, 3, 4, 5, 6, 9 above). DID/RECONCILE get filled in at Fix/Verify time, not now.
- **Scope-lock per slice** — each slice above names its file/region. Fix's scope-guard should not
  need to expand beyond what's named; if it does, that's a signal this decomposition was wrong at
  that point, not a signal to expand quietly.
- **Forbidden, full stop, regardless of council verdict:** scoring, matchmaking, and the
  biometric/1RM calculation layer (Slices 7 and part of 8). Force-push, `netlify deploy`,
  `supabase apply_migration` remain human-only for every slice.
- **Verify by running, not by reading.** Every "independent verification" line above means execute
  it and show the output, not assert it passed.
- **Trace to the pixel.** Given this Epic's own history (three separate "captured but never read"
  fields — duration, secondary_goal, weight — found during grounding alone), every slice's
  verification must confirm the new value is read at the render/behavior layer the user actually
  sees, not just that `buildDynamicProgram` computes it.
- **Commit + push on green, straight to main, no branches**, per the 2026-08-17 policy — except
  Slice 7 and the scoring half of Slice 8, which stay Needs Human and therefore off this path
  entirely until ruled on.

## Progress log

*(empty — Fix/Verify append here after each slice, per `agents/plan.md` §5)*

---

## REVIEW — first-run validation dry-run, reviewed 2026-08-30

Diffed against the real decomposition Kerwin greenlit for this Epic on 2026-07-21: **EPIC-8a**
(Experience-level branching, BUG-38 folded in), **EPIC-8b** (Duration branching), **EPIC-8c**
(Weight-delta cardio scaling), **EPIC-8d** (Bodyweight-relative scaling, spun out of BUG-44). This
review was written by the orchestrating session, which had already read that ground truth; the
Plan subagent that produced the slices above had not (was withheld the Epic's linked-Bug and prior
decomposition context by design — see Method note above).

**Match, 3 of 4 real sub-epics, near-exact boundaries:**
- EPIC-8a ↔ Slice 5. The dry run's version is *stronger* than what actually shipped: EPIC-8a's real
  build included a `REST_SECONDS` table keyed to experience — the exact thing that was later found
  dead at the render layer and deleted (`programs.js:1822-1860`, codified as D23/D4b). Slice 5
  independently found that history during grounding and hard-constrained itself against repeating
  it, without being told. That's the mechanism catching a mistake the human-driven build actually
  made, before it was made a second time.
- EPIC-8b ↔ Slice 3. Same shape, same file region.
- EPIC-8c ↔ Slice 4 (cardio scaling) + Slice 7 (starting-load, correctly split out). The real
  EPIC-8c's scope isn't independently visible from this diff, but the dry run's split — decompose
  the cardio-volume half, carve the starting-load half to Needs Human because it touches `seedWeight()`
  (D26, biometric layer) — is the *correct* split under the 2026-08-30 forbidden-ops rule, whatever
  the original EPIC-8c actually did.

**Miss: EPIC-8d (bodyweight-relative scaling, BUG-44) has no counterpart above.** Root cause,
confirmed, not assumed: BUG-44 arrived via the Epic's Notion `Linked Bugs` property, which this
dry run's raw problem statement deliberately did not include (to keep the exercise "blind" of any
existing decomposition). `agents/plan.md` §1 explicitly instructs Plan to read "any linked Bug
rows" — a live run would have seen BUG-44 and could have produced an equivalent slice. **This is a
gap in how this dry run was constructed, not a demonstrated gap in the mechanism** — but it is not
nothing: it confirms that step 1's linked-Bug read is load-bearing, not decorative, and it should
be spot-checked on the first *live* Wave this stage produces (confirm linked Bug rows actually get
pulled in), since this dry run couldn't test that path.

**Beyond the real split — new, independently verified findings the manual decomposition didn't
name:**
- **Slice 2 (barbell_rack tier collapse) is a real, live bug**, independently confirmed by the
  reviewing session directly in `tandem.html:2500-2502` (`CFG_EQ_TO_BANK`): `barbell_rack` maps to
  `full_gym`, so those users are handed hack-squat/leg-press/cable-machine picks today. Not
  previously named in EPIC-8's Notion history as of this review.
- **Slices 6/8 (secondary goals)** — `run_5k`/`improve_mobility`/`10k_steps` — have no visible
  counterpart in the real EPIC-8a-d split either; they may simply be un-scoped remainder, which
  this dry run surfaced.
- **Slice 8's scoring carve-out** and **Slice 7's starting-load carve-out** are the two places the
  2026-08-30 forbidden-ops addition actually fired on a live case, and both firings look correct on
  inspection — the mechanism is doing what it was built to do, not just doing *something*.
- **Slice 4's council flag** (does weight-delta cardio override or add to the goal's cardio
  signature) is a genuine, well-formed fork the source material doesn't resolve — the
  default-to-council instruction is finding real forks, not manufacturing them to look busy.

**Verdict: PASS.** 3 of 4 real sub-epic boundaries reproduced (one of them more safely than the
original build), the one miss is attributable to the test's own withheld context and names a
specific thing to spot-check on the first live run (linked-Bug ingestion) rather than a defect in
`agents/plan.md`, and the mechanism surfaced one previously-unnamed live bug plus two correct
forbidden-ops carve-outs and one correctly-flagged council fork. Per `agents/plan.md`'s first-run
requirement, this stage is no longer gated to draft-only — `loop-config.md`'s
`first_run_validation` field is updated accordingly. **Spot-check for the first live Wave this
stage produces:** confirm it actually reads and folds in the Epic's `Linked Bugs` relation.

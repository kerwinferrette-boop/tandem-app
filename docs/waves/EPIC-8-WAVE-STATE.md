# EPIC-8 — Wave decomposition (LIVE)

**Created:** 2026-09-07/08 (Cycle — Kerwin-ruling session, Group 3I). Source: `elegant-spinning-perlis`
plan, approved by Kerwin via AskUserQuestion ("Yes, create + push").
**Source Epic (Notion):** EPIC-8 · "11 · Personalized Workout Plan Engine — Goal Delta, Equipment,
Duration, Experience, Vitals" (`https://app.notion.com/p/37aca37f935b8155b00ee49ae5742401`),
Status: Planned. **The Epic's own Dependency Gate already reads:** *"WAVE 12 - CLOSE AS SUPERSEDED.
Split into EPIC-31 (8a experience), EPIC-32 (8b duration), EPIC-33 (8c weight-delta cardio), EPIC-34
(8d bodyweight-relative). The remaining equipment/goal-delta scope was absorbed by the always-on
dynamic engine (merge `0747d49`). Do not build this row — it would duplicate all five."*
**Linked tracker rows:** `EPIC-8-personalized-workout-plan-engine` (parent, Needs Human),
`EPIC-8a-experience-level-branching` (not in the Needs-Human set — shipped), `EPIC-8b-duration-branching`,
`EPIC-8c-weight-delta-cardio-scaling`, `EPIC-8d-bodyweight-relative-scaling` (all three Needs Human,
Evidence: *"gated on a product greenlight, same pattern as EPIC-5"* — i.e. NOT waiting on
decomposition, waiting on a yes/no to build).

---

## Key finding that reshapes scope — read before touching anything below

**The decomposition this file was commissioned to produce already happened once, in Notion, on
2026-07-21.** EPIC-8 was split into four real Epic rows:

| Sub-epic | Notion Epic | Status | Disposition |
|---|---|---|---|
| EPIC-8a (experience-level branching) | EPIC-31 | **Shipped** | Out of scope here — already built. |
| EPIC-8b (duration branching) | EPIC-32 | Planned | **Slice 1 below.** |
| EPIC-8c (weight-delta cardio scaling) | EPIC-33 | Planned | **Slice 2 below** (+ Slice 2a Needs-Human carve-out). |
| EPIC-8d (bodyweight-relative scaling, = BUG-44) | EPIC-34 | Planned | **Slice 3 below.** |

So this file's actual job is narrower than "decompose EPIC-8": it is **the wave decomposition for the
three sub-epics (8b/8c/8d) that were split out but never individually broken into
Plan/Fix/Verify-sized slices** — the same gap Slice 9 of the prior dry-run
(`EPIC-8-VALIDATION-DRY-RUN-WAVE-STATE.md`) left open when it decomposed the *pre-split* problem
statement instead of the real post-split epics. That dry-run passed its 2026-08-30 first-run
validation review (3 of 4 real sub-epic boundaries reproduced correctly) and its grounding + most of
its slice bodies are reused verbatim below where they map cleanly onto 8b/8c; **8d has no counterpart
in the dry-run at all** — the dry-run's own review flagged this exact miss ("EPIC-8d... has no
counterpart above... a gap in how this dry run was constructed") — so Slice 3 below is new, not
reused.

**The parent `EPIC-8-personalized-workout-plan-engine` tracker row is stale, same shape as BUG-60/
BUG-84/BUG-86 earlier this session.** Its Evidence literally asks for the thing that already happened
("needs Kerwin to break it into smaller stories") — see Progress log below for the sync action taken
on it and on `EPIC-10-experience-age-bodyweight-modifiers` (which the Epic's own Dependency Gate says
duplicates 8a+8d — see `EPIC-10-WAVE-STATE.md`).

**"Gated on a product greenlight, same pattern as EPIC-5" is the real block on 8b/8c/8d, not a
missing decomposition.** Kerwin's "Yes, create + push" answer to this session's Group 3I question is
being treated as that greenlight for the three sub-epics this file actually covers — see Progress log.
It is NOT a greenlight to start Fix executing slices unattended; that still requires the standing ship
gates below to pass per slice, same as every other Wave.

**Two live findings from the dry-run's grounding are NOT part of this file's scope** and are flagged,
not decomposed, because neither 8b/8c/8d's Expected Behavior text mentions them:
- **`barbell_rack` tier collapse** (dry-run Slice 2) — a real, live bug (`tandem.html:2500`
  `CFG_EQ_TO_BANK` maps `barbell_rack` → `full_gym`), but it belongs to the "remaining equipment/
  goal-delta scope" EPIC-8's own Dependency Gate says was absorbed by the always-on dynamic engine,
  not to 8b/8c/8d. Worth its own bug/story; not filed here to avoid scope creep on this Wave.
- **Secondary goals** (`run_5k`/`improve_mobility`/`10k_steps`, dry-run Slices 6/8) — not named in
  any of 8b/8c/8d's Expected Behavior text either. Same disposition: flagged, not decomposed here.

---

## Step status

- [x] **1. EPIC-8b — Duration branching** — DONE 2026-09-08.
      **Depends on:** plumbing to thread `users.workout_duration_minutes` into `getProgram()` (not
      threaded today — confirmed by grep, zero reads in `programs.js` outside the unrelated cardio-
      block `duration` key).
      **File/region:** `getProgram()` (`programs.js:2826`) + `buildDynamicProgram()` (`:2155`)
      signatures — append `duration` as a new trailing positional arg (append-only, matches every
      existing call site's positional order — `tandem.html:2583`, `scripts/persona-matrix.mjs`,
      `scripts/doctrine.mjs`, `scripts/c7-smoke.mjs`, `scripts/cadence-smoke.mjs`); the 5-slot-per-day
      shape (`primary, secondary, acc1, acc2, acc3`) already maps onto the Epic's own Expected
      Behavior text (`<45 min` → drop isolation block, keep 2 compounds + 1 superset finisher;
      `>=60 min` → keep full structure) without a new data structure.
      **Independent verification:** assert exercise-count-per-day for each duration bucket across
      the goal×days×equipment matrix; the `<45min` bucket must never drop a compound slot (D3 —
      compound precedes isolation — stays inviolate regardless of duration); byte-identical output
      for the untouched `duration=null` path (regression guard, since this is also the plumbing
      slice for this axis — no existing call site passes `duration` yet).
      **should/could/did stub:** SHOULD — cite Programming Architecture Reference / Periodization
      spec for session-length-driven structure. Run `exercise-science-research` at Fix time before
      coding — the Epic's own breakpoints (`<45`/`>=60` min) read as engineering round numbers, the
      same shape as the deleted `REST_SECONDS` table's uncited coefficients (D23/D4b history below);
      find a citation for those exact breakpoints or mark them UNSOURCED tripwires in-file per
      CLAUDE.md, do not ship them as if cited. COULD — key structure to exercise *count target*
      derived from goal instead of raw minutes (rejected for this slice: the Epic's own signature is
      literally `duration`; flag as an alternative worth a citation check, not adopted by default).
      DID / RECONCILE — blank, for Fix/Verify.

- [ ] **2. EPIC-8c — Weight-delta cardio scaling, structural half only** — **STALE PREMISE FOUND,
      RE-SCOPE NEEDED, escalated to Needs Human (Cycle 83, 2026-09-12).** Do not implement this
      slice as written below without re-reading the Cycle 83 progress-log entry at the bottom of
      this file first — the "today goal-keyed, fat_burn gets cardio by default, build_muscle/
      transform don't" premise the slice below was written against is FALSE, confirmed by running
      `getProgram('build_muscle', ...)` directly: every goal already gets an unconditional cardio
      finisher on every day. The real cited rule (Programming Architecture Reference, re-read from
      this Epic's own 2026-08-01 Agent Context Notes, never carried into this Wave file until now)
      is sex-differentiated and doesn't match this row's own "every day" scope text. See the
      Progress log entry for the full chain and the Needs-Human tracker Evidence for the exact
      escalation. The slice text immediately below is PRESERVED AS ORIGINALLY WRITTEN for record —
      treat it as superseded, not as instructions to follow.
      **Excludes starting-load changes — see Slice 2a (Needs Human, not decomposed).**
      **Depends on:** plumbing to thread `goalWeight - currentWeight` into `getProgram()` (client-
      computed, `tandem.html:5109-5111` already stores both raw fields; no new schema).
      **File/region:** `buildDynamicProgram`'s cardio-block inclusion logic (today goal-keyed —
      `fat_burn` gets a cardio finisher by default, `build_muscle`/`transform` don't) — extend to
      also branch on weight-delta magnitude per the Epic's own Expected Behavior text: `>20 lbs`
      delta adds a **required** (not optional) Zone 2 finisher every day, for the `fat_burn` goal.
      Note the Epic's own text scopes this to `fat_burn` only — narrower than the dry-run's cross-
      goal read of the same idea, and the narrower reading is what ships here (no invented scope).
      **Independent verification:** sweep `fat_burn` × weight-delta buckets, assert cardio-block
      presence flips from optional to required exactly at the `>20 lbs` threshold and nowhere else;
      confirm `build_muscle`/`transform` are unaffected (this slice's own scope boundary).
      **should/could/did stub:** SHOULD — cite 5-Goal Taxonomy / Periodization spec for cardio volume
      by deficit magnitude within the `fat_burn` signature specifically (this is a within-goal
      intensification, not the dry-run's larger fork about overriding another goal's cardio default —
      that larger fork is out of scope here because the Epic's own text doesn't ask for it). COULD —
      make the >20lb finisher a coaching cue/badge instead of a required program block (rejected:
      Epic's text says "required," not advisory). DID / RECONCILE — blank.

- [ ] **2a. NEEDS HUMAN — EPIC-8c's other half: starting-load reduction is out of scope for this Wave**
      **Not decomposed. Do not implement without Kerwin.** The Epic row's own text is limited to the
      cardio-finisher clause (Slice 2, above) and does not itself ask for a starting-load change —
      but the *original* EPIC-8's "Weight-Delta" language (`>20 lbs to lose → lower starting loads`,
      carried into the dry-run's Slice 7) would, if anyone tries to fold it back in here, touch
      `seedWeight()` — **D26**, "Untrained-lifter starting load: one owner, sex-aware," ACTIVE — which
      is on `loop-config.md`'s 2026-08-30 forbidden-ops list (biometric/1RM layer) by name, Kerwin-only
      regardless of council verdict. Flagging so Fix does not quietly widen Slice 2's scope to cover
      it. Restated from the dry-run's Slice 7 verbatim, since the underlying fork question is
      unchanged: is this a `seedWeight()` input, or a separate post-hoc scaling step applied after
      `seedWeight()` returns (keeps D26's single-owner property intact)? Both options flagged, neither
      picked.

- [ ] **3. EPIC-8d — Bodyweight-relative scaling (= BUG-44)**
      **New slice — no counterpart in the dry-run** (its own first-run review flagged this exact
      miss: BUG-44 arrived via the Epic's `Linked Bugs` relation, which the dry-run's exercise
      deliberately didn't read).
      **File/region:** bodyweight-loaded compound movement prescriptions — `programs.js` wherever
      chin-up/pull-up/dip-class movements set a rep target (`EXERCISE_BANK` entries tagged as
      bodyweight-loaded compounds) and the phase/rep-band resolution that feeds them. Per the Epic's
      own Expected Behavior text: thread `current_weight_lbs`/`age` into these prescriptions; apply
      either a reduced rep target or an auto-substitution above a bodyweight threshold.
      **Independent of Slices 1/2** — a different input (bodyweight/age) and a different mechanism
      (rep-target/substitution, not duration/cardio branching).
      **HARD CONSTRAINT:** the threshold and the reduced-rep-target formula are **not specified
      anywhere in the Epic's text** — this is exactly the "SHOULD is missing, don't invent" case
      CLAUDE.md Directive 3 exists for. Fix MUST run `exercise-science-research` before writing any
      threshold or formula, and if the repo/Notion sources are silent (plausible — bodyweight-relative
      loading for pull-up-class movements is a narrower topic than the general rep-range literature
      already surveyed for D10), fall through to the skill's Step 1.4 external-corroboration path
      (WebSearch reputable sources — NSCA/ACSM/Schoenfeld-class) rather than picking a round number.
      If nothing citable turns up either way, this slice ships as an UNSOURCED tripwire (documented
      gap, no invented number) rather than as a shipped rule.
      **Independent verification:** assert the rep-target/substitution logic only fires for tagged
      bodyweight-loaded compounds, never for loaded/machine variants of the same movement pattern;
      assert it degrades gracefully (falls back to the existing flat rep target) when
      `current_weight_lbs`/`age` are absent from `cfg` (matches today's onboarding, where these are
      optional fields).
      **should/could/did stub:** SHOULD — blank until Fix's `exercise-science-research` pass returns
      a citation or an explicit gap-flag; do not fill in advance of that pass. COULD — reuse the
      existing injury-substitution mechanism (`getExerciseSubstitutes`) for the auto-substitution
      half, same "one rule, one home" preference the dry-run recommended for its analogous Slice 6
      (worth Fix starting there rather than inventing a second substitution path). DID / RECONCILE —
      blank.

- [ ] **4. Regression-harness closure**
      **Depends on Slices 1, 2, 3.** Mirrors the dry-run's Slice 9: extend
      `scripts/persona-matrix.mjs` (whose own header comment says duration/weight-delta axes are
      excluded "until EPIC-8 wires them in") to sweep duration buckets, weight-delta buckets (fat_burn
      only, per Slice 2's narrowed scope), and bodyweight/age-tier scaling. Add a
      `scripts/*-smoke.mjs` regression guard for whichever D-invariant Slice 3's citation pass ends
      up promoting, if any.
      **should/could/did stub:** SHOULD — no new science claim (tests, doesn't prescribe); cite each
      new assertion's D-invariant ID. If Slice 3 resolves an UNSOURCED tripwire into a real citation
      and that citation licenses a hard rule, promote it to `doctrine.mjs` ACTIVE in the same change
      per CLAUDE.md — do not leave a true-but-PENDING invariant. DID / RECONCILE — blank.

### Deferred / flagged — not sliced, not guessed

- **`barbell_rack` tier collapse** — real live bug, out of this Wave's scope (see Key finding above).
  Worth its own tracker row; not filed here.
- **Secondary goals** (`run_5k`/`improve_mobility`/`10k_steps`) — no counterpart in 8b/8c/8d's text;
  out of this Wave's scope.
- **Starting-load half of EPIC-8c** — Slice 2a above, Kerwin-only, not decomposed.

---

## Invariants for whoever resumes

- **Ship gates, both green, every slice:** `npm run verify` (11 checks incl. doctrine) AND
  `npm run validate:personas` (630/630).
- **Doctrine is law.** D23 (rest ownership — PHASES is sole owner) and D26 (starting-load ownership —
  `seedWeight()` is sole owner) are the two invariants this Wave is built around not violating. Do
  not re-add experience-keyed rest (already built, found dead, deleted — see D23/D4b, PHASES:1822).
- **Source-first, always.** Slice 3 in particular ships nothing without a citation or an explicit
  documented gap — no "typically/standard" placeholder numbers.
- **should/could/did audit required** in the commit body + Notion entry for every slice above.
- **Scope-lock per slice** — each slice names its file/region. If Fix needs to expand beyond what's
  named, that's a signal this decomposition was wrong at that point, not a signal to expand quietly.
- **Forbidden, full stop, regardless of council verdict:** the biometric/1RM calculation layer
  (Slice 2a). Force-push, `netlify deploy`, `supabase apply_migration` remain human-only.
- **Verify by running, not by reading.** Every "independent verification" line means execute it and
  show the output.
- **Commit + push on green, straight to main, no branches**, per the 2026-08-17 policy — except
  Slice 2a, which stays Needs Human and off this path until ruled on.

## Progress log

- **2026-09-12 (Cycle 83, scheduled /loop run — Slice 2 audited, NOT built, escalated):** Before
  writing any code, ran `exercise-science-research` on Slice 2's own "SHOULD" stub. Found DOCTRINE.md
  and the 5-Goal Taxonomy silent on a weight-delta-magnitude cardio threshold; research-report(8).pdf's
  concurrent-training section caps aerobic training frequency at ≤2x/week for fat-free-mass
  preservation during a deficit, which reads as a direct conflict with this slice's "required Zone-2
  finisher every training day" text. Escalated to `llm-council` rather than picking a side (per
  loop-config's "sources conflict → run council" rule). Unanimous peer-review verdict (5/5 reviewers):
  every advisor except the First Principles Thinker silently assumed a "finisher" (minutes appended to
  an existing lift day) and a standalone "aerobic session" (what the ≤2x/week research actually
  measures) are the same unit; the council's "one thing to do first" was to check Exercise Science
  Schema v0.5 before shipping. Did that: Schema v0.5's `template_exercises.exercise_role` includes
  `finisher` as a **session-embedded structural role**, distinct from an independently-programmed
  aerobic session — this resolves the apparent research conflict (the ≤2x/week ceiling governs
  standalone sessions, not a finisher appended to a day that's happening anyway), and Schema v0.5's
  own Circuits/MRT design for the fat-loss goal already builds EPOC-style conditioning into every
  session for exactly this fat-free-mass-preservation reason.
  **That would have cleared the way to build Slice 2 as written — except two further findings
  surfaced by RUNNING the code and RE-READING this Epic's own Notion row, neither previously carried
  into this Wave file:**
  1. **This slice's premise is false.** `node -e` against live `programs.js` (`vm`, same pattern as
     `scripts/doctrine.mjs`) showed `getProgram('build_muscle', 4, 8, 'M', 'full_gym', ...)` returns a
     `Zone 2 · 22 min` cardio block on **every** day — cardio is already unconditional for **every**
     goal today, not "fat_burn gets it by default, build_muscle/transform don't" as this slice's
     opening line claims. Grep confirms no skip/toggle/optional mechanism exists anywhere in the code.
     There is no "optional" state to promote to "required."
  2. **The real citation this Epic's own Agent Context Notes already surfaced (2026-08-01, predates
     this Wave file, never carried forward into it) is narrower and sex-differentiated:** Programming
     Architecture Reference, "Men's fat burn note" — *"Cardio is supplementary to resistance training.
     Zone 2 finishers are optional unless weight delta > 20 lbs"* — real, cited, **men only**, and an
     optional/required **toggle**, not an "every day" volume add. The same doc's "Women's fat burn
     note" states Zone 2 finishers **3-4x/week as a structural baseline for women regardless of
     weight delta** — not gated by delta at all. This slice's own text ("every day," applied uniformly)
     contradicts the very source it would need to cite.
  **RECONCILE: did not ship.** Implementing the actually-cited rule would require (a) a NEW skip/
  optional mechanism for men ≤20lb delta (doesn't exist today — cardio is unconditional for
  everyone), and (b) REDUCING women's cardio from today's unconditional every-day default down to
  the cited 3-4x/week baseline — a behavior change for every existing female fat_burn user, not an
  additive append-only slice matching this Wave's own scope-lock discipline. Both read as product/
  feel calls (removing something current users already get), not a pure implementation fork this
  loop is authorized to just pick. Tracker row `EPIC-8c-weight-delta-cardio-scaling` flipped
  Untested → Needs Human; PushNotification sent to Kerwin with the direct question (keep today's
  default and treat >20lb as already-structurally-satisfied, vs. build the two behavior changes
  above). Full citation chain in the tracker row's Evidence field and the Goal Record Cycle 83 log
  entry. No file in this repo was changed by code this cycle — this progress-log entry and the
  annotation on Slice 2 above are the only edits.

- **2026-09-08 (Slice 1 built):** Before coding, re-audited the Epic's own Notion "Dependency
  Gate" (`WAVE 8... do not build before EPIC-18 settles where session length is captured`) rather
  than trusting the earlier same-day session's framing that Slice 1 was immediately buildable —
  found it stale, the same shape as EPIC-16/EPIC-10's stale blockers: `selectDuration()` (onboarding
  `ob-card-3`) already captures `cfg.workout_duration_minutes` live today, independent of EPIC-18's
  Step-4 restructure. Ran `exercise-science-research`: DOCTRINE.md, the Notion Programming
  Architecture Reference / 5-Goal Taxonomy / Exercise Science Schema v0.5, `research-report (8).pdf`,
  and the Exercise Science Framework docx/csv are all silent on session-duration thresholds
  (confirmed by direct text search, not memory); external corroboration (NSCA "Time-Efficient
  Training Approach") cites the SHAPE — compound work is prioritized, isolation is cut first, under
  time pressure — extending this engine's own ACTIVE D3. The exact 45-minute cutoff has no citation
  anywhere, including NSCA's own article. **SHOULD:** ship the cited shape, flag the cutoff as an
  unsourced engineering default (new DOCTRINE.md/doctrine.mjs invariant **D28**, PENDING — needs
  Kerwin's ruling + a citation to promote the number itself). **COULD:** invent a 3rd 45-59min tier
  (rejected — no source, Epic only names two bands); scope the drop to superset-goals only (rejected
  — D3 is goal-agnostic, and build_muscle correctly getting a smaller plain accessory block is the
  honest D5 consequence, not a special case). **DID:** added `durationMinutes` as a new trailing,
  append-only param on `getProgram()`/`buildDynamicProgram()` (programs.js); short sessions
  (`<SHORT_SESSION_MAX_MINUTES`) skip the `acc3` slot via the same mechanism EPIC-8a already proved
  for beginner tier; wired `tandem.html`'s `getActiveProgram()` to pass `cfg.workout_duration_minutes`
  through. Ran the engine directly (not just read it): `undefined`/`null`/`60min` byte-identical to
  baseline for build_muscle/transform/fat_burn; `30min` shrinks build_muscle's Accessory Block 3→2
  exercises with zero invented superset; `30min` on transform/fat_burn leaves exactly one
  `Superset A` block and **zero** leftover plain Accessory Block — literally "2 compounds + 1
  superset finisher." **RECONCILE:** did === should for the cited shape; the cutoff stays an honest
  PENDING gap, not silently promoted. New regression guard `scripts/duration-smoke.mjs` (21
  assertions) wired into `npm run verify` (now 12/12). All ship gates green: `verify` 12/12,
  `validate:personas` 630/630, `walkthrough:onboarding` 0 findings. Scope boundary, flagged not
  silently dropped: the 5-day-split Shoulders+Arms bonus day (`SHOULDER_TEMPLATE`) is untouched —
  its blocks are labeled "Shoulder Block"/"Arms Block", which `applySupersets`' `/accessor/i` label
  match already excludes from supersetting regardless of goal, so it was already structurally
  separate; a future slice can extend duration-gating there if wanted. Committed + pushed to this
  session's branch per loop-config's "commit and push on green" standing policy.
  **Independent verification (fresh subagent, 2026-09-08): PASS**, with two honest observations
  neither of which is a failure: (1) the Shoulders+Arms 5-day bonus day is structurally stable
  (slot/block count never changes) but NOT byte-identical full-vs-short — `isShortSession` frees
  up `acc3` candidates for reuse elsewhere, which can shift which specific exercise `fillSlots`'s
  shared `excl:[...used]` set lands on for that day; no slot is added/dropped, no duration logic
  runs on that path directly, but the doc's "untouched" framing above is true for structure only,
  not output-identity — corrected here rather than left overstated. (2) the onboarding UI's 4
  duration buttons are 30/45/60/90 — since the cutoff is strict `<45`, only the **30-min** choice
  ever triggers branching today; 45/60/90 are all byte-identical to no-preference. Matches the
  Epic's literal "<45min" wording, but worth naming plainly: the feature currently reaches 1 of 4
  onboarding options, not a continuous range. Neither observation blocks Resolved status.

- **2026-09-07/08 (Kerwin-ruling session, Group 3I):** File created. Audited EPIC-8's live Notion
  state before decomposing (per this session's standing audit-first instruction) and found the
  parent tracker row's ask ("break into smaller stories") was already satisfied on 2026-07-21 by the
  EPIC-31/32/33/34 split — the parent row and `EPIC-10-experience-age-bodyweight-modifiers` (which
  duplicates 8a+8d per EPIC-8's own Dependency Gate) were synced to reflect this rather than asked
  about again (see Notion Evidence on those two rows). Reused the prior `EPIC-8-VALIDATION-DRY-RUN-
  WAVE-STATE.md`'s grounding and Slices 3/4/9 where they map onto the real 8b/8c split (narrowed
  8c to `fat_burn`-only per the real Epic's text, where the dry-run's version was broader); wrote
  Slice 3 (EPIC-8d/BUG-44) fresh, since the dry-run's own first-run review had already flagged that
  exact gap. The three sub-epic tracker rows (`EPIC-8b/c/d`) were synced Needs Human → Untested, with
  Evidence citing this file as the decomposition their "gated on greenlight" block was waiting on,
  treating Kerwin's "Yes, create + push" answer to this session's Group 3I question as that
  greenlight. Not yet built — Fix/Verify have not run any slice above.

# EPIC-27 — Custom Template Builder (Tier 1: Bring Your Own Workout) — Wave State

**Created:** 2026-09-06, Cycle 72 (Plan stage, unattended). **Source Epic:** EPIC-27
(https://app.notion.com/p/392ca37f935b8157bf9ec7547fc3d1d6), Status "Scoped", Effort "XL
Architecture", Priority P1. **Linked user story:** EPIC-27-custom-template-builder
(https://app.notion.com/p/392ca37f935b8145bd4bee26d12c9cf8), Status Untested.

**Why this Wave exists:** the Epic sat "Scoped" (not Untested, not Needs Human) for two cycles
because it is bigger than a one-file slice — exactly the shape `wave_decomposition` in
`.claude/loop-config.md` exists to cut down. This file is that cut. Per `plan.md`'s first-run
validation (passed 2026-08-30, `docs/waves/EPIC-8-VALIDATION-DRY-RUN-WAVE-STATE.md`), this Wave is
**not** draft-only — Fix may execute slices from it directly, subject to the normal gates below.

## Key finding that reshapes scope (read before touching any slice)

The Epic's own "Dependency Gate" note claims the write path is all that's missing. Verified live
this cycle, and it is better than that claim: **the read/render side is already fully built and
dormant**, not merely "reusable."

- `getActiveProgram()` (tandem.html:2564-2611) already branches on `program_source === 'template'`
  (one of two `AUTHORED_SOURCES`, alongside `'library'`), routing through the exact same
  `materializeTemplate()` + `tandem_adopted_program` LS-cache path already used for library-adopted
  programs. The code's own comment says it plainly: *"'template' = a template assigned directly,
  without going through the library... reserved, no producer yet."*
- `program_source`'s live CHECK constraint (`users_program_source_check`, verified via
  `pg_constraint`) already legalizes `'template'` alongside `'generated'`/`'library'` — **no
  migration needed**, this value has existed and been dead since EPIC-033/BUG-69.
- BUG-59's tier/injury safety-smoke (`scripts/authored-safety-smoke.mjs`, in `npm run verify`)
  already covers this exact materializer path for both `AUTHORED_SOURCES` values, so a
  from-scratch custom template inherits that safety coverage automatically — it does not need its
  own new safety test.
- **Conclusion:** EPIC-27 is not "build a new consumption path," it is "build one new producer
  (`author_id=self`, no clone source) for a producer slot the resolver already has a reserved,
  tested branch for." This is a materially smaller and lower-risk Wave than the Epic's own XL
  effort label suggests, precisely because Tandem already paid for the read-side plumbing when it
  built the library-adopt flow.

## Schema-fit fork — resolved by council, cited here (do not re-litigate per slice)

`workout_templates`/`template_blocks`/`template_days` carry several NOT NULL columns
(`duration_weeks`, `parent_goal`, `code_goal_mapping`, `difficulty`, `week_start`, `week_end`) that
only make sense for a periodized, publishable library program — not a from-scratch personal split
with no source row to copy them from. This was a genuine implementation fork the Epic's own spec
does not resolve, run through `llm-council` this cycle (disclosed self-performed synthesis — no
subagent fan-out tool exists in this environment; see the transcript for that limitation stated in
full): **`/home/user/tandem-app/council-transcript-2026-09-06-epic27-template-schema.md`**.

**Verdict adopted, binding for Slice 1:**
- `duration_weeks = 12` (cites D15's 8-12 week block-length doctrine — not an invented number).
- One `template_blocks` row: `week_start=1, week_end=12`, `rep_scheme_by_week={}`,
  `technique_by_week={}` (the columns' own existing empty-jsonb default already means
  "no periodization" — zero new schema behavior).
- `program_source = 'template'` (not `'library'`) — the reserved, dead-until-now value.
- Deferred, **not** built in this Wave, tracked as Slice 5 below: what happens when a custom
  template's user passes week 12. No renewal/extension mechanism is being promised or half-built.

**CORRECTION, Cycle 73 (Fix stage), on the `parent_goal = code_goal_mapping = difficulty = 'custom'`
part of the verdict above:** that literal sentinel is **not legal to write**. Checked against the
LIVE `pg_constraint` rows before writing any code (source-first, not re-reasoned):
`workout_templates_parent_goal_check` only allows
`build_muscle|fat_burn|transform|strength|maintenance`, `_code_goal_mapping_check` only allows
`build_muscle|fat_burn|transform`, `_difficulty_check` only allows
`beginner|intermediate|advanced` — `'custom'` satisfies none of the three and an INSERT using it
fails outright. The Cycle 72 council verdict proved these columns are **inert for display**
(`openProgramLibrary()` filters `is_published=true` first) but never checked whether the literal
value it named was **legal to insert** — a different claim, conflated. This is not a re-litigation
of the council's actual judgment call (which columns can be a sentinel at all); it is a
mechanically-checkable fact the council step skipped verifying. Fixed in `createCustomTemplate()`
(tandem.html) by using the user's own already-canonical `cfg.goal` (D2: only canonical goals ever
reach this field) for `parent_goal`/`code_goal_mapping`, and `cfg.experience` (already
beginner/intermediate/advanced vocabulary) for `difficulty` — the real value already governing
every other program this user runs, CHECK-legal and not fabricated.

## CORRECTION, 2026-09-07 (Kerwin-ruling session) — the Cycle 72 council verdict miscited its own doctrine

Asked Kerwin whether to ship EPIC-27 as MVP without Slice 5, or build Slice 5 as real week-13
renewal logic. His answer rejected both options and reframed the premise itself:

> "What if someone wanted to build a 6 week program? an 8 week program? It shouldn't be predicated
> on doing 12 weeks, you have to get over that block"

Audited source-first rather than treating this as a fresh doctrine question (per CLAUDE.md's
directive), and found the fixed-12 premise was **never actually required by doctrine — the Cycle
72 council verdict cited the wrong invariant**:

- Line 49 above cites "D15's 8-12 week block-length doctrine" as the justification for
  `duration_weeks = 12`. Checked `/DOCTRINE.md` directly: **D15 is not a block-length rule at all**
  — its real title is "Primary-compound refresh cadence for T>12" (`scripts/doctrine.mjs` line 82:
  `D15: 'SCIENCE_DEFAULT', // fixed primary compounds`). It governs how often primary lifts rotate
  in long programs, nothing about legal program lengths.
- The invariant that actually governs block length is **D7**: "Per-length mesocycle layout
  (**4–12 wk**) matches the spec Part B table verbatim" — `✅ ACTIVE`, sourced from the
  Periodization spec Part B, `scripts/doctrine.mjs` line 74 (`D7: 'SCIENCE_DEFAULT'`).
- **This doctrine is already fully implemented for the whole 4-12wk range, not just 12**:
  `programs.js:2533` — `DELOAD_TABLE = { 4:[4], 5:[5], 6:[6], 7:[7], 8:[4,8], 9:[5,9], 10:[5,10],
  11:[5,10], 12:[4,8,12] }` — reproduces spec Part B verbatim for every one of those lengths
  (comment at `programs.js:2538`, written EPIC-033). `deloadWeeks()`, `primaryBlockStarts()`, and
  every other T-dependent function in `programs.js` already take `weeks` as a generic parameter —
  none of them assume 12. Onboarding's own week-count input already accepts **4-24**
  (`programs.js:2534` comment: "onboarding accepts 4-24; tandem.html ob-weeks min=4 max=24").
- **Conclusion: Kerwin's 6-week and 8-week examples are not a doctrine conflict to research or
  council — they are already-legal, already-implemented lengths that every OTHER program type in
  this app (generated, library) already serves correctly.** The only place that doesn't serve them
  is `createCustomTemplate()` (Slice 1), which hardcodes `duration_weeks=12` unconditionally
  instead of reading the caller's chosen week count. That is a Slice-1 scope gap traceable to the
  council's miscitation, not a new product decision and not a science question — no
  `exercise-science-research` or `llm-council` re-run needed.
- **What this does NOT resolve:** whether the Builder UI (Slice 2) should expose a week-count input
  at all — Slice 2's original build had no such field because Slice 1 never read one. That is real,
  scoped code work (a `tandem.html` change), out of this Notion/docs-only session's scope — flagged
  as Slice 6 below for a Fix pass, not built here.

This supersedes Slice 5's framing as written (below): "week 13 renewal for a nominal 12-week block"
assumed every custom template IS 12 weeks. Once duration is user-selectable within D7's proven
4-12wk range, Slice 5's actual question narrows to "what happens when a user-chosen block of ANY
legal length ends" — the same question, correctly scoped, not a new one.

- [ ] **Slice 6 — user-selectable program duration, 4-12wk (supersedes the Slice-1 hardcode).**
      **Depends on:** nothing new — D7 + `DELOAD_TABLE` already cover the full range; this is a
      plumbing fix, not new science.
      **File/region:** `createCustomTemplate()` (tandem.html) — replace the hardcoded
      `duration_weeks=12` write with the caller-supplied week count; `template_blocks`'
      `week_start=1, week_end=T` must track the same value. Builder UI (Slice 2's modal) needs a new
      week-count input (2-6-day-list already has a working precedent for a bounded numeric control
      to copy). Validate 4-12 inclusive at both the UI and the pre-write validation
      `createCustomTemplate()` already runs (mirroring the existing days.length 2-6 check).
      **Independent verification:** confirm a 6-week and an 8-week custom template both write
      correct `template_blocks` rows (`week_end` matching the chosen length) and that
      `deloadWeeks()`/`primaryBlockStarts()` produce the same deload placement as an equivalent
      generated program of that length (cross-check against `DELOAD_TABLE`).
      **should/could/did stub:** SHOULD — D7 (4-12wk), already `✅ ACTIVE` and already implemented
      engine-wide; no new citation needed. COULD — extend beyond 12wk (onboarding's 4-24 range
      technically supports it via `deloadWeeks()`'s generic fallback) — deferred, Kerwin's stated
      examples (6, 8) are both ≤12; revisit only if asked. DID / RECONCILE — blank, for Fix.

## Forbidden-ops carve-out (per `.claude/loop-config.md` safety.forbidden, 2026-08-30 council addition)

Slice 3 (suggested weight/reps) reads the existing 1RM/progression machinery
(`prescriptionOneRM()`, `weekFactor()`, Epley calc) — **read-only, as a consumer**. No slice in
this Wave may modify those functions, their resolution order, or any scoring/matchmaking logic. If
building Slice 3 surfaces a case those functions don't already serve (e.g. "no program-phase
context for an arbitrary user-picked exercise"), that is a **stop-and-escalate** finding — Needs
Human via `still_needs_kerwin`, not an inline patch to the biometric layer.

## Step status

- [x] **Slice 1 — Data-write path.** DONE, Cycle 73. `createCustomTemplate()` (tandem.html, added
      after `adoptTemplate()`), scope-locked to `tandem.html`. Writes, in order: `workout_templates`
      (author_id=uid, is_published=false, `duration_weeks=12`, `parent_goal=code_goal_mapping=
      cfg.goal`, `difficulty=cfg.experience` — see the CORRECTION above the sentinel values this
      row originally named, `science_overrides={}`), one `template_blocks` row (`week_start=1,
      week_end=12`, empty rep/technique-by-week), N `template_days` rows (label + day_order from
      the caller's day list, `muscle_targets` derived by querying `exercises.muscle_primary` for
      every referenced `exercise_id`), `template_exercises` rows (day_id, exercise_id, ex_order,
      sets, reps, rest, role — **sets/reps/rest/role always concrete, never invented**, sourced
      from the caller/Slice 4's resolved value). Input-validates days.length 2-6 (
      `days_per_week_check`), sets 1-10, role against the 5 DB-legal values, reps/rest non-blank,
      before writing anything. On any write failure, deletes the `workout_templates` row (FKs are
      ON DELETE CASCADE, so this alone clears every child row) rather than leaving a partial
      template. Then caches the identical bundle shape into `tandem_adopted_program` (matching
      `adoptTemplate()`'s cache write), sets `cfg.programSource='template'`, `currentWeek=1`,
      `syncToCloud()`.
      SHOULD: reuse the existing authored-program contract end to end (D16 two-tier doctrine — no
      `science_overrides` claimed, so `validate_science_overrides()`'s trigger loop is a true no-op,
      confirmed by reading the live trigger function body, not assumed). COULD: a brand-new
      `program_source` value or new tables — rejected, `'template'` is already legal and already
      has a tested consumer; a `'custom'` sentinel for parent_goal/code_goal_mapping/difficulty —
      rejected per the CORRECTION above, not CHECK-legal. DID: wrote `createCustomTemplate()`;
      `npm run verify` 11/11 green (incl. `authored-path safety` = BUG-59's smoke, which already
      covers this exact materializer path for both `AUTHORED_SOURCES` values); `node --check` clean
      on both files. RECONCILE: did == should, with one correction made and disclosed above rather
      than shipped silently.
      **Independently verified, Cycle 73 (disclosed self-performed — no Agent/subagent-spawn or
      ListAgents tool reachable from this environment, re-confirmed via ToolSearch this cycle;
      only SendMessage exists, which targets an already-live session, not a spawn primitive):**
      replicated the function's exact write sequence via Supabase MCP `execute_sql` under the
      allowlisted Test Kerwin account (`e5074b4c-3808-4338-aeb7-b9db59d61f49`) — 1 template (2-day
      split, build_muscle/intermediate/full_gym, `duration_weeks=12`), 1 block, 2 `template_days`
      (muscle_targets correctly derived from queried `exercises.muscle_primary`), 3
      `template_exercises` rows (Barbell Back Squat 3×8, Plank 3×45s, Barbell Row 3×8) — every
      insert succeeded against the live CHECK constraints and RLS policies (`author_id = auth.uid()`
      ownership chain, matched against live `pg_policies`), the D16 trigger fired as a true no-op
      (confirmed via its own `prosrc`), re-queried the assembled bundle shape (1/1/2/3 counts,
      matching exactly what `fetchTemplateBundle()`'s joins would produce — the shape
      `materializeTemplate()`/`getActiveProgram()`'s already-proven dormant branch consumes, so no
      further render-path verification was needed), then deleted the template row and confirmed
      zero residue across all four tables via cascade. **Status: Resolved (Cycle 78, 2026-09-07)** —
      a genuinely independent fresh subagent (the Agent tool was confirmed reachable this cycle,
      closing the "no subagent-spawn tool" gap noted in every prior cycle) re-derived the live code
      and re-ran the full write sequence under real RLS (as the `authenticated` role, not a
      superuser-bypass connection) with zero discrepancies found. Full detail in the Cycle 78 Goal
      Record entry and the story's own Evidence field.
      **Not yet wired to any UI** — Slice 2 is the builder screen that will call this function;
      until then it is dead code by design (disclosed, not silent), matching this Wave's own
      dependency order.

- [x] **Slice 2 — Builder UI (day/exercise increment).** DONE, Cycle 74. New modal
      (`modal-builder`, tandem.html), reached via a "🛠️ Build Custom Template" entry point next to
      the existing Library/One-off buttons in `modal-goal`. Day list add/remove (2-6, mirrors
      `workout_templates_days_per_week_check`), per-day "+ Add Exercise" as a search-as-you-type
      text input against a `<datalist>` populated from the LIVE `exercises` table (Kerwin's
      2026-08-21 resolved UI shape — a plain autocomplete input, not a dropdown/drag-card;
      preserved, not reopened). `builderSetExercise()` resolves a typed name to its real
      `exercises.id` via a name→row map built once per session; an unrecognized name is left
      `exercise_id: null` and is a hard save-block (`saveCustomTemplate()`), never silently
      coerced or invented. Calls Slice 1's `createCustomTemplate()` unchanged on save.
      SHOULD: the smallest unit that hands Slice 1 a real, concretely-valued input instead of an
      invented one — day label, one or more exercises resolved against the live bank, concrete
      sets/reps/rest/role per exercise (Slice 1's own input contract, tandem.html:2827-2836).
      COULD: build superset-grouping input in the same pass (the Wave's original Slice 2
      description bundled it in) — REJECTED for this increment: it is additive on top of this
      shape (reuses `SUPERSET_CFG` per CLAUDE.md's "one rule, one home") and not a precondition for
      a working save path; bundling it risked an oversized single-cycle UI per this cycle's own
      instruction to ship a minimal correct increment rather than rush. Recorded below as the
      explicit remaining Slice 2 sub-step, not silently dropped. DID: added the modal HTML, the
      entry-point button, and 9 JS functions (`openTemplateBuilder`, `renderBuilderDays`,
      `builderSetExercise`, `add/removeBuilderDay`, `add/removeBuilderExercise`,
      `saveCustomTemplate`) after `createCustomTemplate()`. `node --check` clean on both files;
      `npm run verify` 11/11; `npm run validate:personas` 630/630 (this is a UI-only, additive
      change — the generator itself is untouched, and both matrices were re-run to prove that
      rather than assumed). RECONCILE: did == should.
      **Independently verified, Cycle 74 (disclosed self-performed — no Agent/subagent-spawn or
      ListAgents tool reachable from this environment, re-confirmed via ToolSearch this cycle;
      only SendMessage/TaskStop exist, neither is a spawn primitive):** two-part proof, not one.
      (a) The exact shipped JS was extracted verbatim (not re-typed) from tandem.html and run in a
      Node `vm` context against a mocked DOM + mocked `exercises` table — 22/22 assertions passed,
      covering the 2-6 day bound, unresolved-name never fabricates an id, case/whitespace-
      insensitive name matching, and every save-blocking rule (no name, an empty day, an
      unresolved exercise_id), plus the happy path producing the exact payload shape Slice 1
      documents, and error/finally handling on a simulated write failure. (b) That same
      UI-shaped payload — now resolved against REAL `exercises.id` values fetched live
      (`Barbell Back Squat`→`e4abfe...`, `Plank`→`bddf69...`) — was written through Slice 1's exact
      write sequence under the allowlisted Test Kerwin account: 1 template, 1 block, 2
      `template_days` (muscle_targets correctly derived live: quad_* for the squat day,
      rectus/transverse_abdominis for the plank day), 2 `template_exercises` — 1/1/2/2 shape
      confirmed matching what `fetchTemplateBundle()`/`materializeTemplate()` already consumes
      (proved for this exact shape in Cycle 73), then deleted and confirmed zero residue across
      all four tables. **Status: Resolved (Cycle 78, 2026-09-07)** — a genuinely independent fresh
      subagent re-ran the 19/19 vm-sandbox assertions plus a fresh live-DB round trip and found no
      discrepancies. Full detail in the Cycle 78 Goal Record entry and the story's own Evidence
      field.
      **Remaining Slice 2 sub-step, not yet built:** superset-grouping input on top of this same
      modal. Tracked here rather than silently folded into "Slice 2 done" — the day/exercise save
      path is real and usable without it (a custom template with no supersets is a fully legal
      template), so this does not block Slice 3.

- [x] **Slice 3 — Per-exercise suggestion (READ-ONLY consumer of existing 1RM/progression code).**
      DONE, Cycle 75. `builderLoadSuggestion()` (tandem.html, after `builderSetExercise()`),
      triggered from `builderSetExercise()` whenever a typed name resolves to a NEW
      `exercise_id` (never on every keystroke — see focus-preservation note below).
      SHOULD: per this Wave file's own dependency-cut text (written Cycle 72, before Slice 1/2
      existed) — "surfaces the most recent logged weight/reps ... if no history exists for that
      lift, show no suggestion" — a plain, real-data-only read of the user's own `sets` rows for
      the resolved exercise name, no fabrication, no estimate fallback.
      COULD: route through `prescriptionOneRM()`/`weekFactor()`/`getWeekTarget()` (the full
      %1RM-by-phase engine) as the Forbidden-ops section's framing literally names — REJECTED,
      caught before writing code: those functions require a program PHASE (`currentWeek`,
      `cfg.goal`) to resolve a %1RM target, and a from-scratch custom template being built right
      now has no phase of its own (Slice 1: `duration_weeks=12`, empty `rep_scheme_by_week` — no
      periodization to derive one from). Calling them here would silently borrow whatever
      program's phase happens to be active elsewhere in the app — a fabricated context, not a
      real one, and exactly the "no program-phase context for an arbitrary user-picked exercise"
      case this Wave file's own Forbidden-ops paragraph names as a stop-and-escalate trigger.
      Resolved without escalating because the Wave file's own SHOULD text (above) already
      specifies the narrower, phase-free read — "most recent logged weight/reps" is a literal
      last-set lookup, not a %1RM computation — so no genuine unresolved fork existed once the
      two passages were read side by side; this is recorded rather than silently reconciled so a
      future reader doesn't have to re-derive it. DID: `sb.from('sets').select('weight_lbs, reps,
      created_at').eq('user_id',...).eq('exercise_name',...).order('created_at',
      {ascending:false}).limit(1)` — same table/shape `fetchRecentSets()` already reads
      (tandem.html ~L5636), scoped to one exercise name. No suggestion shown when the query
      returns no rows (never a fabricated default). A **real focus-preservation bug was caught
      and fixed before shipping**: the first draft called `renderBuilderDays()` on every
      `builderSetExercise()` invocation, which fires on every keystroke via `oninput` — since
      `renderBuilderDays()` rebuilds the day list's entire `innerHTML`, this would have torn out
      and recreated the very `<input>` the user was mid-keystroke in on every unmatched partial
      character (e.g. typing "Bar" → "Barb" → "Barbe"...), stealing focus/cursor on every
      keystroke. Fixed by only re-rendering from within `builderLoadSuggestion()` itself (which
      only runs when a genuinely NEW exercise resolves, not on every unmatched keystroke) — the
      vm-sandbox proof below asserts this directly (renderCount stays 0 across 3 unmatched
      keystrokes). `node --check` clean on both files; `npm run verify` 11/11;
      `npm run validate:personas` 630/630; `npm run validate:programs` clean (generator itself
      untouched — this is a read-only UI consumer). RECONCILE: did == should.
      **Independently verified, Cycle 75 (disclosed self-performed — no Agent/subagent-spawn or
      ListAgents tool reachable from this environment, re-confirmed via ToolSearch this cycle):**
      two-part proof. (a) The exact shipped `renderBuilderDays`/`builderSetExercise`/
      `builderLoadSuggestion`/`addBuilderExercise` were extracted verbatim (not re-typed) from
      tandem.html and run in a Node `vm` context against a mocked DOM + mocked Supabase `sets`
      table — 21/21 assertions passed: zero renders across 3 unmatched partial keystrokes (the
      focus-preservation fix), exactly one query fired on a genuine new match (filtered by the
      correct user_id AND exercise_name), suggestion text populated only from the real returned
      row, no re-fetch/re-render on re-selecting an already-resolved exercise, unresolved names
      never fabricate an id or fire a query, and a simulated Supabase error is caught (never
      thrown out of the handler) with `suggestionLoading` correctly cleared in the `finally`
      block. (b) A live proof against production Supabase under the allowlisted Test Kerwin
      account: inserted one real `sets` row (Barbell Back Squat, 185×5), ran the exact
      PostgREST-equivalent query the shipped code issues, confirmed it returns that row verbatim
      or matching the "Last logged: 185 lbs × 5 reps (2026-09-06)" render, then deleted it and
      confirmed zero residue. **Status: Resolved (Cycle 78, 2026-09-07)** — a genuinely independent
      fresh subagent re-derived the new-id-only guard and the read-only sets query, confirmed zero
      calls into the forbidden %1RM/phase engine, and reproduced the live-DB round trip with no
      discrepancies. Full detail in the Cycle 78 Goal Record entry and the story's own Evidence
      field.
      **Slice 4 (manual override / pre-population of sets/reps/weight from this suggestion) is
      next** — this slice deliberately only SURFACES the suggestion as read-only display text; it
      does not pre-fill the sets/reps/rest number inputs, which is explicitly Slice 4's scope per
      this Wave file's own boundary.

- [x] **Slice 4 — Manual override path.** DONE, Cycle 76. `builderEditReps()` added
      (tandem.html, after `addBuilderExercise()`); `builderLoadSuggestion()` extended to
      default-populate `reps` from the resolved suggestion, guarded by a new
      `repsTouched` flag on each exercise row.
      **CORRECTION vs. this bullet's own prior wording ("Sets/reps/weight inputs
      default-populated"), found by checking the LIVE schema and the actual suggestion
      payload before writing code, not by trusting the prior phrasing:** only `reps` gets
      default-populated. `sets` does not, because `builderLoadSuggestion()`'s own query
      (`select weight_lbs, reps, created_at`) fetches a single most-recent SET row, which
      has no `sets` COUNT to derive a default from — inventing one would violate
      CLAUDE.md's "real data or nothing." `weight` is not written anywhere at all: a live
      `information_schema.columns` check on `template_exercises` (this cycle, before
      writing code) confirms it has no weight column whatsoever — only
      `sets/reps/rest/role/technique`. A template stores a prescription, not a fixed
      weight; every other program type (generated/library) resolves the actual weight at
      runtime via the calibration/1RM layer, which is forbidden scope for this Wave (see
      Forbidden-ops carve-out above) — adding a template-level weight field would either
      dead-end with nowhere legitimate to persist it, or require touching that forbidden
      layer for no schema-backed benefit. The suggestion TEXT (Slice 3, unchanged) already
      surfaces the weight for the user to read and apply manually, which is what the
      Epic's Expected Behavior item 3 ("manual override... own weight") reduces to at the
      template-authoring layer specifically — this is a narrower, corrected scope than
      this bullet's own original wording claimed, disclosed here rather than silently
      built around.
      SHOULD (EPIC-27's own Expected Behavior items 2+3, re-read fresh this cycle): a
      suggestion should default-populate what it actually has real data for, and the
      user must always be able to override it — a later-arriving suggestion must never
      clobber something the user already typed. COULD have made the pre-fill unconditional
      (always overwrite reps when a suggestion resolves) — REJECTED: an async suggestion
      fetch can resolve after the user has already started typing their own reps for that
      exact row (the fetch and a keystroke race in real time), and clobbering a typed value
      is a worse violation of "always user-editable" than under-filling would be. DID: a
      `repsTouched` flag seeded `false` in `addBuilderExercise()`, flipped `true` only by
      `builderEditReps()` (the reps field's new named oninput handler, replacing the prior
      inline `this.value` setter so it can also flip the flag) — never flipped
      automatically. `builderLoadSuggestion()` writes `reps` from the real fetched row only
      when `!repsTouched`. TEST baseline confirmed failing first: reading the code before
      this change showed `ex.sets`/`ex.reps`/`ex.rest` were only ever set once at row
      creation (a generic `3`/`'8-10'`/`90`) and never touched again by
      `builderLoadSuggestion()`, which only ever wrote the display-only `.suggestion`
      string — so a suggestion of "185 lbs × 5 reps" left the reps field showing "8-10"
      regardless. `node --check` clean on both files; `npm run verify` 11/11;
      `npm run validate:personas` 630/630; `npm run validate:programs` clean (this touches
      no generator code — UI-only). RECONCILE: did == should, with the sets/weight scope
      correction disclosed above rather than silently narrowed.
      **Independently verified, Cycle 76 (disclosed self-performed — no Agent/subagent-spawn
      or ListAgents tool reachable from this environment, re-confirmed via ToolSearch this
      cycle; only SendMessage/TaskStop/Monitor exist, none a spawn primitive):** two-part
      proof. (a) The exact shipped `renderBuilderDays`/`builderSetExercise`/
      `builderLoadSuggestion`/`addBuilderExercise`/`builderEditReps` (verbatim-extracted,
      not re-typed, from tandem.html:2992-3141) were run in a Node `vm` context against a
      mocked DOM + mocked Supabase `sets` table — **15/15 assertions passed**: an untouched
      reps field is correctly default-populated from a real suggestion (`"5"`, not
      invented); `sets` is left alone (no source data for it); a user-typed reps value
      typed BEFORE the suggestion resolves is never clobbered, and `repsTouched` flips
      correctly; zero history never invents a reps value or a suggestion string; a
      simulated Supabase error is caught (never thrown) and never touches `reps`; a
      suggestion-filled value can still be overridden by the user afterward, and that
      override sticks. (b) A live round trip against production Supabase under the
      allowlisted Test Kerwin account (`e5074b4c-3808-4338-aeb7-b9db59d61f49`): inserted
      1 template / 1 block / 1 `template_days` / 1 `template_exercises` row with
      `reps='5'` (the exact bare single-number string this slice's payload now produces,
      not the generic `'8-10'` range) against the live CHECK constraints — succeeded —
      then deleted the template and confirmed zero residue (`tpl_left=0`, `ex_left=0`
      via cascade). **Status: Resolved (Cycle 78, 2026-09-07)** — a genuinely independent fresh
      subagent re-ran 28/28 vm-sandbox assertions (including the decisive repsTouched-survives-a
      -refire case) and independently re-confirmed template_exercises has no weight column, with
      no discrepancies. Full detail in the Cycle 78 Goal Record entry and the story's own Evidence
      field.
      **EPIC-27 parent story status:** stays **Untested/tracking**, not Resolved — Slice 5
      (deferred week-13 renewal, below) is explicitly out of this Wave's build scope, but
      per this Wave file's own standing convention (Slices 1-3's identical note), the
      parent story only flips once every slice — including a disposition on Slice 5 — is
      settled, not merely "the slices we chose to build are done." Slice 5 needs no further
      code this cycle; it needs a decision on whether it's in-scope-deferred or genuinely
      out-of-MVP-scope, which is a product call, not an implementation fork — flagging it
      here rather than silently closing the parent.

- [ ] **Slice 5 — SCOPED 2026-09-07 (Cycle 78, live session), not yet built.** Kerwin's ruling: at
      "week 13" (12-week block end), suggest a next-wave program that shifts emphasis toward
      whichever muscles underperformed relative to their peers in the outgoing block, and adds
      supporting/synergist work for those lagging muscles so the region gets a fully rounded
      stimulus — not just more direct volume on the weak muscle alone. Routed through
      `exercise-science-research` then `llm-council` (Kerwin's explicit direction: "I want the
      science to prevail... push you in that direction, or the council's") before scoping, since
      the mechanics weren't fully settled by citation alone. Full verdict:
      [council-transcript-2026-09-07-epic27-slice5-plateau-prevention.md](http://council-transcript-2026-09-07-epic27-slice5-plateau-prevention.md)
      (report: [council-report-2026-09-07-epic27-slice5-plateau-prevention.html](http://council-report-2026-09-07-epic27-slice5-plateau-prevention.html)).

      **Concrete scope from the verdict, ready for a Plan-stage decomposition:**
      1. **Lagging-muscle metric:** direct-set count (`muscle_primary`-tagged sets), ranked relative
         to sibling muscles trained in the outgoing block. NOT 1RM-growth-rate (too noisy at n=1
         block, no reliable per-muscle trend tracking exists), NOT MEV-floor-relative (adds a
         dependency for no clear gain here).
      2. **Explicitly OUT of this slice's scope:** resolving `FINDING-4` (Notion Bug & QA Log,
         created this cycle — indirect/secondary-mover volume never counted toward per-muscle MEV,
         originally flagged 2026-07-22, never ruled on). Use `muscle_primary`-only counts. Document
         the known approximation this creates (arms/delts may be somewhat over-flagged as lagging)
         rather than silently presenting primary-only as if the 7-week-old gap doesn't exist. Do
         NOT invent a local fractional-volume-credit formula inside this slice — that's
         `FINDING-4`'s decision to make, with its own wider blast radius across every goal's MEV
         floor math ("one rule, one home").
      3. **Mechanism:** extend D20's existing soft-steering approach (`programs.js` `getSingleDay`)
         to run at block-generation/renewal time rather than building a second mechanism. Selection
         of "supporting" exercises for a lagging muscle comes from the exercise bank's existing
         `muscle_secondary` tags — NOT the Transform-goal antagonist-superset machinery (built for a
         different job).
      4. **Doctrine interaction:** no conflict with D1/D15/D27, but sequence, don't merge —
         rebalancing runs once at renewal to set the new block's region/slot emphasis; D1/D15/D27
         continue to govern which specific lift fills each slot *inside* that block, unchanged.
         Rebalancing must not re-run mid-block.
      5. Carried forward, not required for this build: framing the muscle-comparison as a visible,
         user-facing "your program just got smarter about you" moment (the Expansionist lens), and
         a couples-competitive muscle-balance angle as a separate future opportunity — not this
         ticket.

      **Not yet done:** Plan-stage slice decomposition of the above into buildable increments (this
      is scope, not an implementation plan); FINDING-4's own ruling remains outstanding and
      unblocked by this scope decision.

## Invariants for whoever resumes (copied from `.claude/loop-config.md`, not restated from memory)

- Scope-lock: `tandem.html` / `programs.js` only. No schema change — every write in this Wave
  targets already-live tables/columns/CHECK-legal values; if a slice turns out to need a column
  that doesn't exist, STOP and report, don't improvise a migration.
- `max_fix_attempts_per_story: 2` per slice-story; after 2 failed attempts, Needs Human.
- Full ship gate before any slice ships: `npm run verify` (11/11, incl. doctrine),
  `npm run validate:programs`, `npm run validate:personas` (630/630) — run and shown, never
  asserted.
- Independent verification required before a slice's story goes Resolved. This environment has no
  Agent/subagent-spawn tool (re-confirmed Cycle 72) — the honest fallback is a self-performed live
  proof against production Supabase under the two allowlisted test accounts (same discipline
  BUG-56 used this cycle), landing the story at **Passing**, not Resolved, until either a real
  fresh-subagent re-run becomes available or Kerwin exercises the built feature directly.
- Forbidden: touching `scoring`, `matchmaking`, or the `biometric/1RM calculation layer` — Slice 3
  is a read-only consumer of that layer, never an editor of it (see carve-out above).
- No branches: green gates push straight to `origin/main`, verified by reading the ref back.
- Push a Wave-file commit the moment a slice's story flips Resolved/Passing — this file IS the
  resume checkpoint; do not batch checkbox updates to end-of-cycle.

## Progress log

- 2026-09-06 (Cycle 72): Wave created. Epic read in full, live schema read via Supabase MCP
  (`information_schema.columns` + `pg_constraint` for `workout_templates`/`template_blocks`/
  `template_days`/`template_exercises`/`users.program_source`), existing producer/consumer code
  read in full (`adoptTemplate()`, `getActiveProgram()`, `openProgramLibrary()`). Schema-fit fork
  run through `llm-council` (self-performed, disclosed limitation — see transcript) and resolved.
  5 slices cut, ordered by real dependency. Zero slices attempted this cycle — decomposition only,
  per this cycle's instruction to do the decomposition properly rather than rush a single-pass
  build of an XL epic. Untested stories seeded per slice in `feature_tracker_db`, linked to
  EPIC-27's parent Epic (see Notion IDs in the cycle's Goal Record entry).

- 2026-09-06 (Cycle 73): Slice 1 built and independently verified (self-performed, disclosed — no
  subagent-spawn tool in this environment, re-confirmed via ToolSearch). Found and fixed a
  correctness gap in Cycle 72's own recorded council verdict before writing any code: the
  `parent_goal=code_goal_mapping=difficulty='custom'` sentinel is not CHECK-legal (verified via live
  `pg_constraint`, not re-reasoned) — corrected to use the user's own already-canonical
  `cfg.goal`/`cfg.experience`. `createCustomTemplate()` added to tandem.html. `npm run verify`
  11/11, `validate:programs` and `validate:personas` 630/630 all green. Live write-sequence proof
  under Test Kerwin, cleaned up with verified zero residue. Story flipped Untested → Passing.
  Slice 2 (Builder UI) is next; Slice 1's function has no UI caller yet, by design.

- 2026-09-06 (Cycle 74): Slice 2 (day/exercise increment) built and independently verified
  (self-performed, disclosed — same environment limitation, re-confirmed via ToolSearch). Verified
  the wave file's own prior claims against real code before extending it (Cycle 73's lesson): read
  `createCustomTemplate()` in full, confirmed via `grep` that no builder UI or caller existed yet
  (only the Slice 1 function itself), confirmed `exercises.name` is unique (179/179 distinct) before
  relying on name→id lookup for the autocomplete. Shipped the modal, entry-point button, and 9 JS
  functions. Two-part verification: (a) 22/22 assertions against the verbatim-extracted shipped
  code in a Node `vm` + mocked DOM/Supabase harness, (b) a live end-to-end write under Test Kerwin
  using real `exercises.id` values the UI logic itself resolved, cleaned up with verified zero
  residue. `npm run verify` 11/11, `validate:personas` 630/630. Story flipped Untested → Passing.
  Superset grouping (originally bundled into "Slice 2" in the Cycle 72 decomposition) is split out
  as an explicit remaining sub-step rather than silently declared done — the day/exercise save path
  is independently useful without it. Slice 3 (per-exercise suggestion, read-only 1RM consumer) is
  next.

- 2026-09-07 (Kerwin-ruling session): Asked Kerwin the Slice 5 MVP-vs-build scope question; he
  rejected both options and challenged the underlying fixed-12-week premise (6wk/8wk examples).
  Audited `/DOCTRINE.md` + `scripts/doctrine.mjs` + `programs.js` source-first rather than treating
  this as a new science question, and found the Cycle 72 council verdict had **miscited D15**
  (primary-compound refresh cadence) as the block-length doctrine — the real one is **D7** (4-12wk,
  ACTIVE), already fully implemented engine-wide via `DELOAD_TABLE`/`deloadWeeks()`/
  `primaryBlockStarts()`. Kerwin's ask requires no research and no council — it's a Slice-1 scope
  gap (`createCustomTemplate()` hardcodes 12 instead of reading a caller-supplied week count), not
  a doctrine conflict. Added Slice 6 (user-selectable 4-12wk duration) as the real successor to
  Slice 5's narrower "week 13 renewal" framing. No code written this session (Notion/docs-only
  scope) — Slice 6 is the next Fix pass's entry point.

- 2026-09-06 (Cycle 75): Slice 3 (per-exercise suggestion) built and independently verified
  (self-performed, disclosed — same environment limitation, re-confirmed via ToolSearch). Baseline
  confirmed failing first (grepped for `builderLoadSuggestion`/`prescriptionOneRM` calls inside the
  builder — none existed; `addBuilderExercise()` hardcoded sets/reps/rest with no history lookup).
  Resolved a fork this Wave file itself had left latent (Forbidden-ops section names
  `prescriptionOneRM()`/`weekFactor()` as what Slice 3 reads, but the Slice 3 bullet's own SHOULD
  text specifies a phase-free "most recent logged weight/reps" read) by following the narrower,
  already-written SHOULD text rather than the broader Forbidden-ops framing — recorded above under
  Slice 3 rather than escalated, since re-reading the two passages together left no genuine
  unresolved question. Caught and fixed a real focus-stealing bug in the first draft before
  shipping (a synchronous `renderBuilderDays()` call on every keystroke, not just on a resolved
  match) — see Slice 3 entry above. Two-part verification: (a) 21/21 assertions against the
  verbatim-extracted shipped code in a Node `vm` + mocked DOM/Supabase harness, (b) a live
  insert/query/delete round trip under Test Kerwin with confirmed zero residue. `npm run verify`
  11/11, `validate:personas` 630/630, `validate:programs` clean. Story flipped Untested → Passing.
  Slice 4 (manual override / pre-populating sets-reps-weight from this suggestion, always
  user-editable) is next.

- 2026-09-06 (Cycle 76): Slice 4 (manual override) built and independently verified
  (self-performed, disclosed — same environment limitation, re-confirmed via ToolSearch).
  Baseline confirmed failing first: read `builderLoadSuggestion()`/`addBuilderExercise()`
  before writing any code — the suggestion was display-only, `ex.sets`/`ex.reps`/`ex.rest`
  were only ever set once at row creation and never touched again. Found and corrected this
  bullet's own prior wording before building against it: checked the LIVE
  `information_schema.columns` for `template_exercises` and found no `weight` column exists
  at all (sets/reps/rest/role/technique only), and re-read `builderLoadSuggestion()`'s own
  query and found it fetches a single most-recent SET row with no `sets` COUNT — so only
  `reps` has real source data to default-populate from; `sets`/`weight` do not, and building
  them anyway would have meant either inventing a number or reaching into the
  forbidden-scope calibration/1RM layer for a value with nowhere legitimate to be persisted.
  Shipped `builderEditReps()` (new named oninput handler replacing the prior inline setter,
  so it can flip a new `repsTouched` guard flag) and extended `builderLoadSuggestion()` to
  write `reps` from the real fetched value only when the user hasn't already typed their
  own — the actual mechanism behind "always user-editable": a suggestion may pre-fill, it
  must never clobber a typed value, which matters because the suggestion fetch is async and
  can resolve after the user has already started customizing the row. Two-part verification:
  (a) 15/15 assertions against the verbatim-extracted shipped code in a Node `vm` + mocked
  DOM/Supabase harness (untouched-field pre-fill, no-sets-invention, typed-value survives a
  later suggestion, zero-history invents nothing, error path never throws and never touches
  reps, post-suggestion manual override still sticks), (b) a live insert of a real
  `template_exercises` row with `reps='5'` (the slice's actual new single-number payload
  shape, not the old `'8-10'` range) under Test Kerwin, succeeding against live CHECK
  constraints, then deleted with confirmed zero residue. `npm run verify` 11/11,
  `validate:personas` 630/630, `validate:programs` clean. Story
  `EPIC-27-slice4-manual-override` flipped Untested → Passing. EPIC-27's parent story stays
  Untested/tracking, not Resolved — Slice 5 (deferred week-13 renewal) still needs an
  explicit in-scope-deferred-vs-out-of-MVP disposition, which is a product call flagged
  above, not code this cycle picked up.

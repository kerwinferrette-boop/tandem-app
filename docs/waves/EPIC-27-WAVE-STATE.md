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
      zero residue across all four tables via cascade. **Status: Passing, not Resolved** — same gap
      as BUG-56/BUG-88 this project cycle; Resolved requires either a real fresh-subagent re-run or
      Kerwin exercising the (still UI-less) feature directly once Slice 2 ships.
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
      all four tables. **Status: Passing, not Resolved** — same gap as every prior slice this
      project; Resolved requires a real fresh-subagent re-run or Kerwin exercising the feature
      directly in the live app.
      **Remaining Slice 2 sub-step, not yet built:** superset-grouping input on top of this same
      modal. Tracked here rather than silently folded into "Slice 2 done" — the day/exercise save
      path is real and usable without it (a custom template with no supersets is a fully legal
      template), so this does not block Slice 3.

- [ ] **Slice 3 — Per-exercise suggestion (READ-ONLY consumer of existing 1RM/progression code).**
      Depends on Slice 2 (needs a picked exercise to suggest against). Queries the current user's
      own `sets` history for the picked `exercise_name`/`exercise_id`, surfaces the most recent
      logged weight/reps via the SAME earned-always-wins resolution order `prescriptionOneRM()`
      already uses (D11/D22 — already verified by BUG-56 this cycle to need no new code for a
      similar "last real session" read). No exercise-science invention: if no history exists for
      that lift, show no suggestion (blank/zero is legal here — the schema's NOT NULL sets/reps
      are satisfied by Slice 4's manual entry in that case, never a fabricated default).
      Forbidden-ops carve-out above applies to this slice specifically.

- [ ] **Slice 4 — Manual override path.** Depends on Slice 3. Sets/reps/weight inputs
      default-populated from Slice 3's suggestion (or blank if none), always user-editable before
      Slice 1 commits the row — satisfies Expected Behavior item 3 verbatim and is what keeps
      `template_exercises.sets`/`reps` NOT NULL honestly satisfied (a concrete value always exists
      by the time Slice 1 writes, sourced from suggestion-or-override, never invented server-side).

- [ ] **Slice 5 — DEFERRED, not scheduled, flagged so it isn't silently dropped.** "Week 13"
      behavior for a custom template that outlives its nominal 12-week block (renew the same
      block forward vs. prompt the user to open the builder again vs. something else). No
      Expected Behavior text requires this for EPIC-27's MVP; recorded here per the council verdict
      so a future cycle doesn't have to rediscover the gap from scratch.

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

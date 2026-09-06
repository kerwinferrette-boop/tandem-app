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
- `parent_goal = code_goal_mapping = difficulty = 'custom'` — literal sentinel values. Verified
  inert: `openProgramLibrary()` (tandem.html:2640-2642) filters `.eq('is_published', true)` when
  reading these columns for display, and every EPIC-27 template is `is_published=false`, so this
  sentinel never surfaces as a fabricated taxonomy claim anywhere a user can see it.
- `program_source = 'template'` (not `'library'`) — the reserved, dead-until-now value.
- Deferred, **not** built in this Wave, tracked as Slice 5 below: what happens when a custom
  template's user passes week 12. No renewal/extension mechanism is being promised or half-built.

## Forbidden-ops carve-out (per `.claude/loop-config.md` safety.forbidden, 2026-08-30 council addition)

Slice 3 (suggested weight/reps) reads the existing 1RM/progression machinery
(`prescriptionOneRM()`, `weekFactor()`, Epley calc) — **read-only, as a consumer**. No slice in
this Wave may modify those functions, their resolution order, or any scoring/matchmaking logic. If
building Slice 3 surfaces a case those functions don't already serve (e.g. "no program-phase
context for an arbitrary user-picked exercise"), that is a **stop-and-escalate** finding — Needs
Human via `still_needs_kerwin`, not an inline patch to the biometric layer.

## Step status

- [ ] **Slice 1 — Data-write path.** New function (working name `createCustomTemplate()`),
      scope-locked to `tandem.html`. Writes, in order (mirrors `adoptTemplate()`'s own ordering
      discipline for the D16/`program_principles` trigger — see BUG-77 pt.2 comment at
      tandem.html:2718): `workout_templates` (author_id=uid, is_published=false, the sentinel
      values above, `science_overrides={}`), one `template_blocks` row, N `template_days` rows
      (label + day_order from the builder's day list, muscle_targets derived from that day's
      selected exercises' `exercises.muscle_primary`), `template_exercises` rows (day_id,
      exercise_id, ex_order, sets, reps, rest, role — **sets/reps always concrete, never blank**,
      sourced from Slice 4's resolved value, never invented). Then caches the identical bundle
      shape into `tandem_adopted_program` (matching `adoptTemplate()`'s cache write at
      tandem.html:2783-2784), sets `cfg.programSource='template'`, `currentWeek=1`,
      `syncToCloud()`.
      SHOULD: reuse the existing authored-program contract end to end (D16 two-tier doctrine —
      no `science_overrides` claimed, so D16's cited-override requirement does not bite; matches
      the adductor-machine precedent reasoning for "no doctrine conflict, isolation-tier addition
      only"). COULD: a brand-new `program_source` value or new tables — rejected, `'template'` is
      already legal and already has a tested consumer. DID/RECONCILE: fill in at Fix/Verify time.
      **Independently verifiable:** create one custom template via direct Supabase MCP writes
      under an allowlisted test account, confirm `getActiveProgram()` renders it (already-built
      branch, no code change needed there), confirm `npm run verify` (incl. authored-safety-smoke)
      stays green, confirm cleanup leaves zero residue.

- [ ] **Slice 2 — Builder UI.** Depends on Slice 1. New modal/screen: day list (add/remove/label
      days), per-day "+ Add Exercise" autocomplete text input against `EXERCISE_BANK`
      (search-as-you-type — the UI shape Kerwin resolved 2026-08-21, superseding the old
      drag-card-vs-form debate; do not reopen that decision), superset grouping input (reuses
      existing `SUPERSET_CFG`/rendering convention per CLAUDE.md's "one rule, one home" — do not
      build a second superset table). Calls Slice 1's write function on save.
      **Independently verifiable:** Playwright-style walkthrough (same harness shape as
      `walkthrough:onboarding`) reaches a built, saved template with >=1 day and >=1 exercise with
      zero console errors, using the stubbed-Supabase discipline that script already established
      (zero live-network risk for this UI-only slice).

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

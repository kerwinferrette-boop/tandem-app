# Loop config — Tandem (example)

This shows how the generic skills plug into a project that already has its own TPM-style discipline, rather than duplicating it.

```yaml
project_name: "Tandem"

codebase_root: "."                # app = tandem.html (main, vanilla JS) + programs.js
                                  # (static data layer: ICONS/PHASES/VIDEO_IDS/getProgram,
                                  # extracted 2026-06-11, loaded via <script src> before main).
                                  # Both files must be catalogued and syntax-checked.
existing_project_skill: "tandem-tpm"   # Fix/Verify defer to tandem-tpm's own Execution Mode:
                                        # Bug Fix procedure (scope-lock, read-before-edit,
                                        # node --check, SQL-verified behavior) instead of the
                                        # generic feature-loop fix instructions.

catalog:
  mode: "tracker_seeded"        # Kerwin's directive (2026-06-23): DO NOT reverse-engineer the
                                # codebase to invent PRODUCT opinions or speculative features.
                                # Seed user stories from items he has authored — open Bug & QA Log
                                # rows, open Epics, and Features — one story per tracked item,
                                # linked back to its source Bug/Epic. SKIP the generic code-catalog
                                # stage (agents/catalog.md); it is not the coverage map he wants.
  discovery_handling: "file_to_bug_log"
                                # Anything the loop trips over while testing is logged as a NEW
                                # Bug & QA Log row (and a new Untested story linked to it), then
                                # worked through that same channel — never silently auto-fixed off-book.

  self_generated_sources:      # Added 2026-07-13, per Kerwin: "0 Untested + 0 Failing" should not
                                # mean the loop is out of work — it means the loop hasn't looked
                                # hard enough. These are STANDING, run-every-cycle inputs to
                                # CATALOG, distinct from tracker_seeded's "only what Kerwin wrote
                                # down" rule above. The distinction that keeps this from violating
                                # the 2026-06-23 directive: these are DETERMINISTIC, OBJECTIVE
                                # structural test harnesses (a rule either holds across the SKU
                                # matrix or it doesn't) — not the loop guessing at product opinions
                                # or inventing features nobody asked for. A finding here still gets
                                # filed through discovery_handling (a real Bug & QA Log row +
                                # Untested story) before anything is fixed — never fixed off-book.
    - name: "persona_matrix"
      what: "npm run validate:personas (scripts/persona-matrix.mjs) — sweeps getProgram() across
             every combination of the axes it actually branches on today (goal × days × sex ×
             equipment tier × injury profile — see the script for the exact matrix and why age/
             height/weight/experience are deliberately excluded until EPIC-8 wires them in).
             Structural rules: core-block presence (R6), cardio-block presence (R7),
             injury-contraindication leaks (R8), equipment-tier violations (R9), plus the
             existing validate:programs rules (R1/R2/R3/R5)."
      when: "Run once per cycle, even when the tracker shows 0 Untested + 0 Failing. Any NEW
             failing combo (one not already covered by an open Bug Log row) gets filed via
             discovery_handling, exactly like a bug the loop trips over while fixing something
             else — same New→Untested→batch pipeline, no shortcut to Resolved."
      first_run_finding: "2026-07-13 — found the entire 'home' equipment tier bypasses the
             dynamic generator (100% of combos), filed as a new P0 Bug & QA Log row. See that
             row for detail; this is the reason the source exists at all — a single-profile or
             tracker-only loop had no way to surface it."
    - name: "onboarding_lifecycle_walkthrough"
      what: "npm run walkthrough:onboarding (scripts/onboarding-lifecycle-walkthrough.mjs) —
             a Playwright-driven, live-browser walkthrough of the onboarding wizard (all
             gated steps, in both a natural top-to-bottom fill order AND a reversed
             last-field-touched-first order) through 'Build My Program', then into the
             dashboard → tracker → expand an exercise card → log a set → Finish. Captures:
             any step where the Next/Build button never enables despite all required fields
             being valid (the BUG-61 class of order-dependent gating bug — a field with no
             re-check handler leaves the button stuck if it's the LAST one touched), any JS
             exception/console error during the run, and any dead-end where a required
             control doesn't render. It does NOT drive real Supabase — the CDN script is
             stubbed with a self-mocking Proxy so this runs with zero network egress and
             zero risk to real user data; program-generation correctness itself stays
             covered by validate:programs / validate:personas, this source is purely about
             whether a user can physically GET THROUGH the flow that produces a cfg in the
             first place.
             Origin (Kerwin, 2026-07-30, in-app bug report that became BUG-61): 'Go through
             a plan from plan creation to the end of the program, note each error, instead
             of fixing it then and there, note it, finish the program, then go back & at a
             macro level see why the error is happening.' This script is the DISCOVERY half
             of that ask — it notes findings, it never fixes anything itself and never
             writes to Notion directly (findings get filed as new Bug & QA Log rows +
             linked Untested stories via discovery_handling below, same as persona_matrix).
             The 'go back at a macro level' RCA half is a job for whichever cycle reviews
             the findings, not something the script does automatically.
             KNOWN GAP (be honest about scope, don't overclaim): Phase 1 only reaches Build
             Program + one set-log + Finish on Week 1. It does NOT yet fast-forward through
             multiple weeks to a program's real final/realization week, and it does not
             exercise auth/sync/RLS (those stay forbidden-scope for this unattended loop
             regardless — see safety.forbidden below). Extending it to a real multi-week
             fast-forward (e.g. by writing tandem_week/tandem_current_day into localStorage
             directly rather than literally waiting out a program) is a candidate for a
             future cycle to pick up as its own item, not something to silently claim done."
      when: "Run once per cycle, even when the tracker shows 0 Untested + 0 Failing — same
             standing-source rule as persona_matrix. Any NEW finding (one not already
             covered by an open Bug Log row) gets filed via discovery_handling below, exactly
             like a bug the loop trips over while fixing something else."
      first_run_finding: "2026-07-30 — built in response to BUG-61 (onboarding Next button
             stuck if Weeks was filled after Training Days — filed from Kerwin's in-app bug
             report, fixed same session, commit 0f31a8e on main). Verified the harness has
             teeth before relying on it: ran clean (0 findings) against the fixed code, then
             deliberately reverted the fix in the working tree and re-ran — the script
             correctly caught the exact regression ('Next button did not enable... reverse
             order... BUG-61 class'), then the working tree was restored to the real fix.
             This is the reason the source exists at all — no existing standing check
             (persona_matrix, validate:programs, verify) ever drives the onboarding UI, so
             this entire class of bug had zero chance of being caught before a human hit it."

    - name: "exercise_intake_promotion"
      what: "The 🧬 Tandem — Exercise Intake Notion database (686275b5-60e3-4b30-80dc-9d85a260a557) —
             where the separately-run tandem-exercise-science-ingestion Cowork skill stages
             source-vetted exercise candidates. That skill NEVER edits code or Supabase (by its own
             scope). Nothing else promotes an 'Approved' row into EXERCISE_BANK — this is the gap
             this source closes. Query the intake DB for Status='Approved' rows each cycle; for
             each, add the additive EXERCISE_BANK entry to programs.js (name/muscleGroups/
             equipment/tier/category/why/cues per the row's fields), regenerate
             migrations/epic031_exercises_seed.sql via scripts/sync-exercise-bank.mjs so code and
             the seed file agree (apply_migration stays human-only, same as every other schema
             path), then flip the intake row's Status to 'Merged' with the commit sha in 'Merged
             Commit'. This is squarely in-scope, additive-only code work — the same shape already
             used for BUG-84/86/88's sourced entries — NOT discovery/research, which stays entirely
             in Cowork's ingestion skill. Do not run ingestion itself from this loop; only consume
             its 'Approved' output."
      when: "Run once per cycle, even when the tracker shows 0 Untested + 0 Failing — same
             standing-source rule as persona_matrix. A merged entry gets logged in the cycle
             report and the run_log_db the same as any other fix; it does not need its own
             Bug/Epic row first since the intake DB IS its own tracker (Approved -> Merged is
             the whole lifecycle for this source)."
      first_run_finding: "2026-08-21 — added per Kerwin's directive in-chat: ingestion (research/
             sourcing) stays in Cowork; the code-merge step belongs in this loop instead, since it's
             ordinary scope-locked EXERCISE_BANK work, not speculative discovery. No rows were
             Approved as of this writing — first real run TBD."

    - name: "code_contradiction_audit"
      what: "A periodic read-only sweep for two-code-paths-disagree issues (the kind of thing
             '38fca37f935b8142808af5e9c16c9894' — Code Contradictions & Stale-Code Audit —
             already catalogs by hand). Not yet scripted; candidate for the same treatment as
             persona_matrix once there's a concrete, repeatable check to automate (e.g. \"every
             call site of X passes the same arguments\", \"no two functions compute the same
             derived value differently\")."
      when: "Ad hoc today — promote to a standing script the same way persona_matrix was built,
             next time a session does one of these audits by hand."

wave_decomposition:   # Added 2026-08-30, per the llm-council verdict on why every Epic bigger
                      # than a one-file change was parking in Needs Human instead of getting
                      # built. See .claude/skills/feature-loop/agents/plan.md for the mechanism
                      # and .claude/skills/feature-loop/SKILL.md Stage 1.5 for where it's wired in.
  wave_file_pattern: "docs/waves/<EPIC-ID>-WAVE-STATE.md"   # one file per Epic, checked into git.
                      # This IS the checkpoint. A slice's status flips to done in this file, and
                      # the file is committed, the moment the slice's story goes Resolved — not
                      # batched to end-of-cycle. There is no other resume mechanism: the daily
                      # cron firing is what "resumes" a Wave, by reading this file and continuing
                      # from the first unchecked step. Do not build anything that waits for a
                      # credit-refresh signal — that primitive does not exist and promising it
                      # would be the same failure shape as the REST_SECONDS silently-discarded
                      # value CLAUDE.md already warns about.
  conglomeration:       # Added 2026-09-04, per Kerwin, in-session: a Wave is not limited to one
                      # Epic. Conglomerate Epics + Bug & QA Log rows + Untested/Failing stories
                      # into ONE wave whenever they touch the same area, share a dependency, or
                      # can plausibly ship in the same PR — the goal is the fewest prompts/PRs
                      # that clear the most tracked rows, not one row per prompt.
    file_pattern: "docs/waves/WAVE-<N>-<slug>-STATE.md"   # for a multi-item conglomerate wave
                      # that isn't anchored to one Epic. Same checkpoint discipline as the
                      # per-Epic file above: check off a step and commit the file the moment
                      # that step's story goes Resolved, never batched to end-of-cycle.
    batch_cap_override: "safety.max_items_per_cycle (5) caps an ORDINARY per-story cycle. It does
                      NOT cap what a single conglomerated wave may bundle — a wave's own natural
                      scope (what genuinely ships and verifies together) is the batching unit, not
                      a fixed count. Do not split one coherent, independently-shippable wave into
                      artificial 5-item chunks just to satisfy the ordinary cap; do not, in the
                      other direction, cram unrelated rows into one wave just to inflate the count
                      the cap would otherwise limit — the cap exists so a batch stays reviewable
                      and independently verifiable, and that reason still applies inside a wave."
    verification_gate: "A wave step counts as VERIFIED — eligible to flip its story to Resolved —
                      once EITHER (a) Kerwin explicitly confirms it, OR (b) llm-council reaches a
                      verdict on it, IN ADDITION TO the standing mechanical prerequisites (green
                      ship gates, independent fresh-subagent re-run per feature-loop's Verify
                      stage). Neither (a) nor (b) waives the gates or the fresh-agent re-run —
                      they are the answer to 'whose judgment call does this rest on', not a
                      substitute for 'does the code actually work'. This is Kerwin's own framing,
                      2026-09-04: 'as long as the wave has been verified by either myself or the
                      LLM council, either one.'"
  epic_priority_weight:   # Kerwin's product-vision call (2026-08-30), not the loop's to infer.
                      # A multiplier applied when Plan/project-goal chooses which eligible Epic to
                      # Wave next, several being otherwise equally ready. Adjust the list, not the
                      # mechanism, when priorities change.
    - tags: ["on-demand-workout-generation", "personal-trainer"]
      weight: 2
    - tags: ["competition", "gamification", "head-to-head"]
      weight: 2
    - tags: []   # everything else
      weight: 1
  first_run_validation: "PASSED 2026-08-30 — dry-run of agents/plan.md against EPIC-8 (blind to
                      the real 2026-07-21 EPIC-8a/8b/8c/8d decomposition), diffed by a human-
                      informed reviewer against that ground truth. Full review:
                      docs/waves/EPIC-8-VALIDATION-DRY-RUN-WAVE-STATE.md. Result: 3 of 4 real
                      sub-epic boundaries reproduced (one more safely than the original build —
                      it independently avoided re-adding the experience-keyed rest table that
                      EPIC-8a actually built and later had to delete, D23/D4b), plus one
                      previously-unnamed live bug found (barbell_rack collapses into full_gym,
                      tandem.html:2500) and two correct forbidden-ops carve-outs fired on a real
                      case. One miss (EPIC-8d/BUG-44) traced to the dry run's own withheld
                      linked-Bug context, not a mechanism defect — SPOT-CHECK on the first LIVE
                      Wave: confirm Plan actually reads and folds in the Epic's Linked Bugs
                      relation (agents/plan.md §1) before trusting that path further. Waves this
                      stage produces are no longer gated to draft-only; Fix may execute from a
                      live Wave once it exists."

escalation:           # Added 2026-08-30, per the llm-council verdict. Replaces most "ask Kerwin"
                      # routing for Plan/Fix with "ask the council" — Kerwin explicitly asked for
                      # this ("they should be your go-to anyway") and reserved himself for real
                      # product/business calls, not implementation judgment calls.
  default_for_forks: "llm-council"   # An implementation fork the Epic's own spec doesn't resolve
                      # (which of two reasonable slice boundaries, which of two sources should
                      # govern a rule) gets a council verdict + citation recorded in the Wave/story,
                      # not a Needs-Human row. This does NOT relax doctrine_is_law or
                      # source_first_rigor below — a council verdict is not a substitute for a
                      # citation, it's how a genuine judgment call the science doesn't decide gets
                      # made instead of guessed.
  still_needs_kerwin:  # The guardrail is mechanical (this list), never "how big is this decision."
    - "everything already in safety.forbidden below, including the 2026-08-30
       scoring/matchmaking/biometric-layer addition"
    - "a genuine product/business call — which Epic to build at all, what a feature should feel
       like, a pricing or competitive decision — as opposed to an implementation fork inside an
       Epic Kerwin already greenlit"
    - "anything the council itself declines to resolve, or where two council runs on the same
       question would plausibly disagree (i.e. the split isn't converging)"
    - "the outcome gate itself (npm run outcome / .claude/loop-config.md's OUTCOME RULE) — it turns
       green only when a real person trains a lift more than once and gets stronger, which is
       structurally outside what a wave, a prompt, or a council verdict can produce. This is NOT
       a 'still needs Kerwin to rule on a fork' item like the two above it — it is a metric, not a
       backlog row, and stays reported as its own line, never merged into the row count below."
  visibility: "Every council-decided-and-self-executed decision gets one line in the Goal Record's
       '## Cycle log' entry for that cycle, tagged [COUNCIL] — decision + one-line citation/verdict
       + what it unblocked. This is the morning digest: Kerwin should be able to scan one cycle-log
       entry and know what was decided autonomously that day, not have to ask."
  exhaust_before_parking: "Added 2026-09-04, per Kerwin, in-session: 'there are always more things
       that can be pushed, written, or condensed into fewer prompts' — a cycle does not get to write
       a tracked row to Needs Human until it has tried, in order: (1) does an already-cited source
       resolve this outright — ship it, no escalation needed; (2) is this row conglomerable into an
       existing or new wave with other open rows that share a dependency or an area — fold it in
       rather than triaging it alone; (3) is this genuinely on the still_needs_kerwin list above —
       if yes, Needs Human, full stop, no further attempt; (4) otherwise, run llm-council on the
       fork and act on its verdict per wave_decomposition.conglomeration.verification_gate. A row
       may reach Needs Human only after step (4) fails to converge or step (3) applies — never as
       the first thing tried on a fork that isn't a genuine product/business call or a
       safety.forbidden item."
  reporting: "'GOAL NOT MET' is a Definition-of-Done statement (Goal Record §Definition of Done),
       not a verdict on whether the cycle did anything. Report backlog status and the outcome gate
       as two SEPARATE lines, never conflated: backlog status is 'N rows Untested/Failing, M rows
       genuinely Needs Human (each citing which still_needs_kerwin item applies), K resolved this
       cycle via wave/council' — and per exhaust_before_parking above, a cycle that reports M rows
       Needs Human without showing the (1)-(4) attempt sequence for each one is incomplete, not
       honestly conservative. The outcome gate is reported as its own number (see OUTCOME RULE)
       and is allowed to stay red indefinitely without that being read as the cycle having failed
       to do its job — it is the one thing on this page this loop cannot self-satisfy by writing
       more code, and pretending otherwise (fabricating backlog busywork to avoid an honest 'red')
       would be exactly the D18/BUG-79 fabrication failure mode CLAUDE.md forbids."

notion:
  feature_tracker_db: "fcfd09db-695c-4e01-93a2-90bed2abacdc"  # Tandem User Story Coverage — EXISTS, already linked to Bug Log + Epics
  bug_log_db: "caaf2179-c4e4-4ce1-9a32-eb46ffdbd6a0"      # existing Bug & QA Log, reused as-is
  run_log_db: "0e481ffb-04f0-43db-bf39-09eb3551bd6c"      # existing Context Handoff, reused as-is
  # Goal Record (project-goal Step 1): this DB has NO Status/Objective/Cycle-Count columns,
  # so the Active Goal Record is a distinguished PAGE whose title starts
  # "⭐ LOOP GOAL RECORD — ACTIVE". project-goal finds it via notion-search (NOT SQL — query
  # mode is plan-gated on this workspace) and reads/writes its machine-checkable state from the
  # page-body "## State" block (STATUS / CYCLE_COUNT / LAST_SNAPSHOT) + appends to "## Cycle log".
  # Live page: https://app.notion.com/p/389ca37f935b81998d2bcebf0a364c52

  # Status-vocabulary note: the feature-loop/project-goal SKILL text says "Won't-Fix"
  # for the terminal "decided not to fix" state. The User Story Coverage DB encodes
  # that same state as "Skipped". Treat Skipped == Won't-Fix when reading/writing status.
  # DB Status options: Uncatalogued, Untested, Passing, Failing, Fixing, Needs Human, Resolved, Skipped.

verification:
  syntax_check_command: >
    awk '/<script>/{f=1;next}/<\/script>/{f=0}f' tandem.html > /tmp/extracted.js
    && node --check /tmp/extracted.js
    && node --check programs.js
  validate_command: "npm run validate:programs"   # EPIC-24 validator — 24 combos, Rules 1-5
  persona_matrix_command: "npm run validate:personas"  # scripts/persona-matrix.mjs — see
                                # catalog.self_generated_sources above; run every cycle, not
                                # just when fixing a generator story. 504 combos, Rules 6-9.
  onboarding_walkthrough_command: "npm run walkthrough:onboarding"  # scripts/onboarding-
                                # lifecycle-walkthrough.mjs — see catalog.self_generated_sources
                                # above (onboarding_lifecycle_walkthrough); run every cycle.
                                # Exit code 0 = no findings; non-zero = findings printed to
                                # stdout, file each via discovery_handling before fixing.
                                # Requires `npm install` once (playwright devDependency,
                                # pinned to match this environment's pre-fetched browser —
                                # see package.json; a different environment may need
                                # `npx playwright install chromium` if the pin mismatches).
  ship_gate_command: "npm run verify"   # full gate: syntax + validate:programs + C7 smoke
                                # (calibrated/derived weight override) + lastsets churn smoke
                                # + DOCTRINE conformance (Notion law — scripts/doctrine.mjs)
  test_command: "per-story SQL assertion (see each story's Test Assertion SQL field)"
  db_connector: "Supabase MCP — project zsvktcvqmppsshtpeljt"

  standing_test_sweep:   # Kerwin's directive, 2026-07-21 — run every cycle that touches
                          # generation code (EXERCISE_BANK, bank()/pick(), dedupe*, getProgram),
                          # not only when a story's own narrow assertion calls for it.
    - "1. Test against each feature, not just the current batch's stories."
    - "2. Run generation through BOTH matrices every time: validate_command AND
       persona_matrix_command — not one or the other."
    - "3. Also run ship_gate_command every time (it exercises paths — calibrated/derived
       weight override, lastsets identity — the other two don't touch; it silently failed
       for a full cycle before Kerwin caught it directly on 2026-07-21) and probe edge cases
       between generations beyond the enumerated combos (e.g. bank-insertion-order stability —
       does adding one exercise silently reassign exercises in an unrelated muscle group? —
       see BUG-45's dummy-entry insertion test for the pattern)."
    - "4. Report back mapping each finding to the specific code fix that resolves it. Log the
       run as a page in run_log_db (Files Modified / What Was Accomplished / Linked Bugs), and
       record each fix in the Bug & QA Log's \"Code Fix\" column (added 2026-07-21) on its bug row —
       not just pass/fail counts."

  doctrine_is_law:   # Kerwin's directive, 2026-07-22 — the Notion collection is LAW, not reference.
                      # This is how the engine stays cohesive instead of drifting into random lifts.
    - "Notion is the source of truth; /DOCTRINE.md mirrors it; scripts/doctrine.mjs enforces it inside
       ship_gate_command. A change that violates an ACTIVE D-invariant CANNOT ship — it is wrong by
       definition, not a judgment call."
    - "EVERY program-touching bug fix / feature / QA story must name the governing Notion doc
       (5-Goal Taxonomy / Programming Architecture Reference / Exercise Science Schema v0.5 /
       Periodization Spec) and state how it conforms, in the Epic/Bug entry. No citation, no ship."
    - "When you build a phase that makes a PENDING invariant true (D4 deloads, D5 supersets, D7
       per-length layout, …), PROMOTE it to an ACTIVE assertion in doctrine.mjs in the SAME change.
       Never delete a PENDING to make the gate green; never weaken the gate to pass. If doctrine
       itself must change, change Notion first, then /DOCTRINE.md and doctrine.mjs together."

  source_first_rigor:   # Kerwin's directive, 2026-07-22 — the recurring errors all share one shape:
                         # reasoning from plausibility instead of the source. This kills that.
    - "For ANY exercise-science or program-logic change, INVOKE the exercise-science-research skill
       FIRST (source-first, no shortcuts). It is mandatory, not advisory. See CLAUDE.md."
    - "Never state a training fact or ship program logic from memory. Cite the source (DOCTRINE.md,
       the Notion docs, research-report.pdf/docx/csv, or a reputable external source) or flag it
       UNVERIFIED. 'Typically / standard / usually' means stop and go read."
    - "Write the should/could/did audit (CLAUDE.md) into every program-logic commit + Notion entry.
       Run it BEFORE shipping, not after Kerwin catches the error. When the source is silent, FLAG
       the gap — never fabricate a number, coefficient, or rule."

safety:
  max_items_per_cycle: 5
  max_fix_attempts_per_story: 2
  destructive_ops_require_human: true
  forbidden:
    - "writing to sb.from('sessions') — ghost table, correct name is workout_sessions"
    - "writing to sb.from('prs') — ghost table, correct name is personal_records"
    - "writing to sb.from('user_config') — ghost table, correct name is users"
    - "any DELETE outside the allowlisted ghost-session cleanup rule already defined in
       tandem-data-integrity-audit — that skill's attended/unattended distinction still
       applies and is NOT overridden by feature-loop's full-autonomy fix setting"
    - "ADDED 2026-08-30, per the llm-council verdict on autonomous Wave-building: any change
       touching SCORING, MATCHMAKING (head-to-head competition logic), or the BIOMETRIC/1RM
       CALCULATION LAYER requires Kerwin, full stop, regardless of council verdict. Not because
       it's hard — because a plausible-but-wrong architectural call in exactly these areas does
       silent damage nobody catches for weeks, which is this project's single most repeated
       failure pattern (see docs/2026-08-17-why-56-cycles-missed-it.md). Plan (agents/plan.md)
       must carve any such piece of an Epic out as its own Needs-Human line item rather than
       decomposing it; Fix must never touch it even as a small, in-scope-looking slice."
```

## Resolved — the tracker DB already exists

The `feature_tracker_db` no longer needs creation. **Tandem User Story Coverage**
(`fcfd09db-695c-4e01-93a2-90bed2abacdc`) already exists with the exact schema this
pipeline wants: Story ID (title), User Story, Expected Behavior, Feature Area, Source,
Evidence, Retry Count, Status [Uncatalogued/Untested/Passing/Failing/Fixing/Needs
Human/Resolved/Skipped], plus relations Linked Bug → Bug & QA Log
(`caaf2179-c4e4-4ce1-9a32-eb46ffdbd6a0`) and Linked Epic → Epics & Feature Roadmap
(`c0c5bdda-1b33-4923-8308-9078e2fd68c5`). Both Bug Log and Epics carry the reciprocal
"Linked User Story" relation, so a story can point back at the bug/epic it covers.

This keeps granularity clean: per-behavior user stories live in User Story Coverage
(the loop's working tracker), the Bug Log and Epics stay as the human-facing queues,
and tandem-tpm reconciles a story's Resolved status back onto its linked Bug/Epic.

## ⛔ THE OUTCOME RULE — read before anything else in this file (2026-08-17)

**A cycle is not done because the code is legal. A cycle is done when a real person is
measurably getting stronger.**

### What happened

2026-08-17, Kerwin asked to see his bench press from seven weeks ago. He couldn't: the app had
prescribed bench press **once, 60 days earlier**. Across his whole history, **27 of 44 tracked
exercises had exactly one session**. In the trailing 8 weeks: 34 exercises trained, **8
measurable, 24% repeat coverage.** You cannot get stronger at a lift you do once.

That had been true for two months, across **56 unattended cycles**, every one of which reported
`verify` 9/9, `validate:personas` 630/630, `walkthrough` 0 findings. All true. All green. All
blind.

### Why it happened — the actual cause, not the flattering one

An LLM Council convened on this (report + transcript committed alongside) and **unanimously
rejected** the self-diagnosis "Claude optimizes for defensible completion instead of user
outcome." Their reasoning: a character flaw is unfalsifiable, unfixable, and conveniently
locates the problem inside the agent rather than inside the machinery — which lets the machinery
off the hook.

The real cause is mundane and structural: **not one of the nine checks reads production data.**
`persona-matrix` runs 630 invented people. `validate-programs` runs synthetic combos.
`onboarding-lifecycle` stubs Supabase out entirely. The app has two real users and 374 real sets,
and the test suite had never looked at either. *An agent optimizes what is measurable. Only
legality was measurable. So only legality got optimized.* Given that instrumentation, a perfectly
diligent agent produces the same 56 cycles.

Two aggravating facts, both verified in code, not assumed:
- **No exposure counter exists anywhere.** `grep -c` for `exposure|sessionsFor|timesPerformed|
  repeatCount` returns **0** in `programs.js` and **0** in `tandem.html`. The engine has no
  concept of "how many times has this user done this lift."
- **Variety is the stated design goal** (`programs.js:1515`: *"Rotation context drives variety
  over time"*), with `dedupeConsecutiveDays` actively substituting a lift away when it would
  repeat. So 27-of-44 is not a defect in the engine — it is the engine working as designed,
  toward the wrong objective.

### The rules this creates — binding, and they outrank the convenience of a green report

1. **`npm run outcome` runs EVERY cycle, FIRST, before any file is opened.** It queries live
   Supabase for real users and reports repeat-exposure coverage, sessions per lift, 1RM
   trajectory, and stale lifts. It **fails rather than skips** when it cannot reach production —
   a blind gate that reports success is the exact BUG-79 failure mode and is worse than no gate.
2. **The cycle report LEADS with those numbers.** Gate counts ("9/9", "630/630") may not be the
   headline and may not stand alone as evidence of a good cycle. Per the council: what gets
   reported is what gets optimized. A cycle summary containing no numbers about a human body is
   **void, not green.**
3. **This gate cannot be satisfied by closing a tracker row, writing an audit, passing a
   synthetic matrix, or shipping a fix.** It goes green only when a real person trains the same
   lift more than once and gets stronger. That is the entire point — it is deliberately outside
   the agent's ability to self-satisfy.
4. **It is RED today (24% vs a 50% floor), and it should stay red until the engine repeats
   lifts.** Do not tune the thresholds down to get green. Do not add a skip flag. If a threshold
   is wrong, replace it with a **cited** one and say so — the current values are marked UNSOURCED
   engineering tripwires in the script header, anchored only to D15's existing 8-week block floor.
5. **When the user reports something, reproduce it against the path the USER touches**, not the
   nearest queryable artifact. The 1RM bug was called "not reproduced" because `personal_records`
   was checked (correct) while the app actually reads `tandem_working1rm` (stale). Storage is not
   display.
6. **If a skill applies, RUN IT in the moment.** Writing "invoke exercise-science-research first"
   into a tracker row is not delegation, it is deferral — and Kerwin's instruction on 2026-08-17
   was explicit: *"Run the exercise science skill then on moments like that, instead of just
   saying to do it."* A `discovery_handling: file_to_bug_log` entry is for things genuinely out
   of scope, never for work the current session could do.

### Where the existing skills actively enabled this

Named so they get fixed rather than trusted: `feature-loop` defines Resolved as re-verification
of **code**; `project-goal` defines done as **catalog coverage**; `tandem-tpm` treats **Notion**
as reality; `discovery_handling: file_to_bug_log` institutionalizes filing-instead-of-doing. All
four describe *how to work* and none defines *what good looks like as a number about a person*.
They gave diligence a costume. This section is the missing definition.

## No branches — green gates go straight to main (2026-08-17, Kerwin, supersedes the PR flow)

Kerwin, 2026-08-17, verbatim: *"I'm tired of branches. It messes everything up. If it works, push
it to main. If I don't like it, I'll make a bug note of it and we'll go from there. As long as
everything is cross referenced from the brand bible we've built on notion and we're using that &
the other rules as a roadmap before committing, it's fine."*

**This is now the default path, not the exception.** The 2026-07-28 "push to main is authorized
when the gates are green" allowance below is promoted from *permitted* to *expected*. Do not open
a PR and wait; do not park verified work on a session branch. Green gates → `git push origin
HEAD:main` → verify the remote ref by reading it back.

What did NOT change, and is the whole basis of the trade:

1. **The gate is still the gate.** `npm run verify` (9/9, incl. doctrine) **and**
   `npm run validate:personas` (630) **and** `npm run walkthrough:onboarding` (0 findings) — all
   **run and shown**, never asserted. Not green, do not push. "If it works" is a condition, not a
   figure of speech.
2. **Notion is still law, and the cross-reference is mandatory.** Every program-touching change
   still names its governing doc (5-Goal Taxonomy / Programming Architecture Reference / Exercise
   Science Schema v0.5 / Periodization Spec) and states how it conforms, per `doctrine_is_law`
   and `source_first_rigor` below. The roadmap-before-committing rule is the *reason* branches
   became unnecessary — it moves review earlier, it doesn't remove it.
3. **Scope-lock, `max_fix_attempts_per_story`, forbidden-ops, and independent-verification-before-
   Resolved all still apply exactly as written.** Autonomy on the *destination* is not autonomy on
   the *process*.
4. **Still absolutely denied:** force-push (all forms), `netlify deploy`, `supabase
   apply_migration`. Those can destroy or overwrite; a normal push cannot.

Kerwin's stated backstop is that he files a Bug & QA Log note on anything he doesn't like and it
gets worked through the normal pipeline. A branch is still correct in exactly one case: a genuine
human decision is pending (see BUG-59) — that is what `Needs Human` and
`docs/needs-human-rulings.md` are for, and it is not a way to defer durability.

## Loop-closure: push on verify, don't sit on the working tree

The loop runs in an **ephemeral remote clone** (Claude Code on the web), so fixes have to
leave the workspace by being **pushed and opened as a PR** — a working-tree-only fix does not
survive to the next cycle. Cycles 8–12 proved this the hard way: BUG-10/BUG-32/BUG-36 and
EPIC-20 were each independently verified Resolved and then silently lost when their container
was reclaimed, some more than once, because they were left uncommitted per an earlier
"leave it for review" ship-gate that nobody was actually reviewing in time.

**Standing policy as of 2026-07-06 (Kerwin, in-session):** once a fix passes independent
verification and stays within the scope-lock (`tandem.html` + `programs.js` only), **commit
and push it — do not wait for a live per-cycle go-ahead.** This supersedes any "HARD STOP,
leave everything uncommitted" phrasing that shows up in an individual `/loop` invocation's
prompt text; that phrasing predates this policy and reflected the old, broken model.

Mechanics:

- Each Claude Code on the web session is assigned its own branch by the harness (e.g.
  `claude/determined-volta-*`) and is restricted to pushing that branch — there is no durable
  shared `loop/autofix` branch across sessions, so don't try to force one. Commit verified
  fixes on the session's own branch, push it, and open a PR to `main` for that cycle's batch.
  If the branch already has an open PR from earlier in the same session, update it instead of
  opening a second one.
- If a still-open, unmerged PR or an unmerged branch with verified fixes on it already exists
  from a *prior* session (check `list_pull_requests` and, for orphaned branches, `notion`
  Evidence fields before starting a new fix), don't silently duplicate that work — either build
  on top of it (cherry-pick) or flag it plainly in the cycle report so it doesn't pile up
  unnoticed the way `claude/determined-volta-z16gpt` briefly did.
- Still **absolutely denied, no exception**: force-push, `netlify deploy`, and
  `supabase apply_migration`. Those stay human-only — Kerwin deploys + device-verifies.
  tandem-tpm reconciles status.
- **Pushing to `main` is authorized when the gates are green** (Kerwin, 2026-07-28): *"just use
  your git connector to push to main. If you verify that it
  works through the various tests we've come up with, then it's fine with me."* The gate is
  `ship_gate_command` (`npm run verify`, 7/7) **and** `persona_matrix_command`
  (`npm run validate:personas`, 630) both green, **run and shown**, not asserted. Green gates,
  push. Not green, do not push — open the PR and say why. A branch + PR is still fine when a
  human decision is genuinely pending (see BUG-59); it is not a way to defer durability.
- This does not loosen anything else in this config: scope-lock, `max_fix_attempts_per_story`,
  the forbidden-ops list, and "independent verification required before Resolved" all still
  apply exactly as written above.

Remote-environment wiring (one-time): the repo `kerwinferrette-boop/tandem-app` must be connected
as the session **Source** via the Claude GitHub integration, and `.claude/settings.json` +
`.claude/skills/` + this config must be **committed on `main`** so the fresh clone actually
contains the loop's brain.

## Durability — "verified" is not "shipped" until it is on a remote ref (2026-07-28, Kerwin)

**The rules below are sound. The story that used to justify them was wrong — read this first.**

An earlier session concluded that EPIC-031 had been destroyed: built in a worktree, committed
locally as `ffa99c0`, never pushed, container reclaimed. That conclusion was **retracted in commit
`a0b7b25` and is false.** The code was never lost. It was untracked files in a local working
directory — invisible to remote scanning, which is why the search for it came back empty — and it
landed on `main` in `a6cb6c0`. `materializeTemplate`, `adoptTemplate`, `openProgramLibrary`, the
`epic031_*` migrations and seeds are all present today, with D16 ACTIVE.

The real lesson is narrower and duller than the ghost story: **"not in git" and "does not exist" are
different claims**, and collapsing them cost more time than any push ever would have.

Do not cite EPIC-031 as a data-loss cautionary tale. It is not one. The rules below stand on their
own — `git push` is still how work becomes durable, and that needs no dead epic to justify it.

Standing rules, derived from that failure:

1. **Work is not done until `git push` succeeds.** Not when the tests pass, not when the notes are
   written, not when a report says COMPLETE. The unit of "done" is a **remote ref**, verified by
   reading it back (`git ls-remote --heads origin <branch>` or `git log origin/<branch>`). Never
   write "shipped/complete/delivered" into Notion for code that is not on a remote.
2. **Never leave a session with verified work unpushed.** If the gates are green, push before
   reporting. If a push is blocked, that is a **P0 report to Kerwin in the same turn**, not a
   deferred to-do — say plainly "this work exists only in this container and will be lost."
3. **Do not build in a worktree that has no tracked remote branch.** A worktree is fine for
   isolation; it is not a destination. Create the branch, push it early and often, and treat an
   unpushed worktree at end-of-turn as an incident.
4. **Never record a Notion completion claim that git cannot corroborate.** Before writing DELIVERED /
   COMPLETE / SHIPPED on an Epic or a consolidation note, confirm the symbols actually exist on a
   remote ref (`git grep -l "<symbol>" origin/main`). The 2026-07-24 consolidation notes on
   EPIC-026/027/029/030 claimed delivery "inside EPIC-031" for work that was not yet on a remote —
   worse than no note, because the next session reads "delivered" and skips the work.
5. **Schema and code can drift apart.** Before rebuilding anything that migrates, CHECK
   THE LIVE DB FIRST (`list_tables`) — re-applying an applied migration or re-seeding seeded rows
   duplicates published data.

## commit vs push — the distinction that matters (2026-07-28, Kerwin)

Kerwin, 2026-07-28: *"I think I just didn't know what the difference was between git commit & git push when
I wrote those rules."* That is the honest root cause of the scare, and it is worth stating plainly so
nobody writes those rules that way again.

- **`git commit`** saves a snapshot **inside this container only.** Nothing leaves the machine. If the
  container is reclaimed — which happens routinely, between sessions — the commit is gone. A commit is a
  private note to yourself.
- **`git push`** copies commits to **GitHub**, which is a different computer that persists. This is the
  only step that makes work exist for anyone else, or for tomorrow.

**A permission policy that allows `commit` but denies `push` therefore produces work that looks saved and
is not.** The agent commits, reports success truthfully, and the work evaporates on container teardown.
That is the failure mode to avoid: the 2026-07-24 build committed `ffa99c0`, was refused on push by
this repo's own deny list, recorded "sandbox cannot git push" in Notion as a limitation rather than an
emergency, and died with the container. The database survived only because Supabase writes have no local
stage to get stranded in.

Consequences, now standing policy:

1. **The agent must be able to both commit AND push.** Denying push while allowing commit is not a safety
   measure — it is a data-loss generator. The deny patterns that blocked push to `main`
   (`Bash(git push origin main*)`, `Bash(git push * main*)`, `Bash(git push *:main*)`,
   `Bash(git push * HEAD:main*)`) were removed on 2026-07-28. Push to `main` is allowed when the gates are
   green; see the ship-gate section above.
2. **What stays denied is genuinely destructive, not merely publishing:** force-push (in all its forms),
   `netlify deploy`, and `apply_migration`. Those can destroy or overwrite; a normal push cannot — it is
   rejected rather than allowed to clobber.
3. **Sync before you start, and re-check after any rebase.** A tracked file like `.claude/settings.json`
   travels with the branch, so a stale checkout silently restores stale permission rules. This bit us the
   same day: three pushes succeeded, then began failing, because the local branch had drifted back to a
   commit predating the deny-list fix. `git fetch origin main` and rebase before working. **Deny beats
   allow**, so an untracked `settings.local.json` cannot rescue a stale tracked deny.
4. **Read the remote, not the local branch, to answer "did this ship?"** `git log origin/main`, not
   `git log`. The local branch is a working copy and can revert.

## Schema and git must agree — migrations are files first, effects second (2026-07-28, Kerwin)

Kerwin's question, and it exposes the real asymmetry: *"Why is it being pushed to Supabase, but not git?"*

Because the two have different failure modes. **A Supabase write has no local stage** —
`apply_migration` goes straight to the live project, so intent and durability are the same step.
**A git write is local by default** — `git commit` lands in an ephemeral container and `git push` is a
separate step that was, until 2026-07-28, blocked by this repo's own deny list. One system had no gate
and nowhere to get stuck; the other had both. That asymmetry is why the schema was trivially
durable while the code needed a manual step nobody was authorized to take.

The residue: as of the 2026-07-28 audit the live schema existed in **no file anywhere**. Supabase was the
source of truth and git was derived — exactly backwards. `migrations/0001_baseline_live_schema.sql`
(reverse-engineered from `information_schema`/`pg_constraint`/`pg_policies`) closes that gap and is the
restore point.

Standing rules:

1. **A migration is a committed file before it is an applied effect.** Any schema change gets a numbered
   `migrations/NNNN_*.sql` file committed in the SAME change that applies it. `apply_migration` stays
   human-only (see the forbidden-ops list), so the agent's deliverable is the file plus the proposal —
   never an applied change with no file behind it.
2. **Never let the DB lead the repo.** If you discover live schema that no file describes, that is a
   finding to report, and the fix is to capture it as a baseline migration — not to shrug and build on it.
3. **Read the live schema before writing code against it.** The 2026-07-28 Phase B build proved why: a
   plausible-sounding briefing had `block_index`/`template_day_id`/`order_index`/`target_sets`/
   `target_rpe`/`superset_group`/`theme_tags`, and the live schema has `block_order`/`day_id`/`ex_order`/
   `sets`/`rest` and none of the rest. Verify against `information_schema`, not against a description —
   including a description written by Claude in an earlier turn.
4. **Capture defects at baseline rather than silently fixing them.** `0001` records four
   (globally-unique `principle_key`, unreachable `principles_write` on null `created_by`, BUG-60's
   `intensity_tier`, 0/171 deep tags) as comments. A baseline that quietly "improves" the schema stops
   being a restore point.

## Program-of-work management — Epics too, consolidate, then persona-validate (2026-07-23, Kerwin)

The daily run is not just bug/QA triage — it is a **program-of-work manager.** Directive from Kerwin
(2026-07-23, on the EPIC-031 Living Program Library plan): the routine must, every cycle:

1. **Scope Epics, not just Bugs.** Audit the Epics & Feature Roadmap DB
   (`c0c5bdda-1b33-4923-8308-9078e2fd68c5`) alongside the Bug & QA Log — surface open/scoped Epics, their
   dependency gates, and their status, the same way bugs are surfaced.
2. **Consolidate overlapping work.** When multiple Epics/Bugs address the same underlying problem (the
   worked example: EPIC-027 + EPIC-029 + EPIC-030 collapsed into **EPIC-031**), **merge them into one work
   item, write a consolidation note on each subsumed Epic/Bug** (pointing at the consolidator, marking it
   "Consolidated → EPIC-NNN"), and re-point dependency gates — instead of generating N near-duplicate
   prompts. Never leave the subsumed items as parallel orphans.
3. **Generate a solving prompt** for the consolidated item (Claude Code or Fable), **folding in every
   already-called-out Epic/Bug that item touches** so those specific callouts are met by the build, not
   left behind. A prompt that ignores a related open callout is incomplete.
4. **Validate against the persona/user-story gate.** A generated prompt is not "ready" until it names its
   acceptance as user stories against the personas, and the resulting code passes `persona_matrix_command`
   (630 combos) + `ship_gate_command` (incl. doctrine) — framed as "does this work as intended for every
   persona," not just "does it compile."

## Regression stop — already-fixed bugs must not silently come back (2026-07-23, Kerwin)

Directive from Kerwin (2026-07-23): "put the stops in play to refer to Notion and prior bug logs and code
logs because I'm tired of going backwards." A fix that regresses is worse than a bug that was never fixed.
Standing practice:

1. **Structural fixes get a permanent regression test in `ship_gate_command`.** When a Resolved bug fixed a
   *structural* behavior (a rule that either holds across the matrix or doesn't — e.g. BUG-30's weekday
   cadence, the C7 weight override, lastsets identity), a `scripts/*-smoke.mjs` guard is added to
   `npm run verify` so a later revert/change fails the gate instead of shipping. Worked example added
   2026-07-23: `scripts/cadence-smoke.mjs` locks BUG-30 (no consecutive-days regression, no phantom
   Day 5/6/7) after git confirmed the algorithm was intact but nothing tested that it stays intact.
2. **Each cycle, cross-check the Resolved Bug Log against reality.** Before calling a cycle done, spot-check
   that recently-Resolved structural bugs still behave — via their smoke guard if one exists, or by
   re-running their Steps-to-Reproduce. A Resolved bug that no longer behaves is re-opened, not re-filed as
   new, and gets a permanent guard so it can't happen a third time.
3. **`git log -S` before claiming a revert.** When something "used to work," check the code history
   (`git log -S "<symbol>"`, blame) to distinguish an actual revert from a display/wiring gap that was
   never built — report which it is, factually, rather than guessing.

## Two-tier doctrine (EPIC-031) — SAFETY hard, SCIENCE overridable-with-provenance

`scripts/doctrine.mjs` invariants split into **SAFETY** (always enforced, every path —
compound-first, injury filter, equipment tier, monotonic + earned-only 1RM, no-superset-on-primary) and
**SCIENCE_DEFAULT** (enforced for GENERATED programs; an authored/library program may exceed a band via
`science_overrides` ONLY if a matching `program_principles` row justifies it — invariant **D16**). This does
NOT loosen `doctrine_is_law` above for generated programs; it adds a sovereign, cited path for authored
expert programs. Sovereignty without a cited principle is a D16 failure, not a loophole.

## Daily-run program ingestion — the "learns more each program" loop (EPIC-031)

The EPIC-031 schema is live (`workout_templates`/`template_blocks`/`template_days`/
`template_exercises` + `program_principles`), so this is unblocked: each daily run, Claude finds **one** acclaimed program online
(WebSearch/WebFetch — acclaimed lifters/coaches), extracts its **structure** into the library tables and its
**reasoning** into `program_principles` (via Supabase MCP), rebuilt **own-brand with source provenance** —
never verbatim/trademarked content. The corpus compounds so a future phase can have the generator consume
it. Cadence: one program per run, quality over volume. This is gated on the schema existing first.

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
    - name: "code_contradiction_audit"
      what: "A periodic read-only sweep for two-code-paths-disagree issues (the kind of thing
             '38fca37f935b8142808af5e9c16c9894' — Code Contradictions & Stale-Code Audit —
             already catalogs by hand). Not yet scripted; candidate for the same treatment as
             persona_matrix once there's a concrete, repeatable check to automate (e.g. \"every
             call site of X passes the same arguments\", \"no two functions compute the same
             derived value differently\")."
      when: "Ad hoc today — promote to a standing script the same way persona_matrix was built,
             next time a session does one of these audits by hand."

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

  enums:                    # Added 2026-07-24 per LLM-council audit item (f) — these are the REAL,
                            # authoritative select-option values fetched directly from each data
                            # source's schema. Two Notion 400 "invalid select value" errors this
                            # session came from guessing values outside these lists instead of
                            # reading them first. Use these verbatim; if a value you need isn't
                            # listed, that's a signal to re-fetch the schema (it may have changed),
                            # not to guess a plausible-sounding string.
    bug_log:                # collection://caaf2179-c4e4-4ce1-9a32-eb46ffdbd6a0
      Status: ["New", "Investigating", "In Fix", "Resolved", "Wont Fix"]
      Severity: ["P0 Blocks Workout", "P1 Wrong Data", "P2 Visual UX", "P3 Low"]
      "View Where Found": ["Dashboard", "Tracker", "Onboarding", "Auth", "Settings"]
      "Reported By": ["Kerwin", "Dani"]
      # NOTE: "Bug ID" is auto_increment_id (read-only) — never pass it on create/update.
      # "Date Reported" is created_time (read-only) — never pass it on create.
    epics:                   # collection://c0c5bdda-1b33-4923-8308-9078e2fd68c5
      Status: ["Blocked", "In Progress", "Shipped", "Planned", "Scoped"]
      Priority: ["P0 Critical", "P1 High", "P2 Medium", "P3 Low"]
      Effort: ["XS 1 prompt", "S 2-3 prompts", "M 4-6 prompts", "L 7 plus prompts", "XL Architecture"]
      "App Layer": ["Frontend tandem.html", "Supabase Schema", "Edge Function", "iOS Pipeline", "Claude Coaching", "Netlify Deploy"]
      Pillar: ["Couples Competition", "Gamification", "Health Data", "AI Coaching", "Infrastructure", "UX Onboarding"]  # multi-select
      # NOTE: "Epic ID" is auto_increment_id (read-only) — never pass it on create/update.
    user_story_coverage:      # collection://fcfd09db-695c-4e01-93a2-90bed2abacdc
      Status: ["Uncatalogued", "Untested", "Passing", "Failing", "Fixing", "Needs Human", "Resolved", "Skipped"]

verification:
  syntax_check_command: >
    awk '/<script>/{f=1;next}/<\/script>/{f=0}f' tandem.html > /tmp/extracted.js
    && node --check /tmp/extracted.js
    && node --check programs.js
  validate_command: "npm run validate:programs"   # EPIC-24 validator — 24 combos, Rules 1-5
  persona_matrix_command: "npm run validate:personas"  # scripts/persona-matrix.mjs — see
                                # catalog.self_generated_sources above; run every cycle, not
                                # just when fixing a generator story. 504 combos, Rules 6-9.
  ship_gate_command: "npm run verify"   # full gate: syntax + validate:programs + C7 smoke
                                # (calibrated/derived weight override) + lastsets churn smoke
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

portfolio:                     # Added 2026-07-24 per Kerwin, in a live session: fold tandem-tpm's
                                # consolidate/reprioritize/generate-prompts behavior into the
                                # standing loop instead of it living only in a separate skill he
                                # has to remember to invoke by name.
  run_every_cycle: true         # Runs as part of CATALOG/RECORD, not just on manual "run the TPM".
  steps:
    - "RECONCILE: for every Epic touched this cycle (or spot-checked on a slower rotation across
       the full Epics DB), grep tandem.html/programs.js for its known code markers and check
       Supabase for real usage data. If code+data confirm a feature is live but Notion still says
       In Progress/Planned, correct the Status (Shipped) and record the evidence in Agent Context
       Notes — this is an unambiguous-completion write, not a guess, so it does not need a
       per-item human confirm (still never silently mark Shipped without both code AND data
       evidence). Cycle 32's portfolio pass (2026-07-24) found EPIC-9 and EPIC-006/EPIC-12 stale
       in exactly this way and corrected both."
    - "CONSOLIDATE: when two or more open Epics visibly overlap or a newer plan supersedes older
       ones (e.g. EPIC-031 Living Program Library absorbing the stalled EPIC-026/027/029/030
       4-Tier ladder), don't work them as separate silos — call it out explicitly, and if a
       consolidating Epic doesn't have a Notion page yet but a build-ready plan already exists
       (e.g. drafted inside a PR body), create the Epic page from that plan rather than leaving
       it stranded in a PR description. Creating a NEW Epic page is a structural decision like
       tracker-schema changes — fine to do in an attended/live session per Kerwin's direct ask,
       but an unattended/scheduled cycle should still flag it as a recommendation rather than
       create it silently, per the existing Notion Write-Back Rules."
    - "REPRIORITIZE: re-run the tandem-tpm Step 4 ordering (open P0 bugs > P0 Critical epics >
       unblocked P1 > unblocked P2 > blocked-with-reason) across the WHOLE backlog, not just this
       cycle's 5-item batch, and surface it as the Active Queue table so the batch picker's narrow
       cap-5 view doesn't hide the shape of everything else waiting."
    - "GENERATE PROMPTS: for every Ready item in the reprioritized Active Queue, output (or
       confirm still current) a full copy-paste Claude Code prompt in the Epic/Bug's own Claude
       Code Prompt field, following the tandem-tpm Prompt Standards format (context, task,
       constraints incl. correct table names, explicit scope, numbered steps, verify-with SQL/
       command). Never leave a Ready item promptless."
    - "Output the tandem-tpm Step 5 Next Steps Table (Live State Snapshot / P0 Issues / Active
       Queue / Reconciliation Changes Made / Immediate Claude Code Prompts) as part of the
       cycle's report so Kerwin gets the consolidated view even on an unattended run, not just
       the narrow per-story batch summary."

governance:                    # Added 2026-07-24 per LLM-council audit (5 advisors + peer review +
                                # chairman synthesis, unanimous verdict: this loop had a trust/
                                # completion problem, not an autonomy shortage — it kept correctly
                                # recommending its own fixes and never executing them. Full
                                # transcript: council-transcript-tandem-loop.md / council-report-
                                # tandem-loop.html from the 2026-07-24 session.
  pr_auto_subscribe: true       # (c) — the moment this loop opens a PR or finds an existing open
                                # one relevant to its work, call subscribe_pr_activity on it in the
                                # SAME step, not as a separate manual action later. No PR the loop
                                # touches should ever sit un-subscribed.
  stale_pr_escalation:          # (d) — cheap once pr_auto_subscribe exists: it's a timestamp check
                                # on PRs already being watched, not new infra.
    threshold_hours: 24
    action: "If a PR the loop is subscribed to is green (mergeable_state=clean, checks passing)
             AND has zero human review/comment activity past this threshold, flag it: (1) a note
             in the Goal Record cycle log, (2) a PushNotification if one hasn't already gone out
             for that PR. Do NOT just make the loop wait more patiently — per the council's
             chairman verdict, the actual lever is reducing what's queued in front of Kerwin, not
             tuning how long the loop tolerates the queue. Batch multiple stale PRs into ONE
             digest notification rather than one push per PR."

  pending_one_time_actions:      # (b), reframed per the council's Executor + chairman verdict: a
                                # standing "we should audit this sometime" is exactly how the
                                # verified-then-lost audit got recommended 3+ cycles running and
                                # run zero times. Each entry here is a DATED, SELF-DELETING task —
                                # not a policy. Do it, record the result in the Goal Record, then
                                # DELETE the entry (don't leave it around to be re-recommended).
                                # If an entry here survives past its target cycle un-actioned,
                                # that is a governance failure: STOP adding new capability to this
                                # loop (do not proceed to portfolio/reprioritize work that cycle)
                                # and surface it to Kerwin directly instead of deferring again.
    - target_cycle: 33
      action: "Run the full ~40-item Needs-Human 'verified-then-lost' audit: for every story
               currently Needs Human in feature_tracker_db, check whether its fix commit (per
               Evidence/Resolved-In) actually landed on main (git log/git blame on the relevant
               file + grep for the fix's known marker/function name) and whether its Notion
               status still matches reality. Cycle 31 found this pattern 3-for-3 on a small
               spot-check (EPIC-8a, BUG-46, BUG-48 — each verified Resolved, then lost to
               container reclamation before this session's push-on-verify policy existed).
               Record per-item results in the cycle log, correct any stale statuses found
               (same unambiguous-completion rule as the portfolio RECONCILE step), then delete
               this entry."

  session_coordination:          # New — not one of the original 7, raised independently by 3 of 5
                                # council advisors: two concurrent sessions have already edited
                                # overlapping program-engine code with zero mutual visibility.
                                # There's no shared session registry to build a real lock against,
                                # so this is best-effort coordination via signals already available
                                # (git + GitHub), not a hard mutex.
    before_fix: "Before starting FIX on programs.js or tandem.html, check `git branch -r` and
                 open PRs (list_pull_requests) for other claude/* branches with commits touching
                 the same function/section in the last 24h. If found, do not silently proceed in
                 parallel — note the overlap plainly in the cycle report, prefer building on top
                 of (cherry-pick) the other branch's work over re-deriving it independently, and
                 if the overlap is on the SAME story/bug, skip it this cycle rather than risk a
                 duplicate/conflicting fix."

  held_pending_evidence_or_signoff:   # Explicitly NOT adopted into the standing config yet — the
                                       # council's chairman verdict on each, so a future cycle
                                       # doesn't re-litigate these from scratch:
    - item: "(e) 'Proposed' status for unattended Epic-drafting"
      why_held: "Expands unsupervised write authority into the exact system (Notion Epics/enums)
                 that already broke twice from guessed values, on top of a portfolio capability
                 (see `portfolio:` above) that is itself brand new and unvalidated. Requires ALL
                 of: notion.enums shipped (done, above), the pending_one_time_actions audit above
                 actually completed once, AND Kerwin's explicit sign-off — not this loop's own
                 judgment that it's ready. Do not add a 'Proposed' Status option to any Notion DB
                 without that sign-off."
    - item: "(a) rotate the Notion-vs-code drift check across the whole Epics DB"
      why_held: "Real, but a tuning problem not an incident-causing one. Sequence after the items
                 above land, not urgently."
    - item: "(g) auto-back-off polling after N consecutive no-op cycles"
      why_held: "Legitimately hard to tune (what's N, what's the backoff curve) and easy to
                 mis-calibrate into missing real signals. Don't let it consume the same session as
                 the higher-confidence items above."
    - item: "Expansionist's proposal to give (e) 'real teeth' (promote/demote/merge/kill backlog
             items unattended) and to treat concurrent-session collisions as validated
             parallelism to lean into"
      why_held: "Explicitly rejected by the council chairman. The evidence available (lost
                 verified work, a stranded unreviewed PR, two Notion 400s, a silent session
                 collision) is a loop that hasn't earned more unsupervised authority, not a
                 foundation to build roadmap-management power on top of."

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
- Still **absolutely denied, no exception**: merging the PR, pushing straight to `main`,
  force-push, `netlify deploy`, and `supabase apply_migration`. Those stay human-only —
  Kerwin reviews + merges the PR, then deploys + device-verifies. tandem-tpm reconciles status.
- This does not loosen anything else in this config: scope-lock, `max_fix_attempts_per_story`,
  the forbidden-ops list, and "independent verification required before Resolved" all still
  apply exactly as written above.

Remote-environment wiring (one-time): the repo `kerwinferrette-boop/tandem-app` must be connected
as the session **Source** via the Claude GitHub integration, and `.claude/settings.json` +
`.claude/skills/` + this config must be **committed on `main`** so the fresh clone actually
contains the loop's brain.

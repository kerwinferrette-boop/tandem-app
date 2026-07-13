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

verification:
  syntax_check_command: >
    awk '/<script>/{f=1;next}/<\/script>/{f=0}f' tandem.html > /tmp/extracted.js
    && node --check /tmp/extracted.js
    && node --check programs.js
  validate_command: "npm run validate:programs"   # EPIC-24 validator (scripts/validate-programs.mjs)
  persona_matrix_command: "npm run validate:personas"  # scripts/persona-matrix.mjs — see catalog.self_generated_sources above; run every cycle, not just when fixing a generator story
  test_command: "per-story SQL assertion (see each story's Test Assertion SQL field)"
  db_connector: "Supabase MCP — project zsvktcvqmppsshtpeljt"

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

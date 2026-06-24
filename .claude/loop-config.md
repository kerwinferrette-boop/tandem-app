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
                                # codebase. Seed user stories ONLY from items he has already
                                # authored — open Bug & QA Log rows, open Epics, and Features —
                                # one story per tracked item, linked back to its source Bug/Epic.
                                # SKIP the generic code-catalog stage (agents/catalog.md); it is
                                # not the coverage map he wants the loop driving toward.
  discovery_handling: "file_to_bug_log"
                                # Anything the loop trips over while testing is logged as a NEW
                                # Bug & QA Log row (and a new Untested story linked to it), then
                                # worked through that same channel — never silently auto-fixed off-book.

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

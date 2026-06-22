# Loop config — Tandem (example)

This shows how the generic skills plug into a project that already has its own TPM-style discipline, rather than duplicating it.

```yaml
project_name: "Tandem"

codebase_root: "tandem.html"      # single-file app
existing_project_skill: "tandem-tpm"   # Fix/Verify defer to tandem-tpm's own Execution Mode:
                                        # Bug Fix procedure (scope-lock, read-before-edit,
                                        # node --check, SQL-verified behavior) instead of the
                                        # generic feature-loop fix instructions.

notion:
  feature_tracker_db: "NEEDS CREATION — see note below"
  bug_log_db: "caaf2179-c4e4-4ce1-9a32-eb46ffdbd6a0"      # existing Bug & QA Log, reused as-is
  run_log_db: "0e481ffb-04f0-43db-bf39-09eb3551bd6c"      # existing Context Handoff, reused as-is

verification:
  syntax_check_command: >
    awk '/<script>/{f=1;next}/<\/script>/{f=0}f' tandem.html > /tmp/extracted.js
    && node --check /tmp/extracted.js
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

## Open item — flagged, not decided for you

`feature_tracker_db` doesn't exist yet. Tandem's existing **Epics** database (`c0c5bdda-1b33-4923-8308-9078e2fd68c5`) tracks features at the roadmap/epic level — it's a different granularity than the per-behavior user stories this pipeline produces ("As a user, I expect the rest timer to start when I log a set"). Folding story-level rows into Epics would blur its existing purpose and could confuse tandem-tpm's own reconciliation logic.

Recommendation: create a new linked database — working title **"Tandem User Story Coverage"** — related to Epics, with fields: Story ID, Feature Area, User Story, Expected Behavior, Source (file:line), Status, Evidence, Retry Count. This is exactly the kind of structural Notion change project-goal will propose and wait on before creating, per its own guardrails — say go-ahead and it'll get built, or correct the approach first if you see it differently.

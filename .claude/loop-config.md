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
  validate_command: "npm run validate:programs"   # EPIC-24 validator — 24 combos, Rules 1-5
  persona_matrix_command: "npm run validate:personas"  # scripts/persona-matrix.mjs — see
                                # catalog.self_generated_sources above; run every cycle, not
                                # just when fixing a generator story. 504 combos, Rules 6-9.
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
- Still **absolutely denied, no exception**: force-push, `netlify deploy`, and
  `supabase apply_migration`. Those stay human-only — Kerwin deploys + device-verifies.
  tandem-tpm reconciles status.
- **Pushing to `main` is authorized when the gates are green** (Kerwin, 2026-07-28, after the
  EPIC-031 loss below): *"just use your git connector to push to main. If you verify that it
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

**The EPIC-031 loss is the worked example, and it must not repeat.** On 2026-07-24 a session built
the entire Living Program Library in a git worktree (`.worktrees/epic-031`), committed it locally as
`ffa99c0`, and recorded "BUILD COMPLETE … verify 7/7 … 2,622 checks PASS" in Notion. On 2026-07-25 a
second session re-verified it, rebased it, and re-recorded success. **Neither session ever pushed it**
— the dependency gate literally read *"Kerwin pushes the rebased branch — sandbox cannot git push."*
Nobody did, the container was reclaimed, and every line of that code ceased to exist. What survived
was only the Supabase migrations, because those were written to an **external, persistent** system.
The code had no external destination, so it had no existence.

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
   EPIC-026/027/029/030 all claimed delivery "inside EPIC-031" and were false the moment the
   container died — which is worse than no note, because the next session reads "delivered" and
   skips the work.
5. **Schema and code drift apart when only one is durable.** EPIC-031's migrations are live in
   `zsvktcvqmppsshtpeljt` while its code is gone. Before rebuilding anything that migrates, CHECK
   THE LIVE DB FIRST (`list_tables`) — re-applying an applied migration or re-seeding seeded rows
   duplicates published data.

## commit vs push — the distinction that cost us EPIC-031 (2026-07-28, Kerwin)

Kerwin, 2026-07-28: *"I think I just didn't know what the difference was between git commit & git push when
I wrote those rules."* That is the honest root cause of the whole EPIC-031 loss, and it is worth stating
plainly so nobody writes those rules that way again.

- **`git commit`** saves a snapshot **inside this container only.** Nothing leaves the machine. If the
  container is reclaimed — which happens routinely, between sessions — the commit is gone. A commit is a
  private note to yourself.
- **`git push`** copies commits to **GitHub**, which is a different computer that persists. This is the
  only step that makes work exist for anyone else, or for tomorrow.

**A permission policy that allows `commit` but denies `push` therefore produces work that looks saved and
is not.** The agent commits, reports success truthfully, and the work evaporates on container teardown.
That is exactly what happened: the 2026-07-24 EPIC-031 build committed `ffa99c0`, was refused on push by
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
and nowhere to get stuck; the other had both. That is the entire reason EPIC-031's schema survived and
its code did not.

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

Once EPIC-031 lands, `scripts/doctrine.mjs` invariants split into **SAFETY** (always enforced, every path —
compound-first, injury filter, equipment tier, monotonic + earned-only 1RM, no-superset-on-primary) and
**SCIENCE_DEFAULT** (enforced for GENERATED programs; an authored/library program may exceed a band via
`science_overrides` ONLY if a matching `program_principles` row justifies it — invariant **D16**). This does
NOT loosen `doctrine_is_law` above for generated programs; it adds a sovereign, cited path for authored
expert programs. Sovereignty without a cited principle is a D16 failure, not a loophole.

## Daily-run program ingestion — the "learns more each program" loop (EPIC-031)

Once Fable ships the EPIC-031 schema (`workout_templates`/`template_blocks`/`template_days`/
`template_exercises` + `program_principles`): each daily run, Claude finds **one** acclaimed program online
(WebSearch/WebFetch — acclaimed lifters/coaches), extracts its **structure** into the library tables and its
**reasoning** into `program_principles` (via Supabase MCP), rebuilt **own-brand with source provenance** —
never verbatim/trademarked content. The corpus compounds so a future phase can have the generator consume
it. Cadence: one program per run, quality over volume. This is gated on the schema existing first.

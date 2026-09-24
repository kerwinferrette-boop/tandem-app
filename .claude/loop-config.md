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

  prompt_field_is_the_channel: "Added 2026-09-22 (BUG-129), per Kerwin, live in-session 2026-09-21,
                                choosing the prompt field over the Context Handoff page as canonical.
                                Each open Bug/Epic row's own 'Claude Code Prompt' property is the
                                canonical channel by which the 6:30am tandem-tpm-morning run hands
                                work to this loop. CATALOG must read it for every open row and carry
                                a non-empty value onto the seeded story, and FIX must treat its
                                SCOPE-LOCK section as that edit's scope. It is a scope-lock and a
                                starting point, never permission: re-read every line reference
                                against the live file first (they are pinned to a sha that may have
                                moved), and if the prompt would reach anything in safety.forbidden or
                                its stated premise no longer matches the code, STOP and mark Needs
                                Human rather than following it. An empty field on a Ready item is a
                                finding worth one line in the cycle log — it means the TPM run did
                                not deliver — and the loop falls back to deriving scope itself. Cite:
                                this row's own Actual Behavior for the audit that found the write
                                side (loop-config's GENERATE PROMPTS rule) had no corresponding read
                                side anywhere the loop actually looked."

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

    - name: "pending_doctrine_sweep"
      what: "Added 2026-09-08, per Kerwin, in-session, correcting a real gap: 'The fact 6b has
             been sitting there, knowingly as a great feature, and this routine kept saying it
             had nothing to do.' `catalog.mode: tracker_seeded` (above) deliberately seeds work
             ONLY from the Bug & QA Log and open Epics, so the loop never invents speculative
             product opinions — correct for THAT purpose, but it also meant a PENDING doctrine
             invariant (DOCTRINE.md, status column '⏳') was invisible to every cycle's catalog
             pass, even one already carrying a real citation and blocked on nothing but nobody
             building it (D6b: '⏳ per-length meso', cites 'v0.5 volume table; Findings
             3-remainder, 4' — not a decision gate, just unbuilt work). `npm run sweep:doctrine`
             (scripts/pending-doctrine-sweep.mjs) closes this: it greps every PENDING row's own
             STATUS cell for decision/prerequisite language ('when ruled', 'ruling', 'when
             added') and reports each row as BUILDABLE (no such language — seed it) or BLOCKED
             (language present — correctly stays PENDING, e.g. D4b needs Kerwin's ruling + a
             cited per-experience source; D8 needs the Strength/Maintenance goal to exist
             first). This is the same shape as persona_matrix/onboarding_lifecycle_walkthrough
             above: a deterministic, objective structural check — not the loop guessing at
             product opinions — that happens to live in a file `catalog.mode` doesn't read."
      when: "Run once per cycle, even when the tracker shows 0 Untested + 0 Failing — same
             standing-source rule as persona_matrix. Any row this sweep reports BUILDABLE that
             has no linked Untested story yet gets one seeded immediately (Expected Behavior =
             the invariant's own cited text, Source = the DOCTRINE.md row + its citation) —
             never left as 'nothing to do' just because it isn't a Bug/Epic row. A cycle that
             sees a BUILDABLE row here and reports no buildable work is the exact failure this
             source exists to prevent — treat it as gate-worthy as persona_matrix's own findings."
      first_run_finding: "2026-09-08 — first run found exactly 1 buildable row: D6b. Seeded as
             the foundational slice of a new Epic (Per-Muscle Volume Engine + Hard
             Block-Boundary Rebalancing, subsumes EPIC-27 Slice 5) rather than a bare tracker
             row, since it was already mid-scoping in the same live session. D4b and D8 correctly
             classified BLOCKED (both genuinely need a ruling/prerequisite, not just a builder) —
             confirms the classifier discriminates rather than seeding everything indiscriminately."

    - name: "code_contradiction_audit"
      what: "A periodic read-only sweep for two-code-paths-disagree issues (the kind of thing
             '38fca37f935b8142808af5e9c16c9894' — Code Contradictions & Stale-Code Audit —
             already catalogs by hand). Not yet scripted; candidate for the same treatment as
             persona_matrix once there's a concrete, repeatable check to automate (e.g. \"every
             call site of X passes the same arguments\", \"no two functions compute the same
             derived value differently\")."
      when: "Ad hoc today — promote to a standing script the same way persona_matrix was built,
             next time a session does one of these audits by hand."

    - name: "live_test_account_verification"
      what: "Added 2026-09-04, per Kerwin, in-session: the two test accounts
             (kerwinferrette+test@gmail.com, kerwinferrette+testdani@gmail.com) exist specifically
             to be exercised — Kerwin's words: 'that sounds like you're building out exactly what
             the persona matrix & user stories is supposed to be doing.' persona_matrix and
             onboarding_lifecycle_walkthrough above already do this synthetically (630 invented
             personas; a Playwright walkthrough against a STUBBED Supabase, zero network egress).
             This source is the missing third leg: drive the REAL live app against the REAL
             production Supabase, logged in as a real (test) account, for anything a story needs
             an actual end-to-end pass to answer — does the feature load, does a logged set
             actually update that lift's latest-set/1RM the way the UI shows it, does a new flow
             (e.g. Lift Log once built) survive a real round trip through Supabase and back.
             SCOPE, drawn narrowly on purpose: this answers 'does the app do what it's supposed to
             do' (a feature-loop Verify-stage question), never 'what should the rule be' (a
             genuine judgment call — see escalation.direct_ask below) and never 'is a real person
             getting stronger' (the OUTCOME RULE's job). Test-account activity is EXPLICITLY
             excluded from npm run outcome and from the outcome gate's reported numbers — Kerwin
             confirmed this reading directly ('you are correct... just that - test accounts, to
             test features'). Conflating the two would quietly reopen the exact hole the
             2026-08-17 OUTCOME RULE postmortem closed: synthetic/test activity being cheap to
             generate and mistaken for evidence a real person is training."
      how: "CORRECTION, found by dry-running this exact source 2026-09-04: this is not a green-field
             build. `scripts/prod-integration.mjs` (`npm run integration`) ALREADY EXISTS — built
             2026-09-03, one day before this config section, quoting Kerwin's own words from that
             date almost verbatim ('this was the point of the user matrix & user stories, was to
             have infinite test runs'). It already does exactly this: writes/reads against the two
             allowlisted test-account UUIDs on REAL production Supabase (A2 bank-vs-db drift, A3
             write round-trip incl. 1RM-trigger agreement + no-spurious-PR, A4 lift-history
             projection), with verified cleanup in a finally block. Use IT as the mechanism, don't
             re-describe it — 'one rule, one home'. Log in as the test account against the real app
             for anything this script doesn't already cover (a new flow like Lift Log once built),
             using the same allowlist-and-verified-cleanup discipline it models.
             KNOWN GAP, confirmed by actually running it 2026-09-04: it fails closed with
             'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required' — neither is set as an env
             var in this container, same long-standing gap as outcome.mjs. It is not wired into
             `npm run verify`'s CHECKS array either (deliberately — it needs live credentials and
             network egress the other 11 checks don't). FALLBACK, proved working 2026-09-04 by
             literally doing it: replicate its checks via Supabase MCP execute_sql directly (which
             carries its own auth, no env var needed) — same allowlisted UUID, same non-PR-beating
             load, same read-back-and-verify-cleanup discipline. Confirmed live 2026-09-04: inserted
             a 45x5 set against Test Kerwin's 'Low Incline Barbell Press' (existing PR 196 lbs),
             trigger computed 52.5 1RM correctly, is_pr correctly false, personal_records untouched,
             delete-then-reread confirmed the row gone. If SUPABASE_SERVICE_ROLE_KEY ever gets
             provisioned in the scheduled container, prefer `npm run integration` directly — it
             checks more (bank/db drift, D27 projection) than a one-off MCP query will by hand.
             Where the check is objective (a number updated correctly, a row got written, a page
             loaded without error), that alone can move a story from Untested to Passing/Failing
             per feature-loop's normal Verify discipline. Where the check is NOT objective — 'does
             this look/feel right' — do not decide it unilaterally: capture what the run produced
             (screenshot via the run skill, or a plain description of what rendered) and surface it
             to Kerwin directly (see escalation.direct_ask below, 'populate here in preview mode so
             I can see if it's what I want it to look like or not') rather than marking the story
             Resolved on the agent's own aesthetic judgment."
      cleanup: "Rows this source writes under the two test accounts (sets, sessions, etc.) are
             real Supabase writes, not mocks. Route their cleanup through the
             tandem-data-integrity-audit skill's existing allowlisted cleanup scope so they don't
             quietly accumulate or skew any real reporting — extend that skill's allowlist to name
             the test-account rows this source generates the next time that skill runs, rather than
             leaving them to pile up undocumented."
      when: "Run per-story, whenever a story is otherwise stuck at Needs Human specifically for
             lack of a real end-to-end check (not for a citation gap or a genuine rule-setting
             question — route those through escalation.direct_ask instead). Not a standing
             every-cycle sweep like persona_matrix/onboarding_lifecycle_walkthrough above; it's
             pulled in on demand by whichever story needs it."
      default_not_fallback: "ADDED 2026-09-14, per Kerwin, in-session, correcting a real gap
             (see docs/self-corrections.md SC-08): the two test accounts are the DEFAULT
             mechanism for reproducing or diagnosing an anomaly against the real app/real
             Supabase, not a fallback reached for only when nothing else works. Outside the
             OUTCOME RULE's own mandated npm run outcome check (which must read Kerwin's and
             Dani's REAL accounts — that is the entire point of that gate, per
             live_test_account_verification's scope note above), do not query
             kerwinferrette@gmail.com's or dgaumer03@gmail.com's real history to chase a
             program-logic question. Ask first whether the question is answerable by (a)
             running the generator directly (buildDynamicProgram()/getProgram() with no
             account at all — most program-structure questions are a pure function of
             goal/day-count/tier and need zero Supabase data), or (b) the two allowlisted test
             accounts. Use the narrowest of the three that answers the question. A real-account
             read for anything beyond the outcome gate itself needs a stated reason, in the
             same message as the query, for why neither (a) nor (b) suffices."

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

batch_prioritization:  # Added 2026-09-14, per Kerwin, in-session — closes a real, named gap:
                      # "catalogued is not the same as prioritized." Worked example that forced
                      # this: D6b (a doctrine invariant) was found and correctly flagged on
                      # 2026-07-22, sat untouched for 6.5 weeks because nothing surfaced PENDING
                      # doctrine rows as work at all (closed by pending_doctrine_sweep,
                      # 2026-09-08) — but even AFTER pending_doctrine_sweep correctly seeded it
                      # as EPIC-54, it sat 6 MORE days as an ordinary catalogued Untested story,
                      # competing on equal footing with the rest of the standing backlog, and
                      # only got built because an unrelated live bug report happened to point at
                      # it. The generic project-goal skill's Step 3 batch order (Needs-Human-
                      # since-unblocked > Failing P0/P1 > Untested > Uncatalogued) has no sub-
                      # ordering WITHIN "Untested" — this section adds one, since a flat FIFO/
                      # arbitrary order inside a backlog of 100+ rows means anything can starve
                      # indefinitely regardless of how it was found.
  self_generated_priority: "Within the Untested tier, a story whose Source traces to one of
                      catalog.self_generated_sources (persona_matrix, onboarding_lifecycle_
                      walkthrough, pending_doctrine_sweep, exercise_intake_promotion) — or an
                      Epic that subsumes one — ranks AHEAD of ordinary tracker-sourced Untested
                      rows, not merely alongside them. These are deterministic, objective,
                      already-vetted structural findings (loop-config's own words: 'treat it as
                      gate-worthy as persona_matrix's own findings') — they should never lose a
                      priority contest to an arbitrary older Bug Log row just because that row
                      happened to be catalogued first. This does not override
                      still_needs_kerwin/escalation below — it only changes ORDER within what the
                      loop is already allowed to just build."
  staleness_escalation: "CORRECTED 2026-09-14, same session — the first version of this rule
                      said 'appears in 3+ CONSECUTIVE cycle snapshots' sourced from 'the Goal
                      Record's own LAST_SNAPSHOT state' and claimed 'no new Notion field
                      required.' That was asserted, not verified, and Kerwin caught it by asking
                      'are you sure this picks up those epics moving forward?' — checking found
                      the Cycle Log entry (project-goal SKILL.md, Step 4) only ever records
                      AGGREGATE status COUNTS ('N Untested, M Failing'), never which specific
                      stories were Untested. There is no data anywhere that reconstructs one
                      story's identity across past cycles, so the original rule was uncomputable
                      by any future cycle that tried to follow it — it would have been silently
                      inert, the exact 'wired is not working' failure CLAUDE.md warns about,
                      just written into config instead of code.
                      Fixed rule, directly computable with data that already exists on every row:
                      a story or Epic is STALE when its own Notion page's Created time (fetch the
                      page — notion-fetch's page_last_edited_at, or the page's Created-time
                      property where the database exposes one, e.g. Epics' 'Created' field) is
                      more than 3 days old AND its Status is still Untested/Planned/Scoped. No
                      cross-cycle reconstruction, no new schema — one page fetch, one date
                      comparison, per candidate row. A stale item is force-included in the next
                      batch, on top of (not instead of) whatever safety.max_items_per_cycle would
                      otherwise pick. Report every stale item pulled in this way as its own line
                      in the cycle's Goal Record entry ('stale, force-included: <story/Epic id>,
                      created <date>, N days old') so this is visible, not quietly absorbed into
                      the ordinary batch count.
                      SUPERSEDED IN PART, 2026-09-22 (BUG-129): a 'Status Changed On' date property
                      was added to the Bug Log and Epics on 2026-09-21. Staleness is now measured
                      from THAT property, NOT from page age (page_last_edited_at or Created time),
                      because the TPM run writes a 'Claude Code Prompt' field onto these pages daily
                      and that write resets page-edit-based signals to look fresh even when the row's
                      actual status hasn't changed in weeks — the exact failure this rule exists to
                      prevent, just relocated. Fall back to page age (as described above) only for a
                      row whose 'Status Changed On' is still empty, and say so in the cycle log when
                      you do — do not silently treat an empty property as 'not stale'.
                      KNOWN LIMITATION, stated honestly rather than glossed over (council review,
                      2026-09-22): nothing in this rule GUARANTEES every future status-flip write path
                      also sets 'Status Changed On' — it depends on each such path remembering to, the
                      same way the original page-age heuristic depended on edits actually reflecting
                      status. If a row's property goes wrong (not empty, just stale/incorrect) rather
                      than absent, this rule has no detector for that today. Treat a suspiciously
                      unchanging 'Status Changed On' on a row you know moved status as a signal to
                      flag, not trust blindly."
  unblocked_dependency_recheck: "Added 2026-09-14, per Kerwin, in-session ('fold it — I'm trying
                      to tighten up this loop as much as I can to push real work'). Worked example
                      that forced this: EPIC-18's story was correctly investigated (Cycle 79,
                      2026-09-08), correctly found blocked on a real prerequisite (BUG-107 — the
                      equipment-tier selector couldn't express 'home', which would have broken if
                      EPIC-18 shipped as scoped), and the blocker got filed and RESOLVED (commit
                      4943094) — but nothing ever re-checked EPIC-18 afterward. The blocker
                      cleared; the dependent story just sat at its old status. A real prerequisite
                      being fixed is exactly the moment a blocked item should come back into play,
                      and nothing was watching for that moment.
                      TESTED, not just asserted, against this exact case before writing the rule
                      (per SC-08/the staleness_escalation correction above — verify the mechanism
                      against real data before shipping it as a rule): the first design considered
                      was 'when a bug resolves, walk its Linked User Story relation for stories
                      still open.' Checked against BUG-107 and it does NOT work — BUG-107's own
                      Linked User Story relation points to its OWN auto-generated story, not to
                      EPIC-18's story at all. The only connection between them is TEXT: EPIC-18's
                      story cites BUG-107's page id in its own Evidence field, and BUG-107's
                      content separately says 'this also blocks EPIC-18 Slice 1.' A structured-
                      relation walk would have found nothing and looked like it worked.
                      Rule that actually matches the data: when a Bug & QA Log row transitions to
                      Resolved, run notion-search for that bug's own ID string (e.g. 'BUG-107')
                      across the workspace. For each OTHER page the search surfaces whose own
                      Status is not Resolved/Shipped, open it and check whether its content
                      references being blocked/parked/gated on this bug (the kind of citation
                      EPIC-18's Evidence field carries). Anything that matches gets re-evaluated
                      in the current cycle — re-run its story's Test Assertion for real, don't
                      just flip its status on the strength of the blocker being gone — same
                      priority tier as self_generated_priority above (ahead of ordinary Untested
                      rows), since a cleared, real dependency is exactly the kind of deterministic
                      signal that source already treats as gate-worthy.
                      Known limit, stated honestly rather than glossed over: this is a text-search
                      heuristic over free-form Evidence/content fields, not a structured
                      dependency graph — it will miss a blocking relationship that was never
                      written down as a citable bug ID, and could theoretically false-match a
                      page that mentions a bug ID for an unrelated reason (re-check the actual
                      language, not just the ID's presence, before treating a hit as real). The
                      durable fix is a real 'Blocked By' relation field on both databases — that
                      is a schema change (a structural decision, not something this loop makes
                      unilaterally per project-goal's own guardrail) and should be proposed to
                      Kerwin directly rather than added silently the next time this heuristic
                      catches a real case, as evidence for why the field would pay for itself."
  fixing_status_retriage: "Added 2026-09-15, per Kerwin, in-session — closes a gap he spotted by
                      asking a direct question, not one the loop caught itself: `Fixing` does not
                      appear ANYWHERE in project-goal's Step 3 priority order (Needs-Human-
                      unblocked > Failing > Untested > Uncatalogued), so a story stuck at Status =
                      Fixing has no guaranteed re-visit mechanism at all — not even the FIFO
                      treatment an ordinary Untested row gets. `Fixing` is meant to be a
                      within-cycle transient state (feature-loop sets it while actively working a
                      story, then Verify flips it to Resolved/Failing before the cycle ends), so a
                      row still showing Fixing at the START of a new cycle is BY DEFINITION
                      anomalous — either the prior cycle was interrupted mid-fix (real unfinished
                      work), or the fix actually shipped and the tracker write that should have
                      followed never happened (the exact D6b/BUG-106 shape from Cycle 85 the same
                      session that forced this rule: code fully shipped and doctrine-gate-enforced,
                      tracker row left stale).
                      Rule: at the START of every cycle, BEFORE picking the ordinary batch, query
                      the tracker for any row with Status = Fixing. For each: (1) read its Linked
                      Bug/Epic and its own Evidence field for the commit(s) it names, (2) check
                      whether that commit is actually on origin/main (`git log origin/main
                      --oneline | grep <sha>` or equivalent) and whether npm run verify /
                      validate:personas / the story's own Test Assertion currently pass against
                      that shipped state, (3a) if the work is genuinely done and gates hold, this
                      IS the story's Verify step — a fresh independent subagent re-runs the
                      assertion per the standing Verify discipline and flips it to Resolved, same
                      as any other story, (3b) if the work is genuinely incomplete or was never
                      pushed, resume and finish it as this cycle's highest-priority item before any
                      ordinary Untested row. Either branch ends with Fixing count back at 0 for that
                      row — it never carries forward silently a second cycle. Ranks ABOVE
                      self_generated_priority and staleness_escalation above: a row a PRIOR cycle
                      already started is worse to leave dangling than one that was merely never
                      started."
  needs_human_staleness_recheck: "Added 2026-09-15, per Kerwin, in-session, prompted by him asking
                      whether the loop would ever confirm the 16 open Needs Human rows still
                      genuinely need him — it does not, today. unblocked_dependency_recheck above
                      only re-surfaces a Needs Human row when a Bug & QA Log row RESOLVED THIS
                      CYCLE cites it by ID; a row whose blocker was cleared by something OTHER than
                      a bug resolution (a doctrine promotion, a sibling Epic shipping, a fact
                      simply going stale with time) has no path back into rotation at all. Left
                      unchecked this is the identical staleness_escalation failure shape (a story
                      silently parked, escalation.reporting's own standard) just for the
                      Needs-Human tier instead of Untested/Planned/Scoped.
                      Rule: EVERY cycle, pick up to 5 of the Needs-Human rows whose own 'Last
                      Rechecked' note is either absent (never rechecked — all 16 start in this
                      state as of 2026-09-15, so this begins working through the full backlog
                      starting the very next cycle, not waiting for a fixed count of cycles to
                      pass) or more than 3 days old (same threshold staleness_escalation above
                      already uses, for consistency rather than inventing a second number) — oldest
                      last-checked (or never-checked) first. This is naturally self-throttling: once
                      the initial 16 have each been rechecked once, a cycle with nothing due simply
                      finds 0 candidates and reports that, the same as any other empty sweep — it
                      does NOT mean re-litigating all 16+ every single cycle forever, only that nothing
                      currently sits stale. Track the 'Last Rechecked' date on the row itself, or if
                      that property doesn't exist yet, fall back to the row's own last-edited time. For
                      each row pulled this way, run escalation.exhaust_before_parking's step (1) against
                      each: does an
                      already-cited source — code that has since shipped, a doctrine invariant
                      that's since gone ACTIVE, a council verdict already on file for the same
                      fork — resolve this outright now, even though it didn't when it was filed?
                      If yes: this is the story's Verify step, same fresh-subagent discipline as
                      any other, flip to Resolved. If the cited blocker is still real: leave the
                      row as Needs Human but stamp 'Last Rechecked: <date>, still blocked on
                      <reason>' so the NEXT sweep doesn't re-spend effort re-establishing what this
                      one just confirmed, and report the recheck (checked/confirmed-still-blocked/
                      resolved counts) as its own line in the cycle's Goal Record entry, same
                      transparency standard as batch_prioritization.reporting requires for
                      self-generated-source and unblocked-dependency finds. This does NOT relax
                      still_needs_kerwin or safety.forbidden — a row that's still genuinely on that
                      list stays Needs Human no matter how many times it's rechecked; this rule is
                      about catching the ones that AREN'T anymore, not about pressuring the ones
                      that are."
  reporting: "A cycle that has self_generated_sources-seeded, stale, or unblocked-dependency work
                      available and reports it as 0 buildable work (the same failure shape
                      catalog.self_generated_sources already names for persona_matrix/pending_
                      doctrine_sweep findings going unfiled) is incomplete, not honestly
                      conservative — same standard as escalation.exhaust_before_parking below,
                      applied to the batch-SELECTION step instead of the fix-attempt step. The same
                      standard applies to fixing_status_retriage and needs_human_staleness_recheck
                      above: a cycle that finds a Fixing row or a due staleness-recheck batch and
                      silently skips it (rather than doing the retriage/recheck AND reporting the
                      outcome) has failed this same bar, not stayed conservative."

daily_macro_audit:    # Added 2026-09-15, per Kerwin, in-session, correcting needs_human_
                      # staleness_recheck's cadence within the same conversation that introduced
                      # it (see docs/self-corrections.md SC-15 — the worked example that forced
                      # this section). His words: "I want the macro scope of figuring out what
                      # needs to be done in the whole project done every morning, not just for
                      # the next 7 days." needs_human_staleness_recheck's "5 rows/cycle,
                      # self-throttling" trickle makes full-backlog awareness a function of how
                      # OFTEN the loop happens to fire — fine at a continuous ~20min self-paced
                      # cadence, but if this project ever runs on a slower fire (a once-daily
                      # scheduled cron, the way tandem-data-integrity-audit already does), that
                      # same rule could take several real calendar days to look at the whole
                      # backlog even once. This section decouples "how much of the backlog gets
                      # RECONSIDERED" from "how much gets FIXED" — the latter stays batch-capped
                      # (safety.max_items_per_cycle) for verifiability, the former does not.
  trigger: "The first cycle of each new calendar day — computable, not asserted (SC-10's own
                      lesson): before picking a batch, check whether the Goal Record's '## Cycle
                      log' already has an entry dated today. If not, THIS cycle is today's first
                      and runs the full audit below BEFORE the ordinary batch_prioritization
                      picks anything. If a Cycle-log entry for today already exists, skip this
                      section entirely for the rest of the day — it is a once-per-day pass, not
                      a per-cycle one."
  scope: "Unlike every other batch/recheck rule in this file, this audit is NOT capped by
                      safety.max_items_per_cycle — its job is to look, not to fix, so its cost is
                      read-heavy investigation, not risky code changes. Cover the WHOLE current
                      backlog in one pass:
                      (1) Full CATALOG re-sweep — not just new rows since last check: confirm
                      EVERY currently-open Bug & QA Log row and open Epic has a linked tracker
                      story (catches anything incremental seeding missed), then run every
                      catalog.self_generated_sources check (these already run every cycle, so
                      this is a re-affirmation, not new work).
                      (2) Full Needs-Human recheck — ALL open Needs-Human rows (all 16 as of
                      2026-09-15, not a 5-row slice), each run against escalation.
                      exhaust_before_parking's step (1): does an already-cited source resolve
                      this NOW even though it didn't when filed. This is the primary mechanism
                      for needs_human_staleness_recheck's coverage guarantee; that section's
                      5-per-cycle version becomes a secondary, INTRADAY backstop only (e.g. a bug
                      resolving mid-afternoon that might unblock something before tomorrow's
                      audit), not the thing responsible for eventually covering all 16.
                      (3) Fixing-row retriage — fixing_status_retriage above already runs every
                      cycle (stricter than daily), so nothing new here; just confirmed as part of
                      the same morning pass for a single combined report.
                      (4) Full Untested re-triage — re-derive the CURRENT priority order across
                      every Untested row (not just the next 5): apply staleness_escalation, check
                      for anything self_generated_priority should promote, and flag anything that
                      looks stale/superseded/already-done-elsewhere (the D6b shape) for the same
                      kind of resolution fixing_status_retriage gives Fixing rows."
  output: "Write the full, current backlog picture — not just what got fixed — into the Goal
                      Record as a distinguished 'Today's Plan' block at the top of that day's
                      first Cycle-log entry: total counts per status, the priority-ordered
                      worklist this audit produced, every Needs-Human row's recheck outcome
                      (confirmed-still-blocked vs. resolved-now), and anything newly flagged
                      stale/superseded. Subsequent cycles THAT SAME DAY read this block instead
                      of re-deriving priority from scratch, and still execute against it in
                      normal max_items_per_cycle-capped batches — full visibility does not mean
                      unbounded throughput. If GOAL MET fires mid-audit (everything's actually
                      resolved), report that plainly instead of manufacturing a worklist."

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
  pre_ship_council_gate: "Added 2026-09-16, per Kerwin, live in-session, generalizing default_for_forks
                      above from 'genuine forks only' to every push: 'I'm fine with it if all the gates
                      pass green, as long as it's not a design feature... if it's simply bug fixes, or
                      epics in terms of mapping this to this, I would defer to the LLM council first.
                      If they reach a consensus, then go ahead and push to main.' Rule: for ANY change
                      that is NOT a design/aesthetic change (see design_changes_hold in still_needs_kerwin
                      below) — an ordinary bug fix, or an epic that is mechanical/mapping-shaped rather
                      than a judgment call — run it through llm-council for a consensus verdict BEFORE
                      push, even when no genuine implementation fork exists to force the question. This
                      stacks with, not replaces, the standing ship gate (verify + validate:personas +
                      onboarding walkthrough when touched): green gates AND council consensus are both
                      required before `git push origin HEAD:main`. No consensus (the split isn't
                      converging) routes to still_needs_kerwin per the existing 'anything the council
                      declines to resolve' item below — do not push on a non-converging split."
  still_needs_kerwin:  # The guardrail is mechanical (this list), never "how big is this decision."
    - "everything already in safety.forbidden below, including the 2026-08-30
       scoring/matchmaking/biometric-layer addition"
    - "design_changes_hold — ADDED 2026-09-16, per Kerwin, live in-session: any change that alters the
       app's design/aesthetics — visual style, theming, layout, or the look-and-feel of the whole
       product, as opposed to a functional bug fix or a mechanical/mapping-shaped epic — is held for
       Kerwin directly, in full, regardless of green gates or an llm-council consensus. Verbatim: 'if
       it's an epic that changes the aesthetics of the whole thing, I would hold on... if it's
       design-based, bring it to me.' This is a mechanical routing question (does the change touch
       visual/aesthetic surface, not just fix or map behavior), not a size judgment — when genuinely
       ambiguous whether a change counts as 'design', treat it as design (hold) rather than guess in
       the shippable direction."
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
       if yes, route it through direct_ask below instead of just filing it, full stop, no further
       fix attempt; (4) otherwise, run llm-council on the fork and act on its verdict per
       wave_decomposition.conglomeration.verification_gate. A row may reach Needs Human only after
       step (4) fails to converge or step (3) applies — never as the first thing tried on a fork
       that isn't a genuine product/business call or a safety.forbidden item."
  direct_ask: "Added 2026-09-04, per Kerwin, in-session, correcting how still_needs_kerwin items
       get resolved: a row that is genuinely 'what should the rule be' (BUG-56's skip-day
       decision, BUG-84-87's science-conflict rulings, BUG-60's rename — the kind of thing that
       has sat as an open Notion row for a week or more, per Cycle 61-68's unanswered decision
       request) does NOT just get written to Notion and left to wait. Notion stays the durable
       record (doctrine_is_law and the durability rules below still require it), but the ACTIVE
       channel for getting it answered is direct: in an ATTENDED session (Kerwin present, like
       this one) ask him the specific question directly in chat — with an interactive
       question-asking tool if this session has one (e.g. AskUserQuestion), or plainly in text if
       not — rather than deferring to a tracker row he has to go find. In an UNATTENDED /
       scheduled cycle, PushNotification the literal question (not 'something needs your input,
       check Notion' — the actual question, with enough context to answer from the notification
       alone), so it can be answered the moment Kerwin next looks at his phone instead of sitting
       for a week. Whichever channel resolves it, write the answer back onto the Notion row
       immediately (citation/verdict + what it unblocked) so the durable record and the live
       answer never diverge. This also covers the non-objective half of
       live_test_account_verification above: 'does this look/feel right' gets the same
       treatment — surface what the run produced (screenshot/description) and ask, don't decide it
       unilaterally and call it Resolved."
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
  # "⭐ LOOP GOAL RECORD — ACTIVE". project-goal finds it via notion-search and reads/writes
  # its machine-checkable state from the page-body "## State" block (STATUS / CYCLE_COUNT /
  # LAST_SNAPSHOT) + appends to "## Cycle log".
  # Live page: https://app.notion.com/p/389ca37f935b81998d2bcebf0a364c52
  #
  # CORRECTED 2026-09-24 (Cycle 92, docs/self-corrections.md SC-26): this line previously
  # said query/SQL mode (notion-query-data-sources) was "plan-gated on this workspace, do
  # not use it" — copied forward from an earlier session's claim and never itself verified
  # by running the tool, the exact SC-03 failure mode ("run, don't simulate/assume"). A
  # Cycle 92 subagent tried it anyway (per SC-03) and it worked: a live
  # `SELECT "Status", COUNT(*) FROM "collection://fcfd09db-...-90bed2abacdc" GROUP BY
  # "Status"` against the Tandem User Story Coverage data source returned real counts
  # (149 rows total: Resolved 97, Failing 14, Untested 15, Needs Human 12, Skipped 7,
  # Passing 3, Fixing 2), re-confirmed independently in the same cycle. CATALOG and any
  # future audit should PREFER notion-query-data-sources (rows or sql mode) over
  # keyword-search-plus-fetch for enumerating tracker rows — it is exact and exhaustive
  # where search is best-effort and can miss rows. If a future call genuinely hits a
  # plan-gate error, record the actual error text here before reverting this guidance —
  # don't restore the old blanket claim from memory.

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
  onboarding_walkthrough_command: "npm run walkthrough:onboarding"  # scripts/onboarding-
                                # lifecycle-walkthrough.mjs — see catalog.self_generated_sources
                                # above (onboarding_lifecycle_walkthrough); run every cycle.
                                # Exit code 0 = no findings; non-zero = findings printed to
                                # stdout, file each via discovery_handling before fixing.
                                # Requires `npm install` once (playwright devDependency,
                                # pinned to match this environment's pre-fetched browser —
                                # see package.json; a different environment may need
                                # `npx playwright install chromium` if the pin mismatches).
  pending_doctrine_sweep_command: "npm run sweep:doctrine"  # scripts/pending-doctrine-sweep.mjs —
                                # see catalog.self_generated_sources above (pending_doctrine_sweep);
                                # run every cycle, same standing cadence as persona_matrix. Always
                                # exits 0 (a discovery sweep, not a pass/fail gate) — read its
                                # output: any row printed 🟢 BUILDABLE with no linked Untested
                                # story yet must get one seeded this cycle, never deferred.
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
    - "ADDED 2026-09-16, per Kerwin, live in-session (docs/self-corrections.md SC-16): when a
       why-string or exercise-science claim turns out fabricated/uncited, flagging-and-removing is
       the FALLBACK after research fails, not the default response to finding one. Verbatim: 'find
       the answer & note the fix, don't just note that one was wrong.' Required sequence before
       flagging: (1) exercise-science-research against every canonical source for the specific
       claim, (2) an actual attempt at live research (WebSearch/WebFetch) for a real citable source
       if those tools are available in the session — check availability by trying the call, never by
       asserting 'no egress' from memory or a prior session's limitation. Only once both genuinely
       fail, flag the gap in the commit + Notion row, stating plainly what was searched and why it
       came up empty. Any citable source found this way must clear the domain tiering added the
       same day to exercise-science-research/SKILL.md — peer-reviewed/.edu/.gov/established sport-
       science orgs as PRIMARY (a citation can rest on this alone), blogs/Reddit/forums as SECONDARY
       corroboration only, never the sole basis for a claim. BUG-121 (the follow-up sweep for the
       remaining uncited-percentage claims BUG-110 left out of scope) is the first case this applies
       to — the cycle that works it must
       run this sequence per claim, not just repeat BUG-110's remove-and-flag pattern."

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
  destructive_write_audit_trail:   # Added 2026-09-20, per Kerwin, live in-session ("fix it") —
                                    # closes the gap BUG-125 exposed. A real prod delete (83 `sets`
                                    # rows, 2026-09-18) was executed via a direct Supabase MCP
                                    # connection — correctly following the pre-image-capture +
                                    # explicit-id-list + post-verify discipline, and correctly
                                    # citing Kerwin's own prior ruling as authorization — but the
                                    # ONLY record of it was prose on a Notion tracker page. No
                                    # queryable table recorded it. Result: 2+ days of genuine
                                    # confusion over whether it was authorized, an unnecessary
                                    # re-escalation, and — even after Kerwin settled the
                                    # authorization question twice (Decision Queue 09-18, this
                                    # page's own quote) — no way to independently confirm which
                                    # session/actor actually ran it, because Supabase's default
                                    # logging captures neither statement text nor connection
                                    # identity for a direct/service-role connection (no pgAudit
                                    # enabled) and nothing wrote to `agent_log`.
    rule: "Before, or immediately after, any direct (non-PostgREST, non-app) Supabase write that
           deletes or updates more than one row of real data — the tandem-data-integrity-audit
           skill's allowlisted ghost-session cleanup included — insert one row into `agent_log`
           (log_type='destructive_db_write', assertion=one-line description, details=jsonb with
           at minimum: tables touched, operation, row count, before/after totals, the specific
           policy/ruling that authorizes it with a citation, and a link to the Notion page
           recording it). This is NOT a replacement for the existing pre-image-capture +
           explicit-id-list + post-verify discipline or for writing the incident up in Notion —
           it is the durable, queryable half that discipline was missing. `agent_log` already has
           the right shape for this (session_id uuid, log_type text, assertion text, details
           jsonb, created_at) — no migration needed, no schema change, just discipline. Skipping
           this step is itself a finding worth flagging next time it's caught missing, the same
           way a missed should/could/did audit is."
    amended_2026_09_23: "TIGHTENED — supersedes the 'rule' text above wherever they differ. Kept as a
           separate commit on top of Kerwin's merged text so it can be reverted on its own. Source:
           a 5-advisor llm-council pre-ship review of the merge, unanimous, 2026-09-23. Trigger: on
           2026-09-23 the BUG-131 personal_records row (Good Morning, 1267 -> 133) was corrected by a
           direct write that left NO agent_log row and did not move updated_at, so nobody can say who
           ran it. That is the exact BUG-125 failure, and the original 'more than one row' threshold
           exempted it. Changes:
           (1) THRESHOLD: ONE OR MORE rows. A single personal_records / working-1RM row feeds load
               prescription directly; row count is the wrong proxy for risk.
           (2) OPERATIONS: INSERT, UPDATE, UPSERT, DELETE and any DDL — not only delete/update.
           (3) SCOPE BY ACTOR, NOT TRANSPORT: any write NOT made by the app on behalf of the
               signed-in user. A service-role REST/supabase-js call goes through PostgREST and is
               still in scope; 'non-PostgREST' is dropped as a loophole.
           (4) 'REAL DATA' = any row belonging to a user who is not one of the two allowlisted test
               accounts (kerwinferrette+test@gmail.com, kerwinferrette+testdani@gmail.com).
           (5) REQUIRED details ADDED: actor (Claude-Session URL, or skill/agent name, or 'human:
               <name>' — never blank), connection used (MCP execute_sql / SQL editor / script), and
               per-row primary keys with before/after values (totals alone cannot reconstruct a
               single-row change).
           (6) ORDER: write the agent_log row BEFORE the data write, then update it (or add a second
               row) with the after-values. 'Immediately after' loses the record exactly when the
               session dies mid-write.
           (7) This ADDS to destructive_ops_require_human — a log row never substitutes for the
               human authorization that flag requires.
           ENFORCEMENT, stated honestly per CLAUDE.md's self-correction protocol: judgment — not
           mechanically checkable today. A future, stronger version would be an AFTER
           INSERT/UPDATE/DELETE trigger on personal_records / sets / workout_sessions that writes to
           agent_log whenever the writer is not the app's role — that is a schema change and is
           Kerwin's call, noted here as the next step, not taken."
    retroactive_fix: "2026-09-20: backfilled one `agent_log` row (id 12b06564-8604-40aa-afaa-bc61a1e8f8ef,
           created_at 2026-09-20 17:07:40 UTC) documenting the 2026-09-18 sets/personal_records
           cleanup after the fact, cross-linked to BUG-16 and BUG-125. This does not change what
           happened; it makes the record queryable instead of Notion-prose-only, going forward.
           2026-09-23: backfilled a second row (id 8ce5ee1c-9ca7-449b-94b1-d5efbdf8cc38, created_at
           2026-09-23 06:02:08 UTC) for the BUG-131 Good Morning personal_records correction
           (1267 -> 133), performed in the 05:55-06:02 UTC window, actor recorded as UNKNOWN — see
           amended_2026_09_23 above."
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
7. **CLARIFICATION, 2026-09-13, Kerwin, in-session — logging is not the same as notifying.**
   Rules 1-2 above (run every cycle, lead the Goal Record's cycle log with the numbers) stand
   exactly as written — that durable record is what stopped 56 cycles from being blind. What
   changes: a scheduled/unattended cycle must NOT `PushNotification` the outcome-gate numbers
   just because they're still red, unless something about them is actually new or actionable
   (a real behavior change, a code-side cause worth investigating, a threshold newly crossed).
   Kerwin's words: *"That just means she's not using the app. It means nothing. It just means
   this app has to get better in order to use it... it doesn't pertain to what this particular
   loop is trying to do."* Restating "still zero, still idle" every cycle to his phone is noise,
   not signal — the gate staying red in the exact same way it was red last cycle is not news.
   This does NOT loosen rule 4 (never tune the thresholds down, never quietly stop reporting it
   in the durable record) — it only scopes the *push-notification* channel, not the *ledger*
   channel. A genuinely new outcome-gate finding (a real regression, a new stale lift, a threshold
   crossed for the first time) is still notify-worthy; an unchanged red is not.
   **Separately, noted as a real product idea, out of THIS loop's scope**, per the same
   conversation: a proactive re-engagement nudge ("hey, you haven't worked out in a while — want
   to get back into it?") sent to an idle user is a feature worth building, tracked as its own
   Epic (see Epics & Feature Roadmap) — not something this bug-fixing loop implements or
   substitutes for by nagging Kerwin instead of the actual idle user.

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

**AMENDED 2026-09-16, per Kerwin, live in-session** (see `escalation.pre_ship_council_gate` and
the new `design_changes_hold` item in `escalation.still_needs_kerwin` for the full rule): green
gates alone are no longer sufficient for every push. Split by kind of change —
- **Design/aesthetic change** (visual style, theming, layout, look-and-feel of the whole product):
  hold it, full stop — bring it to Kerwin directly, never auto-ship even with green gates.
- **Everything else** (bug fixes; mechanical/mapping-shaped epics — "map this to this"): green
  gates are still required, AND an `llm-council` consensus is now required before every push, not
  only when a genuine implementation fork forces the question. Consensus + green gates → push. No
  consensus → `Needs Human`, do not push on a non-converging split.

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
6. **Rule 4 is now mechanically checkable, not just judgment — but the check itself is still
   PROCEDURAL, not automatically enforced.** ADDED 2026-09-17, per Kerwin, after BUG-49 and
   BUG-57's Notion pages both described completed, gate-green fixes that existed on no remote ref
   (docs/self-corrections.md SC-19). Before writing In Fix / code-complete / Resolved to any Notion
   row, run `npm run claims:check -- <sha>` for every sha the status cites. A non-zero exit means
   the fix does not exist yet on `origin/main` — the status stays New/Investigating, regardless of
   how complete the page's prose reads. This does not replace rule 4's symbol-grep (the sha check
   proves reachability, not that the diff contains the claimed fix) — do both.
   **Honest limit (self-corrections.md's own condition #3, applied to this rule):** nothing calls
   `claims-on-origin.mjs` automatically. There is no single controlled code path that writes a
   Notion status — the write is a manual/agent action — so this is a discipline the session must
   remember to run, not a gate that blocks a bad write from happening. Verified live 2026-09-17: the
   script correctly PASSES a sha on `origin/main`, correctly FAILS a real local-only unpushed commit
   ("not an ancestor"), and correctly FAILS a nonexistent sha ("not a known commit") — the mechanism
   works when invoked. If this rule is ever violated again, the fix is not "the script was wrong,"
   it's "the invocation step was skipped" — do not re-litigate the script.

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

## Future direction — guardrails belong in the program, not just the prompt (2026-09-15, Kerwin)

**Flagged, NOT scheduled.** Kerwin, in-session, after the `/loop` prompt was rewritten to fold in
that session's process fixes: *"If the prompt itself can't be airtight, let's try and figure out
some guardrails and harnesses on the program itself that can try to make it that way. Not
something for this session, but something to keep in mind."* This section exists so the idea
survives to whichever session Kerwin actually asks for it — it is a direction, not a task in
flight, and should not be picked up as ambient scope creep on an unrelated cycle.

**Why prose alone doesn't get there:** a `/loop` prompt is guidance for judgment; it does not
execute and does not check itself — the same point `scripts/preflight.mjs`'s own header makes
about the wave ledger it replaced ("Prose in a document does not execute. This script does.").
Every process hole found in the 2026-09-14/15 session (the `staleness_escalation` mechanism wrong
twice — see `docs/self-corrections.md` SC-10 — the `docs/WAVE-STATE.md` /
`docs/waves/*.md` duplication, the missed same-turn wave-checkbox flip) was caught by Kerwin
asking a question, not by any instruction catching itself. The durable version of each fix is the
kind this project already has some of — `scripts/doctrine.mjs`, `scripts/preflight.mjs`,
`persona_matrix`/`onboarding_lifecycle_walkthrough` under `catalog.self_generated_sources` — a
script that can fail loud, not one more paragraph trusted to be followed.

**One candidate raised in-session, not decided or scoped:** `tandem-tpm` (already `feature-loop`'s
`existing_project_skill` for Fix/Verify, and already reconciles code state against Notion) may be
a natural home for this class of check mechanically — e.g. auditing whether new selection/tiebreak
code has quietly reintroduced a pattern a prior council verdict or doctrine invariant rejected
(the `oneRmFactor`-as-primary-synergy-tiebreak concern from the 2026-09-14 council report is the
motivating example, not the only one) — rather than a static rule sitting in a prompt hoping to be
read. Whoever picks this up should design it against a real case the way SC-10 requires, not
assume the shape of the check works before checking it against real data.

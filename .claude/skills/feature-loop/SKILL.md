---
name: feature-loop
description: Runs one cycle of a catalog-test-fix-verify pipeline against a codebase — turns features into user stories with expected behavior, tests each story against the live app or database, fixes confirmed failures with no per-bug human approval required, and independently re-verifies every fix before marking it resolved. Writes all status to the project's Notion tracker. Use when the user says "run the loop," "go over every feature," "test every user story," "fix what's broken and reverify," or as the worker invoked by the project-goal skill. Full autonomy on applying fixes; verification and escalation rules are not optional and do not relax even when no human is watching.
---

# feature-loop

You run one increment of the pipeline: **Catalog → Test → Fix → Verify**. You do not decide the overall objective or when to stop — that's project-goal. You're handed a batch of story IDs (or "catalog the whole codebase, nothing exists yet") and you work that batch.

**The core rule this whole skill exists to enforce:** autonomy means no human approves each bug. It does not mean no verification. Every status change from Fixing to Resolved must be backed by a fresh, independent check — never by the Fix step's own say-so. This project has already had Claude Code report a sync-layer fix complete twice when it wasn't, caught only by querying the database directly. This pipeline exists so that doesn't happen silently at scale.

## Step 0 — Load config and status vocabulary

Read `.claude/loop-config.md`. It gives you `codebase_root`, `feature_tracker_db`, `bug_log_db` (may be the same DB as the tracker), verification commands, and safety limits. If `existing_project_skill` is set, prefer ITS bug-fix discipline over the generic Fix instructions below — don't run two different fix procedures on the same codebase.

Status vocabulary for `feature_tracker_db` rows:
`Uncatalogued → Untested → Passing | Failing → Fixing → Needs Human` or `→ Resolved`. Plus `Won't-Fix` for stories the user explicitly excludes.

## Stage 1 — Catalog

Read `agents/catalog.md`, then spawn a **read-only** subagent (no Edit/Write/Bash) with those instructions for any feature areas not yet catalogued. It reads the actual code — not the README, not assumptions — and writes one user story per discrete behavior to `feature_tracker_db`, status `Untested`. Idempotent: skip anything already catalogued unless the code's fingerprint (line count + a content hash of the relevant file/section) has changed since the last catalog pass.

## Stage 1.5 — Plan (Wave decomposition, Epics only)

**Added 2026-08-30, per the llm-council verdict on why every Epic bigger than a one-file change
parked in Needs Human instead of getting built.** Bugs skip this stage entirely — a Bug is already
one discrete behavior and goes straight to Test. An Epic-sourced story does NOT skip it.

For every open-Epic story that reaches this stage without a Wave file yet at
`docs/waves/<EPIC-ID>-WAVE-STATE.md` (or whose Wave's next unchecked step is stale), read
`agents/plan.md` and spawn a Plan subagent (read + Notion write, no code edits) with those
instructions. It cuts the Epic into small, independently scope-lockable, independently verifiable
slices, seeds one Untested child story per slice, and writes/updates the Wave file as the
project's checkpoint of record.

**This is the mechanism that replaces "the whole Epic is one Failing row that trips the Fix
stage's scope-guard and parks forever."** After Plan runs, Test/Fix/Verify operate per-slice
exactly as they do for a Bug — the scope Fix is allowed to touch **is the slice**, never the Epic.

**Checkpoint discipline (this is what makes the loop resumable, not a live "wait for credits"
mechanism — see loop-config.md's `wave_decomposition` section for why):** after every slice reaches
`Resolved`, the Wave file's checklist gets updated and **committed** (not left in session memory)
before the cycle ends, even if the cycle is cut short mid-Wave. The next day's cron firing reads
the Wave file, finds the first unchecked step, and continues — this is the entire resume story.
Never treat "ran out of budget mid-Wave" as different from "day's batch is done" — both just mean
"stop, having committed the checkpoint, and let the next firing pick it up."

**Council-as-default for implementation forks (Plan and Fix alike):** per the same council verdict,
when Plan or Fix hits a genuine implementation judgment call the Epic's own spec doesn't resolve,
invoke `llm-council` directly and record its verdict + citation rather than routing to Needs Human.
`Needs Human` stays reserved for what actually requires Kerwin: anything on `loop-config.md`'s
forbidden-ops list (including the scoring/matchmaking/biometric-layer carve-out `agents/plan.md`
describes), or a genuine product/business call — not an implementation fork the council can settle.
Every council-decided-and-self-executed decision gets one line in the Goal Record's cycle log
tagged `[COUNCIL]`, so it stays visible without Kerwin having to ask.

**First-run caveat — do not treat this as unattended-safe on day one.** `agents/plan.md` requires a
validation dry run before its output is trusted on a live Epic unsupervised. Until that dry run has
run and been reviewed, every Wave this stage produces is a **draft**: seed the slice stories, write
the Wave file, but do not let Fix begin executing from it without that review having happened at
least once for this mechanism.

## Stage 2 — Test

Read `agents/test.md`, spawn a subagent with read + safe-execution tools (it can run the project's test/verification commands and query the database, but no Edit/Write to app code) for every story at `Untested` or stale. It exercises the story for real — runs the app, hits the assertion, queries the table — and records pass/fail with evidence (command output, query result, screenshot path). Status becomes `Passing` or `Failing`. No code changes happen in this stage, ever.

## Stage 3 — Fix

For each `Failing` story, P0/critical first if the tracker has a severity field, otherwise in tracker order:

0. **If this story's source is an Epic, confirm it's a Wave slice, not the whole Epic.** Check the
   story for a link to a `docs/waves/<EPIC-ID>-WAVE-STATE.md` step. If it isn't — i.e. Stage 1.5
   was skipped or this is a pre-Wave-mechanism legacy row for a multi-file Epic — stop and route it
   back to Plan instead of attempting it. Fix's scope-guard (step 2 below) exists precisely so this
   stage never absorbs an un-decomposed Epic; do not override that by "just this once" expanding
   scope to cover the whole thing.
1. Read `agents/fix.md`.
2. Scope-lock to exactly that story's failing behavior. State the scope in the story's Notion entry before touching anything.
3. Spawn a subagent **with Edit/Write/Bash granted up front** — since no human approves per-bug, there is no one to answer an interactive permission prompt mid-task, so the permission has to be pre-authorized at the tool-access level, not just described in this skill. If you're running in Claude Code, this means the session's permission mode must already allow these tools for this scope; if it doesn't, the subagent will stall on a prompt nobody will answer. Set that up before starting the cycle, not mid-cycle.
4. The subagent applies the minimal fix, runs the project's syntax/build check from config, and stops. It does **not** mark the story Resolved. It does not opportunistically fix anything outside its declared scope — a bug noticed in passing gets logged as a new `Untested` story, not fixed in the same pass.
5. Status moves to `Fixing` with the diff/change summary attached.

## Stage 4 — Verify

Read `agents/verify.md`. Spawn a **new, independent** subagent — fresh context, no access to the Fix subagent's reasoning or conversation. It does not trust the Fix step's report. It re-runs the exact same test from Stage 2 from scratch, plus a small regression check (re-run N other already-`Passing` stories that touch the same file/area, to catch collateral breakage).

- **Both pass:** status → `Resolved`. Write the verification evidence into the story (not just "fixed" — the actual command/query output that proves it). This evidence trail is what makes unattended autonomy auditable after the fact, even though nothing was approved in the moment.
- **Either fails:** increment the story's retry counter. If retries remain (`max_fix_attempts_per_story` from config, default 2), go back to Stage 3 for one more attempt — same scope-lock discipline, informed by why the last attempt failed. If retries are exhausted: status → `Needs Human`, with the full evidence trail of what was tried and why it still fails. **Stop touching that story.** Do not keep retrying past the cap. Do not mark it Resolved anyway because the loop "ran out of other things to do."

## Hard limits (apply regardless of the autonomy setting)

- `max_items_per_cycle` from config caps how many stories Stage 3 touches in one invocation — don't let one cycle try to fix everything at once.
- These operations always require a human present, full stop, no matter what the per-bug approval setting is: schema/migration changes, any database delete outside an explicitly allowlisted, pre-image-captured set (reuse the project's existing data-integrity discipline if it has one), credential or secret rotation, anything affecting another real user's data. Autonomy on code fixes is not autonomy on irreversible data operations — those are a different risk class and stay gated.
- If a fix requires touching code outside the declared scope to work at all, stop and report instead of expanding scope unilaterally.

## Reporting

Return a structured cycle summary to whoever invoked you (project-goal, or the user directly):
```
Catalogued: [N new stories]
Waved: [N Epics decomposed] — [Epic IDs, slice counts, Wave file paths]
Council-decided: [N] — [one line each: what was decided, citation/verdict]
Tested: [N] — [N passing, N failing]
Fixed + Verified Resolved: [N] — [story IDs]
Escalated to Needs Human: [N] — [story IDs + one-line reason each]
```
Write the same to the project's run log via project-goal's schema, or directly to `bug_log_db`/`feature_tracker_db` if invoked standalone.

## Notion write rules

- Never delete a tracker entry. `Won't-Fix` and `Needs Human` are terminal-but-visible states, not deletions.
- Catalog writes must be idempotent — dedupe by feature signature before creating a row, every run, since this pipeline may run unattended for many cycles.
- Every `Fixing → Resolved` transition carries its verification evidence inline. No exceptions, including when you're confident.

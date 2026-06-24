---
name: project-goal
description: Defines, persists, and checks progress on a long-running improvement objective for a software project — e.g. "catalog every feature as a user story, test each one, fix what fails, re-verify." Reads and writes its state to the project's Notion tracker so progress survives across sessions, since neither Claude Code's /loop nor Cowork's /schedule retain state between runs on their own. Use whenever the user says "set a goal for this project," "what's left before X is done," "check progress on the loop," "is the goal met yet," or wants a standing objective that a scheduled loop should keep working toward. This skill defines WHAT done looks like and tracks progress toward it; the feature-loop skill does the actual catalog/test/fix/verify work each cycle.
---

# project-goal

You are the objective-keeper for a generic, project-agnostic improvement loop. You do not touch code and you do not fix bugs — that is feature-loop's job. Your job is: know what "done" means for this project right now, know how far along we are, decide what the next batch of work should be, and make that legible across sessions that don't share memory with each other.

This skill exists because the platform's own scheduling primitives are not durable state stores:
- Claude Code's `/loop` keeps firing while the terminal session stays open, but does not remember progress once that session ends.
- Cowork's `/schedule` keeps firing while the Desktop app is open and the machine is awake, same limitation.

So the goal record itself has to live somewhere both the scheduler and a fresh session can find it. That's Notion.

## Step 0 — Load the project config

Look for `.claude/loop-config.md` at the project root (or ask the user where it lives if missing — do not guess Notion IDs). It supplies:
- `run_log_db` — the Notion database (or page) where goal records and cycle history live
- `feature_tracker_db` — the Notion database holding user stories / features and their status
- `existing_project_skill` — if the project already has its own TPM-style skill, defer status semantics to it rather than inventing parallel ones

If `.claude/loop-config.md` doesn't exist yet, stop and tell the user to create one from `loop-config-template.md` before this skill can run — do not improvise a config.

## Step 1 — Load or create the Goal Record

Query `run_log_db` for an open Goal Record (a page/row with `Status = Active`) for this project. If none exists and the user just stated an objective, create one with:

| Field | Content |
|---|---|
| Objective | Verbatim or lightly cleaned-up statement of what done looks like |
| Scope | Which features/areas are in scope (default: everything in `feature_tracker_db`, unless the user limited it) |
| Definition of Done | The exact, checkable condition — e.g. "every story in `feature_tracker_db` is Resolved or explicitly Won't-Fix" |
| Started | today's date |
| Cycle Count | 0 |

If a Goal Record already exists, load it instead of creating a duplicate. Never create a second Active goal for the same scope — surface the conflict to the user instead.

## Step 2 — Compute progress

Query `feature_tracker_db` and count stories by status (see feature-loop's SKILL.md for the exact status vocabulary: Uncatalogued, Untested, Passing, Failing, Fixing, Needs Human, Resolved, Won't-Fix). Compare against the prior cycle's snapshot (stored on the Goal Record or the most recent Run Log entry) and compute the delta.

## Step 3 — Decide the next batch

Pick what feature-loop should work on next, in this priority order:
1. Any story flagged `Needs Human` that the user has since resolved/unblocked (re-queue it)
2. Stories with `Status = Failing`, P0/critical first if the tracker has a severity field
3. Stories with `Status = Untested`
4. Stories with `Status = Uncatalogued` (or, if the catalog has never run, the whole codebase)

Cap the batch size from `.claude/loop-config.md`'s `max_items_per_cycle` (default 5) — don't hand feature-loop the entire backlog in one cycle. Smaller, verifiable cycles beat one giant unsupervised pass.

## Step 4 — Hand off and record

Invoke feature-loop with the batch. When it returns its cycle report (items attempted / fixed / verified-resolved / escalated), write a new entry to `run_log_db`:

```
Cycle: [N]
Date: [today]
Batch: [what was attempted]
Resolved this cycle: [count + story IDs]
Escalated to Needs Human: [count + story IDs + why]
Snapshot: [status counts across feature_tracker_db]
```

Increment Cycle Count on the Goal Record.

## Step 5 — Emit the done/not-done signal

Re-check the Definition of Done against the fresh snapshot. Output one of:

- `GOAL MET — [objective] — [N] cycles, [N] stories resolved, [N] escalated to Needs Human for manual review.` Set the Goal Record `Status = Met`.
- `GOAL NOT MET — [N] of [total] resolved, [N] remaining, [N] awaiting human input. Next cycle will target: [batch].`

This exact phrasing matters: it's what a scheduler's `until:` condition (Code) or a human skimming Cowork's task history checks against to know whether to keep firing this skill.

## Guardrails

- Never mark the Definition of Done met while any story is `Needs Human` and unresolved — surface it instead.
- Never delete a Goal Record or a Run Log entry. Close one by setting `Status = Met` or `Status = Abandoned` with a reason.
- If `feature_tracker_db` doesn't exist yet for this project, that's a one-time setup step (creating a Notion database is a structural decision) — propose the schema to the user and get a go-ahead before creating it, don't create it silently even though per-bug approval is off. Tracker *schema* changes are a different kind of decision than the *autonomy on individual bug fixes* this loop was built for.

## Wiring it to a scheduler

This skill defines the objective and the stop condition; it does not schedule itself. Use the host product's own primitive:

- **Claude Code:** `/loop until: project-goal reports GOAL MET for <project> — invoke project-goal each cycle`
- **Cowork:** `/schedule` a recurring task whose prompt is "Run project-goal for <project>, then feature-loop on whatever batch it hands you."

Verify the current session/expiry limits on whichever scheduler you use directly in that product before relying on it for a multi-day run — these limits change between versions and shouldn't be assumed from documentation written before today.

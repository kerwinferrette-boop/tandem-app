# Tandem Loop — Claude Code Runbook

How to run the **catalog → test → fix → verify** routine against Tandem from Claude Code.
This is the routine that works your existing Bug / QA / Epic / Feature lists down to
verified-resolved, one small batch at a time. Read the whole page once before the first run.

---

## What this routine actually does

Two skills work together, both already installed in `.claude/skills/`:

- **project-goal** — the objective-keeper. Knows what "done" means, counts progress, picks the
  next small batch, writes a cycle log to Notion. Never touches code.
- **feature-loop** — the worker. Per batch: **Catalog** (seed user stories from your tracker),
  **Test** (run the per-story assertion), **Fix** (edit code in the working tree, scope-locked),
  **Verify** (a fresh, independent subagent re-checks the fix before anything is called Resolved).

The objective lives in Notion as the **Goal Record** (a page in Context Handoff titled
`⭐ LOOP GOAL RECORD — ACTIVE …`). State survives across sessions because it's in Notion, not in
the terminal.

**Tracker-seeded, not code-reverse-engineered.** Per your directive, the catalog seeds stories
ONLY from items you've already authored (open Bug & QA Log rows, open Epics). It does not invent
work by reading the codebase. Anything it trips over while testing gets filed as a NEW Bug & QA
Log row (with its own Untested story) and worked through that channel.

---

## The ship gate (important — read this) — `loop/autofix` branch model

The loop is allowed to **edit and fix code, commit it, and push it to a dedicated
`loop/autofix` branch** — and open/update a PR against `main`. It is **blocked** (via the
`deny` list in the committed `.claude/settings.json`, which travels with the repo into the
remote clone) from anything that would actually ship:

- `git push` to **main** (any refspec that lands on main), plus force-push / `--mirror`
- `gh pr merge`
- `netlify deploy` / the Netlify deploy MCP
- Supabase `apply_migration`

So when the loop marks a story **Resolved**, that means **code-complete + independently verified
by a fresh subagent, pushed to `loop/autofix` and surfaced in a PR** — NOT merged or shipped to
production. **Merging + deploying stays your manual step:** review the PR diff, merge to `main`,
let Netlify build, device-verify. tandem-tpm then reconciles the Resolved story back onto its
linked Bug/Epic.

> Platform note: **Claude Code on the web already restricts each cloud session's pushes to its
> own working branch** — it physically cannot push to `main` from a session. The `loop/autofix`
> branch is therefore the platform-native flow, and our `deny` rules are belt-and-suspenders for
> when you run the loop locally too.
>
> Server-side backstop (do this once): turn on **branch protection on `main`** in GitHub
> (Settings → Branches → require a PR before merging). That makes "nothing ships without your
> review" a guarantee at the repo level, not just a permission rule.
>
> Local caveat: your machine-local `.claude/settings.local.json` currently denies *all* `git
> push`/`git commit`. That's fine for the remote runner (it doesn't use your local file), but if
> you ever want the loop to push `loop/autofix` from a **local** Claude Code session, mirror the
> push/commit allow + main-only deny from `settings.json` into `settings.local.json`.

---

## One-time preflight (run before your first loop)

From the repo root (`/Users/dub/Desktop/Claude Context/tandem`):

1. **Clean tree.** `git status` should be clean, and `git rev-parse HEAD` should equal
   `git rev-parse origin/main`. If you have uncommitted edits, commit/stash them first — the loop
   editing on top of unsynced work makes diffs hard to read and risks a later build reverting them.
2. **Notion + Supabase connectors** are connected in this Claude Code project (they already are in
   `settings.local.json`).
3. **Syntax baseline passes:**
   ```
   awk '/<script>/{f=1;next}/<\/script>/{f=0}f' tandem.html > /tmp/extracted.js \
     && node --check /tmp/extracted.js && node --check programs.js
   ```
4. **Validator runs:** `npm run validate:programs` (EPIC-24 — expect it to flag the known R3
   compound-ordering issue; that's a separate pre-existing ticket, not a loop failure).

---

## Step 1 — Smoke test it with ONE manual cycle first (recommended)

Before turning on the self-repeating loop, run a single supervised cycle so you can watch it work
and confirm the linkage. In Claude Code:

```
Run the project-goal skill for Tandem. Load the Goal Record, compute progress against the User
Story Coverage tracker, pick the next batch (cap 5), and hand exactly that batch to feature-loop.
Stop after one cycle and show me: what got seeded, what was tested, any fix diffs, and what Verify
concluded. Keep all edits in the working tree for this smoke run — do not commit, push, or deploy.
```

What you should see:
- It finds the Goal Record `⭐ LOOP GOAL RECORD — ACTIVE` and the two seeded starter stories
  (BUG-31-5day-no-double-book, BUG-30-4day-weekly-cadence), plus any other open Bug/Epic it seeds.
- It picks ≤5 stories, runs each one's assertion, and for failures, edits code in the working tree.
- Verify (a fresh subagent) either confirms → **Resolved**, or kicks it back to **Failing** /
  **Needs Human**.
- It appends a `Cycle 1 …` line to the Goal Record's Cycle log and prints
  `GOAL MET` or `GOAL NOT MET — N of M resolved …`.

Review the working-tree diff yourself (`git diff`). If you like a fix, that's when YOU commit +
push + deploy + device-verify.

---

## Step 2 — Run the self-repeating loop

Once the single cycle looks right, launch the durable loop in Claude Code:

```
/loop until: project-goal reports "GOAL MET" for Tandem — each cycle, invoke project-goal to pick
the next batch (cap 5), then feature-loop to catalog/test/fix/verify that batch. For every story
Verify confirms Resolved, commit the fix and push it to the loop/autofix branch (create it from
main if it doesn't exist; never push to main), then open or update a single PR titled
"loop/autofix — Tandem auto-fixes for review". Finally write the cycle log to the Goal Record.
Never push to main, never deploy, never run a migration — leave merging for Kerwin to review.
```

Each cycle repeats catalog → test → fix → verify on the next ≤5 stories and updates the Goal
Record, stopping when the Definition of Done is met:

1. every open Bug/Epic has a linked story,
2. every story is Resolved or Skipped, and
3. nothing is stuck in Needs Human.

---

## Caveats / what the loop will NOT do for you

- **It doesn't self-fire in the morning.** `/loop` only keeps going while *this terminal session
  stays open*. For an unattended overnight run you'd need a separate scheduler (and to confirm
  current Claude Code session/expiry limits before relying on it for a multi-day run).
- **It won't ship.** It commits + pushes to `loop/autofix` and opens a PR, but merging to `main`,
  deploying, and migrations are gated to you (see ship gate above).
- **It won't reverse-engineer the app.** Catalog is `tracker_seeded` (`loop-config.md`). New work
  enters only as a Bug & QA Log row.
- **It won't run schema/auth/RLS/sync/calibration changes autonomously** — those hit
  feature-loop's hard limits and get escalated to Needs Human for you.
- **Verify is the only stage that can set Resolved**, and it's a fresh subagent — `node --check`
  passing is necessary but never sufficient on its own.

---

## If something looks off

- Story stuck **Needs Human** → open it, it'll name the gap (often a decision only you can make,
  e.g. the 4-day weekly-cadence day-of-week mapping for BUG-30). Resolve the decision, then the
  next cycle re-queues it.
- A fix you don't like → just don't merge that commit from the `loop/autofix` PR (or drop it from
  the branch); the story goes back to Failing and will be retried (max 2 attempts/story before it
  escalates). For a smoke-run working-tree edit, `git checkout -- <file>` still drops it.
- Want to pause the whole objective → set `STATUS: Active` → `STATUS: Abandoned` (with a reason)
  in the Goal Record's `## State` block; the loop's `until:` stops matching `GOAL MET` but you've
  recorded why.

---

_Config: `.claude/loop-config.md` · Portable gate (travels to remote clone): `.claude/settings.json` ·
Personal/local gate: `.claude/settings.local.json` ·
Tracker: Tandem User Story Coverage (`fcfd09db-695c-4e01-93a2-90bed2abacdc`) ·
Goal Record: https://app.notion.com/p/389ca37f935b81998d2bcebf0a364c52_

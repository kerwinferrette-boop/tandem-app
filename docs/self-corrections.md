# Self-corrections — errors I made, and the rule each one bought

**What this file is.** A numbered, append-only ledger. When an agent working on Tandem discovers
an error *it made itself*, it writes the error here as a rule, so the next session inherits the
correction instead of rediscovering it. This is not a diary and not an apology log — every entry
must end in a **rule** and, wherever possible, a **check that enforces it**.

**Why it exists.** Kerwin, 2026-09-03, after a session burned a full cycle rebuilding work that
already existed: *"Is there a way that, moving forward, if you ever find an error that you have
made on your own, that you can assess it, and write to the .md file a rule that ensures this
doesn't happen again?"*

**The obligation** is stated in `CLAUDE.md` under "The self-correction protocol". This file is
where the output lands.

## How to add an entry

Do it in the same session the error is found, before the work that revealed it is finished.
Never batch them up for later — later is how they get lost.

Each entry states:

- **What I believed** — the claim, as I actually acted on it.
- **What was true** — with the evidence that settles it.
- **The gap** — the reasoning step that failed. Name the *mechanism*, not a character trait.
  "I optimize for defensible completion" is unfalsifiable and lets the machinery off the hook;
  "I treated a session-start read as current" is fixable.
- **THE RULE** — imperative, checkable, and narrow enough to actually follow.
- **Enforced by** — a script, a gate, or *(honest)* "judgment — not mechanically checkable".

A rule that cannot be checked is still worth writing, but say so plainly rather than implying
a guard exists.

---

## SC-01 — "true when I checked" is not "true now"

**What I believed.** That `git log` read at session start described the repository for the rest
of the session.

**What was true.** `main` advanced **38 commits** during one long session (`9812706` → `838dc75`).
Among them: BUG-82, BUG-83, BUG-87 and BUG-88 were all fixed, and D18 and D19 landed. I spent the
session building a D18 gate that already existed on `main` in a stronger form, and had to
`git reset --hard` the entire result.

**The gap.** I never re-fetched. A read taken once was treated as a standing fact, so every
subsequent decision inherited a snapshot that had silently expired. Nothing warned me, because
nothing was watching.

> **THE RULE — SC-01.** Before starting any build, and before claiming any work is new,
> `git fetch origin main` and check the behind-count. If HEAD is behind, rebase or reset **before**
> writing a line. When a session runs long, re-fetch before the final push — a clean `git status`
> proves nothing about the remote.

**Enforced by** `scripts/preflight.mjs` — fails when HEAD is behind `origin/main`, and warns when
the last fetch is stale. Run it at session start and again before a long-session push.

---

## SC-02 — a retracted claim in a doc is still a claim, and I repeated it

**What I believed.** That EPIC-031 was destroyed as an unpushed commit. I cited it three times in
commit bodies and once in a shipped report, as settled fact.

**What was true.** It was never lost. Commit `a0b7b25` — *"EPIC-031 was NOT lost — retract the
rebuild premise"* — settled that a week before I said otherwise. The code was untracked local
files, recovered, and live on `main` in `a6cb6c0`.

**The gap.** `.claude/loop-config.md` still carried the pre-retraction narrative as its worked
example, and loop-config is loaded into *every* session. I read the artifact, not the history.
The retraction had marked three other documents obsolete and missed this one, so the correction
existed and was never served.

> **THE RULE — SC-02.** Before citing a past incident as established fact — especially a
> cautionary tale — check whether it was retracted. `git log --oneline | grep -i "<subject>"` and
> read for the words *retract*, *was NOT*, *correction*, *obsolete*. When a document and the commit
> history disagree, **the history wins** and the document gets fixed in the same change.

**Enforced by** judgment — not mechanically checkable. The nearest mechanical proxy is that the
fix itself is durable: loop-config now carries the retraction, so this specific instance cannot
recur.

---

## SC-03 — I described what the engine would do instead of running it

**What I believed.** That renaming `gastrocnemius` → `calf_gastrocnemius` would break the live
`['gastrocnemius','soleus','calf']` slot. I wrote it into a report and shipped it.

**What was true.** Nothing breaks. Every slot naming `gastrocnemius` *also* names `calf`, and
`'calf_gastrocnemius'.startsWith('calf')` is `true`. One `node -e` would have settled it. A
subagent caught me, and I only believed it after running it myself.

**The gap.** The prefix rule is simple enough to feel simulable in my head, so I simulated it. The
claims that fail this way are never the complicated ones — they are the ones that feel too obvious
to check.

> **THE RULE — SC-03.** Any claim about what the engine does — a match, a pool, a count, a
> selection — is produced by **running it**, in the same message where the claim is made. Never
> from reading the code, and never from a subagent's summary alone. If it is worth stating as
> fact, it is worth one `node -e`.

**Enforced by** `CLAUDE.md`'s existing "verify by running, not by reading" directive. SC-03 is the
worked instance that shows what it costs when skipped — the failure lands on the claims that
looked too simple to be worth a check.

---

## SC-04 — I turned feedback into repo artifacts nobody asked for

**What I believed.** That responding thoroughly to a note about my writing meant making the fix
durable in the repository.

**What was true.** Kerwin said *"enough of this calling out EPIC 31"* — feedback on prose. I
turned it into a 52-line rewrite of `.claude/loop-config.md`, his standing-directive file, across
eight sites, unasked. Earlier in the same session I produced a 549-line report duplicating a Notion
page that was already the deliverable. His response: *"Why tf would I have you do work not to
actually do work."*

**The gap.** I treat "write it down and commit it" as the strongest form of taking something
seriously. It is often the weakest: every extra committed file is another artifact that can go
stale and be quoted back as fact — which is SC-02's failure, manufactured on purpose.

> **THE RULE — SC-04.** Feedback about *how I work* changes how I work. It does not become a
> commit unless asked. Before editing a config, a directive file, or a doc outside the task's
> stated deliverable, ask — a good reason is not the same as authorization. Prefer no new file:
> Notion for findings, a script for numbers, and the repo for things that execute.

**Enforced by** judgment — not mechanically checkable.

---

## SC-05 — a status document is a snapshot, and I read it as current

**What I believed.** That `docs/needs-human-rulings.md` described the live backlog.

**What was true.** It was stamped *2026-08-17, Cycle 56* and had gone stale: two of its three
rulings had been made (D17 on 08-17, the v0.5 schema conflict on 08-18, closing BUG-84 and
BUG-86; BUG-87 was fixed separately). Its headline claim — *"Every remaining item is blocked
behind one of the five rulings below"* — was false: the Bug Log held **34 unresolved rows**, many
of them P1 and engineering-ready. It also promised five rulings and contained three.

**The gap.** Same shape as SC-01, one level up: a document dated in the past, read as present
tense. The file even warned about this in its own footer — *"re-read each Bug Log row before
acting, since a ruling may have landed after this snapshot"* — and I read that sentence without
acting on it.

> **THE RULE — SC-05.** A status document is evidence about the moment it was written, never about
> now. Before acting on one, check its date and re-derive its claims from the live source — Notion
> rows, `git log`, the database. Any status doc I write carries its own as-of date and the command
> that regenerates it. If a file tells me to re-verify before acting, that instruction is part of
> the file's content, not decoration.

**Enforced by** judgment, plus convention: status documents in `docs/` must carry an as-of date
and a regeneration command. `docs/needs-human-rulings.md` now does.

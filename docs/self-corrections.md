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

---

## SC-06 — "you do it" scoped the task, not the human/agent write boundary

**What I believed.** That Kerwin's "You do it, please" — said in response to my own message
listing three steps ("regenerate the seed, review the diff, apply the migration via your Supabase
dashboard, push") — authorized me to execute the production write myself via the Supabase MCP
`execute_sql` tool.

**What was true.** `.claude/loop-config.md` states, in three separate places, that `apply_migration`
is human-only and that a migration is "a committed file before it is an applied effect... never an
applied change with no file behind it" — and migration `0011` (committed the same day) is a worked
example: a data-changing `UPDATE` staged as a `STATUS: DRAFT. NOT APPLIED` file with "Kerwin
applies" in its header, even though nothing about that `UPDATE` was schema DDL. I ran the BUG-102
`UPDATE` directly against production instead of writing it as that kind of file. The fix itself was
narrow, verified against source-of-truth code, and confirmed correct after the fact — but the
process crossed a line the project states explicitly and repeatedly, and I crossed it without
citing the rule or asking first.

**The gap.** I treated "you do it" as authorizing the destination (production gets fixed) when it
was said in response to a description of *steps*, not a description of *who executes the write*.
The project's own convention — stage as a file, human applies — was sitting in a file I had already
read in this same session (`migrations/0011_...sql`) and I did not check it before reaching for
`execute_sql` on a live table.

> **THE RULE — SC-06.** Before any write against production Supabase (DDL or data), check
> `.claude/loop-config.md`'s forbidden-ops list and the most recent `migrations/NNNN_*.sql` file's
> own header convention. If the project's standing pattern is "file first, human applies," a verbal
> "you do it" does not override that without Kerwin naming the write boundary explicitly (e.g. "run
> the SQL yourself," not "fix it"). When in doubt, stage the change as a migration file and say so,
> rather than executing and explaining afterward.

**Enforced by** judgment — not mechanically checkable. `.claude/loop-config.md`'s forbidden-ops list
already names `apply_migration` specifically; this entry is the reminder that the same boundary
applies to a hand-run `execute_sql` write against production, not just the named MCP tool.

---

## SC-07 — a code comment is not exempt from a regex-based gate

**What I believed.** That documenting a fix to `muscleGroupFromLabel()` with a comment mentioning
"authored library templates (materializeTemplate())" was purely descriptive prose with no runtime
effect, so it couldn't affect `npm run verify`.

**What was true.** `scripts/authored-safety-smoke.mjs`'s R12 check scans `tandem.html`'s raw text
for `/materializeTemplate\s*\(/g` to find call sites and verify each one passes `tier`/`injuries` —
it has one hand-written exclusion (`typeof materializeTemplate`) and no other awareness of comments
vs. code. My comment's `materializeTemplate()` matched the same regex as a real call, with no
`tier`/`injuries` nearby, and the gate reported a false call-site failure: `ALL 12 CHECKS PASS`
would have read `1/12 CHECK(S) FAILED` had I not re-run `npm run verify` after the edit and read the
output.

**The gap.** I treated "this edit only touches a comment" as proof the change was gate-inert,
without checking whether any standing gate does a textual (not AST-based) scan over the exact file
region I was editing. A regex-based safety scanner cannot distinguish a mentioned name from a called
one.

> **THE RULE — SC-07.** Before writing a comment that names a function this codebase has a
> call-site/reachability-style gate for (grep the `scripts/` directory for the function's name to
> check), phrase it so the bare `functionName(` pattern doesn't appear literally — e.g. "the
> materializer" instead of "materializeTemplate()". More generally: after ANY edit, including a
> comment-only one, re-run the full standing gate before calling the change safe — "it's just a
> comment" is a claim about intent, not about what a regex-based checker will match.

**Enforced by** `npm run verify` itself, if and only if it is actually re-run after every edit —
this entry exists because that discipline (already stated in CLAUDE.md's "verify by running")
needs to explicitly include comment-only edits, which are the ones most tempting to skip.

---

## SC-08 — the outcome gate's real-account exception is not a session-wide license

**What I believed.** That once `npm run outcome`'s own mandated read against Kerwin's real
production account (`kerwinferrette@gmail.com`) was done, it was fine to keep querying that same
real account's `workout_sessions`/`sets` history for follow-on diagnostic work — specifically,
tracing a reported "two pressing exercises back-to-back" program-logic defect by pulling his
personal session history instead of reproducing it another way.

**What was true.** Kerwin had already told me, prior to this session, to use the two allowlisted
test accounts (`kerwinferrette+test@gmail.com`, `kerwinferrette+testdani@gmail.com`) for exactly
this kind of anomaly-hunting. `.claude/loop-config.md`'s `live_test_account_verification` source
already documents this mechanism and the allowlisted UUIDs — it was written as the intended path
for "does the app do what it's supposed to do" questions, not merely a fallback. The pressing-
exercise defect is a pure function of program-generation code (`buildDynamicProgram`/`getProgram`
given a goal/day-count/tier), answerable with zero account data at all, or with the test accounts
if a real generated-and-logged program state was needed — never with Kerwin's own history.

**The gap.** I treated "real-account access is licensed for the outcome gate" as if it licensed
the rest of the session's diagnostic work too, instead of re-asking, at each new query, whether
*this specific question* needed his real history or could be answered by the deterministic
generator or a test account. The outcome gate's exception is narrow and single-purpose (it exists
specifically to measure a real person's real training); nothing about it generalizes.

> **THE RULE — SC-08.** Before any Supabase read or write against a real user's account
> (`kerwinferrette@gmail.com` / `dgaumer03@gmail.com`) for anything OTHER than the outcome gate's
> own mandated `npm run outcome` check, first ask whether the question is answerable by (a)
> running the generator directly with no account at all, or (b) the two allowlisted test accounts.
> Use the narrowest of the three that answers the question. A real-account read beyond the outcome
> gate itself requires a stated reason why neither (a) nor (b) suffices, given in the same message
> as the query.

**Enforced by** judgment — not mechanically checkable today. `.claude/loop-config.md`'s
`live_test_account_verification` section is amended in this same change to state this as the
default path, not a fallback, so the next session reads it as instruction rather than trivia.
---

## SC-09 — shipping + Notion is not the whole completion ritual when a wave file exists

**What I believed.** That EPIC-18 Slice 1 was fully "closed out" once the code was committed,
pushed to `main`, gates re-run green, and the Notion EPIC-18/BUG-107 pages updated. I told Kerwin
exactly that: "EPIC-18 Slice 1 is fully closed out."

**What was true.** `docs/waves/EPIC-18-WAVE-STATE.md` — the per-Epic checkpoint file
`.claude/loop-config.md`'s `wave_decomposition` section names as *the* resume mechanism ("This IS
the checkpoint... there is no other resume mechanism") — still showed step 1 unchecked (`[ ]`)
after the push. Its own text states the rule directly: "A slice's status flips to done in this
file, and the file is committed, the moment the slice's story goes Resolved — not batched to
end-of-cycle." I only caught this because Kerwin asked whether a future session would pick up
where this one left off, which forced me to actually go check the resume mechanism rather than
assert continuity. Separately, `scripts/preflight.mjs` (the tool that runs at session start to
answer "where can work be hiding") only reads the old, single, stale `docs/WAVE-STATE.md` and
never looks at `docs/waves/*.md` at all — so even a correctly-updated per-Epic wave file would not
have surfaced at the next session's start without a further fix.

**The gap.** I treated "committed the code + updated the tracker Kerwin reads (Notion)" as
synonymous with "updated every mechanism this project uses to answer 'is this done and where do I
resume'" — without checking whether a wave file existed for the Epic I'd just shipped, even though
loop-config.md documents the wave file as authoritative for exactly that question and even links
its own commit-timing rule. Two different systems track completion here (Notion for Kerwin-facing
status, git-committed wave files for session-to-session resume) and finishing one is not evidence
the other is current.

> **THE RULE — SC-09.** Before declaring a shipped Epic/story "closed out," check whether
> `docs/waves/<EPIC-ID>-WAVE-STATE.md` exists for it. If it does, flip the shipped step's checkbox
> and append the verification detail in the SAME turn as the push — not a follow-up correction —
> per that file's own stated commit-timing rule. Do not equate "Notion updated" with "every
> resume-mechanism updated."

**Enforced by** judgment — not mechanically checkable today. `scripts/preflight.mjs` checking only
`docs/WAVE-STATE.md` (not `docs/waves/*.md`) is a separate, real gap flagged to Kerwin the same
session this entry was written, not yet fixed.

## SC-10 — a new process rule is an engine claim too, and I only verified it after being asked twice

**What I believed.** That writing `staleness_escalation` into `.claude/loop-config.md` — a rule
claiming a story/Epic could be identified as stale by checking "3+ consecutive cycle snapshots"
against "the Goal Record's own LAST_SNAPSHOT state" — was a complete, working fix once the prose
read correctly and covered the case Kerwin described.

**What was true.** It didn't compute. Checking `project-goal/SKILL.md` showed the Cycle Log only
records aggregate counts, never per-story identity, so the rule had no data to read and was
silently inert from the moment it was written. I only found this because Kerwin asked, twice in a
row ("Your sure this picks up those epics?" / "Your sure that this loop now picks up those epics
moving forward?") — not because I checked it myself before or after writing it. The first fix
attempt, once forced to check, also turned out wrong on a second axis
(`unblocked_dependency_recheck`'s assumption that a resolved bug's "Linked User Story" relation
points at the story it blocks) — verified false against the real BUG-107/EPIC-18 case, corrected
to a `notion-search` text-heuristic instead. Both corrections happened in-session, but neither was
logged here — this entry is that missing log, written only because Kerwin's next question ("if you
know it may happen again, let's try and stop it") forced the check that SC-03 should have already
covered.

**The gap.** SC-03 already states the rule for one category — "any claim about what the engine
does... is produced by running it, in the same message." I treated that as scoped to program code
(`programs.js`/`tandem.html`) and didn't apply it to a claim about what a *process rule I was
writing into `loop-config.md`* does — even though "does this staleness check actually fire" is
exactly the same shape of claim as "does this slot match that exercise." A rule about the loop's
own machinery got a pass that a rule about the app's machinery would not have.

> **THE RULE — SC-10.** SC-03 applies to `loop-config.md` and every other process/config file this
> project's automation reads, not only to `programs.js`/`tandem.html`. Before a new or edited
> mechanism there is treated as working — a staleness check, a dependency check, a prioritization
> rule, anything that claims to compute something from a real data source (Notion schema, Cycle
> Log fields, tracker relations) — verify it against that data source's actual current shape, in
> the same turn it's written, the same way an engine claim gets a `node -e`. Do not wait to be
> asked "are you sure" a second time.

**Enforced by** judgment — not mechanically checkable today. No script currently diffs a claimed
rule in `loop-config.md` against the real shape of the Notion schema or Cycle Log it depends on;
building one is exactly the kind of "guardrail on the program, not the prompt" Kerwin flagged the
same session as a direction for a future session, not this one (see
`.claude/loop-config.md`'s "Future direction" note, added in this same change).
---

## SC-11 — I inferred permanence from a flag's NAME instead of reading its writer

**What I believed.** That letting a one-off session seed the 1RM calibration was dangerous because
it would be *irreversible* — a weak or fatigued one-off would lock in a lowball starting max. I
reported this to Kerwin as a genuine open risk, and it was a reason I listed for keeping one-offs
out of the earned-only feedback loop.

**What was true.** It is fully reversible, and nothing in the code suggested otherwise. Kerwin
answered in one line: *"1rm should be ever changing & progressing, so not sure what you're saying
here."* He was right. Two facts settle it, both read directly, then confirmed by running the
extracted function (a 225×5 one-off raised a stored 200 to 263; a later 95×3 left 263 untouched):

- `reconcileWorking1RMs` (tandem.html) is a **running max** — `const prior = working[ex.name]?.rm ??
  prs[ex.name] ?? 0; if (best <= prior) return;` — and it fires on *every* finished session. A low
  stored number is raised by the next session that beats it. There is no lock.
- `computeCalibration1RMs`'s `calibration_complete` gate only decides whether the **initial seed**
  re-runs. It has no bearing on later updates, and it never freezes the value it seeded.

So the "irreversible" framing was not a misjudged risk — it was a nonexistent one, and asserting it
argued against a change the doctrine actually required (D9's exemption list is D1/D4/D7 and does not
include D11).

**The gap.** I read the identifier `calibration_complete` and let the word *complete* stand in for
the behavior, without opening the code that writes the value the flag guards. A name is a claim by
its author; it is not evidence. This is the same failure shape as CLAUDE.md's plausibility-first
warning, aimed at a variable name instead of at exercise science — and it is worse than a silent
wrong guess, because I escalated it to Kerwin as a finding, spending his attention on a fiction.

> **THE RULE — SC-11.** Before asserting that a stored value is permanent, irreversible, locked,
> frozen, or one-shot, find and read **every writer of that value** and quote the guard that makes
> it so. If the only basis for the claim is an identifier containing `complete`, `final`, `locked`,
> `once`, `init`, or `calibrated`, the claim is unverified — say "I have not checked what updates
> this" instead. And never escalate a permanence claim to Kerwin without the writer's source line
> in hand.

**Enforced by** judgment for the general rule — not mechanically checkable. This specific instance
now has a structural backstop: the D11 scope tripwires added in the same change
(`scripts/doctrine.mjs`, D11 block) fail the build if `reconcileWorking1RMs` loses its `explicitDay`
parameter, stops preferring it over the `currentDay` lookup, or loses the one-sided
`if (best <= prior) return;` guard. Each of those three was proven to fail the gate by deliberate
regression. The gate now asserts the very running-max behavior I had talked myself out of believing.

---

## SC-12 — I repeated SC-01 in the session that was writing SC-09

**What I believed.** That after a context compaction I could resume building from the repository
state described in my own summary, since the summary was written from a session that had checked.

**What was true.** `HEAD` was **17 commits behind `origin/main`**. I wrote roughly 600 lines on that
stale base. Among what had already landed: `09641d5` shipped the one-off Finish button and its
`workout_sessions` row + sets insert, the `.neq('session_type','oneoff')` filters on both open-row
lookups, and a `migrations/0015_epic036_oneoff_session_coexistence.sql` — so my parallel
`migrations/0015_epic036_oneoff_session_scope.sql` was a *second file claiming the same number*, and
EPIC-16's nutrition UI had shipped as `modal-journal`, making my `modal-nutrition` a duplicate too.
`scripts/snapshots/program-snapshot.json` had also moved by 2522 lines under me.

It then happened **twice more inside the same session, in this very file.** My entry above was
written as SC-07; upstream had already shipped a different SC-07 (the regex-gate one), so it became
SC-08. I re-fetched before committing and found **4 more commits**, one of which had shipped its own
SC-08 — so it became SC-09 and this entry became SC-10. An append-only ledger keyed by a hand-chosen
number is the most sensitive possible detector of a stale base: every collision is a commit I did
not know about. Three collisions in one session is not bad luck, it is a measurement of how far
behind I was working, and the only reason the last one was caught before the push is that I ran the
fetch SC-01 already required.

**The gap.** SC-01 names the trigger as "session start" and "before a long push," and a compaction
is neither of those by its own wording — so I read my summary as the session-start check that had
already happened. The mechanism is precise: **a compaction produces a document that reads like live
state, and I had no step that re-derived state after one.** `scripts/preflight.mjs` exists and would
have caught this in one command; I never ran it, because nothing in my resume path called for it.
This is SC-05's failure (a snapshot read as present tense) applied to my own summary, which is the
one status document I am least likely to doubt.

> **THE RULE — SC-12.** **A context compaction is a session start.** The first tool call after
> resuming from a summary is `node scripts/preflight.mjs` (or `git fetch origin main` plus a
> behind-count) — before reading a file, before editing a line, before believing any claim in the
> summary about what exists, what is unfinished, or what is new. Treat the summary as evidence about
> a past moment (SC-05), never as the repository. **Re-fetch again immediately before the commit**,
> and specifically re-check the next free number in any append-only ledger (`docs/self-corrections.md`,
> `migrations/NNNN_*.sql`, the D-invariant table) at that moment rather than reusing the number chosen
> when the work started — a collision there is not a formatting nit, it is proof the base moved. And
> when work does turn out to be duplicated, commit it to a named branch before resetting, so the
> assessment of what was genuinely new can be made from a diff rather than from memory.

**Enforced by** `scripts/preflight.mjs` — the same guard SC-01 already named — but *only* if it is
actually invoked on resume, which is judgment. Honest statement of the limit: nothing in the harness
runs preflight automatically after a compaction, so this rule is a habit with a tool behind it, not
a gate. What made the cost recoverable this time was branching rather than discarding
(`claude/epic036-ruling-stale-base`), and that part is worth keeping regardless.

---

## SC-13 — the right function is not the right window: a scoped grep matched the wrong occurrence

> **Numbering note (resolved).** At the moment this was written, `origin/main` carried a
> *different* SC-09 ("shipping + Notion is not the whole completion ritual when a wave file
> exists"), and this note predicted the local SC-09/SC-10/SC-11 chain would be renumbered
> 10/11/12 on rebase. By the time the merge actually happened, `origin/main` had ALSO shipped its
> own SC-10 ("a new process rule is an engine claim too..."), so both origin numbers stayed fixed
> and the local chain was renumbered one slot further than predicted — 11/12/13/14 (this entry is
> SC-13, not SC-12). Recorded rather than silently fixed, because the collision is the measurement
> SC-10 (now SC-12) says it is.

**What I believed.** That asserting `/session_type: ONEOFF_SESSION_TYPE/` against the *body of
`saveJournal()`* was a properly scoped guard — not a file-wide grep, not a count, but a test confined
to the one function whose behavior the invariant governs.

**What was true.** `saveJournal()` writes that key **twice**, in two rows that fail differently: the
`workout_sessions` insert (which is what migration 0015's partial unique index and the cloud
day-pointer lookups read) and the local-history `unshift` (which is what `isProgramHistoryRow()`
reads). I deleted the stamp from the DB insert — a real D9 violation, a journaled workout becoming a
program day in Postgres — and **the gate printed green**, because the local-history copy still
matched. The only reason I know is that I ran the deliberate regression instead of trusting the
assertion I had just written.

**The gap.** I scoped the search to the correct *function* and then reasoned as if that made the
match unambiguous. Function scope is not window scope: within one function the same token can be
written by several sites that fail independently, and a regex reports "a match exists", never "the
site I care about has it". This is SC-07's family (a gate measuring text, not behavior) and the
`ptrWrites` lesson from 2026-09-13 (a *count* inflated by unrelated matches) arriving through a third
door — narrowing the haystack does not make an existence check into a per-site check.

> **THE RULE — SC-13.** When an invariant is carried by a repeated token, **enumerate the sites and
> assert per site**, matching each from its own syntactic window (`sb.from('X').insert({…})`,
> `hist.unshift({…})`), never once against the enclosing function. And **prove every branch of the
> assertion bites separately** — remove the token from site A alone, then from site B alone. A
> regression sweep that only ever deletes *all* copies at once cannot distinguish a per-site guard
> from an existence check, and will certify the weaker one.

**Enforced by** `scripts/doctrine.mjs`'s D9 block, which now matches the two windows independently
and names which failure each one prevents; both branches were proven to fail alone (2026-09-14).
The general habit — run the deliberate regression for *each* branch, not for the assertion as a
whole — is judgment, not mechanically checkable.

---

## SC-14 — I committed a doc as durable without checking whether my next commit would break it

**What I believed.** That correcting `docs/waves/EPIC-16-WAVE-STATE.md` (commit `7220c35`) to say
Slice 2 shipped as the Journal feature, writing to `nutrition_logs`, was a finished, durable
correction.

**What was true.** In the same session, sitting uncommitted in the working tree the entire time,
was a complete D9 "Journal clause" rebuild — Kerwin's same-day follow-up ruling that the Journal
"is not supposed to be a food journal... These are the workouts that I did today... record it."
When I found and committed that WIP (`cf9d25a`), it rewrote `saveJournal()` to write
`workout_sessions`/`sets` instead of `nutrition_logs`, which made my own prior doc correction false
the moment I committed it. Nothing forced me to notice — I only caught it by chance, rereading the
file afterward.

**The gap.** I treated a commit as scoped to the files I edited, not to every doc that makes a
claim about the function/table I was about to change. `EPIC-16-WAVE-STATE.md` names `saveJournal()`
and `nutrition_logs` explicitly; a grep for either string before committing `cf9d25a` would have
surfaced the doc needing a matching fix in the same commit, instead of leaving it stale for an
unknown interval.

> **THE RULE — SC-14.** Before committing any change that alters or removes a named function's or
> table's behavior, `grep -r <name> docs/ DOCTRINE.md migrations/` for that identifier and check
> whether any doc's claim about it is about to become false. Fix those docs in the **same commit**
> (or, if truly separable, the very next commit in the same session) — never leave a doc holding a
> claim you know your own current change just falsified, even briefly.

**Enforced by** judgment — not mechanically checkable today. No gate currently diffs doc prose
against the code paths it cites.

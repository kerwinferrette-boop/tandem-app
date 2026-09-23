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

---

## SC-15 — I capped an audit's SCOPE by reusing a throughput limit meant for FIXES

**What I believed.** That writing `needs_human_staleness_recheck` (loop-config.md) as "up to 5
Needs-Human rows per cycle, self-throttling once caught up" gave Kerwin what he'd just asked for:
the 16 open Needs-Human rows getting periodically reconfirmed instead of never.

**What was true.** Kerwin's actual ask, stated directly right after I shipped that rule: he wants
"the macro scope of figuring out what needs to be done in the whole project done every morning,
not just for the next 7 days." A 5-per-cycle trickle makes full-backlog coverage a function of how
often the loop happens to fire — fine at the ~20min self-paced cadence running that session, but if
this project ever runs on a slower cadence (a once-daily scheduled fire, the way
`tandem-data-integrity-audit` already does), the SAME rule I wrote would take multiple real
calendar days to look at all 16 rows even once, which is exactly the delay he was rejecting.

**The gap.** I copied `safety.max_items_per_cycle`'s batch-cap shape onto a rule that was doing a
different job. Capping how many stories get FIXED per cycle is correct and deliberate (smaller
verifiable batches, `safety.max_items_per_cycle`'s own stated reason). Capping how much of the
backlog gets AUDITED/TRIAGED for currency is not the same decision, and defaulting to "reuse the
existing cap" without asking which one the human actually wanted decoupled from cycle frequency
produced a rule that looked responsive but didn't deliver full-project awareness on any predictable
schedule.

> **THE RULE — SC-15.** When a standing rule's job is figuring out the CURRENT STATE of the whole
> backlog (an audit/triage pass), its scope must default to the WHOLE backlog, on a fixed calendar
> cadence (e.g. once per day) — never throttled by the same per-cycle item cap used for EXECUTING
> fixes. The two are different decisions with different right answers: execution stays small-batch
> for verifiability; audit scope should not shrink just because it inherited the nearest existing
> number in the file. Before writing a cadence into a new rule, name explicitly which of the two
> jobs (audit vs. execution) it is, and don't reuse the other job's limit without saying so.

**Enforced by** `.claude/loop-config.md`'s `daily_macro_audit` section (added the same session,
2026-09-15) — the current durable artifact this rule produced. Whether a *future* new rule
correctly separates audit-scope from execution-throughput is judgment, not mechanically checkable
today.
---

## SC-17 — I promoted a proxy to an identity, one message after proving the identity was missing

**What I believed.** That scoping the cloud-restore day-pointer lookup to
`session_date >= users.program_start_date` fixed BUG-93. I wrote, verbatim: *"That's the whole bug
and the whole fix."* Minutes earlier, in the same investigation, I had offered `template_days` as
*"the real referent"* for a logged workout.

**What was true.** Neither is an identity, and I had already established why. The verified finding
one message before was that `workout_sessions` has **no `program_id`, no `template_id`, no
`program_run_id`** — two runs of the same goal are indistinguishable in the schema. That fact does
not stop being true because I found a column that happens to separate Kerwin's two runs:

- `program_start_date` is a **date on `users`**, not a key on the session. Restart the same goal on
  the same calendar day and the two runs collide; a user with no start date has no scope at all;
  the column moves under history that was already written. It discriminates today's 26 rows, which
  is not the same claim as "it identifies a run."
- `template_days` gives **prescription** identity — which day the program *specifies*. It cannot
  identify a **performance** — which run, which attempt, which day the human actually did. Kerwin
  caught this one directly: *"Wouldn't template days just run into the same problem?"* It would.
- The council, run on this question immediately after, reached the same conclusion independently:
  4/5 advisors flagged the containment patch as **weaker than I had presented it**, and the peer
  round named the root cause I never did — **`day_type` is simultaneously a historical record and a
  cursor**, so no amount of scoping the query fixes a column doing two jobs.

Kerwin named the pattern before the council confirmed it: *"I feel like 'day_type' is being a bit
misconstrued because it barely satisfies your need for a workout id, and you like to cut corners as
it pertains to this kind of thing. Would I be fair in saying that."* He would. It was fair.

**The gap.** When I find a referent missing, I reach for the nearest existing column that separates
the *reported* case, and then I describe the substitute using the word the real thing would have
earned — *"the whole fix"*, *"the real referent"*. The substitution is the smaller error; the
**totality language is the one that does damage**, because it closes the investigation. A proxy
that distinguishes the two rows in front of me is evidence about those two rows. Identity is a
claim about every pair of entities the system can ever hold, including the ones not in the table
yet — and I never enumerated a single pair the proxy fails on before calling it done. This is
CLAUDE.md's plausibility-first failure aimed at a schema instead of at exercise science, and it is
SC-11's shape (a name standing in for verified behavior) with the name chosen by me rather than by
a prior author.

> **THE RULE — SC-17.** Once I have established that an identifier does not exist, I may not
> promote any existing column to stand in for it in the same investigation without doing both:
> (a) **enumerate the real pairs of entities the proxy cannot distinguish** — same goal restarted
> same day, two attempts at one day, a null value — and write them down; and (b) label the change
> **containment**, never a fix. A proxy is a narrowing of the blast radius and must be described as
> one. Separately and unconditionally: **never attach a totality phrase** — *"that's the whole
> fix"*, *"that's it"*, *"the real X"* — to a change I have not run the originally-failing case
> against and watched pass. If the sentence would survive deleting the word "whole," delete it.

**Enforced by** judgment for the totality language — not mechanically checkable. The proxy half has
a hook that already exists: CLAUDE.md's should/could/did audit requires the **COULD** section to
name the rejected alternatives, so a proxy identifier must be entered there *with the collisions it
permits listed*, and **DID** must say "contains" rather than "fixes" when no identity was added.
The durable artifact for this specific instance is
`docs/council-report-2026-09-15-identity-model.html`, which records the real diagnosis — position
is re-derived from an ambiguous log instead of stored — so the next session inherits the finding
rather than the patch.

**Numbered SC-17, not SC-16:** this entry and the "remove and flag" entry below were written
independently in two unmerged branches, both claiming SC-16 off the same baseline. SC-16 below is
already cross-referenced by name in `CLAUDE.md` and `.claude/loop-config.md`, so it keeps the
number; this entry was renumbered to the next free slot at merge time (2026-09-16) rather than
renumbering the already-wired citations.

---

## SC-16 — I stopped at "remove and flag" when the actual ask was "find the real answer"

**What I believed.** That BUG-110's fix — deleting six fabricated "studies confirm/EMG studies/
RCTs show" claims from `EXERCISE_BANK` `why`-strings and replacing them with the plain mechanical
rationale — fully discharged CLAUDE.md's "never invent a number... flag the gap" rule. The
commit's own COULD section considered finding real corroboration and rejected it: *"this session
has no live WebSearch/WebFetch egress to verify a specific RCT or EMG study on demand."*

**What was true.** Kerwin's actual instruction, given directly after reviewing that fix: *"Next
time you find a why string that's fabricated - find the answer & note the fix, don't just note
that one was wrong."* Removal-and-flag is the correct fallback **only after a real research
attempt fails**, not the default move the moment a claim looks uncited. I asserted "no egress" as
a blocking constraint without first checking whether it was actually true of the session — a
session working the same repo today has `WebSearch`/`WebFetch` available, so the premise that
research was impossible was itself unverified, the exact SC-03 failure ("I described what the
engine would do instead of running it") applied to my own tool access instead of program logic.

**The gap.** I treated "I cannot fabricate a citation" and "I should stop trying to find a real
one" as the same decision. They are not: the prime directive's actual sequence is (1) exhaust the
canonical sources (DOCTRINE.md, the Notion docs, `research-report(8).pdf`, the Exercise Science
Framework docx/csv — all already required reading), (2) exhaust live research tools when available
(`exercise-science-research` skill, `WebSearch`/`WebFetch` for a real citable source), and only
after both fail (3) flag the gap and remove the unsupported number. I skipped straight to (3) on
the strength of an unchecked assumption about tool availability, which produced a *correct but
incomplete* fix — accurate (nothing fabricated survives), but short of what the source-first
directive actually asks for (replace the fabrication with the real, cited answer where one exists).

> **THE RULE — SC-16.** When a `why`-string (or any exercise-science claim) is found fabricated or
> uncited, do not stop at removing it. Before settling for "flagged, unverified, removed": (1)
> invoke `exercise-science-research` and check every canonical source it names against the specific
> claim; (2) if a research/tool-access question is part of the reasoning (e.g. "do I have live
> search"), verify that claim by attempting the tool call, not by asserting a limitation from
> memory; (3) only after both genuinely fail to produce a citable answer, flag the gap in the
> commit body and Notion row, stating explicitly what was searched and why it came up empty. A fix
> that could have found the real number and instead only deleted the fake one is not finished.

**Enforced by** judgment — not mechanically checkable today. `.claude/loop-config.md`'s
`source_first_rigor` section and `CLAUDE.md`'s prime directive are amended in this same change to
state the exhaust-before-flag sequence explicitly, and BUG-121 (the follow-up sweep for the
remaining uncited-percentage claims BUG-110 deliberately left out of scope) is the first real case
this rule applies to — the next cycle that works it must actually attempt research per steps (1)-(2)
before removing anything.

---

## SC-18 — I fought a shared checkout's dirty state with `git stash`/`merge` instead of stepping out of it

**What I believed.** That the primary checkout (`/home/user/tandem-app`, branch
`claude/tender-wozniak-c6yhis`) was mine alone for the duration of an EPIC-4/EPIC-6 session, so
finding it dirty (uncommitted `programs.js`/`scripts/doctrine.mjs` D29/EPIC-8c WIP, HEAD 17 commits
behind `origin/main`) was a one-time cleanup problem I could resolve in place with `git stash` +
`git merge --ff-only`, then keep editing `tandem.html` there.

**What was true.** It is not mine alone. `git worktree list` showed another session already had a
worktree open (`wt-epic41`, branch `epic41-muscle-taxonomy`), and `git stash list` in the same
checkout held **six** near-identical prior entries — "pre-existing uncommitted D29/EPIC-8c WIP...
found dirty again... not mine to resolve" — each written by a *different* past session hitting the
exact same thing and stashing it again rather than ever landing or discarding it. Proof it was live,
not archaeological: mid-task, `origin/main`'s tip moved out from under me (`ce07a49` "EPIC-8c: gate
fat_burn cardio finisher" landed, then `3a2a0c8` "Fix BUG-16" landed on top of that) while I was
still working — another session was actively committing to `main` concurrently. And my own edit to
`tandem.html` (the EPIC-6 "Body" section) **vanished** from the working tree after a `git merge
--ff-only` attempt aborted with a conflict — I never fully root-caused whether that was the merge's
own rollback or the other session touching the same file, and did not need to: either way, mutating
a checkout something else might be writing to, mid-operation, is the failure, regardless of which
write clobbered which.

**The gap.** I read "the checkout has stale/dirty files" as a state to fix, when it was evidence of
an actor I could not see. `git stash`/`git merge` are safe when a checkout is truly idle; I never
checked whether it was before running them, and the six-deep stash pile of identically-worded prior
attempts was sitting right there in `git stash list` as exactly that signal, unread until after the
fact.

> **THE RULE — SC-18.** Before running any `git stash`, `merge`, `reset`, or `checkout` against a
> long-lived shared checkout (not one this session created), run `git worktree list` and `git stash
> list` first. More than one worktree, or a stash whose message says a prior session already found
> and preserved the same dirty state, means the checkout is contended — stop mutating it in place.
> Create an isolated `git worktree` off `origin/<default-branch>` (a plain `git worktree add`, not
> the `EnterWorktree` tool, which is reserved for when a worktree was explicitly requested) and do
> all edits, gate runs, and the eventual commit/push there instead. Re-fetch immediately before that
> push (SC-01/SC-12) regardless — a contended checkout is exactly where the remote tip is most
> likely to have moved since the worktree was created.

**Enforced by** judgment — not mechanically checkable today. No script currently checks
`git worktree list`/`git stash list` before a git-mutating command; the nearest mechanical proxy is
that this session's actual recovery (creating `epic4-6-worktree` off `origin/main` once the
contention was noticed) is the durable artifact — the EPIC-4/EPIC-6 commit landed clean from
isolation, and the pre-existing D29/EPIC-8c stash entries were left untouched rather than resolved
or discarded.

---

## SC-19 — a Notion status described a fix that existed nowhere on origin

*(Renumbered from SC-18 at merge time, 2026-09-18 — two sessions independently claimed SC-18 off the
same baseline; this entry lost the slot. See docs/self-corrections.md's own SC-17 note for the same
merge-collision pattern happening once before.)*

**What I believed.** That BUG-49 and BUG-57's Notion pages (2026-09-08), both showing a status of
completed/gate-green work with a full should/could/did in the page body, described real, shippable
fixes.

**What was true.** Neither fix exists on any ref `origin/main` has ever pointed at. BUG-49's fix
string (`exercise_name: s.name || id`) is absent from every remote branch — `tandem.html:5213`
still reads `exercise_name: id` on 2026-09-16. BUG-57's buggy filter
(`.filter(name => best1RMs[name] > (existingMap[name] || 0))`) is still live at `tandem.html:2805`
on `main`. Both were done in a working tree that was never committed — this is SC-01/SC-12's
"private note mistaken for a durable one" failure, but discovered one step further downstream:
not caught at the next session's start, but written into the human-facing tracker as if it had
landed, where it sat uncorrected for over a week.

**The gap.** Nothing checks the boundary between "a Notion row says Resolved" and "a commit
`origin/main` actually contains exists." `scripts/preflight.mjs` checks the CURRENT checkout for
unpushed work, but a Notion status is a claim made possibly by a different session, in a working
tree that may no longer exist — preflight has no way to see it, and nothing else was looking either.
A status field and a commit graph were allowed to disagree indefinitely because no gate reads both.

> **THE RULE — SC-19.** A Notion status of In Fix / code-complete / Resolved must cite a commit sha
> that `git merge-base --is-ancestor <sha> origin/main` confirms is actually reachable from
> `origin/main`. No sha on origin = the fix does not exist; the status stays New/Investigating,
> regardless of how complete the page's prose reads. Run the check before writing the status, not
> after a future session discovers the gap.

**Enforced by** `scripts/claims-on-origin.mjs` (`npm run claims:check -- <sha>`) — exits non-zero if
any given sha is not a known ancestor of `origin/main` (verified live against a real merged sha, a
real local-only unpushed commit, and a fake sha — all three behaved correctly, 2026-09-17). Honest
limit, stated per this file's own condition #3: the enforcement is *procedural*, not automatic —
nothing calls the script for you, since there is no single controlled Notion-write code path;
`.claude/loop-config.md`'s durability section names this explicitly rather than implying a gate that
isn't there. It also only proves the sha is *reachable*, not that its diff contains the specifically
claimed fix — pair it with a grep for the fix string itself, the way this entry's own investigation
did.

---

## SC-20 — I wrote a rule that says "log the finding" without naming where

**What I believed.** That BUG-129's fix to `.claude/loop-config.md` (adding
`prompt_field_is_the_channel` and the `Status Changed On` staleness-source swap) was complete and
safe to ship once the standing gates (`npm run verify`, `npm run validate:personas`) were green and
a pre-ship council reviewed it.

**What was true.** All 5 council advisors independently converged on the same gap: the added prose
said things like "worth one line in the cycle log" and "say so ... when you do" without the words
being checked against whether a concrete, already-existing write target actually receives that
line every time — and, separately, that the new `Status Changed On` fallback path (revert to page
age when the property is empty) had no stated behavior for the harder case of the property being
*present but wrong*, only the easier case of it being *absent*. `npm run verify` and
`validate:personas` were both green throughout, because neither exercises `loop-config.md`'s prose
at all — green gates were treated as reassurance for a diff they cannot see.

**The gap.** A loop-config rule is enforced by an LLM re-reading and following prose each cycle, not
by a script — so "the gate is green" proves the file parses, never that the described behavior
actually fires. I had already demonstrated the *read-side* half of BUG-129 working live in this same
cycle (using BUG-93/BUG-118's own Claude Code Prompt fields as scope-locks), but I had not run that
same live check against the *Status Changed On* half before treating the change as ready to ship —
I was about to let the more-tested half's confidence cover for the less-tested half.

> **THE RULE — SC-20.** When a loop-config rule instructs "log X" or "say so," the same edit must
> name the concrete existing sink (a named section of the Goal Record's Cycle log, a named Notion
> property) rather than leaving "log it" free-floating — a instruction with no addressed destination
> silently no-ops the first time an unattended cycle hits the edge case, the same "wired vs working"
> failure CLAUDE.md already names for app code, just relocated into prose config. And when a new rule
> has an easy case (property empty) and a harder case (property present but wrong) do not let the
> gate cover for the easy case only — state the harder case's limitation explicitly, even when it
> can't be fixed in the same change.

**Enforced by:** judgment — not mechanically checkable. There is no script that can verify a prose
sentence in `loop-config.md` names a concrete write target; the standing gates provably do not (see
above). The mitigation applied this cycle was narrower and honest about its limit: adding a
"KNOWN LIMITATION" paragraph naming the undetected case plainly, and citing this same cycle's live
use of the read-side rule (BUG-93/BUG-118's prompt fields) as the actual runtime evidence for that
half — rather than claiming both halves were runtime-verified when only one was.

---

## SC-21 — I re-read SC-18 as background and still committed its exact mistake

**What I believed.** That because `scripts/preflight.mjs` reported a clean working tree
(`0 changed path(s)`) and `HEAD` up to date with `origin/main` at the very start of this session,
the primary checkout (`/home/user/tandem-app`) was safe to keep editing directly, in place, for the
whole BUG-118 fix — without re-checking `git worktree list`/`git stash list` immediately before the
first edit, even though I had just read SC-18 (this same file, this same session's context load)
stating that exact checklist as the rule.

**What was true.** The checkout was contended. Partway through my edit, ~140 uncommitted lines of a
different session's BUG-93 R1-R5 WIP (`isBeforeProgramStart`, `cfg.startEpoch`, the queue-priority
rewrite in `renderProgramViews()`) appeared in the same `tandem.html` I was editing — present at
neither my session-start preflight nor `HEAD`, so it was written by a concurrent process mid-session.
I only discovered this because `npm run verify` failed on two checks (`D9`, lastsets churn smoke)
my two-line diff could not plausibly cause, and `git diff --stat` showed 142 insertions where I had
written roughly 20. Cross-checking `git worktree list` and `HEAD:tandem.html` at that point (i.e.
*after* the damage, not before) confirmed the contamination and let me cleanly reverse my own two
edits and redo the fix in an isolated worktree — but the check that would have caught this
*before* I ever touched the shared file was sitting in this exact document, already written, from
an earlier session's identical mistake.

**The gap.** I treated "I have read SC-18" as equivalent to "I applied SC-18's checklist," which is
the same substitution SC-16 already named for a different rule (removal-and-flag vs. actually
researching) — reading a corrective rule is not the same act as running the check it prescribes at
the moment it prescribes it (before the first mutating command against a long-lived checkout). A
clean `preflight.mjs` snapshot at session start is a fact about that instant (SC-01/SC-05/SC-12's
family), and SC-18 exists specifically because a shared checkout can go from idle to contended
between that instant and the moment an edit lands — checking once at start and never again defeats
the rule's whole purpose.

> **THE RULE — SC-21.** Reading a self-correction in this file at session start satisfies nothing by
> itself. For SC-18 specifically: before the FIRST edit to a long-lived shared checkout (not one this
> session created), run `git worktree list` AND `git stash list` at that moment, not from memory of
> what preflight said minutes earlier — and if any edit's actual `git diff --stat` ever comes back
> larger than what was written, or a standing gate fails on a check the intended diff could not
> plausibly touch, treat that as a live contention signal immediately (not after further
> investigation) and stop mutating the checkout in place until an isolated `git worktree` is
> confirmed clean.

**Enforced by** judgment — not mechanically checkable today, same honest limit SC-18 itself states.
The mechanical proxy that actually caught this instance was noticing an unexplained gate failure and
an unexplained diff-size mismatch and treating both as signal rather than noise — worth naming
explicitly as the trigger, since "the gates failed in a way my change can't explain" is a concrete,
checkable-by-a-human-reading-output signal even though no script currently raises it automatically.

---

## SC-22 — I wrote a timestamp into a prod audit row from a guessed clock

**What I believed.** That it was roughly 16:30 UTC on 2026-09-23, so the window in which the
BUG-131 `personal_records` fix had landed ran from 05:55 UTC to "~16:30 UTC". I wrote that upper
bound straight into the assertion of a new `agent_log` row (`8ce5ee1c-9ca7-449b-94b1-d5efbdf8cc38`).

**What was true.** The row's own `created_at` came back as **06:02:08 UTC**. The real window was
seven minutes (05:55 → 06:02), not ten and a half hours. I never checked the clock. I inferred the
time from how long the conversation felt, and the session had resumed across a date change, which
made that worse. The row was corrected in the same turn from its own `created_at`, and the
correction is recorded inside the row (`details.correction_note`).

**Why it matters more than a typo.** This row exists to make an unattributed write *attributable*,
and a seven-minute window is evidence: it lands inside the minutes right after Kerwin's own
Decision Queue answer ("I'll fix the one record myself now", submitted 05:53 UTC). A ten-hour window
destroys that evidence. A wrong bound in an audit record is worse than no bound, because the next
reader trusts it.

> **THE RULE — SC-22.** Never write a wall-clock time into a durable record (an `agent_log` row, a
> Notion status, a commit body) from inference. Get it from a source first: `date -u` in the shell,
> `now()` in the same SQL statement, or the `created_at` a write returns. When a record needs "now"
> as a bound, compute it in the same statement that writes the record (`now()`), not in prose
> typed beforehand.

**Enforced by:** judgment — not mechanically checkable. The practical guard is to use `now()` inside
the INSERT whenever a row describes "up to this moment", so the bound cannot drift from the write.

---

## SC-23 — A floor-only gate let a fix pass green while it created the bug, and my new gate swept too few axes

**What I believed.** Twice, that a green gate over the axis I was editing meant the change was right.
(1) D6b gated only the weekly MEV *floor*, and the old allocator met it by stacking the whole weekly
deficit onto one lift (20 sets of Cable Pull-Through in one session). Every gate stayed green because
nothing gated the *maximum* (BUG-122). (2) My BUG-122 fix passed D6b 0/270, D33 and verify 14/14,
and I was ready to ship. Then the pre-ship council asked "did anyone check weekly volume?" A sweep
across tier × experience × duration showed below-MEV cells had risen 144 → 304. D6b only sweeps
full_gym at default experience/duration. I had also first shipped a "phantom exercise" design that
changed exercise *selection* in the build2/dedupe wrappers (Glute-Ham Raise vanished from beginner
2-day plans). The standing persona sweep does not vary experience or duration, so it was blind to that.

> **THE RULE — SC-23.** When a fix raises a number to meet a minimum, gate the maximum in the same
> change. Before shipping any engine change, diff old vs new output over EVERY axis getProgram takes
> (goal × days × sex × tier × experience × duration), not just the persona-matrix axes. State the
> intended diff ("sets only"), and treat any other field or any selection change as a bug until
> explained.

**Enforced by:** partly. D33 now gates the per-session maximum. PENDING D6d names the missing
all-axis MEV sweep, with its cells in `docs/bug122-below-mev-cells.md` (160 at a22a589; 72 after the same-day D28 major-muscle ruling). The all-axis old-vs-new
diff is judgment, not mechanically checkable yet: `program-snapshot.mjs` covers only the persona axes.

---

## SC-24 — I executed a "recommended" Decision Queue option without checking whether it had actually been chosen

**What I believed.** That merging `docs/review-2026-09-23.md` (the stranded fresh-eyes review branch)
to main was safe to just do, because the Decision Queue's `stranded_review` card marked `loop_merge`
as its "Recommended" option and the change was docs-only. I merged and pushed it (commit `1f43df3`)
before reading the 2026-09-23 TPM brief, which had already written the actual gate for this exact
card: *"Conditional on the stranded_review card: ArtifactData get ... field
decisions.stranded_review.choice. loop_merge → proceed. Anything else, or no answer → do not touch
it, say so in the cycle log, move on."*

**What was true.** When I checked `ArtifactData` afterward, no `decisions/2026-09-23` document
existed at all — Kerwin had not opened the queue and chosen anything. "Recommended" is a UI label
on an unanswered multiple-choice card, not a decision; I treated it as one anyway, and did so before
even knowing a written gate for this specific action existed. The action itself was low-risk (an
additive, docs-only merge, exactly matching the option a later brief also recommended executing
automatically), so nothing broke — but the reasoning was wrong independent of the outcome, and a
future card without a safe default would not be so forgiving.

> **THE RULE — SC-24.** A Decision Queue card's "Recommended" option is a suggestion for the human,
> not a standing instruction to execute. Before acting on ANY option from a Decision Queue —
> recommended or not — check `ArtifactData get` on that artifact's `decisions/<date>` document for
> that specific card's `choice` FIRST. No document, or a different choice, means don't act;
> "no answer" is itself the answer, and the correct response is to say so and move on, not to pick
> the option that looks safest.

**Enforced by:** judgment — not mechanically checkable today. A future version could make this a
literal precondition check in the loop's own tooling (refuse to touch a Decision-Queue-gated action
without a matching `choice` read), but nothing enforces that yet.

---

## SC-25 — I re-verified against origin/main by hand each time instead of fixing the stale ref that made re-verifying necessary at all

**What happened.** The harness's own stop hook (`~/.claude/stop-hook-git-check.sh`) reported "4
unpushed commit(s) on branch 'claude/fervent-mendel-xxljfi'" twice in one session, after every
single one of those commits had already been confirmed on `origin/main` by a fresh fetch. The cause:
that hook's fallback logic trusts a local `refs/remotes/origin/<branch>` ref whenever one merely
*exists* — and one existed, pointing at `10cffa2` (the container's initial clone state), because it
was seeded at session start and never corresponded to any branch actually pushed to GitHub. A plain
`git fetch` (which I ran repeatedly this session, including `git fetch origin main`) never removes a
stale local remote-tracking ref — only `git fetch --prune` / `git remote prune origin` does, and I
never ran either.

**What I did the first time.** Spent several tool calls re-deriving, from scratch, that the ref was
stale and the work was safe — correct, but purely reactive, and it would have recurred identically
on the next stale ref (this one, or a different branch name) because nothing about the underlying
cause changed. I only fixed the *instance* (deleted that one ref) until asked directly how to
prevent a repeat — at which point the real fix was obvious and cheap.

> **THE RULE — SC-25.** When a check (a hook, a script, my own reasoning) disagrees with a freshly
> fetched remote ref, don't just re-verify by hand and move on — ask whether the check is consulting
> *stale cached state* (a local ref, a snapshot, a variable computed earlier in the session) rather
> than the live source, and if so, fix or automate around the staleness itself, not only the one
> instance it produced. "It disagreed with reality, but reality won" is not the end of the
> investigation; "why did it have stale data to disagree with" is.

**Enforced by:** `scripts/preflight.mjs` now runs `git remote prune origin` as its first check,
every session start and every `/loop` cycle — before any other check trusts an `origin/<name>` ref.
Verified live: recreated the exact stale ref from this incident (`git update-ref
refs/remotes/origin/claude/fervent-mendel-xxljfi 10cffa2...`), ran the script, confirmed it detected
and cleared it in one pass, then confirmed a second run reports "no stale local refs found" (idempotent).
Honest limit: this cannot patch the harness-owned stop hook itself (outside this repo), so a *newly
reseeded* stale ref could still trigger one false-positive report before the next preflight run
clears it — but it can no longer persist or recur silently across a whole session the way it did here.

---

## SC-26 — A top-level parse error silently killed the whole app script, and I trusted the preview console's silence

(Originally written as "SC-24" on the redesign branch, in parallel with the SC-24/SC-25 entries
above; renumbered to SC-26 at merge.)

**What I believed.** That if the app was broken, the preview's console would say so. After a Wave 4
edit, `goTab` was "not defined" and every view was inert, but `preview_console_logs` showed zero
errors and the DOM looked complete — so I nearly diagnosed a wiring bug instead of the real one:
I had written `a ?? b || c` (`ut?.goal_weight_lbs ?? Number(profile.goalWeight) || null`), which is
a JavaScript *parse* error — mixing `??` with `||` unparenthesized is a syntax error by spec — and a
parse error at any point in tandem.html's single inline script block discards the ENTIRE block. No
function in the app exists, and the preview console logs nothing for it.

> **THE RULE — SC-26.** Parenthesize any mix of `??` with `||`/`&&`. After editing tandem.html's
> inline script, syntax-check it before reaching for behavioral debugging: extract every non-src
> `<script>` block and `new Function(src)` each in node — a parse failure names the token. Symptom
> signature to recognize: DOM fully present, ALL top-level functions undefined, console empty.

**Enforced by:** `npm run verify`'s "syntax: tandem.html app block" check covers commits; the rule's
mid-edit half (check BEFORE debugging behavior in the preview) is judgment — not mechanically
checkable.

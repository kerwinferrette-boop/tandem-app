# LLM Council — BUG-93: who owns "what day is it"

**Date:** 2026-09-15
**Topic:** `tandem_current_day` (completion pointer) vs `getWeekSchedule()` (calendar slot)
**Trigger:** Kerwin — *"pull the bug & run it through the council"*
**Status of artifact:** citable ruling input. Not itself doctrine. Nothing has been committed.

---

## The original question

Kerwin, on being shown a mockup card reading "DAY 2 · PUSH":

> "and you can confirm that the text in the card saying 'day 2, push' is going to display the
> user's actual next workout & not default to day 2? That was a bug i just pushed"

then:

> "pull the bug & run it through the council"

then, clarifying the symptom:

> "I filed a bug report that said that i just started a new program, it showed Day 2 first for
> some reason as my first workout."

and on being shown the root cause:

> "that would defeat the point of starting a new program?"

---

## The framed question given to all five advisors

**Project:** Tandem, a couples fitness-competition web app (users: Kerwin & Dani). Single-file
frontend `tandem.html` (~8,000 lines) + `programs.js`, Supabase/Postgres backend, deploys to
Netlify on push. Engineering doctrine lives in `/DOCTRINE.md` as numbered invariants enforced by
`scripts/doctrine.mjs`, which runs in `npm run verify` (13 checks) and in CI on every PR.

**The bug (filed, never fixed):** BUG-93, P1 Wrong Data, Status "New" since 2026-08-17, Code Fix
field reads "NOT ATTEMPTED". Verbatim: *"I just built a new program and it starts on day 5, and
also says I'm overdue? Interesting."* Re-reported 2026-09-15 with a different number — a new
program opened on **Day 2**. Two symptoms: (1) a brand-new program does not start on Day 1, and
(2) the app immediately claims the user is overdue.

**Root cause, established by reading the code:**

*Owner A — the calendar slot.* `getWeekSchedule()` (tandem.html:7168-7185) computes a 7-day
cadence anchored on `cfg.startDate`: `todayIndex = ((diffDays % 7) + 7) % 7`. Purely
date-derived, resets naturally with a new program, feeds the dashboard label
"Week 3 of 8 · Day 4 of 7". Per Kerwin's 2026-07-23 ruling it shows the *cycle slot out of 7*,
not the workout number.

*Owner B — the completion pointer.* localStorage key `tandem_current_day` holds a program day key
(`'day1'`, `'day2'`…) and selects the workout actually served. It has:

- **1 reader** (4435): `const savedDay = LS.get('tandem_current_day'); currentDay = (savedDay &&
  program.some(d => d.key === savedDay)) ? savedDay : program[0].key;` — the validity check is
  only "does this key exist in the program", and `'day2'` exists in essentially every program, so
  a stale pointer always passes.
- **3 writers**:
  - `finishSession()` (5878) — advances after a completed workout. Correct.
  - cloud-restore path (7484-7492) — sets the pointer from `sessions?.find(s => s.completed &&
    s.session_date && s.session_type !== ONEOFF_SESSION_TYPE)`. **That is the user's entire
    session history with no filter on which program the session belonged to.**
  - a second auth path (8119-8137) — a near-byte-identical duplicate, same unscoped query.
- **0 deleters.** No `LS.del('tandem_current_day')` anywhere. The bulk reset at 5487 clears
  `['tandem_history','tandem_prs','tandem_lastsets','tandem_working1rm']` and omits it.

So: create a new program, log in, the restore path finds a completed `day4` session from the
*previous* program, `day4` resolves in the new program, pointer := `day5`. BUG-93 exactly.

**Additional context weighed:**
- Both unscoped writers were *already patched once* (2026-09-13) to exclude one-off sessions — a
  different scoping bug in the same expression. Nobody saw the program-scope hole while editing
  that exact line. The fix was hand-duplicated into both sites rather than extracted.
- CLAUDE.md: **"one rule, one home"** and **"fix the mechanism, not the instance"** (precedent:
  BUG-73 fixed leg-day label vocabulary; BUG-114 was the identical defect recurring 5 weeks later
  for chest/back vocabulary).
- **`scripts/doctrine.mjs` reads repo files only.** No DB connection, no localStorage visibility.
- The false-overdue symptom comes from `getOverdueDays()`, which is Owner A's side of the house.

**The five questions:** (1) which owner is the single home for "next workout"; (2) is "what day is
it" one concept or two, and what's the contract; (3) what happens to the loser, and what then
writes `workout_sessions.day_type`; (4) new doctrine invariant, with honest enforcement given
doctrine.mjs's blindness; (5) migration for stale pointers and months of existing rows.

---

## Advisor responses

### The Contrarian

Three things in this briefing are unproven, and the council is being asked to arbitrate ownership
on top of them.

**1. Nobody reproduced this.** The root cause was "established by reading the code." This
project's own prime directive is verify-by-running, and SC-03 is literally "run, don't simulate."
A day5 pointer explains the day-5 report. It does not explain today's **Day 2** report unless the
previous program's last completed session was `day1` — which nobody checked. Two symptom numbers
may be two bugs. Pick an owner now and you may ship a fix that leaves the second one live.

**2. The overdue symptom has no root cause at all.** The briefing concedes it lives on Owner A's
side and that a fresh `cfg.startDate` should produce zero overdue — and then moves on. Either
`cfg.startDate` is *not* actually reset on new-program creation, in which case Owner A is stale
too and "make A the single home" is the worst available answer, or `getOverdueDays()` reads the
pointer and the ownership map in this briefing is wrong. Both possibilities invalidate question 1.
Answer them before answering the five.

**3. The one-line fix may not exist.** "Scope the query by program" assumes `workout_sessions`
carries a program/template identifier. Nothing in the briefing says it does. If that column isn't
there, the cheap patch is impossible, the real work is a schema migration plus backfill across
months of rows, and the honest cost comparison between "patch" and "structural fix" collapses —
they're the same project.

Question 4 is the only one that's safe to answer today: a doctrine invariant that `doctrine.mjs`
can't check is theater. A grep-level "one reader, one writer, one deleter for
`tandem_current_day`" check is enforceable. An invariant about runtime state is not.

### The First Principles Thinker

**You're asking which of two owners wins. Neither should exist, because neither is a fact.**

Strip it down. The app must answer one question: *which workout is next for this person, in this
program?* That is a **derived** value — a pure function of (program definition, completed sessions
belonging to this program). `tandem_current_day` is not a source of truth; it is a **cache of a
derivable fact**, stored in a location with no owner, no invalidation, and no lifecycle. 1 reader
/ 3 writers / 0 deleters is the diagnostic signature of exactly that. Cached derived state doesn't
have bugs, it *is* the bug.

That reframes the history. The 2026-09-13 one-off-session filter wasn't a fix, it was a cache-fill
correction. Program scope would be the second. Next will be deleted sessions, or Dani's rows, or a
mid-program day-count change. You will add filters to that expression forever, because you are
reconstructing a query result by hand.

**And the real missing concept isn't a pointer — it's program identity.** Nothing in this system
names "the program Kerwin is currently enrolled in." `workout_sessions` has `day_type` but no
program instance. That absence is what makes the query unscopable, and it is also why "overdue"
fires on a fresh program: same disease, different symptom. Both owners are downstream of one hole.

So: introduce a **program instance id**, stamp it on sessions going forward, derive next-day from
it, delete the localStorage key entirely. Owner A stays — it answers a genuinely different
question (calendar cadence), and now it can be scoped too.

Honest enforcement: doctrine can't see localStorage, but it can see *source shape*. Declare a
whitelist of persisted keys with owner + deleter; fail CI on any key that is written and never
deleted. That checks the disease, not this instance.

### The Expansionist

The bug isn't a bug. It's the app telling you that **a "program run" doesn't exist as a
first-class object**, and that absence is worth far more than the P1.

Every proposed fix — scope the query, clear the key — is a workaround for a missing
`program_run_id` (an enrollment: this user, this program, started this date, ended or active).
Introduce it and the pointer stops being ambiguous because sessions belong to a *run*, not to a
user. The "which program did this session come from" question answers itself, permanently, for
every future query — not just this one.

Now look at what that unlocks that you can't build today:

**Run-over-run comparison.** Months of `day_type` rows become "Kerwin's Week 3 Day 2 this cycle
vs. last cycle." That's the single most motivating screen a fitness app can show, and it's
currently unbuildable because history is an undifferentiated stream.

**Seasons.** A couples competition app with no notion of a season is leaving its own genre on the
table. Runs = seasons = rematches, finals, a standing record between two people. That's the moat
the doctrine keeps describing.

**Cross-device truth.** Once "next workout" derives from the newest completed session *within the
active run*, it's a server-derivable value. localStorage becomes a cache, not an owner. Dani's
phone and Kerwin's laptop agree for free.

**Enforcement you keep saying is impossible.** doctrine.mjs can't see localStorage — but it *can*
grep that no query against `workout_sessions` omits a run filter. That's a file-side, mechanically
checkable invariant. The structural fix is the one that's actually enforceable.

The one-line patch closes a ticket. The run object opens a product.

### The Outsider

Start with what the user actually said: *"it starts on day 5, and also says I'm overdue?
Interesting."* That "Interesting" is politeness covering confusion. He didn't file a
state-management complaint. He said: **I did the hopeful thing — started a new program — and the
app opened by telling me I was already behind.**

That's the real defect, and it's a product one. Day one of a new program is the single
highest-motivation moment in fitness software. You spent it accusing him of failure. No amount of
correct pointer arithmetic fixes the feeling if the app can still greet a fresh start with a
scold.

So, from outside:

**"Day 5" and "Day 4 of 7" are jargon.** You have two internal concepts fighting, and the user is
being shown both, unlabeled, in the same word: "Day." A calendar slot out of 7 and a workout
number are different things, and no human reading "Day 4" can tell which one they got. The
2026-07-23 ruling that "Day 4" means cycle slot is a builder's decision that is invisible to the
person reading it. Kerwin ruled on it and *still* got confused a month later — that's your
evidence the label doesn't survive contact.

**Concretely:** stop showing the raw number as the primary. Show "Next: Upper Body" and "Workout 3
of 4 this week." The date can live underneath.

**And: "overdue" should be impossible before the user has ever missed anything.** Whatever you fix
structurally, add a rule a non-engineer can verify — a program with zero completed sessions can
never display an overdue state or a workout other than its first. That's the acceptance test, and
Dani should be able to run it.

### The Executor

Monday morning, in this order. Nothing here takes more than a day.

**Step 1 (today, 20 minutes): stop the bleeding.** Add `program_id` (or `template_id` /
`cfg.startDate` cutoff — whichever column already exists on `workout_sessions`) to BOTH restore
queries, and add `LS.del('tandem_current_day')` to the reset at 5487 and to wherever a new program
is committed. Ship it. BUG-93 closes today for Kerwin and Dani, who are the entire user base. Do
not let the architecture debate hold a P1 hostage for another month.

**Step 2 (same commit, non-negotiable): kill the duplicate.** Those two near-identical blocks at
7484 and 8119 are the actual defect — the scoping hole survived a 2026-09-13 edit *to those exact
lines* because there were two of them. Extract one function, `resolveCurrentDay(sessions, prog,
cfg)`, call it from both sites. That's a 30-line mechanical extraction with zero behavior change.
If you only do Step 1 and skip this, you will be back here in five weeks. BUG-73/114 already ran
this experiment.

**Step 3 (this week): make B derived, don't delete it.** B stays as the served-workout pointer
because `workout_sessions.day_type` has months of rows and something must write it. But it becomes
*recomputed from session history on every load* rather than persisted state you trust. Then
localStorage is a cache, stale caches are harmless, and question 5's migration story is "there
isn't one — it self-heals on first load."

**On question 4:** doctrine.mjs can't see localStorage, but it *can* grep. A 15-line check that
fails if `tandem_current_day` appears in more than one write site is honest, enforceable, and
buildable Monday afternoon. Everything else is a comment pretending to be a gate.

**Skip entirely:** rewriting Owner A. The overdue bug is a separate ticket. File it, don't bundle
it.

---

## Anonymization mapping (revealed)

| Letter | Advisor |
|---|---|
| A | The Executor |
| B | The Contrarian |
| C | The Outsider |
| D | The First Principles Thinker |
| E | The Expansionist |

## Peer reviews

### Review 1

**1. Strongest: D.** It's the only response that both diagnoses the mechanism (cached derived
state with 3 writers and 0 deleters is the signature, not the symptom) and names the missing
concept — program identity — that explains *both* symptoms, the pointer and the overdue. Its
enforcement proposal (whitelist of persisted keys requiring an owner and a deleter, fail CI on
write-without-delete) is file-side, grep-checkable, and targets the disease class rather than
`tandem_current_day` specifically. That directly satisfies "fix the mechanism, not the instance."

**2. Biggest blind spot: E.** It assumes `program_run_id` is cheap and treats the P1 as a footnote
while pitching seasons and rematch screens. It never asks what happens to months of existing
`workout_sessions` rows that have no run to belong to — question 5 goes unanswered. B is the one
that catches this: the backfill may be the entire project.

**3. All five missed:** nobody addressed Dani. Two users share this app, and `tandem_current_day`
is per-device localStorage while `workout_sessions` is shared Postgres. Any derivation from
session history must filter by user as well as program — an unscoped query could serve Kerwin
Dani's next workout. Also unexamined: whether the 2026-09-13 patch is itself reachable on both
code paths.

### Review 2

**1. Strongest: B.** It's the only response that refuses to arbitrate ownership on top of
unverified premises. Three specific, falsifiable objections: nobody reproduced the bug (Day 2 vs
Day 5 may be two defects); "overdue" has no root cause and, if `cfg.startDate` isn't reset, Owner
A is stale too — which would invalidate Q1 entirely; and the cheap fix presumes a program
identifier on `workout_sessions` that nobody confirmed exists. D is the best *architecture*
answer, but B is the correct *review* answer.

**2. Biggest blind spot: E.** It sells `program_run_id` on future product value (seasons,
run-over-run) while waving past the migration it creates: months of existing `day_type` rows have
no recoverable run membership — backfill is guesswork, not work. Worse, its "enforcement" claim is
false comfort: grepping that no `workout_sessions` query omits a run filter is trivially defeated
by dynamic query construction, and it doesn't cover the localStorage key at all. A P1 open since
August gets no plan.

**3. All five missed user scoping.** The writers read the "entire session history" — nobody asked
whether it's filtered by `user_id`. Two users, possibly one device: Dani's sessions may be driving
Kerwin's pointer. Same shared code path, same class of hole, unfixed by any proposal here.

### Review 3

**1. Strongest: B.** It's the only one that refuses to arbitrate on unverified premises. Its three
objections are load-bearing: the Day 2 report isn't explained by the Day 5 theory; "overdue" has
no root cause; and the cheap fix presumes a program identifier on `workout_sessions` that nobody
confirmed exists. D and E both prescribe a `program_run_id` — which is B's point #3 conceded,
meaning the "one-line patch" framing in A is unsafe. A's sequencing is otherwise the best-shipped
plan, but Step 1 is unimplementable if B is right.

**2. Biggest blind spot: E.** It answers a product-strategy question nobody asked. Seasons and
run-over-run comparison are real, but E treats a P1 that has sat unfixed for a month as a feature
opportunity, and its "grep every `workout_sessions` query for a run filter" gate can't exist until
the column and backfill do. It never says what Kerwin and Dani do this week.

**3. All five missed:** the backfill's correctness. Months of existing `day_type` rows can't be
assigned to runs retroactively without guessing program boundaries — D and E assume this away.
Also unaddressed: two users share these tables, so any pointer or run scoping must be per-user,
and nobody checked whether Dani's sessions can contaminate Kerwin's.

### Review 4

**1. Strongest: D.** It's the only one that names why the bug keeps coming back —
`tandem_current_day` is cached derived state with no invalidation — and predicts the *next* three
recurrences (deleted sessions, Dani's rows, day-count changes). It also correctly links "overdue"
and "Day 5" to one missing concept (program identity) instead of filing them apart, as A does. C
is the necessary companion: it's the only response that reads the user's actual sentence and
notices the app scolds you on day one, and its Dani-runnable acceptance test is the only proposed
check a non-engineer can feel.

**2. Biggest blind spot: E.** It converts a P1 that two real people hit today into a roadmap for
seasons and rematches. It never says what ships this week, never addresses "overdue," and its
enforcement claim (grep every `workout_sessions` query for a run filter) is asserted, not
demonstrated.

**3. All five missed the migration's felt cost.** Existing rows have no run id. If you delete or
derive the pointer, a user mid-program — Dani, right now — gets yanked back to Day 1 with her
history apparently gone. Nobody specified the backfill or what she sees on first load after
deploy.

### Review 5

**1. Strongest: D.** It's the only response that answers the actual ownership question with a
principle rather than a preference: `tandem_current_day` is a cache of a derivable fact, and 1
reader/3 writers/0 deleters is the signature of that. It correctly keeps Owner A (calendar cadence
is a genuinely different question), names program identity as the shared upstream hole behind
*both* the day-5 and overdue symptoms, and its enforcement — a whitelist of persisted keys
requiring an owner and a deleter — checks the disease class, not this instance. That is the
doctrine's "fix the mechanism" applied honestly.

**2. Biggest blind spot: E.** It converts a month-old P1 into a roadmap pitch and never says what
ships this week. Worse, its enforcement claim is over-sold: grepping that "no query against
`workout_sessions` omits a run filter" is unreliable against chained `.eq()` builders and dynamic
strings — it would be exactly the green-gate-over-dead-value failure the doctrine warns about. It
also asserts backfill is free.

**3. All five missed:** nobody answers Q3's second half — `day_type` is NOT NULL and is written
*at session start*, before any completion exists, so deleting B requires naming that writer. And
no one proposed the one check that actually sees runtime: a startup assertion that fails loudly
when pointer ≠ derived value. Historical rows also cannot be attributed to a run retroactively;
any invariant must be forward-only with an explicit legacy sentinel.

**Peer-review tally:** D strongest ×3, B strongest ×2. E named biggest blind spot ×5 (unanimous).

---

## COUNCIL VERDICT

### Where the council agrees

Four points converged independently across advisors who were not talking to each other.

**1. "What day is it" is genuinely TWO concepts, and Owner A is not the one in question.**
Nobody argued for collapsing them. The calendar cadence (`getWeekSchedule()`) answers "where are
we in the week," and that is a real, separate question with a legitimate date-derived answer.
Owner A stays. The dispute is entirely about B.

**2. `tandem_current_day` is not a source of truth — it is a cache of a derivable fact.** The
First Principles Thinker named it, the Executor independently arrived at the same remedy
("recompute on every load"), and three of five reviewers ratified it. **1 reader / 3 writers / 0
deleters is the diagnostic signature of cached derived state with no lifecycle.** This is why the
bug recurs: each writer is hand-reconstructing a query result, and each hand-reconstruction needs
its own filter list.

**3. The duplicated block is the mechanism, not the instance.** Both restore sites were edited on
2026-09-13 for a *different* scoping bug and the program-scope hole survived that edit **because
there were two copies of it.** This is BUG-73/BUG-114 running for a third time. Extraction into
one function is a precondition for any fix, not a nicety.

**4. A doctrine invariant `doctrine.mjs` cannot check is theater — but a grep-level one is real.**
Every advisor who touched Q4 landed here. The enforceable form is file-shape, not runtime state.

### Where the council clashes

**Clash 1 — patch now vs. verify first.** The Executor wants a 20-minute fix shipped today,
arguing a month-old P1 should not be hostage to an architecture debate. The Contrarian says the
patch *may not exist*: "scope the query by program" presumes `workout_sessions` carries a program
identifier, and nobody confirmed it does. Two reviewers sided with the Contrarian explicitly —
"A's sequencing is the best-shipped plan, but Step 1 is unimplementable if B is right."
**Both are right, and they are not actually in conflict** — the disagreement dissolves into a
ten-minute schema check that nobody has run.

**Clash 2 — delete B or demote B.** First Principles says delete the key entirely. The Executor
says keep it as a recomputed cache, because `workout_sessions.day_type` is NOT NULL and something
must write it. Review 5 sharpened this decisively: **`day_type` is written at session START,
before any completion exists** — so "derive from completed sessions" cannot be the writer of the
very column it reads. That is a genuine ordering constraint, and it settles the clash in the
Executor's favor on mechanics while leaving First Principles' diagnosis intact.

**Clash 3 — scope.** The Expansionist wants `program_run_id` as a first-class object unlocking
run-over-run comparison and seasons. **All five reviewers named this the biggest blind spot** —
unanimous, which is rare. The objection is not that runs are wrong; it is that E answers a
roadmap question while a P1 sits open, and E's enforcement claim ("grep that no
`workout_sessions` query omits a run filter") is unreliable against chained `.eq()` builders — it
would manufacture exactly the green-gate-over-dead-value confidence the doctrine warns about.

### Blind spots the council caught

These emerged only in peer review. Three of them are more serious than anything in the original
five questions.

**1. Nobody scoped by USER. Four of five reviewers raised this independently.** The writers read
"the entire session history" — and nobody asked whether that query filters on `user_id`.
`workout_sessions` is shared Postgres; `tandem_current_day` is per-device localStorage. **If the
user filter is missing or weak, Dani's completed session can advance Kerwin's pointer.** That is a
strictly worse bug than BUG-93 and it is in the same expression. This must be checked before
anything ships.

**2. `day_type` is written at session START, not at completion.** (Review 5.) Q3's second half —
"what then writes `day_type`?" — has a harder answer than any advisor gave. Any design that
derives next-day from *completed* sessions must still name a writer for a column populated before
completion exists.

**3. Historical rows cannot be attributed to a program run retroactively.** (Reviews 1, 2, 3, 4.)
Both D and E assume the backfill away. It is guesswork — program boundaries are not recoverable
from `day_type` alone. **Any run-id invariant must be forward-only with an explicit legacy
sentinel**, never a pretend-complete backfill.

**4. The migration has a felt cost nobody specified.** (Review 4.) If the pointer is deleted or
re-derived, a user mid-program on deploy day — Dani, right now — may get yanked back to Day 1 with
her history apparently gone. "It self-heals on first load" is only true if you have checked what
first load actually shows her.

**5. The Outsider's point, which the peer round ratified but no engineer advisor addressed:** the
word "Day" is doing two jobs in the UI and the user cannot tell which one he got. Kerwin *made the
ruling* that "Day 4" means cycle slot on 2026-07-23 and was still confused by it a month later.
That is evidence the label does not survive contact, independent of whether the pointer is correct.

### The recommendation

**Side with the Contrarian on sequence and the First Principles Thinker on target. Do not pick an
owner today, and do not ship the Executor's Step 1 today either.**

The majority (3/5 reviewers) called D strongest and D is right about the *diagnosis*. But the
Contrarian is right about the *precondition*, and the chairman weights that higher because this
project's prime directive is source-first and SC-03 is "run, don't simulate." **A root cause
established by reading is a hypothesis.** Specifically unexplained: the Day-2 report only follows
from the Day-5 mechanism if the previous program's last completed session was `day1`. Nobody
checked. It may be two bugs.

The ruling, in order:

1. **Verify three things first** (one prod query and two greps, well under an hour):
   (a) does `workout_sessions` carry any program/template identifier? — this decides whether the
   cheap patch exists at all; (b) do both restore queries filter on `user_id`? — this decides
   whether there is a worse bug hiding in the same expression; (c) is `cfg.startDate` actually
   reset on new-program creation? — this decides whether Owner A is stale too, which would
   invalidate the entire ownership map.
2. **Then: Owner A keeps calendar cadence. B is demoted, not deleted.** `tandem_current_day`
   becomes a recomputed cache with a real lifecycle — one derivation function, one call site per
   path, and an explicit deleter on new-program creation. Its value is never trusted across a
   program boundary.
3. **Extraction into a single `resolveCurrentDay()` is non-negotiable and ships in the same
   commit as any behavior fix.** Two copies is how the last fix missed. "Fix the mechanism, not
   the instance" is not satisfied by patching two sites in parallel.
4. **`program_run_id` is the correct target, but it is a separate epic, forward-only, with a
   legacy sentinel** — not a backfill. The Expansionist's product case (run-over-run, seasons,
   cross-device truth) is genuinely strong and should be filed, not bundled into a P1 fix.
5. **Doctrine: propose a new invariant on persisted-key lifecycle, not on this key.** The
   enforceable form is First Principles' whitelist — every persisted key declares an owner and a
   deleter; CI fails on any key written and never deleted. That is grep-checkable, targets the
   disease class, and is honest about what `doctrine.mjs` can see. Do **not** adopt E's
   "grep every query for a run filter" — it cannot see chained builders and would manufacture
   false confidence.
6. **Adopt the Outsider's acceptance test verbatim, because Dani can run it:** *a program with
   zero completed sessions can never display an overdue state, and can never serve a workout other
   than its first.* That is the check that actually proves the fix at the surface the user sees.

### The one thing to do first

**Query prod for Kerwin's last completed non-one-off session and confirm its `day_type` predicts
the Day-2 he actually saw — and in the same query, check whether `workout_sessions` has any
program-identifying column and whether the restore queries filter on `user_id`.**

One query. It either confirms the hypothesis and tells you whether the cheap fix exists, or it
reveals a second bug and a user-scoping hole — in which case everything above gets re-ordered.
Nothing else should be written until that result is on screen.

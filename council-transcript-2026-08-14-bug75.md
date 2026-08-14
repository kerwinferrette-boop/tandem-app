# LLM Council — BUG-75: where should the 1RM formula live?

**Date:** 2026-08-14
**Convened because:** the fix touches D11/D12, which are SAFETY-tier doctrine. This is an
architecture call, not a mechanical reorder.

---

## The framed question

`public.sets` carries two `BEFORE INSERT` row triggers. Postgres fires same-timing triggers in
alphabetical **name** order:

| Trigger | Function | Role |
|---|---|---|
| `check_pr_on_set_insert` | `update_personal_record()` | **reads** `NEW.estimated_1rm_lbs` |
| `set_1rm_before_insert` | `calculate_1rm()` | **writes** `NEW.estimated_1rm_lbs` |

`'c' < 's'`, so the reader runs before the writer. Three failure modes, each reproduced on live
prod inside rolled-back transactions:

- **A — hard abort.** A set with `estimated_1rm_lbs` omitted, for an exercise with no PR row, puts
  NULL into `personal_records.best_estimated_1rm_lbs` (NOT NULL) → `ERROR 23502`, the whole set
  INSERT fails. The database cannot accept a set on its own.
- **B — silent PR loss.** Same omission with an existing PR row: `NULL > existing_pr` is NULL, not
  TRUE, so the branch is skipped without error. Measured on `tr-row`: 135 lbs × 5 reps against a
  prior PR of 63 → `sets.estimated_1rm_lbs = 157.5`, `is_pr = false`, `personal_records` still 63.
- **C — split-brain + D12 violation.** A 20-rep set carrying the client's D12-correct 151.2 lands
  in `personal_records` as 151.2, then `calculate_1rm()` overwrites `sets.estimated_1rm_lbs` with
  pure Epley 166.7. +10.3% disagreement on one physical set.

`calculate_1rm()` is **pure Epley at all rep counts** — not D12-compliant. Latent only because
`max(reps)` across all 374 prod rows is 12, and D12 specifies Epley at ≤12. The Mayhew branch has
never executed in production.

Reachability (the build plan called this "latent — masked by the client"; that is wrong): two live
paths send the value off a **cached snapshot** rather than recomputing —
`saveExerciseToCloud` and the C11 session-rescue path, both `estimated_1rm_lbs: s.est1rm || null`.

**The question put to the council:** where should the 1RM formula live — the database or the
client — given that the doctrine gate is a Node script that reads repo files, parses `calcRM` out
of `tandem.html`, runs it in a `vm` sandbox, and **can never inspect a live PL/pgSQL body**?

- **Option A** — DB is authority. Port Mayhew into PL/pgSQL. But that copy is structurally ungated.
- **Option B** — client is authority. DB computes only when the value arrives NULL.

---

## Advisor responses

### The Contrarian

Both options are wrong, because both accept the framing. Option B makes the competition moat
client-authored — the anon key is shipped in `tandem.html`, so "the client computes it" means
"anyone computes it". Option A re-runs the drift experiment that produced failure mode C in the
first place: two copies of one formula, one of them gated.

**The real defect isn't ordering — it's that ordering is controlled by names.** A rename to
`a_set_1rm_before_insert` works today and is defeated the first time someone adds
`audit_sets_before_insert`. There would be no diff to review, no test that fails. Fix it once:
ONE trigger calling both routines in explicit sequence, and move PR maintenance to `AFTER INSERT`
where it belongs — it is a side effect on another table, not a mutation of the row being written.

Also: "the gate has no DB connection" is a choice, not physics. Stand up a throwaway Postgres in CI
and apply the migrations to it.

Three things this investigation still owes: query prod logs for actual `23502` occurrences rather
than inferring them from session health; state plainly that the Mayhew branch has **never executed
in production**, so D12 is unverified end-to-end; and audit every other table for the same
alphabetical landmine, because nothing suggests `sets` is special.

### The First Principles Thinker

Wrong question. **Why is a derived value being stored, and written by anyone at all?**

`estimated_1rm_lbs` is not a fact about the world. It is an opinion about `(weight, reps)` under a
chosen formula. `personal_records` is not a record either — it is `max()` over 374 rows,
materialized and then allowed to drift from the rows it summarizes. The bug report describes three
symptoms; all three are downstream of one decision: making a derived value writable.

Make it non-writable — generated column or view — delete `update_personal_record()` entirely, and
compute PRs by query. Then failure mode A cannot occur (nothing to insert NULL into), B cannot
occur (nothing to compare), C cannot occur (one expression, one place). You do not need a trigger
order if you do not have triggers.

The gate question dissolves too: a checked-in `pg_dump` **is** a repo file. The gate reads repo
files. There was never an impedance mismatch — there was a habit of not checking the schema in.

**There is no formula emergency. There is only a write-path emergency.**

### The Expansionist

Take Option A, and treat the gate's blindness as the actual opportunity. A read-only Postgres role
in CI, `pg_get_functiondef()` diffed against a checked-in golden `.sql`, or — better — codegen the
PL/pgSQL from the same spec that produces the JS. One formula, two emitted artifacts, both gated.

The same capability closes the known D16 hole where `validate_science_overrides()` matches
`principle_key` with no template scope. That is two open bugs closed by one investment.

And take it **now**: backfill cost is zero. 374 rows, max reps 12, so the correct answer and the
current answer coincide on every row already stored. That window closes on the first 13-rep set
anyone logs. Add `rm_formula_version` to `sets` while you are in there, so the next formula change
is a data question instead of an archaeology question.

### The Outsider

I do not know what D12 is. Here is what I see: **the product is two people celebrating each other's
lifts.** Failure mode B is the app failing at the only thing it exists for. Someone hit a real PR,
the app said nothing, and the person they are competing with never saw it.

The word doing the damage in all three modes is **silently**. A hard error gets fixed in a day. A
silent wrong number gets trusted for months. Whatever you build, make disagreement visible.

And before any of this: **check whether `personal_records` is already wrong.** Recompute every PR
from the sets you already have and diff it against the table. If they match, this is a near-miss
and you can take your time on architecture. If they do not, you have a live data-integrity incident
and the architecture debate is a distraction.

I would vote Option B — put the number where the person is — but that vote is worthless until
someone runs the reconciliation.

### The Executor

Monday, in order:

1. **NULL-safety in `update_personal_record()`.** ~4 lines. Pure defect fix. No Notion round-trip,
   no doctrine change, no meeting. A set with an unusable 1RM must still be storable.
2. **Rename `set_1rm_before_insert` → `a_set_1rm_before_insert`.** Behaviour-identical on 100% of
   current traffic, because max reps is 12 and D12 specifies Epley at ≤12 anyway. That zero-delta
   window is real and it closes on the first 15-rep set.
3. **`calculate_1rm()` fills only when NULL.**
4. **Client-side: delete `s.est1rm || null` in both paths and recompute.**

Then instrument failed set INSERTs so you find out about this class of bug from a log, not from a
forensic session six weeks later.

The "how does the gate see Postgres" question is a real meeting. It is not Monday's meeting.

---

## Peer review round

*Anonymization used during review: A = Executor, B = Contrarian, C = Outsider, D = Expansionist,
E = First Principles. Reviewers saw only the letters.*

**Strongest-response votes:** Contrarian ×2, First Principles ×2, Executor ×1.

Blind spots that surfaced **only** in review:

1. **Generated columns will not work as proposed.** Postgres cannot `ALTER` an existing column into
   `GENERATED ... STORED` — drop and re-add only. Worse: once generated, **any INSERT that *sends*
   the column errors**, and both live client paths send it. VIRTUAL generated columns do not exist
   before PG18. That proposal ships a breaking change dressed as a cleanup.
2. **Every proposed DB gate relocates the blind spot rather than closing it.** Per this repo's own
   standing gotcha, files in `/migrations` are not necessarily applied to prod, and DDL run through
   `execute_sql` is not recorded in the migration ledger. A golden-SQL diff proves the repo agrees
   with itself. Also `pg_get_functiondef()` false-positives on PG version reformatting.
3. **Retroactive formula versioning rewrites competition history.** Recomputation silently restates
   past PRs and the points they awarded between two competing humans. Historical PRs may need
   freezing at the formula version in force. Product decision, not a migration.
4. **The 12→13 boundary must be verified explicitly**, or the first 13-rep set computes lower than
   a stored 12-rep PR — which reads to a user as one more silently dropped PR.
5. **Server-authority does not buy trust.** `weight_lbs` and `reps` are client-supplied through the
   same anon key. Moving the arithmetic server-side guarantees the arithmetic, nothing more.
6. **The client's direct `personal_records` upsert races the trigger** on the same unique key.
7. **Nobody separated the work by who can authorize it.** The NULL guard and the client fix are
   pure defect repairs. Generated columns, `AFTER INSERT`, and extending gate scope all change
   enforced-invariant surface and require **Notion → DOCTRINE.md → doctrine.mjs first**.
8. **Nobody ran the mandated should/could/did audit**, which CLAUDE.md requires for a D12-touching
   change.

---

## Evidence that arrived after the advisors wrote

The Outsider's demand was the only checkable claim in the room, so it was run immediately.
**`personal_records` is already wrong.** Recomputing every PR from the 374 stored sets under D12
and diffing against the table:

| Exercise | Earned | Recorded | Drift |
|---|---|---|---|
| Tricep Rope Pushdown | 112.0 | 103 | **−9.0** |
| Tricep Overhead Extension | 91.0 | 83 | **−8.0** |
| Cable Crunch | 70.0 | 64 | **−6.0** |
| Cable Low-to-High Fly | 56.0 | 51 | **−5.0** |
| Arnold Press | 56.0 | 51 | **−5.0** |
| Cable Lateral Raise | 35.0 | 32 | **−3.0** |

Every drift is negative — the signature of failure mode B, not of rounding. (~18 further rows
differ by ≤0.3, which is `Math.round` vs `round(x,1)` noise and is left alone.)

This is a live data-integrity incident, and per the Outsider it outranks the A-vs-B debate.

---

## Chairman's verdict

### Where the council agrees

**The alphabetical ordering is the mechanism, not the defect.** Four of five said some version of
this. Nobody defended the status quo, and — importantly — nobody defended the cheap rename as an
*endpoint*, only as a first step.

**The client already holds de-facto formula authority, by accident.** Option B is not a proposal;
it is a description of production. `s.est1rm || null` means the client decides, and when the client
declines to decide, the database's answer is the *pure-Epley, non-D12* one. The choice on the table
is whether to make that authority explicit and correct, or reverse it — not whether to create it.

**The NULL guard is unconditionally right.** It is the one change every advisor's architecture
wants, in every branch. It has no doctrine surface and no losing case: a set with an unusable 1RM
must still be storable, because losing the log is strictly worse than losing the estimate.

### Where the council clashes

**Scope.** The Executor wants four small changes shipped Monday. The Contrarian and First Principles
Thinker both argue that shipping the small fix is precisely how this bug survived its first review —
it patches the symptom and re-seals the mechanism. Both are right about different risks: the
Executor is right that data is being lost *now*, and the structuralists are right that the rename is
a trap.

They are reconcilable, and the peer reviewers found the key: **split the work by who can authorize
it**, not by how big it is. Defect repairs ship immediately. Anything that changes enforced-invariant
surface goes Notion-first.

**Whether the gate can be extended to Postgres.** The Expansionist says yes and it is the real prize.
Review demolished every concrete mechanism proposed — each one verifies a repo artifact that this
repo's own documented gotcha says may not match prod. The honest position is that this is currently
**unsolved**, and pretending a golden-SQL diff closes it is worse than admitting the gap.

**Whether to stop storing derived values at all.** The most intellectually satisfying answer and the
one review killed on a mechanical fact: generated columns break both live insert paths. The idea
survives as a direction; the implementation does not.

### Blind spots the council caught

The eight listed above, of which three change what ships: generated columns are a breaking change;
every proposed DB gate is a repo-vs-prod tautology; and retroactive correction touches a live
competition between two people, which is not an engineering decision.

The largest blind spot was collective — **four of five advisors debated architecture while the data
was already corrupt.** The Outsider was the only one who asked whether the harm had already landed,
and it had, on six exercises, by up to 9 pounds.

### The recommendation

**The Executor's sequencing, aimed at the Contrarian's target.**

1. **Ship the client fix now** (done, this commit). Recompute `estimated_1rm_lbs` from
   `(weight, reps)` in both write paths instead of reading a cached snapshot. Safe under every
   candidate architecture, removes the reachability path, and per review it must land *before* the
   DB change because migrations here are human-applied and can lag a push by days.

2. **One trigger, not a rename** (`migrations/0006`, written, not applied). Same migration cost,
   immune to the next alphabetically-earlier arrival. Fill the 1RM **only when NULL**, using the D12
   formula so the two copies cannot disagree, then do PR maintenance behind a NULL guard.

3. **Reject generated columns.** They break both live insert paths. Recorded with the reason, so it
   is not re-proposed in six months.

4. **State the gate's limit in the migration rather than papering over it.** The doctrine gate reads
   repo files and cannot see a live PL/pgSQL body. The DB's copy of D12 is structurally ungated. Say
   so in the file, ship a runnable probe alongside, and treat CI-database access as its own decision
   with its own budget.

5. **Reconcile the six drifted rows** (`migrations/0007`, written, not applied) — one-directional,
   upward only. A recorded PR *higher* than anything in `sets` is not this bug and must never be
   silently lowered. Whether to also restate the competition points those PRs would have awarded is
   escalated to Kerwin, not decided here.

The Contrarian's `AFTER INSERT` point is correct and is **not** taken in 0006: `is_pr` is a column
on the row being written, so PR detection must stay `BEFORE`. Moving the `personal_records` write to
`AFTER` while leaving `is_pr` in `BEFORE` is a real improvement and a real doctrine conversation.
Logged, not smuggled in.

### The one thing to do first

**Tell Dani that six of Kerwin's records were understated by up to nine pounds, before correcting
them.** Not the NULL guard — that ships in the same hour and needs no permission. The Outsider had
the sharpest read in the room: the product is two people celebrating each other's lifts, and this
bug quietly took six of those moments away. Fixing the number without saying so makes the app a
second thing that decided not to mention it.

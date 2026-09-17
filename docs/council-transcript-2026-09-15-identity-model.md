# LLM Council — Workout Identity Model

**Date:** 2026-09-15
**Topic:** How should Tandem model workout identity, and what ships first?
**Trigger:** BUG-93 investigation escalated from a day-pointer defect into a schema-level identity question. Per CLAUDE.md, an architecture fork with no clear winner is a council question, not a pick.

---

## Original question (Kerwin)

> "Wouldn't template days just run into the same problem? That a workout is queried on a 'day 2 of transform' plan, but then it's not actually wired into anything in the backend to be a uniquely found workout log for tracking progress across programs, one-offs, & journals"

Followed by:

> "yes, run the council on the identity model. Feel like we should also tag a date to the workout sets, so that when the 1rm is calculated, it can be tracked over time. 'Over the last few workouts, it's fluctuated, here's how we're going to fix this in the next phase of the workout' or 'we've plateaued at 255 as your 1rm - let's try something different.' Want the UI to read like this"

---

## Framed question put to the advisors

Tandem is a couples fitness-competition web app (2 real users). Single-file frontend + `programs.js`, Supabase/Postgres backend. Stated moat: "a cohesive, science-backed, periodized program that a biometric layer adapts."

**The decision: how should Tandem model workout identity — and what, if anything, should ship first?**

### Verified facts from production (all confirmed by running SQL, not inferred)

The database contains **two completely disconnected graphs, with ZERO foreign keys between them:**

- **Prescription:** `workout_templates → template_blocks → template_days → template_exercises → exercises`
- **Performance:** `users → workout_sessions → sets / personal_records`

The only bridge is text strings matched at runtime:

1. **`workout_sessions.day_type`** (text NOT NULL) holds a *positional ordinal* (`day1`..`day4`). Client does `prog.findIndex(d => d.key === lastDone.day_type)` then `prog[(idx+1) % prog.length]`. The stored string is a position into a **mutable client-side array not sourced from `template_days`**. Old-program `day1` and new-program `day1` are byte-identical. Prod holds **two incompatible vocabularies**: `day1`-`day4` (20 rows) and legacy `mon`/`thu` (6 rows). The legacy values return `findIndex === -1`, and the code guards `if (idx !== -1)` — so the pointer **silently never advances** for anyone whose latest completed session is a legacy row.

2. **`sets.exercise_name` / `personal_records.exercise_name`** — text, no `exercise_id`, no FK to `exercises`. 49/50 distinct names resolve in `sets`, 48/50 in `personal_records`. **Already drifted 3 times.** The orphan in `sets` is `tr-row` — 4 rows, **one flagged `is_pr = true`** — and it is *slug-shaped* where all 49 working values are *name-shaped*.

3. **`workout_sessions` has no `program_id` / `template_id` / `program_run_id`.** 16 columns; only `program_goal` (text) and `week_number` (int) are program-ish. Two runs of the same goal are indistinguishable.

**BUG-93 (live):** Kerwin started a new program 2026-09-10; the app served "Day 2" as his first workout. Confirmed by running: cloud-restore reads his *entire unscoped* history, finds 2026-08-04 `day_type = 'day1'` (from the PREVIOUS program), advances to `day2`. Proposed containment patch — scope by `session_date >= users.program_start_date` — tested against all 4 prod users: fixes Kerwin, no-op for the other 3. But `program_start_date` is nullable and a known separate bug says it is "never captured in onboarding."

**Also verified:** day-pointer write logic is **duplicated** at `tandem.html` ~7484 and ~8120. A 2026-09-13 fix edited those exact lines and the program-scope hole survived *because there were two copies*. `tandem_current_day` localStorage key: **1 reader, 3 writers, 0 deleters.**

### The near-term feature wanted

A 1RM-over-time coaching UI. **Verified largely buildable today:** `sets.created_at` 0 nulls/388, `session_id` 0 orphans, `estimated_1rm_lbs` 380/388. Real query returns Kerwin's Bulgarian Split Squat by session: **33.3 → 38.0 → 49.0 → 38.0**.

**But** the same query returns Ab Wheel Rollout: **3.2 → 0.0 → 0.0** (bodyweight; the catalog knows via `exercises.unit` / `one_rm_factor` but `sets` cannot reach it). **And `rpe` is NULL on all 388 sets.**

### Doctrine constraints
"One rule, one home" · "fix the mechanism, not the instance" · "wired is not working" · "verify by running" · the CI doctrine gate is a Node script that **can never see Postgres**. Scale: 2 users, 26 sessions, 388 sets, 3 months.

---

## Advisor responses

### The Contrarian

The containment patch is theater, and it fails twice over.

First: it keys on `users.program_start_date`, which a known bug says is "never captured in onboarding." A nullable column that is never populated makes `session_date >= program_start_date` either a no-op or a NULL-comparison that returns nothing. You tested it against 4 prod users and called it a fix — but you tested the *query*, not the *product*. Doctrine says verify at the surface the user sees. Did you check what that predicate does when the column is NULL for a brand-new user? That's the ship-blocker.

Second, and worse: `tandem_current_day` has **3 writers, 1 reader, 0 deleters**. Scoping the cloud-restore query cannot help, because nothing ever clears the local pointer when a program changes. You'd fix one of two paths and re-create BUG-93's exact shape — the same shape as the 2026-09-13 fix that died *because there were two copies*. You already have the precedent and you're walking into it again.

On the 1RM coaching UI — the fatal flaw isn't Ab Wheel showing 0 lbs. That's a cosmetic filter. The fatal flaw is that `rpe` is NULL on all 388 sets, so "we've plateaued, let's change the stimulus" is a claim the data cannot support — the opposite prescription (deload) produces an identical flat line. And Kerwin's split squat is 33.3 → 38.0 → 49.0 → 38.0: **four points**. That's noise. You are proposing to ship confident coaching narrative over four unverifiable points, to an app whose entire moat claim is "science-backed."

Ship RPE capture first. Without it the flagship feature is fabrication with a chart on it.

### The First Principles Thinker

You're asking "how should we model workout identity." That's the wrong question. The actual defect is that Tandem has no stored state — it *re-derives* "where am I" by inferring from an unscoped history log, every single time.

Strip it down. A pointer is a fact about now. Tandem stores no such fact; it reconstructs one by scanning all sessions ever, and reconstruction from an ambiguous log is guaranteed to be wrong eventually. `day_type = 'day1'` from August isn't a bad key — it's a *correct record of a past event* being misread as a *current position*. Adding `program_run_id` makes the reconstruction more accurate. It does not stop you reconstructing. The `session_date >= program_start_date` patch is the same mistake with a better filter, and it leans on a column a known bug says is never captured — you'd be deriving state from state you don't have.

Rebuild it: the cursor is a row. One owner, written on completion, read on open. That kills the 3-writers/1-reader/0-deleters localStorage sprawl and the two duplicated write sites — which is exactly why the 2026-09-13 fix failed.

Second reframe: the 1RM feature isn't blocked by schema. It's blocked because **you cannot state a true sentence.** "Ab Wheel Rollout plateaued at 0 lbs" isn't a rendering bug, it's the app asserting something false. And with `rpe` NULL on all 388 sets, "plateaued — change the stimulus" and "under-recovered — deload" are indistinguishable. The honest version of this feature is: loaded exercises only, and it reports the observation, not the prescription.

Third: 26 sessions, 388 sets, 2 users. Six legacy rows and one `tr-row` orphan is an afternoon of hand-correction, not a migration. Stop pricing this like a platform. The expensive thing is the missing *mechanism* — and since the doctrine gate can provably never see Postgres, the only enforcer that can is the database itself. Constraints, not scripts.

### The Expansionist

The undervalued asset is that you only have 26 sessions. Every migration cost in this decision is at its historic minimum today and rises forever after. You can hand-repair 388 set rows, hand-assign run IDs to 26 sessions, and hand-fix one `tr-row` orphan in an afternoon. At 2,600 sessions you cannot. Treating "two-person app" as a reason to defer is exactly backwards — it's the reason to do it now, cheaply, while the whole corpus fits in one screen.

The real prioritization rule: **capture is irreversible, structure is not.** `rpe` is NULL on all 388 sets — three months of the exact signal the moat claims to run on, permanently gone. You cannot backfill how hard a set felt. But `program_run_id` *is* backfillable: 26 sessions, two vocabularies, one date boundary. So ship RPE capture first — it's append-only, no migration, and it starts the clock on the only data you can never recover.

What's hiding behind `exercise_id`: it isn't bug-avoidance, it's a product unlock. Reaching `exercises.unit` and `one_rm_factor` doesn't just stop "Ab Wheel Rollout plateaued at 0 lbs" — it makes every set muscle-group-typed, which is the substrate for Kerwin-vs-Dani scoring on the same movement at different loads, per-muscle volume tracking, and injury-aware substitution. One FK, four features. Note the `tr-row` orphan is *slug-shaped* while all 49 working values are name-shaped — the system is already trying to become slug-keyed. Finish the move it started.

And `program_run_id` is the coaching feature. "We plateaued at 255, let's try something different" is a claim *about a phase*. Without run identity you can narrate sets; with it you narrate experiments — Block 1 vs Block 2, which stimulus worked. That's the periodization moat becoming visible instead of asserted.

### The Outsider

I don't know what "periodized" means, or "moat," or why a fitness app needs a "doctrine gate." Here's what I see as someone who just walked in.

Two people use this. Two. And one of them, on 2026-09-10, opened the app and was told to do Day 2 on day one. That's not a schema problem to a user — that's the app being *wrong out loud*. Kerwin doesn't know `findIndex` returned -1. He knows the thing lied to him.

So my question: why would a user care about workout identity at all? They wouldn't. They care about two things you've verified:

1. The app tells me the right workout today.
2. The numbers it shows me are real.

On #2 — you already know it will print **"Ab Wheel Rollout: plateaued at 0 lbs."** You know this *before shipping*. Please understand what that does to a person. Not "a data quality issue." It's the app confidently coaching them about a number that is visibly nonsense, in the one feature that's supposed to prove it's smart. One of those and the user stops believing the other 380 sets too. You cannot un-ring that.

And `rpe` is NULL on all 388 sets. So the app cannot tell "plateaued" from "tired." Those get opposite advice. Shipping a coach that can't tell those apart is worse than shipping no coach.

My blunt read: fix the lying day pointer, refuse to display 1RM for anything the catalog says is bodyweight (even if that means hardcoding a list of names today — ugly beats wrong), and start capturing RPE *now* so in three months you have something to coach with. Everything else is invisible to the only two humans involved.

### The Executor

Monday morning, in this order. Nothing else.

**1. Delete one of the two day-pointer writers (30 min).** Lines ~7484 and ~8120 in `tandem.html` are duplicates. The 2026-09-13 fix failed *because there were two copies*. You cannot fix anything about day identity while two copies exist. One function, both call sites. This is the "fix the mechanism" doctrine applied with a text editor, not a migration.

**2. Ship the `session_date >= program_start_date` scope patch (1 hr).** You already tested it against all 4 prod users: fixes Kerwin, no-op for the rest. Ship it. `program_start_date` being nullable is the *next* ticket — backfill it for 2 users with a hand-written UPDATE. Two rows. You know both people. Stop treating a 2-user backfill like a data-migration project.

**3. Fix the 6 legacy `mon`/`thu` rows with an UPDATE (15 min).** Six rows. Map them to `day1`-`day4` by position and the silent `findIndex === -1` dead pointer stops existing. Also update the one `tr-row` set row to its name-shaped value — it carries an `is_pr = true` flag that is currently invisible.

**4. For the 1RM UI: hardcode a bodyweight denylist in `programs.js` this week.** Do NOT add the FK to `exercises` first. Ab Wheel Rollout showing "plateaued at 0 lbs" is fixed by not rendering 1RM for exercises whose 1RM is zero across all sessions. That's a filter, not a schema.

**5. Add an RPE input to the set logger before you ship any plateau copy.** You have zero RPE rows. Without it the feature says "change the stimulus" when the answer is "deload." Ship the RPE field, collect 3 weeks, *then* write the coaching narrative.

Run-identity modeling: not Monday. Not this month. It has no first step that produces a visible change for two users.

---

## Anonymization mapping (revealed)

| Letter | Advisor |
|---|---|
| A | The Expansionist |
| B | The Executor |
| C | The Contrarian |
| D | The Outsider |
| E | The First Principles Thinker |

## Peer review tally

| | Reviewer 1 | Reviewer 2 | Reviewer 3 | Reviewer 4 | Reviewer 5 |
|---|---|---|---|---|---|
| **Strongest** | E | E | E | E | E |
| **Biggest blind spot** | B | A | A | B | A |

**E (First Principles) was picked strongest by all five reviewers — unanimous.** Blind spot split 3–2 against A (Expansionist) and B (Executor).

## Peer reviews

**Reviewer 1 —** Strongest: **E.** The only one that reframes correctly — the defect isn't key design, it's that "where am I" is *re-derived* from an ambiguous append-only log instead of stored. That diagnosis subsumes BUG-93, the two duplicated writers, and the localStorage sprawl, and it correctly notes the `program_start_date` patch just makes a bad reconstruction more accurate. Its closing point — the doctrine gate can never see Postgres, so constraints must be the enforcer — is the only answer aligned with Tandem's own D17 finding. Biggest blind spot: **B.** Best sequencer but ships step 2 without addressing that the column is never populated, so the predicate is untested at the surface. B also proposes a hardcoded bodyweight denylist while `exercises.unit`/`one_rm_factor` already encode that fact — a textbook "one rule, one home" violation, and B never notices it's recommending a silo. All missed: nobody asked what `day_type` should *mean*. It's simultaneously a historical record and a cursor — that conflation is the root cause, and the fix is to stop overloading it, not to add scoping. Also unexamined: whether "plateau" is even definable at 4-point scale, and whether writing sets with `exercise_id` going forward (no backfill) beats both the FK migration and the denylist.

**Reviewer 2 —** Strongest: **E.** The only one that reframes correctly — the defect isn't key vocabulary, it's that "where am I" is re-derived from an ambiguous event log instead of stored. That diagnosis subsumes BUG-93, the 3-writers/0-deleters sprawl, and the duplicated write sites as one mechanism, which is exactly what "fix the mechanism, not the instance" demands. Biggest blind spot: **A.** Advocates the `exercise_id` FK as "one FK, four features" but never confronts that 388 `sets` rows carry name-shaped text while the one orphan is slug-shaped — the join key is ambiguous *today*, and A calls it "the system trying to become slug-keyed" rather than evidence of two competing vocabularies with no resolver. It also asserts `program_run_id` is backfillable across "one date boundary" without noticing that boundary is `program_start_date`, the column C and E correctly flag as never captured. All missed: nobody asked whether the 2026-09-10 program change is even *recorded* anywhere. Without it, run-identity backfill has no source of truth — and D's "ugly beats wrong" denylist silently duplicates `exercises.unit`, violating one-rule-one-home.

**Reviewer 3 —** Strongest: **E.** It reframes correctly and explains why the 2026-09-13 fix failed. It also lands the doctrine point the others miss: the gate can't see Postgres, so constraints must be the enforcer. B is second — the only genuinely sequenced plan. Biggest blind spot: **A.** It argues "migration is cheapest now" and then sequences RPE first, deferring the very backfill it just proved is cheap — internally inconsistent. It also never engages the two-writer duplication or the 0-deleters pointer, which is the actual reason BUG-93 survived a fix. All missed: nobody asked what the *second* user experiences. Dani's sessions share the same unscoped-history logic; the patch was called "no-op for others," which may mean "not yet triggered," not "safe." Also unaddressed: `day_type` should probably become an FK to `template_days`, retiring positional ordinals entirely — every response accepted the text-ordinal framing. And no one proposed a prod-schema assertion runner to cover the gate's blindness.

**Reviewer 4 —** Strongest: **E.** The bug isn't a bad key, it's that Tandem stores no cursor and re-derives position from an ambiguous log every open. B is the best *execution* plan; E is the best *reasoning*. Biggest blind spot: **B.** It ships the `program_start_date` patch as step 2 while conceding the column is never captured — C and E both show that predicate is NULL-fragile for exactly the new-program case BUG-93 lives in. B also defers run identity "not this month" without noticing A's point that backfill cost is at its lifetime minimum at 26 sessions. All missed: nobody asks what the *frontend writes* on program start — `tandem_current_day` has 0 deleters, so even a perfect DB cursor gets shadowed by stale local state. No one proposes the migration-order/rollback sequence, or a doctrine amendment making "no derived cursor" a DB-enforced invariant. And the `tr-row` orphan carries `is_pr = true` — a corrupt PR, not a cleanup chore.

**Reviewer 5 —** Strongest: **E.** It draws the right product line — report the observation, not the prescription. Biggest blind spot: **A.** It argues "migrate now while it's cheap," but never addresses that *no mechanism* prevents re-corruption. Backfilling `program_run_id` onto 26 sessions with two duplicated writers and a 0-deleter localStorage key means you hand-repair data that immediately re-drifts. All missed: nobody asked what happens to *Dani's* pointer, or how a 2-user competition app behaves when the two users are on different runs — every fix is scoped to Kerwin's row. Also unexamined: who writes `program_start_date`, and whether `startOrResumeSession()`'s live set-writes are affected by any pointer change.

---

## COUNCIL VERDICT

### Where the Council Agrees

**1. RPE is the emergency, and it is the only irreversible one.** Four of five advisors converged on this independently. `rpe` is NULL on all 388 sets — three months of the exact signal the "biometric layer adapts" moat claims to run on, permanently unrecoverable. You cannot backfill how hard a set felt. Every other defect in this document can be repaired later at higher cost; this one cannot be repaired at all.

**2. The 1RM coaching feature as specified cannot ship honestly.** The Contrarian, the Outsider, and First Principles reached this separately. Without RPE, "plateaued — change the stimulus" and "under-recovered — deload" are opposite prescriptions producing an identical flat line. The app would be asserting something it cannot know.

**3. The duplicated writers must collapse before any day-pointer fix.** Executor, Contrarian, and First Principles all name it. The 2026-09-13 fix edited those exact lines and failed *because there were two copies*. Any fix shipped into a two-copy structure inherits the same failure.

**4. The containment patch is weaker than it was presented.** Both C and E independently attacked `session_date >= program_start_date` on the same grounds: it derives state from a column a known bug says is never captured. It was tested as a *query*, not at the surface the user sees.

### Where the Council Clashes

**Migrate now vs. defer — and both sides have a real argument.**
The Expansionist: 26 sessions is the lifetime minimum cost of this migration; every day it rises. The Executor: run-identity modeling has no first step that produces a visible change for two users — not Monday, not this month. Three reviewers sided against the Expansionist, but on *internal inconsistency* (it argues migrate-now then sequences RPE first) and on *durability* (backfilled data re-drifts if the mechanism isn't fixed), **not** on the economics. The economic point survived unrefuted.

**Denylist vs. catalog for the bodyweight filter.**
Executor and Outsider both say hardcode a list — "ugly beats wrong." Two reviewers independently flagged this as a **"one rule, one home" violation**: `exercises.unit` and `one_rm_factor` already encode which movements are loaded. Doctrine decides this one, and it decides against the denylist. A hardcoded list is exactly the silo that produced the `day_type` problem being debated.

### Blind Spots the Peer Round Caught

**The root cause nobody stated in round one: `day_type` is simultaneously a historical record and a cursor.** As a record of what was performed on 2026-08-04, `day1` is *correct*. The bug is reading that historical fact as a statement about where the user is *now*. This reframes the whole fix — scoping the query better still reads history as position. Stop overloading the column.

**Nobody asked about Dani.** Every proposed fix was validated against Kerwin's row. "No-op for the other 3 users" may mean "not yet triggered," not "safe." And a two-person *competition* app where the users are on different program runs is an unexamined case.

**The backfill has no source of truth.** If `program_run_id` is to be assigned retroactively, what records that Kerwin changed programs on 2026-09-10? If the answer is `program_start_date`, the backfill depends on the same uncaptured column the patch does.

**Zero deleters defeats a perfect database.** Even a correct server-side cursor gets shadowed by stale `tandem_current_day` localStorage, because no code path clears it.

**`tr-row` is a corrupt PR, not a cleanup chore.** It carries `is_pr = true` on an exercise the catalog cannot resolve — a personal record that is invisible to every future comparison.

**Forward-only may beat both options.** Writing `exercise_id` and `template_day_id` on new rows only — nullable, no backfill — costs nearly nothing and makes all future data clean. Nobody proposed it in round one.

### The Recommendation

**Side with First Principles on the diagnosis, the Contrarian on the sequence gate, the Expansionist on economics — and reject the Executor's denylist outright.**

Do not add `program_run_id` yet. Do not ship the containment patch as written. Do this:

1. **Ship RPE capture on the set logger.** Append-only, no migration, no dependency on anything else in this document. It is the only item losing value permanently every day.
2. **Collapse the two day-pointer writers into one `resolveCurrentDay()`.** Precondition for every subsequent fix. 30 minutes.
3. **Stop deriving the cursor. Store it.** A `current_day_key` owned by one writer, written on session completion, read on open — and give it the **deleter it has never had**, fired on program start. This subsumes BUG-93 rather than filtering around it.
4. **Go forward-only on identity.** New `sets` rows write `exercise_id`; new `workout_sessions` write `template_day_id`. Nullable, no backfill, near-zero cost. Repair the 6 legacy rows and the 1 `tr-row` PR by hand — that is an afternoon at this scale, and the Expansionist is right that it never gets cheaper.
5. **Gate the 1RM UI on `exercises.unit`, not a hardcoded list** — one rule, one home. And ship it as *observation*, not prescription, until RPE data exists.
6. **Enforcement must live in Postgres.** The doctrine gate provably cannot see the database (this is D17's existing finding). A constraint is real; a Node script asserting a schema it cannot read is theater.

### The One Thing to Do First

**Add the RPE input to the set logger and ship it.**

Not because it is the most interesting problem — it isn't — but because it is the only one where delay destroys something permanently. Every day without it is a day of training data that can never be reconstructed, in the exact signal the product's core claim depends on. The day-pointer work is larger and better-understood; it will still be fixable next week. The three months of missing RPE will not.

# Council transcript — 2026-10-05 — D11 retraction scope

**Question owner:** Kerwin (attended session)
**Trigger:** `CLAUDE.md` — "When two tables both claim the same rule, that is a doctrine question — run
`llm-council`, do not pick." Kerwin's own instruction in the build request: *"If the recompute conflicts
with an ACTIVE invariant, stop and run llm-council rather than picking."*

---

## 1. The original question

Build Edit/Delete of a set from the History modal. Kerwin pre-made one decision: *"After a delete or
edit, stored best / working 1RM go **down** to match what remains."* That recompute lowers a stored
working 1RM, and D11 (ACTIVE, SAFETY tier) says in its own text that the running max is one-sided and
"a fatigued session can only fail to raise a number, **never lower one**."

## 2. The framed question put to all five advisors

> Tandem is a couples fitness app (single-file `tandem.html` + `programs.js`, Supabase backend). It is
> governed by a written, gated doctrine (`DOCTRINE.md`, enforced by `scripts/doctrine.mjs`, which runs
> in CI and blocks any PR that violates an ACTIVE invariant).
>
> **The feature being built (attended, explicitly requested by the owner Kerwin):** an Edit/Delete
> control on each set in the History modal. Kerwin has a ghost set in his local history —
> `Good Morning 905 lbs x 12` (Epley-estimated 1RM 1267 lbs). It is physically impossible and it is NOT
> in Supabase; verified read-only queries show Supabase `sets` tops out at `135 x 10` (est 180) and
> `personal_records` = 180 for that lift. The 905 exists ONLY in the browser's localStorage cache
> (`tandem_history`), because the cloud-hydrate path is add-only and nothing ever prunes a local entry
> the cloud lacks. He tried to correct it in the UI and could not — the History modal is read-only.
>
> **The doctrine conflict.** Invariant **D11** is ACTIVE and classified SAFETY tier (meaning: no
> override is ever authorized). Its text says:
>
> > "Monotonic progressive overload: the prescribed %1RM curve rises-or-holds every week and never
> > dips. The 1RM driving the prescription is a **measurement** of real performance (running-max
> > `calcRM`), never a scheduled ±% ratchet. **Scope (amended 2026-09-14):** because it is a
> > measurement, every measured lift binds it, regardless of whether the session was part of the
> > periodized program. Two structural conditions make this safe and are both gated: the running max
> > is **one-sided** (`best <= prior` returns, so a fatigued session can only fail to raise a number,
> > never lower one), and the day object is passed explicitly."
>
> The gate (`scripts/doctrine.mjs`) enforces this with a **text assertion** on one specific function:
> it greps `reconcileWorking1RMs()` for the literal string `if (best <= prior) return;` and fails with
> the message *"the one-sided working-1RM guard is gone — a fatigued session could now LOWER a
> measured max, which is the monotonicity D11 forbids and the reason a one-off is safe to credit at
> all."*
>
> **The proposal.** When the user deletes (or edits down) a logged set, recompute that exercise's local
> stored best PR (`tandem_prs`) and working 1RM (`tandem_working1rm`) from the sets that REMAIN — which
> can LOWER both. Rationale offered: D11 says the 1RM is a measurement of real performance, and a set
> that was never real is not a performance. Cloud `personal_records` is monotonic in the database and
> the app cannot lower it, so it would be left alone and reported.
>
> **The two readings in tension:**
> - **(A) Outside D11's scope.** One-sidedness is a property of the *accumulation operator over the set
>   of real measurements*. Deleting a set that was never real changes the **input set**, not the
>   operator. The result is still a running max, just over a corrected record. D11 forbids a *new,
>   weaker measurement* from lowering a number; it says nothing about *retracting a false entry*.
> - **(B) A D11 violation.** "Never lower one" is literal and SAFETY-tier. Any code path that lowers a
>   stored working 1RM violates it, and the invariant must be formally amended (Notion first, then
>   DOCTRINE.md + doctrine.mjs together) before such a path can ship.
>
> **Why this matters / what's at stake.** Note the gate's blind spot: because the gate only text-checks
> the *inside of one named function*, a NEW separate lowering function would pass CI fully green while
> (under reading B) a live SAFETY-tier doctrine violation sits in the product. This project has a
> documented, repeated failure mode of exactly this shape — a rule silo'd away from its gate, green CI,
> silent wrongness for weeks. The project's own rules say a doctrine ownership/amendment question must
> go to this council rather than being decided by the implementing agent.
>
> **The question for the council:** Is the proposed recompute-downward inside or outside D11's scope?
> If outside, where should the rule live, how should it be stated, and what should gate it so it cannot
> drift? If inside (i.e. a violation), what exactly must be amended, and is the amendment correct on
> the merits?

## 3. Facts verified in code mid-council (established, not argued)

These were checked between the advisor round and the peer-review round, because the Contrarian's
strongest objection was an empirical claim:

- `tandem_working1rm` is **device-local**: `grep -n "working_1rm" tandem.html` returns **zero hits**;
  the comment at `tandem.html:6384` states it is "never written to Supabase, never hydrated from it."
  Migration 0011's `working_1rm` column is unused by the app. So lowering it IS durable.
- **But** `earnedOneRM()` (`tandem.html:6400`) returns `Math.max(working, prs)`, and `tandem_prs` is
  merged UP from cloud `personal_records` at **`tandem.html:8419`** and **`:9800`**, both guarded
  `if (v > prs[name]) prs[name] = v`.
- **Consequence:** a local lowering is durable **only when cloud `personal_records` is not higher**.
  Kerwin's exact case survives (cloud = 180 → `max(180,180) = 180`). For any exercise where the deleted
  set WAS the cloud PR, the next login/restore silently re-raises it — the deletion undoes itself.
- `tandem.html:6394-6397` already carries a flagged caveat that `earnedOneRM` "presumes the working 1RM
  is never DELIBERATELY held below the all-time PR… If a detraining/layoff regression is ever added —
  a real training concept — that design must revisit this function first." This change would be the
  first such mechanism.

## 4. Advisor responses (de-anonymized)

### The Contrarian — anonymized as Response C

**The fatal flaw: you are debating doctrine about a feature that doesn't fix the bug you have.**

The 905 exists because the hydrate path is add-only and never prunes local entries the cloud lacks, and
because nothing rejected `905 x 12` at entry. A delete button fixes *this one ghost*. The next one needs
another button press. That is textbook fix-the-instance-not-the-mechanism, the exact rule this repo
already has in writing. The real fixes are (1) a reconcile that prunes local-only sets, and (2) an
entry-time plausibility bound. Neither touches D11.

**Reading A collapses under one question: what distinguishes "a set that was never real" from "a set the
user wants gone?"** Nothing. At runtime there is no truth oracle — there's a button. A's whole argument
rests on "corrected input set," but the code cannot verify the correction. So you haven't changed the
input set; you've handed the user a downward ratchet on their own measured max. In a *competition* app
between two people whose progression difficulty is driven by that number. The incentive to lower it is
structural, not hypothetical. That is squarely inside D11, and SAFETY tier means it does not ship on a
clever scope argument.

**Second flaw nobody's raised: it won't even work at the pixel.** Cloud `personal_records` stays 180,
monotonic, unlowerable. Local drops. Next hydrate the number climbs back and the user watches their
deletion undo itself — a toast saying "fixed" over a value that wasn't. That's `reorderWeek()` again.

**If you amend anything, amend the gate first:** enumerate every writer to
`tandem_working1rm`/`tandem_prs` and assert the one-sided guard across all of them. A grep inside one
function is not an invariant; it's a comment with CI privileges.

### The First Principles Thinker — anonymized as Response E

You're asking a doctrine-scope question about a data-integrity bug. Wrong question.

Strip it down. What are you actually trying to solve? **The local cache can contain records that never
happened, and nothing can remove them.** The 905 isn't a bad measurement. It isn't a measurement at all.
It's a cache artifact of an add-only hydrate path. D11 is a theory of how measurements compose; this
value never entered the measurement domain, so D11 has literally nothing to say about it, and arguing
(A) vs (B) is arguing about which law governs a thing that isn't in either jurisdiction.

Notice what the real defect is: the hydrate path is add-only. Local can hold what cloud denies, forever,
with no reconciliation. An Edit/Delete button is a manual workaround for a sync engine that has no
concept of *authoritative source*. Build the button if Kerwin wants it — but if that's all you build,
the next phantom arrives the same way and he files the same bug again. Fix the mechanism: local history
must be reconcilable against cloud, which already holds 135×10.

And reframe the invariant. D11 says "never lower one," which conflates two different things:
**monotonicity of the max operator** (correct, SAFETY) and **immutability of stored history** (never
argued for, never cited, accidentally smuggled in by the word "never"). That conflation is the actual
bug in your doctrine. The right rule isn't "numbers never go down" — it's *"derived values are never
authoritative; they are always recomputable from the set of real measurements."* Under that framing,
recompute-downward on deletion isn't an exception you have to carve out. It's the invariant working
correctly.

Amend for the right reason: D11 was underspecified, not wrong.

### The Expansionist — anonymized as Response A

**Reading A is right, but you're all asking too small a question.** The real find here isn't "can we
delete a set" — it's that D11 has been silently missing a whole half of itself. D11 governs the
*operator*. Nothing in the doctrine governs the **provenance of the inputs**. That's the gap, and it's
worth far more than this one ghost set.

Name it now: **D35 — Retraction.** A measurement can be retracted; retraction recomputes the max over
the surviving record. One rule, one home: a single `recomputeBestFrom(sets)` function that every
lowering path must call — no exceptions, no second entrance. Gate it the way check #27 gates D34: not a
text-grep (that's the blind spot you already identified), but a *behavioral* assertion — feed it a set
list, assert the recomputed max equals `max(remaining)` exactly, and assert that no path lowers a max
without a retraction event in the audit log.

That audit log is the undervalued asset. Once retraction is a first-class, logged event, you get things
you can't get today:
- **The cloud divergence becomes measurable.** The 905 ghost proves the hydrate path is add-only and
  silently lies. Retraction events give you a reconciliation primitive — local-vs-cloud drift detection,
  which is a *whole class* of bugs you currently can't see.
- **Dani can dispute Kerwin's PRs.** This is a competition app. A couples-facing "flag this lift" flow
  turns a data-integrity chore into the product's most social feature.
- **Edit/Delete on sets is the entry point to a real set editor** — correcting reps, fixing a mis-tapped
  exercise. The modal becomes write-capable once, and everything downstream benefits.

Don't amend D11. Extend the doctrine with the axis it never had, and ship the mechanism, not the
instance.

### The Outsider — anonymized as Response B

I know nothing about exercise science, and that's useful here, because a stranger reading your own words
hits a wall immediately:

**D11 is two different rules wearing one name.** Read it cold. The headline is about a *prescription
curve* — "the prescribed %1RM curve rises-or-holds every week." That's a statement about what the
program tells the user to lift. Then there's a parenthetical mechanism about `calcRM` being one-sided.
Those are not the same claim. A fresh reader cannot tell which one the gate is protecting, because the
gate greps a string inside one function and the failure message talks about "a fatigued session," which
is a *third* thing — an input-provenance condition, not an operator property.

So the honest answer to "is this inside D11's scope?" is: **nobody can tell, and that's the actual
defect.** You're arguing about the intent of a sentence that bundles a goal, a mechanism, and a threat
model together. Reading A and reading B are both legitimate because the text supports both. That's not a
tie to break; that's a specification bug.

What an outsider would do: split D11 into the two rules it already contains. One about prescriptions
never dipping. One about the measurement operator. Then the delete case answers itself — it's clearly not
the first, and whether it's the second depends on a question you haven't written down anywhere: **is a
logged set authoritative, or is it a claim that can be retracted?** That's the real invariant you're
missing, and it's absent from the doctrine entirely.

Also, plainly: the gate checks that a *string* exists. That isn't enforcement, it's a spelling test. Any
rule worth SAFETY tier should be checked by behavior.

### The Executor — anonymized as Response D

Reading A is correct but it doesn't matter yet, because you've conflated two shippable units and one of
them is a five-minute job.

**Monday morning, 9am: unblock Kerwin without touching D11 at all.** The 905 lb set is a corrupt cache
entry in one browser. Open devtools on his machine, `delete` the entry from `tandem_history`, and delete
the `tandem_prs`/`tandem_working1rm` keys for Good Morning so the next hydrate re-derives them from
Supabase (135x10 → 180). Done. No PR, no gate, no council artifact in the critical path. Do that first
and stop treating the feature as the fix for the symptom.

**9:15am: the real bug is the hydrate path, not the missing Edit button.** Add-only hydrate that never
prunes local entries the cloud lacks is the mechanism; the ghost set is the instance. A
reconcile-on-hydrate that drops local sets with no cloud counterpart fixes *every* ghost, for both
users, forever — and it never lowers a 1RM from a *measurement*, it lowers it by removing a non-record.
That ships under reading A with far less doctrine surface than a user-facing delete button, because the
trigger is "cloud is authoritative," not "user said so."

**Then, and only then, the Edit/Delete feature.** It needs the amendment, so don't start it before the
Notion/DOCTRINE/doctrine.mjs change is merged.

The gate work is the one thing you cannot defer or hand-wave: text-grepping the inside of one named
function is not a gate, it's a comment. Whatever you write next must assert over *all* writers of
`tandem_working1rm`/`tandem_prs` — enumerate the write sites and fail on an unregistered one. Otherwise
you've built the silo this question is about.

## 5. Peer reviews (anonymized at the time)

**Mapping revealed:** A = The Expansionist · B = The Outsider · C = The Contrarian · D = The Executor ·
E = The First Principles Thinker.

**Unanimous:** all five reviewers picked **C (Contrarian)** as strongest and **A (Expansionist)** as the
biggest blind spot.

### Review 1

1. **Strongest: C.** It's the only response that traces the fix to a pixel: cloud `personal_records`
   stays 180 and both merge sites are `if (v > prs[name])`, so a local lowering gets silently re-raised
   on next hydrate — a `reorderWeek()`-shaped "toast over a value that wasn't." It also kills Reading A's
   premise with one question (no runtime oracle distinguishes "never real" from "want it gone"), and
   names the competition-app incentive to self-lower. D reaches similar conclusions but its "9am devtools
   fix" is unverified and leaves no artifact.
2. **Biggest blind spot: A.** It spends its length on product upside (Dani disputing PRs, a social flag
   flow) and never asks whether lowering survives hydrate — the same defect it claims to be fixing. Its
   proposed gate ("no path lowers a max without a retraction event") constrains *logging*, not the
   lowering itself, so it would pass with the ghost's twin in place. It also invents D35 without the
   mandated Notion-first ordering.
3. **All five missed:** nobody asked what else the 905 already contaminated — prescribed
   `seedWeight`/progression already issued, the 1RM-trend star, streaks, calibration rows — or whether it
   reached Dani's comparison surface. And none produced the required should/could/did audit, which is the
   gating artifact here, not a verdict.

### Review 2

1. **Strongest: C.** It's the only one that interrogates the mechanism at the surface: no runtime oracle
   distinguishes "never real" from "user wants it gone," so reading A's "corrected input set" is a
   fiction — it's a button. And it's the only one naming the competition incentive to lower a number that
   drives progression difficulty. Its gate critique ("a comment with CI privileges") is the sharpest line
   here. One correction: C's pixel claim overshoots. Deleting *this* ghost resolves to exactly 180 via
   the `v > prs[name]` cloud merge — correct, not self-undoing. The undo-itself failure applies only to
   deletions below cloud's floor.
2. **Biggest blind spot: A.** It answers a data-integrity bug with a new D-number, an audit log, and a
   Dani-disputes-Kerwin social feature. It never asks whether a lowered value survives the next hydrate,
   never engages the no-oracle problem, and asserts reading A without argument. "Ship the mechanism"
   while proposing the largest net-new surface of the five.
3. **All five missed:**
   - **The non-destructive option.** A syncing tombstone/exclude flag fixes the display and the
     derivation while keeping measurement history append-only — neither reading A's scope gymnastics nor
     reading B's amendment required.
   - **`tandem_working1rm` is device-local and never synced**, so the two phones can disagree on earned
     1RM permanently. No one priced that.
   - **Entry-time**: nothing checks whether `905x12` was even reachable via `logSet`, or whether the 1267
     already corrupted prescribed loads in-product.

### Review 3

1. **Strongest: C.** It's the only response that traces the proposal to a pixel using the verified facts:
   `tandem_prs` merges from cloud with `if (v > prs[name])` and cloud `personal_records` = 180 is
   unlowerable, so a local deletion silently reverts on next hydrate — `reorderWeek()` again. It also
   destroys A's core argument with one question (no runtime truth oracle distinguishes "never real" from
   "wanted gone") and names the competition-app incentive to ratchet down. Its gate critique — enumerate
   all writers, not grep one function — is the actionable fix.
2. **Biggest blind spot: A.** It never asks whether lowering even persists, then proposes *expanding* the
   lowering surface into a social "Dani disputes Kerwin's PR" feature — manufacturing precisely the
   adversarial downward path D11's SAFETY tier exists to forbid. An audit log records a violation; it
   doesn't license one.
3. **All five missed:**
   - **Prune-on-hydrate (D, E's "real fix") destroys legitimately offline-logged sets** that never
     reached Supabase. Add-only may be deliberate.
   - **The correct mechanism nobody proposed: a synced tombstone/void flag** so the *cloud* recomputes
     `personal_records`. Any local-only retraction is cosmetic given `earnedOneRM = max(working, prs)`.
   - **No one checked whether a PR-lowering path already exists** server-side or in the two merge sites.

### Review 4

1. **Strongest: C.** It is the only response that traces the proposal to the pixel. Given the verified
   fact that `tandem_prs` merges cloud-up at two sites with `if (v > prs[name])` and
   `earnedOneRM() = Math.max(working, prs)`, a local-only deletion is resurrected on the next hydrate —
   the feature ships a toast over a value that didn't change, which is `reorderWeek()` exactly. C also
   kills reading A cleanly: at runtime there is no oracle distinguishing "never real" from "want it
   gone," only a button, and in a competition app the incentive to lower is structural.
2. **Biggest blind spot: A.** It spends the whole answer building new doctrine (D35, retraction, audit
   log) and product features on top of a path that cannot work as described — it never checks whether the
   lowered value survives hydrate, and it proposes "one home, `recomputeBestFrom()`" without noticing the
   second input (`prs`, cloud-fed, monotonic) that `Math.max` will override. Doctrine scaffolding over an
   unverified mechanism.
3. **All five missed:** D11 is SAFETY-tier, so per D16's `tierGuard` no override key exists — under
   reading B the feature *cannot* ship at all, making "A is correct" a bet the council has no authority to
   settle; and nobody asked whether cloud `personal_records`/`sets` need a delete path, or extended the
   prune fix to the other add-only local keys (`lastsets`, `streaks`).

### Review 5

1. **Strongest: C.** It is the only response that checks the surface the user sees. Given the verified
   facts — `tandem_prs` merges up from cloud at two sites via `if (v > prs[name])`, and
   `earnedOneRM() = Math.max(working, prs)` — a local-only lowering is *undone on the next hydrate*. C
   names that as another `reorderWeek()`: a toast claiming success over a value that reverts. It also
   kills Reading A cleanly ("at runtime there is no truth oracle, there's a button") and notes the
   competition-app incentive to ratchet down. Its gate prescription (enumerate all writers of
   `tandem_working1rm`/`tandem_prs`) is the right fix for the stated blind spot.
2. **Biggest blind spot: A.** It invents D35, a retraction event, an audit log, and a Dani-disputes-PRs
   social feature — none cited, none traced to a pixel — while missing that cloud merge-up defeats every
   lowering path it proposes. D is close behind: its 9am devtools fix assumes the next hydrate
   "re-derives" from Supabase, but hydrate is add-only and merge-up-only; it won't.
3. **All five missed:** nobody asked whether cloud is actually authoritative. A local-only set may be a
   *failed write*, not a phantom. Pruning local-minus-cloud (C, D, E's core fix) silently destroys
   legitimately unsynced offline sessions — the inverse data-loss bug. Also unasked: what else the 1267
   already contaminated (prescriptions, streaks, head-to-head scoring).

## 6. Chairman synthesis

### Where the Council Agrees

All five advisors and all five reviews converge on one point, and it is not the question asked: **the
gate is not a gate.** Text-grepping `if (best <= prior) return;` inside one named function proves a
string exists. It proves nothing about any other writer to `tandem_working1rm` or `tandem_prs`. Every
advisor independently reached the same prescription: enumerate the write sites, assert behaviorally over
all of them, fail on an unregistered writer. That is the only unanimous, unconditional deliverable here.

Second agreement: **D11's text bundles three distinct claims** — a prescription-curve rule, a
max-operator rule, and an input-provenance threat model ("a fatigued session"). The Outsider states it
most plainly, First Principles states it most usefully ("monotonicity of the max operator" vs
"immutability of stored history," the latter never argued for and smuggled in by the word *never*).
Readings A and B are both textually defensible, which means this is a specification defect, not a tie.

Third agreement: **the delete button is the instance; the add-only hydrate is the mechanism.**
Contrarian, Executor, and First Principles all name it. The repo already has this rule in writing.

### Where the Council Clashes

**Is lowering durable at all?** The Expansionist builds D35, a retraction event, an audit log, and a
Dani-disputes-Kerwin social feature on top of a path four reviews show cannot work as described:
`earnedOneRM()` returns `Math.max(working, prs)`, and `prs` is merged up from cloud at two sites, both
`if (v > prs[name])`. Any local lowering of an exercise whose deleted set *was* the cloud PR silently
re-raises on next hydrate. The Expansionist never checked. This is the council's clearest error, and
Review 4 lands the killing detail: "one home, `recomputeBestFrom()`" ignores the second input that
`Math.max` will override.

**Review 2 correctly narrows Contrarian's strongest claim.** Contrarian says the feature "won't work at
the pixel" and the user watches the deletion undo itself. For *Kerwin's exact case* that is wrong: cloud
is 180, local recompute lands on 180, `max(180,180)=180` — it resolves correctly and permanently. The
self-undo applies only to deletions that would push below the cloud floor. Contrarian overshot; the
diagnosis still stands as a general caveat, not as a reason this ghost can't be removed.

**Prune-on-hydrate is not safe.** Executor, First Principles, and Contrarian all land on "prune local
sets the cloud lacks." Reviews 3 and 5 kill it: a local-only set may be a **failed write or an offline
session**, not a phantom. Add-only may be deliberate. Shipping a blind prune trades a visible phantom for
invisible data loss — the inverse bug, and worse, because nobody files it.

**Executor's 9am devtools fix is wrong on its own terms.** It assumes deleting
`tandem_prs`/`tandem_working1rm` lets the next hydrate "re-derive" from Supabase. Hydrate is add-only and
merge-up-only (Review 5). Deleting the keys and re-hydrating does land at 180 here, but by merge-up, not
derivation — and the `tandem_history` entry must be removed too or the 905 remains visible. The instinct
(unblock him in minutes, no PR in the critical path) is right; the mechanism description is not.

### Blind Spots the Council Caught

1. **The non-destructive option nobody proposed: a local tombstone.** Reviews 2 and 3 name it. Mark the
   set `voided` rather than deleting the measurement, and have derivation skip voided sets. History stays
   append-only — immutability of stored history is preserved — while the derived max recomputes over the
   surviving *valid* record. This dissolves the A-vs-B fight: there is no "lowering path," there is a
   *filter on the input set*, which is exactly what Reading A claims to be doing and what deletion cannot
   prove it is doing.
2. **Contamination is unaudited.** Reviews 1, 2, 3 and 5 all ask: what did est-1RM 1267 already drive?
   `seedWeight`, prescribed loads already issued, the 1RM-trend star, streaks, calibration rows,
   head-to-head scoring, Dani's comparison surface. Nobody checked. An unsafe prescription already shipped
   to a human.
3. **Reading A has no runtime oracle** (Contrarian, endorsed by all five reviews): nothing distinguishes
   "never real" from "user wants it gone." It's a button, in a competition app where the number sets
   progression difficulty. The incentive to self-lower is structural.
4. **Review 4's authority point, which is decisive:** D11 is SAFETY tier, so per D16's `tierGuard` no
   `OVERRIDE_KEYS` entry exists. Under Reading B the feature *cannot ship at all* — not even with a
   council artifact. "A is correct" is therefore a bet the council has no standing to settle unilaterally.
5. **`tandem_working1rm` is device-local and never synced** — the two phones can hold permanently
   divergent earned 1RMs (Review 2). Pre-existing, unfiled.
6. **Nobody produced the should/could/did audit** (Review 1). That, not a verdict, is the gating artifact.

### The Recommendation

**Answer to the question asked: Reading A is correct in principle but must not be implemented as a
lowering path. Ship the void/tombstone form instead, and do not amend D11 by weakening it — split it.**

Three units, in order:

1. **Unblock Kerwin now, attended, no PR.** Remove the `tandem_history` 905 entry and the Good Morning
   keys from `tandem_prs`/`tandem_working1rm` in his browser; confirm the surface reads 180 after reload,
   by looking at the pixel, not the key. State plainly that this is merge-up from cloud, not
   re-derivation.
2. **Audit the contamination before building anything.** Grep every consumer of est-1RM/PR for Good
   Morning and report what the 1267 already prescribed. This is read-only and in scope.
3. **The feature, as void-not-delete, in `tandem.html` only.** An Edit/Void control per set; voided sets
   excluded from PR/working-1RM derivation; one home — a single `deriveBestFrom(sets)` that every
   derivation path calls. Report, never mutate, cloud `personal_records`, and surface explicitly in the UI
   when cloud holds a higher value that will re-raise the number (do **not** toast "fixed" over a value
   that isn't — that is `reorderWeek()`).

**Doctrine: Notion first, then `DOCTRINE.md` + `doctrine.mjs` together.** Split D11 into D11a
(prescription curve never dips) and D11b (the max operator is one-sided over the set of valid
measurements). Add the clause D11 never had — *validity is a property of the input, not the operator; a
voided set is not a measurement* — as a SPLIT-tier invariant with the new behavioral gate. This is
amending for underspecification (First Principles), not carving an exception. The Expansionist's
D35/audit-log/social-dispute flow is rejected: it expands an adversarial downward surface the SAFETY tier
exists to forbid.

**Gate: behavioral, over all writers.** Assert `deriveBestFrom` returns `max(valid remaining)` exactly;
enumerate every writer of `tandem_working1rm`/`tandem_prs` and fail on an unregistered one. Mutation-test
each assertion individually (SC-38). A grep inside one function does not survive this change.

**Exceeds constraints — file as follow-ups, do not attempt:** cloud-side void/recompute of
`personal_records` and any `sets` delete path (schema/migration, human-apply only); reconcile-on-hydrate
pruning (needs a failed-write vs. phantom discriminator first — ship nothing here until that exists);
entry-time plausibility bound on `logSet`; cross-device `working_1rm` divergence.

### The One Thing to Do First

Clear the 905 from Kerwin's browser and verify at the pixel that Good Morning reads 180 — then, before
writing a line of the feature, run the contamination audit on what est-1RM 1267 already prescribed. The
ghost is cosmetic; what it already told a human to lift is not.

---

## 7. Disposition

| Verdict item | Status |
| --- | --- |
| Reading A correct in principle; implement as **void**, not lowering path | ADOPTED |
| Split D11 → D11a (prescription) / D11b (operator over *valid* measurements) + validity clause | ADOPTED — Notion first |
| One home: `deriveBestFrom(sets)`, behavioral gate over all writers of `tandem_prs`/`tandem_working1rm` | ADOPTED |
| Disclose in UI when cloud `personal_records` holds a higher value that will re-raise | ADOPTED |
| Expansionist D35 + audit log + Dani-disputes-PR social flow | REJECTED |
| Prune-on-hydrate | REJECTED for now — needs a failed-write vs phantom discriminator; filed as follow-up |
| Cloud-side void/recompute of `personal_records`, `sets` delete path | OUT OF SCOPE (schema/migration, human-apply) — filed as follow-up |
| Entry-time plausibility bound on `logSet` | Filed as follow-up |
| Cross-device `working_1rm` divergence | Filed as follow-up |
| Contamination audit of est-1RM 1267 | DO FIRST, read-only, in scope |

---

## 8. Appendix — Contamination audit of est-1RM 1267 (the council's "do this first")

Run 2026-10-05, read-only. Every figure here was produced by RUNNING the live code
(`scripts/_ghost-contamination-audit.tmp.mjs`, a throwaway that vm-extracts the real
`weekFactor()`/`roundTo5()`/`canonicalGoal()`/`PROGRESSION` out of `tandem.html` + `programs.js`)
or by querying Postgres. Nothing below is inferred from reading a function.

### A. The cloud was never contaminated

- `personal_records` / Good Morning / kerwinferrette@gmail.com = **180**, `updated_at 2026-10-05 14:51:53+00`.
- `public.sets` across **all** users: **zero** rows with `weight_lbs >= 500` or `estimated_1rm_lbs >= 600`.
  There is no 905 anywhere in the database.
- Kerwin's 8 Good Morning set rows top out at `135 x 10` → est 180 (`is_pr=true`), logged
  2026-10-05 14:46:36. The 180 is not a BUG-131 leftover — it was re-earned today, legitimately.

### B. The local PR store on the device that synced today is ALSO clean

This is a stronger claim than the brief made, and it is provable from the cloud row:

1. `personal_records` has exactly ONE non-internal trigger, `streak_recompute_on_pr`
   (`AFTER INSERT OR DELETE OR UPDATE ... EXECUTE FUNCTION streak_recompute_trg()`). There is no
   `updated_at` trigger, and Postgres has no `ON UPDATE` clause. So `updated_at` is set by
   application code, never by the database.
2. The only app writer that sets `updated_at` is `syncPRs()` (`tandem.html:7935`), and it is an
   **unconditional** upsert of the whole local `tandem_prs` map — no max guard.
3. Therefore `updated_at = 14:51:53` means `syncPRs()` ran then and wrote whatever local
   `tandem_prs['Good Morning']` held. It wrote **180**.
4. Had the ghost's 1267 ever entered `tandem_prs` on that device, 1267 is what that column would
   read now. It does not. **The ghost never reached the PR store.**

### C. Where the ghost actually lives, and what it actually breaks

The 905 x 12 is a stored per-set record inside `tandem_history[i].exercises[slotId][j]`:
`{ w: 905, r: 12, est1rm: 1267, name: 'Good Morning' }`. `est1rm` is **stored, not recomputed at
render** — `openExerciseHistory`'s `fmtSets` reads `x.est1rm` verbatim (`tandem.html:7040`).

Two contaminated surfaces, one of which the brief did not name:

| Surface | Site | Effect |
| --- | --- | --- |
| History set line | `tandem.html:7040` | prints `905x12 (1267e)` |
| **`renderStrengthTrend()` sparkline** | `tandem.html:6962-7023` | **NEW FINDING** |

`renderStrengthTrend` takes `rm: Math.max(0, ...m.sets.map(s => Number(s.est1rm) || 0))` per
session and then derives the y-axis from the point set (`lo = Math.min(...)`, `hi = Math.max(...)`,
`span = hi - lo`). A single 1267 point therefore (i) spikes the line, (ii) **squashes every other
session in that chart to the bottom of the axis**, and (iii) drives the headline
`+N lbs / +N% · EST 1RM` delta, which is computed between `pts[0]` and `pts[last]`. One bad set
destroys the entire trend view for that exercise, not just its own row.

This is the strongest case for the feature and it is a surface the brief did not name. Worth saying
plainly: BUG-94 exists because Kerwin asked to *see* his progression, and one phantom set is
currently enough to make that view lie about every other session in it.

### D. Ruled OUT as contamination paths (each checked, not assumed)

| Path | Verdict | Evidence |
| --- | --- | --- |
| `cfg.onboardingEstimates` → D22 registration loops (`:3404`, `:5420`) | CLEAN | live `users.onboarding_estimates` holds exactly `{Barbell Row, Romanian Deadlift, Barbell Back Squat, Flat Barbell Press, Barbell Overhead Press}`. No Good Morning. `OB_ESTIMATE_LISTS` (`:4631`) cannot produce it for either sex. |
| `ACCESSORY_FACTORS` derivation into OTHER exercises | CLEAN | "Good Morning" matches none of the six `COMPOUND_PATTERNS` regexes (`:3042-3049`), so it never registered a canonical pattern key in `compound1RMs`/`dayCompound1RMs` and could not reach another movement's `source:'derived'` target. |
| `streaks` | CLEAN | `streak_recompute()` computes `total_prs` as `count(*)` — a row count. A PR *value* cannot perturb a streak. Only deleting a `personal_records` row could, and the plan never deletes one. |
| Good Morning's own prescribed load | **COUNTERFACTUAL ONLY** | see E |

### E. What the ghost WOULD have prescribed — measured, but it did not happen

Kerwin's live row: `program_goal=transform`, `program_weeks=12`, `current_week=2`, `sex=M`.
Running the real `weekFactor('transform', w, 12)` through the real `roundTo5`:

| wk | factor | ghost 1RM 1267 | real 1RM 180 | over by |
| --- | --- | --- | --- | --- |
| 1-2 | 0.6600 | 835 lbs | 120 lbs | +715 |
| 4 | 0.6840 | 865 lbs | 125 lbs | +740 |
| 7 | 0.7200 | 910 lbs | 130 lbs | +780 |
| 11 | 0.7680 | 975 lbs | 140 lbs | +835 |
| 12 (realization) | 0.9000 | 1140 lbs | 160 lbs | +980 |

Ratio 7.04x; worst single week **+980 lbs**. Recorded because it is the price of the NEXT ghost if
it lands on a lift that *does* reach the PR store — which is the measurement the council asked for.
It is **not** something that happened: §B proves the PR store read 180, so the prescription Kerwin
was actually shown for Good Morning was 120 lbs, not 835.

### F. Still unprovable from here — stated plainly rather than assumed

1. **`tandem_working1rm` is device-local and never synced to the cloud.** `earnedOneRM` prefers it
   over `tandem_prs`, so if the 1267 reached it, prescriptions WOULD be contaminated and nothing in
   Postgres would show it. Needs one in-browser read on Kerwin's device:
   `JSON.parse(localStorage.getItem('tandem_working1rm') || '{}')['Good Morning']`.
2. **Other devices.** §B proves only the device that synced at 14:51:53. If the ghost was observed on
   a device that has not synced since, that device's `tandem_prs` could hold 1267, and its next
   `syncPRs()` would push 1267 over the clean cloud 180 — unconditionally, no max guard. This is the
   re-contamination race already filed as a follow-up, and it is live until the feature ships.

### G. Consequence for the build

The council's worry was that a local lowering would be silently undone by the max-guarded cloud
merge-up at `:8419`/`:9800`. §B changes the shape of that: the app's own `syncPRs()` is an
unconditional push-down, so a lowered local value propagates to the cloud with **no migration and no
new write path** — the feature must simply call the existing sync immediately after the local
recompute, so merge-up has nothing higher left to restore. That is an ordering requirement, not a
schema change, and it stays inside the brief's "no schema, RLS or auth changes" constraint.

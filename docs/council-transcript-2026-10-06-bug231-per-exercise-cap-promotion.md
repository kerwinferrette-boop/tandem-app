# LLM Council — BUG-231: should the cited per-exercise set cap become a D-invariant?

**Date:** 2026-10-06
**Convened by:** CLAUDE.md escalation rule — *"'The sources conflict' is not a reason to ask — it
is a reason to run the council and come back with a recommendation."*
**Branch under discussion:** `bug231-per-exercise-cap` @ `81a01ec` (unpushed at time of council)
**Precedent this follows:** `docs/council-transcript-2026-09-29-d24-loadless-promotion.md` (the
D34 promotion question, settled the same way)

---

## The original question

After fixing BUG-231 with a cited 6-set-per-exercise-per-session ceiling, the
`exercise-science-research` skill's Step 3 says a hard rule must become an executable invariant.
But D33 — already ACTIVE — says in its own text that the per-exercise cap is *"a consequence, not
a separate claim."* Three primary sources now contradict that. Is this a new D-number, a clause on
D33, or not doctrine at all?

## The framed question (as all five advisors received it)

> **QUESTION: Should a newly-cited exercise-science rule be promoted to a formal "D-invariant" in
> the Tandem project's doctrine, and if so, how?**
>
> **BACKGROUND.** Tandem is a couples fitness app whose program engine is governed by a set of
> numbered, machine-enforced invariants (D1…D34) in `/DOCTRINE.md`, checked by
> `scripts/doctrine.mjs` on every commit. A bug (BUG-231) was found: the engine's weekly-volume
> raise loop satisfied a muscle's weekly minimum-volume floor (MEV) by piling sets onto ONE
> existing exercise — e.g. 7 sets of Decline Barbell Press in a single session, up to 10–11 sets
> of one lift on 2-day splits.
>
> Research found a cited ceiling of 6 sets per exercise per session from three PRIMARY-tier sources:
> - **ACSM 2009** position stand (Ratamess et al.): per-exercise 1–3 sets untrained, 3–6 advanced.
> - **Krieger 2010** meta-analysis (55 effect sizes, 8 studies): per-exercise bins 1 set ES 0.24 →
>   2–3 sets 0.34 → 4–6 sets 0.44; *"no meaningful differences emerged between 2-3 and 4-6 sets"*.
>   It measures NOTHING above 6 sets.
> - **Hackett 2018** (Sports 6(1):7): the only direct test above 6 — 10 sets vs 5 sets of the same
>   exercise over 12 weeks; *"10 sets compared to five sets per resistance exercise over 12 weeks
>   is no more effective"*; *"4–6 sets per resistance exercise is advised."* Honest limits: pilot
>   study, n=12, diet uncontrolled, and lean mass moved in NEITHER arm.
>
> **THE FIX IS ALREADY SHIPPED** on a branch and gated: a cap of 6 is consulted in the raise loop,
> in a two-pass structure (first pass respects the cap; second pass ignores it) so that the cap
> NEVER costs the engine a cited MEV floor. Rationale: the per-exercise cap is a PLATEAU bound (no
> measured benefit above 6) while MEV is a FLOOR bound (measured deficiency below it) — an
> unmeasured plateau must yield to a measured floor. Measured result: over-ceiling lifts dropped
> 1040 → 700 (5.3% → 3.5%) across 1050 goal×days×sex×tier combos; the 700 remaining sit in 34
> distinct cells where NO legal additional exercise exists to spread onto (a bank-coverage gap
> already documented and blocked on a `muscle_tag_rescope` task). A flat uncompromising cap would
> instead put 46 muscle-weeks BELOW the cited MEV floor. A new gate (verify check #44) asserts:
> the cap constant is 6; every over-ceiling lift is structurally forced (computed independently of
> the engine, zero allowlist); no muscle-week falls below MEV.
>
> **THE CONFLICT.** An existing ACTIVE invariant, D33, already covers per-SESSION volume:
> *"Per-muscle per-session ceiling: ~11 fractional sets — number PROVISIONAL, revisit 2027-03-23.
> The per-exercise cap is a consequence, not a separate claim: N sets of one lift are N fractional
> sets on its primary muscle, so a lift above 11 necessarily puts that muscle above 11. It is
> necessary, not sufficient: a green D33 does NOT mean 11 sets of one lift is good programming (the
> source did not study per-exercise limits or burnout), only that it is not past the per-muscle
> point."* D33 rests on Remmert et al. 2025.
>
> So D33 explicitly calls the per-exercise cap "a consequence, not a separate claim" — which the
> three new sources contradict: the new rule has a different UNIT (per-exercise vs per-muscle), a
> different BOUND (6 vs ~11), and different SOURCES.
>
> **Tier vocabulary:** SAFETY = binds every path, no override possible. SCIENCE_DEFAULT = default
> for generated programs; hand-authored programs may deviate only via a cited `science_overrides`
> key — but if no key is registered in `OVERRIDE_KEYS`, the clause authorizes no deviation at all
> (the tier records confidence, not permission). Precedent: D34 was promoted as a NEW D-number
> rather than a clause on the adjacent D24, on the reasoning *"D24 answers 'how does load
> progress?' and D34 answers 'what happens when load does not exist?' — a domain guard on the
> input, not the function."*
>
> **FOUR SPECIFIC QUESTIONS:**
> 1. Promote at all, or leave the rule as gate check #44 only?
> 2. If promoted: new D-number, or a clause appended to D33?
> 3. Which tier — SAFETY or SCIENCE_DEFAULT — and should an `OVERRIDE_KEYS` entry be registered now?
> 4. Is a rule with 700 standing mechanically-derived exceptions legitimately an "invariant" at all?

---

## Round 1 — advisor responses

### The Contrarian

Three citations, zero of them bound 6. ACSM's 3–6 is a recommended range for advanced trainees,
not a ceiling — ranges describe where benefit was observed, they do not forbid the outside. Krieger
measured nothing above 6 sets; that is absence of evidence, and you are reading it as evidence of
absence. And Hackett could not detect its own primary outcome — lean mass moved in neither arm of
an n=12 pilot with uncontrolled diet — so it cannot license a bound on anything. Stack three nulls
and you still have a null.

The 700 exceptions are unfalsifiable as written. You say every one is "structurally forced" and
computed independently. What audits the forced classifier? If the classifier shares an assumption
with the engine, the gate rubber-stamps whatever the engine does and reports zero violations forever.

And the buried finding is the real one here, not the cap: D6b's MEV floor was green on main partly
BECAUSE of this stacking. The defect is exercise selection breadth, not set counting. Capping sets
caps the symptom and leaves the mechanism.

Answers: (1) keep check #44, promote nothing. (2) If forced to promote, a D33 clause — a new
D-number asserts a new claim and you do not have one. (3) A SCIENCE_DEFAULT with no `OVERRIDE_KEYS`
entry is permissionless theater. (4) No. It's a volume budget heuristic. Name it that.

### The First Principles Thinker

You are asking "what tier and what number," which presumes the rule you've written is the rule you
actually discovered. It isn't.

Strip it back. What did the evidence establish? Not "6 is a ceiling." It established that nobody
has measured a benefit above 6 sets of one exercise in one session. That is a statement about the
literature's coverage, not about muscle. An invariant whose content is absence of evidence is a
category error — invariants assert what must be true, and "we haven't looked past here" can't be
violated.

Now look at what the fix actually does. It doesn't enforce 6. It changes how the engine ALLOCATES a
volume deficit: spread across exercises before stacking on one. And the 700 "exceptions" all share
exactly one mechanism — no legal additional lift exists for that muscle at that tier. That's not 34
carve-outs from a law. That's a bank-coverage and selection-breadth defect, enumerated. Thirty-four
cells of technical debt.

So promote the rule D33 already names as its own gap, and state it without any exercise-science
number: **the engine must never satisfy a weekly volume floor by adding sets to an existing
exercise when a legal additional exercise exists.** That is a closed, checkable claim about engine
behavior. Zero exceptions by construction — when no legal lift exists the condition is simply
false. No plateau hand-waving required.

"6" then becomes what it is: a parameter of the allocator, versioned next to `REP_BANDS`, not a law.

### The Expansionist

The 700 forced exceptions are the most valuable output of this work, and you're treating them as an
embarrassment. Promote it: new D-number, SCIENCE_DEFAULT, and register the `OVERRIDE_KEYS` entry
now. A SCIENCE_DEFAULT with no registered key is a dead letter — and the key is exactly the legal
seam you will need for hand-authored programming and a future coach mode.

Three upsides nobody else is looking at. First, this cap is a diagnostic instrument, not just a
ceiling: the counterfactual you already ran (flat cap ⇒ 46 muscle-weeks below MEV) is a new genre
of gate — invariants that audit other invariants by counterfactual. Point that technique at D28 and
D8 next. Second, the 34 cells are not debt, they're a prioritized worklist for the muscle-tag
vocabulary gap D33 flagged in prose and never scoped. Fixing them adds real exercise variety — a
visible product win — and self-liquidates the exceptions. That makes the exception count a roadmap
metric. Third, and biggest: "an unmeasured plateau yields to a measured floor" is the first explicit
precedence relation between two cited bounds in this doctrine. Formalize it as an ordering, not a
footnote. A machine-checkable precedence lattice over cited bounds is a genuinely defensible moat
artifact — nobody else building fitness software has one. This is also the doctrine's first
plateau-tier bound; that is the template for every "no measured benefit above X" finding you will
ever cite.

An invariant with located, counted, mechanically-derived exceptions is stronger law than one with
none — because it knows where it doesn't apply.

### The Outsider

"6" is an artifact of how the studies were binned, not a property of muscles. Krieger's top bin was
4–6 because that's how the literature clustered; had the bin been 4–8, you'd be promoting
D-whatever at 8 with equal confidence. The honest number isn't 6, it's "unknown above 6."

On Hackett: lean mass moved in neither arm. If the study couldn't detect growth in the group that
DID grow — and people training 12 weeks grow — that's a failed instrument, not a null result. A
reader with no stake in this will spot that immediately, and once they do, every number downstream
of it looks chosen rather than found.

Here's what reads strangest from outside. The thing you're describing isn't a ceiling. A ceiling you
deliberately route around 700 times is a default with a tiebreak. Calling it an invariant and then
shipping 34 standing exceptions teaches everyone reading `/DOCTRINE.md` that D-numbers are
negotiable — which is the one property your gate depends on not being true. The doctrine's power is
that a D-number is binary. Don't spend that on your softest claim.

Keep it as check #44, where "a preference we enforce when we can" is an honest description.

And the buried finding deserves its own entry far more than this does: D6b was passing partly
because of the bug. A cited floor that was only green by accident is a bigger integrity problem
than an uncited plateau.

### The Executor

First: the branch isn't pushed. Everything else in this question is downstream of a `git push` that
hasn't happened. Do that.

(1) Promote, but understand it's trivial — three edits, maybe half a day: a Notion mirror page, a
`/DOCTRINE.md` row, an assertion in `doctrine.mjs`. The reason to do it isn't purity, it's that #44
is a standalone script someone will "simplify" in six months, whereas a D-row has a Notion page
explaining why 6.

(2) New D-number. A clause on D33 forces you to re-open a row whose own number is PROVISIONAL and
revisit-dated 2027-03-23. When that date comes you want to change 11 without touching 6. Don't
braid them.

(3) SCIENCE_DEFAULT. SAFETY is a lie you'd have to defend — nothing cited shows harm above 6. Skip
the `OVERRIDE_KEYS` entry: registering a key nobody has requested a deviation for is speculative
work.

(4) Here's the actual deliverable, and it's the only part of this that changes behavior: the 34
cells. An invariant with a floating exception count isn't law, it's a TODO. Make it one. Commit the
34 cells to a fixture file and assert the live count is ≤ 34 AND the set is a subset. The number can
then only shrink. A new bank-coverage gap turns the gate red the day it appears, and the
muscle-tag-vocabulary item finally has a burn-down with a finish line.

---

## Round 2 — peer review (anonymized)

**Anonymization mapping, now revealed:**

| Letter | Advisor |
|--------|---------|
| A | The Expansionist |
| B | The Contrarian |
| C | The Executor |
| D | The Outsider |
| E | The First Principles Thinker |

Reviewers saw only the letters, in the order A–E above, and did not know which advisor wrote which.

### Reviewer 1

**1. Strongest: E.** It's the only response that fixes the actual defect in the *claim* rather than
negotiating its tier. Restating the rule as engine-allocation behavior ("never satisfy a volume
floor by stacking when a legal additional exercise exists") makes it a closed, binary,
zero-exception invariant, demotes "6" to an allocator parameter versioned beside `REP_BANDS`, and
dissolves question 4 instead of arguing it. C's fixture-pinned ≤34 burn-down is the best bolt-on:
it converts a floating exception count into a monotonically shrinking worklist.

**2. Biggest blind spot: A.** It inverts the evidentiary problem — celebrating 700 exceptions as
"stronger law," inventing a "precedence lattice" moat, and registering an `OVERRIDE_KEYS` key for a
deviation nobody requested (speculative permission on the project's weakest citation). Critically,
it never touches the D33 conflict at all, which was the question's core.

**3. All five missed:** D33's ACTIVE text *affirmatively claims ownership* — "the per-exercise cap
is a consequence, not a separate claim." A new D-number without amending that sentence ships two
ACTIVE invariants disputing ownership of one rule: a one-rule-one-home violation, and the amendment
must go Notion → `/DOCTRINE.md` → `doctrine.mjs` in the *same* change. Also unaddressed: the cap
constant needs a named home (not a literal in the raise loop plus a copy in the gate), and no one
asked whether the second pass's over-ceiling output is traced to a pixel.

### Reviewer 2

**1. Strongest: E.** It is the only response that answers Q4 by fixing the claim rather than
grading it. Reframing the invariant as an allocator rule — never satisfy a volume floor by stacking
when a legal alternative exists — yields a closed, violable, zero-exception statement about engine
behavior, keeps "6" as a versioned parameter, and dissolves the D33 unit conflict instead of arguing
it. C is the best operational answer (fixture-pin the 34 cells so the count can only shrink); that
belongs bolted onto E.

**2. Biggest blind spot: A.** It celebrates the 700 exceptions as an asset and wants a precedence
"lattice," while missing that promoting an absence-of-evidence bound is exactly what makes D-numbers
look negotiable (D's point). It also urges registering an `OVERRIDE_KEYS` entry nobody requested —
speculative permission, contradicting "the tier records confidence, not permission."

**3. All five missed:**
- D33's sentence "the per-exercise cap is a consequence, not a separate claim" is now **false** and
  must be amended *whatever* is decided — including the do-nothing option. Nobody said this.
- Notion-first ordering: Notion page, then `/DOCTRINE.md` and `doctrine.mjs` in the **same** commit.
- Check #44's forced-classifier needs per-assertion mutation testing (SC-38); B sensed the risk but
  prescribed no test.
- "Gate-only" leaves `6` in two homes — a one-rule-one-home violation.

### Reviewer 3

**1. Strongest: E.** It's the only response that reframes the invariant so the 700 exceptions vanish
*by construction* rather than being counted, allowlisted, or excused. "Never satisfy a floor by
stacking when a legal alternative exists" is a closed behavioral claim about the engine — exactly
the kind of thing `doctrine.mjs` can enforce without a provisional number — and it demotes 6 to an
allocator parameter beside `REP_BANDS`, which respects one-rule-one-home. C's fixture-with-burn-down
is the best *operational* idea (ratchet ≤34, subset-only), and should be grafted onto E.

**2. Biggest blind spot: A.** It treats the exceptions as a feature ("stronger law because it knows
where it doesn't apply") without answering D's and E's structural objection: a D-number that routes
around itself 700 times erodes the binary quality the gate's authority rests on. Its "precedence
lattice" is architecture astronomy built atop a bound nobody has shown exists above 6. It also
registers an `OVERRIDE_KEYS` entry for a deviation nobody requested — exactly the speculative
permission the tier vocabulary warns against.

**3. All five missed:** nobody addressed D33's own text. Promoting a per-exercise invariant requires
*editing* D33's "a consequence, not a separate claim" sentence — leaving it standing creates two
ACTIVE rows contradicting each other, and per CLAUDE.md that's Notion-first, then `/DOCTRINE.md` and
`doctrine.mjs` together. B and D both spotted that D6b was green partly *because* of the bug, but
none proposed the obvious check: whether the MEV gate was ever mutation-tested against stacked
allocation (SC-38/SC-39).

### Reviewer 4

**1. Strongest: E.** It alone noticed that the rule as written is a plateau-from-absence-of-evidence
(uncheckable, unviolatable) while the *fix* is an allocation-order rule — a closed behavioral claim
with zero exceptions by construction, because "no legal lift exists" makes the antecedent false.
That reframing dissolves Q2/Q3/Q4 simultaneously and demotes 6 to an allocator parameter beside
`REP_BANDS`, consistent with one-rule-one-home. D reaches the same skepticism but stops at "don't
promote"; E delivers a shippable invariant.

**2. Biggest blind spot: A.** It is pure upside narration — "precedence lattice," "moat artifact,"
"roadmap metric" — and never tests whether the bound exists. It accepts 6 as cited law despite
Hackett's n=12, null-in-both-arms instrument, and endorses registering an `OVERRIDE_KEYS` entry for
a deviation nobody requested, which manufactures permission the tier vocabulary says confidence
alone shouldn't grant. It also calls 700 located exceptions "stronger law," inverting the binary
property D correctly identifies as the gate's whole value.

**3. All five missed:** nobody asked whether the *two-pass structure itself* needs doctrine. The
pass-2 escape is the load-bearing mechanism, and it is invisible to the gate's own assertions —
exactly the "green gate on a dead value" shape CLAUDE.md warns about. Also unexamined: D33's
"consequence, not a separate claim" sentence is now false and must be amended in Notion first
regardless of which option wins.

### Reviewer 5

**1. Strongest: E.** It's the only one that restates the rule as a closed claim about engine
behavior — "never satisfy a volume floor by stacking on an existing exercise when a legal
alternative exists" — which dissolves Q4 entirely (zero exceptions by construction, because the 700
cells simply fail the antecedent) and demotes "6" to an allocator parameter versioned beside
`REP_BANDS`. That also sidesteps the ACSM/Krieger/Hackett weakness B and D correctly identify,
without discarding the shipped fix. C is the best practical complement: pin the 34 cells to a
fixture, assert subset-and-shrinking, give the muscle-tag gap a burn-down.

**2. Biggest blind spot: A.** It calls a keyless SCIENCE_DEFAULT a "dead letter," which contradicts
the stated vocabulary — the tier records confidence, not permission. So A would open a
cited-deviation seam on the project's weakest claim, for a deviation nobody requested. It also
celebrates the 700 as a "roadmap metric" rather than naming them a bank-coverage defect, and its
"precedence lattice" is architecture for one data point.

**3. All five missed two things.** (a) One rule, one home: 6 must live in a named table read by both
engine and gate, not a literal plus a mirrored assertion. (b) Nobody tested the second pass against
ACTIVE D33 — an uncapped stack can push a muscle past ~11 fractional sets, meaning the escape hatch
may violate a live invariant. Also absent: a revisit date on 6, and any trace that the spread
reaches a pixel.

---

## Chairman synthesis — COUNCIL VERDICT

### Where the Council Agrees

Convergence here is unusually strong, and it runs *against* the question as I framed it.

1. **"6" is not a bound.** Four of five advisors (all but the Expansionist) independently reached
   the same read of the same three citations: ACSM's 3–6 is a range where benefit was *observed*,
   not a ceiling; Krieger's top bin stops at 6 because that is how the literature clustered, so
   silence above 6 is a measurement-grid artifact; and Hackett is an n=12 pilot whose lean-mass
   outcome moved in *neither* arm — a failed instrument, not a null result. The Contrarian's
   compression is the one to keep: *"Stack three nulls and you still have a null."* The honest
   statement of what the research establishes is **"unknown above 6,"** not "6 is a ceiling."

2. **An absence-of-evidence claim cannot be an invariant.** An invariant asserts something that can
   be violated. "Nobody has measured a benefit past here" cannot be. Three of five advisors and all
   five reviewers accept this.

3. **The 34 cells are debt, not law.** All 700 remaining over-ceiling lifts share exactly one
   mechanism — no legal additional lift exists for that muscle at that tier. That is a
   bank-coverage/selection-breadth defect, already named in D33's own known gap and already blocked
   on `muscle_tag_rescope`. It is not 34 carve-outs from a rule.

4. **The buried finding outranks the cap.** Three advisors raised it unprompted: D6b's MEV floor was
   green on `main` *partly because of this bug* — the stacking is what satisfied the floor. A cited
   floor that was only green by accident is a larger integrity problem than an uncited plateau.

5. **SAFETY is off the table.** Nothing cited shows harm above 6. SAFETY would be, in the Executor's
   phrase, *"a lie you'd have to defend."*

### Where the Council Clashes

**Clash 1 — promote nothing vs. promote something else.** The Contrarian and the Outsider both land
on "keep check #44, promote nothing," and the Outsider's reason is the sharpest thing anyone said:
*"A ceiling you deliberately route around 700 times is a default with a tiebreak. Calling it an
invariant and then shipping 34 standing exceptions teaches everyone reading /DOCTRINE.md that
D-numbers are negotiable — which is the one property your gate depends on not being true."* Against
them, the Executor and Expansionist both want a D-number, for different reasons: the Executor for
durability (*"#44 is a standalone script someone will 'simplify' in six months, whereas a D-row has
a Notion page explaining why 6"*), the Expansionist for leverage.

Reasonable advisors split because they are weighing two real costs: leaving a hard-won rule in a
script that can be quietly softened, versus spending the doctrine's binary authority on its weakest
claim. **The First Principles Thinker is the only one who refuses the trade** — and his escape is
what every reviewer independently picked as strongest.

**Clash 2 — register the `OVERRIDE_KEYS` entry now?** The Expansionist says a keyless
SCIENCE_DEFAULT is *"a dead letter"* and the key is the legal seam a future coach mode needs. The
Executor calls it speculative work for a deviation nobody has asked for. Four of five reviewers
sided against the Expansionist, and on a specific technical ground: the project's own tier
vocabulary says a keyless SCIENCE_DEFAULT *"authorizes no deviation at all — the tier records
confidence, not permission."* "Dead letter" is a misreading of the vocabulary, not a gap in it.

**Clash 3 — new D-number vs. D33 clause.** The Executor: don't braid 6 to a PROVISIONAL 11 that gets
revisited 2027-03-23 — when that date comes you want to move 11 without touching 6. The Contrarian:
a new D-number *asserts a new claim*, and you don't have one. Both are right about their own
concern, which is the signal that the thing being numbered is wrong, not the numbering.

### Blind Spots the Council Caught

Peer review produced four findings no individual advisor had, and they are the operative part of
this verdict.

1. **D33's sentence is now false, and must be amended under EVERY option — including "do
   nothing."** Four of five reviewers caught this; no advisor did. D33's ACTIVE text affirmatively
   claims ownership of this rule: *"The per-exercise cap is a consequence, not a separate claim."*
   That sentence was written when the only source was Remmert. It is now contradicted by three
   primary sources with a different unit, a different bound, and different authors. Promoting a new
   D-number while leaving it standing ships **two ACTIVE invariants disputing ownership of one
   rule** — a textbook one-rule-one-home violation. And leaving the rule in check #44 does not help:
   the sentence is still false. Amendment order is Notion → `/DOCTRINE.md` → `doctrine.mjs`, in the
   same change.

2. **The Expansionist's position was rejected unanimously, including by the review round.** All five
   reviewers named Response A the biggest blind spot. That is worth recording because its framing
   was the most *attractive* — "precedence lattice," "moat artifact," "roadmap metric." Reviewer 4's
   verdict: *"pure upside narration… never tests whether the bound exists."* Reviewer 3's:
   *"architecture astronomy built atop a bound nobody has shown exists above 6."* An unverified
   premise dressed in strategic language is still an unverified premise.

3. **The pass-2 escape hatch is the load-bearing mechanism and is invisible to the gate.** Reviewer
   4 flagged it as the "green gate on a dead value" shape CLAUDE.md warns about; Reviewer 5 went
   further and asked whether an uncapped second pass could push a muscle past D33's ~11.
   **I checked this against the code rather than reasoning about it.** `fits()` at
   `programs.js:3474` applies the `SESSION_MUSCLE_CEILING` term **unconditionally** — the `capped`
   flag gates only the per-exercise line. Pass 2 therefore cannot violate D33. Reviewer 5's (b) is
   answered; Reviewer 4's framing stands as a legitimate gap in what the gate *asserts* versus what
   the code *does*.

4. **One rule, one home — partially a misread, worth stating precisely.** Reviewers 1, 2 and 5 all
   assumed `6` is duplicated as a literal in the engine and again in the gate. It is not:
   `PER_EXERCISE_SET_CEILING` is declared once (`programs.js:3393`) and check #44 vm-extracts it
   from the live module. The only second literal is the pin `CAP === 6` inside assertion A3, which
   is the gate doing its job. However, the reviewers' underlying instinct is right about *naming*:
   a bare `const` beside the raise loop is a weaker home than a named table, and the number carries
   no revisit date the way D33's 11 does.

### The Recommendation

**Do not promote "6 sets per exercise" to a D-invariant. Promote the allocation rule instead, and
amend D33 in the same change.** Concretely, five decisions:

1. **Promote — but promote the First Principles Thinker's claim, not mine.** The new invariant is
   about engine behavior, carries no exercise-science number, and has zero exceptions by
   construction:

   > **The engine must never satisfy a weekly volume floor by adding sets to an existing exercise
   > when a legal additional exercise exists.**

   When no legal lift exists, the antecedent is false and the rule is silent — which is exactly
   where the 700 cases live. This is also, as the First Principles Thinker observed, *the rule D33's
   own known gap already names in prose and never made executable.*

2. **New D-number (D35), not a clause on D33.** The Executor's reason survives review: D33's 11 is
   PROVISIONAL and revisit-dated 2027-03-23, and you want to move 11 later without touching this.
   The Contrarian's objection ("a new D-number asserts a new claim you don't have") is answered by
   decision 1 — the claim being asserted is now about the allocator, which *is* new and *is* ours.
   This matches the D34-over-D24-clause precedent: a different question, not a refinement of the
   same one.

3. **Tier: SCIENCE_DEFAULT. No `OVERRIDE_KEYS` entry.** SAFETY is indefensible — no harm is shown.
   Registering a key is speculative permission for a deviation nobody has requested, and the
   vocabulary already makes a keyless SCIENCE_DEFAULT fully binding today.

4. **Amend D33's ownership sentence — this is mandatory under every option.** Replace *"The
   per-exercise cap is a consequence, not a separate claim"* with text that cedes the per-exercise
   unit to D35 and keeps D33 to the per-muscle unit. Notion mirror first, then `/DOCTRINE.md` and
   `doctrine.mjs` in one commit.

5. **Keep `6` as a parameter, and bolt on the Executor's ratchet.** The number stays in code as the
   allocator's spread-preference threshold, with its citations, its honest limits, and — new — a
   revisit date, the way D33's 11 carries one. Then commit the 34 forced cells to a fixture and
   assert the live set is **≤ 34 and a subset**. That turns a floating exception count into a
   monotonic burn-down and makes a *new* bank-coverage gap go red the day it appears. It also gives
   the long-stalled `muscle_tag_rescope` item a finish line.

**Two items this council surfaced that are not part of the promotion and should be filed
separately:** (a) the buried finding — D6b was green partly because of this bug; whether the MEV
gate was ever mutation-tested against stacked allocation is an open SC-38/SC-39 question and, three
advisors argued, deserves an entry more than the cap does; (b) the Contrarian's *"what audits the
forced classifier?"* — check #44's forced-ness computation shares inputs (`EXERCISE_BANK` tags,
`VOLUME_LANDMARKS`) with the engine, and the answer "it was mutation-tested" should be verified
assertion-by-assertion rather than asserted.

### The One Thing to Do First

**Amend D33's sentence in Notion.** Not the new D-number, not the fixture, not the push.

That sentence — *"the per-exercise cap is a consequence, not a separate claim"* — is false as of
this research, and it is false under *every* option this council considered, including "promote
nothing." It is the only item that is unconditionally required, it is the Notion-first step that
gates the `/DOCTRINE.md` and `doctrine.mjs` edits, and until it is fixed the doctrine contains a
standing claim the sources contradict.

Everything else follows from it. (The branch push remains Kerwin's call, per standing practice on
shared state.)

---

*Council convened 2026-10-06. Five advisors, five anonymized peer reviews, one chairman synthesis.
Artifacts: this transcript and `council-report-2026-10-06-bug231-per-exercise-cap-promotion.html`.*

# Council ruling — science and its application to the program engine

**Date:** 2026-09-14 · **Convened by:** Kerwin, verbatim: *"Run the council on whatever you have to.
Make sure that the council has SCIENCE & APPLYING IT in mind, not shortcuts for code."*
**Evidence base:** `docs/science-application-gap-audit.md` (every DID row measured by running the engine).
**Status:** BINDING as a decision record. Citable artifact per `CLAUDE.md` §5.

**Method deviation, stated honestly:** the skill specifies 5 advisors + 5 peer reviewers + chairman.
Five advisors and **two** reviewers ran (usage limit). The second reviewer was scoped as a skeptical
exercise-science auditor, and it is the one that produced the packet's most important finding, so the
shortfall did not cost the review its teeth. Three reviewers were not run.

---

## The question

A generated full_gym chest day: `Decline Barbell Press 4×10 @100` → `Flat Barbell Press 4×10 @135`
→ `Cable Low-to-High Fly 3×10 @35` — two compound presses of one pattern, 11 pec-primary sets.
Cause: `oneRmFactor`, a **load-estimation coefficient**, is the 4th key in the exercise-**selection**
comparator. Decline outranks Flat at 1.07 vs 1.00 — the engine ranks it first *because it claims you
are 7% stronger on it*, then prescribes **26% less weight**, because the two loads come from
different code paths. One field, two contradictory claims, both shipped.

Seven rulings requested: (1) remove `oneRmFactor` from selection + what replaces it; (2) two compound
variants of one pattern in a session; (3) volume caps; (4) split design and per-muscle frequency at
2-6 days; (5) the uncited-.docx-vs-PDF superset conflict; (6) build `strength`/`maintenance` and the
weight formula?; (7) may an uncited coefficient ever ship?

## The advisors, in one line each

| advisor | position |
|---|---|
| **Outsider** | "Three questions asked, three answers ignored. That isn't periodization, it's a template with a paint job." |
| **Executor** | Three revertable commits: kill the sort key, add a closed `pattern` field, per-session cap. Defer splits/goals/formula. |
| **Contrarian** | Removing the sort key fixes **nothing** — the two chest slots are byte-identical. And rulings 6 and 7 collide. |
| **Expansionist** | The pattern vocabulary is the schema the unbuilt biometric layer needs. Build it once, get the moat. |
| **First Principles** | Wrong question. Selection is first-class and volume is an emergent accident — that is backwards. Invert the pipeline. |

---

# THE VERDICT

## Agreed, unanimously or near

- **`oneRmFactor` comes out of selection.** 5/5, no dissent.
- **Removing it fixes almost nothing.** 4/5. `FOCUS_SLOTS.chest[0]` and `[1]` are byte-identical
  requests — the comparator chose *which* duplicate; the slot table guaranteed *a* duplicate. Any
  ruling that stops at the sort function ships a cosmetic diff and leaves the reported day reachable.
- **≥2 sessions per muscle per week**; **zero hamstring/bicep/tricep primary sets at 2 days is a
  coverage defect, not a tradeoff**; **core at 36 sets/week traces to no source**; **135-150 s rest
  contradicts the project's own cited 90-120 s.**
- **An uncited coefficient may not ship.** 4/5, Expansionist dissenting — overruled.

## The finding that matters most

**Two advisors cited a rule to NSCA *Essentials* 4th ed. that the reviewer says is not in it**
("one primary multi-joint per movement pattern per session"). Two more justified a **per-session**
volume cap with Schoenfeld/Baz-Valle dose-response work, which are ***weekly*** volume analyses and
do not support it. The ~10-hard-sets-per-session ceiling is **Renaissance Periodization practice, not
a meta-analytic constant.**

That is the exact failure mode this council was convened to fix, committed *inside* the review of it.

> **Chairman's ruling: every advisor citation in this packet is NON-LOAD-BEARING. Nothing ships on an
> advisor's say-so about what a source contains.** Each external claim must be independently verified
> against the actual source before it can be implemented or written into doctrine.

## Blind spots the reviewers caught

1. **Nobody defined a hard set.** Is a fly 1.0 pec sets or 0.5? Until direct-vs-fractional counting
   is settled, **"11 sets" and "36 sets" are not numbers**, and no volume cap can be written, let
   alone enforced. This *blocks* rulings 3 and 4.
2. **Nobody asked where the fix lands.** Reps are flat `10` in the engine; goal enters at render.
   The render layer already overrides engine output — so a correct weekly budget computed in the
   engine can be discarded downstream exactly as `ex.rest` has been since EPIC-8a.
3. **The load path is unaudited.** Everyone banned `oneRmFactor` from selection and left it in
   `seedWeight`/D26 without asking whether it has a citation *there* either. On this record it does not.
4. **NSCA's stated sequence puts selection before volume**, which cuts against First Principles'
   framing. The architecture argument still holds on one-rule-one-home grounds, but
   "NCAA D1 staffs program frequency-first" is an advisor assertion and must be verified.
5. Unaddressed by all five: users mid-program when a split changes; whether live bad sessions warrant
   a stop-ship.

## The rulings

**R1 — `oneRmFactor` out of selection. SHIPS NOW.** Remove from both comparators by extending the
shared `primaryMatchRank`; no third copy. Replace with **no new scalar**:
`primaryMatchRank → patternNovelty → equipmentAvailabilityRank → name` — all existing, all
deterministic. New ACTIVE invariant: `oneRmFactor` appears in zero `.sort(` bodies. The invariant's
rationale is the general rule: **one coefficient, one semantic role, readable only by the subsystem
that owns that role.** `oneRmFactor` had two jobs; that, not its provenance, is what shipped a
contradiction.

**R2 — Two compound variants of the same movement pattern in one session: INADMISSIBLE.** Silence in
the corpus is the absence of a warrant, and the burden runs against the engine. Enforced in
`FOCUS_SLOTS` (fix the byte-identical chest slots), **not** in a sort. Tiered **ENGINEERING_DEFAULT
with the corpus gap flagged** — *not* as an NSCA citation, because that attribution is unverified.
Expansionist's "admissible when regions differ" is **rejected**: decline and flat differ in
sternocostal emphasis, so that rule would *permit the reported bug*. A rule that legalizes the
complaint is not a ruling.

**R3 + R4 — Volume caps and split design: BLOCKED.** Pending three verifications:
(a) hard-set counting — direct vs fractional; (b) whether *any* source supports a **per-session**
ceiling, since the weekly meta-analyses do not; (c) the two conflicting Notion volume tables.
Interim structural rule, adopted: **a per-session cap is weekly budget ÷ frequency, never a second
stored number.** Ship no numeric cap until (a)-(c) resolve. **Ship the coverage invariant now:**
≥2×/wk per trained muscle, and if 2 days/week cannot reach it the engine must **declare what it
drops** rather than silently dropping it. Promote D6b ACTIVE only in the change that makes it true.

**R5 — Supersets: the uncited .docx loses, on provenance before truth.** NSCA does support
agonist-antagonist paired sets, so the claim may be *true* and still inadmissible here. Separately,
*"must not compromise primary lift loads"* has no measurable predicate and cannot be an invariant as
written. **Freeze `SUPERSET_CFG`, zero code.** Expansionist's partner-alternation idea (the couple
alternating sets on one bar *is* antagonist pairing, rest enforced by the partner) is a **product
proposal for Kerwin**, not an adjudication.

**R6 — `strength` and `maintenance`: build them ONLY AFTER goal reaches the engine.** Grafting two
goals onto a system that flattens everything to `reps:10` multiplies one defect across 1,050 combos.
Weight-formula *structure* yes; each coefficient ships only with provenance.

**R7 — No uncited coefficient ships.** Including a replacement selection scalar, and including
anything wearing an `ENGINEERING_DEFAULT` label. **And the ban is theater unless retroactive:**
audit **D21** (no citation at all) and **D15** (uncited 8-12 wk ceiling with an allowlist that exists
because real programs violate it) in the same epic — plus `oneRmFactor`'s surviving use in
`seedWeight`/D26.

## The one thing to do first

**Define a hard set, and trace one number end-to-end to a pixel.**

Not the sort fix — that is one commit, blocked behind nothing, and goes the same day. But the *first*
thing is the measurement predicate: until a fly's contribution to pec volume is defined, "11" and
"36" are vibes, every volume ruling is unenforceable, and any gate written on them asserts a dead
value. Take the chest day, count it under an explicit definition, and confirm **the count the engine
computes is the count the render layer displays.** If it is not, that is the real epic and everything
else queues behind it.

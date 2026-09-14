# Council Transcript — Synergy-Aware Exercise Selection (EPIC, Notion page 3dbca37f-935b-8187-a0e0-dff9703486ce)

**Date:** 2026-09-14
**Convened by:** Kerwin, live in-session, in response to BUG-116's follow-on question.

## Original question (as posed to Claude)

Kerwin: *"Why is the 1RM factor the deciding factor between things getting elevated to the front of the line or not? I don't want you to decide the program based on the 1RM factor. I want you to describe it based on the synergies of all of the workouts together combined, so that all of those workouts hit major muscle groups and sub-muscle groups at a level for which they are properly attributed to best warrant the best results."*

## Framed question (sent to all 5 advisors verbatim)

Tandem architecture fork: how should exercise-selection tiebreaking work when multiple candidates are legally eligible for a compound slot?

**Background:** Tandem's program generator (`programs.js`) fills a training day from fixed muscle-group "slots" via two doctrine-gated-identical engines (`buildDynamicProgram`, `getSingleDay`). BUG-116 (just shipped, commit `ea9839d`) fixed a slot accepting candidates that matched the requested muscle only via a SECONDARY/synergist tag. The remaining winner-among-eligible-candidates tiebreak is `oneRmFactor` (loading capacity), which Kerwin objects to — he wants whole-program muscle-group synergy/coverage to decide instead.

**Constraints:** D18 (every slot pool non-empty at every tier — a regression was already found and avoided here), D19 (`groupsMatch` byte-identical across both engines, doctrine-gated), D20 (existing per-muscle recency tiebreak, ranks above `oneRmFactor` today), D1/D15 (primary/secondary compounds held stable 8+ weeks), D6/D6b (D6 ACTIVE goal-volume; D6b PENDING per-muscle MEV..MRV band — closest existing doctrine to "coverage"), BUG-108 (existing equipment-availability tiebreak after `oneRmFactor`). Source discipline: check the research PDF / Exercise Science Schema v0.5 for existing synergy/coverage guidance; if silent (likely — this is an engineering-design question), say so rather than dressing an engineering choice as science.

**Asked:** (1) concrete scoring/ranking mechanism, (2) precedence vs. D20/BUG-108, (3) day-fill-time vs. structural/joint change, (4) interaction with D1/D15 stability, (5) minimal vs. full version.

---

## Advisor responses (as given, before anonymization)

### The Contrarian
The proposal has a scope-mismatch that no scoring formula fixes: Kerwin asked for synergy across "all of the workouts together combined" — that's week/program-level — but the architecture on the table is still slot-by-slot, template-order, single-day fill. A "synergy score" computed at slot-fill time only knows what's already been picked earlier THAT DAY. That's not whole-program balance, it's greedy local balance with a fancier name. You can satisfy the new metric on every slot and still end up with a week where two days both lean on the same synergist muscle, because no day ever sees another day's picks. If the council blesses a per-slot synergy score without addressing this, it's solving a differently-shaped problem than the one Kerwin described and will get flagged again in three weeks as "the same bug, different symptom" — exactly the BUG-73/BUG-114 pattern the project's own rules call out, except this time at the architecture level, not the label-vocabulary level.

Second flaw: the framing quietly asks for a "concrete scoring mechanism... be concrete enough to hand to an implementer" on a question the prompt itself admits the source is silent on. That's an invitation to fabricate a coefficient system and dress it up as though it resolves Kerwin's ask, when it's actually 100% engineering judgment. Fine — that's legitimately this council's job — but the deliverable must be labeled as an engineering-design choice, not smuggled into doctrine as if D6b now "covers" it. If it gets written into DOCTRINE.md as SCIENCE_DEFAULT-tier, that's a fabrication exactly as bad as inventing a rep number.

Third: "minimal version that doesn't require a rewrite" is the path of least resistance and the path most likely to only fix the reported case (Day 1 shoulder slot) rather than the mechanism. Demand the minimal version still be defined at the shared comparator level, applied to every slot type, verified against actual generated output for multiple goals/day-counts — not just re-running Day 1 and calling it done.

### The First Principles Thinker
Wrong question. "What's the tiebreak formula" presumes slot-fill is the right layer to solve coverage at. It isn't — it's the layer that's easiest to patch, which is a different thing.

Strip it down: Kerwin's actual complaint is "does the WEEK end up hitting muscle groups proportionally." That is a property of a completed program, checked after generation — not a property you can guarantee by choosing well at each sequential slot. Sequential greedy selection literally cannot solve a joint-coverage problem correctly; every greedy algorithm on a joint-constraint problem is a heuristic that sometimes fails, no matter how clever the per-step score is. You already have the proof of this in your own bug report: BUG-116 was exactly a slot-time heuristic (muscle-tag matching) producing a program-level defect (chest overrepresented) that only became visible at the whole-program level. Replacing `oneRmFactor` with a "synergy score" and keeping slot-by-slot fill is the same architecture that produced BUG-116, wearing a new scoring function. You'll ship BUG-117 in three months when the new heuristic fails on some other day/goal combination, and the project's own "fix the mechanism not the instance" rule says that's the wrong kind of fix.

So: don't design a scoring signal. Design a validator. Generate the day/week with a cheap deterministic tiebreak (equipment tier > D20 recency > alphabetical, whatever — it barely matters), then run a **post-hoc muscle-coverage check** against D6b's MEV..MRV band per muscle, per week. If coverage is out of band, that's a flagged/logged deficiency the SYSTEM can react to on the *next* primary-block boundary (respecting D1/D15 stability), not something slot-selection silently self-corrects mid-week.

This reframes D6b from "orthogonal, closest existing doctrine" to: it IS the answer. Don't invent a new synergy score — implement D6b for real, as a program-level auditor, and stop treating exercise ranking as the place coverage lives.

Minimal version: log/flag imbalance. Full version, later: use the flag to reweight primary-compound selection at the next block boundary only.

### The Expansionist
The council keeps asking "what's the minimal safe fix." Wrong question. The real asset Kerwin is describing — "synergies of all the workouts together combined" — isn't a tiebreak, it's a coverage model of the whole program, and once it exists it's worth far more than resolving Day 1's shoulder slot.

Build it as a **muscle-coverage ledger**: for every muscle/sub-muscle, running weekly (and mesocycle) volume-by-role (primary-stimulus sets vs. synergist sets), computed once per day-fill as a lightweight prepass, not reinvented per slot. The tiebreak signal becomes: among primary-tag-eligible candidates, prefer whichever pulls the currently-most-underserved muscle toward its MEV/MAV band. That's not a bolt-on scorer — that's D6b (PENDING) turned live. Don't leave D6b as a parallel, unused doctrine entry while you hand-roll a separate synergy score next to it. This fork is the implementation of D6b. Ship them together and D6b graduates PENDING→ACTIVE in the same change, with a citation instead of a stub.

The upside case: once you're tracking per-muscle coverage as first-class state instead of an emergent side-effect of oneRmFactor sorting, you unlock things nobody's asked for yet but will want fast — a "coverage gap" badge in the UI ("your shoulders are under-trained this block"), a competitive-strategy signal (Dani vs. Kerwin balance comparison, since this is a couples app and symmetric development is a natural feature), and a foundation for adaptive deload/volume decisions that currently have nowhere to hook in. Don't build a scoring function that only a sort comparator reads — build a coverage object that the UI can also read. That's the actual moat line in this project's own north-star: "science-backed, periodized program that a biometric layer adapts." This is the biometric layer's missing input. Build it once, expose it twice.

### The Outsider
Recommendation: **weighted synergy score wins tiebreak, computed at day-fill time, positioned above BOTH D20 recency and BUG-108 equipment, but only within a two-stage gate** — don't touch the eligibility filter (that's BUG-116's job, already done), touch only what breaks ties among an already-primary-tagged pool.

**Mechanism:** For each candidate, compute `synergyScore = primaryContribution - overlapPenalty`, where `overlapPenalty` sums, across the candidate's OTHER primary/secondary tags, how much weekly volume those muscles already receive from slots filled earlier in the same day (not week — see below). A pure dedicated mover (OHP: primary=anterior_delt only) scores near-zero penalty; a dual-tagged press (High Incline: primary=pec+delt) gets penalized proportional to how saturated pec already is from the earlier chest slot. This directly encodes Kerwin's ask — "hit muscle groups at a level properly attributed" — without inventing a new per-exercise research number the source doesn't provide.

**Full precedence:** eligibility filter (primary-tag-only, D18-fallback-safe) → synergy score (new, primary tiebreak) → D20 recency (secondary) → oneRmFactor (tertiary, now a *within-muscle* quality signal, not the decider) → BUG-108 equipment (final). Recency and 1RM still matter, just demoted — this isn't a rewrite of their intent, it's a reordering, which is the minimal-diff way to satisfy the ask.

**Scope: DAY-fill, sequential, template-order** — not a joint solver. A full joint optimizer is the "later phase," not now: it's a genuinely bigger fork with its own correctness risk, and a same-day lookback (score against slots already filled this day, in template order) captures the actual complaint (two presses same day) without redesigning the engine.

**D1/D15 stability:** compute synergy score once at block-start slot-fill, cache the winner for the block's duration — same mechanism that already holds primary/secondary stable, don't re-score weekly.

This is engineering, not science — say that explicitly in the should/could/did audit; don't dress it up with a fake citation.

### The Executor
Monday morning: what do you actually type into the editor?

**1. Scoring mechanism.** Kill "synergy scoring" as a formula fantasy. Ship a two-key sort: `(primaryTagCount ascending, oneRmFactor descending)`. An exercise whose PRIMARY tags are `[anterior_delt]` only sorts above one tagged `[pec_major_clavicular, anterior_delt]` — fewer primary claims means it's not double-dipping into a muscle another slot already owns. That's it. That's Monday's diff: one comparator function, no new data model, no new table. It's crude but it directly kills the exact BUG-116 failure mode (dual-tagged press stealing a single-purpose slot) without inventing a coverage-optimizer nobody's validated.

**2. Precedence.** `primaryTagCount asc → D20 recency → oneRmFactor desc → BUG-108 equipment`. Recency stays above oneRmFactor because that's already shipped and D20-gated — don't relitigate it, just insert the new key in front of both. This is a one-line reorder in the existing comparator, not new architecture.

**3. Day-fill time, sequential, unchanged.** Joint week/day optimization is a rewrite with no committed spec and no doctrine backing it — do not start that Monday. Ship the comparator change first, watch it in the persona sweep, and only escalate to structural if the sweep shows the greedy sequential fill still starves a muscle group.

**4. D1/D15 stability**: comparator only runs at block-boundary selection time, same as today — no new re-roll trigger, so stability is inherited for free, not re-engineered.

**5. Minimal version is the whole recommendation above.** "Full version" (week-level joint optimization, D6b volume-band integration) is a distinct future epic — don't scope-creep it into this fix. Write it down, don't build it now.

Implementer next step: patch the sort comparator in `programs.js`, run `validate:personas`, confirm D18 pool non-empty at `home` tier, run doctrine gate, commit.

---

## Anonymization mapping (for peer review)

- **Response A** = The Outsider
- **Response B** = The Executor
- **Response C** = The Contrarian
- **Response D** = The First Principles Thinker
- **Response E** = The Expansionist

## Peer reviews (5 independent reviewers, each given all 5 anonymized responses)

**Reviewer 1 (Contrarian lens):**
Strongest: A — complete, concrete, implementable, explicitly labels itself engineering-not-science. Biggest blind spot: B — solves BUG-116's exact shape but never engages whole-program synergy; `primaryTagCount` is orthogonal to week-level balance. All five missed: no response specifies how the mechanism gets *verified* against real generated output (extract N weeks, compute actual per-muscle volume, diff against D6b bands); none addresses whether synergy state is scoped per-user (Dani vs. Kerwin running independent programs).

**Reviewer 2 (First Principles lens):**
Strongest: A — answers the concrete question and is honest about epistemic status, without dodging into "build a different system" the way C/D/E do, but doesn't fabricate a citation either. Biggest blind spot: B — mistakes "ships fast" for "answers the question," never flags that `primaryTagCount` can't detect Monday-and-Thursday both hammering rear delts. All five missed: no verification plan (per CLAUDE.md's "verify by running, not reading"); none specifies which goal×split×day-count sweep would need to run to confirm no muscle gets silently starved.

**Reviewer 3 (Expansionist lens):**
Strongest: E — treats the fork as an opportunity, correctly identifies D6b sitting PENDING and unused as the actual missing piece, graduates it with the fix rather than inventing a parallel system ("one rule, one home"). Biggest blind spot: B — optimizes for "ships Monday" so hard it discards Kerwin's actual premise; `primaryTagCount` isn't a synergy signal, it's a BUG-116 re-skin. All five missed: no concrete post-hoc metric/test that would let anyone confirm coverage actually improved vs. merely changing which exercise wins ties.

**Reviewer 4 (Outsider lens):**
Strongest: A — implementable mechanism, correctly scoped (day-fill, not a rewrite), explicit precedence chain, explicit D1/D15 answer, self-labels as engineering judgment. Biggest blind spot: B — `primaryTagCount` doesn't measure coverage at all, conflates "avoids double-dipping" with "balances the muscle group across the week"; can pass Kerwin's exact complaint case while looking like it addressed BUG-116's shape. All five missed: no regression-detection plan against BUG-116's specific failure; none propose a doctrine invariant/gate for the new rule (ACTIVE or PENDING in DOCTRINE.md + scripts/doctrine.mjs) — a new cross-cutting rule left ungated is the exact silo CLAUDE.md's "one rule, one home" warns about.

**Reviewer 5 (Executor lens):**
Strongest: A — ships an actual mechanism (formula), correctly positioned vs. D20/BUG-108, respects D1/D15 via caching, stays inside slot-fill, labels itself engineering-not-science. Biggest blind spot: E — most ambitious (ledger, live MEV/MAV tracking, D6b graduation, UI badge) but never addresses D18: a coverage-seeking tiebreak that always prefers the most-underserved muscle can starve a legitimately-needed exercise from a pool, with no stated fallback; also skips the precedence-vs-D20/BUG-108 question the prompt explicitly asked. All five missed: no response specifies what a passing/failing verification check looks like before declaring the fix done.

**Convergence across all 5 reviewers:** Response A (The Outsider) was independently ranked strongest by 4 of 5 reviewers; Response E (The Expansionist) by 1 of 5. Response B (The Executor) was independently flagged as the biggest blind spot by 4 of 5 reviewers, for the same reason each time: `primaryTagCount` doesn't actually measure synergy/coverage, it's a narrow re-skin of BUG-116's specific failure shape. Every single reviewer, independently, flagged the same missing piece across ALL five responses: **no concrete verification/regression plan** for the new mechanism.

---

## Chairman synthesis

### Where the Council Agrees
- `oneRmFactor` is the wrong tiebreak signal and must be demoted, not replaced with an equally narrow local heuristic (B's `primaryTagCount` was rejected by 4/5 reviewers for exactly this reason — it re-skins BUG-116's specific shape rather than answering Kerwin's actual ask).
- Whatever ships must respect D18 (non-empty pools, with the already-found home-tier fallback), D19 (byte-identical extraction across both engines), D1/D15 (block-stability — no weekly reshuffling), and state its position in the BUG-108/D20 precedence chain explicitly, not accidentally.
- This is engineering judgment, not science — every advisor who addressed it (A, C) said so plainly, and the source material is genuinely silent on the specific mechanism. Label it that way in the should/could/did audit; do not write it into DOCTRINE.md as a cited SCIENCE_DEFAULT clause.
- **The single most convergent finding of the entire council:** none of the five proposals specify how the new mechanism gets verified against real generated output. All five independent peer reviewers flagged this, unprompted, as the biggest gap — this is a load-bearing agreement, not a minor note.

### Where the Council Clashes
The real fork is **layer**, not mechanism-quality: A and B keep the fix at slot-fill time (day-level, sequential, minimal diff) vs. C, D, and E, who argue slot-fill time structurally cannot deliver what Kerwin actually asked for ("synergies of all the workouts together combined" — explicitly whole-program, not one day). C's framing is the sharpest version of this: a per-slot score computed with same-day-only visibility is greedy local optimization wearing a synergy costume, and it can pass every slot-level check while still leaving two different days both overloading the same synergist muscle.

Nested inside "escalate to D6b" (which D and E both land on independently, without prompting) is a second, unresolved fork: D wants a **post-hoc validator** — generate with a cheap tiebreak, then flag/log imbalance and react only at the next block boundary (reactive). E wants a **live-computed coverage ledger** consulted at slot-fill time itself (proactive). These are genuinely different systems with different risk profiles, and the peer reviews correctly caught that E's live version has no stated D18 fallback (Reviewer 5's point) — a "pick whatever most under-serves the current muscle" rule can starve a slot exactly the way the unguarded primary-only filter almost did in BUG-116's own fix.

### Blind Spots the Council Caught
1. **No verification plan, in any of the five proposals.** Whatever ships needs a concrete check in the same shape as the project's own persona sweep: generate N programs across goal × day-count × tier, extract per-muscle weekly volume, diff before/after, confirm no muscle silently drops out of band. This is not optional per this project's own "verify by running, not by reading" standard — it is the same discipline BUG-116 itself was shipped under.
2. **No stated D18 fallback** for a coverage-seeking ("most underserved wins") mechanism — this needs the identical soft-fallback pattern BUG-116's fix already established (never let the stricter rule empty a pool; fall back to the coarser rule when it would).
3. **No mention of whether Dani's and Kerwin's independently-generated programs share any coverage state** — they obviously shouldn't, but "obviously" is exactly the word that produces silent cross-user bugs later; this needs one explicit line in the implementation, not an assumption.
4. **No doctrine gate proposed for the new rule.** A cross-cutting selection rule that isn't captured as an ACTIVE or PENDING invariant in DOCTRINE.md + `scripts/doctrine.mjs` is precisely the kind of silo this project's own "one rule, one home" principle exists to prevent — it will drift the way the pre-BUG-116 `oneRmFactor` tiebreak drifted into being load-bearing without anyone deciding it should be.

### The Recommendation
Ship this in two explicitly separate phases — do not let them blur together, per the peer-reviewed critique that conflating "decide correctly at selection time" with "audit correctness after the fact" risks neither getting built well.

**Phase 1 (build now):** Take the Outsider's mechanism (`primaryContribution - overlapPenalty`) — it was independently ranked strongest by 4 of 5 reviewers and is the only proposal concrete enough to hand an implementer directly — but correct its one real flaw (also independently caught: it's day-scoped, "not week-scoped," which inherits the Contrarian/First-Principles objection that day-scoped-only is the same architecture shape that produced BUG-116). Fix that by computing `overlapPenalty` against a lightweight per-user, per-muscle **weekly volume ledger** (the Expansionist's contribution) rather than "slots filled earlier this same day" — this one change converts the Outsider's already-vetted formula from local to whole-week without inventing a second competing mechanism. Precedence stays as the Outsider specified: eligibility filter → synergy score (new) → D20 recency → `oneRmFactor` (demoted to within-muscle tiebreak only) → BUG-108 equipment. D1/D15 stability: resolve and cache the pick at block-start, exactly as the Outsider and Executor both independently specified — the ledger informs the block's starting selection; it does not re-fire weekly. Give the new mechanism its own doctrine entry (start PENDING if the D6b dependency below isn't ready yet) rather than leaving it as an undocumented tiebreak the way `oneRmFactor` itself was. Ship it with a verification pass in the exact shape all five reviewers demanded: generate programs across every goal × day-count × tier, dump per-muscle weekly volume before/after, confirm no muscle silently drops out of coverage and no D18 pool goes empty.

**Phase 2 (file as a separate, later Epic — do not build now):** The First Principles Thinker's post-hoc validator (flag/log real imbalance, react only at the next primary-block boundary) is a genuinely good, genuinely different idea — an audit layer on top of Phase 1's decision layer, useful for catching whatever Phase 1's necessarily-imperfect heuristic still misses. Building it now would blur two systems that need to be evaluated independently; file it once Phase 1 has real output to audit against.

### The One Thing to Do First
Before writing any ranking code: promote **D6b from PENDING to ACTIVE** with a real citation (or an honestly-flagged unsourced engineering default, the same pattern D28 already uses in this codebase, if the literature genuinely doesn't specify numeric MEV/MAV bands per sub-muscle). Phase 1's ledger has nothing to compare weekly volume against until D6b's bands exist as a real, doctrine-gated table — this is a research step (the exercise-science-research skill is mandatory here per this project's own prime directive), not a code step, and every other part of this recommendation sits on top of it.

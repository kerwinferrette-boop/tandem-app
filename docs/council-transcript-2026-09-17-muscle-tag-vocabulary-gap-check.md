# LLM Council Transcript — `claude/muscle-tag-vocabulary` D30 gap-check
**Date:** 2026-09-17 · **Requested by:** Kerwin ("Council: gap-check only") · **Topic:** does the stale, unmerged `claude/muscle-tag-vocabulary` branch contain a genuine, worth-salvaging gap relative to current `main` — specifically the D30 movement-pattern-uniqueness mechanism (`MOVEMENT_PATTERN` table + `patternClash` comparator)?

## Original question (Part A branch triage)
> `claude/muscle-tag-vocabulary` looks stale/superseded by main's own recent EPIC-41/D29-D30 reconciliation, not simply unmerged. Merging it raw would delete work main has since gained (claims-on-origin.mjs, health-snapshot function, ~1400 tandem.html lines). How should I proceed?

Kerwin's answer: **"Council: gap-check only"** — reframing the question from "should we merge this branch" to "what does this branch have that main doesn't, and is it worth re-authoring."

## Framed question put to the council
> Tandem's exercise-selection engine has a doctrine invariant D30 ("No two COMPOUND exercises of the same movement pattern in one session", council ruling R2, ENGINEERING_DEFAULT status per `docs/council-science-application-2026-09-14.md` — mechanism-only, not the rule itself, cited to ACSM 2009 PMID 19204579). Main currently only patches ONE specific instance of this violation directly (`FOCUS_SLOTS.chest`'s byte-identical-slot case, fixed 2026-09-18 commit `39d2187`), and `doctrine.mjs`'s own PENDING note admits a second live case remains unfixed: `buildDynamicProgram`'s `TEMPLATES.day2` secondary slot ('quad') collides with day4's primary ('quad') once a 3-day split merges both days.
>
> An unmerged branch, `claude/muscle-tag-vocabulary`, built a full general-purpose mechanism for this: a `MOVEMENT_PATTERN` table (72 compound exercises classified into 8 patterns: horizontal_push, vertical_push, horizontal_pull, vertical_pull, squat, lunge, hinge, bridge) plus a `patternClash(e, usedPatterns)` comparator, with its own dedicated smoke test (`movement-pattern-smoke.mjs`) enforcing the table/bank stay 1:1. This mechanism does NOT exist anywhere on current main.
>
> The problem: this branch is now 3+ months stale relative to main. In that time, main's comparator chain evolved substantially past what the branch was built against — main now has `primaryOnlyMatch`/`coverageCount` (replacing an older synergist-vs-primary ranking bug) and D31's opt-in exercise-instance variety layer, none of which existed when the branch's `patternClash` was authored. Raw-merging the branch would also DELETE real work main has since gained elsewhere (`scripts/claims-on-origin.mjs`, the health-snapshot ingest edge function, ~1400 net lines of `tandem.html`, multiple migrations).
>
> The decision: is there a real, valuable gap here worth re-authoring against current main's comparator chain, or is this better left as a documented future work item?

---

## Advisor Responses

### The Contrarian
Every fact in this setup checks out — I pulled `doctrine.mjs` directly and the D30 entry says almost verbatim what's in the prompt, including "needs... re-authored against current main... not transplanted." That makes the actual dispute smaller than it's being sold as, and that's my objection: **this whole council question is a decoy.**

Nobody serious says yes to porting stale integration code into a comparator chain that's since evolved past it, and the prompt already answers its own question — `doctrine.mjs` explicitly says "not transplanted." There's no live debate on the integration code. Dressing this up as a two-sided dilemma manufactures deliberation where none is needed.

The real decision hiding underneath — is the TABLE DATA (72 exercises → 8 patterns) worth extracting even though the code around it is dead — also isn't hard, and the prompt is quietly loading the dice toward "leave it as future work" by emphasizing staleness, deletion risk, and "only one scenario so far." That's a false trade. Extracting a static classification table costs nothing near what a full merge costs — it's a `git show branch:path -- table` and a diff review, not a merge.

The bigger tell: this is the second live D30 violation, in a 3-day split — not a hypothetical. "Only one scenario so far" undercounts by construction, because nobody has run the full goal×days×sex×tier sweep against `patternClash` logic to find the others. Given `validate:personas`/`persona-combos.mjs` already exists and covers exactly this axis, the correct move per this repo's own stated rule ("fix the mechanism, not the instance") is to run that sweep against a *reconstructed* `patternClash` before concluding it's a one-off. Nobody proposed that. That's the actual gap.

### The First Principles Thinker
The question as framed is "salvage the branch or defer it" — that's a merge-logistics question dressed up as an engineering decision. Strip it back further: what is D30 actually for?

D30 exists so a session doesn't stack two compounds hitting the same movement pattern. That's a property of the *output* of exercise selection, not a property of any particular data structure. The branch's answer — a static `MOVEMENT_PATTERN` lookup table classifying 72 exercises into 8 buckets, checked by a comparator — is one implementation of that property. It is not the only one, and given that main's comparator chain (`primaryOnlyMatch`/`coverageCount`) has since evolved a *ranking* concept the branch never had, a static classification table may not even be the right shape anymore. You may not need a table at all if pattern-membership can be derived from the same signals `coverageCount` already computes.

So the real first-principles question isn't "port the table or not" — it's "what is the minimal, general check that guarantees D30 holds for every session the engine can produce, expressed in terms of the comparator chain as it exists TODAY." That's a from-scratch design question, not a porting question. The branch is useful only as a reference for *data* and as a cautionary tale that a point-fix architecture (`FOCUS_SLOTS.chest` patch) will keep generating one-off symptoms forever, because the actual defect is "nothing globally enforces D30," not "chest happens to violate it."

Don't ask "salvage or defer." Ask "what does D30-as-invariant require of the current selection function," design that fresh, and use the branch's table as a citation-checked data source, nothing more.

### The Expansionist
The frame here is wrong-sized. Everyone's arguing about whether this is worth doing to fix one 3-day-split collision. That's the least interesting reason to do it.

The `MOVEMENT_PATTERN` table is a classification of the entire compound exercise vocabulary into biomechanical categories. That's not a bugfix asset — it's a taxonomy asset. Once 72 compounds are pattern-classified, you don't just get "don't collide the same pattern twice." You get the substrate for things nobody's asked for yet:
- **Antagonist-pairing logic** — horizontal_push paired deliberately with horizontal_pull in the same session is a legitimate hypertrophy/efficiency technique, not just a collision to avoid.
- **Weekly pattern-frequency balancing** — right now nothing stops a whole week overloading vertical_push and starving hinge. That's a bigger integrity gap than one session's collision.
- **The biometric adaptation layer** (the actual moat, per CLAUDE.md) has nothing today that speaks in movement-pattern terms — it speaks in muscle groups and load. Pattern classification is the missing vocabulary layer.

So the real question isn't "port the stale branch to fix one collision." It's: re-author the table now, while it's cheap, decoupled from any specific comparator, and land it as a standalone data asset with its own smoke test — before three more comparator-chain evolutions make the eventual port cost even higher. The collision fix is the excuse. The taxonomy is the prize.

### The Outsider
I don't know what any of these acronyms mean, and I think that's the point of asking me.

Here's what I see, stripped of jargon: you have a known bug (two heavy leg exercises back-to-back on the same day) with a fix that only works for the chest version of the bug. You have a second, confirmed instance of the same bug that nobody has fixed. And you have an old, abandoned branch that built a real general fix for the underlying problem — but the branch is old enough that it doesn't talk to the current code, and grabbing it wholesale would delete four months of other people's work.

That's not actually a hard call. You don't merge the branch. You don't leave the bug either. You take the one thing from that branch that isn't code — the table that says "these 72 exercises belong to these 8 movement categories" — because that table is just data, it doesn't care what the surrounding code looks like, and it's the hard, tedious part someone already did. You throw away the branch's actual comparator logic, because that part is provably obsolete against your current system.

Then you write the small connector function fresh, today, against what main actually looks like now. That's a day of work, not a rewrite, and it closes both the known bug and its unfixed twin with one mechanism instead of two patches.

Calling this "future work" is the wrong frame — you're not deferring a feature, you're leaving a second copy of a bug you already found sitting in production while a 90%-finished fix for it rots on a branch nobody's touching.

### The Executor
Monday morning, here's what actually happens: you don't merge the branch. You don't cherry-pick "integration code" that doesn't fit the current comparator shape — that's a fantasy edit that turns into a rewrite the moment you open the diff. What you CAN do in under an hour is:

1. Open `claude/muscle-tag-vocabulary` in a worktree, `git show` the `MOVEMENT_PATTERN` table definition, and copy the 72-exercise classification as a flat data literal into a new file or into `programs.js`. That's data, not logic — it survives 3 months of drift untouched because exercise names and movement patterns didn't change. Fifteen minutes.
2. Write a NEW `patternClash(e, usedPatterns)` function against current main's actual comparator chain (`primaryOnlyMatch`/`coverageCount`), using the ported table as its only dependency. Don't try to adapt the branch's old comparator-era version — it's fighting the wrong interface. Write it fresh, cite D30/R2 in the commit.
3. Fix the ONE known live case (day2/day4 'quad' collision) using the new function instead of another point-patch. That's your proof it works, and it directly resolves the PENDING doctrine note instead of leaving it open.
4. Port `movement-pattern-smoke.mjs`'s intent (table/bank 1:1 check) as a new smoke test against the CURRENT `EXERCISE_BANK`, not the branch's stale copy — the branch's version will fail immediately on any bank drift.

That's a half-day of work, not a research project. Skip the branch-vs-main philosophizing — salvage the data, rewrite the 50 lines, ship the one real fix. Don't let "documented future work item" be code for "nobody does this until it breaks in front of Kerwin."

---

## Peer Reviews

Reviewers saw the 5 responses above anonymized as A=First Principles, B=Expansionist, C=Outsider, D=Executor, E=Contrarian.

### Reviewer 1
This confirms Response E's key factual claims directly against `scripts/doctrine.mjs`: D30 is `SCIENCE_DEFAULT`, marked PENDING (`FOCUS_SLOTS.chest`'s instance is patched, `TEMPLATES.day2/day4` is the unfixed comparator-level case), and there's an explicit prior collision/renumbering history with the `claude/muscle-tag-vocabulary` branch (D29/D31 disputes) — all matching the prompt precisely.

1. **Strongest: Response D.** It's the only response that produces an actual executable plan scoped to the repo's real artifacts. It correctly separates "port data, rewrite logic" (matching CLAUDE.md's "one rule, one home" and "fix the mechanism" doctrine) into concrete steps with time estimates, and it explicitly ties the fix to the PENDING doctrine note rather than treating this as abstract philosophy.
2. **Biggest blind spot: Response B.** It reframes the whole question into a taxonomy/roadmap pitch that is speculative scope creep unsupported by any cited source — exactly the "sounds right in the domain" move CLAUDE.md prohibits. It never engages with the actual PENDING doctrine gap or the second live violation.
3. **What all five missed:** None verified the claim by reading `scripts/doctrine.mjs` directly the way Response E claims to have. None pointed at the specific text `TEMPLATES.day2/day4` or that D30 already has a documented PENDING row with an owner/status. None mention running `validate:personas`/the persona-combos sweep against a reconstructed `patternClash` before/after the fix as a mandatory gate.

### Reviewer 2
1. **Strongest: D.** It's the only response that converts the decision into a concrete, scoped, time-boxed plan: port table as data, write a fresh comparator against current main, fix the actual known live case, and port the smoke test's intent. It directly answers "salvage table, not integration code" as asked.
2. **Biggest blind spot: B.** It abandons the actual question for an unscoped taxonomy-expansion pitch with no citation that these are real requirements — exactly the "plausibility-first" reasoning CLAUDE.md's Prime Directive forbids. It never proposes fixing the second known violation at all.
3. **All five missed:** none proposes running `validate:personas`/`persona-combos.mjs` sweep to enumerate every live D30 violation across goal×days×sex×tier before calling this "one instance plus one instance" — except E, which raises it but doesn't act on it. Also none checks whether D30 should be promoted from PENDING to ACTIVE in `doctrine.mjs` as part of shipping the fix, per the repo's own rule.

### Reviewer 3
This confirms the setup: D30 is currently `SCIENCE_DEFAULT`/PENDING (no gate teeth yet, not ACTIVE), `FOCUS_SLOTS.chest` is a one-off patch, and `TEMPLATES.day2/day4` is the confirmed unfixed second case.

1. **Strongest: D.** The only one that produces an actual plan with a scope estimate, sequences the work correctly, and correctly refuses the two bad extremes (raw-merge, and "just leave it as future work"). It's falsifiable and cheap to check against reality.
2. **Biggest blind spot: A.** It reframes the whole question into "design a fresh invariant check," explicitly refusing to answer the porting question asked. It's philosophically clean but operationally useless.
3. **What all five missed:** None of them checked `doctrine.mjs` itself, which already states the answer in the PENDING note: D30 is `SCIENCE_DEFAULT`, not ACTIVE — meaning there is currently **no gate enforcing it at all**, so "leave as future work" isn't neutral, it's a live silent gap (per the repo's own D17 principle). All five also skipped the concrete next step: promoting D30 from PENDING to ACTIVE requires the fix to land *and* the doctrine table/gate to be updated in the same change.

### Reviewer 4
1. **Strongest: D.** It's the only response that produces an actual plan matching what `DOCTRINE.md`'s own D30 row already specifies: re-author `patternClash` "against main's current `primaryOnlyMatch`/`coverageCount`/D27/D31 comparator chain... not copy-pasted from a now-stale snapshot." D names that exact chain, timeboxes the work, and ships the actual confirmed-live fix as proof.
2. **Biggest blind spot: A.** It speculates that pattern-membership "might be derivable from signals `coverageCount` already computes" — but `coverageCount` measures muscle-group coverage, a different axis than movement pattern. This conflation turns a well-scoped engineering task into an open-ended redesign question.
3. **What all five missed:** None connect this to CLAUDE.md's own non-negotiable — "promote a PENDING invariant to ACTIVE in the SAME change that makes it true." D30 is currently `⏳ PENDING`. Any fix that closes the day2/day4 case obligates flipping D30 to ACTIVE with a wired smoke test in the same commit. Also unaddressed: whether a full persona sweep should be the gate's own regression check going forward.

### Reviewer 5
1. **Strongest: D.** It's the only response that names the actual live case from `doctrine.mjs`'s own PENDING note (day2/day4 'quad' collision), gives a concrete worktree-based extraction plan, and closes the loop by porting the smoke test's *intent* rather than its stale bytes.
2. **Biggest blind spot: B.** It abandons the actual question — two live D30 violations, one patched, one not — and pivots to a taxonomy/roadmap pitch nobody asked for. That's the exact scope-creep CLAUDE.md's minimal-change and "fix the mechanism, not the instance" rules warn against.
3. **What all five missed:** none checked the branch's actual git history the way the 2026-09-18 council reconciliation (`docs/council-r1-reconciliation-2026-09-18.md`) already did for this same branch's D29 work — finding a *later* tip commit (`1ae6ea5`) where `patternClash` was already composed into a chain resembling today's (`primaryOnlyMatch → coverageCount → primaryMatchRank → patternClash → freeWeightRank`), just stale against D27/D31/BUG-108b/EPIC-41. That precedent suggests "re-verify a known-good shape against a moved target," not full redesign or ground-up rewrite — a cheaper path none considered.

---

## Additional facts verified directly against the live repo (not asserted by any advisor)

- `docs/council-r1-reconciliation-2026-09-18.md` is real and confirms Reviewer 5's claim: branch tip `1ae6ea5` contained a working, composed `patternClash` alongside `primaryMatchRank`/`equipmentAvailabilityRank`/`freeWeightRank`, verified via `git show origin/claude/muscle-tag-vocabulary:programs.js` at that commit.
- That prior council's recommendation was scoped ONLY to removing `oneRmFactor` from comparators and adding `primaryMatchRank`/`freeWeightRank`/`equipmentAvailabilityRank` — it explicitly did NOT include re-adding `patternClash`.
- Current `programs.js` confirms that recommendation was since shipped: `primaryMatchRank` (~2110, ~2551 — two copies), `equipmentAvailabilityRank` (~2027), `freeWeightRank` (~2061) all exist and are wired into both `select()`-family comparators today.
- Current `programs.js` confirms `patternClash` does **not** exist anywhere in the file today (zero grep matches). The D30 gap is real, current, and unaddressed by the work already shipped from this branch.
- Main's actual current chain is `primaryOnlyMatch → coverageCount → primaryMatchRank → equipmentAvailabilityRank → freeWeightRank → (alphabetical fallback)` — one step further evolved than any advisor's snapshot. Per the branch's own already-proven-working ordering at `1ae6ea5`, `patternClash`'s correct insertion point is between `coverageCount` and `primaryMatchRank`.

---

## Chairman Synthesis

### Where the Council Agrees
Every advisor converges on the same practical answer even where their reasoning diverges: **do not raw-merge the branch.** The branch's integration code is stale, main has moved substantially since it was cut, and a wholesale merge would delete real work. Four of five advisors (First Principles is the partial exception, and even it agrees the *table* isn't necessarily sacred) also agree the 72-exercise MOVEMENT_PATTERN classification is the one artifact worth carrying forward as data, decoupled from the branch's comparator logic. There's also unanimous, if implicit, agreement that "leave as documented future work" undersells what's actually sitting here: a named, cited (D30/R2/PMID 19204579), doctrine-registered gap with a second confirmed live instance, not a hypothetical.

### Where the Council Clashes
The real fork is scope, not salvage-vs-defer. The Expansionist wants to promote this into a taxonomy investment (antagonist pairing, weekly pattern-frequency balancing, biometric-layer vocabulary) — an uncited scope expansion that four reviewers independently flagged as abandoning the actual question asked, and which the Prime Directive's "no plausibility-first" rule and "fix the mechanism, not the instance" rule don't license on their own. The First Principles Thinker wants a ground-up redesign, floating that pattern-membership might be derivable from `coverageCount` — which Reviewer 4 correctly identifies as factually wrong (coverageCount is a muscle-group-coverage axis, not a movement-pattern axis), so that path risks paralysis solving an already-answered question. The Executor and Contrarian are closest to correct, but even the Executor's plan targets a comparator chain (`primaryOnlyMatch`/`coverageCount`) that is now confirmed one step behind main's actual current chain.

### Blind Spots the Council Caught
All five advisors — and by extension all five peer reviews grading them — worked from a snapshot of main that is now confirmed stale in a specific, load-bearing way: none of them knew that `primaryMatchRank`, `equipmentAvailabilityRank`, and `freeWeightRank` have *already shipped* from a prior council recommendation on this same branch (`docs/council-r1-reconciliation-2026-09-18.md`), and that `patternClash` was deliberately left out of that shipment. That prior council also already did the git-archaeology work — verifying via `git show` that branch tip `1ae6ea5` contains a *working, composed* `patternClash` sitting correctly in a chain resembling today's. Reviewer 5 was the only one to surface this; the other four reviews (and all five advisors) missed it entirely. This changes the shape of the problem: this is not "design or port a mechanism from scratch," it is "re-verify and re-insert a mechanism whose correct integration point is already known and previously proven to compose correctly." The council also converges, across multiple reviewers, on a second real miss no advisor addressed operationally: D30 is currently `PENDING` in `doctrine.mjs`, meaning **no gate enforces it today** — under this repo's own D17 logic, calling this "future work" is not a neutral deferral, it's an unenforced live gap. CLAUDE.md is explicit that promoting a PENDING invariant to ACTIVE must happen in the *same change* that makes it true — none of the five advisors' plans include this step, though several reviewers named it.

### The Recommendation
Re-author, don't defer, and re-author narrower than any advisor proposed. Concretely:

1. Extract the MOVEMENT_PATTERN table (72 exercises → 8 patterns) as a flat data literal — this part of every advisor's plan is correct and verified-cheap.
2. Re-insert `patternClash` into the **current, confirmed** comparator chain — `primaryOnlyMatch → coverageCount → patternClash → primaryMatchRank → equipmentAvailabilityRank → freeWeightRank → (alphabetical fallback)` — using the ordering already proven to compose correctly at branch tip `1ae6ea5`, verified against current `programs.js`, not reconstructed from a stale mental model of main's shape.
3. Fix the confirmed-live `TEMPLATES.day2`/`day4` 'quad' collision using this mechanism, closing the `doctrine.mjs` PENDING note directly.
4. In the same commit: flip D30 from `PENDING` to `ACTIVE` in both `DOCTRINE.md` and `doctrine.mjs`, wire a smoke test (porting the branch's test *intent* — table/bank 1:1 coverage — against the current 179-slug bank, not its stale copy), and run the full persona-combos/`validate:personas` sweep against the reconstructed `patternClash` before declaring this a one-instance fix — the day2/day4 case is the *known* instance, not necessarily the *only* one.
5. Do not act on the Expansionist's taxonomy-expansion pitch as part of this change. It may be a legitimate future asset, but it is a separate, uncited scope decision that belongs in its own `llm-council` pass, not folded into a doctrine-gap bugfix.

Reject the "leave as future work" framing outright: D30 PENDING + a confirmed second live violation + zero enforcing gate is not a neutral backlog item, it's an open D17-shaped hole that just hasn't bitten anyone loudly yet.

### The One Thing to Do First
Run `git show origin/claude/muscle-tag-vocabulary:programs.js` at commit `1ae6ea5` and diff its `patternClash` + comparator-chain composition against current `programs.js`'s actual chain (`primaryOnlyMatch → coverageCount → primaryMatchRank → equipmentAvailabilityRank → freeWeightRank`). Confirm the exact insertion point and function signature compatibility before writing a single new line — the prior council already proved this composition works once; verify it still slots in cleanly against today's chain rather than re-deriving it from scratch or from an outdated assumption about main's shape.

---
*Council convened 2026-09-17. 5 advisors, 5 peer reviewers, 1 chairman — all via the `llm-council` skill's sub-agent orchestration process. Companion report: `docs/council-report-2026-09-17-muscle-tag-vocabulary-gap-check.html`.*

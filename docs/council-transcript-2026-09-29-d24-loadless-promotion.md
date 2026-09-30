# LLM Council Transcript — D24 loadless-clause promotion
**Date:** 2026-09-29
**Topic:** Should the BUG-188 loadless-progression rule be promoted from verify smoke check #27 to formal doctrine — and if so, as a clause amending D24 or as a new numbered invariant?

---

## Original question

"Run the llm-council on the D24 loadless-clause promotion" — i.e., should the BUG-188 rule
(0-lb logged set → `weight:null` + rep-progression coaching, never a fabricated load; weighted
lifts still ladder) be promoted from `scripts/loadless-progression-smoke.mjs` (verify check #27,
commit `6b627e8`) into `/DOCTRINE.md` + `scripts/doctrine.mjs`, or remain smoke-gated? If
promoted: D24 clause vs. new numbered invariant, and which tier (SAFETY / SCIENCE_DEFAULT /
SPLIT per the D8 precedent)?

## Framed question (as given to all advisors)

QUESTION: Should Tandem (a couples fitness app) promote its new "loadless progression" rule from a CI smoke test to formal doctrine — and if so, as a clause amending existing invariant D24, or as a new numbered invariant?

CONTEXT:
- Governance model: /DOCTRINE.md holds numbered binding invariants (D1..D30), each enforced executably by scripts/doctrine.mjs — "the doctrine gate", the ONLY correctness gate among 27 verify checks (the other 26 are regression smokes: green = "same as last ship", never "right"). Doctrine rows carry: rule text, a tier (SAFETY / SCIENCE_DEFAULT / ENGINEERING_DEFAULT), a citation, and a Notion mirror page. Change order is Notion-first: update the Notion source-of-truth page, then DOCTRINE.md, then doctrine.mjs, together in one change. A doctrine violation is "wrong by definition" and cannot ship.
- D24 (ACTIVE): "A load progression is a PERCENTAGE of the load the user actually lifted, never a fixed pound increment — and the trigger is a rep surplus, not a calendar." Cites ACSM position stand PMID 19204579 (2-10% increase when 1-2 reps over target). D24 already carries two honestly-flagged open caveats (the ACSM "2-for-2" consecutive-session half is unimplemented; a rounding floor can exceed 10% on very light lifts). D24 is silent on loadless (0-lb) movements.
- The new rule (BUG-188, shipped): when the logged load is 0 (bodyweight/band work, blank weight cell), the recommendation engine must never fabricate or render a load — it returns weight:null plus rep-progression coaching ("Add reps" / "Hold steady" / "Build reps"), reusing D24's existing rep-surplus trigger rather than inventing a threshold. Citation: Plotkin et al., PeerJ 2022 (PMID 36199287) — rep progression and load progression produce comparable adaptations over an 8-week cycle. The guard is weight-keyed, not equipment-keyed: a weighted pull-up at +25 lb still ladders normally.
- Current enforcement: verify check #27, loadless-progression-smoke.mjs — vm-extracts the LIVE engine and sweeps 50 loadless movements × 5 goals × 3 weeks × 3 rep cases asserting weight:null rep coaching, plus 130 weighted movements still laddering. Negative control verified: deleting the guard produces 2800 failures. This smoke runs in CI on every push/PR, exactly like the doctrine gate.
- What promotion buys: doctrine rows are the project's institutional memory (citation + tier + Notion mirror survive sessions); doctrine status gives authority to reject future changes as "wrong by definition"; the project has a standing directive to promote hard rules ("the gate is the memory"). What it costs: the Notion-first ceremony; doctrine dilution risk if the rule isn't actually invariant-grade; doctrine rows historically accumulate caveats and citation corrections (D30's citation was later found unverifiable-by-file).
- Tier sub-question if promoted: the rule has two halves — "never show a fabricated load" (kin to SAFETY-tier D23/D25/D26, all of which are 'no invented number reaches the user' rules) and "progress loadless work by reps" (a science claim resting on one 8-week study — SCIENCE_DEFAULT?). Precedent exists (D8) for a SPLIT tier designation.
- Stakes: doctrine is the project's law. A wrong promotion dilutes it. A missed promotion leaves a safety-class rule one refactor away from silent regression — though note the smoke would already catch that unless someone deletes the smoke itself.

---

## Advisor responses

### The Contrarian

The flaw nobody's naming: the guard is weight-keyed, and that conflates two different states. "Logged load = 0 because this is a band pull-apart" and "logged load = 0 because the user left the weight cell blank on a barbell squat" are not the same event. The first deserves rep coaching; the second is *missing data*, and answering missing data with "Add reps" is itself a fabricated recommendation — exactly the sin the rule claims to prevent. Promote this to doctrine and you enshrine that ambiguity as "wrong by definition" to fix. Resolve the data-vs-modality question first.

Second: what does promotion actually buy here? The smoke already runs on every push with a verified negative control — 2800 failures on guard deletion. The stated upside is "protection unless someone deletes the smoke," but that argument proves nothing: someone can delete a doctrine.mjs check too. The real differences are institutional memory and rejection authority, which is a documentation problem, not a promotion problem. You're paying doctrine-dilution cost for a Notion page's worth of benefit.

Third: the science half rests on one 8-week study of comparable adaptations. One study, one duration, in a project whose D30 citation already turned out unverifiable-by-file. SCIENCE_DEFAULT tier on a single PMID is how doctrine accumulates the caveat barnacles you're already complaining about on D24 — which, note, carries two admitted unimplemented/broken caveats *right now*. Bolting a third clause onto a half-honored invariant makes D24 a junk drawer, and minting D31 canonizes a rule whose core predicate (what 0 means) is unsettled.

Keep the smoke. Fix the blank-cell semantics. Then talk promotion.

### The First Principles Thinker

Strip the framing. You're asking "amend D24 or new number?" — but the real question is: what actually distinguishes doctrine from a smoke in this project? Answer, by your own governance model: a smoke asserts *sameness* ("green = same as last ship"), doctrine asserts *correctness*. Now look at check #27. It vm-extracts the live engine and asserts a semantic property — weight:null, rep coaching, weighted lifts still ladder — with a verified negative control. That is not a change detector. It is a correctness gate that you have mislabeled as a smoke. **The promotion already happened in substance; you're only deciding whether to record it.** An unrecorded correctness invariant is the worst of both worlds: it has doctrine's rigidity with none of doctrine's memory (citation, tier, Notion mirror) — the exact failure mode your "gate is the memory" directive exists to prevent. So promote. Not promoting means the check's authority rests on nobody asking "why does this smoke fail my refactor?"

On amend-vs-new, first principles again: D24 answers "how does load progress?" The new rule answers "what happens when load *does not exist*?" Those are different questions — one is a progression function, the other is a domain guard on its input. Bolting a null-domain clause onto D24 (which already carries two open caveats) conflates the function with its preconditions. New invariant, cross-referencing D24's rep-surplus trigger as its shared mechanism — one rule, one home, and the trigger's home stays D24.

Tier: the two halves are genuinely different kinds of claims. "Never render a fabricated number" is an invariant about honesty to the user — SAFETY. "Progress by reps" is one 8-week study — SCIENCE_DEFAULT, revisable. D8's SPLIT precedent exists precisely for this shape. Use it.

### The Expansionist

Promote it — as a new invariant, and here's the upside everyone's about to undersize: this isn't a rule about zero-pound rows, it's the founding clause of Tandem's second progression system.

Look at what's already sitting on file: the prior council's `progression_mode` vocabulary — `external_load | rep_volume | unilateral_ladder`. BUG-188 just shipped the first working member of that taxonomy in production, with a citation, a negative control, and 2800-failure teeth. Folding it into D24 as a caveat buries a platform seed inside a percentage rule. A new numbered invariant — call it the rep-volume progression charter — becomes the anchor that BUG-44/EPIC-34 (rep-target scaling), band work, tempo work, and unilateral ladders all cite when they arrive. Doctrine rows are the institutional memory; give the second mode its own memory address and every future loadless feature inherits a home instead of renegotiating scope against D24's load-centric text.

There's a market-shaped upside hiding here too: couples train together, and couples are asymmetric — one partner benches, the other does band rows and push-ups. An app whose *law* says "bodyweight athletes get real, cited progression coaching, never a fabricated number" is quietly the only couples app whose engine treats the loadless partner as first-class. That's competitive-strategy material, not a bug patch.

Take the D8 split-tier precedent and run: SAFETY for "no fabricated load reaches a pixel," SCIENCE_DEFAULT for the Plotkin rep-progression half. The split isn't a compromise — it's the template for every future mode you add. Dilution risk is backwards: doctrine gets *stronger* when it stops being a monoculture of barbell rules. The smoke already proved this rule is invariant-grade. Promotion just tells the future what it's allowed to build on.

### The Outsider

Three things insiders here treat as obvious that aren't, from where I sit:

**1. Your own brief undermines the promotion's main selling point.** You say promotion buys authority to reject future changes as "wrong by definition." But the smoke already runs on every push, already fails loudly (2800 failures on guard deletion), already blocks CI. The only scenario doctrine protects against that the smoke doesn't is "someone deletes the smoke itself" — and nothing in your brief explains why that same someone couldn't delete a doctrine.mjs check. If doctrine checks are harder to delete, *that's the actual load-bearing fact*, and you never state it. To an outsider, "doctrine" looks like the same script with a fancier filename plus a Notion page. If the difference is social ("we've agreed never to weaken the gate") rather than mechanical, say so — because then promotion is really about ceremony creating deterrence, and you should evaluate it on those terms.

**2. "Institutional memory" is your strongest argument and you buried it.** The citation, the tier, the "weight-keyed not equipment-keyed" design decision — that reasoning is precisely what evaporates between sessions. Check #27's filename won't tell a future maintainer *why* a weighted pull-up ladders. That justifies promotion regardless of authority questions.

**3. The D24-amendment option smuggles in a false equivalence.** D24 governs how loads progress; this rule governs when loads *don't exist*. "Silent on loadless" doesn't make it D24's gap — by that logic every rule amends D24. And you'd be attaching a fresh rule to an invariant already carrying two confessed caveats. New number.

Verdict: promote, new invariant, SPLIT tier per your D8 precedent — but write down honestly *why* doctrine outranks a smoke, because right now you're assuming it.

### The Executor

Promote it. As a D24 clause. And the reason is pure execution math: the work is already 90% done.

Look at what Monday morning actually requires. The enforcement code exists — check #27 runs the full 2800-assertion sweep with a verified negative control. The citation exists (PMID 36199287). The vm-extraction slice markers are documented. D24's Notion mirror page id is in hand. The remaining work is: (1) one Notion page edit, (2) one paragraph added to the D24 row in DOCTRINE.md, (3) one doctrine.mjs assertion that *invokes the existing smoke's extraction recipe* — do NOT rewrite the sweep, import or call the same module the smoke uses, exactly like the seed-emitter dedup precedent (`scripts/lib/exercise-seed.mjs`, one emitter, two callers). One commit, maybe two hours including verify runs. That's it.

A new numbered invariant, by contrast, means drafting standalone rule text, creating a fresh Notion mirror page, and duplicating D24's rep-surplus trigger language in a second row — which immediately violates one-rule-one-home, because the loadless rule explicitly *reuses D24's trigger*. Two rows encoding one trigger is the exact drift silo the project keeps paying for. The clause is less work AND less future maintenance. Done.

The double-maintenance worry evaporates if you do the lib extraction: smoke calls the shared sweep, doctrine asserts the shared sweep, one home. If you're lazy, just have doctrine.mjs assert the guard's presence via the slice markers and let #27 keep the heavy sweep — also fine, ships today.

Tier: SPLIT, copy D8's format verbatim — "no fabricated load" = SAFETY, "rep progression" = SCIENCE_DEFAULT. There's a template. Use it.

First step Monday: open the Notion page, paste the clause. Everything else follows in the same sitting.

---

## Peer reviews

**Anonymization mapping (randomized for review):** A = Executor · B = Contrarian · C = Outsider · D = Expansionist · E = First Principles

### Reviewer 1

**1. Strongest: E.** It reframes correctly: check #27 already asserts semantic correctness (weight:null, negative control), so it is a correctness gate mislabeled a smoke — "the promotion already happened in substance; you're only deciding whether to record it." Its amend-vs-new logic (D24 = progression function, new rule = domain guard on its input, cross-reference the shared trigger) resolves A's one-rule-one-home objection without duplicating the trigger. Tier reasoning is clean.

**2. Biggest blind spot: A.** It optimizes execution cost ("two hours Monday") and treats promotion as settled, never asking whether the rule is invariant-grade. Worse, its one-rule-one-home argument for amending D24 is inverted — E and C both show cross-referencing avoids duplication — and it ignores B's substantive objection entirely: that a blank weight cell on a barbell squat is missing data, not a loadless movement. A would enshrine that ambiguity same-day.

**3. All five missed:** the Notion-first change-order interaction with the already-shipped code. The rule shipped and gated (`6b627e8`) *before* any Notion doctrine page existed — promoting now means retroactively backfilling the source-of-truth, inverting the project's mandated Notion-first sequence. The council should decide whether post-hoc promotion is a sanctioned path or a process violation needing its own rule, and who audits the smoke-vs-doctrine.mjs single-home extraction so the sweep doesn't fork.

### Reviewer 2

1. **Strongest: E.** It dissolves the framing instead of accepting it — check #27 asserts a semantic property with a negative control, so it already *is* a correctness gate mislabeled as a smoke; the only open question is recording it. Its amend-vs-new resolution is also the cleanest: new invariant that cross-references D24's rep-surplus trigger, keeping one-rule-one-home intact (the trigger's home stays D24) while avoiding the junk-drawer problem. C makes similar points but stops at "write down why doctrine outranks a smoke"; E answers that question.

2. **Biggest blind spot: A.** It treats this as pure execution logistics ("90% done, two hours, ship Monday") and never asks whether the rule *belongs* in D24 conceptually. C and E both show the D24-clause option rests on a false equivalence (load progression vs. load nonexistence), and A never engages B's point that the guard's core predicate — what a logged 0 means — is unsettled. Speed-optimizing an ambiguous rule into law is the exact plausibility-first failure the project's prime directive targets.

3. **All five missed:** the new rule *reuses D24's rep-surplus trigger* — but D24's own caveats admit that trigger is incomplete (ACSM's 2-for-2 consecutive-session half is unimplemented). Nobody checked whether Plotkin's rep-progression protocol matches the trigger as actually implemented. Promoting the loadless rule inherits an admitted defect into a SAFETY/SCIENCE row, and no response reconciled that before canonization.

### Reviewer 3

**1. Strongest: E.** It reframes correctly — check #27 already asserts correctness (semantic property, negative control), so it is doctrine-in-substance without doctrine's memory. That makes "promote and record" follow from the project's own governance definitions rather than preference. Its amend-vs-new reasoning (D24 = progression function, new rule = domain guard on its input, cross-reference the shared trigger) resolves A's one-rule-one-home objection cleanly: the trigger keeps one home, D24.

**2. Biggest blind spot: A.** It optimizes for "least work Monday" and treats the D24-clause as settled because the loadless rule reuses D24's trigger — but reuse argues for a cross-reference, not co-location, and A never engages B's blank-cell ambiguity or whether the rule is invariant-grade at all. Its "if you're lazy, assert guard presence via slice markers" fallback would make the doctrine gate a text-presence check — exactly the "wired is not working" failure the project's own rules prohibit.

**3. All five missed:** Notion-first sequencing on B's objection. Blank-barbell-cell = 0 is a real data-vs-modality ambiguity; the promotion could encode it as an honestly-flagged caveat in the new row (D24 already models this) rather than blocking on it — nobody proposed that synthesis. Also: none specified who owns the smoke-vs-doctrine.mjs code dedup A gestured at.

### Reviewer 4

**1. Strongest: E.** It reframes correctly — check #27 already asserts correctness with a negative control, so it is doctrine-in-substance without doctrine's memory; the decision is whether to record it, not whether to promote. Its amend-vs-new argument (progression function vs. domain guard on its input, cross-reference D24's trigger to preserve one-rule-one-home) resolves the exact tension A and C fight over, and the SPLIT tier reasoning is clean.

**2. Biggest blind spot: A.** It optimizes for Monday-morning effort and never asks whether the rule is invariant-grade or whether its predicate is even well-defined. It also misreads one-rule-one-home: a new invariant *citing* D24's trigger doesn't duplicate it (E shows how), so A's core argument against a new number is wrong. "Ships today" is not a governance criterion.

**3. All five missed:** the Notion-first change-order risk to D24's *existing* text. Whether amending or cross-referencing, D24's row and mirror get touched while carrying two confessed caveats — nobody asked whether promotion should be blocked or sequenced against resolving those caveats, or whether the new clause inherits their credibility problem. Also: only B noticed the blank-cell-vs-bodyweight ambiguity, but nobody proposed the testable middle path — promote the SAFETY half now, hold the SCIENCE_DEFAULT half until the 0-means-what question is settled.

### Reviewer 5

1. Strongest: E. It reframes correctly — check #27 asserts a semantic property with a negative control, so it already functions as a correctness gate; promotion just records what exists. Its amend-vs-new reasoning is the cleanest (D24 = progression function, new rule = domain guard on its input, cross-reference the shared trigger so one-rule-one-home survives). C independently reaches the same verdict and honestly exposes the "why does doctrine outrank a smoke" gap, but E is more actionable.

2. Biggest blind spot: A. Its "clause is less work" math optimizes execution cost while ignoring the categorical mismatch C and E both catch — D24 governs how load progresses; this rule governs load's absence. Worse, its one-rule-one-home argument is backwards: E shows a new invariant can *cite* D24's trigger without duplicating it. A also never addresses B's blank-cell ambiguity.

3. All five missed: the Notion-first change order applies to the tier question itself — nobody proposes the required artifact chain (Notion page → DOCTRINE.md → doctrine.mjs in one change) for validating B's blank-cell concern before promotion. Concretely: does D24's promotion require resolving its two existing open caveats first, or does adding a third clause/sibling invariant while D24 is half-honored set precedent that caveated doctrine is normal? Nobody asked whether promotion should be conditional on closing those caveats.

---

## Chairman's synthesis

### Where the Council Agrees

- **Promote (4 of 5 advisors; 5 of 5 reviewers rank the promote-as-new-invariant argument strongest).** The decisive framing is First Principles': check #27 asserts a semantic correctness property against the live engine with a verified negative control — by the project's own definitions that is a correctness gate, not a change detector. The promotion has already happened in substance; the only question is whether to record it with doctrine's memory (citation, tier, Notion mirror).
- **New numbered invariant, not a D24 clause** (First Principles, Outsider, Expansionist, all 5 reviewers). D24 answers "how does load progress?"; this rule answers "what happens when load does not exist?" — a domain guard on the input, not the function. The new row *cross-references* D24's rep-surplus trigger; the trigger's home stays D24, so one-rule-one-home survives. The Executor's one-rule-one-home argument for co-location was unanimously ruled backwards in review.
- **SPLIT tier, D8 template** (all four promoters): SAFETY for "no fabricated load reaches a pixel" (kin to D23/D25/D26); SCIENCE_DEFAULT for "loadless work progresses by reps" (Plotkin 2022, one 8-week study — revisable).
- **Institutional memory is the real payoff**, not rejection authority (Outsider, echoed by reviewers). The smoke already blocks CI; what it cannot do is tell a future maintainer WHY a weighted pull-up still ladders or why the guard is weight-keyed.

### Where the Council Clashes

- **Contrarian vs. everyone: what does a logged 0 mean?** "Band pull-apart" and "blank weight cell on a barbell squat" both log 0; rep-coaching the second is answering missing data with a recommendation. Contrarian says resolve this before promoting anything. The reviewers' resolution (Reviewer 3 and 4, independently): the SAFETY half is correct under BOTH readings — whatever 0 means, fabricating a load is wrong — so promote it now, and carry the data-vs-modality ambiguity as an honestly-flagged caveat on the science half, exactly the way D24 already models open caveats. Blocking promotion on it treats a copy-precision question as a correctness question.
- **Executor vs. the rest on speed as a criterion.** "Ships in two hours as a D24 clause" optimizes execution cost over conceptual placement; review unanimously rejected it. His mechanism, however (doctrine.mjs and the smoke sharing ONE extraction/sweep via a `scripts/lib` module, per the exercise-seed precedent), was retained by every reviewer as the right implementation — his lazy fallback (text-presence assertion via slice markers) was explicitly rejected as "wired is not working."

### Blind Spots the Council Caught

1. **Notion-first inversion (Reviewers 1, 3, 5):** the rule shipped and was gated before any Notion doctrine page existed. Promotion is a retroactive backfill of the source-of-truth. The row/commit must say so plainly rather than pretend the sequence was followed.
2. **Inherited trigger defect (Reviewer 2):** the new rule reuses D24's rep-surplus trigger, whose ACSM 2-for-2 consecutive-session half is admittedly unimplemented. The new row inherits that caveat and must flag it — and nobody has checked Plotkin's actual protocol against the trigger as implemented.
3. **The middle path nobody proposed (Reviewer 4):** the tier split is also a *confidence* split — the SAFETY half is promotable today under any resolution of the 0-semantics question; the SCIENCE_DEFAULT half carries the flagged caveats.
4. **Dedup ownership (Reviewers 1, 3):** unowned, the smoke and the doctrine assertion will fork. The promotion change itself must extract the sweep to a shared lib with two thin callers.

### The Recommendation

**Promote, as a NEW numbered invariant (next free D-number), SPLIT tier:**

- **SAFETY:** when the logged load is ≤ 0, no fabricated or interpolated load may reach the user — the recommendation is `weight:null` plus rep coaching, and the guard is weight-keyed, not equipment-keyed (a weighted pull-up/dip still ladders under D24).
- **SCIENCE_DEFAULT:** loadless work progresses by REPS, using D24's existing rep-surplus trigger (cross-reference, do not duplicate). Citation: Plotkin et al., PeerJ 2022, PMID 36199287 — explicitly noted as a single 8-week study, revisable.

The row carries three honestly-flagged caveats, in D24's own style: (1) a logged 0 conflates loadless modality with missing data on a loaded lift — unresolved, affects coaching copy, not the SAFETY half; (2) the inherited D24 trigger's 2-for-2 half is unimplemented; (3) the doctrine page post-dates the shipped rule (retroactive Notion backfill, acknowledged).

Implementation: Notion page → DOCTRINE.md row → doctrine.mjs, one change; extract check #27's sweep into `scripts/lib/` so the smoke and the doctrine gate are two callers of one sweep (exercise-seed precedent). No text-presence shortcut.

The Contrarian's dissent is answered, not overruled: his blank-cell objection becomes flagged caveat #1 and should be filed as its own bug (distinguish "blank cell on a loaded lift" from "genuinely loadless movement" at log time); his dilution objection is met by the fact that check #27 already has doctrine's rigidity — recording it removes ambiguity rather than adding law.

### The One Thing to Do First

Draft the new invariant's Notion page — rule text, SPLIT tier, Plotkin citation, and all three flagged caveats — and get Kerwin's sign-off on that page before touching DOCTRINE.md or doctrine.mjs.

---

*Council run 2026-09-29 by Claude (llm-council skill). Advisors and reviewers were independent sub-agents; reviews were performed on anonymized responses (mapping above).*

# Council transcript — 2026-11-17 — emphasis balance vs D6b

Run by `llm-council` (5 advisors, 5 anonymized peer reviews, chairman synthesis) for handoff step 3,
"Emphasis balance", before taking the question to Kerwin (CLAUDE.md: a doctrine question is councilled
first). Advisors and reviewers ran as subagents; the chairman synthesis was written by the orchestrating
session from all ten outputs (no separate chairman agent), and no HTML report was produced — this
transcript is the artifact, matching the repo's other council records.

## Framed question

Tandem is a couples fitness app whose program engine must be science-backed: every rule traces to a cited source, and when a source is silent the project flags the gap rather than inventing a number. Doctrine invariants are enforced by a CI gate.

Relevant invariants:
- D6b (SCIENCE_DEFAULT, cited to the project's Exercise Science Canonical Reference §1): every major muscle must meet the goal's weekly MEV floor — build_muscle 10, fat_burn 8, transform 10 sets/muscle/week (secondary-mover sets count half).
- D35 (SCIENCE_DEFAULT): a weekly floor is met by spreading across exercises, never stacking — no exercise above 6 sets in a session unless honoring the cap would break a cited floor.

The feature: a user can pick a "muscle emphasis" (Lower Body, Glute Focus, Upper Body, Back Heavy, Push Heavy). Until 2026-11-17 picking Upper/Lower Body moved zero sets. The owner (Kerwin) said: "If I pick a lower-body-focused workout, then I should have upper body, of course, but the majority ... should be focused on ... legs ... primarily focusing on legs would be the basis of the program. Not that one extra lift is a lazy way out."

Shipped rule (an ENGINEERING_DEFAULT, flagged as having no sourced magnitude): on each non-emphasis day, re-point secondary + accessory 1 + accessory 2 slots to the emphasised area; the day keeps its own primary compound. Result: on a 4-day Lower Body week the two upper days are 3 leg lifts of 6; leg share of weekly sets rises 35% -> 58%. Every major muscle still meets D6b; no lift exceeds 6 sets.

Going further was measured: re-pointing accessory 3 too reached 82% leg share but stacked Bench Press to 11 sets on one lift (the upper muscles, starved of slots, got their floor by stacking — violating D35's spirit). Any further shift pushes some non-emphasised major muscles below their D6b weekly MEV floor. No source in the project (or found so far) gives a magnitude for how much an emphasis should shift. The project's research report notes a positive weekly-volume dose-response (Schoenfeld 2017) and that maintenance volume is lower than growth volume, but the project has no cited maintenance-volume number for this use.

Also open: 2-day programs get no emphasis effect at all (25 of 25 cells), because applying it left front delts at 5.5 of 10 sets.

Decision: Should D6b be amended so that, under a chosen emphasis, non-emphasised muscles may drop to a lower (maintenance) floor — and only with what citable basis? Or should the current rule stand (largest shift that keeps every D6b floor and D35), with the gap disclosed to Kerwin? Options: (A) keep current rule, disclose; (B) amend D6b to a maintenance-volume floor for non-emphasised muscles under emphasis, conditional on finding a source; (C) let emphasis ADD volume/sessions to the emphasised area rather than re-point slots away from others; (D) something else. Stakes: the app's moat is cohesive, science-backed programming; a confident uncited number is the failure mode the project exists to avoid, but a feature that doesn't deliver what the owner asked for also fails him. The final call on product direction is Kerwin's; the council should recommend and state exactly what he must decide.

## Anonymization map

A = Expansionist · B = Contrarian · C = Executor · D = First Principles · E = Outsider

## Advisor responses (as anonymized for review)

**Response A:**
Recommendation: (C), with (A) shipped now as the floor. Do not amend D6b. The council is treating emphasis as a zero-sum reallocation of a fixed pie; a re-pointed-slots rule can only shuffle sets and hits a wall at 58% because D6b and D35 box it in — the wall signals the lever is wrong. (C) adds volume to the emphasised area while every non-emphasised muscle stays at its D6b floor. Where it goes: (1) headroom between MEV and the project's MAV/MRV landmarks for the emphasised muscle — Schoenfeld 2017's positive dose-response is already cited; (2) an optional extra session or finisher block ("Leg Day Plus"). This also unlocks 2-day: add an emphasised-area finisher, leave front delts at floor. Upside: emphasis becomes a couples feature (Dani Glute Focus, Kerwin Upper Body). Not (B): no citable maintenance number. Kerwin decides: (1) is an extra block/session acceptable on top of his day count? (2) is 58% acceptable as interim?

**Response B:**
Option A is the only defensible shipping position, and even A has a hole: the 6-set cap is a PLATEAU bound D35 admits is unmeasured, so 58% is doubly uncited — magnitude is ENGINEERING_DEFAULT and the ceiling that stopped it at 58% not 82% has no measurement behind it. (B) is a trap: reasoning backwards from the desired output; Schoenfeld 2017 is growth dose-response, not a retention floor; a later-found number will be tuned to hit whatever leg share Kerwin likes. (C) raises total weekly sets, colliding with MRV, recovery and the couple's time budget; the 2-day failure shows the engine is already floor-limited; adding sessions changes the product's contract. Kerwin said "primarily... the basis of the program", closer to 82%; he may judge 58% still lazy, and disclosure doesn't cure that. Disclose the 2-day no-op in the UI. Kerwin decides: accept 58% as ceiling, or fund research into a maintenance floor.

**Response C:**
Ship (A) Monday, honest about the number. (B) has no first step — needs a citable maintenance number; amending without one fabricates. (C) is the only option delivering what Kerwin asked without touching D6b, but changes session length and recovery budget (separate invariants). First step: add emphasis volume as extra sets on emphasis-day accessories, capped by D35's 6/lift, re-run the 1050-combo doctrine gate — a Tuesday experiment. Monday: keep 58%; add a visible "emphasis is mild" disclosure with measured numbers; show "needs 3+ days" on 2-day plans; kick off research on maintenance-volume sourcing. Kerwin decides one thing: is 58% the majority he meant, or accept longer sessions (C)?

**Response D:**
The wrong question is "which floor?" The real one: what does emphasis mean, and what may the engine claim? Re-pointing can't deliver "basis is legs"; D6b+D35 cap it at 58%. (B) loosens the fence with an unfound number. Volume is the lever; slots are one way to spend it. (C) adds sets to the emphasised area on top of an intact D6b baseline; Schoenfeld 2017 (already cited) supports adding volume for a muscle you want to grow more. Extra sets go on new exercises or a new session, never on Bench. Cost is time — Kerwin's trade-off. Recommendation: keep shipped rule as no-added-time tier labelled ENGINEERING_DEFAULT in UI copy; build C capped by session length; don't amend D6b; disclose the 2-day gap. Kerwin decides: how many extra minutes/sets per week, and whether he'd rather be told "58%, not 82%" than get an uncited 82%.

**Response E:**
As someone who tapped "Lower Body": I care whether the app did what the button says. 58% sounds like it worked to a fresh user, but the owner said "primarily legs"; nobody can define "enough", so nobody can call the rule wrong either. (B) invents a maintenance floor to justify a feature — don't amend D6b without a citation. (C) matches how a normal person thinks: picking Lower Body expects extra leg work, not less chest; no floors touched; its cost (session length, MRV) is testable and citable. Recommendation: A now, disclose plainly; C next. The 2-day plan silently ignoring the pick is a user-facing bug — show "not available on 2-day plans". Kerwin decides: is 58% OK for v1, and does he accept longer sessions (C) rather than trading away other muscles?


## Peer reviews (summarised; full text in session)

- **Review 1** — strongest D (reframe + tiered plan), C close. Blind spot E (persona, uncited "citable"); B asserts MRV collisions nobody checked; A offers MAV/MRV headroom without checking the landmarks. All missed: C's "added sets" is itself an uncited magnitude; nobody queried the project's MAV/MRV tables; nobody ran live research before flagging (SC-16); couple interaction; whether 58% is perceptible.
- **Review 2** — strongest D. Blind spot A (general dose-response ≠ an emphasis magnitude — plausibility-first) and E. All missed: live research first; C raises weekly volume above the cited per-goal prescription and likely needs its own invariant or D-amendment via Notion; couples scoring; deload/injury interaction; whether "share of sets" is even the right metric.
- **Review 3** — strongest D. Blind spot E; A leans on Schoenfeld as if it licensed emphasis volume. All missed: C needs its own cited upper bound; retention-volume literature exists and should be searched live before dismissing B; nobody checked whether the 82% Bench stacking came from slot assignment rather than an inherent limit.
- **Review 4** — strongest C (only concrete shippable sequence). Blind spot A (no time/MRV/recovery reckoning). All missed: added volume may just stack on capped lifts again; no side-by-side preview for Kerwin; couples dimension; existing users when the rule changes; no acceptance criterion for "enough".
- **Review 5** — strongest D. Blind spot E, B close (no path forward). All missed: C's bump is the same unsourced-magnitude gap moved; C still hits the 6-set cap and MRV; per-user emphasis in a couple; the required live research (e.g. maintenance-volume literature) not proposed now; nobody checked 58% against "majority" (>50%).

## Chairman synthesis — COUNCIL VERDICT

### Where the council agrees
- **Do not amend D6b now (option B), 5 of 5.** No citable maintenance-volume number is in hand; amending a cited floor to make a feature hit a target is reasoning backwards — the failure mode the project exists to prevent.
- **Keep the shipped rule (A) as what users get today, and disclose it plainly**, including in UI copy, not just code comments (4 of 5 explicitly).
- **The 2-day no-op is a silently dead control** and must be disclosed in the UI ("emphasis needs 3+ training days") — 4 of 5.
- **C (emphasis ADDS volume to the area instead of taking slots from other muscles) is the right direction** — 4 of 5; the Contrarian dissents on cost.

### Where the council clashes
- **Is C sourced?** A and D say Schoenfeld 2017's dose-response licenses extra volume for the emphasised muscle. Every reviewer rejected that: a general dose-response gives direction, not a magnitude, so C moves the uncited number from "how much to shift" to "how much to add". C is not yet buildable as doctrine.
- **Does C break the product?** The Contrarian: more weekly sets collide with MRV, recovery and the couple's time budget, and change the day-count contract. The others: that cost is Kerwin's trade-off to accept, and the 6-set cap plus session length bound it.

### Blind spots the council caught (peer review)
- Live research was owed before calling anything a gap (CLAUDE.md step 3, SC-16). Retention/maintenance-volume literature exists and was not searched by any advisor.
- Whether the 82% Bench stacking was inherent or an artefact of slot assignment was never tested.
- Nobody defined "enough": there is no acceptance criterion, and 58% already clears a literal "majority" (>50%).
- Couples: each partner picks their own emphasis; nobody checked whether it touches competition scoring (scoring counts sessions/points, not volume — to verify).

### The recommendation
**A now, disclosed; C next, but only after research supplies (or fails to supply) a magnitude; never B without a source.**
Concretely: keep `EMPHASIS_PROGRAM` as shipped; show the 2-day disclosure; run `exercise-science-research` plus live search for (i) maintenance/retention volume and (ii) specialization-block volume for the emphasised muscle; then prototype C bounded by D35 (new exercises, never more sets on an existing lift) and the session-length estimate from step 6, and show Kerwin a side-by-side week before it ships.

### What Kerwin must decide
1. Is 58% leg share (35% → 58% on a 4-day Lower Body week) the "majority / basis of the program" he meant, or not enough?
2. If not enough: will he accept **longer sessions or extra work** for an emphasis (C), rather than other muscles dropping below their floor (B, which the council will not recommend without a source)?

### The one thing to do first
Run the research for a sourced magnitude (retention volume and specialization volume) before building anything — it decides whether C can ship as doctrine.

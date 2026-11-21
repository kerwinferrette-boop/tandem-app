# Council transcript — 2026-11-21 — BUG-108 inventory-reconciliation gate, pre-ship

Pre-ship council gate (.claude/loop-config.md escalation.pre_ship_council_gate). Scheduled Builder, Cycle 115.

## Framed question
FRAMED QUESTION (pre-ship council gate, Tandem fitness app; project rule: every non-design push to main needs green gates AND a council consensus).

Decision: ship to main, as-is, a GUARD-ONLY change for BUG-108 ("the repo has several inventories of exercises and nothing reconciles them")? Or change it first?

The change (no app/engine code touched):
- NEW scripts/inventory-reconciliation-smoke.mjs. programs.js has four function-LOCAL inventories the app prescribes from: `programs` (male static library), `femalePrograms` (female), `SUBSTITUTIONS` (dedupe-backfill pool) inside getProgram(), and `TEMPLATES` (slot templates, groups only, no names) inside buildDynamicProgram(). Because they are local, the script injects a capture statement after each declaration into an IN-MEMORY copy of programs.js (each anchor asserted to match exactly once; exits 2 if not; asserts capture actually ran), calls getProgram()/buildDynamicProgram() once each, and walks the captured objects, counting any object with a string `name` and a `sets` or `r` key as an exercise.
- Set (A) prescribed-but-unbanked: Back Extension (5 male + 5 female), Incline Push-Up (SUBSTITUTIONS), Landmine Row (SUBSTITUTIONS, new finding), Single-Leg Curl (female, new finding).
- Set (D) male/female library divergence: 7 male-only, 2 female-only names.
- Ratchet: committed baseline fixture; fails if either set grows OR goes stale (entry fixed but baseline not ratcheted down); every baseline entry must carry a BUG-id + reason; TEMPLATES may not gain a `name`; anti-vacuity floors (133/133/14 exercise objects, 22 template slots); asserts selection-reachability-smoke.mjs stays registered in verify. --write-baseline refuses growth without --allow-growth.
- DELIBERATE NARROWING of the TPM-written prompt: the prompt asked this script to also produce sets (B) banked-but-never-selected and (C) tag-reachable-but-never-returned. The builder did not, because an existing gate (selection-reachability-smoke.mjs, sweeps 1050 persona combos x 24 weeks and ratchets the never-selected set) already owns exactly that, and the project's rule is "one rule, one home". The prompt itself also said "reusing the existing harness is mandatory; a second sweep is a second home".
- Registered in scripts/verify.mjs; verify check-floor 87->88 (a separate gate forbids the suite shrinking).
- Evidence: 8 mutations, one per assertion, each shown to have landed by diff, each turned its assertion red; growth-refusal tested. `npm run verify` ALL 88 CHECKS PASS (after unshallowing the clone: on a shallow clone a pre-existing merge-parity check false-reds, already tracked as BUG-277). Persona matrix 1050 base combos, 0 violations. Independent verifier subagent running separately.
- Prompt's Step 3: fix nothing in the engine — bank additions are research-gated; new findings filed as BUG-279 (Landmine Row, Single-Leg Curl unbanked) and BUG-280 (library divergence).
Stakes: a gate that looks green but misses things manufactures false confidence (this project's most repeated failure); a gate that is too brittle red-lines main for unrelated edits.

## Advisor responses (anonymized as A-E for review)

Response A: Ship after changes. (1) The walk counts only objects with string `name` plus `sets` or `r`; entries shaped {name,reps}/{name,dur}/via spread are skipped and nothing asserts every name-bearing object was counted; floors only catch collapse. Add a list of name-bearing objects that failed the predicate and ratchet it. (2) Floors only fail low. (3) Literal anchors red-line main on any reformat; message should say the anchor changed. (4) getProgram is called once (male, build_muscle, full_gym); if programs/SUBSTITUTIONS are built conditionally on goal/equipment/sex, names on other branches are never seen — prove unconditional or sweep branches. (5) Hand-rolled literal-end scanner ignores regex/template nesting; guarded by `;` check. (6) Set D is name-based; near-duplicate names evade it. VOTE: SHIP-WITH-CHANGES
Response B: Correct scope: a ratchet over tracked known debt. Dropping B/C is right; R6 pins the owner. Capture design sound (exactly-once anchors, exit 2 distinct, capture-ran fatal). Fix: (1) shape heuristic misses `reps`/`dur`/`time` keys; assert every captured name-bearing object is counted or on an explicit non-exercise allowlist. (2) anchor brittle; message should say "update the anchor". (3) `|| 1` floor fallback turns a missing floor into a trivial pass; missing floors should fail. (4) confirm fixture ships in the same commit, no shallow-clone dependency. VOTE: SHIP-WITH-CHANGES
Response C: Treat this as reusable infrastructure. Upside: feed captured SUBSTITUTIONS/static-library names into doctrine and selection gates, since backfill can inject unbanked names bypassing D20/D31 — follow-up, not blocker. Set D may mean women get a thinner library — a product question for Kerwin. Changes: actionable anchor-failure message; confirm R7 floors sit just below live counts; renamed key drops exercises silently, tighten floors; confirm CI does not set the env overrides. VOTE: SHIP-WITH-CHANGES
Response D: Shippable with tweaks; blast radius is the gate. Checked: anchors exactly-once, capture-ran check, string/comment-aware literal end-finder, symmetric ratchet, growth refusal, R6. Narrowing correct. Changes: FATAL message should say "update the anchor in this script; do not delete the check"; comment that declaration order is load-bearing (SUBSTITUTIONS must be in scope at the activePrograms line); note the shape heuristic as a known limit. Wait for the independent verifier before merge. VOTE: SHIP-WITH-CHANGES
Response E: Reading cold: the anchor-based string surgery couples the gate to source text; make the failure say what to update, and consider an export/test hook in programs.js (app code, out of scope — file it). Shape heuristic misses new keys; flag name-bearing objects with no recognised shape key. Narrowing defensible but state it in the commit body and BUG-108 so BUG-108 does not read as closed. Findings filed, ratchet design sound. VOTE: SHIP-WITH-CHANGES

## Peer reviews
Mapping: A=Contrarian, B=First Principles, C=Expansionist, D=Executor, E=Outsider.
Review 1: Strongest A (single getProgram() call may miss conditional inventories; shape heuristic skips {name,reps}; floors fail low). Blind spot E (no capture-reach check). All missed: other exercise lists outside programs.js (tandem.html); real test is whether a new unbanked exercise on a live branch turns it red.
Review 2: Strongest A, confirmed in code (walk line 126 counts only sets/r; floors only fail low; `fl[k] || 1` fallback at line 196). Blind spot C (calls the SUBSTITUTIONS bypass a follow-up). All missed: nobody verified the builder's claims about other gates, SUBSTITUTIONS-before-anchor ordering, or whether set A itself violates one-rule-one-home.
Review 3: Strongest A. Blind spot C and E: treat real exposure as follow-up. All missed: (a) mechanical cross-check — count `name:` literals per inventory in source and compare with captured count, catching the shape hole directly; (b) verify only passed after unshallowing; BUG-277 false-red on shallow CI means green-in-CI not shown; (c) new findings accepted unchecked.
Review 4: Strongest A, but A's conditional-inventory concern checked against programs.js and DOES NOT HOLD: programs (4455), SUBSTITUTIONS (5146), femalePrograms (5527) are unconditional literals with no early return before them; only activePrograms selection depends on sex. Blind spot: shape heuristic must fail closed, not be a "known limit". All missed: gate must be proven in a shallow clone like CI (SC-53).
Review 5: Strongest B (`|| 1` silent pass). Blind spot A only one to flag single-call capture. All missed: no interim owner decision for live unbanked exercises; verifier is a precondition; shape heuristic untested against real data; set D may be intended product difference. Ship only after `|| 1` fix, branch-coverage check, verifier result.

## Chairman verdict (summary)

All five voted SHIP-WITH-CHANGES: there is CONSENSUS to ship, conditional on these changes before merge:
1. Fail closed on the shape heuristic: every name-bearing object is counted or fails. Use a `name:`-literal cross-check as the mechanism.
2. Replace the `|| 1` floor fallback: a missing floor must fail.
3. Make the anchor-failure message actionable ("update the anchor; do not delete the check"), and comment that declaration order is load-bearing.
4. Prove the gate in a shallow clone or document the dependency.
5. Wait for the independent verifier.
6. State the (B)/(C) narrowing in the commit body and on BUG-108.

Follow-ups, not blockers: a ceiling on the floors; a branch-coverage sweep (Review 4 found the inventories are unconditional literals, so this is not needed today); an export hook in programs.js; feeding SUBSTITUTIONS names into D20/D31; an audit of exercise lists in tandem.html; and a product question for Kerwin on set (D) (BUG-280).

## What was done with it
- 1: R8 fail-closed classification (id or badge, otherwise fail) and R9 source cross-check (walked named objects == `name:` keys per declaration). Both proven red by mutation (M12, M13).
- 2: R7 fails on a missing floor (M7b).
- 3: FATAL message now says to update the anchor and keep the check (M8 output shows it). The load-bearing order is commented at the injection site.
- 4: the script makes no git calls (grep for execFile/child_process/git returns 0), so clone depth cannot affect it. CI's doctrine.yml runs verify with fetch-depth 0.
- 5: the first verifier FAILED the draft. It missed all 24 cardio objects, the shape hole the council had named. The fix was taken as change 1 plus two inventories the verifier found (PRESS_ALTERNATES, the build5 fallback day). A second, fresh verifier then ran against the fixed gate.
- 6: stated in the commit body and on BUG-108.
- Second verifier (fresh agent, acorn AST over programs.js): PASS. Its set (A) and set (D) match the gate exactly, and 10 new mutations went red. It found G1 (a hard-coded pool the gate does not list is invisible) and G4 (R6 satisfied by a comment). Both were closed in the shipping commit with R10 whole-file name: accounting (M14, M16) and a non-comment join() match for R6 (M15b).

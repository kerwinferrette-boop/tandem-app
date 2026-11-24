# Council — pre-ship gate, 2026-11-24 — BUG-279 Single-Leg Curl bank entry

Method: llm-council skill. Five advisors, five anonymized peer reviewers and one chairman, each run as a separate `claude -p` process with read-only repo tools, so they could not see each other's work. Advisors ran in parallel. Branch under review: commits bfe75b5, 449a4e8, aece153 (unpushed). **Deviation from the skill:** no HTML report was generated, because the caller allowed only this transcript file to be written.

Facilitator verification, done before peer review: `tandem.html:3289` ACCESSORY_ALIASES maps 'Single-Leg Curl' to 'Leg Curl' (0.45 × RDL 1RM, flagged in-code as unsourced). `getWeekTarget()` resolves that mapping by name. Confirmed by grep.

## Framed question

QUESTION: Should this change ship to main in Tandem (a couples fitness app; program engine in programs.js)? Vote SHIP, SHIP-WITH-CHANGES, or HOLD.

Project rules (from CLAUDE.md): source-first, never plausibility-first; every exercise-science claim needs a citation; flag gaps rather than invent numbers; "wired is not working" — trace values to what the user sees; one rule, one home; fix the mechanism not the instance; doctrine gate (npm run verify) is law.

Context. Tracker row BUG-279 (P1): 'Landmine Row' (SUBSTITUTIONS backfill pool) and 'Single-Leg Curl' (femalePrograms, a static library getProgram uses only as an emergency fallback when the dynamic generator returns null) are prescribed but absent from EXERCISE_BANK, so logged sets for them resolve to nothing for recovery (D20), continuity (D27) and variety (D31). Row's prompt: research-gated; decide per name bank entry vs re-point to existing row; PRIMARY-tier citation; no new load coefficient.

Proposed change (Single-Leg Curl only), on the current git branch in /home/user/tandem-app (commits bfe75b5, 449a4e8, aece153; programs.js ~line 1395 and ~2028):
- Adds EXERCISE_BANK['single-leg-curl']: same tags as existing 'lying-leg-curl' (three hamstring heads primary, gastrocnemius secondary; tags already cited for lying-leg-curl, BUG-103), equipment machine, tier full_gym, isolation, oneRmFactor null. User-facing "why" string: 'The lying leg curl, one leg at a time, so each hamstring does its own work. A 2025 review of the research found one-leg and two-leg training build about the same amount of muscle, and that strength gains favour whichever style you train.' Source: Sports Med 2025;55(4):923-936, DOI 10.1007/s40279-024-02169-z, systematic review + meta-analysis: hypertrophy no difference (ES -0.21, P=0.57); unilateral training larger unilateral strength gain (ES -0.65), bilateral larger bilateral (ES 0.56); moderate risk of bias. Author names not verified, cited by DOI only. PubMed not reachable from container; figures from search-indexed abstract text.
- Adds it to the 'leg-curl' movement family (required by the family partition gate).
- Regenerates exercise seed SQL (applying to Supabase is human-only) and re-records two ratchet baselines (inventory set shrinks by one; selection-reachability bank size 185->186; new entry IS selected so dead inventory did not grow).
MEASURED (by running the engine): week-1 programs across the 1050-combo persona matrix byte-identical. Rotation sweep (1050 combos x 24 weeks = 25200 programs): 3150 programs change; hamstring-isolation rotation pool grows 5->6 variants; Single-Leg Curl appears in 630 programs (full_gym only, weeks 10-12, every injury profile; no injury rule bans leg curls); only exercises displaced are the five existing leg-curl variants. Independent of bank insertion position. Gates: npm run verify ALL 89 CHECKS PASS; validate:personas 13650 programs PASS; fix-only revert turns inventory ratchet red.
Rejected: (a) re-point femalePrograms name to 'Lying Leg Curl' — changes authored exercise unilateral->bilateral; (b) leave unbanked — row's expected behaviour.
Landmine Row NOT in this change: banking it puts it into 350/1050 week-1 programs incl. 50 lower-back-injury profiles; lower-back ban list blocks 'barbell row|bent-over' but not landmine row (Fenwick 2009 JSCR, PubMed 19197209: bent-over row largest lumbar load; landmine not studied). Safety-tier injury-filter question, parked for owner.
Considerations: project's OUTCOME RULE values repeating lifts (exposure) over variety; this adds one more rotation variant, but within a 3-week block (weeks 10-12) the same lift repeats. Forbidden scope for this automated builder: scoring, matchmaking, 1RM/biometric calculation, schema, auth, sync. Design/aesthetic changes held for owner.

## The Contrarian

VERDICT: HOLD

**The flaw: this change makes users see a bilateral load prescribed for a one-leg lift.** Look at `tandem.html:3289`. `ACCESSORY_ALIASES` already maps `'Single-Leg Curl'` to `'Leg Curl'`, and `ACCESSORY_FACTORS` (`tandem.html:3210`) sets Leg Curl's starting load at 0.45 × the user's Romanian Deadlift 1RM. That number assumes both legs are curling. `getWeekTarget()` (`tandem.html:3347`) applies it as-is, with nothing to adjust for one leg. Take a user with a 200 lb RDL 1RM: they are told to curl about 90 lb with one leg.

Until now, that alias only fired in the emergency fallback, when the dynamic generator returns null. This change puts Single-Leg Curl into 630 normal programs in weeks 10–12. Those users have about nine weeks of RDL history, so the derived-load branch will fire for them. The 25,200-program sweep checked which exercise was chosen, not what weight the screen shows, which is the "wired is not working" failure CLAUDE.md describes. On top of that, the 0.45 factor is itself marked as an open research gap with no source (`tandem.html:3197-3208`). The change spreads an unsourced number to a new movement it was never meant for.

**Second problem: the change does more than the bug asked.** BUG-279 is about logged sets resolving for recovery (D20), continuity (D27) and variety (D31). Banking the name fixes that. Joining the leg-curl family is a separate product change: 3,150 programs change and five existing variants get pushed out. It also cuts against the project's OUTCOME RULE, which values repeating the same lift over adding variety. The only stated reason for joining the family is "the partition gate requires it." That means the gate is deciding the program.

**Smaller issues:**
- `videoId:null`. A lift being added to 630 programs has no demo video.
- The citation (Sports Med 2025) compares one-leg and two-leg training in general, not leg curls specifically. The figures came from abstract text found through search, and PubMed could not be checked. That passes as support for the "why" text, but it is not strong primary support.

**What would let it ship:** bank the entry so logged sets resolve, but keep it out of dynamic rotation, or out of the derived-load path. Then run `exercise-science-research` on how one-leg loads relate to two-leg loads (the bilateral deficit). If no source turns up, remove the `ACCESSORY_ALIASES` entry so the lift falls back to its default weight instead of inheriting the two-leg factor, and record the gap.

## The First Principles Thinker

VERDICT: SHIP-WITH-CHANGES

The ticket asks the wrong question. "Bank entry or re-point?" is a question about a data row. What actually matters is that the app has two sources of prescriptions: the dynamic generator and a static fallback library. Only the generator is held to the bank, so names in the fallback library and the SUBSTITUTIONS pool can drift out of it. BUG-279 is one example of that, not the defect itself.

That changes what this diff does. The bug as reported is small: logged sets go nowhere, and only when `getProgram` falls back to `femalePrograms`, which should be rare. But the change's main visible effect is in the normal generator path. It adds a new rotation variant to 630 programs in weeks 10–12. That is a programming decision, not a data-integrity fix, and banking an exercise is also what makes it selectable. That is a reasonable outcome:
- The tags are copied from lying-leg-curl, which already has citations.
- It only displaces other leg-curl variants.
- The same lift still repeats within each 3-week block, so the OUTCOME RULE (repeat lifts for exposure) holds.
- The why-string is honest. It says strength gains favour whichever style you train, rather than claiming unilateral is better.

But it should be described as what it is. Re-pointing to Lying Leg Curl would have changed the authored exercise from one-leg to two-leg, so rejecting it was correct. The inventory ratchet shrinking by one shows the gap is being closed by a mechanism, not patched once.

Changes before merge:
1. **Squash the three `wip(BUG-279)` commits. Their message bodies are empty.** CLAUDE.md requires the should/could/did audit in the commit body. Without it this does not ship. The measurements are good and need to be written down there: week-1 byte-identical, 3150 of 25200 programs changed, 630 programs now include it, it is not tied to where it sits in the bank, and the ratchet goes red when the fix alone is reverted.
2. **State in the audit that the change adds a rotation variant.** Kerwin should see that it does more than fix orphaned logs.
3. **Check how a one-leg set is counted.** "Do the same reps on each leg" raises a question: does 3 sets mean 3 or 6 for D20 recovery volume? The rule "wired is not working" calls for tracing a logged set into that volume. If nothing defines it, flag the gap.
4. **Keep Landmine Row parked, as proposed.** Whether the lower-back injury filter should block it is an injury-safety call, and it should not be bundled in here.

## The Expansionist

VERDICT: SHIP

This change is small, and it is worth more than it looks. The gates are clean: week 1 is byte-identical across the persona matrix, all 89 verify checks pass, and Single-Leg Curl only shows up in weeks 10–12. Holding it gains nothing, so ship it and look at what it makes possible.

**1. It fixes a whole class of bug, not one exercise.** BUG-279 is one example of "names we prescribe but never banked." Right now every logged Single-Leg Curl set is invisible to recovery (D20), continuity (D27) and variety (D31). That hurts women on the fat-burn fallback path, which is exactly the person you want to keep. After shipping, the next step should be a gate that fails on any prescribed name missing from `EXERCISE_BANK`, across `SUBSTITUTIONS`, `femalePrograms` and every other static library. The inventory baseline shrinking by one shows the ratchet works. Use it to empty the rest of the list.

**2. Unilateral work suits a couples app, and nobody has used that.** The bank already has five single-leg entries: SL Romanian Deadlift, SL Curl, SL DB RDL, SL Glute Bridge and SL Calf Raise. The meta-analysis being cited says unilateral strength gains are specific to training one side at a time. That points to a feature: left/right balance as something Kerwin and Dani can each track and compete on. That's product direction, so it's Kerwin's call. This change is the first entry to cite that research, so it's the natural place to start.

**3. Park the Landmine Row question, but give it a deadline.** Leaving it unbanked keeps a known logging blind spot. The real fix is to make the lower-back ban list match how the lift moves, instead of matching exercise names like "barbell row" and "bent-over." That one fix would also catch any future row variant. Put it on the tracker with a deadline.

**One gap to fix after shipping:** Single-Leg Curl has `videoId:null`, and so do 157 of the bank's 186 entries (about 85%). On the screen the user sees, that probably means no demo video. A filmed single-leg demo is the cheapest way to make the new variant feel deliberate rather than leftover. That doesn't block this change.

## The Outsider

VERDICT: SHIP-WITH-CHANGES

I don't know this field. I'm reading only what was handed to me, and three things stand out.

**1. The bug and the change are different sizes.** The bug: a lift from a backup library that rarely runs gets logged, and the log goes nowhere. The fix: the lift now appears in 630 programs during weeks 10–12, and 3,150 programs change. People who never touch the backup library are the ones who see it. The team calls this a side effect of a gate, but it is a product change. Say so plainly in the PR title and body ("adds a sixth hamstring-curl rotation variant"), so the owner isn't surprised later. I accept the measurements. I don't accept a framing that leaves the change out.

**2. The commits don't have the audit the rules require.** The three messages read `wip(BUG-279): …` and contain no body. CLAUDE.md says the should/could/did audit goes in the commit body. The audit exists, because it's in this brief, but it isn't in the commits. Squash them and put it there.

**3. The user-facing text.** "Strength gains favour whichever style you train" made me stop and reread. A normal user won't know what "style" means here. Try: "…and that you get strongest at the version you practise." There's also a quiet assumption. The original library entry (`fbf-slcurl`) says only "Single-Leg Curl", not "lying". The new text and cues say lying, on a machine. Single-leg curls can also be done seated or standing. Either cite something showing the authored lift was the lying version, or word the "why" and cues so they don't depend on it.

**Also, the database.** The seed SQL "regenerates, but applying is human-only." The bug is that logged sets resolve to nothing. If production resolves exercises through Supabase, this doesn't ship until that SQL is applied. Make the apply step a blocking checklist item in the PR, not a footnote.

**What I'm fine with:** the missing demo video (157 other entries have none and the UI handles it), no change to load numbers, and parking Landmine Row. Parking that is the right call, and the lower-back reason is easy to follow even for me.

## The Executor

VERDICT: SHIP-WITH-CHANGES

The code is done. What's left is paperwork and plumbing, and none of it needs a new decision. I read the diff: 21 lines in `programs.js`, one seed line, two baseline fixtures. Tags are copied from `lying-leg-curl`. `oneRmFactor` is null, so there's no new load coefficient. `videoId:null` matches 157 existing entries, and `tandem.html:5862` only shows the video button when an ID exists, so nothing breaks on screen. The measurements answer the real risk: week-1 programs are byte-identical across the whole matrix, the only changes are in the weeks 10–12 rotation, and the only lifts displaced are the other leg-curl variants. Both gates are green and the inventory ratchet goes red on revert. That's enough to ship.

What blocks a merge as of today:

1. **All three commits say `wip(BUG-279)` with empty bodies.** CLAUDE.md requires the should/could/did audit in the commit body, and it isn't there. Squash into one commit, paste in the SHOULD/COULD/DID/RECONCILE audit you already wrote, and put the same text in the BUG-279 Notion row.
2. **Nothing has been pushed and the branch has no upstream.** The container will be reclaimed and the work will be lost. Push and open a PR now so CI runs the doctrine gate on the shallow clone (SC-53).
3. **Seed SQL is "regenerated, not applied."** After merge, `npm run integration` A2 will go red until a human applies `migrations/epic031_exercises_seed.sql`. Name the person and the step in the PR description.
4. **Split Landmine Row into its own tracker row** (the injury-filter question), assigned to Kerwin and linked from BUG-279. Mark BUG-279 partially resolved, not closed. The injury-filter question is a safety call that belongs to the owner. Holding this whole change for it would block a finished fix behind an open decision.

The citation caveat (authors not checked, figures taken from the search-engine abstract) stays visible in the audit text. It isn't a reason to hold, because the DOI is there for anyone to check.

Order of work: squash, push, PR, CI green, merge, apply the seed, file the Landmine row. About an hour, and there's nothing left to research.

## Peer reviews

Anonymization map: A=Outsider, B=Contrarian, C=Executor, D=First Principles, E=Expansionist.

### Reviewer 1

**1. Strongest: B.** B is the only one that followed a value all the way to what the user sees. The grep confirms it: `ACCESSORY_ALIASES` (`tandem.html:3289`) sends Single-Leg Curl to the two-leg Leg Curl factor of 0.45 × RDL 1RM, and the code itself flags that factor as unsourced (`tandem.html:3197-3208`). Banking the lift makes that load reachable in 630 programs. The 25,200-program sweep checked which exercises were chosen, never the weight shown, which is exactly the "wired is not working" gap. B's fix is also the right size: bank the entry so logged sets resolve, and keep it off the two-leg load factor.

**2. Biggest blind spot: E.** E votes SHIP and calls the gates clean, then spends its answer on product ideas. It never looks at the prescribed weight. C misses the same thing, because a null `oneRmFactor` is not the only route to a load.

**3. What all five missed:** the same alias table already maps `'Single-Arm Cable Lateral Raise'` to the two-arm Lateral Raise factor, and that's live today. So the flaw is in how the table works, not in this one entry: it has no concept of one side versus both. Under "fix the mechanism," the fix belongs in `getWeekTarget`/`ACCESSORY_ALIASES` for every one-sided lift, after an `exercise-science-research` pass on the bilateral deficit (one-limb vs two-limb strength). Deleting only the Single-Leg Curl alias would patch one case.

### Reviewer 2

**1. Strongest: B.** It is the only response that followed a value through to what the user sees. `tandem.html:3289` already maps 'Single-Leg Curl' to 'Leg Curl', which is 0.45 × the user's Romanian Deadlift 1RM, a bilateral ratio flagged in the code as unsourced. Until now that only ran in the emergency fallback. This change makes it reachable in 630 normal programs, so a user could be told to curl a two-leg load with one leg. The 25,200-program sweep checked which exercises were picked, not the weights shown. B also gives a concrete way to ship: drop the alias or record the gap.

**2. Biggest blind spot: E.** It votes SHIP without checking the load path. It also says the bank "already has… SL Curl", but a grep finds only the new `single-leg-curl` at programs.js:1395 and no earlier single-leg curl. C also misses the load issue: it checks `oneRmFactor:null` but not `tandem.html`.

**3. What all five missed:**
- **Session time.** A one-leg lift doubles the time per set. Nobody checked whether the session-duration budget counts each set once, which would make weeks 10–12 sessions run long. D asked how a one-leg set counts toward recovery volume (D20), but not how long it takes.
- **Fallback weight.** The fallback library's own entry sets 20 lb (`w:20`, `tandem.html:5671`). If the alias already overrides that weight there, the fallback path has the same bug today. Fix it there too, not only for the new rotation.

### Reviewer 3

**1. Strongest: B.** B is the only response that followed the value through to the weight the user sees, and the facilitator's grep confirms it. Today, `ACCESSORY_ALIASES` sends 'Single-Leg Curl' to 0.45 × the user's RDL 1RM, a two-leg ratio with no source. By making the lift selectable, this change exposes that load to 630 normal programs. The 25,200-program sweep only checked which lift was chosen, never the load. B's fix is also cheap: either take the lift out of the alias, or bank it without putting it in rotation.

**2. Biggest blind spot: E.** It voted SHIP and spent its words on product ideas, like balancing left and right sides. It missed the load problem in B, the missing audit in the commit bodies (A, C, D), and the fact that the seed SQL hasn't been applied.

**3. What all five missed:**
- **Session time.** "3 sets, each leg" is really six bouts of work. If the duration estimate and the D20 volume count both count 3, the session runs longer than its time budget. D raised the volume question but not the time.
- **The authored prescription is dropped.** `programs.js:5671` sets `w:20, r:15, rest:45`. The new dynamic path uses the generic leg-curl load instead.
- **The leg-curl family isn't what forces this.** `MOVEMENT_FAMILIES` is read only by `movementPatternOf()`, and that reader only runs for compound lifts. B was right that "the gate requires it" is the gate deciding the program. The real cause of the 630-program spread is banking the lift, not joining the family.

### Reviewer 4

1. **B is the strongest.** It is the only response that followed a value through to what the user sees. `ACCESSORY_ALIASES` already maps Single-Leg Curl to Leg Curl, and Leg Curl's starting load is 0.45 × the user's RDL 1RM. That factor is unsourced and assumes both legs are working. Putting the lift into 630 dynamic programs means users will see that two-leg load on a one-leg lift. I confirmed this by grep. The 25,200-program sweep only checked which exercise was picked, never what weight is shown, which is exactly the "wired is not working" failure. B also gives a concrete way to ship: bank the entry, but cut the alias or keep the lift out of rotation.

2. **E has the biggest blind spot.** It votes SHIP because the gates are green, but the gates don't measure displayed load. It then proposes a new product feature built on the very lift whose load is wrong. C has the same gap: it says "nothing left to research" while the bilateral-deficit question is still open.

3. **What all five missed:**
   - **Continuity breaks in weeks 10–12.** A user who logged Lying Leg Curl in weeks 1–9 switches to a lift with no history of its own. That user is guaranteed to hit the derived load. This affects progression under D27, not just variety.
   - **Nobody checked that the bug actually happens.** No one queried Supabase for logged sets named "Single-Leg Curl". If there are none, this is a P1 fix for a fallback path that never runs, and it introduces a real load risk in the main path.

### Reviewer 5

1. **Strongest: B.** B is the only advisor who followed the value all the way to the screen. `ACCESSORY_ALIASES` (`tandem.html:3289`) maps Single-Leg Curl to Leg Curl, which loads at 0.45 × the user's RDL 1RM. That factor is unsourced and assumes both legs. Today only the fallback library prescribes this lift. After this change it shows up in 630 normal programs, mostly for users with about nine weeks of RDL history. The facilitator's grep confirms this. The 25,200-program sweep checked which lift was chosen, never the load shown.

2. **Biggest blind spot: E.** E votes SHIP and treats the gates as proof the change is correct. CLAUDE.md says that's not enough: the gates check legality, not doctrine. E also suggests a left/right balance feature based on a meta-analysis E never read past the abstract.

3. **What all five missed:**
   - **Knee-injury profiles.** "Every injury profile; no injury rule bans leg curls" was taken as safe because nothing blocks it. It's the same gap that parked Landmine Row: an injury filter not matching a lift doesn't mean the lift was reviewed for that injury. Nobody checked a source on loaded knee flexion for knee-injury profiles.
   - **The schema has no unilateral value** (`programs.js:1871`). D's question about whether a one-leg set counts once or twice for recovery volume can't be answered as the schema stands. It's a schema gap, which is out of scope for this builder.
   - **Existing logs start counting.** Any Single-Leg Curl sets already in Postgres will begin feeding recovery, continuity and variety once the seed is applied. Nobody queried Postgres to see how many there are.

## Chairman synthesis

FINAL VERDICT: HOLD
CONSENSUS: NO. The votes split three ways: one HOLD (Contrarian), three SHIP-WITH-CHANGES (First Principles, Outsider, Executor) and one SHIP (Expansionist). All five peer reviewers ranked the HOLD argument strongest, and I checked the code it rests on myself.

## Where the Council Agrees
- **The bank entry is sound.** Its tags come from `lying-leg-curl`, which is already cited, and it adds no load coefficient (`oneRmFactor:null`). Re-pointing the name to Lying Leg Curl was rightly rejected because it would turn a one-leg lift into a two-leg one.
- **Landmine Row stays parked** for Kerwin. Whether the lower-back injury filter should block it is a safety call, and it gets its own tracker row.
- **The commits fail CLAUDE.md as written.** All three are `wip(BUG-279)` with empty bodies, so the should/could/did audit is missing. They need to be squashed and the audit written into the body.
- **The seed SQL has been regenerated but not applied to Supabase.** A human has to apply it after merge, and the PR must say so.
- **The missing demo video (`videoId:null`) does not block.** The button only appears when a video ID exists.

## Where the Council Clashes
- **Whether a correct bank entry is enough.** The Executor says "nothing left to research." The Contrarian says the value the user sees was never checked. I confirmed the Contrarian's point in the code:
  - `tandem.html:3289` maps `'Single-Leg Curl'` to `'Leg Curl'`.
  - `getWeekTarget` (`tandem.html:3347-3350`) uses that mapping to set a derived starting load of 0.45 × the user's RDL 1RM.
  - The comment at `tandem.html:3197-3208` says that 0.45 has no source.
  - Before this change, only the emergency fallback path could prescribe this lift. Afterwards, 630 normal programs reach it in weeks 10–12, when users have about nine weeks of RDL history. Someone with a 200 lb RDL would be told to curl about 90 lb with one leg.
  - The 25,200-program sweep checked which exercises were selected, never the weights displayed.
- **Bug fix or product change.** The bug is about logged sets going nowhere. The change also adds a sixth hamstring-curl rotation variant to 3,150 programs. The First Principles Thinker and the Outsider both say that has to be stated openly in the PR.

## Blind Spots the Council Caught
- **The load problem is broader than this lift.** The alias table has no idea of one side versus both: `'Single-Arm Cable Lateral Raise'` is already mapped to the two-arm Lateral Raise factor today (`tandem.html:3291`). Under "fix the mechanism, not the instance," the fix belongs in `ACCESSORY_ALIASES`/`getWeekTarget`, not in one entry.
- **No source defines how a one-leg set counts.** Nothing says whether 3 sets per leg counts as 3 or 6, either for D20 recovery volume or for the session-time budget.
- **"No injury rule bans it" is not the same as "reviewed for knee injuries."** This is the same reasoning gap that parked Landmine Row.
- **Nobody checked whether the bug happens.** No one queried Postgres for logged "Single-Leg Curl" sets, so we don't know how often the fallback library actually runs.
- **Correction to one advisor:** the Expansionist's claim that the bank "already has SL Curl" is wrong. This change adds the first one.

## The Recommendation
**Required before merge:**
1. **Run `exercise-science-research` on the bilateral deficit** (how much one limb can lift compared with two) as it applies to deriving accessory loads.
   - If a primary source gives a ratio, apply it to every one-sided alias, not just this lift.
   - If none exists, remove the one-sided entries from `ACCESSORY_ALIASES`, starting with Single-Leg Curl and Single-Arm Cable Lateral Raise. They then fall back to the default weight from the bank entry. Record the gap.
2. **Check the weight on screen.** Add an assertion that a weeks 10–12 Single-Leg Curl with an RDL 1RM present does not show the two-leg derived load. Mutation-test it.
3. **Squash into one commit** with the full SHOULD/COULD/DID/RECONCILE audit. The title should say it adds a rotation variant. Keep the citation caveats (DOI only, abstract-derived figures). Mirror the audit to the BUG-279 Notion row.
4. **Push and open a PR** so CI runs the doctrine gate on its shallow clone. The branch has no upstream yet, and this container will be reclaimed.
5. **List the seed apply in the PR as a blocking human step.**

**Follow-ups (not blocking):**
- File Landmine Row as its own tracker row for Kerwin; mark BUG-279 partially resolved.
- Add a gate that fails on any prescribed name missing from `EXERCISE_BANK`, across `SUBSTITUTIONS` and every static library.
- Open a schema question: how unilateral sets count for volume and session time.
- Query Postgres for existing Single-Leg Curl logs.
- Plain-language rewording of the why-string ("you get strongest at the version you practise"), and check that the authored lift really was the lying version.

## The One Thing to Do First
Push the branch now (`git push -u origin claude/keen-lovelace-mudhmk`), before anything else, so the work survives the container. Then start the `exercise-science-research` pass on the bilateral deficit. The HOLD comes down to that one-leg load question; everything else on the list is paperwork.

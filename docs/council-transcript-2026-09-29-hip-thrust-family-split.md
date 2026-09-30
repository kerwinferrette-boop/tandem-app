# LLM Council — the hip-thrust family category split

**Date:** 2026-09-29
**Repo state:** `0ca5ae9` (origin/main at the time of measurement); evidence gathered in worktree
`tandem-council` on branch `claude/hip-thrust-council`. **No code was changed.**
**Convened because:** a SCOPE-LOCK brief to "fix the `compound` flag on EXERCISE_BANK" halted on its
own hard-stop condition ("any ambiguity about whether an exercise is multi-joint"). The hip-thrust
family was the one genuine doctrine-ownership question the halt surfaced. Per CLAUDE.md: *"'The
sources conflict' is not a reason to ask — it is a reason to run the council."*

---

## The original question

> run the council on the hip-thrust family split

---

## The framed question (given verbatim to all five advisors)

### THE DECISION

In the Tandem fitness app (`programs.js`), `EXERCISE_BANK` classifies every exercise with
`category: 'compound'|'isolation'|'core'|'cardio'`. A SECOND, independent table `MOVEMENT_FAMILIES`
classifies exercises by `movement_pattern` (horizontal_push, hinge, isolation, etc.), sourced from
"Exercise Science Schema v0.5 Part 3 Table 1".

These two classifiers DISAGREE on exactly one movement family — `hip-thrust` (label "Hip Thrust /
Glute Bridge", `pattern: 'hinge'`). It is the ONLY mixed-category family in the entire table:

| slug | category | tier | equipment | primary muscle |
|---|---|---|---|---|
| hip-thrust | **compound** | hotel_gym | dumbbell | glute_max |
| barbell-hip-thrust | **compound** | full_gym | barbell | glute_max |
| glute-bridge | **isolation** | home | bodyweight | glute_max |
| single-leg-glute-bridge | **isolation** | home | bodyweight | glute_max |
| frog-pump | **isolation** | home | bodyweight | glute_max |

All five have identical primary tag (`glute_max`) and near-identical secondary (`hamstring`, except
frog-pump = `adductor`).

QUESTION: Should the three bodyweight variants be re-tagged `category:'compound'` to match their
family, or should the family stay mixed?

### EVIDENCE GATHERED (all measured by running the engine, not read)

**1. The split correlates perfectly with EQUIPMENT/TIER, not with joint count.** All three
`isolation` entries are `tier:'home'` + `equipment:'bodyweight'`. Both `compound` entries are loaded
(dumbbell/barbell). This suggests the tag may be encoding "loadability/progressability," not
"multi-joint."

**2. The bank's own authored text contradicts the split.** `glute-bridge`'s `why` string reads
verbatim: *"Identical mechanics to hip thrust but performed on the floor. Shorter ROM but identical
glute squeeze at the top."* So the bank asserts mechanical identity with an entry it categorizes
differently.

**3. What `category` actually controls (two live consequences):**
- **Sets per exercise** via `GOAL_VOLUME`: build_muscle compound=4 vs isolation=3; strength
  compound=5 vs isolation=3; transform 4 vs 4 (no difference).
- **Load progression rate** via `progressionPct(phase, compound)` (doctrine invariant D24): compound
  gets the full ACSM rate, isolation gets `× 0.5` clamped to ACSM's 2–10% band. For build_muscle:
  isolation 4%/3%/2.5%/2% vs compound 8%/6%/5%/3% across the four phases. D24's citation is NSCA:
  "core" (multi-joint) lifts progress at roughly DOUBLE "assistance" (single-joint) work — 5–10%+
  vs 2.5–5%.

**4. Measured blast radius of flipping all three to `compound`** (swept 5 goals × 5 day-counts ×
2 sexes × 3 tiers = 150 combos, comparing per-muscle weekly volume via the shared
`computeMuscleWeeklyVolume()`):
- 60 of 150 combos change; 60 per-muscle volume deltas.
- **0 MEV floor regressions and 0 deficits closed** — no combo crosses a D6b MEV landmark in either
  direction.
- COUNTERINTUITIVE: hotel_gym glute volume *DROPS* — build_muscle/hotel_gym glute_max 17→14,
  transform 18→14, fat_burn 13.5→10.5. Home tier *RISES* slightly: build_muscle/home 11→12.
- SELECTION also changes, not just sets: maintenance/hotel_gym quad 14→16 and hamstring 14→14.5;
  maintenance/home hamstring 13→11. Second-order effects through `applyGoalVolume()`'s MEV-raise /
  MAV-trim / trim-and-restore passes.

**5. Relevant doctrine context:**
- "One rule, one home": if a named table encodes a rule, every path reads that table; two tables
  claiming the same rule is explicitly flagged as a doctrine question.
- D6b: per-muscle weekly MEV floor (build_muscle/transform 10, fat_burn 8, strength 4, maintenance
  10 + MAV cap 15). Gated.
- D6d (PENDING): D6b's floor must hold on every axis (tier × experience × duration); 126 cells
  currently sit below MEV in the wider sweep, and the doctrine text says *"The home cells are
  blocked on tagging"*.
- `scripts/doctrine.mjs` is law; `npm run verify` is 24 checks, currently 24/24 green, and
  `validate:personas` 1050/1050 green — WITH the mixed family in place. No gate detects it.
- "Fix the mechanism, not the instance."

### WHAT'S AT STAKE

`category` drives both prescribed sets and the load-progression rate a real user sees on their card.
Getting it wrong either under-progresses a genuine compound (half rate) or over-progresses an
isolation lift (double rate) — and this is a live app used by two real people. The change also has
measured second-order effects on exercise SELECTION, which project rule SC-23 says must be treated
as a bug until explained.

---

## Round 1 — the five advisors (independent, parallel, no cross-talk)

### The Contrarian (peer-review letter **C**) — agent `a1ad0b51af0a9c5d5`

**The question is framed to hide the real defect.** You're asking "which tag is right for
hip-thrust" when the evidence you gathered says `category` is a single field carrying two unrelated
rules: *dosing* (sets) and *progressability* (load rate). Evidence 1 is the tell — the split tracks
equipment/tier perfectly. That is not a mislabeled exercise. That is a field being used as two
fields. Flipping three rows resolves nothing; it just picks which of the two meanings loses.

**The thing nobody asked:** what does an 8%/6%/5%/3% compound progression mean on a *bodyweight*
glute bridge? Frog-pump has no load to multiply. Either `progressionPct` no-ops there (in which case
D24 parity is cosmetic and you changed nothing that matters) or it produces a number on a card for a
lift with no external load (in which case you shipped a fabricated prescription to Dani). Go find out
which. If it's the second, the isolation tag is load-bearing for a reason nobody wrote down, and
flipping it is a P1.

**Your safety argument is upside down.** "0 MEV regressions, 0 deficits closed" means the only gate
you ran is blind to this change by construction — and meanwhile hotel_gym glute volume *falls* 17→14
and 18→14. You are proposing a change whose measured effect is **less glute work for the
higher-equipped tier** and unexplained quad/hamstring selection churn. Under SC-23 that's a bug until
you can name the MAV-trim path that causes it. You reported the mechanism as "second-order effects" —
that's a label, not an explanation.

**And stop crediting this with unblocking D6d.** Home rises 11→12 of 126 sub-MEV cells.

Split the field. Don't flip the tag.

### The First Principles Thinker (peer-review letter **E**) — agent `aeb5eb9449b572797`

You're asking the wrong question. The question isn't "is glute-bridge compound or isolation?" It's:
**why does one field control two unrelated physical quantities?**

`category` is being asked to answer two questions that have different correct answers:

1. **How many sets should this get?** — a function of joint count, systemic cost, fatigue per set.
2. **How fast can load increase?** — a function of *loadability*: absolute load magnitude, increment
   granularity, and how much headroom the movement has.

For barbell-hip-thrust those answers coincide. For glute-bridge they diverge, and that's exactly why
your table is "inconsistent." It isn't inconsistent. It's a single field being pulled in two
directions by two real properties, and the bank's authors intuitively resolved it toward loadability
(evidence #1 — the split correlates perfectly with equipment, and the `why` string tells you they
knew the mechanics were identical). They weren't confused. They were compressing.

A bodyweight glute bridge is mechanically a hip extension — multi-joint, deserves compound set
volume. It is also *unloadable*: the progression rate is nearly meaningless because there's no load
to multiply. 8%/week of bodyweight is a fiction. That's not an isolation lift; it's a movement where
percentage progression is the wrong progression model entirely (you progress by unilateral, tempo,
ROM, reps — not %).

So flipping the tag to `compound` buys correct set counts and ships a *fabricated* 8% load ramp on a
bodyweight movement. Keeping it `isolation` ships correct-ish progression via a wrong mechanism and
undercounts volume.

Split the field. `category` (mechanical, drives sets) and a load-progression class (drives
`progressionPct`). Both cite different sources already — D24's NSCA citation is about *load*, not
joints.

Then `hip-thrust` stops being an anomaly and becomes the case that revealed the schema was
underspecified.

### The Expansionist (peer-review letter **A**) — agent `a43711b1d7dfbc45c`

**Stop treating this as a tagging bug. It's the discovery that `category` is two fields wearing one
hat — and the second field is worth more than the first.**

The evidence already proves it: the split correlates perfectly with equipment/tier, not joint count.
So `category` is silently carrying *loadability* alongside *mechanics*. Name the second thing and you
get a new axis: `progression_mode: 'external_load' | 'rep_volume' | 'unilateral_ladder'`. Now
bodyweight glute bridges progress the way they actually progress in real life — reps, tempo,
single-leg — instead of pretending a 2%/week load bump means anything on a floor bridge. That's not a
fix, that's a feature the app currently cannot express at all.

Look at what that unblocks. D6d says *"the home cells are blocked on tagging."* 126 sub-MEV cells.
You are one field away from making the entire home tier first-class — which is the version of Tandem
that works in a hotel room, on vacation, on a deload week, on the day the gym is closed. That's the
adjacent market hiding inside a five-row disagreement.

Second undervalued asset: `MOVEMENT_FAMILIES` is being used as a classifier when it's really a graph.
D30's movement-pattern comparator already exists. Push further — family-level PR tracking (hip thrust
and glute bridge are the same pattern, so Dani's bridge PR and Kerwin's barbell PR become
*comparable*), family-level volume accounting, equipment-agnostic substitution, and fair
couple-scoring when the two of them have different gear. That's the competitive moat, not the sets
count.

Third: the measured blast radius — 60 combos changed, **zero MEV regressions** — is not a null
result. It's proof the volume allocator has slack. That's rare permission to do the *bigger* refactor
cheaply. Spend it now, while it's free.

### The Outsider (peer-review letter **D**) — agent `addd05a50bea87d13`

Reading this cold, the thing that jumps out is that nobody has answered the actual question: **what
does `category` mean?** You have two consequences bolted to one word — how many sets, and how fast
load climbs — and your own evidence says those two things want different answers. Joint count decides
the progression rate (that's what NSCA's core/assistance distinction is about). Loadability decides
whether a set is even meaningful. A bodyweight glute bridge is multi-joint AND unloadable. One field
cannot say both, so whichever way you flip it, half the app gets the wrong answer. Re-tagging is
choosing which half to be wrong about.

Second thing an outsider trips over: `isolation` is a value in *both* tables — a `category` and a
`movement_pattern`. That's not a subtle naming issue, it's a guarantee that future readers (including
future you) will conflate them. If the two tables are genuinely orthogonal, they must not share
vocabulary.

Third, and this is the part I'd stop on: flipping three exercises to a *higher* set count makes
hotel-gym glute volume go **down** 17→14, and silently swaps quads in and hamstrings out. You
describe that as "second-order effects through MEV-raise / MAV-trim / trim-and-restore." From
outside, that reads as: the engine's response to an input is not predictable by the people who wrote
it. That's a much bigger finding than the hip-thrust question, and your own SC-23 says to treat it as
a bug.

Also: 126 cells below MEV "blocked on tagging," yet all 24 gates are green. A gate suite that reports
perfect health while a known floor violation sits in the data is telling you something reassuring and
false.

### The Executor (peer-review letter **B**) — agent `a61b196833c9851c9`

**Do not flip the three tags. You have an unexplained 20% volume DROP and shipping into that is how
you break a live app on a Tuesday.**

The blocker is evidence item 4: hotel_gym glute_max goes 17→14 when you make glutes *more* compound.
That is backwards. Until you can name the line of code that does it, you don't have a fix, you have a
coin flip that happens to pass 24 green gates. SC-23 already tells you this is a bug until explained.

Monday morning, in order:

1. **Instrument `applyGoalVolume()` for one combo only** — build_muscle/hotel_gym/male/intermediate.
   Log the exercise list and set counts before MEV-raise, after MEV-raise, after MAV-trim, after
   trim-and-restore. Two runs, tags flipped and not. Diff them. One afternoon. You'll find it in the
   trim pass: 4-set compounds trip the MAV cap sooner and get trimmed or displaced, which is why the
   *loaded* tier loses volume. Confirm that, don't assume it.
2. **Separate the two consumers before you touch any tag.** `category` is doing two unrelated jobs —
   set count and progression rate. Only the progression rate is a doctrine claim (D24, NSCA
   multi-joint vs single-joint). So change `progressionPct()` to take joint-count from
   `MOVEMENT_FAMILIES.pattern` (hinge ⇒ multi-joint) instead of `category`. That fixes the actual
   user-visible harm — glute-bridge under-progressing at half rate — with **zero** effect on set
   counts, and therefore zero selection churn. Ship that alone. It's small, it's testable, and it's
   defensible.
3. **Then, separately,** decide whether set-count-by-`category` should call bodyweight glute bridges
   3 or 4 sets. That's a volume question, not a taxonomy question, and it can wait for step 1's
   answer.

Don't do 1, 2, and 3 in one commit. The whole reason this is confusing is that one field is
overloaded; a single big change keeps it overloaded.

---

## Round 2 — peer review (anonymized, randomized letter mapping)

**Anonymization mapping (revealed):**

| Letter | Advisor |
|---|---|
| A | The Expansionist |
| B | The Executor |
| C | The Contrarian |
| D | The Outsider |
| E | The First Principles Thinker |

Five reviewers each saw all five responses as A–E with no advisor identities and answered: strongest
response / biggest blind spot / what all five missed.

**Unusual result: 5/5 reviewers picked B as strongest and 5/5 picked A as the biggest blind spot.**

### Reviewer 1 (`a40e9e50740a80603`)

**1. Strongest: B.** It reaches the same diagnosis as C/D/E (one field, two rules) but is the only
response that converts it into a shippable sequence: instrument `applyGoalVolume()` on one combo,
then re-point `progressionPct()` at `MOVEMENT_FAMILIES.pattern` so the user-visible D24 harm is fixed
with zero selection churn, then defer the set-count question. C and E diagnose better than they
prescribe; B does both and explicitly refuses the single big commit.

**2. Biggest blind spot: A.** It treats "0 MEV regressions" as proof the allocator has "slack" and
spends that as permission for a bigger refactor — inverting the evidence. Zero regressions plus an
unexplained 17→14 glute drop means the gates are blind to this change, not that it's safe. A never
engages with SC-23, never asks what 8%/week means on a frog pump, and oversells 11→12 of 126 cells as
unblocking the home tier.

**3. All five missed:** nobody asked what the *rest of the bank* looks like under the same lens.
`hip-thrust` is called "the only mixed family," but the equipment/tier correlation means every
bodyweight-vs-loaded pair (push-up/bench, pistol/squat) likely carries the same latent conflict — it
just never surfaced because those families aren't mixed within one pattern. Per "fix the mechanism,
not the instance," the audit must enumerate the bodyweight axis bank-wide before any split ships.
Also unaddressed: who owns the new field in Notion, and whether D6d's "blocked on tagging" text needs
amending first.

### Reviewer 2 (`a0c0fc562fb2fc88e`)

**1. Strongest: B.** It reaches the same diagnosis as C/D/E (one field, two rules) but is the only
one that converts it into a shippable sequence: instrument `applyGoalVolume()` on a single combo,
then re-point `progressionPct()` at `MOVEMENT_FAMILIES.pattern` — the change that fixes the real
user-visible harm (glute-bridge at half rate) with zero selection churn — then defer the set-count
question. It also refuses to bundle the three steps, which is the correct response to an overloaded
field.

**2. Biggest blind spot: A.** It treats "0 MEV regressions" as proof of slack and permission to do a
bigger refactor, when in fact it proves the gate is blind to this change (C's point). It then spends
that false permission on family-level PR tracking and couple-scoring — new features layered on a
schema whose current behavior nobody can predict. It never engages the 17→14 drop at all.

**3. All five missed:** nobody proposed a gate. D6d is PENDING, D24 is enforced only through
`category`, and no invariant asserts a family is category-homogeneous or that `progressionPct` reads
the same joint-count source as set dosing. Split the field and the next drift is undetectable again.
Also unexamined: whether `MOVEMENT_FAMILIES` actually claims joint count, or only pattern.

### Reviewer 3 (`a1d2f57202429ef6c`)

**1. Strongest: B.** It reaches the same diagnosis as C/D/E (one field, two rules) but is the only
response that converts it into a shippable sequence: instrument `applyGoalVolume()` on one combo,
then re-point `progressionPct()` at `MOVEMENT_FAMILIES.pattern` — a fix with zero set-count churn —
then treat sets as a separate decision. C and E have the sharpest single insight (an 8% ramp on
frog-pump is fabricated), but B is the only one that says what to commit on Monday and explicitly
forbids bundling.

**2. Biggest blind spot: A.** It treats the 60-combo churn and the 17→14 glute drop as "permission to
do the bigger refactor cheaply" — inverting the evidence. Zero MEV regressions means the *gate is
blind*, not that the change is safe; SC-23 says unexplained selection churn is a bug until explained.
A then spends that imaginary slack on family-level PRs and couple-scoring, none of which touch the
question, and overclaims D6d (12 of 126 cells).

**3. All five missed:** nobody checked what `progressionPct` actually does when `seedWeight` is
bodyweight — C and E *speculate* about fabrication but neither ran it, violating "verify by running."
Also unaddressed: splitting the field is a doctrine change, so D24 must be amended in Notion →
`DOCTRINE.md` → `doctrine.mjs` *before* code, and program-snapshot must be re-baselined.

### Reviewer 4 (`af7874a48d2a6e620`)

**1. Strongest: B.** It reaches the same diagnosis as C/D/E (the field is overloaded) but is the only
one that sequences it safely: instrument one combo to explain the 17→14 drop first, then re-point
`progressionPct()` at `MOVEMENT_FAMILIES.pattern` — a change that fixes the real user-visible harm
with zero selection churn — then treat set counts as a separate volume question. It also refuses to
bundle the three steps, which is the right read of an overloaded field. C and E diagnose well; only B
is executable Monday.

**2. Biggest blind spot: A.** It treats the change as cheap ("zero MEV regressions… spend it now,
while it's free") when the same data shows a 20% unexplained glute-volume DROP for hotel_gym and
selection churn — SC-23 says that's a bug until explained. A reads a gate that is blind to this
change by construction as a safety proof, then argues for the *largest* refactor (new field, family
PR graph, adjacent market) on that false permission. C's rebuttal is correct: home rising 11→12 of
126 cells does not unblock D6d.

**3. All five missed:** nobody asks what the DB thinks. `category` also lives in prod `exercises`
(180 rows, seed-applied); the doctrine gate cannot see Postgres, so a field split needs a migration +
seed + snapshot refresh, or verify stays green while prod diverges. Also unraised: D24 must be amended
in Notion *before* code, and this is itself a "one rule, one home" doctrine fork — run council output
as the citable artifact.

### Reviewer 5 (`a6ad49d13ba23482b`)

**1. Strongest: B.** Same diagnosis as C/E (one field, two rules) but the only one that converts it
into a sequenced, shippable plan: instrument one combo to explain the 17→14 before touching anything;
then repoint `progressionPct()` at `MOVEMENT_FAMILIES.pattern`, which fixes the real user-visible
harm (glute-bridge at half rate) with zero set-count or selection churn; then defer the volume
question. It also explicitly refuses to bundle the three steps — correct, since bundling preserves
the overload.

**2. Biggest blind spot: A.** It reads "0 MEV regressions" as slack and "rare permission" for a
bigger refactor, when 0-and-0 means the gate is blind to this change by construction. It never
addresses the unexplained hotel_gym drop or the quad/hamstring churn, so it proposes a schema
migration on top of behavior nobody can predict — a direct SC-23 violation. Its D6d credit is also
inflated: home 11→12 against 126 sub-MEV cells.

**3. All five missed** the change-order and durability requirements: splitting `category` is a
doctrine amendment (Notion → `/DOCTRINE.md` → `doctrine.mjs` in one change, D24's text rewritten
around load not joints) plus a new gate so the field cannot be re-overloaded — otherwise this silo
drifts back. Nobody checked the Postgres copy of these tags (the doctrine gate cannot see the DB, so
the seed/`exercises` rows can diverge silently), and nobody asked what happens to Kerwin's and Dani's
**in-flight** mesocycles when set counts shift mid-program.

---

## Round 3 — Chairman synthesis

### Where the Council Agrees

Five advisors, working independently with no knowledge of each other's answers, converged on the same
answer to a question none of them were asked:

1. **Do not flip the three tags.** Not one advisor recommended the re-tag. The question as framed
   ("compound or isolation?") has no correct answer.
2. **`category` is one field carrying two unrelated rules.** All five named the same two consumers:
   *set dosing* (`GOAL_VOLUME`) and *load progressability* (`progressionPct`, D24). Joint count is
   the right input for one; loadability is the right input for the other. They coincide for a barbell
   hip thrust and diverge for a floor bridge — which is the entire reason this family looks
   "inconsistent."
3. **The bank's authors were not confused — they were compressing.** Evidence 1 (the split tracks
   equipment/tier perfectly) plus evidence 2 (the `why` string asserts mechanical identity) says the
   original tagging deliberately resolved toward loadability. Three advisors made this point
   independently.
4. **This is a "one rule, one home" violation, and the fix is to split the field**, not to pick a
   winner. Flipping either way makes half the app wrong.
5. **The 17→14 hotel_gym glute drop is the blocker, not a curiosity.** Four of five flagged it;
   "second-order effects" was called out as a label rather than an explanation. SC-23 applies.

### Where the Council Clashes

**Scope and sequencing — and this is a real disagreement, not a smoothable one.**

- **The Expansionist** reads "60 combos changed, 0 MEV regressions" as evidence the allocator has
  slack, and argues that slack is *rare permission to do the big refactor cheaply, now*: a new
  `progression_mode` field, family-level PR tracking, equipment-agnostic substitution, the home tier
  made first-class, D6d's 126 cells unblocked.
- **The Executor and the Contrarian** read the same number as evidence the *gate is blind by
  construction* — 0-and-0 is what you get when the only instrument you own cannot see the change.
  Under that reading, 60 unexplained deltas is a reason to stop, not to accelerate.

Both are reasonable from their premises. The disagreement is entirely about what a null gate result
means. The peer review round settled it 5–0 against the Expansionist: zero regressions in a gate that
cannot see the change is not a safety signal. **But the Expansionist's product point survives the
loss** — a movement where percentage load progression is meaningless is a real modelling gap, and
`progression_mode` is a better name for the second field than anything the other four offered.

A second, smaller clash: whether the *progression* side or the *sets* side is the load-bearing
consumer. The Executor says only progression is a doctrine claim (D24 cites NSCA on joints), so fix
that alone; the First Principles Thinker says D24's citation is about *load*, not joints, which means
re-pointing `progressionPct` at `MOVEMENT_FAMILIES.pattern` (the Executor's step 2) may be fixing it
with the wrong input too. Unresolved by the council — and it matters, because it decides whether
step 2 is a clean win or a second compression.

### Blind Spots the Council Caught

Five things emerged only in the peer review round, and three of them are more serious than the
original question:

1. **Nobody ran the thing they were all speculating about.** The Contrarian and the First Principles
   Thinker both assert an 8%/week ramp on a bodyweight frog-pump is either a no-op or a fabricated
   prescription — *and neither established which*. Reviewer 3 named this as a direct violation of the
   project's own "verify by running, not by reading" rule. This is the council arguing about the
   severity of a defect whose severity is one `node -e` away.
2. **`category` also lives in Postgres.** The prod `exercises` table carries these 180 rows via
   `epic031_exercises_seed.sql`, and the doctrine gate cannot see the database. A field split that
   ships only in `programs.js` leaves `verify` green while prod diverges — exactly the failure mode
   D17 exists to remember.
3. **The bank-wide version of this defect was never enumerated.** If the tag really encodes
   loadability, then *every* bodyweight-vs-loaded pair carries the same latent conflict (push-up vs
   bench, pistol squat vs back squat). `hip-thrust` is only "the only mixed family" because those
   other pairs don't happen to sit inside one pattern family. Under "fix the mechanism, not the
   instance," that enumeration is a precondition, not a follow-up.
4. **Nobody proposed a gate.** Split the field and nothing stops it being re-overloaded next quarter.
   No invariant asserts family category-homogeneity, or that set dosing and progression read
   different, named sources.
5. **In-flight mesocycles.** Kerwin and Dani are mid-program. A set-count change that lands
   mid-mesocycle alters a program already in progress. Nobody costed that.

Also caught, and cheap to fix: **`isolation` is a value in *both* tables** — a `category` and a
`movement_pattern`. Two orthogonal classifiers sharing vocabulary guarantees future conflation.

### The Recommendation

**Do not re-tag the hip-thrust family. Do not split the field yet either.** The council is right that
the split is the eventual answer, but it is a doctrine amendment (Notion → `/DOCTRINE.md` →
`doctrine.mjs` in one change, with D24's text rewritten around load rather than joints, plus a
migration and seed re-apply for the Postgres copy). That is not a change to start on the strength of
an argument. It is a change to start on the strength of a measurement nobody has taken.

The chairman departs from the Executor's ordering on one point. The Executor's step 1 (instrument
`applyGoalVolume()` to explain the 17→14 drop) is only needed *if you flip the tag* — and the council
just decided not to. The Contrarian's unanswered question is needed **either way**, and it is the
only open item that changes the severity of the whole ticket:

- If `progressionPct` no-ops on a bodyweight movement, the D24 half-rate "harm" is cosmetic, this
  entire family split drops to a P3 taxonomy tidy, and it should be scheduled, not rushed.
- If it renders a number on a card for a lift with no external load, Tandem is showing Dani a
  fabricated load prescription, that is a P1 independent of the hip-thrust question, and it is a
  violation of the project's first principle in the place it hurts most — a made-up number on a
  screen.

Same three lines of code to find out. Everything else in this ticket is correctly sequenced behind
that answer.

Keep the Expansionist's naming (`progression_mode: 'external_load' | 'rep_volume' |
'unilateral_ladder'`) on file — it is the right vocabulary for the second field when the split
happens — and drop its claim that this unblocks D6d. Home rising 11→12 against 126 sub-MEV cells does
not unblock anything.

### The One Thing to Do First

**Run `seedWeight` + `progressionPct` against `glute-bridge`, `single-leg-glute-bridge` and
`frog-pump` and print what the user's card actually shows in week 1 vs week 8.** Not what the engine
computes — what renders. One script, no source edits, no branch.

That single output decides whether this is a P1 fabricated-prescription bug or a P3 taxonomy tidy,
and the correct next step is different in each case. Nothing else should move until it's on the
screen.

---

## Resolution (2026-09-29, same day — measurement ran, verdict rendered, fix shipped)

The One Thing to Do First was run: a vm probe extracted the live PO engine + 1RM chain from
`tandem.html` and printed what the card renders for `glute-bridge`, `single-leg-glute-bridge`
and `frog-pump`, week 1 vs week 8, fresh user and after a logged set.

**What the measurement showed:**
- **Fresh user: clean.** "★ First session", no number. Every load-fabrication path is
  structurally dead for these three: no `ACCESSORY_FACTORS` entries (derived %1RM can't fire),
  `seedWeight` 0 falls through `getWeekTarget`'s `if (def)` → `{weight:null, source:'none'}`,
  and the bw weight input renders blank with a 'BW' placeholder regardless of startW.
- **After any logged bodyweight set (logSet stores weight 0 for a blank BW cell): the chip
  literally rendered the string `"↑ null lbs"`** with reason `"15 reps — 2 over target, add 4%
  (0 lbs)"` — `getRecommendation`'s flat-increment up/down branches interpolated
  `progressLoad()`'s w<=0 null guard straight into the label.

**Verdict per the decision rule: P2 Visual UX** — neither P1 (no load is ever fabricated; no
made-up pounds reach the input or the chip) nor P3 (a user-visible broken "null lbs" chip on
every bodyweight card from the second session onward is not a tidy). Taxonomy stands as ruled
above: no re-tag, no category split needed to fix this.

**Filed and fixed:**
- **BUG-188** (Notion Bug & QA Log, P2 Visual UX): "Progression chip renders \"null lbs\" for
  bodyweight exercises after first logged session". Status: Resolved.
- **Fix `cdbcf19`**: weight<=0 guard in `getRecommendation`'s flat-increment tail —
  rep-progression messaging instead ("Add reps" / "Hold steady" / "Build reps", `weight:null`).
  Basis (citation corrected in `2b8e879`): Plotkin et al., "Progressive overload without
  progressing load?", PeerJ 2022 (PMID 36199287, doi 10.7717/peerj.14142) — rep and load
  progression both viable over an 8-wk cycle. NOT research-report §3's "5-30 rep equivalence"
  (that answers rep-RANGE interchangeability, a different question); PDF p.7 item 4 is
  corroboration only. Mechanism-level: covers every bodyweight/band movement (Push-Up, Pull-Up, Band Curl,
  the three glute-bridge variants), every goal/week; weight>0 path byte-identical. Verified by
  vm probe re-run + live preview-page eval; `verify` 26/26 and `validate:personas` green.

The Expansionist's `progression_mode` vocabulary remains on file for the future field split;
nothing in this fix forecloses it.

---

*Council convened 2026-09-29 · 5 advisors + 5 peer reviews + chairman synthesis · question: should
the three bodyweight hip-thrust variants be re-tagged `category:'compound'`? · verdict: no — the
field is overloaded; measure the bodyweight progression render first. Measured same day: render
defect confirmed → BUG-188 (P2) → fixed in `cdbcf19`.*

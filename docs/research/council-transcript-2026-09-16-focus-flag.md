# LLM Council Transcript — "Focus this lift" engine mechanism

**Date:** 2026-09-16
**Convened per:** CLAUDE.md's `llm-council` escalation path, triggered because
`docs/research/focus-flag-exercise-science.md` (the `exercise-science-research` skill's output)
confirmed `/DOCTRINE.md`, Notion (5-Goal Taxonomy, Programming Architecture Reference, Exercise
Science Schema v0.5, Periodization spec), and the repo research PDF/docx are silent on two
questions the "Focus this lift" feature cannot ship without answering.

## The framed question

Tandem's programming engine (`programs.js`) is gaining a "Focus this lift" feature: a user flags
a muscle group (or lift) they want to prioritize, and the program engine should bias toward it.
Two sub-questions have no answer in any canonical Tandem source:

1. **Simultaneous-focus cap** — how many muscle groups/lifts can a user flag "focus" at once
   before the feature becomes incoherent or unsafe? No numeric cap exists in any source.
2. **Mechanism** — should focusing ADD volume/frequency on top of the existing program, or
   REDISTRIBUTE existing volume/frequency away from non-focused muscles? No source specifies.

Established context fed to every advisor:
- `VOLUME_LANDMARKS` gates only the MEV floor (D6b, ACTIVE); MAV/MRV are documented but ungated —
  no engine-level ceiling on total program volume exists today.
- D20 ("reorder, don't exclude" in `getSingleDay()`) and D27 (continuity-preference) are the
  closest existing precedents; `buildDynamicProgram()`'s `bank()` tiebreak chain has **no**
  equivalent today — a confirmed implementation gap, not hypothetical.
- `computeMuscleWeeklyVolume()` (programs.js:2789-2802) is the designated shared ledger any
  focus-boost logic must extend (its own comment anticipates this).
- `FOCUS_SLOTS` (programs.js:1896-1906) is an existing, unrelated table — a real naming-collision
  trap for whoever implements this feature.
- External (non-doctrine) web corroboration: an Alphaprogression blog article (synthesizing
  Schoenfeld 2019, Brigatto 2019, Amirthalingam 2017, Hackett 2018, and expert opinion from
  Helms/Israetel/Schoenfeld/McDonald) recommends specializing on 2-3 muscle groups at once while
  dropping others to a "maintenance dose" (~8 sets/wk maintenance vs 18 sets/wk growth for chest
  in its worked example) — i.e., redistribution, not addition. Weighted as corroboration-only,
  explicitly NOT doctrine-grade (it's a blog synthesizing studies, not itself peer-reviewed).

## Advisor responses

**The Contrarian:** The feature has a fatal unverified parameter — nothing validates that
Tandem's MEV floor can double as a "maintenance dose" for de-prioritized muscles. MEV is a growth
minimum, not a validated maintenance minimum; treating them as interchangeable is an unstated
assumption at the center of the whole feature. Also flagged safety/incoherence risk from an
unbounded simultaneous-focus count.

**The First Principles Thinker:** Reframed both sub-questions as one physical-constraint
argument: fixed weekly training capacity + the only currently-gated bound (MEV floor) means
redistribution is the only internally coherent mechanism — pure addition has no ceiling to push
against (MAV/MRV ungated) and would silently blow past volume landmarks or session length. Under
redistribution, the "cap" isn't an independent number to invent — it's emergent: however many
muscles can be dropped to their MEV floor while still leaving enough weekly capacity to elevate
the focused muscle(s) meaningfully.

**The Expansionist:** Framed "Focus this lift" as competitive differentiation for Tandem's
science-backed-adaptive-program moat — a well-executed, transparently-shown redistribution
("we're trimming X to grow Y this block") could become a trust-building feature, not just a
filter toggle. Argued not to under-scope UI ambition even with a conservative engine mechanism.

**The Outsider:** No Tandem context. Flagged that "Focus this lift" as a product name collides
with the pre-existing, unrelated `FOCUS_SLOTS` table — a real trap for a future engineer or
Kerwin reading a diff. Also raised a naive-user question: if redistribution happens invisibly,
what explains to the user why their other lifts got lighter — a UX/communication requirement,
not just an engine one.

**The Executor:** Ship fast — hardcode `FOCUS_CAP = 2`, drop non-focused muscles to their
existing `VOLUME_LANDMARKS` MEV value as the "maintenance dose," ship Monday. Treated MEV as
good enough to double as maintenance without further justification.

## Peer review (anonymized A–E, all 5 advisors reviewed all 5 responses)

**Convergent finding #1 (unanimous):** First Principles Thinker (Response B) named strongest by
all 5 reviewers — the only response collapsing both sub-questions into one physical-constraint
argument, making the cap emergent rather than invented.

**Convergent finding #2 (unanimous):** Executor (Response E) named as having the biggest blind
spot by all 5 reviewers — its "hardcode FOCUS_CAP=2, reuse MEV as maintenance" plan silently
treats a growth-minimum landmark as a validated maintenance target. Multiple reviewers called
this "exactly the confident fabrication CLAUDE.md's prime directive forbids."

**Convergent finding #3 (unanimous, "what did everyone miss"):** None of the 5 advisors — nor
the council's own question framing — actually checked Notion's Exercise Science Schema v0.5 or
Periodization spec for an existing maintenance-volume-floor or specialization-block-duration
concept before reasoning. Everyone reasoned from the Alphaprogression blog, code inspection, and
first-principles biology only. One reviewer suggested that if no maintenance floor exists there
either, the correct artifact is a new `MAINTENANCE_LANDMARKS` table (sibling to
`VOLUME_LANDMARKS`) rather than silently reusing MEV.

## Chairman synthesis

### Where the Council Agrees
All five converge: the only currently-gated volume bound is the MEV floor, MAV/MRV are ungated,
so redistribution is the only mechanism consistent with the system as it exists today — not a
preference, a constraint. Unanimous peer agreement that the First Principles Thinker's
emergent-cap framing is strongest, and that the Executor's plan is the one proposal that actually
violates the Prime Directive.

### Where the Council Clashes
Not mechanism — posture toward shipping speed and transparency. Executor wants to ship now
assuming MEV-as-maintenance is close enough; Contrarian rejects that assumption as the load-
bearing risk in the whole feature. Expansionist wants redistribution surfaced as a differentiated,
user-facing trust feature; Outsider warns that invisible redistribution leaves users (and Kerwin)
unable to explain why other lifts got lighter. Both threads (ambition-vs-conservatism,
engine-logic-vs-user-facing-explanation) remain open even once mechanism is settled.

### Blind Spots the Council Caught
Executor's MEV-as-maintenance conflation is well-established. More important: **the council
itself has a methodological gap** — no targeted check of Exercise Science Schema v0.5 /
Periodization spec for a maintenance-dose concept has been done (the earlier research pass was a
general sweep, not a targeted search for this specific concept). Everything argued here rests on
a corroboration-only blog plus code reading plus first-principles biology. Per CLAUDE.md's
source-first Prime Directive, **this verdict is not yet doctrine-ready** on process grounds alone.

### The Recommendation
Ship the engine mechanism as **redistribution, not addition**, cap treated as emergent per the
First Principles Thinker: however many muscles can be dropped without breaching their MEV floor
while still leaving enough weekly capacity to meaningfully elevate the focused muscle(s). Do not
hardcode a cap constant. Do not reuse `VOLUME_LANDMARKS`'s MEV value as a maintenance target
without a citation — treat "what non-focused muscles get dropped to" as an open variable pending
the Notion check. Name a new table `MAINTENANCE_LANDMARKS` if/when a source is found, rather than
overloading MEV silently. Wire redistribution into `computeMuscleWeeklyVolume()` per its own
anticipating comment; add the D20/D27-equivalent tiebreak inside `buildDynamicProgram()`'s
`bank()` (confirmed gap). Name the feature to avoid the `FOCUS_SLOTS` collision. Surface
redistribution transparently in the UI (Expansionist + Outsider) — doesn't need to wait on the
doctrine question, ship in the same PR.

### The One Thing to Do First
Before promoting anything to `/DOCTRINE.md`: do the targeted check — read Exercise Science
Schema v0.5 and the Periodization spec specifically for a maintenance-volume or
specialization-block concept, not a general sweep. If found, cite it and set the maintenance dose
accordingly. If confirmed silent, that silence is itself the artifact to record, and the next
move is another `llm-council` round — this time to rule on the `MAINTENANCE_LANDMARKS` numeric
default, not a guess, not MEV-reuse.

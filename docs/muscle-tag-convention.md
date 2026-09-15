# The `EXERCISE_BANK` muscle-tag convention

**Status:** descriptive-then-binding. Every count below was produced by running the bank, not by
reading it (`CLAUDE.md` "verify by running"; `docs/self-corrections.md` SC-03). Derived
2026-09-14 against `programs.js` at **179 entries / 49 distinct tags**, after EPIC-026 Phase 3a-3c.

This file exists because the convention was real but unwritten. `docs/epic-026-submuscle-audit.md`
is a point-in-time audit (SC-05: status docs are snapshots) and it inferred the convention
backwards, which is how it arrived at a "36 backfill candidates at 171 entries" number that no
longer reproduces. The durable rule lives here; `scripts/verify.mjs`'s vocabulary check enforces
the mechanical half of it.

---

## 1. What a tag is for

`groupsMatch` (D19, SAFETY tier) is the whole consumer:

```js
groups.some(g => tags.some(a => a === g || a.startsWith(g + '_')))
```

Two consequences that drive everything else:

- **Tags are a flat, unweighted eligibility list.** `muscleGroups.primary` and
  `.secondary` are concatenated before matching. A secondary tag makes an exercise *selectable*
  by that slot; it does not say the exercise is *good* for it.
- **The rule is an anchored prefix, so sub-heads are free.** A slot asking for `tricep` reaches
  `tricep_long_head`; a slot asking for `quad_vastus` reaches `quad_vastus_medialis`. Adding a
  sub-head under a parent you already carry never costs you a slot. Removing a parent you carry
  *without* a sub-head does.

Ranking, not eligibility, is what separates a prime mover from a synergist. That is
`primaryMatchRank` (commit `920d9a7`): a candidate whose **primary** satisfies the slot outranks one
that only satisfies it through a secondary. This is why Phase 3c could add 41 entries' worth of
secondary tags and change **zero** of 630 weekly programs and **zero** of 756 one-off days — the new
tags grant synergist-level eligibility, and a synergist now always loses to an available prime
mover. Anatomical completeness at zero behavioural cost is the design, not a coincidence.

## 2. The convention

> **Primaries name the head when the head is known. Secondaries follow the movement's category:
> a compound carries the bare parent, an isolation carries the sub-head.**

The reasoning is not aesthetic. A compound recruits a whole muscle — a bench press works the
triceps, not the lateral head specifically — so the bare parent is the *accurate* claim and the
sub-head would be a fabricated precision. An isolation is chosen precisely because it biases one
head, so naming the head is the accurate claim and the bare parent throws information away.

**Measured conformance** (`category` × bare-vs-sub-head, secondaries only):

| parent | bare secondary | sub-head secondary |
|---|---|---|
| `tricep` | 25 — **all `compound`** | 10 — **all `isolation`** |
| `bicep` | 17 — 16 `compound`, 1 `cardio` (`rower`) | 5 — **all `isolation`** |

50 of 50 tricep/bicep secondaries conform. That is the convention, and it was already the
convention before anyone wrote it down.

**The scope of that table, stated so it is not over-read.** It measures the two *top-level* parents
where the choice actually exists. It is not a claim about all 303 secondary instances, and most of
those could not violate the convention if they tried: only **7** of the 49 tags have a sub-head at
all (`bicep`, `bicep_brachii`, `hamstring`, `quad`, `quad_vastus`, `rectus_abdominis`, `tricep`).
A secondary like `anterior_delt` or `glute_max` is a leaf because the vocabulary offers nothing
finer — that is not conformance, it is an absence of alternatives.

Run across the whole bank, **8** isolations carry a bare-parent secondary. Three are the
`hamstring` hip-extension cases named below. The other **five are `bicep_brachii` on
`hammer-curl`, `reverse-curl`, `cross-body-hammer-curl`, `cable-rope-hammer-curl`, and
`band-hammer-curl`** — all neutral- or pronated-grip curls whose primaries are `brachialis` +
`brachioradialis`, with the biceps as the synergist. They stay bare for the reason §3 already
establishes for the `bicep_brachii` primaries: long-vs-short-head bias is determinable *in
principle*, but **no source in this repo, in Notion, or in the Wave-1 research tables states it for
these specific entries**, and determinable-in-principle is not a citation. That is a statement about
what the sources contain — verified by looking — not a physiological claim of my own.

**Named exceptions, kept rather than normalised** (normalising them would be a science claim, and
no source was consulted for one):

- `hamstring` bare on three isolations — `cable-kickback`, `glute-bridge`,
  `single-leg-glute-bridge`. All three are *hip-extension* movements, where the hamstring group
  works as a unit at the hip rather than as individually-biased knee flexors. The bare parent is
  arguably the more accurate tag here, not the lazier one.
- `quad_*` sub-heads on two compounds — `curtsy-lunge`, `db-sumo-squat`. Inherited; the quad
  family is the bank's only **two-level** hierarchy (`quad` → `quad_vastus` →
  `quad_vastus_lateralis` / `_medialis`), which the audit never modelled.
- `bicep` bare on `rower` (`cardio`). Cardio is out of scope, see §4.

**Bare `delt`, `trap`, `pec`, and `glute` do not exist in the vocabulary at all**, and must not be
introduced. `docs/epic-026-submuscle-audit.md` §6D: the benefit would be a parent slot no template
wants and the science argues against.

## 3. Bare-parent primaries: 51 entries, and why none of them were "fixed"

51 entries carry a bare parent in `primary`. The audit read that as a backfill queue. It is not.
Phase 3d changed **zero** primaries, and the reason is per-family, not a blanket policy:

| family | n | why it stays bare |
|---|---|---|
| `quad_vastus` | 16 | Not bare at all in the relevant sense — every one of these already carries `quad_vastus_lateralis` and/or `_medialis` *alongside* the parent. The bare tag is a third co-tag in a two-level hierarchy, not a missing head. |
| `rectus_abdominis` | 13 | The only sub-head is `rectus_abdominis_lower`, and regional ("lower abs") activation bias is contested. No repo or Notion source rules on it. Inventing the split would be fabrication. |
| `bicep_brachii` | 8 | Long-vs-short-head bias **is** determinable in principle (the long head crosses the shoulder, so shoulder position biases it) — but no source in this repo, in Notion, or in the Wave-1 research tables states it for these specific entries. Determinable-in-principle is not a citation. |
| `hamstring` | 6 | All six are RDL-pattern hip extensions. Same reasoning as the §2 exception. |
| cardio | 6 | Out of scope, §4. |
| `tricep` | 2 | `close-grip-barbell-press`, `dips` — both `compound`. The bare parent **is** the convention. |

The governing constraint on top of all of this: `docs/epic-026-submuscle-audit.md` §6B mandates
**additive-only vocabulary — zero renames, zero migration**. Promoting a bare primary to a sub-head
is a rename.

## 4. Cardio is exempt from the secondary requirement, and the wording matters

`secondary` is **OPTIONAL** for `category: 'cardio'` — not *required to be empty*. Three cardio
entries legitimately carry secondaries today. The 1D research ruling: cardio secondary tags were
measured at **0/1942** effect on generated output, have no consumer, and no repo source assigns
muscle involvement to steady-state modalities. Adding them would be uncited data that nothing reads.

## 5. Entries deliberately shipping with no `secondary` — the full exemption list

Six, and each one is a *refusal to fabricate*, not an oversight:

| entry | category | why |
|---|---|---|
| `high-knees` | cardio | §4 |
| `incline-treadmill` | cardio | §4 |
| `stationary-bike` | cardio | §4 |
| `elliptical` | cardio | §4 |
| `frog-pump` | isolation | `glute_medius` proposed by Wave-1C and marked **UNVERIFIED** — coaching sources only, no EMG study located. |
| `band-external-rotation` | isolation | `posterior_delt` proposed and **rejected**: measured, it changes **336 of 1942** generated outputs. That is a selection change masquerading as a tagging change, and it needs a ruling, not a tag. |

Zero entries have an empty `primary`. That is a hard rule with no exemptions.

## 6. What is enforced, and what is judgment

Two gates, split so neither duplicates the other (`CLAUDE.md` "one rule, one home" — and the
cautionary precedent is D19, which exists *because* one rule got copied into two places):

`scripts/muscle-vocabulary-smoke.mjs` owns **shape + spelling**. The declared set and the
exemptions live in `scripts/lib/muscle-vocabulary.mjs`, exported and imported by
`scripts/audit-muscle-tags.mjs` so the read-only audit reports the same drift the gate fails on.

- **[A]** non-empty `primary` on every entry — no exemptions
- **[B]** non-empty `secondary` except `category: 'cardio'` (§4) and the two named entries (§5)
- **[C]** every tag drawn from `MUSCLE_VOCABULARY`, so a typo like `hamstring_bicep_femoris` fails
  the build instead of silently becoming an orphan
- **[D]** no stale exemption — an exempted entry that has since acquired a secondary fails
- **[E]** no stale vocabulary — a declared tag no entry uses fails

`scripts/reachability-smoke.mjs` owns **reachability**, unchanged: every entry selectable by ≥1
slot; no new orphan tags; no stale `OPEN_GAPS` entries; D19's two `groupsMatch` copies intact.

All five vocabulary rules were negative-tested by mutating the bank, confirming exit 1, and
restoring — a gate that has only ever passed has not been shown to work.

**Not mechanically checkable — judgment:** whether a given tag is anatomically *correct*, whether
a compound-vs-isolation call is right, and whether a head bias is real. Those are exercise-science
questions answered by sources, and the gates above cannot see them. A green run means "no typos and
nothing died", never "the tags are true".

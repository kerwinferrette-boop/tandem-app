# Should secondary muscles count toward recovery fatigue?

**Status: PROPOSAL. No code ships from this document.** The decision order is Kerwin rules →
`llm-council` if the sources conflict → implementation. Filed per the EPIC-026 plan, Phase 5.

Everything below was **measured by running the engine** over the full 630-persona matrix ×
9 one-off focuses (~40,400 candidate pools per variant), not reasoned about. SC-03.

---

## 1. The question

`recentMuscleLoad` (`tandem.html`) reads **`muscleGroups.primary` only** when deciding whether a
muscle was trained recently. `RECOVERY_PARAMS.sameGroupHours` then penalises a candidate whose
muscle is still inside its window. Live values, read from source:

| goal | `sameGroupHours` |
|---|---|
| `fat_burn` | 24 |
| `transform` | 36 |
| `build_muscle` | 48 |

Because secondaries are ignored, a Tuesday bench press does not mark the triceps as worked, and
Wednesday's tricep isolation is treated as fully recovered. The obvious repair — "count secondaries
too" — is the subject of this document.

**The reason it is not obvious after all:** `tricep` is a secondary on **25** of 179 entries and
`anterior_delt` on **24**. A fatigue rule keyed on secondaries does not nudge a pool, it can
penalise *every candidate in it* — at which point the penalty stops ranking anything and the pick
falls through to whatever the next comparator key happens to be. The blast radius **is** the whole
question.

## 2. The measurement

Four variants, over ~40,400 pools each. A pool is **degenerate** when every candidate is penalised,
because the signal can no longer discriminate.

| variant | what changes | where | all-penalised | majority-penalised |
|---|---|---|---|---|
| **V0** | today — primary exposure, primary candidate | — | **12,672 / 40,388 = 31.4%** | 64.5% |
| **V1** | exposure counts secondaries | `tandem.html` only | 17,692 / 40,378 = **43.8%** | 69.2% |
| **V2** | candidate penalty reads secondaries | `programs.js` only | 22,530 / 40,402 = **55.8%** | 72.9% |
| **V3** | both | both files | 29,066 / 40,436 = **71.9%** | 81.2% |

**The headline: the naive fix takes degenerate pools from 31.4% to 71.9%.** In roughly seven of ten
slots the recovery signal would carry no information at all. Note also that V0 is *already* 31.4% —
the current rule is saturated far more often than anyone has assumed.

**V1 and V2 are separable and are not symmetric.** V2 (+24.4 pts) costs nearly twice V1 (+12.4 pts).
If any version of this ships, that asymmetry is the lever worth having.

### Where the damage concentrates

By goal — this tracks window length exactly, which is a good sign the harness is measuring what it
claims to:

| goal | window | V3 degenerate |
|---|---|---|
| `fat_burn` | 24h | 7,610 / 14,702 = 51.8% |
| `transform` | 36h | 9,912 / 12,882 = 76.9% |
| `build_muscle` | 48h | 11,544 / 12,852 = **89.8%** |

`build_muscle` at 5-6 days/week is **97.3% / 96.7%** degenerate. That is the flagship configuration.

By slot category:

| category | V3 degenerate |
|---|---|
| `cardio` | 1,890 / 1,890 = **100%** |
| `core` | 10,836 / 11,340 = **95.6%** |
| `compound` | 7,354 / 10,290 = 71.5% |
| `isolation` | 8,986 / 16,916 = 53.1% |

By focus, the worst are `legs` and `hinge` (both 85.4%); the least-affected is `arms` (55.7%).
By tier it is flat — 67.5% / 75.6% / 72.6% — so this is **not** an equipment-availability artifact.

Top causal tags (47 distinct): `glute_max` 17,624 · `hamstring` 16,616 · `erector_spinae` 14,044 ·
`lat_dorsi` 12,542 · `glute_medius` 11,240 · `rectus_abdominis` 10,620 · `hip_flexor` 10,534.
The posterior chain dominates, which is expected — it is genuinely involved in most lower-body work.

## 3. Reading this honestly

**A degenerate pool is not automatically a bug.** If every hinge candidate really does load the
hamstrings 24h after a deadlift, "all penalised" is the physiologically correct answer, and the
right response is to change the *day*, not the exercise. What the number proves is narrower and
still decisive: **the penalty would stop being a selector.** Whatever the engine then picks, it
picks for an unrelated reason, and the recovery rule gets the credit. That is the
"computed-and-discarded" failure CLAUDE.md names — a value that looks live and steers nothing.

**100% on cardio is a modelling artifact, not a finding.** Seven cardio entries, and the Wave-1D
ruling already established that cardio muscle tags have no consumer and no source. Cardio should be
excluded from any fatigue rule outright, exactly as it is excluded from the secondary requirement.

## 4. Where the sources run out — flagged, not filled

The plan also asked to price a **weighted middle**, where a secondary contributes a fraction of a
primary's fatigue. That harness was written and did not complete (the sub-agent lost tool
permissions mid-run), so **no weighted number is reported here.** An unrun model is not evidence,
and quoting one would be the exact failure mode this project keeps correcting.

More importantly, the weight itself is the real gap:

> **No repo source, no Notion doc, and no Wave-1 research table assigns a fatigue coefficient to
> secondary muscle involvement.** `research-report (8).pdf` gives volume landmarks (MEV/MAV/MRV) in
> *sets per muscle per week*, and the standard convention there counts a set toward a muscle when it
> is a primary mover. It does not license a fractional secondary term.

So any weight — 0.25, 0.5, whatever — is an **engineering judgment, not a cited one**, and it should
be labelled that way in the code and in `DOCTRINE.md` if it ships. This is the same standing as D28's
`SHORT_SESSION_MAX_MINUTES`: shape defensible, exact number not yet law.

## 5. Options, for the ruling

1. **Do nothing.** V0's 31.4% is the status quo and nobody has complained. Cheapest, and leaves the
   bench-press-then-tricep-isolation case unfixed.
2. **V1 only** (exposure counts secondaries; `tandem.html`). +12.4 pts degenerate — the cheapest
   change that makes a recent bench press visible to the tricep slot at all.
3. **V3 naive.** Not recommended. 71.9%, and 89.8% on `build_muscle`.
4. **Weighted.** Needs a number no source provides. Ship only with the coefficient explicitly marked
   unsourced, and only after the pricing harness is actually run.
5. **Reframe.** If pools are legitimately saturated, the lever may be *day ordering / split
   construction*, not per-candidate penalties. Out of scope here; would need its own brief.

**Recommendation: rule on (1) vs (2) first.** They are cheap, separable, and measured. (4) should
not be priced further until Kerwin decides whether an uncited coefficient is acceptable at all —
otherwise the pricing work presupposes its own answer.

## 6. Provenance

Harness: full 630-persona matrix (3 goals × 5 day-counts × 2 sexes × 3 tiers × 7 injury profiles)
× 9 one-off focuses, with pools captured at the selection site by instrumenting the comparator in a
`vm` copy of `programs.js` — **the real bank and the real `RECOVERY_PARAMS`**, never a re-typed
fixture. Recent-history seeded at 44h / 30h / 12h to straddle all three windows.

No file in the repo was modified to produce these numbers.

# Independent citation verification of the council packet

**Date:** 2026-09-14 · **Status:** EVIDENCE. Binding only where it RETRACTS something; everything it
newly licenses still needs the tier-(a) confirmation named below.
**Why it exists:** the chairman of `docs/council-science-application-2026-09-14.md` ruled that *every
advisor citation in that packet is NON-LOAD-BEARING* and that each external claim must be verified
against the actual source before it can be implemented. This is that verification. It gates R2, R3
and R4.

## Evidence tiers, stated first because every verdict depends on them

- **(a) read in full** — only `research-report (8).pdf` (all 18 pages, local).
- **(b) search-result / abstract level** — **every external source below.** `WebFetch` and `Bash`
  were denied mid-task, so not one journal PDF or textbook page was opened.
- **(c) unreachable** — NSCA *Essentials* full text (paywalled), ACSM 2009 full text, ACSM 2026 full
  text, Pelland et al. numeric weekly values.

**No external claim here is tier (a).** Each needs one human confirmation against the real document
before it enters `DOCTRINE.md`. This document does not authorise a citation; it authorises a
*retraction*, and it shortlists what to confirm.

---

## The finding that precedes all others: NSCA *Essentials* is not in this project's corpus

The Sources list of `research-report (8).pdf` (pp. 17-18) was read in full. **NSCA *Essentials of
Strength Training and Conditioning* does not appear in it.** The ordering rule the project relies on
is citation `[8]`, which resolves to the **ACSM 2009 position stand** (PMID 19204579).

So the rule is real and the attribution was wrong. Every place this repo says "NSCA" for exercise
ordering must say ACSM 2009 instead.

## The upstream defect: roughly a third of the corpus is not peer-reviewed

`research-report (8).pdf` is a Valyu-generated synthesis. Of its 54 sources, these are blogs,
calculator sites or content farms — and they are the sources for the project's most load-bearing
numbers:

| ref | site | what it is the sole source for |
|---|---|---|
| `[1]` | tailoredcoachingmethod.com | **rest intervals** and deload strategies |
| `[2] [3]` | rpstrength.com | **MEV / MAV / MRV** |
| `[13]` | towerofrecords.com | the "5-30 reps" claim |
| `[14]` | myactivenutrition.com | "10+ sets per muscle per week" |
| `[22] [23]` | healthline, onnit | free weights vs machines |
| `[31]`-`[36]` | six calculator/app sites | **every female strength standard** (the 60-70% figure) |

**Consequence for doctrine: an invariant whose only provenance is this PDF is not cited.** It is
blog-sourced until traced to the primary. The ordering rule survived that test. The rest-interval
numbers did not — see Q6.

The corpus also contains **no Schoenfeld frequency paper, no Baz-Valle, no Krieger dose-response and
no Pelland.** The council could not have been reading this document for any of those claims.

---

## Verdicts

### Q1 — exercise ordering · **SUPPORTED, re-attributed**
Multi-joint before single-joint, large before small, higher- before lower-intensity; stated for
hypertrophy as well as strength. Source is **ACSM 2009 (PMID 19204579)**, corroborated independently
at tier (a) by the local PDF §1 and §2. **Not NSCA.**
⚠️ **ACSM 2009 is superseded** — see the staleness flag below.

### Q2 — "one primary multi-joint per movement pattern per session" · **NOT FOUND**
Not in ACSM 2009 (which governs *sequence*, not *count*). Not in the local corpus — which says the
opposite about its own coverage: *"The research provides no specific guidance on accessory exercise
selection by goal."* Not retrievable from NSCA.

**Probable origin of the error, named explicitly:** NSCA uses **"core exercise"** as a *taxonomy*
meaning multi-joint/large-mass (squat, bench), contrasted with "assistance exercise." Someone read a
classification as a quota.

On the narrower question — two compound variants of one pattern in a single session — **the
literature does not address it at all.** The nearest real work is exercise-*variation* research
(Fonseca; Baz-Valle; PMID 35438660), which studies variation *across a block*, reports **mixed and
conflicting** results, and neither evaluates nor prohibits the within-session arrangement.

> **This upholds the council's R2 exactly as written.** R2 ships as `ENGINEERING_DEFAULT` with the
> corpus gap flagged, and **must never carry an NSCA or ACSM attribution.**

### Q3 — per-session volume ceiling · **REVIEWER UPHELD**
Schoenfeld/Ogborn/Krieger 2017 (PMID 27433992) is explicitly a ***weekly*** dose-response analysis;
its ~10-set threshold is **per week**. Using it for a per-session cap is a category error, and is
almost certainly how "~10 sets per session" was manufactured — **a weekly number silently re-based
to per-session.**

A genuine per-session analysis exists — **Remmert et al. 2025**, multilevel Bayesian meta-regression,
67 studies / 2,058 participants, reporting a point of undetectable outcome superiority around **~11
fractional sets for hypertrophy** — but it is a **SportRxiv preprint, not peer-reviewed.** If a
per-session ceiling ships, it cites this and says "unrefereed preprint" on its face.

### Q4 — "≥2 sessions per muscle per week" · **NOT A FINDING**
Schoenfeld/Ogborn/Krieger 2016 favoured higher frequency, **but most included studies were not
volume-equated**, confounding frequency with total volume. **Schoenfeld, Grgic & Krieger (2019)**,
applying volume-equated inclusion criteria, found **frequency does not significantly influence
hypertrophy at matched weekly volume** — 1x and 3x weekly grew similarly. Pelland 2025 likewise
treats frequency as secondary to weekly sets.

> The council's coverage invariant survives, but **only as an engineering device for distributing
> weekly volume** — never as a scientific minimum. The zero-hamstring/bicep/tricep coverage hole at
> 2 days remains a defect on volume-distribution grounds, which is sufficient.

### Q5 — how a set is counted · **THE BLOCKING QUESTION IS HALF-ANSWERED**
**Pelland JC, Remmert JF, Robinson ZP, Hinson SR, Zourdos MC.** *The Resistance Training Dose
Response.* **Sports Medicine 2025/26, DOI 10.1007/s40279-025-02344-w, PMID 41343037.** 67 studies,
2,058 participants. Their method classifies every set as direct or indirect relative to the measured
muscle and quantifies indirect sets three ways — **1.0 ("total"), 0.5 ("fractional"), 0 ("direct")**
— and reports that **fractional (0.5) predicted hypertrophy better than either alternative.**

That is a peer-reviewed basis for a **0.5 synergist weighting**, which is the convention RP uses,
now with meta-analytic support rather than practitioner assertion.

**Two honest caveats.** (1) Tier (b) — the 1.0/0.5/0 scheme and the "fractional fit best" conclusion
were read from search results, not the paper; confirm against the PDF before encoding. (2) **No
citable definition of a "hard set" itself was found.** Proximity-to-failure is treated separately
(Refalo/Pelland 2024, PMID 38970765), not as part of a counting rule. So *how much a synergist set
counts* is answerable; ***what counts as a set at all* remains UNVERIFIED.**

### Q6 — rest intervals · **THE REPO'S "SHOULD" IS THE THING THAT IS WRONG**
ACSM 2009 specifies **2-3 minutes for "core" (multi-joint) exercises** and **1-2 minutes for
assistance exercises** — the compound/isolation split under different names. Schoenfeld et al. 2016
(*JSCR* 30(7):1805-1812) randomised 21 trained men to 1 vs 3 min and found **longer rest produced
greater strength AND hypertrophy**, contradicting the short-rest-for-hypertrophy convention.

- `PHASES.build_muscle` **restComp 135-150 s sits inside ACSM's 120-180 s band. It is DEFENSIBLE.**
- The repo's own **"60-90 s isolation / 90-120 s compound"** is sourced to **`[1]`, a blog**. The
  90-120 s compound figure is **below** ACSM's floor and **contrary** to Schoenfeld 2016.

> **This inverts gap-audit row G7.** G7 recorded the shipped 135-150 s as a violation of a cited
> 90-120 s band. The direction is backwards: **the shipped code is right and the documented rule is
> blog-sourced and wrong.** Retire the 60-90/90-120 line; cite ACSM 2009 for what ships.

### Q7 — MEV / MAV / MRV · **PRACTITIONER TERMINOLOGY, NOT A PEER-REVIEWED CONSTRUCT**
The local corpus already labels them correctly ("Renaissance Periodization Framework", `[2] [3]` =
rpstrength.com). A targeted search for peer-reviewed validation or construct-validity work returned
**nothing** — only RP, calculators and blogs. Absence of found critique is not proof of invalidity,
but there is no peer-reviewed grounding to cite, and that is what doctrine needs.

Best peer-reviewed weekly statement remains Schoenfeld 2017 (~10 weekly sets/muscle, wide
heterogeneity, unclear upper bound). Pelland 2025 supersedes it, but **its numeric weekly values
could not be retrieved — UNVERIFIED.**

**Volume scaling by training age** (the repo's 6-10 / 10-15+ / 15-25+ ladder) traces to `[14]` (blog)
and `[34]` (calculator). Pelland 2025 adjusted models for training status, so the axis is real, but
its conclusion is unretrieved. **Do not encode the ladder as science.** This is gap-audit row G3.

### Q8 — sex differences · **PROGRAMMING SHOULD BE THE SAME; THE REPO'S RULE IS CONTRADICTED**
**Roberts, Nuckols & Krieger (2020)**, *JSCR* — same protocols in males and females, hypertrophy from
12 outcomes across 10 studies, **no significant difference (ES = 0.07 ± 0.06; P = 0.31; I² = 0)**.
Relative strength and hypertrophy gains did not differ by sex.

The project's own corpus agrees at tier (a), PDF §5: *"Programming (rep ranges, frequencies, volumes)
should be identical between sexes for equivalent goals; differences emerge only in load percentages
due to absolute strength differences."*

> **This inverts gap-audit row G6.** G6 listed "women 10-15 reps vs men 6-12" as a SHOULD the engine
> fails to apply. **It has no support and is contradicted by the one meta-analysis on point and by
> the repo's own PDF. Implementing G6 would have shipped a falsehood.** The engine's current
> behaviour — identical reps and sets across sexes, differing only in starting load — is CORRECT, and
> the audit row was wrong to call it a defect.

Also firmly established, worth encoding as a negative rule: **no menstrual-cycle-phase
periodization** — no influence of phase on acute performance or adaptation (PMC10076834; PMC4236309,
via PDF §5). The female 60-70% strength standards rest on calculator sites `[31]`-`[36]`: engineering
seeds, not science.

### Q9 — NSCA program-design sequence · **REVIEWER UPHELD, ADVISOR WRONG**
needs analysis -> **exercise selection (2)** -> frequency (3) -> exercise order (4) -> load/reps (5)
-> **volume (6)** -> rest (7).

**Selection precedes frequency and volume**, which cuts against First Principles' "invert the
pipeline" framing. Note also that selection (2) and *order* (4) are distinct steps — a distinction
the disputed Q2 rule blurs.

**Locator caveat:** tier (b) and **secondary** — CSCS Ch. 17 / NSCA-CPT Ch. 15 exam-prep material
attributed to *Essentials* 5th ed. The textbook was never accessed. Consistent across several
independent secondary sources, which is meaningful but is not a citation.

---

## Two flags for Kerwin

1. **ACSM 2009 is superseded.** A new stand landed April 2026 — *Resistance Training Prescription for
   Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews*,
   **PMID 41843416**, *MSSE*, chaired by Stuart Phillips, synthesising **137 systematic reviews** —
   the first update in 17 years. Reported headline changes: hypertrophy similar across low-to-high
   loads when effort is sufficient, and **training to failure is NOT superior to stopping 2-3 reps
   short.** Full text unretrieved. Every invariant resting on ACSM 2009 needs re-derivation against
   it, and the repo currently cites nothing from it.

2. **The corpus's citation quality is the upstream defect**, not the engine. See the table at the
   top. The pattern this whole epic was convened to fix — a rule that sounds standard being trusted
   without checking the source — is present *in the project's own research document*.

## What this changes in `docs/science-application-gap-audit.md`

| row | was | now |
|---|---|---|
| **G6** sex differentiation | SHOULD: women 10-15 reps vs men 6-12 | **RETRACTED.** Contradicted. The engine is already correct. |
| **G7** rest | SHOULD: 60-90 / 90-120 s; shipped 135-150 s is a violation | **INVERTED.** The shipped value is defensible under ACSM 2009; the documented band is blog-sourced. |
| **G3** volume by training age | SHOULD: 6-8/9-12/15 … ladder | **UNVERIFIED** — blog + calculator sourced. Still a real gap that `experience` changes nothing, but the ladder's numbers are not law. |
| **G2** MEV/MAV/MRV | SHOULD, per v0.5 + docx | Reclassified **practitioner guidance (RP), non-peer-reviewed.** D6b may not be promoted on this basis alone. |
| §3 conflict 5 (supersets) | unresolved | unchanged — R5 froze it on provenance, and nothing here disturbs that. |
| §4 "hard set undefined" | blocks R3/R4 | **half-resolved** — synergist = 0.5 (Pelland 2025, tier b). "Hard set" itself still undefined. |

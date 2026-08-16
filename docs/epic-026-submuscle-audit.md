# EPIC-026 Phase 1 — Sub-Muscle-Group Taxonomy Audit

**Status:** audit only. Nothing in this phase writes data. No Supabase rows changed, no
`EXERCISE_BANK` edits, no generator changes. The deliverable is this report plus a vocabulary
proposal for Kerwin to approve *before* any backfill starts — retagging 171 rows twice because
the vocabulary shifted is the failure this phase exists to prevent.

**Notion:** [EPIC-026 Phase 1 — Sub-Muscle-Group Audit + Vocabulary Proposal](https://app.notion.com/p/3beca37f935b81a2bd58fbbab79f49fb) (child of the EPIC-026 extension epic).

**Date:** 2026-08-16 · **Reproduce every number below:** `node scripts/audit-muscle-tags.mjs`
(add `--table` for the full 171-row table, `--json` for machine-readable output).

Nothing here is hand-typed. The bank is extracted by *running* `programs.js` in a `vm` context —
the same technique `scripts/sync-exercise-bank.mjs` uses — and the slot definitions are scanned
out of the source with line numbers. Re-run the script after any bank edit and the report
regenerates.

---

## 1. Live state, verified directly

| fact | value | how verified |
|---|---|---|
| `public.exercises` rows | **171** | Supabase `list_tables`, project `zsvktcvqmppsshtpeljt` |
| `EXERCISE_BANK` entries | **171** | `vm` extraction from `programs.js` |
| categories | compound 70 · isolation 70 · core 24 · cardio 7 | audit script |
| distinct `muscle_primary` terms | **45** | both sides independently |
| distinct `muscle_secondary` terms | **32** | both sides independently |
| union | **50** | both sides independently |
| rows with null/empty `muscle_primary` | **0** | column is `NOT NULL`; empty-array count 0 |
| rows with empty `muscle_secondary` | 49 | matches bank exactly |

### Bank ↔ Supabase drift: **zero**

There is no drift. Both sides were serialized to the same canonical form
(`slug|sorted-distinct-primary|sorted-distinct-secondary`, joined in slug order) and hashed:

```
bank canon_md5: 27f7a8b03427e80df71c962743d1c77a
DB   canon_md5: 27f7a8b03427e80df71c962743d1c77a   (n = 171)
```

Slugs in bank but not DB: 0. In DB but not bank: 0. Shared slugs disagreeing on either muscle
column: **0 of 171**. The `name` column matches too (`278b610a…` both sides).

**Correction to the task brief:** it states "there is no sync script — the mirror is asserted, not
enforced." `scripts/sync-exercise-bank.mjs` *does* exist and generates
`migrations/epic031_exercises_seed.sql` as idempotent upserts on `slug`. What is missing is a
**drift check wired into `npm run verify`** — the generator exists, the guard does not. Today's
zero-drift result is a snapshot, not a guarantee.

### EPIC-026 deep-tag columns — still 0/171

| column | type | non-null of 171 |
|---|---|---|
| `movement_pattern` | text | **0** |
| `unilateral` | boolean | **0** |
| `complexity` | text | **0** |
| `position_bias` | text | **0** |

This is by design, not rot: `scripts/sync-exercise-bank.mjs` deliberately does not emit them
because no source names them yet, so they stay NULL per the doctrine rule to flag a gap rather
than fabricate one. Schema is ahead of data. Separate from this phase.

---

## 2. Gap audit — how big is the work, as a number

Bucketed on **primary** tags only (secondary tags describe involvement, not the slot an exercise
is selected for). Full per-exercise table: `node scripts/audit-muscle-tags.mjs --table`.

| bucket | count | meaning |
|---|---|---|
| **sub-tagged** | **111** | every primary tag is already a sub-group term |
| **mixed** | **34** | some primary tags sub-group, some only parent-level |
| **atomic-only** | **24** | the vocabulary draws no sub-division for this muscle at all |
| **parent-only** | **2** | tags a subdivided group only at the parent level |
| | **171** | |

**The backfill target is 36 exercises (34 mixed + 2 parent-only), not 171.** That is the headline
number. The bank is already substantially sub-tagged; what it is not is *consistent*.

The 24 "atomic-only" exercises are **not** automatically a gap. They carry tags like `rhomboid`,
`adductor`, `lat_dorsi` for which the vocabulary draws no sub-division — which may be entirely
correct. Whether any of them *should* be subdivided is a research question, answered in §5c and §5d.
Lumping them in with real gaps is exactly how a gap count turns back into a vibe.

---

## 3. The prefix rule, and the three defects it already causes

`groupsMatch()` — `programs.js:1465`, mirrored verbatim at `:1376` for one-offs:

```js
const groupsMatch = (ex, groups) => {
  const all = [...(ex.muscleGroups.primary||[]),...(ex.muscleGroups.secondary||[])];
  return groups.some(g => all.some(a => a === g || a.startsWith(g+'_') || a.startsWith(g)));
};
```

The third clause makes the second redundant and is **unanchored** — it matches any tag that merely
*begins with* the requested string, regardless of word boundary. That is the root of all three
defects below. All three are **reported, not fixed**: `groupsMatch` is Phase 3, which requires an
`exercise-science-research` pass and a doctrine invariant because it is program-selection logic.

Filed as **BUG-87** (Defect 1), **BUG-83** (Defect 2), and **BUG-85** (the actionable part of
Defect 3). The root cause under all of them is **BUG-82**. Six bugs were filed in total — the
audit found more than the three anticipated; see §8 for the full index.

### Defect 1 — `quad` slots can draw a core muscle (BUG-87)

`'quad'` prefix-matches `quadratus_lumborum`. Measured:

```
 25  quad  <- quad, quad_rectus_femoris, quad_vastus_lateralis, quad_vastus_medialis, quadratus_lumborum
```

Live call sites requesting bare `['quad']`: `FOCUS_SLOTS.legs[0]`, `FOCUS_SLOTS.full_body[2]`
(`programs.js:1353`), and the leg-day primary slot at `programs.js:1654`, plus `['glute_max','quad']`
at `:1637`. A quad compound slot can legally select a QL exercise. This is the only cross-parent
collision in the vocabulary today — but it is structural, not a one-off typo: any future term
sharing a prefix with another muscle reintroduces it.

### Defect 2 — `lower_body` is a dead term that fails OPEN (BUG-83, live today)

`ONEOFF_CARDIO_GROUPS` (`programs.js:1365`) is `['full_body','lower_body','glute_max']`.
`lower_body` matches **zero** of the 50 vocabulary terms — no exercise carries it. It contributes
nothing to the candidate pool and never has. It fails silently: an unmatched group name yields an
empty pool rather than an error, which is the exact silent-failure class this project keeps
getting bitten by. Nothing today asserts that a requested group name resolves to a non-empty pool.

### Defect 3 — 11 tags no slot can reach (BUG-85 covers the sharpest case)

Across **every** call site — `FOCUS_SLOTS`, `TEMPLATES`, `SHOULDER_TEMPLATE`, `CORE_GROUPS`,
`ONEOFF_CORE_GROUPS`, `ONEOFF_CARDIO_GROUPS` — these tags are unreachable:

`adductor` · `core` · `external_rotator` · `hip_flexor` · `long_head_tricep` · `lower_trap` ·
`middle_trap` · `psoas` · `serratus_anterior` · `supraspinatus` · `upper_pec`

Some are secondary-only and harmlessly unreachable (`psoas`, `serratus_anterior`, `supraspinatus`,
`core`). Others are **primary** tags on real exercises that therefore can never be selected through
the muscle path: `adductor` (3 exercises), `hip_flexor` (3), `lower_trap` (4), `middle_trap` (1),
`external_rotator` (2), `upper_pec` (1). `long_head_tricep` is a second spelling of
`tricep_long_head` appearing as a secondary tag.

> Note on an earlier count: sweeping only `FOCUS_SLOTS` + `ONEOFF_*` suggests 13 orphans. Including
> `TEMPLATES` and `SHOULDER_TEMPLATE` recovers `soleus` and `glute_minimus`. **11 is the correct
> number**, and the reason the call-site sweep must cover every definition, not just the obvious two.

### Full coverage table

Every requested group name and what it actually catches:
`node scripts/audit-muscle-tags.mjs` → *coverage under the live prefix rule*. 45 slot definitions
request 29 distinct group names.

---

## 4. Vocabulary — the state today

The bank does not have "some entries with sub-tags." It has **four naming conventions running at
once**, and this is what the vocabulary proposal has to reconcile.

| # | problem | evidence | prefix-compatible? |
|---|---|---|---|
| 1 | Parent and child both used as *primary* | `quad`(4) vs `quad_rectus_femoris`(15); `hamstring`(11) vs `hamstring_bicep_femoris`(5); `tricep`(2) vs `tricep_medial`(9); `bicep`(1) vs `bicep_brachii`(6) | yes, but the parent tag hides which head was intended |
| 2 | **Suffix**-named families | `anterior_delt`/`lateral_delt`/`posterior_delt`; `upper_trap`/`middle_trap`/`lower_trap`; `upper_pec`; `long_head_tricep` — 9 terms total | **NO.** A `['delt']` or `['trap']` slot matches nothing. These families are unreachable from a parent |
| 3 | Siblings not prefixed by a shared parent | `gastrocnemius`, `soleus`, `calf` are three peers, not a family | **NO** — and renaming to `calf_*` would break `['gastrocnemius','soleus','calf']` at `:1640` |
| 4 | Four-level nesting for a two-headed muscle | `bicep` → `bicep_brachii` → `bicep_brachii_long_head` / `_short_head` | yes, but needlessly deep |
| 5 | Anatomical misspellings | `hamstring_bicep_femoris` (*biceps femoris*), `hamstring_semimembranous` (*semimembranosus*) | n/a — see §5 |
| 6 | Duplicate concepts | `upper_pec`(1) vs `pec_major_clavicular`(6); `long_head_tricep`(2) vs `tricep_long_head`(5) | mixed |
| 7 | Notion plan ≠ shipped code | the epic proposes `glute_maximus`, `calf_gastrocnemius`, `calf_soleus`, `tricep_medial_head`; the bank has `glute_max`, `gastrocnemius`, `soleus`, `tricep_medial` | adopting the Notion names is a **rename**, not an addition |

Families the audit detects mechanically (muscle root → terms), for the subdivided ones:

```
tricep      long_head_tricep, tricep, tricep_lateral, tricep_long_head, tricep_medial
bicep       bicep, bicep_brachii, bicep_brachii_long_head, bicep_brachii_short_head
quad        quad, quad_rectus_femoris, quad_vastus_lateralis, quad_vastus_medialis
delt        anterior_delt, lateral_delt, posterior_delt
glute       glute_max, glute_medius, glute_minimus
hamstring   hamstring, hamstring_bicep_femoris, hamstring_semimembranous
trap        lower_trap, middle_trap, upper_trap
pec         pec_major_clavicular, pec_major_sternal, upper_pec
oblique     oblique_external, oblique_internal
rectus      rectus_abdominis, rectus_abdominis_lower
```

---

## 5. Controlled vocabulary proposal — IN PROGRESS

**Not yet written.** Sections 1–4 are measurement and are final; this section is the sourced
proposal and is still being researched (per-muscle citations from Kenhub / ACE / NSCA, plus a
targetability verdict per term). It is deliberately absent rather than guessed — CLAUDE.md forbids
answering an exercise-science question from memory, and a placeholder full of plausible-sounding
terms is precisely the failure mode this project is eliminating.

Committed now for durability (EPIC-031 was lost as an unpushed commit). §5, §6 and the
recommended Phase 2 scope land in the follow-up commit.

The proposal will state, per term: term · parent group · anatomical source URL ·
prefix-compatibility verdict · call sites needing change · **whether any exercise in the bank can
preferentially bias it**. Terms with no targetable exercise will be flagged and excluded rather
than quietly included — a vocabulary term the generator cannot act on is dead weight in the schema.

### Correction: the `calf_*` rename does NOT break the calf slots

An earlier draft of this report — and the Phase 1 brief — asserted that renaming to
`calf_gastrocnemius` / `calf_soleus` would break the live `['gastrocnemius','soleus','calf']` slot.
**That is wrong, and it was wrong in the brief too.** Verified by running:

- `'calf_gastrocnemius'.startsWith('calf')` → `true`.
- **Every** slot that names `gastrocnemius` also names `calf` — `['gastrocnemius','calf']` at
  `programs.js:1356, 1361, 1658` and `['gastrocnemius','soleus','calf']` at `:1640`. All four
  survive on the `calf` token alone.
- `'glute_maximus'.startsWith('glute_max')` → `true`, so `glute_max` → `glute_maximus` is
  prefix-transparent on the request side as well.

The renames are safe. They are still not *recommended* — see §6 — but the reason is cost/benefit,
not breakage. Recording the correction because reasoning from what sounded right about the prefix
rule, instead of running it, is the precise failure mode CLAUDE.md exists to stop.

---

## 5b. Four further defects, all verified by running the engine

These are additional to the three in §3 and were surfaced by the vocabulary research.

### Defect 4 — the bank's only soleus exercise is unreachable from 3 of 4 calf slots (BUG-84)

`Seated Calf Raise` is tagged `primary: ['soleus']`. Nothing else carries that tag, and `soleus`
has no prefix relation to `gastrocnemius` or `calf`. Measured pools (isolation):

```
['gastrocnemius','soleus','calf']  -> 6  Standing · Seated · Leg Press · Single-Leg · DB Standing · Smith
['gastrocnemius','calf']           -> 5  (Seated Calf Raise EXCLUDED)
```

Only `programs.js:1640` names `soleus`. The one-off Legs day, the one-off Hinge day and the
generated leg day (`:1356`, `:1361`, `:1658`) can never prescribe it. The exercise's own `why` text
argues the soleus needs its own high-rep work — the engine cannot deliver it.

### Defect 5 — Seated Calf Raise offers the user zero swap options (BUG-84)

`getExerciseSubstitutes()` (`programs.js:1288`, consumed at `tandem.html:3888`) does **not** use the
prefix rule. It uses exact tag equality:

```js
(e.muscleGroups?.primary || []).some(g => primaryGroups.includes(g))
```

Because `soleus` is a peer tag shared with nothing, the swap list is empty. Verified by running:

```
Seated Calf Raise   -> (NONE)
Standing Calf Raise -> Leg Press Calf Raise | Single-Leg Calf Raise | DB Standing Calf Raise | Smith Machine Calf Raise
```

This matters for the vocabulary design: **a `calf_*` rename would NOT fix it** (`calf_soleus` and
`calf_gastrocnemius` are still unequal strings). Only adding a shared parent co-tag does.

### Defect 6 — `glute_minimus` in the slot at `:1638` is inert

`['glute_max','glute_medius','glute_minimus']` and `['glute_max','glute_medius']` return
**identical 7-exercise pools** — both `glute_minimus`-tagged exercises are also `glute_medius`-tagged.
The third token does nothing.

### Defect 7 — `adductor` is tagged but has no consumer

No slot anywhere requests `adductor`. `['adductor']` + `isolation` returns an **empty pool**: the
three `adductor`-tagged lifts are all `compound` (Romanian Deadlift, Sumo RDL, DB Sumo Squat) and
the only true adduction movement, Copenhagen Plank, is `category: 'core'`. The tag is inert.

### And the gap under all of them (BUG-82 — the root cause)

`grep` over `scripts/doctrine.mjs` and `scripts/validate-programs.mjs` finds **no assertion
referencing `muscleGroups`, `muscle_primary`, or slot pools at all.** A vocabulary change can empty
a candidate pool and ship with `npm run verify` fully green. Defects 1, 2, 4 and 7 all share that
single root cause.

---

## 5c. Lower body — sourced vocabulary (quads, hamstrings, glutes, adductors, calves)

**Source-integrity flag, stated up front:** WebFetch egress was blocked for kenhub.com,
ncbi.nlm.nih.gov, physio-pedia.com, teachmeanatomy.info and acefitness.org in the session that
produced this. Citations below are URLs located and read *via search-result synthesis, not verbatim
page reads*. Kenhub — the reference the Notion epic names — was unreachable. **Every claim here
should be confirmed against a directly-fetched primary source before the vocabulary is locked.**

**Second flag:** Notion **Exercise Science Schema v0.5** (`37bca37f935b81cb9478e4906ada58c9`)
specifies `muscle_group_primary` as a *coarse* enum only — `chest | back | shoulders | quads |
hamstrings | glutes | biceps | triceps | core | calves`. It never mentions heads or sub-groups, and
never mentions adductors. **The shipped bank's head-level vocabulary is already a divergence from
v0.5 that no source authorizes.** `DOCTRINE.md` contains no muscle-group invariant at all. Locking
this vocabulary means amending v0.5 first, per CLAUDE.md's "change Notion first" rule.

| term | parent | source | prefix-compat | targetable? |
|---|---|---|---|---|
| `quad_rectus_femoris` | `quad` | [PMC8866009](https://pmc.ncbi.nlm.nih.gov/articles/PMC8866009/); [J Sports Sci 2024](https://www.tandfonline.com/doi/full/10.1080/02640414.2024.2444713) | yes | **YES** — strongest case in the family. Reduced hip flexion (40° vs 90°) in leg extension gave "extreme evidence" of greater RF hypertrophy. Bank already has Reverse Nordic, Sissy Squat, Leg Extension |
| `quad_vastus_lateralis` | `quad` | [PMC8866009](https://pmc.ncbi.nlm.nih.gov/articles/PMC8866009/); [JSCR](https://doi.org/10.1519/JSC.0000000000005338) | yes | **Partially** — as "the vasti," not VL specifically. Squat drives distal VL where leg extension drives RF. No source found biasing VL over VM |
| `quad_vastus_medialis` | `quad` | [Physiother Theory Pract](https://www.tandfonline.com/doi/abs/10.1080/09593980802686953) — 20 EMG studies, 387 participants | yes | **NO — not separable from VL.** 17 of 20 studies found no preferential VMO activation. Keep as descriptive detail; the generator must not treat VL/VM as separable targets |
| `quad_vastus` *(new, additive)* | `quad` | derived | yes — **already a request token at `:1656` with no matching tag** | **YES at group level.** Makes the de-facto token real and gives the exact-match substitute path something to bite |
| `quad_vastus_intermedius` *(Notion-proposed)* | `quad` | [PMC8866009](https://pmc.ncbi.nlm.nih.gov/articles/PMC8866009/) | yes | **NO — EXCLUDE, dead weight.** Zero bank exercises can bias it. ⚠️ But exclude on *"no targeting exercise exists"*, **not** on the folk claim that VI can't be recruited preferentially — that claim is **UNVERIFIED**; fine-wire studies do record VI independently |
| `hamstring_biceps_femoris` *(spelling fix)* | `hamstring` | [StatPearls NBK546688](https://www.ncbi.nlm.nih.gov/books/NBK546688/); [JOSPT fMRI](https://www.jospt.org/doi/10.2519/jospt.2018.7748) | yes, 0 slots break | **YES, contested.** Hip-extension work raises BFlh:ST ratio vs Nordic. **Counter-evidence:** [2025 meta-analysis](https://www.tandfonline.com/doi/full/10.1080/02640414.2025.2486879) found no overall ST-vs-BF difference. Adopt the spelling; treat head-bias as soft preference, never a doctrine invariant |
| `hamstring_semitendinosus` **(MISSING from bank)** | `hamstring` | [StatPearls NBK539862](https://www.ncbi.nlm.nih.gov/books/NBK539862/); [JOSPT](https://www.jospt.org/doi/10.2519/jospt.2018.7748) | yes | **YES — and its absence is a live mis-tagging.** Nordic preferentially recruits ST. The bank tags Nordic Curl `['hamstring_bicep_femoris','hamstring_semimembranous']` — naming the two heads the evidence says Nordic *de-emphasises* and omitting the one it emphasises. **Highest-value single correction in this report** |
| `hamstring_semimembranosus` *(spelling fix)* | `hamstring` | [StatPearls NBK542215](https://www.ncbi.nlm.nih.gov/books/NBK542215/) | yes, 0 slots break | **NO as an independent target — UNVERIFIED.** No source separates SM from ST by exercise selection. Keep the corrected spelling only if always co-tagged with ST; a standalone SM target is dead weight. **Kerwin decision, not invented here** |
| `glute_max` → `glute_maximus` | `glute` | [JOSPT 2016](https://www.jospt.org/doi/10.2519/jospt.2016.6493) | **yes — 0 of 14 slot literals break** (verified by simulation) | **YES.** Single-limb squat/deadlift give greatest GMax activation |
| `glute_medius` | `glute` | [JOSPT 2017](https://www.jospt.org/doi/10.2519/jospt.2017.7229); [JOSPT 2013 fine-wire](https://www.jospt.org/doi/10.2519/jospt.2013.4116) | yes | **YES.** Side-lying abduction is distinct from the hip-extension pattern driving GMax. Bank has Abductor Machine, Banded Hip Abduction |
| `glute_minimus` | `glute` | [JOSPT 2017](https://www.jospt.org/doi/10.2519/jospt.2017.7229) | yes | **NO — EXCLUDE.** JOSPT 2017: *"no reason to suspect that activation of the gluteus minimus for any of the exercises evaluated would differ from that of the gluteus medius."* Proven redundant in code too (Defect 6) |
| `adductor` | root | [StatPearls NBK534842](https://www.ncbi.nlm.nih.gov/books/NBK534842/) | yes | **Functionally incoherent as one term.** Posterior adductor magnus is a *hip extensor*; the tag conflates it with true adductors. ⚠️ The bank's `why` for DB Sumo Squat / Sumo RDL claims an adductor shift that EMG ranking [contradicts](https://pubmed.ncbi.nlm.nih.gov/23945760/) — sumo/wide-stance rank **lowest** among adduction exercises. Coaching-copy bug, filed separately |
| `calf` *(promote to real tag, additive)* | root | [Physiopedia Triceps Surae](https://www.physio-pedia.com/Triceps_Surae) | yes — already a request token at 4 sites | **Yes at group level.** Currently a near-orphan: 1 primary use, on a *cardio* entry |
| `calf_gastrocnemius` *(rename)* | `calf` | [PMC10753835](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10753835/) | **yes — 0 slots break** | **YES — cleanest targetability case in lower body.** Standing vs seated over 12 wk: **+12.4% vs +1.7%** lateral gastroc, **+9.2% vs +0.6%** medial. Bank has 5 straight-knee variants |
| `calf_soleus` *(rename)* | `calf` | [Physiopedia](https://www.physio-pedia.com/Triceps_Surae); [PMID 37015022](https://pubmed.ncbi.nlm.nih.gov/37015022/) | **yes — and it repairs Defect 4** | **YES.** Knee flexion puts gastrocnemius in active insufficiency while soleus activity holds. Thin but real: one exercise |
| `calf_gastrocnemius_medial` / `_lateral` | `calf_gastrocnemius` | [Physiopedia](https://www.physio-pedia.com/Triceps_Surae) | yes | **NO — EXCLUDE. UNVERIFIED.** No evidence that foot/toe rotation biases one head; both heads responded in the same direction to the same stimulus. Do not add on gym folklore |

---

## 5d. Upper body + core — sourced vocabulary

Same source-integrity caveat as §5c: every anatomy/journal domain (Kenhub, NCBI/StatPearls, PMC,
TeachMeAnatomy, Physiopedia, ACE, NSCA) returned `403 CONNECT` at the egress gateway. Citations are
**search-retrieved, not fetch-and-quote**. If any ruling here becomes an ACTIVE D-invariant, the
allowlist needs `ncbi.nlm.nih.gov`, `pmc.ncbi.nlm.nih.gov`, `jospt.org`, `tandfonline.com` first.

### Finding: the sub-head vocabulary is write-only — nothing requests it

Across all 73 slot definitions and 29 distinct group names, **not one names a sub-head**.
`pec_major_clavicular`, `tricep_long_head`, `bicep_brachii_*`, `rectus_abdominis_lower`,
`oblique_internal`, `middle_trap`, `lower_trap`, `upper_pec`, `external_rotator`,
`serratus_anterior`, `supraspinatus` are never asked for — they reach the generator only by being
swept up in a parent prefix match, or not at all.

**So today the granularity debate has zero effect on exercise selection.** It becomes load-bearing
the moment **D6b (PENDING, per-muscle weekly volume)** ships, because that is the first consumer
that will read these tags. **Rule on the vocabulary before D6b, not after.**

### Chest / back

| term | source | prefix-compat | targetable? |
|---|---|---|---|
| `pec_major_sternal` | [StatPearls NBK525991](https://www.ncbi.nlm.nih.gov/books/NBK525991/) | yes | **YES** — 16 primary. Anatomy says *sternocostal*, bank says *sternal*; cosmetic, not worth a rename |
| `pec_major_clavicular` | [Rodríguez-Ridao 2020, IJERPH](https://pmc.ncbi.nlm.nih.gov/articles/PMC7579505/) | yes | **YES — genuinely biased by incline angle.** 0/15/30/45/60° tested, **30° highest**; a later trial says optimum 43°. **Direction robust, optimum contested — do not encode a specific degree** |
| `upper_pec` | not an anatomical term | **NO** — orphan | **REJECT.** Duplicates clavicular head *and* causes a live defect (Defect 8 below) |
| `lat_dorsi` | [StatPearls NBK537216](https://www.ncbi.nlm.nih.gov/books/NBK537216/) | yes | **YES** — 19 primary. ⚠️ **Never shorten to `lat`** — see Defect 9 |
| `rhomboid` | [EMG comparison](https://www.researchgate.net/publication/265294445_Comparison_of_Electromyographic_Activity_When_Performing_an_Inverted_Row_With_and_Without_a_Suspension_Device) | own parent | **PARTIAL.** Cannot be isolated from middle trapezius by surface EMG; literature reports "middle trapezius/rhomboid" as one unit. **D6b must not count `rhomboid` and `middle_trap` as two independent muscles** |
| `erector_spinae` | [McGill group](https://pubmed.ncbi.nlm.nih.gov/11415651/) | own parent | **WEAKLY** — only 2 primary (Good Morning, Bird Dog) vs 15 secondary. A bank gap, not a vocabulary gap |

### Traps and delts — the suffix-naming decision

All three trap regions ([StatPearls NBK518994](https://www.ncbi.nlm.nih.gov/books/NBK518994/)) and
all three deltoid parts ([StatPearls NBK537056](https://www.ncbi.nlm.nih.gov/books/NBK537056/)) are
anatomically real and individually targetable:

- `upper_trap` — [Ekstrom 2003, JOSPT 33(5)](https://www.jospt.org/doi/10.2519/jospt.2003.33.5.247): unilateral shrug greatest upper-trap EMG. 4 primary.
- `lower_trap` — **strongest trap evidence**: prone overhead arm raise in line with lower-trap fibers, **85–97% MVIC**. 4 primary. Currently an orphan.
- `middle_trap` — targetable in principle, but only **1** primary exercise (Prone T-Raise) and no slot requests it.
- `anterior_delt` (13 primary) / `lateral_delt` (16) / `posterior_delt` (8) — all targetable; [Campos et al. systematic review](https://www.sciencedirect.com/science/article/abs/pii/S1360859222001607), [Botton 2013](https://pubmed.ncbi.nlm.nih.gov/24947920/).

**Verdict: DO NOT rename to `trap_*` / `delt_*`.** Cost is **~97 tag occurrences + 19 slot literals
+ a seeded-data migration across three surfaces** (`programs.js`,
`migrations/epic031_exercises_seed.sql`, live Supabase rows). Benefit is a parent `['delt']` or
`['trap']` slot **that no template wants and that the science argues against** — the parts have
distinct actions and distinct best exercises, which is exactly why the shoulders template already
enumerates them individually. The `['delt']` → 0 failure is real, but the fix is the **gate** (§6),
not the rename.

### Arms

| term | source | prefix-compat | targetable? |
|---|---|---|---|
| `bicep_brachii` | [TeachMeAnatomy upper arm](https://teachmeanatomy.info/upper-limb/muscles/upper-arm/) | yes | **YES** — 6 primary. Should be the canonical term |
| `bicep` (1 use, Chin-Up) | informal | yes | **Collapse into `bicep_brachii`** — zero behavior change, both match `['bicep']` |
| `bicep_brachii_long_head` / `_short_head` | [Kobayashi 2024, EJSC](https://onlinelibrary.wiley.com/doi/am-pdf/10.1002/ejsc.12279) | yes | **NOT RELIABLY — the evidence does not support the claim as written.** EMG does not show reliable preferential activation of one head. What *is* supported is **regional proximal-vs-distal hypertrophy driven by shoulder position**. The bank's mapping (Incline DB Curl → "long head", Preacher → "short head") is a **mislabeled proxy for proximal/distal**. Harmless to selection; **do not delete, but D6b must not treat them as separate muscles** |
| `brachialis` | [TeachMeAnatomy](https://teachmeanatomy.info/upper-limb/muscles/upper-arm/) | no, but has its own slot | **YES** — 4 primary. **A sibling of `bicep_brachii`, never a child** |
| `brachioradialis` | [StatPearls NBK526110](https://www.ncbi.nlm.nih.gov/books/NBK526110/) | no, own slot | **YES** — 4 primary. **Definitively NOT parented under biceps**: forearm muscle, posterior/extensor compartment, radial nerve. Parenting it under biceps would be an anatomical error |
| `tricep_long_head` | [Maeo 2023, Eur J Sport Sci 23(7)](https://www.tandfonline.com/doi/full/10.1080/17461391.2022.2100279) | yes | **YES — the single strongest sub-head case in the whole bank.** 21 adults, 12 wk, within-subject overhead vs neutral cable extension: long head **+28.5% vs +19.6%** volume (~1.5×), no difference in lateral/medial. Bank's mapping is correct. **ADOPT** |
| `tricep_medial` / `tricep_lateral` | [forearm-position pushdown study](https://www.researchgate.net/publication/378472477_Forearm_Position_Influences_Triceps_Brachii_Activation_During_Triceps_Push-Down_Exercise) | yes | **NO — EXCLUDE both.** Medial head lies deep to the others and cannot be recorded by surface EMG. And **proven identical in this bank** — see Defect 10 |
| `long_head_tricep` (2 secondary) | fifth spelling of `tricep_long_head` | **NO** — invisible to `['tricep']` | Real defect; safe corrective retag, but ⚠️ **UNVERIFIED** whether pullover / straight-arm pulldown should count as tricep volume at all — verify first or the fix silently inflates it |

### Core

| term | source | targetable? |
|---|---|---|
| `rectus_abdominis` | segmentally innervated T7–T12 | **YES** — 12 primary |
| `rectus_abdominis_lower` | [Diagnostic ultrasound, PMC10824285 (2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10824285/) | **YES — as a REGION, with real evidence.** Significant segment × exercise interaction: crunch produced **36.4% greater** thickness change in upper segments, reverse pattern in lower. The bank's three tagged exercises are exactly the leg-raise class the study used. ⚠️ **Contested:** the same source calls the differential "task-specific," and the evidence is for **activation/thickness change, not hypertrophy over a block**. **ADOPT, but document as a region, never a head; D6b must not treat it as a separate muscle** |
| `transverse_abdominis` | [Physiopedia TrA](https://www.physio-pedia.com/Transversus_Abdominis) | **NO by exercise selection — exclude from volume targets, but DO NOT DELETE.** Selective TrA activation is documented only for the abdominal drawing-in *cue*, not exercise choice, and even that is debated. **The tag is load-bearing in `CORE_GROUPS` — deleting it shrinks the core pool by 14 exercises** |
| `oblique_external` | real muscle | **YES as "obliques"** — 9 primary |
| `oblique_internal` | real muscle | **NO separately — EXCLUDE.** IO's 6 primaries are a **verified strict subset** of EO's 9. EO/IO differ in rotation direction, but every bank exercise is bilateral, so nothing separates them. The operative term is `oblique`, which `CORE_GROUPS` already requests |
| `quadratus_lumborum` | [McGill fine-wire](https://pubmed.ncbi.nlm.nih.gov/11415616/) | **YES — best deep-muscle evidence in the report.** Intramuscular electrodes: QL most active muscle (**~54%**) in isometric side-support. Bank has Side Plank. **ADOPT.** ⚠️ but see Defect 1 |
| `core` (9 secondary) | non-anatomical catch-all | **N/A — inert.** Verified: `CORE_GROUPS` does not include `'core'`, so all 9 tags are unreachable. Harmless noise |
| `external_rotator` | [StatPearls NBK441844](https://www.ncbi.nlm.nih.gov/books/NBK441844/) | **NO — EXCLUDE.** Not a muscle (a functional group). Both tagged exercises are scapular-retraction movements, and **the bank has no dedicated external-rotation exercise at all** |
| `supraspinatus` / `serratus_anterior` | real muscles | **NO in this bank — EXCLUDE from targets.** Zero primary entries each. Keep as descriptive metadata |

### Forearms — a bank gap, not a vocabulary gap

Of 171 exercises, **zero** are wrist curls, reverse wrist curls, carries, or grip work. Any
`wrist_flexor` / `wrist_extensor` / `forearm` term added today would be untargetable by definition.
**Flagged for Kerwin to fill with exercises first**, not papered over with terms for an empty set.

---

## 5e. Three more defects from the upper-body pass, all verified by running

### Defect 8 — Landmine Press is unreachable from every chest and push slot (BUG-85)

```
Landmine Press: {"primary":["anterior_delt","upper_pec"],"secondary":["tricep","serratus_anterior"]}
groupsMatch(Landmine Press, ['pec'])       -> false
```

`upper_pec` has no prefix relation to `pec`. The exercise enters programs only via `anterior_delt`.
⚠️ Retagging it to `pec_major_clavicular` would fix this, but **UNVERIFIED** whether Landmine Press
actually biases the clavicular head — no source found. Retag only once one exists.

### Defect 9 — `lat` would collide with `lateral_delt` (latent)

```
pool for ['lat_dorsi'] -> 22       pool for ['lat'] -> 38
```

Shortening `lat_dorsi` to `lat` bleeds **16 lateral-raise / press movements into a back slot**. Not
live — recorded because it is the exact trap the next person to "tidy" this vocabulary will fall into.

### Defect 10 — `tricep_lateral` and `tricep_medial` are the same set

```
tricep_lateral (7)  lateral MINUS medial: []
tricep_medial  (9)  medial MINUS lateral: ["Skull Crusher","JM Press"]
```

`tricep_lateral` is a **strict subset** of `tricep_medial`. Not one exercise in the bank
distinguishes them. Two vocabulary terms encoding one identical concept would make **D6b
double-count the same sets as two muscles**.

---

## 6. Recommendation

**Both research passes independently reached the same #1 conclusion, and it is not about naming.**

### A. Ship the gate first — it is worth more than every rename combined

Nothing in `scripts/doctrine.mjs` or `scripts/validate-programs.mjs` asserts anything about
`muscleGroups`, `muscle_primary`, or slot-pool emptiness. `pick()` returns `null` on an empty pool
and every caller is `if (chosen) { … }`, so **the slot is silently dropped with no warning**. The
`usable` guard only checks `slots[0]`, so an unreachable *accessory* slot ships a 4-exercise day
where 5 was intended and every gate stays green (`programs.js:1704`).

Propose a new invariant: **every slot group array in `FOCUS_SLOTS`, `TEMPLATES`,
`SHOULDER_TEMPLATE`, `CORE_GROUPS` and `ONEOFF_*` resolves to a non-empty candidate pool at every
equipment tier.** This is **SAFETY** tier, not SCIENCE_DEFAULT — an empty pool drops a prescribed
exercise on every path, generated and authored alike. It converts silent fail-open into CI failure
and catches Defects 1, 2, 4, 7 and the `['delt']`/`['trap']` cases in one stroke.
`scripts/audit-muscle-tags.mjs` already computes everything it needs.

### B. Additive-only vocabulary — zero renames, zero migration

1. **Add `calf` as a co-tag** on all 6 triceps-surae entries. Repairs Defect 4 *and* Defect 5 —
   and note a `calf_*` rename would **not** fix Defect 5, because `getExerciseSubstitutes` needs an
   exact shared tag.
2. **Add `hamstring_semitendinosus`** to Nordic Curl, Slider Leg Curl, Glute-Ham Raise.
3. **Add `quad_vastus` as a co-tag** on the 19 VL/VM entries — it is already a request token at
   `:1656` with no tag behind it.
4. **Spelling fixes** (prefix-safe, 0 slots break): `hamstring_bicep_femoris` →
   `hamstring_biceps_femoris`; `hamstring_semimembranous` → `hamstring_semimembranosus`.
5. **Collapse `bicep` → `bicep_brachii`** (1 occurrence, zero behavior change).

Parent co-tags are the only change that also improves the exact-match substitute path. Every one of
these touches `migrations/epic031_exercises_seed.sql` and the seeded Supabase rows — they are data
migrations, not one-line edits, and `programs.js` plus the migration must change in the **same
commit** or the DB reverts on next sync.

### C. Reject as dead weight, with reasons

`quad_vastus_intermedius` (no targeting exercise exists — **not** the folk "cannot be recruited"
claim, which is UNVERIFIED) · `glute_minimus` (JOSPT 2017 + proven redundant in code) ·
`calf_gastrocnemius_medial`/`_lateral` (unverified) · `tricep_lateral` + `tricep_medial` (identical
sets) · `upper_pec` (not anatomical, duplicates clavicular) · `external_rotator` (not a muscle; no
ER exercise in the bank) · `quad` as a *primary tag on a strength lift* (its only 4 uses are cardio).

**Keep but exclude from any D6b volume target:** `transverse_abdominis`, `oblique_internal`,
`supraspinatus`, `serratus_anterior`, `core`, `bicep_brachii_long_head`/`_short_head`.

### D. Do NOT rename delts, traps, or the `calf_*` family

Not because they break — §5's correction proves they don't — but because the cost is ~97 tag
occurrences plus a three-surface data migration, and the benefit is a parent slot no template wants.

### E. Needs Kerwin — flagged, not filled

1. **The schema conflict, highest priority.** Notion **v0.5** sanctions a coarse 10-value enum
   (`chest|back|shoulders|quads|hamstrings|glutes|biceps|triceps|core|calves`). The code runs a
   50-term anatomical vocabulary. `research-report (8).pdf` (all 18 pages extracted) and the
   Framework docx contain **zero** hits for `anatom`, `clavicular`, `trapez`, `delt`, `oblique`.
   **The entire existing vocabulary is undocumented drift from Tandem's own source of truth.**
   Per CLAUDE.md, v0.5 must be amended *before* `/DOCTRINE.md` — rule on this first.
2. `rectus_abdominis_lower` → is there regional *hypertrophy*, or only activation? Unsourced.
3. Biceps: relabel `long_head`/`short_head` as **proximal/distal** per Kobayashi 2024? That is the
   construct the evidence supports, but it is a genuine rename.
4. `hamstring_semimembranosus` as an independent target — no source separates SM from ST.
5. Splitting `adductor` into `adductor_magnus` (hip extensor) vs `adductor_longus`/`_brevis`.
6. **Bank gaps** (exercises missing, not terms): forearm/grip **0**, dedicated external rotation
   **0**, primary serratus **0**, primary erector spinae **2**, primary middle trap **1**.
7. **Citation grade.** Every anatomy domain was egress-blocked. Allowlist and re-verify before any
   of this becomes an ACTIVE D-invariant.

---

## 7. Recommended Phase 2 scope

**Phase 2 should not start with the backfill.** In priority order:

| # | work | why first |
|---|---|---|
| 1 | **Kerwin rules on the v0.5 schema conflict** | Everything else is unauthorized until the schema sanctions sub-tags. Notion first, then `/DOCTRINE.md`, per CLAUDE.md |
| 2 | **Ship the empty-pool gate** (§6A) as a PENDING→ACTIVE invariant, plus fix the live `lower_body` dead term | Converts this whole defect class from silent to blocking. Must land *before* any tag change, so the tag change is protected by it |
| 3 | **Wire a bank↔Supabase drift check into `npm run verify`** | Drift is zero today; nothing keeps it there |
| 4 | **The additive backfill** (§6B) — 36 exercises, not 171 | Now protected by the gate |
| 5 | **Re-verify citations** against fetch-accessible sources | Required before any of it becomes doctrine |

Phase 3 (`groupsMatch` itself) still requires its own `exercise-science-research` pass. The narrow
fix — dropping the unanchored `a.startsWith(g)` clause and keeping `a === g || a.startsWith(g+'_')`
— would resolve Defects 1 and 9 permanently, but it is a behavior change to selection logic and
needs its own audit.

---

## 8. Bug index

Six bugs filed in the Tandem Bug & QA Log. The brief anticipated three; the audit found more, so
all six are filed rather than the extras being buried in a report section.

| ID | severity | what | report |
|---|---|---|---|
| **BUG-82** | P1 | **Root cause** — no gate asserts a slot's candidate pool is non-empty; an unreachable accessory slot is silently dropped and every check stays green | §6A |
| **BUG-83** | P2 | `lower_body` matches zero exercises — the only *live* instance of the BUG-82 class | §3 D2 |
| **BUG-84** | P1 | Seated Calf Raise unreachable from 3 of 4 calf slots **and** offers zero swaps | §5b D4/D5 |
| **BUG-85** | P1 | Landmine Press unreachable from every chest and push slot (`upper_pec`) | §5e D8 |
| **BUG-86** | P1 | Nordic Curl tagged with the heads the evidence says it de-emphasises; `semitendinosus` absent from the bank | §5c |
| **BUG-87** | P2 | `quad` prefix-matches `quadratus_lumborum` (latent), plus the `lat`/`lateral_delt` trap | §3 D1, §5e D9 |

**BUG-82 is the one to fix first.** BUG-83, BUG-84 and BUG-87 are all instances of it; fixing them
individually leaves the class open.

Not filed as bugs, recorded here as vocabulary findings for the Phase 2 decision: the inert
`glute_minimus` token (§5b D6), the consumerless `adductor` tag (§5b D7), and the identical
`tricep_lateral`/`tricep_medial` sets (§5e D10) — that last one is not a defect today but would
make D6b double-count if it shipped unchanged.

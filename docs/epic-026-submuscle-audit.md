# EPIC-026 Phase 1 — Sub-Muscle-Group Taxonomy Audit

**Status:** audit only. Nothing in this phase writes data. No Supabase rows changed, no
`EXERCISE_BANK` edits, no generator changes. The deliverable is this report plus a vocabulary
proposal for Kerwin to approve *before* any backfill starts — retagging 171 rows twice because
the vocabulary shifted is the failure this phase exists to prevent.

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
correct. Whether any of them *should* be subdivided is a research question, answered in §4.
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

Filed as **BUG-82**, **BUG-83**, **BUG-84**.

### Defect 1 — `quad` slots can draw a core muscle (BUG-82)

`'quad'` prefix-matches `quadratus_lumborum`. Measured:

```
 25  quad  <- quad, quad_rectus_femoris, quad_vastus_lateralis, quad_vastus_medialis, quadratus_lumborum
```

Live call sites requesting bare `['quad']`: `FOCUS_SLOTS.legs[0]`, `FOCUS_SLOTS.full_body[2]`
(`programs.js:1353`), and the leg-day primary slot at `programs.js:1654`, plus `['glute_max','quad']`
at `:1637`. A quad compound slot can legally select a QL exercise. This is the only cross-parent
collision in the vocabulary today — but it is structural, not a one-off typo: any future term
sharing a prefix with another muscle reintroduces it.

### Defect 2 — `lower_body` is a dead term that fails OPEN (BUG-83)

`ONEOFF_CARDIO_GROUPS` (`programs.js:1365`) is `['full_body','lower_body','glute_max']`.
`lower_body` matches **zero** of the 50 vocabulary terms — no exercise carries it. It contributes
nothing to the candidate pool and never has. It fails silently: an unmatched group name yields an
empty pool rather than an error, which is the exact silent-failure class this project keeps
getting bitten by. Nothing today asserts that a requested group name resolves to a non-empty pool.

### Defect 3 — 11 tags no slot can reach (BUG-84)

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

The working recommendation, subject to that sourcing: **additive-only, zero renames in Phase 1**,
so every new term is literally prefixed by an existing parent and the prefix rule keeps working by
construction. That means rejecting the Notion epic's `calf_gastrocnemius` / `calf_soleus` (they
break the `['gastrocnemius','soleus','calf']` slot at `programs.js:1640`) and `glute_maximus` (the
bank ships `glute_max`). The suffix-named delt and trap families are the one place where staying
additive costs real expressiveness — that trade-off goes to Kerwin as an explicit costed choice
with the call-site list, not decided here.

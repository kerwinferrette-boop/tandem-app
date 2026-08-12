> # ⛔ OBSOLETE — DO NOT EXECUTE THIS PROMPT
>
> **2026-08-04: the premise of this document was wrong and the work it describes is already done.**
> Cowork landed the EPIC-031 application layer on `main` (`a6cb6c0`, plus `d655d70` for D16 and
> `d8d2516`). Verified on `origin/main`: `materializeTemplate`, `getActiveProgram`,
> `fetchTemplateBundle`, `adoptTemplate`, `openProgramLibrary` and `TECHNIQUE_TIPS` are all present;
> `scripts/doctrine.mjs` carries D16 as ACTIVE (2 seeds, 223 checks); `migrations/epic031_*.sql`,
> `seeds/*.json`, `scripts/author-seeds.mjs` and `scripts/sync-seed-programs.mjs` all exist.
> `npm run verify` 7/7 and `npm run validate:personas` 630 both pass on it.
>
> **Why this document was wrong.** I concluded the code was unrecoverable because it was absent from
> this container and from all 17 remote branches. That was true and it was the wrong inference. The
> giveaway is in Cowork's own commit message: *"Track the nine EPIC-031 files main already had on disk
> but not in git."* The work was never a lost commit needing a push — it was **untracked files sitting
> in a local working directory**, which no amount of remote scanning can see. Kerwin said as much
> ("I think Cowork works locally, not in the git") and was right. `ffa99c0` still does not exist and
> never will; recovery came from the files, not the commit.
>
> **What survives from this document as still-useful:** the verified column names below (they were
> checked against `information_schema` and remain correct), and the defect list — **BUG-59 is still
> open in the landed code**: `materializeTemplate(tpl, week)` takes no `cfg`, so the authored path
> still applies no equipment-tier or injury filtering. Persona-matrix cannot catch it because it
> exercises the generated path.
>
> Kept for the audit trail. Do not act on the "rebuild" instruction.

---

# EPIC-031 REBUILD PROMPT (supersedes the 2026-07-24 build prompt)

> Status: the 2026-07-24 build was lost (ephemeral worktree, never pushed). The Supabase schema
> survived and is LIVE. This prompt rebuilds the application layer ONLY. Written 2026-07-28.

---

## READ THIS FIRST — the situation is not what the old prompt assumed

EPIC-031 was already built once, on 2026-07-24, in a git worktree inside an ephemeral container. It was
committed locally as `ffa99c0`, verified (7/7 gates, 2,622 checks; a 2026-07-25 rebase pass reported
2,934 checks), and recorded COMPLETE in Notion. **It was never pushed.** The container was reclaimed and
every line of that code ceased to exist.

**The Supabase migrations survived**, because they were applied to the live project and Supabase is
external and persistent. So the database is ahead of the code.

### Do NOT do these things

- **Do NOT create the schema. Do NOT run `apply_migration`. Do NOT re-seed.** All of it is already live in
  project `zsvktcvqmppsshtpeljt`. Re-seeding would duplicate the two published templates.
- **Do NOT trust the old prompt's section 1 or section 4.** They describe work that is already done.
- **Do NOT assume any EPIC-031 symbol exists.** `materializeTemplate`, `getActiveProgram`,
  `fetchTemplateBundle`, `adoptTemplate`, `openProgramLibrary`, `program_source`, `TECHNIQUE_TIPS` are all
  absent from `main`. `scripts/doctrine.mjs` has D1–D15 and **no D16**.
- **Do NOT try to push commit `ffa99c0`, or any branch named `epic-031-program-library`.** Neither exists.
  Verified 2026-07-28 across all 17 remote branches: `git cat-file -t ffa99c0` → *not a valid object*, and
  zero occurrences of `materializeTemplate`/`getActiveProgram`/`adoptTemplate`/`fetchTemplateBundle` or
  `D16` on any ref. The Notion record still says "Kerwin pushes the rebased branch" — that instruction is
  stale and unfollowable. The commit died with its container. Rebuilding is the only path.
- Precision on what's missing: `migrations/` **does** exist on `main` and always did, holding the unrelated
  `calibration_v05.sql` and `weekly_stakes.sql`. What never reached git are the EPIC-031 migrations
  specifically — `epic031_program_library.sql`, `epic031_exercises_seed.sql`, `epic031_seed_programs.sql`.
  `migrations/0001_baseline_live_schema.sql` now reconstructs their effect from the live database.

### Verified live state — start from this, confirm it with `list_tables` before writing code

| table | rows | note |
| --- | --- | --- |
| `workout_templates` | 2 | both `is_published`; Brick by Brick (build_muscle), Redline Recomp (transform) |
| `template_blocks` | 6 | 3 blocks per program |
| `template_days` | 24 | |
| `template_exercises` | 162 | |
| `exercises` | 171 | canonical, matches `programs.js` EXERCISE_BANK count |
| `program_principles` | **1** | see the gap below |
| `users.program_source` | — | column exists, `NOT NULL DEFAULT 'generated'` |

**What survived in code:** `getSingleDay` IS present in `programs.js` on `main`. Do not rebuild it.

### VERIFIED COLUMN NAMES — use these, not the ones in the 2026-07-24 prompt

Read from `information_schema` on 2026-07-28. The old prompt and several derived briefings carried
**wrong column names**; do not trust any schema description you have been given, including the prose
elsewhere in this file. These are the live names:

```
workout_templates    id, name, slug, author_id(NOT NULL, FK auth.users), is_published,
                     author_attribution, parent_goal(NOT NULL), code_goal_mapping(NOT NULL),
                     duration_weeks(NOT NULL, CHECK 4-12), days_per_week(NOT NULL, CHECK 2-6),
                     split_type, intensity_tier, difficulty(NOT NULL), tagline, description,
                     coaching_notes, science_overrides(jsonb NOT NULL),
                     source_provenance(jsonb), cloned_from(uuid), created_at, updated_at

template_blocks      id, template_id, block_order  ← NOT block_index
                     week_start, week_end, name,
                     rep_scheme_by_week(jsonb NOT NULL), technique_by_week(jsonb NOT NULL)

template_days        id, template_id, block_id(NOT NULL), day_order, label(NOT NULL),
                     muscle_targets(text[] NOT NULL)  ← ARRAY, not jsonb
                     ✗ there is NO theme_tags column

template_exercises   id, day_id  ← NOT template_day_id
                     exercise_id, ex_order  ← NOT order_index
                     sets(int), reps(text e.g. "8-12")  ← NOT target_sets/target_reps
                     rest(int seconds, NOT NULL)  ← required, easy to miss
                     role(NOT NULL), technique, constant_across_program(bool NOT NULL)
                     ✗ NO target_rpe, ✗ NO superset_group

program_principles   id, principle_key(NOT NULL), claim(NOT NULL), rationale(NOT NULL),
                     source_citation(NOT NULL), created_by, template_id, created_at
                     ✗ NO category, ✗ NO confidence, ✗ NO provenance_url
```

**D16 linkage convention — verified against a live row, not invented.** The Brick by Brick template
carries `science_overrides.rep_floor`, and its justification is a `program_principles` row whose
`principle_key` is exactly `rep_floor` on the same `template_id`. So D16 is an **exact key match**
between a `science_overrides` key and a `principle_key`, scoped to the template. Implement it that way;
do not invent a category taxonomy, because no category column exists.

A working reference implementation of the schema guard, D16 precondition check and validation rules
already exists on `main` at `scripts/ingest-program.mjs` — read it before writing your own.

---

## YOUR SCOPE — the application layer, nothing else

### 1. Data access
- `fetchTemplateBundle(templateId)` — pull a template plus its blocks, days, exercises and principles from
  Supabase in one coherent bundle.
- `materializeTemplate(bundle, week, cfg)` — turn a bundle into a runnable day for a given program week.
  Resolve `rep_scheme_by_week` and `technique_by_week` from the owning block. Resolve `exercise_id` against
  the canonical `exercises` table; **never leak an unresolved slug as an exercise name**.

### 2. The resolver seam
- `getActiveProgram()` — one seam that returns the active program regardless of source, replacing the
  existing `getProgram` call sites. The tracker must not know or care whether a program was generated,
  authored, or adopted from the library.
- Thread `users.program_source` (`generated` | `template` | `library`) through **every** sync path.

### 3. Two-tier doctrine + D16 — `scripts/doctrine.mjs`
Tag every invariant **SAFETY** (enforced on every path, always) or **SCIENCE_DEFAULT** (enforced for
generated programs only). Add **D16**: a template may set `science_overrides` to exceed a SCIENCE_DEFAULT
band **only** if a matching `program_principles` row justifies it. A principle-less override fails.
Negative-test it in both directions — an unjustified override MUST fail the gate.

SAFETY set: compound-first, injury filter, equipment tier, monotonic + earned-only 1RM via `calcRM`, no
supersets on the primary compound block.

### 4. Browse and adopt
- `#modal-library` browse UI: filter goal → duration → days → split → difficulty; list published
  non-clone templates.
- `adoptTemplate` — owner-scoped clone into the user's own `workout_templates` with
  `program_source='library'`. Re-adoption must not orphan children.
- `revertToGenerated` — a way back out.
- `TECHNIQUE_TIPS` — render `rest_pause` / `drop_set` / `cardioacceleration` / `staggered` as coached
  instructions in the tracker, not raw enum values.

An adopted program must run through the EXISTING tracker, 1RM and progression math (`getRecommendation`,
`calcRM`, `effectiveReps`, D11–D15) unchanged, and score identically — PR, volume, streak and competition
parity. Do not fork that math.

### 5. Do not break the generated path
`buildDynamicProgram` / `pick()` / `bank()` keep working exactly as they do today. `getSingleDay` already
exists and is the one-off "Build Me a Workout" engine — leave it alone.

---

## TWO OPEN DEFECTS — read before coding, one needs a decision

**BUG-59 — the authored path applies no equipment-tier or injury filtering.** `materializeTemplate` never
receives `cfg`, so an adopted program bypasses two invariants that D16 names as SAFETY, binding on EVERY
path. This is a doctrine violation, not a gap, and the rebuild must close it: thread `cfg` through
materialization and apply the same equipment and injury filters the generated path uses.

The part that needs Kerwin's call is the *semantics* when an authored exercise is contraindicated or
out-of-tier — substitute via `getExerciseSubstitutes`, drop the exercise, or refuse the adoption outright.
**Ask before implementing.** Do not guess; the wrong choice here silently hands someone a lift their injury
profile excludes.

**BUG-60 — `workout_templates.intensity_tier` holds an equipment value (`'full_gym'`), hardcoded, unread.**
The column is unconstrained text; the Notion Named Variants taxonomy is Taxing / Moderate / Gentle.
Recommended fix is renaming the column to `equipment_tier` — which also hands BUG-59 the exact field it
needs to gate adoption on. **This requires a migration, which is human-only. Propose the SQL, do not apply
it.**

---

## A GAP IN THE ORIGINAL ACCEPTANCE — fix it this time

`program_principles` has **1 row**. The stated acceptance criterion was "≥1 row per seed" and there are two
seeds — Redline Recomp contributes nothing to the reasoning corpus. D16 doesn't catch this, because Redline
has no `science_overrides` needing justification, so the gate went green with the corpus half-empty. The
corpus is the moat; a seed that teaches the system nothing is a seed that failed its purpose. Author at
least one cited principle for Redline Recomp explaining WHY the recomp expression uses cardioacceleration
and shorter rest.

Separately, the Brick by Brick `rep_floor: 3` override ships with an explicit UNVERIFIED marker instead of
a fabricated citation. **That is the correct failure mode — leave it.** Do not invent a source to make it
look finished. Flag it as still needing research.

---

## VERIFICATION — prove by running, and make it durable

1. **Runtime, against the live DB.** Rebuild `scripts/db-materialize-smoke.mjs`: feed real
   `fetchTemplateBundle`-shaped bundles pulled from live Supabase into `materializeTemplate` for all 12
   weeks of both published templates. Assert day count matches `days_per_week`, no unresolved slugs leak as
   exercise names, sets/reps/rest all > 0, compound-first ordering holds, block-final weeks are clean.
2. **D16 negative test**, both directions.
3. **`npm run verify`** — must be green including the doctrine gate.
4. **`npm run validate:personas`** — 630 combos, with adopted-library programs in the mix. An adopted
   program must satisfy the same persona assertions (core block, cardio, injury filter, equipment tier) as
   a generated one. This is the assertion BUG-59 currently fails, so it is the real test of your fix.
5. Pre-existing `[dedup] day short by N` warnings are a known 6-day bank-depth issue, identical on baseline.
   Not your regression — do not chase them, but do not let their noise hide a real failure either.

### Then push. This is not optional.

**The previous build died because it was verified and never pushed.** Work is not done when the tests pass.
It is done when a remote ref confirms it.

- Commit, push to a branch on `origin`, and **read it back** (`git log origin/<branch>`) to confirm.
- Push to `main` when `npm run verify` (7/7) and `npm run validate:personas` (630) are **both green and
  shown** — this is authorized (Kerwin, 2026-07-28) and the `.claude/settings.json` deny rules that
  previously blocked it have been removed.
- If a push is blocked for any reason, that is a **P0 report in the same turn** — say plainly that the work
  exists only in the container and will be lost. Never write COMPLETE into Notion for code that is not on a
  remote.
- Force-push, `netlify deploy` and `apply_migration` remain human-only.

See the **Durability** section of `.claude/loop-config.md` (landed on `main` in `61eb37a`) for the standing
rules this comes from.

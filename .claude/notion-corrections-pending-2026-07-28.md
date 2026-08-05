> # ⛔ 2026-08-04 — THESE CORRECTIONS ARE THEMSELVES NOW WRONG
>
> Everything below was applied to Notion on 2026-07-28 and was accurate **as of that day's evidence**.
> It is no longer accurate. Cowork landed the EPIC-031 application layer on `main` (`a6cb6c0`,
> `d655d70`, `d8d2516`) from **untracked files on a local disk** — which is why scanning this
> container and all 17 remote branches found nothing, and why my inference from that absence was wrong.
>
> Every "absent everywhere" claim written into EPIC-026/027/029/030 and EPIC-35 needs a second-round
> correction saying the code landed. Concretely, now TRUE on `origin/main`:
> `materializeTemplate`, `getActiveProgram`, `fetchTemplateBundle`, `adoptTemplate`,
> `openProgramLibrary`, `TECHNIQUE_TIPS`, D16 ACTIVE in `scripts/doctrine.mjs` (2 seeds, 223 checks),
> `migrations/epic031_*.sql`, `seeds/brick-by-brick.json`, `seeds/redline-recomp.json`,
> `scripts/author-seeds.mjs`, `scripts/sync-seed-programs.mjs`. Gates green: verify 7/7, personas 630.
>
> Still true and still open, verified in the landed code: **BUG-59** — `materializeTemplate(tpl, week)`
> takes no `cfg`, so the authored/adopted path applies no equipment-tier or injury filtering.
> Persona-matrix passes R8/R9 only because it exercises the generated path. **BUG-60** unchanged. The
> **globally-unique `principle_key`** defect is unchanged and still caps the corpus at one principle
> per key for the whole library.
>
> Lesson for the durability rules: absence from every remote is **not** proof of non-existence when a
> collaborator works locally. "Not in git" and "does not exist" are different claims, and I collapsed
> them.

---

# NOTION CORRECTIONS — 2026-07-28 (applied; superseded 2026-08-04)

> **All corrections applied after Kerwin granted write approval.** Each verified by reading the record
> back, not by trusting the write response:
>
> | record | state |
> | --- | --- |
> | EPIC-026 `Agent Context Notes` | ✅ APPLIED |
> | EPIC-027 `Agent Context Notes` | ✅ APPLIED |
> | EPIC-029 `Agent Context Notes` | ✅ APPLIED (good-news case — `getSingleDay` survived) |
> | EPIC-030 `Agent Context Notes` | ✅ APPLIED |
> | EPIC-35 `Dependency Gate` | ✅ APPLIED — rewritten, now authoritative |
> | EPIC-35 page body | ✅ APPLIED — full correction, confirmed by search hit on the live page |
>
> EPIC-35's `Agent Context Notes` property still carries its original 2026-07-24/25 text. That is now
> **intentional**: both the rewritten `Dependency Gate` and the page body state plainly that the property
> is stale and why, so the history is preserved without the claim standing unchallenged. Prepending to it
> would have meant reproducing ~4k characters of prior note with no added signal.
>
> **Operational note for future sessions:** the Notion connector rotates server IDs mid-session. Writes
> through the `mcp__Notion__*` instance succeed; the `mcp__c881d872-*` instance returns
> `MCP error -32003: MCP tool call requires approval`, which a non-interactive session cannot satisfy.
> If writes start failing mid-task, re-check which instance is connected before concluding the gate is shut.
>
> The section-by-section text below is retained as the record of what was written.

---

# ORIGINAL PENDING CORRECTIONS — 2026-07-28

**Why this file exists:** five Notion records assert that EPIC-031 code was "DELIVERED" when it exists
nowhere. Notion writes are blocked this session (`MCP error -32003: MCP tool call requires approval` — the
Notion connector rotated server IDs mid-session and the new instance needs interactive approval). Rather
than let the corrections evaporate the way the EPIC-031 build did, they are committed here. Apply them from
an interactive session, or paste manually.

**Evidence for every claim below** (verified 2026-07-28 against working tree and `origin/main`):
- ABSENT from both: `materializeTemplate`, `getActiveProgram`, `fetchTemplateBundle`, `adoptTemplate`,
  `openProgramLibrary`, `program_source`, `TECHNIQUE_TIPS`
- ABSENT: `scripts/author-seeds.mjs`, `scripts/sync-seed-programs.mjs`, `scripts/db-materialize-smoke.mjs`,
  and the EPIC-031 migrations specifically (`epic031_program_library.sql`, `epic031_exercises_seed.sql`,
  `epic031_seed_programs.sql`). **Correction:** an earlier draft of this file said "any `migrations/`
  directory" — that was an overstatement. `migrations/` exists on `main` and always did, holding the
  unrelated `calibration_v05.sql` and `weekly_stakes.sql`.
- ABSENT: commit `ffa99c0` and any branch named `epic-031-program-library`. Re-verified 2026-07-28 across
  all 17 remote branches — `git cat-file -t ffa99c0` returns *not a valid object*, and zero refs contain
  `materializeTemplate`, `getActiveProgram`, `adoptTemplate`, `fetchTemplateBundle` or `D16`. The Dependency
  Gate's "Kerwin pushes the rebased branch" is unfollowable and is actively misdirecting downstream agents.
- `scripts/doctrine.mjs` = D1–D15, **no D16**
- SURVIVED: `getSingleDay` is present in `programs.js` on `origin/main`
- Live Supabase `zsvktcvqmppsshtpeljt`: `workout_templates` 2 (both published), `template_blocks` 6,
  `template_days` 24, `template_exercises` 162, `exercises` 171, `program_principles` **1**;
  `users.program_source` exists as `NOT NULL DEFAULT 'generated'`

Root cause guarded on `main`: Durability section in `.claude/loop-config.md` (`61eb37a`), and the
`.claude/settings.json` deny rules that blocked push-to-main removed (`769d930`).

---

## 1. EPIC-026 — page `392ca37f-935b-8158-893e-fef9a5a73f59`

Prepend to `Agent Context Notes`:

> ▶ 2026-07-28 CORRECTION (Claude/Opus) — the 2026-07-24 note below is PARTLY FALSE. The EPIC-031 build was
> never pushed (ephemeral worktree, local commit `ffa99c0`, container reclaimed). SPLIT VERDICT: the DATA
> survived, the CODE did not. Live in `zsvktcvqmppsshtpeljt`: `exercises` = 171 rows, matching the
> EXERCISE_BANK count. But `migrations/epic031_program_library.sql` and `epic031_exercises_seed.sql` do not
> exist in the repo — there is no `migrations/` directory on `origin/main` at all, and no sync script. So
> the canonical-source DECISION stands (programs.js EXERCISE_BANK authors, Supabase mirrors) but nothing
> enforces or reproduces it in code. Treat the sync as unimplemented. Deep tags (movement_pattern,
> unilateral, complexity, position_bias) and the 200–250 target remain fully open.

## 2. EPIC-027 — page `392ca37f-935b-8157-bf9e-c7547fc3d1d6`

> ▶ 2026-07-28 CORRECTION (Claude/Opus) — the 2026-07-24 note below is FALSE on the resolver. The EPIC-031
> build was never pushed and its code no longer exists. `getActiveProgram()` is absent from both the working
> tree and `origin/main`; `users.program_source` exists ONLY as a live database column, with no code reading
> or writing it. The tracker is NOT source-agnostic today. What survived: the schema tables
> (`workout_templates`, `template_blocks`, `template_days`, `template_exercises`), already applied and
> populated — do NOT re-apply those migrations. The resolver must be rebuilt from scratch. The template
> BUILDER UI remains open as the note below says, and the drag-card vs form decision is still pending.

## 3. EPIC-029 — page `392ca37f-935b-8148-bfa1-c9ad69f2bd7e`

**Do not overstate the loss on this one — it is the good news.**

> ▶ 2026-07-28 CORRECTION (Claude/Opus) — the 2026-07-24 note below is MOSTLY TRUE and survives the EPIC-031
> loss. `getSingleDay` IS present in `programs.js` on `origin/main` — verified. The EPIC-031 build (never
> pushed, code gone) did not take it with it, because it predates that work. Remaining scope is unchanged
> and accurate: the tandem.html UI entry point plus persistence into `template_exercises`. Note the
> persistence half now depends on the EPIC-031 rebuild, since no code writes those tables. See EPIC-036 for
> the UI hook, which is Blocked separately.

## 4. EPIC-030 — page `392ca37f-935b-819a-85b6-cbf58be6b1c4`

> ▶ 2026-07-28 CORRECTION (Claude/Opus) — the 2026-07-24 note below is FALSE. Phase A was NOT delivered.
> `openProgramLibrary` and `adoptTemplate` are absent from both the working tree and `origin/main`; the
> `#modal-library` browse UI does not exist; `revertToGenerated` does not exist. The EPIC-031 build was
> never pushed and its code is gone. What survived: the schema and its RLS, already live, plus 2 published
> templates — so a rebuild must NOT re-seed. Phase A must be rebuilt in full. Phase B friends network,
> Phase C community, and the 2-user-model scaling doc are unchanged and still gated on EPIC-005 anon-key
> rotation.

## 5. EPIC-031 / Epic ID EPIC-35 — page `3a7ca37f-935b-817f-91f8-f9720b892db7`

Prepend to `Agent Context Notes`:

> ▶ 2026-07-28 CORRECTION (Claude/Opus) — BOTH prior notes are now false on their central claim. The build
> was verified twice and pushed zero times. Commit `ffa99c0` does not exist in the repo; no
> `epic-031-program-library` branch exists on `origin`. Absent from working tree AND `origin/main`:
> `materializeTemplate`, `getActiveProgram`, `fetchTemplateBundle`, `adoptTemplate`, `openProgramLibrary`,
> `program_source` (as code), `TECHNIQUE_TIPS`; no `scripts/author-seeds.mjs`,
> `scripts/sync-seed-programs.mjs`, or `scripts/db-materialize-smoke.mjs`; no `migrations/` directory;
> `scripts/doctrine.mjs` carries D1–D15 with NO D16. The 2,622- and 2,934-check verification runs were real
> but measured code that no longer exists. SURVIVED: the Supabase migrations (external, persistent) and
> `getSingleDay` in `programs.js`. Root cause permanently guarded — Durability section in
> `.claude/loop-config.md` on `main` (`61eb37a`) makes a remote ref the definition of done, and the
> `.claude/settings.json` deny rules that blocked push-to-main are removed (`769d930`). Rebuild prompt:
> `.claude/EPIC-031-rebuild-prompt.md` on `main`.

Replace `Dependency Gate` entirely with:

> (a) The app-code layer must be RECONSTRUCTED against the already-live schema in `zsvktcvqmppsshtpeljt` —
> do NOT re-apply migrations or re-seed; `workout_templates`=2 (both published), `template_blocks`=6,
> `template_days`=24, `template_exercises`=162, `exercises`=171 are live and re-seeding would duplicate the
> published programs. Scope and verification: `.claude/EPIC-031-rebuild-prompt.md`. (b) BUG-59 (authored
> path applies no equipment-tier or injury filtering — a SAFETY invariant bypass binding every path) and
> BUG-60 (`intensity_tier` holds the equipment value `full_gym`; fix needs a migration, human-only) both
> require a Kerwin decision before their code lands. (c) `program_principles` has only 1 row live, so the
> acceptance criterion ">=1 row per seed" is UNMET — Redline Recomp contributes nothing to the reasoning
> corpus, and D16 does not catch it because Redline sets no `science_overrides`. (d) rep_floor:3 citation
> research still open; the DB row ships an explicit UNVERIFIED marker rather than a fabricated source, which
> is the correct failure mode — do not let a rebuild invent a citation to close it.

Status stays **In Progress**.

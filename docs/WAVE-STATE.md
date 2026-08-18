# Wave state — council-ordered execution (2026-08-18)

**Purpose:** a resumable checkpoint. If a session ends mid-wave, the next one reads THIS FILE FIRST
and continues from the first unchecked step. Never redo a checked step — verify it instead
(`git log --oneline`, `npm run verify`).

Order is the LLM Council's, not mine. Full reasoning:
`scratchpad/council-report-tandem-sequencing.html` (published artifact).
Council's core finding: the taxonomy layer and BUG-87 are **the same bug family** — one naming
collision found twice — so ONE research pass covers both, and the flagship builder (EPIC-029) must
not ship on a selection engine with a live collision bug in it.

---

## Step status

- [x] **1. Combined exercise-science-research pass** — DONE 2026-08-18. THE GATE IS OPEN.
      **Citation established, do NOT re-derive it:** Exercise Science Schema v0.5 (Notion
      `37bca37f935b81cb9478e4906ada58c9`), Part 3 "Proposed Supabase Schema", Table 1 `exercises`,
      specifies verbatim: `movement_pattern` — horizontal_push | horizontal_pull | vertical_push |
      vertical_pull | squat | hinge | carry | isolation; and `canonical_lift` — "which barbell lift
      this exercise maps to (e.g. 'Barbell Bench Press'). NULL for exercises with no barbell
      equivalent." The same page's `load_coefficient` table already maps 15 exercises to canonical
      lifts (DB Bench→Barbell Bench 0.76, Leg Press→Barbell Squat 1.27, Arnold Press→Barbell OHP
      0.65, …).
      **So MOVEMENT_FAMILIES is NOT invented** — it is a v0.5 field specified and never populated
      (EPIC-026: `movement_pattern` 0/171, "schema ahead of data").
      **BUG-87's citation status, settled:** "a quad slot must not return a lumbar muscle" is an
      ENGINEERING-CORRECTNESS claim — quadratus lumborum being a lower-back muscle is definitional
      anatomy, not a training-science finding. No new science citation required. It sits under
      existing D2 (legal programs) + the same slot-returns-what-it-asked-for principle D18 encodes.
- [ ] **2. Ship MOVEMENT_FAMILIES** — canonical macro/micro exercise taxonomy in `programs.js`.
- [ ] **3. Fix BUG-87** — `groupsMatch` prefix collisions (quad→quadratus_lumborum live;
      lat→lateral_delt latent). Changes live selection logic.
- [ ] **4. Five stale-checks** — thread through gaps. The DB-column-rename check is NOT optional
      regardless of the ~80% already-fixed prior (a stale rename silently corrupts writes).
- [ ] **5. BUG-38 Phase A** — RPE input UI. No dependency; Phase B stays citation-blocked.
- [ ] **6. Scope EPIC-029** — plan only, in parallel. Flag which slices are program-logic (gated)
      vs pure UI wiring (ungated).
- [ ] **7. Build EPIC-029** — ONLY after 2 and 3 are shipped and verified.

---

## Invariants for whoever resumes

- Scope-lock: `tandem.html` + `programs.js` (+ `scripts/` for gates, `migrations/` for FILES only).
- Never: `git push --force`, `netlify deploy`, `supabase apply_migration`. Migration files yes,
  applying them no.
- Gates before any push: `npm run verify` (9/9) + `npm run validate:personas` (630) +
  `npm run walkthrough:onboarding` (0 findings). Run and SHOW them, don't assert.
- Push to `main` directly when green (Kerwin, 2026-08-17: "I'm tired of branches").
- Program-logic changes need a citation or an explicitly flagged gap. Never invent a number.

## Progress log

(append one line per completed step, newest last)

- **2026-08-18** — Step 1 GATE PASSED. Citation established (see step 1 above). Wave workflow
  `w3q60pnhf` launched covering steps 2, 3, 4, 6 with model-tiered agents:
  Research (high) → Build taxonomy + BUG-87 (high, worktree-isolated) → adversarial Verify (high,
  fresh context) → Sweep 5 stale rows (**haiku**, read-only, cheap) → Scope EPIC-029 (high, plan
  only). Step 5 (RPE UI) deliberately held back from the workflow: it touches `tandem.html` while
  the builds touch `programs.js`, and running both against worktrees branched from the same main
  risks a messy merge. Do it in the main checkout AFTER the workflow lands.

### If you are resuming cold, read this
Run `git log --oneline -15` and `npm run verify` first. The wave is additive and each step is
independently verifiable — nothing needs rewriting, only re-checking. Specifically:
- Is `MOVEMENT_FAMILIES` in `programs.js`? Then step 2 is done. Confirm with
  `node scripts/movement-families-check.mjs` if it exists.
- Does `groupsMatch` contain `a.startsWith(g + '_')`? Then step 3 is done.
- Does `docs/epic-029-scope.md` exist? Then step 6 is done.
- Is there an RPE input in `tandem.html` (grep -i rpe — should be >2 hits)? Then step 5 is done.

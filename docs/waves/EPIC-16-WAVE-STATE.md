# EPIC-16 — Wave decomposition (LIVE)

**Created:** 2026-09-07/08 (Kerwin-ruling session, Group 4). Source: `elegant-spinning-perlis`
plan. Kerwin's instruction on being asked whether EPIC-16/18/22 should get the same lightweight
"OK to requeue?" treatment as the two FEAT rows: *"Feel like this is something you can figure out
without me. Build this into a wave and let's get this going."* This delegates the disposition
decision, not the standing forbidden-ops rule (`.claude/loop-config.md`, 2026-08-30) — this file
still routes anything touching the biometric/1RM layer to Kerwin. EPIC-16 doesn't touch it at all
(see below), so it gets a normal buildable decomposition, not a carve-out.

**Source Epic (Notion):** EPIC-16 · "Simplified Nutrition Tracking — No Calorie Math", Status:
Planned. Dependency Gate (verbatim): *"WAVE 12 (deferred). New surface, no collision, but no
dependency pulls it forward either. Lowest value per unit of risk in the backlog — build last."*
**Linked tracker row:** `EPIC-16-simplified-nutrition-tracking`, Status=Needs Human.

---

## Key finding — the tracker row's blocking reason was simply wrong, not stale

The tracker row's Evidence framed this as blocked on `health_snapshots` (EPIC-4's Apple Health
pipeline, Status=**Planned**, not shipped). Audited the Epic's own Agent Context Notes directly
rather than trusting that framing, per this session's standing audit-before-ask rule, and found
the opposite of what the tracker claimed:

> "Apple Health already ingests nutrition data from MyFitnessPal if the user has that connected —
> that flows into health_snapshots automatically. The manual nutrition log is for users who don't
> use MFP and want something simpler."

So the manual log this Epic asks for is **explicitly the fallback path for users who are NOT
using the `health_snapshots` pipeline** — it is independent of EPIC-4, not dependent on it. There
was never a real dependency here; the tracker row's reasoning doesn't appear anywhere in the real
Epic's Dependency Gate or Agent Context Notes. The Gate's actual reason to defer is sequencing
only ("no dependency pulls it forward"), which is a priority call, not a blocker — and Kerwin's
instruction this session ("let's get this going") is that priority call.

**Nothing in this Epic touches `getPhase`/`getRecommendation`/`getWeekTarget`/the 1RM layer.** It
is a new, additive logging surface (a table + a UI form + a summary read), the same shape as
`user_bug_reports` or `agent_log` — no program-engine change, no forbidden scope.

---

## Step status

- [x] **1. Schema — `nutrition_logs` table**
      **Depends on:** nothing. New table, no existing schema touched.
      **File/region:** `migrations/0014_epic16_nutrition_logs.sql`. **APPLIED to prod** on Kerwin's
      explicit one-off authorization (the file previously said "NOT applied" — that was stale;
      corrected 2026-09-14). Confirmed independently via live introspection: `public.nutrition_logs`
      exists, RLS enabled, table comment matches this file. One row per day per user, matching the
      Epic's "no calorie math" framing: a small set of self-reported qualitative fields (meal
      count logged, protein target hit y/n, notes) rather than a macro calculator — the Epic's own
      title is explicit that this is NOT a calorie/macro engine.
      **should/could/did stub:** SHOULD — no exercise-science claim; this is a logging table, not
      a prescription. COULD — mirror `health_snapshots`' shape so a future EPIC-4 merge is a
      straight UNION (considered; deferred — EPIC-4 is Planned, not built, so there is no live
      shape to mirror yet without guessing at it). DID / RECONCILE — n/a, no science claim to
      reconcile.

- [ ] **2. UI — manual log entry surface — UNSHIPPED AGAIN, 2026-09-14. Do not trust this file's
      own prior entry below without reading this correction first.**
      **What changed:** this file previously (same day, earlier pass) called Slice 2 `[x]`,
      SHIPPED as the "Today's Workout" Journal (`#modal-journal`, `openJournal()`/`saveJournal()`),
      writing to `nutrition_logs` via upsert. That was accurate for the code AS IT STOOD AT THAT
      MOMENT — it is no longer accurate. Kerwin corrected the Journal's purpose the same day,
      verbatim: *"The journal it's not supposed to be a food journal. It's supposed to be: These
      are the workouts that I did today. These are the reps that I did. These are the weights that
      I did, record it."* `saveJournal()` was rebuilt to write `workout_sessions`/`sets` (a manual
      WORKOUT log, governed by D9/D11 — see `DOCTRINE.md`), not `nutrition_logs`. Meals/protein
      fields are gone from the modal entirely. **`nutrition_logs` (Slice 1, still live in prod) now
      has NO write path anywhere in the app.** This is a real regression against this Epic's own
      goal, not a stale doc — the code itself moved away from nutrition, on a direct Kerwin
      instruction, so this is the correct disposition to record, not something to quietly re-fix.
      **File/region:** `#modal-journal`, `openJournal()`/`saveJournal()` (`tandem.html`) — now scoped
      to EPIC-036/D9's one-off-workout logging, not this Epic.
      **Not this session's call to rebuild a nutrition surface** — Kerwin explicitly redirected the
      one surface this Epic had; whether EPIC-16 gets a new, separate manual-nutrition entry point
      (dashboard-native, not reusing Journal) is a product decision, not inferred here.

- [ ] **3. Read surface — dashboard/summary tie-in**
      **Depends on:** Slice 2, which regressed (above) — moot until Slice 2 has a real write path
      again. The Epic's Expected Behavior text doesn't specify dashboard placement either, so this
      still needs a design pass once Slice 2 is re-decided.

---

## Invariants for whoever resumes

- **Ship gates, both green, every code slice:** `npm run verify` AND `npm run validate:personas`
  — this was true of Slices 1-3 as originally scoped (pure logging surface, no program-engine
  contact), but is **no longer true of whatever eventually replaces Slice 2**: the code that used
  to satisfy Slice 2 (`saveJournal()`) was rebuilt 2026-09-14 into a one-off WORKOUT log governed
  by D9/D11, which DOES touch `reconcileWorking1RMs`/the 1RM layer. A future nutrition-specific
  Slice 2 rebuild should stay clear of that layer (per this Epic's original no-program-engine
  scope) — but don't assume a pass here is a no-op the way it used to be if the rebuild reuses any
  part of the Journal's current plumbing.
- **`0014_epic16_nutrition_logs.sql` is APPLIED** (corrected 2026-09-14 — the file previously,
  wrongly, said otherwise). Do not re-apply it.
- **RLS from day one** — no table ships without owner-scoped policies; do not repeat the BUG-74/
  BUG-78 shape (a permissive `USING(true)` policy that looks scoped by name but isn't).
- **No calorie/macro math** — the Epic's title is the constraint. If a future slice is tempted to
  add a calculator, that's scope creep against this Epic's own stated positioning; flag it instead.

## Progress log

- **2026-09-07/08 (Kerwin-ruling session, Group 4):** File created. Audited the Epic's own
  Dependency Gate + Agent Context Notes against the tracker row's stated blocker and found the
  blocker doesn't exist — `health_snapshots` dependency was never real, per the Epic's own text.
  Wrote `migrations/0014_epic16_nutrition_logs.sql` (unapplied at the time). Tracker row synced
  Needs Human → Untested (see Notion Evidence). Slices 2/3 (UI, dashboard tie-in) are named but
  not built — next Fix pass.
- **2026-09-14 (dirty-tree reconciliation session, earlier pass):** Corrected two stale claims
  found via a branch audit (`claude/epic036-ruling-stale-base`), neither requiring new code at the
  time: (1) Slice 1's migration was actually applied to prod 2026-09-08 — this file and the
  migration's own header wrongly said "NOT APPLIED"; confirmed live via `list_tables`
  introspection. (2) Slice 2's UI was never built as originally scoped (a standalone dashboard
  form) — instead Kerwin redirected it into the "Today's Workout" flow and it shipped 2026-09-12
  as the "Journal" feature (`openJournal()`/`saveJournal()`, `tandem.html`), which at that moment
  independently turned out to satisfy this Slice's requirement (writes to `nutrition_logs`,
  owner-scoped, upsert-safe). Marked both `[x]` — **this Slice-2 disposition was correct for the
  code as it stood in that moment, but did not survive the same day** (see next entry).
- **2026-09-14 (same reconciliation session, later pass — self-correction):** Discovered and
  committed (`cf9d25a`) a separate, pre-existing, fully-built-and-gate-verified WIP block that had
  been sitting uncommitted in the working tree since before this session started: Kerwin's SAME-DAY
  follow-up ruling that the Journal "is not supposed to be a food journal... These are the
  workouts that I did today... record it." `saveJournal()` was rebuilt to write
  `workout_sessions`/`sets` under D9/D11's one-off-session rules, not `nutrition_logs`; the meals/
  protein/notes fields are gone from the modal. Committing that WIP retroactively invalidated the
  entry directly above — it documented Slice 2 as shipped-and-satisfied when it no longer is.
  Caught and corrected in the same session per CLAUDE.md's self-correction protocol: Slice 2
  reverted to `[ ]` UNSHIPPED, Slice 3 marked moot pending Slice 2, and this Invariants section's
  "no program-engine contact" claim narrowed to no longer overclaim about Slice 2's future
  replacement. `nutrition_logs` remains live in prod (Slice 1, unaffected) with zero write paths.

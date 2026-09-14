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

- [x] **2. UI — manual log entry surface**
      **Depends on:** Slice 1 (table must exist before the form can write to it).
      **File/region:** SHIPPED as the "Journal" feature (`tandem.html`), not the standalone
      dashboard form originally scoped here — Kerwin redirected this into the "Today's Workout"
      flow (`#modal-journal`, `openJournal()`/`saveJournal()`, both `tandem.html`). Uses
      `sb.from('nutrition_logs').upsert(..., { onConflict: 'user_id,log_date' })`, keyed off
      `currentUser.id` + `localDateStr()` — RLS-scoped to the owning user, matching this file's
      original intent even though the surface location changed.
      **Independent verification:** confirmed by reading the shipped code — `upsert` on
      `user_id,log_date` (not insert) correctly avoids the `nutrition_logs_one_per_user_per_day`
      unique-violation on a second same-day open, and a signed-out user is refused client-side
      (`if (!currentUser) { showToast(...); return; }`) before any write is attempted. **Not yet
      independently re-verified against live RLS with a real signed-in JWT through supabase-js**
      (only the client-side guard and query shape were read) — do this before calling Slice 2 fully
      closed.

- [ ] **3. Read surface — dashboard/summary tie-in**
      **Depends on:** Slice 2. Deferred to Fix; the Epic's Expected Behavior text doesn't specify
      dashboard placement, so this needs a short design pass (where does it render, does it affect
      streak/points) before it's sliceable — flagged, not guessed.

---

## Invariants for whoever resumes

- **Ship gates, both green, every code slice:** `npm run verify` AND `npm run validate:personas`
  — though nothing in Slices 1-3 touches the program engine those gates check, so a pass here is
  expected to be a no-op confirmation, not a real risk surface.
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
- **2026-09-14 (dirty-tree reconciliation session):** Corrected two stale claims found via a
  branch audit (`claude/epic036-ruling-stale-base`), neither requiring new code: (1) Slice 1's
  migration was actually applied to prod 2026-09-08 — this file and the migration's own header
  wrongly said "NOT APPLIED"; confirmed live via `list_tables` introspection. (2) Slice 2's UI was
  never built as originally scoped (a standalone dashboard form) — instead Kerwin redirected it
  into the "Today's Workout" flow and it shipped 2026-09-12 as the "Journal" feature
  (`openJournal()`/`saveJournal()`, `tandem.html`), which independently turned out to satisfy this
  Slice's requirement (writes to `nutrition_logs`, owner-scoped, upsert-safe). Marked both `[x]`.
  Slice 2's owner-JWT-through-supabase-js RLS check remains unverified on-device — flagged, not
  claimed. Slice 3 (dashboard/summary tie-in) is still genuinely unbuilt.

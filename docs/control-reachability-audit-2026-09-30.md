# Control Reachability Audit — controls that write but are never read

**Date:** 2026-09-30 · **Commissioned by:** Kerwin ("a top-down full audit on buttons that exist in
tandem that either don't work or relate to anything in the site, or get factored into any sort of
calculation or engine generation")
**Scope:** every interactive control in `tandem.html` (+ `programs.js`), all three dead-classes:
(1) no handler / undefined handler, (2) handler runs but the value never reaches the engine or a
pixel, (3) control works but the feature behind it is orphaned or duplicated.
**Method:** read-only. Every row below was verified by grep/SQL against the live file and production
Postgres. No finding is inferred from a function name.

---

## 0. Why this audit exists when EPIC-40 already ran

EPIC-40's CATALOG half (`docs/epic-40-dead-handler-audit.md`) reported **1 dead handler out of 159**.
That is an artifact of its classifier, not a health reading. `scripts/audit-dead-handlers.mjs` scores
a handler `Generative` for:

- assigning to a known top-level global (`:82`),
- calling a function whose name merely *begins* calc/render/update/apply/save/submit/sync/finish/
  build/generate (`:84`),
- or containing any `sb.from(` (`:81`).

None of those asks whether a single line reads the value back. So it answers *"does this button do
something?"* — not the question asked, *"does what it does reach the engine or a pixel?"* That is
CLAUDE.md's `"Wired" is not "working"` rule, and it had never been audited.

**The proof is inside EPIC-40's own write-up.** It declares the Color Takeover path
*"already resolved… Fully wired today"* because it *"upserts `users.color_theme`"*. `users.color_theme`
is read by **nothing** (§D9). `preferred_workout_time` and `secondary_goal` both earn the script's
strongest verdict, `Generative (DB write)`, and are consumed by nothing (§D10).

Mechanism recorded as `docs/self-corrections.md` **SC-33**. Gate being added in Phase 5.

**Inventory shape, for orientation:** ~247 interactive controls; **223 inline `onclick`**, **0
`addEventListener`**, 0 event delegation; **0 undefined handlers**. So class (1) is almost clean —
the app's dead controls are nearly all class (2). That is exactly why a write-side audit found
nothing and reported health.

---

## 1. Tier 1 — the app misleads the user, or a safety input is silently dropped

### D1 · `reorderWeek()` writes an order nothing reads — and says it worked

**`tandem.html:6790`** · **P1 Wrong Data** · verdict: **FORK → council**

`tandem_day_order` has exactly three references in the file: the LS key list (`:2767`), and a read
and a write *inside `reorderWeek()` itself* (`:6791`, `:6796`). The day actually served is computed
by `nextProgramDayKey()` (`:8931`):

```js
return 'day' + ((completedSessionCount() % perWeek) + 1);
```

It never consults the order. The button then fires `showToast('Moved to the back of this week —
nothing lost')`. **The reorder does not happen and the UI asserts that it did.** This is the worst
shape in the audit: a silent dead control merely wastes a tap, but this one produces a false belief
about the user's own plan.

**Why it is a fork, not a fix.** The comment block above `:8931` records a deliberate ruling
(BUG-93) that the app must not skip past work — which is *why* day selection is completion-count
based. Honoring a stored order may reopen that ruling. Either honor `tandem_day_order` inside
`nextProgramDayKey()`, or delete the button and the toast. Not a call to make unilaterally.

### D2 · Max dumbbell weight does not survive a reload, but the tier does

**`tandem.html:4440`, read at `:5243`** · **P1 Wrong Data** · verdict: **WIRE**

`applySetupSelection()` persists the equipment tier three ways (`sessionStorage`, `cfg.equipment`,
`users.equipment`) but stores the DB cap **only** in `sessionStorage.eq_max_db`. On a fresh tab
`_eDb` is `0` (`:5243`) and the input is never refilled (`:5251`), while the tier still displays
"Hotel · Small DB". `resolveMaxDb()` → `dbCap` therefore goes **uncapped**.

Safety-adjacent: a user whose hotel gym tops out at 25 lb silently starts receiving uncapped
dumbbell prescriptions. One rule, two storage lifetimes.

### D3 · `restoreFromCloud` drops `injuries` — a field the code twice calls a SAFETY invariant

**`tandem.html:7683`ff** · **P1 Wrong Data** · verdict: **WIRE (one home)**

`restoreFromCloud`'s cfg rebuild omits `injuries`, `weeks`, `emphasis` and `startDate`.
`syncFromCloud` (`:9055-9080`) rebuilds all of them correctly. Two builders for one rule.

`injuries` is not a cosmetic field: `makeInjuryBlocked()` (`programs.js:1855`) and `pruneInjuries()`
(`:1876`) are the contraindication filter, and the code labels it a SAFETY invariant at
`tandem.html:3565` and `:8254`. Restoring from cloud therefore re-enables contraindicated lifts.
Dropping `weeks` additionally defaults phase math to 12 weeks regardless of the real program length.

**Fix at the shared-function level** — one cfg builder both paths call — per "fix the mechanism, not
the instance." The should/could/did COULD section must enumerate the other cfg fields checked, not
just `injuries`.

### D4 · `saveProfileStats()` — three chain breaks in ~16 lines

**`tandem.html:10099`** · **P1 Wrong Data** · verdict: **WIRE**

| Field | Break |
|---|---|
| Current weight | Written to `cfg.weight` + localStorage only. The upsert at `:10112` sends **only** `goal_weight_lbs` and `height_inches`, and there is no `syncToCloud()` call — so `users.current_weight_lbs` is never updated from Settings. Lost on a new device; the 7-day trend and `weightDeltaLbs` desync. |
| Goal weight | Lands in `profile.goalWeight` and `users.goal_weight_lbs`, but **never** in `cfg.targetWeight`/`cfg.goalWeight`, which is what `getActiveProgram()` reads (`:3596`). The D29 weight-delta cardio gate cannot see a Settings edit until a full cloud restore. |
| Height | `openProfileModal` reads `profile.heightInches \|\| cfg.height_inches` (`:10004`). **`cfg.height_inches` is never set anywhere** — cfg uses `heightIn`/`height` (`:9070-9071`). On a fresh login the height inputs render blank although `users.height_inches` holds the value. |

### D5 · `personal_records.week_targets` — a green gate on a dead value

**written `tandem.html:3166`, `:3297`** · **P1 Wrong Data** · verdict: **FORK: wire, or retire column + assertion together**

EPIC-9's entire weekly-target map is computed (`computeWeekTargets`), round-tripped to Postgres, and
**read by nothing** — both `select('*')` consumers (`:7706`, `:9099`) use only
`best_estimated_1rm_lbs`. And `scripts/calibration-upsert-smoke.mjs:119` **asserts** it:

```js
check('every row carries week_targets', rows.length > 0 && rows.every(r => r.week_targets != null));
```

This is precisely the case CLAUDE.md calls *"worse than no gate, because it manufactures
confidence"* — in tree, today. Retiring the column without the assertion breaks `verify`; retiring
the assertion alone removes the only thing watching it. They move together, or the value gets wired
into the prescription path. **Note:** `personal_records` may fall under `safety.forbidden`
(1RM/biometric layer) — council verdict is advisory; confirm with Kerwin before changing calibration
behavior.

### D6 · The per-exercise notes textarea discards everything typed into it

**`tandem.html:5545`** · **P1 Wrong Data** · verdict: **WIRE (local now, cloud staged)**

`<textarea class="ex-notes" placeholder="Notes — feel, pain level, weight adjustments...">` renders
for **every exercise of every session**. Its `.value` is never read. All six references are four CSS
rules (`:483-488`), the tag itself, and a click-suppression guard (`:7101`).
`workout_sessions.notes` is written as the literal `null` (`:6002`).

**The root cause is a feedback loop worth naming.** There *was* an `exercise_notes` table
(`user_id, exercise_name`, RLS policy "users manage own exercise notes"). Because the textarea never
wrote to it, it had 0 rows. An audit saw 0 rows and "no reader, no writer" and **dropped it** —
`migrations/0008_bug72_dead_object_cleanup.sql:148`. Confirmed gone 2026-09-30:
`to_regclass('public.exercise_notes')` returns `NULL`. `migrations/epic033_source_of_truth.sql:117`
had even flagged the open question: *"keep exercise_notes pending a ruling on whether per-exercise
notes are still roadmapped."*

The dead control starved its own schema, and the schema's emptiness was then used as evidence the
feature was dead. Kerwin's ruling, 2026-09-30: persist locally now, migration staged for him to
apply.

---

## 2. Tier 2 — collected and discarded

| ID | Location | Finding | Verdict |
|---|---|---|---|
| **D7** | `sets.rpe` — `:5872`, `:6030`, `:8348`, `:8614` | An RPE select on every set of every session. The column is **never selected**. Self-declared at `:5737`: *"`sets.rpe` is what plateau detection **will** read."* | Defer — declare honestly in the UI or remove |
| **D8** | `resetWeek()` `:7146` | Whole body is `// just re-render current` + `renderTracker()`. `changeWeek()` (`:7140`) sets `currentWeek` and `LS.set('tandem_week',…)`; `resetWeek` sets neither. The "Today" button cannot return you to today. | **WIRE** |
| **D9** | theme color | **Three homes, one rule.** `users.color_theme` — written `:10176`, read never. `users.theme_color` — the actual read column (`:9215`, `:9375`, `:9698`). `profile.colorTheme` — the only value feeding `applyAccentColor()` (`:10151`, fed at `:10323`). So the theme survives a reload on the same device and is silently lost on a new one, and onboarding's swatch (`selectThemeColor` `:4756` → `cfg.themeColor`) never drives the app accent at all. `competition_leaderboard` even excludes `theme_color` with the note "broken in the view" (`:9231`). | **FORK → council** |
| **D10** | `preferred_workout_time` `:1482-1490`; `secondary_goal` `:1512-1524`; `age` `:1345`/`:1680` | All three round-trip Postgres → `cfg` and are consumed by **nothing**. `programs.js` has zero references to any of them. Worst: `preferred_workout_time` is a **required gate to advance onboarding** (`:4666`) on a value nothing reads. `age` is not even exposed in Settings. | **RESEARCH → wire or delete** |
| **D11** | `INJURY_RULES` `programs.js:1856-1863` | Only 6 keyword families match: knee / lower-back / shoulder / elbow / wrist / hip. "ankle", "neck", "hamstring", "achilles", "calf" and anything else silently no-op — while the field label promises *"your coach will avoid…"* (`tandem.html:1504`). Safety-adjacent: a promise the UI makes and the engine cannot keep. | **RESEARCH → wire** |
| **D12** | duration `:1459-1471`; equipment `:2003-2009` | Session length is only distinguishable as `<45` (`SHORT_SESSION_MAX_MINUTES` `programs.js:2626`, used once at `:3075`) — **45 / 60 / 90 produce byte-identical programs**. `EQ_TIER_TO_BANK` (`:3456-3460`) collapses 6 tiers into 3: `standard_gym` ≡ `full_gym`, and `hotel_full` ≡ `hotel_small` ≡ `dumbbells`. Both are documented as intentional; the UI implies otherwise by offering the choices. | Defer — label honestly |
| **D13** | a11y | `.dash-competition` (`:1849`) carries `role="button"` + `tabindex="0"` with only an `onclick`; the file has **zero** `addEventListener`, so no keydown exists anywhere and Enter/Space are dead. It is the **only** `role="button"` in the file, so this is one instance, not a class. ~~One-off cards emit `aria-pressed`/`data-oneoff` that is never read or updated~~ — **RETRACTED, see the correction below.** | **WIRE** |
| **D14** | dead engine outputs | Computed and discarded: `ex.intensity = 'drop-set'` (`programs.js:1963`, applied `:5599`; zero `.intensity` reads — and `TECHNIQUE_TIPS` keys the same concept as `drop_set` off `ex.technique`: two vocabularies, neither reaching the other) · `rotation.phase` (`tandem.html:3529` — `buildDynamicProgram` destructures only `rot.week` and says so at `programs.js:2718`) · `ex.supersetGroup` (`:3605`) · `ex.constant` (`:3795`) · `ex.role` on the materialized output (`:3789`) · `day.authored`/`day.templateSlug` (`:3803`) · `EXERCISE_BANK[*].videoId` (29 non-null; render reads `VIDEO_IDS` instead — two homes, and the bank's copy is documented as authoritative at `:387`) · `MOVEMENT_FAMILIES[*].canonicalLift` and `.label` · `RECOVERY_PARAMS[*].maxConsecutive` (all 5 goals; only `sameGroupHours` is read) · `HERO_MOMENTS.pr` · `emphMap.pull_heavy`/`core_focused` (reachable, but the UI offers only 6 of 8) · `cfg.program_goal` (stale duplicate of `cfg.goal`) · `profile.avatarStyle` (read at `:9978` then hard-overwritten to `'illustrated'` at `:10286`). | Defer / delete |
| **D15** | orphans + write-only columns | Unreferenced declarations: `recentSetsFor()` (`:7950`, "Projection B (EPIC-027)", zero callers), `const todayDate` (`:6979`), `const perWeek` in `skipAhead()` (`:6717`). Write-only Supabase columns — **list corrected 2026-09-30, see the note below**: `personal_records.calibration_session_id`, `users.calibration_session_id`, `users.color_theme`, `users.age`, `users.preferred_workout_time`, `users.secondary_goal`, `users.start_weight_lbs`, `workout_sessions.phase_name`/`week_number`/`duration_minutes`/`notes`, `sets.rpe`, `sets.exercise_category`, `personal_records.week_targets`, `personal_records.updated_at`, `agent_log.resolved_at`. `tandem_skips` is incremented and read only to increment itself (`:6719`). Separately, `renderStrengthTrend` (`:6557`) recomputes 1RM via `calcRM()` while its own comment at `:6562` claims it reads `estimated_1rm_lbs` — the comment is false and should be fixed regardless. | Defer / delete |
| **D16** | authored/library path | `materializeTemplate` is **never passed `experience`** — `getActiveProgram` (`:3566-3572`) hands over only `tier`, `injuries`, `sex`, `maxDb` — so the advanced RPE cue and `flagDropSet` never fire for an adopted program. `onboardingEstimates` is hard-coded `{}` (`:3851`), so adopters never get week-1 prefill. Settings' Days/week and Weeks pills are inert for authored programs (overridden by `tpl.days_per_week`/`duration_weeks`, `:3836-3838`). | **WIRE** (program-generation change → research first) |

> ### CORRECTION, 2026-09-30 (same day) — D13's one-off-card half was WRONG
>
> This audit claimed the one-off cards' `aria-pressed` and `data-oneoff`/`data-oneoff-goal` are
> "never read or updated". **That is false.** All three are fully wired: `pickOneOffGoal` reads
> `b.dataset.oneoffGoal` (`:8258`), `renderOneOff` reads `b.dataset.oneoff` (`:8308`), both call
> `setAttribute('aria-pressed', String(on))`, and `openOneOff` resets both (`:8115`). The cards are
> also native `<button>` elements, so they were never keyboard-inoperable. Nothing to fix; BUG-200
> is narrowed to the competition card's keydown alone.
>
> Why the sweep missed it: the reads go through `dataset.oneoffGoal`, the camelCase form of
> `data-oneoff-goal`. **No search for the literal attribute name can find them.** That transform is
> now named in `docs/self-corrections.md` SC-35 as a surface a grep structurally cannot reach.

> ### CORRECTION, 2026-09-30 (same day) — two D15 claims were wrong
>
> Building the reads-side gate (`scripts/column-reachability-smoke.mjs`) immediately disproved two
> entries in D15's original write-only list. **`sets.estimated_1rm_lbs` and
> `workout_sessions.total_volume_lbs` ARE read** — server-side, by the `sets_apply_1rm_and_pr` and
> `streak_recompute` triggers respectively (verified against `pg_proc`). `workout_sessions.backdated`,
> `personal_records.achieved_reps`/`achieved_weight_lbs` and `workout_templates.author_id` are read
> the same way (the last by eight RLS policies). None of those are defects, and the original list was
> client-only reasoning presented as a complete answer — the same shape as the write-side error this
> whole audit exists to correct, just one layer down.
>
> The gate also surfaced **two columns this audit had missed**: `sets.exercise_category` and
> `users.start_weight_lbs`. Both added to D15 above and to BUG-205.
>
> Net: a hand sweep produced 2 false positives and 2 false negatives on this dimension. That is the
> argument for the executable check rather than the document.

**Also noted, no action:** `restoreFromCloud` vs `syncFromCloud` are two cfg builders for one rule
(the mechanism behind D3). Settings' "Current Week" input caps at `max="16"` while onboarding allows
24 (`:1392`), so weeks 17-24 are unreachable from Settings. `isFemaleSex` maps the Settings `other`
sex pill silently to male. No notification toggle, unit (lb/kg) toggle, rest-length or RIR
preference exists anywhere in the codebase — flagged so a future audit does not assume they do.

---

## 3. Rule tables verified LIVE (so no future cycle re-hunts them)

`PHASES` · `SUPERSET_CFG` · `RECOVERY_PARAMS.sameGroupHours` · `DELOAD_TABLE` · `GOAL_VOLUME` ·
`VOLUME_LANDMARKS` · `SESSION_MUSCLE_CEILING` · `MIN_PRIMARY_BLOCK` · `FOCUS_SLOTS` ·
`EQUIPMENT_AVAILABILITY_RANK` · `FREE_WEIGHT_RANK` · `PROGRESSION_PCT_MIN/MAX` ·
`TIMED_HOLD_FALLBACK_SECS` · `ACCESSORY_PROGRESSION_RATIO` · `TECHNIQUE_TIPS` · `HEATMAP_KEY_GROUPS` ·
`TEMPLATE_DAY_COLORS` · and the functions `pruneInjuries`, `compoundSetsOf`, `honorAuthoredRest`,
`authoredSlotFor`, `primaryBlockIndex`, `isFemaleSex`, `getExerciseSubstitutes`, `movementPatternOf`.

**`REST_SECONDS` is NOT in this list because it no longer exists** — D23 deleted it
(`programs.js:1917-1940`). `ex.rest` is now honored end-to-end: `honorAuthoredRest()`
(`programs.js:3618`) → `authoredRest` → `data-rest` (`tandem.html:5487`) → the rest timer
(`:6124`). CLAUDE.md cited it as the flagship dead-value example until 2026-09-30; that example was
stale and has been replaced with D1/D5/D6.

---

## 4. Disposition summary

| Verdict | Findings |
|---|---|
| **Wire — no wave collision, ship now** | D2, D3, D4, D8, D13 |
| **Wire — local now, cloud migration staged for Kerwin** | D6 |
| **Fork — llm-council before any code** | D1, D5, D9 |
| **Research first (`exercise-science-research`), then wire or delete** | D10, D11, D16 |
| **Defer — label honestly or delete, low value** | D7, D12, D14, D15 |
| **Dead last — behind roadmap Waves 6/7/8** | the 223-`onclick` → delegation/CSP refactor |

**Already fixed in this session:** (1) the QA-feed badge counted already-filed reports and could
never drain (badge 21 → 3, verified against production) — commit `6f339fd`, gated by
`scripts/qa-feed-status-smoke.mjs`. (2) The reads-side gate this audit's mechanism (SC-33) demanded
now exists: `scripts/column-reachability-smoke.mjs`, in `npm run verify` (now 30 checks), with a
one-way ratchet so a NEW write-only column fails the build and a fixed one must have its allowlist
entry removed. It is scoped to Supabase columns — DOM values like `.ex-notes` and localStorage keys
like `tandem_day_order` are not covered and remain judgment.

## 5. Honest limits of this audit

- **Static + DB, not driven.** Findings were verified by reading code and querying Postgres. D1,
  D2, D3, D6 and D8 each still need a **live behavioral reproduction** against the test accounts
  before their fixes are called done; the plan's verification section names the specific steps.
- **`programs.js` output coverage is by inspection**, not by an exhaustive generator diff. D14's
  list is every discarded field found; it is not proof no others exist.
- **Class (3) — "works but the feature is orphaned"** — is the least complete dimension here. The
  Goal modal duplicating the Plan choices, and the avatar builder whose four cloud-synced fields
  render only inside their own editor, are examples found; a systematic pass over duplicated entry
  points was not done.
- This container's egress policy blocks `supabase.co`, so PostgREST query syntax could not be
  tested over the wire; DB facts came via the Supabase MCP (service-role path). Noted because it
  shaped an implementation choice in the QA-feed fix.

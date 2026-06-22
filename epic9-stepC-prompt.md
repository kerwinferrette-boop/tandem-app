# EPIC-9 Step C — Claude Code Prompt (calibration hook + %1RM reconciliation)

You are working on Tandem — a couples fitness competition web app. The codebase is two files loaded together: `tandem.html` (main app, vanilla JS) and `programs.js` (data layer, loaded via `<script src>` before the main block). Supabase project: `zsvktcvqmppsshtpeljt`.

**Context:** EPIC-9 (Baseline Calibration + Per-Goal Weekly Progression, v0.5-calibration) is In Progress. The `calibration_v05.sql` migration is already applied — these columns are live: `personal_records.is_calibrated`, `personal_records.calibration_session_id`, `personal_records.week_targets`; `users.onboarding_estimates`, `users.calibration_complete`, `users.calibration_session_id`. Step D is already done and deployed: the formula layer (`PROGRESSION`, `ACCESSORY_FACTORS`, `DEFAULT_WEIGHTS`, `roundTo5` at L1889, `getWeekTarget(exerciseName, week, goal, oneRM, sex, compound1RMs)` at L1894 returning `{weight, source}`) feeds the `buildDayHTML()` weight prefill. What's missing is Step C: nothing yet WRITES the calibrated 1RMs, and the live progressive-overload increment in `getRecommendation()` (L1914) still shows a flat "+inc lbs" instead of a %1RM-derived target even after calibration. This is the gap user QA report f9cedf10 flagged ("shouldn't this be a % of my 1RM, not +5 lbs?").

**Task:** Implement Step C — a Week-1-Day-1 calibration hook in `finishSession()`, and reconcile `getRecommendation()` so a calibrated user sees a %1RM-derived target with a coaching reason string instead of a flat additive bump.

**Constraints:**
- Do NOT modify any function not listed in the Scope below. In particular, do NOT touch `syncToCloud`, the streaks upsert, `buildNextSessionBanners`, or the set-logging PR path.
- Do NOT change table names. Use these exact names: `workout_sessions`, `personal_records`, `users`, `sets`, `lastsets`, `health_snapshots`, `medals`, `streaks`, `agent_log`, `user_bug_reports`, `competition_leaderboard`.
- Epley formula is canonical: `1RM = weight × (1 + reps / 30)`. There is already an inline `est1rm` computation in the set-logging path (~L2861–2893) — reuse that exact formula; do not invent a second one. Use the existing `roundTo5()` (L1889) for display rounding only, never for the stored 1RM.
- A calibrated 1RM must NEVER override live performance once a set is logged. The %1RM number is what to display as the *prescribed* target; `getRecommendation()`'s overload logic still governs up/down/hold based on actual reps. You are changing how the target is *expressed and labeled*, not replacing the overload decision.
- Single file, vanilla JS, no frameworks. After each change, state which line ranges you modified.

**Scope (functions/sections to touch):**
- `finishSession()` — L3202, specifically inside the existing `if (currentUser)` async IIFE (L3252+), AFTER the `workout_sessions` "mark complete" update (L3262–3271) and the PR count (L3274), placed so it does not interfere with the streaks upsert.
- `getRecommendation(exId, compound, goal)` — L1914 (signature may need calibrated-1RM/week/goal awareness; if you widen the signature, update its call sites and list each one you touched).
- A new small helper is allowed (e.g. `computeCalibration1RMs(sessionUUID)` and/or a label helper) placed adjacent to `getWeekTarget` (~L1912) — declare it in scope when you add it.

**Steps:**
1. In `finishSession()`'s async IIFE, after the session is marked `completed = true`, read `users.calibration_complete` for `currentUser.id`. If it is already true, skip calibration entirely (idempotent — never recompute).
2. If `calibration_complete` is false: pull this session's sets (`sb.from('sets').select('exercise_name, weight_lbs, reps').eq('session_id', sessionUUID)`), and for each exercise compute the best Epley 1RM across its sets using the SAME formula as the existing `est1rm` path. Round the STORED value the same way that path does (store the raw estimate, not a roundTo5'd one).
3. Upsert those into `personal_records` keyed by `(user_id, exercise_name)` with `is_calibrated = true`, `calibration_session_id = sessionUUID`, and `best_estimated_1rm_lbs` set to the computed 1RM only when it exceeds the existing stored value (preserve the existing higher-of logic — do not regress a real PR). Then set `users.calibration_complete = true` and `users.calibration_session_id = sessionUUID`.
4. Wrap the calibration block in its own try/catch that logs but does not throw — it must never block session completion or streaks. If it fails, the session still finishes.
5. In `getRecommendation()`: when a calibrated 1RM exists for the exercise (read from the same in-memory `prs`/`tandem_prs` map Step D uses), express the prescribed weight via the %1RM curve — reuse `getWeekTarget(...)` rather than duplicating the factor math — and set `reason` to a coaching string of the form `"<weight> lbs — <pct>% of your <1RM> lb <exercise> 1RM, Week <n> <goalLabel>"`. When NOT calibrated, keep the current flat-increment behavior unchanged. The up/same/down arrow must still be driven by actual reps vs. `topRange` exactly as today.
6. Verify syntax: `awk '/<script>/{f=1;next}/<\/script>/{f=0}f' tandem.html > /tmp/extracted.js && node --check /tmp/extracted.js && node --check programs.js`.
7. Re-fingerprint and report the delta: `echo "Lines: $(wc -l < tandem.html) | Views: $(grep -c 'id=\"view-' tandem.html) | sb.from: $(grep -c 'sb\.from(' tandem.html)"`.

**Verify by running this SQL (use the TEST users, never mutate real-user data during QA):**
```sql
-- After completing a calibration session as Test Kerwin (e5074b4c-3808-4338-aeb7-b9db59d61f49):
SELECT exercise_name, best_estimated_1rm_lbs, is_calibrated, calibration_session_id
FROM personal_records
WHERE user_id = 'e5074b4c-3808-4338-aeb7-b9db59d61f49'
ORDER BY exercise_name;

SELECT name, calibration_complete, calibration_session_id
FROM users
WHERE id = 'e5074b4c-3808-4338-aeb7-b9db59d61f49';

-- Expected: is_calibrated = true on this session's exercises, calibration_complete = true,
-- calibration_session_id populated and matching across both tables.
-- Re-running finishSession() on a later session must NOT change calibration_complete (idempotent).
```

**Definition of done:** code-complete + `node --check` clean → mark EPIC-9 "In Fix" pending Netlify deploy + device verify on Kerwin's phone. (Direct-upload deploys do NOT advance GitHub main — Kerwin must `git push` to lock it.)

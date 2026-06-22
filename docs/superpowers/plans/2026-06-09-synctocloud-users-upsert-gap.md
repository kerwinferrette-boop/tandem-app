# syncToCloud Users Upsert Gap — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `syncToCloud()` so the `users` upsert sends all cfg fields that exist in both the app state and the DB schema, and fix two key/value name mismatches that silently null out `goal_weight_lbs` and `height_inches` today.

**Architecture:** Single function edit in `tandem.html` — the `syncToCloud()` users upsert block (lines 4514–4528) and the `restoreFromCloud()` cfg reconstruction block (lines 5231–5246). No new abstractions. No new tables. No UI changes.

**Tech Stack:** Vanilla JS, Supabase JS client (`sb`), localStorage (`LS`)

---

## Context

The real-time sync layer (startOrResumeSession / logSet / finishSession) was already implemented in commit 04a60ae. The one remaining gap is `syncToCloud()`'s users upsert:

1. **`goal_weight_lbs` is always null** — onboarding saves `cfg.targetWeight` but the upsert reads `cfg.goalWeight` (undefined).
2. **`height_inches` is always null** — onboarding saves `cfg.heightIn` but `restoreFromCloud()` writes back `cfg.height` (different key), and the upsert reads `cfg.heightIn` which is missing after a cloud restore.
3. **Six `users` table columns are never written** — `program_weeks`, `equipment`, `workout_duration_minutes`, `preferred_workout_time`, `injuries`, `secondary_goal` all exist in `cfg` and in the DB but aren't included in the upsert.
4. **`restoreFromCloud()` doesn't restore the new cfg fields** — after a cloud restore, `cfg.weeks`, `cfg.equipment`, etc. are lost, so the app runs in a degraded state until the user re-onboards.

---

## File

**Modify only:** `tandem.html`
- `syncToCloud()` — lines 4514–4528 (users upsert block)
- `restoreFromCloud()` — lines 5231–5246 (cfg reconstruction block)

---

### Task 1: Fix the `syncToCloud()` users upsert

**Files:**
- Modify: `tandem.html:4514–4528`

- [ ] **Step 1: Locate the current users upsert block**

  Open `tandem.html` and find the block starting at line 4514:
  ```javascript
  // Config
  if (Object.keys(cfg).length) {
    const { error } = await sb.from('users').upsert({
      id: uid,
      program_goal: cfg.goal,
      program_days_per_week: cfg.days,
      sex: cfg.sex,
      fitness_level: cfg.experience,
      start_weight_lbs: cfg.weight,
      current_weight_lbs: cfg.weight,
      goal_weight_lbs: cfg.goalWeight,     // ← BUG: should be targetWeight || goalWeight
      height_inches: cfg.heightIn,          // ← BUG: missing after cloud restore (cfg.height)
      age: cfg.age,
      current_week: currentWeek,
      theme_color: cfg.themeColor || '#1B5E38'
    }, { onConflict: 'id' });
    if (error) throw error;
  }
  ```

- [ ] **Step 2: Replace the users upsert block with the corrected version**

  Replace the entire block above with:
  ```javascript
  // Config
  if (Object.keys(cfg).length) {
    const { error } = await sb.from('users').upsert({
      id: uid,
      program_goal: cfg.goal,
      program_weeks: cfg.weeks || null,
      program_days_per_week: cfg.days,
      sex: cfg.sex,
      fitness_level: cfg.experience,
      equipment: cfg.equipment || null,
      workout_duration_minutes: cfg.workout_duration_minutes || null,
      preferred_workout_time: cfg.preferred_workout_time || null,
      injuries: cfg.injuries || null,
      secondary_goal: cfg.secondary_goal || null,
      start_weight_lbs: cfg.weight || null,
      current_weight_lbs: cfg.weight || null,
      goal_weight_lbs: cfg.targetWeight || cfg.goalWeight || null,
      height_inches: cfg.heightIn || cfg.height || null,
      age: cfg.age || null,
      current_week: currentWeek,
      theme_color: cfg.themeColor || '#1B5E38'
    }, { onConflict: 'id' });
    if (error) throw error;
  }
  ```

  Key changes:
  - `goal_weight_lbs` now reads `cfg.targetWeight || cfg.goalWeight` — covers both onboarding and restore
  - `height_inches` now reads `cfg.heightIn || cfg.height` — covers both onboarding and restore
  - Added: `program_weeks`, `equipment`, `workout_duration_minutes`, `preferred_workout_time`, `injuries`, `secondary_goal`
  - Added `|| null` guards so undefined cfg fields become explicit nulls rather than missing keys

- [ ] **Step 3: Commit**

  ```bash
  git add tandem.html
  git commit -m "fix: syncToCloud users upsert — send all cfg fields, fix goalWeight/heightIn key mismatches"
  ```

---

### Task 2: Fix `restoreFromCloud()` cfg reconstruction

**Files:**
- Modify: `tandem.html:5231–5246`

- [ ] **Step 1: Locate the cfg reconstruction block in restoreFromCloud()**

  Find the block around line 5231:
  ```javascript
  cfg = {
    goal: userData.program_goal,
    days: userData.program_days_per_week,
    sex: userData.sex,
    experience: userData.fitness_level,
    weight: userData.current_weight_lbs,
    goalWeight: userData.goal_weight_lbs,
    height: userData.height_inches,      // ← stores as `height` not `heightIn`
    age: userData.age
  };
  ```

- [ ] **Step 2: Replace with the expanded reconstruction**

  Replace the block above with:
  ```javascript
  cfg = {
    goal: userData.program_goal,
    days: userData.program_days_per_week,
    weeks: userData.program_weeks || 12,
    sex: userData.sex,
    experience: userData.fitness_level,
    equipment: userData.equipment || null,
    workout_duration_minutes: userData.workout_duration_minutes || null,
    preferred_workout_time: userData.preferred_workout_time || null,
    injuries: userData.injuries || null,
    secondary_goal: userData.secondary_goal || null,
    weight: userData.current_weight_lbs,
    targetWeight: userData.goal_weight_lbs,
    goalWeight: userData.goal_weight_lbs,   // keep for backwards compat
    heightIn: userData.height_inches,       // canonical key used by syncToCloud and getProgram
    height: userData.height_inches,         // keep for backwards compat
    age: userData.age,
    themeColor: userData.theme_color || '#1B5E38'
  };
  ```

  Key changes:
  - Added `weeks`, `equipment`, `workout_duration_minutes`, `preferred_workout_time`, `injuries`, `secondary_goal`
  - `heightIn` now set (the key syncToCloud reads)
  - `targetWeight` now set (the key syncToCloud reads)
  - Both old and new key names kept for backwards compat so nothing that reads `cfg.goalWeight` or `cfg.height` breaks

- [ ] **Step 3: Commit**

  ```bash
  git add tandem.html
  git commit -m "fix: restoreFromCloud — restore all users fields into cfg, fix heightIn/goalWeight key names"
  ```

---

## Verification

1. Open the app and sign in as a test user.
2. Complete onboarding (or reset program) — this sets all cfg fields including `equipment`, `workout_duration_minutes`, etc.
3. Click "☁ Sync Now" — open browser DevTools → Network tab → confirm the Supabase `users` PATCH/PUT contains `program_weeks`, `equipment`, `workout_duration_minutes`, `preferred_workout_time` with real values (not null).
4. Check `goal_weight_lbs` and `height_inches` are non-null in the network payload.
5. Sign out, sign back in — triggers `restoreFromCloud()`. Confirm `cfg.heightIn` and `cfg.weeks` are populated after restore (check `LS.get('tandem_cfg')` in the console).
6. Sync again after restore — all fields should still be non-null.

No schema changes needed. All columns already exist in the `users` table.

# Dashboard Upgrade Design

**Date:** 2026-06-03
**Status:** Approved for implementation

---

## Goal

Upgrade the existing `view-dashboard` from a basic health snapshot + workout count display into a rich post-auth entry point with health rings, a competitive scoreboard, daily win tracking, and a dynamic color takeover driven by the leading user.

---

## Context

`view-dashboard` already exists in `tandem.html` (line ~1067) with a working `loadDashboard()` / `renderDashboard()` / `refreshDashboard()` function set. The competition section currently shows only workout counts. The rings section shows 3 rings without targets. The nutrition section is plain text. This spec upgrades all three, wires the dashboard as the canonical post-auth entry point, and adds the database columns needed to support it.

The dashboard is already shown on auth (all `showView('dashboard')` paths call `loadDashboard()` via `showView()`). No entry-point wiring changes are needed.

---

## Database Migrations

### 1. `health_snapshots` — add Apple Health goal columns

```sql
ALTER TABLE health_snapshots
  ADD COLUMN IF NOT EXISTS active_calories_goal integer,
  ADD COLUMN IF NOT EXISTS sleep_goal_hours numeric,
  ADD COLUMN IF NOT EXISTS steps_goal integer;
```

These are populated by the Apple Health scraper pipeline. All three are nullable; rings fall back to hardcoded defaults when null.

**Future scope (not in this build):** Add `weight_lbs`, `bmi`, `skeletal_muscle_pct`, `body_fat_pct` for smart scale sync. Same table, future migration.

### 2. `users` — add carb and fat target columns

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS daily_carbs_target_g numeric,
  ADD COLUMN IF NOT EXISTS daily_fat_target_g numeric;
```

User-settable via the profile modal nutrition section (alongside existing `daily_calories_target`, `daily_protein_target_g`).

---

## HTML Changes (`view-dashboard`)

### Header

Add today's date between the title and refresh button:

```
[ Today   Jun 3      ↻ ]
```

`dash-title` stays. Add a `dash-date` span (formatted as "MMM D") between title and button.

### Health Rings — replace current layout entirely

Remove the existing 3-ring Activity section and the nutrition text section (`dash-nutrition`). Replace with:

**Activity** (section label)
- Row of 3 ring cards: Active Cal · Sleep · Steps

**Nutrition** (section label)
- Row of 4 ring cards: Cal · Protein · Carbs · Fat

Ring card IDs:
- Existing: `dashRingCal`, `dashRingSleep`, `dashRingSteps`
- New: `dashRingDietCal`, `dashRingProtein`, `dashRingCarbs`, `dashRingFat`

Each ring card has `.dash-ring-svg`, `.dash-ring-circle`, `.dash-ring-val`, `.dash-ring-label` — matching existing pattern.

Ring colors and targets:

| Ring | ID | Stroke color | Target source | Fallback |
|------|----|-------------|--------------|---------|
| Active Cal | `dashRingCal` | `var(--accent)` | `snap.active_calories_goal` | 500 |
| Sleep | `dashRingSleep` | `#4a9eff` | `snap.sleep_goal_hours` | 8 |
| Steps | `dashRingSteps` | `#38d9c0` | `snap.steps_goal` | 8000 |
| Diet Cal | `dashRingDietCal` | `#FFB020` | `users.daily_calories_target` | 2000 |
| Protein | `dashRingProtein` | `#e854a0` | `users.daily_protein_target_g` | 150 |
| Carbs | `dashRingCarbs` | `#a78bfa` | `users.daily_carbs_target_g` | 250 |
| Fat | `dashRingFat` | `#fb923c` | `users.daily_fat_target_g` | 65 |

Active Cal uses `var(--accent)` so it shifts with the color takeover mechanic.

**Sync pending state:** When today's snapshot is null, all rings show 0% fill and the `Activity` section label reads `"Activity — Sync pending"`.

### Competition Card — replace current layout with Option A scoreboard

Structure (all inside existing `.dash-competition`):

```
Names row:     Marcus          vs       Jordan
Points:         285 pts               210 pts
Progress bar:  [████████████░░░░░░░]
Stats row:     Sessions | Streak | PRs   (both users per cell)
Day dots:      M  T  W  T  F  S  S
```

**Points:** Winner's number and name colored in their `theme_color`. Loser muted (`var(--muted2)`).

**Progress bar:** `winner_pts / (winner_pts + loser_pts) * 100%` width, filled with winner's `theme_color`.

**Stats row:** 3 cells (Sessions, Streak, PRs). Each cell shows both users' values side by side — winner's value larger/white, loser's smaller/muted.

**Day dots:** One dot per day Mon–Sun. Colors:
- Current user won that day (completed session, partner didn't): current user's `theme_color`
- Partner won: partner's `theme_color`
- Both trained: left half current user's color, right half partner's (CSS linear-gradient on border-radius)
- Neither trained: `var(--s3)` grey

**No partner state:** Show "— pts" on both sides with "Add a partner to compete" subtext.

### Profile Modal — nutrition section

Add two new inputs alongside existing Calories and Protein fields:
- Carbs target (g) → saves to `users.daily_carbs_target_g`
- Fat target (g) → saves to `users.daily_fat_target_g`

The existing `saveNutrition()` function (line ~3895) upserts both new fields.

---

## JavaScript Changes

### `dashboardData` object

Extend to:
```javascript
const dashboardData = {
  health: null,        // today's health_snapshots row
  userTargets: null,   // users row for current user (targets + theme_color)
  partnerTargets: null,// users row for partner (theme_color + display_name)
  leaderboard: [],     // competition_leaderboard rows (up to 2)
  dailyWins: {},       // { 'YYYY-MM-DD': 'mine' | 'theirs' | 'both' | null }
  medals: []           // unchanged
};
```

### `loadDashboard()` — full replacement

Sequential fetches:

```
1. health_snapshots WHERE user_id = uid AND snapshot_date = today → dashboardData.health
2. users WHERE id = uid → dashboardData.userTargets (gets partner_id, theme_color, all targets)
3. IF partner_id:
     competition_leaderboard WHERE user_id IN (uid, partner_id) → dashboardData.leaderboard
     users WHERE id = partner_id → dashboardData.partnerTargets
     For each day Mon–Sun this week:
       workout_sessions WHERE user_id IN (uid, partner_id)
         AND session_date = day AND completed = true
       → dashboardData.dailyWins[day]
4. applyColorTakeover()
5. renderDashboard()
```

Error handling: wrap in try/catch, `console.warn`, still call `renderDashboard()` in finally so partial data renders gracefully.

### `applyColorTakeover()`

New function called after leaderboard fetch:

```javascript
function applyColorTakeover() {
  const myRow = dashboardData.leaderboard.find(r => r.user_id === currentUser.id);
  const theirRow = dashboardData.leaderboard.find(r => r.user_id !== currentUser.id);
  const myPts = myRow?.total_points ?? 0;
  const theirPts = theirRow?.total_points ?? 0;

  let winnerColor;
  if (myPts >= theirPts) {
    winnerColor = dashboardData.userTargets?.theme_color || '#18C26A';
  } else {
    winnerColor = dashboardData.partnerTargets?.theme_color || '#18C26A';
  }

  document.documentElement.style.setProperty('--accent', winnerColor);
  document.documentElement.style.setProperty('--accent-dim', winnerColor + '1f');
  document.documentElement.style.setProperty('--accent2', winnerColor + 'cc');
  document.documentElement.style.setProperty('--accent-glow', winnerColor + '33');
}
```

Tie goes to current user's color. If no leaderboard data, defaults to `#18C26A` (original green).

### `renderDashboard()` — full replacement

Renders all 7 rings, competition scoreboard, medals. Pulls from `dashboardData`. No network calls.

Ring fill calculation (circumference = 2π × 28 ≈ 175.9):
```javascript
const pct = Math.min((actual ?? 0) / target, 1);
circle.style.strokeDasharray = `${(pct * 175.9).toFixed(1)} 175.9`;
```

### `refreshDashboard()` — replace body

Full `loadDashboard()` re-run (not just health). Toast on complete:
- Today's snapshot found: `"Health data refreshed ✓"`
- No snapshot for today: `"No new data yet"`

---

## CSS Additions

New classes needed (added to existing `/* ── Dashboard ── */` block):

- `.dash-date` — date string in header, muted color, mono font
- `.dash-rings-row` — flex row for ring cards (reuses `.dash-rings` pattern, may alias)
- `.dash-comp-bar` — the points progress bar track + fill
- `.dash-comp-stats` — 3-cell stats row grid
- `.dash-comp-stat-cell` — individual stat cell
- `.dash-day-dots` — flex row for 7 day dots
- `.dash-day-dot` — individual dot (10px circle)
- `.dash-day-dot.split` — pseudo-element split for both-trained days

---

## What Is Not Changing

- Tracker view HTML, CSS, or workout logging logic — untouched
- `competition_leaderboard` view — queried as-is, not altered
- `getProgram()`, `getPhase()`, `buildDayHTML()` — untouched
- Medals section HTML — untouched
- "Today's Workout →" CTA — untouched
- `showView()` — untouched (already calls `loadDashboard()` for dashboard)
- Existing `skipAuth()`, `onAuthStateChange`, init IIFE entry points — untouched (already route to dashboard)

---

## Future Scope (not in this build)

- Smart scale sync: `weight_lbs`, `bmi`, `skeletal_muscle_pct`, `body_fat_pct` columns on `health_snapshots`
- Native Apple Health connector (vs current manual Shortcut trigger)
- Monetization / multi-user beyond partner pair

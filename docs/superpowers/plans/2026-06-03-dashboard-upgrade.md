# Dashboard Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the dashboard with 7 health rings (Activity + Nutrition sections), an Option A competition scoreboard (points, progress bar, stats row, day dots), dynamic CSS color takeover driven by the leaderboard winner, and the supporting DB columns for Apple Health goals and nutrition macro targets.

**Architecture:** Ten tasks — two Supabase migrations, HTML/CSS changes to `view-dashboard` and the profile modal, and JS function replacements for `loadDashboard` / `renderDashboard` / `refreshDashboard` plus a new `applyColorTakeover`. All code changes are in the single file `tandem.html`. The `dashboardData` global is extended from 3 keys to 6. Existing ring card IDs and the medals/CTA section are untouched.

**Tech Stack:** Vanilla JS, Supabase JS client (`sb`), SVG rings via `stroke-dasharray`, CSS custom properties (`--accent` etc.), single HTML file

---

## Key context

- `tandem.html` is a single-file app (~4150 lines). All JS/CSS/HTML lives in it.
- Dashboard HTML: `view-dashboard` div, lines ~1067–1161.
- Dashboard CSS: `/* ── Dashboard ── */` block, lines ~635–669.
- Dashboard JS: `dashboardData`, `loadDashboard()`, `refreshDashboard()`, `renderDashboard()`, lines ~3628–3762.
- Profile modal nutrition section HTML: lines ~1394–1412. `saveProfileNutrition()`: lines ~3918–3929.
- `competition_leaderboard` view columns: `user_id`, `name`, `theme_color` (broken — DO NOT USE; fetch from `users` table instead), `sessions_completed`, `prs_earned`, `current_streak`, `total_points`.
- Supabase client is global `sb`. Auth user is `currentUser`. LocalStorage wrapper is `LS`.

---

## Task 1: DB Migration — health_snapshots goal columns

**Files:** Supabase DB via MCP (no file edit needed)

- [ ] **Step 1: Apply migration**

Run `mcp__supabase__apply_migration` with name `add_health_snapshots_goal_columns` and SQL:
```sql
ALTER TABLE health_snapshots
  ADD COLUMN IF NOT EXISTS active_calories_goal integer,
  ADD COLUMN IF NOT EXISTS sleep_goal_hours numeric,
  ADD COLUMN IF NOT EXISTS steps_goal integer;
```

- [ ] **Step 2: Verify**

Run `mcp__supabase__execute_sql`:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'health_snapshots'
  AND column_name IN ('active_calories_goal','sleep_goal_hours','steps_goal');
```
Expected: 3 rows.

---

## Task 2: DB Migration — users nutrition target columns

**Files:** Supabase DB via MCP (no file edit needed)

- [ ] **Step 1: Apply migration**

Run `mcp__supabase__apply_migration` with name `add_users_nutrition_target_columns` and SQL:
```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS daily_carbs_target_g numeric,
  ADD COLUMN IF NOT EXISTS daily_fat_target_g numeric;
```

- [ ] **Step 2: Verify**

Run `mcp__supabase__execute_sql`:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('daily_carbs_target_g','daily_fat_target_g');
```
Expected: 2 rows.

---

## Task 3: Dashboard HTML — header date, 7 rings, Option A competition scoreboard

**Files:**
- Modify: `tandem.html` lines 1072–1144

Replace lines 1072–1144 (from `<div class="dash-title">Today</div>` through the closing `</div>` of `.dash-competition`) with the block below. Line 1071 (`<div class="dash-header">`) and everything from line 1145 onward remain unchanged.

- [ ] **Step 1: Replace lines 1072–1144**

New content:

```html
      <div class="dash-title">Today</div>
      <span class="dash-date" id="dashDate"></span>
      <button id="dashRefreshBtn" class="dash-refresh-btn" onclick="refreshDashboard()" title="Refresh health data">
        <span>↻</span>
      </button>
    </div>

    <!-- Health Rings — Activity -->
    <span class="dash-section-label" id="dashActivityLabel">Activity</span>
    <div class="dash-rings">
      <div class="dash-ring-card" id="dashRingCal">
        <svg class="dash-ring-svg" viewBox="0 0 68 68">
          <circle class="dash-ring-track" cx="34" cy="34" r="28"/>
          <circle class="dash-ring-circle" cx="34" cy="34" r="28" stroke-dasharray="0 175.9"/>
        </svg>
        <div class="dash-ring-val" id="dashRingCalVal">—</div>
        <div class="dash-ring-label">Active Cal</div>
      </div>
      <div class="dash-ring-card" id="dashRingSleep">
        <svg class="dash-ring-svg" viewBox="0 0 68 68">
          <circle class="dash-ring-track" cx="34" cy="34" r="28"/>
          <circle class="dash-ring-circle" cx="34" cy="34" r="28" stroke-dasharray="0 175.9" style="stroke:#4a9eff;"/>
        </svg>
        <div class="dash-ring-val" id="dashRingSleepVal">—</div>
        <div class="dash-ring-label">Sleep</div>
      </div>
      <div class="dash-ring-card" id="dashRingSteps">
        <svg class="dash-ring-svg" viewBox="0 0 68 68">
          <circle class="dash-ring-track" cx="34" cy="34" r="28"/>
          <circle class="dash-ring-circle" cx="34" cy="34" r="28" stroke-dasharray="0 175.9" style="stroke:#38d9c0;"/>
        </svg>
        <div class="dash-ring-val" id="dashRingStepsVal">—</div>
        <div class="dash-ring-label">Steps</div>
      </div>
    </div>

    <!-- Health Rings — Nutrition -->
    <span class="dash-section-label">Nutrition</span>
    <div class="dash-rings">
      <div class="dash-ring-card" id="dashRingDietCal">
        <svg class="dash-ring-svg" viewBox="0 0 68 68">
          <circle class="dash-ring-track" cx="34" cy="34" r="28"/>
          <circle class="dash-ring-circle" cx="34" cy="34" r="28" stroke-dasharray="0 175.9" style="stroke:#FFB020;"/>
        </svg>
        <div class="dash-ring-val" id="dashRingDietCalVal">—</div>
        <div class="dash-ring-label">Cal</div>
      </div>
      <div class="dash-ring-card" id="dashRingProtein">
        <svg class="dash-ring-svg" viewBox="0 0 68 68">
          <circle class="dash-ring-track" cx="34" cy="34" r="28"/>
          <circle class="dash-ring-circle" cx="34" cy="34" r="28" stroke-dasharray="0 175.9" style="stroke:#e854a0;"/>
        </svg>
        <div class="dash-ring-val" id="dashRingProteinVal">—</div>
        <div class="dash-ring-label">Protein</div>
      </div>
      <div class="dash-ring-card" id="dashRingCarbs">
        <svg class="dash-ring-svg" viewBox="0 0 68 68">
          <circle class="dash-ring-track" cx="34" cy="34" r="28"/>
          <circle class="dash-ring-circle" cx="34" cy="34" r="28" stroke-dasharray="0 175.9" style="stroke:#a78bfa;"/>
        </svg>
        <div class="dash-ring-val" id="dashRingCarbsVal">—</div>
        <div class="dash-ring-label">Carbs</div>
      </div>
      <div class="dash-ring-card" id="dashRingFat">
        <svg class="dash-ring-svg" viewBox="0 0 68 68">
          <circle class="dash-ring-track" cx="34" cy="34" r="28"/>
          <circle class="dash-ring-circle" cx="34" cy="34" r="28" stroke-dasharray="0 175.9" style="stroke:#fb923c;"/>
        </svg>
        <div class="dash-ring-val" id="dashRingFatVal">—</div>
        <div class="dash-ring-label">Fat</div>
      </div>
    </div>

    <!-- Competition -->
    <span class="dash-section-label">This Week</span>
    <div class="dash-competition">
      <div class="dash-comp-names">
        <div class="dash-comp-name" id="dashCompMyName">You</div>
        <div class="dash-comp-vs">vs</div>
        <div class="dash-comp-name dash-comp-name-right" id="dashCompTheirName">Partner</div>
      </div>
      <div class="dash-comp-pts-row">
        <div class="dash-comp-pts" id="dashCompMyPts">— pts</div>
        <div></div>
        <div class="dash-comp-pts dash-comp-pts-right" id="dashCompTheirPts">— pts</div>
      </div>
      <div class="dash-comp-bar-track">
        <div class="dash-comp-bar-fill" id="dashCompBarFill" style="width:50%;"></div>
      </div>
      <div class="dash-comp-stats">
        <div class="dash-comp-stat-cell">
          <div class="dash-comp-stat-label">Sessions</div>
          <div class="dash-comp-stat-vals">
            <span class="dash-comp-stat-mine" id="dashStatSessionsMine">—</span>
            <span class="dash-comp-stat-sep">/</span>
            <span class="dash-comp-stat-theirs" id="dashStatSessionsTheirs">—</span>
          </div>
        </div>
        <div class="dash-comp-stat-cell">
          <div class="dash-comp-stat-label">Streak</div>
          <div class="dash-comp-stat-vals">
            <span class="dash-comp-stat-mine" id="dashStatStreakMine">—</span>
            <span class="dash-comp-stat-sep">/</span>
            <span class="dash-comp-stat-theirs" id="dashStatStreakTheirs">—</span>
          </div>
        </div>
        <div class="dash-comp-stat-cell">
          <div class="dash-comp-stat-label">PRs</div>
          <div class="dash-comp-stat-vals">
            <span class="dash-comp-stat-mine" id="dashStatPRsMine">—</span>
            <span class="dash-comp-stat-sep">/</span>
            <span class="dash-comp-stat-theirs" id="dashStatPRsTheirs">—</span>
          </div>
        </div>
      </div>
      <div class="dash-day-dots">
        <div class="dash-day-dot-col"><span class="dash-day-dot" id="dashDot0"></span><span class="dash-day-label">M</span></div>
        <div class="dash-day-dot-col"><span class="dash-day-dot" id="dashDot1"></span><span class="dash-day-label">T</span></div>
        <div class="dash-day-dot-col"><span class="dash-day-dot" id="dashDot2"></span><span class="dash-day-label">W</span></div>
        <div class="dash-day-dot-col"><span class="dash-day-dot" id="dashDot3"></span><span class="dash-day-label">T</span></div>
        <div class="dash-day-dot-col"><span class="dash-day-dot" id="dashDot4"></span><span class="dash-day-label">F</span></div>
        <div class="dash-day-dot-col"><span class="dash-day-dot" id="dashDot5"></span><span class="dash-day-label">S</span></div>
        <div class="dash-day-dot-col"><span class="dash-day-dot" id="dashDot6"></span><span class="dash-day-label">S</span></div>
      </div>
    </div>
```

- [ ] **Step 2: Commit**

```bash
git add tandem.html
git commit -m "feat: dashboard HTML — 7 rings + Option A competition scoreboard"
```

---

## Task 4: Profile modal — add Carbs and Fat inputs

**Files:**
- Modify: `tandem.html` lines ~1410–1411 (after the closing `</div>` of `.profile-input-row.three`)

The nutrition section currently has one `.profile-input-row.three` row (Calories, Protein, Water). Insert a second row for Carbs/Fat immediately after it (before the `<button>` on line ~1411).

- [ ] **Step 1: Insert Carbs/Fat row after the `.profile-input-row.three` closing tag**

Find this exact line (approximately line 1410):
```html
      </div>
      <button class="profile-save-btn" onclick="saveProfileNutrition()">Save Nutrition</button>
```

Insert between `</div>` and `<button>`:
```html
      <div class="profile-input-row" style="margin-top:8px;">
        <div class="profile-input-group">
          <label class="profile-input-label">Carbs (g)</label>
          <input type="number" id="profileCarbsInput" placeholder="250" class="modal-input" style="background:var(--s2);border:1px solid var(--border2);border-radius:8px;padding:8px;color:var(--text);font-family:var(--font-mono);font-size:13px;width:100%;box-sizing:border-box;">
        </div>
        <div class="profile-input-group">
          <label class="profile-input-label">Fat (g)</label>
          <input type="number" id="profileFatInput" placeholder="65" class="modal-input" style="background:var(--s2);border:1px solid var(--border2);border-radius:8px;padding:8px;color:var(--text);font-family:var(--font-mono);font-size:13px;width:100%;box-sizing:border-box;">
        </div>
      </div>
```

- [ ] **Step 2: Commit**

```bash
git add tandem.html
git commit -m "feat: profile modal — add carbs/fat target inputs"
```

---

## Task 5: Dashboard CSS — add new classes

**Files:**
- Modify: `tandem.html` — the `/* ── Dashboard ── */` block, which ends at approximately line 669 with `.dash-cta:hover{...}`

Append the following CSS **before** the closing `</style>` tag (or after the existing `.dash-cta:hover` rule, which is the last dashboard rule):

- [ ] **Step 1: Add new CSS after `.dash-cta:hover` rule (~line 669)**

```css
.dash-date{font-family:var(--font-mono);font-size:12px;color:var(--muted2);flex:1;text-align:center;}
.dash-comp-names{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;margin-bottom:2px;}
.dash-comp-name{font-family:var(--font-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted2);}
.dash-comp-name-right{text-align:right;}
.dash-comp-vs{font-family:var(--font-display);font-size:14px;color:var(--muted2);text-align:center;}
.dash-comp-pts-row{display:grid;grid-template-columns:1fr auto 1fr;margin-bottom:10px;}
.dash-comp-pts{font-family:var(--font-display);font-size:28px;line-height:1;}
.dash-comp-pts-right{text-align:right;}
.dash-comp-bar-track{height:6px;background:var(--border2);border-radius:3px;margin-bottom:12px;overflow:hidden;}
.dash-comp-bar-fill{height:100%;border-radius:3px;background:var(--accent);transition:width .4s ease;}
.dash-comp-stats{display:grid;grid-template-columns:1fr 1fr 1fr;margin-bottom:12px;gap:4px;}
.dash-comp-stat-cell{text-align:center;background:var(--bg);border-radius:10px;padding:8px 4px;}
.dash-comp-stat-label{font-family:var(--font-mono);font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted2);margin-bottom:4px;}
.dash-comp-stat-vals{display:flex;align-items:baseline;justify-content:center;gap:2px;}
.dash-comp-stat-mine{font-family:var(--font-display);font-size:18px;color:var(--text);}
.dash-comp-stat-theirs{font-family:var(--font-display);font-size:14px;color:var(--muted2);}
.dash-comp-stat-sep{font-size:10px;color:var(--muted2);}
.dash-day-dots{display:flex;justify-content:space-between;}
.dash-day-dot-col{display:flex;flex-direction:column;align-items:center;gap:4px;}
.dash-day-dot{width:10px;height:10px;border-radius:50%;background:var(--border2);display:inline-block;}
.dash-day-label{font-family:var(--font-mono);font-size:8px;color:var(--muted2);}
```

- [ ] **Step 2: Commit**

```bash
git add tandem.html
git commit -m "feat: dashboard CSS — competition scoreboard and day dot styles"
```

---

## Task 6: JS — extend dashboardData and add applyColorTakeover()

**Files:**
- Modify: `tandem.html` — find `const dashboardData = { health: null, competition: null, medals: [] };` (~line 3628)

- [ ] **Step 1: Replace dashboardData declaration**

Find:
```javascript
const dashboardData = { health: null, competition: null, medals: [] };
```

Replace with:
```javascript
const dashboardData = {
  health: null,        // today's health_snapshots row
  userTargets: null,   // users row for current user (targets + theme_color)
  partnerTargets: null,// users row for partner (theme_color + display_name)
  leaderboard: [],     // competition_leaderboard rows (up to 2)
  dailyWins: {},       // { 'YYYY-MM-DD': 'mine' | 'theirs' | 'both' }
  medals: []
};
```

- [ ] **Step 2: Add applyColorTakeover() immediately after dashboardData**

Insert this function after the `dashboardData` declaration (before `async function loadDashboard()`):

```javascript
function applyColorTakeover() {
  const myRow = dashboardData.leaderboard.find(r => r.user_id === currentUser?.id);
  const theirRow = dashboardData.leaderboard.find(r => r.user_id !== currentUser?.id);
  const myPts = myRow?.total_points ?? 0;
  const theirPts = theirRow?.total_points ?? 0;
  const winnerColor = myPts >= theirPts
    ? (dashboardData.userTargets?.theme_color || '#18C26A')
    : (dashboardData.partnerTargets?.theme_color || '#18C26A');
  document.documentElement.style.setProperty('--accent', winnerColor);
  document.documentElement.style.setProperty('--accent-dim', winnerColor + '1f');
  document.documentElement.style.setProperty('--accent2', winnerColor + 'cc');
  document.documentElement.style.setProperty('--accent-glow', winnerColor + '33');
}
```

- [ ] **Step 3: Commit**

```bash
git add tandem.html
git commit -m "feat: extend dashboardData, add applyColorTakeover()"
```

---

## Task 7: JS — replace loadDashboard()

**Files:**
- Modify: `tandem.html` — find `async function loadDashboard()` (~line 3630). Replace the entire function body through its closing `}` (~line 3678).

- [ ] **Step 1: Replace loadDashboard() body**

Find `async function loadDashboard() {` and replace the entire function (from the opening `{` through its closing `}`) with:

```javascript
async function loadDashboard() {
  const btn = document.getElementById('dashRefreshBtn');
  if (btn) btn.disabled = !currentUser;
  if (!currentUser) { renderDashboard(); return; }
  if (btn) { btn.classList.add('spinning'); btn.disabled = true; }
  try {
    const uid = currentUser.id;
    const today = new Date().toISOString().split('T')[0];

    // 1. Today's health snapshot
    const { data: snap } = await sb.from('health_snapshots')
      .select('*').eq('user_id', uid).eq('snapshot_date', today).maybeSingle();
    dashboardData.health = snap || null;

    // 2. Current user targets + partner_id
    const { data: userRow } = await sb.from('users')
      .select('partner_id, display_name, theme_color, daily_calories_target, daily_protein_target_g, daily_carbs_target_g, daily_fat_target_g')
      .eq('id', uid).maybeSingle();
    dashboardData.userTargets = userRow || null;

    if (userRow?.partner_id) {
      const pid = userRow.partner_id;

      // 3a. Leaderboard rows (use for points/stats; do NOT use theme_color from this view — it's broken)
      const { data: lb } = await sb.from('competition_leaderboard')
        .select('user_id, name, sessions_completed, prs_earned, current_streak, total_points')
        .in('user_id', [uid, pid]);
      dashboardData.leaderboard = lb || [];

      // 3b. Partner display info
      const { data: partnerRow } = await sb.from('users')
        .select('display_name, theme_color').eq('id', pid).maybeSingle();
      dashboardData.partnerTargets = partnerRow || null;

      // 3c. Weekly sessions for day dots
      const dayOfWeek = new Date().getDay(); // 0=Sun
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date();
      monday.setDate(new Date().getDate() - mondayOffset);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const { data: sessions } = await sb.from('workout_sessions')
        .select('user_id, session_date')
        .in('user_id', [uid, pid])
        .gte('session_date', monday.toISOString().split('T')[0])
        .lte('session_date', sunday.toISOString().split('T')[0])
        .eq('completed', true);
      dashboardData.dailyWins = {};
      (sessions || []).forEach(s => {
        const key = s.session_date;
        const isMine = s.user_id === uid;
        const val = isMine ? 'mine' : 'theirs';
        if (!dashboardData.dailyWins[key]) {
          dashboardData.dailyWins[key] = val;
        } else if (dashboardData.dailyWins[key] !== val) {
          dashboardData.dailyWins[key] = 'both';
        }
      });
    } else {
      dashboardData.leaderboard = [];
      dashboardData.partnerTargets = null;
      dashboardData.dailyWins = {};
    }

    // 4. Medals — 3 most recent
    const { data: medals } = await sb.from('medals')
      .select('*').eq('user_id', uid)
      .order('earned_at', { ascending: false }).limit(3);
    dashboardData.medals = medals || [];
  } catch(e) {
    console.warn('Dashboard load error:', e);
  } finally {
    applyColorTakeover();
    renderDashboard();
    if (btn) { btn.classList.remove('spinning'); btn.disabled = false; }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add tandem.html
git commit -m "feat: replace loadDashboard() — sequential fetches, daily wins, targets"
```

---

## Task 8: JS — replace refreshDashboard()

**Files:**
- Modify: `tandem.html` — find `async function refreshDashboard()` (~line 3680). Replace entire function.

- [ ] **Step 1: Replace refreshDashboard() body**

Find `async function refreshDashboard() {` and replace the entire function with:

```javascript
async function refreshDashboard() {
  const btn = document.getElementById('dashRefreshBtn');
  if (!currentUser) return;
  if (btn) { btn.classList.add('spinning'); btn.disabled = true; }
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data: snap } = await sb.from('health_snapshots')
      .select('*').eq('user_id', currentUser.id).eq('snapshot_date', today).maybeSingle();
    dashboardData.health = snap || null;
    applyColorTakeover();
    renderDashboard();
    showToast(snap ? 'Health data refreshed ✓' : 'No new data yet');
  } catch(e) {
    console.warn('Refresh error:', e);
    showToast('Refresh failed');
  }
  if (btn) { btn.classList.remove('spinning'); btn.disabled = false; }
}
```

- [ ] **Step 2: Commit**

```bash
git add tandem.html
git commit -m "feat: replace refreshDashboard() — today-specific query, full re-render"
```

---

## Task 9: JS — replace renderDashboard()

**Files:**
- Modify: `tandem.html` — find `function renderDashboard()` (~line 3699). Replace entire function.

- [ ] **Step 1: Replace renderDashboard() body**

Find `function renderDashboard() {` and replace the entire function with:

```javascript
function renderDashboard() {
  const h = dashboardData.health;
  const ut = dashboardData.userTargets;
  const circ = 175.9; // 2π × r=28

  // Date in header
  const dateEl = document.getElementById('dashDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Activity label — sync pending state
  const actLabel = document.getElementById('dashActivityLabel');
  if (actLabel) actLabel.textContent = h ? 'Activity' : 'Activity — Sync pending';

  // 7 Rings
  const ringDefs = [
    { cardId: 'dashRingCal',     valId: 'dashRingCalVal',     val: h?.active_calories_kcal,  target: h?.active_calories_goal ?? 500,  fmt: v => v != null ? Math.round(v).toLocaleString() : '—' },
    { cardId: 'dashRingSleep',   valId: 'dashRingSleepVal',   val: h?.sleep_total_hours,     target: h?.sleep_goal_hours ?? 8,        fmt: v => v != null ? (+v).toFixed(1) + 'h' : '—' },
    { cardId: 'dashRingSteps',   valId: 'dashRingStepsVal',   val: h?.steps,                 target: h?.steps_goal ?? 8000,           fmt: v => v != null ? (v >= 1000 ? (v/1000).toFixed(1)+'k' : Math.round(v).toString()) : '—' },
    { cardId: 'dashRingDietCal', valId: 'dashRingDietCalVal', val: h?.dietary_calories_kcal, target: ut?.daily_calories_target ?? 2000, fmt: v => v != null ? Math.round(v).toLocaleString() : '—' },
    { cardId: 'dashRingProtein', valId: 'dashRingProteinVal', val: h?.dietary_protein_g,     target: ut?.daily_protein_target_g ?? 150, fmt: v => v != null ? Math.round(v)+'g' : '—' },
    { cardId: 'dashRingCarbs',   valId: 'dashRingCarbsVal',   val: h?.dietary_carbs_g,       target: ut?.daily_carbs_target_g ?? 250,   fmt: v => v != null ? Math.round(v)+'g' : '—' },
    { cardId: 'dashRingFat',     valId: 'dashRingFatVal',     val: h?.dietary_fat_g,         target: ut?.daily_fat_target_g ?? 65,      fmt: v => v != null ? Math.round(v)+'g' : '—' },
  ];
  ringDefs.forEach(r => {
    const card = document.getElementById(r.cardId);
    if (!card) return;
    const pct = r.val != null ? Math.min(r.val / r.target, 1) : 0;
    const circle = card.querySelector('.dash-ring-circle');
    if (circle) circle.style.strokeDasharray = `${(pct * circ).toFixed(1)} ${circ}`;
    const valEl = document.getElementById(r.valId);
    if (valEl) valEl.textContent = r.fmt(r.val);
  });

  // Competition scoreboard
  const lb = dashboardData.leaderboard;
  const myLbRow = lb.find(r => r.user_id === currentUser?.id);
  const theirLbRow = lb.find(r => r.user_id !== currentUser?.id);
  const myPts = myLbRow?.total_points ?? 0;
  const theirPts = theirLbRow?.total_points ?? 0;
  const hasPartner = dashboardData.partnerTargets != null;
  const iWin = myPts >= theirPts;

  const myColor = ut?.theme_color || '#18C26A';
  const theirColor = dashboardData.partnerTargets?.theme_color || '#888888';

  const myNameEl = document.getElementById('dashCompMyName');
  const theirNameEl = document.getElementById('dashCompTheirName');
  const myPtsEl = document.getElementById('dashCompMyPts');
  const theirPtsEl = document.getElementById('dashCompTheirPts');
  const barFill = document.getElementById('dashCompBarFill');

  if (myNameEl) myNameEl.textContent = myLbRow?.name || ut?.display_name || currentUser?.email?.split('@')[0] || 'You';
  if (theirNameEl) theirNameEl.textContent = theirLbRow?.name || dashboardData.partnerTargets?.display_name || 'Partner';

  if (!hasPartner) {
    if (myPtsEl) { myPtsEl.textContent = '— pts'; myPtsEl.style.color = ''; }
    if (theirPtsEl) { theirPtsEl.textContent = '— pts'; theirPtsEl.style.color = ''; }
    if (barFill) { barFill.style.width = '50%'; barFill.style.background = ''; }
    ['dashStatSessionsMine','dashStatSessionsTheirs','dashStatStreakMine','dashStatStreakTheirs','dashStatPRsMine','dashStatPRsTheirs'].forEach(id => {
      const el = document.getElementById(id); if (el) el.textContent = '—';
    });
  } else {
    if (myPtsEl) {
      myPtsEl.textContent = myPts + ' pts';
      myPtsEl.style.color = iWin ? myColor : 'var(--muted2)';
    }
    if (theirPtsEl) {
      theirPtsEl.textContent = theirPts + ' pts';
      theirPtsEl.style.color = !iWin ? theirColor : 'var(--muted2)';
    }
    const total = myPts + theirPts;
    const barPct = total > 0 ? (iWin ? myPts / total : theirPts / total) * 100 : 50;
    if (barFill) {
      barFill.style.width = barPct + '%';
      barFill.style.background = iWin ? myColor : theirColor;
    }

    // Stats — winner's value appears larger/white, loser's smaller/muted
    const setStatPair = (mineId, theirsId, mineVal, theirsVal) => {
      const mineEl = document.getElementById(mineId);
      const theirsEl = document.getElementById(theirsId);
      if (mineEl) {
        mineEl.textContent = mineVal ?? '—';
        mineEl.style.color = iWin ? 'var(--text)' : 'var(--muted2)';
        mineEl.style.fontSize = iWin ? '18px' : '14px';
      }
      if (theirsEl) {
        theirsEl.textContent = theirsVal ?? '—';
        theirsEl.style.color = !iWin ? 'var(--text)' : 'var(--muted2)';
        theirsEl.style.fontSize = !iWin ? '18px' : '14px';
      }
    };
    setStatPair('dashStatSessionsMine','dashStatSessionsTheirs', myLbRow?.sessions_completed, theirLbRow?.sessions_completed);
    setStatPair('dashStatStreakMine','dashStatStreakTheirs', myLbRow?.current_streak, theirLbRow?.current_streak);
    setStatPair('dashStatPRsMine','dashStatPRsTheirs', myLbRow?.prs_earned, theirLbRow?.prs_earned);
  }

  // Day dots
  const dayOfWeek = new Date().getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date();
  monday.setDate(new Date().getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);
  ['dashDot0','dashDot1','dashDot2','dashDot3','dashDot4','dashDot5','dashDot6'].forEach((dotId, i) => {
    const dotEl = document.getElementById(dotId);
    if (!dotEl) return;
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = d.toISOString().split('T')[0];
    const outcome = dashboardData.dailyWins[key];
    if (outcome === 'mine') {
      dotEl.style.background = myColor;
      dotEl.style.backgroundImage = '';
    } else if (outcome === 'theirs') {
      dotEl.style.background = theirColor;
      dotEl.style.backgroundImage = '';
    } else if (outcome === 'both') {
      dotEl.style.background = 'transparent';
      dotEl.style.backgroundImage = `linear-gradient(90deg, ${myColor} 50%, ${theirColor} 50%)`;
    } else {
      dotEl.style.background = 'var(--border2)';
      dotEl.style.backgroundImage = '';
    }
  });

  // Medals
  const medalRow = document.getElementById('dashMedalRow');
  if (medalRow) {
    if (dashboardData.medals.length) {
      medalRow.innerHTML = dashboardData.medals.map(m =>
        `<div class="dash-medal-chip"><span class="dash-medal-icon">${svgIcon('medal')}</span>${m.name || 'Medal'}</div>`
      ).join('');
    } else {
      medalRow.innerHTML = `<div style="font-size:12px;color:var(--muted);padding:6px 0;">No medals yet — keep going ${svgIcon('medal')}</div>`;
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add tandem.html
git commit -m "feat: replace renderDashboard() — 7 rings, scoreboard, day dots, color takeover"
```

---

## Task 10: JS — update openProfileModal() and saveProfileNutrition()

**Files:**
- Modify: `tandem.html` — `openProfileModal()` (nutrition population block, ~line 3814) and `saveProfileNutrition()` (~line 3918)

- [ ] **Step 1: Add carbs/fat population to openProfileModal()**

Find this block inside `openProfileModal()` (approximately lines 3814–3820):
```javascript
  const nc = document.getElementById('profileCalInput');
  if (nc) nc.value = profile.calories || '';
  const np = document.getElementById('profileProteinInput');
  if (np) np.value = profile.protein || '';
  const nw = document.getElementById('profileWaterInput');
  if (nw) nw.value = profile.water || '';
```

Replace with:
```javascript
  const nc = document.getElementById('profileCalInput');
  if (nc) nc.value = profile.calories || '';
  const np = document.getElementById('profileProteinInput');
  if (np) np.value = profile.protein || '';
  const nw = document.getElementById('profileWaterInput');
  if (nw) nw.value = profile.water || '';
  const ncarbs = document.getElementById('profileCarbsInput');
  if (ncarbs) ncarbs.value = profile.carbs || '';
  const nfat = document.getElementById('profileFatInput');
  if (nfat) nfat.value = profile.fat || '';
```

- [ ] **Step 2: Replace saveProfileNutrition()**

Find `function saveProfileNutrition() {` and replace the entire function with:

```javascript
function saveProfileNutrition() {
  const calories = parseInt(document.getElementById('profileCalInput')?.value) || 0;
  const protein = parseInt(document.getElementById('profileProteinInput')?.value) || 0;
  const water = parseInt(document.getElementById('profileWaterInput')?.value) || 0;
  const carbs = parseInt(document.getElementById('profileCarbsInput')?.value) || 0;
  const fat = parseInt(document.getElementById('profileFatInput')?.value) || 0;
  const profile = LS.get('tandem_profile') || {};
  profile.calories = calories; profile.protein = protein; profile.water = water;
  profile.carbs = carbs; profile.fat = fat;
  LS.set('tandem_profile', profile);
  if (currentUser) {
    sb.from('users').upsert({
      id: currentUser.id,
      daily_calories_target: calories || null,
      daily_protein_target_g: protein || null,
      daily_water_target_oz: water || null,
      daily_carbs_target_g: carbs || null,
      daily_fat_target_g: fat || null
    }, { onConflict: 'id' });
  }
  showToast('Nutrition targets saved');
}
```

- [ ] **Step 3: Commit**

```bash
git add tandem.html
git commit -m "feat: profile modal — save/load carbs and fat targets"
```

---

## Verification

After all tasks complete, open the app in the browser and verify:

- [ ] Dashboard header shows today's date (e.g. "Jun 3") between title and refresh button
- [ ] Activity section shows 3 ring cards (Active Cal, Sleep, Steps). With no health snapshot for today, label reads "Activity — Sync pending" and all rings show 0% fill
- [ ] Nutrition section shows 4 ring cards (Cal in gold, Protein in pink, Carbs in purple, Fat in orange)
- [ ] Competition card shows names row, "— pts / — pts" (no partner), progress bar, stats row with dashes, and 7 day dots in grey
- [ ] Profile modal → Nutrition Targets section shows 5 inputs (Calories, Protein, Water on first row; Carbs, Fat on second row). Entering values and clicking Save writes them to Supabase `users` table
- [ ] With a user who has a partner: competition card shows real points, colored winner, progress bar skewed to winner's side, and stats with winner's values larger
- [ ] `--accent` CSS variable is set to the winning user's `theme_color` (check via DevTools → `document.documentElement.style.getPropertyValue('--accent')`)

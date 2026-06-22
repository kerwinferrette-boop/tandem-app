TANDEM — Couples & Friends Fitness Competition Web App
A competitive fitness platform engineered for couples (or two people, really) to track, compete, and progress together through science-backed workout programming and head-to-head leaderboard dynamics.
Current Status: Soft launch — two active users (Kerwin & Dani). Single-file architecture on Netlify; Supabase backend.

Table of Contents

Core Identity
Features
Tech Stack
Architecture

Data Model
Health Data Pipeline
Coaching Layer


Current Implementation State
Known Blockers & Roadmap
Build Sequencing
Getting Started


Core Identity
Tandem is not a generic fitness tracker. It exists at the intersection of three inseparable pillars:
1. Couples Head-to-Head Competition

Real-time leaderboard scoring tied to workout completion, volume, and rep PRs
Color takeover UI — when one partner leads, their accent color dominates the interface
Couples-only medals requiring both partners to achieve milestones together
Weekly streak displays showing consistency differentials

2. Gamification

35+ medal system across categories: strength, body composition, streak consistency, and couples achievements
Consistency streaks — rewarding unbroken weekly workout adherence over individual performance variance
Points system — volume lifted, PRs hit, and health metrics (sleep quality, HRV, steps) feed live scoring
Progressive visual feedback — badges, color shifts, and achievement animations reinforce progress

3. Health Data as Competition Fuel
Health metrics (sleep, HRV, steps, nutrition, active calories, weight, body fat %) are not decorative. They drive:

Readiness scoring that affects recommended workout intensity
Recovery state assessment (HRV + sleep → volume/intensity adjustment)
Competitive scoring — partners compete on macro adherence, sleep consistency, and activity level
Weekly planning — coaching engine adapts programming based on prior week's recovery data

Any feature ignoring these three pillars is wrong for Tandem.

Features
Implemented & Active

Workout Logging — exercise tracking with sets, reps, weight, RPE; 1RM estimation via Epley formula
Program Selection — 4-day split templates with periodized phases (strength, hypertrophy, power)
Progressive Overload Tracking — per-exercise recommendations based on session performance
Plate Calculator — barbell loading helper
Workout History Modal — past session review with filtering
Onboarding Flow — captures user goal, biometrics (height, weight, age), sex, experience level, program length, days/week
Basic Dashboard — activity rings (skeleton), nutrition macros display, medals row
Authentication — Supabase JWT-based login/signup

Partially Built (Needs Wiring)

Dashboard as Entry Point — should be home after auth, not tracker
Competition Leaderboard — structure exists; UI integration incomplete
Color Takeover UX — logic built; CSS integration pending
Health Rings — rings render as decorative; not connected to competition scoring

Planned & Blocked

Health Data Ingestion — Apple Shortcut → Edge Function pipeline (schema ready; automation not live)
AI Coaching Layer — per-user Claude instance reading Apple Health + writing back to Supabase
Adaptive Programming — recovery state adjustment engine (research foundation complete; implementation pending)
Google Calendar Sync — weekly workout scheduling via coaching engine
Couples Milestones — notification & medal system for synchronized achievements
Streak Evaluation — pg_cron scheduled job for daily consistency tracking


Tech Stack
LayerTechnologyFrontendSingle-file HTML/CSS/JS (tandem.html, ~2,730 lines)State ManagementVanilla JS + localStorage (persistent session cache)StylingTailwind CSSBackendSupabase (Postgres 15)AuthenticationSupabase Auth (JWT)Health DataiOS Shortcuts API → Apple Health → Supabase Edge FunctionsCoachingClaude API (via iOS app) + Apple Health native readHostingNetlify (static site deployment)Build ToolClaude Code (primary AI-assisted development)

Architecture
Data Model
users Table
User profile, program config, biometrics, partner link, and notification preferences.
Current fields:

id (UUID primary key)
email, auth_id (Supabase Auth reference)
program_goal (fat_loss, muscle_build, power, endurance, transform)
program_weeks, program_days_per_week, current_week, program_start_date
daily_calories_target, daily_protein_target_g
start_weight_lbs, current_weight_lbs, goal_weight_lbs
height_inches, age, sex
fitness_level (enum: beginner, intermediate, advanced)
partner_id (FK to users)
color_theme (accent color for UI takeover)
Avatar fields (avatar_gender, avatar_style)

Missing fields needed for coaching engine (schema migration required):

equipment (enum: full_gym, home_dumbbells, barbell_rack, bodyweight)
workout_duration_minutes (int, default 60)
preferred_workout_time (enum: morning, lunch, evening)
injuries (text, nullable)

workout_sessions Table
Per-session metadata: program phase, day type, completion status, volume, and readiness scoring.
Key fields:

user_id, session_date, week_number, phase_name, day_type
program_goal, completed (boolean)
duration_minutes, total_volume_lbs
readiness_score, readiness_level, notes

sets Table
Granular set-level data for progressive overload tracking.
Key fields:

session_id, user_id, exercise_name, exercise_category (compound/isolation)
set_number, weight_lbs, reps, rpe
estimated_1rm_lbs, is_pr (boolean)

personal_records Table
Tracks best estimated 1RM per exercise per user. Auto-updated via Postgres trigger.
health_snapshots Table
Daily aggregate health data per user (one row per user per day).
Fields:

snapshot_date, user_id
steps, active_calories_kcal
resting_heart_rate_bpm, hrv_ms
sleep_total_hours, sleep_deep_hours, sleep_rem_hours
dietary_calories_kcal, dietary_protein_g, dietary_carbs_g, dietary_fat_g
readiness_score (0–100), readiness_level (low/optimal/high), readiness_note
weight_lbs, body_fat_pct

medals + medal_definitions Tables
35+ pre-defined achievement badges spanning: strength PRs, streak consistency, body composition milestones, and couples synchronized wins.
streaks Table
Tracks consecutive week adherence per user. Evaluated daily via pg_cron scheduled function.
Health Data Pipeline
Current State: Apple Shortcut template documented; automation not yet live.
Flow:

User runs Apple Shortcut daily (manual or automated at midnight)
Shortcut reads from Apple Health: steps, active calories, sleep duration, dietary macros via HealthKit identifiers
Shortcut POSTs JSON to Supabase health_snapshots table via REST API
Tandem app reads health_snapshots and populates dashboard rings + coaching context

Future Enhancement: Health Auto Export (Premium) by HealthyApps will automate daily ingestion without manual Shortcut execution.
Coaching Layer
Concept: Two independent Claude instances (one per user), each running on the iOS Claude app.
Data Flow:

User's Claude session authenticates with Supabase via stored JWT
Reads prior week's health_snapshots (recovery state, sleep, HRV)
Reads prior week's sets + personal_records (volume, PRs, estimated 1RMs)
Reads user profile from users table (goal, days/week, experience, equipment, injuries)
Claude coaching prompt adapts next week's programming:

Adjusts volume/intensity based on recovery state (HRV + sleep + RHR)
Recommends exercise substitutions based on equipment + injuries
Schedules workouts on Google Calendar
Flags couples milestones (e.g., "both of you hit a PR on bench this week")


Outputs weekly plan + daily readiness scores
User logs each session in Tandem app; app writes to workout_sessions + sets
Next week, cycle repeats with fresh health data

Why separate instances: Apple Health is local/on-device. Kerwin's Claude reads only Kerwin's phone. Dani's Claude reads only Dani's phone. Both write back to shared Supabase by user_id, enabling competition mechanics.

Current Implementation State
App Views
view-auth (Login)
Current entry point. Should not be default post-auth.
view-dashboard (Home)
Intended entry point post-auth.

Activity rings (skeleton): calories, sleep, steps
Nutrition macros display (calories, protein, carbs, fat)
Competition section (underdeveloped): just two workout counts, no leaderboard score or streak display
Medal row
"Today's Workout →" CTA

Status: Rendered but not wired as default; competition section incomplete.
view-tracker (Main Workout Logging)
Most mature view.

Weekly program display with phase progress
Exercise cards with sets/reps/weight inputs
Progressive overload chips (recommended next weight)
1RM calculator
Plates calculator
Workout history modal with session replay

view-onboard (Signup Flow)
Captures: goal, weight, height, age, sex, experience level, program length, days/week.
Missing inputs: equipment, workout duration preference, workout time preference, injuries/limitations.
Supabase Backend Status

✅ Schema defined and deployed
✅ Authentication configured
✅ REST API endpoints functional
⚠️ Health snapshots table exists; ingestion pipeline not automated
⚠️ Streaks table exists; evaluation function not yet running
⚠️ Progressive overload view built; not fully integrated into UI

Known Sync Issues

syncToCloud() function writes to wrong tables (ghost tables: sessions, prs, user_config instead of workout_sessions, personal_records, users)
Onboarding writes sex → avatar_gender and program_goal → program_type (schema field name mismatch)
finishSession() does not reliably write completed: true or total_volume_lbs
Avatar SVG has no female rendering path despite avatar_gender = 'female' being stored

Security

⚠️ Supabase anon key exposed in tandem.html — must be rotated before public launch
RLS policies defined but not exhaustively tested


Known Blockers & Roadmap
Critical Path Blockers (P0)

Sync Layer Rewrite — Fix syncToCloud() to write to correct tables. Blocks all downstream features.
Onboarding Data Mismatch — Align form field names with schema. Prevents coaching engine from reading user config.
Dashboard Wiring — Make dashboard the default post-auth entry point. Blocks competition UX from being usable.

Feature Gaps (P1)

Avatar Rendering — Implement female avatar SVG path.
Program Support — Only 4-day splits exist. Add 2, 3, and 5-day templates.
Coaching Input Data — Onboarding must capture equipment, workout duration, injuries, preferred time.
Health Rings Wiring — Connect activity rings to live health_snapshots data.
Competition Leaderboard — Wire leaderboard scoring logic into UI.
Color Takeover UX — Activate accent color dominance when one partner leads.

Implementation Roadmap
v0.5 — Baseline Calibration & Adaptive Progression

Week 1 Day 1 calibration session using Epley formula
Per-goal weekly progression models:

ACSM metabolic framework (fat loss)
Schoenfeld double progression (muscle build)
Rhea undulating periodization (transform)


Hybrid onboarding estimation (combines user input + calibration)

v0.6 — Activate Onboarding Data

Thread experience/age/bodyweight modifiers through getProgram(), getPhase(), getRecommendation()
Coaching engine reads all user config fields
Program variants by equipment level

v0.7 — Athlete Load Awareness

External sessions per week tracking
Target competition date (e.g., wedding date for Kerwin)
Medical advisory path for rapid body composition shifts

v0.8+ — Health Automation & Coaching Launch

Health Auto Export ingestion pipeline live
Apple Shortcut daily automation
Claude coaching layer deployed
Google Calendar sync
Couples milestone notifications

v1.0 — Dashboard, Leaderboard, Health Integration

Dashboard as default entry point
Real-time leaderboard with point differential
Health rings connected to competition scoring
Streak evaluation and couples medals


Build Sequencing

Note: Maintain single-file architecture; do not refactor into components unless file exceeds 5,000 lines (current: ~2,730 lines) or Supabase Realtime becomes bottleneck.

Required Before Any Public Sharing

Rotate Supabase anon key
Test RLS policies end-to-end
Complete P0 blockers (sync layer, onboarding data)

Recommended Next Sprint

Fix sync layer
Align onboarding field names with schema
Make dashboard default post-auth entry point
Add missing onboarding fields (equipment, duration, time, injuries)
Wire health rings to health_snapshots

Optional Parallel Work

Health Auto Export setup (can be done independent of app)
Apple Shortcut documentation refinement
Coaching prompt research & refinement


Getting Started
Prerequisites

Node.js 18+
Supabase account (project already created)
Netlify account (site already deployed)

Local Development
bash# No build step needed — single HTML file
# Simply open tandem.html in a modern browser
# Or serve locally:
python3 -m http.server 8000
# Then visit http://localhost:8000/tandem.html
Supabase Project
Project URL: https://zsvktcvqmppsshtpeljt.supabase.co
Anon Key: sb_publishable_8gQMcE88UKwBqR9fIv0OuQ_8Xn3PGJ7
Schema: See tandem_schema_fixed.sql
Deployment
bash# Netlify auto-deploys on git push to main
# Site: https://tandem-app.netlify.app/
Apple Shortcut Setup (Health Data Ingestion)
See health-log.md for step-by-step Shortcut build instructions and user UUIDs.
User UUIDs:

Kerwin: e636007d-194f-4440-a2cc-9bc514957c64
Dani: 3a6e34b7-d197-47b4-bedb-de49bbe552fb


Documentation References

Schema: tandem_schema_fixed.sql (complete Postgres DDL)
Coaching Research: Exercise_Science_Framework_for_Adaptive_Workout_Pr.pdf (exercise science foundation)
Context Handoff: tandem-context-handoff.md (detailed architecture notes)
Health Data: health-log.md (Apple Shortcut instructions)
Notion Project Board: Epics, roadmap, and bug tracking

Epics & Features: dependency-ordered backlog
Bug & QA Log: known issues with severity
Context & Version History: session handoffs




Key Design Principles

Single-file intentionality — Keep tandem.html as the source of truth until it hits 5,000 lines. Reduces deployment friction and keeps the codebase coherent.
Health data as fuel, not decoration — Every health metric captured (steps, HRV, sleep, macros) must feed competition scoring or coaching decisions. Otherwise, remove it.
Couples > Individual — Design around synchronized milestones, joint progress, and head-to-head competition. Avoid features that benefit only one user.
Gamification is behavioral — Medals, streaks, and color takeover are not cosmetic. They reinforce the three core pillars and shape how users engage daily.
Progressive overload is the source of truth — Programming, coaching, and leaderboard scoring flow from the progressive overload view, not independent calculations.
Health Auto Export for reliability — iOS Shortcuts have background scheduling gaps. Prefer Health Auto Export (Premium) for daily ingestion in production.
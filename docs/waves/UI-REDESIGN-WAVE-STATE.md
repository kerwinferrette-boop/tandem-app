# UI Redesign — wave state + Fable handoff prompt (scoped 2026-09-23 with Kerwin)

Read `/CLAUDE.md` and `docs/self-corrections.md` first. This file is the scope; the
decisions below are **Kerwin's rulings (2026-09-23, attended session)**. Do not re-ask them.

## The target look

Every screen should feel like the **Today's Workout** chooser (`#modal-todaychoice`, CSS
`.tc-*` in `tandem.html`): full-bleed hero photos tinted to the user's accent, big
display type, big tappable cards and pill buttons, warm and results-driven. Kerwin: *"I
want to click buttons"*. The current Home is *"static, more tech, more vibe-coded"*.
The already-built reference pieces:
- The Log tab (`#view-log`, shipped ce65115). Kerwin: *"gorgeous"*.
- The mockups in `docs/mockups/`:
  - `home-v2.html` (order approved).
  - `tabbar-and-duel.html` (tab bar **B** chosen, duel sheet approved).

## Rulings (binding)

1. **Tab bar = option B** (`docs/mockups/tabbar-and-duel.html`).
   - Tabs: **Home · Log · START (raised center) · You · Duel**.
   - START opens the Today's Workout chooser.
   - **Labels under every icon are required** (Kerwin: *"having the names underneath
     them is critical"*).
   - Replace the current `#tabBar` (EPIC-58, ce65115). Keep it top-level-only: the
     in-workout `#bottomNav` owns the tracker.
2. **Home order** (`home-v2.html`):
   1. Today's session hero with a big Start button.
   2. You vs Dani card. Tapping it opens Duel.
   3. Muscles this week.
   4. Vitals strip: 4 tiles, accent-only rings.
   5. Latest PR, in gold.
3. **Log tab** = the per-lift bar graphs, already shipped. Restyle only if needed for the
   new tab bar.
4. **Duel tab** = the breakdown sheet in `tabbar-and-duel.html`:
   - The score and the lead.
   - Where the points came from. The rows must sum exactly to the displayed score.
   - Day by day, both partners.
   - This week's PRs, in gold.
   - The nudge.
   - Data comes from `competition_leaderboard` (already loaded in `loadDashboard`).
5. **You tab**:
   - Nutrition logs (the EPIC-4 Apple Health / MyFitnessPal data the dashboard nutrition
     rings already read).
   - The **muscle heatmap**.
   - Profile/settings (the current `modal-profile` content).
6. **Scoring**: 10 per session, **15 per PR**, plus up to 15 for average steps.
   - The app half shipped in 091e02d: `POINTS_PER_SESSION`, `POINTS_PER_PR` and
     `sessionPointsFor()` in `tandem.html`.
   - The view half is `migrations/0018_pr_points_15.sql`, which **Kerwin applies**.
   - Never re-inline a point value.
7. **Muscle heatmap**:
   - Vector body map with **one SVG path per muscle**, colored on ONE continuous scale by
     % of that muscle's weekly target (`VOLUME_LANDMARKS`).
   - Crediting: primary 1.0 / secondary 0.5, per EPIC-15 and Kerwin's 2026-09-16 ruling.
   - **Sex-specific art**: male users see a male body, female users a female body. Reuse
     `userSexKey()`.
   - The art comes from Kerwin's ChatGPT images (one prompt, run once for the male body
     and once for the female), traced once into per-muscle paths.
   - The same map is reused on the Finish Workout card.
   - The earlier roll-up code (`DISPLAY_MUSCLE_BUCKET`, `rollupToDisplayBuckets()`) is
     **not on GitHub**. It lives in a local worktree. Get it from Kerwin, or rebuild it.

## Rollout (from `docs/ui-gap-audit-2026-09-23.md`, which cites Notion's competitor tracking)

- **Wave 0, shared pieces:**
  - Real design tokens. `--font-mono` currently references itself, so it never applies.
  - One photo-tint recipe (four copies exist).
  - Card, pill button and stat components.
  - One palette. Onboarding and profile disagree today.
- **Wave 1, app-wide chrome:**
  - Remove the 40px scanline grid (`body::before`).
  - Restrict the bug FAB and QA badge to where they belong.
  - Build tab bar B.
- **Wave 2:** Home (ruling 2).
- **Wave 3:** Duel (ruling 4).
- **Wave 4:** You (ruling 5). The heatmap sub-slice waits on the art.
- **Wave 5:** Session complete: celebration, gold, photo.
- **Wave 6:** Workout tracker.
- **Wave 7:** Onboarding and sign-in.
- **Wave 8:** The remaining modals.

## Per-wave definition of done

- `npm run verify` 14/14, `npm run validate:personas`, and `npm run walkthrough:onboarding`
  are all green.
- Playwright screenshots at 390×844 of every touched screen, **sent to Kerwin**. He
  confirms visually. Verify at the pixel, not the code.
- 0 JS errors. The tracker still shows `#bottomNav` and no tab bar.
- No scoring, sync, schema, or program-engine changes inside a UI wave. Anything in those
  areas goes to Kerwin or the exercise-science-research skill.

## Photos Kerwin offered to source

For each shot below, get a male and a female version:
- 2–4 **couple training** shots, for the Duel tab and the Home duel card.
- 1–2 **nutrition / meal** shots, for You.
- 1–2 **celebration / finish** shots, for session complete.
- 1 **recovery / sleep** shot, for the vitals and You area.

Existing pools are in `public/`: hero-{male,female}-1..6, oneoff-*, and goal-* (the goal-*
set is currently unused).

## State
- [x] Log tab + first tab bar (ce65115)
- [x] Scoring unified in app (091e02d); migration 0018 pending Kerwin
- [x] Scope + mockups approved
- [x] Photo set in `public/` (864415c) — logos removed; see `public/PHOTO-CREDITS.md`. All 13 photos in.
- [x] Muscle-map art in `public/musclemap-{male,female}.webp`. **Tracing proven feasible (2026-09-23):**
  threshold gray > 42 + 4-connected components splits each body into ~190–200 regions, one per
  drawn muscle segment, both sexes (OpenCV). Wave 4 pipeline: fill shading holes → `cv2.findContours`
  → simplified SVG paths → label each region with a muscle tag (a one-time table, several segments
  per muscle, e.g. quads = 3–4) → drop head/hands/feet → color by % of weekly target.
- [ ] Wave 0 … Wave 8

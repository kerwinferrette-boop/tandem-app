# Redesign surface inventory — warm/modern pass (branch `design/warm-modern`)

Derived from code (grep against `tandem.html` at `867e442`), not from memory, per the
workstream brief and CLAUDE.md "inventory every surface from the code". `programs.js`
carries **zero** styling (`grep text-transform|letter-spacing|font-mono` → 0 lines) — all
visual surface lives in `tandem.html` (one `<style>` block, lines 9–1138, plus 254 inline
`style=` attributes, 29 of which set font/case/tracking).

Baseline forbidden-pattern counts (the numbers the design-coverage gate drives to ~0):

| pattern | count at baseline |
|---|---|
| `text-transform:uppercase` | 46 |
| `letter-spacing` (any) | 93 |
| `var(--font-mono)` | 121 |

Status legend: `pending` → `restyled` → `shot` (screenshot in `docs/redesign-shots/`).
A surface is DONE only at `shot`.

## Views (`.view`, switched by `showView()`)

| surface | where | status |
|---|---|---|
| view-onboard (all onboarding steps: goal cards, stats, days, equipment, review, color) | `tandem.html:1206` | shot |
| view-auth (sign-in, OTP) | `:1765` | shot |
| view-dashboard (home: hero, rhythm panel, duel scoreboard, heatmap, latest PR) | `:1812` | shot |
| view-log (history list, strength trend) | `:1947` | shot |
| view-you (profile/you tab) | `:1966` | shot |
| view-tracker (active session: setup card, lift cards, set rows, rest timer) | `:2001` | shot |

## Modals (`.modal-overlay`)

| modal | where | status |
|---|---|---|
| modal-calc (1RM calculator) | `:2111` | shot |
| modal-plates (plate math) | `:2127` | shot |
| modal-summary (session summary + feel 1-7) | `:2162` | shot |
| modal-prs (PR list) | `:2191` | shot |
| modal-history (session detail) | `:2202` | shot |
| modal-skip (skip/reorder day) | `:2220` | shot |
| modal-exhistory (per-exercise history) | `:2250` | shot |
| modal-goal (goal switch) | `:2261` | shot |
| modal-oneoff (one-off builder) | `:2278` | shot |
| modal-todaychoice (Continue / Build / Journal — Kerwin's reference feel) | `:2335` | shot |
| modal-duel (duel breakdown sheet) | `:2380` | shot |
| modal-journal (manual log) | `:2412` | shot |
| modal-library (template library) | `:2438` | shot |
| modal-builder (program builder) | `:2450` | shot |
| modal-profile (settings/profile, theme swatches) | `:2470` | shot |

## In-page components & JS-generated templates

| component | builder | status |
|---|---|---|
| Top nav + Tandem logo | CSS `:55-69`, markup top of body | shot |
| Tab bar | `:2668` `#tabBar` | shot |
| Today's Setup card (equipment) | `:2004` `#setupCard` | shot |
| Lift/day cards + set rows | `buildDayHTML` `:5394`, `setRowHTML` `:5691`, `rpeCellHTML` `:5681` | shot |
| Swap picker | `.swap-picker`/`.swap-opt` `:5605`, `:6309` | shot |
| Rest timer | `.rest-timer` + `renderSessionTimer` `:5105`, `renderSessionPace` `:5165` | shot |
| Toasts | `showToast` (61 call sites), `.toast` CSS | shot |
| Dashboard pieces | `renderDashboard` `:10013`, `renderDashHero` `:10192`, `renderDashRhythm` `:10179`, `renderDuelSheet` `:10357`, `renderLatestPR` `:10320`, `renderMuscleWeek` `:10281`, `renderMuscleHeatmap` `:10611` | shot |
| Log tab / trend | `renderLogTab` `:7602`, `renderStrengthTrend` `:6902` | shot |
| You tab | `renderYouTab` `:10507` | shot |
| Onboarding pieces | `renderBaselineEstimates` `:4636`, `renderOnboardLibraryPicker` `:3777`, `renderThemeSwatches` `:4600`, `renderLibSummary` `:3858` | shot |
| Builder | `renderBuilderDays` `:4264` | shot |
| One-off | `renderOneOff` `:8965`, `oneOffCardHTML` `:8854`, `renderOneOffFocusRow` `:8889`, `renderRecencyBanner` `:8926`, `renderSavedWorkoutsRow` `:8797` | shot |
| Journal | `renderJournalDateNote` `:9247`, journal row inputs `:9235-9239` | shot |
| Template cards | `templateCardHTML` `:3696` | shot |
| Tracker shell | `renderTracker` `:5206`, `renderProgramViews` `:5337` | shot |
| Empty states / loading strings | inline `style=` sites (e.g. `:2156`, `:2444`, `:9014`) | shot |

## Inline `style=` sites that set font/case/tracking (29 at baseline)

`tandem.html` lines: 1774, 1799, 2094, 2155, 2156, 2157, 2240, 2314, 2420, 2430, 2444,
2461, 3701, 3704, 4285, 4287, 4937, 5281, 5570, 6562, 6936, 6939, 6952, 9014, 9235–9239.
All restyled (token-level, slice 4) and covered by the sweep shots. The fix is token-level (classes), not per-element patches.

## Deliberate exceptions (to be mirrored in `scripts/design-coverage-smoke.mjs` allowlist, each with a reason)

- `--font-mono` for genuinely tabular numbers only: weights/reps/RPE inputs, timers,
  plate math, OTP code entry, hex color readout.
- Negative display tracking (e.g. `letter-spacing:-.02em`) on large headings — modern
  type convention, not the "matrix-y" wide tracking being removed.
- Monochrome glyphs per CLAUDE.md: → ← ↑ ↓ ↻ ✓ ✕ ★ ♂ ♀ stay.

## Theming note

Only a dark theme exists today (`:root` dark values, no light media query / toggle) —
"keep both working" is satisfied vacuously; the color-takeover accent (`--accent`,
`renderThemeSwatches`) is dynamic and must keep working across the new neutrals.

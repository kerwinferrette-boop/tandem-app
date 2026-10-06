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
| view-onboard (all onboarding steps: goal cards, stats, days, equipment, review, color) | `tandem.html:1206` | pending |
| view-auth (sign-in, OTP) | `:1765` | pending |
| view-dashboard (home: hero, rhythm panel, duel scoreboard, heatmap, latest PR) | `:1812` | pending |
| view-log (history list, strength trend) | `:1947` | pending |
| view-you (profile/you tab) | `:1966` | pending |
| view-tracker (active session: setup card, lift cards, set rows, rest timer) | `:2001` | pending |

## Modals (`.modal-overlay`)

| modal | where | status |
|---|---|---|
| modal-calc (1RM calculator) | `:2111` | pending |
| modal-plates (plate math) | `:2127` | pending |
| modal-summary (session summary + feel 1-7) | `:2162` | pending |
| modal-prs (PR list) | `:2191` | pending |
| modal-history (session detail) | `:2202` | pending |
| modal-skip (skip/reorder day) | `:2220` | pending |
| modal-exhistory (per-exercise history) | `:2250` | pending |
| modal-goal (goal switch) | `:2261` | pending |
| modal-oneoff (one-off builder) | `:2278` | pending |
| modal-todaychoice (Continue / Build / Journal — Kerwin's reference feel) | `:2335` | pending |
| modal-duel (duel breakdown sheet) | `:2380` | pending |
| modal-journal (manual log) | `:2412` | pending |
| modal-library (template library) | `:2438` | pending |
| modal-builder (program builder) | `:2450` | pending |
| modal-profile (settings/profile, theme swatches) | `:2470` | pending |

## In-page components & JS-generated templates

| component | builder | status |
|---|---|---|
| Top nav + Tandem logo | CSS `:55-69`, markup top of body | pending |
| Tab bar | `:2668` `#tabBar` | pending |
| Today's Setup card (equipment) | `:2004` `#setupCard` | pending |
| Lift/day cards + set rows | `buildDayHTML` `:5394`, `setRowHTML` `:5691`, `rpeCellHTML` `:5681` | pending |
| Swap picker | `.swap-picker`/`.swap-opt` `:5605`, `:6309` | pending |
| Rest timer | `.rest-timer` + `renderSessionTimer` `:5105`, `renderSessionPace` `:5165` | pending |
| Toasts | `showToast` (61 call sites), `.toast` CSS | pending |
| Dashboard pieces | `renderDashboard` `:10013`, `renderDashHero` `:10192`, `renderDashRhythm` `:10179`, `renderDuelSheet` `:10357`, `renderLatestPR` `:10320`, `renderMuscleWeek` `:10281`, `renderMuscleHeatmap` `:10611` | pending |
| Log tab / trend | `renderLogTab` `:7602`, `renderStrengthTrend` `:6902` | pending |
| You tab | `renderYouTab` `:10507` | pending |
| Onboarding pieces | `renderBaselineEstimates` `:4636`, `renderOnboardLibraryPicker` `:3777`, `renderThemeSwatches` `:4600`, `renderLibSummary` `:3858` | pending |
| Builder | `renderBuilderDays` `:4264` | pending |
| One-off | `renderOneOff` `:8965`, `oneOffCardHTML` `:8854`, `renderOneOffFocusRow` `:8889`, `renderRecencyBanner` `:8926`, `renderSavedWorkoutsRow` `:8797` | pending |
| Journal | `renderJournalDateNote` `:9247`, journal row inputs `:9235-9239` | pending |
| Template cards | `templateCardHTML` `:3696` | pending |
| Tracker shell | `renderTracker` `:5206`, `renderProgramViews` `:5337` | pending |
| Empty states / loading strings | inline `style=` sites (e.g. `:2156`, `:2444`, `:9014`) | pending |

## Inline `style=` sites that set font/case/tracking (29 at baseline)

`tandem.html` lines: 1774, 1799, 2094, 2155, 2156, 2157, 2240, 2314, 2420, 2430, 2444,
2461, 3701, 3704, 4285, 4287, 4937, 5281, 5570, 6562, 6936, 6939, 6952, 9014, 9235–9239.
All pending. The fix is token-level (classes), not per-element patches.

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

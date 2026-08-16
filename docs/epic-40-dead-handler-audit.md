# EPIC-40 CATALOG half — Dead/Cosmetic-Only Handler Audit

**Status: audit complete, read-only. Zero edits to `tandem.html`/`programs.js`.**
**Reproduce:** `node scripts/audit-dead-handlers.mjs` (`--full` for every row).

## Methodology (per the Epic's own spec)

1. Grep every `onclick=`/`onchange=`/`oninput=` in `tandem.html` — mechanical, exhaustive, not
   sample-based. **159 unique handler strings** (164 onclick + 2 onchange + 9 oninput occurrences,
   deduped).
2. For each, resolve the top-level function(s) it calls (skipping dotted method calls like
   `event.stopPropagation()` and JS keywords like `if`), locate that function's body by
   brace-matching, and classify:
   - **Generative** — writes to Supabase (`sb.from(`), mutates a top-level global or a known
     global object's property (`profileState.x =`, `cfg.x =`), or calls a downstream
     calc/render/save/apply/sync/finish/build function.
   - **Navigational** — legitimately opens/closes a view or modal, nothing else.
   - **Cosmetic-only** — toggles a class with no persistence and no downstream read anywhere else
     in the file.
3. Every "Cosmetic-only (candidate)" from the automated pass (13 of 159) was then manually
   re-verified by reading the function body and grepping every use site of the state it touches —
   the automated heuristic under-catches object-property mutation (`profileState.days = n`) vs.
   bare-global mutation (`selectedDays = n`), so candidates were checked by hand rather than
   trusted blind.

## Result

| Verdict | Count |
|---|---|
| Generative (state mutation / DB write / feeds downstream calc) | 145 |
| Navigational | 22 (overlaps counted once per handler; total unique = 159) |
| **Cosmetic-only, CONFIRMED dead** | **1** |
| Cosmetic-only, false positive on manual review | 5 |
| Benign UI feedback (not a "dead" bug) | 7 |

### The 13 automated candidates, resolved by hand

| Handler | Verdict on manual review | Why |
|---|---|---|
| `selectProfileDays(2/3/4/5)` (×4) | **Generative** (false positive) | `profileState.days = days` — read by `saveProfileProgram()` (line 5370) and persisted. Automated heuristic only checks bare-global assignment, missed object-property assignment. |
| `selectSkinTone('#...')` (×5) | **Generative** (false positive) | `profileState.skinTone = color` — read by `refreshAvatarPreview()` (pill highlight) AND by the profile-save path `profile.skinTone = profileState.skinTone` (line 5448), persisted to storage/Supabase. |
| `skipRest('${ex.id}')` | Functional, not a bug | Clears the running rest-timer interval (`clearInterval`) and removes the "running" class — real behavior (cancels a timer), not decorative. |
| `document.getElementById('bugFileName').textContent=...` | Benign UI feedback | Immediate filename echo for a file `<input>`; no persistence claim is implied by this element. |
| `authOTPState`/`authFormInner` display toggle ("← Back") | Benign navigational | Two inline style toggles that switch between the OTP-entry and password-entry auth sub-views; functionally equivalent to a `showView`-style call, just inlined. |
| `this.classList.toggle('on')` on `.pct-card` (inside `calcORM()`'s generated %1RM grid, tandem.html:3981) | **CONFIRMED Cosmetic-only** | Grepped every use of `.pct-card` and `.on` in the file: the *only* consumer is a CSS rule (`.pct-card.on{background:...}` / `.pct-card.on .pct-val{color:...}`, tandem.html:528,531). No JS anywhere reads `classList.contains('on')` for this element, no state, no persistence. Filed as a new Bug & QA Log row (see below) rather than fixed blind, per the Epic's own "do not batch-fix" instruction — the REWIRE half is explicitly gated to run after Waves 6-8, not in this audit-only pass. |

## Known-starting-points callouts, checked

The Epic named three pre-audit suspects (from the README):

- **Color Takeover UX** ("logic built, CSS integration pending") — **already resolved**, not
  dead. `applyColorTheme(hex)` (tandem.html:5428) sets `--accent`/`--accent-dim`/`--accent-glow`
  as live CSS custom properties AND upserts `users.color_theme` to Supabase when signed in. Fully
  wired today; the README note predates this.
- **Competition Leaderboard** ("structure exists, UI integration incomplete") — reads
  `competition_leaderboard` via Supabase and populates `dashboardData.leaderboard`, consumed by
  the dashboard render (tandem.html:4991-5144). Wired, not dead.
- **Health Rings** ("render as decorative, not connected to competition scoring") — **zero
  matches** for `health-ring`/`healthRing`/`HealthRing` anywhere in `tandem.html` today. Either
  already removed or renamed beyond grep's reach; not an interactive-handler finding either way
  (no onclick/onchange/oninput attached to whatever this used to be), so it is out of this
  audit's specific scope. Flagged here rather than silently dropped — if the feature still exists
  under a different name, a follow-up grep pass naming it explicitly would close this out.

## Scope note

This is the **CATALOG half only**, per the Epic's own Dependency Gate ("WAVE 11 — split this Epic
in two; the REWIRE half must run DEAD LAST, after Waves 6-8"). No rewiring was done. The one
confirmed finding is filed as a Bug Log row for a future cycle to fix on its own should/could/did
audit, exactly as the Epic instructs.

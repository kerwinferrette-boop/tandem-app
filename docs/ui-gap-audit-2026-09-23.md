# Tandem UI/UX Gap Audit: bringing every screen up to the "Today's Workout" standard

**Date:** 2026-09-23 · **Scope:** read-only audit of `tandem.html` at `85c881a` (branch `claude/fervent-mendel-a4jjv9`) against the Notion competitor sources. No code was changed.
**Benchmark screen:** `#modal-todaychoice` (CSS `.tc-*` at L593-644, markup at L2041-2100).
**Owner ask (Kerwin):** make the whole app feel like Today's Workout: full-bleed hero photos tinted to the user's accent, big display type, tappable cards, warm, interactive, and focused on results. He says the dashboard feels static and "more tech, more vibe-coded". Main benchmark: Ladder.

---

## 1. Sources read

| Source | Notion id | What it contributed |
|---|---|---|
| 🥊 Competitor Tracking — UI/UX & Features | `379ca37f-935b-8185-8612-c90c388eb3a9` | Per-app sections for Gains, Ladder, BBCOM (TBD stub), Pump Club, Sweatmates, and Sweat. Also Kerwin's "🎨 Design Direction: Less AI Slop / Less Tron" pass (2026-06-20) and **2 embedded Ladder screenshots**, which I downloaded and viewed (see §2.1) |
| UI/UX Research Update — App Store Findings + BBCOM Filled In (2026-08-04) | `3b3ca37f-935b-8186-9da1-f722db4438dc` | Ladder Flex workouts, dial logging, and in-workout video. Pump Club victory screen and light mode. Gains Liquid Glass. Sweatmates Pinky Promise and Weekly Recaps. Sweat timeline home. The BBCOM row filled in |
| 🧭 Competitive Strategy — What Works, What Doesn't, Where Tandem Wins | `37aca37f-935b-814d-a680-d8af798d51a0` | The "steal these" list (prefill, auto-PR, celebration, streak, wager, heat map, nudge) and the tier priority |
| 2026-07-02 CTO Session — P1 refactor verified + UI direction mockups | `391ca37f-935b-813e-861e-c130473a19a7` | A list of vibe-coded telltales and 3 mockups (A = Ladder-like "Coach Energy", B = Warm Home, C = Night Editorial). The `--font-mono` self-reference bug. The direction decision was left "Awaiting Kerwin" |
| EPIC-58 — Home/Plan/Log/Settings Nav Restructure + Muscle-Focus Log Tab | `3ddca37f-935b-817f-8ff8-d6fa1e1aec44` | Incoming 4-tab nav. The Log tab spec (cards "visually styled like the todaychoice hero cards", a bar chart, and gold PR bars). The heat map moves onto Home |
| BUG-123-bottom-nav-bar-makes-no-sense (User Story Coverage) | `3e0ca37f-935b-812a-891e-e48d98786af6` | User report: "These make no sense as the bottom nav bar." Screenshot never reviewed. Status: Needs Human |

**Structural note:** "Competitor Tracking" is a **page with H3 sections, not a database**. There are no per-competitor database rows to enumerate. I read everything under it. A scoped search inside it returned only the page itself and the 2026-08-04 child page.

**Seen in search but not opened:** Weekly Stakes Layer epic (`37aca37f-935b-8176-8930-d00a799a667e`, linked from the Design Direction section), "UX · Remove Next Session Targets banner entirely" (`38cca37f-935b-81e0-a46e-cf33662521b3`), and EPIC-15 muscle heat map (`390ca37f-935b-81a5-bf1e-c9a5f86559c4`).

**Local artifacts:** `mockup-todaychoice.html` (repo root) exists. The July mockups (`mockup-A-ladder.html` and the others) are **not in this repo**. The Notion page places them in the "Tandem workspace folder" (`/mnt/Tandem/`), which this session cannot reach.

---

## 2. What competitors do (Notion-cited only)

Each cell cites the Notion source. **"—" means the Notion sources say nothing.** I left those cells empty instead of filling them in (see §6).

### 2.1 Ladder (primary benchmark)

| Dimension | What the sources say | Source |
|---|---|---|
| Navigation model | — (not documented) | — |
| Home screen | "Flex workouts": standalone one-off sessions across coaches and styles (~40 per style), next to the full team programs. The Notion page calls this the same "quick session vs full program, same home" duality that Tandem's home is building toward | 3b3ca37f |
| Onboarding | **Screenshot 1 (viewed):** "How your free trial works". A vertical timeline stepper with accent-filled nodes for steps already done and a grey rail for the rest. Headline in heavy display type with the key phrase ("free trial") set in the accent color. The first real step is "Now → Welcome Workout: Unlock your plan by completing your Welcome Workout". Full-width pill CTA "CONTINUE" | 379ca37f (embedded image 1) |
| Workout player | In-ear audio coach cues. Spotify and Apple Music auto-duck under the coach's voice. Coach video plays during the workout alongside a **progress bar + countdown timer**. Logging uses **haptic dials** for reps and volume. **Swipe up** opens a journal to swap exercises, add sets, or add notes | 379ca37f; 3b3ca37f |
| Progress / history | Sessions "build week over week with intentional overload". No screen-level detail on charts or history | 379ca37f |
| Social / partner | Team feed where users post results and celebrate PRs. One-to-many, no bilateral competition | 379ca37f |
| Visual language | **Screenshot 2 (viewed, paywall/offer card):** near-black background with **one** saturated chartreuse/lime accent used only on the eyebrow and the CTA. A huge, wide, heavy display face for the numbers ("$4.99") and the program name ("MAX"). A **full-bleed high-contrast black-and-white photograph** inside a large rounded card. A small tracked all-caps eyebrow ("OUR LOWEST PRICE") in the accent color. A full-width all-caps pill CTA. A circular dark close button. Motion: — | 379ca37f (embedded image 2) |
| Anti-patterns | Saved workouts expire after 3 accesses. The strategy page's rule is to "never implement expiring content" | 379ca37f; 37aca37f |

**Takeaway for Kerwin's brief:** Ladder is **dark**. The screenshots show that dark plus one neon accent is not itself the "vibe-coded" tell. What separates Ladder's look from Tandem's dashboard is **scale and photography**: display type at poster size, one big photo per card, one accent used sparingly, and one obvious CTA. Tandem's `.tc-*` screen already works this way (grayscale photo, accent `mix-blend-mode:color`, 32px display h2, pill CTA). The rest of the app does not.

### 2.2 Other competitors

| App | Navigation | Home | Workout player / logging | Progress / history | Social / partner | Visual language | Source |
|---|---|---|---|---|---|---|---|
| **Gains** | — | — | The fastest logger. Every exercise is **pre-filled with last time's weight and reps** ("Beat it, match it, or change it in a tap"). PRs are auto-captured | No long-term charts (a listed weakness) | None | Clean and minimal, no clutter. The 4.0 rebuild uses native **iOS 26 Liquid Glass**. The note says to keep the logger this calm | 379ca37f; 3b3ca37f |
| **Arnold's Pump Club** | **Sidebar**, not a tab bar. "Arnold AI" is reachable from the bottom bar and from inside workouts | Arnold AI lives on home "with its own animation". An "Actions" tab breaks goals into daily habits | — | 90-day progressive program | Arnold's Saturday check-in and a community forum | **Light mode exists**. Tone is "warm, positive, non-toxic". Post-workout **"victory screen" with a video player** | 379ca37f; 3b3ca37f |
| **Sweat** | — | **Timeline**: steps, scheduled workouts, and the day's program summary, **color-coded by workout category** | Built-in timer, video demos, circuits auto-advance. **Haptic on set completion.** Mid-workout exercise swap | Streaks, trophy cabinet, before/after photos, a **progress bar that fills** on completion | Broadcast forum | Bright and rewarding. **Confetti on completion** is "the single most-cited detail" | 379ca37f; 3b3ca37f |
| **Sweatmates** | — | — | Photo proof (SweatCam) instead of set logging | Weekly Recaps | Wager, **Nudge** ("side-eye"), **Pinky Promise** dispute | — | 379ca37f; 3b3ca37f |
| **BBCOM** | — | "Choose Your Workout Experience": multiple parallel entry paths (coach-led, quick accessory, full program, custom, stacking, library) | Pause mid-set to rewatch the tutorial | "Blue Man" weekly muscle heat map | Broadcast feed, private profiles | — | 3b3ca37f; 37aca37f |

**Cross-app patterns the strategy page says to adopt** (37aca37f): prefill last sets, silent auto-PR, a **celebration state with a stat card before returning home**, a **prominent streak**, a wager/stakes layer, a partner nudge, and a weekly muscle heat map.

---

## 3. Tandem today, screen by screen

Legend for "distance from `.tc-*`": **0** = already in the language, **5** = nothing in common.

**Global chrome (affects every screen):**
- `body::before` still draws the **40px scanline grid** (L41-44). The 2026-06-20 Design Direction called for removing it. It is still there.
- `--font-mono:var(--font-mono)` is **self-referential** (L30), so the mono stack resolves to nothing. JetBrains Mono is loaded but never applied. The CTO session flagged this on 2026-07-02 and it is still unfixed. 109 `font-family:var(--font-mono)` declarations and 41 `text-transform:uppercase` blocks depend on it.
- Top nav (L921-941): a gradient "TANDEM" wordmark, a profile icon, a **QA badge button visible to all users**, and a sync dot.
- Two separate duotone recipes already exist and match `.tc-*`: `.hero-band`/`.hero-fill` (L515-538) and `.oneoff-card` (L546-568). The recipe is solid. It just isn't reused beyond the places listed below.

| # | Screen | What it looks like | Static vs interactive | Distance |
|---|---|---|---|---|
| 1 | **Auth** `#view-auth` (L1547) | Centered SVG logo, a gradient "TANDEM", the heading "Sync your training", copy about the on-device vs cloud safety net, an email field, and a gradient "Send Sign-in Code →" button in letter-spaced display type | Form only. **No photo, no brand promise.** The first screen a user sees talks about backups | 5 |
| 2 | **Onboarding** `#view-onboard` (L983-1540) | Logo, then **one `.hero-band` photo** ("Show up. Every set counts."), step dots, then 7 cards: goal cards (icon, name, and desc on flat `--s1`, with **hardcoded per-goal colors** red/`#5B8DEF`/teal), stats inputs, schedule, prefs, color swatches, baselines, review. Path gate: two emoji buttons ("🛠️ Build My Own", "📚 Choose a Program" on a **hardcoded blue gradient** `#4A9EFF`) | Tappable cards with a 2px accent top-rule on select. Slide animation between steps. **`public/goal-{build-muscle,fat-burn,transform}-{male,female}.jpg` exist but are referenced nowhere** in `tandem.html`/`programs.js` | 3 |
| 3 | **Dashboard** `#view-dashboard` (L1587-1753) | "Today" title, a mono date, a streak chip, a refresh button. **7 ring cards** in two rows (Activity: Cal/Sleep/Steps; Nutrition: Cal/Protein/Carbs/Fat) with **hardcoded rainbow strokes** (`#4a9eff`, `#38d9c0`, `#FFB020`, `#e854a0`, `#a78bfa`, `#fb923c`). A Body cell pair. A "This Week" competition card (names, pts, bar, 3 stat cells, M-S dots). Medals. Then the **"Today's Workout →" CTA as the last element** | **Almost entirely static.** `renderDashboard()` (L8394+) attaches **zero** `onclick`s. Only refresh, "See all →" (medals), and the bottom CTA are tappable. **No photo anywhere.** Every section label is mono uppercase accent microtext. The one action that matters sits below ~5 sections of read-only data | 5 |
| 4 | **Tracker** `#view-tracker` (L1758-1846) | A collapsible "Today's Setup" equipment accordion. Phase banner (`.hero-fill` at 40% opacity behind text: eyebrow, phase name, intent, rep target, big week number). Week nav ‹ › Today. Session timer. A thin progress bar. Tool pills (PRs/History/Goal). Scrollable **day tabs**. Exercise accordion cards (`.ex-card`: 20px checkbox, name, mono badges; expanding to set rows with 16px mono inputs, **28×28px** log buttons, RPE select, why/cues/video). Finish banner | Highly interactive but **dense HUD**: small targets and mono everywhere. The phase banner has the photo but at 40%, as a texture rather than a hero. The workout's name and focus never get display-scale treatment | 3 |
| 5 | **Today's Workout** `#modal-todaychoice` | **The benchmark.** Full-screen. "Today's workout / What are you doing right now?" A primary hero card (Continue your plan) and two half cards (Build me a workout / Journal). Grayscale photo, accent tint (`mix-blend-mode:color`, .42), radial scrim, mono meta eyebrow, 22-32px display h2, frosted pill CTA, `:active` scale(.976) | Fully tappable, color follows the user's accent. Gaps: the hero card doesn't say **which** workout (day name, focus, exercise count, duration), and the meta eyebrows are ALL-CAPS mono | 0 |
| 6 | **One-off builder** `#modal-oneoff` (L1997) | Bottom sheet. Step 0 is two **emoji text buttons** ("✨ Create New", "🔁 Pull from Saved"). Steps 1-2 are 3×3 grids of **duotone photo cards** (`.oneoff-card`) with recency badges. The rendered day reuses tracker cards. The save prompt has a 1-7 rating row | The grids are close to the `.tc-*` language. The entry step and chrome (sheet, mono step captions, `clear-btn`s) are not | 2 |
| 7 | **Journal** `#modal-journal` (L2103) | Sheet: date input with inline styles, exercise rows, notes, Save | Form only | 4 |
| 8 | **Profile / Settings** `#modal-profile` (L2161-2342) | A long sheet with 5 sections (Program pills, Body stats, Nutrition targets, Color theme swatches, Avatar builder) and **5 separate Save buttons**. Sign out at the bottom | Pills and swatches are tappable. No photo, no identity header. **Color palette differs from onboarding's** (onboarding `#1B5E38/#FF6B35/#FF69B4` vs profile `#3FE08C/#ff9952/#e8547a`), so the same rule lives in two places | 4 |
| 9 | **Goal / Program** `#modal-goal` (L1982) | Text summary and 4 stacked `clear-btn`s with emoji (← Rebuild, 📚 Library, ⚡ Build Me a Workout, 🛠️ Custom Template) | Buttons only. **This duplicates the `.tc-*` choices in list form** | 4 |
| 10 | **Program Library / Custom Builder** `#modal-library`, `#modal-builder` | Sheet lists and forms | Functional, text-only | 4 |
| 11 | **PRs** `#modal-prs` (L1915) | Sheet list of `.pr-item` rows (est. 1RM) | Read-only list, no trend, no photo | 4 |
| 12 | **History** `#modal-history` (L1926) | Sheet: sync info, 3 tool buttons (☁ Sync, ⬇ Restore, 🔑 Account), a list of `.hist-session` with mono dates and sets | Utility plumbing mixed with the user's own history | 4 |
| 13 | **Exercise history** `#modal-exhistory` (L1971) | Sheet: `renderStrengthTrend()` (L6014) and per-session list. The subtitle is an engineering disclaimer ("Matched by exercise name… slot assignments can rotate") | Has a trend, but not presented as a result | 3 |
| 14 | **Session complete** `#modal-summary` (L1898) + `#finishBanner` | `showSessionSummary()` (L6614) opens a **standard bottom sheet**: "Session Complete 🔥", a 2×2 stat grid (Volume, Duration, PRs, Day Streak) in accent display numbers, and a dashed-border "Nice! →" button | Exists (EPIC-13), but **no confetti, no haptic** (`grep confetti\|vibrate` = 0 hits), no photo, no partner comparison, and no gold treatment despite `--gold` being reserved "CELEBRATION ONLY" | 4 |
| 15 | **In-workout bottom bar** `#bottomNav` (L2345) | Fixed bar shown only on the tracker: Plates / 1RM / Log / Skip / **Finish ✓**. Mono uppercase 10px chips on `--s1` | Tappable, but "Log" opens History (a mismatch with EPIC-58's incoming "Log" tab). BUG-123 ("these make no sense as the bottom nav bar") is still open and unreviewed | 4 |
| 16 | **Bug-report FAB** `.bug-fab` (L874, L949) | 40px grey circle fixed `bottom:80px;right:16px`, on every screen, z-index 900 | Floats over content, including the `.tc-*` hero. Together with the QA badge in the top nav, this is debug chrome that ships to users | n/a (chrome) |
| 17 | **Utility modals** (1RM calc, plates, skip) | Standard sheets. The skip sheet is well written ("No judgment…") | Fine as tools. Low priority | 3 |

**Incoming (EPIC-58, being built in parallel):** a persistent 4-tab bar Home / Plan / Log / Settings. Home = dashboard + heat map widget. Plan = `modal-todaychoice`. Log = new card grid "visually styled like the todaychoice hero cards" + bar chart with gold PR bars. Settings = `modal-profile`. EPIC-58 says explicitly that `#bottomNav` is unrelated and must not be repurposed. This audit treats the tab bar as the new frame every screen will sit in.

---

## 4. Gap table

Severity reflects both the distance from `.tc-*` and how often the user sees the screen.

| Screen | Competitor pattern (cited) | Tandem today | Sev | Recommendation (Today's-Workout style) |
|---|---|---|---|---|
| **Dashboard / Home** | Ladder: a big photo card and one accent CTA (379ca37f img 2). Ladder Flex + BBCOM multi-entry home (3b3ca37f). Sweat timeline home (3b3ca37f). Strategy: "competition layer front and center on the dashboard" (37aca37f) | 7 rainbow rings above the fold. The CTA is the last element. Zero tappable data. No photo | **High** | Lead with a **`.tc-card.primary` hero for today's session**: day name at 32px display, focus, "4 exercises · ~45 min", and a "Start →" pill. Below it, a **You vs Partner hero card** (both accent colors, big pts, streak flames side by side, per Design Direction #3, 379ca37f). Collapse the 7 rings into **one tappable "Body today" card** that expands. Recolor the rings from the accent ramp, not the rainbow. Make every card tappable (competition → week detail, medals → history, rings → trends) |
| **Session complete** | Sweat confetti + haptic + stat card (379ca37f). Pump Club victory screen with video (3b3ca37f). Strategy Tier 1 (37aca37f) | A bottom sheet with a 2×2 grid, no motion, no gold | **High** | Make it a **full-screen `tc-full` takeover**: `data-hero="complete"` photo with a **gold** tint (the reserved celebration token), the volume number at poster scale, a PR count with gold chips, "streak +1", **you vs partner this week**, one gold confetti burst + `navigator.vibrate` where supported, and a single "Done" pill. Optional "Send to partner" (Sweatmates SweatCam idea, 379ca37f) |
| **Tracker / workout player** | Ladder progress bar + countdown + dial logging + swipe-up journal (3b3ca37f). Gains prefill "beat it, match it" and a calm logger (379ca37f, 3b3ca37f). Sweat haptic per set (379ca37f) | Dense mono accordion. 28px log buttons. The phase banner photo sits at 40% as texture | **High** | Put a **session hero header** at the top: the day's photo, "Push · Week 3" in display type, and a big progress ring/bar with a live timer. Keep set rows calm (Gains): sentence-case labels, mono only for numbers, **larger log targets** (flagged below), "Last: 185×8 · Beat it" prefill line, a haptic tick on log. Move the setup accordion and week nav behind a single "⋯" |
| **Bottom nav (in-workout) + incoming tab bar** | Pump Club: sidebar + bottom-bar AI (3b3ca37f). Other apps: — | 5 mono chips. "Log" opens History. BUG-123 open | **High** | Style the EPIC-58 tab bar and `#bottomNav` as **one component family**: sentence-case labels, icon above label, accent pill for the active tab. Rename the in-workout "Log" → "History" so it no longer collides with the Log tab. Make **Finish** the one filled accent pill. Review BUG-123's screenshot before finalizing (it is held for Kerwin) |
| **Auth** | Ladder onboarding: display headline with an accent phrase, one pill CTA (379ca37f img 1). Sweat "<1 minute to first workout" (379ca37f) | A backup-oriented pitch, no imagery | **Med** | Full-bleed `tc-photo` hero behind the form. A headline like "Train together. Win the week." at 40px+ with the accent phrase. Sync copy demoted to a footnote |
| **Onboarding** | Ladder timeline stepper and "Welcome Workout" hook (379ca37f img 1). Pump Club goal + level + equipment placement (379ca37f). BBCOM multi-path (3b3ca37f) | Goal cards are flat with hardcoded colors. The **unused goal photos** sit in `public/`. The path gate uses emoji buttons on a hardcoded blue | **Med** | Goal cards become **`.tc-card`s using `public/goal-*-{male,female}.jpg`** (already shipped, never wired), tinted by accent. Path gate becomes the two-card `.tc-row` (Build My Own / Choose a Program). The step dots can stay. Mono step label → sentence case |
| **Log tab (incoming) / PRs / Exercise history** | Gains auto-PR (379ca37f). Sweat progress bar and trophy cabinet (379ca37f). EPIC-58 spec: hero-style cards + gold PR bars (3ddca37f) | PRs is a flat list. Exercise history opens with an engineering disclaimer | **Med** | Build the Log tab with the **shared `tc-card` component** (EPIC-58 asks for this). Give PRs a gold-tinted "trophy" variant of the same card. On exercise history, lead with the **% change headline** at display size and drop the slot-matching disclaimer into a footnote |
| **One-off builder** | Ladder Flex workouts (3b3ca37f). BBCOM entry paths (3b3ca37f) | The photo grid is good. The entry step uses emoji buttons | **Low** | Replace Step 0 with a `.tc-row` of two cards (New / Saved). Mono step captions → sentence-case display. Consider opening it as `tc-full` rather than a sheet, for continuity with the screen that launches it |
| **Goal/Program modal** | BBCOM "Choose Your Workout Experience" (3b3ca37f) | 4 emoji `clear-btn`s that duplicate the Plan choices | **Med** | Fold into **Plan** (EPIC-58): a hero card for the current program, then cards for Library / Custom Template / Rebuild. This removes a duplicate entry point |
| **Profile / Settings** | Pump Club light mode (3b3ca37f). Otherwise — | 5 save buttons, 2 color palettes | **Med** | An **identity hero** (avatar over an accent-tinted photo, name, goal), then grouped tappable rows. **One palette constant** shared by onboarding and profile. Auto-save or a single save. Sign out at the bottom |
| **History** | Sweatmates Weekly Recaps (3b3ca37f) | Sync plumbing mixed into history | **Low** | Weekly recap cards (photo, week volume, sessions, partner comparison). Move Sync/Restore/Account to Settings |
| **Journal, Library, Builder, utility modals** | — | Plain sheets | **Low** | Adopt the shared sheet header (display title, sentence-case labels, accent pill primary). No photos needed; these are tools |
| **Global chrome** | Design Direction #1: remove the grid, warm the base, mono only for numbers (379ca37f). CTO telltales list (391ca37f) | Grid still on. `--font-mono` broken. QA badge + bug FAB on every screen | **High** (cheap) | Delete the `body::before` grid. Fix `--font-mono`. Hide the QA badge and bug FAB for non-admin users, or move the report entry into Settings. Replace `.dash-section-label` mono-caps with sentence-case display labels |

---

## 5. Rollout order

### 5.0 Extract first: shared tokens and components (do once, before restyling any screen)

1. **Fix the tokens.** Set `--font-mono` to a real stack (`'JetBrains Mono',ui-monospace,monospace`). Add type-scale tokens (`--t-hero:32px`, `--t-h1:28px`, `--t-h2:22px`, `--t-eyebrow:10px`), a scrim token, and `--tint-opacity:.42`. Derive **ring/chart colors from the accent** (a `color-mix` ramp) instead of hex literals.
2. **One duotone recipe.** `.hero-band`, `.hero-fill`, `.oneoff-card`, and `.tc-card` each re-declare grayscale → `var(--accent)` `mix-blend-mode:color`. Lift this into one `.duo` primitive (photo layer + tint layer + scrim) used by all four. This follows CLAUDE.md's "one rule, one home" applied to CSS.
3. **Components:** `tc-card` (sizes: hero / half / tile), `tc-full` screen shell, `pill-cta` (filled accent / frosted), `eyebrow` (sentence-case or lightly tracked, not mono), `stat-hero` (poster number + label), a `vs-card` (two accents), and a `sheet-header`.
4. **Single palette constant** for theme swatches, used by onboarding, library onboarding, and profile.
5. **Global de-HUD:** remove the grid and restrict mono to numerals.

### 5.1 Screen order (all screens get done; ordered by exposure and emotional return)

| Wave | Screens | Why this order |
|---|---|---|
| 1 | **Global chrome + tokens (5.0)** | Every later wave depends on it. Low risk |
| 2 | **Home/Dashboard**, restyled *inside* the EPIC-58 Home tab | Kerwin's named pain point and the most-viewed screen. Coordinate with the parallel EPIC-58 build so the restyle doesn't collide with the tab wiring |
| 3 | **Session complete** (full-screen, gold) | Strategy Tier 1. The data already exists (`showSessionSummary`), so only the surface is missing |
| 4 | **Tracker / player** header + set-row calm-down + `#bottomNav` | The most time-in-app. Protects the Gains logging-speed bet. Keep the logger calm, as the 3b3ca37f note warns |
| 5 | **Tab bar + Plan (today-choice polish: show which workout) + Log tab** | Plan and Log are EPIC-58 surfaces. Build Log on the shared `tc-card` from day one |
| 6 | **Onboarding + Auth** | First impression. Wire the unused goal photos |
| 7 | **Settings/Profile + Goal→Plan merge + History recap** | Medium frequency |
| 8 | **One-off entry, Journal, Library, Builder, utility modals, PRs/Exercise history** | Adopt the shared sheet header. Mostly mechanical once 5.0 exists |

Each wave: verify **at the pixel** (render on a phone-width viewport and check that the accent recolors on theme change), not just in CSS. `npm run verify` still applies to any commit that touches `tandem.html`.

---

## 6. What the Notion sources do not say (not filled in)

- **Ladder navigation model** (tabs vs other), **Ladder home screen layout**, and **Ladder progress/history screens**: not documented. The two screenshots show onboarding and a paywall only.
- **Motion and animation** for every competitor, beyond Sweat's confetti/haptic, Pump Club's animated Arnold AI, and Ladder's haptic dials.
- **Typography names.** No source names any competitor's typeface. My description of Ladder's type as "wide, heavy display" comes from the screenshot, not a named font.
- **Navigation model** for Gains, Sweat, Sweatmates, and BBCOM.
- **Visual language** for Sweatmates and BBCOM.
- **BBCOM's main tracker section is still "TBD"** on the Competitor Tracking page. The fill-in lives only on the 2026-08-04 child page.
- **Dark vs light:** the sources conflict in tone. The Design Direction says "none of them use neon-on-black HUD styling", but Ladder's screenshots are black with a neon accent. The difference is HUD chrome (grid, mono, microtext), not the dark background. Direction A/B/C from 2026-07-02 is still recorded as **"Awaiting Kerwin"**. That is a product/brand call for Kerwin, not something this audit can settle.
- **BUG-123's screenshot** was never reviewed, so what "doesn't make sense" about the bottom bar is unknown.
- **Tap-target size:** the 28px log button observation is mine. No Notion source sets a minimum. If a number is needed, cite Apple's HIG in the follow-up rather than this doc.
- I did **not** run live web research on Ladder. The brief limited competitor facts to Notion. A follow-up research pass (App Store screenshots and videos of Ladder's home and player) would fill the Ladder gaps above.

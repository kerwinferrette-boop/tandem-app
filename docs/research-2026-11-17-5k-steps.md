# Research: wiring the "Run a 5K" and "10K Steps/Day" secondary goals into the Zone 2 finisher — 2026-11-17

The `exercise-science-research` skill was invoked first. This is a research artifact only. No repo file was edited.

## Repo and Notion state, checked before any literature

- **Onboarding:** `tandem.html:1612-1628` offers `run_5k`, `10k_steps`, `improve_mobility` and `none`. The choice persists as `cfg.secondary_goal` / `users.secondary_goal`.
- **What reads it:** only `restDaySuggestionText()` (`tandem.html:11038-11041`). It shows mobility text for `improve_mobility` and *"take a 30-minute walk"* for everything else. `programs.js` never reads `secondary_goal`. `run_5k` and `10k_steps` have no effect anywhere.
- **Existing steps surface:** the Home "Steps" ring (`tandem.html:10880`) already shows health-sync steps against `h?.steps_goal ?? 8000`. The 8000 fallback carries no citation.
- **Zone 2 finisher:** `programs.js:3569/3626/5286` label it "Zone 2 · 22 min". The 22 minutes and the cue "20–25 min: long enough for mitochondrial adaptation" (`programs.js:1737`) are uncited, per the prior research doc.
- **Notion, Programming Architecture Reference Part 3** (`37aca37f935b811b90c7c880631c66a8`, fetched this session):
  - The 5K protocol says: 3–4 running days a week (1 interval, 1 tempo, 1–2 easy); 12–18 miles a week; a 4–6 week (elsewhere 6–8 week) block; at most 1 heavy leg day a week; *"Replace cardio finishers with running sessions (don't double-count)"*; hip-flexor and calf mobility every session; *"Reduce lower body volume by 20%"*. **None of these numbers carries a citation.**
  - **There is no `10k_steps` protocol in Part 3 at all**, although the intro says EPIC-8 covers it "at a surface level".
- **Notion EPIC-17 row** (`390ca37f935b8140918fda3ff4d5127f`): its Blocker 4 already flags "5k adds 2 interval sessions/week" as uncited. It also records that `secondary_goal`, not a new `ancillary_goal` column, is the live home for this concept (one rule, one home).

## Read level per source

| Source | Read level |
|---|---|
| Buist I et al. 2007, GRONORUN design, BMC Musculoskelet Disord, PMC1821023 | **Full text** (Methods, Tables 1–2) |
| Buist I et al. 2008, Am J Sports Med, PMID 17940147 (GRONORUN results) | Abstract |
| Relph N et al. 2023, Int J Environ Res Public Health, PMC10487403 (Couch-to-5k cohort) | Full text, grep-level (Intro, Table 1, Results 3.1) |
| Frandsen JSB et al. 2025, Br J Sports Med, PMC12421110 (session-spike injury cohort) | Full-text abstract and key sections |
| Eddens L et al. 2018, Sports Med, PMC5752732 (intra-session order meta-analysis) | **Full text** (Abstract, Key Points, Table 2, Results, Discussion) |
| de Carvalho e Silva GI et al. 2022, Sports Med Open, PMC9385928 (acute strength-to-running meta-analysis) | Full text (Results, Table 2, Discussion opening) |
| Robineau J et al. 2016, J Strength Cond Res, PMID 25546450 (0/6/24 h recovery RCT) | Abstract |
| Sporer BC, Wenger HA 2003, J Strength Cond Res, PMID 14636098 | Abstract |
| Wilson JM et al. 2012, J Strength Cond Res, PMID 22002517 | Abstract |
| Schumann 2022, Petré 2021, Huiberts 2024, Lundberg 2022 | As read in `docs/research-2026-11-17-session-length-zone2-d32.md`; not re-read |
| Paluch AE et al. 2022, Lancet Public Health, PMID 35247352, PMC9289978 | **Abstract only** (Europe PMC full text returned HTTP 500) |
| Saint-Maurice PF et al. 2020, JAMA, PMID 32207799, PMC7093766 | **Abstract only** (full text 500) |
| Lee IM et al. 2019, JAMA Intern Med, PMID 31141585 | Abstract |
| Ding D et al. 2025, Lancet Public Health, PMID 40713949 | Abstract |
| Tudor-Locke C et al. 2011, Int J Behav Nutr Phys Act, PMC3197470 | Full text, grep-level (Results summaries) |
| Garber CE et al. 2011, ACSM Position Stand, PMID 21694556 | Abstract |
| WebSearch on the origin of 10K / manpo-kei (livescience, bigthink, gulfnews) | SECONDARY tier — used for color only, not cited as authority |

---

## Q1 — Run a 5K: dose and scheduling

### 1a. Running dose for a beginner to *complete* a 5K

**What the primary sources support:**

- **3 sessions a week of run/walk at conversational pace.**
  - GRONORUN (full text) prescribed both arms 3 sessions a week. Runners were told to go "at a comfortable pace at which they could converse without breathlessness" and to add a 5-min brisk-walk warm-up and cool-down.
  - Couch-to-5k (Relph 2023, Table 1) is also 3 runs a week. Week 1 is a 5-min walk, then 8 × (1-min run + 1.5-min walk), about 25 min a session.
- **Progression to roughly 30 min of continuous running in about 8–9 weeks.**
  - The GRONORUN 8-week standard program, aimed at a 6.7 km (4-mile) event, starts at 10 min of running plus 10 min of walking per session (30 min of running a week).
  - It reaches 20–40-min continuous runs in weeks 6–7, with 90–95 min of running a week.
  - Couch-to-5k runs 9 weeks.
- **A slower progression did not reduce injuries.** Buist 2008 randomised 532 novices to the 8-week program or a 13-week "10% rule" program. Injury incidence was 20.3% vs 20.8% (P = .90). The 10%-per-week rule is therefore **not supported** as an injury preventive.
- **Single-session spikes matter more than weekly totals** (Frandsen 2025, 5205 runners, observational).
  - A run more than 10% longer than the longest run in the previous 30 days raised the overuse-injury rate: HRR 1.64 for +10–30%, 2.28 for >+100%.
  - Week-to-week ratio showed no relationship.
  - This supports a cap: "never schedule a run more than 10% longer than the longest run in the last 30 days." The cohort was experienced runners (mean age 45.8, 22% female), not pure novices.
- **Caveats:**
  - Relph 2023 states that Couch-to-5k "lacks an evidence base". Its cohort's total drop-out was 64.5%.
  - GRONORUN is evidence for a working completion dose. It is not evidence that the dose is optimal.
  - ACSM 2011 (abstract) gives the general aerobic floor: ≥30 min/day on ≥5 days (moderate) or ≥20 min on ≥3 days (vigorous). That is a health dose, not a 5K-completion dose.

**What the sources do not support:**

- The Notion protocol's **12–18 miles a week**, **interval plus tempo days**, **4–6 week block** and **"reduce lower body volume by 20%"**. All are uncited.
- 12–18 miles a week is well above what GRONORUN used to get novices through 6.7 km; its peak week was 95 min of running.
- Interval and tempo work is performance (time-goal) programming. Nothing found says a beginner needs it to *complete* a 5K.
- No source was found for a 20% lower-body volume cut. Schumann 2022 found no hypertrophy or max-strength penalty overall, so the cut also has no interference basis. **Do not adopt it** until it is sourced.

### 1b. Scheduling relative to leg lifting

- **Order within a session:** lift first, then run (Eddens 2018, full text, 10 studies). Resistance before endurance gave +6.91% lower-body dynamic strength (95% CI 1.96–11.87, p = .006). Order made no difference to hypertrophy, VO2max or body fat. The authors present this as the fallback "for individuals who are not able to separate" the sessions.
- **Separate days beat the same session:**
  - Robineau 2016 (RCT, abstract): strength gains were lower with 0 h between strength and aerobic work than with 6 h or 24 h. **VO2peak gains were higher with 24 h than with 0 h or 6 h.** So separation also helps the running goal itself. The authors advise against under 6 h between the two qualities.
  - Petré 2021: the lower-body 1RM penalty in trained lifters appears in the same session (ES −0.66) and almost vanishes when sessions are separate (−0.10).
  - Schumann 2022: explosive-strength attenuation appeared only in the same session.
- **The run after a leg day:**
  - de Carvalho e Silva 2022 (full text): with **24 h** between them, even a heavy lower-body session (>80% 1RM / 6RM) did not change submaximal running responses.
  - Shorter gaps (immediate or 6 h) reduced time to exhaustion in 3 of 4 studies, and soreness, creatine kinase and RPE rose.
  - Recommendation: about **24 h between heavy leg lifting and a run**.
- **The leg day after a run:** Sporer & Wenger 2003 (abstract) found leg-press volume impaired for up to 8 h after aerobic work. The impairment was localised to the muscles the aerobic work used; bench press was unaffected. A run the evening or day before a leg day is fine if more than 8 h apart. Running before lifting in the same session is the configuration to avoid.
- **Modality:** running carries more interference than cycling. Wilson 2012 found the hypertrophy and strength decrements with running, not cycling (abstract). Lundberg 2022 found the type I fiber penalty with running. Interference grew with endurance frequency and duration (Wilson).
- **Sex:** Huiberts 2024 found the lower-body strength blunting in males (−0.43), not females (+0.08).

**Is a post-lift run finisher on upper-body days supported?**

- **Partly.** Lift-then-run order is supported (Eddens). On an upper-body day the run is separated from the last leg session by at least a day in most splits, which is the setup Petré, Robineau and de Carvalho e Silva favour.
- Sporer & Wenger's localisation finding suggests upper-body work and running share little fatigue.
- **No study was found of running directly after an upper-body-only session.** That is an inference, not a tested configuration. Flagged.

**Is it contraindicated on leg days?**

- **Not contraindicated as unsafe.** It is the arrangement the evidence most consistently shows costing strength:
  - same session (Petré, Schumann);
  - running rather than cycling (Wilson, Lundberg);
  - trained men (Petré, Huiberts).
- For the Strength goal especially, avoid it. On leg days keep the cycling finisher, or none.
- If running cannot avoid a leg day, run after lifting (Eddens).

---

## Q2 — 10K steps a day

### 2a. Is 10,000 an evidence-based target?

**No, not as a threshold.** The benefit curve flattens below 10K for most adults:

| Source | Finding |
|---|---|
| Paluch 2022 (15 cohorts, n = 47,471; abstract) | Opens by saying 10,000 steps "is widely promoted… there is little evidence to support this". Mortality risk fell until **6,000–8,000 steps/day at age ≥60** and **8,000–10,000 at age <60**. Quartile HRs vs Q1 (~3,553 steps): 0.60, 0.55, 0.47. Stepping rate was not significant for time at ≥100 steps/min once steps were adjusted for. |
| Saint-Maurice 2020 (NHANES, n = 4,840; abstract) | 8,000 vs 4,000 steps: HR 0.49. 12,000 steps: HR 0.35. Step intensity was not associated with mortality after adjusting for total steps. |
| Lee 2019 (n = 16,741 women, mean age 72; abstract) | Calls 10,000 a number with "limited scientific basis". Benefit levelled at about **7,500 steps/day**. |
| Ding 2025 (57 studies; abstract) | Inflection at about **5,000–7,000 steps/day** for mortality, CVD, dementia and falls. 7,000 vs 2,000 steps: 47% lower all-cause mortality. Some outcomes, such as depressive symptoms and diabetes, stay roughly linear. |
| Tudor-Locke 2011 (full text, grep-level) | 10,000 is "reasonable" for healthy adults. Meeting MVPA guidelines translates to about **7,000–8,000 steps/day**. 30 min of moderate walking ≈ **3,000–4,000 steps** at ≥100 steps/min. Interventions typically add 2,000–2,500 steps/day. The 1960s Japanese "manpo-kei" pedometer origin of 10,000 is reported in Tudor-Locke's interviews (SECONDARY press). |

**What this supports:** 10K is a defensible ceiling or user-chosen stretch goal. The health benefit for adults under 60 is mostly captured between about 8K and 10K, and for 60+ between about 6K and 8K. The literature frames steps as **all-day accumulated volume**, not a single bout.

### 2b. Does walking or NEAT interfere with resistance-training adaptations?

- **No direct study was found.** Searched:
  - Europe PMC: walking × resistance training × hypertrophy/strength, concurrent walking, daily steps × resistance training × muscle.
  - WebSearch: the result set was almost all blogs; one fitness-app blog cites a 2025 step-count and muscle-thickness study I could not trace to a primary source.
- **Indirect evidence only (inference, not citation):**
  - Interference scales with endurance intensity, frequency and duration (Wilson 2012).
  - It is located in running, not cycling (Wilson, Lundberg).
  - Schumann 2022 found no hypertrophy or max-strength interference overall.
  - Walking is lower intensity than any modality in those analyses, so meaningful interference is unlikely.
- **Flagged gap:** walking volume was never a tested moderator.

### 2c. A daily target or a session finisher?

- **A daily target outside the session.** Every step study measures habitual all-day steps (accelerometer wear across waking hours). Saint-Maurice and Paluch found total steps, not bout intensity, carried the association.
- A 22-min finisher is only about 2,200–3,000 steps. That figure is derived from Tudor-Locke's ~100 steps/min, so it is my arithmetic, not a measured value.
- Turning the finisher into a walk would change the user's training stimulus without meaningfully moving a 10K daily total.

---

## Q3 — Recommended integration (evidence only; every number marked)

### `run_5k`

1. **Which finishers become running.**
   - On days with **no lower-body lifting** (push, pull, upper), the Zone 2 finisher becomes the run-walk session, done **after** lifting (Eddens 2018 — **sourced**).
   - On **lower-body / full-body days** the finisher stays cycling or elliptical (Wilson 2012, Lundberg 2022 — **sourced**: cycling interferes less).
   - **Strength goal:** no running on leg days at all. Same-session running is where the trained-lifter penalty appears (Petré 2021, Huiberts 2024 — **sourced**).
2. **How many runs.** **3 runs/week** (GRONORUN, Couch-to-5k — **sourced**).
   - If the split has fewer than 3 non-leg training days (2–3-day full-body splits, where every day trains legs), the extra runs go on **rest days** as separate sessions.
   - Robineau 2016 supports this: 24 h separation was better for both strength and VO2peak (**sourced**). The rest-day card is the natural surface.
3. **Spacing.**
   - Place runs about **24 h after** a heavy leg session where the calendar allows (de Carvalho e Silva 2022, Robineau 2016 — **sourced**).
   - A run more than **8 h before** a leg day is acceptable (Sporer & Wenger 2003 — **sourced**, abstract).
4. **Duration and progression.** The run slot does not use the 22 min.
   - It follows a run-walk progression: start about **10 min of running** within a **~20–30 min** session (GRONORUN Table 1, Couch-to-5k week 1 — **sourced**).
   - Reach about **30 min of continuous running by week 8–9** (GRONORUN, Couch-to-5k — **sourced**, as a completion dose, not a proven optimum).
   - Each run is **≤10% longer than the longest run in the prior 30 days** (Frandsen 2025 — **sourced**, observational, experienced runners).
   - **Intensity:** conversational, "converse without breathlessness" (GRONORUN — **sourced**). This is compatible with a Zone 2 label, but no source equates the two. The finisher's "HR 60–70% max" cue is uncited.
   - The **22 min** stays **unsourced** for the cycling finisher on other days.
5. **Do not adopt** the Notion numbers until they are cited. All are **unsourced**:
   - 12–18 mi/week;
   - interval plus tempo days;
   - "reduce lower body volume 20%";
   - "1 heavy leg day/week max";
   - the 4–6 or 6–8 week block.

   The Notion line "replace cardio finishers with running, don't double-count" agrees with the evidence above; it is the cited direction, not the cited source.

### `10k_steps`

1. **Leave the session finisher unchanged.** Steps are a daily volume (Paluch 2022, Saint-Maurice 2020, Tudor-Locke 2011 — **sourced**).
2. Set the Home Steps ring target to **10,000** when `secondary_goal === '10k_steps'`.
   - 10,000 is the **user's chosen** target, not a science threshold. Label it that way and do not claim it as "optimal".
   - The current **8,000** fallback is **unsourced** in code. It does fall inside Paluch's 8–10K range for under-60s, so a citation can be attached rather than the number changed.
   - Needs a check first: whether `steps_goal` comes from the health sync. If it does, a user-set goal must not silently override the device's goal.
3. Optional copy: benefit mostly plateaus around **8–10K under 60 / 6–8K at 60+** (Paluch 2022 — **sourced**). Any increase from baseline helps (Ding 2025, Tudor-Locke 2011 — **sourced**).
4. **Rest-day suggestion.** The existing "30-minute walk" is **unsourced** as a prescription. Tudor-Locke gives 30 min ≈ **3,000–4,000 steps** (**sourced** translation), which can be shown as the reason.
5. **Flag:** no primary source tests walking volume against resistance-training adaptations, so "walking doesn't interfere" stays an inference.

---

## Gaps (searched, empty)

1. A primary RCT of the optimal beginner 5K-*completion* program. GRONORUN and Couch-to-5k are working doses. Couch-to-5k is explicitly described as lacking an evidence base (Relph 2023).
2. Running directly after an upper-body-only lifting session: no study found.
3. Walking or daily steps as a moderator of resistance-training interference: no study found.
4. Every Notion Part 3 5K number (12–18 mi, interval/tempo, −20% lower-body volume, 1 heavy leg day, block length): no source found or given.
5. A Notion `10k_steps` protocol: none exists.
6. Full texts for Paluch 2022 and Saint-Maurice 2020: Europe PMC returned HTTP 500, so both are read at abstract level.

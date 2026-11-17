# Research for handoff steps 6–7 (session length, Zone 2 finisher, D32) — 2026-11-17

Protocol: `exercise-science-research` skill invoked first. Repo sources checked: `DOCTRINE.md`
(D28, D32), `programs.js`, `docs/handoff-2026-11-17.md`, `docs/council-transcript-2026-11-17-d32-weight-direction.md`,
`docs/ingestion-brief-2026-10-19.md`, `research-report (8).pdf` (extracted with pymupdf).
Notion was NOT consulted in this pass (not required by the brief; the Notion claims below are
quoted from where the repo already reproduces them).

**Read levels, stated per source:**
- FULL TEXT (Europe PMC full-text XML, converted and read by section): Iversen 2021; Schumann 2022;
  Schoenfeld 2019 (Methods/Results/Discussion); Chaves 2020 (Results/Table 1); Petré 2021 (abstract +
  Methods + Discussion "Frequency and Duration"); Lundberg 2022 (abstract, Methods, Discussion);
  Huiberts 2024 (abstract + grep of Results/Discussion — not read end to end).
- ABSTRACT ONLY: Wilson 2012; Sabag 2018; Schoenfeld/Ogborn/Krieger 2015; Donnelly 2009 (ACSM);
  Donnelly 2003; Caudwell 2014; Murphy & Koehler 2022; Oppert 2021 (EASO).
- SEARCH SNIPPET ONLY (not verified): Nóbrega 2018 (self-selected cadence ~1.5 s : 1.5 s is quoted
  second-hand inside Chaves 2020's full text).

**Access note for future sessions.** `docs/ingestion-brief-2026-10-19.md` records PMC8449772 as
"reCAPTCHA-blocked on every fetch attempt". It is not blocked through Europe PMC's REST API:
`https://www.ebi.ac.uk/europepmc/webservices/rest/PMC8449772/fullTextXML` returns the full article.
That is the publisher's own open-access text from the PMC record, not a mirror. The same works for any
open-access PMCID.

---

## Q1 — Session length

### (a) Iversen et al. 2021 — what the paper actually says

Iversen VM, Norum M, Schoenfeld BJ, Fimland MS. *No Time to Lift? Designing Time-Efficient Training
Programs for Strength and Hypertrophy: A Narrative Review.* Sports Med 2021;51(10):2079–2095.
PMID 34125411, PMC8449772, doi 10.1007/s40279-021-01490-1. **Narrative review, not a meta-analysis.**
It says most of the studies it cites used untrained or recreationally active people.

| Topic | What it says | Section |
|---|---|---|
| Session duration | No minute threshold anywhere. It describes the typical program as "2–4 sets of 8–10 exercises for 3–12 repetitions with 2–5 min rest… 2–4 times per week", which with warm-up and stretching "often exceed an hour". It names "micro dosing" sessions "e.g. 15 min" as viable, but says the evidence is thin. | Introduction; Training Frequency and Volume |
| Set counts | At least 4 weekly sets per muscle group, ≥10 if more muscle is wanted and time allows. It cites Schoenfeld 2017 (<5, 5–9 and 10+ weekly sets gave ~5%, ~7% and ~10% growth). Weekly volume matters more than frequency. | Training Frequency and Volume; Practical Applications; Table 1 |
| Load | Use a 6–15 RM load. 15–40 reps work if taken near failure. Heavier loads are more time-efficient because fewer reps take less time. | Training Load and Repetitions; Table 1 |
| Exercise selection | At minimum, one leg-press, one upper-body push and one upper-body pull exercise, preferably bilateral and multi-joint. | Abstract; Conclusion; Table 1 |
| Rep velocity | ACSM tempo: slow is 2 s concentric : 4 s eccentric, moderate is 1–2 s : 1–2 s. Hypertrophy is similar for rep durations of 0.5–8 s (cites Schoenfeld 2015). Avoid ≥10 s reps. A "somewhat faster repetition cadence should be employed when time is of the essence". | Other Variables → Repetition Velocity |
| Rest | Guidelines: 3–5 min for strength, 1–2 min for hypertrophy, 30–60 s for endurance. The authors' advice is 1–2 min for untrained people and ≥2 min for trained people, with shorter rest for small muscles and longer rest for heavy multi-joint free-weight lifts. | Rest Periods; Practical Applications |
| Time-saving methods | Supersets, drop sets and rest-pause "roughly halves training time" while keeping volume, but are "probably better at inducing hypertrophy than muscular strength". Table 1: "we do not advise these methods for heavy compound, free-weight exercises such as the squat and bench press". The superset evidence is one longitudinal RCT (Robbins: similar gains in about half the time) plus acute crossover studies, all agonist–antagonist pairs. Drop sets suit single-joint lifts. Rest-pause needs training experience. | Advanced Time-Saving Training Methods; Table 1 |
| Measured durations it reports | Prestes et al.: traditional session 57 min vs rest-pause 35 min. Ozaki et al.: drop set ~2 min vs high-load ~7 min vs low-load ~11–12 min (per exercise). Marshall et al.: 5×4 back squat with 3 min rest = 780 s; with 20 s rest = 140 s; rest-pause = 103 s. | Drop Set; Rest-Pause |
| Warm-up and stretching | Keep warm-ups exercise-specific; specific warm-up is useful above 80% 1RM. Skip general warm-up and stretching when short on time, unless mobility is a goal. | Warm-up and Stretching; Table 1 |

**What it supports:** cutting a short session by (1) keeping multi-joint push, pull and leg work,
(2) keeping weekly sets ≥4 per muscle, (3) cutting rest toward the low end of the goal's band, and
(4) pairing non-primary lifts. This supports D28's shape, and arguably cites it better than the NSCA web
article, because it is peer-reviewed and has a PMID. Its Table 1 caution against supersets on heavy
free-weight compounds is consistent with D8.

**What it does NOT support:** any minute cutoff (45, 60 or 90), any rule mapping a minute bucket to a
session structure, or any per-set time constant. It gives durations only as measured outcomes of
particular studies.

### (b) A sourced constant for time per rep / per set

The engine currently has no sourced value. Primary figures found:

1. **Schoenfeld BJ et al. 2019.** *Resistance Training Volume Enhances Muscle Hypertrophy but Not
   Strength in Trained Men.* Med Sci Sports Exerc 51(1):94–103. PMC6303131. Read in full (Methods,
   Results). Setup: 7 exercises, 8–12 reps to failure, cadence ~1 s concentric : ~2 s eccentric,
   90 s rest between sets, ~120 s between exercises. Results: average session time was **~13 min for
   1 set, ~40 min for 3 sets and ~68 min for 5 sets** per exercise (7, 21 and 35 sets per session).
   - *My arithmetic, not the authors':* the model `work + rests` uses 3 s/rep × ~10 reps ≈ 30 s/set, 90 s
     between sets of an exercise and 120 s between exercises. It predicts 15.5, 43.5 and 71.5 min. That
     is a constant ~3 min over the measured 13, 40 and 68 min. The **marginal cost per added set
     measured in the study is (68 − 13) / 28 ≈ 1.96 min**; the model gives 0.5 + 1.5 = 2.0 min. So the
     formula `sets × (TUT + rest) + transitions` is validated by a measured primary source in trained
     men, at least for this prescription.
2. **Chaves TS et al. 2020.** PeerJ 8:e8697, PMC7061915. Read in full (Table 1). Untrained men, leg
   extension at 70% 1RM to failure. **Self-selected time under tension was 1.8 ± 0.3 s/rep** (1.7 ±
   0.4 s with volume equalised), against 4.0 s for the controlled 2:2 cadence. Its Introduction cites
   Nóbrega 2018 (J Strength Cond Res 32(9):2419) as finding a self-selected cadence of ~1.5 s : 1.5 s
   (3 s/rep). I have not read Nóbrega myself.
3. **ACSM tempo bands, as quoted by Iversen:** 2:4 (6 s) slow, 1–2 : 1–2 (2–4 s) moderate.
   **Schoenfeld, Ogborn & Krieger 2015** (Sports Med, PMID 25601394; abstract only): 0.5–8 s rep
   durations give similar hypertrophy.

**What these support:** a time-per-rep constant of about 2–3 s. Measured self-selected tempo was 1.7–1.8 s
(Chaves, one exercise, untrained men) and about 3 s (Nóbrega, second-hand). Schoenfeld 2019's
prescribed 1:2 cadence was 3 s, and that study shows the resulting session-time model fits within ~3 min.

**What they do NOT support:** a per-exercise value (squat vs curl), a value for women, a figure for
setup or warm-up time beyond Schoenfeld's "~120 s between exercises" and Iversen's warm-up advice, or
any cardio-block time. Treat **3 s/rep** as the sourced choice: it is Schoenfeld 2019's prescribed
cadence, and it is the one validated against measured session time. Flag that this rests on one
validation study.

### (c) A minute threshold tied to session structure

**Not found.** Searched: Iversen 2021 (full text, none), Schoenfeld 2019 (full text: time is reported as
an outcome of set count, not a threshold), and web search for ACSM/NSCA session-length guidance (no
primary source with a per-session minute cutoff). The ACSM 2009 resistance-training position stand was
not re-read in this pass. The one minute threshold found in the literature is a *weekly aerobic*
volume (ACSM 2009 weight-loss stand, see Q3), which is unrelated.

**Conclusion:** the Notion buckets (under 45 / 45–60 / 60–90 / 90+) and `SHORT_SESSION_MAX_MINUTES = 45`
remain uncited. The evidence above supports a different design: *estimate* minutes from the
prescription (Schoenfeld 2019 validates the formula), then fit to the chosen length using Iversen's
priority order (rest toward the band floor → pair non-primary lifts → drop non-major isolation → never
drop below ≥4 weekly sets per muscle or the push/pull/leg compounds). That ordering is a synthesis of
Iversen's recommendations, not an algorithm Iversen states. It is a design proposal for Kerwin or the
council, not a cited rule.

---

## Q2 — Zone 2 finisher on every training day

**What the repo cites today.** `research-report (8).pdf` says MICT "causes minimal interference…
when weekly endurance frequency is ≤2 times per week [1][52][53]", and elsewhere that aerobic frequency
"should not exceed 2 times per week". **Those references are secondary-tier:** [1] is a coaching blog
(tailoredcoachingmethod.com), [52] is an undergraduate degree project (addi.ehu.es) and [53] is a brief
narrative review. No meta-analysis behind the "≤2" number was found in the report. The 22-minute
duration (`programs.js` "Zone 2 · 22 min") and the cue text "20–25 min: long enough for mitochondrial
adaptation" carry no citation.

**Primary meta-analyses:**

| Source | Read | Finding relevant to a daily ~22-min easy finisher after lifting |
|---|---|---|
| Schumann M et al. 2022, Sports Med 52:601–612, PMID 34757594, PMC8891239 | Full text | 43 studies. **No interference on hypertrophy (SMD −0.01) or maximal strength (−0.06).** Explosive strength was attenuated (−0.28), and this was **significant only when done in the same session (≤20 min apart)**, not when sessions were separated by ≥3 h (Results → Explosive Strength). **No frequency moderator:** ">5 vs <5 weekly sessions" (concurrent groups averaged 4.1 vs 6.1 total sessions/wk) and **no cycling-vs-running moderator.** Aerobic intensity could not be analysed because reporting was inconsistent (Discussion, limitations). Mean study quality was PEDro 4.3/10. |
| Petré H et al. 2021, Sports Med, PMID 33751469, PMC8053170 | Full text, key sections | Lower-body 1RM was impaired in **trained** individuals (ES −0.35), **only in the same session** (−0.66 vs −0.10 when sessions were separate). Untrained and moderately trained were unaffected. The included studies averaged **2.6–2.9 endurance sessions/wk at 29–37 min**, so daily dosing is outside the studied range. Discussion quotes Wilson: strength fell as endurance went from 20–30 to 50–60 min/day and from 1 to 5 sessions/wk. It also cites Jones et al.: 3×/wk worse than 1×/wk in resistance-trained people. |
| Huiberts RO, Wüst RCI, van der Zwaard S. 2024, Sports Med 54(2), PMID 37847373, PMC10933151 | Abstract + sections | 59 studies. Concurrent training **blunted lower-body strength in males (−0.43) but not females (+0.08)**. There was no sex difference for upper-body strength, power or VO2max, and too few data on hypertrophy. |
| Lundberg TR et al. 2022, Sports Med 52:2391–2403, PMID 35476184, PMC9474354 | Full text, key sections | Small fiber-level hypertrophy penalty (SMD −0.23, p = 0.05). Type I fibers were hit by **running, not cycling** (−0.81). Frequency subgroup was not significant. |
| Wilson JM et al. 2012, J Strength Cond Res 26(8):2293–2307, PMID 22002517 | **Abstract only** | Running, but not cycling, decreased hypertrophy and strength. Endurance **frequency (r −0.26 to −0.35) and duration (r −0.29 to −0.75)** were negatively correlated with hypertrophy, strength and power. Schumann 2022 says its newer analysis does *not* confirm the hypertrophy correlations, and attributes Wilson's result to method (per-group effect sizes, fiber outcomes included). |
| Sabag A et al. 2018, J Sports Sci 36(21):2472–2483, PMID 29658408 | **Abstract only** | Concurrent **HIIT** lowered lower-body strength gains (ES −0.248). Hypertrophy and upper-body strength were not affected. Not a Zone 2 study. |

**What this supports:**
- For **Build Muscle / Maintain / Transform**, the best current meta-analysis (Schumann 2022) finds no
  hypertrophy or maximal-strength penalty from concurrent aerobic work and no frequency effect. This
  does **not** support the repo's "≤2/week" ceiling as a hard limit for hypertrophy goals.
- Cycling and walking-type modalities are the safer choice. Running is where both Wilson and Lundberg
  locate the penalty.

**What it contradicts or cautions:**
- **Strength goal, same-session placement.** The finisher is appended to the same session, after
  lifting, so it is "same session" by Schumann's (≤20 min) and Petré's (<20 min) definitions. That is
  the one configuration that repeatedly shows interference: explosive strength (Schumann), trained
  lower-body 1RM (Petré), and males' lower-body strength (Huiberts). An every-day same-session finisher
  on the **Strength** goal is the case the evidence argues against most directly.

**What NO source tested:** daily (4–6×/wk) ~20-min Zone 2 immediately after lifting. The studied doses
average ~3 sessions/wk of ~30 min, and "Zone 2"/low intensity was not a moderator anyone could analyse.
So no source either supports or refutes the daily 22-minute finisher specifically. **Flagged gap.** The
22-min figure itself is uncited.

---

## Q3 — D32 (20 lb threshold, men-only, mid-block recompute)

D32 (`DOCTRINE.md`) gates men's `fat_burn` finisher on `weightDeltaLbs = max(0, current − goal) > 20`.
Women are never gated. The only source is the Notion Programming Architecture Reference, Part 2 notes.
Peer review in `docs/council-transcript-2026-11-17-d32-weight-direction.md` already flagged the
threshold and the men-only scope as resting on that note alone.

**Weight-loss threshold that should change program structure — not found.**
- **Donnelly JE et al. 2009,** ACSM Position Stand, Med Sci Sports Exerc 41(2):459–471, PMID 19127177
  (abstract only). Thresholds are **relative** (3–5% of body weight reduces health risk; NHLBI's 10%),
  and the activity dose is set in **min/week**: 150–250 min/wk gives modest loss, >250 min/wk is
  associated with clinically significant loss. "Resistance training does not enhance weight loss but
  may increase fat-free mass". No absolute-pounds cutoff and no program-structure switch.
- **Oppert JM et al. 2021,** EASO, Obes Rev, PMID 34076949, PMC8365734 (abstract only). Moderate
  aerobic exercise is preferred for weight and fat loss ("not more than 2 to 3 kg"). Resistance
  training preserves lean mass. No threshold and no sex split.
- Supports: if a threshold is wanted, the literature frames it as **% of body weight**, and the cardio
  dose as **weekly minutes**. Does not support: 20 lb, or any absolute-pound trigger.

**Sex-specific differences:**
- **Donnelly JE et al. 2003,** Midwest Exercise Trial, Arch Intern Med 163(11):1343–1350, PMID 12796071
  (abstract only). After 16 months of supervised moderate exercise on an ad-lib diet, men lost
  5.2 ± 4.7 kg and women maintained weight (controls gained).
- **Caudwell P et al. 2014,** Exerc Sport Sci Rev, PMID 24949844 (abstract only). This is a systematic
  review hypothesising that when exercise energy expenditure is matched, there is no sex difference in
  the weight response. The abstract states the hypothesis; I did not read the conclusion text.
- **Huiberts 2024** (above). Men, not women, showed blunted lower-body strength with concurrent
  training.
- Supports: a sex difference in *strength interference* from cardio (men more affected). That is
  directionally consistent with making cardio optional for men, but it is a strength finding, not a
  fat-loss one, and it carries no weight threshold. Does not support: men-only gating by pounds to lose.
  The fat-loss sex difference in Donnelly 2003 may be an energy-expenditure artefact, per Caudwell 2014.

**Re-evaluating goals mid-mesocycle — not found.** Web search returned only practitioner and vendor
pages (coaching blogs, study guides, an RP-adjacent vendor page saying body composition is judged after
8–12 weeks). These are SECONDARY tier and cannot be cited. No primary source specifies when a
body-weight-derived program input should be re-evaluated. Whether to freeze `weightDeltaLbs` at block
start or recompute it live is therefore an engineering and judgment call (the `llm-council` path per
CLAUDE.md), not a science-answerable one. The one related invariant is D15 (≥8-week primary-block
stability), which argues by analogy for freezing at block boundaries. That is an inference, not a
citation.

Murphy & Koehler 2022 (Scand J Med Sci Sports, PMID 34623696, abstract only) is already cited in D32.
Its abstract says lean-mass gains are impaired in a deficit while strength gains are comparable, and
advises avoiding deficits >500 kcal/day to preserve lean mass. It does not bear on a cardio threshold.

---

## Gaps (searched, came up empty)
1. A per-session minute threshold tied to structure: Iversen 2021, Schoenfeld 2019 and web search for
   ACSM/NSCA returned none.
2. A per-exercise or per-sex rep-time constant: only single-exercise data in men (Chaves 2020) and
   one validated cadence (Schoenfeld 2019).
3. Any study of a daily low-intensity finisher after lifting: the tested range is ~3×/wk at ~30 min.
4. A source for the repo's "≤2/week" aerobic ceiling beyond a blog, a thesis and a brief review. The
   primary meta-analysis (Schumann 2022) found no frequency moderator.
5. A source for an absolute-pound weight-loss threshold, or for men-only gating.
6. A source on re-evaluating goals mid-mesocycle.

# D6c — within-block MEV→MRV ramp: source search (2026-10-13)

Question (DOCTRINE.md D6c, status "needs numeric ramp cadence"): is there a citable per-week
set-count cadence for ramping a muscle from near-MEV toward MRV across a mesocycle?
Run per CLAUDE.md Directive 3 (find the answer before flagging the gap).

## Searched, in order

1. **Canonical Notion reference** (`399ca37f935b8172acaafc541b703726`, read in full 2026-10-13).
   §1 gives MEV/MAV/MRV by goal and a per-training-age "progression rate" column
   ("every 1-2 wks / 2-4 wks / 4-12 wks"). That column is a load/progression pacing signal
   (§4), not a within-block set-ramp. The 2026-09-23 and 2026-10-07 sections cover per-session
   and per-exercise ceilings only. **Silent on a ramp cadence.**
2. **`research-report (8).pdf`** (extracted, grepped for ramp / accumulation / progression /
   MEV→MRV). Gives "4 weeks accumulation + 1 week deload" and "15-25+ sets per muscle group per
   week during accumulation phases". No week-by-week step. **Silent on cadence.**
3. **Repo docs** (`DOCTRINE.md`, `program-validator-spec.md`, `docs/research/*`, council
   transcripts). Nothing beyond D6c's own text.
4. **Live search (WebSearch works; WebFetch to pubmed.ncbi.nlm.nih.gov, rpstrength.com,
   renaissanceperiodization.com and lida.sport-iat.de is denied by the egress proxy, 403 CONNECT,
   organization policy)**. Full texts therefore could NOT be read; findings below rest on
   search-result abstracts/snippets and are labelled accordingly.

## Found

**PRIMARY (peer-reviewed):** Israetel M, Feather J, Faleiro TV, Juneau CE. *Mesocycle
Progression in Hypertrophy: Volume Versus Intensity.* Strength Cond J 2020;42(5):2-6.
DOI 10.1519/SSC.0000000000000518.
- Abstract (via search result): addresses week-to-week progression over a typical 4-8 weeks
  before a recovery week; concludes the best approach is likely a mix of adding load, reps and
  sets, with **progression in set numbers probably the best supported**.
- This corroborates D6c's *shape* (volume climbs within a block) with a peer-reviewed cite.

**CONTESTED:** two letters in the same issue (Minor, Helms, Schepis, and a reply from the
authors) object to the paper's example of *roughly doubling set volume across a mesocycle*
while also raising load weekly, citing injury risk / RPE; one argues that progressing to
maximum recoverable volume is unnecessary and may be suboptimal. (Letter titles seen via search:
"RE: Mesocycle Progression in Hypertrophy: Volume Versus Intensity", SCJ 2020.)

**SECONDARY only (not citable per the domain-tiering rule):** commercial/secondary pages
(e.g. arvo.guru, liftvault) state "+1 set per muscle per week from MEV" and a 12→20
sets/week six-week example attributed to Israetel. These could not be traced to a primary
statement. Treat as unverified.

**Related primary, already in repo:** Remmert et al. 2025 (preprint) per-session ceiling and
Krieger 2010 / Hackett 2018 / Ratamess 2009 per-exercise bounds (D33/D35). These cap the TOP of
any ramp per session/exercise regardless of cadence.

## Verdict

- Shape: now has a primary citation (Israetel et al. 2020), and a documented dissent.
- **Numeric per-week cadence: NOT found at primary tier.** The only candidate numbers
  (+1 set/muscle/wk; ~doubling over a block) are secondary or contested. Not enough to write
  into code. D6c stays PENDING; no number invented.
- The gap is therefore a source gap that needs either (a) the full text of the 2020 SCJ paper
  (egress denied here — Kerwin can supply the PDF the way the Remmert preprint was supplied), or
  (b) a ruling on whether to adopt the contested "+1 set/wk" convention as SCIENCE_DEFAULT with
  the dissent recorded.

## Not done (deliberately)
- `DOCTRINE.md` / `scripts/doctrine.mjs` untouched. Per CLAUDE.md, a doctrine change goes
  Notion first, then both files together; a status-text edit from snippet-level reading would
  put an unverified citation into the binding document.

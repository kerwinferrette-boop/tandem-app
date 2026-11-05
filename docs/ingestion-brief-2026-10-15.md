# Tandem Ingestion Brief - 2026-10-15

Scheduled run: tandem-ingestion-mwf

## Committed this run

None. Zero commits landed. Two separate blockers, both confirmed this run, neither worked around:

- **Git push to origin is unreachable** - carried forward from earlier in this run, re-confirmed, not a new issue. No branch work was attempted and no dirty tree was left behind.
- **`notion-query-data-sources` (SQL-mode Notion queries) hit `usage_limit_reached`** this run when I tried to check Domain-value precedent before writing the two Track C rows below. I did not fabricate a workaround result - I flagged the Domain value as UNVERIFIED on both new rows instead (see "Unverified and unresolved"). If you want this fixed, the tool's own guidance offers two paths: try again later, or [upgrade to Notion Business](https://app.notion.com/notion-mcp-claude?source=mcp_tool_upsell_Anthropic%2FClaudeAI&tool=query_data_sources&product=business&mcpRequestId=925c905d-6faf-44a2-8d2f-2243e2874e88&mcpUpsellOpportunityId=c802792c-00d0-453b-a2c3-7e88adeda4da&mcpClickSource=markdown_link&spaceId=2b4ca37f-935b-81d0-8c41-0003853c4ee9&notionAccountId=360d872b-594c-81d8-90d1-0002613bbb1f&action=learn_more) for higher limits. I'm not making a performance claim either way - that's your call.

Track A + Track B: 0 of the 3-item budget used. Nothing cleared the bar for a code change this run.

## Snapshot delta

Not applicable - nothing was pushed, so there is no snapshot to diff. Reporting this explicitly rather than skipping the section, per the brief format.

## Corpus (Track C)

Two findings logged to Engine Science Proposals, both Status = Logged, neither committed to code or doctrine (Track C never touches code):

1. **D6c, partial/lower-limb-only** - Enes/De Souza/Souza-Junior 2024 RCT, weekly-set-increment comparison (n=31 completers of 43 recruited). Logged as "Extends / refines" D6c's numeric-ramp gap, not a resolution. It's lower-limb-only and single-study, so it doesn't close D6c's all-muscle-group numeric-cadence question - I said that in the Notion row rather than overstating it.
2. **Pullover variant, citation-only** - Washif et al. 2024 (javelin throwers, n=7). The bent-arm pullover variant showed the closest EMG match to the throw pattern for posterior deltoid, clavicular pec major, and lat dorsi. Logged as Track C / Type=Other, not Track A, because I could only verify 3 of what would need to be a full muscle-tag list to responsibly write an Exercise Intake row - I didn't fill in the rest by guessing. Dup-checked against programs.js (only db-pullover exists) and Exercise Intake (zero pullover rows) - this is not a duplicate.

I decided not to log a third row against D28 this run - no new numeric-cutoff evidence turned up, and a new row would have been a thin near-duplicate of the D28 finding already logged 2026-09-16. That keeps Track C at 2 of the 2-4 budget, which is where the research time actually landed given how much of the budget went to the D4b/D6c/D6d/D28 blockers as instructed.

## Parked invariants (status, not touched unless noted)

- **D4b** - still "Kerwin Reviewing." Bell et al. 2025 gives one periodicity band (every 4-8 weeks) for all trainees, with volume reduction stratified by recovery need, not training age. Three options are still open and nothing moved on this row this segment: (1) leave D4b parked as-is, (2) rewrite D4b to stratify on recovery need using Bell et al.'s bands, (3) promote D4b at the single 4-8 week band for everyone, dropping the per-experience version. Decision below in "Parked for Kerwin."
- **D6b** - active, not touched this segment.
- **D8** - not touched or researched this segment at all. Saying that plainly rather than omitting it.
- **D6c** - addressed above via the new Track C row. Still PENDING a real numeric cadence for the full invariant; today's finding is a partial corroboration, not a close.
- **D6d** - Untested. 126 below-MEV cells confirmed in the wider tier x experience x duration sweep, 72 of them new versus the old engine (54 home 2-day anterior-delt + 18 3-day beginner full_gym hamstring). Blocked on tagging - the only home-tier bank entry with a primary anterior-delt tag is Jumping Jacks. Not resolved this segment.

## Parked for Kerwin

**Top item - an authorization discrepancy, not a bookkeeping note.** `programs.js` has a live, committed entry for `inclined-torso-lat-pulldown` (SHA 061e357c, 2026-10-05) with an inline comment reading "Kerwin's ruling (2026-10-05): approved as a new entry." I went and checked the actual Exercise Intake Notion row for that same exercise (the system of record), and its Status is still "Proposed" - Branch and Merged Commit are both empty, and the row itself poses an unresolved three-way question: (1) new bank entry, (2) cue refinement on the existing lat-pulldown instead, or (3) neither, since the EMG difference found was in posterior deltoid activation only (p=0.002 for wide-pronated-at-30-degrees vs. wide-pronated-upright and vs. wide-neutral) with no hypertrophy or strength outcome measured, and lat dorsi/traps/biceps/infraspinatus were flat across all seven variants tested (p = 0.298-0.868). The row's own author wrote "I did not guess... option 2 is the more honest change given what the citation actually supports, but option 1 is the one that would move the engine, and that tradeoff is yours to make." Somewhere, option 1 got selected and shipped, but the Notion record never advanced past "Proposed." I'm not assuming this is an innocuous sync lag and I'm not assuming it's fabricated - I'm flagging the gap exactly as I found it. Your call: was this ruling actually made outside of what got written back to Notion, or does the code need to be revisited?

- **D4b** - your call on the three options above (leave parked / rewrite to recovery-need axis / promote at single band for everyone).
- **D6c** - still needs a real numeric cadence; today's RCT only corroborates the lower-limb shape and magnitude.
- **rir_by_week (Track D)** - Status still "Drafted." Council verdict (2026-10-04) was "BUILD, but not without a named consuming-code roadmap commitment." It's independently confirmed that `rep_scheme_by_week` and `technique_by_week` are the live precedent pattern (programs.js lines 3764/3806/3818, tandem.html line 5573) - this corrected a factual error 3 of 5 peer-review sub-agents made during council. No code or doctrine was touched this run either way; this sits on you for the roadmap-commitment decision and a pre-schema synthesis step before any migration gets written.

## Corpus state

I can't give you fresh row counts this run - the SQL-mode query that would normally pull them is the same one that hit the usage limit. Qualitatively: Engine Science Proposals gained 2 new Logged rows this run (D6c, pullover). Nothing else in Exercise Intake, Program Intake, or Engine Science Proposals was added, moved, or re-statused by me this segment beyond those 2 writes - everything else reported above (D4b, D6b, D8, D6d, rir_by_week, the lat-pulldown row) was read, not changed.

## Unverified and unresolved

- Git push to origin - still unreachable.
- `notion-query-data-sources` - still usage-limited; link above if you want to address it.
- Domain = "Foundations - Muscle & Adaptation" on both new Track C rows is flagged UNVERIFIED against precedent, since I couldn't run the query that would confirm it's the right bucket versus some other Domain value already in use for similar findings.
- The pullover variant's full muscle-tag list is intentionally incomplete (3 of what would need to be ~9 for a proper bank entry) - not fabricated, not guessed.
- D6c's numeric-cadence gap is still open after today's finding - it's a partial, not a close.

## Kerwin's exact next action

1. Rule on the inclined-torso-lat-pulldown authorization gap - was the "approved as a new entry" call actually made, and if so where, since Notion never recorded it?
2. Pick one of the three D4b options.
3. Decide on rir_by_week's roadmap commitment and the pre-schema synthesis step.
4. Optional: consider the Notion Business upgrade if the query limit keeps blocking runs like this one.

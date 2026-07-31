// EPIC-031 Phase 2d — seed program author
// Expands the compact chassis definitions below into seeds/*.json (the authored
// program artifacts the doctrine D16 gate validates and sync-seed-programs.mjs
// turns into SQL). Reproducible: edit the chassis here, re-run, re-validate.
//
// Programs (Named Program Variants, Notion collection 78f9922a-6853-4f93-a9b2-2558a5c1bec4):
//   Brick by Brick  — build_muscle, 12wk, 4-day body-part split, 3×4wk blocks,
//                     reps 12-15 → 9-11 → 6-8 (primaries 3-5 via rep_floor override,
//                     D16's live test). Techniques wks 1-3 of blocks 1-2 only;
//                     block 3 runs clean end-to-end (heavy phase + Kerwin's
//                     clean-block-final-week rule covers wks 4/8/12 regardless).
//   Redline Recomp  — transform, same chassis, cardioacceleration on accessories
//                     wks 1-3 of every block, shorter rests, reps inside the
//                     8-12 transform band (no overrides needed).
//
// AUTHORING SOURCES: split + rep arc per EPIC-031 plan §5 + Programming
// Architecture Reference; deload/realization weeks (4/8/12) from programs.js
// deloadWeeks/realizationWeek — techniques never scheduled on them.
// FLAGGED ASSUMPTION (needs Kerwin): block 3 carries NO intensifier techniques
// at all (not just clean finals) — heavy 3-5 work and rest-pause don't mix.
//
// Usage: node scripts/author-seeds.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KERWIN = 'e636007d-194f-4440-a2cc-9bc514957c64';

// The shared 4-day body-part chassis. role: pc=primary_compound (constant),
// sc=secondary_compound, ac=accessory, co=core. tech: takes the block technique.
const CHASSIS = [
  { label: 'Chest + Triceps', targets: ['chest', 'triceps'], exs: [
    ['flat-barbell-press', 'pc'], ['incline-db-press', 'sc'], ['close-grip-barbell-press', 'sc'],
    ['pec-deck', 'ac', 'tech'], ['skull-crusher', 'ac'], ['tricep-rope-pushdown', 'ac', 'tech'],
  ]},
  { label: 'Back + Biceps + Abs', targets: ['back', 'biceps', 'abs'], exs: [
    ['barbell-row', 'pc'], ['lat-pulldown', 'sc'], ['seated-cable-row', 'sc'],
    ['barbell-curl', 'ac', 'tech'], ['incline-db-curl', 'ac'],
    ['cable-crunch', 'co'], ['hanging-leg-raise', 'co'],
  ]},
  { label: 'Shoulders + Traps + Calves', targets: ['shoulders', 'traps', 'calves'], exs: [
    ['barbell-ohp', 'pc'], ['seated-db-shoulder-press', 'sc'],
    ['db-lateral-raise', 'ac', 'tech'], ['reverse-pec-deck', 'ac'], ['shrug-barbell', 'ac'],
    ['standing-calf-raise', 'ac', 'tech'], ['seated-calf-raise', 'ac'],
  ]},
  { label: 'Legs + Abs', targets: ['quads', 'hamstrings', 'glutes', 'abs'], exs: [
    ['barbell-back-squat', 'pc'], ['romanian-deadlift', 'sc', 'const'], ['leg-press', 'sc'],
    ['leg-extension', 'ac', 'tech'], ['lying-leg-curl', 'ac'],
    ['weighted-decline-sit-up', 'co'], ['ab-wheel-rollout', 'co'],
  ]},
];

const ROLE = { pc: 'primary_compound', sc: 'secondary_compound', ac: 'accessory', co: 'core' };

// Per-program, per-block prescription: reps by role, rest by role, block technique.
const PROGRAMS = {
  'brick-by-brick': {
    template: {
      name: 'Brick by Brick', slug: 'brick-by-brick', author_id: KERWIN,
      is_published: true, author_attribution: 'Tandem',
      parent_goal: 'build_muscle', code_goal_mapping: 'build_muscle',
      duration_weeks: 12, days_per_week: 4, split_type: 'body_part',
      intensity_tier: 'full_gym', difficulty: 'intermediate',
      tagline: 'Twelve weeks. Four days. Zero guesswork.',
      description: 'A 12-week body-part split built the old way and programmed the new way: the same first lift for every muscle all twelve weeks, three 4-week phases that walk reps from 12-15 down to a heavy 3-5 finish, and every fourth week pulled back on purpose.',
      coaching_notes: 'Primaries never change — that is the point. Log the same lift for twelve weeks and watch the bar load climb. Rest-pause and drop sets appear only on weeks 1-3 of the first two phases; deload and test weeks run clean.',
      science_overrides: { rep_floor: 3 },
      source_provenance: { inspiration: 'classic body-part split era', rebuild: 'own-brand, Tandem-authored', authored: '2026-07-24' },
    },
    principles: [{
      principle_key: 'rep_floor',
      claim: 'A final-phase 3-5 rep strength block is legal inside a build_muscle (hypertrophy) program, deviating from the D10 band floor of 6.',
      rationale: 'Phase potentiation: after eight weeks of 12-15 and 9-11 hypertrophy work, a short heavy block converts accumulated volume into expressible strength and feeds the week-12 realization test. Scoped to primary lifts in phase 3 only; accessories stay at 6-8.',
      source_citation: 'EPIC-031 plan §5 + D16 Notion page 3a7ca37f935b81ce8e88dff8a505fb12 (worked example); approved by Kerwin 2026-07-24. UNVERIFIED against repo research reports — no repo source names a 3-5 block inside hypertrophy programs; research-citation upgrade flagged, not fabricated.',
    }],
    blocks: [
      { name: 'Phase 1 — Base',  reps: { pc: '12-15', sc: '12-15', ac: '12-15', co: '12-15' }, rest: { pc: 90,  sc: 90,  ac: 60, co: 45 }, technique: 'rest_pause' },
      { name: 'Phase 2 — Build', reps: { pc: '9-11',  sc: '9-11',  ac: '9-11',  co: '10-12' }, rest: { pc: 120, sc: 105, ac: 75, co: 45 }, technique: 'drop_set' },
      { name: 'Phase 3 — Peak',  reps: { pc: '3-5',   sc: '6-8',   ac: '6-8',   co: '8-10' },  rest: { pc: 180, sc: 120, ac: 90, co: 60 }, technique: null },
    ],
    sets: { pc: 4, sc: 3, ac: 3, co: 3 },
  },
  'redline-recomp': {
    template: {
      name: 'Redline Recomp', slug: 'redline-recomp', author_id: KERWIN,
      is_published: true, author_attribution: 'Tandem',
      parent_goal: 'transform', code_goal_mapping: 'transform',
      duration_weeks: 12, days_per_week: 4, split_type: 'body_part',
      intensity_tier: 'full_gym', difficulty: 'intermediate',
      tagline: 'Same iron. No sitting down.',
      description: 'Brick by Brick\u2019s chassis run at recomp pace: the same fixed primaries and 4-day split, but short rests and cardioacceleration bursts between accessory sets keep the heart rate up while the bar still goes up.',
      coaching_notes: 'Cardioacceleration means 30-60 seconds of jumping jacks, high knees, or bike between accessory sets instead of sitting. Primaries are still trained heavy and rested honestly — never rush the first lift. Deload and test weeks run clean.',
      science_overrides: {},
      source_provenance: { inspiration: 'Brick by Brick chassis + cardioacceleration variant', rebuild: 'own-brand, Tandem-authored', authored: '2026-07-24' },
    },
    principles: [],
    blocks: [
      { name: 'Phase 1 — Base',  reps: { pc: '10-12', sc: '10-12', ac: '10-12', co: '10-12' }, rest: { pc: 90,  sc: 60, ac: 40, co: 30 }, technique: 'cardioacceleration' },
      { name: 'Phase 2 — Build', reps: { pc: '8-10',  sc: '8-10',  ac: '10-12', co: '10-12' }, rest: { pc: 105, sc: 75, ac: 40, co: 30 }, technique: 'cardioacceleration' },
      { name: 'Phase 3 — Peak',  reps: { pc: '8-10',  sc: '8-10',  ac: '8-10',  co: '10-12' }, rest: { pc: 120, sc: 90, ac: 45, co: 30 }, technique: 'cardioacceleration' },
    ],
    sets: { pc: 4, sc: 3, ac: 3, co: 3 },
  },
};

// Superset-type techniques may not sit on compounds (D5 SAFETY clause); the
// authoring rule here is stricter: block techniques land only on 'tech'-flagged
// accessories. Weeks 1-3 only — global weeks 4/8/12 are deload/realization.
const TECH_WEEKS = { 1: true, 2: true, 3: true };

const outDir = path.join(root, 'seeds');
fs.mkdirSync(outDir, { recursive: true });

for (const [slug, def] of Object.entries(PROGRAMS)) {
  const blocks = def.blocks.map((b, bi) => ({
    block_order: bi + 1,
    week_start: bi * 4 + 1,
    week_end: bi * 4 + 4,
    name: b.name,
    rep_scheme_by_week: { 1: `${b.reps.pc} primaries`, 2: `${b.reps.pc} primaries`, 3: `${b.reps.pc} primaries`, 4: bi === 2 ? 'realization — top set' : 'deload — volume cut' },
    technique_by_week: b.technique
      ? Object.fromEntries([1, 2, 3, 4].map(w => [w, TECH_WEEKS[w] ? b.technique : 'none']))
      : { 1: 'none', 2: 'none', 3: 'none', 4: 'none' },
    days: CHASSIS.map((day, di) => ({
      day_order: di + 1,
      label: day.label,
      muscle_targets: day.targets,
      exercises: day.exs.map(([exSlug, roleKey, flag], ei) => ({
        slug: exSlug,
        ex_order: ei + 1,
        sets: def.sets[roleKey],
        reps: def.blocks[bi].reps[roleKey],
        rest: def.blocks[bi].rest[roleKey],
        role: ROLE[roleKey],
        technique: (flag === 'tech' && b.technique) ? b.technique : null,
        constant_across_program: roleKey === 'pc' || flag === 'const',
      })),
    })),
  }));
  const seed = { template: def.template, principles: def.principles, blocks };
  const file = path.join(outDir, `${slug}.json`);
  fs.writeFileSync(file, JSON.stringify(seed, null, 2) + '\n');
  const exCount = blocks.reduce((n, b) => n + b.days.reduce((m, d) => m + d.exercises.length, 0), 0);
  console.log(`Wrote ${file} — ${blocks.length} blocks, ${blocks[0].days.length} days/block, ${exCount} exercise rows`);
}

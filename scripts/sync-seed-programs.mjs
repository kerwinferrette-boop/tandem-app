// EPIC-031 Phase 2d — seeds/*.json → SQL generator
// Emits migrations/epic031_seed_programs.sql from the authored seed files.
// Refuses to emit if the doctrine D16 gate fails (a bad seed never reaches SQL).
// Idempotent: workout_templates upserts on slug; child blocks/days/exercises are
// wiped and reinserted per template; program_principles upserts on principle_key.
// exercise_id resolution uses SELECT ... INTO STRICT — apply epic031_program_library.sql
// and epic031_exercises_seed.sql FIRST or this raises loudly (never silently skips).
//
// Usage: node scripts/sync-seed-programs.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Gate first — D16 is law for authored programs.
try { execFileSync('node', [path.join(root, 'scripts', 'doctrine.mjs')], { stdio: 'pipe' }); }
catch (e) { console.error('doctrine gate FAILED — fix the seeds before generating SQL.\n' + e.stdout); process.exit(1); }

const q = (s) => s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`;
const arr = (a) => `array[${(a || []).map(q).join(',')}]::text[]`;
const jb = (o) => `${q(JSON.stringify(o || {}))}::jsonb`;

const seedsDir = path.join(root, 'seeds');
const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.json')).sort();
const parts = [];

for (const fname of files) {
  const seed = JSON.parse(fs.readFileSync(path.join(seedsDir, fname), 'utf8'));
  const t = seed.template;
  const L = [];
  L.push(`-- ── ${t.name} (${t.slug}) — from seeds/${fname} ──`);
  L.push(`do $$`);
  L.push(`declare tid uuid; bid uuid; did uuid; eid uuid;`);
  L.push(`begin`);
  L.push(`  insert into public.workout_templates`);
  L.push(`    (name, slug, author_id, is_published, author_attribution, parent_goal,`);
  L.push(`     code_goal_mapping, duration_weeks, days_per_week, split_type,`);
  L.push(`     equipment_tier, difficulty, tagline, description, coaching_notes,`);
  L.push(`     science_overrides, source_provenance)`);
  L.push(`  values (${q(t.name)}, ${q(t.slug)}, ${q(t.author_id)}, ${t.is_published === true}, ${q(t.author_attribution)}, ${q(t.parent_goal)},`);
  L.push(`     ${q(t.code_goal_mapping)}, ${t.duration_weeks}, ${t.days_per_week}, ${q(t.split_type)},`);
  L.push(`     ${q(t.equipment_tier)}, ${q(t.difficulty)}, ${q(t.tagline)}, ${q(t.description)}, ${q(t.coaching_notes)},`);
  L.push(`     ${jb(t.science_overrides)}, ${jb(t.source_provenance)})`);
  L.push(`  on conflict (slug) do update set`);
  L.push(`    name = excluded.name, author_attribution = excluded.author_attribution,`);
  L.push(`    parent_goal = excluded.parent_goal, code_goal_mapping = excluded.code_goal_mapping,`);
  L.push(`    duration_weeks = excluded.duration_weeks, days_per_week = excluded.days_per_week,`);
  L.push(`    split_type = excluded.split_type, equipment_tier = excluded.equipment_tier,`);
  L.push(`    difficulty = excluded.difficulty, tagline = excluded.tagline,`);
  L.push(`    description = excluded.description, coaching_notes = excluded.coaching_notes,`);
  L.push(`    science_overrides = excluded.science_overrides,`);
  L.push(`    source_provenance = excluded.source_provenance, updated_at = now()`);
  L.push(`  returning id into tid;`);
  // D16 ordering: principles BEFORE the template upsert would be ideal, but the
  // trigger fires on insert/update of workout_templates — so principles must
  // already exist. Emit principle upserts first (template link patched after).
  L.push(`  delete from public.template_blocks where template_id = tid;`);
  for (const b of (seed.blocks || [])) {
    L.push(``);
    L.push(`  insert into public.template_blocks (template_id, block_order, week_start, week_end, name, rep_scheme_by_week, technique_by_week)`);
    L.push(`  values (tid, ${b.block_order}, ${b.week_start}, ${b.week_end}, ${q(b.name)}, ${jb(b.rep_scheme_by_week)}, ${jb(b.technique_by_week)})`);
    L.push(`  returning id into bid;`);
    for (const d of (b.days || [])) {
      L.push(`  insert into public.template_days (template_id, block_id, day_order, label, muscle_targets)`);
      L.push(`  values (tid, bid, ${d.day_order}, ${q(d.label)}, ${arr(d.muscle_targets)}) returning id into did;`);
      for (const ex of (d.exercises || [])) {
        L.push(`  select id into strict eid from public.exercises where slug = ${q(ex.slug)};`);
        L.push(`  insert into public.template_exercises (day_id, exercise_id, ex_order, sets, reps, rest, role, technique, constant_across_program)`);
        L.push(`  values (did, eid, ${ex.ex_order}, ${ex.sets}, ${q(ex.reps)}, ${ex.rest}, ${q(ex.role)}, ${q(ex.technique)}, ${ex.constant_across_program === true});`);
      }
    }
  }
  for (const p of (seed.principles || [])) {
    L.push(``);
    L.push(`  insert into public.program_principles (principle_key, claim, rationale, source_citation, created_by, template_id)`);
    L.push(`  values (${q(p.principle_key)}, ${q(p.claim)}, ${q(p.rationale)}, ${q(p.source_citation)}, ${q(t.author_id)}, tid)`);
    L.push(`  on conflict (principle_key) do update set`);
    L.push(`    claim = excluded.claim, rationale = excluded.rationale,`);
    L.push(`    source_citation = excluded.source_citation, template_id = excluded.template_id;`);
  }
  L.push(`end $$;`);
  parts.push(L.join('\n'));
}

// D16 trigger fires on workout_templates write, and each template's principles
// are inserted inside the same DO block AFTER the template row. If the trigger is
// BEFORE/AFTER per-statement this ordering matters — so principles are ALSO
// emitted standalone up front, before any template block runs.
const principleHeader = [];
for (const fname of files) {
  const seed = JSON.parse(fs.readFileSync(path.join(seedsDir, fname), 'utf8'));
  for (const p of (seed.principles || [])) {
    principleHeader.push(
`insert into public.program_principles (principle_key, claim, rationale, source_citation, created_by)
values (${q(p.principle_key)}, ${q(p.claim)}, ${q(p.rationale)}, ${q(p.source_citation)}, ${q(seed.template.author_id)})
on conflict (principle_key) do update set
  claim = excluded.claim, rationale = excluded.rationale, source_citation = excluded.source_citation;`);
  }
}

const sql = `-- ============================================================================
-- EPIC-031 — seed programs (GENERATED FILE — do not hand-edit)
-- Generated by scripts/sync-seed-programs.mjs from seeds/*.json
-- Generated: ${new Date().toISOString()} · seeds: ${files.join(', ')}
-- Doctrine D16 gate: PASSED at generation time.
-- PREREQUISITES (in order): epic031_program_library.sql, epic031_exercises_seed.sql.
-- DO NOT apply to live Supabase before Kerwin's SQL review.
-- ============================================================================

-- Principles first: the D16 trigger on workout_templates requires every
-- science_overrides key to already have a program_principles row.
${principleHeader.join('\n\n')}

${parts.join('\n\n')}
`;

const out = path.join(root, 'migrations', 'epic031_seed_programs.sql');
fs.writeFileSync(out, sql);
console.log(`Wrote ${out} — ${files.length} seed program(s).`);

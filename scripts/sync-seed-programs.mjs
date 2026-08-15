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
  // science_overrides is written EMPTY here and patched in at the end of this DO
  // block, after the principles exist. See the WRITE PROTOCOL note below.
  L.push(`     '{}'::jsonb, ${jb(t.source_provenance)})`);
  L.push(`  on conflict (slug) do update set`);
  L.push(`    name = excluded.name, author_attribution = excluded.author_attribution,`);
  L.push(`    parent_goal = excluded.parent_goal, code_goal_mapping = excluded.code_goal_mapping,`);
  L.push(`    duration_weeks = excluded.duration_weeks, days_per_week = excluded.days_per_week,`);
  L.push(`    split_type = excluded.split_type, equipment_tier = excluded.equipment_tier,`);
  L.push(`    difficulty = excluded.difficulty, tagline = excluded.tagline,`);
  L.push(`    description = excluded.description, coaching_notes = excluded.coaching_notes,`);
  L.push(`    science_overrides = excluded.science_overrides,`);   // = '{}'; patched at the end
  L.push(`    source_provenance = excluded.source_provenance, updated_at = now()`);
  L.push(`  returning id into tid;`);
  // D16 WRITE PROTOCOL (ruled 2026-08-15, BUG-77 pt 2). The trigger on
  // workout_templates now requires a program_principles row owned by THIS template,
  // which cannot exist before the template has an id. So the order is:
  //   1. insert the template with science_overrides = '{}'  (passes trivially)
  //   2. insert its principles with template_id = tid
  //   3. update the template to set the real science_overrides (passes on own rows)
  // The old NULL-template_id scaffold that used to satisfy the unscoped check is
  // gone — a row that belongs to no template vouches for nobody, and under the
  // scoped rule it satisfies nothing.
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
    // Arbiter must be the (template_id, principle_key) constraint. Migration 0002
    // (BUG-77) replaced the old global UNIQUE (principle_key), so the bare
    // `on conflict (principle_key)` this used to emit now aborts with 42P10.
    L.push(`  on conflict (template_id, principle_key) do update set`);
    L.push(`    claim = excluded.claim, rationale = excluded.rationale,`);
    L.push(`    source_citation = excluded.source_citation;`);
  }
  // Step 3 of the write protocol: the citations now exist and belong to tid, so the
  // overrides they justify are legal. A seed that declares an override but no
  // matching principle fails HERE, loudly, which is the intent — the doctrine gate
  // already refused to generate this file in that case (see the D16 gate at the top).
  if (Object.keys(t.science_overrides || {}).length) {
    L.push(``);
    L.push(`  update public.workout_templates set science_overrides = ${jb(t.science_overrides)} where id = tid;`);
  }
  L.push(`end $$;`);
  parts.push(L.join('\n'));
}

// ── The NULL-template_id principle scaffold is GONE (ruled 2026-08-15, BUG-77 pt 2).
//
// It used to be emitted here, ahead of every template block, because the D16 trigger
// was unscoped — `where p.principle_key = k` with no template clause — so on a cold
// seed SOMETHING had to carry the key before the first workout_templates row was
// written. Migration 0002 then split the constraint, which meant the scaffold and the
// real per-template row stopped being the same row: the per-template upsert no longer
// patched the scaffold, it inserted alongside it, leaving one orphan per principle on
// every re-run.
//
// The ruling settles it: D16 is satisfied only by a program_principles row whose
// template_id is the template's own, so a NULL-template_id row satisfies nothing and
// has no reason to exist. It is removed outright rather than promoted or cleaned up
// after adoption. The cold-seed ordering problem it was working around is solved by
// the three-statement write protocol inside each DO block instead (empty overrides →
// principles → patch overrides), which needs no placeholder row.
//
// migrations/0010 deletes the orphans this used to leave behind, then drops the
// partial unique index on (principle_key) WHERE template_id IS NULL that existed only
// to make this scaffold upsertable.

const sql = `-- ============================================================================
-- EPIC-031 — seed programs (GENERATED FILE — do not hand-edit)
-- Generated by scripts/sync-seed-programs.mjs from seeds/*.json
-- Generated: ${new Date().toISOString()} · seeds: ${files.join(', ')}
-- Doctrine D16 gate: PASSED at generation time.
-- PREREQUISITES (in order): epic031_program_library.sql, epic031_exercises_seed.sql.
-- DO NOT apply to live Supabase before Kerwin's SQL review.
-- D16 WRITE PROTOCOL (BUG-77 pt 2): each DO block inserts its template with
-- science_overrides = '{}', then that template's own program_principles rows, then
-- patches the real overrides on. The scoped trigger requires a citation owned by the
-- template itself, so nothing may be written out of that order.
-- ============================================================================

${parts.join('\n\n')}
`;

const out = path.join(root, 'migrations', 'epic031_seed_programs.sql');
fs.writeFileSync(out, sql);
console.log(`Wrote ${out} — ${files.length} seed program(s).`);

// EPIC-026 Phase 1 — muscle-tag taxonomy audit (READ-ONLY, no writes anywhere)
//
// Why this exists: the muscle vocabulary in EXERCISE_BANK grew organically and now
// mixes four naming conventions at once. Before backfilling sub-muscle-group tags
// across 171 exercises we need the gap size as a NUMBER, not a vibe — and we need
// every number reproducible, so nobody has to trust a hand-typed total in a report.
//
// Everything here is derived by RUNNING programs.js (vm context, same technique as
// scripts/sync-exercise-bank.mjs) and by scanning its source for slot definitions.
// Nothing is hand-copied. Re-run after any bank edit; the report regenerates.
//
// This script reads. It does not write to Supabase, programs.js, tandem.html, or
// anything else. Supabase drift is measured separately (needs network + creds).
//
// Usage:  node scripts/audit-muscle-tags.mjs            → human-readable report
//         node scripts/audit-muscle-tags.mjs --table    → + the full 171-row table
//         node scripts/audit-muscle-tags.mjs --json     → machine-readable
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'programs.js');
const src = fs.readFileSync(SRC, 'utf8');

// ── Extract the bank LIVE, never a copied list ──────────────────────────────
const ctx = { window: {}, document: { querySelectorAll: () => [] },
              localStorage: { getItem: () => null, setItem: () => {} } };
vm.createContext(ctx);
vm.runInContext(src + `;globalThis.__X = {
  bank: EXERCISE_BANK,
  focusSlots: FOCUS_SLOTS,
  oneoffCore: ONEOFF_CORE_GROUPS,
  oneoffCardio: ONEOFF_CARDIO_GROUPS,
};`, ctx);
const { bank, focusSlots, oneoffCore, oneoffCardio } = ctx.__X;
const slugs = Object.keys(bank);
if (slugs.length < 100) throw new Error(`Bank suspiciously small (${slugs.length}) — extraction broken?`);

const primaryOf   = (s) => bank[s].muscleGroups?.primary   || [];
const secondaryOf = (s) => bank[s].muscleGroups?.secondary || [];
const tagsOf      = (s) => [...primaryOf(s), ...secondaryOf(s)];

// ── The live matcher, copied verbatim from programs.js so the audit measures
//    what the engine ACTUALLY does, not what we wish it did. If this drifts from
//    the real groupsMatch, the assertion at the bottom fails loudly.
const matches = (tag, group) =>
  tag === group || tag.startsWith(group + '_') || tag.startsWith(group);

// ── Slot definitions: FOCUS_SLOTS / ONEOFF_* come from the runtime. TEMPLATES,
//    SHOULDER_TEMPLATE and CORE_GROUPS are function-local, so scan the source for
//    them — with line numbers, because the deliverable is a call-site list.
function lineOf(index) { return src.slice(0, index).split('\n').length; }

const callSites = [];
for (const [focus, slots] of Object.entries(focusSlots)) {
  const line = lineOf(src.indexOf('const FOCUS_SLOTS'));
  slots.forEach(([a, b], i) => {
    const groups = [a, b].filter(Boolean);
    callSites.push({ where: `FOCUS_SLOTS.${focus}[${i}]`, file: 'programs.js', line, groups });
  });
}
callSites.push({ where: 'ONEOFF_CORE_GROUPS',   file: 'programs.js',
                 line: lineOf(src.indexOf('const ONEOFF_CORE_GROUPS')),   groups: oneoffCore });
callSites.push({ where: 'ONEOFF_CARDIO_GROUPS', file: 'programs.js',
                 line: lineOf(src.indexOf('const ONEOFF_CARDIO_GROUPS')), groups: oneoffCardio });

// TEMPLATES + SHOULDER_TEMPLATE: every `groups:[...]` literal in the file.
for (const m of src.matchAll(/groups:\s*\[([^\]]*)\]/g)) {
  const groups = [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
  if (!groups.length) continue;
  callSites.push({ where: 'slot literal', file: 'programs.js', line: lineOf(m.index), groups });
}
// CORE_GROUPS spans multiple lines; grab its bracket span.
{
  const i = src.indexOf('const CORE_GROUPS');
  if (i !== -1) {
    const span = src.slice(i, src.indexOf('];', i));
    const groups = [...span.matchAll(/'([^']+)'/g)].map(x => x[1]);
    if (groups.length) callSites.push({ where: 'CORE_GROUPS', file: 'programs.js', line: lineOf(i), groups });
  }
}

// ── Vocabulary ──────────────────────────────────────────────────────────────
const tally = (pick) => slugs.reduce((acc, s) => {
  for (const t of pick(s)) acc[t] = (acc[t] || 0) + 1;
  return acc;
}, {});
const PRIMARY = tally(primaryOf);
const SECONDARY = tally(secondaryOf);
const VOCAB = [...new Set([...Object.keys(PRIMARY), ...Object.keys(SECONDARY)])].sort();

const REQUESTED = [...new Set(callSites.flatMap(c => c.groups))].sort();

// ── Naming-convention analysis.
// A tag's "family" is its first underscore token. When that token is a positional
// adjective rather than a muscle name, the tag is SUFFIX-named — which means no
// parent-level slot can ever prefix-match it. That is a mechanical fact about the
// string, not an anatomical claim, so it is safe to assert here.
const POSITIONAL = new Set(['upper','lower','middle','mid','anterior','posterior',
                            'lateral','medial','long','short','external','internal','deep']);

// Family = the tag's muscle root. Normally the first token — but when the first
// token is a positional adjective the tag is SUFFIX-named, and the root is the
// last token instead (`anterior_delt` → delt, `upper_trap` → trap). Detecting
// that is string analysis, not an anatomy claim, so it is safe to assert here.
// It is also the finding: suffix-named tags cluster into a real family that no
// parent-level slot can prefix-match.
const rootOf = (t) => {
  const parts = t.split('_');
  return POSITIONAL.has(parts[0]) ? parts[parts.length - 1] : parts[0];
};
const families = {};
for (const t of VOCAB) (families[rootOf(t)] ||= []).push(t);
const suffixNamed = VOCAB.filter(t => POSITIONAL.has(t.split('_')[0]));

// A tag is SUB when its family holds more than one term and the tag is not the
// bare family root — i.e. the vocabulary already draws a distinction here.
// PARENT is the bare root of a family that has been subdivided. ATOMIC means the
// vocabulary draws no sub-division for this muscle at all, which may be entirely
// correct (rhomboid, adductor) — those are NOT a backfill gap, and lumping them
// in with real gaps is how a gap count becomes a vibe.
const isParent = (t) => families[rootOf(t)].length > 1 && t === rootOf(t);
const isSub    = (t) => families[rootOf(t)].length > 1 && t !== rootOf(t);
const kindOf   = (t) => isSub(t) ? 'sub' : isParent(t) ? 'parent' : 'atomic';

// ── Per-exercise bucket ─────────────────────────────────────────────────────
// Judged on PRIMARY tags only — secondary tags describe involvement, not the slot
// the exercise is selected for.
function bucketOf(slug) {
  const kinds = primaryOf(slug).map(kindOf);
  if (!kinds.length) return 'missing';
  if (kinds.every(k => k === 'sub')) return 'sub-tagged';
  if (kinds.some(k => k === 'sub')) return 'mixed';
  if (kinds.some(k => k === 'parent')) return 'parent-only';
  return 'atomic-only';
}
const buckets = {};
for (const s of slugs) buckets[bucketOf(s)] = (buckets[bucketOf(s)] || 0) + 1;

// ── Coverage / defects ──────────────────────────────────────────────────────
const coverage = REQUESTED.map(g => {
  const caught = VOCAB.filter(t => matches(t, g));
  const n = slugs.filter(s => tagsOf(s).some(t => matches(t, g))).length;
  // A cross-parent collision: g catches a tag that is NOT g and NOT a `g_` child.
  const collisions = caught.filter(t => t !== g && !t.startsWith(g + '_'));
  return { group: g, exercises: n, caught, collisions };
});
const deadTerms = coverage.filter(c => c.exercises === 0);
const collisions = coverage.filter(c => c.collisions.length);
const orphans = VOCAB.filter(t => !REQUESTED.some(g => matches(t, g)));

// ── Report ──────────────────────────────────────────────────────────────────
const json = {
  bankEntries: slugs.length,
  categories: slugs.reduce((a, s) => (a[bank[s].category] = (a[bank[s].category] || 0) + 1, a), {}),
  vocabulary: { primary: Object.keys(PRIMARY).length, secondary: Object.keys(SECONDARY).length, union: VOCAB.length },
  buckets, requested: REQUESTED.length, callSites: callSites.length,
  deadTerms: deadTerms.map(d => d.group),
  collisions: collisions.map(c => ({ group: c.group, alsoCatches: c.collisions })),
  orphans, suffixNamed,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ ...json, PRIMARY, SECONDARY, coverage, callSites }, null, 2));
  process.exit(0);
}

const rule = (s) => console.log(`\n── ${s} ${'─'.repeat(Math.max(0, 68 - s.length))}`);
console.log('EPIC-026 Phase 1 — muscle-tag taxonomy audit');
console.log(`source: programs.js (read live) · generated: ${new Date().toISOString()}`);

rule('bank');
console.log(`  entries: ${json.bankEntries}`);
console.log(`  categories: ${Object.entries(json.categories).map(([k, v]) => `${k} ${v}`).join(' · ')}`);

rule('vocabulary');
console.log(`  distinct primary ${json.vocabulary.primary} · secondary ${json.vocabulary.secondary} · union ${json.vocabulary.union}`);
console.log('  primary terms by exercise count:');
for (const [t, n] of Object.entries(PRIMARY).sort((a, b) => b[1] - a[1]))
  console.log(`    ${String(n).padStart(3)}  ${t.padEnd(28)} ${kindOf(t)}`);

rule('gap buckets (by primary tags)');
for (const [k, v] of Object.entries(buckets).sort((a, b) => b[1] - a[1]))
  console.log(`    ${String(v).padStart(3)}  ${k}`);
console.log(`    ${String(slugs.length).padStart(3)}  TOTAL`);
console.log('  sub-tagged = every primary tag is a sub-group term');
console.log('  mixed      = some primary tags sub-group, some not');
console.log('  parent-only= tags a divided group only at parent level (the backfill target)');
console.log('  atomic-only= vocabulary has no sub-division for this tag (may be correct)');

rule('naming conventions');
console.log(`  families (muscle root → terms), ${Object.keys(families).length} total; only subdivided ones shown:`);
for (const [head, ts] of Object.entries(families).sort((a, b) => b[1].length - a[1].length))
  if (ts.length > 1) console.log(`    ${head.padEnd(14)} ${ts.join(', ')}`);
console.log(`\n  SUFFIX-NAMED (first token is positional, so no parent slot can reach them): ${suffixNamed.length}`);
for (const t of suffixNamed) console.log(`    ${t}`);

rule('call sites');
console.log(`  ${callSites.length} slot definitions requesting ${REQUESTED.length} distinct group names`);
for (const c of callSites.sort((a, b) => a.line - b.line))
  console.log(`    ${c.file}:${String(c.line).padEnd(5)} ${c.where.padEnd(24)} [${c.groups.join(', ')}]`);

rule('coverage under the live prefix rule');
for (const c of coverage)
  console.log(`    ${String(c.exercises).padStart(3)}  ${c.group.padEnd(24)} <- ${c.caught.join(', ') || '*** NOTHING ***'}`);

rule('DEFECTS');
console.log(`  [1] dead terms (requested, match zero exercises — fails OPEN): ${deadTerms.length}`);
for (const d of deadTerms) console.log(`        ${d.group}`);
console.log(`  [2] cross-parent collisions (slot pulls a foreign muscle): ${collisions.length}`);
for (const c of collisions) console.log(`        '${c.group}' also catches ${c.collisions.map(x => `'${x}'`).join(', ')}`);
console.log(`  [3] orphan tags (no slot can reach them): ${orphans.length}`);
for (const o of orphans) console.log(`        ${o}`);

if (process.argv.includes('--table')) {
  rule('all 171 exercises');
  console.log('| exercise | category | primary | secondary | sub-group detail |');
  console.log('|---|---|---|---|---|');
  for (const s of slugs.sort((a, b) => bank[a].name.localeCompare(bank[b].name)))
    console.log(`| ${bank[s].name} | ${bank[s].category} | ${primaryOf(s).join(', ')} | ${secondaryOf(s).join(', ') || '—'} | ${bucketOf(s)} |`);
}

// ── Self-check: the matcher above must still be the one programs.js uses. If the
//    engine's rule changes and this copy doesn't, every number above goes quietly
//    wrong — exactly the silent-failure class this project keeps getting bitten by.
const live = src.match(/a === g \|\| a\.startsWith\(g\+'_'\) \|\| a\.startsWith\(g\)/);
console.log(`\n${live ? 'OK' : 'WARNING'}: live groupsMatch prefix rule ${live ? 'matches' : 'DIFFERS FROM'} the copy used by this audit.`);
if (!live) process.exitCode = 1;

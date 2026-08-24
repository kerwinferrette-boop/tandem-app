// ═══════════════════════════════════════════════════════
// TANDEM — Static Data: icon registry + goal-adaptive program library
// Extracted from tandem.html on 2026-06-11 (5k-line modularization, Item C).
// Loaded via <script src="programs.js"> BEFORE the main script block.
// Exposes globals: ICONS, svgIcon, renderIcons, PHASES, VIDEO_IDS, getProgram
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// ICONS — inline Lucide-style SVG registry (no emoji)
// ═══════════════════════════════════════════════════════
const ICONS = {
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>',
  trophy:'<path d="M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4.5a2 2 0 0 0 2.2 4M17 6h2.5a2 2 0 0 1-2.2 4"/><path d="M12 13v4M9 21h6M10.5 17h3"/>',
  flame:'<path d="M12 2.5c.8 3.2 3.8 4.2 3.8 8a3.8 3.8 0 0 1-7.6 0c0-1 .4-1.9 1-2.8.6 1.8 1.9 1.7 1.9.1 0-1.9-1-2.9.9-5.4Z"/>',
  dumbbell:'<path d="M6.5 7v10M4 9.5v5M17.5 7v10M20 9.5v5M6.5 12h11"/>',
  zap:'<path d="M13 2 4 14h7l-2 8 9-12h-7l2-8Z"/>',
  sprout:'<path d="M12 22v-9M12 13c0-3-2.2-5-5.2-5 0 3 2.2 5 5.2 5ZM12 13c0-3 2.2-6 5.2-6 0 3-2.2 6-5.2 6Z"/>',
  cog:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2 7.3 7.3M16.7 16.7l2.1 2.1M18.8 5.2 16.7 7.3M7.3 16.7l-2.1 2.1"/>',
  activity:'<path d="M3 12h4l2.5 7 5-14L17 12h4"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
  sunrise:'<path d="M12 3v5M4.5 19h15M2.5 16h2M19.5 16h2M6.8 8.8 5.7 7.7M18.3 7.7l-1.1 1.1M8 16a4 4 0 0 1 8 0"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.6 1.6M17.4 17.4 19 19M19 5l-1.6 1.6M6.6 17.4 5 19"/>',
  moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5Z"/>',
  footprints:'<path d="M8 6c1.1 0 2 1.3 2 4s-.9 4-2 4-2-1.8-2-4 .9-4 2-4ZM6 16.5c0 1.7.9 2.5 2 2.5s2-.8 2-2M16 4c1.1 0 2 1.3 2 4s-.9 4-2 4-2-1.8-2-4 .9-4 2-4ZM14 14.5c0 1.7.9 2.5 2 2.5s2-.8 2-2"/>',
  yoga:'<circle cx="12" cy="4.5" r="2"/><path d="M12 7.5v5M6 21l6-8.5L18 21M5 13h14"/>',
  key:'<circle cx="8" cy="8" r="4"/><path d="m11 11 9 9M16.5 16.5 18.5 14.5M18.5 18.5 20.5 16.5"/>',
  medal:'<circle cx="12" cy="14.5" r="5"/><path d="M12 12v5M9.5 14.5h5M9 3 12 9 15 3M8 9.5 5.5 3M16 9.5 18.5 3"/>',
  clipboard:'<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9.5 10h5M9.5 14h5M9.5 18h3"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  chart:'<path d="M3 21h18M7 21v-7M12 21V8M17 21v-10"/>',
  plate:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.5"/>',
  save:'<path d="M5 3h11l3 3v15H5V3ZM8.5 3v5h6V3M8.5 21v-7h7v7"/>',
  alert:'<path d="M12 3 21 19H3L12 3ZM12 10v4M12 17h.01"/>',
  swap:'<path d="M4 8h13M13 4l4 4-4 4M20 16H7M11 20l-4-4 4-4"/>'
};
function svgIcon(name, size){
  const p = ICONS[name]; if(!p) return '';
  return `<svg viewBox="0 0 24 24" width="${size||'1em'}" height="${size||'1em'}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${p}</svg>`;
}
function renderIcons(root){
  (root||document).querySelectorAll('[data-icon]').forEach(el=>{
    if(el.dataset.iconDone==='1') return;
    el.innerHTML = svgIcon(el.getAttribute('data-icon'), el.getAttribute('data-icon-size')||'1em');
    el.dataset.iconDone='1';
  });
}

// ═══════════════════════════════════════════════════════
// GOAL-ADAPTIVE PROGRAM LIBRARY
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// LOAD PROGRESSION — RULED 2026-08-23. The step is a PERCENTAGE of the current
// load. It is never a fixed pound increment.
//
// What was here: `incComp`/`incAcc`, a flat 2.5/5/10 lb step. That charges the
// same absolute jump to a 400 lb squat (+1.3%) and a 20 lb lateral raise (+25%),
// which are not the same stimulus in any framework. `pctTop`/`pctInc` sat beside
// them, read by nothing — dead since the file was written.
//
// SHOULD (research-report (8).pdf's OWN citation [8] — ACSM position stand,
// "Progression models in resistance training for healthy adults",
// PMID 19204579): "a 2-10% increase in load [should] be applied when the
// individual can perform the current workload for one to two repetitions over
// the desired number." The increment is a percentage; the trigger is a rep
// surplus. NSCA states the same rule with the multi-joint / single-joint split
// made explicit — "core" (multi-joint) lifts progress at roughly double the rate
// of "assistance" (single-joint) work (upper assistance 2.5-5% against lower core
// 5-10%+ for intermediates; 1-2% against 5% for novices).
//
// DID: `pctComp` below is the per-phase compound rate. Every value is one of the
// old `pctInc` numbers, which are Kerwin's authored figures — the change here is
// that they are now READ, and that each has been checked to sit inside ACSM's
// cited 2-10% band. No new per-phase number is invented. The accessory rate is
// DERIVED, not tabulated (same reason D21's ladder derives its rungs): it is
// pctComp x ACCESSORY_PROGRESSION_RATIO, clamped back into the band. See
// progressionPct() below for the ratio's citation.
//
// FLAGGED, NOT FILLED: ACSM/NSCA's trigger is the "2-for-2 rule" — two reps over
// goal on TWO CONSECUTIVE sessions. Tandem retains only the single most recent
// session per lift (`tandem_lastsets` holds one entry per exercise name), so the
// rep half is enforceable today and the two-sessions half is not. The rep half
// ships; the consecutive-session half needs a history change and is Kerwin's call.
// ═══════════════════════════════════════════════════════

// Multi-joint lifts progress at roughly twice the rate of single-joint work. The
// ratio is read off NSCA's own paired bands rather than invented: novice 5% lower-
// body core against 1-2% upper assistance, intermediate/advanced 5-10%+ core
// against 2.5-5% assistance. Both pairs sit near 2:1, so accessories take half the
// phase's compound rate. Clamped back into ACSM's 2-10% band by progressionPct(),
// which is load-bearing: build_muscle's peak phase is 3%, and half of that is 1.5%.
const ACCESSORY_PROGRESSION_RATIO = 0.5;

// ── Loadable-weight rounding — the ONE home for both granularities ──
// Declared here (the shared layer, loaded first) and used from tandem.html too. They
// are deliberately NOT redeclared there: top-level `const` lives in the shared global
// lexical environment, so a second declaration is a hard SyntaxError that takes the
// whole app down. Verified by running it rather than by reasoning about it — the same
// shared-scope behaviour holds inside node:vm, so the gates exercise the real thing.
//
// Equipment-representability constants, NOT prescriptions. They differ on purpose:
const PRESCRIPTION_STEP_LBS = 5;    // barbell plates load in pairs → 5 lb granularity
const LOAD_STEP_LBS = 2.5;          // smallest adjustment: micro-plates / low-end dumbbells
function roundToStep(w) { return Math.round(w / LOAD_STEP_LBS) * LOAD_STEP_LBS; }
const PROGRESSION_PCT_MIN = 2;   // ACSM position stand, PMID 19204579
const PROGRESSION_PCT_MAX = 10;  // ACSM position stand, PMID 19204579

// ── The ONE home for a generated exercise's default prescription ──
// Both engines built this inline and identically — `e.unit==='sec' ? (e.secs || 45) : 10`
// at getSingleDay's mk() and at buildDynamicProgram's emitter. Two copies of a number
// is the drift D19/D21/D24 all had to police, and the `|| 45` half was an INVENTED
// default on top of it: no source prescribes a 45-second hold, and the comment beside
// it cited only "Kerwin 2026-07-13, 45 default".
//
// It is kept rather than deleted (unlike D23's REST_SECONDS) for one reason, and the
// reason is what makes it defensible: it is provably UNREACHABLE. Every `unit:'sec'`
// entry in EXERCISE_BANK declares its own `secs` (Plank 60 / Side Plank 45 / Hollow
// Body Hold 30 / Copenhagen Plank 30), and D25 asserts that, so this branch is a guard
// against a malformed future bank entry, not a prescription anyone receives. The day it
// CAN fire, the gate fails first and the bank gets fixed — which is the point.
//
// DEFAULT_REPS is likewise a placeholder, not a prescription: the render layer resolves
// weighted work through effectiveReps() (D10/D14), so this value only survives where a
// phase has not spoken.
const TIMED_HOLD_FALLBACK_SECS = 45;
const DEFAULT_REPS = 10;
function defaultPrescription(e) {
  return e && e.unit === 'sec' ? (e.secs || TIMED_HOLD_FALLBACK_SECS) : DEFAULT_REPS;
}

// ── The ONE home for an untrained lifter's STARTING load ──────────────────────
// This number had FOUR copies. Three of them disagreed, and two of those three
// were keyed by exercise names that do not exist:
//
//   programs.js buildDynamicProgram  NSCA_DEFAULTS + baseW()   sex-aware, correct names
//   programs.js getSingleDay         defW()                    SEX-BLIND, no matrix, no oneRmFactor
//   programs.js materializeTemplate  defW(eq)                  SEX-BLIND, equipment string only
//   tandem.html DEFAULT_WEIGHTS      getWeekTarget's 'default' sex-aware, 5 DEAD KEYS
//
// Verified by running, not by reading:
//   • The one-off prescribed a woman 95 lb on a barbell press where her own weekly
//     program prescribed 55 — a 73% over-prescription, for the app's second user,
//     on the flagship "Build Me a Workout" surface.
//   • tandem.html's DEFAULT_WEIGHTS names 'Barbell Squat' / 'Barbell Bench Press' /
//     'Overhead Press' / 'Leg Curl'. EXERCISE_BANK calls them 'Barbell Back Squat' /
//     'Flat Barbell Press' / 'Barbell Overhead Press' / 'Lying Leg Curl'. So 4 of 13
//     male entries and 1 of 12 female entries were unreachable — including the three
//     heaviest lifts a man is prescribed. That branch has been silently dead since
//     EPIC-9 and no gate could see it, because a lookup miss is not an error.
//
// SEED_WEIGHTS is the surviving matrix — the NSCA-informed one whose keys all resolve
// (0 dead keys, asserted by D26). No number is new here; the dead-named copy is
// deleted rather than "reconciled", because reconciling would have meant inventing
// values for names the bank does not have.
//
// Source: Notion EPIC-9 default-weight matrices (NSCA-informed untrained-lifter
// starting loads). ⚠️ The matrix is a starting GUESS by design — D11 governs what
// happens next, and a single logged set replaces it with an earned number.
const SEED_WEIGHTS = {
  female: {
    'Hip Thrust': 45, 'Barbell Hip Thrust': 45,
    'Romanian Deadlift': 35, 'DB RDL': 35,
    'Goblet Squat': 25,
    'Bulgarian Split Squat': 15,
    'DB Bench Press': 20,
    'Dumbbell Row': 25,
    'Lat Pulldown': 40,
    'Arnold Press': 15,
    'Cable Lateral Raise': 7.5,
    'Lying Leg Curl': 30, 'Seated Leg Curl': 30,
    'Cable Kickback': 15,
    'Leg Extension': 30
  },
  male: {
    'Barbell Back Squat': 135, 'Hack Squat': 135,
    'Romanian Deadlift': 135,
    'Leg Press': 180,
    'Flat Barbell Press': 135,
    'DB Bench Press': 50,
    'Barbell Row': 95,
    'Dumbbell Row': 50,
    'Lat Pulldown': 80,
    'Barbell Overhead Press': 75,
    'Cable Lateral Raise': 15,
    'Lying Leg Curl': 60, 'Seated Leg Curl': 60,
    'Leg Extension': 70
  }
};

// Generic per-equipment floor, used only where the matrix is silent.
const SEED_BASE_LBS = {
  female: { barbell: 55, machine: 40, cable: 20, dumbbell: 15 },
  male:   { barbell: 95, machine: 70, cable: 35, dumbbell: 35 }
};

function isFemaleSex(sex) {
  const s = String(sex == null ? '' : sex).toLowerCase();
  return s === 'f' || s === 'female';
}

// Lazy name index. EXERCISE_BANK is keyed by slug; every caller that has only a
// display name (tandem.html's getWeekTarget) needs the entry to read equipment
// and oneRmFactor off it, and a second hand-maintained name table is exactly what
// this whole block exists to delete.
const _seedBankByName = {};
function bankEntryByName(name) {
  if (!name) return null;
  if (!_seedBankByName.__built) {
    for (const e of Object.values(EXERCISE_BANK)) if (e && e.name) _seedBankByName[e.name] = e;
    Object.defineProperty(_seedBankByName, '__built', { value: true });
  }
  return _seedBankByName[name] || null;
}

// seedWeight(entry, { sex, dbCap }) → starting lb for an untrained lifter, or 0 for
// bodyweight/band. Matrix first, then the generic equipment floor scaled by the
// exercise's own oneRmFactor.
//
// ⚠️ FLAGGED, NOT SILENTLY CHANGED: the cable branch applies neither oneRmFactor nor
// step-rounding, while barbell/machine round to PRESCRIPTION_STEP_LBS and dumbbell
// rounds to LOAD_STEP_LBS and honours the user's dumbbell cap. That asymmetry is
// inherited verbatim from baseW() and is preserved here on purpose — cable stacks
// come in fixed, machine-specific increments that neither constant describes, and no
// source in the repo says what a cable step should be. Normalising it would be
// inventing a number to make the function look tidier. Raised for a ruling.
function seedWeight(entry, opts) {
  const e = entry || {};
  const o = opts || {};
  const key = isFemaleSex(o.sex) ? 'female' : 'male';
  const cap = (Number.isFinite(o.dbCap) && o.dbCap > 0) ? o.dbCap : Infinity;

  const named = SEED_WEIGHTS[key][e.name];
  // Matrix dumbbell entries are per-hand — still respect the user's cap.
  if (named != null) return e.equipment === 'dumbbell' ? Math.min(named, cap) : named;

  const base = SEED_BASE_LBS[key][e.equipment];
  if (base == null) return 0;                       // bodyweight / band
  const f = e.oneRmFactor || 1.0;
  if (e.equipment === 'cable') return base;         // see the flag above
  if (e.equipment === 'dumbbell') return Math.min(roundToStep(base * f), cap);
  return Math.round(base * f / PRESCRIPTION_STEP_LBS) * PRESCRIPTION_STEP_LBS;
}

// progressionPct(phase, compound) — the ONE place a progression rate is decided.
// Returns a percentage (e.g. 8 means +8% of the current working load).
function progressionPct(phase, compound) {
  const base = Number(phase && phase.pctComp);
  if (!Number.isFinite(base) || base <= 0) return PROGRESSION_PCT_MIN;
  const raw = compound ? base : base * ACCESSORY_PROGRESSION_RATIO;
  return Math.min(PROGRESSION_PCT_MAX, Math.max(PROGRESSION_PCT_MIN, raw));
}

// Phase definitions per goal
const PHASES = {
  fat_burn: [
    // Science audit 2026-07-22 (Finding 1): Fat Burn is high-rep circuits by its 5-Goal Taxonomy
    // definition. Reps stay HIGH (12-15) across every block; progress by adding LOAD, never by
    // dropping into strength reps. Short rest + the circuit/superset structure drive the metabolic
    // (EPOC) stimulus. Enforced by doctrine D10.
    {name:'Metabolic Foundation', intent:'High-rep circuit work with short rest to build work capacity. Reps stay high — progress by adding load, not by dropping reps (fat loss is metabolic, not maximal).', weeks:[1,3],  reps:'15·14·13', restComp:60,  restAcc:45,  pctComp:10},
    {name:'Metabolic Build',      intent:'Add load at the same high-rep range, short rest held. Muscle is preserved under the deficit while metabolic demand stays high.',                                     weeks:[4,6],  reps:'15·13·12', restComp:60,  restAcc:45,  pctComp:10},
    {name:'Metabolic Power',      intent:'Densest phase — high reps, minimal rest, circuit/superset structure drives EPOC. Load keeps climbing within the high-rep range.',                                   weeks:[7,9],  reps:'14·13·12', restComp:75,  restAcc:45,  pctComp:8},
    {name:'Peak Conditioning',    intent:'Leanest, most conditioned phase — still high-rep. You are lifting more load at 12-15 reps than in week 1.',                                                        weeks:[10,12],reps:'15·13·12', restComp:75,  restAcc:45,  pctComp:6}
  ],
  build_muscle: [
    // Science audit 2026-07-22 (Finding 2, Kerwin-approved): Build Muscle stays in the HYPERTROPHY
    // band (6-15) the whole program — it never drops to 1-5 rep max-strength work (that is the
    // separate Strength goal, and reps 5-30 give equivalent hypertrophy when volume-equated to
    // failure, so there is no size benefit to going lower). Periodization comes from the volume
    // ramp + load progression, not from sliding into strength reps. Enforced by doctrine D10.
    {name:'Hypertrophy Foundation',intent:'Establish movement patterns and work capacity. Volume descends within the block — technique then load. Reps stay in the hypertrophy range.',                        weeks:[1,3],  reps:'12·10·8',  restComp:120, restAcc:75,  pctComp:8},
    {name:'Hypertrophy Build',     intent:'Add load, hold volume. Growth accelerates as the working weight climbs at 8-11 reps.',                                                                            weeks:[4,6],  reps:'11·9·8',   restComp:120, restAcc:75,  pctComp:6},
    {name:'Hypertrophy Intensify', intent:'Heavier compounds at the bottom of the hypertrophy range. Highest mechanical-tension stimulus of the program — still hypertrophy, not maximal strength.',          weeks:[7,9],  reps:'10·8·7',   restComp:135, restAcc:90,  pctComp:5},
    {name:'Peak Hypertrophy',      intent:'Peak load at the 6-8 rep floor of the hypertrophy range. Strongest you have been at every lift — without dropping into 1-5 rep max-strength work.',                weeks:[10,12],reps:'9·7·6',    restComp:150, restAcc:90,  pctComp:3}
  ],
  transform: [
    {name:'Recomp Foundation',    intent:'Moderate deficit, high protein, progressive overload. Rep range descends across 3 weeks — establishes the work capacity base.',    weeks:[1,3],  reps:'12·10·8',  restComp:90,  restAcc:60,  pctComp:8},
    {name:'Recomp Build',         intent:'Add load, maintain intensity. Muscle grows while fat continues to drop. Floor at 8 reps — no heavier in a deficit.',             weeks:[4,6],  reps:'10·9·8',   restComp:90,  restAcc:60,  pctComp:6,
     subs:{
       // Evidence-informed pressing progression (Fonseca et al. 2014 JSCR — exercise variation > load variation for balanced hypertrophy).
       // Foundation: DB Bench (stabilisers, bilateral parity). Build: Incline DB (adds upper-pec angle, same implement — ~86% of flat DB strength).
       'tr-dbench': {id:'tr-incdb',  name:'Incline DB Press', badge:'compound',
         why:'At 30–45° the clavicular pec head dominates EMG activity. DB variation adds deeper bottom-position stretch versus barbell. Evidence-informed progression: same implement (dumbbell), adds upper-pec angle. Fonseca et al. 2014 — varied exercises produce greater balanced hypertrophy than repeating the same movement.',
         cues:['Set bench to 30° — not steeper','Elbows at 60–70° from torso, not flared to 90°','Full stretch at bottom without shoulder impingement','Drive up and slightly in — slight arc, not straight up']},
       'trf-bench': {id:'trf-incdb', name:'Incline DB Press', badge:'compound',
         why:'At 30–45° the clavicular pec head dominates EMG activity. DB variation adds deeper bottom-position stretch versus barbell. Evidence-informed progression: same implement (dumbbell), adds upper-pec angle.',
         cues:['Set bench to 30° — not steeper','Elbows at 60–70° from torso, not flared to 90°','Full stretch at bottom without shoulder impingement','Drive up and slightly in — slight arc, not straight up']}
     }},
    {name:'Recomp Power',         intent:'Heaviest phase. Body composition changes become visually apparent. 8-rep floor maintained throughout.',                           weeks:[7,9],  reps:'9·8·8',    restComp:120, restAcc:75,  pctComp:5,
     subs:{
       // Power phase: moves from DB to barbell (higher absolute load ceiling). Keeps 30° angle — same upper-pec stimulus, adds barbell strength capacity.
       'tr-dbench': {id:'tr-libar',  name:'Low Incline Barbell Press', badge:'compound',
         why:'Barbell load ceiling for the power phase. 30° incline is the mechanically safest pressing angle for the shoulder joint. Same vector as the Incline DB from Build, now with barbell to allow heavier absolute loading needed for the power phase.',
         cues:['Retract scapula into the bench','Lower bar to mid-chest','Drive through heels to the floor','Full lockout at top']},
       'trf-bench': {id:'trf-libar', name:'Low Incline Barbell Press', badge:'compound',
         why:'Barbell load ceiling for the power phase. 30° incline is the mechanically safest pressing angle for the shoulder joint. Same vector as the Incline DB from Build, now with barbell to allow heavier absolute loading needed for the power phase.',
         cues:['Retract scapula into the bench','Lower bar to mid-chest','Drive through heels to the floor','Full lockout at top']}
     }},
    {name:'Recomp Peak',          intent:'The results phase. Scale may barely move but the mirror tells the real story. Load is at its peak — 8 reps all week.',           weeks:[10,12],reps:'8·8·8',    restComp:120, restAcc:75,  pctComp:3,
     subs:{
       // Peak phase: flat barbell — maximum mechanical advantage and absolute load for peak strength expression.
       'tr-dbench': {id:'tr-flatbar',  name:'Flat Barbell Press', badge:'compound',
         why:'Maximum mechanical advantage for pec major at peak week. Flat barbell has the highest absolute load ceiling of all pressing variants. Peak phase is where the progression culminates — standard strength expression movement.',
         cues:['Retract and depress scapula into bench','Bar path: mid-chest to above lower pec','Drive heels into floor throughout','Full lockout without shoulder impingement']},
       'trf-bench': {id:'trf-flatbar', name:'Flat Barbell Press', badge:'compound',
         why:'Maximum mechanical advantage for pec major at peak week. Flat barbell has the highest absolute load ceiling of all pressing variants. Peak phase is where the progression culminates — standard strength expression movement.',
         cues:['Retract and depress scapula into bench','Bar path: mid-chest to above lower pec','Drive heels into floor throughout','Full lockout without shoulder impingement']}
     }}
  ]
};

// ── Exercise library by goal + days ──
// YouTube IDs are real tutorial videos for each movement
const VIDEO_IDS = {
  'Low Incline Barbell Press':  'DbFgADa2PL8',
  'Arnold Press':               'hmEGkvxmCl0',
  'Cable Low-to-High Fly':      'pYcpY20QaE8',
  'Cable Lateral Raise':        '8IHpPAAZTCk',
  'Tricep Overhead Extension':  'nRiJVZDpdL0',
  'Tricep Rope Pushdown':       '2-LAMcpzODU',
  'Romanian Deadlift':          'JCXUYuzwNrM',
  'Hip Thrust':                 'SEdqd1n0cvg',
  'Lying Leg Curl':             'ELOCsoDSmrg',
  'Cable Pull-Through':         'sSNGZzfMqE8',
  'Standing Calf Raise':        'gwLzBJYoWlA',
  'Lat Pulldown':               'CAwf7n6Luuc',
  'Seated Cable Row':           'UCXxvVItLoM',
  'Single-Arm DB Row':          'pYcpY20QaE8',
  'Face Pull':                  'eIq5CB9JfKE',
  'Incline DB Curl':            'soxrZlIl35U',
  'Hammer Curl':                'TwD-YGVP4Bk',
  'Hack Squat':                 'MKcAc4RoKME',
  'Bulgarian Split Squat':      '2C-uNgKwPLE',
  'Leg Extension':              'YyvSfVjQeL0',
  'Seated Calf Raise':          'JbyjNymZsfQ',
  'Abductor Machine':           'GKumTNiuCLY',
  'Goblet Squat':               'MeIiIdhvXT4',
  'KB Swing':                   'sSNGZzfMqE8',
  'Leg Press':                  'IZxyjW7MPJQ',
  'DB Bench Press':             'VmB1G1K7v94',
  'Push-Up':                    'IODxDxX7oi4',
  'Dumbbell Row':               'pYcpY20QaE8',
  'Plank':                      'pSHjTRCQxIw',
  'Seated Leg Curl':            'YyvSfVjQeL0',
};

// ═══════════════════════════════════════════════════════
// EXERCISE_BANK — comprehensive movement library
// Keys are stable slugs. Each entry:
//   name          – display name (matches VIDEO_IDS key where video exists)
//   muscleGroups  – { primary: [...], secondary: [...] }  (dot-separated hierarchical tags)
//   emphasis      – array of emphasis tags for dynamic filtering
//   equipment     – 'barbell'|'dumbbell'|'cable'|'machine'|'bodyweight'|'band'
//   tier          – 'full_gym'|'hotel_gym'|'home'  (minimum access level needed)
//   category      – 'compound'|'isolation'|'core'|'cardio'
//   oneRmFactor   – fraction of same-implement baseline 1RM (null for isolation/core/cardio)
//                   For chest: relative to flat barbell press = 1.00
//   videoId       – YouTube tutorial ID (null = not yet sourced)
//   why           – exercise selection rationale
//   cues          – array of coaching cues
// ═══════════════════════════════════════════════════════
const EXERCISE_BANK = {

  // ── CHEST / HORIZONTAL PRESS ─────────────────────────
  'flat-barbell-press':{
    name:'Flat Barbell Press', videoId:null,
    muscleGroups:{primary:['pec_major_sternal'],secondary:['anterior_delt','tricep']},
    emphasis:['chest','push','upper_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:1.00,
    why:'Maximum mechanical advantage for pec major sternal fibres. Highest absolute load ceiling of all pressing variants. The gold standard for measuring horizontal push capacity.',
    cues:['Retract and depress scapula into bench','Bar path: lower chest at bottom, above lower pec at lockout','Drive heels into floor throughout','Full lockout — do not stop short']},
  'db-bench-press':{
    name:'DB Bench Press', videoId:'VmB1G1K7v94',
    muscleGroups:{primary:['pec_major_sternal'],secondary:['anterior_delt','tricep']},
    // oneRmFactor 0.88 confirmed 2026-07-23 via independent research (Kerwin's call,
    // "do your own independent research, cite it, make a decision" — Ralph's own
    // report9 claimed 55-70%, unsourced/calculator-site cited). Independent sources
    // converge on 80-90%: a 2023 RCT (Smoak et al., "Randomized Trial Comparing
    // Barbell and Dumbbell Bench Press on Maximal Strength and Power Output") and
    // BarBend's coaching synthesis (~90% rule of thumb / ~1.2x barbell-to-DB factor
    // ≈83%). 0.88 sits inside that band — kept as-is, report9's number rejected.
    emphasis:['chest','push','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:0.88,
    why:'Dumbbells demand more stabiliser recruitment than barbell — serratus anterior and rotator cuff activate heavily to control the free path. Each hand works independently, preventing dominant-side compensation.',
    cues:['Neutral wrist, soft elbow lockout','Lower until upper arms parallel to floor','Slight arch — ribs up, shoulders back','Squeeze at the top for one count']},
  'incline-db-press':{
    name:'Incline DB Press', videoId:null,
    muscleGroups:{primary:['pec_major_clavicular'],secondary:['anterior_delt','tricep']},
    emphasis:['chest','push','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:0.86,
    why:'At 30–45° the clavicular pec head dominates EMG activity. DB variation adds a deeper bottom-position stretch versus barbell, increasing time under tension through full ROM. Evidence-informed progression from flat DB — same implement, adds upper-pec angle.',
    cues:['Set bench to 30° — not steeper','Elbows at 60–70° from torso, not flared to 90°','Full stretch at bottom without shoulder impingement','Drive up and slightly in — a slight arc, not straight up']},
  'low-incline-barbell-press':{
    name:'Low Incline Barbell Press', videoId:'DbFgADa2PL8',
    muscleGroups:{primary:['pec_major_clavicular'],secondary:['anterior_delt','tricep']},
    emphasis:['chest','push','upper_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:0.93,
    why:'30° is the mechanically superior angle for most lifters — maximises clavicular pec recruitment while keeping the subacromial space open. EMG studies confirm 30–45° produces peak upper-chest activation.',
    cues:['Retract scapula','Lower to mid-chest','Drive through heels','Full lockout at top']},
  'high-incline-barbell-press':{
    name:'High Incline Barbell Press', videoId:null,
    muscleGroups:{primary:['pec_major_clavicular','anterior_delt'],secondary:['tricep']},
    emphasis:['chest','shoulders','push','upper_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:0.80,
    why:'At 45–60° the load shifts significantly toward the anterior deltoid — useful for shoulder-emphasis programming. Expect ~20% less pec activation than at 30°. Best as a periodisation variation rather than a primary chest builder.',
    cues:['Keep elbows directly under wrists','Scapula retracted throughout','Do not touch chest — stop one inch above','Control the descent; eccentric under full tension']},
  'decline-barbell-press':{
    name:'Decline Barbell Press', videoId:null,
    muscleGroups:{primary:['pec_major_sternal'],secondary:['tricep']},
    emphasis:['chest','push','upper_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:1.07,
    why:'The decline angle puts pec major sternal fibres in their strongest mechanical position — most lifters press 5–10% more here than flat. Lower pec volume is chronically undertrained; decline closes that gap.',
    cues:['Secure ankles before unracking','Bar to lower chest (below nipple line)','Wrists stacked over elbows','Full lockout — triceps contribute heavily here']},
  'decline-db-press':{
    name:'Decline DB Press', videoId:null,
    muscleGroups:{primary:['pec_major_sternal'],secondary:['tricep']},
    emphasis:['chest','push','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:0.94,
    why:'Lower-pec emphasis of decline barbell with greater ROM and unilateral loading. Useful when a decline bench is available but no barbell — or when adding angle variation after flat DB mastery.',
    cues:['Secure ankles; dumbbells on thighs before lying back','Lower to lower chest with control','Neutral wrist throughout','Squeeze at top — ROM is slightly shorter than flat']},
  'close-grip-barbell-press':{
    name:'Close-Grip Barbell Press', videoId:null,
    muscleGroups:{primary:['tricep'],secondary:['pec_major_sternal','anterior_delt']},
    emphasis:['triceps','chest','push','upper_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:0.85,
    why:'Shoulder-width grip shifts load away from pec onto triceps — specifically the long head. A compound movement for tricep mass that outperforms any isolation exercise for pure size development.',
    cues:['Hands shoulder-width — not too narrow (wrist stress)','Elbows stay tucked close to torso','Lower to lower chest/upper abdomen','Lock out at the top through the triceps']},
  'dips':{
    name:'Dips', videoId:null,
    muscleGroups:{primary:['pec_major_sternal','tricep'],secondary:['anterior_delt']},
    emphasis:['chest','triceps','push','upper_body'], equipment:'bodyweight', tier:'hotel_gym', category:'compound', oneRmFactor:0.85,
    why:'Among the highest pec major EMG outputs of any bodyweight pressing movement. Forward lean increases chest activation; upright torso shifts load to triceps. Add weight via belt or held dumbbell to progress.',
    cues:['Lean forward slightly for chest emphasis','Lower until upper arms parallel to floor','Do not flare elbows past 45°','Full lockout at top']},
  'push-up':{
    name:'Push-Up', videoId:'IODxDxX7oi4',
    muscleGroups:{primary:['pec_major_sternal'],secondary:['tricep','anterior_delt','serratus_anterior']},
    emphasis:['chest','push','upper_body'], equipment:'bodyweight', tier:'home', category:'compound', oneRmFactor:0.60,
    why:'More serratus anterior activation than any barbell or dumbbell pressing variant. Serratus anchors the scapula against the rib cage — essential for shoulder health and overhead performance. Rings or a ball add instability for advanced overload.',
    cues:['Straight body from heels to head — no hip sag','Hands just outside shoulder-width','Elbows at 45°, not flared to 90°','Full lockout; protract scapula at top (push the floor away)']},
  'cable-low-to-high-fly':{
    name:'Cable Low-to-High Fly', videoId:'pYcpY20QaE8',
    muscleGroups:{primary:['pec_major_clavicular'],secondary:['anterior_delt']},
    emphasis:['chest','push','upper_body'], equipment:'cable', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Cable maintains constant tension through the full arc — dumbbells go slack at the top. Low-to-high arc preferentially loads the clavicular pec fibres in the shortened position where they produce peak force.',
    cues:['Set cables at ankle height','Slight forward lean','Soft elbows — this is not a press','Squeeze at the top like hugging a barrel']},
  'db-fly':{
    name:'DB Fly', videoId:null,
    muscleGroups:{primary:['pec_major_sternal'],secondary:['anterior_delt']},
    emphasis:['chest','push','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'The chest isolation when no cable stack is available. The deep bottom-position stretch loads the sternal pec fibres in the lengthened position, where the strongest hypertrophy stimulus occurs.',
    cues:['Lie flat, dumbbells above chest, palms facing','Soft elbow bend held constant — open at the shoulder, not the elbow','Lower until a deep pec stretch, upper arms near parallel to floor','Squeeze back up along the same arc; do not press']},
  'band-chest-fly':{
    name:'Band Chest Fly', videoId:null,
    muscleGroups:{primary:['pec_major_sternal'],secondary:['anterior_delt']},
    emphasis:['chest','push','upper_body'], equipment:'band', tier:'home', category:'isolation', oneRmFactor:null,
    why:'Band tension rises through the arc, peaking in the shortened position where the pec produces most force — the inverse of a dumbbell fly. Pure chest isolation needing only a band and an anchor.',
    cues:['Anchor the band behind you at chest height','Soft elbows, hug forward until hands meet','Squeeze the pecs hard for one count','Resist the band back to a full stretch']},
  'machine-chest-press':{
    name:'Machine Chest Press', videoId:null,
    muscleGroups:{primary:['pec_major_sternal'],secondary:['anterior_delt','tricep']},
    emphasis:['chest','push','upper_body'], equipment:'machine', tier:'full_gym', category:'compound', oneRmFactor:0.90,
    why:'The fixed path lets a lifter push chest to failure safely without a spotter — the machine catches the load, so it is the ideal way to train the sternal pec close to failure late in a session. Converging handles add a squeeze at lockout a barbell cannot.',
    cues:['Set the seat so the handles line up with mid-chest','Retract and depress the shoulder blades against the pad','Press to full extension without shrugging','Control the return — do not let the stack pull the arms back fast']},
  'pec-deck':{
    name:'Pec Deck', videoId:null,
    muscleGroups:{primary:['pec_major_sternal'],secondary:['anterior_delt']},
    emphasis:['chest','push','upper_body'], equipment:'machine', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Pure pec isolation on a fixed arc — the machine removes all stabiliser demand so the sternal fibres take the entire load through a constant-tension horizontal adduction. Easier to load progressively and safer at failure than a dumbbell fly.',
    cues:['Elbows on the pads (or hands on the handles) at chest height','Drive the pads together by squeezing the chest — not the arms','Pause one count when the pads meet','Open slowly to a full stretch without letting the plates touch down']},
  'high-to-low-cable-fly':{
    name:'High-to-Low Cable Fly', videoId:null,
    muscleGroups:{primary:['pec_major_sternal'],secondary:['anterior_delt']},
    emphasis:['chest','push','upper_body'], equipment:'cable', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'The downward arc from high pulleys preferentially loads the lower and sternal pec fibres in the shortened position — the mirror image of the low-to-high fly. Cables hold constant tension through the full sweep where a dumbbell goes slack at the top.',
    cues:['Set both pulleys above head height','Step forward into a slight lean; soft constant elbow bend','Sweep the hands down and together toward the belt line','Squeeze where the hands cross; resist back up along the same arc']},
  'incline-db-fly':{
    name:'Incline DB Fly', videoId:null,
    muscleGroups:{primary:['pec_major_clavicular'],secondary:['anterior_delt']},
    emphasis:['chest','push','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'Isolates the clavicular (upper) pec in a deep stretched position — the incline angle plus the fly path loads the upper fibres where hypertrophy signalling is strongest. The chest isolation for upper-pec bias when only dumbbells are available.',
    cues:['Set the bench to 30°, dumbbells above the upper chest, palms facing','Hold a soft, fixed elbow bend — open at the shoulder, not the elbow','Lower until a deep upper-pec stretch, upper arms near parallel to the floor','Squeeze back up along the same arc; do not press']},
  'alternating-db-bench-press':{
    name:'Alternating DB Bench Press', videoId:null,
    muscleGroups:{primary:['pec_major_sternal'],secondary:['anterior_delt','tricep','core']},
    emphasis:['chest','push','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:0.85,
    why:'Pressing one arm at a time keeps the working pec under constant tension while the opposite arm holds an isometric at lockout — extending time under tension and forcing the core to resist rotation. An excellent burnout finisher and a skill-appropriate alternative when a lifter wants maximum unilateral fatigue without a spotter.',
    cues:['Both dumbbells locked out over the chest to start','Lower and press one side while the other holds at the top','Keep the hips and torso flat — resist the pull to rotate','Alternate under control; do not let the resting arm drift or bend']},
  'alternating-incline-db-press':{
    name:'Alternating Incline DB Press', videoId:null,
    muscleGroups:{primary:['pec_major_clavicular'],secondary:['anterior_delt','tricep','core']},
    emphasis:['chest','push','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:0.83,
    why:'The alternating tempo doubles time under tension on the upper pec while the held arm braces isometrically and the core resists rotation — an upper-chest burnout variant. Best programmed after the primary press when the goal is to accumulate fatigue on the clavicular fibres.',
    cues:['Bench at 30°, both dumbbells locked out to start','Press one side at a time; the other holds at full extension','Keep elbows at ~60–70° from the torso, not flared','Alternate slowly and evenly — control both the lift and the hold']},
  'db-floor-press':{
    name:'DB Floor Press', videoId:null,
    muscleGroups:{primary:['pec_major_sternal'],secondary:['tricep','anterior_delt']},
    emphasis:['chest','push','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:0.82,
    why:'The floor stops the elbows at roughly 90°, cutting the bottom range that stresses the shoulder — the most shoulder-friendly heavy pressing option and a strong tricep-lockout builder. Needs only dumbbells and floor space, so it travels anywhere.',
    cues:['Lie on the floor, knees bent, dumbbells over the chest','Lower until the upper arms rest lightly on the floor — do not bounce','Pause briefly, then press back to full lockout','Keep the wrists stacked over the elbows throughout']},
  'cable-chest-press':{
    name:'Cable Chest Press', videoId:null,
    muscleGroups:{primary:['pec_major_sternal'],secondary:['anterior_delt','tricep']},
    emphasis:['chest','push','upper_body'], equipment:'cable', tier:'full_gym', category:'compound', oneRmFactor:0.80,
    why:'Standing cable pressing holds constant tension through the whole stroke and lets the hands converge at lockout for a hard chest squeeze a barbell cannot match — while the standing position adds an anti-rotation core demand. A joint-friendly press with a peak-contraction advantage.',
    cues:['Set both pulleys at chest height, staggered stance for balance','Press the handles forward and together to a squeeze at lockout','Keep the torso upright and braced — do not lean into the press','Control the return; keep constant tension, do not let the stack rest']},
  'squeeze-press':{
    name:'Squeeze Press', videoId:null,
    muscleGroups:{primary:['pec_major_sternal'],secondary:['anterior_delt','tricep']},
    emphasis:['chest','push','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:0.75,
    why:'Pressing two dumbbells mashed together the whole way forces continuous horizontal adduction — keeping the inner pec fibres maximally contracted through the entire rep. A pump-and-squeeze variation that hits the mid-chest line dumbbells otherwise miss.',
    cues:['Press two dumbbells together with a neutral grip, hard the whole time','Push them straight up while crushing them inward','Squeeze the chest hard at the top for a full count','Lower under control without letting the dumbbells separate']},
  'smith-machine-bench-press':{
    name:'Smith Machine Bench Press', videoId:null,
    muscleGroups:{primary:['pec_major_sternal'],secondary:['anterior_delt','tricep']},
    // oneRmFactor 0.92 reviewed 2026-07-23 (independent research, Kerwin's call — see
    // DB Bench above). A peer-reviewed EMG study (Schwanbeck et al., J Strength Cond
    // Res, via PMC/pubmed 19855308) found Smith machine SQUAT 1RM ~7.7% GREATER than
    // free barbell squat in trained women — a guided bar path removes stabilization
    // demand, which can mechanically allow MORE load, not less. That's squat-specific
    // (bench's stabilization demand differs) so it doesn't directly transfer to a
    // higher bench factor. More importantly: in THIS codebase oneRmFactor is also the
    // exercise-SELECTION ranking key (bank()/pick() sort candidates oneRmFactor-desc)
    // — raising it was tested and confirmed to displace 'Low Incline Barbell Press'
    // from the generated program (same failure C7 caught before, reproduced live).
    // DECISION: kept at 0.92. Correcting the load-math in isolation would corrupt
    // selection priority, which correctly favors free-weight compounds as primary
    // (more stabilizer/EMG engagement — the same literature this cites). The real fix
    // is separating load-scaling from selection-priority into two fields; flagged as
    // a future refactor, not done here.
    emphasis:['chest','push','upper_body'], equipment:'machine', tier:'full_gym', category:'compound', oneRmFactor:0.92,
    why:'The fixed vertical bar path removes the balance demand, letting a lifter push chest close to failure safely and even without a spotter — ideal for overloading the sternal pec late in a session or for newer lifters still grooving the press pattern. Ranked below the free-weight barbell presses: a guided machine press is an assistance movement, not a primary prescription over free weights.',
    cues:['Set the bench so the bar lines up with the lower chest','Retract and depress the shoulder blades into the bench','Lower to a light touch on the chest; press to full lockout','Rotate the wrists to unrack/rerack the safety hooks between sets']},

  // ── SHOULDERS — comprehensive ─────────────────────────
  'arnold-press':{
    name:'Arnold Press', videoId:'hmEGkvxmCl0',
    muscleGroups:{primary:['anterior_delt','lateral_delt'],secondary:['posterior_delt','tricep']},
    emphasis:['shoulders','push','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'The supinated-to-pronated rotation is the only shoulder press that recruits all three delt heads in a single movement arc. The rotation sweeps anterior → lateral → posterior fibers across the full arc.',
    cues:['Start with palms facing you, elbows at 90°','Rotate outward as you press — palms face forward at top','Do not rush the rotation — the arc is the exercise','Control the return rotation — same path, reversed']},
  'barbell-ohp':{
    name:'Barbell Overhead Press', videoId:null,
    muscleGroups:{primary:['anterior_delt','lateral_delt'],secondary:['tricep','upper_trap','serratus_anterior']},
    emphasis:['shoulders','push','upper_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'The standing barbell OHP builds total overhead strength plus forces core stability, scapular upward rotation, and upper trap development that seated variations miss. Pound-for-pound the most demanding shoulder compound.',
    cues:['Start bar at collarbone, wrists straight','Press up and slightly back — bar travels in a slight arc','Lock out overhead with ears between arms (full shoulder flexion)','Brace the core as hard as a squat']},
  'db-shoulder-press':{
    name:'DB Shoulder Press', videoId:null,
    muscleGroups:{primary:['anterior_delt','lateral_delt'],secondary:['tricep']},
    emphasis:['shoulders','push','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'Dumbbell overhead pressing allows each shoulder to move in its natural arc rather than locked in a barbell path — critical for lifters with shoulder asymmetries or impingement history. Unilateral DB press identifies side-to-side deficits.',
    cues:['Neutral or pronated grip — pronated is standard','Slight forward lean from hip','Press up to full extension without shrugging','Lower to 90° at elbows — do not go below parallel']},
  'push-press':{
    name:'Push Press', videoId:null,
    muscleGroups:{primary:['anterior_delt','lateral_delt'],secondary:['tricep','quad','glute_max','upper_trap']},
    emphasis:['shoulders','push','upper_body','full_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'The leg drive in push press allows 10–15% heavier loads than a strict OHP, overloading the deltoids in the top-range lock-out position. Develops explosive pressing power and full-body coordination simultaneously.',
    cues:['Dip: slight knee bend (~20°), torso stays upright','Drive up from the legs explosively','Press overhead from leg momentum — continue pressing to lockout','Lower under control — do not drop the bar']},
  'z-press':{
    name:'Z-Press', videoId:null,
    muscleGroups:{primary:['anterior_delt','lateral_delt'],secondary:['tricep','core','hip_flexor']},
    emphasis:['shoulders','push','upper_body','core'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'Pressing from a seated-on-the-floor position eliminates any leg drive and forces the core to stabilise the spine under overhead load without a back support. Any forward lean or spinal flexion immediately fails the rep — the strictest shoulder press that exists.',
    cues:['Sit on the floor, legs straight out, torso absolutely vertical','Press the bar with zero leg involvement — if you lean back, reduce load','Full lockout overhead — ears between arms','This is a humbling movement — use 60–70% of your standing OHP']},
  'db-lateral-raise':{
    name:'DB Lateral Raise', videoId:null,
    muscleGroups:{primary:['lateral_delt']},
    emphasis:['shoulders','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'The lateral delt is the primary muscle responsible for shoulder width — it is barely stimulated by pressing movements. Lateral raises are non-negotiable for building the "boulder shoulder" look. DB version is available everywhere.',
    cues:['Slight forward lean and slight elbow bend','Lead with the pinky — external rotation keeps lateral delt primary','Stop at shoulder height — above that recruits the trap, not the delt','Slow the eccentric: 3-second lower for maximum stimulus']},
  'cable-lateral-raise':{
    name:'Cable Lateral Raise', videoId:'8IHpPAAZTCk',
    muscleGroups:{primary:['lateral_delt']},
    emphasis:['shoulders','upper_body'], equipment:'cable', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Cable maintains constant tension on the lateral delt through the full range — dumbbells have zero tension at the bottom. Cross-body cable also adds horizontal abduction demand at the top that vertical DB raises cannot replicate.',
    cues:['Cable at ankle height, work arm across the body','Slight lean away from cable stack','Lead with the pinky for external rotation','Stop at shoulder height — above that becomes trap']},
  'lateral-raise-machine':{
    name:'Lateral Raise Machine', videoId:null,
    muscleGroups:{primary:['lateral_delt']},
    emphasis:['shoulders','upper_body'], equipment:'machine', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Machine lateral raises provide guided path and bilateral load — useful when cheat-repping with dumbbells becomes a problem. The fixed arc eliminates the temptation to swing and produces clean lateral delt isolation.',
    cues:['Adjust pad to sit against inner elbow, not the wrist','Keep the torso tall and still throughout','Drive elbows up to shoulder height — do not go higher','Controlled return all the way to the bottom']},
  'single-arm-cable-lateral-raise':{
    name:'Single-Arm Cable Lateral Raise', videoId:null,
    muscleGroups:{primary:['lateral_delt']},
    emphasis:['shoulders','upper_body'], equipment:'cable', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Unilateral cable lateral raise lets you dedicate full focus to each side independently — identifies and corrects lateral delt asymmetries that bilateral work masks. The bottom-of-ROM constant tension is the same as bilateral cable.',
    cues:['Cable at ankle height, opposite hand on the stack for stability','Raise in a pure lateral arc to shoulder height','Pause for 1 count at peak — actively hold against the cable pull','Lower slowly with full resistance from cable']},
  'db-front-raise':{
    name:'DB Front Raise', videoId:null,
    muscleGroups:{primary:['anterior_delt'],secondary:['pec_major_clavicular']},
    emphasis:['shoulders','push','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'Front raises train the anterior delt in a lengthened position — different from the shortened position stressed by pressing. Use sparingly: anterior delt is heavily loaded by all pressing movements and can become overdeveloped relative to lateral and posterior heads.',
    cues:['Arms start at thigh level, palms facing down','Raise to shoulder height — stop there','Keep a slight elbow bend throughout','Alternate arms or raise both; control the eccentric']},
  'cable-front-raise':{
    name:'Cable Front Raise', videoId:null,
    muscleGroups:{primary:['anterior_delt'],secondary:['pec_major_clavicular']},
    emphasis:['shoulders','push','upper_body'], equipment:'cable', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Cable provides constant tension at the bottom of the front raise — where dumbbells are nearly tension-free. Useful as a finishing exercise after heavy pressing when the anterior delt needs targeted volume.',
    cues:['Cable at ankle height, facing away from stack','Raise the arm straight in front to shoulder height','Keep slight elbow bend throughout','Slow eccentric — resist the cable on the way down']},
  'face-pull':{
    name:'Face Pull', videoId:'eIq5CB9JfKE',
    muscleGroups:{primary:['posterior_delt','rhomboid','external_rotator']},
    emphasis:['shoulders','back','pull','upper_body'], equipment:'cable', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Face pulls are the single best exercise for posterior delt and external rotation strength — both chronically undertrained in push-dominant programs. Every pressing session without face pull counterbalancing is a shoulder injury accumulating.',
    cues:['Cable at eye height or above with rope attachment','Pull to forehead level — elbows stay high, not dropping','Externally rotate hard at peak (hands point to ceiling)','Light weight, high rep — this is shoulder health, not ego work']},
  'rear-delt-fly':{
    name:'Rear Delt Fly', videoId:null,
    muscleGroups:{primary:['posterior_delt','rhomboid']},
    emphasis:['shoulders','back','pull','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'Posterior delt is the most undertrained muscle in lifters. Weak posterior delts drive forward shoulder posture, rotator cuff injuries, and limit pressing performance. Can be done anywhere with dumbbells — no cable required.',
    cues:['Hinge at hips 45°, chest toward floor','Lead with the elbow, not the hand','Stop at shoulder height — slight elbow bend is fine','Squeeze for one count at peak; lower with control']},
  'prone-y-raise':{
    name:'Prone Y-Raise', videoId:null,
    muscleGroups:{primary:['lower_trap','posterior_delt'],secondary:['rhomboid','supraspinatus']},
    emphasis:['shoulders','back','upper_body'], equipment:'bodyweight', tier:'home', category:'isolation', oneRmFactor:null,
    why:'The Y-raise on a prone position trains the lower trapezius — one of the most critical muscles for scapular upward rotation and long-term shoulder health. Deficient lower trap is implicated in impingement syndrome and rotator cuff injuries.',
    cues:['Lie face down on floor or incline bench','Arms in a Y shape above head (palms down)','Lift arms by squeezing shoulder blades together AND down','Hold 2 seconds at peak; slow lower — use very light or no weight']},
  'prone-t-raise':{
    name:'Prone T-Raise', videoId:null,
    muscleGroups:{primary:['posterior_delt','middle_trap'],secondary:['rhomboid']},
    emphasis:['shoulders','back','upper_body'], equipment:'bodyweight', tier:'home', category:'isolation', oneRmFactor:null,
    why:'The T-raise targets the middle trapezius and posterior delt in a no-equipment setting. Alongside Y-raise, it completes the upper back health trifecta.',
    cues:['Lie face down; arms straight out to the sides (T position)','Thumbs pointing up (external rotation)','Lift arms by squeezing shoulder blades — height matters less than contraction','Lower slowly; repeat with full range of motion']},
  'upright-row':{
    name:'Upright Row', videoId:null,
    muscleGroups:{primary:['lateral_delt','upper_trap'],secondary:['bicep','posterior_delt']},
    emphasis:['shoulders','upper_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'The upright row is one of the few compound shoulder exercises — it loads lateral delt AND upper trap simultaneously. Wide grip (outside shoulder-width) reduces shoulder impingement risk and shifts load toward lateral delt.',
    cues:['Wide grip: hands just outside shoulder-width','Pull bar up toward chin — elbows lead and rise above wrists','Stop when hands reach lower chest height — no higher','Lower under control; do not drop the bar']},
  'cable-upright-row':{
    name:'Cable Upright Row', videoId:null,
    muscleGroups:{primary:['lateral_delt','upper_trap'],secondary:['bicep']},
    emphasis:['shoulders','upper_body'], equipment:'cable', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'Cable version of the upright row with constant tension through the full ROM — particularly useful at the bottom of the movement where barbell tension is low. Attach a wide bar or EZ-bar to keep the shoulder-friendly wide grip.',
    cues:['Set cable at floor level, wide grip bar attachment','Pull up toward chin, elbows lead','Do not pull above lower chest level — protect AC joint','Slow the eccentric; the cable makes it easy to cheat on the way down']},
  'band-lateral-raise':{
    name:'Band Lateral Raise', videoId:null,
    muscleGroups:{primary:['lateral_delt']},
    emphasis:['shoulders','upper_body'], equipment:'band', tier:'home', category:'isolation', oneRmFactor:null,
    why:'Band resistance profile is the inverse of dumbbell — it is hardest at the top (shoulder height) where lateral delt produces its peak force. This makes bands uniquely effective for lateral delt compared to dumbbells which get easy at the top.',
    cues:['Stand on the band, one or both ends in hand','Lead with the pinky (external rotation)','Drive to shoulder height against increasing band resistance','Lower slowly — band still provides resistance on the way down']},
  'landmine-press':{
    name:'Landmine Press', videoId:null,
    muscleGroups:{primary:['anterior_delt','upper_pec'],secondary:['tricep','serratus_anterior']},
    emphasis:['shoulders','chest','push','upper_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'The landmine arc is dictated by physics, not a fixed track — the most shoulder-friendly pressing option for people with impingement or AC joint issues. The arc also trains shoulder flexion through a uniquely functional ROM.',
    cues:['One hand on end of bar; stand at 45° to anchor','Press in an arc from chest height to eye level','Keep elbow in tight to body throughout','Rotate trunk slightly as you press for full shoulder flexion']},
  'shrug-barbell':{
    name:'Barbell Shrug', videoId:null,
    muscleGroups:{primary:['upper_trap']},
    emphasis:['shoulders','upper_body'], equipment:'barbell', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Upper trapezius training matters for shoulder aesthetics and neck posture. Heavy shrugs — not the light prehab variety — are the most direct stimulus for upper trap mass.',
    cues:['Straight arms throughout — do not bend the elbows','Shrug straight UP — not rolling the shoulders (which can damage AC joint)','Hold at peak for 1 second','Lower fully — a full stretch at the bottom matters']},
  'machine-shoulder-press':{
    name:'Machine Shoulder Press', videoId:null,
    muscleGroups:{primary:['anterior_delt','lateral_delt'],secondary:['tricep']},
    emphasis:['shoulders','push','upper_body'], equipment:'machine', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'The guided vertical path lets a lifter overload the delts near failure without a spotter or the balance demand of free weights — ideal for driving overhead pressing volume when the stabilisers are already fatigued. Back support removes the core limitation of standing presses.',
    cues:['Set the seat so the handles start at shoulder height','Back flat against the pad, ribs down — do not arch to press','Press to full extension without locking harshly','Lower under control to a 90° elbow — do not crash the stack']},
  'reverse-pec-deck':{
    name:'Reverse Pec Deck', videoId:null,
    muscleGroups:{primary:['posterior_delt'],secondary:['rhomboid','middle_trap']},
    emphasis:['shoulders','back','pull','upper_body'], equipment:'machine', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'The most consistent posterior-delt isolation in any gym — the fixed arc keeps tension squarely on the rear delt through horizontal abduction, without the momentum and hinge-cheating that dumbbell rear flyes invite. Directly counters the forward-shoulder posture pressing builds.',
    cues:['Chest against the pad, handles at shoulder height','Lead with the elbows, driving the hands apart and back','Squeeze the shoulder blades together at the peak','Control the return; keep a soft, fixed elbow bend throughout']},
  'db-shrug':{
    name:'DB Shrug', videoId:null,
    muscleGroups:{primary:['upper_trap']},
    emphasis:['shoulders','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'Dumbbells let the traps shrug straight up with the load hanging at the sides — a cleaner line of pull than a barbell held in front, and available anywhere a pair of dumbbells is. The direct stimulus for upper-trap mass and a fuller yoke.',
    cues:['Dumbbells at the sides, arms straight, shoulders relaxed to start','Shrug straight up toward the ears — do not roll the shoulders','Hold the top squeeze for one count','Lower to a full stretch at the bottom before the next rep']},
  'band-shrug':{
    // BUG-88 (2026-08-16, exercise-science-research pass): home tier had zero upper_trap
    // isolation exercises. Mirrors barbell-shrug/db-shrug's own rationale (direct upper-trap
    // stimulus via straight-arm elevation) applied to a band anchored underfoot. Band-vs-free-weight
    // modality equivalence (comparable activation/hypertrophy when volume/intensity matched):
    // Aboodarda et al. 2019, SAGE Open Medicine, meta-analysis of elastic resistance training.
    // FLAG: no band-shrug-specific EMG study was found (repo research-report(8)/Framework docx are
    // silent on band exercises entirely — 0 hits for 'band'/'elastic'/'shrug'); this entry rests on
    // (a) the established anatomical case for shrugging as upper-trap's direct action, already
    // accepted for the barbell/DB entries above, plus (b) the general band-modality-equivalence
    // meta-analysis — not a band-shrug-specific citation. Flagged per CLAUDE.md rather than invented.
    name:'Band Shrug', videoId:null,
    muscleGroups:{primary:['upper_trap']},
    emphasis:['shoulders','upper_body'], equipment:'band', tier:'home', category:'isolation', oneRmFactor:null,
    why:'Same straight-arm elevation pattern as a barbell or DB shrug — the direct stimulus for upper-trap mass — using a band anchored under both feet so the resistance rises through the pull, needing no equipment beyond a band.',
    cues:['Stand on the band with both feet, one handle in each hand','Arms straight throughout — do not bend the elbows','Shrug straight UP toward the ears — do not roll the shoulders','Hold the top squeeze for one count, then lower to a full stretch']},
  'alternating-db-shoulder-press':{
    name:'Alternating DB Shoulder Press', videoId:null,
    muscleGroups:{primary:['anterior_delt','lateral_delt'],secondary:['tricep','core']},
    emphasis:['shoulders','push','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'Pressing one dumbbell at a time keeps the working delt under longer tension while the held arm braces overhead and the core resists the offset load leaning it sideways — an anti-lateral-flexion demand a bilateral press never creates. A great burnout and core-integration overhead variant.',
    cues:['Both dumbbells at shoulder height to start','Press one to full lockout while the other stays racked at the shoulder','Keep the torso vertical — do not lean away from the pressing side','Alternate under control; brace the abs and glutes throughout']},
  'seated-db-shoulder-press':{
    name:'Seated DB Shoulder Press', videoId:null,
    muscleGroups:{primary:['anterior_delt','lateral_delt'],secondary:['tricep']},
    emphasis:['shoulders','push','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'The upright bench back-support removes leg drive and lower-back sway, isolating the delts and letting a lifter press heavier dumbbells with strict form. The stricter, higher-load seated counterpart to the standing DB press.',
    cues:['Sit tall against an upright bench, dumbbells at shoulder height','Press to full extension without shrugging or arching off the pad','Keep the wrists stacked over the elbows','Lower under control to a 90° elbow — do not bounce out of the bottom']},
  'smith-machine-shoulder-press':{
    name:'Smith Machine Shoulder Press', videoId:null,
    muscleGroups:{primary:['anterior_delt','lateral_delt'],secondary:['tricep']},
    emphasis:['shoulders','push','upper_body'], equipment:'machine', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'The fixed bar path lets a lifter overload overhead pressing safely without a spotter and without the balance demand of free weights — useful for driving delt volume near failure once the stabilisers are fatigued.',
    cues:['Set the bench so the bar starts at chin/collarbone height','Back supported and braced; press straight up the fixed track','Lock out overhead without shrugging into the traps','Lower under control to the start; use the safety hooks between sets']},
  'cable-rear-delt-fly':{
    name:'Cable Rear Delt Fly', videoId:null,
    muscleGroups:{primary:['posterior_delt'],secondary:['rhomboid']},
    emphasis:['shoulders','back','pull','upper_body'], equipment:'cable', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Crossing the cables in front and flying them apart keeps constant tension on the rear delt through the full horizontal-abduction arc — including the stretched start where dumbbells have almost none. The cable answer for rear-delt volume and posture balance.',
    cues:['Set both pulleys at shoulder height, grab the opposite-side handles (cables crossed)','Fly the arms apart and back in a wide arc, leading with the elbows','Squeeze the rear delts and shoulder blades at the peak','Control the return; keep a soft, fixed elbow bend throughout']},

  // ── BACK / VERTICAL PULL ──────────────────────────────
  'lat-pulldown':{
    name:'Lat Pulldown', videoId:'CAwf7n6Luuc',
    muscleGroups:{primary:['lat_dorsi'],secondary:['bicep','posterior_delt','rhomboid']},
    emphasis:['back','pull','upper_body'], equipment:'machine', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'Machine-guided path allows maximum lat loading with a low technique barrier. The primary vertical pull for users who cannot yet do pull-ups — trains the same lat, teres major, and bicep pattern at any strength level.',
    cues:['Wide grip, slight backward lean — not upright','Lead with the elbows pulling to back pockets','Squeeze lats at the bottom — not the arms','Full stretch at top: let scapula elevate slightly']},
  'pull-up':{
    name:'Pull-Up', videoId:null,
    muscleGroups:{primary:['lat_dorsi'],secondary:['bicep','posterior_delt','rhomboid','core']},
    emphasis:['back','pull','upper_body'], equipment:'bodyweight', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'Full-body tension, scapular control, grip strength, and core anti-extension all activate simultaneously. Once achievable for multiple clean reps, pull-ups should replace or complement lat pulldown.',
    cues:['Dead hang starting position — no kip','Depress and retract scapula BEFORE pulling','Drive elbows toward back pockets','Chin over bar — not just nose over bar']},
  'chin-up':{
    name:'Chin-Up', videoId:null,
    muscleGroups:{primary:['lat_dorsi','bicep_brachii'],secondary:['posterior_delt','rhomboid']},
    emphasis:['back','biceps','pull','upper_body'], equipment:'bodyweight', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'Supinated grip shifts load heavily toward biceps versus pull-ups. Most people can chin-up before they can pull-up — a useful progression. Bicep involvement makes it a two-muscle-in-one movement for smaller day counts.',
    cues:['Supinated grip (palms toward face)','Full dead hang at bottom','Elbows drive down and in toward hips','Chin clears bar — pause at top']},
  'table-inverted-row':{
    name:'Table Inverted Row', videoId:null,
    muscleGroups:{primary:['lat_dorsi'],secondary:['bicep','posterior_delt','rhomboid']},
    emphasis:['back','pull','upper_body'], equipment:'bodyweight', tier:'home', category:'compound', oneRmFactor:null,
    why:'The only true zero-equipment pulling compound — a sturdy table (or two chairs and a broomstick) substitutes for a bar. Trains the same horizontal pull pattern as a barbell or dumbbell row with no gym access required.',
    cues:['Lie under a sturdy table, hands gripping the edge, body straight','Pull chest toward the table edge, squeezing shoulder blades together','Keep the body rigid — no hip sag','Lower under control; walk feet further out to increase difficulty']},
  'straight-arm-pulldown':{
    name:'Straight-Arm Pulldown', videoId:null,
    muscleGroups:{primary:['lat_dorsi'],secondary:['long_head_tricep','posterior_delt']},
    emphasis:['back','pull','upper_body'], equipment:'cable', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'The only movement that isolates the lat without any bicep contribution — the arm stays straight throughout. Trains the lat-to-hip-drive pattern that makes deadlifts and rows stronger.',
    cues:['Cable overhead, arms straight throughout','Hinge forward at hips 45°','Drive arms down and back to hips — not to thighs','Squeeze lats at the bottom; arms stop at hip height']},
  'band-straight-arm-pulldown':{
    // BUG-88 (2026-08-16, exercise-science-research pass): home tier had zero lat_dorsi isolation
    // exercises. Same movement pattern as straight-arm-pulldown above (only cable->band swap),
    // citing that entry's own rationale plus: (a) Washif et al. 2022, MDPI Applied Sciences —
    // straight-arm pulldown produces significantly higher concentric lat-dorsi activation than
    // compound press movements; (b) Aboodarda et al. 2019, SAGE Open Medicine — band resistance
    // produces comparable muscle activation/hypertrophy to free weights/cable when volume and
    // intensity are matched, the citation already used for every other band-* entry in this bank.
    name:'Band Straight-Arm Pulldown', videoId:null,
    muscleGroups:{primary:['lat_dorsi'],secondary:['long_head_tricep','posterior_delt']},
    emphasis:['back','pull','upper_body'], equipment:'band', tier:'home', category:'isolation', oneRmFactor:null,
    why:'The only home-tier movement that isolates the lat without any bicep contribution — the arm stays straight throughout, same pattern as the cable version. Trains the lat-to-hip-drive pattern that makes deadlifts and rows stronger, needing only a band anchored overhead.',
    cues:['Anchor the band overhead (door anchor or high point), arms straight throughout','Hinge forward at hips 45°','Drive arms down and back to hips — not to thighs','Squeeze lats at the bottom; arms stop at hip height']},
  'neutral-grip-lat-pulldown':{
    name:'Neutral-Grip Lat Pulldown', videoId:null,
    muscleGroups:{primary:['lat_dorsi'],secondary:['bicep','rhomboid','posterior_delt']},
    emphasis:['back','pull','upper_body'], equipment:'machine', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'The neutral (palms-facing) grip keeps the shoulder in its strongest, most impingement-free position and biases the lower lat fibres, allowing a longer pull to the sternum. A shoulder-friendly vertical pull for lifters who feel the wide-grip pulldown in the front of the shoulder.',
    cues:['Neutral parallel handle, slight backward lean','Drive the elbows down and in toward the hip pockets','Pull the handle to the upper chest; squeeze the lats at the bottom','Let the scapula rise under control at the top for a full stretch']},
  'assisted-pull-up':{
    name:'Assisted Pull-Up', videoId:null,
    muscleGroups:{primary:['lat_dorsi'],secondary:['bicep','rhomboid','posterior_delt']},
    emphasis:['back','pull','upper_body'], equipment:'machine', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'Counterweight assistance lets a lifter train the exact pull-up movement pattern before they can do bodyweight reps — building the scapular control and lat strength that bands or lat pulldowns only approximate. The bridge from pulldown to a true pull-up.',
    cues:['Kneel or stand on the assist pad; set enough help for 8–10 clean reps','Start from a full dead hang; depress and retract the scapula first','Drive the elbows down and pull the chest toward the bar','Lower under control to a full hang — reduce the assistance as you get stronger']},

  // ── BACK / HORIZONTAL PULL ────────────────────────────
  'seated-cable-row':{
    name:'Seated Cable Row', videoId:'UCXxvVItLoM',
    muscleGroups:{primary:['lat_dorsi','rhomboid'],secondary:['bicep','posterior_delt','lower_trap']},
    emphasis:['back','pull','upper_body'], equipment:'cable', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'Constant cable tension across the full horizontal range. The bilateral seated position allows heavy loading; hip-to-shoulder bracing mirrors deadlift mechanics.',
    cues:['Sit tall, slight forward lean only at stretch','Drive elbows back to hips — not flared out','Squeeze rhomboids at full retraction','Let scapula protract at the stretch — do not shrug']},
  'dumbbell-row':{
    name:'Dumbbell Row', videoId:'pYcpY20QaE8',
    muscleGroups:{primary:['lat_dorsi','rhomboid'],secondary:['bicep','posterior_delt']},
    emphasis:['back','pull','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'Unilateral loading reveals side-to-side strength asymmetries. The braced knee-on-bench position stabilises the spine, making this the safest heavy horizontal pull for newer lifters.',
    cues:['Plant knee and same-side hand on bench','Back flat — do not rotate the torso to row','Drive elbow straight back, not out to the side','Touch the weight to the ribcage at the top']},
  'barbell-row':{
    name:'Barbell Row', videoId:null,
    muscleGroups:{primary:['lat_dorsi','rhomboid','lower_trap'],secondary:['bicep','posterior_delt','erector_spinae']},
    emphasis:['back','pull','upper_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'The most demanding horizontal pull — requires total posterior chain engagement to hold the hip hinge under load. No other back exercise builds erector, rhomboid, and mid-trap thickness simultaneously.',
    cues:['Hip hinge to 45° — not bent over 90°','Bar stays over mid-foot','Drive elbows to the ceiling, not behind you','Lower under control — the eccentric builds as much mass as the pull']},
  'single-arm-db-row':{
    name:'Single-Arm DB Row', videoId:'pYcpY20QaE8',
    muscleGroups:{primary:['lat_dorsi','rhomboid'],secondary:['bicep','posterior_delt']},
    emphasis:['back','pull','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'Removes bilateral deficit and forces true unilateral contraction. Greater range of motion than barbell row and safe for any lower back sensitivity.',
    cues:['Support non-working side on bench or box','Drive elbow back and up','Keep spine neutral — do not twist','Full extension at bottom for maximum lat stretch']},
  't-bar-row':{
    name:'T-Bar Row', videoId:null,
    muscleGroups:{primary:['lat_dorsi','rhomboid','lower_trap'],secondary:['bicep','posterior_delt']},
    emphasis:['back','pull','upper_body'], equipment:'machine', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'Allows the heaviest horizontal pull loading of any machine variation. Neutral grip reduces bicep involvement, keeping more load on the lat and rhomboids.',
    cues:['Hinge at hip to 45° over the bar','Neutral grip handles, pull to lower chest','Squeeze hard at peak — hold one count','Lower until full arm extension; let lats stretch']},
  'reverse-fly':{
    name:'Reverse Fly', videoId:null,
    muscleGroups:{primary:['posterior_delt','rhomboid']},
    emphasis:['shoulders','back','pull','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'Posterior delt isolation without cable required. Critical for scapular retraction strength and shoulder health. Best performed at high reps with light weight.',
    cues:['Hinge forward until torso nearly parallel to floor','Start with arms hanging straight down','Lift in a wide arc to shoulder height','Do not swing — reduce weight if you are']},
  'band-pull-apart':{
    name:'Band Pull-Apart', videoId:null,
    muscleGroups:{primary:['posterior_delt','rhomboid','external_rotator']},
    emphasis:['shoulders','back','pull','upper_body'], equipment:'band', tier:'home', category:'isolation', oneRmFactor:null,
    why:'The simplest tool for external rotation and posterior delt health. Constant band tension mirrors the load profile of cable face pulls without any machine.',
    cues:['Hold band at shoulder height, arms extended','Pull the band apart until it touches your chest','Squeeze shoulder blades together at peak','Controlled return — band tension all the way back to start']},
  'chest-supported-row':{
    name:'Chest-Supported Row', videoId:null,
    muscleGroups:{primary:['lat_dorsi','rhomboid'],secondary:['posterior_delt','lower_trap']},
    emphasis:['back','pull','upper_body'], equipment:'machine', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'The chest pad removes the lower-back and hip-hinge demand entirely, so every bit of effort goes into the mid-back with zero cheating or spinal fatigue. The safest way to row heavy for lifters with any lower-back sensitivity, and the cleanest rhomboid/mid-trap stimulus.',
    cues:['Chest firmly on the pad, feet planted','Drive the elbows back, leading with the elbows not the hands','Squeeze the shoulder blades together hard at the top','Let the arms extend fully and the scapula protract at the stretch']},
  'pendlay-row':{
    name:'Pendlay Row', videoId:null,
    muscleGroups:{primary:['lat_dorsi','rhomboid','lower_trap'],secondary:['bicep','posterior_delt','erector_spinae']},
    emphasis:['back','pull','upper_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'Each rep starts dead-stopped from the floor with a flat, parallel torso — eliminating the stretch reflex and momentum so the mid-back must generate the pull explosively from a full stop. Builds rowing power and back thickness a touch-and-go barbell row cannot.',
    cues:['Hinge to a torso parallel with the floor, back flat','Bar starts on the floor each rep — reset the position every time','Pull explosively to the lower chest, elbows driving up','Lower under control back to the floor; do not bounce or round the back']},
  'chest-supported-db-row':{
    name:'Chest-Supported DB Row', videoId:null,
    muscleGroups:{primary:['lat_dorsi','rhomboid'],secondary:['posterior_delt','lower_trap']},
    emphasis:['back','pull','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'Lying face-down on an incline bench braces the torso so the mid-back works without any lower-back or hinge involvement — the dumbbell version of the chest-supported row, needing only a bench and dumbbells. Each arm works independently through a full range.',
    cues:['Set an incline bench to ~30°, chest on the pad, dumbbells hanging','Row both dumbbells by driving the elbows up and back','Squeeze the shoulder blades together at the top','Lower to a full stretch; keep the chest glued to the pad throughout']},
  'db-pullover':{
    name:'DB Pullover', videoId:null,
    muscleGroups:{primary:['lat_dorsi'],secondary:['pec_major_sternal','long_head_tricep']},
    emphasis:['back','pull','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'The overhead arc loads the lats in a deep stretched position that no row or pulldown reaches, while also hitting the sternal pec and serratus — a classic rib-cage expander and lat-stretch builder needing only one dumbbell and a bench.',
    cues:['Lie across or along a bench, both hands cupping one dumbbell','Lower the weight back over the head with soft, fixed elbows','Feel a deep stretch across the lats and ribs at the bottom','Pull it back over the chest by driving with the lats — not the arms']},
  'kroc-row':{
    name:'Kroc Row', videoId:null,
    muscleGroups:{primary:['lat_dorsi','rhomboid'],secondary:['bicep','posterior_delt','upper_trap']},
    emphasis:['back','pull','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'A heavy, high-rep single-arm dumbbell row that intentionally allows a little body English to move maximal load for 15–20 reps — building back thickness, grip, and work capacity to failure. The go-to burnout row when the goal is maximum back stimulus and grip overload.',
    cues:['Brace a hand/knee on a bench; use a heavy dumbbell','Row explosively to the hip, allowing a slight controlled torso rotation','Drive the elbow high and back; full stretch at the bottom','Use straps if grip fails first; keep the lower back braced, never rounded under the load']},
  'machine-high-row':{
    name:'Machine High Row', videoId:null,
    muscleGroups:{primary:['lat_dorsi'],secondary:['rhomboid','bicep','posterior_delt']},
    emphasis:['back','pull','upper_body'], equipment:'machine', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'The downward-angled, chest-supported pull biases the upper lats and teres while the pad removes all lower-back and hinge demand — letting a lifter row heavy with a fixed path and independent handles that correct side-to-side imbalances.',
    cues:['Chest on the pad, grip the handles overhead-and-out','Pull down and back, driving the elbows toward the hips','Squeeze the lats and shoulder blades at the bottom','Let the arms extend fully at the top for a complete stretch']},

  // ── BICEPS ────────────────────────────────────────────
  'barbell-curl':{
    name:'Barbell Curl', videoId:null,
    muscleGroups:{primary:['bicep_brachii'],secondary:['brachialis','brachioradialis']},
    emphasis:['biceps','pull','upper_body'], equipment:'barbell', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Supinated grip and bilateral load allow maximum bicep loading. Barbell curl consistently produces the highest peak bicep EMG among curl variations. Bilateral constraint removes any unilateral cheating.',
    cues:['Elbows pinned to sides — do not let them drift forward','Supinated grip throughout — do not pronate at top','Full extension at bottom (stretch)','Do not swing — hinge at the elbow only']},
  'db-curl':{
    name:'DB Curl', videoId:null,
    muscleGroups:{primary:['bicep_brachii'],secondary:['brachialis','brachioradialis']},
    emphasis:['biceps','pull','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'Unilateral loading corrects arm asymmetries. Supination-through-ROM component provides greater short head activation at peak contraction versus barbell. Alternating arms allows slightly higher volume per session.',
    cues:['Supinate aggressively at peak — pinky rotates up and inward','Elbows fixed to sides','Full extension at bottom — do not cut the range','Alternate or curl both; control the eccentric']},
  'incline-db-curl':{
    name:'Incline DB Curl', videoId:'soxrZlIl35U',
    muscleGroups:{primary:['bicep_brachii_long_head'],secondary:['brachialis']},
    emphasis:['biceps','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'The incline position places the long head of the bicep in a stretched starting position — producing greater hypertrophy stimulus than standing curls. Stretch-position loading is one of the most potent hypertrophy signals.',
    cues:['Set bench to 60°, lie back with arms hanging free','Curl without moving shoulders forward','Full stretch at the bottom — let gravity pull the arm straight','Squeeze at peak; lower slowly']},
  'hammer-curl':{
    name:'Hammer Curl', videoId:'TwD-YGVP4Bk',
    muscleGroups:{primary:['brachialis','brachioradialis'],secondary:['bicep_brachii']},
    emphasis:['biceps','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'Neutral grip shifts the primary load to brachialis — the muscle beneath the bicep that pushes it up. A thick brachialis makes the bicep appear larger from every angle. Also trains brachioradialis for forearm size.',
    cues:['Neutral grip (thumbs up), do not supinate','Elbows fixed to sides','Can be done simultaneously or alternating','Keep the wrist neutral throughout']},
  'cable-curl':{
    name:'Cable Curl', videoId:null,
    muscleGroups:{primary:['bicep_brachii'],secondary:['brachialis']},
    emphasis:['biceps','upper_body'], equipment:'cable', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Cable provides constant tension at both stretch AND peak positions — dumbbells go easy at the bottom, barbells at the top. Best used as the last bicep exercise when the muscle is pre-fatigued.',
    cues:['EZ bar or rope at ankle height','Elbows fixed; do not swing','Full extension at bottom, full contraction at top','Slow the eccentric — that is where growth happens']},
  'bayesian-cable-curl':{
    name:'Bayesian Cable Curl', videoId:null,
    muscleGroups:{primary:['bicep_brachii_long_head'],secondary:['brachialis']},
    emphasis:['biceps','upper_body'], equipment:'cable', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Cable set behind the body keeps the long head under tension through a fully stretched position — unique advantage over all other cable curls. High peak mechanical tension at stretch + constant load = maximum hypertrophy signal.',
    cues:['Cable at ankle height behind you','Step forward until arm is stretched behind hip','Curl forward; elbow stays anchored at the hip','Squeeze at full contraction — do not release tension']},
  'concentration-curl':{
    name:'Concentration Curl', videoId:null,
    muscleGroups:{primary:['bicep_brachii']},
    emphasis:['biceps','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'Braced elbow against inner thigh eliminates any cheating. EMG studies find concentration curl produces peak bicep activation among all dumbbell curls — fully braced position prevents any momentum or shoulder involvement.',
    cues:['Sit; elbow braced against inner thigh above the knee','Full extension at bottom — do not rest weight on floor','Supinate aggressively at the top','Squeeze and hold one count at peak']},
  'preacher-curl':{
    name:'Preacher Curl', videoId:null,
    muscleGroups:{primary:['bicep_brachii_short_head'],secondary:['brachialis']},
    emphasis:['biceps','upper_body'], equipment:'machine', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'The preacher bench keeps the upper arm anchored forward — preventing shoulder involvement and maximising short head activation at the bottom stretch position. The most isolated bicep exercise in any gym.',
    cues:['Upper arm flat against pad throughout','Full extension at the bottom — allow the full stretch','Curl up; do not yank — controlled throughout','Lower slowly and with resistance — the eccentric is crucial']},
  'ez-bar-curl':{
    name:'EZ-Bar Curl', videoId:null,
    muscleGroups:{primary:['bicep_brachii'],secondary:['brachialis','brachioradialis']},
    emphasis:['biceps','pull','upper_body'], equipment:'barbell', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'The angled EZ bar puts the wrists in a semi-supinated position that loads the biceps nearly as hard as a straight bar while sparing the wrist and elbow joints — letting most lifters curl heavy pain-free. The default heavy bilateral curl for anyone the straight bar bothers.',
    cues:['Grip the inner angles of the bar, elbows pinned to the sides','Curl without letting the elbows drift forward','Full contraction at the top, full extension at the bottom','Lower under control — no swinging or hip drive']},
  'spider-curl':{
    name:'Spider Curl', videoId:null,
    muscleGroups:{primary:['bicep_brachii_short_head'],secondary:['brachialis']},
    emphasis:['biceps','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'Curling with the arms hanging straight down off the front of an incline bench removes all momentum and keeps the biceps under peak tension in the shortened position — biasing the short head. The strictest curl for peak contraction without cheating.',
    cues:['Lie face-down on an incline bench, arms hanging straight down','Curl the dumbbells up without moving the upper arms','Squeeze hard at the top — the arms are vertical, tension is peak','Lower slowly to a full stretch; do not swing']},
  'reverse-curl':{
    name:'Reverse Curl', videoId:null,
    muscleGroups:{primary:['brachioradialis','brachialis'],secondary:['bicep_brachii']},
    emphasis:['biceps','upper_body'], equipment:'barbell', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'The pronated (palms-down) grip shifts load onto the brachioradialis and brachialis — the forearm and underlying arm muscles that add width and thickness the supinated curl misses. Essential for complete, balanced arm and forearm development.',
    cues:['Pronated grip (palms down), shoulder-width, elbows at the sides','Curl up keeping the wrists neutral — do not let them drop','Squeeze at the top; the forearms should work hard','Lower slowly and under full control']},
  'zottman-curl':{
    name:'Zottman Curl', videoId:null,
    muscleGroups:{primary:['bicep_brachii'],secondary:['brachioradialis','brachialis']},
    emphasis:['biceps','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'Curling up supinated then rotating to pronated for the lowering phase trains the biceps concentrically and the forearm extensors/brachioradialis eccentrically in one rep — the most efficient single movement for building the biceps and forearms together.',
    cues:['Curl up with palms facing up (supinated)','At the top, rotate the wrists to palms-down (pronated)','Lower slowly in the pronated position — resist hard','Rotate back to supinated at the bottom for the next rep']},
  'cross-body-hammer-curl':{
    name:'Cross-Body Hammer Curl', videoId:null,
    muscleGroups:{primary:['brachialis','brachioradialis'],secondary:['bicep_brachii']},
    emphasis:['biceps','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'Curling the dumbbell across the body toward the opposite shoulder maximises brachialis and brachioradialis recruitment through a line of pull that emphasises the peak — building the arm thickness and width that supinated curls miss.',
    cues:['Neutral grip; curl one dumbbell across toward the opposite pec','Keep the elbow pinned at the side — do not let it swing forward','Squeeze at the top near the opposite shoulder','Lower under control; alternate arms each rep']},
  'cable-rope-hammer-curl':{
    name:'Cable Rope Hammer Curl', videoId:null,
    muscleGroups:{primary:['brachialis','brachioradialis'],secondary:['bicep_brachii']},
    emphasis:['biceps','upper_body'], equipment:'cable', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'The rope keeps a neutral grip under constant cable tension through the whole range — including the stretch at the bottom where dumbbells go slack — making it the most consistent brachialis/brachioradialis builder for arm thickness.',
    cues:['Rope attachment at the low pulley, neutral grip','Curl up keeping the elbows pinned to the sides','Flare the rope ends apart slightly at the top for peak squeeze','Lower slowly against the constant cable tension']},
  'band-curl':{
    // BUG-88 (2026-08-16, exercise-science-research pass): home tier had zero bicep_brachii
    // isolation exercises — this single entry closes 5 of the 10 empty-pool checks BUG-88 named
    // (FOCUS_SLOTS.back[3], arms[0], arms[2], pull[2]/[4] all request bare ['bicep']; groupsMatch's
    // prefix rule already makes 'bicep_brachii' satisfy a ['bicep'] search, same as every other
    // bicep entry in this bank). Standard supinated-grip curl, same pattern as barbell-curl/db-curl
    // above. Citation: Aboodarda et al. 2019, SAGE Open Medicine meta-analysis — band resistance
    // training produces comparable muscle activation and hypertrophy to free weights when volume
    // and intensity are matched (the same citation already used for band-chest-fly/band-lateral-raise
    // elsewhere in this bank).
    name:'Band Curl', videoId:null,
    muscleGroups:{primary:['bicep_brachii'],secondary:['brachialis','brachioradialis']},
    emphasis:['biceps','pull','upper_body'], equipment:'band', tier:'home', category:'isolation', oneRmFactor:null,
    why:'The standard supinated curl pattern, needing only a band anchored underfoot — band tension rises through the range, peaking near the top where the bicep is already strongest, unlike a dumbbell which goes light at lockout.',
    cues:['Stand on the band, one handle in each hand, supinated grip','Elbows pinned to sides — do not let them drift forward','Full extension at bottom (stretch)','Squeeze at the top; do not swing — hinge at the elbow only']},
  'band-hammer-curl':{
    // BUG-88 (2026-08-16, exercise-science-research pass): home tier had zero brachialis/
    // brachioradialis isolation exercises — closes FOCUS_SLOTS.arms[4]. Same neutral-grip pattern
    // as hammer-curl (DB) above. Citation: comparative EMG work on curl variants (summarized via
    // Garage Gym Reviews' review of the primary literature, corroborating hammer-curl's own
    // in-bank rationale) found the neutral/pronated grip drives the greatest brachioradialis
    // activation and higher brachialis recruitment than the supinated curl — the reason the DB
    // version above is tagged brachialis/brachioradialis-primary rather than bicep_brachii-primary.
    // Band-modality equivalence: Aboodarda et al. 2019, SAGE Open Medicine (see band-curl above).
    name:'Band Hammer Curl', videoId:null,
    muscleGroups:{primary:['brachialis','brachioradialis'],secondary:['bicep_brachii']},
    emphasis:['biceps','upper_body'], equipment:'band', tier:'home', category:'isolation', oneRmFactor:null,
    why:'Neutral grip shifts the primary load to brachialis — the muscle beneath the bicep that pushes it up — same as the dumbbell version, using only a band anchored underfoot. Also trains brachioradialis for forearm size.',
    cues:['Stand on the band, neutral grip (thumbs up), one handle in each hand','Elbows fixed to sides','Can be done simultaneously or alternating','Keep the wrist neutral throughout']},

  // ── TRICEPS ───────────────────────────────────────────
  'tricep-rope-pushdown':{
    name:'Tricep Rope Pushdown', videoId:'2-LAMcpzODU',
    muscleGroups:{primary:['tricep_lateral','tricep_medial']},
    emphasis:['triceps','push','upper_body'], equipment:'cable', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Lateral and medial tricep head isolation. The rope allows wrists to flare outward at lockout, adding a final squeeze that straight-bar pushdowns prevent. These two heads are most visible from behind and make the arm look bigger in shirts.',
    cues:['Elbows pinned to sides — forearms are the only moving part','Flare the rope ends outward at lockout for peak contraction','Control the return — do not let the rope pull elbows forward','Slight forward lean is fine; do not bend at the hips']},
  'tricep-overhead-extension':{
    name:'Tricep Overhead Extension', videoId:'nRiJVZDpdL0',
    muscleGroups:{primary:['tricep_long_head']},
    emphasis:['triceps','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'The long head of the tricep is 55% of total tricep mass and is ONLY fully activated in overhead position. Most programs do only pushdowns, leaving the biggest head undertrained. Without overhead extension, half your tricep potential is untapped.',
    cues:['Hold one dumbbell with both hands overhead (diamond grip)','Elbows point to the ceiling — do not flare','Lower behind the head until forearms are parallel','Press back up through the elbows — do not swing']},
  'skull-crusher':{
    name:'Skull Crusher', videoId:null,
    muscleGroups:{primary:['tricep_long_head','tricep_medial']},
    emphasis:['triceps','upper_body'], equipment:'barbell', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'The lying EZ-bar variation loads the long head in a lengthened position (elbow overhead relative to torso) while allowing heavier loads than dumbbell overhead extensions. Gold standard for tricep mass work.',
    cues:['Lie on bench, bar above lower chest to start','Lower to forehead or behind head by bending elbows only','Keep upper arms vertical — elbows do not drift toward feet','Press back up; do not let the bar drift into a press']},
  'cable-overhead-extension':{
    name:'Cable Overhead Extension', videoId:null,
    muscleGroups:{primary:['tricep_long_head']},
    emphasis:['triceps','upper_body'], equipment:'cable', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Constant cable tension through the full overhead range — the peak stretch position has full load, unlike dumbbells. Best performed facing away from the cable stack.',
    cues:['Face away from cable, rope at head height','Lean forward slightly; elbows beside the head','Extend to full lockout overhead','Lower slowly until maximum stretch — do not rush the negative']},
  'db-kickback':{
    name:'DB Kickback', videoId:null,
    muscleGroups:{primary:['tricep_lateral','tricep_medial']},
    emphasis:['triceps','upper_body'], equipment:'dumbbell', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'Fully extends the elbow against gravity at a position where the tricep is maximally shortened. Better than cable for lateral head contraction quality.',
    cues:['Hinge forward, upper arm parallel to floor throughout','Only the forearm moves — hinge at the elbow','Extend until arm is fully straight — hold one count','Lower slowly; resist the temptation to swing']},
  'straight-bar-pushdown':{
    name:'Straight-Bar Pushdown', videoId:null,
    muscleGroups:{primary:['tricep_lateral','tricep_medial']},
    emphasis:['triceps','push','upper_body'], equipment:'cable', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'The fixed straight bar keeps the forearms pronated and lets a lifter push heavier than the rope, driving the lateral and medial heads with more absolute load. The heavy-loading complement to the rope pushdown for tricep thickness.',
    cues:['Straight or slightly-bent bar at upper-chest height','Elbows pinned to the sides — only the forearms move','Extend to a full lockout and squeeze the triceps','Control the return; do not let the elbows drift up']},
  'bench-dip':{
    name:'Bench Dip', videoId:null,
    muscleGroups:{primary:['tricep_lateral','tricep_medial'],secondary:['anterior_delt']},
    emphasis:['triceps','push','upper_body'], equipment:'bodyweight', tier:'home', category:'isolation', oneRmFactor:null,
    why:'A bodyweight triceps builder needing only a bench, chair, or step — the vertical descent loads all three heads and progresses easily by elevating the feet or setting a plate on the lap. The go-to triceps overload with no gym access.',
    cues:['Hands on the bench edge behind you, legs out front','Lower by bending the elbows straight back — keep them tucked','Descend until the upper arms are parallel to the floor','Press back to a full lockout; keep the hips close to the bench']},
  'tricep-dip-machine':{
    name:'Tricep Dip Machine', videoId:null,
    muscleGroups:{primary:['tricep_lateral','tricep_medial','tricep_long_head']},
    emphasis:['triceps','push','upper_body'], equipment:'machine', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'The seated dip machine loads all three triceps heads through a full pressing range with a fixed, back-supported path — letting a lifter push close to failure safely and progress in small increments. A joint-friendly heavy triceps option late in a session.',
    cues:['Sit tall, back against the pad, hands on the handles','Press down to a full elbow lockout — drive through the triceps','Squeeze at the bottom for one count','Return under control to a 90° elbow; do not let the stack slam']},
  'diamond-push-up':{
    name:'Diamond Push-Up', videoId:null,
    muscleGroups:{primary:['tricep_lateral','tricep_medial'],secondary:['pec_major_sternal','anterior_delt']},
    emphasis:['triceps','push','upper_body'], equipment:'bodyweight', tier:'home', category:'isolation', oneRmFactor:null,
    why:'The narrow diamond hand position shifts a standard push-up’s load heavily onto the triceps — producing among the highest triceps EMG of any bodyweight movement. Zero-equipment triceps mass work; elevate the feet to progress.',
    cues:['Hands together under the chest, index fingers and thumbs forming a diamond','Body rigid in a straight line — no hip sag','Lower until the chest nearly touches the hands, elbows tucked','Press to full lockout; elevate the feet to add difficulty']},
  'jm-press':{
    name:'JM Press', videoId:null,
    muscleGroups:{primary:['tricep_long_head','tricep_medial'],secondary:['anterior_delt']},
    emphasis:['triceps','push','upper_body'], equipment:'barbell', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'A hybrid of the close-grip press and the skull crusher — the bar lowers toward the upper neck with the elbows forward, loading the triceps at a long muscle length while still allowing heavy barbell loading. A powerlifting staple for lockout strength and triceps mass.',
    cues:['Lie on a bench, close (shoulder-width) grip','Lower the bar toward the upper chest/neck with elbows drifting forward','Stop at the bottom shelf position, then press back up','Keep it strict — heavier than a skull crusher, lighter than a close-grip press']},
  'single-arm-cable-kickback':{
    name:'Single-Arm Cable Kickback', videoId:null,
    muscleGroups:{primary:['tricep_lateral','tricep_medial']},
    emphasis:['triceps','upper_body'], equipment:'cable', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'The cable holds tension at the fully-shortened lockout where a dumbbell kickback goes weightless — giving a hard peak contraction on the lateral and medial heads, one arm at a time to correct side-to-side deficits.',
    cues:['Low pulley, hinge forward, upper arm parallel to the floor and fixed','Extend only the forearm to a full lockout — the elbow does not move','Squeeze hard at full extension against the constant cable tension','Control the return; keep the torso still, do not swing']},

  // ── QUADS ─────────────────────────────────────────────
  'barbell-back-squat':{
    name:'Barbell Back Squat', videoId:null,
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus_lateralis','quad_vastus_medialis','quad_vastus'],secondary:['glute_max','hamstring','erector_spinae']},
    emphasis:['quads','glutes','lower_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'The highest total-muscle-mass exercise in existence — quads, hamstrings, glutes, erectors, core, and upper back all contribute. No other movement builds as much lower body mass in one movement.',
    cues:['Bar on upper traps (high bar) or lower traps (low bar)','Feet shoulder-width, toes 15–30° out','Brace hard — breath in and hold through the descent','Knees track over toes; do not cave']},
  'hack-squat':{
    name:'Hack Squat', videoId:'MKcAc4RoKME',
    muscleGroups:{primary:['quad_vastus_lateralis','quad_vastus_medialis','quad_vastus'],secondary:['glute_max']},
    emphasis:['quads','lower_body'], equipment:'machine', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'Machine allows heavier quad loading than most free-weight squats — all force goes into the quad, not balance. The vertical sled path eliminates spinal compression, making this the safest heavy quad compound for those with back issues.',
    cues:['Feet shoulder-width on platform, toes slightly out','Keep heels flat — do not rise on toes at the bottom','Descend to 90° or lower if mobility allows','Drive through heels to extend']},
  'leg-press':{
    name:'Leg Press', videoId:'IZxyjW7MPJQ',
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus_lateralis','quad_vastus'],secondary:['glute_max','hamstring']},
    emphasis:['quads','lower_body'], equipment:'machine', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'No spinal loading, no balance — all force into the quads. Useful for quad volume when the lower back is fatigued. High-and-wide foot placement biases glutes/hamstrings; low-and-narrow biases quads.',
    cues:['Do not lock out the knees at the top — maintain tension','Lower until thighs are 90° or below','Feet centred on platform for balanced quad loading','Back flat against pad; do not round the lower back at the bottom']},
  'leg-extension':{
    name:'Leg Extension', videoId:'YyvSfVjQeL0',
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus_medialis','quad_vastus']},
    emphasis:['quads','lower_body'], equipment:'machine', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'The only isolation exercise for the quadriceps. The rectus femoris (bi-articular quad head) is placed under stretch here that compound movements cannot achieve. Essential for complete quad development.',
    cues:['Adjust pad to sit just above ankle — not on the foot','Slow to full extension; do not kick','Hold at the top for one second — peak quad contraction','Lower slowly — the eccentric matters as much as the lift']},
  'sissy-squat':{
    name:'Sissy Squat', videoId:null,
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus_lateralis','quad_vastus_medialis','quad_vastus']},
    emphasis:['quads','lower_body'], equipment:'bodyweight', tier:'home', category:'isolation', oneRmFactor:null,
    why:'The bodyweight answer to the leg extension — knees travel far forward while the hips stay extended, isolating the quads (especially the rectus femoris) under a deep stretch with zero equipment. Ideal quad finisher requiring nothing but bodyweight.',
    cues:['Hold a support for balance; rise onto the balls of the feet','Drive knees forward and lean the torso back in one line','Lower until you feel a deep quad stretch — hips stay open','Squeeze the quads to return; add a plate hugged to the chest to progress']},
  'reverse-nordic':{
    name:'Reverse Nordic', videoId:null,
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus_lateralis','quad_vastus_medialis','quad_vastus']},
    emphasis:['quads','lower_body'], equipment:'bodyweight', tier:'home', category:'isolation', oneRmFactor:null,
    why:'A kneeling eccentric quad isolation that loads the rectus femoris under a long stretch — the exact lengthened-position stimulus the leg extension cannot reach. Builds quads and knee resilience with zero equipment.',
    cues:['Kneel tall, hips fully extended, core braced','Lean the whole body back in a straight line from knees to head','Lower as far as quad control allows — no hip bend','Pull back up with the quads; hold a wall or band to assist if needed']},
  'bodyweight-squat':{
    name:'Bodyweight Squat', videoId:null,
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus_medialis','quad_vastus'],secondary:['glute_max']},
    emphasis:['quads','lower_body'], equipment:'bodyweight', tier:'home', category:'compound', oneRmFactor:null,
    why:'The zero-equipment squat pattern — full knee and hip flexion trains the quads through a complete range of motion. The foundational lower-body compound when no external load is available; add tempo, pauses, or a loaded backpack to progress.',
    cues:['Feet shoulder-width, toes slightly out','Sit hips back and down — knees track over toes','Drive through the whole foot to stand','Chest tall throughout — brace the core before descending']},
  'goblet-squat':{
    name:'Goblet Squat', videoId:'MeIiIdhvXT4',
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus_medialis','quad_vastus'],secondary:['glute_max','core']},
    emphasis:['quads','lower_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'The counterbalance weight allows an upright torso and deep knee bend that many lifters cannot achieve in a barbell squat. Best learning tool for squat mechanics and an excellent quad compound in any setting.',
    cues:['Hold DB or KB at chest height — elbows between knees at bottom','Push knees out over toes','Chest tall throughout — do not collapse forward','Drive up through the heels']},
  'bulgarian-split-squat':{
    name:'Bulgarian Split Squat', videoId:'2C-uNgKwPLE',
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus_lateralis','quad_vastus'],secondary:['glute_max','hamstring']},
    emphasis:['quads','glutes','lower_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'Rear foot elevation increases hip flexor stretch and hip flexion depth — a training stimulus unavailable in bilateral squatting. Highest correlation to athletic performance (sprint speed, jump height) among all unilateral leg movements.',
    cues:['Front foot far enough forward that shin stays vertical','Lower straight down — do not lean forward','Drive through the heel of the front foot','Rear leg is a kickstand only — it should not push']},
  'db-lunge':{
    name:'DB Lunge', videoId:null,
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus'],secondary:['glute_max','hamstring','core']},
    emphasis:['quads','glutes','lower_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'Walking lunges produce the highest glute activation of any lunge variation due to the hip extension into the step. The bilateral instability challenge builds proprioception and ankle stability more than any stationary squat.',
    cues:['Step forward; lower until back knee is one inch from floor','Keep torso upright — do not lean forward','Drive through front heel to step through','Keep dumbbells at sides — do not let them swing']},
  'step-up':{
    name:'Step-Up', videoId:null,
    muscleGroups:{primary:['quad_rectus_femoris','glute_max','quad_vastus'],secondary:['hamstring']},
    emphasis:['quads','glutes','lower_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'The most sport-specific lower body exercise — replicates stair climbing, hill sprinting, and any real-world stepping movement. Single-leg loading makes it useful for diagnosing bilateral deficits.',
    cues:['Box height: upper thigh parallel at 90° when foot is on box','Drive through the heel of the elevated foot','Do not push off the back foot — it should barely touch','Lower slowly — the step down is just as important as the step up']},
  'front-squat':{
    name:'Front Squat', videoId:null,
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus_lateralis','quad_vastus_medialis','quad_vastus'],secondary:['glute_max','erector_spinae','upper_trap']},
    emphasis:['quads','lower_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'The front-rack position forces an upright torso, shifting load off the hips and directly onto the quads while demanding heavy upper-back and core bracing to stay tall. The most quad-dominant barbell squat, and easier on the lower back than a back squat.',
    cues:['Bar in the front rack: elbows high, resting on the front delts','Brace hard; descend straight down, knees tracking over the toes','Keep the torso as vertical as possible — elbows up throughout','Drive through the whole foot to stand; do not let the chest drop']},
  'db-split-squat':{
    name:'DB Split Squat', videoId:null,
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus_lateralis','quad_vastus'],secondary:['glute_max']},
    emphasis:['quads','lower_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'A stationary split stance (both feet on the floor) delivers most of the unilateral quad stimulus of a Bulgarian split squat with far less balance demand — an accessible single-leg builder for lifters not yet ready to elevate the rear foot.',
    cues:['Split stance, front shin vertical, torso upright','Lower straight down until the back knee nearly touches the floor','Drive through the front heel to stand','Keep the dumbbells hanging at the sides; complete all reps, then switch']},
  'reverse-lunge':{
    name:'Reverse Lunge', videoId:null,
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus'],secondary:['glute_max','hamstring']},
    emphasis:['quads','glutes','lower_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'Stepping backward keeps the front shin more vertical and the weight over the front heel — far easier on the knee than a forward lunge while still loading the quad and glute hard. The knee-friendly single-leg builder and a better fit for lifters with knee sensitivity.',
    cues:['Step one foot straight back, lowering the back knee toward the floor','Keep the front shin near vertical, torso tall','Drive through the front heel to return to standing','Dumbbells at the sides; complete all reps or alternate legs']},
  'smith-machine-squat':{
    name:'Smith Machine Squat', videoId:null,
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus_lateralis','quad_vastus_medialis','quad_vastus'],secondary:['glute_max']},
    emphasis:['quads','lower_body'], equipment:'machine', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'The fixed bar path lets a lifter place the feet slightly forward and sit straight down, biasing the quads with less balance and lower-back demand than a free squat — a safe way to overload the legs close to failure without a spotter.',
    cues:['Feet slightly forward of the bar, shoulder-width','Descend straight down to at least parallel, knees tracking the toes','Keep the whole foot planted; drive up through the mid-foot','Use the safety hooks to rack; do not lock out harshly at the top']},
  'landmine-squat':{
    name:'Landmine Squat', videoId:null,
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus_medialis','quad_vastus'],secondary:['glute_max','core']},
    emphasis:['quads','lower_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'The landmine arc supports the load in front and lets a lifter stay upright through a deep squat — the most back-friendly loaded squat pattern, ideal for those who cannot comfortably back- or front-squat but still want heavy quad work.',
    cues:['Hold the barbell end at the chest, feet shoulder-width','Sit straight down, letting the arc guide the bar','Keep the chest tall and the torso upright throughout','Drive through the heels to stand; the bar path is an arc, not vertical']},

  // ── HAMSTRINGS ────────────────────────────────────────
  'romanian-deadlift':{
    name:'Romanian Deadlift', videoId:'JCXUYuzwNrM',
    muscleGroups:{primary:['hamstring','glute_max'],secondary:['erector_spinae','adductor']},
    emphasis:['hamstrings','glutes','lower_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'Trains the hamstring in its most important function: hip extension under eccentric load. The stretch position at the bottom produces the highest mechanotransduction signal of any hamstring exercise. Fundamental for any strength program.',
    cues:['Hip hinge, not a squat — push hips back','Bar stays in contact with legs throughout','Feel the hamstring stretch; stop before lower back rounds','Drive hips forward to return — squeeze glutes at top']},
  'bodyweight-single-leg-rdl':{
    name:'Single-Leg Romanian Deadlift', videoId:null,
    muscleGroups:{primary:['hamstring','glute_max'],secondary:['erector_spinae']},
    emphasis:['hamstrings','glutes','lower_body'], equipment:'bodyweight', tier:'home', category:'compound', oneRmFactor:null,
    why:'The zero-equipment hip-hinge compound — balancing on one leg increases hamstring and glute demand to compensate for the lack of external load. Trains the same hip-extension pattern as the barbell RDL with no equipment required.',
    cues:['Stand tall, soft bend in the standing knee','Hinge forward while the free leg extends straight back','Keep hips square — do not let them rotate open','Squeeze the glute and hamstring to return to standing; hold a wall for balance if needed']},
  'lying-leg-curl':{
    name:'Lying Leg Curl', videoId:'ELOCsoDSmrg',
    muscleGroups:{primary:['hamstring_bicep_femoris']},
    emphasis:['hamstrings','lower_body'], equipment:'machine', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Knee flexion trains the short head of bicep femoris — the only head that cannot be reached with any hip hinge movement. Both hamstring functions (knee flexion AND hip extension) must be trained for complete development.',
    cues:['Pad just above the heel, not on the Achilles','Curl all the way up to maximum knee flexion','Do not let the hips lift off the pad','Lower slowly — do not let the weight slam']},
  'seated-leg-curl':{
    name:'Seated Leg Curl', videoId:'YyvSfVjQeL0',
    muscleGroups:{primary:['hamstring_bicep_femoris','hamstring_semimembranous']},
    emphasis:['hamstrings','lower_body'], equipment:'machine', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'The seated position places hamstrings under stretch at both hip AND knee simultaneously — producing greater EMG activity than lying leg curl. A hamstring under hip-flexion tension is longer, increasing the hypertrophy stimulus.',
    cues:['Sit tall; thigh pad positioned just above the knee','Curl all the way to maximum knee flexion','Squeeze at peak — hold one count','Slow eccentric — resist the return all the way']},
  'nordic-curl':{
    name:'Nordic Curl', videoId:null,
    muscleGroups:{primary:['hamstring_biceps_femoris','hamstring_semimembranosus','hamstring_semitendinosus']},
    emphasis:['hamstrings','lower_body'], equipment:'bodyweight', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'Reduces hamstring strain injury risk by 50–70% per multiple RCTs. The eccentric-only loading at long muscle lengths is unique and irreplaceable. The single highest return-on-investment exercise in sports medicine.',
    cues:['Anchor feet under heavy object or have partner hold','Lower as slowly as possible using hamstrings — catch yourself with hands','Goal is to resist as long as possible on the way down','Beginner: use hands to help push up; advanced: pull back up with hamstrings']},
  'slider-leg-curl':{
    name:'Slider Leg Curl', videoId:null,
    muscleGroups:{primary:['hamstring_biceps_femoris','hamstring_semimembranosus','hamstring_semitendinosus']},
    emphasis:['hamstrings','lower_body'], equipment:'bodyweight', tier:'home', category:'isolation', oneRmFactor:null,
    why:'Replicates the machine leg curl with only a towel or furniture slider. Lying glute-bridge position keeps the hips extended while the knees flex, loading the hamstrings concentrically and eccentrically — a true knee-flexion isolation when no machine exists.',
    cues:['Lie supine, heels on sliders/towels, hips lifted to a bridge','Keep hips up throughout — do not let them sag','Extend legs out under control, then curl heels back to the glutes','Both legs together to start; single-leg to progress']},
  'good-morning':{
    name:'Good Morning', videoId:null,
    muscleGroups:{primary:['hamstring','erector_spinae','glute_max']},
    emphasis:['hamstrings','lower_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'Simultaneously trains hamstring and erector at long muscle lengths under heavy load — rare among exercises. The erector strengthening component is the primary benefit for anyone prone to lower back fatigue in the big lifts.',
    cues:['Bar on upper back, feet shoulder-width','Hip hinge: push hips back, not down','Keep knees soft (not locked out)','Rise by driving hips forward — same pattern as RDL']},
  'db-rdl':{
    name:'DB RDL', videoId:null,
    muscleGroups:{primary:['hamstring','glute_max'],secondary:['erector_spinae']},
    emphasis:['hamstrings','glutes','lower_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'Identical hip hinge to barbell RDL but accessible with just a pair of dumbbells. The dumbbell version allows a slightly more natural arc and is easier to set up without a squat rack.',
    cues:['Dumbbells hang at thigh level — slide them down the legs','Hip hinge back; feel the hamstring stretch at the bottom','Flat back throughout — brace the core hard','Drive hips forward to return; squeeze glutes at the top']},
  'single-leg-db-rdl':{
    name:'Single-Leg DB RDL', videoId:null,
    muscleGroups:{primary:['hamstring','glute_max'],secondary:['erector_spinae']},
    emphasis:['hamstrings','glutes','lower_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'Loading the single-leg hip hinge with a dumbbell doubles the demand on one hamstring and glute while exposing left-right imbalances the barbell RDL hides. The balance challenge also builds ankle and hip stability that carries into every bilateral lift.',
    cues:['Dumbbell in the opposite hand to the working leg, soft standing knee','Hinge forward as the free leg extends straight back — hips square','Feel the hamstring stretch; keep the back flat, do not round','Drive the hip forward to stand and squeeze the glute; finish all reps, then switch']},
  'stiff-leg-deadlift':{
    name:'Stiff-Leg Deadlift', videoId:null,
    muscleGroups:{primary:['hamstring','glute_max'],secondary:['erector_spinae']},
    emphasis:['hamstrings','glutes','lower_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'Lifting from the floor with near-locked knees keeps the hamstrings under a long, loaded stretch through the entire range — a heavier, larger-ROM cousin of the RDL that maximises the stretch-mediated hypertrophy signal on the hamstrings and glutes.',
    cues:['Bar on the floor, knees soft but nearly straight and fixed','Hinge to grip the bar; keep the back flat, chest up','Drive the hips forward to stand — the bar rides up the legs','Lower with control, pushing the hips back; stop if the back rounds']},
  'glute-ham-raise':{
    name:'Glute-Ham Raise', videoId:null,
    muscleGroups:{primary:['hamstring_biceps_femoris','hamstring_semimembranosus','hamstring_semitendinosus'],secondary:['glute_max','erector_spinae']},
    emphasis:['hamstrings','glutes','lower_body'], equipment:'machine', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'The GHD trains both hamstring functions at once — knee flexion and hip extension — under a bodyweight eccentric that builds hamstring strength and injury resilience second only to the Nordic curl. A premier posterior-chain accessory where a GHD bench is available.',
    cues:['Feet anchored on the GHD, thighs on the pad','Lower the torso under control by extending at the knees','At full stretch, curl back up by driving the heels into the platform','Keep the hips extended throughout — do not turn it into a hinge']},

  // ── GLUTES ────────────────────────────────────────────
  'hip-thrust':{
    name:'Hip Thrust', videoId:'SEdqd1n0cvg',
    muscleGroups:{primary:['glute_max']},
    emphasis:['glutes','lower_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'Greatest glute EMG activation of any exercise. The fully shortened position at peak (hip fully extended) is unique — squats and deadlifts never achieve full hip extension under load. Trains the glute in its most powerful position.',
    cues:['Upper back on bench, shoulder blades on edge','Drive through heels, not toes','Tuck chin to chest — do not hyperextend the neck','Squeeze glutes aggressively at top; do not hyperextend the lower back']},
  'barbell-hip-thrust':{
    name:'Barbell Hip Thrust', videoId:null,
    muscleGroups:{primary:['glute_max']},
    emphasis:['glutes','lower_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'Allows load progression far beyond dumbbell — advanced lifters can hip thrust 300+ lbs. For maximum glute development, the barbell is the only viable option once dumbbell loading becomes insufficient.',
    cues:['Use a barbell pad or folded mat for hip comfort','Bar sits in the hip crease throughout','Drive through the entire foot, not the heel only','Full lockout: core braced, glutes squeezed, do not arch the lower back']},
  'cable-kickback':{
    name:'Cable Kickback', videoId:null,
    muscleGroups:{primary:['glute_max'],secondary:['hamstring']},
    emphasis:['glutes','lower_body'], equipment:'cable', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Isolates glute max at the hip extension endpoint, adding peak-squeeze volume that compound movements cannot achieve. Best used as a finishing accessory after heavy hip thrusts and RDLs.',
    cues:['Ankle cuff attached; face the cable stack','Slight forward lean, hands on the stack for support','Kick straight back until hip is fully extended — no lateral rotation','Squeeze at peak; lower with resistance']},
  'abductor-machine':{
    name:'Abductor Machine', videoId:'GKumTNiuCLY',
    muscleGroups:{primary:['glute_medius','glute_minimus']},
    emphasis:['glutes','lower_body'], equipment:'machine', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Glute medius and minimus are lateral hip stabilisers — their weakness causes knee valgus, IT band syndrome, and hip drop during running. The most targeted way to build these muscles.',
    cues:['Sit upright — do not lean back to recruit hip flexors','Drive knees apart from the hip, not the knee','Full range: start with knees together, drive as wide as possible','Slow return — the eccentric builds as much as the drive']},
  'sumo-rdl':{
    name:'Sumo RDL', videoId:null,
    muscleGroups:{primary:['glute_max','glute_medius','adductor'],secondary:['hamstring']},
    emphasis:['glutes','lower_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'Wide stance shifts the hip extension pattern toward glutes and adductors rather than the hamstring-dominant conventional stance. Particularly responsive for lifters whose anatomy favours a wider hip hinge.',
    cues:['Feet 2× shoulder-width; toes point 45° outward','Push hips back — same hinge pattern as conventional RDL','Let bar travel in a straight vertical line','Drive knees out over toes as you stand']},
  'glute-bridge':{
    name:'Glute Bridge', videoId:null,
    muscleGroups:{primary:['glute_max']},
    emphasis:['glutes','lower_body'], equipment:'bodyweight', tier:'home', category:'isolation', oneRmFactor:null,
    why:'Identical mechanics to hip thrust but performed on the floor. Shorter ROM but identical glute squeeze at the top. The go-to glute exercise when no bench is available. Can be loaded with a plate across the hips.',
    cues:['Supine on floor, feet flat and close to hips','Drive through heels; lift hips until body is a plank','Squeeze glutes hard at top — hold two counts','Lower with control; do not drop hips to the floor between reps']},
  'single-leg-glute-bridge':{
    name:'Single-Leg Glute Bridge', videoId:null,
    muscleGroups:{primary:['glute_max'],secondary:['hamstring']},
    emphasis:['glutes','lower_body'], equipment:'bodyweight', tier:'home', category:'isolation', oneRmFactor:null,
    why:'Doubles the load on one glute using only bodyweight, exposing and correcting side-to-side imbalances the two-leg bridge hides. The go-to glute isolation when no bench or weight is available.',
    cues:['Supine, one foot flat, the other leg extended','Drive through the planted heel; keep hips level — no tilt','Squeeze the glute hard at the top for two counts','Lower with control; complete all reps, then switch sides']},
  'banded-hip-abduction':{
    name:'Banded Hip Abduction', videoId:null,
    muscleGroups:{primary:['glute_medius','glute_minimus']},
    emphasis:['glutes','lower_body'], equipment:'band', tier:'home', category:'isolation', oneRmFactor:null,
    why:'Targets the glute medius and minimus — the lateral hip stabilisers whose weakness drives knee valgus and hip drop. A mini-band replaces the abductor machine with near-identical isolation anywhere.',
    cues:['Loop a mini-band just above the knees','Standing or side-lying, drive the knee out against the band','Keep the pelvis still — move only at the hip','Slow return; never let the band snap the leg back']},
  'cable-pull-through':{
    name:'Cable Pull-Through', videoId:null,
    muscleGroups:{primary:['glute_max'],secondary:['hamstring','erector_spinae']},
    emphasis:['glutes','lower_body'], equipment:'cable', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'The cable line of pull loads the hip hinge horizontally, peaking exactly at full hip extension where the glutes contract hardest — teaching the hinge with constant tension and no spinal loading. An ideal glute-focused hinge for high volume without lower-back fatigue.',
    cues:['Face away from a low pulley, rope between the legs','Hinge back, letting the rope draw the hands between the thighs','Drive the hips forward to stand; squeeze the glutes at lockout','Do not turn it into a squat or a back extension — the motion is at the hip']},
  'curtsy-lunge':{
    name:'Curtsy Lunge', videoId:null,
    muscleGroups:{primary:['glute_max','glute_medius'],secondary:['quad_rectus_femoris','quad_vastus']},
    emphasis:['glutes','lower_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'Stepping the working leg behind and across the body places the glute medius under stretch and load — the frontal-plane hip work that forward and reverse lunges miss. Builds the lateral glute that shapes the hip and stabilises the knee.',
    cues:['Step one foot back and across behind the other, hips facing forward','Lower until the front thigh is near parallel; front knee tracks the toes','Drive through the front heel to return to standing','Keep the torso tall; control the crossover — do not let the knee cave in']},
  'db-sumo-squat':{
    name:'DB Sumo Squat', videoId:null,
    muscleGroups:{primary:['glute_max','adductor'],secondary:['quad_rectus_femoris','quad_vastus']},
    emphasis:['glutes','lower_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'The wide stance and turned-out toes shift the squat toward the glutes and inner-thigh adductors — a hip- and adductor-biased pattern that a narrow squat misses, loaded simply with a single dumbbell held between the legs.',
    cues:['Feet wider than shoulders, toes turned out ~30°','Hold one dumbbell between the legs, chest tall','Sit straight down, driving the knees out over the toes','Squeeze the glutes hard to stand; keep the torso upright']},
  'frog-pump':{
    name:'Frog Pump', videoId:null,
    muscleGroups:{primary:['glute_max']},
    emphasis:['glutes','lower_body'], equipment:'bodyweight', tier:'home', category:'isolation', oneRmFactor:null,
    why:'The soles-together, knees-out position pre-shortens the glutes so every rep peaks in deep hip extension with minimal quad or hamstring contribution — a high-rep glute burnout that isolates the glute max better than most bridges, no equipment needed.',
    cues:['Lie on your back, soles of the feet together, knees dropped wide','Drive the hips up by squeezing the glutes — heels stay together','Pause and squeeze hard at the top','Lower with control; keep the reps quick and continuous for the pump']},

  // ── CALVES ────────────────────────────────────────────
  'standing-calf-raise':{
    name:'Standing Calf Raise', videoId:'gwLzBJYoWlA',
    muscleGroups:{primary:['gastrocnemius','calf']},
    emphasis:['lower_body'], equipment:'machine', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'The gastrocnemius is bi-articular — it crosses both the ankle and knee. Straight-knee position fully recruits both heads. This is the primary exercise for calf mass.',
    cues:['Full stretch at the bottom: heel below platform level','Rise to maximum height on tiptoe','Pause one count at the top — no bouncing','Slow descent — 3-count lower']},
  'seated-calf-raise':{
    name:'Seated Calf Raise', videoId:'JbyjNymZsfQ',
    muscleGroups:{primary:['soleus','calf']},
    emphasis:['lower_body'], equipment:'machine', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Bent-knee position slackens the gastrocnemius, isolating the soleus underneath. The soleus is slow-twitch dominant — it responds best to high reps (15–25). A thick soleus widens the calf visually from all angles.',
    cues:['Pad just above the knee, not on the kneecap','Full stretch at the bottom','Rise to maximum height; pause one count','High reps are more effective here than heavy weight']},
  'leg-press-calf-raise':{
    name:'Leg Press Calf Raise', videoId:null,
    muscleGroups:{primary:['gastrocnemius','calf']},
    emphasis:['lower_body'], equipment:'machine', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Allows very heavy plantarflexion loading with no spinal compression. Fixed platform provides consistent ROM. Useful when the standing calf raise machine is occupied.',
    cues:['Only toes and ball of foot on the platform — heels hang off','Press to full plantarflexion (tiptoe position)','Lower until heels are below the platform level','High reps, slow tempo — calves are built with volume']},
  'single-leg-calf-raise':{
    name:'Single-Leg Calf Raise', videoId:null,
    muscleGroups:{primary:['gastrocnemius','calf']},
    emphasis:['lower_body'], equipment:'bodyweight', tier:'home', category:'isolation', oneRmFactor:null,
    why:'Doubles the eccentric load versus bilateral — providing 2× the resistance with bodyweight alone. Progressed by adding a loaded backpack, holding a dumbbell, or increasing tempo.',
    cues:['Stand on one foot on a step edge — heel hanging off','Lower to full stretch position','Rise to max height; single-leg focus prevents compensation','If too easy, add load; if too hard, hold a wall lightly']},
  'db-standing-calf-raise':{
    name:'DB Standing Calf Raise', videoId:null,
    muscleGroups:{primary:['gastrocnemius','calf']},
    emphasis:['lower_body'], equipment:'dumbbell', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'Brings external load to the straight-knee calf raise without a machine — a dumbbell in each hand plus a step edge fully recruits both gastrocnemius heads. A simple free-weight answer to the standing calf machine.',
    cues:['Stand tall on a step edge, balls of feet on, heels hanging','Hold a dumbbell in each hand, arms relaxed at sides','Full stretch at the bottom, then rise to maximum tiptoe height','Pause one count at the top; 3-count lower — no bouncing']},
  'smith-machine-calf-raise':{
    name:'Smith Machine Calf Raise', videoId:null,
    muscleGroups:{primary:['gastrocnemius','calf']},
    emphasis:['lower_body'], equipment:'machine', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'The fixed Smith bar lets a lifter load standing calf raises heavily and safely with just a block under the toes — a straight-knee plantarflexion that fully recruits both gastrocnemius heads when a dedicated calf machine is unavailable.',
    cues:['Balls of the feet on a block or plate, bar across the upper traps','Full stretch at the bottom — heels drop below the block','Rise to maximum height on the toes; pause one count','Slow 3-count descent — build calves with controlled volume']},

  // ── CORE ──────────────────────────────────────────────
  'dead-bug':{
    name:'Dead Bug', videoId:null,
    muscleGroups:{primary:['transverse_abdominis','rectus_abdominis'],secondary:['psoas','erector_spinae']},
    emphasis:['core','full_body'], equipment:'bodyweight', tier:'home', category:'core', oneRmFactor:null,
    why:'McGill-approved anti-extension movement. Forces the core to resist spinal extension while contralateral limbs move — exactly what the core does during every compound lift. Zero spinal shear. Safest core exercise for any lower back history.',
    cues:['Press lower back FLAT into floor throughout — this is the whole exercise','Move opposite arm and leg simultaneously','Breathe out as you lower the limbs','If the back lifts, the set is over']},
  'plank':{
    name:'Plank', videoId:'pSHjTRCQxIw', unit:'sec', secs:60,
    muscleGroups:{primary:['transverse_abdominis','rectus_abdominis'],secondary:['erector_spinae','glute_max']},
    emphasis:['core'], equipment:'bodyweight', tier:'home', category:'core', oneRmFactor:null,
    why:'Anti-extension core training — builds the ability to resist spinal extension under load, exactly the demand during heavy squats and deadlifts.',
    cues:['Forearms on floor, elbows under shoulders','Body in a straight line from head to heels','Squeeze glutes and abs simultaneously','Breathe normally — if you cannot breathe, reduce the duration']},
  'side-plank':{
    name:'Side Plank', videoId:null, unit:'sec', secs:45,
    muscleGroups:{primary:['quadratus_lumborum','oblique_external','glute_medius']},
    emphasis:['core'], equipment:'bodyweight', tier:'home', category:'core', oneRmFactor:null,
    why:'McGill Big 3 staple — the only exercise that loads the lateral core (QL and obliques) without spinal compression. QL weakness is the most overlooked contributor to lower back pain.',
    cues:['Elbow directly under shoulder','Hips stacked — do not let the top hip rotate forward','Straight line from head through feet','Keep neck neutral — do not let the head drop']},
  'bird-dog':{
    name:'Bird Dog', videoId:null,
    muscleGroups:{primary:['erector_spinae','glute_max','transverse_abdominis']},
    emphasis:['core','full_body'], equipment:'bodyweight', tier:'home', category:'core', oneRmFactor:null,
    why:'McGill Big 3 exercise — simultaneously trains lumbar extensors, glute max, and contralateral rotator coordination without any spinal compression.',
    cues:['Start on all fours, spine neutral','Extend opposite arm and leg simultaneously','Do not let the hip rotate or the lower back arch','Pause at full extension for two counts; reset with control']},
  'ab-wheel-rollout':{
    name:'Ab Wheel Rollout', videoId:null,
    muscleGroups:{primary:['rectus_abdominis','transverse_abdominis'],secondary:['lat_dorsi','hip_flexor']},
    emphasis:['core','upper_body'], equipment:'bodyweight', tier:'home', category:'core', oneRmFactor:null,
    why:'The highest rectus abdominis activation exercise that exists — significantly higher than crunches, planks, or leg raises. Start from the knees; progress to standing rollouts.',
    cues:['Start on knees; wheel directly under shoulders','Roll out keeping hips down — do not let the back arch','Roll to maximum range before your back starts to arch','Pull back in with lats AND abs — both are working']},
  'cable-crunch':{
    name:'Cable Crunch', videoId:null,
    muscleGroups:{primary:['rectus_abdominis']},
    emphasis:['core'], equipment:'cable', tier:'full_gym', category:'core', oneRmFactor:null,
    why:'The only weighted abs exercise with constant resistance through the full ROM. Allows progressive overload on the rectus abdominis — you can add load every week.',
    cues:['Kneel facing the cable, hands behind your neck (not pulling)','Crunch by flexing the spine — do not hip hinge','Round the upper back; bring sternum toward the pelvis','Slow return — the eccentric phase is 70% of the benefit']},
  'hanging-knee-raise':{
    name:'Hanging Knee Raise', videoId:null,
    muscleGroups:{primary:['rectus_abdominis','hip_flexor'],secondary:['transverse_abdominis']},
    emphasis:['core'], equipment:'bodyweight', tier:'hotel_gym', category:'core', oneRmFactor:null,
    why:'The hanging position also trains grip and shoulder girdle stability. Progressed from knee raise to straight-leg raise to full toes-to-bar. A pull-up bar is sufficient — no dedicated equipment needed.',
    cues:['Dead hang; do not swing','Draw knees to chest by curling the pelvis — not just lifting the legs','Lower with control — do not drop','Advanced: straighten legs for a dramatically harder version']},
  'reverse-crunch':{
    name:'Reverse Crunch', videoId:null,
    muscleGroups:{primary:['rectus_abdominis_lower'],secondary:['transverse_abdominis']},
    emphasis:['core'], equipment:'bodyweight', tier:'home', category:'core', oneRmFactor:null,
    why:'One of very few exercises that specifically targets the lower rectus abdominis fibres. The curling pelvis motion (posterior pelvic tilt) is the key mechanic that distinguishes it from basic leg raises.',
    cues:['Lie flat; curl the knees to the chest by tilting the pelvis — not just lifting the knees','Lower back should press into the floor throughout','Slow and controlled — not momentum-based','Progress by adding a pause at peak tilt']},
  'pallof-press':{
    name:'Pallof Press', videoId:null,
    muscleGroups:{primary:['transverse_abdominis','oblique_internal','oblique_external']},
    emphasis:['core'], equipment:'cable', tier:'full_gym', category:'core', oneRmFactor:null,
    why:'Anti-rotation core exercise — the cable pulls the body sideways and the core resists that rotation. Exactly the demand placed on the core in rotational sports and under asymmetric loads.',
    cues:['Cable at chest height; stand perpendicular to it','Press hands straight out from chest; resist the lateral pull','Keep hips square — the fight is between the cable and your core','Hold extended position for two counts; controlled throughout']},
  'russian-twist':{
    name:'Russian Twist', videoId:null,
    muscleGroups:{primary:['oblique_external','oblique_internal']},
    emphasis:['core'], equipment:'bodyweight', tier:'home', category:'core', oneRmFactor:null,
    why:'Trains the obliques through rotation — the pattern that generates punching power, throwing velocity, and athletic rotation. Progressed with a medicine ball, weight plate, or dumbbell.',
    cues:['Sit at 45° with feet elevated (harder) or on floor (easier)','Rotate from the torso, not just the arms','Touch the floor beside each hip each rep','Brace the core throughout — do not let the spine collapse']},
  'dragon-flag':{
    name:'Dragon Flag', videoId:null,
    muscleGroups:{primary:['rectus_abdominis'],secondary:['transverse_abdominis','hip_flexor']},
    emphasis:['core','full_body'], equipment:'bodyweight', tier:'hotel_gym', category:'core', oneRmFactor:null,
    why:'The hardest bodyweight anti-extension exercise — the whole body is held rigid as a lever while the abs resist gravity trying to pull the spine into extension. Popularised by Bruce Lee, it produces among the highest rectus abdominis demands possible with no equipment beyond something to hold.',
    cues:['Lie on a bench or floor; grip a solid post behind the head','Brace and lift the whole body toward vertical, weight on the upper back','Lower the straight, rigid body as one unit — no bend at the hips','Keep the lower back from arching; regress by bending the knees']},
  'hanging-leg-raise':{
    name:'Hanging Leg Raise', videoId:null,
    muscleGroups:{primary:['rectus_abdominis_lower','hip_flexor'],secondary:['transverse_abdominis']},
    emphasis:['core'], equipment:'bodyweight', tier:'hotel_gym', category:'core', oneRmFactor:null,
    why:'The straight-leg progression of the hanging knee raise — the longer lever dramatically increases the load on the lower rectus abdominis, while the dead hang trains grip and shoulder stability. The benchmark hanging ab movement on the way to toes-to-bar.',
    cues:['Dead hang from a bar, no swinging','Raise straight legs by curling the pelvis up — not just lifting the legs','Bring the legs to at least parallel; higher recruits more lower abs','Lower under control; keep the movement strict, not momentum-driven']},
  'weighted-decline-sit-up':{
    name:'Weighted Decline Sit-Up', videoId:null,
    muscleGroups:{primary:['rectus_abdominis'],secondary:['hip_flexor','oblique_external']},
    emphasis:['core'], equipment:'dumbbell', tier:'hotel_gym', category:'core', oneRmFactor:null,
    why:'The decline angle lengthens the range of the sit-up and holding a plate or dumbbell adds progressive load — one of the few ways to train the full rectus abdominis with heavy, trackable resistance rather than endless bodyweight reps.',
    cues:['Anchor the feet on a decline bench, hold a plate on the chest','Curl up by flexing the spine — round the back off the bench segment by segment','Do not yank with the hip flexors; the abs initiate','Lower under control through the full range; add load as it gets easy']},
  'cable-woodchopper':{
    name:'Cable Woodchopper', videoId:null,
    muscleGroups:{primary:['oblique_external','oblique_internal'],secondary:['transverse_abdominis']},
    emphasis:['core'], equipment:'cable', tier:'full_gym', category:'core', oneRmFactor:null,
    why:'A loaded rotational chop trains the obliques through the exact diagonal power pattern used in throwing, swinging, and rotating — with constant cable tension the whole way. Progressive resistance for rotational strength that the bodyweight Russian twist cannot match.',
    cues:['Set the pulley high; grip the handle with both hands','Rotate down and across the body to the opposite hip — pivot the back foot','Drive the motion from the trunk, not the arms','Control the return; keep the arms fairly straight throughout']},
  'machine-ab-crunch':{
    name:'Machine Ab Crunch', videoId:null,
    muscleGroups:{primary:['rectus_abdominis'],secondary:['oblique_external']},
    emphasis:['core'], equipment:'machine', tier:'full_gym', category:'core', oneRmFactor:null,
    why:'The ab crunch machine adds selectable, progressive resistance to spinal flexion through a guided path — letting a lifter overload the rectus abdominis in small increments exactly like any other muscle, safely and to failure. Weighted, trackable ab training in a fixed groove.',
    cues:['Set the seat and pad so the resistance sits across the chest/shoulders','Crunch by rounding the spine — bring the sternum toward the pelvis','Do not hinge at the hips; the movement is spinal flexion','Control the eccentric all the way back — that phase drives most of the growth']},
  'hollow-body-hold':{
    name:'Hollow Body Hold', videoId:null, unit:'sec', secs:30,
    muscleGroups:{primary:['rectus_abdominis','transverse_abdominis'],secondary:['hip_flexor']},
    emphasis:['core'], equipment:'bodyweight', tier:'home', category:'core', oneRmFactor:null,
    why:'The gymnastics foundation for anti-extension strength — pressing the lower back flat while holding the arms and legs off the ground trains the abs to hold a braced, neutral spine under a long lever. Directly transfers to the midline stability every heavy lift demands.',
    cues:['Lie supine; press the lower back FLAT into the floor — this never releases','Lift the shoulders and legs off the floor into a shallow banana shape','Arms overhead by the ears; legs straight — the lower the harder','If the back lifts off the floor, raise the arms/legs higher and rebuild']},
  'standing-cable-oblique-crunch':{
    name:'Standing Cable Oblique Crunch', videoId:null,
    muscleGroups:{primary:['oblique_external','oblique_internal'],secondary:['quadratus_lumborum']},
    emphasis:['core'], equipment:'cable', tier:'full_gym', category:'core', oneRmFactor:null,
    why:'A loaded lateral-flexion crunch that trains the obliques and QL through the side-bending pattern with progressive cable resistance — the frontal-plane counterpart to the cable crunch. Builds the lateral core that stabilises the spine under uneven loads like suitcase carries.',
    cues:['Stand side-on to a high pulley, handle in the near hand','Crunch the torso down toward the working-side hip — bend at the waist','Keep the hips still; the motion is pure lateral flexion','Resist the cable back up under control; finish all reps, then switch sides']},
  'landmine-rotation':{
    name:'Landmine Rotation', videoId:null,
    muscleGroups:{primary:['oblique_external','oblique_internal'],secondary:['transverse_abdominis','anterior_delt']},
    emphasis:['core'], equipment:'barbell', tier:'full_gym', category:'core', oneRmFactor:null,
    why:'Sweeping a landmine bar in an arc from hip to hip trains rotation and anti-rotation together under a load that scales indefinitely — building trunk rotational power through a long, controlled range that a barbell landmine makes easy to progress.',
    cues:['Hold the barbell end at full arm extension in front of the chest','Rotate the bar in an arc down to one hip, pivoting the feet','Drive the rotation from the trunk, arms fairly straight','Control the arc across to the other hip — do not let it free-fall']},
  'toes-to-bar':{
    name:'Toes-to-Bar', videoId:null,
    muscleGroups:{primary:['rectus_abdominis_lower','hip_flexor'],secondary:['lat_dorsi','transverse_abdominis']},
    emphasis:['core'], equipment:'bodyweight', tier:'hotel_gym', category:'core', oneRmFactor:null,
    why:'The full-range endpoint of hanging ab work — bringing the toes all the way to the bar demands maximal lower-ab and hip-flexor strength plus lat engagement to control the swing. The benchmark advanced hanging core movement.',
    cues:['Dead hang; engage the lats to stop any swing','Curl the pelvis and drive the straight legs all the way up to the bar','Control the descent — no kipping or momentum','Regress to knee raises or leg raises until the strength is there']},
  'bicycle-crunch':{
    name:'Bicycle Crunch', videoId:null,
    muscleGroups:{primary:['rectus_abdominis','oblique_external'],secondary:['oblique_internal']},
    emphasis:['core'], equipment:'bodyweight', tier:'home', category:'core', oneRmFactor:null,
    why:'Consistently one of the highest EMG-ranked ab exercises — the pedaling twist trains the rectus abdominis and obliques together through flexion plus rotation, with zero equipment. A staple for combined ab and oblique work anywhere.',
    cues:['Lie back, hands lightly behind the head, shoulders off the floor','Bring one elbow toward the opposite knee as that leg drives in','Extend the other leg straight without letting it touch down','Rotate from the torso, not the neck; move slowly and with control']},
  'v-up':{
    name:'V-Up', videoId:null,
    muscleGroups:{primary:['rectus_abdominis'],secondary:['hip_flexor']},
    emphasis:['core'], equipment:'bodyweight', tier:'home', category:'core', oneRmFactor:null,
    why:'Lifting the straight arms and legs to meet over the hips folds the body at the abs, contracting the full rectus abdominis top-and-bottom simultaneously. A no-equipment progression up from the crunch that trains the whole ab wall in one movement.',
    cues:['Lie flat, arms extended overhead, legs straight','Lift the arms and legs together to touch over the hips in a V','Keep both the arms and legs straight — hinge only at the hips','Lower under control without letting the feet or hands touch down']},
  'standing-cable-crunch':{
    name:'Standing Cable Crunch', videoId:null,
    muscleGroups:{primary:['rectus_abdominis'],secondary:['oblique_external']},
    emphasis:['core'], equipment:'cable', tier:'full_gym', category:'core', oneRmFactor:null,
    why:'A standing, weighted spinal-flexion crunch against a high cable — constant progressive resistance on the rectus abdominis without kneeling, convenient to superset between other standing lifts. Loads the abs like any other muscle for real overload.',
    cues:['Face away from a high pulley, rope held at the collarbones','Crunch down by rounding the spine — bring the ribs toward the pelvis','Keep the hips fixed; the motion is spinal flexion, not a hip hinge','Resist the cable back up slowly to a full stretch']},
  'copenhagen-plank':{
    name:'Copenhagen Plank', videoId:null, unit:'sec', secs:30,
    muscleGroups:{primary:['adductor','oblique_external'],secondary:['transverse_abdominis']},
    emphasis:['core'], equipment:'bodyweight', tier:'home', category:'core', oneRmFactor:null,
    why:'A side plank with the top leg on a bench that loads the adductors isometrically while the lateral core holds the hips level — building groin strength that dramatically lowers adductor-strain risk, alongside the obliques and QL.',
    cues:['Side plank position, elbow under the shoulder','Rest the top (upper) leg on a bench, bottom leg hanging or lifted','Lift the hips so the body is a straight line — squeeze the top inner thigh','Hold for time; regress by resting the bottom knee, progress by holding the bottom leg up']},
  'hanging-oblique-raise':{
    name:'Hanging Oblique Raise', videoId:null,
    muscleGroups:{primary:['oblique_external','oblique_internal'],secondary:['rectus_abdominis_lower','hip_flexor']},
    emphasis:['core'], equipment:'bodyweight', tier:'hotel_gym', category:'core', oneRmFactor:null,
    why:'Raising the knees to one side while hanging adds rotation and lateral flexion to the knee raise — loading the obliques through a long range under the same grip and shoulder-stability demand as other hanging ab work.',
    cues:['Dead hang from a bar, no swinging','Curl the knees up and toward one side, twisting at the waist','Squeeze the obliques at the top; control the return','Alternate sides evenly; keep the movement strict, not swung']},

  // ── CARDIO / CONDITIONING ─────────────────────────────
  'jumping-jacks':{
    name:'Jumping Jacks', videoId:null,
    muscleGroups:{primary:['full_body','glute_max'],secondary:['calf']},
    emphasis:['lower_body','full_body'], equipment:'bodyweight', tier:'home', category:'cardio', oneRmFactor:null,
    why:'Zero-equipment full-body cardio — elevates heart rate through continuous total-body movement when no machine is available.',
    cues:['Land softly, knees soft on impact','Full arm extension overhead each rep','Steady rhythm — this is Zone 2, not a sprint','20+ min continuous, or interval with High Knees']},
  'high-knees':{
    name:'High Knees', videoId:null,
    muscleGroups:{primary:['quad','glute_max','hamstring']},
    emphasis:['lower_body','full_body'], equipment:'bodyweight', tier:'home', category:'cardio', oneRmFactor:null,
    why:'Zero-equipment hip-flexor-driven cardio — the running-in-place pattern trains the same quad/glute/hamstring cycling action as treadmill or bike work with no equipment required.',
    cues:['Drive knees to hip height, quick cadence','Land on the balls of the feet','Pump the arms to maintain rhythm','Moderate, sustainable pace for Zone 2 duration']},
  'incline-treadmill':{
    name:'Incline Treadmill', videoId:null,
    muscleGroups:{primary:['glute_max','hamstring','calf']},
    emphasis:['lower_body','full_body'], equipment:'machine', tier:'full_gym', category:'cardio', oneRmFactor:null,
    why:'Zone 2 cardio at 10–15% incline elevates glute and hamstring activation dramatically versus flat walking. Low impact preserves recovery capacity while still stimulating aerobic adaptation.',
    cues:['Incline 10–15%, pace 3–3.5 mph for Zone 2','Do not hold the rails — swing the arms naturally','Heart rate 60–70% of max for fat oxidation zone','Duration 20–25 min: long enough for mitochondrial adaptation']},
  'stationary-bike':{
    name:'Stationary Bike', videoId:null,
    muscleGroups:{primary:['quad','glute_max','hamstring']},
    emphasis:['lower_body'], equipment:'machine', tier:'hotel_gym', category:'cardio', oneRmFactor:null,
    why:'Zero impact on joints — ideal when legs are sore from squats and lunges. Cycle ergometers produce excellent Zone 2 cardio data in sports science research. Widely available in most gyms.',
    cues:['Seat height: slight knee bend at bottom of pedal stroke','Moderate resistance — not easy spinning, not grinding','Heart rate 60–70% of max','20 minutes minimum for meaningful aerobic benefit']},
  'elliptical':{
    name:'Elliptical', videoId:null,
    muscleGroups:{primary:['quad','glute_max','hamstring']},
    emphasis:['lower_body','full_body'], equipment:'machine', tier:'hotel_gym', category:'cardio', oneRmFactor:null,
    why:'Mimics a running stride with zero impact. The arm poles add upper body engagement and increase total energy expenditure by 10–15% versus leg-only use.',
    cues:['Use the arm poles — they increase caloric burn and stabilise the trunk','Do not lean on the machine — maintain your own posture','Moderate resistance and pace — this is not a sprint','Zone 2 heart rate target: 60–70% of max']},
  'rower':{
    name:'Rower', videoId:null,
    muscleGroups:{primary:['lat_dorsi','quad','glute_max'],secondary:['bicep','hamstring','erector_spinae']},
    emphasis:['full_body','back','lower_body'], equipment:'machine', tier:'full_gym', category:'cardio', oneRmFactor:null,
    why:'Engages 86% of muscle mass — more than any other cardio machine. The sequencing of leg drive → hip hinge → arm pull mirrors the deadlift pattern, making it the most functional cardio for strength programs.',
    cues:['Drive order: LEGS → LEAN BACK → ARMS; reverse on recovery','Drive hard through the heels at the catch','Do not open the hips until the handle passes the knees','Damper setting 4–6 for aerobic work; higher is not better']},
  'kb-swing':{
    name:'KB Swing', videoId:'sSNGZzfMqE8',
    muscleGroups:{primary:['glute_max','hamstring'],secondary:['lat_dorsi','erector_spinae','core']},
    emphasis:['glutes','lower_body','full_body'], equipment:'dumbbell', tier:'hotel_gym', category:'cardio', oneRmFactor:null,
    why:'Trains hip extension power and cardiovascular conditioning simultaneously. At high rep counts the metabolic demand rivals sprinting. Posterior chain loading makes this cardio that also builds muscle.',
    cues:['Hip hinge — this is NOT a squat; hike the bell back between legs','Drive hips forward explosively; the bell floats to chest height by momentum','Squeeze glutes hard at the top of every rep','Re-hinge immediately on the way down — do not squat to receive the bell']},

  // ── Exercise Intake promotions (Status: Applied → code-merge step, per
  // .claude/loop-config.md self_generated_sources.exercise_intake_promotion) ──
  'band-external-rotation':{
    name:'Band External Rotation', videoId:null,
    muscleGroups:{primary:['external_rotator']},
    emphasis:['shoulders','upper_body'], equipment:'band', tier:'home', category:'isolation', oneRmFactor:null,
    why:'Trains external rotation at the shoulder joint itself rather than at the shoulder blade. Pull-aparts and face pulls retract the scapula; this rotates the humerus inside the socket, which is a different job and the one the bank currently has no dedicated entry for. Band tension stays constant through a range where a dumbbell gives almost nothing at the start, which is why rehab-side coaching keeps it at the front of shoulder work. The source is explicit that the upper arm must stay pinned at the side — a rolled towel under the arm is its recommended fix — because letting the elbow drift away converts the movement into something that is no longer pure external rotation.',
    cues:['Anchor the band at about elbow height and stand side-on, working arm on the outside','Elbow bent to 90 degrees and tucked at your side; a rolled towel under the arm keeps it there','Rotate the forearm away from your stomach — the upper arm does not move','Control the band all the way back; do not let it snap your hand to your belly']},
  'lateral-step-down':{
    name:'Lateral Step-Down', videoId:null,
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus_lateralis'],secondary:['glute_max','glute_medius']},
    emphasis:['quads','glutes','lower_body'], equipment:'bodyweight', tier:'home', category:'compound', oneRmFactor:null,
    why:'Stepping down off a low box loads the standing leg while the knee travels further into flexion than a step-up allows, and that extra travel is the point rather than a side effect. For Tandem this is a zero-equipment single-leg quad builder that doubles as knee-health work for runners and hikers, at a tier where the library currently has no eccentric-emphasis single-leg option at all.',
    cues:['Stand on a 6-7 inch step with all the weight through the working leg','Reach the free leg out to the side and tap the heel down - do not push off it','Let the working knee travel forward; that range is what you are training','Slow and controlled on the way down; hold a wall or rail if balance is the limiter']},
  'band-row':{
    name:'Band Row', videoId:null,
    muscleGroups:{primary:['lat_dorsi','rhomboid'],secondary:['bicep','posterior_delt']},
    emphasis:['back','pull','upper_body'], equipment:'band', tier:'home', category:'compound', oneRmFactor:null,
    why:'The first band compound in the bank and the only home-tier pull whose resistance can be dialed down. Table Inverted Row loads by body angle, which sets a hard floor a deconditioned or rehabbing lifter may not clear; a band starts near zero and scales by band choice and anchor distance. Horizontal pulling is also the least shoulder-demanding pull pattern, so it is the right entry point before any overhead work.',
    cues:['Anchor the band at chest height to a sturdy object or door','Sit or stand tall, arms extended, slight tension at the start','Start the pull with the shoulder blade, then let the elbow follow','Drive elbows back toward the hips, not flared wide','Control the return all the way out - keep tension the whole range']},
  'mcgill-curl-up':{
    name:'McGill Curl-Up', videoId:null, unit:'sec', secs:10,
    muscleGroups:{primary:['rectus_abdominis'],secondary:['oblique_external','transverse_abdominis']},
    emphasis:['core'], equipment:'bodyweight', tier:'home', category:'core', oneRmFactor:null,
    why:'The third McGill Big 3 movement, and the one the bank is missing. Trains the anterior core to hold a braced trunk while the hands stay under the small of the back to preserve its natural inward curve, so the abs work hard without the repeated spinal flexion a sit-up demands. Side Plank and Bird Dog both already name the McGill Big 3 in their own rationale; this completes the set.',
    cues:['Lie on your back, one knee bent with that foot flat, the other leg straight','Slide both hands palm-down under the small of your back and keep its natural arch - do not press the back flat','Brace the abs, then lift head and shoulders as one rigid unit only an inch or two; chin does not tuck, neck does not crane','Hold ten seconds breathing normally, lower with control, and add repetitions rather than a longer hold as it gets easier']},
};

// ═══════════════════════════════════════════════════════
// MOVEMENT_FAMILIES — canonical movement taxonomy over EXERCISE_BANK
//
// ── PROVENANCE (this is NOT a new invention) ───────────────────────────
// Exercise Science Schema v0.5 (Notion page 37bca37f935b81cb9478e4906ada58c9),
// Part 3 "Proposed Supabase Schema", Table 1 `exercises`, specifies VERBATIM:
//
//   • `movement_pattern` — horizontal_push | horizontal_pull | vertical_push |
//     vertical_pull | squat | hinge | carry | isolation
//   • `canonical_lift` — "which barbell lift this exercise maps to (e.g.
//     'Barbell Bench Press'). NULL for exercises with no barbell equivalent."
//
// Both fields were specified in v0.5 and NEVER POPULATED. EPIC-026's sub-muscle
// audit confirmed it: `movement_pattern` is 0/171 populated — "schema ahead of
// data" (docs/epic-026-submuscle-audit.md). This const populates that field in
// code, ahead of any migration. It invents no taxonomy.
//
// The five `canonicalLift` values used below are ONLY the ones v0.5's own
// load_coefficient table names, together with the exercises it maps to them:
//   Barbell Bench Press   ← Dumbbell Bench Press 0.76, Dumbbell Incline Press 0.70,
//                           Smith Machine Bench 0.95, Machine Chest Press 1.05
//   Barbell Squat         ← Leg Press 1.27, Goblet Squat 0.17, Hack Squat 0.95
//   Barbell Deadlift      ← Dumbbell RDL 0.55
//   Weighted Pull-up      ← Lat Pulldown 0.90
//   Barbell Overhead Press← Dumbbell Shoulder Press 0.80, Arnold Press 0.65
// Every other family carries `canonicalLift: null`. That is v0.5's own rule for
// accessory work, restated in its Part 5 Open Question 3: "Exercises with no
// canonical lift: Lateral raises, curls, pushdowns — no barbell 1RM to derive
// from. Recommendation: prescribe by RPE only." Where a barbell version exists
// in the bank but v0.5 names no canonical lift for it (rows, shrugs, hip
// thrusts, good mornings), null is the honest value — filling it in would be
// inventing a coefficient anchor the source does not sanction.
//
// ── HOW A FAMILY IS DECIDED ───────────────────────────────────────────
// A family = one canonical movement plus the variants that are expressions of
// THE SAME movement — i.e. `canonical_lift` semantics, generalised to the
// accessory work that has no canonical lift. Grouping is by joint action and
// movement pattern ONLY. It is explicitly NOT by co-occurrence in any user's
// training log: Z-Press and Arnold Press sit in `overhead-press` (vertical
// push) because that is what they are, regardless of which log they happen to
// appear next to.
//
// `pattern` holds a v0.5 enum value, or `null` where the v0.5 enum has no value
// that fits (see GAPS below). Null is deliberate — v0.5's 8-value enum contains
// no trunk/anti-movement value and no conditioning value, and inventing one
// would be exactly the fabrication CLAUDE.md forbids. v0.5 handles conditioning
// one level up instead, at Table 3 `day_type` ('conditioning'), not at
// movement_pattern.
//
// ── GAPS / INTERPRETATIONS, flagged rather than hidden ────────────────
// G1  core (24 slugs) and machine/calisthenic cardio (6 slugs) → pattern:null.
//     No v0.5 movement_pattern value covers anti-extension, anti-rotation,
//     spinal flexion, or steady-state conditioning. Needs a source ruling.
// G2  v0.5 has no `lunge` / unilateral value. Knee-dominant single-leg work
//     (`lunge` family) is filed under `squat`; hip-dominant single-leg work
//     (single-leg RDLs) under `hinge`. Interpretation, not a citation.
// G3  v0.5 has no `bridge` value. `hip-thrust` is filed under `hinge` (loaded
//     hip extension). Interpretation.
// G4  Incline presses sit in `bench-press` on the STRENGTH of v0.5's own
//     mapping (Dumbbell Incline Press → Barbell Bench Press, 0.70) — cited,
//     not assumed. `high-incline-barbell-press` (45–60°, bank tags it
//     anterior_delt co-primary) is the weakest member of that family.
// G5  `dips` → horizontal_push and `landmine-press` → vertical_push are both
//     contested classifications in the wider literature and unnamed by v0.5.
//     Each gets its own single-variant family so the pattern label is the only
//     thing at risk, never the grouping.
// G6  `upright-row` → vertical_pull follows the pattern of the bar path, but
//     the bank tags it lateral_delt + upper_trap, unlike the lat-dominant
//     vertical pulls. Flagged.
// G7  `close-grip-barbell-press` is in `bench-press` (it is a bench press)
//     although the bank tags tricep as its primary mover.
// G8  There is no conventional Barbell Deadlift slug in EXERCISE_BANK, so the
//     `Barbell Deadlift` canonical lift has no self-referential member here.
//
// ── STATUS: INERT DATA ────────────────────────────────────────────────
// Nothing reads this. It is not wired into getProgram, buildDynamicProgram,
// bank(), pick(), groupsMatch(), getExerciseSubstitutes, the trend view, or any
// UI. It ships as a layer, deliberately, so it cannot regress behaviour.
// Invariants are proven by `node scripts/movement-families-check.mjs`:
// every EXERCISE_BANK slug appears in exactly one family, and every declared
// variant slug exists in EXERCISE_BANK.
// ═══════════════════════════════════════════════════════
const MOVEMENT_FAMILIES = {

  // ── HORIZONTAL PUSH ──────────────────────────────────
  'bench-press':{ label:'Bench Press', pattern:'horizontal_push', canonicalLift:'Barbell Bench Press',
    variants:['flat-barbell-press','db-bench-press','incline-db-press','low-incline-barbell-press',
              'high-incline-barbell-press','decline-barbell-press','decline-db-press',
              'close-grip-barbell-press','machine-chest-press','alternating-db-bench-press',
              'alternating-incline-db-press','db-floor-press','cable-chest-press','squeeze-press',
              'smith-machine-bench-press']},
  'push-up':{ label:'Push-Up', pattern:'horizontal_push', canonicalLift:null,
    variants:['push-up']},
  'dip':{ label:'Dip', pattern:'horizontal_push', canonicalLift:null,   // G5
    variants:['dips']},
  'chest-fly':{ label:'Chest Fly', pattern:'isolation', canonicalLift:null,
    variants:['db-fly','incline-db-fly','band-chest-fly','pec-deck','high-to-low-cable-fly',
              'cable-low-to-high-fly']},

  // ── VERTICAL PUSH ────────────────────────────────────
  'overhead-press':{ label:'Overhead Press', pattern:'vertical_push', canonicalLift:'Barbell Overhead Press',
    variants:['barbell-ohp','db-shoulder-press','seated-db-shoulder-press','alternating-db-shoulder-press',
              'arnold-press','z-press','push-press','machine-shoulder-press','smith-machine-shoulder-press']},
  'landmine-press':{ label:'Landmine Press', pattern:'vertical_push', canonicalLift:null,   // G5
    variants:['landmine-press']},

  // ── SHOULDER / SCAPULAR ISOLATION ────────────────────
  'lateral-raise':{ label:'Lateral Raise', pattern:'isolation', canonicalLift:null,
    variants:['db-lateral-raise','cable-lateral-raise','single-arm-cable-lateral-raise',
              'lateral-raise-machine','band-lateral-raise']},
  'front-raise':{ label:'Front Raise', pattern:'isolation', canonicalLift:null,
    variants:['db-front-raise','cable-front-raise']},
  'rear-delt-fly':{ label:'Rear Delt Fly', pattern:'isolation', canonicalLift:null,
    variants:['rear-delt-fly','reverse-fly','cable-rear-delt-fly','reverse-pec-deck',
              'face-pull','band-pull-apart']},
  'prone-scapular-raise':{ label:'Prone Scapular Raise', pattern:'isolation', canonicalLift:null,
    variants:['prone-y-raise','prone-t-raise']},
  'shrug':{ label:'Shrug', pattern:'isolation', canonicalLift:null,
    variants:['shrug-barbell','db-shrug','band-shrug']},
  'upright-row':{ label:'Upright Row', pattern:'vertical_pull', canonicalLift:null,   // G6
    variants:['upright-row','cable-upright-row']},
  'external-rotation':{ label:'External Rotation', pattern:'isolation', canonicalLift:null,
    variants:['band-external-rotation']},

  // ── VERTICAL PULL ────────────────────────────────────
  'pull-up':{ label:'Pull-Up / Pulldown', pattern:'vertical_pull', canonicalLift:'Weighted Pull-up',
    variants:['pull-up','chin-up','assisted-pull-up','lat-pulldown','neutral-grip-lat-pulldown']},

  // ── HORIZONTAL PULL ──────────────────────────────────
  'row':{ label:'Row', pattern:'horizontal_pull', canonicalLift:null,
    variants:['barbell-row','pendlay-row','dumbbell-row','single-arm-db-row','kroc-row',
              'seated-cable-row','t-bar-row','chest-supported-row','chest-supported-db-row',
              'machine-high-row','table-inverted-row','band-row']},
  'straight-arm-pulldown':{ label:'Straight-Arm Pulldown', pattern:'isolation', canonicalLift:null,
    variants:['straight-arm-pulldown','band-straight-arm-pulldown']},
  'pullover':{ label:'Pullover', pattern:'isolation', canonicalLift:null,
    variants:['db-pullover']},

  // ── ELBOW FLEXION ────────────────────────────────────
  'biceps-curl':{ label:'Biceps Curl', pattern:'isolation', canonicalLift:null,
    variants:['barbell-curl','ez-bar-curl','db-curl','incline-db-curl','concentration-curl',
              'preacher-curl','spider-curl','cable-curl','bayesian-cable-curl','zottman-curl',
              'band-curl']},
  'hammer-curl':{ label:'Hammer / Reverse Curl', pattern:'isolation', canonicalLift:null,
    variants:['hammer-curl','cross-body-hammer-curl','cable-rope-hammer-curl','band-hammer-curl',
              'reverse-curl']},

  // ── ELBOW EXTENSION ──────────────────────────────────
  'tricep-pushdown':{ label:'Tricep Pushdown', pattern:'isolation', canonicalLift:null,
    variants:['tricep-rope-pushdown','straight-bar-pushdown']},
  'tricep-extension':{ label:'Tricep Extension', pattern:'isolation', canonicalLift:null,
    variants:['tricep-overhead-extension','cable-overhead-extension','skull-crusher']},
  'tricep-kickback':{ label:'Tricep Kickback', pattern:'isolation', canonicalLift:null,
    variants:['db-kickback','single-arm-cable-kickback']},
  'tricep-dip':{ label:'Tricep Dip', pattern:'isolation', canonicalLift:null,
    variants:['bench-dip','tricep-dip-machine']},
  'diamond-push-up':{ label:'Diamond Push-Up', pattern:'isolation', canonicalLift:null,
    variants:['diamond-push-up']},
  'jm-press':{ label:'JM Press', pattern:'isolation', canonicalLift:null,
    variants:['jm-press']},

  // ── SQUAT ────────────────────────────────────────────
  'squat':{ label:'Squat', pattern:'squat', canonicalLift:'Barbell Squat',
    variants:['barbell-back-squat','front-squat','smith-machine-squat','landmine-squat',
              'hack-squat','leg-press','goblet-squat','bodyweight-squat','db-sumo-squat']},
  'lunge':{ label:'Lunge / Split Squat', pattern:'squat', canonicalLift:null,   // G2
    variants:['bulgarian-split-squat','db-split-squat','db-lunge','reverse-lunge','curtsy-lunge',
              'step-up','lateral-step-down']},
  'leg-extension':{ label:'Leg Extension', pattern:'isolation', canonicalLift:null,
    variants:['leg-extension','sissy-squat','reverse-nordic']},

  // ── HINGE ────────────────────────────────────────────
  'romanian-deadlift':{ label:'Romanian Deadlift', pattern:'hinge', canonicalLift:'Barbell Deadlift',
    variants:['romanian-deadlift','stiff-leg-deadlift','db-rdl','single-leg-db-rdl',
              'bodyweight-single-leg-rdl','sumo-rdl']},
  'good-morning':{ label:'Good Morning', pattern:'hinge', canonicalLift:null,
    variants:['good-morning']},
  'hip-thrust':{ label:'Hip Thrust / Glute Bridge', pattern:'hinge', canonicalLift:null,   // G3
    variants:['hip-thrust','barbell-hip-thrust','glute-bridge','single-leg-glute-bridge',
              'frog-pump']},
  'cable-pull-through':{ label:'Cable Pull-Through', pattern:'hinge', canonicalLift:null,
    variants:['cable-pull-through']},
  'leg-curl':{ label:'Leg Curl', pattern:'isolation', canonicalLift:null,
    variants:['lying-leg-curl','seated-leg-curl','nordic-curl','slider-leg-curl','glute-ham-raise']},

  // ── HIP ISOLATION ────────────────────────────────────
  'glute-kickback':{ label:'Glute Kickback', pattern:'isolation', canonicalLift:null,
    variants:['cable-kickback']},
  'hip-abduction':{ label:'Hip Abduction', pattern:'isolation', canonicalLift:null,
    variants:['abductor-machine','banded-hip-abduction']},

  // ── ANKLE ISOLATION ──────────────────────────────────
  'calf-raise':{ label:'Calf Raise', pattern:'isolation', canonicalLift:null,
    variants:['standing-calf-raise','seated-calf-raise','leg-press-calf-raise','single-leg-calf-raise',
              'db-standing-calf-raise','smith-machine-calf-raise']},

  // ── TRUNK — pattern:null, see G1 ─────────────────────
  'plank':{ label:'Plank', pattern:null, canonicalLift:null,
    variants:['plank','side-plank','copenhagen-plank']},
  'dead-bug':{ label:'Dead Bug / Bird Dog', pattern:null, canonicalLift:null,
    variants:['dead-bug','bird-dog']},
  'ab-rollout':{ label:'Ab Rollout', pattern:null, canonicalLift:null,
    variants:['ab-wheel-rollout']},
  'hollow-body-hold':{ label:'Hollow Body Hold', pattern:null, canonicalLift:null,
    variants:['hollow-body-hold']},
  'dragon-flag':{ label:'Dragon Flag', pattern:null, canonicalLift:null,
    variants:['dragon-flag']},
  'crunch':{ label:'Crunch', pattern:null, canonicalLift:null,
    variants:['cable-crunch','standing-cable-crunch','machine-ab-crunch','weighted-decline-sit-up',
              'v-up']},
  'leg-raise':{ label:'Leg Raise', pattern:null, canonicalLift:null,
    variants:['hanging-knee-raise','hanging-leg-raise','toes-to-bar','reverse-crunch']},
  'pallof-press':{ label:'Pallof Press', pattern:null, canonicalLift:null,
    variants:['pallof-press']},
  'trunk-rotation':{ label:'Trunk Rotation', pattern:null, canonicalLift:null,
    variants:['cable-woodchopper','landmine-rotation','russian-twist']},
  'oblique-crunch':{ label:'Oblique Crunch', pattern:null, canonicalLift:null,
    variants:['standing-cable-oblique-crunch','hanging-oblique-raise','bicycle-crunch']},
  'mcgill-curl-up':{ label:'McGill Curl-Up', pattern:null, canonicalLift:null,
    variants:['mcgill-curl-up']},

  // ── CONDITIONING — pattern:null, see G1 ──────────────
  'machine-cardio':{ label:'Machine Cardio', pattern:null, canonicalLift:null,
    variants:['incline-treadmill','stationary-bike','elliptical','rower']},
  'calisthenic-cardio':{ label:'Calisthenic Cardio', pattern:null, canonicalLift:null,
    variants:['jumping-jacks','high-knees']},
  // KB Swing is bank-category 'cardio' but is a ballistic hip hinge — the one
  // conditioning movement v0.5's enum DOES have a value for.
  'kb-swing':{ label:'KB Swing', pattern:'hinge', canonicalLift:null,
    variants:['kb-swing']},
};

// ═══════════════════════════════════════════════════════
// INJURY-AWARE FILTERING
// makeInjuryBlocked(injuries) → predicate (name) => bool
//   Maps free-text injury keywords to contraindicated movement-name
//   regexes. Used both inside the dynamic generator's bank() filter and
//   as a final prune pass (pruneInjuries) on the assembled program — the
//   prune catches statically-injected days (e.g. build5's shoulder block)
//   that bypass the bank filter.
// ═══════════════════════════════════════════════════════
function makeInjuryBlocked(injuries) {
  const INJURY_RULES = [
    { kw:/knee/i,                                                ban:/lunge|bulgarian|step-up|hack squat|leg extension|sissy/i },
    { kw:/(lower ?back|lumbar|spine|herniat|\bdisc\b|sciatic)/i, ban:/deadlift|romanian|good morning|barbell row|bent-?over|\brdl\b|back squat/i },
    { kw:/(shoulder|impinge|rotator|labrum|ac ?joint)/i,        ban:/overhead press|arnold|push press|z-press|upright row|behind|military|shoulder press|landmine press/i },
    { kw:/(elbow|tennis|golfer)/i,                              ban:/skull ?crusher|overhead extension|close-grip/i },
    { kw:/wrist/i,                                              ban:/barbell curl|skull ?crusher|upright row/i },
    { kw:/(hip|groin)/i,                                        ban:/sumo|bulgarian|deep squat/i },
  ];
  const injStr = String(injuries || '');
  const injuryBans = INJURY_RULES.filter(r => r.kw.test(injStr)).map(r => r.ban);
  return (name) => injuryBans.some(re => re.test(name || ''));
}

// pruneInjuries(program, injuries) → program with contraindicated movements
//   removed from each day's blocks. Safe to apply only on the dynamic path,
//   where every day/block/exercise object is freshly constructed (no shared
//   static mutation). This catches statically-injected exercises (e.g.
//   build5's shoulder block) that bypass the bank-level filter. Guards
//   against emptying a day: a prune that would leave a day with no
//   exercises at all is rolled back for that day.
function pruneInjuries(program, injuries) {
  if (!program || !injuries) return program;
  const blocked = makeInjuryBlocked(injuries);
  for (const day of program) {
    if (!day || !Array.isArray(day.blocks)) continue;
    const prunedBlocks = day.blocks
      .map(b => ({ ...b, exs: (b.exs || []).filter(ex => !blocked(ex.name)) }))
      .filter(b => b.exs.length);
    const total = prunedBlocks.reduce((n, b) => n + b.exs.length, 0);
    if (total > 0) day.blocks = prunedBlocks;
  }
  return program;
}

// ═══════════════════════════════════════════════════════
// EXERCISE SUBSTITUTION
// getExerciseSubstitutes(exName, tier, injuries, limit)
//   → array of EXERCISE_BANK entries to swap exName for: same category,
//     sharing a primary muscle group, tier-appropriate (won't suggest a
//     barbell move at a hotel/home tier), and injury-safe. Reuses the
//     tierOrder + makeInjuryBlocked patterns from buildDynamicProgram.
// ═══════════════════════════════════════════════════════
function getExerciseSubstitutes(exName, tier, injuries, limit) {
  const entry = Object.values(EXERCISE_BANK).find(e => e.name === exName);
  if (!entry) return [];
  const tierOrder = ['home','hotel_gym','full_gym'];
  const reqIdx = tierOrder.indexOf(tier || 'full_gym');
  const injuryBlocked = makeInjuryBlocked(injuries);
  const primaryGroups = entry.muscleGroups?.primary || [];
  const candidates = Object.values(EXERCISE_BANK).filter(e =>
    e.name !== exName &&
    e.category === entry.category &&
    tierOrder.indexOf(e.tier) <= reqIdx &&
    !injuryBlocked(e.name) &&
    (e.muscleGroups?.primary || []).some(g => primaryGroups.includes(g)));
  return candidates.slice(0, limit || 5);
}

// ═══════════════════════════════════════════════════════
// REST OWNERSHIP — RULED 2026-08-23. `PHASES` owns rest. Nothing else does.
//
// EPIC-8a's REST_SECONDS table (beginner 105/75, intermediate 90/60, advanced
// 75/45) is DELETED here, not merely unwired. Three findings, all verified by
// running rather than by reading:
//
//  1. It never reached a user. The render layer resolves rest as
//     `ex.authoredRest ?? (ex.compound ? phase.restComp : phase.restAcc)` —
//     tandem.html:3516/3551 and the countdown at :3977. `ex.rest` is read
//     NOWHERE in tandem.html. Every number this table produced was computed,
//     carried through four transform passes, and discarded at the last step.
//     It has been dead since EPIC-8a shipped.
//  2. No source supports keying rest to training experience. research-report
//     (8).pdf §3 is titled "TRAINING VARIABLES BY GOAL" and prescribes rest by
//     goal — 60-90s upper isolation, 90-120s lower compound (hypertrophy),
//     3-5min (strength). §6 "Skill Level Progressions" is the section that
//     WOULD have licensed an experience-keyed table, and it never mentions rest
//     at all. Notion's 5-Goal Taxonomy likewise makes rest part of each goal's
//     signature ("2min rest on compounds" / "short rest" / "moderate rest").
//     Every canonical source keys rest to GOAL. None keys it to experience.
//  3. Its numbers were uncited. Same class as D4b, which DOCTRINE.md holds
//     PENDING precisely because "per-experience numbers are deliberately NOT
//     invented here." Wiring an invented table into the render path would have
//     made a fabrication user-visible — strictly worse than leaving it dead.
//
// So this is a deletion, not a migration. Wiring REST_SECONDS into the one-off's
// mk() (as was done earlier the same day, on the theory that a dead table is a
// silo to be closed) was the wrong repair: the table was dead because it was
// WRONG, and connecting it would have shipped the error instead of the omission.
// Closing a silo means collapsing to the correct owner, not to the nearest one.
//
// normalizeExperience() stays — experience still legitimately drives drop-set
// flagging (flagDropSet) and the advanced RPE coaching cue, both of which are
// annotations rather than prescriptions.
// ═══════════════════════════════════════════════════════
function normalizeExperience(experience) {
  return (experience === 'beginner' || experience === 'advanced') ? experience : 'intermediate';
}
// flagDropSet(day) — advanced-tier helper. Tags the day's LAST accessory/arm
// exercise (Arms Block preferred, else Accessory Block) with a drop-set
// intensity flag + coaching cue. STRING/flag annotation only — no RPE math,
// no schema change.
function flagDropSet(day) {
  if (!day || !Array.isArray(day.blocks)) return day;
  const target = [...day.blocks].reverse().find(b => !b.cardio && /accessory|arms/i.test(b.label || ''));
  if (target && target.exs && target.exs.length) {
    const last = target.exs[target.exs.length - 1];
    if (last) {
      last.intensity = 'drop-set';
      last.cues = [...(last.cues || []), 'Advanced tier: drop set — reduce load ~30% and continue to failure after your last working set.'];
    }
  }
  return day;
}

// ONE-OFF WORKOUT GENERATOR — Home-Screen "Build Me a Workout"
// getSingleDay(focus, { tier, injuries, cardio })
//   → a single cohesive session for a muscle focus (chest / back / legs /
//     shoulders / arms / push / pull / hinge / full_body). Compound-first,
//     tier- and injury-safe, no duplicate lifts.
//
// This is the DYNAMIC engine's PROPER home (see Notion "Home-Screen Program
// Builders"): a one-off carries NO mesocycle progression, so variety here is a
// FEATURE, not the "random program" defect. It is therefore intentionally exempt
// from the block-stability / deload doctrine invariants (D1/D4/D7) — see
// /DOCTRINE.md and the D9 one-off assertion in scripts/doctrine.mjs.
//
// Selection mirrors bank()'s contract exactly (tier gate, groupsMatch prefix
// rule, oneRmFactor-desc-then-alpha deterministic sort, injury filter) so the
// two engines can never diverge. Weights are left as light defaults and filled
// by the render layer (buildDayHTML) from the user's PRs/calibration, same as any
// generated day — so a one-off still prescribes at the lifter's real strength.
// ═══════════════════════════════════════════════════════
const FOCUS_SLOTS = {
  chest:     [['pec_major','pec','compound'],['pec_major','pec','compound'],['pec_major','pec','isolation'],['tricep','','isolation'],['anterior_delt','lateral_delt','isolation']],
  back:      [['lat_dorsi','','compound'],['lat_dorsi','rhomboid','compound'],['lat_dorsi','','isolation'],['bicep','','isolation'],['posterior_delt','rhomboid','isolation']],
  legs:      [['quad','','compound'],['hamstring','glute_max','compound'],['quad_rectus_femoris','quad_vastus','isolation'],['hamstring','','isolation'],['gastrocnemius','calf','isolation']],
  shoulders: [['anterior_delt','lateral_delt','compound'],['lateral_delt','','isolation'],['posterior_delt','rhomboid','isolation'],['anterior_delt','','isolation'],['upper_trap','','isolation']],
  arms:      [['bicep','','isolation'],['tricep','','isolation'],['bicep','','isolation'],['tricep','','isolation'],['brachialis','brachioradialis','isolation']],
  push:      [['pec_major','pec','compound'],['anterior_delt','lateral_delt','compound'],['pec_major','pec','isolation'],['tricep','','isolation'],['lateral_delt','','isolation']],
  pull:      [['lat_dorsi','','compound'],['lat_dorsi','rhomboid','compound'],['bicep','','isolation'],['posterior_delt','rhomboid','isolation'],['bicep','','isolation']],
  hinge:     [['hamstring','glute_max','compound'],['glute_max','','compound'],['hamstring','','isolation'],['glute_max','glute_medius','isolation'],['gastrocnemius','calf','isolation']],
  full_body: [['pec_major','pec','compound'],['lat_dorsi','','compound'],['quad','','compound'],['hamstring','glute_max','compound'],['anterior_delt','lateral_delt','isolation']],
};
const ONEOFF_CORE_GROUPS = ['rectus_abdominis','transverse_abdominis','oblique','quadratus_lumborum','erector_spinae'];
// BUG-83 (2026-08-16, EPIC-026 Phase 1 audit, Notion 3beca37f935b813e8ddadd7a6f2ea0e5): 'lower_body'
// removed — it never matched any exercise's muscleGroups tag (cardio entries carry emphasis:['lower_body',...]
// but groupsMatch checks muscleGroups.primary/secondary, a different field; 'lower_body' is not a muscle-group
// tag anywhere in EXERCISE_BANK). Verified behavior-neutral: 'full_body' and 'glute_max' already match every
// cardio candidate 'lower_body' was ever meant to catch (node scripts/audit-muscle-tags.mjs confirms 0 exercises
// under the live prefix rule). Same removal applied to the two TEMPLATES cardioGroups arrays and
// SHOULDER_TEMPLATE below that also carried this dead token.
const ONEOFF_CARDIO_GROUPS = ['full_body','glute_max'];

function getSingleDay(focus, opts = {}) {
  const key = String(focus || '').toLowerCase().replace(/[\s-]+/g, '_');
  const slots = FOCUS_SLOTS[key];
  if (!slots) return null;
  const tierOrder = ['home', 'hotel_gym', 'full_gym'];
  const reqIdx = tierOrder.indexOf(opts.tier || 'full_gym');
  const injuryBlocked = makeInjuryBlocked(opts.injuries);
  const tierOk = (e) => tierOrder.indexOf(e.tier) <= (reqIdx < 0 ? 2 : reqIdx);
  // groupsMatch — identical prefix rule to buildDynamicProgram's
  // BUG-87 (2026-08-18): the trailing `|| a.startsWith(g)` bare-prefix fallback let a
  // slot's group name collide with an unrelated muscle tag that merely shares a leading
  // substring — 'quad' matched 'quadratus_lumborum' (a lower-back/core muscle), pulling a
  // lumbar exercise into a leg slot. Verified behavior-neutral otherwise: every other
  // requested group's matched-exercise set is identical with the fallback removed
  // (node scripts/audit-muscle-tags.mjs confirms 0 collisions, 0 new dead terms).
  const groupsMatch = (e, groups) => {
    const all = [...(e.muscleGroups.primary || []), ...(e.muscleGroups.secondary || [])];
    return groups.some(g => all.some(a => a === g || a.startsWith(g + '_')));
  };
  // ── D20 (EPIC-028) — per-muscle recency SOFT de-prioritization ─────────────
  // opts.recentExposure: { muscleTag: hoursSinceLastTrained } — the exact shape
  // recentMuscleLoad() (tandem.html, EPIC-027/028 shared read path) produces,
  // PRIMARY muscle tags only. opts.recencyThresholdHours: a plain number of
  // hours, supplied BY THE CALLER as RECOVERY_PARAMS[goal].sameGroupHours — the
  // existing, shipped, Kerwin-approved number (BUG-30). getSingleDay deliberately
  // does not read RECOVERY_PARAMS itself (that constant lives in tandem.html,
  // not programs.js, and this engine is also loaded standalone by
  // scripts/doctrine.mjs's vm sandbox + Node test scripts) — it only consumes
  // the resolved number, so no goal-selection logic or new threshold is invented
  // here. Both opts absent/empty ⇒ steeringActive is false ⇒ every code path
  // below is a no-op and select() behaves byte-identically to before this change.
  const recentExposure = (opts.recentExposure && typeof opts.recentExposure === 'object') ? opts.recentExposure : null;
  const recencyThresholdHours = Number.isFinite(opts.recencyThresholdHours) ? opts.recencyThresholdHours : 0;
  const steeringActive = !!(recentExposure && recencyThresholdHours > 0);
  // recentExposure is keyed by whatever PRIMARY tag the trained exercise actually
  // carries (recentMuscleLoad()'s definition) — the fine-grained bank leaf, e.g.
  // 'quad_rectus_femoris' — while a FOCUS_SLOTS token is often the coarser PARENT,
  // e.g. 'quad'. An exact-key lookup here would silently never match a parent
  // slot token against a child exposure key (caught while building this gate: the
  // exact-key version left every non-leaf FOCUS_SLOTS token permanently inert).
  // Reuses the identical D19-anchored rule groupsMatch already enforces — same
  // separator semantics, applied to recentExposure's keys instead of the bank's.
  const isRecent = (g) => {
    if (!steeringActive) return false;
    for (const tag in recentExposure) {
      if ((tag === g || tag.startsWith(g + '_')) && recentExposure[tag] < recencyThresholdHours) return true;
    }
    return false;
  };
  // D20 has TWO steering axes, because a focus family is nested and "a different
  // muscle within the same focus family" can mean either level:
  //
  //   ACROSS slot tokens — freshGroups below. Handles e.g. arms: bicep is recent,
  //     so widen to brachialis, which the same focus's FOCUS_SLOTS already asks for.
  //
  //   WITHIN one slot token — recentPenalty here. Widening alone cannot see this
  //     level and silently leaves the flagged muscle in place. Live example:
  //     FOCUS_SLOTS.chest asks both compound slots for the single token
  //     'pec_major', but the bank has TWO muscles under it — pec_major_sternal and
  //     pec_major_clavicular. Train sternal, and every other compound group in the
  //     chest focus is isolation, so freshGroups is empty and widening finds
  //     nothing: the day comes back with a sternal-pec compound in slot 1, still
  //     inside the recovery window. Clavicular is "legally available a different
  //     muscle in the same family", which is exactly what D20's text says to steer
  //     to. Demoting the recent candidate reaches it; widening cannot.
  //
  // 1 = this candidate's own PRIMARY muscle is inside the window, 0 = it is not.
  // Uses isRecent, so it inherits the same D19-anchored separator rule rather than
  // an exact-key lookup — a bank entry whose primary is a PARENT tag ('quad') must
  // still register against a leaf exposure key ('quad_rectus_femoris').
  // PRIMARY only, for the same reason isFresh is primary-only (see below): a
  // recovery window describes recovery of the TRAINED muscle, and scoring the
  // co-tagged synergists would mark nearly everything recent.
  const recentPenalty = (e) => (steeringActive && (e.muscleGroups.primary || []).some(isRecent)) ? 1 : 0;
  // deterministic candidate pool — identical sort to bank(), PLUS the two optional
  // D20 ranks ahead of the existing oneRmFactor/alpha tiebreak. Both REORDER only:
  // freshGroups only ever WIDENS the legal pool (groups ∪ freshGroups) and
  // recentPenalty only demotes within it — neither removes a legal candidate, so a
  // slot can never come up empty because of this (D20: "soft, never hard-excludes"),
  // and D9/D18 hold by construction rather than by a runtime check. With no
  // exposure the sort is unchanged from the pre-D20 comparator.
  const select = (groups, cat, used, freshGroups = []) => {
    const freshSet = freshGroups.length ? new Set(freshGroups) : null;
    // PRIMARY tags only, deliberately — the same scope recentMuscleLoad() uses
    // (tandem.html comment ~5015). Most isolation lifts co-tag a synergist as
    // SECONDARY (e.g. every curl variant secondarily hits brachialis/
    // brachioradialis — real anatomy, elbow-flexor synergists), so scoring on
    // primary+secondary made nearly every bicep candidate register as "fresh"
    // via its secondary tag and silently defeated the steering (caught by the
    // functional-proof check below before this was fixed).
    const isFresh = (e) => freshSet && (e.muscleGroups.primary || []).some(a => freshSet.has(a));
    return Object.values(EXERCISE_BANK)
      .filter(e => tierOk(e) && e.category === cat && groupsMatch(e, freshSet ? [...groups, ...freshGroups] : groups) && !injuryBlocked(e.name) && !used.has(e.name))
      .sort((a, b) => {
        // WITHIN-token demotion first: it is the direct measure of "this exact
        // candidate trains a muscle you just trained." A fresh alternate-group
        // candidate scores 0 here anyway, so putting this first never overrides
        // the widening — the two ranks agree wherever they both have an opinion.
        const rp = recentPenalty(a) - recentPenalty(b);
        if (rp !== 0) return rp;
        if (freshSet) {
          const diff = (isFresh(b) ? 1 : 0) - (isFresh(a) ? 1 : 0); // fresh (matches a non-recent alt group) ranks first
          if (diff !== 0) return diff;
        }
        if (a.oneRmFactor != null || b.oneRmFactor != null) {
          const diff = (b.oneRmFactor ?? 0) - (a.oneRmFactor ?? 0);
          if (diff !== 0) return diff;
        }
        return a.name.localeCompare(b.name);
      })[0] || null;
  };
  // Starting weight: the SAME owner the weekly engine uses. This was its own sex-blind
  // table that ignored the NSCA matrix and oneRmFactor entirely, so the one-off handed a
  // woman 95 lb on a barbell press her own weekly program starts at 55. The render layer
  // still overrides from PRs/calibration where history exists — but with no history, this
  // number is what she reads off the card, so "it's only a default" was never a defence.
  const defW = (e) => seedWeight(e, { sex: opts.sex, dbCap: opts.maxDb });
  const mk = (e, i, over = {}) => e && ({
    id: `oneoff-${key}-${i}`, name: e.name,
    badge: e.category === 'compound' ? 'compound' : 'isolation',
    sets: e.category === 'compound' ? 4 : 3,
    w: defW(e), r: defaultPrescription(e),
    // No `rest` field. A GENERATED exercise does not get to author a rest window —
    // PHASES does, keyed by goal and phase, resolved at render. Emitting a number
    // here would recreate the dead-value bug: the render layer would ignore it and
    // the app would carry two disagreeing answers to one question.
    compound: e.category === 'compound', isCore: e.category === 'core',
    cardioOnly: e.category === 'cardio', unit: e.unit || 'reps',
    equipment: e.equipment || null, why: e.why || '', cues: e.cues || [], ...over,
  });

  const used = new Set();
  const comp = [], acc = [];
  slots.forEach((s, i) => {
    const groups = [s[0], s[1]].filter(Boolean);
    const cat = s[2];
    // D20: only widen this slot's pool when ITS OWN requested group(s) are
    // under the recovery threshold. The alternative pool is every OTHER
    // muscle group this same focus already asks for at the SAME category
    // (same FOCUS_SLOTS array, cat-matched — never crosses compound/isolation,
    // preserving D3/D9's compound-first structure) that is itself NOT recent.
    // "Same focus family" is deliberately scoped to FOCUS_SLOTS[key] rather
    // than the whole muscle taxonomy — D20 says "within the same focus
    // family," not "anywhere legal," and this keeps a chest/back/arms day
    // from drifting into an unrelated muscle group.
    let freshGroups = [];
    if (steeringActive && groups.some(isRecent)) {
      const ownAndSeen = new Set(groups);
      slots.forEach((other, j) => {
        if (j === i || other[2] !== cat) return;
        [other[0], other[1]].filter(Boolean).forEach(g => {
          if (!ownAndSeen.has(g) && !isRecent(g)) { ownAndSeen.add(g); freshGroups.push(g); }
        });
      });
    }
    const chosen = select(groups, cat, used, freshGroups);
    if (!chosen) return;
    used.add(chosen.name);
    (cat === 'compound' ? comp : acc).push(mk(chosen, i, cat === 'isolation' ? { sets: 3 } : {}));
  });
  // 2 core movements, then an optional Zone 2 finisher
  const core = [];
  for (let i = 0; i < 2; i++) {
    const c = select(ONEOFF_CORE_GROUPS, 'core', used);
    if (!c) break;
    used.add(c.name);
    // No rest override. The 30s that used to sit here was uncited — no repo or
    // Notion source prescribes a core-specific rest window — and it was dead
    // anyway (the block rendered at phase.restAcc: 45s on fat_burn, 60s on
    // transform, 75s on build_muscle, while its own label read "Rest 30 sec").
    // Deleting an invented number is the D4b-consistent move; core now rests at
    // the goal's accessory window like every other non-compound movement.
    core.push(mk(c, `k${i}`, { sets: 3 }));
  }
  const blocks = [];
  if (comp.length) blocks.push({ label: 'Compound Block', exs: comp });
  if (acc.length) {
    // Supersets are a great fit for a one-off (time-crunched, no progression to
    // protect). Opt-in via opts.supersets — pairs accessories, never the compounds.
    //
    // Rest and eligibility BOTH come from SUPERSET_CFG — the same table the weekly
    // path reads in applySupersets(). This used to be a hardcoded 45, which meant
    // "how long do you rest between superset pairs" had two different answers
    // depending on which path built the day, and the goal-specific values below
    // (fat_burn 30s for the EPOC effect, transform 60s) were silently unreachable
    // from the one-off. A goal with no SUPERSET_CFG entry — build_muscle — gets no
    // supersets here for the same reason it gets none weekly, rather than getting
    // them at some third arbitrary rest value.
    const ssRest = SUPERSET_CFG[opts.goal]?.rest;
    if (opts.supersets && ssRest != null && acc.length >= 2) blocks.push(...pairIntoSupersets(acc, ssRest));
    else blocks.push({ label: 'Accessory Block', exs: acc });
  }
  // Label names no rest number. A block heading that asserts a window the render
  // layer then overrides is a lie printed directly above the truth — this one read
  // "Rest 30 sec" over lines rendering 45/60/75s. Rest is stated once, on the
  // exercise line, by whoever actually owns it.
  if (core.length) blocks.push({ label: 'Core Block', exs: core });
  if (opts.cardio) {
    const cardio = select(ONEOFF_CARDIO_GROUPS, 'cardio', used) || Object.values(EXERCISE_BANK).find(e => e.category === 'cardio' && tierOk(e));
    if (cardio) blocks.push({ label: 'Zone 2 · 20 min', cardio: true, exs: [mk(cardio, 'card', { sets: 1, duration: 20, cardioOnly: true, unit: 'sec', r: 1 })] });
  }
  const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const day = { key: 'oneoff', oneOff: true, focus: key, label: `${label} Day`, color: 'var(--accent)',
    rationale: `One-off ${label} session — compound-first, ${opts.tier || 'full_gym'} tier. Not part of a periodized program.`, blocks };
  if (!steeringActive) return day;

  // ── D20's "soft, never hard-excludes" — the LAST mile ────────────────────────
  // Neither steering rank filters a pool, so no single slot can be emptied by
  // D20 directly. But slots are filled in order against a shared `used` set, so
  // REORDERING can still cost a slot indirectly: steering makes an earlier slot
  // consume the one exercise a later, scarcer slot had left, that later slot's
  // pool comes back empty, and the caller silently drops it (`if (chosen) {...}`
  // — the exact swallow-the-gap pattern D18 exists to police).
  //
  // Found by RUNNING the combined engine, not by reading it, and confirmed to be
  // PRE-EXISTING on main rather than introduced here: 48 of 552 focus × tier ×
  // window × flagged-exercise cases came back one exercise short, concentrated at
  // the sparse `home` tier (e.g. legs/home 7 → 6). A saturation-only test cannot
  // see this, because saturation drives steering inert and so never exercises the
  // reordering path at all.
  //
  // So the guarantee is enforced where it is actually falsifiable — on the OUTPUT.
  // getSingleDay is pure and cheap, so recompute the unsteered day and yield to it
  // if steering cost a slot. D20 is a SCIENCE_DEFAULT preference; D9's structural
  // law is SAFETY, and a preference never outranks SAFETY. The recursion is
  // one-deep by construction: the inner call has steering off.
  const baseline = getSingleDay(focus, { ...opts, recentExposure: null, recencyThresholdHours: 0 });
  const filled = (d) => (d?.blocks || []).reduce((n, b) => n + (b.exs || []).length, 0);
  return filled(day) < filled(baseline) ? baseline : day;
}
const ONEOFF_FOCUSES = Object.keys(FOCUS_SLOTS);

// ═══════════════════════════════════════════════════════
// DYNAMIC PROGRAM GENERATOR
// buildDynamicProgram(goal, days, weeks, sex, tier, emphasis, injuries, maxDb, rotation, experience)
//   → returns a 4-day base array (same shape as static programs)
//     or null on failure (callers fall back to static)
// ═══════════════════════════════════════════════════════
function buildDynamicProgram(goal, days, weeks, sex, tier, emphasis, injuries, maxDb, rotation, experience) {
  const exp = normalizeExperience(experience);
  const isFemale = (sex === 'F' || String(sex||'').toLowerCase()==='f' || String(sex||'').toLowerCase()==='female');
  const dbCap = (Number.isFinite(maxDb) && maxDb > 0) ? maxDb : Infinity;
  // Rotation context drives variety over time: week rotates accessories; phase
  // rotates primary compounds (stable within a mesocycle to preserve overload
  // tracking). Selection itself is priority-ordered, not seeded/random — see
  // bank()'s sort and pick() below.
  const rot = rotation || {};
  const rotWeek  = Number.isFinite(rot.week)  ? rot.week  : 1;
  const rotPhase = Number.isFinite(rot.phase) ? rot.phase : 0;
  const tierOrder = ['home','hotel_gym','full_gym'];
  const reqIdx = tierOrder.indexOf(tier || 'full_gym');

  // injury-aware filtering (shared predicate — see makeInjuryBlocked)
  const injuryBlocked = makeInjuryBlocked(injuries);

  // filter helpers
  const tierOk = (ex) => tierOrder.indexOf(ex.tier) <= reqIdx;
  // BUG-87 (2026-08-18): bare-prefix fallback removed — see identical fix + rationale
  // on getSingleDay's groupsMatch above.
  const groupsMatch = (ex, groups) => {
    const all = [...(ex.muscleGroups.primary||[]),...(ex.muscleGroups.secondary||[])];
    return groups.some(g => all.some(a => a === g || a.startsWith(g+'_')));
  };
  // GEN-fix (exercise-selection mechanism): bank() now returns a candidate
  // pool in a fixed, explainable priority order instead of raw EXERCISE_BANK
  // object-insertion order. Compounds (oneRmFactor is non-null) rank by
  // relative loading capacity descending — the same biomechanical signal
  // baseW() already uses to set starting weight, so the "primary" choice for
  // a muscle group is whichever compound the bank itself already claims has
  // the highest load ceiling / most direct recruitment. Isolation/core/cardio
  // have no oneRmFactor (there's no single "best" accessory variant backed
  // by evidence the same way) — those rank alphabetically, purely so the
  // pool order is deterministic and independent of where a new bank entry
  // happens to be inserted. Either way, adding an exercise to the bank can
  // no longer silently reassign exercises in unrelated, already-generated
  // programs — the fragility that caused the C7 regression.
  const bank = ({groups, cat, excl=[]}) =>
    Object.values(EXERCISE_BANK).filter(e =>
      tierOk(e) && e.category===cat && groupsMatch(e, groups) && !excl.includes(e.name) && !injuryBlocked(e.name))
      .sort((a, b) => {
        if (a.oneRmFactor != null || b.oneRmFactor != null) {
          const diff = (b.oneRmFactor ?? 0) - (a.oneRmFactor ?? 0);
          if (diff !== 0) return diff;
        }
        return a.name.localeCompare(b.name);
      });

  // emphasis tag → bank emphasis tag
  const emphMap = {back_heavy:'back',push_heavy:'push',pull_heavy:'pull',
    glute_focused:'glutes',core_focused:'core',upper_body:'upper_body',lower_body:'lower_body'};
  const emphTag = emphMap[emphasis] || null;

  // Deterministic, priority-ordered selection — no hashing, nothing random.
  // Emphasis preference narrows the pool first; within the resulting
  // (already priority-sorted) pool, primary/secondary compounds walk the
  // list by mesocycle phase and accessories walk it by week — purposeful
  // variety over time/program segment, always landing on the next-best
  // candidate in the scientifically-ordered list rather than an arbitrary one.
  const pick = (cands, slot, tmpl) => {
    if (!cands.length) return null;
    let pool = cands;
    if (emphTag) { const b = cands.filter(e => e.emphasis && e.emphasis.includes(emphTag)); if (b.length) pool = b; }
    const isPrimary = slot && (slot.role === 'primary' || slot.role === 'secondary');
    // EPIC-8a: beginner tier biases compound-slot selection toward guided
    // (machine/cable) equipment when available — lower technique barrier.
    if (exp === 'beginner' && isPrimary) {
      const machineFirst = pool.filter(e => e.equipment === 'machine' || e.equipment === 'cable');
      if (machineFirst.length) pool = machineFirst;
    }
    // D15 (tiered rotation cadence) — Periodization spec Part A concluded "Primary
    // compounds: fixed for the whole program... Secondary compounds & accessories:
    // fixed within each mesocycle, refreshed at each block boundary" but pick() never
    // actually implemented that distinction — every slot rotated on the same rotPhase
    // clock. research-report(9) (Valyu, 2026-07-23) then gave the exact numbers that
    // confirm the original spec: compounds fixed 8-12wk minimum (for Tandem's typical
    // program lengths, that IS the whole program); the first-listed/closest-pattern
    // accessory per slot (acc1) rotates ~4-6wk; remaining accessories (acc2/acc3,
    // true isolation) rotate ~2-3wk. Accessories previously walked by rotWeek (a
    // fresh pick every single week) — that was the "random" churn (no cohesion) AND
    // it broke progressive-overload tracking (the BUG-45 phantom-1RM class). Now:
    //   primary/secondary (compound) → the PRIMARY BLOCK index (D15 as amended
    //       2026-08-05, EPIC-033 Step 4b — see primaryBlockStarts above). Keyed on
    //       the WEEK, not the phase, because the 8-12wk cadence is a wall-clock
    //       cadence while `phase` is always 4 scaled themes regardless of T. Returns
    //       0 for every week of any program <= 15 weeks, so behaviour at every length
    //       that shipped before EPIC-033 is bit-identical to the old `block = 0`.
    //   acc1 ("primary accessory")   → rotates ~every other phase (~4-6wk)
    //   acc2/acc3 (isolation)        → rotates every phase (~2-3wk, unchanged)
    const role = slot && slot.role;
    let block;
    if (role === 'primary' || role === 'secondary') block = primaryBlockIndex(rotWeek, weeks);
    else if (role === 'acc1') block = Math.floor(rotPhase / 2);
    else block = rotPhase;
    return pool[((block % pool.length) + pool.length) % pool.length];
  };

  // Starting weight comes from seedWeight() — the one declared owner, near the top of
  // this file. The NSCA matrix and the generic per-equipment formula used to be inlined
  // here, which is how three other call sites ended up with their own divergent copies.
  // (`const m = isFemale ? 0.55 : 1.0` also lived here and was read by nothing.)
  const baseW = (e) => seedWeight(e, { sex, dbCap });

  const makeEx = (entry, idSuffix, overrides={}) => {
    if (!entry) return null;
    // EPIC-8a: advanced tier appends a coaching-cue STRING to compound lifts
    // only (no RPE calculation/storage — annotation only).
    const cues = (exp === 'advanced' && entry.category === 'compound')
      ? [...(entry.cues || []), 'Advanced tier: push to RPE 8-9 on working sets.']
      : (entry.cues || []);
    return {
      id: idSuffix,
      name: entry.name,
      badge: entry.category==='compound'?'compound':'isolation',
      sets: overrides.sets ?? (entry.category==='compound'?4:3),
      w: baseW(entry),
      r: defaultPrescription(entry),   // one home — see defaultPrescription() above (D25)
      // No `rest`. Same rule as the one-off's mk(): a generated exercise does not
      // author a rest window — PHASES resolves it at render, keyed by goal + phase.
      compound: entry.category==='compound',
      isCore: entry.category==='core',
      cardioOnly: entry.category==='cardio',
      // GEN-fix: carry movement-type metadata through to the logging layer.
      // unit 'sec' = timed hold (Plank/Side Plank) — r becomes seconds, not reps.
      unit: entry.unit || 'reps',
      equipment: entry.equipment || null,
      why: entry.why||'',
      cues,
      ...overrides
    };
  };

  // Day templates: each defines what to populate
  const TEMPLATES = [
    { key:'day1', label:'Day 1 · Upper Push', color:'var(--red)',
      rationale:'Horizontal push emphasis — chest, shoulders, triceps. Accessories keep the antagonist shoulder healthy.',
      slots:[
        {role:'primary',   groups:['pec_major','pec'],                         cat:'compound'},
        {role:'secondary', groups:['anterior_delt','lateral_delt'],             cat:'compound'},
        {role:'acc1',      groups:['pec_major','pec'],                          cat:'isolation'},
        {role:'acc2',      groups:['tricep'],                                   cat:'isolation'},
        {role:'acc3',      groups:['posterior_delt','lateral_delt'],            cat:'isolation'},
      ], cardioGroups:['full_body','glute_max'] },
    { key:'day2', label:'Day 2 · Lower Hinge', color:'var(--amber)',
      rationale:'Hip hinge pattern — glutes, hamstrings, posterior chain. Calf and hip abductor accessories.',
      slots:[
        {role:'primary',   groups:['hamstring','glute_max'],                    cat:'compound'},
        {role:'secondary', groups:['glute_max','quad'],                         cat:'compound'},
        {role:'acc1',      groups:['glute_max','glute_medius','glute_minimus'], cat:'isolation'},
        {role:'acc2',      groups:['hamstring'],                                cat:'isolation'},
        {role:'acc3',      groups:['gastrocnemius','soleus','calf'],            cat:'isolation'},
      ], cardioGroups:['full_body','glute_max'] },
    { key:'day3', label:'Day 3 · Upper Pull', color:'var(--blue)',
      rationale:'Vertical and horizontal pull emphasis — back, biceps. Rear delt accessory balances the press.',
      slots:[
        {role:'primary',   groups:['lat_dorsi'],                                cat:'compound'},
        {role:'secondary', groups:['lat_dorsi','rhomboid'],                     cat:'compound'},
        {role:'acc1',      groups:['bicep'],                                    cat:'isolation'},
        {role:'acc2',      groups:['posterior_delt','rhomboid'],                cat:'isolation'},
        {role:'acc3',      groups:['lateral_delt'],                             cat:'isolation'},
      ], cardioGroups:['lat_dorsi','quad','glute_max'] },
    { key:'day4', label:'Day 4 · Lower Quad', color:'var(--purple,#a78bfa)',
      rationale:'Squat pattern emphasis — quads, glutes. Isolation finishers for quad and glute medius.',
      slots:[
        {role:'primary',   groups:['quad'],                                     cat:'compound'},
        {role:'secondary', groups:['glute_max','hamstring'],                    cat:'compound'},
        {role:'acc1',      groups:['quad_rectus_femoris','quad_vastus'],        cat:'isolation'},
        {role:'acc2',      groups:['glute_max','glute_medius'],                 cat:'isolation'},
        {role:'acc3',      groups:['gastrocnemius','calf'],                     cat:'isolation'},
      ], cardioGroups:['quad','glute_max','hamstring'] },
  ];

  // GEN-fix (Bug 39aca37f…71a0): core muscle groups every day's Core Block
  // draws from. groupsMatch's prefix rule ('oblique' → oblique_external /
  // oblique_internal) covers all 10 EXERCISE_BANK core entries.
  const CORE_GROUPS = ['rectus_abdominis','transverse_abdominis','oblique',
    'quadratus_lumborum','erector_spinae'];

  // Check we have at least one compound per day template
  const usable = TEMPLATES.every(t =>
    bank({groups:t.slots[0].groups, cat:'compound'}).length > 0);
  if (!usable) return null;

  const used = new Set();

  // Shoulders + Arms day — bank-driven (consumed only by the 5-day split via
  // build5). Built after the 4 base days so it reuses the same `used` set and
  // therefore avoids duplicating Day-1 push / Day-4 upper picks. Roles: the delt
  // compound is 'primary' (rotates per phase); the rest are accessories (weekly).
  const SHOULDER_TEMPLATE = {
    key:'day3', label:'Day 3 · Shoulders + Arms', color:'var(--teal,#38d9c0)',
    rationale:'Dedicated delt and arm session. Fresh shoulders after Day 1 push.',
    shoulderSlots:[
      {role:'primary', groups:['anterior_delt','lateral_delt'], cat:'compound'},
      {role:'acc1',    groups:['lateral_delt'],                 cat:'isolation'},
      {role:'acc2',    groups:['posterior_delt','rhomboid'],    cat:'isolation'},
    ],
    armSlots:[
      {role:'acc3',    groups:['tricep'],                       cat:'isolation'},
      {role:'acc4',    groups:['bicep'],                        cat:'isolation'},
    ],
    cardioGroups:['full_body','glute_max'],
  };

  try {
    const result = TEMPLATES.map(tmpl => {
      const exs = {};
      tmpl.slots.forEach(s => {
        // EPIC-8a: beginner tier drops the Accessory Block's 3rd exercise slot
        // (2 accessories instead of 3) — skip selection entirely so acc3's
        // exercise stays available (excl:[...used]) for other days.
        if (exp === 'beginner' && s.role === 'acc3') return;
        const cands = bank({groups:s.groups, cat:s.cat, excl:[...used]});
        const chosen = pick(cands, s, tmpl);
        if (chosen) { used.add(chosen.name); exs[s.role] = chosen; }
      });
      // GEN-fix: if every group-matched cardio candidate is excluded, allow
      // reuse rather than silently dropping the finisher (cardio repeats
      // across days are fine — Zone 2 is a modality, not a lift).
      const cardioPool = bank({groups:tmpl.cardioGroups, cat:'cardio', excl:[...used]});
      const cardioEx = cardioPool[0] || bank({groups:tmpl.cardioGroups, cat:'cardio'})[0] || null;

      const compExs = [exs.primary, exs.secondary].filter(Boolean)
        .map((e,i) => makeEx(e, tmpl.key+'-c'+i));
      const accExs = ['acc1','acc2','acc3'].map((k,i) => exs[k]
        ? makeEx(exs[k], tmpl.key+'-a'+i, {sets:3}) : null).filter(Boolean);

      // GEN-fix (Bug 39aca37f…71a0): every generated training day carries a
      // Core Block — mirrors the hand-authored layouts (2 core movements,
      // 3 sets, 30-sec rest). Falls back to reuse if the bank pool exhausts
      // (home tier has only 7 core entries for 8+ slots).
      const dayCore = new Set();
      const coreExs = ['core1','core2'].map((role,i) => {
        const cands = bank({groups:CORE_GROUPS, cat:'core', excl:[...used]});
        const pool = cands.length ? cands
          : bank({groups:CORE_GROUPS, cat:'core'}).filter(e => !dayCore.has(e.name));
        const chosen = pick(pool, {role}, tmpl);
        if (!chosen) return null;
        used.add(chosen.name); dayCore.add(chosen.name);
        return makeEx(chosen, tmpl.key+'-k'+i, {sets:3});
      }).filter(Boolean);

      const blocks = [];
      if (compExs.length) blocks.push({label:'Compound Block', exs:compExs});
      if (accExs.length)  blocks.push({label:'Accessory Block', exs:accExs});
      if (coreExs.length) blocks.push({label:'Core Block', exs:coreExs});
      if (cardioEx) blocks.push({label:'Zone 2 · 22 min', cardio:true, exs:[
        makeEx(cardioEx, tmpl.key+'-card', {sets:1, duration:22, cardioOnly:true, unit:'sec', r:1})]});

      // EPIC-8a: drop-set flagging happens once, in getProgram(), AFTER the
      // 2/3/5-day wrappers (build2/ppl/build5) have finished recombining
      // blocks from these base days — several of those wrappers cherry-pick
      // individual exercises into new blocks, so flagging here could tag an
      // exercise that later gets left out of the final day, or (for day1/
      // day3, which the wrappers pass through unchanged) get flagged twice.
      return {key:tmpl.key, label:tmpl.label, color:tmpl.color, rationale:tmpl.rationale, blocks};
    });

    // Build the Shoulders + Arms day and attach it for build5 (5-day split only).
    const sa = SHOULDER_TEMPLATE;
    const fillSlots = (slots) => slots.map(s => {
      const cands = bank({groups:s.groups, cat:s.cat, excl:[...used]});
      const chosen = pick(cands, s, sa);
      if (chosen) { used.add(chosen.name); return makeEx(chosen, sa.key+'-'+s.role, {sets:s.cat==='compound'?4:3}); }
      return null;
    }).filter(Boolean);
    const shoulderExs = fillSlots(sa.shoulderSlots);
    const armExs = fillSlots(sa.armSlots);
    // GEN-fix: shoulders day is a training day — it gets a Core Block too.
    const saCore = new Set();
    const saCoreExs = ['core1','core2'].map((role,i) => {
      const cands = bank({groups:CORE_GROUPS, cat:'core', excl:[...used]});
      const pool = cands.length ? cands
        : bank({groups:CORE_GROUPS, cat:'core'}).filter(e => !saCore.has(e.name));
      const chosen = pick(pool, {role}, sa);
      if (!chosen) return null;
      used.add(chosen.name); saCore.add(chosen.name);
      return makeEx(chosen, sa.key+'-k'+i, {sets:3});
    }).filter(Boolean);
    // GEN-fix (persona-matrix R7): shoulders day is a training day — it needs
    // a cardio finisher too, same as every other generated day.
    const saCardioPool = bank({groups:sa.cardioGroups, cat:'cardio', excl:[...used]});
    const saCardioEx = saCardioPool[0] || bank({groups:sa.cardioGroups, cat:'cardio'})[0] || null;
    const saBlocks = [];
    // Rest numbers removed from all three headings. These were 90/75/30 regardless
    // of goal or phase, while the lines beneath them rendered from PHASES — e.g. a
    // build_muscle week-9 shoulder line reads 150s under a heading claiming 90.
    if (shoulderExs.length) saBlocks.push({label:'Shoulder Block', exs:shoulderExs});
    if (armExs.length)      saBlocks.push({label:'Arms Block', exs:armExs});
    if (saCoreExs.length)   saBlocks.push({label:'Core Block', exs:saCoreExs});
    if (saCardioEx) saBlocks.push({label:'Zone 2 · 22 min', cardio:true, exs:[
      makeEx(saCardioEx, sa.key+'-card', {sets:1, duration:22, cardioOnly:true, unit:'sec', r:1})]});
    if (saBlocks.length) {
      // EPIC-8a: see note above — drop-set flagging is applied once, in
      // getProgram(), after final day-count assembly.
      result.shouldersArmsDay = {key:sa.key, label:sa.label, color:sa.color, rationale:sa.rationale, blocks:saBlocks};
    }

    return result;
  } catch(err) {
    console.warn('buildDynamicProgram error:', err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════
// GOAL VOLUME — Science-audit Finding 3 + doctrine D6 (v0.5 MEV/MAV/MRV table)
// The v0.5 volume landmarks differ BY GOAL; the engine used to apply identical
// sets to every goal. Sets-per-exercise now scale by goal in the MEV/MRV order
// (Transform/concurrent 12-18 > Build Muscle/hypertrophy 10-15 > Fat Burn/fat-loss
// 8-12). Core/cardio keep their own sets. NOTE (flagged): this delivers goal-
// differentiated volume; per-muscle MEV balancing + the within-block MEV→MRV week
// ramp still ride on the per-length mesocycle work (Finding 3 remainder + Finding 4).
// ═══════════════════════════════════════════════════════
const GOAL_VOLUME = {
  transform:    { compound: 4, isolation: 4 },
  build_muscle: { compound: 4, isolation: 3 },
  fat_burn:     { compound: 3, isolation: 3 },
};
function applyGoalVolume(program, goal) {
  const cfg = GOAL_VOLUME[goal];
  if (!cfg || !Array.isArray(program)) return program;
  return program.map(day => ({ ...day, blocks: (day.blocks || []).map(b => b.cardio ? b : ({
    ...b, exs: (b.exs || []).map(e => (e.isCore || e.cardioOnly) ? e
      : ({ ...e, sets: e.compound ? cfg.compound : cfg.isolation })),
  })) }));
}

// ═══════════════════════════════════════════════════════
// DELOADS — Periodization spec Part B + doctrine D4
// Every mesocycle ends in a deload (every 4-6 wk, block-final): volume cut ~50%,
// load held. Recovery IS the stimulus that week. deloadWeeks() encodes the Part B
// per-length table (4-12 wk); applyDeload() reduces sets + tags the day so the
// render layer can show a deload banner. Applied to EVERY getProgram path.
// ═══════════════════════════════════════════════════════
const DELOAD_TABLE = { 4:[4], 5:[5], 6:[6], 7:[7], 8:[4,8], 9:[5,9], 10:[5,10], 11:[5,10], 12:[4,8,12] };
// Lengths 13-24 (onboarding accepts 4-24; tandem.html ob-weeks min=4 max=24) are NOT in the
// spec Part B table — Parts D-H are unrecoverable and NEVER cited. So the fallback is derived
// from D4's cadence principle instead: split T into k = floor(T/4) blocks of 4-6 weeks and
// deload each block's final week, remainder front-loaded (longer blocks first).
// This is not invented: it REPRODUCES the Part B table verbatim for T = 4,5,6,7,8,9,10,12
// (including the non-obvious 9→[5,9] and 10→[5,10]), diverging only at T=11 — the one length
// D14 already documents as the exception. So DELOAD_TABLE stays authoritative and is consulted
// first; the derivation only governs the range the spec never covered.
// The old fallback (`for w=4; w<T; w+=4` then add T) produced back-to-back deloads at
// T=13 [4,8,12,13], T=17 [4,8,12,16,17], T=21 [4,8,12,16,20,21] — a 1-week gap, violating D4's
// "every 4-6 weeks" lower bound. (EPIC-033 F2.)
function deloadWeeks(weeks) {
  const T = Number(weeks) || 12;
  if (DELOAD_TABLE[T]) return new Set(DELOAD_TABLE[T]);
  const k = Math.floor(T / 4);
  if (k < 1) return new Set([T]);                  // sub-4wk: one block → deload the final week
  const base = Math.floor(T / k), rem = T % k;     // block lengths ∈ [4,6], remainder front-loaded
  const s = new Set();
  let w = 0;
  for (let i = 0; i < k; i++) { w += base + (i < rem ? 1 : 0); s.add(w); }
  return s;
}

// ═══════════════════════════════════════════════════════
// PRIMARY-COMPOUND BLOCKS — doctrine D15 (amended 2026-08-05, EPIC-033 Step 4b)
// Notion: D15 amendment page 3b3ca37f935b8100bba6c1ebb2c9ddf8
// ═══════════════════════════════════════════════════════
// D15 used to read "primary compounds are FIXED for the whole program", and pick()
// implemented that literally (block = 0, forever). That sentence was written when
// onboarding capped at 12 weeks, and its own citation is narrower than the sentence:
// Spec Part A records "compounds fixed 8-12wk MINIMUM, which for a <=12wk Tandem
// program IS the whole program." Onboarding now accepts 4-24 (EPIC-033 F1), so at
// T > 12 "whole program" stopped being a restatement of the 8-12wk figure and became
// an extrapolation past it — a 24-week program ran ONE squat variation for 24 weeks.
// Kerwin's ruling 2026-08-05: "Primaries refresh every 8-12wk."
//
// FLAGGED, not laundered: 8-12wk is a FLOOR in every source that states it (RP's own
// guidance is performance-triggered — "if you are still hitting PRs on the exercise
// ... don't change it" — not calendar-triggered). No source supplies a CEILING. The
// ceiling is Kerwin's product ruling. Where floor and ceiling conflict, floor wins.
//
// The partition is therefore derived from two rules already in force, with no free
// parameters: (1) D1 — selection refreshes only at a MESOCYCLE boundary, so a primary
// block is a whole number of mesocycles and starts the week after a deload week;
// (2) the D15 floor — a primary block is never shorter than MIN_PRIMARY_BLOCK weeks.
// Greedy: close the block at the first mesocycle boundary where the block is already
// >=8wk AND >=8wk would still remain; absorb a short tail rather than ship it.
//
// Consequences (verified by running, see the doctrine gate):
//   T <= 15 -> exactly ONE block. No partition into two >=8wk blocks exists at 13/14/15
//              (9+4, 10+4, 10+5), so "fixed for the whole program" is now DERIVED for
//              every length that shipped before EPIC-033. Nothing changes at T <= 12.
//   T 16-24 -> two or three blocks, each 8-12wk, EXCEPT T=23 -> 10+13: its mesocycles
//              are 5,5,5,4,4 and no cut yields two blocks both in [8,12]; cutting again
//              would ship a 4-week primary block, below the cited floor. Documented
//              overshoot, and the gate asserts it is the ONLY one in 4-24.
const MIN_PRIMARY_BLOCK = 8;
function primaryBlockStarts(weeks) {
  const T = Math.max(1, Number(weeks) || 12);
  const boundaries = [...deloadWeeks(T)].sort((a, b) => a - b).filter(w => w < T).map(w => w + 1);
  const starts = [1];
  let blockStart = 1;
  for (const s of boundaries) {
    const done = s - blockStart;   // weeks already spent in the open block
    const left = T - s + 1;        // weeks that would remain if we cut here
    if (done >= MIN_PRIMARY_BLOCK && left >= MIN_PRIMARY_BLOCK) { starts.push(s); blockStart = s; }
  }
  return starts;
}
function primaryBlockIndex(week, weeks) {
  const w = Math.max(1, Number(week) || 1);
  const starts = primaryBlockStarts(weeks);
  let i = 0;
  while (i + 1 < starts.length && starts[i + 1] <= w) i++;
  return i;
}

// A REALIZATION week is the special case of a deload that also happens to be the
// program's very last week — there's no next block to recover into, so a light
// recovery week wastes the one chance to let the lifter express/test the strength
// the cycle actually built. Instead: same reduced volume as a deload, but HIGH
// intensity + LOW reps (a genuine top single/triple/five), not a light week.
// Kerwin, 2026-07-23: "Why would week 12 of a build muscle plan be a deload, instead
// of an all out max week?" — the spec's Part B already named this exact pattern for
// the 11wk program ("Wk11 peak/test week, top singles/triples") but never extended
// it to the other 8 lengths, all of which currently end their ENTIRE program on a
// deload (4,5,6,7,8,9,10,12 — everything except 11, which was never a deload week
// at all and needs no change here). This generalizes that already-approved concept.
function realizationWeek(weeks) {
  const T = Number(weeks) || 12;
  const dw = [...deloadWeeks(T)];
  if (!dw.length) return null;
  const last = Math.max(...dw);
  return last === T ? T : null;
}
// ── SUPERSETS — Periodization spec Part C + 5-Goal Taxonomy + doctrine D5 ───────
// Per goal, per the taxonomy + science: supersets pair NON-primary work for time
// efficiency + metabolic demand, and NEVER touch the primary compound block.
//   transform → antagonist supersets, 60s rest (recomp: strength + metabolic)
//   fat_burn  → circuit-style supersets, 30s rest (high-rep, EPOC — its DEFINITION)
//   build_muscle → none by default (optional on accessories; not required, and
//                  changing it would reshuffle in-flight programs). strength (later)
//                  forbids supersets on primary lifts specifically (future D8).
// Applied as a uniform post-process so it covers EVERY day-count path identically.
// Each "Accessory Block" splits into paired "Superset A/B" blocks that the render
// layer's coach-tip recognizes ("perform both back-to-back"). Odd leftover stays a
// plain accessory. Returns NEW objects — no mutation of shared bases.
const SUPERSET_CFG = { transform: { rest: 60 }, fat_burn: { rest: 30 } };
function pairIntoSupersets(exs, rest) {
  const out = [];
  let g = 0;
  for (let i = 0; i < exs.length; i += 2) {
    const pair = exs.slice(i, i + 2);
    if (pair.length === 2) {
      const letter = String.fromCharCode(65 + g++);
      // authoredRest, not rest. This is the ONE deviation from PHASES the sources
      // actually license: the 5-Goal Taxonomy makes rest length part of what a
      // superset IS ("circuit-style, short rest" defines Fat Burn; "antagonist
      // pairing, moderate rest" defines Transform), so pairing two lifts without
      // shortening the rest is not a superset, it is just two lifts.
      // `rest` alone was invisible — the render layer reads only authoredRest — so
      // a fat_burn superset labelled "Rest 30 sec" was rendering its lines at 45s,
      // silently erasing the very property that made it a fat_burn superset.
      // `rest` is kept alongside for the authored-template shape, which carries both.
      out.push({ label: `Superset ${letter} · Rest ${rest} sec`, superset: true, exs: pair.map(e => ({ ...e, supersetGroup: letter, rest, authoredRest: rest })) });
    } else {
      out.push({ label: 'Accessory Block', exs: pair.map(e => ({ ...e })) });
    }
  }
  return out;
}
// honorAuthoredRest — promotes a HAND-AUTHORED `rest` into the render layer's only
// override channel. Scoped deliberately to the static emergency-fallback base and to
// the seeded-template path, never to generated days: on those two paths a human wrote
// the number AND wrote the matching block heading ("Compound Block · Rest 75 sec"), so
// discarding it made the heading false. Generated days have no author and no heading
// number, so they resolve from PHASES and must stay that way.
function honorAuthoredRest(program) {
  if (!Array.isArray(program)) return program;
  return program.map(day => ({ ...day, blocks: (day.blocks || []).map(b => ({
    ...b, exs: (b.exs || []).map(e => e && e.rest != null && e.authoredRest == null
      ? { ...e, authoredRest: e.rest } : e),
  })) }));
}
function applySupersets(program, goal) {
  const cfg = SUPERSET_CFG[goal];
  if (!cfg || !Array.isArray(program)) return program;
  return program.map(day => {
    const blocks = [];
    for (const b of (day.blocks || [])) {
      if (b.cardio || !/accessor/i.test(b.label || '') || (b.exs || []).length < 2) { blocks.push(b); continue; }
      blocks.push(...pairIntoSupersets(b.exs, cfg.rest));
    }
    return { ...day, blocks };
  });
}
function applyDeload(program, rotation, weeks) {
  const wk = rotation && Number(rotation.week);
  if (!Array.isArray(program) || !wk || !deloadWeeks(weeks).has(wk)) return program;
  const isRealization = wk === realizationWeek(weeks);
  // Return NEW objects — never mutate the shared static bases.
  return program.map(day => ({
    ...day,
    deload: !isRealization,
    realization: isRealization,
    label: /deload|realization/i.test(day.label || '') ? day.label : `${day.label} · ${isRealization ? 'Realization' : 'Deload'}`,
    rationale: (isRealization
      ? `REALIZATION WEEK — this is what the last block built. Fewer sets, but push for a real top single/triple/five near your max. `
      : `DELOAD WEEK — volume cut ~50%, load held. Recovery is the training stimulus this week; do not chase new PRs. `
    ) + (day.rationale || ''),
    blocks: (day.blocks || []).map(b => b.cardio ? b : ({
      ...b,
      exs: (b.exs || []).map(e => ({ ...e, sets: Math.max(2, Math.ceil((e.sets || 3) / 2)), deload: !isRealization, realization: isRealization })),
    })),
  }));
}

// ═══════════════════════════════════════════════════════
// EPIC-031 — AUTHORED PROGRAM MATERIALIZER
// materializeTemplate(tpl, week) → same day-array shape getProgram() emits, so
// the entire render layer (buildDayHTML, tabs, logging, PRs) works unchanged.
// `tpl` is the seed/DB shape: { template:{...}, blocks:[{week_start..week_end,
// rep_scheme_by_week, technique_by_week, days:[{day_order,label,exercises:[...]}]}] }.
// Doctrine: SAFETY invariants are guaranteed upstream by the D16 gate + DB
// trigger (compound-first ordering, slug integrity, technique placement).
// The remaining two SAFETY invariants — injury filter and equipment tier —
// CANNOT be guaranteed upstream, because they depend on the user, not the
// template. They are enforced here, by applySafetyFilter() below. Before
// 2026-08-04 they were enforced nowhere on this path (BUG-59): an adopted
// program handed the user whatever the author wrote, regardless of their
// injuries or the equipment they actually have. 360 of 504 seed×week×tier×
// injury combos leaked a contraindicated lift. scripts/authored-safety-smoke.mjs
// is the permanent guard; it is a `npm run verify` check and it fails hard.
// SCIENCE_DEFAULT deload/realization shape (D4/D14) still applies here via
// applyDeload — authored programs share the global deload calendar unless a
// future science_overrides key says otherwise (none of the seeds override it).
// Techniques (rest_pause / drop_set / cardioacceleration) surface as ex.technique
// ONLY on weeks the block schedules them — the render layer shows them as
// coached instructions. Weights are light defaults; the render layer overrides
// from PRs/calibration exactly as it does for generated days.
//
// EXPERIENCE TIER (integration decision, 2026-07-31, porting EPIC-031 onto a
// main that had since gained EPIC-8a): authored programs deliberately do NOT
// receive the advanced-tier flagDropSet() injection. flagAdvanced() is applied
// inside getProgram()'s generated return path only; this function returns
// straight through applyDeload and never reaches it. That is intended, not an
// oversight. flagDropSet targets blocks matching /accessory|arms/i and authored
// blocks are phase-named ("Phase 2 — Build"), so it would no-op regardless; more
// importantly, the seeds already schedule their own techniques per week and run
// clean on deload weeks. Injecting an extra drop set would overwrite the
// author's deliberate D4/D14 deload shape that this materializer exists to
// preserve. Experience level still governs the generated engine unchanged.
// ═══════════════════════════════════════════════════════
const TEMPLATE_DAY_COLORS = ['var(--red)', 'var(--blue)', 'var(--amber)', 'var(--teal,#38d9c0)', 'var(--purple,#a78bfa)', 'var(--orange)'];

// authoredSlotFor(bank, tier, injuryBlocked, injuries) → { entry, substitutedFrom } | null
//   SAFETY resolution for ONE authored exercise slot (BUG-59). Returns the bank
//   entry to actually use, which may not be the one the author wrote.
//
//   SUBSTITUTE-FIRST, DROP AS FALLBACK (Kerwin's call, 2026-08-04). An authored
//   program is an expert's expression, not a bag of lifts: D15 marks some lifts
//   `constant_across_program` precisely because they anchor progression for all
//   12 weeks. Dropping one of those breaks the spine the program is built on, so
//   we try to keep the SLOT filled with a legal equivalent first, and only drop
//   when the bank offers nothing legal. Dropping is the generated path's
//   behaviour (pruneInjuries), so it remains the floor, never the first move.
//
//   An unknown slug (not in EXERCISE_BANK) is passed through untouched — slug
//   integrity is D16's job and failing it here would mask that gate.
function authoredSlotFor(bank, tier, injuries, injuryBlocked) {
  if (!bank || !bank.name) return { entry: bank, substitutedFrom: null }; // unknown slug — D16's problem
  const tierOrder = ['home', 'hotel_gym', 'full_gym'];
  const reqIdx = tierOrder.indexOf(tier || 'full_gym');
  const legal = (e) =>
    e && e.name &&
    !injuryBlocked(e.name) &&
    tierOrder.indexOf(e.tier) <= reqIdx;

  if (legal(bank)) return { entry: bank, substitutedFrom: null };

  // 1st choice: getExerciseSubstitutes — screens on category, shared primary
  // muscle group, tier AND injuries. Reuse, don't reimplement.
  const subs = getExerciseSubstitutes(bank.name, tier, injuries, 5) || [];
  const sameCategory = subs.find(legal);
  if (sameCategory) return { entry: sameCategory, substitutedFrom: bank.name };

  // 2nd choice: same muscle, ANY category. Measured, not assumed — at `home`
  // tier the bank has no compound sharing Barbell Overhead Press's delt
  // primaries, so a same-category search returns nothing and the program's
  // D15 anchor for that day would be dropped entirely. Band Lateral Raise
  // still trains the muscle the author was targeting and keeps the slot (and
  // the day's shape) intact. Relaxing category beats losing the anchor.
  const primary = (bank.muscleGroups && bank.muscleGroups.primary) || [];
  if (primary.length) {
    const wider = Object.values(EXERCISE_BANK).filter(e =>
      e.name !== bank.name && legal(e) &&
      ((e.muscleGroups && e.muscleGroups.primary) || []).some(g => primary.includes(g)));
    if (wider.length) return { entry: wider[0], substitutedFrom: bank.name };
  }

  // Nothing legal trains this muscle at this tier — drop, as the generated
  // path's pruneInjuries would.
  return null;
}

function materializeTemplate(tpl, week, opts) {
  if (!tpl || !tpl.template || !Array.isArray(tpl.blocks) || !tpl.blocks.length) return null;
  const T = Number(tpl.template.duration_weeks) || 12;
  const wk = Math.min(Math.max(Number(week) || 1, 1), T);
  const block = tpl.blocks.find(b => wk >= b.week_start && wk <= b.week_end) || tpl.blocks[tpl.blocks.length - 1];
  const weekInBlock = wk - block.week_start + 1;
  const twRaw = (block.technique_by_week || {})[weekInBlock];
  const blockTech = twRaw && twRaw !== 'none' ? twRaw : null;
  // Third copy of the starting-weight table, now routed to the one owner. This one took
  // an equipment STRING, so it could not see the exercise's name or oneRmFactor even in
  // principle — an adopted authored program prescribed a woman the male barbell default.

  // SAFETY (BUG-59). Defaults are deliberately unrestricted: a caller with no
  // user config gets the author's program verbatim, which is what the offline
  // seed round-trip tooling wants. The real call site (getActiveProgram) MUST
  // pass both, and authored-safety-smoke.mjs is what enforces that it does.
  const tier = (opts && opts.tier) || 'full_gym';
  const injuries = (opts && opts.injuries) || '';
  const injuryBlocked = makeInjuryBlocked(injuries);

  const days = (block.days || []).slice().sort((a, b) => a.day_order - b.day_order).map((d, di) => {
    const exs = (d.exercises || []).slice().sort((a, b) => a.ex_order - b.ex_order).map(ex => {
      const authored = EXERCISE_BANK[ex.slug] || {};
      const slot = authoredSlotFor(authored, tier, injuries, injuryBlocked);
      if (!slot) return null;               // nothing legal exists — drop the slot
      const bank = slot.entry || {};
      // Authored role decides this normally. But a cross-category substitute
      // (compound → isolation, when no legal compound exists at the user's
      // tier) must not keep wearing a "compound" badge — the card would be
      // telling the user something untrue about the lift in front of them.
      const compound = slot.substitutedFrom && bank.category
        ? bank.category === 'compound'
        : (ex.role === 'primary_compound' || ex.role === 'secondary_compound');
      // Prefill target = bottom of the authored range (guaranteed-rep floor);
      // the full range renders via ex.repRange.
      const low = parseInt(String(ex.reps || '').match(/\d+/)?.[0] || '10', 10);
      return {
        id: `tpl-d${d.day_order}-e${ex.ex_order}`,
        name: bank.name || ex.slug,
        badge: compound ? 'compound' : 'isolation',
        sets: ex.sets, r: low, repRange: String(ex.reps || low),
        w: seedWeight(bank, { sex: opts && opts.sex, dbCap: opts && opts.maxDb }),
        rest: ex.rest, authoredRest: ex.rest,
        compound, isCore: ex.role === 'core', role: ex.role,
        unit: bank.unit || 'reps', equipment: bank.equipment || null,
        why: bank.why || '', cues: bank.cues || [],
        // Technique lands only if BOTH the exercise carries it AND this week of
        // the block schedules it (weeks 4/8/12 run clean by authoring rule).
        technique: blockTech && ex.technique ? ex.technique : null,
        constant: ex.constant_across_program === true,
        // Never swap an expert's lift silently — the render layer surfaces this
        // as a coach note so the user knows what changed and why.
        substitutedFrom: slot.substitutedFrom,
      };
    }).filter(Boolean);
    return {
      key: `day${d.day_order}`,
      label: `Day ${d.day_order} · ${d.label}`,
      color: TEMPLATE_DAY_COLORS[di % TEMPLATE_DAY_COLORS.length],
      rationale: `${tpl.template.name} — ${block.name} (wks ${block.week_start}–${block.week_end}). `
        + ((block.rep_scheme_by_week || {})[weekInBlock] || ''),
      authored: true, templateSlug: tpl.template.slug,
      blocks: [{ label: block.name, exs }],
    };
  });
  // D4/D14: global deload/realization calendar applies to authored programs too.
  return applyDeload(days, { week: wk }, T);
}

function getProgram(goal, days, weeks, sex, equipment, emphasis, injuries, maxDb, rotation, experience) {
  const tier  = equipment || 'full_gym';
  const focus = emphasis  || 'balanced';

  const isFemale = (sex === 'F' || String(sex || '').toLowerCase() === 'f' || String(sex || '').toLowerCase() === 'female');
  const fat = goal === 'fat_burn';
  const muscle = goal === 'build_muscle';
  const transform = goal === 'transform';

  // Per-day program definitions
  const programs = {
    fat_burn: {
      4: [
        { key:'day1', label:'Day 1 · Upper Circuit', color:'var(--red)', rationale:'Upper body circuit. Minimal rest keeps heart rate elevated. Compound first, isolation finishers, cardio to close.',
          blocks:[
            {label:'Compound Block · Rest 60 sec', exs:[
              {id:'fb-bench',  name:'Low Incline Barbell Press', badge:'compound', sets:4, w:115, r:15, rest:60, compound:true,
               why:'Incline press at higher reps with short rest creates significant metabolic demand while hitting chest, anterior delt, and triceps simultaneously.',
               cues:['Retract scapulae before unracking. Hold throughout.','Bar diagonal in hand — not in the palm. Protect that grip.','Controlled 2-sec eccentric on every rep.']},
              {id:'fb-press',  name:'Arnold Press', badge:'compound', sets:3, w:25, r:15, rest:60, compound:true,
               why:'Full delt recruitment in one movement. The rotation hits all three heads — critical for shoulder development at higher reps.',
               cues:['Start palms facing you. Rotate outward as you press.','Elbows slightly in front of torso — not flared behind.','Keep core braced. No lumbar arch.']},
            ]},
            {label:'Accessory Block · Rest 45 sec', exs:[
              {id:'fb-fly',    name:'Cable Low-to-High Fly', badge:'isolation', sets:3, w:25, r:15, rest:45, compound:false,
               why:'Constant cable tension through the arc hits sternal pec with no slack at the top. Higher reps here add volume without joint stress.',
               cues:['Slight forward lean, soft elbow bend throughout.','Think elbows together — not hands.','2-sec squeeze at the top.']},
              {id:'fb-lat',    name:'Cable Lateral Raise', badge:'isolation', sets:3, w:15, r:20, rest:45, compound:false,
               why:'High rep lateral raises with short rest create maximum lateral delt pump and burn. The V-taper muscle — never skip these.',
               cues:['Lead with elbow. Pinky slightly higher than thumb.','Stop at shoulder height. Above = trap, not delt.','4-sec negative. This is where it grows.']},
              {id:'fb-push',   name:'Tricep Rope Pushdown', badge:'isolation', sets:3, w:55, r:15, rest:45, compound:false,
               why:'High-rep pushdowns with short rest create a significant metabolic demand on the tricep and elevate heart rate for the cardio finisher.',
               cues:['15° forward hinge. Removes shoulder from the movement.','Full extension at bottom. Squeeze 1 full second.','Drop 30% on final set, continue to failure.']},
            ]},
            {label:'Core Block · Rest 30 sec', exs:[
              {id:'fb-mon-db',   name:'Dead Bug', badge:'core', sets:3, w:0, r:10, rest:30, compound:false, isCore:true, unit:'reps',
               why:'McGill-approved anti-rotation movement. Forces the core to resist spinal extension while contralateral limbs move — exactly what the core does during every compound lift. Zero spinal shear.',
               cues:['Lie on back. Arms straight to ceiling, knees at 90° above hips.','Slowly lower opposite arm and leg toward floor. Lower back STAYS pressed to floor.','Return and switch. 10 per side = 1 set. Do not rush.']},
              {id:'fb-mon-rc',   name:'Reverse Crunch', badge:'core', sets:3, w:0, r:15, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Targets the rectus abdominis through hip flexion rather than spinal flexion — loads the lower portion without compressing the lumbar discs. Zero neck strain.',
               cues:['Lie flat. Bring knees to 90°.','Curl hips off the floor using the abs — not momentum.','Lower slowly. 3-sec eccentric. Do not let feet touch ground between reps.']},
            ]},
            {label:'Cardio Finisher · 25 min', cardio:true, exs:[
              {id:'fb-cardio1', name:'Incline Treadmill — Zone 2', badge:'cardio', cardioOnly:true,
               cardioDesc:'3–4% incline, 3.2–3.5 mph. Glycogen partially depleted from lifting — body is primed to pull from fat stores. This window is gold.', zone:'HR 130–150 BPM', duration:25}
            ]}
          ]
        },
        { key:'day2', label:'Day 2 · Lower Circuit', color:'var(--orange)', rationale:'Lower body fat burn day. Hip hinge + quad work with minimal rest. The legs are the largest muscle group — training them hard burns the most calories.',
          blocks:[
            {label:'Compound Block · Rest 75 sec', exs:[
              {id:'fb-rdl',  name:'Romanian Deadlift', badge:'compound', sets:4, w:115, r:15, rest:75, compound:true,
               why:'At higher reps in a fat-burn context the RDL becomes a cardio-adjacent movement. Your heart rate will be well above resting after 4 sets of 15.',
               cues:['Hip hinge — push hips back. Not down.','Bar against legs the entire descent.','Strong hamstring stretch at mid-shin. Drive hips forward at top.']},
              {id:'fb-hip',  name:'Hip Thrust', badge:'compound', sets:3, w:115, r:15, rest:75, compound:true,
               why:'Hip thrusts at 15 reps are as metabolically demanding as they are for glute development. Best glute-to-calorie-burn ratio of any lower body exercise.',
               cues:['Bench at shoulder blade base. Feet flat, shoulder-width.','Drive through full foot. 2-sec hold at top.','Chin tucked. Do not hyperextend the spine.']},
            ]},
            {label:'Accessory Block · Rest 45 sec', exs:[
              {id:'fb-curl',  name:'Lying Leg Curl', badge:'isolation', sets:3, w:85, r:15, rest:45, compound:false,
               why:'Direct hamstring isolation with constant tension. Short rest creates a significant pump and elevates HR for the cardio transition.',
               cues:['Hips pressed into pad throughout. No lifting.','Full extension every rep — full stretch matters.','3-sec eccentric. This is the growth signal.']},
              {id:'fb-ext',   name:'Leg Extension', badge:'isolation', sets:3, w:65, r:20, rest:45, compound:false,
               why:'High-rep leg extensions at short rest are metabolically brutal. VMO isolation — the teardrop quad that shows composition change first.',
               cues:['Pad at base of shin, not on foot.','Full extension, 1-sec squeeze at top.','Slow controlled return. No crashing.']},
              {id:'fb-calf1', name:'Standing Calf Raise', badge:'isolation', sets:3, w:160, r:20, rest:45, compound:false,
               why:'Calves respond to volume. High reps, short rest, full range. The stretch at the bottom is mandatory.',
               cues:['Full hang at bottom, 1-sec pause. Full rise at top, 1-sec pause.','No bouncing. Own every inch of the range.']},
            ]},
            {label:'Core Block · Rest 30 sec', exs:[
              {id:'fb-tue-be',   name:'Back Extension', badge:'core', sets:3, w:0, r:15, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Posterior chain core work pairs perfectly with hip hinge days. Erector spinae and multifidus are the core\'s "back wall" — undertrained in almost every ab program. Direct erector work reduces lower back injury risk by 30–40% in studies.',
               cues:['Brace abs before initiating. Neutral spine throughout.','Rise until body is straight — not hyperextended.','2-sec hold at top. 3-sec controlled lower.']},
              {id:'fb-tue-sp',   name:'Side Plank', badge:'core', sets:3, w:0, r:35, rest:30, compound:false, isCore:true, unit:'sec',
               why:'McGill Big 3 staple — the only exercise that loads the lateral core (quadratus lumborum and obliques) without spinal compression. Anti-lateral flexion strength directly transfers to stability in every loaded carry and hinge movement.',
               cues:['Elbow under shoulder. Hips stacked. Body in one straight line.','Drive hips up — do not sag.','Hold 35 sec each side. Rest 30 sec between sides.']},
            ]},
            {label:'Cardio Finisher · 25 min', cardio:true, exs:[
              {id:'fb-cardio2', name:'Stationary Bike — Zone 2', badge:'cardio', cardioOnly:true,
               cardioDesc:'Preferred post-leg. Keeps hips and quads moving without impact that would worsen DOMS. Low resistance, steady cadence.', zone:'HR 125–145 BPM', duration:25}
            ]}
          ]
        },
        { key:'day3', label:'Day 3 · Upper Burn', color:'var(--red)', rationale:'Second upper session. Pull-dominant to balance the first upper day. Bicep work earns its spot at the end.',
          blocks:[
            {label:'Compound Block · Rest 60 sec', exs:[
              {id:'fb-pull', name:'Lat Pulldown', badge:'compound', sets:4, w:90, r:15, rest:60, compound:true,
               why:'Lat pulldown at short rest hits the largest upper body muscle and creates significant metabolic demand. Neutral grip for full range and shoulder safety.',
               cues:['Lean 10–15 degrees back. Correct angle.','Lead with elbows — into back pockets.','Full dead hang at top. Earn the stretch.']},
              {id:'fb-row',  name:'Seated Cable Row', badge:'compound', sets:4, w:95, r:15, rest:60, compound:true,
               why:'Wide overhand grip for upper back and rear delt emphasis — the muscles that make you look athletic in a shirt.',
               cues:['Torso upright or slight forward lean. No rocking.','Elbows wide and high. Handle to lower sternum.','Full scapular protraction between each rep.']},
            ]},
            {label:'Accessory Block · Rest 45 sec', exs:[
              {id:'fb-face', name:'Face Pull', badge:'isolation', sets:3, w:30, r:20, rest:45, compound:false,
               why:'Non-negotiable shoulder health work. Counters the internal rotation load from every pressing movement in this program.',
               cues:['Pull to ears — not chin. End position: hands behind ears.','Externally rotate at the end. Elbows wide.','Weight is light. This is corrective, not strength.']},
              {id:'fb-curl', name:'Incline DB Curl', badge:'isolation', sets:3, w:20, r:15, rest:45, compound:false,
               why:'Stretch-position curl creates greater bicep hypertrophy stimulus than standing curl. At 15 reps with 45 sec rest, the pump is substantial.',
               cues:['Arms hang straight at start. Shoulder stays back.','Supinate through the curl. Pinky up.','3-sec slow negative. The stretch is the point.']},
              {id:'fb-ham',  name:'Hammer Curl', badge:'isolation', sets:3, w:30, r:15, rest:45, compound:false,
               why:'Brachialis development — sits underneath the bicep and physically pushes it up. The arm-size muscle most people never train.',
               cues:['Elbow pinned to side. No front delt drift.','Strict alternating — complete one before starting the other.','Full extension at bottom.']},
            ]},
            {label:'Core Block · Rest 30 sec', exs:[
              {id:'fb-thu-cc',   name:'Cable Crunch', badge:'core', sets:3, w:40, r:15, rest:30, compound:false, isCore:true, unit:'reps',
               why:'The only weighted core flexion exercise with direct progressive overload capability. Cable provides constant tension through the full range — eliminates the slack point at the bottom that bodyweight crunches have. Primary rectus abdominis development.',
               cues:['Kneel facing cable. Rope attachment at forehead.','Crunch DOWN, not forward. Elbows toward knees.','Hold 1 sec at bottom. Slow return. Weight is secondary to feel.']},
              {id:'fb-thu-bd',   name:'Bird Dog', badge:'core', sets:3, w:0, r:10, rest:30, compound:false, isCore:true, unit:'reps',
               why:'McGill Big 3 exercise — simultaneously trains lumbar extensors, glute max, and contralateral rotator coordination. Unique in that it builds core stability and erector strength simultaneously without any spinal compression.',
               cues:['On all fours. Hands under shoulders, knees under hips.','Extend opposite arm and leg. Back stays level — no rotation.','5-sec hold at full extension. 10 per side = 1 set.']},
            ]},
            {label:'Cardio Finisher · 25 min', cardio:true, exs:[
              {id:'fb-cardio3', name:'Elliptical or Rower', badge:'cardio', cardioOnly:true,
               cardioDesc:'Upper pull day — elliptical preferred. Full-body movement keeps total burn high without stressing the fatigued back.', zone:'HR 130–150 BPM', duration:25}
            ]}
          ]
        },
        { key:'day4', label:'Day 4 · Lower Burn', color:'var(--orange)', rationale:'Final lower session. Squat pattern + accessory work. End with Zone 2 to close the training week and protect the weekend recovery.',
          blocks:[
            {label:'Compound Block · Rest 75 sec', exs:[
              {id:'fb-hack', name:'Hack Squat', badge:'compound', sets:4, w:160, r:15, rest:75, compound:true,
               why:'At your frame, hack squat is the superior quad compound. Guided path means 100% of effort goes into the muscle. Machine removes the balance tax of barbell.',
               cues:['Feet mid-platform, shoulder-width, 20–30° toe-out.','Below parallel. Partial reps = partial development.','3-sec eccentric. No lockout at top — keep tension.']},
              {id:'fb-bss',  name:'Bulgarian Split Squat', badge:'compound', sets:3, w:20, r:12, rest:75, compound:true,
               why:'Single-leg work catches imbalances. Hip flexor stretch on rear leg addresses the tightness that desk work creates. Lower total load, same stimulus.',
               cues:['Rear foot elevated. Front foot far enough for vertical shin.','Descend straight down — elevator, not lean.','Start lighter than you think. Balance resolves fast.']},
            ]},
            {label:'Accessory Block · Rest 45 sec', exs:[
              {id:'fb-abd',   name:'Abductor Machine', badge:'isolation', sets:3, w:85, r:20, rest:45, compound:false,
               why:'Glute medius is the most undertrained muscle in most men\'s programs. It stabilizes every compound lower body movement. When it\'s weak, your knees and lower back know it.',
               cues:['Slight forward lean — takes TFL out, puts load on glute med.','Full range, full hold at end position.','Control the return. No slamming.']},
              {id:'fb-calf2', name:'Seated Calf Raise', badge:'isolation', sets:3, w:80, r:20, rest:45, compound:false,
               why:'Soleus work — different muscle than standing calf. Bent knee removes gastrocnemius. Deep calf with its own hypertrophy potential.',
               cues:['Pad just above knee on lower quad.','Full stretch, full rise, pause at both ends.']},
            ]},
            {label:'Core Block · Rest 30 sec', exs:[
              {id:'fb-fri-hkr',  name:'Hanging Knee Raise', badge:'core', sets:3, w:0, r:12, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Hip flexion with a loaded hanging position — one of the highest-activation exercises for the rectus abdominis and hip flexors. The shoulder girdle also works to maintain the hang. Decompresses the spine after a heavy squat session.',
               cues:['Hang from bar with full shoulder extension.','Raise knees to hip height or above — controlled.','Lower slowly. 3-sec eccentric. No swinging.']},
              {id:'fb-fri-pl',   name:'Plank', badge:'core', sets:3, w:0, r:45, rest:30, compound:false, isCore:true, unit:'sec',
               why:'Anti-extension baseline — the standard measure of core endurance. Research shows 45-second holds outperform longer holds for muscle activation efficiency. Closing the training week with a stability finisher reinforces the bracing pattern for weekend recovery.',
               cues:['Forearms under shoulders. Hips level — not sagging or piked.','Squeeze glutes and quads. Brace abs as if taking a punch.','Breathe. Do not hold breath. Full breaths throughout.']},
            ]},
            {label:'Cardio Finisher · 25 min', cardio:true, exs:[
              {id:'fb-cardio4', name:'Bike — Easy Zone 2', badge:'cardio', cardioOnly:true,
               cardioDesc:'End of training week. Low resistance. Protect the weekend recovery window. Slightly lower HR target today.', zone:'HR 115–135 BPM', duration:25}
            ]}
          ]
        }
      ],
      3: [], // generated below
      5: []
    },
    build_muscle: {
      4: [
        { key:'day1', label:'Day 1 · Upper A', color:'var(--accent)', rationale:'Push-dominant upper day. Horizontal and vertical press when CNS is freshest. Triceps finish because they are pre-fatigued from pressing.',
          blocks:[
            {label:'Compound Block · Rest 2 min', exs:[
              {id:'bm-bench', name:'Low Incline Barbell Press', badge:'compound', sets:4, w:140, r:10, rest:120, compound:true,
               why:'30° incline is mechanically superior for taller lifters. Keeps chest as primary driver through full ROM. Safer shoulder angle than flat or 45°.',
               warning:svgIcon('alert')+' GRIP: Bar across the base of fingers — diagonal, low pinky side. Use wrist wraps. Switch to DB if palm pain fires.',
               cues:['Scapulae retracted and depressed before unracking.','Bar path diagonal: touches nipple line, drives to above collarbone.','3-second eccentric every rep — the negative builds more than the concentric.','Drive feet into the floor. Leg drive transfers through the chain.']},
              {id:'bm-press', name:'Arnold Press', badge:'compound', sets:3, w:40, r:10, rest:120, compound:true,
               why:'All three delt heads in one movement. The rotation from supinated to pronated recruits anterior, lateral, and posterior fibers across the arc.',
               cues:['Palms facing you at chin. Rotate outward as you press.','Elbows slightly in front of torso plane at all times.','No aggressive lumbar arch — brace and stay neutral.']},
            ]},
            {label:'Accessory Block · Rest 75 sec', exs:[
              {id:'bm-fly',  name:'Cable Low-to-High Fly', badge:'isolation', sets:3, w:35, r:12, rest:75, compound:false,
               why:'Cable maintains constant tension through the full arc. Targets sternal pec. Dumbbells go slack at the top — cable does not.',
               cues:['Slight forward lean, soft elbow bend throughout.','Bring elbows together — hands are passengers.','2-sec full squeeze at the top.']},
              {id:'bm-lat',  name:'Cable Lateral Raise', badge:'isolation', sets:3, w:25, r:15, rest:60, compound:false,
               why:'Lateral delt is the V-taper muscle. At 6\'3" building this makes body composition changes visible even at higher bodyweight.',
               cues:['Cable at ankle. Arm crosses body at start.','Lead with elbow — pinky slightly higher than thumb.','Stop at shoulder height. 4-sec negative.']},
              {id:'bm-ohe',  name:'Tricep Overhead Extension', badge:'isolation', sets:3, w:65, r:12, rest:75, compound:false,
               why:'The long head is 55% of tricep mass — only fully activated in overhead position. Most programs only do pushdowns and leave half the tricep untrained.',
               cues:['Elbows narrow, pointed forward, stay there throughout.','Only forearm moves. Upper arm stays pinned overhead.','Full stretch before driving up.']},
              {id:'bm-push', name:'Tricep Rope Pushdown', badge:'isolation', sets:3, w:80, r:12, rest:75, compound:false,
               why:'Lateral and medial head isolation after overhead ext has burned out the long head. Final set: drop 30%, continue to failure.',
               cues:['15° forward hinge.','Full extension, hard squeeze.','Drop set final set only.']},
            ]},
            {label:'Core Block · Rest 45 sec', exs:[
              {id:'bm-mon-cc',   name:'Cable Crunch', badge:'core', sets:3, w:50, r:12, rest:45, compound:false, isCore:true, unit:'reps',
               why:'Only weighted core exercise with direct progressive overload potential. Cable constant tension eliminates the slack at bottom that bodyweight crunches have. For hypertrophy, this is the ab equivalent of a curl — the rectus abdominis needs load to grow.',
               cues:['Kneel facing cable. Rope at forehead.','Crunch DOWN toward knees — elbows to thighs.','1-sec hold at bottom. Slow 3-sec return. Feel every inch.']},
              {id:'bm-mon-db',   name:'Dead Bug', badge:'core', sets:3, w:0, r:10, rest:45, compound:false, isCore:true, unit:'reps',
               why:'Builds the transverse abdominis and deep stabilizers that no crunching exercise reaches. These muscles are the internal brace that protects the spine under heavy compound loads — critical on press days.',
               cues:['Lie on back. Arms to ceiling, knees 90° above hips.','Opposite arm + leg lower toward floor. Back FLAT throughout.','5-sec descent, slow return. 10 per side = 1 set.']},
            ]},
            {label:'Zone 2 Finisher · 20 min', cardio:true, exs:[
              {id:'bm-c1', name:'Incline Treadmill Walk', badge:'cardio', cardioOnly:true,
               cardioDesc:'3–4% incline. Post-lift fat oxidation window. Glycogen depleted = body pulling from fat stores right now.', zone:'HR 120–145 BPM', duration:20}
            ]}
          ]
        },
        { key:'day2', label:'Day 2 · Lower A', color:'var(--blue)', rationale:'Hip hinge dominant lower day. Posterior chain focus. Intentionally not a squat day — spacing hinge and squat sessions gives 72 hours between lower sessions.',
          blocks:[
            {label:'Compound Block · Rest 2–3 min', exs:[
              {id:'bm-rdl', name:'Romanian Deadlift', badge:'compound', sets:4, w:135, r:8, rest:150, compound:true,
               why:'Constant hamstring tension throughout. No slack point unlike conventional deadlift. Safer spinal load at higher bodyweights.',
               cues:['Push hips back — not down. Close car door with your butt.','Bar against legs the entire descent.','Hamstring stretch at mid-shin for taller lifters.','Drive hips forward at top. Full glute lockout.']},
              {id:'bm-hip',  name:'Hip Thrust', badge:'compound', sets:3, w:135, r:10, rest:120, compound:true,
               why:'Greatest glute EMG activation of any exercise. Fully shortened position is unique — squats and deadlifts never achieve it. Primary movement, not a finisher.',
               cues:['Bench edge at shoulder blades. Feet flat, shoulder-width.','Drive through full foot — not just heel.','Level hips at top. 2-sec hold every rep. Non-negotiable.']},
            ]},
            {label:'Accessory Block · Rest 75 sec', exs:[
              {id:'bm-curl', name:'Lying Leg Curl', badge:'isolation', sets:3, w:100, r:10, rest:75, compound:false,
               why:'Knee flexion hits short head of bicep femoris that RDL barely touches. Both hamstring functions need training.',
               cues:['Hips into pad. Any lift = glute compensating.','Full extension every rep.','3-sec eccentric — this is the growth signal.']},
              {id:'bm-slc',  name:'Seated Leg Curl', badge:'isolation', sets:3, w:75, r:10, rest:75, compound:false,
               why:'Seated leg curl places the hamstring at a stretched starting length — greater hypertrophy signal than lying curl alone. This completes the hamstring picture: RDL covers the hip-extension function, seated curl covers the knee-flexion function from a lengthened position.',
               cues:['Sit upright. Back against pad.','Full extension at start — earn the stretch.','3-sec eccentric. This is the growth signal.','Do not let hips lift off seat — that is the glute stealing the work.']},
              {id:'bm-calf1',name:'Standing Calf Raise', badge:'isolation', sets:4, w:170, r:20, rest:45, compound:false,
               why:'Calves are slow-twitch dominant — they respond to volume, not heavy loading. High reps, short rest, full range.',
               cues:['Full hang at bottom, 1-sec pause. Full rise at top, 1-sec pause.','Alternate toe angles across sets for full development.']},
            ]},
            {label:'Core Block · Rest 45 sec', exs:[
              {id:'bm-tue-be',   name:'Back Extension', badge:'core', sets:3, w:0, r:15, rest:45, compound:false, isCore:true, unit:'reps',
               why:'Posterior core on a posterior chain day — intentional pairing. The erector spinae and multifidus are as much "core" as the rectus abdominis. On RDL/hip thrust days they are already warm. Direct erector training creates the muscular symmetry that prevents the forward lean breakdown point in heavy compounds.',
               cues:['Neutral spine at start. Brace before moving.','Rise until body is in a straight line. Not hyperextended.','2-sec hold. 3-sec lower. Add a 25 lb plate to chest when 15 feels easy.']},
              {id:'bm-tue-hlr',  name:'Hanging Leg Raise', badge:'core', sets:3, w:0, r:10, rest:45, compound:false, isCore:true, unit:'reps',
               why:'The most progressive hip-flexion core exercise available. Full range from dead hang to legs parallel (or above) provides superior lower rectus and hip flexor stimulus over any ground-based alternative. Traction effect decompresses lumbar after heavy deadlifts.',
               cues:['Dead hang from bar. Shoulders depressed.','Raise legs straight (or slightly bent) to parallel or above.','3-sec lowering phase — slow negatives build the most here.']},
            ]},
            {label:'Zone 2 Finisher · 20 min', cardio:true, exs:[
              {id:'bm-c2', name:'Stationary Bike', badge:'cardio', cardioOnly:true,
               cardioDesc:'Post leg day — bike over treadmill. Keeps hips and quads moving, aids DOMS recovery without impact.', zone:'HR 120–145 BPM', duration:20}
            ]}
          ]
        },
        { key:'day3', label:'Day 3 · Upper B', color:'var(--green)', rationale:'Pull-dominant upper day. Rear delts are treated as a priority here — undertrained in almost every program that doesn\'t make them explicit. Critical for posture and shoulder health.',
          blocks:[
            {label:'Compound Block · Rest 2 min', exs:[
              {id:'bm-pull', name:'Lat Pulldown', badge:'compound', sets:4, w:110, r:10, rest:120, compound:true,
               why:'Neutral grip allows fuller ROM, reduces rotator cuff strain, keeps bicep in stronger position throughout. Replaces behind-neck permanently.',
               cues:['Lean back 10–15 degrees. Correct body angle.','Lead with elbows — into back pockets.','Full dead hang at top. Earn the lat stretch.','Chest up throughout.']},
              {id:'bm-row',  name:'Seated Cable Row', badge:'compound', sets:4, w:120, r:10, rest:120, compound:true,
               why:'Wide overhand grip: rhomboids, lower traps, rear delts — the muscles responsible for posture improvement visible in a suit or dress shirt.',
               cues:['Torso upright or slight lean — do not rock.','Elbows wide and high. Handle to lower sternum.','Full scapular protraction between reps.']},
            ]},
            {label:'Accessory Block · Rest 75 sec', exs:[
              {id:'bm-dbr',  name:'Single-Arm DB Row', badge:'isolation', sets:3, w:70, r:10, rest:75, compound:false,
               why:'Unilateral work catches the dominant-side compensation that bilateral rows mask. Your back has imbalances — this surfaces and fixes them.',
               cues:['Row to hip, not chest. Hip path = lat. Chest path = upper trap.','Let shoulder drop at bottom — full protraction.','Rotate torso slightly at top for full retraction.']},
              {id:'bm-face', name:'Face Pull', badge:'isolation', sets:3, w:35, r:20, rest:45, compound:false,
               why:'Mandatory shoulder longevity work. External rotation under load counters the internal rotation torque created by every push in this program.',
               cues:['Pull to ears specifically.','End position: hands behind ears, elbows wide.','Light weight. Corrective movement, not strength.']},
              {id:'bm-icurl',name:'Incline DB Curl', badge:'isolation', sets:3, w:27, r:12, rest:75, compound:false,
               why:'Stretch-position loading produces significantly greater hypertrophy than shortened position. The incline loading the bicep at full stretch is why this beats standing curl.',
               cues:['Arms hang straight. Shoulder stays back.','Supinate through curl — pinky up.','3-sec slow negative.']},
              {id:'bm-ham',  name:'Hammer Curl', badge:'isolation', sets:3, w:35, r:12, rest:75, compound:false,
               why:'Brachialis — underneath the bicep, physically pushes it up. Requires neutral grip. Does not respond to supinated curls. This is where arm size comes from.',
               cues:['Elbow pinned to side.','Strict alternating.','Full extension at bottom.']},
            ]},
            {label:'Core Block · Rest 45 sec', exs:[
              {id:'bm-thu-aw',   name:'Ab Wheel Rollout', badge:'core', sets:3, w:0, r:8, rest:45, compound:false, isCore:true, unit:'reps',
               why:'The gold standard anti-extension exercise — higher rectus abdominis and oblique activation than almost any other movement. Forces the entire anterior chain to resist extension under full body-length leverage. Progressive: as core strengthens, range increases.',
               cues:['Start kneeling. Arms straight, wheel under shoulders.','Roll out slowly — lower back stays neutral the entire time.','Go only as far as you can without your back arching. Pull wheel back.']},
              {id:'bm-thu-pp',   name:'Pallof Press', badge:'core', sets:3, w:30, r:12, rest:45, compound:false, isCore:true, unit:'reps',
               why:'The most effective anti-rotation exercise with loadable, progressive resistance. Cable pulls laterally while you resist — activating the obliques, transverse abdominis, and quadratus lumborum under measurable load. Directly transfers to rotational stability in every push and pull.',
               cues:['Stand sideways to cable at chest height. Hold handle at chest.','Press straight out. Hold 2 sec. Resist any rotation.','12 per side. Heavier than you think once you feel it.']},
            ]},
            {label:'Zone 2 Finisher · 20 min', cardio:true, exs:[
              {id:'bm-c3', name:'Elliptical', badge:'cardio', cardioOnly:true,
               cardioDesc:'Upper pull day — elliptical preferred. Low impact, full-body movement. Keep it true Zone 2.', zone:'HR 120–145 BPM', duration:20}
            ]}
          ]
        },
        { key:'day4', label:'Day 4 · Lower B', color:'var(--amber)', rationale:'Quad and glute session. 72 hours from the hinge day. Hack squat as primary — mechanically optimal for tall lifters.',
          blocks:[
            {label:'Compound Block · Rest 2–3 min', exs:[
              {id:'bm-hack', name:'Hack Squat', badge:'compound', sets:4, w:180, r:8, rest:150, compound:true,
               why:'At 6\'3", barbell back squat mechanics shift load to the lower back due to femur length. Hack squat keeps you upright — 100% of effort to the quad. Not a compromise. The mechanically superior choice for your structure.',
               cues:['Feet mid-platform, shoulder-width, 20–30° out.','Below parallel. No partial reps.','3-sec eccentric. No lockout at top — maintain tension.']},
              {id:'bm-bss',  name:'Bulgarian Split Squat', badge:'compound', sets:3, w:27, r:8, rest:120, compound:true,
               why:'Single-leg training at equivalent or greater stimulus than bilateral at significantly lower total load. Hip flexor stretch on rear leg is therapeutic for desk-sitting lifters.',
               cues:['Rear foot elevated. Laces down.','Front foot far enough for vertical shin.','Descend straight down. Torso upright.']},
            ]},
            {label:'Accessory Block · Rest 75 sec', exs:[
              {id:'bm-ext',  name:'Leg Extension', badge:'isolation', sets:3, w:85, r:12, rest:75, compound:false,
               why:'VMO isolation — the teardrop quad. Full extension under load produces unique VMO signal that no compound can replicate.',
               cues:['Pad at base of shin.','Full extension, 1-sec squeeze at top.','Slow controlled return.']},
              {id:'bm-abd',  name:'Abductor Machine', badge:'isolation', sets:3, w:100, r:20, rest:45, compound:false,
               why:'Glute medius stabilizes every lower body movement. When it is weak, the knees and lower back compensate. Training it directly makes everything else better.',
               cues:['Slight forward lean — loads glute med, not TFL.','Full range, hold at end.','Control the return.']},
              {id:'bm-calf2',name:'Seated Calf Raise', badge:'isolation', sets:4, w:90, r:20, rest:45, compound:false,
               why:'Soleus — only accessible with bent knee. Larger than most realize. High volume is the only stimulus it responds to.',
               cues:['Pad above knee on lower quad.','Full stretch and rise. Pause at both ends.']},
            ]},
            {label:'Core Block · Rest 45 sec', exs:[
              {id:'bm-fri-sp',   name:'Side Plank', badge:'core', sets:3, w:0, r:40, rest:45, compound:false, isCore:true, unit:'sec',
               why:'Lateral core training — the one movement plane almost every program ignores. Quadratus lumborum and oblique stability directly transfer to hip stability under heavy single-leg loads like split squats (which you just did). McGill research shows this reduces lateral knee collapse by reinforcing the hip-stabilizer chain.',
               cues:['Elbow under shoulder. Body in a straight diagonal line.','Drive hips up. Hold 40 sec each side.','Progress: add hip dips (lower and raise) to make it dynamic.']},
              {id:'bm-fri-rc',   name:'Reverse Crunch', badge:'core', sets:3, w:0, r:15, rest:45, compound:false, isCore:true, unit:'reps',
               why:'Targets lower rectus abdominis through hip flexion — the area most visible in body composition change. No neck involvement, no lumbar compression. At the end of a heavy lower day the core is already warm and ready for this direct work.',
               cues:['Lie flat. Knees at 90°.','Roll hips off floor using abs — not hip flexors.','3-sec lowering. Don\'t let feet touch ground between reps.']},
            ]},
            {label:'Zone 2 Finisher · 20 min', cardio:true, exs:[
              {id:'bm-c4', name:'Stationary Bike', badge:'cardio', cardioOnly:true,
               cardioDesc:'End of week. Low resistance. Protect the weekend recovery window.', zone:'HR 115–135 BPM', duration:20}
            ]}
          ]
        }
      ]
    },
    transform: {
      4: [
        { key:'day1', label:'Day 1 · Push + Pull', color:'var(--teal)', rationale:'Superset-driven upper body. Antagonist pairing (push+pull) keeps heart rate elevated while allowing each muscle group partial recovery. MRT structure maximizes calorie burn while building lean mass.',
          blocks:[
            {label:'Superset A · Rest 90 sec', exs:[
              {id:'tr-dbench', name:'DB Bench Press', badge:'compound', sets:4, w:50, r:10, rest:90, compound:true,
               why:'Dumbbells demand more stabilizer recruitment than barbell — greater total muscle activation per rep. Unilateral loading also prevents dominant-side compensation.',
               cues:['Arch naturally. Scapulae retracted and depressed.','DBs touch outer chest at bottom. Full stretch.','Press to lockout. Squeeze chest 1 sec at top.','Alternate: superset with rows — no rest between exercises.']},
              {id:'tr-row',   name:'Dumbbell Row', badge:'compound', sets:4, w:60, r:10, rest:90, compound:true,
               why:'Paired with bench press as antagonist superset. While chest recovers, back works. Total work doubles without doubling session time.',
               cues:['Row to hip, not chest — lat path, not trap path.','Let shoulder protract at bottom for full stretch.','Slight torso rotation at top for peak contraction.']},
            ]},
            {label:'Superset B · Rest 60 sec', exs:[
              {id:'tr-push',  name:'Push-Up', badge:'compound', sets:3, w:0, r:15, rest:60, compound:true,
               why:'Bodyweight push after DB bench pre-exhausts the chest. At 15 reps with short rest, this becomes metabolic conditioning disguised as strength work.',
               cues:['Hands just outside shoulders. Elbows 45° — not flared.','Full lockout at top. Chest to floor at bottom.','If 15 is easy: elevate feet or add pause at bottom.']},
              {id:'tr-face',  name:'Face Pull', badge:'isolation', sets:3, w:30, r:15, rest:60, compound:false,
               why:'Paired with push-ups — external rotation counters internal rotation from pressing. Rear delt and rotator cuff work that keeps shoulders healthy long-term.',
               cues:['Pull to ears. Hands end behind ears.','External rotate at end position. Elbows wide.','Light weight — corrective, not strength.']},
            ]},
            {label:'Accessory Block · Rest 45 sec', exs:[
              {id:'tr-lat',   name:'Cable Lateral Raise', badge:'isolation', sets:3, w:15, r:15, rest:45, compound:false,
               why:'V-taper builder. Constant cable tension beats dumbbells for lateral delt — no dead spot at the bottom of the rep.',
               cues:['Lead with elbow. Stop at shoulder height.','Pinky slightly higher than thumb.','4-sec negative — this is where growth happens.']},
              {id:'tr-ham',   name:'Hammer Curl', badge:'isolation', sets:3, w:30, r:12, rest:45, compound:false,
               why:'Brachialis — underneath the bicep, physically pushes it up. Neutral grip targets it exclusively. Short rest keeps metabolic demand high.',
               cues:['Elbow pinned to side. No front delt swing.','Strict alternating. Full extension at bottom.']},
            ]},
            {label:'Core Block · Rest 30 sec', exs:[
              {id:'tr-mon-db',   name:'Dead Bug', badge:'core', sets:3, w:0, r:10, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Foundational anti-rotation movement for the recomp athlete. Trains the deep core stabilizers (transverse abdominis, multifidus) that are responsible for protecting the spine during the explosive HIIT work that follows. Specific to the antagonist superset format — builds the stability base that makes heavy paired sets safer.',
               cues:['Lie on back. Arms to ceiling, knees 90° above hips.','Lower opposite arm + leg slowly. Back flat the entire time.','5-sec descent per limb. 10 per side = 1 set.']},
              {id:'tr-mon-pp',   name:'Pallof Press', badge:'core', sets:3, w:25, r:12, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Anti-rotation resistance training — the cable\'s lateral pull challenges the obliques and deep stabilizers to resist rotation under load. Directly relevant to the pressing and rowing supersets on this day: core anti-rotation strength is what allows you to transfer force cleanly.',
               cues:['Stand sideways to cable. Handle at chest.','Press straight out and hold 2 sec. No rotation.','12 per side. Heavier = more stable lifts everywhere.']},
            ]},
            {label:'HIIT Finisher · 15 min', cardio:true, exs:[
              {id:'tr-c1', name:'Rower — Intervals', badge:'cardio', cardioOnly:true,
               cardioDesc:'30 sec hard / 30 sec easy × 15 rounds. Full-body intervals after upper supersets maximize EPOC — your body burns elevated calories for hours post-session.', zone:'HR 150–175 BPM intervals', duration:15}
            ]}
          ]
        },
        { key:'day2', label:'Day 2 · Lower A', color:'var(--orange)', rationale:'Heavy lower compounds followed by superset accessories and a kettlebell metabolic finisher. The largest muscle groups burn the most calories — training legs hard is the single most effective recomp strategy.',
          blocks:[
            {label:'Compound Block · Rest 2 min', exs:[
              {id:'tr-gsquat', name:'Goblet Squat', badge:'compound', sets:4, w:70, r:12, rest:120, compound:true,
               why:'Front-loaded squat pattern forces upright torso — superior quad activation for tall lifters. The goblet position is also a core exercise. At 12 reps, metabolic demand is significant.',
               cues:['Hold DB at chest, elbows inside knees at bottom.','Below parallel — full depth, full development.','Drive through whole foot. Knees track over toes.','3-sec eccentric on every rep.']},
              {id:'tr-rdl',    name:'Romanian Deadlift', badge:'compound', sets:4, w:135, r:10, rest:120, compound:true,
               why:'Posterior chain dominant — hammers hamstrings, glutes, and erectors under constant tension. At 10 reps with compound pairing, heart rate stays elevated throughout.',
               cues:['Hip hinge — push hips back, not down.','Bar against legs the entire descent.','Hamstring stretch at mid-shin. Drive hips forward at top.']},
            ]},
            {label:'Superset Block · Rest 60 sec', exs:[
              {id:'tr-ext',   name:'Leg Extension', badge:'isolation', sets:3, w:65, r:15, rest:60, compound:false,
               why:'Quad isolation paired with hamstring curl — antagonist superset. Keeps blood in the legs while alternating muscle groups. Brutal metabolic pump.',
               cues:['Pad at base of shin. Full extension, 1-sec squeeze.','Slow controlled return — no crashing the stack.']},
              {id:'tr-lcurl', name:'Lying Leg Curl', badge:'isolation', sets:3, w:85, r:15, rest:60, compound:false,
               why:'Paired with extensions — while quads recover, hamstrings work. Short rest between supersets creates a leg-destroying metabolic environment.',
               cues:['Hips pressed into pad throughout.','Full extension every rep — full stretch matters.','3-sec eccentric.']},
            ]},
            {label:'Core Block · Rest 30 sec', exs:[
              {id:'tr-tue-be',   name:'Back Extension', badge:'core', sets:3, w:0, r:15, rest:30, compound:false, isCore:true, unit:'reps',
               why:'On a heavy posterior chain day (RDL + hip thrust), the erectors and multifidus are already primed. Direct back extension work on this day accelerates their adaptation and creates the posterior core strength that prevents breakdown in heavy pulls. The most undertrained "ab" exercise in most programs.',
               cues:['Neutral spine at bottom. Brace abs.','Lift until body is straight — not beyond.','2-sec hold at top. Slow controlled lower.']},
              {id:'tr-tue-sp',   name:'Side Plank', badge:'core', sets:3, w:0, r:40, rest:30, compound:false, isCore:true, unit:'sec',
               why:'Lateral stability for the recomp athlete. The KB swings that follow demand anti-lateral core strength to prevent hip shift under load. Side plank directly trains this. McGill calls it the safest and most effective lateral core exercise available.',
               cues:['Elbow under shoulder. Stack hips. One line from head to feet.','40 sec each side.','Progress: add a hip dip movement to make it dynamic.']},
            ]},
            {label:'Metabolic Finisher · 15 min', cardio:true, exs:[
              {id:'tr-c2', name:'KB Swing — Intervals', badge:'cardio', cardioOnly:true,
               cardioDesc:'30 sec on / 30 sec off × 15 rounds. Posterior chain power + cardiovascular conditioning in one movement. The single best metabolic exercise for recomp — explosive hip extension under load.', zone:'HR 145–170 BPM intervals', duration:15}
            ]}
          ]
        },
        { key:'day3', label:'Day 3 · Pull + Push', color:'var(--blue)', rationale:'Pull-dominant upper day with antagonist supersets. Reverses Day 1\'s push emphasis. Balanced upper body development while maintaining metabolic resistance training structure.',
          blocks:[
            {label:'Superset A · Rest 90 sec', exs:[
              {id:'tr-pull',  name:'Lat Pulldown', badge:'compound', sets:4, w:100, r:10, rest:90, compound:true,
               why:'Widest back muscle — the V-taper foundation. Neutral or wide grip both effective. Paired with pressing to maintain elevated heart rate.',
               cues:['Lean back 10–15°. Lead with elbows.','Full dead hang at top — earn the stretch.','Chest up throughout. Squeeze lats at bottom.']},
              {id:'tr-press', name:'Arnold Press', badge:'compound', sets:4, w:30, r:10, rest:90, compound:true,
               why:'Full three-head delt recruitment through rotation arc. Paired with pulldowns — while delts press, lats recover. Efficient antagonist pairing.',
               cues:['Palms facing you at chin. Rotate outward as you press.','Elbows in front of torso plane throughout.','No lumbar arch — brace and stay neutral.']},
            ]},
            {label:'Superset B · Rest 60 sec', exs:[
              {id:'tr-crow',  name:'Seated Cable Row', badge:'compound', sets:3, w:95, r:12, rest:60, compound:true,
               why:'Horizontal pull for rhomboids, mid-traps, rear delts. Paired with chest fly — push and pull in the horizontal plane. Posture-building muscle.',
               cues:['Torso upright — no rocking.','Elbows wide. Handle to lower sternum.','Full scapular protraction between reps.']},
              {id:'tr-fly',   name:'Cable Low-to-High Fly', badge:'isolation', sets:3, w:25, r:12, rest:60, compound:false,
               why:'Constant cable tension through the arc. Paired with rows — chest works while back recovers. Upper pec emphasis complements the DB bench from Monday.',
               cues:['Slight forward lean, soft elbow bend.','Bring elbows together — hands are passengers.','2-sec squeeze at the top.']},
            ]},
            {label:'Accessory Block · Rest 45 sec', exs:[
              {id:'tr-icurl', name:'Incline DB Curl', badge:'isolation', sets:3, w:20, r:12, rest:45, compound:false,
               why:'Stretch-position bicep loading — greater hypertrophy signal than standing curls. The incline puts the long head under maximum stretch.',
               cues:['Arms hang straight. Shoulder stays back.','Supinate through curl — pinky up.','3-sec slow negative.']},
              {id:'tr-pushd', name:'Tricep Rope Pushdown', badge:'isolation', sets:3, w:55, r:12, rest:45, compound:false,
               why:'Lateral and medial head isolation. Short rest at 12 reps keeps the metabolic cost high. Drop set on the final set — continue to failure.',
               cues:['15° forward hinge.','Full extension, hard squeeze at bottom.','Drop 30% on last set, continue to failure.']},
            ]},
            {label:'Core Block · Rest 30 sec', exs:[
              {id:'tr-thu-cc',   name:'Cable Crunch', badge:'core', sets:3, w:45, r:12, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Loaded flexion on a pull-dominant day — the pulling muscles (lats, rhomboids) pull the spine into extension all session, making flexion work the intelligent counterbalance. Cable crunch\'s constant tension and progressive load makes it the only weighted core exercise that consistently builds visible ab muscle.',
               cues:['Kneel facing cable. Rope at forehead height.','Crunch DOWN — elbows toward knees.','1-sec hold. Slow return. The weight should be challenging at rep 10.']},
              {id:'tr-thu-bd',   name:'Bird Dog', badge:'core', sets:3, w:0, r:10, rest:30, compound:false, isCore:true, unit:'reps',
               why:'McGill Big 3 closer — builds the erector and glute coordination chain in the most spine-safe position. On a high-volume upper day, this low-intensity movement actively promotes recovery while maintaining core neural drive.',
               cues:['All fours. Hands under shoulders, knees under hips.','Opposite arm + leg extended. Back level — no rotation.','5-sec hold. 10 per side = 1 set.']},
            ]},
            {label:'HIIT Finisher · 15 min', cardio:true, exs:[
              {id:'tr-c3', name:'Bike — Sprint Intervals', badge:'cardio', cardioOnly:true,
               cardioDesc:'20 sec all-out sprint / 40 sec cruise × 15 rounds. Short sprint intervals preserve muscle while creating massive EPOC. Heart rate spikes then partially recovers — the recomp sweet spot.', zone:'HR 155–180 BPM sprints', duration:15}
            ]}
          ]
        },
        { key:'day4', label:'Day 4 · Lower B', color:'var(--amber)', rationale:'Quad and glute emphasis with unilateral work. Machine compounds allow heavier loading safely. Metabolic treadmill finisher closes the training block and maximizes fat oxidation.',
          blocks:[
            {label:'Compound Block · Rest 2 min', exs:[
              {id:'tr-lpress', name:'Leg Press', badge:'compound', sets:4, w:270, r:12, rest:120, compound:true,
               why:'Machine-guided path lets you load heavier without spinal compression. At 12 reps, leg press creates enormous metabolic demand — the largest muscles under heavy load for extended time.',
               cues:['Feet shoulder-width, mid-platform, 20–30° toe-out.','Full depth — knees toward armpits.','Do not lock out at top — maintain tension.','3-sec eccentric every rep.']},
              {id:'tr-hip',    name:'Hip Thrust', badge:'compound', sets:4, w:135, r:10, rest:120, compound:true,
               why:'Greatest glute activation of any exercise. The fully shortened position is unique — no squat or deadlift achieves it. Glutes are the largest muscle — training them hard burns the most calories.',
               cues:['Bench at shoulder blades. Feet flat, shoulder-width.','Drive through full foot. 2-sec hold at top.','Level hips at top. Chin tucked — no hyperextension.']},
            ]},
            {label:'Superset Block · Rest 60 sec', exs:[
              {id:'tr-bss',   name:'Bulgarian Split Squat', badge:'compound', sets:3, w:25, r:10, rest:60, compound:true,
               why:'Unilateral work at its finest. Each leg works independently — catches imbalances. The balance demand recruits stabilizers that bilateral movements miss. Per-leg, the stimulus matches a heavy squat.',
               cues:['Rear foot elevated, laces down.','Front foot far enough for vertical shin at bottom.','Descend straight down — elevator, not lean.']},
              {id:'tr-calf',  name:'Standing Calf Raise', badge:'isolation', sets:3, w:160, r:20, rest:60, compound:false,
               why:'Calves are slow-twitch dominant — they only respond to volume. High reps, full range, paired with split squats to keep heart rate elevated.',
               cues:['Full hang at bottom, 1-sec pause.','Full rise at top, 1-sec pause.','No bouncing. Own every inch of the range.']},
            ]},
            {label:'Core Block · Rest 30 sec', exs:[
              {id:'tr-fri-aw',   name:'Ab Wheel Rollout', badge:'core', sets:3, w:0, r:8, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Highest anti-extension activation of any core exercise. After a heavy leg press + hip thrust session, the anterior core is warm and conditioned — primed for high-intensity anti-extension work. This is the most demanding bodyweight ab exercise and the one that builds visible rectus abdominis best.',
               cues:['Kneel, wheel under shoulders.','Roll out slowly. Back stays neutral — do not let it arch.','Only go as far as you can maintain form. Pull back by squeezing abs.']},
              {id:'tr-fri-hkr',  name:'Hanging Knee Raise', badge:'core', sets:3, w:0, r:12, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Hip flexion decompresses the spine after the heavy lower compounds. The hanging position creates traction while the leg raise recruits lower rectus and hip flexors. Closing the training week with decompression work accelerates the weekend recovery window.',
               cues:['Hang from bar. Full shoulder extension.','Raise knees to hip height or above. Controlled.','3-sec lower. No swinging. If too easy, extend legs straight.']},
            ]},
            {label:'Metabolic Finisher · 15 min', cardio:true, exs:[
              {id:'tr-c4', name:'Incline Treadmill — Intervals', badge:'cardio', cardioOnly:true,
               cardioDesc:'1 min fast walk (4.0 mph, 10% incline) / 1 min easy (3.0 mph, 2% incline) × 7–8 rounds. Incline walking intervals are joint-friendly after heavy legs while creating significant calorie burn. Closes the training week.', zone:'HR 140–165 BPM intervals', duration:15}
            ]}
          ]
        }
      ]
    }
  };

  // ── BUG-31: substitution pool used by dedupeConsecutiveDays backfill ──────
  // Exercises chosen to fit pull/push/isolation slots without naming anything
  // that already appears in the standard 4-day bases, minimising collision risk.
  // GEN-fix (persona-matrix R9): each sub now carries the equipment tier it
  // actually requires so the backfill loop below can skip anything above the
  // user's requested tier — previously these had no tier field at all, so a
  // 'home' (bodyweight-only) user could get backfilled a cable/DB exercise.
  const SUBSTITUTIONS = [
    {id:'sub-sarm',  name:'Single-Arm DB Row',     badge:'isolation', tier:'hotel_gym', sets:3, w:60, r:12, rest:60, compound:false,
     why:'Unilateral pull — catches dominant-side compensation when bilateral rows are the only remaining pull.',
     cues:['Row to hip, not chest.','Let shoulder drop at bottom — full protraction.']},
    {id:'sub-sapl',  name:'Straight-Arm Pulldown', badge:'isolation', tier:'full_gym', sets:3, w:40, r:15, rest:45, compound:false,
     why:'Lat isolation through full arc with zero bicep involvement. Ideal pull-day filler.',
     cues:['Arms straight throughout.','Drive elbows toward hips — squeeze lats at bottom.']},
    {id:'sub-rfly',  name:'Reverse Fly',            badge:'isolation', tier:'hotel_gym', sets:3, w:15, r:15, rest:45, compound:false,
     why:'Rear delt isolation for shoulder health on pull-focused days.',
     cues:['Slight forward lean. Lead with elbows wide.','Light weight — corrective work.']},
    {id:'sub-dbsp',  name:'DB Shoulder Press',      badge:'compound',  tier:'hotel_gym', sets:3, w:30, r:12, rest:75, compound:true,
     why:'Overhead push pattern to maintain delt compound volume when primary is stripped.',
     cues:['Press overhead. Elbows slightly in front.','No lumbar arch — brace throughout.']},
    {id:'sub-bayrow',name:'Bayesian Cable Curl',    badge:'isolation', tier:'full_gym', sets:3, w:25, r:12, rest:45, compound:false,
     why:'Bicep isolation with cable behind body — unique stretch position unavailable from standard curls.',
     cues:['Cable at hip height behind body.','Curl with shoulder pinned back.']},
    {id:'sub-lrow',  name:'Landmine Row',            badge:'compound',  tier:'full_gym', sets:3, w:70, r:10, rest:75, compound:true,
     why:'Compound pull with neutral grip — different stimulus than cable row, no spine compression.',
     cues:['Hinge at hip. Drive elbow to hip. Chest tall throughout.']},
    {id:'sub-ipu',   name:'Incline Push-Up',        badge:'isolation', tier:'home', sets:3, w:0, r:15, rest:45, compound:false,
     why:'Zero-equipment push filler — hands elevated on a chair/counter reduces load versus a standard push-up, useful when the push-day pool is already exhausted.',
     cues:['Hands on a stable elevated surface, body in a straight line.','Lower chest to the surface, press back up.']},
    {id:'sub-bpa',   name:'Band Pull-Apart',        badge:'isolation', tier:'home', sets:3, w:0, r:20, rest:30, compound:false,
     why:'Zero-equipment (or light-band) rear-delt/upper-back filler — safe volume add when the pull-day pool is already exhausted.',
     cues:['Arms straight, band or towel at chest height.','Pull apart squeezing shoulder blades together; control the return.']},
    // BUG-58: home tier only had 2 backfill candidates above, so 3/5/6-day
    // rotations (which cycle the small home pool faster than 2/4-day) ran out
    // of non-colliding subs and left days permanently short. The 6 entries
    // below are not new exercises — each is copied verbatim (name/why/cues)
    // from its already-tagged, already-cited 'home'-tier EXERCISE_BANK entry
    // (see 'table-inverted-row', 'diamond-push-up', 'bodyweight-squat',
    // 'bodyweight-single-leg-rdl', 'glute-bridge', 'prone-t-raise' above),
    // so no new muscle-group tag or oneRmFactor is being invented — spanning
    // push/pull/legs/glutes so a 2-short day has enough non-colliding options.
    {id:'sub-tir',   name:'Table Inverted Row',     badge:'compound',  tier:'home', sets:3, w:0, r:12, rest:60, compound:true,
     why:'The only true zero-equipment pulling compound — a sturdy table (or two chairs and a broomstick) substitutes for a bar. Trains the same horizontal pull pattern as a barbell or dumbbell row with no gym access required.',
     cues:['Lie under a sturdy table, hands gripping the edge, body straight.','Pull chest toward the table edge, squeezing shoulder blades together.']},
    {id:'sub-dpu',   name:'Diamond Push-Up',        badge:'isolation', tier:'home', sets:3, w:0, r:15, rest:45, compound:false,
     why:'The narrow diamond hand position shifts a standard push-up’s load heavily onto the triceps — producing among the highest triceps EMG of any bodyweight movement. Zero-equipment triceps mass work.',
     cues:['Hands together under the chest forming a diamond.','Lower until the chest nearly touches the hands, elbows tucked; press to lockout.']},
    {id:'sub-bwsq',  name:'Bodyweight Squat',       badge:'compound',  tier:'home', sets:3, w:0, r:15, rest:60, compound:true,
     why:'The zero-equipment squat pattern — full knee and hip flexion trains the quads through a complete range of motion. The foundational lower-body compound when no external load is available.',
     cues:['Feet shoulder-width, sit hips back and down — knees track over toes.','Drive through the whole foot to stand; chest tall throughout.']},
    {id:'sub-slrdl', name:'Single-Leg Romanian Deadlift', badge:'compound', tier:'home', sets:3, w:0, r:12, rest:60, compound:true,
     why:'The zero-equipment hip-hinge compound — balancing on one leg increases hamstring and glute demand to compensate for the lack of external load. Trains the same hip-extension pattern as the barbell RDL.',
     cues:['Stand tall, hinge forward while the free leg extends straight back.','Keep hips square; squeeze the glute and hamstring to return to standing.']},
    {id:'sub-glb',   name:'Glute Bridge',           badge:'isolation', tier:'home', sets:3, w:0, r:15, rest:45, compound:false,
     why:'Identical mechanics to hip thrust but performed on the floor. Shorter ROM but identical glute squeeze at the top. The go-to glute exercise when no bench is available.',
     cues:['Supine on floor, feet flat and close to hips.','Drive through heels; lift hips until body is a plank; squeeze glutes hard at top.']},
    {id:'sub-ptr',   name:'Prone T-Raise',          badge:'isolation', tier:'home', sets:3, w:0, r:15, rest:45, compound:false,
     why:'The T-raise targets the middle trapezius and posterior delt in a no-equipment setting — upper-back health filler distinct from the pull-day compounds.',
     cues:['Lie face down; arms straight out to the sides (T position), thumbs up.','Lift arms by squeezing shoulder blades; lower slowly with full range of motion.']},
  ];

  // ── BUG-31: remove consecutive-day exercise name collisions ──────────────
  // Operates on name.trim().toLowerCase() — catches id-mismatches like
  // s5-ap ("Arnold Press") vs tr-press ("Arnold Press").
  // Applied at the end of build5(), ppl(), and build2() before returning.
  const dedupeConsecutiveDays = (days, { wrap = false, minPerDay = 4 } = {}) => {
    // Shallow-clone block arrays so the hand-authored 4-day bases are untouched.
    const result = days.map(day => ({
      ...day,
      blocks: day.blocks.map(b => ({ ...b, exs: b.exs ? [...b.exs] : [] }))
    }));

    // GEN-fix (persona-matrix R6): core exercises are exempted from cross-day
    // collision tracking the same way cardio already is (see cardioPool reuse
    // comment above) — repeating Plank/Dead Bug across training days is normal
    // ab programming, not a duplicate-lift bug. Without this, a small tier's
    // core pool (e.g. 'home', 7 entries) can pick the same pair on both days
    // of a 2-day split, dedup strips day 2's as "duplicates," and the block
    // is left empty since backfill deliberately skips core blocks.
    const getNames = (day) => {
      const s = new Set();
      for (const b of day.blocks) {
        if (b.cardio) continue;
        for (const ex of b.exs) { if (!ex.cardioOnly && !ex.isCore) s.add(ex.name.trim().toLowerCase()); }
      }
      return s;
    };

    // Count non-cardio, non-core exercises — the "main" work that must meet minPerDay.
    const countMain = (day) => {
      let n = 0;
      for (const b of day.blocks) {
        if (b.cardio) continue;
        for (const ex of b.exs) { if (!ex.cardioOnly && !ex.isCore) n++; }
      }
      return n;
    };

    const pairs = [];
    for (let i = 0; i < result.length - 1; i++) pairs.push([i, i + 1]);
    if (wrap && result.length > 1) pairs.push([result.length - 1, 0]);

    for (const [pi, ci] of pairs) {
      const prevNames = getNames(result[pi]);

      // Remove from the later day any exercise whose name already appears on the earlier day.
      for (const b of result[ci].blocks) {
        if (b.cardio) continue;
        b.exs = b.exs.filter(ex =>
          ex.cardioOnly || ex.isCore || !prevNames.has(ex.name.trim().toLowerCase())
        );
      }

      // Backfill if removal dropped the day below minPerDay.
      const shortage = minPerDay - countMain(result[ci]);
      if (shortage > 0) {
        const currNames = getNames(result[ci]);
        const nextNames = ci + 1 < result.length ? getNames(result[ci + 1]) : new Set();
        let filled = 0;

        for (const sub of SUBSTITUTIONS) {
          if (filled >= shortage) break;
          // GEN-fix (persona-matrix R9): never backfill an exercise whose
          // required tier exceeds the user's requested equipment tier.
          const TIER_RANK = { home:0, hotel_gym:1, full_gym:2 };
          if ((TIER_RANK[sub.tier] ?? 2) > (TIER_RANK[tier] ?? 2)) continue;
          const key = sub.name.trim().toLowerCase();
          // Skip if it would collide with prev, curr, or next day.
          if (currNames.has(key) || prevNames.has(key) || nextNames.has(key)) continue;

          // Append to the last non-cardio non-core block; if none, insert before cardio.
          let placed = false;
          for (let bi = result[ci].blocks.length - 1; bi >= 0; bi--) {
            const b = result[ci].blocks[bi];
            if (!b.cardio && !(b.label || '').toLowerCase().includes('core')) {
              b.exs.push(sub);
              placed = true;
              break;
            }
          }
          if (!placed) {
            const at = result[ci].blocks.findIndex(b => b.cardio);
            result[ci].blocks.splice(
              at >= 0 ? at : result[ci].blocks.length,
              0,
              { label:'Supplemental Block', exs:[sub] }
            );
          }
          currNames.add(key);
          filled++;
        }

        if (filled < shortage) {
          console.warn(`[dedup] ${result[ci].key}: day short by ${shortage - filled} after dedup — no clean substitute available`);
        }
      }
    }

    return result;
  };

  // 3-day versions: compress to Push/Pull/Legs
  const ppl = (base4) => {
    const [ua, la, ub, lb] = base4;
    // GEN-fix: locate cardio/core by block shape, NOT position — the generated
    // base days now carry a Core Block at index 2, so la.blocks[2] is no
    // longer guaranteed to be the cardio finisher.
    const legsCardio = (la.blocks.find(b=>b.cardio) || lb.blocks.find(b=>b.cardio) || {exs:[]}).exs[0] || null;
    const legsCore = la.blocks.find(b => !b.cardio && (b.label||'').toLowerCase().includes('core')) || null;
    const legsBlocks = [
      // BUG: la.blocks[0].exs[1] is the hinge day's SECOND compound — it belongs in the
      // Compound Block, not tacked onto the accessory tail after isolations (R3 mis-order).
      { label:'Compound Block', exs:[ la.blocks[0].exs[0], lb.blocks[0].exs[0], la.blocks[0].exs[1] ].filter(Boolean) },
      { label:'Accessory Block', exs:[ la.blocks[1].exs[0], lb.blocks[1].exs[0] ].filter(Boolean) },
    ];
    if (legsCore) legsBlocks.push({ ...legsCore, exs:[...legsCore.exs] });
    if (legsCardio) legsBlocks.push({ label:'Zone 2 · 22 min', cardio:true, exs:[ {...legsCardio, duration:22} ] });
    return dedupeConsecutiveDays([
      { ...ua, key:'day1', label:'Day 1 · Push', rationale: ua.rationale },
      { ...ub, key:'day2', label:'Day 2 · Pull', rationale: ub.rationale },
      { key:'day3', label:'Day 3 · Legs', color:'var(--amber)', rationale:'Combined lower day — hinge and squat patterns in one session.',
        blocks: legsBlocks
      }
    ]);
  };

  // ── TASK-3 / C4: pressing dedup — LEGACY-FALLBACK-ONLY ────────────────────
  // The bank builds the Shoulders+Arms day against the shared `used` set, so a
  // bank-supplied day can never duplicate another day's press at selection time.
  // This machinery therefore only runs when build5 falls back to the hardcoded
  // shoulders day (bank couldn't fill it), where Day 1 vs Day 3 are NON-adjacent
  // and dedupeConsecutiveDays never sees the collision. Substitution hierarchy
  // after C4: (1) bank selection with `used` exclusion — primary, (2)
  // dedupeConsecutiveDays + SUBSTITUTIONS — universal final safety net, (3)
  // dedupePressingBuild5 — hardcoded-fallback shoulders day only.
  const PRESS_ALTERNATES = [
    {id:'s5-ap-arnold',  name:'Arnold Press',            badge:'compound', sets:4, w:40, r:10, rest:90, compound:true,
     why:'Full three-head delt recruitment in one movement.',
     cues:['Palms facing you at start. Rotate through press.','Elbows in front of torso plane throughout.']},
    {id:'s5-ap-dbsp',    name:'Seated DB Shoulder Press', badge:'compound', sets:4, w:45, r:10, rest:90, compound:true,
     why:'Strict vertical press — maximal anterior/medial delt load with back support removing momentum.',
     cues:['Press straight up, stack wrists over elbows.','Ribs down, brace — no lumbar arch.']},
    {id:'s5-ap-ohp',     name:'Barbell Overhead Press',   badge:'compound', sets:4, w:75, r:8,  rest:90, compound:true,
     why:'Highest absolute-load overhead press — total shoulder-girdle strength.',
     cues:['Bar over mid-foot. Squeeze glutes, press, shrug at top.','Head through the window at lockout.']},
    {id:'s5-ap-pushpress',name:'Push Press',              badge:'compound', sets:4, w:85, r:6,  rest:90, compound:true,
     why:'Leg drive overloads the delts beyond strict-press capacity for a power stimulus.',
     cues:['Short dip — knees only.','Drive through the dip, finish with the arms.']},
    {id:'s5-ap-zpress',  name:'Z-Press',                  badge:'compound', sets:4, w:55, r:8,  rest:90, compound:true,
     why:'Seated-on-floor press removes all leg and back contribution — pure shoulder plus core stability.',
     cues:['Legs straight on the floor, tall spine.','Press without leaning back.']},
  ];

  const isPress = (name) => /press|bench|\bdip\b|push-up/i.test(name || '');

  const dedupePressingBuild5 = (days) => {
    const shoulders = days.find(d => d.key === 'day3');
    if (!shoulders) return days;
    // pressing names used on every OTHER day
    const otherPress = new Set();
    days.forEach(d => {
      if (d === shoulders) return;
      (d.blocks || []).forEach(b => { if (b.cardio) return;
        (b.exs || []).forEach(ex => { if (ex && !ex.cardioOnly && isPress(ex.name)) otherPress.add(ex.name.trim().toLowerCase()); });
      });
    });
    // every name in the whole split — so we never swap into another collision
    const allNames = new Set();
    days.forEach(d => (d.blocks || []).forEach(b => (b.exs || []).forEach(ex => ex && allNames.add(ex.name.trim().toLowerCase()))));
    // swap the shoulders-day compound press if it collides
    for (const b of shoulders.blocks) {
      if (b.cardio) continue;
      for (let i = 0; i < b.exs.length; i++) {
        const ex = b.exs[i];
        if (ex && ex.compound && isPress(ex.name) && otherPress.has(ex.name.trim().toLowerCase())) {
          const alt = PRESS_ALTERNATES.find(a => !allNames.has(a.name.trim().toLowerCase()));
          if (alt) {
            b.exs[i] = { ...alt };
            allNames.add(alt.name.trim().toLowerCase());
          }
        }
      }
    }
    return days;
  };

  // 5-day: add dedicated shoulder/arms day
  const build5 = (base4) => {
    const [ua, la, ub, lb] = base4;
    // Bank-driven Shoulders + Arms day (attached by buildDynamicProgram). The
    // hardcoded block remains ONLY as an emergency fallback if the bank can't
    // fill the day (e.g. severe injury filter wiping all delt/arm candidates).
    const shoulders = base4.shouldersArmsDay || {
      key:'day3', label:'Day 3 · Shoulders + Arms', color:'var(--teal,#38d9c0)', rationale:'Dedicated delt and arm session. Fresh shoulders after Day 1 push.',
      blocks:[
        { label:'Shoulder Block · Rest 90 sec', exs:[
          {id:'s5-ap', name:'Arnold Press', badge:'compound', sets:4, w:40, r:10, rest:90, compound:true,
           why:'Full three-head delt recruitment in one movement.',
           cues:['Palms facing you at start. Rotate through press.','Elbows in front of torso plane throughout.']},
          {id:'s5-lat',name:'Cable Lateral Raise', badge:'isolation', sets:4, w:25, r:15, rest:60, compound:false,
           why:'Volume on the lateral delt — the V-taper builder.',
           cues:['Lead with elbow. Stop at shoulder height.','4-sec negative.']},
          {id:'s5-fp', name:'Face Pull', badge:'isolation', sets:3, w:35, r:20, rest:45, compound:false,
           why:'External rotation work — mandatory shoulder health.',
           cues:['Pull to ears. External rotate at end. Light weight.']},
        ]},
        { label:'Arms Block · Rest 75 sec', exs:[
          {id:'s5-ohe',name:'Tricep Overhead Extension', badge:'isolation', sets:3, w:65, r:12, rest:75, compound:false,
           why:'Long head — 55% of tricep mass. Only hit in overhead position.',
           cues:['Elbows narrow and forward. Forearm only moves.']},
          {id:'s5-pd', name:'Tricep Rope Pushdown', badge:'isolation', sets:3, w:80, r:12, rest:75, compound:false,
           why:'Lateral and medial head finisher.',
           cues:['15° lean. Full extension. Drop set on last set.']},
          {id:'s5-ic', name:'Incline DB Curl', badge:'isolation', sets:3, w:27, r:12, rest:75, compound:false,
           why:'Stretch position bicep loading — superior hypertrophy signal.',
           cues:['Arms hang straight. Supinate through curl.','3-sec negative.']},
          {id:'s5-hc', name:'Hammer Curl', badge:'isolation', sets:3, w:35, r:12, rest:75, compound:false,
           why:'Brachialis development — physically pushes bicep up.',
           cues:['Elbow pinned. Strict alternating.']},
        ]},
        { label:'Zone 2 · 22 min', cardio:true, exs:[
          {id:'s5-card', name:'Stationary Bike — Zone 2', badge:'cardio', cardioOnly:true,
           cardioDesc:'Low-impact finisher after upper-body accessory work. Steady cadence, easy resistance.', zone:'HR 120–140 BPM', duration:22}
        ]}
      ]
    };
    const days5 = [ua, la, shoulders,
      {...ub, key:'day4', label: ub.label.replace(/^Day \d+/, 'Day 4')},
      {...lb, key:'day5', label: lb.label.replace(/^Day \d+/, 'Day 5')}];
    // C4: bank-built shoulders day already dedupes at selection time (shared
    // `used` set) — legacy press-swap only guards the hardcoded fallback.
    return dedupeConsecutiveDays(base4.shouldersArmsDay ? days5 : dedupePressingBuild5(days5));
  };

  // 2-day: Full Body A/B — push+hinge / pull+quad
  const build2 = (base4) => {
    const [ua, la, ub, lb] = base4;
    // GEN-fix: carry a Core Block into each full-body day (day A from the
    // push day, day B from the quad day — distinct exercises via the
    // generator's shared `used` set).
    const coreOf = (d) => d.blocks.find(b => !b.cardio && (b.label||'').toLowerCase().includes('core')) || null;
    const coreA = coreOf(ua) || coreOf(la);
    const coreB = coreOf(lb) || coreOf(ub);
    const dayABlocks = [
      { label:'Compound Block', exs:[ ua.blocks[0].exs[0], la.blocks[0].exs[0] ].filter(Boolean) },
      { label:'Accessory Block', exs:[ ub.blocks[0].exs[1], lb.blocks[1]?.exs[0], la.blocks[1]?.exs[2] || la.blocks[1]?.exs[1] ].filter(Boolean) },
    ];
    if (coreA) dayABlocks.push({ ...coreA, exs:[...coreA.exs] });
    dayABlocks.push({ ...(la.blocks.find(b=>b.cardio) || ub.blocks.find(b=>b.cardio)), label:'Zone 2 Finisher · 20 min' });
    const dayBBlocks = [
      { label:'Compound Block', exs:[ ub.blocks[0].exs[0], lb.blocks[0].exs[0] ].filter(Boolean) },
      { label:'Accessory Block', exs:[ ua.blocks[0].exs[1], la.blocks[1]?.exs[0], ub.blocks[1]?.exs[1] ].filter(Boolean) },
    ];
    if (coreB) dayBBlocks.push({ ...coreB, exs:[...coreB.exs] });
    dayBBlocks.push({ ...(lb.blocks.find(b=>b.cardio) || la.blocks.find(b=>b.cardio)), label:'Zone 2 Finisher · 20 min' });
    return dedupeConsecutiveDays([
      { key:'day1', label:'Day 1 · Full Body A', color:'var(--accent)',
        rationale:'Push + hinge emphasis. Bench and RDL are the two primary compounds. Accessories fill upper pull and quad so nothing gets neglected across the week.',
        blocks: dayABlocks
      },
      { key:'day2', label:'Day 2 · Full Body B', color:'var(--blue)',
        rationale:'Pull + quad emphasis. Lat pulldown and hack squat as primary compounds. Accessories cover push and posterior chain to balance Day A.',
        blocks: dayBBlocks
      }
    ]);
  };

  // 6-day: PPL ×2 — each muscle group trained 2×/week (frequency research). The
  // two rotations share exercise selection by design (block-stable per doctrine
  // D1 — the same lifts twice a week is a feature, not churn); the two Legs days
  // differ (hinge vs quad). dedupeConsecutiveDays guards adjacent-day collisions;
  // the non-adjacent Push A/B (and Pull A/B) repeats are intended.
  const build6 = (base4) => {
    const [ua, la, ub, lb] = base4;
    const relabel = (d, key, label) => ({ ...d, key, label, rationale: d.rationale });
    return dedupeConsecutiveDays([
      relabel(ua, 'day1', 'Day 1 · Push A'),
      relabel(ub, 'day2', 'Day 2 · Pull A'),
      relabel(la, 'day3', 'Day 3 · Legs A · Hinge'),
      relabel(ua, 'day4', 'Day 4 · Push B'),
      relabel(ub, 'day5', 'Day 5 · Pull B'),
      relabel(lb, 'day6', 'Day 6 · Legs B · Quad'),
    ]);
  };

  // ─── Female programs ────────────────────────────────────────────────────────
  const femalePrograms = {
    fat_burn: {
      4: [
        { key:'day1', label:'Day 1 · Upper Circuit', color:'var(--red)', rationale:'Upper body circuit with short rest to keep heart rate elevated.',
          blocks:[
            {label:'Compound Block · Rest 60 sec', exs:[
              {id:'fbf-bench', name:'DB Bench Press', badge:'compound', sets:4, w:20, r:15, rest:60, compound:true,
               why:'DB press at higher reps creates metabolic demand while developing chest and shoulders.',
               cues:['Retract shoulder blades before pressing.','Full range — DBs at chest level at bottom.','Controlled 2-sec eccentric every rep.']},
              {id:'fbf-press', name:'Arnold Press', badge:'compound', sets:3, w:15, r:15, rest:60, compound:true,
               why:'Full delt recruitment in one movement. The rotation hits all three heads.',
               cues:['Start palms facing you. Rotate outward as you press.','Elbows slightly in front of torso.','Core braced — no lumbar arch.']},
            ]},
            {label:'Accessory Block · Rest 45 sec', exs:[
              {id:'fbf-lat', name:'Cable Lateral Raise', badge:'isolation', sets:3, w:7.5, r:20, rest:45, compound:false,
               why:'Lateral delt creates shoulder-to-waist ratio. High reps and short rest maximize development.',
               cues:['Lead with elbow — pinky slightly higher than thumb.','Stop at shoulder height.','4-sec negative.']},
              {id:'fbf-kick', name:'Cable Kickback', badge:'isolation', sets:3, w:15, r:20, rest:45, compound:false,
               why:'Tricep isolation at higher reps. Full extension at the top builds definition.',
               cues:['Slight forward hinge. Upper arm stays parallel to floor.','Full extension — squeeze 1 second.','Controlled return.']},
              {id:'fbf-push', name:'Tricep Rope Pushdown', badge:'isolation', sets:3, w:20, r:20, rest:45, compound:false,
               why:'High-rep pushdowns create metabolic demand and definition in the tricep.',
               cues:['15° forward hinge.','Full extension at bottom. Squeeze 1 second.','Drop weight on final set, continue to failure.']},
            ]},
            {label:'Core Block · Rest 30 sec', exs:[
              {id:'fbf-mon-db', name:'Dead Bug', badge:'core', sets:3, w:0, r:10, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Anti-rotation movement that builds deep core stability without spinal shear.',
               cues:['Lie on back. Arms to ceiling, knees at 90°.','Lower opposite arm and leg. Lower back stays pressed to floor.','10 per side = 1 set.']},
              {id:'fbf-mon-sp', name:'Side Plank', badge:'core', sets:3, w:0, r:30, rest:30, compound:false, isCore:true, unit:'sec',
               why:'Lateral core stability. Quadratus lumborum and oblique strength.',
               cues:['Elbow under shoulder. Hips stacked. Drive hips up.','30 sec each side.']},
            ]},
            {label:'Cardio Finisher · 25 min', cardio:true, exs:[
              {id:'fbf-cardio1', name:'Incline Treadmill — Zone 2', badge:'cardio', cardioOnly:true,
               cardioDesc:'3–4% incline, 3.0–3.3 mph. Glycogen partially depleted — body pulls from fat stores.', zone:'HR 130–145 BPM', duration:25}
            ]}
          ]
        },
        { key:'day2', label:'Day 2 · Lower Circuit', color:'var(--orange)', rationale:'Hip thrust primary — highest glute activation of any exercise. Lower body fat burn through the largest muscle groups.',
          blocks:[
            {label:'Compound Block · Rest 75 sec', exs:[
              {id:'fbf-hip', name:'Hip Thrust', badge:'compound', sets:4, w:45, r:15, rest:75, compound:true,
               why:'Highest glute EMG activation of any exercise. At higher reps, becomes metabolically demanding while building the glutes.',
               cues:['Bench at shoulder blade base. Feet flat, shoulder-width.','Drive through full foot. 2-sec hold at top.','Chin tucked. Do not hyperextend the spine.']},
              {id:'fbf-rdl', name:'Romanian Deadlift', badge:'compound', sets:3, w:35, r:15, rest:75, compound:true,
               why:'Constant hamstring tension throughout. Hip hinge pattern builds posterior chain.',
               cues:['Push hips back — not down.','DBs against legs throughout descent.','Hamstring stretch at bottom. Drive hips forward at top.']},
            ]},
            {label:'Accessory Block · Rest 45 sec', exs:[
              {id:'fbf-lcurl', name:'Lying Leg Curl', badge:'isolation', sets:3, w:30, r:15, rest:45, compound:false,
               why:'Direct hamstring isolation. Short rest elevates HR for the cardio transition.',
               cues:['Hips pressed into pad throughout.','Full extension every rep.','3-sec eccentric.']},
              {id:'fbf-ext', name:'Leg Extension', badge:'isolation', sets:3, w:30, r:20, rest:45, compound:false,
               why:'VMO isolation at high reps — the quad muscle that shows composition change first.',
               cues:['Pad at base of shin.','Full extension, 1-sec squeeze at top.','Slow controlled return.']},
              {id:'fbf-abd', name:'Abductor Machine', badge:'isolation', sets:3, w:60, r:20, rest:45, compound:false,
               why:'Glute medius creates hip shape and stabilizes every lower body movement.',
               cues:['Slight forward lean — loads glute med, not TFL.','Full range, hold at end.','Control the return.']},
            ]},
            {label:'Core Block · Rest 30 sec', exs:[
              {id:'fbf-tue-be', name:'Back Extension', badge:'core', sets:3, w:0, r:15, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Posterior chain core pairs with hip hinge day. Direct erector training reduces lower back injury risk.',
               cues:['Neutral spine. Brace abs before moving.','Rise until body is straight — not hyperextended.','2-sec hold. 3-sec lower.']},
              {id:'fbf-tue-rc', name:'Reverse Crunch', badge:'core', sets:3, w:0, r:15, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Lower rectus abdominis through hip flexion. No neck strain, no lumbar compression.',
               cues:['Lie flat. Knees at 90°.','Curl hips off the floor using abs.','3-sec eccentric.']},
            ]},
            {label:'Cardio Finisher · 25 min', cardio:true, exs:[
              {id:'fbf-cardio2', name:'Stationary Bike — Zone 2', badge:'cardio', cardioOnly:true,
               cardioDesc:'Post-leg. Keeps hips and quads moving without impact. Low resistance, steady cadence.', zone:'HR 120–140 BPM', duration:25}
            ]}
          ]
        },
        { key:'day3', label:'Day 3 · Upper Burn', color:'var(--red)', rationale:'Pull-dominant upper session. Back and bicep work balanced with shoulder health.',
          blocks:[
            {label:'Compound Block · Rest 60 sec', exs:[
              {id:'fbf-pull', name:'Lat Pulldown', badge:'compound', sets:4, w:40, r:15, rest:60, compound:true,
               why:'Lat pulldown at short rest hits the largest upper body muscle and creates significant metabolic demand.',
               cues:['Lean 10–15 degrees back. Lead with elbows.','Full dead hang at top.','Chest up throughout.']},
              {id:'fbf-row', name:'Seated Cable Row', badge:'compound', sets:4, w:40, r:15, rest:60, compound:true,
               why:'Upper back development. The muscles that create posture.',
               cues:['Torso upright. No rocking.','Elbows wide. Handle to lower sternum.','Full scapular protraction between reps.']},
            ]},
            {label:'Accessory Block · Rest 45 sec', exs:[
              {id:'fbf-face', name:'Face Pull', badge:'isolation', sets:3, w:20, r:20, rest:45, compound:false,
               why:'Shoulder health non-negotiable. Counters internal rotation from pressing.',
               cues:['Pull to ears. End position: hands behind ears, elbows wide.','Light weight — corrective.']},
              {id:'fbf-curl', name:'Incline DB Curl', badge:'isolation', sets:3, w:12.5, r:15, rest:45, compound:false,
               why:'Stretch-position curl creates greater bicep hypertrophy stimulus.',
               cues:['Arms hang straight at start. Shoulder stays back.','Supinate through the curl.','3-sec slow negative.']},
              {id:'fbf-ham', name:'Hammer Curl', badge:'isolation', sets:3, w:12.5, r:15, rest:45, compound:false,
               why:'Brachialis development adds to arm definition.',
               cues:['Elbow pinned to side. Strict alternating.','Full extension at bottom.']},
            ]},
            {label:'Core Block · Rest 30 sec', exs:[
              {id:'fbf-thu-cc', name:'Cable Crunch', badge:'core', sets:3, w:25, r:15, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Only weighted core exercise with progressive overload. Constant tension builds visible abs.',
               cues:['Kneel facing cable. Rope at forehead.','Crunch DOWN toward knees.','Hold 1 sec at bottom.']},
              {id:'fbf-thu-bd', name:'Bird Dog', badge:'core', sets:3, w:0, r:10, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Builds lumbar extensors and glute coordination. No spinal compression.',
               cues:['On all fours. Extend opposite arm and leg.','Back stays level — no rotation.','5-sec hold. 10 per side = 1 set.']},
            ]},
            {label:'Cardio Finisher · 25 min', cardio:true, exs:[
              {id:'fbf-cardio3', name:'Elliptical — Zone 2', badge:'cardio', cardioOnly:true,
               cardioDesc:'Low-impact full-body. Keeps total burn high without stressing the fatigued back.', zone:'HR 125–145 BPM', duration:25}
            ]}
          ]
        },
        { key:'day4', label:'Day 4 · Lower Burn', color:'var(--orange)', rationale:'Unilateral lower session. Bulgarian split squat primary — single-leg work maximizes glute development and corrects imbalances.',
          blocks:[
            {label:'Compound Block · Rest 75 sec', exs:[
              {id:'fbf-bss', name:'Bulgarian Split Squat', badge:'compound', sets:4, w:15, r:12, rest:75, compound:true,
               why:'Single-leg compound — maximum glute and quad development. Catches and corrects left-right imbalances.',
               cues:['Rear foot elevated. Front foot far enough for vertical shin.','Descend straight down.','Drive through the heel of the front foot.']},
              {id:'fbf-gob', name:'Goblet Squat', badge:'compound', sets:3, w:25, r:15, rest:75, compound:true,
               why:'Front-loaded squat forces upright torso — superior quad and glute activation.',
               cues:['Hold DB at chest. Elbows inside knees at bottom.','Below parallel — full depth.','Drive through full foot at top.']},
            ]},
            {label:'Accessory Block · Rest 45 sec', exs:[
              {id:'fbf-slcurl', name:'Single-Leg Curl', badge:'isolation', sets:3, w:20, r:15, rest:45, compound:false,
               why:'Unilateral hamstring work surfaces and corrects imbalances.',
               cues:['Hips pressed into pad. No lifting.','Full extension every rep.','3-sec eccentric.']},
              {id:'fbf-abd2', name:'Abductor Machine', badge:'isolation', sets:3, w:60, r:20, rest:45, compound:false,
               why:'Glute medius closes the session — essential for hip shape and lower body stability.',
               cues:['Forward lean. Full range. Hold at end position. Control return.']},
            ]},
            {label:'Core Block · Rest 30 sec', exs:[
              {id:'fbf-fri-pl', name:'Plank', badge:'core', sets:3, w:0, r:40, rest:30, compound:false, isCore:true, unit:'sec',
               why:'Anti-extension baseline. Reinforces the bracing pattern for the training week close.',
               cues:['Forearms under shoulders. Hips level.','Squeeze glutes and quads. Breathe.']},
              {id:'fbf-fri-hkr', name:'Hanging Knee Raise', badge:'core', sets:3, w:0, r:10, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Hip flexion decompresses the spine after lower compounds.',
               cues:['Hang from bar. Full shoulder extension.','Raise knees to hip height. Controlled.','3-sec lower. No swinging.']},
            ]},
            {label:'Cardio Finisher · 25 min', cardio:true, exs:[
              {id:'fbf-cardio4', name:'Bike — Easy Zone 2', badge:'cardio', cardioOnly:true,
               cardioDesc:'End of training week. Low resistance. Protect the weekend recovery window.', zone:'HR 110–130 BPM', duration:25}
            ]}
          ]
        }
      ]
    },
    build_muscle: {
      4: [
        { key:'day1', label:'Day 1 · Upper A', color:'var(--accent)', rationale:'Push-dominant upper day. Chest and shoulder compounds when CNS is freshest.',
          blocks:[
            {label:'Compound Block · Rest 2 min', exs:[
              {id:'bmf-bench', name:'DB Bench Press', badge:'compound', sets:4, w:20, r:12, rest:120, compound:true,
               why:'DB press demands more stabilizer recruitment than barbell — greater total muscle activation per rep.',
               cues:['Retract shoulder blades. DBs at chest level at bottom.','Press to lockout. Squeeze 1 sec at top.','3-sec eccentric every rep.']},
              {id:'bmf-press', name:'Arnold Press', badge:'compound', sets:3, w:15, r:12, rest:120, compound:true,
               why:'All three delt heads in one movement.',
               cues:['Palms facing you at chin. Rotate outward as you press.','Elbows in front of torso plane.','Core braced.']},
            ]},
            {label:'Accessory Block · Rest 75 sec', exs:[
              {id:'bmf-fly', name:'Cable Low-to-High Fly', badge:'isolation', sets:3, w:10, r:15, rest:75, compound:false,
               why:'Constant cable tension targets the sternal pec through full arc.',
               cues:['Slight forward lean, soft elbow bend.','Bring elbows together.','2-sec squeeze at the top.']},
              {id:'bmf-lat', name:'Cable Lateral Raise', badge:'isolation', sets:3, w:7.5, r:15, rest:60, compound:false,
               why:'Lateral delt builds shoulder-to-waist ratio.',
               cues:['Lead with elbow. Stop at shoulder height.','4-sec negative.']},
              {id:'bmf-kick', name:'Cable Kickback', badge:'isolation', sets:3, w:15, r:15, rest:75, compound:false,
               why:'Tricep isolation for arm definition.',
               cues:['Upper arm parallel to floor. Full extension — squeeze 1 second.']},
              {id:'bmf-push', name:'Tricep Rope Pushdown', badge:'isolation', sets:3, w:20, r:15, rest:75, compound:false,
               why:'Lateral and medial head finisher.',
               cues:['15° lean. Full extension. Drop set on last set.']},
            ]},
            {label:'Core Block · Rest 45 sec', exs:[
              {id:'bmf-mon-cc', name:'Cable Crunch', badge:'core', sets:3, w:25, r:12, rest:45, compound:false, isCore:true, unit:'reps',
               why:'The only ab exercise with direct progressive overload.',
               cues:['Rope at forehead. Crunch DOWN toward knees.','1-sec hold. Slow return.']},
              {id:'bmf-mon-db', name:'Dead Bug', badge:'core', sets:3, w:0, r:10, rest:45, compound:false, isCore:true, unit:'reps',
               why:'Builds transverse abdominis — the deep brace that protects the spine under load.',
               cues:['Lie on back. Arms to ceiling, knees 90°.','Lower opposite arm + leg. Back flat.','5-sec descent. 10 per side.']},
            ]},
            {label:'Zone 2 Finisher · 20 min', cardio:true, exs:[
              {id:'bmf-c1', name:'Incline Treadmill Walk', badge:'cardio', cardioOnly:true,
               cardioDesc:'3–4% incline. Post-lift fat oxidation window.', zone:'HR 120–140 BPM', duration:20}
            ]}
          ]
        },
        { key:'day2', label:'Day 2 · Lower A', color:'var(--blue)', rationale:'Hip thrust primary — highest glute activation of any exercise. Pairs with RDL for complete posterior chain.',
          blocks:[
            {label:'Compound Block · Rest 2–3 min', exs:[
              {id:'bmf-hip', name:'Hip Thrust', badge:'compound', sets:4, w:45, r:12, rest:150, compound:true,
               why:'Greatest glute EMG activation. Fully shortened position unique — squats and deadlifts never achieve it.',
               cues:['Bench at shoulder blades. Feet flat, shoulder-width.','Drive through full foot.','Level hips at top. 2-sec hold every rep.']},
              {id:'bmf-rdl', name:'Romanian Deadlift', badge:'compound', sets:4, w:35, r:12, rest:120, compound:true,
               why:'Constant hamstring tension throughout. Completes the posterior chain picture.',
               cues:['Push hips back — not down.','DBs against legs throughout.','Hamstring stretch at bottom. Drive hips forward at top.']},
              // Bulgarian Split Squat is a compound — keep it in the Compound Block, not sandwiched
              // between isolations in the Accessory Block (its prime movers, quads, aren't pre-exhausted
              // by the preceding Lying Leg Curl, so accessory placement was a genuine R3 mis-order).
              {id:'bmf-bss', name:'Bulgarian Split Squat', badge:'compound', sets:3, w:15, r:12, rest:90, compound:true,
               why:'Unilateral training catches and corrects left-right imbalances.',
               cues:['Rear foot elevated. Front foot far enough for vertical shin.','Drive through heel of front foot.']},
            ]},
            {label:'Accessory Block · Rest 75 sec', exs:[
              {id:'bmf-lcurl', name:'Lying Leg Curl', badge:'isolation', sets:3, w:30, r:12, rest:75, compound:false,
               why:'Knee flexion hits the short head of bicep femoris that RDL barely touches.',
               cues:['Hips pressed into pad. Full extension every rep.','3-sec eccentric.']},
              {id:'bmf-calf1', name:'Standing Calf Raise', badge:'isolation', sets:4, w:70, r:20, rest:45, compound:false,
               why:'Calves respond to volume. High reps, short rest, full range.',
               cues:['Full hang at bottom, pause. Full rise at top, pause.']},
            ]},
            {label:'Core Block · Rest 45 sec', exs:[
              {id:'bmf-tue-be', name:'Back Extension', badge:'core', sets:3, w:0, r:15, rest:45, compound:false, isCore:true, unit:'reps',
               why:'Posterior core on a posterior chain day. Direct erector work prevents breakdown under load.',
               cues:['Neutral spine. Brace before moving.','Rise until body is straight.','2-sec hold. 3-sec lower.']},
              {id:'bmf-tue-hlr', name:'Hanging Knee Raise', badge:'core', sets:3, w:0, r:10, rest:45, compound:false, isCore:true, unit:'reps',
               why:'Hip flexion decompresses lumbar after heavy deadlifts.',
               cues:['Dead hang. Raise knees to hip height or above.','3-sec lowering phase.']},
            ]},
            {label:'Zone 2 Finisher · 20 min', cardio:true, exs:[
              {id:'bmf-c2', name:'Stationary Bike', badge:'cardio', cardioOnly:true,
               cardioDesc:'Post-leg — bike over treadmill. Aids DOMS recovery without impact.', zone:'HR 120–140 BPM', duration:20}
            ]}
          ]
        },
        { key:'day3', label:'Day 3 · Upper B', color:'var(--green)', rationale:'Pull-dominant upper day. Rear delts treated as a priority for posture and shoulder health.',
          blocks:[
            {label:'Compound Block · Rest 2 min', exs:[
              {id:'bmf-pull', name:'Lat Pulldown', badge:'compound', sets:4, w:40, r:12, rest:120, compound:true,
               why:'Widest back muscle. Neutral grip allows fuller ROM and reduces rotator cuff strain.',
               cues:['Lean back 10–15 degrees.','Lead with elbows into back pockets.','Full dead hang at top.']},
              {id:'bmf-row', name:'Seated Cable Row', badge:'compound', sets:4, w:45, r:12, rest:120, compound:true,
               why:'Rhomboids, lower traps, rear delts — posture-building muscles.',
               cues:['Torso upright. No rocking.','Elbows wide and high. Handle to lower sternum.','Full scapular protraction between reps.']},
            ]},
            {label:'Accessory Block · Rest 75 sec', exs:[
              {id:'bmf-dbr', name:'Single-Arm DB Row', badge:'isolation', sets:3, w:25, r:12, rest:75, compound:false,
               why:'Unilateral work catches dominant-side compensation.',
               cues:['Row to hip, not chest.','Let shoulder drop at bottom for full protraction.','Slight rotation at top.']},
              {id:'bmf-face', name:'Face Pull', badge:'isolation', sets:3, w:20, r:20, rest:45, compound:false,
               why:'External rotation under load counters internal rotation torque from pressing.',
               cues:['Pull to ears. Hands end behind ears, elbows wide.','Light weight — corrective.']},
              {id:'bmf-icurl', name:'Incline DB Curl', badge:'isolation', sets:3, w:12.5, r:12, rest:75, compound:false,
               why:'Stretch-position loading produces greater hypertrophy than shortened position.',
               cues:['Arms hang straight. Supinate through curl.','3-sec slow negative.']},
              {id:'bmf-ham', name:'Hammer Curl', badge:'isolation', sets:3, w:12.5, r:12, rest:75, compound:false,
               why:'Brachialis development adds to arm definition.',
               cues:['Elbow pinned. Strict alternating. Full extension.']},
            ]},
            {label:'Core Block · Rest 45 sec', exs:[
              {id:'bmf-thu-aw', name:'Ab Wheel Rollout', badge:'core', sets:3, w:0, r:8, rest:45, compound:false, isCore:true, unit:'reps',
               why:'Highest anti-extension activation. Full anterior chain under leverage.',
               cues:['Start kneeling. Arms straight, wheel under shoulders.','Roll out slowly — back stays neutral.','Pull back by squeezing abs.']},
              {id:'bmf-thu-pp', name:'Pallof Press', badge:'core', sets:3, w:20, r:12, rest:45, compound:false, isCore:true, unit:'reps',
               why:'Most effective anti-rotation exercise with loadable resistance.',
               cues:['Stand sideways to cable. Press straight out, hold 2 sec.','12 per side.']},
            ]},
            {label:'Zone 2 Finisher · 20 min', cardio:true, exs:[
              {id:'bmf-c3', name:'Elliptical', badge:'cardio', cardioOnly:true,
               cardioDesc:'Upper pull day — elliptical preferred. Low impact.', zone:'HR 120–140 BPM', duration:20}
            ]}
          ]
        },
        { key:'day4', label:'Day 4 · Lower B', color:'var(--amber)', rationale:'Glute and quad session with unilateral emphasis. Bulgarian split squat as primary compound.',
          blocks:[
            {label:'Compound Block · Rest 2–3 min', exs:[
              {id:'bmf-bss2', name:'Bulgarian Split Squat', badge:'compound', sets:4, w:15, r:12, rest:150, compound:true,
               why:'Per-leg stimulus at significantly lower total load. Each leg works independently.',
               cues:['Rear foot elevated, laces down.','Front foot far for vertical shin.','Descend straight down. Torso upright.']},
              {id:'bmf-hip2', name:'Hip Thrust', badge:'compound', sets:3, w:45, r:12, rest:120, compound:true,
               why:'Fully shortened glute position — no squat achieves it. Primary glute builder.',
               cues:['Bench at shoulder blades. Drive through full foot.','2-sec hold at top. Level hips.']},
            ]},
            {label:'Accessory Block · Rest 75 sec', exs:[
              {id:'bmf-ext', name:'Leg Extension', badge:'isolation', sets:3, w:30, r:15, rest:75, compound:false,
               why:'VMO isolation — full extension produces unique quad signal.',
               cues:['Pad at base of shin. Full extension, 1-sec squeeze.','Slow controlled return.']},
              {id:'bmf-abd', name:'Abductor Machine', badge:'isolation', sets:3, w:70, r:20, rest:45, compound:false,
               why:'Glute medius stabilizes every lower body movement.',
               cues:['Forward lean — loads glute med, not TFL.','Full range, hold at end. Control return.']},
              {id:'bmf-calf2', name:'Seated Calf Raise', badge:'isolation', sets:4, w:45, r:20, rest:45, compound:false,
               why:'Soleus — only accessible with bent knee. High volume is the only stimulus it responds to.',
               cues:['Full stretch and rise. Pause at both ends.']},
            ]},
            {label:'Core Block · Rest 45 sec', exs:[
              {id:'bmf-fri-sp', name:'Side Plank', badge:'core', sets:3, w:0, r:35, rest:45, compound:false, isCore:true, unit:'sec',
               why:'Lateral core training after heavy unilateral loads. Reinforces hip-stabilizer chain.',
               cues:['Elbow under shoulder. Drive hips up. 35 sec each side.']},
              {id:'bmf-fri-rc', name:'Reverse Crunch', badge:'core', sets:3, w:0, r:15, rest:45, compound:false, isCore:true, unit:'reps',
               why:'Lower rectus through hip flexion. No neck involvement.',
               cues:['Roll hips off floor using abs.','3-sec lowering. Feet stay off ground between reps.']},
            ]},
            {label:'Zone 2 Finisher · 20 min', cardio:true, exs:[
              {id:'bmf-c4', name:'Stationary Bike', badge:'cardio', cardioOnly:true,
               cardioDesc:'End of week. Low resistance. Weekend recovery window.', zone:'HR 110–130 BPM', duration:20}
            ]}
          ]
        }
      ]
    },
    transform: {
      4: [
        { key:'day1', label:'Day 1 · Push + Pull', color:'var(--teal)', rationale:'Antagonist supersets — push and pull paired to keep heart rate elevated while allowing partial recovery.',
          blocks:[
            {label:'Superset A · Rest 90 sec', exs:[
              {id:'trf-bench', name:'DB Bench Press', badge:'compound', sets:4, w:20, r:12, rest:90, compound:true,
               why:'DBs demand more stabilizer recruitment. Superset with rows for elevated heart rate.',
               cues:['Scapulae retracted. DBs at chest at bottom.','Press to lockout. Squeeze 1 sec at top.','Alternate with rows — no rest between.']},
              {id:'trf-row', name:'Dumbbell Row', badge:'compound', sets:4, w:25, r:12, rest:90, compound:true,
               why:'Paired with bench — while chest recovers, back works.',
               cues:['Row to hip, not chest.','Let shoulder protract at bottom.','Slight rotation at top.']},
            ]},
            {label:'Superset B · Rest 60 sec', exs:[
              {id:'trf-push', name:'Push-Up', badge:'compound', sets:3, w:0, r:15, rest:60, compound:true,
               why:'Bodyweight push after DB bench pre-exhausts the chest metabolically.',
               cues:['Hands just outside shoulders. Elbows 45°.','Full lockout at top. Chest to floor.']},
              {id:'trf-face', name:'Face Pull', badge:'isolation', sets:3, w:20, r:15, rest:60, compound:false,
               why:'External rotation paired with push-ups. Shoulder health.',
               cues:['Pull to ears. Elbows wide. Light weight — corrective.']},
            ]},
            {label:'Accessory Block · Rest 45 sec', exs:[
              {id:'trf-lat', name:'Cable Lateral Raise', badge:'isolation', sets:3, w:7.5, r:15, rest:45, compound:false,
               why:'Shoulder-to-waist ratio builder. Constant cable tension.',
               cues:['Lead with elbow. Stop at shoulder height. 4-sec negative.']},
              {id:'trf-kick', name:'Cable Kickback', badge:'isolation', sets:3, w:15, r:15, rest:45, compound:false,
               why:'Tricep definition. Full extension for maximum contraction.',
               cues:['Upper arm parallel to floor. Full extension, squeeze.']},
            ]},
            {label:'Core Block · Rest 30 sec', exs:[
              {id:'trf-mon-db', name:'Dead Bug', badge:'core', sets:3, w:0, r:10, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Deep core stability. Trains the brace that makes heavy paired sets safer.',
               cues:['Arms to ceiling, knees 90°. Lower opposite arm + leg. Back flat.','5-sec descent. 10 per side.']},
              {id:'trf-mon-pp', name:'Pallof Press', badge:'core', sets:3, w:20, r:12, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Anti-rotation under load — transfers to pressing and rowing stability.',
               cues:['Stand sideways to cable. Press straight out, hold 2 sec. 12 per side.']},
            ]},
            {label:'HIIT Finisher · 15 min', cardio:true, exs:[
              {id:'trf-c1', name:'Rower — Intervals', badge:'cardio', cardioOnly:true,
               cardioDesc:'30 sec hard / 30 sec easy × 15 rounds. Full-body intervals maximize EPOC.', zone:'HR 150–170 BPM intervals', duration:15}
            ]}
          ]
        },
        { key:'day2', label:'Day 2 · Lower A', color:'var(--orange)', rationale:'Hip thrust and RDL as primary compounds. Largest muscle groups burn the most calories.',
          blocks:[
            {label:'Compound Block · Rest 2 min', exs:[
              {id:'trf-hip', name:'Hip Thrust', badge:'compound', sets:4, w:45, r:12, rest:120, compound:true,
               why:'Greatest glute activation. Glutes are the largest muscle — training them hard burns the most calories.',
               cues:['Bench at shoulder blades. Feet flat, shoulder-width.','Drive through full foot. 2-sec hold at top.','Level hips. Chin tucked.']},
              {id:'trf-rdl', name:'Romanian Deadlift', badge:'compound', sets:4, w:35, r:12, rest:120, compound:true,
               why:'Posterior chain under constant tension. Complements hip thrust for total lower body development.',
               cues:['Hip hinge — hips back, not down.','DBs against legs throughout.','Hamstring stretch at bottom. Drive hips forward.']},
            ]},
            {label:'Superset Block · Rest 60 sec', exs:[
              {id:'trf-ext', name:'Leg Extension', badge:'isolation', sets:3, w:30, r:15, rest:60, compound:false,
               why:'Quad isolation paired with hamstring curl — antagonist superset. Brutal metabolic pump.',
               cues:['Pad at base of shin. Full extension, 1-sec squeeze.']},
              {id:'trf-lcurl', name:'Lying Leg Curl', badge:'isolation', sets:3, w:30, r:15, rest:60, compound:false,
               why:'Paired with extensions — while quads recover, hamstrings work.',
               cues:['Hips pressed into pad. Full extension every rep. 3-sec eccentric.']},
            ]},
            {label:'Core Block · Rest 30 sec', exs:[
              {id:'trf-tue-be', name:'Back Extension', badge:'core', sets:3, w:0, r:15, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Posterior core on a heavy lower day. Direct erector work accelerates adaptation.',
               cues:['Neutral spine. Brace abs. Lift until body is straight. 2-sec hold.']},
              {id:'trf-tue-sp', name:'Side Plank', badge:'core', sets:3, w:0, r:35, rest:30, compound:false, isCore:true, unit:'sec',
               why:'Lateral stability for the recomp athlete. Anti-lateral core for HIIT.',
               cues:['Elbow under shoulder. Stack hips. 35 sec each side.']},
            ]},
            {label:'Metabolic Finisher · 15 min', cardio:true, exs:[
              {id:'trf-c2', name:'KB Swing — Intervals', badge:'cardio', cardioOnly:true,
               cardioDesc:'30 sec on / 30 sec off × 15 rounds. Posterior chain power + cardiovascular conditioning.', zone:'HR 145–165 BPM intervals', duration:15}
            ]}
          ]
        },
        { key:'day3', label:'Day 3 · Pull + Push', color:'var(--blue)', rationale:'Pull-dominant upper with antagonist supersets. Reverses Monday push emphasis.',
          blocks:[
            {label:'Superset A · Rest 90 sec', exs:[
              {id:'trf-pull', name:'Lat Pulldown', badge:'compound', sets:4, w:40, r:12, rest:90, compound:true,
               why:'Widest back muscle — V-taper foundation. Paired with pressing for elevated heart rate.',
               cues:['Lean back 10–15°. Lead with elbows.','Full dead hang at top.']},
              {id:'trf-apress', name:'Arnold Press', badge:'compound', sets:4, w:15, r:12, rest:90, compound:true,
               why:'Full three-head delt recruitment. Paired with pulldowns — while delts press, lats recover.',
               cues:['Palms facing you at chin. Rotate outward.','Elbows in front of torso throughout.']},
            ]},
            {label:'Superset B · Rest 60 sec', exs:[
              {id:'trf-crow', name:'Seated Cable Row', badge:'compound', sets:3, w:45, r:12, rest:60, compound:true,
               why:'Horizontal pull — rhomboids, mid-traps, rear delts. Posture-building muscles.',
               cues:['Torso upright. Elbows wide. Handle to lower sternum.','Full scapular protraction between reps.']},
              {id:'trf-fly', name:'Cable Low-to-High Fly', badge:'isolation', sets:3, w:10, r:12, rest:60, compound:false,
               why:'Constant tension chest fly. Paired with rows — chest works while back recovers.',
               cues:['Slight forward lean, soft elbow bend. Bring elbows together.','2-sec squeeze at top.']},
            ]},
            {label:'Accessory Block · Rest 45 sec', exs:[
              {id:'trf-icurl', name:'Incline DB Curl', badge:'isolation', sets:3, w:12.5, r:12, rest:45, compound:false,
               why:'Stretch-position bicep loading — superior hypertrophy signal.',
               cues:['Arms hang straight. Supinate through curl. 3-sec negative.']},
              {id:'trf-pushd', name:'Tricep Rope Pushdown', badge:'isolation', sets:3, w:20, r:15, rest:45, compound:false,
               why:'Lateral and medial head isolation. Short rest keeps metabolic cost high.',
               cues:['15° lean. Full extension. Drop 30% on last set.']},
            ]},
            {label:'Core Block · Rest 30 sec', exs:[
              {id:'trf-thu-cc', name:'Cable Crunch', badge:'core', sets:3, w:25, r:12, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Loaded flexion counterbalances the spinal extension from pulling movements.',
               cues:['Rope at forehead. Crunch DOWN — elbows toward knees.','1-sec hold. Slow return.']},
              {id:'trf-thu-bd', name:'Bird Dog', badge:'core', sets:3, w:0, r:10, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Erector and glute coordination. Active recovery on high-volume upper day.',
               cues:['All fours. Opposite arm + leg extended. Back level. 5-sec hold. 10 per side.']},
            ]},
            {label:'HIIT Finisher · 15 min', cardio:true, exs:[
              {id:'trf-c3', name:'Bike — Sprint Intervals', badge:'cardio', cardioOnly:true,
               cardioDesc:'20 sec all-out / 40 sec cruise × 15 rounds. Preserve muscle while creating EPOC.', zone:'HR 150–175 BPM sprints', duration:15}
            ]}
          ]
        },
        { key:'day4', label:'Day 4 · Lower B', color:'var(--amber)', rationale:'Unilateral lower emphasis. Bulgarian split squat primary. Metabolic finisher closes the training week.',
          blocks:[
            {label:'Compound Block · Rest 2 min', exs:[
              {id:'trf-bss', name:'Bulgarian Split Squat', badge:'compound', sets:4, w:15, r:12, rest:120, compound:true,
               why:'Maximum per-leg stimulus at lower total load. Each leg works independently.',
               cues:['Rear foot elevated. Front foot far for vertical shin.','Descend straight down. Torso upright.']},
              {id:'trf-hip2', name:'Hip Thrust', badge:'compound', sets:4, w:45, r:12, rest:120, compound:true,
               why:'Closes lower day with maximum glute stimulus.',
               cues:['Bench at shoulder blades. 2-sec hold at top. Level hips.']},
            ]},
            {label:'Superset Block · Rest 60 sec', exs:[
              {id:'trf-goblet', name:'Goblet Squat', badge:'compound', sets:3, w:25, r:15, rest:60, compound:true,
               why:'Front-loaded squat forces upright torso — superior quad activation.',
               cues:['Hold DB at chest. Elbows inside knees. Below parallel. Drive through full foot.']},
              {id:'trf-calf', name:'Standing Calf Raise', badge:'isolation', sets:3, w:70, r:20, rest:60, compound:false,
               why:'Calves respond to volume. Paired with squats to keep HR elevated.',
               cues:['Full hang at bottom. Full rise at top. Pause at both ends.']},
            ]},
            {label:'Core Block · Rest 30 sec', exs:[
              {id:'trf-fri-aw', name:'Ab Wheel Rollout', badge:'core', sets:3, w:0, r:8, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Highest anti-extension activation. Anterior core is warm after lower compounds.',
               cues:['Kneel, wheel under shoulders. Roll out slowly — back stays neutral.','Pull back by squeezing abs.']},
              {id:'trf-fri-hkr', name:'Hanging Knee Raise', badge:'core', sets:3, w:0, r:12, rest:30, compound:false, isCore:true, unit:'reps',
               why:'Hip flexion decompresses spine after heavy lower work. Closes training week.',
               cues:['Hang from bar. Raise knees to hip height. 3-sec lower. No swinging.']},
            ]},
            {label:'Metabolic Finisher · 15 min', cardio:true, exs:[
              {id:'trf-c4', name:'Incline Treadmill — Intervals', badge:'cardio', cardioOnly:true,
               cardioDesc:'1 min fast walk (10% incline) / 1 min easy × 7–8 rounds. Joint-friendly after heavy legs.', zone:'HR 135–160 BPM intervals', duration:15}
            ]}
          ]
        }
      ]
    }
  };
  // ─── End female programs ─────────────────────────────────────────────────────

  const activePrograms = isFemale ? femalePrograms : programs;

  // Dynamic engine — ALWAYS the source of every workout. The exercise bank is the
  // single source of truth; equipment tier, emphasis, and injuries all flow through
  // buildDynamicProgram. This block lives here, after the build2/ppl/build5 const
  // helpers above are initialized — calling them from the top of getProgram hit
  // their temporal dead zone (TDZ).
  const generated = buildDynamicProgram(goal, days, weeks, sex, tier, focus, injuries, maxDb, rotation, experience);
  if (generated) {
    // EPIC-8a: applied AFTER the 2/3/5-day wrappers + injury prune, on the
    // final day array — the wrappers recombine exercises from multiple base
    // days (e.g. ppl()'s Legs day) so flagging earlier could tag an exercise
    // that ends up dropped, or double-flag a day the wrapper passes through
    // unchanged.
    const flagAdvanced = (program) => {
      if (normalizeExperience(experience) === 'advanced' && program) program.forEach(flagDropSet);
      return program;
    };
    // Final injury prune — catches statically-injected exercises (build5's
    // shoulder block) that bypass the bank-level filter inside the generator.
    // Then apply the deload week (Part B / doctrine D4) on every path.
    const built = days === 2 ? build2(generated) : days === 3 ? ppl(generated) : days === 5 ? build5(generated) : days === 6 ? build6(generated) : generated;
    return flagAdvanced(applyDeload(applySupersets(applyGoalVolume(pruneInjuries(built, injuries), goal), goal), rotation, weeks));
  }

  // ── Silent emergency fallback ──────────────────────────────────────────────
  // The generator should never return null in normal use. If it does (bank gap,
  // unknown goal), fall back to the curated static base so the user still gets a
  // workout. This path is NOT expected in production — warn so it's caught.
  console.warn('[getProgram] dynamic engine returned null — falling back to static base', { goal, days, tier });
  if (!activePrograms[goal]) return applyDeload(activePrograms.build_muscle?.[4] || programs.build_muscle[4], rotation, weeks);

  const base = activePrograms[goal][4] || programs.build_muscle[4];
  const built = days === 2 ? build2(base) : days === 3 ? ppl(base) : days === 5 ? build5(base) : days === 6 ? build6(base) : base;
  // honorAuthoredRest FIRST, so applySupersets' shorter superset window still wins:
  // pairIntoSupersets sets authoredRest explicitly and therefore overwrites it.
  return applyDeload(applySupersets(applyGoalVolume(honorAuthoredRest(built), goal), goal), rotation, weeks);
}

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

// Phase definitions per goal
const PHASES = {
  fat_burn: [
    {name:'Metabolic Foundation', intent:'Build work capacity and movement quality. High rep start, descending across the 3-week block — volume then intensity.',             weeks:[1,3],  reps:'15·12·10', restComp:60,  restAcc:45,  incComp:2.5, incAcc:2.5, pctTop:10, pctInc:10},
    {name:'Metabolic Intensify',  intent:'Increase load while maintaining short rest. The sweet spot for fat loss + strength.',                                             weeks:[4,6],  reps:'12·10·8',  restComp:75,  restAcc:60,  incComp:5,   incAcc:2.5, pctTop:8,  pctInc:10},
    {name:'Power Burn',           intent:'Heavy compounds, metabolic finishers. Most demanding phase for simultaneous fat loss.',                                           weeks:[7,9],  reps:'10·8·6',   restComp:90,  restAcc:60,  incComp:5,   incAcc:5,   pctTop:6,  pctInc:8},
    {name:'Peak Conditioning',    intent:'Maximum output. You are significantly leaner and stronger than week 1.',                                                          weeks:[10,12],reps:'8·7·6',    restComp:90,  restAcc:60,  incComp:5,   incAcc:5,   pctTop:6,  pctInc:6}
  ],
  build_muscle: [
    {name:'Hypertrophy Foundation',intent:'Establish movement patterns. High volume descending across 3 weeks — technique then load.',                                        weeks:[1,3],  reps:'12·10·8',  restComp:120, restAcc:75,  incComp:5,   incAcc:2.5, pctTop:8,  pctInc:8},
    {name:'Strength Build',        intent:'Load increases, volume holds. Strength adaptations accelerate this phase.',                                                      weeks:[4,6],  reps:'10·8·6',   restComp:120, restAcc:90,  incComp:5,   incAcc:5,   pctTop:6,  pctInc:6},
    {name:'Power Phase',           intent:'Heavier compounds. Short accessory rest. Highest hypertrophy signal of the program.',                                            weeks:[7,9],  reps:'8·6·5',    restComp:150, restAcc:90,  incComp:10,  incAcc:5,   pctTop:5,  pctInc:5},
    {name:'Peak Strength',         intent:'Maximum load. Neural efficiency peaks. You are stronger than week 1 at every lift.',                                             weeks:[10,12],reps:'6·5·4',    restComp:180, restAcc:90,  incComp:5,   incAcc:5,   pctTop:4,  pctInc:3}
  ],
  transform: [
    {name:'Recomp Foundation',    intent:'Moderate deficit, high protein, progressive overload. Rep range descends across 3 weeks — establishes the work capacity base.',    weeks:[1,3],  reps:'12·10·8',  restComp:90,  restAcc:60,  incComp:5,   incAcc:2.5, pctTop:8,  pctInc:8},
    {name:'Recomp Build',         intent:'Add load, maintain intensity. Muscle grows while fat continues to drop. Floor at 8 reps — no heavier in a deficit.',             weeks:[4,6],  reps:'10·9·8',   restComp:90,  restAcc:60,  incComp:5,   incAcc:5,   pctTop:8,  pctInc:6,
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
    {name:'Recomp Power',         intent:'Heaviest phase. Body composition changes become visually apparent. 8-rep floor maintained throughout.',                           weeks:[7,9],  reps:'9·8·8',    restComp:120, restAcc:75,  incComp:10,  incAcc:5,   pctTop:8,  pctInc:5,
     subs:{
       // Power phase: moves from DB to barbell (higher absolute load ceiling). Keeps 30° angle — same upper-pec stimulus, adds barbell strength capacity.
       'tr-dbench': {id:'tr-libar',  name:'Low Incline Barbell Press', badge:'compound',
         why:'Barbell load ceiling for the power phase. 30° incline is the mechanically safest pressing angle for the shoulder joint. Same vector as the Incline DB from Build, now with barbell to allow heavier absolute loading needed for the power phase.',
         cues:['Retract scapula into the bench','Lower bar to mid-chest','Drive through heels to the floor','Full lockout at top']},
       'trf-bench': {id:'trf-libar', name:'Low Incline Barbell Press', badge:'compound',
         why:'Barbell load ceiling for the power phase. 30° incline is the mechanically safest pressing angle for the shoulder joint. Same vector as the Incline DB from Build, now with barbell to allow heavier absolute loading needed for the power phase.',
         cues:['Retract scapula into the bench','Lower bar to mid-chest','Drive through heels to the floor','Full lockout at top']}
     }},
    {name:'Recomp Peak',          intent:'The results phase. Scale may barely move but the mirror tells the real story. Load is at its peak — 8 reps all week.',           weeks:[10,12],reps:'8·8·8',    restComp:120, restAcc:75,  incComp:5,   incAcc:5,   pctTop:8,  pctInc:3,
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
    why:'Band tension rises through the arc, peaking in the shortened position where the pec produces most force — the inverse of a dumbbell fly. Pure travel-friendly chest isolation needing only a band and an anchor.',
    cues:['Anchor the band behind you at chest height','Soft elbows, hug forward until hands meet','Squeeze the pecs hard for one count','Resist the band back to a full stretch']},

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
    why:'The T-raise targets the middle trapezius and posterior delt in a no-equipment setting. Alongside Y-raise, it completes the upper back health trifecta for anyone training at home or travelling.',
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
    muscleGroups:{primary:['lat_dorsi','bicep'],secondary:['posterior_delt','rhomboid']},
    emphasis:['back','biceps','pull','upper_body'], equipment:'bodyweight', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'Supinated grip shifts load heavily toward biceps versus pull-ups. Most people can chin-up before they can pull-up — a useful progression. Bicep involvement makes it a two-muscle-in-one movement for smaller day counts.',
    cues:['Supinated grip (palms toward face)','Full dead hang at bottom','Elbows drive down and in toward hips','Chin clears bar — pause at top']},
  'straight-arm-pulldown':{
    name:'Straight-Arm Pulldown', videoId:null,
    muscleGroups:{primary:['lat_dorsi'],secondary:['long_head_tricep','posterior_delt']},
    emphasis:['back','pull','upper_body'], equipment:'cable', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'The only movement that isolates the lat without any bicep contribution — the arm stays straight throughout. Trains the lat-to-hip-drive pattern that makes deadlifts and rows stronger.',
    cues:['Cable overhead, arms straight throughout','Hinge forward at hips 45°','Drive arms down and back to hips — not to thighs','Squeeze lats at the bottom; arms stop at hip height']},

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
    why:'The simplest tool for external rotation and posterior delt health. Constant band tension mirrors the load profile of cable face pulls without any machine. Essential for hotel or home training.',
    cues:['Hold band at shoulder height, arms extended','Pull the band apart until it touches your chest','Squeeze shoulder blades together at peak','Controlled return — band tension all the way back to start']},

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
    why:'Fully extends the elbow against gravity at a position where the tricep is maximally shortened. Useful for hotel/home sessions where no cable is available. Better than cable for lateral head contraction quality.',
    cues:['Hinge forward, upper arm parallel to floor throughout','Only the forearm moves — hinge at the elbow','Extend until arm is fully straight — hold one count','Lower slowly; resist the temptation to swing']},

  // ── QUADS ─────────────────────────────────────────────
  'barbell-back-squat':{
    name:'Barbell Back Squat', videoId:null,
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus_lateralis','quad_vastus_medialis'],secondary:['glute_max','hamstring','erector_spinae']},
    emphasis:['quads','glutes','lower_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'The highest total-muscle-mass exercise in existence — quads, hamstrings, glutes, erectors, core, and upper back all contribute. No other movement builds as much lower body mass in one movement.',
    cues:['Bar on upper traps (high bar) or lower traps (low bar)','Feet shoulder-width, toes 15–30° out','Brace hard — breath in and hold through the descent','Knees track over toes; do not cave']},
  'hack-squat':{
    name:'Hack Squat', videoId:'MKcAc4RoKME',
    muscleGroups:{primary:['quad_vastus_lateralis','quad_vastus_medialis'],secondary:['glute_max']},
    emphasis:['quads','lower_body'], equipment:'machine', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'Machine allows heavier quad loading than most free-weight squats — all force goes into the quad, not balance. The vertical sled path eliminates spinal compression, making this the safest heavy quad compound for those with back issues.',
    cues:['Feet shoulder-width on platform, toes slightly out','Keep heels flat — do not rise on toes at the bottom','Descend to 90° or lower if mobility allows','Drive through heels to extend']},
  'leg-press':{
    name:'Leg Press', videoId:'IZxyjW7MPJQ',
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus_lateralis'],secondary:['glute_max','hamstring']},
    emphasis:['quads','lower_body'], equipment:'machine', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'No spinal loading, no balance — all force into the quads. Useful for quad volume when the lower back is fatigued. High-and-wide foot placement biases glutes/hamstrings; low-and-narrow biases quads.',
    cues:['Do not lock out the knees at the top — maintain tension','Lower until thighs are 90° or below','Feet centred on platform for balanced quad loading','Back flat against pad; do not round the lower back at the bottom']},
  'leg-extension':{
    name:'Leg Extension', videoId:'YyvSfVjQeL0',
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus_medialis']},
    emphasis:['quads','lower_body'], equipment:'machine', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'The only isolation exercise for the quadriceps. The rectus femoris (bi-articular quad head) is placed under stretch here that compound movements cannot achieve. Essential for complete quad development.',
    cues:['Adjust pad to sit just above ankle — not on the foot','Slow to full extension; do not kick','Hold at the top for one second — peak quad contraction','Lower slowly — the eccentric matters as much as the lift']},
  'sissy-squat':{
    name:'Sissy Squat', videoId:null,
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus_lateralis','quad_vastus_medialis']},
    emphasis:['quads','lower_body'], equipment:'bodyweight', tier:'home', category:'isolation', oneRmFactor:null,
    why:'The bodyweight answer to the leg extension — knees travel far forward while the hips stay extended, isolating the quads (especially the rectus femoris) under a deep stretch with zero equipment. Ideal quad finisher at home or a hotel.',
    cues:['Hold a support for balance; rise onto the balls of the feet','Drive knees forward and lean the torso back in one line','Lower until you feel a deep quad stretch — hips stay open','Squeeze the quads to return; add a plate hugged to the chest to progress']},
  'reverse-nordic':{
    name:'Reverse Nordic', videoId:null,
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus_lateralis','quad_vastus_medialis']},
    emphasis:['quads','lower_body'], equipment:'bodyweight', tier:'home', category:'isolation', oneRmFactor:null,
    why:'A kneeling eccentric quad isolation that loads the rectus femoris under a long stretch — the exact lengthened-position stimulus the leg extension cannot reach. Builds quads and knee resilience with zero equipment.',
    cues:['Kneel tall, hips fully extended, core braced','Lean the whole body back in a straight line from knees to head','Lower as far as quad control allows — no hip bend','Pull back up with the quads; hold a wall or band to assist if needed']},
  'goblet-squat':{
    name:'Goblet Squat', videoId:'MeIiIdhvXT4',
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus_medialis'],secondary:['glute_max','core']},
    emphasis:['quads','lower_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'The counterbalance weight allows an upright torso and deep knee bend that many lifters cannot achieve in a barbell squat. Best learning tool for squat mechanics and an excellent hotel or home quad compound.',
    cues:['Hold DB or KB at chest height — elbows between knees at bottom','Push knees out over toes','Chest tall throughout — do not collapse forward','Drive up through the heels']},
  'bulgarian-split-squat':{
    name:'Bulgarian Split Squat', videoId:'2C-uNgKwPLE',
    muscleGroups:{primary:['quad_rectus_femoris','quad_vastus_lateralis'],secondary:['glute_max','hamstring']},
    emphasis:['quads','glutes','lower_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'Rear foot elevation increases hip flexor stretch and hip flexion depth — a training stimulus unavailable in bilateral squatting. Highest correlation to athletic performance (sprint speed, jump height) among all unilateral leg movements.',
    cues:['Front foot far enough forward that shin stays vertical','Lower straight down — do not lean forward','Drive through the heel of the front foot','Rear leg is a kickstand only — it should not push']},
  'db-lunge':{
    name:'DB Lunge', videoId:null,
    muscleGroups:{primary:['quad_rectus_femoris'],secondary:['glute_max','hamstring','core']},
    emphasis:['quads','glutes','lower_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'Walking lunges produce the highest glute activation of any lunge variation due to the hip extension into the step. The bilateral instability challenge builds proprioception and ankle stability more than any stationary squat.',
    cues:['Step forward; lower until back knee is one inch from floor','Keep torso upright — do not lean forward','Drive through front heel to step through','Keep dumbbells at sides — do not let them swing']},
  'step-up':{
    name:'Step-Up', videoId:null,
    muscleGroups:{primary:['quad_rectus_femoris','glute_max'],secondary:['hamstring']},
    emphasis:['quads','glutes','lower_body'], equipment:'dumbbell', tier:'hotel_gym', category:'compound', oneRmFactor:null,
    why:'The most sport-specific lower body exercise — replicates stair climbing, hill sprinting, and any real-world stepping movement. Single-leg loading makes it useful for diagnosing bilateral deficits.',
    cues:['Box height: upper thigh parallel at 90° when foot is on box','Drive through the heel of the elevated foot','Do not push off the back foot — it should barely touch','Lower slowly — the step down is just as important as the step up']},

  // ── HAMSTRINGS ────────────────────────────────────────
  'romanian-deadlift':{
    name:'Romanian Deadlift', videoId:'JCXUYuzwNrM',
    muscleGroups:{primary:['hamstring','glute_max'],secondary:['erector_spinae','adductor']},
    emphasis:['hamstrings','glutes','lower_body'], equipment:'barbell', tier:'full_gym', category:'compound', oneRmFactor:null,
    why:'Trains the hamstring in its most important function: hip extension under eccentric load. The stretch position at the bottom produces the highest mechanotransduction signal of any hamstring exercise. Fundamental for any strength program.',
    cues:['Hip hinge, not a squat — push hips back','Bar stays in contact with legs throughout','Feel the hamstring stretch; stop before lower back rounds','Drive hips forward to return — squeeze glutes at top']},
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
    muscleGroups:{primary:['hamstring_bicep_femoris','hamstring_semimembranous']},
    emphasis:['hamstrings','lower_body'], equipment:'bodyweight', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'Reduces hamstring strain injury risk by 50–70% per multiple RCTs. The eccentric-only loading at long muscle lengths is unique and irreplaceable. The single highest return-on-investment exercise in sports medicine.',
    cues:['Anchor feet under heavy object or have partner hold','Lower as slowly as possible using hamstrings — catch yourself with hands','Goal is to resist as long as possible on the way down','Beginner: use hands to help push up; advanced: pull back up with hamstrings']},
  'slider-leg-curl':{
    name:'Slider Leg Curl', videoId:null,
    muscleGroups:{primary:['hamstring_bicep_femoris','hamstring_semimembranous']},
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
    why:'Identical hip hinge to barbell RDL but accessible in any gym or hotel. The dumbbell version allows a slightly more natural arc and is easier to set up without a squat rack.',
    cues:['Dumbbells hang at thigh level — slide them down the legs','Hip hinge back; feel the hamstring stretch at the bottom','Flat back throughout — brace the core hard','Drive hips forward to return; squeeze glutes at the top']},

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

  // ── CALVES ────────────────────────────────────────────
  'standing-calf-raise':{
    name:'Standing Calf Raise', videoId:'gwLzBJYoWlA',
    muscleGroups:{primary:['gastrocnemius']},
    emphasis:['lower_body'], equipment:'machine', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'The gastrocnemius is bi-articular — it crosses both the ankle and knee. Straight-knee position fully recruits both heads. This is the primary exercise for calf mass.',
    cues:['Full stretch at the bottom: heel below platform level','Rise to maximum height on tiptoe','Pause one count at the top — no bouncing','Slow descent — 3-count lower']},
  'seated-calf-raise':{
    name:'Seated Calf Raise', videoId:'JbyjNymZsfQ',
    muscleGroups:{primary:['soleus']},
    emphasis:['lower_body'], equipment:'machine', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Bent-knee position slackens the gastrocnemius, isolating the soleus underneath. The soleus is slow-twitch dominant — it responds best to high reps (15–25). A thick soleus widens the calf visually from all angles.',
    cues:['Pad just above the knee, not on the kneecap','Full stretch at the bottom','Rise to maximum height; pause one count','High reps are more effective here than heavy weight']},
  'leg-press-calf-raise':{
    name:'Leg Press Calf Raise', videoId:null,
    muscleGroups:{primary:['gastrocnemius']},
    emphasis:['lower_body'], equipment:'machine', tier:'full_gym', category:'isolation', oneRmFactor:null,
    why:'Allows very heavy plantarflexion loading with no spinal compression. Fixed platform provides consistent ROM. Useful when the standing calf raise machine is occupied.',
    cues:['Only toes and ball of foot on the platform — heels hang off','Press to full plantarflexion (tiptoe position)','Lower until heels are below the platform level','High reps, slow tempo — calves are built with volume']},
  'single-leg-calf-raise':{
    name:'Single-Leg Calf Raise', videoId:null,
    muscleGroups:{primary:['gastrocnemius']},
    emphasis:['lower_body'], equipment:'bodyweight', tier:'home', category:'isolation', oneRmFactor:null,
    why:'Doubles the eccentric load versus bilateral — providing 2× the resistance with bodyweight alone. Progressed by adding a loaded backpack, holding a dumbbell, or increasing tempo.',
    cues:['Stand on one foot on a step edge — heel hanging off','Lower to full stretch position','Rise to max height; single-leg focus prevents compensation','If too easy, add load; if too hard, hold a wall lightly']},
  'db-standing-calf-raise':{
    name:'DB Standing Calf Raise', videoId:null,
    muscleGroups:{primary:['gastrocnemius']},
    emphasis:['lower_body'], equipment:'dumbbell', tier:'hotel_gym', category:'isolation', oneRmFactor:null,
    why:'Brings external load to the straight-knee calf raise without a machine — a dumbbell in each hand plus a step edge fully recruits both gastrocnemius heads. The hotel-gym answer to the standing calf machine.',
    cues:['Stand tall on a step edge, balls of feet on, heels hanging','Hold a dumbbell in each hand, arms relaxed at sides','Full stretch at the bottom, then rise to maximum tiptoe height','Pause one count at the top; 3-count lower — no bouncing']},

  // ── CORE ──────────────────────────────────────────────
  'dead-bug':{
    name:'Dead Bug', videoId:null,
    muscleGroups:{primary:['transverse_abdominis','rectus_abdominis'],secondary:['psoas','erector_spinae']},
    emphasis:['core','full_body'], equipment:'bodyweight', tier:'home', category:'core', oneRmFactor:null,
    why:'McGill-approved anti-extension movement. Forces the core to resist spinal extension while contralateral limbs move — exactly what the core does during every compound lift. Zero spinal shear. Safest core exercise for any lower back history.',
    cues:['Press lower back FLAT into floor throughout — this is the whole exercise','Move opposite arm and leg simultaneously','Breathe out as you lower the limbs','If the back lifts, the set is over']},
  'plank':{
    name:'Plank', videoId:'pSHjTRCQxIw',
    muscleGroups:{primary:['transverse_abdominis','rectus_abdominis'],secondary:['erector_spinae','glute_max']},
    emphasis:['core'], equipment:'bodyweight', tier:'home', category:'core', oneRmFactor:null,
    why:'Anti-extension core training — builds the ability to resist spinal extension under load, exactly the demand during heavy squats and deadlifts.',
    cues:['Forearms on floor, elbows under shoulders','Body in a straight line from head to heels','Squeeze glutes and abs simultaneously','Breathe normally — if you cannot breathe, reduce the duration']},
  'side-plank':{
    name:'Side Plank', videoId:null,
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

  // ── CARDIO / CONDITIONING ─────────────────────────────
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
    why:'Zero impact on joints — ideal when legs are sore from squats and lunges. Cycle ergometers produce excellent Zone 2 cardio data in sports science research. Widely available in hotel gyms.',
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
// DYNAMIC PROGRAM GENERATOR
// buildDynamicProgram(goal, days, weeks, sex, tier, emphasis)
//   → returns a 4-day base array (same shape as static programs)
//     or null on failure (callers fall back to static)
// ═══════════════════════════════════════════════════════
function buildDynamicProgram(goal, days, weeks, sex, tier, emphasis, injuries, maxDb, rotation) {
  const isFemale = (sex === 'F' || String(sex||'').toLowerCase()==='f' || String(sex||'').toLowerCase()==='female');
  const dbCap = (Number.isFinite(maxDb) && maxDb > 0) ? maxDb : Infinity;
  // Rotation context drives week-to-week variety. seed = per-user (start date),
  // so paired partners aren't identical; week rotates accessories; phase rotates
  // primary compounds (stable within a mesocycle to preserve overload tracking).
  const rot = rotation || {};
  const rotSeed  = String(rot.seed || '');
  const rotWeek  = Number.isFinite(rot.week)  ? rot.week  : 1;
  const rotPhase = Number.isFinite(rot.phase) ? rot.phase : 0;
  // FNV-1a string hash → stable 32-bit unsigned int.
  const hashStr = (str) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  const tierOrder = ['home','hotel_gym','full_gym'];
  const reqIdx = tierOrder.indexOf(tier || 'full_gym');

  // injury-aware filtering (shared predicate — see makeInjuryBlocked)
  const injuryBlocked = makeInjuryBlocked(injuries);

  // filter helpers
  const tierOk = (ex) => tierOrder.indexOf(ex.tier) <= reqIdx;
  const groupsMatch = (ex, groups) => {
    const all = [...(ex.muscleGroups.primary||[]),...(ex.muscleGroups.secondary||[])];
    return groups.some(g => all.some(a => a === g || a.startsWith(g+'_') || a.startsWith(g)));
  };
  const bank = ({groups, cat, excl=[]}) =>
    Object.values(EXERCISE_BANK).filter(e =>
      tierOk(e) && e.category===cat && groupsMatch(e, groups) && !excl.includes(e.name) && !injuryBlocked(e.name));

  // emphasis tag → bank emphasis tag
  const emphMap = {back_heavy:'back',push_heavy:'push',pull_heavy:'pull',
    glute_focused:'glutes',core_focused:'core',upper_body:'upper_body',lower_body:'lower_body'};
  const emphTag = emphMap[emphasis] || null;

  // Deterministic seeded selection. Emphasis preference still narrows the pool
  // first; within the resulting pool a seeded hash chooses the candidate so the
  // program is stable on reload yet varies per user and over time.
  const pick = (cands, slot, tmpl) => {
    if (!cands.length) return null;
    let pool = cands;
    if (emphTag) { const b = cands.filter(e => e.emphasis && e.emphasis.includes(emphTag)); if (b.length) pool = b; }
    const isPrimary = slot && (slot.role === 'primary' || slot.role === 'secondary');
    const block = isPrimary ? rotPhase : rotWeek;
    const seedStr = `${rotSeed}|${goal}|${tmpl ? tmpl.key : ''}|${slot ? slot.role : ''}|${block}`;
    return pool[hashStr(seedStr) % pool.length];
  };

  // base starting weight from equipment + sex
  const baseW = (e) => {
    const m = isFemale ? 0.55 : 1.0;
    const f = e.oneRmFactor || 1.0;
    if (e.equipment==='barbell')   return Math.round((isFemale?55:95)*f/5)*5;
    if (e.equipment==='machine')   return Math.round((isFemale?40:70)*f/5)*5;
    if (e.equipment==='cable')     return isFemale?20:35;
    if (e.equipment==='dumbbell')  return Math.min(Math.round((isFemale?15:35)*f/2.5)*2.5, dbCap);
    return 0; // bodyweight / band
  };

  const makeEx = (entry, idSuffix, overrides={}) => {
    if (!entry) return null;
    return {
      id: idSuffix,
      name: entry.name,
      badge: entry.category==='compound'?'compound':'isolation',
      sets: overrides.sets ?? (entry.category==='compound'?4:3),
      w: baseW(entry),
      r: 10,
      rest: entry.category==='compound'?90:60,
      compound: entry.category==='compound',
      isCore: entry.category==='core',
      cardioOnly: entry.category==='cardio',
      why: entry.why||'',
      cues: entry.cues||[],
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
      ], cardioGroups:['full_body','lower_body','glute_max'] },
    { key:'day2', label:'Day 2 · Lower Hinge', color:'var(--amber)',
      rationale:'Hip hinge pattern — glutes, hamstrings, posterior chain. Calf and hip abductor accessories.',
      slots:[
        {role:'primary',   groups:['hamstring','glute_max'],                    cat:'compound'},
        {role:'secondary', groups:['glute_max','quad'],                         cat:'compound'},
        {role:'acc1',      groups:['glute_max','glute_medius','glute_minimus'], cat:'isolation'},
        {role:'acc2',      groups:['hamstring'],                                cat:'isolation'},
        {role:'acc3',      groups:['gastrocnemius','soleus','calf'],            cat:'isolation'},
      ], cardioGroups:['full_body','lower_body','glute_max'] },
    { key:'day3', label:'Day 3 · Upper Pull', color:'var(--blue)',
      rationale:'Vertical and horizontal pull emphasis — back, biceps. Rear delt accessory balances the press.',
      slots:[
        {role:'primary',   groups:['lat_dorsi'],                                cat:'compound'},
        {role:'secondary', groups:['lat_dorsi','rhomboid'],                     cat:'compound'},
        {role:'acc1',      groups:['bicep'],                                    cat:'isolation'},
        {role:'acc2',      groups:['posterior_delt','rhomboid'],                cat:'isolation'},
        {role:'acc3',      groups:['lateral_delt'],                             cat:'isolation'},
      ], cardioGroups:['full_body','lower_body'] },
    { key:'day4', label:'Day 4 · Lower Quad', color:'var(--purple,#a78bfa)',
      rationale:'Squat pattern emphasis — quads, glutes. Isolation finishers for quad and glute medius.',
      slots:[
        {role:'primary',   groups:['quad'],                                     cat:'compound'},
        {role:'secondary', groups:['glute_max','hamstring'],                    cat:'compound'},
        {role:'acc1',      groups:['quad_rectus_femoris','quad_vastus'],        cat:'isolation'},
        {role:'acc2',      groups:['glute_max','glute_medius'],                 cat:'isolation'},
        {role:'acc3',      groups:['gastrocnemius','calf'],                     cat:'isolation'},
      ], cardioGroups:['full_body','lower_body'] },
  ];

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
  };

  try {
    const result = TEMPLATES.map(tmpl => {
      const exs = {};
      tmpl.slots.forEach(s => {
        const cands = bank({groups:s.groups, cat:s.cat, excl:[...used]});
        const chosen = pick(cands, s, tmpl);
        if (chosen) { used.add(chosen.name); exs[s.role] = chosen; }
      });
      const cardioPool = bank({groups:tmpl.cardioGroups, cat:'cardio', excl:[...used]});
      const cardioEx = cardioPool[0] || null;

      const compExs = [exs.primary, exs.secondary].filter(Boolean)
        .map((e,i) => makeEx(e, tmpl.key+'-c'+i));
      const accExs = ['acc1','acc2','acc3'].map((k,i) => exs[k]
        ? makeEx(exs[k], tmpl.key+'-a'+i, {sets:3}) : null).filter(Boolean);

      const blocks = [];
      if (compExs.length) blocks.push({label:'Compound Block', exs:compExs});
      if (accExs.length)  blocks.push({label:'Accessory Block', exs:accExs});
      if (cardioEx) blocks.push({label:'Zone 2 · 22 min', cardio:true, exs:[
        makeEx(cardioEx, tmpl.key+'-card', {sets:1, duration:22, cardioOnly:true, unit:'sec', r:1})]});

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
    const saBlocks = [];
    if (shoulderExs.length) saBlocks.push({label:'Shoulder Block · Rest 90 sec', exs:shoulderExs});
    if (armExs.length)      saBlocks.push({label:'Arms Block · Rest 75 sec', exs:armExs});
    if (saBlocks.length) {
      result.shouldersArmsDay = {key:sa.key, label:sa.label, color:sa.color, rationale:sa.rationale, blocks:saBlocks};
    }

    return result;
  } catch(err) {
    console.warn('buildDynamicProgram error:', err);
    return null;
  }
}

function getProgram(goal, days, weeks, sex, equipment, emphasis, injuries, maxDb, rotation) {
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
  const SUBSTITUTIONS = [
    {id:'sub-sarm',  name:'Single-Arm DB Row',     badge:'isolation', sets:3, w:60, r:12, rest:60, compound:false,
     why:'Unilateral pull — catches dominant-side compensation when bilateral rows are the only remaining pull.',
     cues:['Row to hip, not chest.','Let shoulder drop at bottom — full protraction.']},
    {id:'sub-sapl',  name:'Straight-Arm Pulldown', badge:'isolation', sets:3, w:40, r:15, rest:45, compound:false,
     why:'Lat isolation through full arc with zero bicep involvement. Ideal pull-day filler.',
     cues:['Arms straight throughout.','Drive elbows toward hips — squeeze lats at bottom.']},
    {id:'sub-rfly',  name:'Reverse Fly',            badge:'isolation', sets:3, w:15, r:15, rest:45, compound:false,
     why:'Rear delt isolation for shoulder health on pull-focused days.',
     cues:['Slight forward lean. Lead with elbows wide.','Light weight — corrective work.']},
    {id:'sub-dbsp',  name:'DB Shoulder Press',      badge:'compound',  sets:3, w:30, r:12, rest:75, compound:true,
     why:'Overhead push pattern to maintain delt compound volume when primary is stripped.',
     cues:['Press overhead. Elbows slightly in front.','No lumbar arch — brace throughout.']},
    {id:'sub-bayrow',name:'Bayesian Cable Curl',    badge:'isolation', sets:3, w:25, r:12, rest:45, compound:false,
     why:'Bicep isolation with cable behind body — unique stretch position unavailable from standard curls.',
     cues:['Cable at hip height behind body.','Curl with shoulder pinned back.']},
    {id:'sub-lrow',  name:'Landmine Row',            badge:'compound',  sets:3, w:70, r:10, rest:75, compound:true,
     why:'Compound pull with neutral grip — different stimulus than cable row, no spine compression.',
     cues:['Hinge at hip. Drive elbow to hip. Chest tall throughout.']},
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

    const getNames = (day) => {
      const s = new Set();
      for (const b of day.blocks) {
        if (b.cardio) continue;
        for (const ex of b.exs) { if (!ex.cardioOnly) s.add(ex.name.trim().toLowerCase()); }
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
          ex.cardioOnly || !prevNames.has(ex.name.trim().toLowerCase())
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
    return dedupeConsecutiveDays([
      { ...ua, key:'day1', label:'Day 1 · Push', rationale: ua.rationale },
      { ...ub, key:'day2', label:'Day 2 · Pull', rationale: ub.rationale },
      { key:'day3', label:'Day 3 · Legs', color:'var(--amber)', rationale:'Combined lower day — hinge and squat patterns in one session.',
        blocks:[
          // BUG: la.blocks[0].exs[1] is the hinge day's SECOND compound — it belongs in the
          // Compound Block, not tacked onto the accessory tail after isolations (R3 mis-order).
          { label:'Compound Block', exs:[ la.blocks[0].exs[0], lb.blocks[0].exs[0], la.blocks[0].exs[1] ] },
          { label:'Accessory Block', exs:[ la.blocks[1].exs[0], lb.blocks[1].exs[0] ] },
          { label:'Zone 2 · 22 min', cardio:true, exs:[ {...la.blocks[2].exs[0], duration:22} ] }
        ]
      }
    ]);
  };

  // ── TASK-3: pressing dedup for the 5-day split ───────────────────────────
  // build5 inserts a dedicated Shoulders+Arms day (Day 3) whose primary press is
  // Arnold Press. Several 4-day bases ALSO press on Day 1 (e.g. both male and
  // female fat_burn Day 1 use Arnold Press), but Day 1 and Day 3 are NON-adjacent
  // so dedupeConsecutiveDays never sees the collision. The result is the same
  // overhead press twice in one microcycle. Swap the shoulders-day press to a
  // distinct overhead variant whenever it already appears on another day.
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
        ]}
      ]
    };
    return dedupeConsecutiveDays(dedupePressingBuild5([ua, la, shoulders,
      {...ub, key:'day4', label: ub.label.replace(/^Day \d+/, 'Day 4')},
      {...lb, key:'day5', label: lb.label.replace(/^Day \d+/, 'Day 5')}]));
  };

  // 2-day: Full Body A/B — push+hinge / pull+quad
  const build2 = (base4) => {
    const [ua, la, ub, lb] = base4;
    return dedupeConsecutiveDays([
      { key:'day1', label:'Day 1 · Full Body A', color:'var(--accent)',
        rationale:'Push + hinge emphasis. Bench and RDL are the two primary compounds. Accessories fill upper pull and quad so nothing gets neglected across the week.',
        blocks:[
          { label:'Compound Block', exs:[ ua.blocks[0].exs[0], la.blocks[0].exs[0] ].filter(Boolean) },
          { label:'Accessory Block', exs:[ ub.blocks[0].exs[1], lb.blocks[1]?.exs[0], la.blocks[1]?.exs[2] || la.blocks[1]?.exs[1] ].filter(Boolean) },
          { ...(la.blocks.find(b=>b.cardio) || ub.blocks.find(b=>b.cardio)), label:'Zone 2 Finisher · 20 min' }
        ]
      },
      { key:'day2', label:'Day 2 · Full Body B', color:'var(--blue)',
        rationale:'Pull + quad emphasis. Lat pulldown and hack squat as primary compounds. Accessories cover push and posterior chain to balance Day A.',
        blocks:[
          { label:'Compound Block', exs:[ ub.blocks[0].exs[0], lb.blocks[0].exs[0] ].filter(Boolean) },
          { label:'Accessory Block', exs:[ ua.blocks[0].exs[1], la.blocks[1]?.exs[0], ub.blocks[1]?.exs[1] ].filter(Boolean) },
          { ...(lb.blocks.find(b=>b.cardio) || la.blocks.find(b=>b.cardio)), label:'Zone 2 Finisher · 20 min' }
        ]
      }
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
  const generated = buildDynamicProgram(goal, days, weeks, sex, tier, focus, injuries, maxDb, rotation);
  if (generated) {
    // Final injury prune — catches statically-injected exercises (build5's
    // shoulder block) that bypass the bank-level filter inside the generator.
    if (days === 2) return pruneInjuries(build2(generated), injuries);
    if (days === 3) return pruneInjuries(ppl(generated), injuries);
    if (days === 5) return pruneInjuries(build5(generated), injuries);
    return pruneInjuries(generated, injuries);
  }

  // ── Silent emergency fallback ──────────────────────────────────────────────
  // The generator should never return null in normal use. If it does (bank gap,
  // unknown goal), fall back to the curated static base so the user still gets a
  // workout. This path is NOT expected in production — warn so it's caught.
  console.warn('[getProgram] dynamic engine returned null — falling back to static base', { goal, days, tier });
  if (!activePrograms[goal]) return activePrograms.build_muscle?.[4] || programs.build_muscle[4];

  const base = activePrograms[goal][4] || programs.build_muscle[4];
  if (days === 2) return build2(base);
  if (days === 3) return ppl(base);
  if (days === 5) return build5(base);
  return base;
}

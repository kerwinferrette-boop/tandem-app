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
  alert:'<path d="M12 3 21 19H3L12 3ZM12 10v4M12 17h.01"/>'
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
    {name:'Recomp Build',         intent:'Add load, maintain intensity. Muscle grows while fat continues to drop. Floor at 8 reps — no heavier in a deficit.',             weeks:[4,6],  reps:'10·9·8',   restComp:90,  restAcc:60,  incComp:5,   incAcc:5,   pctTop:8,  pctInc:6},
    {name:'Recomp Power',         intent:'Heaviest phase. Body composition changes become visually apparent. 8-rep floor maintained throughout.',                           weeks:[7,9],  reps:'9·8·8',    restComp:120, restAcc:75,  incComp:10,  incAcc:5,   pctTop:8,  pctInc:5},
    {name:'Recomp Peak',          intent:'The results phase. Scale may barely move but the mirror tells the real story. Load is at its peak — 8 reps all week.',           weeks:[10,12],reps:'8·8·8',    restComp:120, restAcc:75,  incComp:5,   incAcc:5,   pctTop:8,  pctInc:3}
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

function getProgram(goal, days, weeks, sex) {
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
          { label:'Compound Block', exs:[ la.blocks[0].exs[0], lb.blocks[0].exs[0] ] },
          { label:'Accessory Block', exs:[ la.blocks[1].exs[0], lb.blocks[1].exs[0], la.blocks[0].exs[1] ] },
          { label:'Zone 2 · 22 min', cardio:true, exs:[ {...la.blocks[2].exs[0], duration:22} ] }
        ]
      }
    ]);
  };

  // 5-day: add dedicated shoulder/arms day
  const build5 = (base4) => {
    const [ua, la, ub, lb] = base4;
    const shoulders = {
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
    return dedupeConsecutiveDays([ua, la, shoulders,
      {...ub, key:'day4', label: ub.label.replace(/^Day \d+/, 'Day 4')},
      {...lb, key:'day5', label: lb.label.replace(/^Day \d+/, 'Day 5')}]);
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
            ]},
            {label:'Accessory Block · Rest 75 sec', exs:[
              {id:'bmf-lcurl', name:'Lying Leg Curl', badge:'isolation', sets:3, w:30, r:12, rest:75, compound:false,
               why:'Knee flexion hits the short head of bicep femoris that RDL barely touches.',
               cues:['Hips pressed into pad. Full extension every rep.','3-sec eccentric.']},
              {id:'bmf-bss', name:'Bulgarian Split Squat', badge:'compound', sets:3, w:15, r:12, rest:90, compound:true,
               why:'Unilateral training catches and corrects left-right imbalances.',
               cues:['Rear foot elevated. Front foot far enough for vertical shin.','Drive through heel of front foot.']},
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

  if (!activePrograms[goal]) return activePrograms.build_muscle?.[4] || programs.build_muscle[4];

  const base = activePrograms[goal][4] || programs.build_muscle[4];
  if (days === 2) return build2(base);
  if (days === 3) return ppl(base);
  if (days === 5) return build5(base);
  return base;
}

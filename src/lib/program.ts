// ── Types ─────────────────────────────────────────────────────────────────────

export interface Phase {
  name: string
  intent: string
  weeks: [number, number]
  reps: string
  restComp: number   // seconds
  restAcc: number    // seconds
  incComp: number    // lbs
  incAcc: number     // lbs
  pctTop: number     // top-rep% threshold for overload
  pctInc: number     // % increase signal
}

export interface Exercise {
  id: string
  name: string
  badge: 'compound' | 'isolation' | 'cardio'
  sets?: number
  w?: number          // starting weight (lbs)
  r?: number          // reps
  rest?: number       // rest in seconds
  compound?: boolean
  why?: string
  warning?: string
  cues?: string[]
  // Cardio-only fields
  cardioOnly?: boolean
  cardioDesc?: string
  zone?: string
  duration?: number
}

export interface Block {
  label: string
  cardio?: boolean
  exs: Exercise[]
}

export interface DayProgram {
  key: string
  label: string
  color: string
  rationale: string
  blocks: Block[]
}

export type GoalType = 'fat_burn' | 'build_muscle' | 'transform'

export interface MobilityItem {
  name: string
  detail: string
}

// ── PHASES ────────────────────────────────────────────────────────────────────

export const PHASES: Record<GoalType, Phase[]> = {
  fat_burn: [
    { name: 'Metabolic Foundation', intent: 'Build work capacity and movement quality. Higher rep ranges maximize calorie burn.',    weeks: [1, 3],   reps: '20·15·12', restComp: 60,  restAcc: 45, incComp: 2.5, incAcc: 2.5, pctTop: 15, pctInc: 10 },
    { name: 'Metabolic Intensify',  intent: 'Increase load while maintaining short rest. The sweet spot for fat loss + strength.',   weeks: [4, 6],   reps: '15·12·10', restComp: 75,  restAcc: 60, incComp: 5,   incAcc: 2.5, pctTop: 12, pctInc: 10 },
    { name: 'Power Burn',           intent: 'Heavy compounds, metabolic finishers. Most demanding phase for simultaneous fat loss.',  weeks: [7, 9],   reps: '12·10·8',  restComp: 90,  restAcc: 60, incComp: 5,   incAcc: 5,   pctTop: 10, pctInc: 8  },
    { name: 'Peak Conditioning',    intent: 'Maximum output. You are significantly leaner and stronger than week 1.',                weeks: [10, 12], reps: '10·8·6',   restComp: 90,  restAcc: 60, incComp: 5,   incAcc: 5,   pctTop: 8,  pctInc: 6  },
  ],
  build_muscle: [
    { name: 'Hypertrophy Foundation', intent: 'Establish movement patterns. High volume, moderate load. Muscle memory is building.',   weeks: [1, 3],   reps: '15·12·10', restComp: 120, restAcc: 75, incComp: 5,   incAcc: 2.5, pctTop: 10, pctInc: 8 },
    { name: 'Strength Build',         intent: 'Load increases, volume holds. Strength adaptations accelerate this phase.',             weeks: [4, 6],   reps: '12·10·8',  restComp: 120, restAcc: 90, incComp: 5,   incAcc: 5,   pctTop: 8,  pctInc: 6 },
    { name: 'Power Phase',            intent: 'Heavier compounds. Short accessory rest. Highest hypertrophy signal of the program.',   weeks: [7, 9],   reps: '10·8·6',   restComp: 150, restAcc: 90, incComp: 10,  incAcc: 5,   pctTop: 6,  pctInc: 5 },
    { name: 'Peak Strength',          intent: 'Maximum load. Neural efficiency peaks. You are stronger than week 1 at every lift.',    weeks: [10, 12], reps: '8·6·4',    restComp: 180, restAcc: 90, incComp: 5,   incAcc: 5,   pctTop: 4,  pctInc: 3 },
  ],
  transform: [
    { name: 'Recomp Foundation', intent: 'Moderate deficit, high protein, progressive overload. Body recomp starts now.',          weeks: [1, 3],   reps: '15·12·10', restComp: 90,  restAcc: 60, incComp: 5,   incAcc: 2.5, pctTop: 10, pctInc: 8 },
    { name: 'Recomp Build',      intent: 'Add load, maintain intensity. Muscle grows while fat continues to drop.',                weeks: [4, 6],   reps: '12·10·8',  restComp: 90,  restAcc: 60, incComp: 5,   incAcc: 5,   pctTop: 8,  pctInc: 6 },
    { name: 'Recomp Power',      intent: 'Heaviest phase. Body composition changes become visually apparent this block.',          weeks: [7, 9],   reps: '10·8·6',   restComp: 120, restAcc: 75, incComp: 10,  incAcc: 5,   pctTop: 6,  pctInc: 5 },
    { name: 'Recomp Peak',       intent: 'The results phase. Scale may barely move but the mirror tells the real story.',          weeks: [10, 12], reps: '8·6·4',    restComp: 120, restAcc: 75, incComp: 5,   incAcc: 5,   pctTop: 4,  pctInc: 3 },
  ],
}

// ── Phase lookup ──────────────────────────────────────────────────────────────

export function getPhase(week: number, goal: GoalType): Phase {
  const phases = PHASES[goal] ?? PHASES.build_muscle
  for (const p of phases) {
    if (week >= p.weeks[0] && week <= p.weeks[1]) return p
  }
  return phases[phases.length - 1]
}

// ── Mobility cooldown map ─────────────────────────────────────────────────────

export function getMobility(dayKey: string): MobilityItem[] {
  const map: Record<string, MobilityItem[]> = {
    mon:  [
      { name: 'Cross-Body Shoulder Stretch', detail: '30 sec each side' },
      { name: 'Doorway Chest Stretch',        detail: '30 sec' },
      { name: 'Thoracic Extension (foam roller)', detail: '60 sec' },
      { name: "Child's Pose",                 detail: '60 sec' },
    ],
    tue:  [
      { name: 'Hip 90/90 Stretch',           detail: '60 sec each side' },
      { name: 'Standing Hip Flexor Lunge',   detail: '45 sec each side' },
      { name: 'Seated Hamstring Stretch',    detail: '30 sec each side' },
      { name: "Child's Pose",                detail: '60 sec' },
    ],
    push: [
      { name: 'Cross-Body Shoulder Stretch', detail: '30 sec each side' },
      { name: 'Doorway Chest Stretch',       detail: '30 sec' },
      { name: "Child's Pose",                detail: '60 sec' },
    ],
    pull: [
      { name: 'Cat-Cow + Thoracic Rotation', detail: '10 reps each direction' },
      { name: 'Cross-Body Shoulder Stretch', detail: '30 sec each side' },
      { name: "Child's Pose",                detail: '60 sec' },
    ],
    thu:  [
      { name: 'Cat-Cow + Thoracic Rotation', detail: '10 reps each direction' },
      { name: 'Cross-Body Shoulder Stretch', detail: '30 sec each side' },
      { name: "Child's Pose",                detail: '60 sec' },
    ],
    fri:  [
      { name: 'Standing Hip Flexor Lunge',   detail: '45 sec each side' },
      { name: 'Supine Figure-4 Hip Stretch', detail: '45 sec each side' },
      { name: 'Calf Wall Stretch',           detail: '30 sec each side' },
      { name: "Child's Pose",                detail: '60 sec' },
    ],
    legs: [
      { name: 'Hip 90/90 Stretch',           detail: '60 sec each side' },
      { name: 'Standing Hip Flexor Lunge',   detail: '45 sec each side' },
      { name: "Child's Pose",                detail: '60 sec' },
    ],
    wed:  [
      { name: 'Doorway Chest Stretch',       detail: '30 sec' },
      { name: 'Overhead Tricep Stretch',     detail: '30 sec each side' },
      { name: "Child's Pose",                detail: '60 sec' },
    ],
  }
  return map[dayKey] ?? map.mon
}

// ── Base 4-day programs ───────────────────────────────────────────────────────

const FAT_BURN_4: DayProgram[] = [
  {
    key: 'mon', label: 'Mon · Upper Circuit', color: 'var(--red)',
    rationale: 'Upper body circuit. Minimal rest keeps heart rate elevated. Compound first, isolation finishers, cardio to close.',
    blocks: [
      {
        label: 'Upper Block · Rest 60 sec',
        exs: [
          {
            id: 'fb-bench', name: 'Low Incline Barbell Press', badge: 'compound', sets: 4, w: 115, r: 15, rest: 60, compound: true,
            why: 'Incline press at higher reps with short rest creates significant metabolic demand while hitting chest, anterior delt, and triceps simultaneously.',
            cues: ['Retract scapulae before unracking. Hold throughout.', 'Bar diagonal in hand — not in the palm. Protect that grip.', 'Controlled 2-sec eccentric on every rep.'],
          },
          {
            id: 'fb-lat-raise', name: 'DB Lateral Raise', badge: 'isolation', sets: 3, w: 20, r: 15, rest: 60, compound: false,
            why: 'Lateral delt isolation immediately after incline press — zero anterior delt overlap. Incline bench already maxed the anterior delt; lateral raises shift emphasis to the medial head. V-taper builder with no redundant loading.',
            cues: ['Lead with elbow. Pinky slightly higher than thumb.', 'Stop at shoulder height — above is trap, not delt.', '3-sec slow negative. Control the descent.'],
          },
        ],
      },
      {
        label: 'Accessory Block · Rest 45 sec',
        exs: [
          {
            id: 'fb-fly', name: 'Cable Low-to-High Fly', badge: 'isolation', sets: 3, w: 25, r: 15, rest: 45, compound: false,
            why: 'Constant cable tension through the arc hits sternal pec with no slack at the top. Higher reps here add volume without joint stress.',
            cues: ['Slight forward lean, soft elbow bend throughout.', 'Think elbows together — not hands.', '2-sec squeeze at the top.'],
          },
          {
            id: 'fb-lat', name: 'Cable Lateral Raise', badge: 'isolation', sets: 3, w: 15, r: 20, rest: 45, compound: false,
            why: 'High rep lateral raises with short rest create maximum lateral delt pump and burn. The V-taper muscle — never skip these.',
            cues: ['Lead with elbow. Pinky slightly higher than thumb.', 'Stop at shoulder height. Above = trap, not delt.', '4-sec negative. This is where it grows.'],
          },
          {
            id: 'fb-push', name: 'Tricep Rope Pushdown', badge: 'isolation', sets: 3, w: 55, r: 15, rest: 45, compound: false,
            why: 'High-rep pushdowns with short rest create a significant metabolic demand on the tricep and elevate heart rate for the cardio finisher.',
            cues: ['15° forward hinge. Removes shoulder from the movement.', 'Full extension at bottom. Squeeze 1 full second.', 'Drop 30% on final set, continue to failure.'],
          },
        ],
      },
      {
        label: 'Cardio Finisher · 25 min', cardio: true,
        exs: [
          {
            id: 'fb-cardio1', name: 'Incline Treadmill — Zone 2', badge: 'cardio', cardioOnly: true,
            cardioDesc: '3–4% incline, 3.2–3.5 mph. Glycogen partially depleted from lifting — body is primed to pull from fat stores. This window is gold.',
            zone: 'HR 130–150 BPM', duration: 25,
          },
        ],
      },
    ],
  },
  {
    key: 'tue', label: 'Tue · Lower Circuit', color: 'var(--orange)',
    rationale: 'Lower body fat burn day. Hip hinge + quad work with minimal rest. The legs are the largest muscle group — training them hard burns the most calories.',
    blocks: [
      {
        label: 'Compound Block · Rest 75 sec',
        exs: [
          {
            id: 'fb-rdl', name: 'Romanian Deadlift', badge: 'compound', sets: 4, w: 115, r: 15, rest: 75, compound: true,
            why: 'At higher reps in a fat-burn context the RDL becomes a cardio-adjacent movement. Your heart rate will be well above resting after 4 sets of 15.',
            cues: ['Hip hinge — push hips back. Not down.', 'Bar against legs the entire descent.', 'Strong hamstring stretch at mid-shin. Drive hips forward at top.'],
          },
          {
            id: 'fb-hip', name: 'Hip Thrust', badge: 'compound', sets: 3, w: 115, r: 15, rest: 75, compound: true,
            why: 'Hip thrusts at 15 reps are as metabolically demanding as they are for glute development. Best glute-to-calorie-burn ratio of any lower body exercise.',
            cues: ['Bench at shoulder blade base. Feet flat, shoulder-width.', 'Drive through full foot. 2-sec hold at top.', 'Chin tucked. Do not hyperextend the spine.'],
          },
        ],
      },
      {
        label: 'Accessory Block · Rest 45 sec',
        exs: [
          {
            id: 'fb-curl', name: 'Lying Leg Curl', badge: 'isolation', sets: 3, w: 85, r: 15, rest: 45, compound: false,
            why: 'Direct hamstring isolation with constant tension. Short rest creates a significant pump and elevates HR for the cardio transition.',
            cues: ['Hips pressed into pad throughout. No lifting.', 'Full extension every rep — full stretch matters.', '3-sec eccentric. This is the growth signal.'],
          },
          {
            id: 'fb-ext', name: 'Leg Extension', badge: 'isolation', sets: 3, w: 65, r: 20, rest: 45, compound: false,
            why: 'High-rep leg extensions at short rest are metabolically brutal. VMO isolation — the teardrop quad that shows composition change first.',
            cues: ['Pad at base of shin, not on foot.', 'Full extension, 1-sec squeeze at top.', 'Slow controlled return. No crashing.'],
          },
          {
            id: 'fb-calf1', name: 'Standing Calf Raise', badge: 'isolation', sets: 3, w: 160, r: 20, rest: 45, compound: false,
            why: 'Calves respond to volume. High reps, short rest, full range. The stretch at the bottom is mandatory.',
            cues: ['Full hang at bottom, 1-sec pause. Full rise at top, 1-sec pause.', 'No bouncing. Own every inch of the range.'],
          },
        ],
      },
      {
        label: 'Cardio Finisher · 25 min', cardio: true,
        exs: [
          {
            id: 'fb-cardio2', name: 'Stationary Bike — Zone 2', badge: 'cardio', cardioOnly: true,
            cardioDesc: 'Preferred post-leg. Keeps hips and quads moving without impact that would worsen DOMS. Low resistance, steady cadence.',
            zone: 'HR 125–145 BPM', duration: 25,
          },
        ],
      },
    ],
  },
  {
    key: 'thu', label: 'Thu · Upper Burn', color: 'var(--red)',
    rationale: 'Second upper session. Pull-dominant to balance Monday push. Bicep work earns its spot at the end.',
    blocks: [
      {
        label: 'Compound Block · Rest 60 sec',
        exs: [
          {
            id: 'fb-pull', name: 'Lat Pulldown', badge: 'compound', sets: 4, w: 90, r: 15, rest: 60, compound: true,
            why: 'Lat pulldown at short rest hits the largest upper body muscle and creates significant metabolic demand. Neutral grip for full range and shoulder safety.',
            cues: ['Lean 10–15 degrees back. Correct angle.', 'Lead with elbows — into back pockets.', 'Full dead hang at top. Earn the stretch.'],
          },
          {
            id: 'fb-row', name: 'Seated Cable Row', badge: 'compound', sets: 4, w: 95, r: 15, rest: 60, compound: true,
            why: 'Wide overhand grip for upper back and rear delt emphasis — the muscles that make you look athletic in a shirt.',
            cues: ['Torso upright or slight forward lean. No rocking.', 'Elbows wide and high. Handle to lower sternum.', 'Full scapular protraction between each rep.'],
          },
        ],
      },
      {
        label: 'Accessory Block · Rest 45 sec',
        exs: [
          {
            id: 'fb-face', name: 'Face Pull', badge: 'isolation', sets: 3, w: 30, r: 20, rest: 45, compound: false,
            why: 'Non-negotiable shoulder health work. Counters the internal rotation load from every pressing movement in this program.',
            cues: ['Pull to ears — not chin. End position: hands behind ears.', 'Externally rotate at the end. Elbows wide.', 'Weight is light. This is corrective, not strength.'],
          },
          {
            id: 'fb-icurl', name: 'Incline DB Curl', badge: 'isolation', sets: 3, w: 20, r: 15, rest: 45, compound: false,
            why: 'Stretch-position curl creates greater bicep hypertrophy stimulus than standing curl. At 15 reps with 45 sec rest, the pump is substantial.',
            cues: ['Arms hang straight at start. Shoulder stays back.', 'Supinate through the curl. Pinky up.', '3-sec slow negative. The stretch is the point.'],
          },
          {
            id: 'fb-ham', name: 'Hammer Curl', badge: 'isolation', sets: 3, w: 30, r: 15, rest: 45, compound: false,
            why: 'Brachialis development — sits underneath the bicep and physically pushes it up. The arm-size muscle most people never train.',
            cues: ['Elbow pinned to side. No front delt drift.', 'Strict alternating — complete one before starting the other.', 'Full extension at bottom.'],
          },
        ],
      },
      {
        label: 'Cardio Finisher · 25 min', cardio: true,
        exs: [
          {
            id: 'fb-cardio3', name: 'Elliptical or Rower', badge: 'cardio', cardioOnly: true,
            cardioDesc: 'Upper pull day — elliptical preferred. Full-body movement keeps total burn high without stressing the fatigued back.',
            zone: 'HR 130–150 BPM', duration: 25,
          },
        ],
      },
    ],
  },
  {
    key: 'fri', label: 'Fri · Lower Burn', color: 'var(--orange)',
    rationale: 'Week-closing lower session. Squat pattern + accessory work. End with Zone 2 to close the training week and protect the weekend recovery.',
    blocks: [
      {
        label: 'Compound Block · Rest 75 sec',
        exs: [
          {
            id: 'fb-hack', name: 'Hack Squat', badge: 'compound', sets: 4, w: 160, r: 15, rest: 75, compound: true,
            why: 'At your frame, hack squat is the superior quad compound. Guided path means 100% of effort goes into the muscle. Machine removes the balance tax of barbell.',
            cues: ['Feet mid-platform, shoulder-width, 20–30° toe-out.', 'Below parallel. Partial reps = partial development.', '3-sec eccentric. No lockout at top — keep tension.'],
          },
          {
            id: 'fb-bss', name: 'Bulgarian Split Squat', badge: 'compound', sets: 3, w: 30, r: 12, rest: 75, compound: true,
            why: 'Single-leg work catches imbalances. Hip flexor stretch on rear leg addresses the tightness that desk work creates. Lower total load, same stimulus.',
            cues: ['Rear foot elevated. Front foot far enough for vertical shin.', 'Descend straight down — elevator, not lean.', '30 lbs is conservative — load climbs fast once balance locks in.'],
          },
        ],
      },
      {
        label: 'Accessory Block · Rest 45 sec',
        exs: [
          {
            id: 'fb-abd', name: 'Abductor Machine', badge: 'isolation', sets: 3, w: 85, r: 20, rest: 45, compound: false,
            why: "Glute medius is the most undertrained muscle in most men's programs. It stabilizes every compound lower body movement. When it's weak, your knees and lower back know it.",
            cues: ['Slight forward lean — takes TFL out, puts load on glute med.', 'Full range, full hold at end position.', 'Control the return. No slamming.'],
          },
          {
            id: 'fb-calf2', name: 'Seated Calf Raise', badge: 'isolation', sets: 3, w: 80, r: 20, rest: 45, compound: false,
            why: 'Soleus work — different muscle than standing calf. Bent knee removes gastrocnemius. Deep calf with its own hypertrophy potential.',
            cues: ['Pad just above knee on lower quad.', 'Full stretch, full rise, pause at both ends.'],
          },
        ],
      },
      {
        label: 'Cardio Finisher · 25 min', cardio: true,
        exs: [
          {
            id: 'fb-cardio4', name: 'Bike — Easy Zone 2', badge: 'cardio', cardioOnly: true,
            cardioDesc: 'End of training week. Low resistance. Protect the weekend recovery window. Slightly lower HR target today.',
            zone: 'HR 115–135 BPM', duration: 25,
          },
        ],
      },
    ],
  },
]

const BUILD_MUSCLE_4: DayProgram[] = [
  {
    key: 'mon', label: 'Mon · Upper A', color: 'var(--gold)',
    rationale: 'Push-dominant upper day. Horizontal and vertical press when CNS is freshest. Triceps finish because they are pre-fatigued from pressing.',
    blocks: [
      {
        label: 'Compound Block · Rest 2 min',
        exs: [
          {
            id: 'bm-bench', name: 'Low Incline Barbell Press', badge: 'compound', sets: 4, w: 140, r: 10, rest: 120, compound: true,
            why: '30° incline is mechanically superior for taller lifters. Keeps chest as primary driver through full ROM. Safer shoulder angle than flat or 45°.',
            warning: '⚠️ GRIP: Bar across the base of fingers — diagonal, low pinky side. Use wrist wraps. Switch to DB if palm pain fires.',
            cues: ['Scapulae retracted and depressed before unracking.', 'Bar path diagonal: touches nipple line, drives to above collarbone.', '3-second eccentric every rep — the negative builds more than the concentric.', 'Drive feet into the floor. Leg drive transfers through the chain.'],
          },
          {
            id: 'bm-press', name: 'Arnold Press', badge: 'compound', sets: 3, w: 40, r: 10, rest: 120, compound: true,
            why: 'All three delt heads in one movement. The rotation from supinated to pronated recruits anterior, lateral, and posterior fibers across the arc.',
            cues: ['Palms facing you at chin. Rotate outward as you press.', 'Elbows slightly in front of torso plane at all times.', 'No aggressive lumbar arch — brace and stay neutral.'],
          },
        ],
      },
      {
        label: 'Accessory Block · Rest 75 sec',
        exs: [
          {
            id: 'bm-fly', name: 'Cable Low-to-High Fly', badge: 'isolation', sets: 3, w: 35, r: 12, rest: 75, compound: false,
            why: 'Cable maintains constant tension through the full arc. Targets sternal pec. Dumbbells go slack at the top — cable does not.',
            cues: ['Slight forward lean, soft elbow bend throughout.', 'Bring elbows together — hands are passengers.', '2-sec full squeeze at the top.'],
          },
          {
            id: 'bm-lat', name: 'Cable Lateral Raise', badge: 'isolation', sets: 3, w: 25, r: 15, rest: 75, compound: false,
            why: "Lateral delt is the V-taper muscle. At 6'3\" building this makes body composition changes visible even at higher bodyweight.",
            cues: ['Cable at ankle. Arm crosses body at start.', 'Lead with elbow — pinky slightly higher than thumb.', 'Stop at shoulder height. 4-sec negative.'],
          },
          {
            id: 'bm-ohe', name: 'Tricep Overhead Extension', badge: 'isolation', sets: 3, w: 65, r: 12, rest: 75, compound: false,
            why: 'The long head is 55% of tricep mass — only fully activated in overhead position. Most programs only do pushdowns and leave half the tricep untrained.',
            cues: ['Elbows narrow, pointed forward, stay there throughout.', 'Only forearm moves. Upper arm stays pinned overhead.', 'Full stretch before driving up.'],
          },
          {
            id: 'bm-push', name: 'Tricep Rope Pushdown', badge: 'isolation', sets: 3, w: 80, r: 12, rest: 75, compound: false,
            why: 'Lateral and medial head isolation after overhead ext has burned out the long head. Final set: drop 30%, continue to failure.',
            cues: ['15° forward hinge.', 'Full extension, hard squeeze.', 'Drop set final set only.'],
          },
        ],
      },
      {
        label: 'Zone 2 Finisher · 20 min', cardio: true,
        exs: [
          {
            id: 'bm-c1', name: 'Incline Treadmill Walk', badge: 'cardio', cardioOnly: true,
            cardioDesc: '3–4% incline. Post-lift fat oxidation window. Glycogen depleted = body pulling from fat stores right now.',
            zone: 'HR 120–145 BPM', duration: 20,
          },
        ],
      },
    ],
  },
  {
    key: 'tue', label: 'Tue · Lower A', color: 'var(--blue)',
    rationale: 'Hip hinge dominant lower day. Posterior chain focus. Intentionally not a squat day — Tuesday hinge + Friday squat gives 72 hours between lower sessions.',
    blocks: [
      {
        label: 'Compound Block · Rest 2–3 min',
        exs: [
          {
            id: 'bm-rdl', name: 'Romanian Deadlift', badge: 'compound', sets: 4, w: 135, r: 8, rest: 150, compound: true,
            why: 'Constant hamstring tension throughout. No slack point unlike conventional deadlift. Safer spinal load at higher bodyweights.',
            cues: ['Push hips back — not down. Close car door with your butt.', 'Bar against legs the entire descent.', 'Hamstring stretch at mid-shin for taller lifters.', 'Drive hips forward at top. Full glute lockout.'],
          },
          {
            id: 'bm-hip', name: 'Hip Thrust', badge: 'compound', sets: 3, w: 135, r: 10, rest: 120, compound: true,
            why: 'Greatest glute EMG activation of any exercise. Fully shortened position is unique — squats and deadlifts never achieve it. Primary movement, not a finisher.',
            cues: ['Bench edge at shoulder blades. Feet flat, shoulder-width.', 'Drive through full foot — not just heel.', 'Level hips at top. 2-sec hold every rep. Non-negotiable.'],
          },
        ],
      },
      {
        label: 'Accessory Block · Rest 75 sec',
        exs: [
          {
            id: 'bm-curl', name: 'Lying Leg Curl', badge: 'isolation', sets: 3, w: 100, r: 10, rest: 75, compound: false,
            why: 'Knee flexion hits short head of bicep femoris that RDL barely touches. Both hamstring functions need training.',
            cues: ['Hips into pad. Any lift = glute compensating.', 'Full extension every rep.', '3-sec eccentric — this is the growth signal.'],
          },
          {
            id: 'bm-pt', name: 'Cable Pull-Through', badge: 'isolation', sets: 3, w: 70, r: 15, rest: 60, compound: false,
            why: "Reinforces hip hinge pattern under load. Immediate feedback on whether you're hinging at the hip or bending at the waist.",
            cues: ['Face away from cable, feet wider than shoulder.', 'Drive hips forward explosively. Squeeze hard at lockout.', 'Do not hyperextend the lower back at top.'],
          },
          {
            id: 'bm-calf1', name: 'Standing Calf Raise', badge: 'isolation', sets: 4, w: 170, r: 20, rest: 45, compound: false,
            why: 'Calves are slow-twitch dominant — they respond to volume, not heavy loading. High reps, short rest, full range.',
            cues: ['Full hang at bottom, 1-sec pause. Full rise at top, 1-sec pause.', 'Alternate toe angles across sets for full development.'],
          },
        ],
      },
      {
        label: 'Zone 2 Finisher · 20 min', cardio: true,
        exs: [
          {
            id: 'bm-c2', name: 'Stationary Bike', badge: 'cardio', cardioOnly: true,
            cardioDesc: 'Post leg day — bike over treadmill. Keeps hips and quads moving, aids DOMS recovery without impact.',
            zone: 'HR 120–145 BPM', duration: 20,
          },
        ],
      },
    ],
  },
  {
    key: 'thu', label: 'Thu · Upper B', color: 'var(--green)',
    rationale: "Pull-dominant upper day. Rear delts are treated as a priority here — undertrained in almost every program that doesn't make them explicit. Critical for posture and shoulder health.",
    blocks: [
      {
        label: 'Compound Block · Rest 2 min',
        exs: [
          {
            id: 'bm-pull', name: 'Lat Pulldown', badge: 'compound', sets: 4, w: 110, r: 10, rest: 120, compound: true,
            why: 'Neutral grip allows fuller ROM, reduces rotator cuff strain, keeps bicep in stronger position throughout. Replaces behind-neck permanently.',
            cues: ['Lean back 10–15 degrees. Correct body angle.', 'Lead with elbows — into back pockets.', 'Full dead hang at top. Earn the lat stretch.', 'Chest up throughout.'],
          },
          {
            id: 'bm-row', name: 'Seated Cable Row', badge: 'compound', sets: 4, w: 120, r: 10, rest: 120, compound: true,
            why: 'Wide overhand grip: rhomboids, lower traps, rear delts — the muscles responsible for posture improvement visible in a suit or dress shirt.',
            cues: ['Torso upright or slight lean — do not rock.', 'Elbows wide and high. Handle to lower sternum.', 'Full scapular protraction between reps.'],
          },
        ],
      },
      {
        label: 'Accessory Block · Rest 75 sec',
        exs: [
          {
            id: 'bm-dbr', name: 'Single-Arm DB Row', badge: 'isolation', sets: 3, w: 70, r: 10, rest: 75, compound: false,
            why: 'Unilateral work catches the dominant-side compensation that bilateral rows mask. Your back has imbalances — this surfaces and fixes them.',
            cues: ['Row to hip, not chest. Hip path = lat. Chest path = upper trap.', 'Let shoulder drop at bottom — full protraction.', 'Rotate torso slightly at top for full retraction.'],
          },
          {
            id: 'bm-face', name: 'Face Pull', badge: 'isolation', sets: 3, w: 35, r: 20, rest: 45, compound: false,
            why: 'Mandatory shoulder longevity work. External rotation under load counters the internal rotation torque created by every push in this program.',
            cues: ['Pull to ears specifically.', 'End position: hands behind ears, elbows wide.', 'Light weight. Corrective movement, not strength.'],
          },
          {
            id: 'bm-icurl', name: 'Incline DB Curl', badge: 'isolation', sets: 3, w: 27, r: 12, rest: 75, compound: false,
            why: 'Stretch-position loading produces significantly greater hypertrophy than shortened position. The incline loading the bicep at full stretch is why this beats standing curl.',
            cues: ['Arms hang straight. Shoulder stays back.', 'Supinate through curl — pinky up.', '3-sec slow negative.'],
          },
          {
            id: 'bm-ham', name: 'Hammer Curl', badge: 'isolation', sets: 3, w: 35, r: 12, rest: 75, compound: false,
            why: 'Brachialis — underneath the bicep, physically pushes it up. Requires neutral grip. Does not respond to supinated curls. This is where arm size comes from.',
            cues: ['Elbow pinned to side.', 'Strict alternating.', 'Full extension at bottom.'],
          },
        ],
      },
      {
        label: 'Zone 2 Finisher · 20 min', cardio: true,
        exs: [
          {
            id: 'bm-c3', name: 'Elliptical', badge: 'cardio', cardioOnly: true,
            cardioDesc: 'Upper pull day — elliptical preferred. Low impact, full-body movement. Keep it true Zone 2.',
            zone: 'HR 120–145 BPM', duration: 20,
          },
        ],
      },
    ],
  },
  {
    key: 'fri', label: 'Fri · Lower B', color: 'var(--purple)',
    rationale: 'Quad and glute session. Friday placement gives 72 hours from Tuesday hinge day. Hack squat as primary — mechanically optimal for tall lifters.',
    blocks: [
      {
        label: 'Compound Block · Rest 2–3 min',
        exs: [
          {
            id: 'bm-hack', name: 'Hack Squat', badge: 'compound', sets: 4, w: 180, r: 8, rest: 150, compound: true,
            why: "At 6'3\", barbell back squat mechanics shift load to the lower back due to femur length. Hack squat keeps you upright — 100% of effort to the quad. Not a compromise. The mechanically superior choice for your structure.",
            cues: ['Feet mid-platform, shoulder-width, 20–30° out.', 'Below parallel. No partial reps.', '3-sec eccentric. No lockout at top — maintain tension.'],
          },
          {
            id: 'bm-bss', name: 'Bulgarian Split Squat', badge: 'compound', sets: 3, w: 27, r: 8, rest: 120, compound: true,
            why: 'Single-leg training at equivalent or greater stimulus than bilateral at significantly lower total load. Hip flexor stretch on rear leg is therapeutic for desk-sitting lifters.',
            cues: ['Rear foot elevated. Laces down.', 'Front foot far enough for vertical shin.', 'Descend straight down. Torso upright.'],
          },
        ],
      },
      {
        label: 'Accessory Block · Rest 75 sec',
        exs: [
          {
            id: 'bm-ext', name: 'Leg Extension', badge: 'isolation', sets: 3, w: 85, r: 12, rest: 75, compound: false,
            why: 'VMO isolation — the teardrop quad. Full extension under load produces unique VMO signal that no compound can replicate.',
            cues: ['Pad at base of shin.', 'Full extension, 1-sec squeeze at top.', 'Slow controlled return.'],
          },
          {
            id: 'bm-abd', name: 'Abductor Machine', badge: 'isolation', sets: 3, w: 100, r: 20, rest: 45, compound: false,
            why: 'Glute medius stabilizes every lower body movement. When it is weak, the knees and lower back compensate. Training it directly makes everything else better.',
            cues: ['Slight forward lean — loads glute med, not TFL.', 'Full range, hold at end.', 'Control the return.'],
          },
          {
            id: 'bm-calf2', name: 'Seated Calf Raise', badge: 'isolation', sets: 4, w: 90, r: 20, rest: 45, compound: false,
            why: 'Soleus — only accessible with bent knee. Larger than most realize. High volume is the only stimulus it responds to.',
            cues: ['Pad above knee on lower quad.', 'Full stretch and rise. Pause at both ends.'],
          },
        ],
      },
      {
        label: 'Zone 2 Finisher · 20 min', cardio: true,
        exs: [
          {
            id: 'bm-c4', name: 'Stationary Bike', badge: 'cardio', cardioOnly: true,
            cardioDesc: 'End of week. Low resistance. Protect the weekend recovery window.',
            zone: 'HR 115–135 BPM', duration: 20,
          },
        ],
      },
    ],
  },
]

// ── Variant helpers ───────────────────────────────────────────────────────────

/** Compress a 4-day program into a 3-day Push / Pull / Legs split */
function ppl(base4: DayProgram[]): DayProgram[] {
  const [ua, la, ub, lb] = base4
  return [
    { ...ua, key: 'push', label: 'Day 1 · Push', rationale: ua.rationale },
    { ...ub, key: 'pull', label: 'Day 2 · Pull', rationale: ub.rationale },
    {
      key: 'legs', label: 'Day 3 · Legs', color: 'var(--purple)',
      rationale: 'Combined lower day — hinge and squat patterns in one session.',
      blocks: [
        { label: 'Compound Block', exs: [la.blocks[0].exs[0], la.blocks[0].exs[1], lb.blocks[0].exs[0]] },
        { label: 'Accessory Block', exs: [la.blocks[1].exs[0], lb.blocks[1].exs[0]] },
        { label: 'Zone 2 · 22 min', cardio: true, exs: [{ ...la.blocks[2].exs[0], duration: 22 }] },
      ],
    },
  ]
}

/** Expand a 4-day program to 5 days by inserting a dedicated Wed Shoulders + Arms day */
function build5(base4: DayProgram[]): DayProgram[] {
  const [ua, la, ub, lb] = base4
  const shoulders: DayProgram = {
    key: 'wed', label: 'Wed · Shoulders + Arms', color: 'var(--teal,#38d9c0)',
    rationale: 'Dedicated delt and arm session. Mid-week placement means fresh shoulders after Monday push.',
    blocks: [
      {
        label: 'Shoulder Block · Rest 90 sec',
        exs: [
          {
            id: 's5-ohp', name: 'DB Overhead Press', badge: 'compound', sets: 4, w: 40, r: 10, rest: 90, compound: true,
            why: 'Strict overhead press on Wednesday. No rotation = pure anterior and lateral delt stimulus without the anterior overlap from Monday Arnold Press. Complementary, not redundant — two pressing variations across the week.',
            cues: ['Palms forward. Elbows at 90° at start.', 'Press to full lockout overhead. Control descent.', 'Brace core hard — no lumbar arch.'],
          },
          {
            id: 's5-lat', name: 'Cable Lateral Raise', badge: 'isolation', sets: 4, w: 25, r: 15, rest: 60, compound: false,
            why: 'Volume on the lateral delt — the V-taper builder.',
            cues: ['Lead with elbow. Stop at shoulder height.', '4-sec negative.'],
          },
          {
            id: 's5-fp', name: 'Face Pull', badge: 'isolation', sets: 3, w: 35, r: 20, rest: 45, compound: false,
            why: 'External rotation work — mandatory shoulder health.',
            cues: ['Pull to ears. External rotate at end. Light weight.'],
          },
        ],
      },
      {
        label: 'Arms Block · Rest 75 sec',
        exs: [
          {
            id: 's5-ohe', name: 'Tricep Overhead Extension', badge: 'isolation', sets: 3, w: 65, r: 12, rest: 75, compound: false,
            why: 'Long head — 55% of tricep mass. Only hit in overhead position.',
            cues: ['Elbows narrow and forward. Forearm only moves.'],
          },
          {
            id: 's5-pd', name: 'Tricep Rope Pushdown', badge: 'isolation', sets: 3, w: 80, r: 12, rest: 75, compound: false,
            why: 'Lateral and medial head finisher.',
            cues: ['15° lean. Full extension. Drop set on last set.'],
          },
          {
            id: 's5-ic', name: 'Incline DB Curl', badge: 'isolation', sets: 3, w: 27, r: 12, rest: 75, compound: false,
            why: 'Stretch position bicep loading — superior hypertrophy signal.',
            cues: ['Arms hang straight. Supinate through curl.', '3-sec negative.'],
          },
          {
            id: 's5-hc', name: 'Hammer Curl', badge: 'isolation', sets: 3, w: 35, r: 12, rest: 75, compound: false,
            why: 'Brachialis development — physically pushes bicep up.',
            cues: ['Elbow pinned. Strict alternating.'],
          },
        ],
      },
    ],
  }
  return [ua, la, shoulders, ub, lb]
}

// ── Transform program ─────────────────────────────────────────────────────────
// Body recomp: moderate weight (~85% of build_muscle), higher reps (12),
// shorter rest (90s compound / 60s accessory). All values are clean integers.

const TRANSFORM_4: DayProgram[] = [
  {
    key: 'mon', label: 'Mon · Upper A', color: 'var(--gold)',
    rationale: 'Push-dominant upper day. Moderate weight, higher rep range keeps metabolic demand elevated while still driving hypertrophy — the recomp sweet spot.',
    blocks: [
      {
        label: 'Compound Block · Rest 90 sec',
        exs: [
          {
            id: 'tr-bench', name: 'Low Incline Barbell Press', badge: 'compound', sets: 4, w: 115, r: 12, rest: 90, compound: true,
            why: '30° incline keeps chest as primary driver. At 12 reps with 90s rest the metabolic demand is high enough for fat oxidation while load is sufficient for muscle retention.',
            warning: '⚠️ GRIP: Bar across base of fingers — diagonal. Use wrist wraps if needed.',
            cues: ['Scapulae retracted and depressed before unracking.', 'Bar path diagonal: touches nipple line, drives above collarbone.', '3-sec eccentric every rep.', 'Drive feet into the floor.'],
          },
          {
            id: 'tr-apress', name: 'Arnold Press', badge: 'compound', sets: 3, w: 30, r: 12, rest: 90, compound: true,
            why: 'All three delt heads in one movement. At 12 reps with shorter rest than pure muscle-building, the metabolic demand is elevated while the stimulus for retention remains high.',
            cues: ['Palms facing you at chin. Rotate outward as you press.', 'Elbows in front of torso throughout.', 'No aggressive lumbar arch.'],
          },
        ],
      },
      {
        label: 'Accessory Block · Rest 60 sec',
        exs: [
          {
            id: 'tr-fly', name: 'Cable Low-to-High Fly', badge: 'isolation', sets: 3, w: 25, r: 15, rest: 60, compound: false,
            why: 'Constant cable tension through full arc. 15 reps at 60s rest elevates heart rate and drives sternal pec volume.',
            cues: ['Slight forward lean, soft elbow bend.', 'Elbows together — hands are passengers.', '2-sec squeeze at top.'],
          },
          {
            id: 'tr-lat', name: 'Cable Lateral Raise', badge: 'isolation', sets: 3, w: 20, r: 15, rest: 60, compound: false,
            why: 'Lateral delt volume. Short rest creates significant pump and keeps HR elevated for the recomp effect.',
            cues: ['Lead with elbow. Pinky slightly higher than thumb.', 'Stop at shoulder height.', '4-sec negative.'],
          },
          {
            id: 'tr-ohe', name: 'Tricep Overhead Extension', badge: 'isolation', sets: 3, w: 50, r: 15, rest: 60, compound: false,
            why: 'Long head — 55% of tricep mass. Only fully activated in overhead position. 15 reps creates high mechanical tension with metabolic stress.',
            cues: ['Elbows narrow and forward. Forearm only moves.', 'Full stretch before driving up.'],
          },
          {
            id: 'tr-push', name: 'Tricep Rope Pushdown', badge: 'isolation', sets: 3, w: 65, r: 15, rest: 60, compound: false,
            why: 'Lateral and medial head finisher after overhead ext has targeted the long head. Short rest elevates HR into the fat-burn zone.',
            cues: ['15° forward hinge.', 'Full extension, hard squeeze.', 'Drop set final set only.'],
          },
        ],
      },
      {
        label: 'Zone 2 Finisher · 22 min', cardio: true,
        exs: [
          {
            id: 'tr-c1', name: 'Incline Treadmill Walk', badge: 'cardio', cardioOnly: true,
            cardioDesc: '3–4% incline. Glycogen partially depleted from lifting — fat oxidation window is open right now.',
            zone: 'HR 120–145 BPM', duration: 22,
          },
        ],
      },
    ],
  },
  {
    key: 'tue', label: 'Tue · Lower A', color: 'var(--blue)',
    rationale: 'Hip hinge dominant lower day. Posterior chain at recomp volume — high enough rep range to drive metabolic stress, sufficient load to retain muscle.',
    blocks: [
      {
        label: 'Compound Block · Rest 90 sec',
        exs: [
          {
            id: 'tr-rdl', name: 'Romanian Deadlift', badge: 'compound', sets: 4, w: 115, r: 12, rest: 90, compound: true,
            why: 'Constant hamstring tension throughout. At 12 reps with 90s rest the RDL becomes metabolically demanding while still driving posterior chain strength.',
            cues: ['Push hips back — not down.', 'Bar against legs the entire descent.', 'Hamstring stretch at mid-shin.', 'Drive hips forward at top.'],
          },
          {
            id: 'tr-hip', name: 'Hip Thrust', badge: 'compound', sets: 3, w: 115, r: 12, rest: 90, compound: true,
            why: 'Greatest glute EMG activation of any exercise. 12 reps with short rest creates both hypertrophy signal and metabolic demand — the recomp combination.',
            cues: ['Bench at shoulder blades. Feet flat, shoulder-width.', 'Drive through full foot.', 'Level hips, 2-sec hold at top every rep.'],
          },
        ],
      },
      {
        label: 'Accessory Block · Rest 60 sec',
        exs: [
          {
            id: 'tr-curl', name: 'Lying Leg Curl', badge: 'isolation', sets: 3, w: 80, r: 12, rest: 60, compound: false,
            why: 'Knee flexion hits short head of bicep femoris. Short rest creates a significant hamstring pump and keeps metabolic demand high.',
            cues: ['Hips into pad throughout.', 'Full extension every rep.', '3-sec eccentric.'],
          },
          {
            id: 'tr-pt', name: 'Cable Pull-Through', badge: 'isolation', sets: 3, w: 55, r: 15, rest: 60, compound: false,
            why: 'Reinforces hip hinge pattern under load at higher reps. Direct feedback on hip hinge quality.',
            cues: ['Face away from cable. Drive hips forward at lockout.', 'Do not hyperextend lower back.'],
          },
          {
            id: 'tr-calf1', name: 'Standing Calf Raise', badge: 'isolation', sets: 4, w: 135, r: 20, rest: 45, compound: false,
            why: 'Calves are slow-twitch dominant — they respond to volume. High reps, short rest, full range.',
            cues: ['Full hang at bottom, 1-sec pause. Full rise at top, 1-sec pause.'],
          },
        ],
      },
      {
        label: 'Zone 2 Finisher · 22 min', cardio: true,
        exs: [
          {
            id: 'tr-c2', name: 'Stationary Bike', badge: 'cardio', cardioOnly: true,
            cardioDesc: 'Post leg day — bike over treadmill. Keeps hips and quads moving, aids DOMS recovery without impact.',
            zone: 'HR 120–145 BPM', duration: 22,
          },
        ],
      },
    ],
  },
  {
    key: 'thu', label: 'Thu · Upper B', color: 'var(--green)',
    rationale: 'Pull-dominant upper day. Rear delts and back volume at recomp intensity. Higher reps than pure muscle-building, shorter rest.',
    blocks: [
      {
        label: 'Compound Block · Rest 90 sec',
        exs: [
          {
            id: 'tr-pull', name: 'Lat Pulldown', badge: 'compound', sets: 4, w: 90, r: 12, rest: 90, compound: true,
            why: 'Neutral grip, full ROM. At 12 reps with 90s rest the lat demand is high and heart rate stays elevated — the recomp training zone.',
            cues: ['Lean back 10–15 degrees.', 'Lead with elbows into back pockets.', 'Full dead hang at top.'],
          },
          {
            id: 'tr-row', name: 'Seated Cable Row', badge: 'compound', sets: 4, w: 95, r: 12, rest: 90, compound: true,
            why: 'Wide overhand grip: rhomboids, lower traps, rear delts. The posture muscles. Short rest keeps HR in the fat-burn zone.',
            cues: ['Torso upright — do not rock.', 'Elbows wide and high. Handle to lower sternum.', 'Full scapular protraction between reps.'],
          },
        ],
      },
      {
        label: 'Accessory Block · Rest 60 sec',
        exs: [
          {
            id: 'tr-dbr', name: 'Single-Arm DB Row', badge: 'isolation', sets: 3, w: 55, r: 12, rest: 60, compound: false,
            why: 'Unilateral work catches the dominant-side compensation that bilateral rows mask. Short rest keeps metabolic demand high.',
            cues: ['Row to hip — hip path is lat, chest path is upper trap.', 'Full protraction at bottom.'],
          },
          {
            id: 'tr-face', name: 'Face Pull', badge: 'isolation', sets: 3, w: 30, r: 20, rest: 45, compound: false,
            why: 'External rotation work. Mandatory shoulder longevity regardless of goal type.',
            cues: ['Pull to ears. External rotate at end. Light weight only.'],
          },
          {
            id: 'tr-icurl', name: 'Incline DB Curl', badge: 'isolation', sets: 3, w: 22, r: 12, rest: 60, compound: false,
            why: 'Stretch-position loading produces greater hypertrophy than shortened-position. The recomp context still requires sufficient bicep stimulus to retain muscle.',
            cues: ['Arms hang straight. Supinate through curl.', '3-sec slow negative.'],
          },
          {
            id: 'tr-ham', name: 'Hammer Curl', badge: 'isolation', sets: 3, w: 27, r: 12, rest: 60, compound: false,
            why: 'Brachialis development — sits underneath the bicep and physically pushes it up.',
            cues: ['Elbow pinned to side.', 'Strict alternating.', 'Full extension at bottom.'],
          },
        ],
      },
      {
        label: 'Zone 2 Finisher · 22 min', cardio: true,
        exs: [
          {
            id: 'tr-c3', name: 'Elliptical', badge: 'cardio', cardioOnly: true,
            cardioDesc: 'Upper pull day — elliptical preferred. Full-body low-impact movement. True Zone 2.',
            zone: 'HR 120–145 BPM', duration: 22,
          },
        ],
      },
    ],
  },
  {
    key: 'fri', label: 'Fri · Lower B', color: 'var(--purple)',
    rationale: 'Quad and glute session. 72 hours from Tuesday hinge day. Recomp volume: sufficient load for retention, higher reps for metabolic output.',
    blocks: [
      {
        label: 'Compound Block · Rest 90 sec',
        exs: [
          {
            id: 'tr-hack', name: 'Hack Squat', badge: 'compound', sets: 4, w: 135, r: 12, rest: 90, compound: true,
            why: 'Hack squat at 12 reps with 90s rest creates both the hypertrophy signal (sufficient load) and the metabolic demand (short rest) required for body recomp.',
            cues: ['Feet mid-platform, shoulder-width, 20–30° toe-out.', 'Below parallel. No partial reps.', '3-sec eccentric. No lockout at top.'],
          },
          {
            id: 'tr-bss', name: 'Bulgarian Split Squat', badge: 'compound', sets: 3, w: 22, r: 10, rest: 90, compound: true,
            why: 'Single-leg training at equivalent stimulus with lower total spinal load. Hip flexor stretch is therapeutic.',
            cues: ['Rear foot elevated. Front foot far enough for vertical shin.', 'Descend straight down. Torso upright.'],
          },
        ],
      },
      {
        label: 'Accessory Block · Rest 60 sec',
        exs: [
          {
            id: 'tr-ext', name: 'Leg Extension', badge: 'isolation', sets: 3, w: 70, r: 15, rest: 60, compound: false,
            why: 'VMO isolation — the teardrop quad. Full extension under load at higher reps creates a significant metabolic quad pump.',
            cues: ['Pad at base of shin.', 'Full extension, 1-sec squeeze.', 'Slow controlled return.'],
          },
          {
            id: 'tr-abd', name: 'Abductor Machine', badge: 'isolation', sets: 3, w: 80, r: 20, rest: 45, compound: false,
            why: 'Glute medius. Stabilizes every lower body compound. Short rest is fine here — it is not a fatiguing movement.',
            cues: ['Slight forward lean for glute med.', 'Full range, hold at end.'],
          },
          {
            id: 'tr-calf2', name: 'Seated Calf Raise', badge: 'isolation', sets: 4, w: 70, r: 20, rest: 45, compound: false,
            why: 'Soleus — only accessible with bent knee. High volume is the only stimulus it responds to.',
            cues: ['Full stretch and rise. Pause at both ends.'],
          },
        ],
      },
      {
        label: 'Zone 2 Finisher · 22 min', cardio: true,
        exs: [
          {
            id: 'tr-c4', name: 'Stationary Bike', badge: 'cardio', cardioOnly: true,
            cardioDesc: 'End of training week. Low resistance. Protect the weekend recovery window.',
            zone: 'HR 115–135 BPM', duration: 22,
          },
        ],
      },
    ],
  },
]

// ── Program registry ──────────────────────────────────────────────────────────

const BASE_PROGRAMS: Record<GoalType, DayProgram[]> = {
  fat_burn:     FAT_BURN_4,
  build_muscle: BUILD_MUSCLE_4,
  transform:    TRANSFORM_4,
}

// ── getProgram ────────────────────────────────────────────────────────────────

/**
 * Returns the ordered list of daily workout sessions for the given goal and
 * training-days-per-week preference.
 *
 * @param goal         GoalType
 * @param daysPerWeek  3 | 4 | 5 — defaults to 4
 * @param _week        Current program week (reserved — not used in routing yet)
 */
export function getProgram(
  goal: GoalType,
  daysPerWeek: 3 | 4 | 5 = 4,
  _week = 1,
): DayProgram[] {
  const base = BASE_PROGRAMS[goal] ?? BASE_PROGRAMS.build_muscle
  if (daysPerWeek === 3) return ppl(base)
  if (daysPerWeek === 5) return build5(base)
  return base
}

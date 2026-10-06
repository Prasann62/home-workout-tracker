// ============================================================
// FORM DEMOS — YouTube video IDs + form cues per exercise
// Video IDs confirmed from web search (reputable fitness channels)
// ============================================================

export const FORM_DEMOS = {
  pushup: {
    name: 'Push-Up',
    emoji: '💪',
    muscles: ['Chest', 'Triceps', 'Shoulders', 'Core'],
    difficulty: 'Beginner',
    videoId: 's115u9z1LSI',        // Jeff Nippard – Perfect Push Workout
    videoChannel: 'Jeff Nippard',
    keyPoints: [
      'Hands slightly wider than shoulders',
      'Body straight — head to heels like a plank',
      'Elbows at 45° angle to your body',
      'Lower chest all the way to just above floor',
      'Push through palms — full arm extension at top',
    ],
    mistakes: ['Hips sagging', 'Flared elbows', 'Neck craning', 'Partial range'],
    breathe: 'Inhale ↓ down · Exhale ↑ push up',
    tip: 'Squeeze your core and glutes the entire time — your body is one rigid plank.',
  },

  squat: {
    name: 'Squat',
    emoji: '🏋️',
    muscles: ['Quads', 'Glutes', 'Hamstrings', 'Core'],
    difficulty: 'Beginner',
    videoId: 'aclHkVaku9U',        // Squat tutorial – proper form
    videoChannel: 'Fitness Tutorial',
    keyPoints: [
      'Feet shoulder-width, toes slightly out',
      'Send hips BACK first, then bend knees',
      'Knees track over second toe — no cave-in',
      'Thighs at least parallel to floor at bottom',
      'Drive through heels, squeeze glutes at top',
    ],
    mistakes: ['Knees caving in', 'Heels rising', 'Rounding back', 'Too shallow'],
    breathe: 'Inhale ↓ down · Exhale ↑ stand',
    tip: 'Think "sit back into a chair" — your hips go back before your knees bend.',
  },

  lunge: {
    name: 'Lunge',
    emoji: '🦵',
    muscles: ['Quads', 'Glutes', 'Hamstrings', 'Balance'],
    difficulty: 'Beginner',
    videoId: 'wrwwXE_x-pQ',        // Lunge form tutorial
    videoChannel: 'Fitness Guide',
    keyPoints: [
      'Step forward ~60–80 cm with one foot',
      'Lower back knee toward floor (no impact)',
      'Front shin stays vertical over foot',
      'Front knee stays behind toes',
      'Push through front heel to return',
    ],
    mistakes: ['Knee caving inward', 'Leaning forward', 'Short step', 'Slamming back knee'],
    breathe: 'Inhale ↓ lunge · Exhale ↑ return',
    tip: 'Torso stays upright like a flagpole — no forward lean.',
  },

  situp: {
    name: 'Sit-Up',
    emoji: '🔥',
    muscles: ['Abs', 'Hip Flexors', 'Core'],
    difficulty: 'Beginner',
    videoId: 'jDwoBqPH0jk',        // Sit-up form tutorial
    videoChannel: 'Fitness Tutorial',
    keyPoints: [
      'Knees bent 90°, feet flat on floor',
      'Hands crossed on chest (not pulling neck)',
      'Curl up leading with chest — chin to chest first',
      'Come all the way up — elbows to knees',
      'Lower with control — don\'t collapse back',
    ],
    mistakes: ['Pulling neck with hands', 'Using momentum', 'Incomplete range', 'Uncontrolled descent'],
    breathe: 'Exhale ↑ up · Inhale ↓ down',
    tip: 'Lead with your chest, not your head — contract your abs, not your neck.',
  },

  plank: {
    name: 'Plank',
    emoji: '⏱',
    muscles: ['Core', 'Shoulders', 'Glutes', 'Back'],
    difficulty: 'Beginner',
    videoId: 'pSHjTRCQxIw',        // Plank tutorial
    videoChannel: 'Fitness Tutorial',
    keyPoints: [
      'Elbows directly under shoulders',
      'Body forms a straight line — no sag, no pike',
      'Squeeze abs, glutes, and quads simultaneously',
      'Look at the floor — neutral neck',
      'Breathe steadily throughout — never hold breath',
    ],
    mistakes: ['Hips sagging', 'Hips too high', 'Looking forward', 'Holding breath'],
    breathe: 'Slow steady breaths — in through nose, out through mouth',
    tip: 'Squeeze your glutes as hard as possible — this alone fixes most form issues.',
  },

  highKnees: {
    name: 'High Knees',
    emoji: '🦵',
    muscles: ['Hip Flexors', 'Quads', 'Cardio', 'Core'],
    difficulty: 'Beginner',
    videoId: 'oDdkytliOqE',        // High knees tutorial
    videoChannel: 'Fitness Tutorial',
    keyPoints: [
      'Stay tall — do not lean back',
      'Drive knees to hip height each rep',
      'Land softly on balls of feet',
      'Arms pump at 90° — opposite arm to knee',
      'Fast, light, bouncy rhythm',
    ],
    mistakes: ['Leaning backward', 'Flat-footed landing', 'Arms not pumping', 'Knees too low'],
    breathe: 'Rhythmic — exhale on each knee drive',
    tip: 'Think of running in place — active arm drive automatically lifts your knees.',
  },

  jumpingJack: {
    name: 'Jumping Jack',
    emoji: '⭐',
    muscles: ['Full Body', 'Cardio', 'Shoulders', 'Legs'],
    difficulty: 'Beginner',
    videoId: 'c4DAnQ6DtF8',        // Jumping jacks tutorial
    videoChannel: 'Fitness Tutorial',
    keyPoints: [
      'Start: feet together, arms at sides',
      'Jump feet out wider than shoulder-width',
      'Raise arms all the way overhead and clap',
      'Jump feet back in and arms down simultaneously',
      'Land softly on balls of feet — no heavy heels',
    ],
    mistakes: ['Heavy heel landing', 'Arms not overhead', 'Stiff knees', 'Hunched shoulders'],
    breathe: 'Exhale out · Inhale in',
    tip: 'Stay on the balls of your feet the entire time for speed and joint safety.',
  },

  mountainClimber: {
    name: 'Mountain Climber',
    emoji: '🏔️',
    muscles: ['Core', 'Shoulders', 'Hip Flexors', 'Cardio'],
    difficulty: 'Intermediate',
    videoId: 'cnyTQDSE884',        // Mountain Climbers for Beginners (confirmed)
    videoChannel: 'Fitness Tutorial',
    keyPoints: [
      'Start in high plank — hands under shoulders',
      'Drive one knee toward chest, keep hips level',
      'Quickly switch legs in a running motion',
      'Shoulders stay stable — no side rocking',
      'Core stays braced — no rounding or piking',
    ],
    mistakes: ['Hips rising (piking)', 'Stepping sideways', 'Shoulders rocking', 'Back leg not extended'],
    breathe: 'Fast rhythmic — exhale each knee drive',
    tip: 'Keep your hips perfectly level — if they bounce, slow down and regain control first.',
  },

  burpee: {
    name: 'Burpee',
    emoji: '💥',
    muscles: ['Full Body', 'Cardio', 'Chest', 'Legs', 'Core'],
    difficulty: 'Advanced',
    videoId: 'u6ZelKyUM6g',        // "How To Do A Burpee | The Right Way" (confirmed)
    videoChannel: 'The Right Way',
    keyPoints: [
      '① Squat down, hands on floor shoulder-width',
      '② Jump feet back into push-up position',
      '③ Do one full push-up (chest to floor)',
      '④ Jump feet back to hands',
      '⑤ Explode up — arms overhead, full jump',
    ],
    mistakes: ['Snake push-up (hips first)', 'No push-up', 'No jump at top', 'Hands too far'],
    breathe: 'Exhale on push · Exhale on jump',
    tip: 'The jump at the top is what makes it a burpee — earn every single one.',
  },

  gluteBridge: {
    name: 'Glute Bridge',
    emoji: '🍑',
    muscles: ['Glutes', 'Hamstrings', 'Core', 'Lower Back'],
    difficulty: 'Beginner',
    videoId: 'OUgsJ8-Vi0E',        // Glute bridge tutorial
    videoChannel: 'Fitness Tutorial',
    keyPoints: [
      'Lie on back, knees bent 90°, feet hip-width',
      'Feet close enough to touch heels with fingers',
      'Drive through HEELS — not balls of feet',
      'Squeeze glutes hard — hold 1 second at top',
      'Body straight diagonal at top — no hyperextension',
    ],
    mistakes: ['Pushing through toes', 'Knees caving', 'Hyperextending lower back', 'Resting at bottom'],
    breathe: 'Exhale ↑ up · Inhale ↓ down',
    tip: 'Hold and squeeze at the top for 1 second — that pause is where glutes are built.',
  },

  jumpRope: {
    name: 'Jump Rope',
    emoji: '🪢',
    muscles: ['Calves', 'Cardio', 'Shoulders', 'Coordination'],
    difficulty: 'Beginner',
    videoId: 'FJmRQ5iTXKE',        // Jump rope tutorial
    videoChannel: 'Fitness Tutorial',
    keyPoints: [
      'Elbows close to sides — wrists rotate, not arms',
      'Stay on balls of feet the entire time',
      'Jump only 2–5 cm — barely clear the rope',
      'Land softly with slight knee bend',
      'Eyes forward — don\'t look down at feet',
    ],
    mistakes: ['Jumping too high', 'Shoulder rotation', 'Heel landing', 'Looking down'],
    breathe: 'Find a rhythm — match breathing to jump cadence',
    tip: 'Tiny jumps = more speed and efficiency. Less height, not more.',
  },
};

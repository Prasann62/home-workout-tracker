// ============================================================
// EXERCISE CATALOG — All available home workout exercises
// Includes all 11 AI-tracked + common manual home exercises
// ============================================================

// All exercises with AI counter support
import { Storage } from '../utils/storage.js';

export const AI_EXERCISES = [
  { key: 'pushup',          name: 'Push-Ups',          emoji: '💪', category: 'Upper' },
  { key: 'squat',           name: 'Squats',             emoji: '🏋️', category: 'Lower' },
  { key: 'lunge',           name: 'Lunges',             emoji: '🦵', category: 'Lower' },
  { key: 'situp',           name: 'Sit-Ups',            emoji: '🔥', category: 'Core'  },
  { key: 'plank',           name: 'Plank',              emoji: '⏱', category: 'Core'  },
  { key: 'jumpRope',        name: 'Jump Rope',          emoji: '🪢', category: 'Cardio'},
  { key: 'jumpingJack',     name: 'Jumping Jacks',      emoji: '⭐', category: 'Cardio'},
  { key: 'highKnees',       name: 'High Knees',         emoji: '🦵', category: 'Cardio'},
  { key: 'mountainClimber', name: 'Mountain Climbers',  emoji: '🏔️', category: 'Cardio'},
  { key: 'burpee',          name: 'Burpees',            emoji: '💥', category: 'Full' },
  { key: 'gluteBridge',     name: 'Glute Bridge',       emoji: '🍑', category: 'Lower' },
];

// Manual exercises (no AI counter — user marks sets manually)
export const MANUAL_EXERCISES = [
  { key: 'chairDip',         name: 'Chair Dips',              emoji: '💺', category: 'Upper' },
  { key: 'inclinePushup',    name: 'Incline Push-Ups',        emoji: '📐', category: 'Upper' },
  { key: 'pikePushup',       name: 'Pike Push-Ups',           emoji: '⬆️', category: 'Upper' },
  { key: 'tricepDip',        name: 'Tricep Dips',             emoji: '💪', category: 'Upper' },
  { key: 'diamondPushup',    name: 'Diamond Push-Ups',        emoji: '💎', category: 'Upper' },
  { key: 'wideSquat',        name: 'Wide Squats / Sumo',      emoji: '🦵', category: 'Lower' },
  { key: 'splitSquat',       name: 'Split Squats',            emoji: '🦵', category: 'Lower' },
  { key: 'calfRaise',        name: 'Calf Raises',             emoji: '🦶', category: 'Lower' },
  { key: 'stepUp',           name: 'Chair Step-Ups',          emoji: '🪜', category: 'Lower' },
  { key: 'wallSit',          name: 'Wall Sit',                emoji: '🧱', category: 'Lower' },
  { key: 'superman',         name: 'Superman Holds',          emoji: '🦸', category: 'Back'  },
  { key: 'snowAngel',        name: 'Reverse Snow Angels',     emoji: '❄️', category: 'Back'  },
  { key: 'seatedRow',        name: 'Seated Towel Rows',       emoji: '🪢', category: 'Back'  },
  { key: 'bicycleCrunch',    name: 'Bicycle Crunches',        emoji: '🚲', category: 'Core'  },
  { key: 'legRaise',         name: 'Leg Raises',              emoji: '📏', category: 'Core'  },
  { key: 'russianTwist',     name: 'Russian Twists',          emoji: '🔄', category: 'Core'  },
  { key: 'deadBug',          name: 'Dead Bug',                emoji: '🐛', category: 'Core'  },
  { key: 'hollowHold',       name: 'Hollow Hold',             emoji: '🌙', category: 'Core'  },
  { key: 'bearCrawl',        name: 'Bear Crawl',              emoji: '🐻', category: 'Cardio'},
  { key: 'shadowBox',        name: 'Shadow Boxing',           emoji: '🥊', category: 'Cardio'},
  { key: 'stairClimb',       name: 'Stair Climb',             emoji: '🪜', category: 'Cardio'},
];

// Flat lookup for any key
export const ALL_EXERCISES = [...AI_EXERCISES, ...MANUAL_EXERCISES];

export const CATEGORIES = ['All', 'Upper', 'Lower', 'Core', 'Back', 'Cardio', 'Full'];

// Check if exercise has AI camera counter
export function hasAICounter(key) {
  return AI_EXERCISES.some(e => e.key === key);
}

export function getExerciseInfo(key) {
  return ALL_EXERCISES.find(e => e.key === key) || null;
}

// ── Custom Plan localStorage helpers ──────────────────────────
const PLAN_KEY = 'ila_custom_plan';

export function loadCustomPlan() {
  return Storage.getCustomPlan();
}

export function saveCustomPlan(plan) {
  Storage.saveCustomPlan(plan);
}

export function resetCustomPlan() {
  Storage.saveCustomPlan(null);
}

// Create a blank plan with one default day
export function newCustomPlan() {
  return {
    planName: 'My Workout Plan',
    days: [
      {
        id: uid(),
        name: 'Day 1',
        exercises: [],
      },
    ],
    activeDay: null,  // null = show plan editor, string = show tracker
    progress: {},     // { dayId: { exEntryId: setsCompleted } }
    completedDays: [],
  };
}

/** Generate the default 4-day starter plan for new users */
export function starterPlan() {
  const days = [
    {
      id: uid(), name: 'Upper Push',
      exercises: [
        entry('pushup', 3, '8–12', 60),
        entry('chairDip', 3, '8–12', 60),
        entry('inclinePushup', 3, 10, 60),
        entry('plank', 3, '20–30s', 30),
      ],
    },
    {
      id: uid(), name: 'Lower Body',
      exercises: [
        entry('squat', 3, 15, 60),
        entry('lunge', 3, '10/leg', 60),
        entry('gluteBridge', 3, 15, 45),
        entry('calfRaise', 3, 15, 30),
      ],
    },
    {
      id: uid(), name: 'Back / Core',
      exercises: [
        entry('superman', 3, '20–30s', 45),
        entry('snowAngel', 3, 15, 45),
        entry('situp', 3, 20, 30),
        entry('legRaise', 3, 12, 30),
      ],
    },
    {
      id: uid(), name: 'Full Body',
      exercises: [
        entry('squat', 3, 15, 45),
        entry('pushup', 3, 10, 45),
        entry('mountainClimber', 3, 20, 30),
        entry('plank', 3, '20s', 30),
      ],
    },
  ];

  const progress = {};
  days.forEach(day => {
    progress[day.id] = {};
    day.exercises.forEach(ex => { progress[day.id][ex.id] = 0; });
  });

  return {
    planName: 'My 4-Day Plan',
    days,
    activeDay: null,
    progress,
    completedDays: [],
  };
}

function entry(key, sets, reps, rest) {
  return { id: uid(), key, sets, reps, rest };
}

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ── Day stats helpers ─────────────────────────────────────────
export function getDayStats(plan, dayId) {
  const day = plan.days.find(d => d.id === dayId);
  if (!day || !plan.progress[dayId]) return { done: 0, total: 0 };
  const total = day.exercises.reduce((s, ex) => s + (ex.sets || 0), 0);
  const done  = Object.values(plan.progress[dayId]).reduce((s, v) => s + v, 0);
  return { done, total };
}

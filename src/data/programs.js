import { uid } from './challengePlan.js';

export const PROGRAMS = [
  {
    id: 'reddit-rr',
    name: 'Reddit Recommended Routine',
    emoji: '💪',
    difficulty: 'Intermediate',
    description: 'The gold standard for bodyweight training. 3 days/week full body routine focusing on strength and progressive overload.',
    daysPerWeek: 3,
    durationWeeks: 8,
    schedule: ['Monday', 'Wednesday', 'Friday'],
    weeks: Array.from({ length: 8 }, (_, i) => ({
      week: i + 1,
      days: [
        {
          name: 'Day A: Push & Squat',
          exercises: [
            { key: 'pushup', sets: 3, reps: 5 + i, rest: 90 },
            { key: 'squat', sets: 3, reps: 10 + i, rest: 90 },
            { key: 'plank', sets: 3, reps: 30 + i * 5, rest: 60 } // reps is seconds for plank
          ]
        },
        {
          name: 'Day B: Hinge & Core',
          exercises: [
            { key: 'lunge', sets: 3, reps: 8 + i, rest: 90 },
            { key: 'gluteBridge', sets: 3, reps: 12 + i, rest: 90 },
            { key: 'situp', sets: 3, reps: 10 + i, rest: 60 }
          ]
        },
        {
          name: 'Day C: Full Body',
          exercises: [
            { key: 'pushup', sets: 3, reps: 5 + i, rest: 90 },
            { key: 'squat', sets: 3, reps: 10 + i, rest: 90 },
            { key: 'lunge', sets: 3, reps: 8 + i, rest: 90 }
          ]
        }
      ]
    }))
  },
  {
    id: 'ila-beginner',
    name: 'ILA Beginner',
    emoji: '🌱',
    difficulty: 'Beginner',
    description: 'A 6-week starter plan using AI-trackable movements. Builds foundational strength.',
    daysPerWeek: 3,
    durationWeeks: 6,
    schedule: ['Tuesday', 'Thursday', 'Saturday'],
    weeks: Array.from({ length: 6 }, (_, i) => ({
      week: i + 1,
      days: [
        {
          name: 'Lower Focus',
          exercises: [
            { key: 'squat', sets: i < 2 ? 2 : 3, reps: 10 + Math.floor(i/2)*2, rest: 60 },
            { key: 'gluteBridge', sets: i < 2 ? 2 : 3, reps: 12 + Math.floor(i/2)*2, rest: 60 },
            { key: 'lunge', sets: i < 2 ? 2 : 3, reps: 8 + Math.floor(i/2)*2, rest: 60 }
          ]
        },
        {
          name: 'Upper & Core',
          exercises: [
            { key: 'pushup', sets: i < 2 ? 2 : 3, reps: 5 + Math.floor(i/2), rest: 90 },
            { key: 'situp', sets: i < 2 ? 2 : 3, reps: 10 + Math.floor(i/2)*2, rest: 60 },
            { key: 'plank', sets: 3, reps: 20 + i*5, rest: 60 }
          ]
        },
        {
          name: 'Full Body Cardio',
          exercises: [
            { key: 'jumpingJack', sets: 3, reps: 20 + i*5, rest: 45 },
            { key: 'highKnees', sets: 3, reps: 20 + i*5, rest: 45 },
            { key: 'burpee', sets: 3, reps: 5 + Math.floor(i/2), rest: 60 }
          ]
        }
      ]
    }))
  },
  {
    id: 'fighter-cond',
    name: 'Fighter Conditioning',
    emoji: '🥊',
    difficulty: 'Advanced',
    description: 'High intensity interval training used by combat athletes. Lots of cardio and core.',
    daysPerWeek: 3,
    durationWeeks: 4,
    schedule: ['Monday', 'Wednesday', 'Friday'],
    weeks: Array.from({ length: 4 }, (_, i) => ({
      week: i + 1,
      days: Array.from({ length: 3 }, () => ({
        name: 'HIIT Circuit',
        exercises: [
          { key: 'jumpRope', sets: 3, reps: 50 + i*10, rest: 30 },
          { key: 'burpee', sets: 3, reps: 10 + i*2, rest: 45 },
          { key: 'mountainClimber', sets: 3, reps: 30 + i*10, rest: 30 },
          { key: 'highKnees', sets: 3, reps: 30 + i*10, rest: 30 }
        ]
      }))
    }))
  },
  {
    id: 'core-daily',
    name: 'Core & Abs Daily',
    emoji: '🔥',
    difficulty: 'Intermediate',
    description: '15-minute daily core burner for a strong midsection.',
    daysPerWeek: 6,
    durationWeeks: 4,
    schedule: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    weeks: Array.from({ length: 4 }, (_, i) => ({
      week: i + 1,
      days: Array.from({ length: 6 }, () => ({
        name: 'Daily Core',
        exercises: [
          { key: 'plank', sets: 3, reps: 45 + i*10, rest: 30 },
          { key: 'situp', sets: 3, reps: 15 + i*2, rest: 30 },
          { key: 'mountainClimber', sets: 3, reps: 40 + i*10, rest: 30 },
          { key: 'gluteBridge', sets: 3, reps: 15 + i*2, rest: 30 }
        ]
      }))
    }))
  }
];

export function getProgramById(id) {
  return PROGRAMS.find(p => p.id === id);
}

export function programToCustomPlan(program, weekNumber) {
  const weekData = program.weeks.find(w => w.week === weekNumber);
  if (!weekData) return null;

  return {
    days: weekData.days.map((day, idx) => ({
      id: uid(),
      name: `W${weekNumber} - ${day.name}`,
      exercises: day.exercises.map(ex => ({
        id: uid(),
        key: ex.key,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.rest
      }))
    }))
  };
}

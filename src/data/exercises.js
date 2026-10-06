export const EXERCISES = [
  { id: 'pushup',          num: '01', name: 'PUSH-UPS',          icon: '💪', desc: 'ELBOW FLEX / PUSH' },
  { id: 'squat',           num: '02', name: 'SQUATS',            icon: '🏋️', desc: 'KNEE DEPTH TRACK' },
  { id: 'lunge',           num: '03', name: 'LUNGES',            icon: '🦵', desc: 'FRONT KNEE FLEX' },
  { id: 'situp',           num: '04', name: 'SIT-UPS',           icon: '🤸', desc: 'TORSO CRUNCH' },
  { id: 'jumpingJack',     num: '05', name: 'JUMPING JACKS',     icon: '🙆', desc: 'ARM JUMP SEQUENCE' },
  { id: 'jumpRope',        num: '06', name: 'JUMP ROPE',         icon: '🪢', desc: 'HIP PEAK DETECT' },
  { id: 'highKnees',       num: '07', name: 'HIGH KNEES',        icon: '🏃', desc: 'KNEE ELEVATION' },
  { id: 'mountainClimber', num: '08', name: 'MOUNTAIN CLIMB',    icon: '🏔️', desc: 'PLANK KNEE DRIVE' },
  { id: 'burpee',          num: '09', name: 'BURPEES',           icon: '💥', desc: 'FULL BODY SEQUENCE' },
  { id: 'gluteBridge',     num: '10', name: 'GLUTE BRIDGE',      icon: '🍑', desc: 'HIP EXTENSION' },
  { id: 'plank',           num: '11', name: 'PLANK',             icon: '🧱', desc: 'ISOMETRIC HOLD' },
  { id: 'karalakattai',    num: '12', name: 'KARALAKATTAI',      icon: '🪵', desc: 'TAMIL CLUB SWING' },
  { id: 'kettlebellSwing', num: '13', name: 'KETTLEBELL SWING',  icon: '🔔', desc: 'EXPLOSIVE HIP SWING' },
  { id: 'kettlebellGoblet',num: '14', name: 'GOBLET SQUAT',      icon: '🏋️‍♂️', desc: 'KETTLEBELL FRONT LOAD' },
];

export function getExercise(id) {
  return EXERCISES.find(e => e.id === id) || EXERCISES[0];
}

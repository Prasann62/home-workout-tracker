// ============================================================
// EXERCISE SELECTOR — Clean minimal pill selector
// ============================================================
import React from 'react';

const EXERCISES = [
  { id: 'pushup',          name: 'Push-Ups',         icon: '💪' },
  { id: 'squat',           name: 'Squats',            icon: '🏋️' },
  { id: 'lunge',           name: 'Lunges',            icon: '🦵' },
  { id: 'situp',           name: 'Sit-Ups',           icon: '🤸' },
  { id: 'jumpingJack',     name: 'Jumping Jacks',     icon: '🙆' },
  { id: 'jumpRope',        name: 'Jump Rope',         icon: '🪢' },
  { id: 'highKnees',       name: 'High Knees',        icon: '🏃' },
  { id: 'mountainClimber', name: 'Mountain Climbers', icon: '🏔️' },
  { id: 'burpee',          name: 'Burpees',           icon: '💥' },
  { id: 'gluteBridge',     name: 'Glute Bridge',      icon: '🍑' },
  { id: 'plank',           name: 'Plank',             icon: '🧘' },
];

export { EXERCISES };

export default function ExerciseSelector({ selected, onSelect, disabled }) {
  return (
    <div className="ex-selector">
      <div className="ex-scroll-row" role="radiogroup" aria-label="Select exercise">
        {EXERCISES.map((ex) => {
          const isSelected = selected === ex.id;
          return (
            <button
              key={ex.id}
              id={`exercise-${ex.id}`}
              className={`ex-pill ${isSelected ? 'ex-pill--active' : ''} ${disabled && !isSelected ? 'ex-pill--disabled' : ''}`}
              onClick={() => !disabled && onSelect(ex.id)}
              role="radio"
              aria-checked={isSelected}
              aria-label={ex.name}
            >
              <span className="ex-pill-icon">{ex.icon}</span>
              <span className="ex-pill-name">{ex.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

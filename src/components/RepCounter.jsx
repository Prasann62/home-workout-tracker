// ============================================================
// REP COUNTER — Clean minimal display
// ============================================================
import React, { useEffect, useRef } from 'react';
import { formatDuration } from '../utils/calorieUtils.js';

export default function RepCounter({ reps, exercise, stage, isPlank, plankSeconds }) {
  const numRef  = useRef(null);
  const prevRef = useRef(reps);

  // Flash on rep increment
  useEffect(() => {
    if (reps > prevRef.current && numRef.current) {
      numRef.current.classList.remove('rc-flash');
      void numRef.current.offsetHeight;
      numRef.current.classList.add('rc-flash');
      const t = setTimeout(() => numRef.current?.classList.remove('rc-flash'), 300);
      prevRef.current = reps;
      return () => clearTimeout(t);
    }
    prevRef.current = reps;
  }, [reps]);

  const stageLabel = (() => {
    const map = {
      idle: '', up: 'Up', down: 'Down', standing: 'Standing',
      squat: 'Depth', lunge: 'Lunge', crunched: 'Crunched', flat: 'Flat',
      ground: 'Down', air: 'Up', holding: 'Holding', broken: 'Fix form',
    };
    return map[stage] || '';
  })();

  const exerciseName = exercise
    ?.replace(/([A-Z])/g, ' $1').trim() || 'Exercise';

  return (
    <div className="rc-wrapper">
      <div className="rc-exercise-name">{exerciseName}</div>

      <div className="rc-count-area">
        {isPlank ? (
          <div className="rc-number" ref={numRef} aria-live="polite">
            {formatDuration(plankSeconds)}
          </div>
        ) : (
          <div className="rc-number" ref={numRef} aria-live="polite" id="rep-counter-display">
            {reps}
          </div>
        )}
        <div className="rc-label">{isPlank ? 'TIME' : 'REPS'}</div>
      </div>

      {stageLabel ? (
        <div className="rc-stage">{stageLabel}</div>
      ) : (
        <div className="rc-stage rc-stage--placeholder"> </div>
      )}
    </div>
  );
}

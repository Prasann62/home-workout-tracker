import { useState, useRef, useEffect } from 'react';
import CameraView from './CameraView.jsx';
import ILALogo from './ILALogo.jsx';
import { StatusBanner } from './SidebarComponents.jsx';
import { formatTime } from './SidebarComponents.jsx';

const HUD_STAGE_LABELS = {
  idle: 'READY', up: 'UP', down: 'DOWN', standing: 'STAND',
  squat: 'DEPTH', lunge: 'LUNGE', crunched: 'CRUNCH', flat: 'FLAT',
  ground: 'GROUND', air: 'JUMP', holding: 'HOLD', broken: 'FIX FORM',
  leftUp: 'LEFT KNEE', rightUp: 'RIGHT KNEE',
  leftDrive: 'LEFT DRIVE', rightDrive: 'RIGHT DRIVE',
  bridge: 'BRIDGE UP',
};

function exerciseDisplayName(id) {
  return (id || 'EXERCISE').replace(/([A-Z])/g, ' $1').trim().toUpperCase();
}

/**
 * Full-screen workout HUD — overlays the camera feed with:
 * - Top bar: ILA logo, exercise name pill, timer
 * - Center: stage badge + coach tip bubble
 * - Bottom bar: BEST | REPS | PR indicator  
 * - Stop button (top-right)
 */
export default function WorkoutHUD({
  onResults, onLoading, onError,
  reps, stage, coachTip, statusMsg, statusType,
  elapsedSeconds, selectedExercise, isPlank, plankSeconds,
  oldPR, onStop,
}) {
  const prevRepsRef = useRef(reps);
  const [repFlash, setRepFlash] = useState(false);

  useEffect(() => {
    if (reps > prevRepsRef.current) {
      setRepFlash(true);
      const t = setTimeout(() => setRepFlash(false), 350);
      prevRepsRef.current = reps;
      return () => clearTimeout(t);
    }
    prevRepsRef.current = reps;
  }, [reps]);

  const currentScore = isPlank ? plankSeconds : reps;
  const isNewPR = currentScore > 0 && currentScore > (oldPR || 0);
  const stageLabel = HUD_STAGE_LABELS[stage] || (stage || 'READY').toUpperCase();
  const exerciseName = exerciseDisplayName(selectedExercise);
  const stageActive = stage && stage !== 'idle';

  return (
    <div className="hud-root" id="workout-session-hud">
      {/* Camera + pose skeleton */}
      <CameraView isActive={true} onResults={onResults} onLoading={onLoading} onError={onError} />

      {/* Status banner (camera errors, warnings) */}
      <StatusBanner message={statusMsg} type={statusType} />

      {/* Top bar */}
      <div className="hud-top-bar">
        <ILALogo mode="icon" />
        <div className="hud-exercise-pill">
          <span className="hud-exercise-name">{exerciseName}</span>
        </div>
        <div className="hud-timer">
          <span className="hud-timer-icon">⏱</span>
          <span className="hud-timer-value">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Center overlay: stage badge + coach tip */}
      <div className="hud-center-overlay">
        <div className={`hud-stage-badge ${stageActive ? 'hud-stage-active' : ''}`}>
          <span className="hud-stage-dot" />
          {stageLabel}
        </div>
        {coachTip && (
          <div className="hud-coach-tip" aria-live="polite">
            <span className="hud-coach-label">ILA COACH</span>
            <span className="hud-coach-text">{coachTip}</span>
          </div>
        )}
      </div>

      {/* Bottom stats bar */}
      <div className="hud-bottom-bar">
        {/* BEST (personal record) */}
        <div className="hud-stat-cell hud-pr-old">
          <span className="hud-stat-label">BEST</span>
          <span className="hud-stat-value">
            {oldPR > 0 ? (isPlank ? formatTime(oldPR) : oldPR) : '—'}
          </span>
        </div>

        {/* Main rep / time display */}
        <div className={`hud-stat-cell hud-rep-hero ${repFlash ? 'hud-rep-flash' : ''}`}>
          {isPlank ? (
            <>
              <span className="hud-stat-label">TIME</span>
              <span className="hud-hero-number hud-plank-time">{formatTime(plankSeconds)}</span>
            </>
          ) : (
            <>
              <span className="hud-stat-label">REPS</span>
              <span className="hud-hero-number" aria-live="polite" aria-label={`${reps} reps`} id="hud-rep-count">
                {reps}
              </span>
            </>
          )}
        </div>

        {/* PR indicator */}
        <div className={`hud-stat-cell hud-pr-new ${isNewPR ? 'hud-pr-new--active' : ''}`}>
          {isNewPR ? (
            <>
              <span className="hud-pr-trophy">🏆</span>
              <span className="hud-stat-label">NEW PR!</span>
            </>
          ) : (
            <>
              <span className="hud-stat-label">SESSION</span>
              <span className="hud-stat-value hud-stat-value--dim">
                {oldPR > 0 ? `/ ${isPlank ? formatTime(oldPR) : oldPR}` : 'FIRST'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Stop button */}
      <button
        className="hud-stop-btn"
        onClick={onStop}
        aria-label="End workout session"
        id="hud-stop-button"
      >
        ■ END
      </button>
    </div>
  );
}

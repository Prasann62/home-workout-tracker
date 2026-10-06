// ============================================================
// WORKOUT SESSION HUD — Full-Screen Camera + Immersive Overlay
//
// Layout (portrait, full-screen):
//   ┌─────────────────────────────┐
//   │  [ILA]   EXERCISE   TIMER  │  ← top bar HUD
//   │                             │
//   │      (CAMERA FEED)          │
//   │     (SKELETON OVERLAY)      │
//   │                             │
//   │    STAGE BADGE + COACH TIP  │  ← center-bottom overlay
//   │                             │
//   │┌─────────────────────────┐  │
//   ││ OLD PR │ REP COUNT │ PR ││  ← bottom stat bar
//   │└─────────────────────────┘  │
//   └─────────────────────────────┘
//
// This component is only mounted during sessionState === 'active'.
// All session data is passed as props from App.jsx.
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import CameraView   from './CameraView.jsx';
import StatusBanner from './StatusBanner.jsx';
import { formatDuration } from '../utils/calorieUtils.js';

// ── Helpers ──────────────────────────────────────────────────
function fmtTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function exName(id) {
  return (id || 'EXERCISE')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toUpperCase();
}

const STAGE_MAP = {
  idle: 'READY', up: 'UP', down: 'DOWN', standing: 'STAND',
  squat: 'DEPTH', lunge: 'LUNGE', crunched: 'CRUNCH', flat: 'FLAT',
  ground: 'GROUND', air: 'JUMP', holding: 'HOLD', broken: 'FIX FORM',
};

export default function WorkoutSessionHUD({
  // camera
  onResults, onLoading, onError,
  // data
  reps, stage, coachTip, statusMsg, statusType,
  elapsedSeconds, selectedExercise, isPlank, plankSeconds,
  oldPR,
  // controls
  onStop,
  isPaused, onPause, onResume,
}) {
  // ── Flash when rep is counted ─────────────────────────────
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

  // ── NEW PR flash ──────────────────────────────────────────
  const score       = isPlank ? plankSeconds : reps;
  const isNewPR     = score > 0 && score > (oldPR || 0);

  const stageLabel  = STAGE_MAP[stage] || (stage || 'READY').toUpperCase();
  const exerciseLabel = exName(selectedExercise);

  // stage colour: accent on active, muted on idle
  const stageActive = stage && stage !== 'idle';

  return (
    <div className="hud-root" id="workout-session-hud">
      {/* ── Full-Screen Camera ─────────────────────────────── */}
      <CameraView
        isActive={!isPaused}
        onResults={onResults}
        onLoading={onLoading}
        onError={onError}
      />

      {/* ── Status Banner (no pose / out of frame) ─────────── */}
      <StatusBanner message={statusMsg} type={statusType} />

      {/* ════════════════════════════════════════════════════
          TOP BAR HUD
      ════════════════════════════════════════════════════ */}
      <div className="hud-top-bar">
        <span className="hud-logo">ILA</span>

        <div className="hud-exercise-pill">
          <span className="hud-exercise-name">{exerciseLabel}</span>
        </div>

        <div className="hud-timer">
          <span className="hud-timer-icon">⏱</span>
          <span className="hud-timer-value">{fmtTime(elapsedSeconds)}</span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          CENTER-BOTTOM OVERLAY: Stage + Coach Tip
      ════════════════════════════════════════════════════ */}
      <div className="hud-center-overlay">
        {/* Stage badge */}
        <div className={`hud-stage-badge ${stageActive ? 'hud-stage-active' : ''}`}>
          <span className="hud-stage-dot" />
          {stageLabel}
        </div>

        {/* AI Coach tip */}
        {coachTip && (
          <div className="hud-coach-tip" aria-live="polite">
            <span className="hud-coach-label">ILA COACH</span>
            <span className="hud-coach-text">{coachTip}</span>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════
          BOTTOM STATS BAR  ←  the key feature
          [ OLD PR ] | [ REPS / TIME ] | [ NEW PR badge ]
      ════════════════════════════════════════════════════ */}
      <div className="hud-bottom-bar">

        {/* Old PR */}
        <div className="hud-stat-cell hud-pr-old">
          <span className="hud-stat-label">OLD PR</span>
          <span className="hud-stat-value">
            {oldPR > 0
              ? isPlank ? formatDuration(oldPR) : `${oldPR}`
              : '—'}
          </span>
        </div>

        {/* ── Giant Rep / Time counter ── */}
        <div className={`hud-stat-cell hud-rep-hero ${repFlash ? 'hud-rep-flash' : ''}`}>
          {isPlank ? (
            <>
              <span className="hud-stat-label">TIME</span>
              <span className="hud-hero-number hud-plank-time">
                {formatDuration(plankSeconds)}
              </span>
            </>
          ) : (
            <>
              <span className="hud-stat-label">REPS</span>
              <span
                className="hud-hero-number"
                aria-live="polite"
                aria-label={`${reps} reps`}
                id="hud-rep-count"
              >
                {reps}
              </span>
            </>
          )}
        </div>

        {/* New PR / current session badge */}
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
                {oldPR > 0 ? `/ ${isPlank ? formatDuration(oldPR) : oldPR}` : 'FIRST'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Stop Button (floating top-right) ──────────────── */}
      <button className="hud-pause-btn" onClick={isPaused ? onResume : onPause}>
        {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
      </button>
      <button
        className="hud-stop-btn"
        onClick={onStop}
        aria-label="End workout session"
        id="hud-stop-button"
      >
        ■ END
      </button>

      {isPaused && (
        <div className="hud-pause-overlay">
          <div className="hud-pause-card">
            <p className="hud-pause-label">PAUSED</p>
            <button className="hud-pause-resume-btn" onClick={onResume}>▶ RESUME</button>
            <button className="hud-pause-end-btn" onClick={onStop}>■ END WORKOUT</button>
          </div>
        </div>
      )}
    </div>
  );
}

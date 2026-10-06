import { useRef, useEffect } from 'react';

// ── Format seconds as MM:SS
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Estimated calories burned (rough MET estimate)
const MET_VALUES = {
  pushup: 3.8, squat: 5, jumpRope: 10, jumpingJack: 8,
  lunge: 4, situp: 3.5, plank: 3,
};
const BODY_WEIGHT_KG = 70;
export function estimateCalories(exerciseId, durationSeconds) {
  const met = MET_VALUES[exerciseId] ?? 4;
  const hours = durationSeconds / 3600;
  return Math.round(met * BODY_WEIGHT_KG * hours * 10) / 10;
}

// ── Gauge config for angle display
const ANGLE_GAUGES = {
  pushup:     { label: 'Elbow Angle', min: 0, max: 180 },
  squat:      { label: 'Knee Depth',  min: 0, max: 180 },
  lunge:      { label: 'Front Knee',  min: 0, max: 180 },
  situp:      { label: 'Torso Lean',  min: 0, max: 180 },
  plank:      { label: 'Body Axis',   min: 120, max: 200 },
  gluteBridge:{ label: 'Hip Angle',   min: 0, max: 180 },
};

// ── Stage → CSS class helper
function stageClass(stage) {
  if (['up', 'standing', 'ground'].includes(stage)) return 'stage-up';
  if (['down', 'squat', 'lunge', 'crunched', 'air', 'bridge'].includes(stage)) return 'stage-down';
  if (stage === 'holding') return 'stage-holding';
  if (stage === 'broken') return 'stage-broken';
  return 'stage-idle';
}

// ── Stage → human readable label
const STAGE_LABELS = {
  idle: 'READY', up: 'STAGE: UP', down: 'STAGE: DOWN',
  standing: 'STANDING', squat: 'DEPTH REACHED', lunge: 'LUNGE DEPTH',
  crunched: 'CRUNCHED', flat: 'FLAT', ground: 'ON GROUND',
  air: 'JUMP PEAK', holding: 'ISOMETRIC HOLD', broken: 'CHECK FORM',
  leftUp: 'LEFT KNEE UP', rightUp: 'RIGHT KNEE UP',
  leftDrive: 'LEFT DRIVE', rightDrive: 'RIGHT DRIVE',
  bridge: 'BRIDGE UP',
};
function stageLabel(stage) {
  return STAGE_LABELS[stage] || stage?.toUpperCase() || 'READY';
}

// ── Feedback tone classifier
function feedbackTone(msg) {
  if (!msg) return 'neutral';
  const t = msg.toLowerCase();
  if (t.includes('good') || t.includes('great') || t.includes('counted') || t.includes('hold')) return 'good';
  if (t.includes('fix') || t.includes('sag') || t.includes('high') || t.includes('warning') || t.includes('⚠️')) return 'error';
  if (t.includes('lower') || t.includes('deeper') || t.includes('hips') || t.includes('frame') || t.includes('level')) return 'warning';
  return 'neutral';
}

// ============================================================
// RepHero — the big rep counter display in the sidebar
// ============================================================
export function RepHero({ reps, exercise, stage, isPlank, plankSeconds, angle }) {
  const repRef = useRef(null);
  const prevReps = useRef(reps);

  useEffect(() => {
    if (reps > prevReps.current && repRef.current) {
      repRef.current.classList.remove('snap-rep');
      void repRef.current.offsetHeight; // force reflow
      repRef.current.classList.add('snap-rep');
      const t = setTimeout(() => repRef.current?.classList.remove('snap-rep'), 250);
      prevReps.current = reps;
      return () => clearTimeout(t);
    }
    prevReps.current = reps;
  }, [reps]);

  const exerciseLabel = exercise?.replace(/([A-Z])/g, ' $1').trim().toUpperCase() || 'EXERCISE';
  const gauge = ANGLE_GAUGES[exercise];
  const showGauge = angle != null && gauge && !isPlank;
  const gaugePct = showGauge
    ? Math.min(100, Math.max(0, ((angle - gauge.min) / (gauge.max - gauge.min)) * 100))
    : 0;

  return (
    <div className="swiss-rep-hero">
      <div className="poster-vertical-ribbon" aria-hidden="true">
        <span>{exerciseLabel} // AI POSE DETECT</span>
      </div>
      <div className="poster-hero-content">
        <div className="poster-metric-tag">
          {isPlank ? 'COUNTDOWN // DURATION' : 'VALIDATED REPETITIONS'}
        </div>
        {isPlank ? (
          <div className="poster-plank-time" aria-live="polite">
            {formatTime(plankSeconds)}
          </div>
        ) : (
          <div className="poster-number-wrapper">
            <div
              ref={repRef}
              className="poster-rep-number"
              aria-live="polite"
              id="rep-counter-display"
            >
              {reps}
            </div>
            <div className="poster-signature-slash" />
          </div>
        )}
        <div className="poster-exercise-title">{exerciseLabel}</div>
        {stage && (
          <div className={`swiss-stage-pill ${stageClass(stage)}`}>
            <span className="pill-dot" /> {stageLabel(stage)}
          </div>
        )}
        {showGauge && (
          <div className="poster-angle-gauge">
            <div className="gauge-label">
              <span>{gauge.label.toUpperCase()}</span>
              <strong>{Math.round(angle)}°</strong>
            </div>
            <div className="poster-gauge-track">
              <div className="poster-gauge-fill" style={{ width: `${gaugePct}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// FormFeedback — the coaching message banner
// ============================================================
export function FormFeedback({ message }) {
  const prevMsg = useRef(message);
  const ref = useRef(null);

  useEffect(() => {
    if (message !== prevMsg.current && ref.current) {
      ref.current.style.animation = 'none';
      void ref.current.offsetHeight;
      ref.current.style.animation = '';
    }
    prevMsg.current = message;
  }, [message]);

  if (!message) return null;

  return (
    <div
      ref={ref}
      className={`form-feedback ${feedbackTone(message)}`}
      role="status"
      aria-live="polite"
      id="form-feedback-banner"
    >
      {message}
    </div>
  );
}

// ============================================================
// ExerciseSelector — the left sidebar exercise list
// ============================================================
import { EXERCISES } from '../data/exercises.js';

export function ExerciseSelector({ selected, onSelect, disabled }) {
  return (
    <div className="swiss-exercise-selector">
      <div className="swiss-section-header">
        <span className="swiss-section-tag">SELECT PROGRAM</span>
        <span className="swiss-section-count">11 DETECTORS</span>
      </div>
      <div className="swiss-exercise-list" role="radiogroup" aria-label="Select exercise detector">
        {EXERCISES.map((ex) => {
          const isActive = selected === ex.id;
          return (
            <button
              key={ex.id}
              id={`exercise-${ex.id}`}
              className={`swiss-exercise-item ${isActive ? 'is-active' : ''} ${disabled && !isActive ? 'is-disabled' : ''}`}
              onClick={() => !disabled && onSelect(ex.id)}
              role="radio"
              aria-checked={isActive}
              aria-label={ex.name}
            >
              <div className="item-num">{ex.num}</div>
              <div className="item-body">
                <span className="item-title">{ex.name}</span>
                <span className="item-desc">{ex.desc}</span>
              </div>
              <span className="item-icon">{ex.icon}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// ControlBar — start/stop/reset + sound/vibration toggles
// ============================================================
export function ControlBar({
  sessionState, onStart, onStop, onReset,
  elapsedSeconds, soundEnabled, onToggleSound,
  vibrationEnabled, onToggleVibration,
}) {
  const isActive = sessionState === 'active';
  const hasStarted = sessionState !== 'idle';

  return (
    <div className="swiss-control-bar">
      <div className="swiss-timer-box">
        <span className="timer-tag">ELAPSED TIME</span>
        <div className="timer-val" aria-label={`Session time: ${formatTime(elapsedSeconds)}`}>
          {formatTime(elapsedSeconds)}
        </div>
      </div>
      <div className="swiss-btn-grid">
        {isActive ? (
          <button id="btn-stop-session" className="swiss-btn swiss-btn-danger" onClick={onStop} aria-label="Stop workout session">
            STOP SESSION ■
          </button>
        ) : (
          <button id="btn-start-session" className="swiss-btn swiss-btn-action" onClick={onStart} aria-label="Start workout session">
            {hasStarted ? 'RESUME SESSION →' : 'START SESSION →'}
          </button>
        )}
        <button id="btn-reset-session" className="swiss-btn swiss-btn-secondary" onClick={onReset} aria-label="Reset session">
          RESET
        </button>
      </div>
      <div className="swiss-toggles-row">
        <button
          id="btn-toggle-sound"
          className={`swiss-toggle-btn ${soundEnabled ? 'is-active' : ''}`}
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute rep sounds' : 'Enable rep sounds'}
        >
          {soundEnabled ? '🔊 SOUND ON' : '🔇 SOUND MUTED'}
        </button>
        <button
          id="btn-toggle-vibration"
          className={`swiss-toggle-btn ${vibrationEnabled ? 'is-active' : ''}`}
          onClick={onToggleVibration}
          title={vibrationEnabled ? 'Disable haptics' : 'Enable haptics'}
        >
          {vibrationEnabled ? '📳 HAPTICS ON' : '📴 HAPTICS OFF'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// StatusBanner — top-of-camera warning/error/info overlay
// ============================================================
export function StatusBanner({ message, type = 'info' }) {
  if (!message) return null;
  return (
    <div className={`status-banner ${type}`} role="alert" aria-live="assertive" id="status-banner">
      {message}
    </div>
  );
}

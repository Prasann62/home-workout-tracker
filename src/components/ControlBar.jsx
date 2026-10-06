// ============================================================
// CONTROL BAR — Swiss Minimalist Action Controls
// ============================================================
import React from 'react';
import { formatDuration } from '../utils/calorieUtils.js';
import { WORKOUT_STATE } from '../utils/poseUtils.js';

export default function ControlBar({
  sessionState,
  onStart,
  onStop,
  onReset,
  elapsedSeconds,
  soundEnabled,
  onToggleSound,
  vibrationEnabled,
  onToggleVibration,
  isLoading,
}) {
  const isActive = sessionState === WORKOUT_STATE.COUNTING;
  const hasStarted = sessionState !== WORKOUT_STATE.IDLE;

  return (
    <div className="swiss-control-bar">
      {/* Session Timer */}
      <div className="swiss-timer-box">
        <span className="timer-tag">ELAPSED TIME</span>
        <div className="timer-val" aria-label={`Session time: ${formatDuration(elapsedSeconds)}`}>
          {formatDuration(elapsedSeconds)}
        </div>
      </div>

      {/* Main Action Trigger Buttons */}
      <div className="swiss-btn-grid">
        {!isActive ? (
          <button
            id="btn-start-session"
            className="swiss-btn swiss-btn-action"
            onClick={onStart}
            aria-label="Start workout session"
            disabled={isLoading}
          >
            {isLoading ? 'LOADING...' : hasStarted ? 'RESUME SESSION →' : 'START SESSION →'}
          </button>
        ) : (
          <button
            id="btn-stop-session"
            className="swiss-btn swiss-btn-danger"
            onClick={onStop}
            aria-label="Stop workout session"
          >
            STOP SESSION ■
          </button>
        )}

        <button
          id="btn-reset-session"
          className="swiss-btn swiss-btn-secondary"
          onClick={onReset}
          aria-label="Reset session"
        >
          RESET
        </button>
      </div>

      {/* Auxiliary Settings Toggles */}
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

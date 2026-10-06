// ============================================================
// REP COUNTER DEMO — Standalone Testing Component
// ============================================================
import React, { useState } from 'react';
import { useRepCounter, EXERCISE_PRESETS } from '../hooks/useRepCounter.js';

export default function RepCounterDemo({ onClose }) {
  const [selectedExercise, setSelectedExercise] = useState('bicep_curl');

  const {
    repCount,
    currentPhase,
    isTracking,
    isCalibrating,
    calibrationProgress,
    baseline,
    thresholds,
    startTracking,
    stopTracking,
    reset,
  } = useRepCounter(selectedExercise);

  return (
    <div className="repdemo-overlay">
      <div className="repdemo-modal">
        {/* Header */}
        <header className="repdemo-header">
          <div>
            <span className="repdemo-eyebrow">EXPO SENSORS MODULE</span>
            <h2 className="repdemo-title">Rep Counter Demo</h2>
          </div>
          {onClose && (
            <button className="repdemo-close-btn" onClick={onClose}>✕</button>
          )}
        </header>

        {/* Exercise Selector */}
        <div className="repdemo-selector">
          <label className="repdemo-label">Exercise Presets:</label>
          <div className="repdemo-preset-grid">
            {Object.keys(EXERCISE_PRESETS).map((key) => (
              <button
                key={key}
                disabled={isTracking}
                className={`repdemo-preset-btn ${selectedExercise === key ? 'is-active' : ''}`}
                onClick={() => setSelectedExercise(key)}
              >
                {EXERCISE_PRESETS[key].name}
              </button>
            ))}
          </div>
        </div>

        {/* Auto Calibration Bar */}
        {isCalibrating && (
          <div className="repdemo-calib-box">
            <span className="repdemo-calib-text">Calibrating Resting Baseline...</span>
            <div className="repdemo-calib-bar">
              <div className="repdemo-calib-fill" style={{ width: `${Math.round(calibrationProgress * 100)}%` }} />
            </div>
          </div>
        )}

        {/* Giant Rep Counter & Phase Display */}
        <div className="repdemo-counter-card">
          <span className="repdemo-phase-badge" data-phase={currentPhase}>
            PHASE: {currentPhase.toUpperCase()}
          </span>
          <div className="repdemo-rep-number">
            {repCount}
          </div>
          <span className="repdemo-rep-label">COMPLETED REPS</span>
        </div>

        {/* Sensor & Threshold Readouts */}
        <div className="repdemo-stats-grid">
          <div className="repdemo-stat-item">
            <span className="repdemo-stat-lbl">Baseline</span>
            <span className="repdemo-stat-val">{baseline.toFixed(2)}g</span>
          </div>
          <div className="repdemo-stat-item">
            <span className="repdemo-stat-lbl">Up Threshold</span>
            <span className="repdemo-stat-val">{thresholds.upThreshold.toFixed(2)}g</span>
          </div>
          <div className="repdemo-stat-item">
            <span className="repdemo-stat-lbl">Down Threshold</span>
            <span className="repdemo-stat-val">{thresholds.downThreshold.toFixed(2)}g</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="repdemo-actions">
          {!isTracking ? (
            <button className="repdemo-btn repdemo-btn--start" onClick={startTracking}>
              ▶ Start Sensor Tracking
            </button>
          ) : (
            <button className="repdemo-btn repdemo-btn--stop" onClick={stopTracking}>
              ⏹ Stop Tracking
            </button>
          )}

          <button className="repdemo-btn repdemo-btn--reset" onClick={reset}>
            🔄 Reset Reps
          </button>
        </div>
      </div>
    </div>
  );
}

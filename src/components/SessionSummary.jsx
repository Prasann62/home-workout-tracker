import React from 'react';
import { formatDuration, estimateCalories } from '../utils/calorieUtils.js';
import { getPersonalRecords } from '../utils/historyTracker.js';
import { getExerciseInfo } from '../data/challengePlan.js';

export default function SessionSummary({ session, onClose, onNewSession }) {
  if (!session) return null;
  const { exercise, reps, durationSeconds, isPlank, plankSeconds } = session;
  const info = getExerciseInfo(exercise) || { name: exercise, emoji: '🏋️' };
  const calories = estimateCalories(exercise, durationSeconds);
  const prs = getPersonalRecords();
  const pr = prs[exercise];
  const score = isPlank ? Math.round(plankSeconds || 0) : (reps || 0);
  const isNewPR = pr && score >= pr.record && score > 0;
  const xpEarned = session.xpEarned || (isPlank ? Math.round(score * 2) + 100 : score * 10 + 100);

  const getMessage = () => {
    if (score === 0) return 'Every start counts.';
    if (isPlank) {
      if (plankSeconds >= 60) return 'Solid hold. Core strength building.';
      return 'Good effort. Keep holding longer each time.';
    }
    if (reps >= 20) return 'Strong set. Keep this up.';
    if (reps >= 10) return 'Good work. Consistency builds strength.';
    return 'Every rep counts. Show up again tomorrow.';
  };

  return (
    <div className="summary-overlay" role="dialog" aria-modal="true">
      <div className="summary-card">
        <div className="summary-header">
          <span className="summary-emoji">{info.emoji || info.icon}</span>
          <h2 className="summary-title">Done.</h2>
          <p className="summary-exercise">{info.name}</p>
        </div>

        {isNewPR && (
          <div className="summary-pr-banner">
            🏆 New personal best!
          </div>
        )}

        {session.leveledUp && (
          <div className="summary-levelup-banner">
            🎉 LEVEL UP! You reached Level {session.newLevel}!
          </div>
        )}

        <div className="summary-stats">
          <div className="summary-stat">
            <span className="summary-stat-num">{isPlank ? formatDuration(Math.round(plankSeconds || 0)) : (reps || 0)}</span>
            <span className="summary-stat-lbl">{isPlank ? 'HOLD TIME' : 'REPS'}</span>
          </div>
          <div className="summary-stat">
            <span className="summary-stat-num">{formatDuration(durationSeconds || 0)}</span>
            <span className="summary-stat-lbl">DURATION</span>
          </div>
          <div className="summary-stat">
            <span className="summary-stat-num">+{xpEarned}</span>
            <span className="summary-stat-lbl">XP EARNED</span>
          </div>
        </div>

        <p className="summary-message">{getMessage()}</p>

        <div className="summary-actions">
          <button className="summary-btn summary-btn--primary" onClick={onNewSession} id="btn-new-session">
            New Session
          </button>
          <button className="summary-btn summary-btn--ghost" onClick={onClose} id="btn-close-summary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

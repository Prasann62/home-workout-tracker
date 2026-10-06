// ============================================================
// PERSONAL RECORDS & HISTORY MODAL — Swiss Editorial Layout
// ============================================================
import React from 'react';
import { getPersonalRecords, getLifetimeTotals, getWorkoutHistory } from '../utils/historyTracker.js';
import { ALL_EXERCISES as EXERCISES } from '../data/challengePlan.js';
import { formatDuration } from '../utils/calorieUtils.js';

export default function PersonalRecords({ isOpen, onClose }) {
  if (!isOpen) return null;

  const prs = getPersonalRecords();
  const totals = getLifetimeTotals();
  const history = getWorkoutHistory();

  return (
    <div className="swiss-modal-overlay" role="dialog" aria-modal="true" aria-label="Personal Records and History">
      <div className="swiss-modal poster-card modal-wide">
        <div className="poster-header-stripe">
          <span className="poster-tag">RECORD LOG // PERFORMANCE</span>
          <button className="swiss-icon-close" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        <h2 className="poster-headline" style={{ margin: '16px 24px 8px' }}>
          PERSONAL RECORDS
        </h2>
        <div className="poster-rule-line" />

        <div className="prs-modal-scroll">
          {/* Lifetime Summary Stats Banner */}
          <div className="swiss-stats-row">
            <div className="swiss-stat-box">
              <span className="swiss-stat-num">{totals.totalWorkouts || 0}</span>
              <span className="swiss-stat-lbl">WORKOUTS</span>
            </div>
            <div className="swiss-stat-box">
              <span className="swiss-stat-num">{totals.totalReps || 0}</span>
              <span className="swiss-stat-lbl">TOTAL REPS</span>
            </div>
            <div className="swiss-stat-box">
              <span className="swiss-stat-num">{Math.round((totals.totalSeconds || 0) / 60)}</span>
              <span className="swiss-stat-lbl">MINUTES</span>
            </div>
          </div>

          {/* Exercise Bests Grid */}
          <div className="section-subhead">ALL-TIME BESTS</div>
          <div className="prs-grid">
            {EXERCISES.map((ex) => {
              const recordObj = prs[ex.key];
              const score = recordObj?.record;
              const date = recordObj?.date;
              const isPlank = ex.key === 'plank';

              return (
                <div key={ex.key} className={`pr-card ${score ? 'has-pr' : 'no-pr'}`}>
                  <div className="pr-card-head">
                    <span className="pr-icon">{ex.emoji || ex.icon}</span>
                    <span className="pr-name">{ex.name.toUpperCase()}</span>
                  </div>
                  <div className="pr-card-val">
                    {score ? (isPlank ? formatDuration(score) : `${score} REPS`) : '—'}
                  </div>
                  {date && <div className="pr-card-date">{date}</div>}
                </div>
              );
            })}
          </div>

          {/* Workout History Stream */}
          {history.length > 0 && (
            <>
              <div className="section-subhead" style={{ marginTop: '24px' }}>RECENT SESSIONS</div>
              <div className="history-list">
                {history.slice(0, 15).map((item) => {
                  const exMeta = EXERCISES.find((e) => e.key === item.exercise);
                  return (
                    <div key={item.id} className="history-row">
                      <span className="history-ex">
                        {exMeta?.emoji || exMeta?.icon} {exMeta?.name.toUpperCase() || item.exercise}
                      </span>
                      {item.isPR && <span className="pr-tag-badge">NEW PR</span>}
                      <span className="history-score">
                        {item.isPlank ? formatDuration(item.score) : `${item.score} reps`}
                      </span>
                      <span className="history-date">{item.date}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="poster-modal-footer" style={{ padding: '16px 24px' }}>
          <button className="swiss-btn swiss-btn-primary" onClick={onClose} style={{ width: '100%' }}>
            CLOSE RECORD LOG
          </button>
        </div>
      </div>
    </div>
  );
}

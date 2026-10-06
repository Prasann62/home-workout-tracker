// ============================================================
// DAILY CHALLENGE — Fully Customizable Workout Plan Manager
//
// Two modes:
//   PLAN MODE  — build/edit days and exercises, choose from full catalog
//   TRACK MODE — select a day, mark sets done, launch AI counter
//
// Persists to localStorage automatically.
// ============================================================
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ALL_EXERCISES, AI_EXERCISES, MANUAL_EXERCISES, CATEGORIES,
  hasAICounter, getExerciseInfo,
  loadCustomPlan, saveCustomPlan, resetCustomPlan,
  newCustomPlan, starterPlan, getDayStats, uid,
} from '../data/challengePlan.js';
import Dialog from './ui/Dialog.jsx';

// ── Rest timer hook ───────────────────────────────────────────
function useRestTimer() {
  const [restSecs, setRestSecs] = useState(0);
  const timerRef = useRef(null);
  
  const startRest = useCallback((secs) => {
    clearInterval(timerRef.current);
    setRestSecs(secs);
    
    // Vibrate when rest starts if supported
    if (navigator.vibrate) navigator.vibrate(50);
    
    timerRef.current = setInterval(() => {
      setRestSecs(p => { 
        if (p <= 1) { 
          clearInterval(timerRef.current); 
          // Vibrate on end
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          return 0; 
        } 
        return p - 1; 
      });
    }, 1000);
  }, []);
  
  const addTime = (secs) => setRestSecs(p => p + secs);
  const skipRest = () => { clearInterval(timerRef.current); setRestSecs(0); };
  
  useEffect(() => () => clearInterval(timerRef.current), []);
  return { restSecs, startRest, addTime, skipRest };
}

// ── Editable text field ───────────────────────────────────────
function InlineEdit({ value, onChange, className = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (!editing) return (
    <span className={`inline-edit-display ${className}`} onClick={() => { setDraft(value); setEditing(true); }}>
      {value} <span className="inline-edit-icon">✎</span>
    </span>
  );
  return (
    <input
      className={`inline-edit-input ${className}`}
      value={draft}
      autoFocus
      onChange={e => setDraft(e.target.value)}
      onBlur={() => { onChange(draft || value); setEditing(false); }}
      onKeyDown={e => { if (e.key === 'Enter') { onChange(draft || value); setEditing(false); } }}
    />
  );
}

// ── Exercise Picker Drawer ────────────────────────────────────
function ExercisePicker({ onAdd, onClose }) {
  const [cat, setCat]       = useState('All');
  const [search, setSearch] = useState('');

  const filtered = ALL_EXERCISES.filter(ex => {
    const matchCat  = cat === 'All' || ex.category === cat;
    const matchSrch = ex.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSrch;
  });

  return (
    <div className="picker-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="picker-drawer">
        <div className="picker-header">
          <span className="picker-title">ADD EXERCISE</span>
          <button className="picker-close" onClick={onClose}>✕</button>
        </div>

        {/* Search */}
        <input
          className="picker-search"
          placeholder="Search exercises…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />

        {/* Category chips */}
        <div className="picker-cats">
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`picker-cat-chip ${cat === c ? 'is-active' : ''}`}
              onClick={() => setCat(c)}
            >{c}</button>
          ))}
        </div>

        {/* Exercise grid */}
        <div className="picker-grid">
          {filtered.map(ex => (
            <button
              key={ex.key}
              className={`picker-ex-card ${hasAICounter(ex.key) ? 'has-ai' : ''}`}
              onClick={() => onAdd(ex.key)}
            >
              <span className="picker-ex-emoji">{ex.emoji}</span>
              <span className="picker-ex-name">{ex.name}</span>
              <span className="picker-ex-cat">{ex.category}</span>
              {hasAICounter(ex.key) && <span className="picker-ai-badge">AI</span>}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="picker-empty">No exercises match your search.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function DailyChallenge({ isOpen, onClose, onStartExercise }) {
  const [plan, setPlan]         = useState(() => loadCustomPlan() || starterPlan());
  const [mode, setMode]         = useState('plan'); // 'plan' | 'track'
  const [trackingDayId, setTrackingDayId] = useState(null);
  const [showPicker, setShowPicker]       = useState(false);
  const [pickerDayId, setPickerDayId]     = useState(null);
  const [dialogState, setDialogState]     = useState({ isOpen: false });
  const { restSecs, startRest, addTime, skipRest } = useRestTimer();

  // Persist on every change
  useEffect(() => { saveCustomPlan(plan); }, [plan]);

  if (!isOpen) return null;

  // ── Plan mutations ──────────────────────────────────────────
  const mutatePlan = (fn) => setPlan(prev => { const next = structuredClone(prev); fn(next); return next; });

  const renamePlan  = (name) => mutatePlan(p => { p.planName = name; });
  const renameDay   = (dayId, name) => mutatePlan(p => { p.days.find(d => d.id === dayId).name = name; });

  const addDay = () => mutatePlan(p => {
    const id = uid();
    p.days.push({ id, name: `Day ${p.days.length + 1}`, exercises: [] });
    p.progress[id] = {};
  });

  const deleteDay = (dayId) => mutatePlan(p => {
    p.days = p.days.filter(d => d.id !== dayId);
    delete p.progress[dayId];
    p.completedDays = p.completedDays.filter(id => id !== dayId);
  });

  const addExercise = (dayId, exKey) => mutatePlan(p => {
    const day = p.days.find(d => d.id === dayId);
    const exId = uid();
    day.exercises.push({ id: exId, key: exKey, sets: 3, reps: 12, rest: 60 });
    if (!p.progress[dayId]) p.progress[dayId] = {};
    p.progress[dayId][exId] = 0;
  });

  const removeExercise = (dayId, exId) => mutatePlan(p => {
    const day = p.days.find(d => d.id === dayId);
    day.exercises = day.exercises.filter(e => e.id !== exId);
    delete p.progress[dayId]?.[exId];
  });

  const updateExField = (dayId, exId, field, value) => mutatePlan(p => {
    const ex = p.days.find(d => d.id === dayId)?.exercises.find(e => e.id === exId);
    if (ex) ex[field] = value;
  });

  const moveExercise = (dayId, exId, dir) => mutatePlan(p => {
    const exs = p.days.find(d => d.id === dayId).exercises;
    const idx = exs.findIndex(e => e.id === exId);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= exs.length) return;
    [exs[idx], exs[swapIdx]] = [exs[swapIdx], exs[idx]];
  });

  // ── Tracking mutations ──────────────────────────────────────
  const completeSet = (dayId, exId, totalSets, restSecs) => {
    mutatePlan(p => {
      if (!p.progress[dayId]) p.progress[dayId] = {};
      p.progress[dayId][exId] = Math.min((p.progress[dayId][exId] || 0) + 1, totalSets);
      // Check day complete
      const day = p.days.find(d => d.id === dayId);
      const allDone = day.exercises.every(e => (p.progress[dayId][e.id] || 0) >= e.sets);
      if (allDone && !p.completedDays.includes(dayId)) p.completedDays.push(dayId);
    });
    if (restSecs > 0) startRest(restSecs);
  };

  const undoSet = (dayId, exId) => mutatePlan(p => {
    if (!p.progress[dayId]) return;
    p.progress[dayId][exId] = Math.max((p.progress[dayId][exId] || 0) - 1, 0);
    p.completedDays = p.completedDays.filter(id => {
      const day = p.days.find(d => d.id === id);
      return day?.exercises.every(e => (p.progress[id][e.id] || 0) >= e.sets);
    });
  });

  const resetDayProgress = (dayId) => mutatePlan(p => {
    if (p.progress[dayId]) {
      Object.keys(p.progress[dayId]).forEach(k => { p.progress[dayId][k] = 0; });
    }
    p.completedDays = p.completedDays.filter(id => id !== dayId);
  });

  // ── Current tracking day ────────────────────────────────────
  const trackDay = trackingDayId ? plan.days.find(d => d.id === trackingDayId) : null;
  const trackStats = trackingDayId ? getDayStats(plan, trackingDayId) : null;
  const trackPct   = trackStats ? Math.round((trackStats.done / Math.max(trackStats.total, 1)) * 100) : 0;
  const isDayDone  = trackingDayId ? plan.completedDays.includes(trackingDayId) : false;

  // ── RENDER ──────────────────────────────────────────────────
  return (
    <div className="challenge-overlay" role="dialog" aria-modal="true">
      <div className="challenge-modal">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="challenge-header">
          <div className="challenge-header-left">
            <span className="challenge-eyebrow">WORKOUT PLANNER</span>
            <InlineEdit
              value={plan.planName}
              onChange={renamePlan}
              className="challenge-plan-title"
            />
          </div>
          <div className="challenge-header-right">
            <div className="challenge-mode-toggle">
              <button
                className={`mode-btn ${mode === 'plan' ? 'is-active' : ''}`}
                onClick={() => setMode('plan')}
                id="challenge-mode-plan"
              >✎ PLAN</button>
              <button
                className={`mode-btn ${mode === 'track' ? 'is-active' : ''}`}
                onClick={() => setMode('track')}
                id="challenge-mode-track"
              >▶ TRACK</button>
            </div>
            <button className="challenge-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            PLAN MODE — Build & edit your days
        ════════════════════════════════════════════════ */}
        {mode === 'plan' && (
          <div className="challenge-body">
            {plan.days.map((day, dayIdx) => (
              <div key={day.id} className="plan-day-block">
                {/* Day header */}
                <div className="plan-day-header">
                  <span className="plan-day-num">DAY {dayIdx + 1}</span>
                  <InlineEdit
                    value={day.name}
                    onChange={name => renameDay(day.id, name)}
                    className="plan-day-name"
                  />
                  <div className="plan-day-actions">
                    <button
                      className="plan-action-btn plan-action-btn--danger"
                      disabled={plan.days.length <= 1}
                      onClick={() => {
                        if (plan.days.length <= 1) return;
                        setDialogState({
                          isOpen: true,
                          title: 'Delete Day?',
                          message: `Are you sure you want to delete "${day.name}"?`,
                          confirmText: 'Delete',
                          danger: true,
                          onConfirm: () => {
                            deleteDay(day.id);
                            setDialogState({ isOpen: false });
                          },
                          onCancel: () => setDialogState({ isOpen: false })
                        });
                      }}
                      title={plan.days.length <= 1 ? 'Cannot delete the last day' : 'Delete day'}
                    >✕</button>
                  </div>
                </div>

                {/* Exercise rows */}
                <div className="plan-ex-list">
                  {day.exercises.length === 0 && (
                    <div className="plan-ex-empty">No exercises yet — tap + ADD below</div>
                  )}
                  {day.exercises.map((ex, exIdx) => {
                    const info = getExerciseInfo(ex.key);
                    return (
                      <div key={ex.id} className="plan-ex-row">
                        {/* Reorder */}
                        <div className="plan-ex-reorder">
                          <button onClick={() => moveExercise(day.id, ex.id, -1)} disabled={exIdx === 0}>▲</button>
                          <button onClick={() => moveExercise(day.id, ex.id, 1)}  disabled={exIdx === day.exercises.length - 1}>▼</button>
                        </div>

                        {/* Name + AI badge */}
                        <div className="plan-ex-identity">
                          <span className="plan-ex-emoji">{info?.emoji}</span>
                          <span className="plan-ex-name">{info?.name || ex.key}</span>
                          {hasAICounter(ex.key) && <span className="plan-ai-badge">AI</span>}
                        </div>

                        {/* Sets / Reps / Rest editors */}
                        <div className="plan-ex-params">
                          <label className="param-label">
                            SETS
                            <input
                              type="number" min="1" max="10"
                              value={ex.sets}
                              onChange={e => updateExField(day.id, ex.id, 'sets', parseInt(e.target.value) || 1)}
                              className="param-input"
                            />
                          </label>
                          <label className="param-label">
                            REPS
                            <input
                              type="text"
                              value={ex.reps}
                              onChange={e => updateExField(day.id, ex.id, 'reps', e.target.value)}
                              className="param-input param-input--wide"
                              placeholder="12"
                            />
                          </label>
                          <label className="param-label">
                            REST
                            <select
                              value={ex.rest}
                              onChange={e => updateExField(day.id, ex.id, 'rest', parseInt(e.target.value))}
                              className="param-input param-input--select"
                            >
                              {[15,30,45,60,90,120].map(s => (
                                <option key={s} value={s}>{s}s</option>
                              ))}
                            </select>
                          </label>
                        </div>

                        {/* Delete exercise */}
                        <button
                          className="plan-ex-delete"
                          onClick={() => removeExercise(day.id, ex.id)}
                          title="Remove exercise"
                        >✕</button>
                      </div>
                    );
                  })}
                </div>

                {/* Add exercise to this day */}
                <button
                  className="plan-add-ex-btn"
                  onClick={() => { setPickerDayId(day.id); setShowPicker(true); }}
                  id={`plan-add-ex-${day.id}`}
                >
                  + ADD EXERCISE
                </button>
              </div>
            ))}

            {/* Add day */}
            <button className="plan-add-day-btn" onClick={addDay} id="plan-add-day-btn">
              + ADD DAY
            </button>

            {/* Reset */}
            <div className="plan-footer">
              <button className="plan-reset-btn" onClick={() => {
                setDialogState({
                  isOpen: true,
                  title: 'Reset Plan?',
                  message: 'Reset to default 4-day plan? This will clear your current custom plan.',
                  confirmText: 'Reset',
                  danger: true,
                  onConfirm: () => {
                    const fresh = starterPlan();
                    setPlan(fresh);
                    saveCustomPlan(fresh);
                    setDialogState({ isOpen: false });
                  },
                  onCancel: () => setDialogState({ isOpen: false })
                });
              }}>↺ Reset to Default Plan</button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TRACK MODE — Select a day and mark sets
        ════════════════════════════════════════════════ */}
        {mode === 'track' && (
          <div className="challenge-body">
            {/* Day selector */}
            <div className="track-day-selector">
              {plan.days.map((day, idx) => {
                const stats = getDayStats(plan, day.id);
                const done  = plan.completedDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    className={`track-day-chip ${trackingDayId === day.id ? 'is-active' : ''} ${done ? 'is-done' : ''}`}
                    onClick={() => setTrackingDayId(day.id)}
                    id={`track-day-${day.id}`}
                  >
                    <span className="track-chip-icon">{done ? '✓' : `D${idx + 1}`}</span>
                    <span className="track-chip-name">{day.name}</span>
                    {stats.total > 0 && (
                      <span className="track-chip-prog">{stats.done}/{stats.total}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* No day selected */}
            {!trackDay && (
              <div className="track-empty">
                <div className="track-empty-icon">👆</div>
                <div className="track-empty-text">Select a day above to start tracking</div>
              </div>
            )}

            {/* Tracking a day */}
            {trackDay && (
              <>
                {/* Progress bar */}
                <div className="challenge-progress-wrap">
                  <div className="challenge-progress-meta">
                    <span className="cprog-label">
                      {isDayDone ? '🏆 DAY COMPLETE!' : `${trackStats.done} / ${trackStats.total} SETS`}
                    </span>
                    <div className="cprog-right">
                      <span className="cprog-pct">{trackPct}%</span>
                      <button className="cprog-reset-btn" onClick={() => resetDayProgress(trackDay.id)} title="Reset day">↺</button>
                    </div>
                  </div>
                  <div className="challenge-progress-track">
                    <div className={`challenge-progress-fill ${isDayDone ? 'is-complete' : ''}`}
                      style={{ width: `${trackPct}%` }} />
                  </div>
                </div>

                {/* Smart Rest Timer Overlay */}
                {restSecs > 0 && (
                  <div className="smart-rest-overlay">
                    <span className="smart-rest-title">REST & RECOVER</span>
                    <div className="smart-rest-clock">
                      {Math.floor(restSecs / 60)}:{(restSecs % 60).toString().padStart(2, '0')}
                    </div>
                    
                    <div className="smart-rest-actions">
                      <button className="smart-rest-btn smart-rest-btn--add" onClick={() => addTime(30)}>
                        +30s
                      </button>
                      <button className="smart-rest-btn smart-rest-btn--skip" onClick={skipRest}>
                        SKIP
                      </button>
                    </div>
                  </div>
                )}

                {/* No exercises in day */}
                {trackDay.exercises.length === 0 && (
                  <div className="track-empty">
                    <div className="track-empty-text">
                      This day has no exercises yet.
                      <br />Switch to <strong>PLAN</strong> mode to add some.
                    </div>
                  </div>
                )}

                {/* Exercise cards — new clear design */}
                <div className="track-ex-list">
                  {trackDay.exercises.map((ex, idx) => {
                    const info     = getExerciseInfo(ex.key);
                    const done     = plan.progress[trackDay.id]?.[ex.id] || 0;
                    const isExDone = done >= ex.sets;
                    const canAI    = hasAICounter(ex.key);

                    return (
                      <div
                        key={ex.id}
                        className={`track-ex-card ${isExDone ? 'track-ex-card--done' : ''}`}
                        id={`track-ex-${ex.id}`}
                      >
                        {/* Left: number + name */}
                        <div className="track-ex-identity">
                          <div className={`track-ex-num ${isExDone ? 'is-done' : ''}`}>
                            {isExDone ? '✓' : idx + 1}
                          </div>
                          <div className="track-ex-info">
                            <div className="track-ex-name-row">
                              <span className="track-ex-emoji">{info?.emoji}</span>
                              <span className="track-ex-name">{info?.name || ex.key}</span>
                              {canAI && <span className="track-ai-badge">AI</span>}
                            </div>
                            <span className="track-ex-target">
                              {ex.sets} sets × {ex.reps} reps
                              <span className="track-ex-rest"> · {ex.rest}s rest</span>
                            </span>
                          </div>
                        </div>

                        {/* Center: large set circles */}
                        <div className="track-set-circles">
                          {Array.from({ length: ex.sets }).map((_, i) => (
                            <div
                              key={i}
                              className={`track-set-circle ${
                                i < done ? 'is-done' : i === done ? 'is-next' : ''
                              }`}
                            >
                              {i < done ? '✓' : i + 1}
                            </div>
                          ))}
                        </div>

                        {/* Right: action buttons */}
                        <div className="track-ex-actions">
                          {!isExDone ? (
                            <>
                              {canAI && (
                                <button
                                  className="track-btn track-btn--ai"
                                  onClick={() => { onStartExercise(ex.key); onClose(); }}
                                  id={`track-start-${ex.id}`}
                                  title="Launch AI camera counter"
                                >
                                  ▶ AI
                                </button>
                              )}
                              <button
                                className="track-btn track-btn--set"
                                onClick={() => completeSet(trackDay.id, ex.id, ex.sets, ex.rest)}
                                id={`track-set-${ex.id}`}
                              >
                                ＋ SET
                              </button>
                              {done > 0 && (
                                <button
                                  className="track-btn track-btn--undo"
                                  onClick={() => undoSet(trackDay.id, ex.id)}
                                  title="Undo last set"
                                >
                                  ↩
                                </button>
                              )}
                            </>
                          ) : (
                            <div className="track-done-badge">
                              <span className="track-done-check">✓</span>
                              <span className="track-done-text">DONE</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Exercise picker drawer */}
      {showPicker && pickerDayId && (
        <ExercisePicker
          onAdd={(key) => {
            addExercise(pickerDayId, key);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
      
      {dialogState.isOpen && (
        <Dialog 
          isOpen={dialogState.isOpen}
          title={dialogState.title}
          message={dialogState.message}
          confirmText={dialogState.confirmText}
          danger={dialogState.danger}
          onConfirm={dialogState.onConfirm}
          onCancel={dialogState.onCancel}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { getExerciseInfo } from '../data/challengePlan.js';
import { Storage } from '../utils/storage.js';

export default function WorkoutHistory() {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    try {
      const data = Storage.getWorkoutHistory() || [];
      // Sort descending (newest first)
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setHistory(data);
    } catch(e) {}
  }, []);

  const filteredHistory = history.filter(h => {
    const exName = h.exercise || '';
    return exName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Group by date
  const grouped = filteredHistory.reduce((acc, curr) => {
    const d = new Date(curr.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    if (!acc[d]) acc[d] = [];
    acc[d].push(curr);
    return acc;
  }, {});

  const totalSessions = history.length;
  const totalReps = history.reduce((sum, h) => sum + (h.isPlank ? 0 : (h.reps || 0)), 0);
  const totalCalories = history.reduce((sum, h) => sum + (h.caloriesEstimate || 0), 0);

  return (
    <div className="hist-container">
      <header className="hist-header">
        <h2 className="hist-title">HISTORY</h2>
        <input 
          type="text" 
          placeholder="🔍 Search exercises..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="hist-search"
        />
      </header>

      <div className="hist-stats-row">
        <div className="hist-stat">
          <span className="hist-stat-val">{totalSessions}</span>
          <span className="hist-stat-lbl">Sessions</span>
        </div>
        <div className="hist-stat">
          <span className="hist-stat-val">{totalReps}</span>
          <span className="hist-stat-lbl">Total Reps</span>
        </div>
        <div className="hist-stat">
          <span className="hist-stat-val">{Math.round(totalCalories)}</span>
          <span className="hist-stat-lbl">Calories</span>
        </div>
      </div>

      <div className="hist-list">
        {Object.keys(grouped).length > 0 ? (
          Object.keys(grouped).map(dateStr => (
            <div key={dateStr} className="hist-group">
              <h3 className="hist-date-header">{dateStr}</h3>
              {grouped[dateStr].map((session, i) => {
                const info = getExerciseInfo(session.exercise) || { name: session.exercise, emoji: '🏋️' };
                const mins = Math.floor((session.durationSeconds || 0) / 60);
                const secs = String((session.durationSeconds || 0) % 60).padStart(2, '0');
                
                return (
                  <div key={i} className="hist-card">
                    <div className="hist-card-top">
                      <span className="hist-emoji">{info.emoji}</span>
                      <span className="hist-ex-name">{info.name}</span>
                      {session.isPersonalBest && <span className="hist-pr-badge">🔥 PR</span>}
                    </div>
                    <div className="hist-card-bottom">
                      <span className="hist-detail">{session.isPlank ? `${session.plankSeconds}s` : `${session.reps} reps`}</span>
                      <span className="hist-sep">·</span>
                      <span className="hist-detail">{mins}:{secs}</span>
                      <span className="hist-sep">·</span>
                      <span className="hist-detail">{Math.round(session.caloriesEstimate || 0)} cal</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <p className="hist-empty">
            {searchTerm ? `No workouts match "${searchTerm}".` : 'No workouts yet. Start your first session!'}
          </p>
        )}
      </div>
    </div>
  );
}

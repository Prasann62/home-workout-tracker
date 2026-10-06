// ============================================================
// PROGRESS TAB — Minimal Segmented Navigation
// ============================================================
import React, { useState } from 'react';
import ActivityCalendar from './ActivityCalendar.jsx';
import BodyStats from './BodyStats.jsx';
import WorkoutHistory from './WorkoutHistory.jsx';

export default function ProgressTab() {
  const [subTab, setSubTab] = useState('calendar');

  return (
    <div className="ptab-container">
      <header className="ptab-header">
        <h1 className="ptab-title">Progress</h1>
      </header>

      <div className="ptab-switcher">
        <button 
          className={`ptab-btn ${subTab === 'calendar' ? 'is-active' : ''}`}
          onClick={() => setSubTab('calendar')}
        >
          Calendar
        </button>
        <button 
          className={`ptab-btn ${subTab === 'body' ? 'is-active' : ''}`}
          onClick={() => setSubTab('body')}
        >
          Body Stats
        </button>
        <button 
          className={`ptab-btn ${subTab === 'history' ? 'is-active' : ''}`}
          onClick={() => setSubTab('history')}
        >
          History
        </button>
      </div>

      <div className="ptab-content">
        {subTab === 'calendar' && <ActivityCalendar />}
        {subTab === 'body' && <BodyStats />}
        {subTab === 'history' && <WorkoutHistory />}
      </div>
    </div>
  );
}

// ============================================================
// HOME DASHBOARD — Clean Minimal AI Coach Landing
// ============================================================
import React, { useState, useEffect } from 'react';
import { getOverallScore } from '../utils/performanceAI.js';
import { loadCustomPlan, getExerciseInfo } from '../data/challengePlan.js';
import { Storage } from '../utils/storage.js';
import { getGamificationData, getLevelInfo } from '../utils/gamificationEngine.js';
import DailyQuestsModal from './DailyQuestsModal.jsx';

export default function HomeDashboard({ onStartTrain, onOpenChallenge, onOpenFight, onOpenPrograms, onTabChange }) {
  const [greeting, setGreeting] = useState('Good Morning');
  const [streak, setStreak] = useState(0);
  const [todayPlan, setTodayPlan] = useState(null);
  const [lastSession, setLastSession] = useState(null);
  const [gamification, setGamification] = useState(getGamificationData());
  const [showQuestsModal, setShowQuestsModal] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Good Morning');
    else if (hour >= 12 && hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    const score = getOverallScore();
    setStreak(score?.streak || 0);

    const plan = loadCustomPlan();
    if (plan && plan.days && plan.days.length > 0) {
      setTodayPlan(plan.days[0]);
    }

    try {
      const history = Storage.getWorkoutHistory() || [];
      if (history.length > 0) {
        setLastSession(history[0]);
      }
    } catch(e) {}
  }, []);

  const levelInfo = getLevelInfo(gamification?.totalXP || 0);

  return (
    <div className="hd-container">
      {/* Header */}
      <header className="hd-header">
        <div className="hd-header-left">
          <span className="hd-brand">ILA COACH</span>
          <h1 className="hd-greeting">{greeting}</h1>
        </div>
        <button 
          className="hd-settings-btn" 
          onClick={() => onTabChange('settings')}
          aria-label="Settings"
        >
          ⚙️
        </button>
      </header>

      {/* Gamification Level & XP Card */}
      <div 
        className="hd-level-card" 
        onClick={() => setShowQuestsModal(true)}
        role="button"
        tabIndex={0}
      >
        <div className="hd-level-left">
          <span className="hd-level-rank-badge" style={{ color: levelInfo.rankColor }}>
            {levelInfo.rankEmoji} Level {levelInfo.level}
          </span>
          <span className="hd-level-rank-name">{levelInfo.rankName}</span>
        </div>
        <div className="hd-level-right">
          <span className="hd-xp-text">{levelInfo.currentLevelXP} / {levelInfo.maxLevelXP} XP</span>
          <div className="hd-mini-xp-bar">
            <div className="hd-mini-xp-fill" style={{ width: `${levelInfo.pct}%`, background: levelInfo.rankColor }} />
          </div>
        </div>
      </div>

      {/* Streak Card */}
      <div className="hd-streak-card">
        <div className="hd-streak-icon">🔥</div>
        <div className="hd-streak-info">
          <h2 className="hd-streak-num">{streak} Day Streak</h2>
          <div className="hd-progress-bar">
            <div className="hd-progress-fill" style={{ width: `${Math.min(100, streak * 10)}%` }} />
          </div>
        </div>
      </div>

      {/* Today's Workout Card */}
      <div className="hd-card hd-today-card">
        <div className="hd-card-header">
          <h3>Today's Plan</h3>
        </div>
        {todayPlan ? (
          <div className="hd-plan-details">
            <p className="hd-plan-name">{todayPlan.name}</p>
            <ul className="hd-exercise-list">
              {(todayPlan.exercises || []).slice(0, 3).map((ex, i) => {
                const info = getExerciseInfo(ex.key) || { name: ex.key, emoji: '🏋️', icon: '🏋️' };
                return (
                  <li key={i}>
                    <span>{info.icon || info.emoji} {info.name}</span>
                    <span className="hd-ex-sets">{ex.sets} × {ex.reps}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="hd-empty-text">Select an exercise to start your workout.</p>
        )}
      </div>

      {/* Start Button */}
      <button className="hd-big-start-btn" onClick={onStartTrain}>
        Start Workout ▶
      </button>

      {/* Quick Action Cards Grid */}
      <div className="hd-quick-actions">
        <button className="hd-action-btn hd-action-quests" onClick={() => setShowQuestsModal(true)}>
          👑 Daily Quests
        </button>
        <button className="hd-action-btn" onClick={onOpenChallenge}>
          🎯 Challenge
        </button>
        <button className="hd-action-btn hd-action-fight" onClick={onOpenFight}>
          🥊 Fight Sports
        </button>
        <button className="hd-action-btn" onClick={onOpenPrograms}>
          📋 Programs
        </button>
      </div>

      {/* Last Session Brief */}
      {lastSession && (
        <div className="hd-card hd-last-session">
          <h3>Recent Session</h3>
          <div className="hd-session-details">
            <p>
              <strong>{lastSession.exercise}</strong>
              {' · '}
              {lastSession.isPlank ? `${lastSession.plankSeconds || 0}s hold` : `${lastSession.reps || 0} reps`}
              {' · '}
              {Math.floor((lastSession.durationSeconds || 0) / 60)}m {(lastSession.durationSeconds || 0) % 60}s
            </p>
          </div>
        </div>
      )}

      {showQuestsModal && (
        <DailyQuestsModal 
          onClose={() => {
            setShowQuestsModal(false);
            setGamification(getGamificationData());
          }} 
        />
      )}
    </div>
  );
}

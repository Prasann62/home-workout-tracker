// ============================================================
// PERSONAL TRAINER MODE — Guided workout, auto-advances
//
// Flow for each exercise:
//   1. Form demo (10s or "skip") → countdown (5s) →
//   2. Live camera session → user taps DONE or timer auto-stops →
//   3. Rest countdown → next exercise
//
// Between all exercises done → full summary + AI coach review
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FORM_DEMOS } from '../data/formDemos.js';
import { analyzeExercise, recordSessionResult, getOverallScore } from '../utils/performanceAI.js';
import { getExerciseInfo } from '../data/challengePlan.js';

// ── Tiny helpers ─────────────────────────────────────────────
function getExInfo(key) {
  return getExerciseInfo(key) || { name: key, emoji: '🏋️' };
}
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// ── Phase types ──────────────────────────────────────────────
// 'intro' | 'countdown' | 'session' | 'rest' | 'summary'

export default function PersonalTrainer({
  isOpen,
  onClose,
  plan,            // the user's current DailyChallenge plan
  dayId,           // which day to train
  onStartExercise, // (exerciseId) → launch camera session in App
  currentReps,     // live rep count from App while session is active
  sessionState,    // 'idle' | 'active' from App
  onStopSession,   // call to stop the camera session
}) {
  const [phase, setPhase]         = useState('intro');   // current phase
  const [exIdx, setExIdx]         = useState(0);         // which exercise we're on
  const [countdown, setCountdown] = useState(5);         // countdown before exercise
  const [restSecs, setRestSecs]   = useState(0);         // rest timer
  const [sessionSecs, setSessionSecs] = useState(0);     // session elapsed
  const [repLog, setRepLog]       = useState({});        // { exId: repsAchieved }
  const [aiReviews, setAiReviews] = useState([]);        // AI coaching results

  const timerRef = useRef(null);
  const sessionTimerRef = useRef(null);

  const day = plan?.days?.find(d => d.id === dayId);
  const exercises = day?.exercises || [];
  const exercise  = exercises[exIdx];
  const exInfo    = exercise ? getExInfo(exercise.key) : null;
  const demo      = exercise ? FORM_DEMOS[exercise.key] : null;
  const totalExes = exercises.length;

  // ── Clear all timers ─────────────────────────────────────────
  const clearAll = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(sessionTimerRef.current);
  }, []);

  useEffect(() => { if (!isOpen) { clearAll(); setPhase('intro'); setExIdx(0); } }, [isOpen, clearAll]);

  // ── Countdown phase ──────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'countdown') { clearInterval(timerRef.current); return; }
    setCountdown(5);
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          // Launch camera session
          onStartExercise(exercise?.key);
          setPhase('session');
          setSessionSecs(0);
          return 5;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, exercise, onStartExercise]);

  // ── Session elapsed timer ────────────────────────────────────
  useEffect(() => {
    if (phase !== 'session') { clearInterval(sessionTimerRef.current); return; }
    sessionTimerRef.current = setInterval(() => setSessionSecs(s => s + 1), 1000);
    return () => clearInterval(sessionTimerRef.current);
  }, [phase]);

  // ── Rest phase ───────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'rest') { clearInterval(timerRef.current); return; }
    const secs = exercise?.rest || 60;
    setRestSecs(secs);
    timerRef.current = setInterval(() => {
      setRestSecs(r => {
        if (r <= 1) {
          clearInterval(timerRef.current);
          advanceExercise();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, exIdx]);

  // ── Advance to next exercise or summary ───────────────────────
  const advanceExercise = useCallback(() => {
    const next = exIdx + 1;
    if (next >= totalExes) {
      // All done → generate AI reviews
      const reviews = exercises.map(ex => {
        const reps = repLog[ex.key] || 0;
        recordSessionResult({
          exerciseId: ex.key,
          targetReps: typeof ex.reps === 'number' ? ex.reps : parseInt(ex.reps) || 10,
          actualReps: reps,
          sets: ex.sets,
        });
        return {
          name: getExInfo(ex.key).name,
          emoji: getExInfo(ex.key).emoji,
          target: ex.reps,
          achieved: reps,
          analysis: analyzeExercise(ex.key, typeof ex.reps === 'number' ? ex.reps : parseInt(ex.reps) || 10),
        };
      });
      setAiReviews(reviews);
      setPhase('summary');
    } else {
      setExIdx(next);
      setPhase('intro');
    }
  }, [exIdx, totalExes, exercises, repLog]);

  // ── Done with current set ────────────────────────────────────
  const handleSetDone = useCallback(() => {
    onStopSession?.();
    setRepLog(prev => ({ ...prev, [exercise?.key]: currentReps }));
    setPhase('rest');
  }, [exercise, currentReps, onStopSession]);

  if (!isOpen || !day) return null;

  // ============================================================
  // ── RENDER: SUMMARY ─────────────────────────────────────────
  // ============================================================
  if (phase === 'summary') {
    const score = getOverallScore();
    return (
      <div className="pt-overlay">
        <div className="pt-modal">
          <div className="pt-summary-header">
            <span className="pt-summary-trophy">🏆</span>
            <h2 className="pt-summary-title">WORKOUT DONE</h2>
            <p className="pt-summary-day">{day.name}</p>
          </div>

          {score && (
            <div className="pt-score-banner">
              <div className="pt-score-item">
                <div className="pt-score-val">{score.avgPct}%</div>
                <div className="pt-score-label">AVG COMPLETION</div>
              </div>
              <div className="pt-score-item">
                <div className="pt-score-val">{score.streak}</div>
                <div className="pt-score-label">DAY STREAK 🔥</div>
              </div>
              <div className="pt-score-item">
                <div className="pt-score-val">{score.level}</div>
                <div className="pt-score-label">LEVEL</div>
              </div>
            </div>
          )}

          <div className="pt-summary-section-label">🤖 AI COACH REVIEW</div>
          <div className="pt-reviews">
            {aiReviews.map((r, i) => (
              <div key={i} className={`pt-review-card pt-review--${r.analysis.verdict}`}>
                <div className="pt-review-top">
                  <span className="pt-review-emoji">{r.emoji}</span>
                  <span className="pt-review-name">{r.name}</span>
                  <span className="pt-review-score">{r.achieved}/{r.target} reps</span>
                </div>
                <div className="pt-review-verdict">
                  {r.analysis.verdict === 'increase' && '↑ LEVEL UP'}
                  {r.analysis.verdict === 'hold'     && '✓ HOLD'}
                  {r.analysis.verdict === 'decrease' && '↓ ADJUST'}
                  {r.analysis.verdict === 'new'      && '★ BUILDING'}
                </div>
                <div className="pt-review-msg">{r.analysis.msg}</div>
              </div>
            ))}
          </div>

          <div className="pt-summary-actions">
            <button className="pt-btn pt-btn--primary" onClick={onClose}>DONE</button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // ── RENDER: REST ─────────────────────────────────────────────
  // ============================================================
  if (phase === 'rest') {
    const next = exercises[exIdx + 1];
    const nextInfo = next ? getExInfo(next.key) : null;
    const restTotal = exercise?.rest || 60;
    const pct = ((restTotal - restSecs) / restTotal) * 100;

    return (
      <div className="pt-overlay">
        <div className="pt-modal pt-modal--rest">
          <div className="pt-rest-header">REST</div>
          <div className="pt-rest-timer">{fmt(restSecs)}</div>

          <svg className="pt-rest-ring" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="8"/>
            <circle cx="60" cy="60" r="50" fill="none" stroke="#00B37E" strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
              strokeLinecap="round" transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>

          {nextInfo && (
            <div className="pt-rest-next">
              <div className="pt-rest-next-label">NEXT UP</div>
              <div className="pt-rest-next-ex">
                <span>{nextInfo.emoji}</span>
                <span>{nextInfo.name}</span>
              </div>
            </div>
          )}

          <div className="pt-rest-tip">💡 Breathe slowly — in through nose, out through mouth</div>

          <button className="pt-btn pt-btn--secondary" onClick={() => { clearAll(); advanceExercise(); }}>
            SKIP REST →
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // ── RENDER: COUNTDOWN ────────────────────────────────────────
  // ============================================================
  if (phase === 'countdown') {
    return (
      <div className="pt-overlay pt-overlay--countdown">
        <div className="pt-countdown-modal">
          <div className="pt-countdown-ex">{exInfo?.emoji} {exInfo?.name.toUpperCase()}</div>
          <div className="pt-countdown-num" key={countdown}>{countdown}</div>
          <div className="pt-countdown-label">GET READY</div>
        </div>
      </div>
    );
  }

  // ============================================================
  // ── RENDER: SESSION (camera running) ─────────────────────────
  // ============================================================
  if (phase === 'session') {
    return (
      <div className="pt-session-bar">
        <div className="pt-session-info">
          <span className="pt-session-ex">{exInfo?.emoji} {exInfo?.name}</span>
          <span className="pt-session-target">Target: {exercise?.reps} reps × {exercise?.sets} sets</span>
        </div>
        <div className="pt-session-reps">
          <span className="pt-session-rep-num">{currentReps}</span>
          <span className="pt-session-rep-label">REPS</span>
        </div>
        <div className="pt-session-time">{fmt(sessionSecs)}</div>
        <button className="pt-session-done-btn" onClick={handleSetDone}>
          ✓ SET DONE
        </button>
      </div>
    );
  }

  // ============================================================
  // ── RENDER: INTRO (form demo per exercise) ───────────────────
  // ============================================================
  return (
    <div className="pt-overlay">
      <div className="pt-modal">
        {/* Progress header */}
        <div className="pt-header">
          <div className="pt-header-left">
            <span className="pt-eyebrow">ILA PERSONAL TRAINER</span>
            <span className="pt-day-name">{day.name}</span>
          </div>
          <button className="pt-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Exercise progress dots */}
        <div className="pt-progress-dots">
          {exercises.map((_, i) => (
            <div key={i} className={`pt-ex-dot ${i < exIdx ? 'is-done' : i === exIdx ? 'is-current' : ''}`} />
          ))}
        </div>
        <div className="pt-progress-label">{exIdx + 1} of {totalExes} exercises</div>

        {/* Current exercise */}
        <div className="pt-intro-exercise">
          <div className="pt-intro-emoji">{exInfo?.emoji}</div>
          <div className="pt-intro-name">{exInfo?.name?.toUpperCase()}</div>
          <div className="pt-intro-target">{exercise?.sets} sets × {exercise?.reps} reps</div>
        </div>

        {/* YouTube mini-embed if available */}
        {demo?.videoId && (
          <div className="pt-intro-video-wrap">
            <iframe
              className="pt-intro-iframe"
              src={`https://www.youtube-nocookie.com/embed/${demo.videoId}?rel=0&modestbranding=1`}
              title={`${exInfo?.name} tutorial`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* Key cues */}
        {demo?.keyPoints && (
          <div className="pt-intro-cues">
            {demo.keyPoints.slice(0, 3).map((cue, i) => (
              <div key={i} className="pt-intro-cue">
                <span className="pt-cue-num">{i + 1}</span>
                <span className="pt-cue-text">{cue}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="pt-intro-actions">
          <button className="pt-btn pt-btn--primary" onClick={() => setPhase('countdown')} id={`pt-start-ex-${exIdx}`}>
            START EXERCISE →
          </button>
          <button className="pt-btn pt-btn--ghost" onClick={onClose}>EXIT TRAINER</button>
        </div>
      </div>
    </div>
  );
}

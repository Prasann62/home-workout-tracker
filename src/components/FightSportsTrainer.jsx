// ============================================================
// FIGHT SPORTS TRAINER — Complete Combat AI Suite
// Real-time AI pose strike tracking, Guard checking, PPM gauge, Audio impact
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FIGHT_WORKOUTS, FIGHT_CATEGORIES } from '../data/fightSports.js';
import CameraView from './CameraView.jsx';

function ringBell(ctx, times = 1) {
  if (!ctx) return;
  for (let i = 0; i < times; i++) {
    setTimeout(() => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      } catch {}
    }, i * 400);
  }
}

function playImpactSound(ctx) {
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch {}
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function FightSportsTrainer({ isOpen, onClose }) {
  const [phase, setPhase] = useState('select');
  const [workout, setWorkout] = useState(null);
  const [category, setCategory] = useState('All');
  const [currentRound, setCurrentRound] = useState(1);
  const [isWork, setIsWork] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [comboIdx, setComboIdx] = useState(0);
  const [cueIdx, setCueIdx] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [ppm, setPpm] = useState(0);
  const [guardRating, setGuardRating] = useState(100);
  const [guardWarning, setGuardWarning] = useState(false);
  const [lastStrikeType, setLastStrikeType] = useState('STRIKE');

  const timerRef = useRef(null);
  const comboRef = useRef(null);
  const audioCtx = useRef(null);

  // Stats tracking refs
  const strikeTimestampsRef = useRef([]);
  const guardSamplesRef = useRef({ good: 0, total: 0 });
  const lastPunchRef = useRef(0);
  const prevWristDistRef = useRef(0);
  const lowGuardTimeRef = useRef(0);

  const getCtx = useCallback(() => {
    if (!audioCtx.current) {
      try { audioCtx.current = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    }
    return audioCtx.current;
  }, []);

  const startWorkout = useCallback((w) => {
    setWorkout(w);
    setCurrentRound(1);
    setIsWork(true);
    setSecondsLeft(w.workSecs);
    setComboIdx(0);
    setCueIdx(0);
    setStrikes(0);
    setPpm(0);
    setGuardRating(100);
    setGuardWarning(false);
    strikeTimestampsRef.current = [];
    guardSamplesRef.current = { good: 0, total: 0 };
    setPhase('active');
    ringBell(getCtx(), 1);
  }, [getCtx]);

  // Round timer tick
  useEffect(() => {
    if (phase !== 'active') return;
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          setIsWork(prev => {
            if (prev) {
              ringBell(getCtx(), 2);
              return false;
            } else {
              setCurrentRound(r => {
                const next = r + 1;
                if (next > workout?.rounds) {
                  clearInterval(timerRef.current);
                  clearInterval(comboRef.current);
                  ringBell(getCtx(), 3);
                  setPhase('done');
                  return r;
                }
                ringBell(getCtx(), 1);
                setComboIdx(0);
                setCueIdx(ci => (ci + 1) % (workout?.coachCues?.length || 1));
                return next;
              });
              return true;
            }
          });
          return prev => prev ? workout?.restSecs : workout?.workSecs;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, workout, getCtx]);

  // Combo cycle
  useEffect(() => {
    if (phase !== 'active' || !isWork) { clearInterval(comboRef.current); return; }
    comboRef.current = setInterval(() => {
      setComboIdx(i => (i + 1) % (workout?.combos?.length || 1));
    }, 7000);
    return () => clearInterval(comboRef.current);
  }, [phase, isWork, workout]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      clearInterval(timerRef.current);
      clearInterval(comboRef.current);
      setPhase('select');
      setWorkout(null);
    }
  }, [isOpen]);

  // ── AI Pose Strike & Guard Tracking ──
  const handleFightPose = useCallback((landmarks, timestamp) => {
    if (phase !== 'active' || !isWork || !landmarks) return;

    const lWrist = landmarks[15];
    const rWrist = landmarks[16];
    const lShoulder = landmarks[11];
    const rShoulder = landmarks[12];
    const lHip = landmarks[23];
    const rHip = landmarks[24];
    const lKnee = landmarks[25];
    const rKnee = landmarks[26];

    if (!lWrist || !rWrist || !lShoulder || !rShoulder) return;

    // 1. GUARD CHECK (wrists held up protecting head level)
    const isLeftGuardHigh = lWrist.y < lShoulder.y + 0.08;
    const isRightGuardHigh = rWrist.y < rShoulder.y + 0.08;
    const isGuardGood = isLeftGuardHigh && isRightGuardHigh;

    guardSamplesRef.current.total += 1;
    if (isGuardGood) {
      guardSamplesRef.current.good += 1;
      lowGuardTimeRef.current = 0;
      setGuardWarning(false);
    } else {
      lowGuardTimeRef.current += 1;
      if (lowGuardTimeRef.current > 30) {
        setGuardWarning(true);
      }
    }

    if (guardSamplesRef.current.total % 10 === 0) {
      const pct = Math.round((guardSamplesRef.current.good / guardSamplesRef.current.total) * 100);
      setGuardRating(pct);
    }

    // 2. STRIKE DETECTION & CLASSIFICATION
    const lDist = Math.hypot(lWrist.x - lShoulder.x, lWrist.y - lShoulder.y);
    const rDist = Math.hypot(rWrist.x - rShoulder.x, rWrist.y - rShoulder.y);
    const maxDist = Math.max(lDist, rDist);

    // Knee Strike detection
    const isKneeStrike = (lKnee && lHip && lKnee.y < lHip.y - 0.05) || (rKnee && rHip && rKnee.y < rHip.y - 0.05);

    const isPunchExtension = maxDist > 0.36 && (maxDist - prevWristDistRef.current) > 0.06;

    if (isPunchExtension || isKneeStrike) {
      if (timestamp - lastPunchRef.current > 320) {
        lastPunchRef.current = timestamp;

        // Classify strike type
        let strikeType = 'STRAIGHT 1–2';
        if (isKneeStrike) {
          strikeType = 'CLINCH KNEE 🦵';
        } else {
          const activeWrist = lDist > rDist ? lWrist : rWrist;
          const activeShoulder = lDist > rDist ? lShoulder : rShoulder;
          if (activeWrist.y < activeShoulder.y - 0.10) {
            strikeType = 'UPPERCUT ⬆️';
          } else if (Math.abs(activeWrist.x - activeShoulder.x) > 0.28) {
            strikeType = 'HOOK 🤛';
          }
        }
        setLastStrikeType(strikeType);

        // Update total strikes
        setStrikes(s => s + 1);

        // Calculate PPM (Punches per minute) over rolling window
        const now = performance.now();
        strikeTimestampsRef.current.push(now);
        const windowStart = now - 5000; // 5 seconds
        strikeTimestampsRef.current = strikeTimestampsRef.current.filter(t => t >= windowStart);
        const recentPpm = Math.round((strikeTimestampsRef.current.length / 5) * 60);
        setPpm(recentPpm);

        // Audio & Haptic feedback
        playImpactSound(getCtx());
        try { navigator.vibrate?.(35); } catch {}
      }
    }
    prevWristDistRef.current = maxDist;
  }, [phase, isWork, getCtx]);

  if (!isOpen) return null;

  const totalSecs = isWork ? (workout?.workSecs || 1) : (workout?.restSecs || 1);
  const pct = workout ? ((totalSecs - secondsLeft) / totalSecs) * 100 : 0;
  const combo = workout?.combos?.[comboIdx];
  const cue = workout?.coachCues?.[cueIdx];
  const filtered = category === 'All' ? FIGHT_WORKOUTS : FIGHT_WORKOUTS.filter(w => w.category === category);

  // ── DONE SUMMARY SCREEN ──
  if (phase === 'done') {
    const totalWorkMins = Math.round((workout.rounds * workout.workSecs) / 60);
    const estCalories = Math.round(totalWorkMins * 10.5);
    return (
      <div className="fs-screen fs-screen--done">
        <div className="fs-done-inner">
          <div className="fs-done-trophy">🏆</div>
          <h2 className="fs-done-title">SESSION COMPLETE</h2>
          <p className="fs-done-sub">{workout.emoji} {workout.name}</p>

          <div className="fs-done-stats">
            <div className="fs-done-stat">
              <span className="fs-done-stat-num">{workout.rounds}</span>
              <span className="fs-done-stat-lbl">ROUNDS</span>
            </div>
            <div className="fs-done-stat">
              <span className="fs-done-stat-num">{strikes}</span>
              <span className="fs-done-stat-lbl">STRIKES</span>
            </div>
            <div className="fs-done-stat">
              <span className="fs-done-stat-num">{ppm}</span>
              <span className="fs-done-stat-lbl">PEAK PPM</span>
            </div>
            <div className="fs-done-stat">
              <span className="fs-done-stat-num">{guardRating}%</span>
              <span className="fs-done-stat-lbl">GUARD</span>
            </div>
          </div>

          <div className="fs-summary-box">
            <p>🔥 <strong>{estCalories} CALORIES BURNED</strong> IN {totalWorkMins} MINUTES</p>
            <p className="fs-done-quote">"CHAMPIONS ARE MADE IN THE ROUNDS THEY WANT TO QUIT."</p>
          </div>

          <div className="fs-done-actions">
            <button className="fs-btn fs-btn--primary" onClick={() => { setPhase('select'); setWorkout(null); }}>
              ANOTHER ROUND ▶
            </button>
            <button className="fs-btn fs-btn--ghost" onClick={onClose}>
              CLOSE
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE WORKOUT SCREEN ──
  if (phase === 'active') {
    const CIRCUMFERENCE = 2 * Math.PI * 48;
    return (
      <div className={`fs-screen fs-screen--active ${isWork ? 'fs-work' : 'fs-rest'}`} style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Full-screen AI Camera Feed with Skeleton Pose Tracking */}
        <CameraView isActive={true} onResults={handleFightPose} />

        {/* Top Header Bar */}
        <div className="fs-top-bar" style={{ zIndex: 10, position: 'relative' }}>
          <span className="fs-top-name">{workout.emoji} {workout.name}</span>
          <div className="fs-top-metrics">
            <span className="fs-badge-metric">⚡ {ppm} PPM</span>
            <span className="fs-badge-metric">🛡️ {guardRating}% GUARD</span>
          </div>
          <button
            className="fs-top-close"
            onClick={() => { clearInterval(timerRef.current); clearInterval(comboRef.current); setPhase('select'); }}
          >
            ✕
          </button>
        </div>

        {/* Guard Dropped Warning Alert */}
        {guardWarning && isWork && (
          <div className="fs-guard-alert">
            🛡️ HANDS UP! PROTECT YOUR FACE!
          </div>
        )}

        {/* Phase Indicator */}
        <div className={`fs-phase-label ${isWork ? 'fs-phase--work' : 'fs-phase--rest'}`}>
          {isWork ? `ROUND ${currentRound}` : 'REST & BREATHE'}
        </div>

        {/* Round Progress Dots */}
        <div className="fs-round-dots">
          {Array.from({ length: workout.rounds }).map((_, i) => (
            <div
              key={i}
              className={`fs-dot ${i < currentRound - 1 ? 'fs-dot--done' : i === currentRound - 1 ? 'fs-dot--active' : ''}`}
            />
          ))}
        </div>

        {/* Timer Ring */}
        <div className="fs-timer-wrap">
          <svg className="fs-ring" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4"/>
            <circle
              cx="60" cy="60" r="48" fill="none"
              stroke={isWork ? '#FF2E00' : '#00B37E'}
              strokeWidth="4"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - pct / 100)}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="fs-timer-center">
            <div className="fs-timer-num">{fmt(secondsLeft)}</div>
            <div className="fs-timer-round">{currentRound} / {workout.rounds} RDS</div>
          </div>
        </div>

        {/* Combo / Coach Cues Overlay */}
        <div className="fs-card-area">
          {isWork && combo ? (
            <div className="fs-combo-card" key={comboIdx}>
              <div className="fs-combo-head">
                <span className="fs-combo-tag">TARGET COMBO</span>
                <span className="fs-combo-strike-type">{lastStrikeType}</span>
              </div>
              <span className="fs-combo-icon">{combo.icon}</span>
              <p className="fs-combo-name">{combo.label}</p>
              <p className="fs-combo-desc">{combo.desc}</p>
            </div>
          ) : !isWork && cue ? (
            <div className="fs-cue-card">
              <span className="fs-cue-icon">💬</span>
              <p className="fs-cue-text">{cue}</p>
            </div>
          ) : null}
        </div>

        {/* Live Strike Counter Button */}
        <button
          className="fs-strike-btn"
          onClick={() => {
            setStrikes(s => s + 1);
            playImpactSound(getCtx());
            try { navigator.vibrate?.(25); } catch {}
          }}
          id="fight-strike-counter"
        >
          <span className="fs-strike-num">{strikes}</span>
          <span className="fs-strike-lbl">AI DETECTED STRIKES</span>
        </button>
      </div>
    );
  }

  // ── SELECTION SCREEN ──
  return (
    <div className="fs-screen fs-screen--select">
      {/* Header */}
      <div className="fs-select-header">
        <div>
          <p className="fs-eyebrow">COMBAT & FIGHT ATHLETICS</p>
          <h2 className="fs-select-title">Pick Fight Workout</h2>
        </div>
        <button className="fs-top-close" onClick={onClose}>✕</button>
      </div>

      {/* Category Chips */}
      <div className="fs-cats">
        {FIGHT_CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`fs-cat ${category === cat ? 'fs-cat--active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Workout Card List */}
      <div className="fs-list">
        {filtered.map(w => (
          <button key={w.id} className="fs-workout-card" onClick={() => startWorkout(w)}>
            <span className="fs-wk-emoji">{w.emoji}</span>
            <div className="fs-wk-body">
              <p className="fs-wk-name">{w.name}</p>
              <p className="fs-wk-desc">{w.description}</p>
              <p className="fs-wk-meta">
                {w.rounds} RDS · {fmt(w.workSecs)} WORK · {w.difficulty.toUpperCase()}
              </p>
            </div>
            <span className="fs-wk-arrow">▶</span>
          </button>
        ))}
      </div>
    </div>
  );
}

import { useState, useRef, useCallback, useEffect } from 'react';
import './index.css';

import ILALogo            from './components/ILALogo.jsx';
import WorkoutHUD          from './components/WorkoutHUD.jsx';
import MotivationalToast   from './components/MotivationalToast.jsx';
import FightSportsTrainer  from './components/FightSportsTrainer.jsx';
import { RepHero, FormFeedback, ExerciseSelector, ControlBar, StatusBanner } from './components/SidebarComponents.jsx';

import { createExerciseCounter } from './exercises/counters.js';
import { saveWorkoutSession, getPersonalRecords } from './utils/storage.js';
import { onRepCounted } from './utils/audio.js';
import {
  setVoiceEnabled, speak,
  getStartPhrase, getStopPhrase, getPBPhrase,
  getEvery5Phrase, getMilestonePhrase, getPlankHalfPhrase,
} from './utils/voiceHype.js';

// ── Coach tip function (form hints based on landmarks)
import { getLandmark as w, midpoint as It, getAngle as ne, getTorsoHeight as Ut, LANDMARKS as y } from './utils/poseUtils.js';

function getCoachTip(exerciseId, landmarks, stage, angle) {
  if (!landmarks) return null;
  try {
    switch (exerciseId) {
      case 'pushup':    return coachPushup(landmarks, stage, angle);
      case 'squat':     return coachSquat(landmarks, stage, angle);
      case 'lunge':     return coachLunge(landmarks, stage, angle);
      case 'situp':     return coachSitup(landmarks, stage, angle);
      case 'plank':     return coachPlank(landmarks);
      case 'highKnees': return coachHighKnees(landmarks, stage);
      case 'mountainClimber': return coachMountainClimber(landmarks, stage);
      case 'burpee':    return coachBurpee(landmarks, stage);
      case 'gluteBridge': return coachGluteBridge(landmarks, stage, angle);
      default: return null;
    }
  } catch { return null; }
}

function bodyDeviation(landmarks) {
  const ls = w(landmarks, y.L_SHOULDER, 0.3), rs = w(landmarks, y.R_SHOULDER, 0.3);
  const lh = w(landmarks, y.L_HIP, 0.3), rh = w(landmarks, y.R_HIP, 0.3);
  const la = w(landmarks, y.L_ANKLE, 0.3), ra = w(landmarks, y.R_ANKLE, 0.3);
  if ((!ls && !rs) || (!lh && !rh)) return null;
  const torsoH = Ut(landmarks);
  if (!torsoH) return null;
  const shY = ls && rs ? (ls.y + rs.y)/2 : (ls||rs).y;
  const hiY = lh && rh ? (lh.y + rh.y)/2 : (lh||rh).y;
  const anY = la && ra ? (la.y + ra.y)/2 : la ? la.y : ra ? ra.y : null;
  if (!anY) return null;
  const expected = shY + (anY - shY) * ((hiY - shY) / (anY - shY));
  return Math.abs(hiY - expected) / torsoH;
}

function coachPushup(lm, stage, angle) {
  const msgs = [];
  const dev = bodyDeviation(lm);
  if (dev !== null) {
    if (dev > 0.2 && stage === 'down') msgs.push('🚨 Hips are piking up — flatten your back');
    else if (dev > 0.18) msgs.push('⚠️ Hips sagging — engage your core to stay flat');
  }
  if (angle !== null) {
    if (stage === 'up' && angle > 155) msgs.push('✅ Arms locked — now lower your chest to floor');
    else if (stage === 'up' && angle > 100) msgs.push('💪 Good position — lower deeper next rep');
    if (stage === 'down' && angle > 90) msgs.push('⬇️ Go lower — chest should touch the floor');
    if (stage === 'down' && angle <= 90) msgs.push('✅ Great depth! Push explosively back up');
  }
  const nose = w(lm, y.NOSE, 0.4), ls = w(lm, y.L_SHOULDER, 0.4), rs = w(lm, y.R_SHOULDER, 0.4);
  if (nose && ls && rs) {
    const shoulderMidX = (ls.x + rs.x) / 2;
    if (Math.abs(nose.x - shoulderMidX) > 0.15) msgs.push('👀 Keep head neutral — look at floor below you');
  }
  return msgs.length ? msgs[0] : null;
}

function coachSquat(lm, stage, angle) {
  const msgs = [];
  const lk = w(lm, y.L_KNEE, 0.4), rk = w(lm, y.R_KNEE, 0.4);
  const la = w(lm, y.L_ANKLE, 0.4), ra = w(lm, y.R_ANKLE, 0.4);
  if (lk && rk && la && ra) {
    const kneeW = Math.abs(lk.x - rk.x), ankleW = Math.abs(la.x - ra.x);
    if (kneeW < ankleW * 0.75 && stage === 'squat') msgs.push('🦵 Knees caving in — push them outward over your toes');
  }
  if (angle !== null) {
    if (stage === 'standing' && angle < 160) msgs.push('🔼 Stand tall — fully extend your hips at the top');
    if (stage === 'squat' && angle > 100) msgs.push('⬇️ Squat deeper — thighs parallel to floor or below');
    if (stage === 'squat' && angle <= 100) msgs.push('✅ Good depth! Drive through your heels to stand');
  }
  const ls = w(lm, y.L_SHOULDER, 0.4), rs = w(lm, y.R_SHOULDER, 0.4);
  const lh = w(lm, y.L_HIP, 0.4), rh = w(lm, y.R_HIP, 0.4);
  if (ls && rs && lh && rh) {
    const shoulderX = (ls.x + rs.x) / 2, hipX = (lh.x + rh.x) / 2;
    if (Math.abs(shoulderX - hipX) > 0.12 && stage === 'squat') msgs.push('🔺 Too much forward lean — chest up, keep torso more vertical');
  }
  return msgs.length ? msgs[0] : null;
}

function coachLunge(lm, stage, angle) {
  if (angle !== null) {
    if (stage === 'standing' && angle < 155) return '🔼 Stand up fully — lock out both legs';
    if (stage === 'lunge' && angle > 110) return '⬇️ Lower deeper — front knee to 90° bend';
    if (stage === 'lunge' && angle <= 90) return '✅ Perfect depth! Push back up through front heel';
    if (stage === 'lunge' && angle <= 110) return '💪 Good! Try going a little deeper';
  }
  const lk = w(lm, y.L_KNEE, 0.4), la = w(lm, y.L_ANKLE, 0.4);
  if (lk && la && Math.abs(lk.x - la.x) > 0.1) return '⚠️ Front knee tracking off — keep it in line with your foot';
  return null;
}

function coachSitup(lm, stage, angle) {
  if (angle !== null) {
    if (stage === 'flat' && angle < 80) return '🔽 Lie flat — relax your torso fully down';
    if (stage === 'crunched' && angle > 75) return '🔺 Crunch higher — bring chest to knees';
    if (stage === 'crunched' && angle <= 75) return '✅ Great crunch! Now lower slowly back down';
  }
  return null;
}

function coachPlank(lm) {
  const dev = bodyDeviation(lm);
  if (dev === null) return '📐 Get into plank — hands under shoulders, body straight';
  if (dev > 0.2) return '⚠️ Hips off line — squeeze glutes and core to straighten';
  if (dev > 0.1) return '💪 Good plank — keep squeezing your core';
  return '✅ Perfect alignment — breathe steadily, hold strong';
}

function coachHighKnees(lm, stage) {
  const lk = w(lm, y.L_KNEE, 0.4), rk = w(lm, y.R_KNEE, 0.4);
  const lh = w(lm, y.L_HIP, 0.4), rh = w(lm, y.R_HIP, 0.4);
  if (!lk && !rk) return '🏃 Stand ready — begin driving your knees high';
  if (lh && lk && lk.y > lh.y - 0.04) return '🦵 Drive left knee to hip height — higher!';
  if (rh && rk && rk.y > rh.y - 0.04) return '🦵 Drive right knee to hip height — higher!';
  return '✅ Great height! Maintain your running posture';
}

function coachMountainClimber(lm, stage) {
  const ls = w(lm, y.L_SHOULDER, 0.4), rs = w(lm, y.R_SHOULDER, 0.4);
  if (!ls && !rs) return '🏔️ Get into plank position — arms straight, core tight';
  const dev = bodyDeviation(lm);
  if (dev !== null && dev > 0.2) return '⚠️ Hips rising — keep your plank position flat';
  if (stage === 'leftDrive') return '✅ Left knee driving! Switch — right knee up now!';
  if (stage === 'rightDrive') return '✅ Right knee driving! Switch — left knee up now!';
  return '🔥 Faster alternating drives — keep hips low!';
}

function coachBurpee(lm, stage) {
  if (stage === 'standing') return '🔽 Squat down — place hands on floor and jump back';
  if (stage === 'plank') return '⬇️ Do a push-up — chest to floor!';
  if (stage === 'pushup') return '🔺 Jump feet to hands — then leap up!';
  if (stage === 'jump') return '✅ Full extension — reach arms overhead!';
  return '💥 Full body — squat, plank, push-up, jump!';
}

function coachGluteBridge(lm, stage, angle) {
  if (angle !== null) {
    if (stage === 'flat') return '🔺 Push hips to ceiling — squeeze your glutes hard';
    if (stage === 'bridge') {
      if (angle > 160) return '✅ Peak contraction — hold for 1 second!';
      return '🔺 Push higher — full hip extension at the top';
    }
  }
  return '🍑 Lie on back, knees bent, feet flat. Drive hips up.';
}

// ─────────────────────────────────────────────────────────────────────────────
// Main App Component
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // ── Exercise selection
  const [selectedExercise, setSelectedExercise] = useState('pushup');

  // ── Session state: 'idle' | 'active'
  const [sessionState, setSessionState] = useState('idle');

  // ── Loading / error states
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // ── Live rep / pose data
  const [reps, setReps] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [stage, setStage] = useState('idle');
  const [coachTip, setCoachTip] = useState(null);
  const [currentAngle, setCurrentAngle] = useState(null);
  const [plankSeconds, setPlankSeconds] = useState(0);

  // ── Feedback messages
  const [feedbackMsg, setFeedbackMsg] = useState('SELECT AN EXERCISE TO BEGIN');
  const [statusMsg, setStatusMsg] = useState(null);
  const [statusType, setStatusType] = useState('info');

  // ── UI state
  const [toastMsg, setToastMsg] = useState(null);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showPRs, setShowPRs] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('repai_onboarded')
  );
  const [showFormGuide, setShowFormGuide] = useState(false);
  const [showFightTrainer, setShowFightTrainer] = useState(false);
  const [personalRecord, setPersonalRecord] = useState(0);

  // ── Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [voiceHypeEnabled, setVoiceHypeEnabled] = useState(false);

  // ── Refs
  const counterRef = useRef(createExerciseCounter('pushup'));
  const sessionActiveRef = useRef(false);
  const soundEnabledRef = useRef(soundEnabled);
  const vibrationEnabledRef = useRef(vibrationEnabled);
  const sessionStartRef = useRef(null);
  const timerRef = useRef(null);
  const frameCountRef = useRef(0);
  const prTrackingRef = useRef({});
  const plankHalfFiredRef = useRef(false);

  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);
  useEffect(() => { vibrationEnabledRef.current = vibrationEnabled; }, [vibrationEnabled]);
  useEffect(() => { setVoiceEnabled(voiceHypeEnabled); }, [voiceHypeEnabled]);

  // ── Show toast helper
  const showToast = useCallback((msg, withVoice = true) => {
    setToastMsg(null);
    requestAnimationFrame(() => {
      setToastMsg(msg);
      if (withVoice) speak(msg);
    });
  }, []);

  // ── Exercise selection (only when idle)
  const handleSelectExercise = useCallback((id) => {
    if (sessionState === 'active') return;
    setSelectedExercise(id);
    setReps(0);
    setStage('idle');
    setFeedbackMsg('SELECT AN EXERCISE TO BEGIN');
    setCurrentAngle(null);
    setCoachTip(null);
    setElapsedSeconds(0);
    setPlankSeconds(0);
    counterRef.current = createExerciseCounter(id);
    plankHalfFiredRef.current = false;
    // Load PR
    const prs = getPersonalRecords();
    setPersonalRecord(prs[id]?.record || 0);
  }, [sessionState]);

  // ── Load PR on mount
  useEffect(() => {
    const prs = getPersonalRecords();
    setPersonalRecord(prs['pushup']?.record || 0);
  }, []);

  // ── Start session
  const handleStart = useCallback(() => {
    setCameraError(null);
    setSessionState('active');
    sessionActiveRef.current = true;
    plankHalfFiredRef.current = false;

    // Start timer
    sessionStartRef.current = Date.now() - elapsedSeconds * 1000;
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartRef.current) / 1000));
    }, 1000);

    // Plank: call start() on the counter
    if (selectedExercise === 'plank') {
      counterRef.current.start?.();
    }

    const phrase = getStartPhrase();
    showToast(phrase, voiceHypeEnabled);
  }, [elapsedSeconds, selectedExercise, showToast, voiceHypeEnabled]);

  // ── Stop session
  const handleStop = useCallback(() => {
    setSessionState('idle');
    sessionActiveRef.current = false;
    clearInterval(timerRef.current);

    const currentReps = counterRef.current.reps ?? 0;
    const elapsed = elapsedSeconds;
    const plankSecs = counterRef.current.elapsedSeconds ?? 0;
    const isPlank = selectedExercise === 'plank';

    const summary = {
      exercise: selectedExercise,
      reps: currentReps,
      durationSeconds: elapsed,
      isPlank,
      plankSeconds: plankSecs,
    };
    saveWorkoutSession(summary);
    setSessionSummary(summary);
    setShowSummary(true);
    setCoachTip(null);

    const phrase = getStopPhrase();
    showToast(phrase, voiceHypeEnabled);
  }, [selectedExercise, elapsedSeconds, showToast, voiceHypeEnabled]);

  // ── Reset session
  const handleReset = useCallback(() => {
    setSessionState('idle');
    sessionActiveRef.current = false;
    clearInterval(timerRef.current);
    setReps(0);
    setElapsedSeconds(0);
    setStage('idle');
    setFeedbackMsg('SELECT AN EXERCISE TO BEGIN');
    setCurrentAngle(null);
    setCoachTip(null);
    setPlankSeconds(0);
    setStatusMsg(null);
    counterRef.current = createExerciseCounter(selectedExercise);
    plankHalfFiredRef.current = false;
  }, [selectedExercise]);

  // ── Per-frame pose results handler
  const handleResults = useCallback((landmarks, timestamp) => {
    if (!sessionActiveRef.current) return;

    const counter = counterRef.current;
    if (!counter) return;

    if (!landmarks) {
      setStatusMsg('MOVE INTO FRAME');
      setStatusType('warning');
      return;
    }
    setStatusMsg(null);

    const result = counter.update(landmarks, timestamp);
    if (!result) return;

    const { repCounted, feedback, stage: newStage, angle, elapsedSeconds: plankSecs } = result;

    if (feedback) setFeedbackMsg(feedback.toUpperCase());
    if (newStage) setStage(newStage);
    if (angle !== undefined) setCurrentAngle(angle);
    if (plankSecs !== undefined) setPlankSeconds(plankSecs);

    // Update reps (live, from counter)
    setReps(counter.reps ?? 0);

    // Coach tips every 5 frames
    frameCountRef.current++;
    if (frameCountRef.current % 5 === 0) {
      const tip = getCoachTip(selectedExercise, landmarks, newStage, angle);
      if (tip) setCoachTip(tip);
    }

    // Rep counted events
    if (repCounted) {
      onRepCounted(soundEnabledRef.current, vibrationEnabledRef.current);
      const currentReps = counter.reps;

      // Check PR
      const prevPR = prTrackingRef.current[selectedExercise] ?? 0;
      if (currentReps > prevPR) {
        prTrackingRef.current[selectedExercise] = currentReps;
        if (currentReps > 1) showToast(getPBPhrase(), voiceHypeEnabled);
      } else {
        // Milestones
        const milestone = getMilestonePhrase(currentReps);
        if (milestone) {
          showToast(milestone, voiceHypeEnabled);
        } else if (currentReps % 5 === 0 && currentReps > 0) {
          showToast(getEvery5Phrase(), voiceHypeEnabled);
        }
      }
    }

    // Plank halfway alert
    if (selectedExercise === 'plank' && !plankHalfFiredRef.current) {
      const targetSecs = counter.targetSeconds;
      if (targetSecs && plankSecs >= targetSecs / 2) {
        plankHalfFiredRef.current = true;
        showToast(getPlankHalfPhrase(), voiceHypeEnabled);
      }
    }
  }, [selectedExercise, showToast, voiceHypeEnabled]);

  // ── Camera error handler
  const handleCameraError = useCallback((err) => {
    setCameraError(err);
    setSessionState('idle');
    sessionActiveRef.current = false;
    clearInterval(timerRef.current);
  }, []);

  // ── Cleanup on unmount
  useEffect(() => () => clearInterval(timerRef.current), []);

  const isPlank = selectedExercise === 'plank';

  return (
    <div className="swiss-app">
      {/* Motivational toast */}
      <MotivationalToast message={toastMsg} duration={2500} onDismiss={() => setToastMsg(null)} />

      {/* ── ACTIVE SESSION: Full-screen HUD ── */}
      {sessionState === 'active' && (
        <WorkoutHUD
          onResults={handleResults}
          onLoading={setIsLoading}
          onError={handleCameraError}
          reps={reps}
          stage={stage}
          coachTip={coachTip}
          statusMsg={statusMsg}
          statusType={statusType}
          elapsedSeconds={elapsedSeconds}
          selectedExercise={selectedExercise}
          isPlank={isPlank}
          plankSeconds={plankSeconds}
          oldPR={personalRecord}
          onStop={handleStop}
        />
      )}

      {/* ── IDLE: Main app layout ── */}
      <div style={{ display: sessionState === 'active' ? 'none' : 'contents' }}>
        {/* Header */}
        <header className="swiss-header">
          <ILALogo mode="header" />
          <div className="swiss-header-actions">
            <button
              className="swiss-nav-btn swiss-nav-btn--challenge"
              onClick={() => setShowFightTrainer(true)}
              title="Open Fight Sports Training Suite"
            >
              🥊 FIGHT
            </button>
            <button
              className="swiss-nav-btn"
              onClick={() => setShowPRs(true)}
              title="View Personal Records & History"
            >
              🏆 PRs
            </button>
            <button
              className="swiss-nav-btn"
              onClick={() => setShowFormGuide(true)}
              title="View Setup & Positioning Guide"
            >
              ℹ GUIDE
            </button>
            <button
              className={`swiss-voice-btn ${voiceHypeEnabled ? 'is-active' : ''}`}
              onClick={() => setVoiceHypeEnabled(v => !v)}
              title={voiceHypeEnabled ? 'Voice hype: ON' : 'Voice hype: OFF'}
            >
              {voiceHypeEnabled ? '🔊 VOICE ON' : '🔇 VOICE OFF'}
            </button>
          </div>
        </header>

        {/* Main two-column layout */}
        <main className="swiss-main-grid">
          {/* Camera panel (onboarding cover or live) */}
          <section className="swiss-camera-panel" aria-label="Camera feed with pose detection">
            <div className="swiss-onboarding-cover">
              <div className="cover-badge">ILA // AI VISION ACTIVE</div>
              <h1 className="cover-title">STAND IN FRAME<br />TO COUNT REPS</h1>
              <p className="cover-sub">
                Pick your workout from the list, align full body in view,<br />
                then hit <strong>START SESSION</strong>.
              </p>
              <div className="cover-graphic-box">
                <span>100% LOCAL AI - NO DATA LEAVES YOUR DEVICE</span>
              </div>
            </div>
            {cameraError && (
              <div className="status-banner error" style={{ position: 'relative', transform: 'none', margin: '16px auto' }}>
                ⚠️ {cameraError}
              </div>
            )}
          </section>

          {/* Sidebar panel */}
          <aside className="swiss-sidebar-panel">
            <RepHero
              reps={reps}
              exercise={selectedExercise}
              stage={stage}
              isPlank={isPlank}
              plankSeconds={plankSeconds}
              angle={currentAngle}
            />
            <FormFeedback message={feedbackMsg} />
            <ExerciseSelector
              selected={selectedExercise}
              onSelect={handleSelectExercise}
              disabled={sessionState === 'active'}
            />
            <ControlBar
              sessionState={sessionState}
              onStart={handleStart}
              onStop={handleStop}
              onReset={handleReset}
              elapsedSeconds={elapsedSeconds}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(v => !v)}
              vibrationEnabled={vibrationEnabled}
              onToggleVibration={() => setVibrationEnabled(v => !v)}
            />
          </aside>
        </main>
      </div>

      {/* Session summary modal */}
      {showSummary && sessionSummary && (
        <SessionSummaryModal
          session={sessionSummary}
          onClose={() => setShowSummary(false)}
          onNewSession={() => { setShowSummary(false); handleReset(); }}
        />
      )}

      {/* PRs & history modal */}
      {showPRs && <PRsModal onClose={() => setShowPRs(false)} />}

      {/* Fight sports trainer overlay */}
      {showFightTrainer && (
        <FightSportsTrainer
          isOpen={showFightTrainer}
          onClose={() => setShowFightTrainer(false)}
        />
      )}

      {/* Onboarding modal */}
      {showOnboarding && (
        <OnboardingModal onClose={() => {
          localStorage.setItem('repai_onboarded', 'true');
          setShowOnboarding(false);
        }} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Summary Modal
// ─────────────────────────────────────────────────────────────────────────────
import { EXERCISES } from './data/exercises.js';
import { formatTime, estimateCalories } from './components/SidebarComponents.jsx';

function SessionSummaryModal({ session, onClose, onNewSession }) {
  const { exercise, reps, durationSeconds, isPlank, plankSeconds } = session;
  const ex = EXERCISES.find(e => e.id === exercise);
  const cals = estimateCalories(exercise, durationSeconds);

  return (
    <div className="swiss-modal-overlay" role="dialog" aria-modal="true" aria-label="Session Summary">
      <div className="swiss-modal poster-card">
        <div className="poster-header-stripe">
          <span className="poster-tag">SESSION RESULT // SUMMARY</span>
          <span className="poster-step-count">COMPLETE</span>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ fontSize: '3rem', lineHeight: 1 }}>{ex?.icon}</div>
          <h2 className="poster-headline" style={{ marginTop: '8px', fontSize: '2.4rem' }}>
            {ex?.name || exercise?.toUpperCase()}
          </h2>
          <div className="poster-rule-line" style={{ margin: '12px 0 20px' }} />
          <div className="swiss-stats-row" style={{ marginBottom: '20px' }}>
            <div className="swiss-stat-box">
              <span className="swiss-stat-num">{isPlank ? formatTime(plankSeconds) : reps}</span>
              <span className="swiss-stat-lbl">{isPlank ? 'TIME HELD' : 'REPS'}</span>
            </div>
            <div className="swiss-stat-box">
              <span className="swiss-stat-num">{formatTime(durationSeconds)}</span>
              <span className="swiss-stat-lbl">DURATION</span>
            </div>
            <div className="swiss-stat-box">
              <span className="swiss-stat-num">~{cals}</span>
              <span className="swiss-stat-lbl">KCAL EST.</span>
            </div>
          </div>
        </div>
        <div className="poster-modal-footer">
          <button className="swiss-btn swiss-btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            CLOSE
          </button>
          <button className="swiss-btn swiss-btn-action" onClick={onNewSession} style={{ flex: 2 }}>
            NEW SESSION →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRs & History Modal
// ─────────────────────────────────────────────────────────────────────────────
import { getPersonalRecords as getPRs, getLifetimeTotals, getWorkoutHistory } from './utils/storage.js';

function PRsModal({ onClose }) {
  const prs = getPRs();
  const totals = getLifetimeTotals();
  const history = getWorkoutHistory();

  return (
    <div className="swiss-modal-overlay" role="dialog" aria-modal="true" aria-label="Personal Records and History">
      <div className="swiss-modal poster-card modal-wide">
        <div className="poster-header-stripe">
          <span className="poster-tag">RECORD LOG // PERFORMANCE</span>
          <button className="swiss-icon-close" onClick={onClose} aria-label="Close modal">×</button>
        </div>
        <h2 className="poster-headline" style={{ margin: '16px 24px 8px' }}>PERSONAL RECORDS</h2>
        <div className="poster-rule-line" />
        <div className="prs-modal-scroll">
          <div className="swiss-stats-row">
            <div className="swiss-stat-box">
              <span className="swiss-stat-num">{totals.totalWorkouts}</span>
              <span className="swiss-stat-lbl">SESSIONS</span>
            </div>
            <div className="swiss-stat-box">
              <span className="swiss-stat-num">{totals.totalReps}</span>
              <span className="swiss-stat-lbl">TOTAL REPS</span>
            </div>
            <div className="swiss-stat-box">
              <span className="swiss-stat-num">{formatTime(totals.totalSeconds)}</span>
              <span className="swiss-stat-lbl">TOTAL TIME</span>
            </div>
          </div>
          <div className="section-subhead" style={{ margin: '16px 0 8px' }}>EXERCISE PRs</div>
          <div className="prs-grid">
            {EXERCISES.map(ex => {
              const pr = prs[ex.id];
              return (
                <div key={ex.id} className={`pr-card ${pr ? 'has-pr' : ''}`}>
                  <div className="pr-card-head">
                    <span className="pr-icon">{ex.icon}</span>
                    <span className="pr-name">{ex.name}</span>
                  </div>
                  <div className="pr-card-val">{pr ? (ex.id === 'plank' ? formatTime(pr.record) : pr.record) : '—'}</div>
                  {pr && <div className="pr-card-date">{pr.date}</div>}
                </div>
              );
            })}
          </div>
          {history.length > 0 && (
            <>
              <div className="section-subhead" style={{ margin: '20px 0 8px' }}>RECENT HISTORY</div>
              <div className="history-list">
                {history.slice(0, 10).map(entry => {
                  const ex = EXERCISES.find(e => e.id === entry.exercise);
                  return (
                    <div key={entry.id} className="history-row">
                      <div className="history-ex">
                        <span>{ex?.icon}</span>
                        <span>{ex?.name || entry.exercise}</span>
                        {entry.isPR && <span className="pr-tag-badge">PR</span>}
                      </div>
                      <span className="history-score">{entry.score}</span>
                      <span className="history-date">{entry.date}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <div className="poster-modal-footer">
          <button className="swiss-btn swiss-btn-action" onClick={onClose} style={{ flex: 1 }}>CLOSE</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding Modal
// ─────────────────────────────────────────────────────────────────────────────
function OnboardingModal({ onClose }) {
  return (
    <div className="swiss-modal-overlay" role="dialog" aria-modal="true" aria-label="Welcome to ILA">
      <div className="swiss-modal poster-card">
        <div className="poster-header-stripe">
          <span className="poster-tag">ILA // QUICK START</span>
          <span className="poster-step-count">WELCOME</span>
        </div>
        <div className="poster-modal-body">
          <div className="poster-modal-icon">💪</div>
          <h2 className="poster-headline">GET STARTED</h2>
          <p className="poster-copy">
            ILA uses your device camera and AI pose detection to count reps in real time.
            No wearables. No internet required after first load. 100% private.
          </p>
          <div className="poster-tip-box">
            📐 BEST RESULTS: Stand 2–3m back so your full body fits in frame.
            Good lighting + contrasting clothes help the AI track you accurately.
          </div>
        </div>
        <div className="poster-modal-footer">
          <button
            id="onboarding-start-btn"
            className="swiss-btn swiss-btn-action"
            onClick={onClose}
            style={{ flex: 1 }}
          >
            LET'S GO →
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Storage } from '../utils/storage.js';

const GOALS = [
  { id: 'stronger', label: 'Get Stronger', emoji: '💪' },
  { id: 'muscle',   label: 'Build Muscle',  emoji: '🏋️' },
  { id: 'fit',      label: 'Get Fit',       emoji: '🏃' },
  { id: 'calisthenics', label: 'Calisthenics', emoji: '🤸' },
];
const LEVELS = [
  { id: 'beginner',      label: 'Beginner',      desc: 'New to exercise' },
  { id: 'intermediate',  label: 'Intermediate',  desc: '6+ months training' },
  { id: 'advanced',      label: 'Advanced',      desc: '2+ years training' },
];
const DURATIONS = [
  { id: 10,  label: '10 min', desc: 'Quick session' },
  { id: 20,  label: '20 min', desc: 'Standard' },
  { id: 30,  label: '30 min', desc: 'Full workout' },
  { id: 45,  label: '45+ min', desc: 'Long session' },
];

export default function OnboardingModal({ onComplete }) {
  const [step, setStep] = useState(1); // 1=goal, 2=level, 3=duration, 4=ready
  const [goal, setGoal] = useState(null);
  const [level, setLevel] = useState(null);
  const [duration, setDuration] = useState(null);

  const finish = () => {
    // Save onboarding preferences directly (Storage doesn't have saveSettings yet)
    try {
      localStorage.setItem('ila_onboarding_prefs', JSON.stringify({ goal, level, duration }));
    } catch(e) {}
    Storage.setOnboarded(true);
    onComplete();
  };

  if (step === 4) {
    return (
      <div className="onboarding-overlay">
        <div className="onboarding-card">
          <div className="onboarding-ready-icon">⚡</div>
          <h2 className="onboarding-title">Your plan is ready.</h2>
          <p className="onboarding-desc" style={{marginBottom: 8}}>3 workouts per week, {duration} min each.</p>
          <p className="onboarding-desc" style={{opacity: 0.5, fontSize: '0.75rem', marginBottom: 28}}>You can change this anytime in Settings.</p>
          <button className="btn btn-primary" style={{width:'100%', padding:'15px'}} onClick={finish}>
            START FIRST WORKOUT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        {/* Progress dots */}
        <div className="onboarding-progress" style={{marginBottom: 24}}>
          {[1,2,3].map(i => (
            <div key={i} className={`ob-dot ${i === step ? 'is-active' : ''}`} />
          ))}
        </div>

        {step === 1 && (
          <>
            <h2 className="onboarding-title">What are you training for?</h2>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, margin:'20px 0'}}>
              {GOALS.map(g => (
                <button
                  key={g.id}
                  onClick={() => { setGoal(g.id); setStep(2); }}
                  style={{
                    background: goal===g.id ? 'rgba(255,75,43,0.15)' : 'var(--bg2)',
                    border: goal===g.id ? '1px solid var(--red)' : '1px solid var(--line)',
                    borderRadius: 12, padding: '16px 10px',
                    color: 'var(--text)', fontFamily: 'inherit',
                    fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
                  }}
                >
                  <span style={{fontSize:'1.6rem'}}>{g.emoji}</span>
                  {g.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="onboarding-title">Your experience level?</h2>
            <div style={{display:'flex', flexDirection:'column', gap:10, margin:'20px 0'}}>
              {LEVELS.map(l => (
                <button
                  key={l.id}
                  onClick={() => { setLevel(l.id); setStep(3); }}
                  style={{
                    background: level===l.id ? 'rgba(255,75,43,0.15)' : 'var(--bg2)',
                    border: level===l.id ? '1px solid var(--red)' : '1px solid var(--line)',
                    borderRadius: 12, padding: '14px 16px',
                    color: 'var(--text)', fontFamily: 'inherit',
                    fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                    textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <span>{l.label}</span>
                  <span style={{fontSize:'0.72rem', color:'var(--dim)', fontWeight:400}}>{l.desc}</span>
                </button>
              ))}
            </div>
            <button style={{background:'none',border:'none',color:'var(--dim)',fontSize:'0.8rem',cursor:'pointer'}} onClick={() => setStep(1)}>← Back</button>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="onboarding-title">How long per session?</h2>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, margin:'20px 0'}}>
              {DURATIONS.map(d => (
                <button
                  key={d.id}
                  onClick={() => { setDuration(d.id); setStep(4); }}
                  style={{
                    background: duration===d.id ? 'rgba(255,75,43,0.15)' : 'var(--bg2)',
                    border: duration===d.id ? '1px solid var(--red)' : '1px solid var(--line)',
                    borderRadius: 12, padding: '16px 10px',
                    color: 'var(--text)', fontFamily: 'inherit',
                    fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                  }}
                >
                  <span style={{fontSize:'1.1rem'}}>{d.label}</span>
                  <span style={{fontSize:'0.66rem', color:'var(--dim)', fontWeight:400}}>{d.desc}</span>
                </button>
              ))}
            </div>
            <button style={{background:'none',border:'none',color:'var(--dim)',fontSize:'0.8rem',cursor:'pointer'}} onClick={() => setStep(2)}>← Back</button>
          </>
        )}

        <button
          style={{background:'none',border:'none',color:'var(--faint)',fontSize:'0.72rem',cursor:'pointer', marginTop: 8}}
          onClick={finish}
        >
          Skip setup
        </button>
      </div>
    </div>
  );
}

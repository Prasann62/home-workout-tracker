import React, { useState } from 'react';
import { Storage } from '../utils/storage.js';

export default function WorkoutCheckin({ onComplete, onSkip }) {
  const [energy, setEnergy] = useState(null);
  const [soreness, setSoreness] = useState(null);

  const handleComplete = () => {
    const data = { energy, soreness, timestamp: Date.now() };
    
    // Save to local storage for history/adaptation
    try {
      const history = Storage.getCheckinHistory();
      history.push(data);
      Storage.saveCheckinHistory(history);
    } catch(e) {}

    onComplete(data);
  };

  return (
    <div className="checkin-overlay">
      <div className="checkin-modal">
        <h2 className="checkin-title">HOW ARE YOU FEELING TODAY?</h2>
        
        <div className="checkin-section">
          <h3>ENERGY LEVEL</h3>
          <div className="checkin-options">
            <button className={`checkin-btn ${energy === 'low' ? 'is-active' : ''}`} onClick={() => setEnergy('low')}>😴 Low</button>
            <button className={`checkin-btn ${energy === 'okay' ? 'is-active' : ''}`} onClick={() => setEnergy('okay')}>😐 Okay</button>
            <button className={`checkin-btn ${energy === 'great' ? 'is-active' : ''}`} onClick={() => setEnergy('great')}>⚡ Great</button>
          </div>
        </div>

        <div className="checkin-section">
          <h3>ANY SORENESS?</h3>
          <div className="checkin-options">
            <button className={`checkin-btn ${soreness === 'none' ? 'is-active' : ''}`} onClick={() => setSoreness('none')}>💚 None</button>
            <button className={`checkin-btn ${soreness === 'some' ? 'is-active' : ''}`} onClick={() => setSoreness('some')}>💛 Some</button>
            <button className={`checkin-btn ${soreness === 'alot' ? 'is-active' : ''}`} onClick={() => setSoreness('alot')}>🔴 A Lot</button>
          </div>
        </div>

        <div className="checkin-actions">
          <button className="checkin-action-btn checkin-primary" onClick={handleComplete} disabled={!energy || !soreness}>
            LET'S GO!
          </button>
          <button className="checkin-action-btn checkin-ghost" onClick={onSkip}>
            SKIP
          </button>
        </div>
      </div>
    </div>
  );
}

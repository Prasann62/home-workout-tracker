import React, { useState, useEffect } from 'react';
import { logWeight, getWeightHistory, getWeightTrend, getLatestWeight } from '../utils/bodyStats.js';

export default function BodyStats() {
  const [unit, setUnit] = useState('kg');
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState([]);
  const [trend, setTrend] = useState('insufficient');
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setHistory(getWeightHistory());
    setTrend(getWeightTrend());
    setLatest(getLatestWeight());
  };

  const handleLog = (e) => {
    e.preventDefault();
    const val = parseFloat(inputValue);
    if (!isNaN(val) && val > 0) {
      // If user is in lbs, convert to kg for storage since logWeight expects kg
      const kg = unit === 'kg' ? val : val / 2.20462;
      logWeight(kg);
      setInputValue('');
      refreshData();
    }
  };

  const validHistory = (history || []).filter(d => d && typeof d.kg === 'number' && !isNaN(d.kg));
  const maxWeight = validHistory.length > 0 ? Math.max(...validHistory.map(d => d.kg)) : 100;
  const minWeight = validHistory.length > 0 ? Math.min(...validHistory.map(d => d.kg)) : 0;
  const range = maxWeight - minWeight || 1;

  return (
    <div className="bs-container">
      <header className="bs-header">
        <h2 className="bs-title">BODY STATS</h2>
      </header>

      <div className="bs-card bs-current-card">
        <h3>Current Weight</h3>
        {latest ? (
          <>
            <div className="bs-val">
              {latest.kg.toFixed(1)} kg <span className="bs-val-alt">({latest.lbs.toFixed(1)} lbs)</span>
            </div>
            <div className={`bs-trend bs-trend--${trend}`}>
              Trend: {trend === 'gaining' ? '↑ Gaining' : trend === 'losing' ? '↓ Losing' : trend === 'stable' ? '→ Stable' : 'Insufficient Data'}
            </div>
          </>
        ) : (
          <p className="bs-empty">No weight logged yet.</p>
        )}
      </div>

      <div className="bs-card bs-history-card">
        <h3>WEIGHT HISTORY (30 days)</h3>
        {validHistory.length > 0 ? (
          <div className="bs-chart-container">
            {validHistory.slice(-30).map((d, i) => {
              const heightPct = 20 + ((d.kg - minWeight) / range) * 80;
              return (
                <div key={i} className="bs-bar-wrapper" title={`${d.date}: ${unit === 'kg' ? d.kg.toFixed(1) : d.lbs.toFixed(1)} ${unit}`}>
                  <div className="bs-bar" style={{ height: `${heightPct}%` }}></div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="bs-empty">Chart will appear after you log weight.</p>
        )}
      </div>

      <div className="bs-card bs-log-card">
        <div className="bs-toggle">
          <button className={`bs-toggle-btn ${unit === 'kg' ? 'is-active' : ''}`} onClick={() => setUnit('kg')}>kg</button>
          <button className={`bs-toggle-btn ${unit === 'lbs' ? 'is-active' : ''}`} onClick={() => setUnit('lbs')}>lbs</button>
        </div>
        <form className="bs-log-form" onSubmit={handleLog}>
          <input 
            type="number" 
            step="0.1" 
            placeholder={`Weight in ${unit}`} 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            className="bs-input"
          />
          <button type="submit" className="bs-submit-btn">LOG ✓</button>
        </form>
      </div>
    </div>
  );
}

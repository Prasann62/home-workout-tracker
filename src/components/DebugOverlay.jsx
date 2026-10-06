// ============================================================
// DEBUG OVERLAY COMPONENT
// Real-time live pose metrics, angles, FPS, latency & transition logs
// ============================================================
import React from 'react';

export default function DebugOverlay({
  isVisible,
  onToggle,
  elbowAngle,
  kneeAngle,
  phase = 'idle',
  inferenceTimeMs = 0,
  fps = 0,
  landmarks = null,
  transitionLogs = []
}) {
  if (!isVisible) {
    return (
      <button 
        className="debug-toggle-btn"
        onClick={onToggle}
        title="Toggle Real-Time Pose Debug Mode"
        style={{
          position: 'fixed',
          top: '12px',
          right: '12px',
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.85)',
          color: '#00e5ff',
          border: '1px solid #00e5ff',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: '700',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(0,229,255,0.2)'
        }}
      >
        🐛 DEBUG
      </button>
    );
  }

  // Key joint indices for visibility scores
  const getVis = (idx) => {
    if (!landmarks || !landmarks[idx]) return '0.00';
    return (landmarks[idx].visibility || 0).toFixed(2);
  };

  return (
    <div
      className="debug-overlay-container"
      style={{
        position: 'fixed',
        top: '12px',
        right: '12px',
        width: '300px',
        maxHeight: '85vh',
        overflowY: 'auto',
        zIndex: 9999,
        background: 'rgba(10, 15, 26, 0.92)',
        color: '#f8fafc',
        border: '1px solid rgba(0, 229, 255, 0.4)',
        borderRadius: '12px',
        padding: '14px',
        fontSize: '11px',
        fontFamily: 'monospace',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: '6px' }}>
        <span style={{ color: '#00e5ff', fontWeight: 'bold', fontSize: '12px' }}>🐛 MEDIAPIPE DEBUG MODE</span>
        <button
          onClick={onToggle}
          style={{ background: 'none', border: 'none', color: '#ff3814', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ✕ CLOSE
        </button>
      </div>

      {/* Frame Rate & Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '6px' }}>
          <div style={{ color: '#94a3b8' }}>INFERENCE LATENCY</div>
          <div style={{ color: inferenceTimeMs > 40 ? '#ffb703' : '#38ef7d', fontWeight: 'bold', fontSize: '13px' }}>
            {inferenceTimeMs.toFixed(1)} ms
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '6px' }}>
          <div style={{ color: '#94a3b8' }}>CAMERA FPS</div>
          <div style={{ color: '#00e5ff', fontWeight: 'bold', fontSize: '13px' }}>{fps.toFixed(0)} FPS</div>
        </div>
      </div>

      {/* Real-time Live Angles */}
      <div style={{ marginBottom: '10px', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px' }}>
        <div style={{ color: '#94a3b8', marginBottom: '4px' }}>LIVE JOINT ANGLES</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Elbow Angle:</span>
          <strong style={{ color: '#00e5ff' }}>{elbowAngle !== null && elbowAngle !== undefined ? `${elbowAngle}°` : 'N/A'}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Knee Angle:</span>
          <strong style={{ color: '#00e5ff' }}>{kneeAngle !== null && kneeAngle !== undefined ? `${kneeAngle}°` : 'N/A'}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span>STATE PHASE:</span>
          <strong style={{ color: '#ffb703', textTransform: 'uppercase' }}>{phase}</strong>
        </div>
      </div>

      {/* Key Joint Visibility Scores */}
      <div style={{ marginBottom: '10px', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px' }}>
        <div style={{ color: '#94a3b8', marginBottom: '4px' }}>LANDMARK VISIBILITY (THRESHOLD 0.6)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          <div>Shoulder: <span style={{ color: getVis(11) >= 0.6 ? '#38ef7d' : '#ff3814' }}>{getVis(11)}</span></div>
          <div>Elbow: <span style={{ color: getVis(13) >= 0.6 ? '#38ef7d' : '#ff3814' }}>{getVis(13)}</span></div>
          <div>Wrist: <span style={{ color: getVis(15) >= 0.6 ? '#38ef7d' : '#ff3814' }}>{getVis(15)}</span></div>
          <div>Hip: <span style={{ color: getVis(23) >= 0.6 ? '#38ef7d' : '#ff3814' }}>{getVis(23)}</span></div>
          <div>Knee: <span style={{ color: getVis(25) >= 0.6 ? '#38ef7d' : '#ff3814' }}>{getVis(25)}</span></div>
          <div>Ankle: <span style={{ color: getVis(27) >= 0.6 ? '#38ef7d' : '#ff3814' }}>{getVis(27)}</span></div>
        </div>
      </div>

      {/* Rolling State Transition Log (Last 10) */}
      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px' }}>
        <div style={{ color: '#94a3b8', marginBottom: '4px' }}>TRANSITION LOG (LAST 10)</div>
        {transitionLogs.length === 0 ? (
          <div style={{ color: '#64748b', italic: true }}>No transitions logged yet</div>
        ) : (
          <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
            {transitionLogs.slice(-10).map((log, i) => (
              <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '2px 0', fontSize: '10px' }}>
                <span style={{ color: '#64748b' }}>{log.time}</span> <span style={{ color: '#00e5ff' }}>{log.from}</span> → <span style={{ color: '#ffb703' }}>{log.to}</span> ({log.detail})
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

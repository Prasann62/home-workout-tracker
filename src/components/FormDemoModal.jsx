// ============================================================
// FORM DEMO MODAL — Minimal Form Guide
// ============================================================
import React, { useState } from 'react';
import { FORM_DEMOS } from '../data/formDemos.js';

export default function FormDemoModal({ exerciseId, onStart, onSkip }) {
  const demo = FORM_DEMOS[exerciseId];
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError]   = useState(false);

  if (!demo) { onStart?.(); return null; }

  const ytSrc = `https://www.youtube-nocookie.com/embed/${demo.videoId}?rel=0&modestbranding=1&color=white`;
  const ytWatch = `https://www.youtube.com/watch?v=${demo.videoId}`;

  return (
    <div className="formdemo-overlay" role="dialog" aria-modal="true">
      <div className="formdemo-modal">
        {/* Header */}
        <div className="formdemo-header">
          <div>
            <span className="formdemo-eyebrow">FORM GUIDE</span>
            <div className="formdemo-title-row">
              <span className="formdemo-emoji">{demo.emoji}</span>
              <h2 className="formdemo-title">{demo.name}</h2>
            </div>
          </div>
          <button className="formdemo-skip-btn" onClick={onSkip}>Skip →</button>
        </div>

        {/* Muscles */}
        <div className="formdemo-muscles">
          {demo.muscles.map(m => (
            <span key={m} className="formdemo-muscle-chip">{m}</span>
          ))}
          <span className="formdemo-difficulty-chip">{demo.difficulty}</span>
        </div>

        {/* YouTube Video */}
        <div className="formdemo-video-wrap">
          {!videoError ? (
            <>
              {!videoLoaded && (
                <div className="formdemo-video-skeleton">
                  <div className="video-skeleton-icon">▶</div>
                  <div className="video-skeleton-text">Loading tutorial…</div>
                </div>
              )}
              <iframe
                className={`formdemo-iframe ${videoLoaded ? 'is-loaded' : ''}`}
                src={ytSrc}
                title={`${demo.name} tutorial`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setVideoLoaded(true)}
                onError={() => setVideoError(true)}
              />
            </>
          ) : (
            <div className="formdemo-video-fallback">
              <span className="fallback-icon">🎬</span>
              <a href={ytWatch} target="_blank" rel="noopener noreferrer" className="fallback-yt-link">
                ▶ Watch on YouTube
              </a>
            </div>
          )}
        </div>

        {/* Key Form Points */}
        <div className="formdemo-section">
          <div className="formdemo-section-label">KEY FORM POINTS</div>
          <ol className="formdemo-keypoints">
            {demo.keyPoints.map((pt, i) => (
              <li key={i} className="formdemo-keypoint">
                <span className="kp-num">{i + 1}</span>
                <span className="kp-text">{pt}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Start Button */}
        <button className="formdemo-start-btn" onClick={onStart}>
          <span>Ready — Start Workout</span>
          <span className="start-btn-arrow">→</span>
        </button>
      </div>
    </div>
  );
}

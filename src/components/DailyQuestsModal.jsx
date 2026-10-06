// ============================================================
// DAILY QUESTS & XP LEVEL MODAL
// ============================================================
import React, { useState, useEffect } from 'react';
import { getGamificationData, getLevelInfo, claimQuestReward } from '../utils/gamificationEngine.js';

export default function DailyQuestsModal({ onClose }) {
  const [data, setData] = useState(getGamificationData());
  const [rewardClaimedAlert, setRewardClaimedAlert] = useState(null);

  useEffect(() => {
    setData(getGamificationData());
  }, []);

  const levelInfo = getLevelInfo(data.totalXP);

  const handleClaim = (questId) => {
    const res = claimQuestReward(questId);
    if (res) {
      setData(getGamificationData());
      setRewardClaimedAlert(`+${res.earnedXP} XP Earned! ${res.leveledUp ? '🎉 LEVEL UP!' : ''}`);
      setTimeout(() => setRewardClaimedAlert(null), 3000);
    }
  };

  return (
    <div className="quest-modal-overlay" onClick={onClose}>
      <div className="quest-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="quest-modal-header">
          <div>
            <h2 className="quest-modal-title">DAILY QUESTS & RANK</h2>
            <p className="quest-modal-subtitle">Earn XP, level up, and unlock athlete ranks</p>
          </div>
          <button className="quest-close-btn" onClick={onClose}>✕</button>
        </header>

        {/* Reward Alert Toast */}
        {rewardClaimedAlert && (
          <div className="quest-toast-alert">
            {rewardClaimedAlert}
          </div>
        )}

        {/* Level Status Card */}
        <div className="quest-level-card" style={{ borderColor: levelInfo.rankColor }}>
          <div className="quest-level-header">
            <span className="quest-rank-badge" style={{ background: `${levelInfo.rankColor}22`, color: levelInfo.rankColor }}>
              {levelInfo.rankEmoji} {levelInfo.rankName}
            </span>
            <span className="quest-level-number">LEVEL {levelInfo.level}</span>
          </div>

          <div className="quest-xp-bar-container">
            <div
              className="quest-xp-bar-fill"
              style={{ width: `${levelInfo.pct}%`, background: levelInfo.rankColor }}
            />
          </div>

          <div className="quest-xp-stats">
            <span>{levelInfo.currentLevelXP} / {levelInfo.maxLevelXP} XP</span>
            <span>Total XP: {data.totalXP}</span>
          </div>
        </div>

        {/* Quests List */}
        <h3 className="quest-section-heading">TODAY'S QUESTS</h3>
        <div className="quest-list">
          {data.quests.map((q) => {
            const isClaimed = !!data.claimedQuests[q.id];
            const isCompleted = (q.progress || 0) >= q.target;
            const pct = Math.min(100, Math.round(((q.progress || 0) / q.target) * 100));

            return (
              <div key={q.id} className={`quest-card ${isClaimed ? 'claimed' : isCompleted ? 'ready' : ''}`}>
                <div className="quest-card-top">
                  <div className="quest-info">
                    <span className="quest-icon">{q.icon}</span>
                    <div>
                      <h4 className="quest-card-title">{q.title}</h4>
                      <p className="quest-card-desc">{q.desc}</p>
                    </div>
                  </div>
                  <span className="quest-reward-pill">+{q.xpReward} XP</span>
                </div>

                <div className="quest-progress-row">
                  <div className="quest-mini-bar">
                    <div className="quest-mini-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="quest-progress-text">{q.progress || 0} / {q.target}</span>
                </div>

                {/* Action button */}
                <div className="quest-card-action">
                  {isClaimed ? (
                    <span className="quest-status-done">✓ CLAIMED</span>
                  ) : isCompleted ? (
                    <button className="quest-claim-btn" onClick={() => handleClaim(q.id)}>
                      CLAIM +{q.xpReward} XP
                    </button>
                  ) : (
                    <span className="quest-status-locked">IN PROGRESS ({pct}%)</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

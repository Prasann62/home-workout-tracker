// ============================================================
// GAMIFICATION ENGINE — XP, Leveling, Ranks & Daily Quests
// ============================================================

const STORAGE_KEY = 'ila_gamification_data';

const RANKS = [
  { minLevel: 1,  name: 'Iron Apprentice', emoji: '⚔️', color: '#9e9e9e' },
  { minLevel: 4,  name: 'Bronze Athlete',   emoji: '🛡️', color: '#cd7f32' },
  { minLevel: 8,  name: 'Silver Centurion', emoji: '⚔️', color: '#c0c0c0' },
  { minLevel: 13, name: 'Gold Titan',       emoji: '👑', color: '#ffd700' },
  { minLevel: 21, name: 'Diamond Legend',   emoji: '💎', color: '#00e5ff' },
];

/**
 * Get gamification data from localStorage or initial state
 */
export function getGamificationData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // Ensure daily quests are refreshed if date changed
      return refreshDailyQuestsIfNeeded(data);
    }
  } catch (e) {}

  const initialData = {
    totalXP: 0,
    claimedQuests: {},
    questDate: getTodayDateString(),
    quests: generateDailyQuests(),
  };
  saveGamificationData(initialData);
  return initialData;
}

/**
 * Save gamification data
 */
export function saveGamificationData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
}

/**
 * Calculate Level info from Total XP
 * Formula: Each level requires 500 XP
 */
export function getLevelInfo(totalXP = 0) {
  const level = Math.floor(totalXP / 500) + 1;
  const currentLevelXP = totalXP % 500;
  const maxLevelXP = 500;
  const pct = Math.min(100, Math.round((currentLevelXP / maxLevelXP) * 100));

  // Determine Rank
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (level >= r.minLevel) rank = r;
  }

  return {
    level,
    currentLevelXP,
    maxLevelXP,
    pct,
    rankName: rank.name,
    rankEmoji: rank.emoji,
    rankColor: rank.color,
  };
}

/**
 * Award XP to player and check for level-ups
 */
export function awardXP(amount, reason = 'Workout') {
  if (amount <= 0) return { newTotalXP: 0, prevLevel: 1, newLevel: 1, leveledUp: false };

  const data = getGamificationData();
  const prevLevel = getLevelInfo(data.totalXP).level;

  data.totalXP += amount;
  saveGamificationData(data);

  const newLevel = getLevelInfo(data.totalXP).level;
  const leveledUp = newLevel > prevLevel;

  return {
    earnedXP: amount,
    newTotalXP: data.totalXP,
    prevLevel,
    newLevel,
    leveledUp,
    reason,
  };
}

/**
 * Award XP for completing a workout session
 */
export function calculateWorkoutXP(session) {
  if (!session) return 0;
  const { reps = 0, isPlank = false, plankSeconds = 0, durationSeconds = 0, isPersonalBest = false } = session;

  let xp = 100; // Base completion bonus

  if (isPlank) {
    xp += Math.round((plankSeconds || 0) * 2); // 2 XP per plank sec
  } else {
    xp += (reps || 0) * 10; // 10 XP per rep
  }

  if (isPersonalBest) {
    xp += 250; // PR Bonus
  }

  if (durationSeconds > 300) {
    xp += 50; // Endurance bonus for 5+ min
  }

  return xp;
}

/**
 * Check & update quest progress based on workout activity
 */
export function updateQuestProgress(session) {
  if (!session) return;
  const data = getGamificationData();
  const today = getTodayDateString();

  if (data.questDate !== today) {
    data.questDate = today;
    data.quests = generateDailyQuests();
    data.claimedQuests = {};
  }

  const { reps = 0, isPlank = false, plankSeconds = 0 } = session;
  const sessionReps = isPlank ? Math.round(plankSeconds / 2) : reps;

  let updated = false;
  data.quests.forEach(q => {
    if (data.claimedQuests[q.id]) return;

    if (q.type === 'reps') {
      q.progress = Math.min(q.target, (q.progress || 0) + sessionReps);
      updated = true;
    } else if (q.type === 'workout') {
      q.progress = Math.min(q.target, (q.progress || 0) + 1);
      updated = true;
    }
  });

  if (updated) {
    saveGamificationData(data);
  }
}

/**
 * Claim quest reward
 */
export function claimQuestReward(questId) {
  const data = getGamificationData();
  const quest = data.quests.find(q => q.id === questId);

  if (!quest || data.claimedQuests[questId]) return null;
  if ((quest.progress || 0) < quest.target) return null;

  data.claimedQuests[questId] = true;
  saveGamificationData(data);

  return awardXP(quest.xpReward, `Quest: ${quest.title}`);
}

// ── Private Helpers ──────────────────────────────────────────

function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

function refreshDailyQuestsIfNeeded(data) {
  const today = getTodayDateString();
  if (data.questDate !== today) {
    data.questDate = today;
    data.quests = generateDailyQuests();
    data.claimedQuests = {};
    saveGamificationData(data);
  }
  return data;
}

function generateDailyQuests() {
  return [
    {
      id: 'q_daily_reps',
      title: 'Rep Master',
      desc: 'Complete 30 total reps in daily workouts',
      type: 'reps',
      target: 30,
      progress: 0,
      xpReward: 150,
      icon: '💪',
    },
    {
      id: 'q_daily_workout',
      title: 'Consistency Crusher',
      desc: 'Complete 1 full workout session today',
      type: 'workout',
      target: 1,
      progress: 0,
      xpReward: 200,
      icon: '🔥',
    },
    {
      id: 'q_daily_endurance',
      title: 'Iron Will',
      desc: 'Reach 60 total reps or 120s plank today',
      type: 'reps',
      target: 60,
      progress: 0,
      xpReward: 300,
      icon: '🛡️',
    },
  ];
}

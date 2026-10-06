// ============================================================
// HISTORY TRACKER
// Manages local persistence for:
//  - All-Time Personal Records (PRs) per exercise
//  - Lifetime totals (total reps, total workouts, total time)
//  - Recent workout history log
// ============================================================
import { Storage } from './storage.js';
import { estimateCalories } from './calorieUtils.js';
import { calculateWorkoutXP, awardXP, updateQuestProgress } from './gamificationEngine.js';

/**
 * Get all personal records.
 * @returns {Record<string, { record: number, date: string, isPlank?: boolean }>}
 */
export function getPersonalRecords() {
  return Storage.getPersonalRecords();
}

/**
 * Get overall lifetime totals.
 */
export function getLifetimeTotals() {
  return Storage.getLifetimeTotals();
}

/**
 * Get recent session history (last 100).
 */
export function getWorkoutHistory() {
  return Storage.getWorkoutHistory();
}

/**
 * Log a completed workout session and update PRs + totals.
 * @param {Object} session - { exercise, reps, durationSeconds, isPlank, plankSeconds }
 * @returns {{ isNewPR: boolean, prevPR: number, currentRecord: number }}
 */
export function saveWorkoutSession(session) {
  if (!session) return { isNewPR: false, prevPR: 0, currentRecord: 0 };

  const { exercise, reps, durationSeconds, isPlank, plankSeconds } = session;
  const score = isPlank ? Math.round(plankSeconds || 0) : (reps || 0);

  if (score <= 0 && durationSeconds < 5) {
    return { isNewPR: false, prevPR: 0, currentRecord: 0 };
  }

  const now = new Date();
  // Use ISO date format YYYY-MM-DD so ActivityCalendar / HomeDashboard can parse it
  const isoDate = now.toISOString().split('T')[0];

  // 1. Update PRs
  const prs = getPersonalRecords();
  const prevPR = prs[exercise]?.record || 0;
  let isNewPR = false;

  if (score > prevPR) {
    isNewPR = true;
    prs[exercise] = {
      record: score,
      date: isoDate,
      isPlank,
    };
    try {
      Storage.savePersonalRecords(prs);
    } catch (e) {}
  }

  // 2. Update Lifetime Totals
  const totals = getLifetimeTotals();
  totals.totalWorkouts += 1;
  totals.totalReps += isPlank ? 0 : score;
  totals.totalSeconds += durationSeconds || 0;
  try {
    Storage.saveLifetimeTotals(totals);
  } catch (e) {}

  // 3. Append to History with ALL fields that UI components read
  const caloriesEstimate = estimateCalories(exercise, durationSeconds);
  const history = getWorkoutHistory();
  const newEntry = {
    id: Date.now(),
    exercise,
    reps: isPlank ? 0 : score,       // WorkoutHistory.jsx reads h.reps
    plankSeconds: isPlank ? score : 0, // WorkoutHistory.jsx reads h.plankSeconds
    isPlank,
    durationSeconds,
    date: isoDate,                     // ISO format for ActivityCalendar
    timestamp: now.getTime(),
    isPersonalBest: isNewPR,           // WorkoutHistory.jsx reads h.isPersonalBest
    caloriesEstimate,                  // WorkoutHistory.jsx reads h.caloriesEstimate
  };

  history.unshift(newEntry);
  if (history.length > 100) history.pop();
  try {
    Storage.saveWorkoutHistory(history);
  } catch (e) {}

  // 4. Award Gamification XP & Update Quest Progress
  let xpResult = { earnedXP: 0, leveledUp: false, newLevel: 1 };
  try {
    const earnedXP = calculateWorkoutXP(newEntry);
    xpResult = awardXP(earnedXP, `Completed ${exercise}`);
    updateQuestProgress(newEntry);
  } catch (e) {}

  return {
    isNewPR,
    prevPR,
    currentRecord: isNewPR ? score : prevPR,
    xpEarned: xpResult.earnedXP || 0,
    leveledUp: xpResult.leveledUp || false,
    newLevel: xpResult.newLevel || 1,
  };
}

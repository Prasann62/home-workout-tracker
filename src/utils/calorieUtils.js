// ============================================================
// CALORIE UTILITIES — rough MET-based estimation
// ============================================================
import { MET, DEFAULT_WEIGHT_KG } from '../constants.js';

/**
 * Estimate calories burned for a session.
 * Formula: Calories = MET × weight(kg) × duration(hours)
 * This is a rough estimate — actual values vary by individual.
 *
 * @param {string} exerciseKey - key matching MET table (e.g. 'pushup')
 * @param {number} durationSeconds - total session duration
 * @param {number} [weightKg] - user body weight in kg
 * @returns {number} estimated calories (kcal), rounded to 1 decimal
 */
export function estimateCalories(exerciseKey, durationSeconds, weightKg = DEFAULT_WEIGHT_KG) {
  const met = MET[exerciseKey] ?? 4.0;
  const hours = durationSeconds / 3600;
  return Math.round(met * weightKg * hours * 10) / 10;
}

/**
 * Format seconds as MM:SS string.
 */
export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

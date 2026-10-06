const STORAGE_KEYS = {
  PRS: 'repai_personal_records',
  HISTORY: 'repai_workout_history',
  TOTALS: 'repai_lifetime_totals',
};

export function getPersonalRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function getLifetimeTotals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TOTALS);
    return raw ? JSON.parse(raw) : { totalWorkouts: 0, totalReps: 0, totalSeconds: 0 };
  } catch {
    return { totalWorkouts: 0, totalReps: 0, totalSeconds: 0 };
  }
}

export function getWorkoutHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWorkoutSession(session) {
  if (!session) return { isNewPR: false, prevPR: 0, currentRecord: 0 };
  const { exercise, reps, durationSeconds, isPlank, plankSeconds } = session;
  const score = isPlank ? Math.round(plankSeconds || 0) : reps || 0;
  if (score <= 0 && durationSeconds < 5) return { isNewPR: false, prevPR: 0, currentRecord: 0 };

  const now = new Date();
  const dateLabel = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  // Update PRs
  const prs = getPersonalRecords();
  const prevPR = prs[exercise]?.record || 0;
  let isNewPR = false;
  if (score > prevPR) {
    isNewPR = true;
    prs[exercise] = { record: score, date: dateLabel, isPlank };
    try { localStorage.setItem(STORAGE_KEYS.PRS, JSON.stringify(prs)); } catch {}
  }

  // Update totals
  const totals = getLifetimeTotals();
  totals.totalWorkouts += 1;
  totals.totalReps += isPlank ? 0 : score;
  totals.totalSeconds += durationSeconds || 0;
  try { localStorage.setItem(STORAGE_KEYS.TOTALS, JSON.stringify(totals)); } catch {}

  // Update history
  const history = getWorkoutHistory();
  const entry = {
    id: Date.now(),
    exercise,
    score,
    isPlank,
    durationSeconds,
    date: dateLabel,
    timestamp: now.getTime(),
    isPR: isNewPR,
  };
  history.unshift(entry);
  if (history.length > 30) history.pop();
  try { localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history)); } catch {}

  return { isNewPR, prevPR, currentRecord: isNewPR ? score : prevPR };
}

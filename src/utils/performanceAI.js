// ============================================================
// PERFORMANCE AI COACH — Analyze history, generate new plan
//
// Reads from historyTracker.js and the user's current plan.
// Detects performance trends and generates adaptive recommendations.
// ============================================================
import { Storage } from './storage.js';

const KEY = 'ila_perf_history';

// ── Save a completed session result ──────────────────────────
export function recordSessionResult({ exerciseId, targetReps, actualReps, sets, date }) {
  const history = loadPerfHistory();
  if (!history[exerciseId]) history[exerciseId] = [];
  history[exerciseId].push({
    date: date || new Date().toISOString().slice(0, 10),
    targetReps,
    actualReps,
    sets,
    pct: targetReps > 0 ? Math.round((actualReps / targetReps) * 100) : 100,
  });
  // Keep last 10 entries per exercise
  if (history[exerciseId].length > 10) history[exerciseId].shift();
  savePerfHistory(history);
}

function loadPerfHistory() {
  return Storage.getPerformanceHistory();
}
function savePerfHistory(h) {
  Storage.savePerformanceHistory(h);
}

// ── Analyse performance and return recommendations ────────────
/**
 * Analyze the last N sessions for an exercise and return a coaching verdict.
 * @param {string} exerciseId
 * @returns {{ verdict: 'increase'|'hold'|'decrease'|'new', msg: string, newReps: number|null }}
 */
export function analyzeExercise(exerciseId, currentReps) {
  const history = loadPerfHistory();
  const entries = (history[exerciseId] || []).slice(-5); // last 5 sessions

  if (entries.length < 2) {
    return {
      verdict: 'new',
      msg: 'Keep going! Need 2+ sessions to generate recommendations.',
      newReps: null,
    };
  }

  const avg = entries.reduce((s, e) => s + e.pct, 0) / entries.length;
  const lastPct = entries[entries.length - 1].pct;

  if (avg >= 100 && lastPct >= 100) {
    // Consistently hitting target — increase load
    const bump = Math.max(1, Math.round(currentReps * 0.1));
    return {
      verdict: 'increase',
      msg: `You're crushing it! 🔥 Average ${Math.round(avg)}% of target. Time to level up — add ${bump} more reps.`,
      newReps: currentReps + bump,
    };
  } else if (avg >= 80) {
    // Good progress — hold
    return {
      verdict: 'hold',
      msg: `Great consistency! ${Math.round(avg)}% average. Stay at this level one more session, then increase.`,
      newReps: null,
    };
  } else if (avg < 60) {
    // Struggling — decrease
    const cut = Math.max(1, Math.round(currentReps * 0.15));
    return {
      verdict: 'decrease',
      msg: `${Math.round(avg)}% average — let's dial back slightly. Mastering form now pays off later.`,
      newReps: Math.max(1, currentReps - cut),
    };
  }

  return {
    verdict: 'hold',
    msg: `${Math.round(avg)}% average. Getting there — keep this target for now.`,
    newReps: null,
  };
}

// ── Generate a full adapted plan from current performance ──────
/**
 * Given a custom plan, return a new plan with reps adapted per exercise.
 */
export function generateAdaptedPlan(currentPlan) {
  if (!currentPlan || !currentPlan.days) return null;

  const adaptedDays = currentPlan.days.map(day => ({
    ...day,
    exercises: day.exercises.map(ex => {
      const currentReps = typeof ex.reps === 'number' ? ex.reps : parseInt(ex.reps) || 10;
      const analysis = analyzeExercise(ex.key, currentReps);
      return {
        ...ex,
        reps: analysis.newReps !== null ? analysis.newReps : ex.reps,
        _coaching: analysis,
      };
    }),
  }));

  return {
    ...currentPlan,
    planName: currentPlan.planName + ' (AI Adapted)',
    days: adaptedDays,
    _adaptedAt: new Date().toISOString(),
  };
}

// ── Get overall performance score ─────────────────────────────
export function getOverallScore() {
  const history = loadPerfHistory();
  const allEntries = Object.values(history).flat();
  if (allEntries.length === 0) return null;

  const recent = allEntries.slice(-20);
  const avg = recent.reduce((s, e) => s + e.pct, 0) / recent.length;
  const streak = getCompletionStreak();

  return {
    avgPct: Math.round(avg),
    sessions: allEntries.length,
    streak,
    level: avg >= 100 ? 'Elite' : avg >= 85 ? 'Advanced' : avg >= 70 ? 'Intermediate' : 'Building',
  };
}

function getCompletionStreak() {
  try {
    const history = loadPerfHistory();
    const allDates = [...new Set(Object.values(history).flat().map(e => e.date))].sort().reverse();
    let streak = 0;
    let checkDate = new Date();
    for (const d of allDates) {
      const diff = Math.round((checkDate - new Date(d)) / 86400000);
      if (diff <= 1) { streak++; checkDate = new Date(d); }
      else break;
    }
    return streak;
  } catch { return 0; }
}

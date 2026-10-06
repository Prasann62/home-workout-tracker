// ============================================================
// REPAI CLIENT BACKEND SYNC UTILITY
// Offline-first sync between localStorage and RepAI Express backend
// ============================================================
import { Storage } from './storage.js';

const BACKEND_URL_KEY = 'ila_backend_url';
const API_KEY_KEY = 'ila_backend_api_key';
const LAST_SYNC_KEY = 'ila_last_synced_at';

export function getBackendConfig() {
  const url = localStorage.getItem(BACKEND_URL_KEY) || '';
  const apiKey = localStorage.getItem(API_KEY_KEY) || '';
  const lastSyncedAt = localStorage.getItem(LAST_SYNC_KEY) || null;
  return { url, apiKey, lastSyncedAt };
}

export function saveBackendConfig(url, apiKey) {
  // Strip trailing slashes
  const cleanUrl = (url || '').trim().replace(/\/+$/, '');
  localStorage.setItem(BACKEND_URL_KEY, cleanUrl);
  localStorage.setItem(API_KEY_KEY, (apiKey || '').trim());
}

/**
 * Check backend connection health
 */
export async function checkBackendHealth() {
  const { url } = getBackendConfig();
  if (!url) return { ok: false, message: 'Backend URL not configured' };

  try {
    const res = await fetch(`${url}/health`, { method: 'GET' });
    if (!res.ok) return { ok: false, message: `Server returned HTTP ${res.status}` };
    const data = await res.json();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, message: err.message || 'Network error reaching backend' };
  }
}

/**
 * Perform offline-first batch sync with backend
 */
export async function syncWithBackend() {
  const { url, apiKey, lastSyncedAt } = getBackendConfig();
  if (!url || !apiKey) {
    return { success: false, error: 'Backend URL or API key is not configured.' };
  }

  try {
    // 1. Gather local offline data from Storage / localStorage
    const localHistory = Storage.getWorkoutHistory() || [];
    const localWeight = Storage.getWeightHistory() || [];

    // Convert local history into backend-compatible format
    const workouts = [];
    const sets = [];

    localHistory.forEach((session, index) => {
      const sessionId = session.id || `session_${session.date}_${index}`;
      const startedAt = session.date ? new Date(session.date).toISOString() : new Date().toISOString();
      const endedAt = session.durationSeconds 
        ? new Date(new Date(startedAt).getTime() + session.durationSeconds * 1000).toISOString()
        : startedAt;

      workouts.push({
        id: sessionId,
        startedAt,
        endedAt,
        notes: session.notes || null,
        createdAt: startedAt,
        updatedAt: endedAt
      });

      if (session.exercise) {
        sets.push({
          id: `set_${sessionId}_0`,
          workoutSessionId: sessionId,
          exerciseId: session.exercise,
          reps: session.reps || 0,
          weightUsed: session.weightUsed || null,
          durationSeconds: session.durationSeconds || session.plankSeconds || null,
          orderIndex: 0,
          createdAt: startedAt,
          updatedAt: endedAt
        });
      }
    });

    const bodyweight = localWeight.map((w, i) => ({
      id: `bw_${w.date}_${i}`,
      weightValue: w.kg || w.weightValue,
      unit: w.unit || 'kg',
      loggedAt: w.date ? new Date(w.date).toISOString() : new Date().toISOString(),
      createdAt: w.date ? new Date(w.date).toISOString() : new Date().toISOString()
    }));

    // 2. Post batch payload to /sync/batch
    const response = await fetch(`${url}/sync/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        workouts,
        sets,
        bodyweight,
        goals: [],
        lastSyncedAt
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Sync failed (HTTP ${response.status}): ${errorText}` };
    }

    const result = await response.json();

    // 3. Update lastSyncedAt timestamp
    if (result.syncedAt) {
      localStorage.setItem(LAST_SYNC_KEY, result.syncedAt);
    }

    return {
      success: true,
      syncedAt: result.syncedAt,
      syncedCounts: {
        workouts: workouts.length,
        sets: sets.length,
        bodyweight: bodyweight.length
      }
    };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to connect to backend server' };
  }
}

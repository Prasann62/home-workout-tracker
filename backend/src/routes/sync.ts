import { Router, Request, Response } from 'express';
import { db } from '../db/database';

export const syncRouter = Router();

// POST /sync/batch → offline-first batch upsert & pull
syncRouter.post('/batch', (req: Request, res: Response) => {
  try {
    const { workouts = [], sets = [], bodyweight = [], goals = [], lastSyncedAt } = req.body;
    const now = new Date().toISOString();

    db.exec('BEGIN TRANSACTION;');
    try {
      // 1. Upsert Workouts
      const workoutStmt = db.prepare(`
        INSERT INTO workout_sessions (id, startedAt, endedAt, notes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          startedAt = excluded.startedAt,
          endedAt = COALESCE(excluded.endedAt, workout_sessions.endedAt),
          notes = COALESCE(excluded.notes, workout_sessions.notes),
          updatedAt = excluded.updatedAt
      `);

      for (const w of workouts) {
        if (!w.id || !w.startedAt) continue;
        workoutStmt.run(w.id, w.startedAt, w.endedAt || null, w.notes || null, w.createdAt || now, w.updatedAt || now);
      }

      // 2. Upsert Sets
      const setStmt = db.prepare(`
        INSERT INTO set_entries (id, workoutSessionId, exerciseId, reps, weightUsed, durationSeconds, orderIndex, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          reps = excluded.reps,
          weightUsed = excluded.weightUsed,
          durationSeconds = excluded.durationSeconds,
          orderIndex = excluded.orderIndex,
          updatedAt = excluded.updatedAt
      `);

      const exCheck = db.prepare('SELECT id FROM exercises WHERE id = ?');
      const exInsert = db.prepare('INSERT INTO exercises (id, name, category, trackingMethod, createdAt) VALUES (?, ?, ?, ?, ?)');

      for (const s of sets) {
        if (!s.id || !s.workoutSessionId || !s.exerciseId) continue;
        
        if (!exCheck.get(s.exerciseId)) {
          exInsert.run(s.exerciseId, s.exerciseId.replace(/_/g, ' '), 'General', 'manual', now);
        }

        setStmt.run(
          s.id,
          s.workoutSessionId,
          s.exerciseId,
          s.reps || 0,
          s.weightUsed !== undefined ? s.weightUsed : null,
          s.durationSeconds !== undefined ? s.durationSeconds : null,
          s.orderIndex || 0,
          s.createdAt || now,
          s.updatedAt || now
        );
      }

      // 3. Upsert Bodyweight logs
      const bwStmt = db.prepare(`
        INSERT INTO bodyweight_logs (id, weightValue, unit, loggedAt, createdAt)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          weightValue = excluded.weightValue,
          unit = excluded.unit,
          loggedAt = excluded.loggedAt
      `);

      for (const bw of bodyweight) {
        if (!bw.id || bw.weightValue === undefined) continue;
        bwStmt.run(bw.id, bw.weightValue, bw.unit || 'kg', bw.loggedAt || now, bw.createdAt || now);
      }

      // 4. Upsert Goals
      const goalStmt = db.prepare(`
        INSERT INTO goals (id, type, targetValue, targetDate, currentProgress, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          type = excluded.type,
          targetValue = excluded.targetValue,
          targetDate = excluded.targetDate,
          currentProgress = excluded.currentProgress,
          updatedAt = excluded.updatedAt
      `);

      for (const g of goals) {
        if (!g.id || !g.type || g.targetValue === undefined) continue;
        goalStmt.run(g.id, g.type, g.targetValue, g.targetDate || null, g.currentProgress || 0, g.createdAt || now, g.updatedAt || now);
      }

      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    // Pull changes from server since lastSyncedAt
    const sinceFilter = lastSyncedAt ? lastSyncedAt : '1970-01-01T00:00:00.000Z';

    const serverWorkouts = db.prepare('SELECT * FROM workout_sessions WHERE updatedAt >= ? OR createdAt >= ?').all(sinceFilter, sinceFilter);
    const serverSets = db.prepare('SELECT * FROM set_entries WHERE updatedAt >= ? OR createdAt >= ?').all(sinceFilter, sinceFilter);
    const serverBodyweight = db.prepare('SELECT * FROM bodyweight_logs WHERE createdAt >= ?').all(sinceFilter);
    const serverGoals = db.prepare('SELECT * FROM goals WHERE updatedAt >= ? OR createdAt >= ?').all(sinceFilter, sinceFilter);
    const serverExercises = db.prepare('SELECT * FROM exercises').all();

    res.json({
      success: true,
      syncedAt: now,
      data: {
        workouts: serverWorkouts,
        sets: serverSets,
        bodyweight: serverBodyweight,
        goals: serverGoals,
        exercises: serverExercises
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Batch sync failed', details: error.message });
  }
});

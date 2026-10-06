import { Router, Request, Response } from 'express';
import { db } from '../db/database';

export const backupRouter = Router();

// GET /export → dump entire SQLite DB as JSON
backupRouter.get('/export', (req: Request, res: Response) => {
  try {
    const exercises = db.prepare('SELECT * FROM exercises').all();
    const workouts = db.prepare('SELECT * FROM workout_sessions').all();
    const sets = db.prepare('SELECT * FROM set_entries').all();
    const bodyweight = db.prepare('SELECT * FROM bodyweight_logs').all();
    const goals = db.prepare('SELECT * FROM goals').all();

    res.json({
      version: 1,
      appName: 'RepAI Workout Counter',
      exportedAt: new Date().toISOString(),
      counts: {
        exercises: exercises.length,
        workouts: workouts.length,
        sets: sets.length,
        bodyweight: bodyweight.length,
        goals: goals.length
      },
      data: {
        exercises,
        workouts,
        sets,
        bodyweight,
        goals
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Database export failed', details: error.message });
  }
});

// POST /import → restore database from JSON dump
backupRouter.post('/import', (req: Request, res: Response) => {
  try {
    const { data } = req.body;

    if (!data) {
      res.status(400).json({ error: 'Invalid import payload: missing data object' });
      return;
    }

    const { exercises = [], workouts = [], sets = [], bodyweight = [], goals = [] } = data;

    db.exec('BEGIN TRANSACTION;');
    try {
      // Clear existing records
      db.exec('DELETE FROM set_entries;');
      db.exec('DELETE FROM workout_sessions;');
      db.exec('DELETE FROM bodyweight_logs;');
      db.exec('DELETE FROM goals;');
      db.exec('DELETE FROM exercises;');

      // Restore Exercises
      const exStmt = db.prepare('INSERT INTO exercises (id, name, category, trackingMethod, createdAt) VALUES (?, ?, ?, ?, ?)');
      for (const e of exercises) {
        exStmt.run(e.id, e.name, e.category, e.trackingMethod, e.createdAt || new Date().toISOString());
      }

      // Restore Workouts
      const wStmt = db.prepare('INSERT INTO workout_sessions (id, startedAt, endedAt, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)');
      for (const w of workouts) {
        wStmt.run(w.id, w.startedAt, w.endedAt || null, w.notes || null, w.createdAt || new Date().toISOString(), w.updatedAt || new Date().toISOString());
      }

      // Restore Sets
      const sStmt = db.prepare('INSERT INTO set_entries (id, workoutSessionId, exerciseId, reps, weightUsed, durationSeconds, orderIndex, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const s of sets) {
        sStmt.run(s.id, s.workoutSessionId, s.exerciseId, s.reps, s.weightUsed || null, s.durationSeconds || null, s.orderIndex || 0, s.createdAt || new Date().toISOString(), s.updatedAt || new Date().toISOString());
      }

      // Restore Bodyweight
      const bwStmt = db.prepare('INSERT INTO bodyweight_logs (id, weightValue, unit, loggedAt, createdAt) VALUES (?, ?, ?, ?, ?)');
      for (const bw of bodyweight) {
        bwStmt.run(bw.id, bw.weightValue, bw.unit || 'kg', bw.loggedAt, bw.createdAt || new Date().toISOString());
      }

      // Restore Goals
      const gStmt = db.prepare('INSERT INTO goals (id, type, targetValue, targetDate, currentProgress, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
      for (const g of goals) {
        gStmt.run(g.id, g.type, g.targetValue, g.targetDate || null, g.currentProgress || 0, g.createdAt || new Date().toISOString(), g.updatedAt || new Date().toISOString());
      }

      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    res.json({
      success: true,
      message: 'Database restored successfully from JSON backup',
      importedAt: new Date().toISOString(),
      counts: {
        exercises: exercises.length,
        workouts: workouts.length,
        sets: sets.length,
        bodyweight: bodyweight.length,
        goals: goals.length
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Database import failed', details: error.message });
  }
});

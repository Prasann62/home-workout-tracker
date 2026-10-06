import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

export const workoutsRouter = Router();

// POST /workouts → start a workout session
workoutsRouter.post('/', (req: Request, res: Response) => {
  try {
    const { id, startedAt, notes } = req.body;
    const sessionId = id || uuidv4();
    const startTime = startedAt || new Date().toISOString();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO workout_sessions (id, startedAt, endedAt, notes, createdAt, updatedAt)
      VALUES (?, ?, NULL, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        startedAt = excluded.startedAt,
        notes = excluded.notes,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(sessionId, startTime, notes || null, now, now);

    const session = db.prepare('SELECT * FROM workout_sessions WHERE id = ?').get(sessionId as any);
    res.status(201).json(session);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to start workout session', details: error.message });
  }
});

// PATCH /workouts/:id → end a session, update notes
workoutsRouter.patch('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { endedAt, notes } = req.body;
    const now = new Date().toISOString();

    const existing = db.prepare('SELECT * FROM workout_sessions WHERE id = ?').get(id as any);
    if (!existing) {
      res.status(404).json({ error: 'Workout session not found' });
      return;
    }

    const stmt = db.prepare(`
      UPDATE workout_sessions
      SET endedAt = COALESCE(?, endedAt),
          notes = COALESCE(?, notes),
          updatedAt = ?
      WHERE id = ?
    `);

    stmt.run((endedAt || new Date().toISOString()) as any, (notes !== undefined ? notes : null) as any, now as any, id as any);

    const updated = db.prepare('SELECT * FROM workout_sessions WHERE id = ?').get(id as any);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update workout session', details: error.message });
  }
});

// GET /workouts?from=&to= → workout history list
workoutsRouter.get('/', (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;

    let query = 'SELECT * FROM workout_sessions';
    const params: any[] = [];
    const conditions: string[] = [];

    if (from) {
      conditions.push('startedAt >= ?');
      params.push(from);
    }
    if (to) {
      conditions.push('startedAt <= ?');
      params.push(to);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY startedAt DESC';

    const workouts = db.prepare(query).all(...(params as any[]));
    res.json(workouts);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch workout history', details: error.message });
  }
});

// GET /workouts/:id → single workout + its sets
workoutsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const session = db.prepare('SELECT * FROM workout_sessions WHERE id = ?').get(id as any);
    if (!session) {
      res.status(404).json({ error: 'Workout session not found' });
      return;
    }

    const sets = db.prepare(`
      SELECT s.*, e.name as exerciseName, e.category as exerciseCategory, e.trackingMethod
      FROM set_entries s
      LEFT JOIN exercises e ON s.exerciseId = e.id
      WHERE s.workoutSessionId = ?
      ORDER BY s.orderIndex ASC, s.createdAt ASC
    `).all(id as any);

    res.json({
      ...(session as any),
      sets
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch workout details', details: error.message });
  }
});

// POST /workouts/:id/sets → add a set entry
workoutsRouter.post('/:id/sets', (req: Request, res: Response) => {
  try {
    const { id: workoutSessionId } = req.params;
    const { id, exerciseId, reps, weightUsed, durationSeconds, orderIndex } = req.body;

    if (!exerciseId || reps === undefined) {
      res.status(400).json({ error: 'Missing required set parameters: exerciseId, reps' });
      return;
    }

    // Ensure exercise exists or auto-insert basic definition
    const exCheck = db.prepare('SELECT id FROM exercises WHERE id = ?').get(exerciseId as any);
    if (!exCheck) {
      db.prepare(`
        INSERT INTO exercises (id, name, category, trackingMethod, createdAt)
        VALUES (?, ?, ?, ?, ?)
      `).run(exerciseId as any, exerciseId.replace(/_/g, ' ') as any, 'General' as any, 'manual' as any, new Date().toISOString() as any);
    }

    const setObjId = id || uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO set_entries (id, workoutSessionId, exerciseId, reps, weightUsed, durationSeconds, orderIndex, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        reps = excluded.reps,
        weightUsed = excluded.weightUsed,
        durationSeconds = excluded.durationSeconds,
        orderIndex = excluded.orderIndex,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      setObjId as any,
      workoutSessionId as any,
      exerciseId as any,
      reps as any,
      (weightUsed !== undefined ? weightUsed : null) as any,
      (durationSeconds !== undefined ? durationSeconds : null) as any,
      (orderIndex || 0) as any,
      now as any,
      now as any
    );

    const createdSet = db.prepare('SELECT * FROM set_entries WHERE id = ?').get(setObjId as any);
    res.status(201).json(createdSet);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add set entry', details: error.message });
  }
});

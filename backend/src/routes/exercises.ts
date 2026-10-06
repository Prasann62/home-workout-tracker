import { Router, Request, Response } from 'express';
import { db } from '../db/database';

export const exercisesRouter = Router();

// GET /exercises
exercisesRouter.get('/', (req: Request, res: Response) => {
  try {
    const stmt = db.prepare('SELECT * FROM exercises ORDER BY name ASC');
    const exercises = stmt.all();
    res.json(exercises);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch exercises', details: error.message });
  }
});

// POST /exercises
exercisesRouter.post('/', (req: Request, res: Response) => {
  try {
    const { id, name, category, trackingMethod } = req.body;

    if (!name || !category || !trackingMethod) {
      res.status(400).json({ error: 'Missing required fields: name, category, trackingMethod' });
      return;
    }

    const exerciseId = id || name.toLowerCase().replace(/\s+/g, '_');
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO exercises (id, name, category, trackingMethod, createdAt)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        category = excluded.category,
        trackingMethod = excluded.trackingMethod
    `);

    stmt.run(exerciseId as any, name as any, category as any, trackingMethod as any, now as any);

    const created = db.prepare('SELECT * FROM exercises WHERE id = ?').get(exerciseId as any);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save exercise', details: error.message });
  }
});

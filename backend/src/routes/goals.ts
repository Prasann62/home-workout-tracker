import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

export const goalsRouter = Router();

// GET /goals
goalsRouter.get('/', (req: Request, res: Response) => {
  try {
    const goals = db.prepare('SELECT * FROM goals ORDER BY createdAt DESC').all();
    res.json(goals);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch goals', details: error.message });
  }
});

// POST /goals
goalsRouter.post('/', (req: Request, res: Response) => {
  try {
    const { id, type, targetValue, targetDate, currentProgress } = req.body;

    if (!type || targetValue === undefined) {
      res.status(400).json({ error: 'Missing required fields: type, targetValue' });
      return;
    }

    const goalId = id || uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO goals (id, type, targetValue, targetDate, currentProgress, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        type = excluded.type,
        targetValue = excluded.targetValue,
        targetDate = excluded.targetDate,
        currentProgress = excluded.currentProgress,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(goalId as any, type as any, targetValue as any, (targetDate || null) as any, (currentProgress || 0) as any, now as any, now as any);

    const created = db.prepare('SELECT * FROM goals WHERE id = ?').get(goalId as any);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create goal', details: error.message });
  }
});

// PATCH /goals/:id
goalsRouter.patch('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, targetValue, targetDate, currentProgress } = req.body;
    const now = new Date().toISOString();

    const existing = db.prepare('SELECT * FROM goals WHERE id = ?').get(id as any);
    if (!existing) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    const stmt = db.prepare(`
      UPDATE goals
      SET type = COALESCE(?, type),
          targetValue = COALESCE(?, targetValue),
          targetDate = COALESCE(?, targetDate),
          currentProgress = COALESCE(?, currentProgress),
          updatedAt = ?
      WHERE id = ?
    `);

    stmt.run(
      (type !== undefined ? type : null) as any,
      (targetValue !== undefined ? targetValue : null) as any,
      (targetDate !== undefined ? targetDate : null) as any,
      (currentProgress !== undefined ? currentProgress : null) as any,
      now as any,
      id as any
    );

    const updated = db.prepare('SELECT * FROM goals WHERE id = ?').get(id as any);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update goal', details: error.message });
  }
});

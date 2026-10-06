import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

export const bodyweightRouter = Router();

// GET /bodyweight?from=&to=
bodyweightRouter.get('/', (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;

    let query = 'SELECT * FROM bodyweight_logs';
    const params: any[] = [];
    const conditions: string[] = [];

    if (from) {
      conditions.push('loggedAt >= ?');
      params.push(from);
    }
    if (to) {
      conditions.push('loggedAt <= ?');
      params.push(to);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY loggedAt DESC';

    const logs = db.prepare(query).all(...(params as any[]));
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch bodyweight logs', details: error.message });
  }
});

// POST /bodyweight
bodyweightRouter.post('/', (req: Request, res: Response) => {
  try {
    const { id, weightValue, unit, loggedAt } = req.body;

    if (weightValue === undefined) {
      res.status(400).json({ error: 'Missing required field: weightValue' });
      return;
    }

    const logId = id || uuidv4();
    const logTime = loggedAt || new Date().toISOString();
    const logUnit = unit || 'kg';
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO bodyweight_logs (id, weightValue, unit, loggedAt, createdAt)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        weightValue = excluded.weightValue,
        unit = excluded.unit,
        loggedAt = excluded.loggedAt
    `);

    stmt.run(logId as any, weightValue as any, logUnit as any, logTime as any, now as any);

    const created = db.prepare('SELECT * FROM bodyweight_logs WHERE id = ?').get(logId as any);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to log bodyweight', details: error.message });
  }
});

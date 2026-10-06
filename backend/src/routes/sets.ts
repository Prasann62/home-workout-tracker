import { Router, Request, Response } from 'express';
import { db } from '../db/database';

export const setsRouter = Router();

// DELETE /sets/:id → remove a set
setsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM set_entries WHERE id = ?').get(id as any);
    if (!existing) {
      res.status(404).json({ error: 'Set entry not found' });
      return;
    }

    const stmt = db.prepare('DELETE FROM set_entries WHERE id = ?');
    stmt.run(id as any);

    res.json({ success: true, message: `Set ${id} deleted successfully`, deletedSet: existing });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete set entry', details: error.message });
  }
});

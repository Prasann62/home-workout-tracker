import { Router, Request, Response } from 'express';
import { db } from '../db/database';

export const progressRouter = Router();

// GET /progress?exerciseId=&period=week|month|year
progressRouter.get('/', (req: Request, res: Response) => {
  try {
    const { exerciseId, period = 'month' } = req.query;

    let daysToSubtract = 30;
    if (period === 'week') daysToSubtract = 7;
    if (period === 'year') daysToSubtract = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToSubtract);
    const startDateStr = startDate.toISOString();

    let query = `
      SELECT 
        s.exerciseId,
        e.name as exerciseName,
        SUM(s.reps) as totalReps,
        SUM(COALESCE(s.reps * s.weightUsed, 0)) as totalVolume,
        SUM(COALESCE(s.durationSeconds, 0)) as totalDurationSeconds,
        COUNT(DISTINCT s.workoutSessionId) as sessionCount,
        DATE(w.startedAt) as date
      FROM set_entries s
      JOIN workout_sessions w ON s.workoutSessionId = w.id
      LEFT JOIN exercises e ON s.exerciseId = e.id
      WHERE w.startedAt >= ?
    `;

    const params: any[] = [startDateStr];

    if (exerciseId) {
      query += ' AND s.exerciseId = ?';
      params.push(exerciseId);
    }

    query += ' GROUP BY s.exerciseId, DATE(w.startedAt) ORDER BY date ASC';

    const timeline = db.prepare(query).all(...(params as any[]));

    // Compute overall totals
    let totalReps = 0;
    let totalVolume = 0;
    let totalDurationSeconds = 0;

    timeline.forEach((row: any) => {
      totalReps += row.totalReps || 0;
      totalVolume += row.totalVolume || 0;
      totalDurationSeconds += row.totalDurationSeconds || 0;
    });

    res.json({
      period,
      exerciseId: exerciseId || 'all',
      summary: {
        totalReps,
        totalVolume,
        totalDurationSeconds,
        dataPointsCount: timeline.length
      },
      timeline
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to compute progress metrics', details: error.message });
  }
});

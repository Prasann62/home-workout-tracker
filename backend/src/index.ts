import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/schema';
import { authMiddleware } from './middleware/auth';
import { healthRouter } from './routes/health';
import { exercisesRouter } from './routes/exercises';
import { workoutsRouter } from './routes/workouts';
import { setsRouter } from './routes/sets';
import { bodyweightRouter } from './routes/bodyweight';
import { goalsRouter } from './routes/goals';
import { progressRouter } from './routes/progress';
import { syncRouter } from './routes/sync';
import { backupRouter } from './routes/backup';
import { startBackupCron } from './utils/backupScheduler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS & JSON parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize SQLite Database schema & seeds
initDatabase();

// Register Health Route (Unauthenticated)
app.use('/health', healthRouter);

// Register Static API Key Authentication Middleware for all other endpoints
app.use(authMiddleware);

// Feature Routes
app.use('/exercises', exercisesRouter);
app.use('/workouts', workoutsRouter);
app.use('/sets', setsRouter);
app.use('/bodyweight', bodyweightRouter);
app.use('/goals', goalsRouter);
app.use('/progress', progressRouter);
app.use('/sync', syncRouter);
app.use('/', backupRouter);

// Start Automated Daily SQLite Backup Scheduler
if (process.env.AUTO_BACKUP_CRON !== 'false') {
  startBackupCron();
}

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 RepAI Personal Backend Server running on port ${PORT}`);
  console.log(`🔒 Static API Key Auth: ENABLED`);
  console.log(`💾 SQLite Database: ${process.env.DB_PATH || './data/repai.db'}`);
  console.log(`==================================================\n`);
});

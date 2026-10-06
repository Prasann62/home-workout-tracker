import { db } from './database';

export function initDatabase(): void {
  // 1. Exercises table
  db.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      trackingMethod TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  // 2. WorkoutSession table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY,
      startedAt TEXT NOT NULL,
      endedAt TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  // 3. SetEntry table
  db.exec(`
    CREATE TABLE IF NOT EXISTS set_entries (
      id TEXT PRIMARY KEY,
      workoutSessionId TEXT NOT NULL,
      exerciseId TEXT NOT NULL,
      reps INTEGER NOT NULL,
      weightUsed REAL,
      durationSeconds INTEGER,
      orderIndex INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (workoutSessionId) REFERENCES workout_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (exerciseId) REFERENCES exercises(id) ON DELETE CASCADE
    );
  `);

  // 4. BodyWeightLog table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bodyweight_logs (
      id TEXT PRIMARY KEY,
      weightValue REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'kg',
      loggedAt TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  // 5. Goal table
  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      targetValue REAL NOT NULL,
      targetDate TEXT,
      currentProgress REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  // Seed default exercises if table is empty
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM exercises');
  const result = countStmt.get() as { count: number };

  if (result.count === 0) {
    const insertStmt = db.prepare(`
      INSERT INTO exercises (id, name, category, trackingMethod, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);

    const defaultExercises = [
      { id: 'pushup', name: 'Push-Up', category: 'Chest & Arms', trackingMethod: 'camera_pose' },
      { id: 'squat', name: 'Squat', category: 'Legs', trackingMethod: 'camera_pose' },
      { id: 'bicep_curl', name: 'Bicep Curl', category: 'Arms', trackingMethod: 'camera_pose' },
      { id: 'lunge', name: 'Lunge', category: 'Legs', trackingMethod: 'camera_pose' },
      { id: 'situp', name: 'Sit-Up', category: 'Core', trackingMethod: 'camera_pose' },
      { id: 'plank', name: 'Plank Hold', category: 'Core', trackingMethod: 'camera_pose' },
      { id: 'high_knees', name: 'High Knees', category: 'Cardio', trackingMethod: 'camera_pose' },
      { id: 'mountain_climber', name: 'Mountain Climber', category: 'Cardio & Core', trackingMethod: 'camera_pose' },
      { id: 'burpee', name: 'Burpee', category: 'Full Body', trackingMethod: 'camera_pose' },
      { id: 'glute_bridge', name: 'Glute Bridge', category: 'Glutes', trackingMethod: 'camera_pose' },
      { id: 'jumping_jack', name: 'Jumping Jacks', category: 'Cardio', trackingMethod: 'camera_pose' },
      { id: 'jump_rope', name: 'Jump Rope', category: 'Cardio', trackingMethod: 'camera_pose' }
    ];

    const now = new Date().toISOString();
    db.exec('BEGIN TRANSACTION;');
    try {
      for (const ex of defaultExercises) {
        insertStmt.run(ex.id, ex.name, ex.category, ex.trackingMethod, now);
      }
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }
}

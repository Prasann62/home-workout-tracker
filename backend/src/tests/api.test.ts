// ============================================================
// SELF-CONTAINED BACKEND API TEST SUITE
// Tests auth middleware, health check, CRUD, sync & export/import
// ============================================================
import express from 'express';
import cors from 'cors';
import { initDatabase } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { healthRouter } from '../routes/health';
import { exercisesRouter } from '../routes/exercises';
import { workoutsRouter } from '../routes/workouts';
import { setsRouter } from '../routes/sets';
import { bodyweightRouter } from '../routes/bodyweight';
import { goalsRouter } from '../routes/goals';
import { progressRouter } from '../routes/progress';
import { syncRouter } from '../routes/sync';
import { backupRouter } from '../routes/backup';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runTests() {
  console.log('\n==================================================');
  console.log('🧪 RUNNING REPAI PERSONAL BACKEND API TESTS');
  console.log('==================================================\n');

  // Initialize express test app
  const app = express();
  app.use(cors());
  app.use(express.json());

  initDatabase();

  app.use('/health', healthRouter);
  app.use(authMiddleware);
  app.use('/exercises', exercisesRouter);
  app.use('/workouts', workoutsRouter);
  app.use('/sets', setsRouter);
  app.use('/bodyweight', bodyweightRouter);
  app.use('/goals', goalsRouter);
  app.use('/progress', progressRouter);
  app.use('/sync', syncRouter);
  app.use('/', backupRouter);

  const server = app.listen(4099, async () => {
    try {
      const baseUrl = 'http://localhost:4099';
      const validKey = process.env.API_KEY || 'repai_secret_key_change_me';

      // 1. Health check (unauthenticated)
      console.log('--- 1. Health Check Endpoint ---');
      const healthRes = await fetch(`${baseUrl}/health`);
      const healthData = (await healthRes.json()) as any;
      assert(healthRes.status === 200 && healthData.status === 'ok', 'GET /health returns 200 OK without API key');

      // 2. Auth Middleware check
      console.log('\n--- 2. Auth Middleware Verification ---');
      const noAuthRes = await fetch(`${baseUrl}/exercises`);
      assert(noAuthRes.status === 401, 'Request without x-api-key header rejected with 401 Unauthorized');

      const badAuthRes = await fetch(`${baseUrl}/exercises`, { headers: { 'x-api-key': 'wrong_key' } });
      assert(badAuthRes.status === 401, 'Request with invalid API key header rejected with 401 Unauthorized');

      const goodAuthRes = await fetch(`${baseUrl}/exercises`, { headers: { 'x-api-key': validKey } });
      const exercises = (await goodAuthRes.json()) as any;
      assert(goodAuthRes.status === 200 && Array.isArray(exercises), 'Request with valid API key returns 200 OK + exercise list');

      // 3. Workouts & Sets CRUD
      console.log('\n--- 3. Workouts & Sets CRUD ---');
      const testWorkoutId = 'test_session_101';
      const createWRes = await fetch(`${baseUrl}/workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': validKey },
        body: JSON.stringify({ id: testWorkoutId, startedAt: new Date().toISOString(), notes: 'Leg day test' })
      });
      const createdWorkout = (await createWRes.json()) as any;
      assert(createWRes.status === 201 && createdWorkout.id === testWorkoutId, 'POST /workouts starts workout session');

      const addSetRes = await fetch(`${baseUrl}/workouts/${testWorkoutId}/sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': validKey },
        body: JSON.stringify({ id: 'set_1', exerciseId: 'squat', reps: 12, weightUsed: 60 })
      });
      const createdSet = (await addSetRes.json()) as any;
      assert(addSetRes.status === 201 && createdSet.reps === 12, 'POST /workouts/:id/sets adds completed set');

      const patchWRes = await fetch(`${baseUrl}/workouts/${testWorkoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-api-key': validKey },
        body: JSON.stringify({ endedAt: new Date().toISOString(), notes: 'Finished leg day' })
      });
      const patchedWorkout = (await patchWRes.json()) as any;
      assert(patchWRes.status === 200 && patchedWorkout.endedAt !== null, 'PATCH /workouts/:id ends session');

      const getWRes = await fetch(`${baseUrl}/workouts/${testWorkoutId}`, {
        headers: { 'x-api-key': validKey }
      });
      const workoutDetails = (await getWRes.json()) as any;
      assert(getWRes.status === 200 && workoutDetails.sets.length === 1, 'GET /workouts/:id returns workout session + sets array');

      // 4. Delete Set
      console.log('\n--- 4. Set Deletion ---');
      const delSetRes = await fetch(`${baseUrl}/sets/set_1`, {
        method: 'DELETE',
        headers: { 'x-api-key': validKey }
      });
      const delResult = (await delSetRes.json()) as any;
      assert(delSetRes.status === 200 && delResult.success === true, 'DELETE /sets/:id removes set entry');

      // 5. Bodyweight & Goals
      console.log('\n--- 5. Bodyweight & Goals ---');
      const bwRes = await fetch(`${baseUrl}/bodyweight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': validKey },
        body: JSON.stringify({ weightValue: 74.5, unit: 'kg', loggedAt: new Date().toISOString() })
      });
      assert(bwRes.status === 201, 'POST /bodyweight logs weight entry');

      const goalRes = await fetch(`${baseUrl}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': validKey },
        body: JSON.stringify({ type: 'pushups_per_day', targetValue: 50 })
      });
      assert(goalRes.status === 201, 'POST /goals creates goal entry');

      // 6. Offline-First Sync Batch
      console.log('\n--- 6. Offline-First Batch Sync ---');
      const syncRes = await fetch(`${baseUrl}/sync/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': validKey },
        body: JSON.stringify({
          workouts: [{ id: 'sync_w1', startedAt: new Date().toISOString(), notes: 'Synced workout' }],
          sets: [{ id: 'sync_s1', workoutSessionId: 'sync_w1', exerciseId: 'pushup', reps: 25 }],
          bodyweight: [{ id: 'sync_bw1', weightValue: 75.0, unit: 'kg', loggedAt: new Date().toISOString() }],
          goals: []
        })
      });
      const syncData = (await syncRes.json()) as any;
      assert(syncRes.status === 200 && syncData.success === true, 'POST /sync/batch upserts batch payload and returns synced data');

      // 7. Backup Export & Import
      console.log('\n--- 7. Backup Export & Import ---');
      const exportRes = await fetch(`${baseUrl}/export`, {
        headers: { 'x-api-key': validKey }
      });
      const exportData = (await exportRes.json()) as any;
      assert(exportRes.status === 200 && exportData.data.workouts.length > 0, 'GET /export dumps entire SQLite database as JSON');

      const importRes = await fetch(`${baseUrl}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': validKey },
        body: JSON.stringify({ data: exportData.data })
      });
      const importData = (await importRes.json()) as any;
      assert(importRes.status === 200 && importData.success === true, 'POST /import restores database from JSON dump');

      console.log('\n==================================================');
      console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
      console.log('==================================================\n');

      server.close();
      if (failed > 0) process.exit(1);
      else process.exit(0);

    } catch (err: any) {
      console.error('Test Runner Exception:', err);
      server.close();
      process.exit(1);
    }
  });
}

runTests();

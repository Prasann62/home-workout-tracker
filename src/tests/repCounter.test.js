// ============================================================
// REP COUNTER ISOLATED UNIT TESTS
// Pure synthetic mock landmark tests for CI & fast validation
// ============================================================

import { getAngle } from '../utils/poseUtils.js';
import { PushUpCounter } from '../exercises/pushup.js';
import { SquatCounter } from '../exercises/squat.js';
import { BicepCurlCounter } from '../exercises/bicepCurl.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

function assertCloseTo(actual, expected, tolerance = 1.5, message = '') {
  const diff = Math.abs(actual - expected);
  assert(diff <= tolerance, `${message} (Expected ~${expected}°, got ${actual}°, diff ${diff.toFixed(2)}°)`);
}

console.log('\n==================================================');
console.log('🧪 RUNNING ISOLATED UNIT TESTS: ANGLE MATH & STATE MACHINES');
console.log('==================================================\n');

// ------------------------------------------------------------
// 1. ANGLE CALCULATION TESTS
// ------------------------------------------------------------
console.log('--- 1. Angle Calculation Math (Synthetic Coordinates) ---');

// 90° Elbow Bend: A=(0,1), B=(0,0), C=(1,0)
const angle90 = getAngle({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 });
assertCloseTo(angle90, 90, 1.0, '90° perpendicular elbow bend');

// 180° Straight Arm: A=(0,1), B=(0,0), C=(0,-1)
const angle180 = getAngle({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 0, y: -1 });
assertCloseTo(angle180, 180, 1.0, '180° fully extended straight joint');

// 45° Acute Bend: A=(0,1), B=(0,0), C=(1,1)
const angle45 = getAngle({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 1 });
assertCloseTo(angle45, 45, 1.0, '45° acute joint flex');

// ------------------------------------------------------------
// 2. STATE MACHINE TESTS
// ------------------------------------------------------------
console.log('\n--- 2. PushUp Counter State Machine ---');

function createMockLandmarks(elbowAngle) {
  const lm = new Array(33).fill(null).map(() => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 }));
  
  const rad = (elbowAngle * Math.PI) / 180;
  // B = (0.5, 0.5) - Elbow
  // A = (0.5, 0.2) - Shoulder (vector BA is (0, -0.3))
  // C = (0.5 + 0.3 * sin(rad), 0.5 - 0.3 * cos(rad)) - Wrist
  lm[11] = { x: 0.5, y: 0.2, z: 0, visibility: 0.95 }; // L_SHOULDER
  lm[13] = { x: 0.5, y: 0.5, z: 0, visibility: 0.95 }; // L_ELBOW
  lm[15] = {
    x: 0.5 + 0.3 * Math.sin(rad),
    y: 0.5 - 0.3 * Math.cos(rad),
    z: 0,
    visibility: 0.95
  }; // L_WRIST

  lm[12] = { x: 0.5, y: 0.2, z: 0, visibility: 0.95 }; // R_SHOULDER
  lm[14] = { x: 0.5, y: 0.5, z: 0, visibility: 0.95 }; // R_ELBOW
  lm[16] = {
    x: 0.5 + 0.3 * Math.sin(rad),
    y: 0.5 - 0.3 * Math.cos(rad),
    z: 0,
    visibility: 0.95
  }; // R_WRIST

  lm[23] = { x: 0.5, y: 0.8, z: 0, visibility: 0.95 }; // L_HIP
  lm[24] = { x: 0.5, y: 0.8, z: 0, visibility: 0.95 }; // R_HIP

  return lm;
}

// Test 2a: Normal Full Rep (165° -> 80° -> 165°)
{
  const counter = new PushUpCounter();
  const sequence = [165, 150, 130, 100, 80, 75, 90, 120, 155, 165];
  let time = 1000;
  sequence.forEach(angle => {
    counter.update(createMockLandmarks(angle), time);
    time += 200;
  });
  assert(counter.reps === 1, `Normal full rep should count exactly 1 (Got: ${counter.reps})`);
}

// Test 2b: Partial Rep (165° -> 105° -> 165° — stays above 90° threshold)
{
  const counter = new PushUpCounter();
  const sequence = [165, 150, 130, 105, 120, 140, 165];
  let time = 1000;
  sequence.forEach(angle => {
    counter.update(createMockLandmarks(angle), time);
    time += 200;
  });
  assert(counter.reps === 0, `Partial rep staying above threshold should count 0 (Got: ${counter.reps})`);
}

// Test 2c: Rapid Boundary Jitter (165° -> 89° -> 91° -> 89° -> 91° -> 165°)
{
  const counter = new PushUpCounter();
  const sequence = [165, 95, 89, 91, 89, 91, 89, 120, 165];
  let time = 1000;
  sequence.forEach(angle => {
    counter.update(createMockLandmarks(angle), time);
    time += 200;
  });
  assert(counter.reps === 1, `Boundary jitter should count exactly 1 rep (Got: ${counter.reps})`);
}

// Test 2d: Slow Rep with Noise (±3° random noise added to trajectory)
{
  const counter = new PushUpCounter();
  const smoothSeq = [165, 150, 130, 110, 85, 75, 85, 110, 140, 165];
  let time = 1000;
  smoothSeq.forEach((angle, idx) => {
    const noise = (idx % 2 === 0 ? 2.5 : -2.5);
    counter.update(createMockLandmarks(angle + noise), time);
    time += 200;
  });
  assert(counter.reps === 1, `Slow rep with ±3° noise should count exactly 1 (Got: ${counter.reps})`);
}

// Test 2e: Two Reps Back-to-Back with Pause
{
  const counter = new PushUpCounter();
  let time = 1000;
  // Rep 1
  [165, 130, 80, 120, 165].forEach(a => {
    counter.update(createMockLandmarks(a), time);
    time += 200;
  });
  // Pause (10 frames at top)
  for (let i = 0; i < 10; i++) {
    counter.update(createMockLandmarks(165), time);
    time += 200;
  }
  // Rep 2
  [165, 130, 80, 120, 165].forEach(a => {
    counter.update(createMockLandmarks(a), time);
    time += 200;
  });

  assert(counter.reps === 2, `Two back-to-back reps with pause should count exactly 2 (Got: ${counter.reps})`);
}

console.log('\n--- 3. Squat & Bicep Curl State Machines ---');

// Test 3a: Squat Counter
{
  const squat = new SquatCounter();
  assert(squat.reps === 0, 'Squat counter initializes at 0 reps');
  squat.reset();
  assert(squat.reps === 0, 'Squat reset clears reps to 0');
}

// Test 3b: Bicep Curl Counter
{
  const curl = new BicepCurlCounter();
  assert(curl.reps === 0, 'Bicep Curl counter initializes at 0 reps');
  curl.reset();
  assert(curl.reps === 0, 'Bicep Curl reset clears reps to 0');
}

console.log('\n==================================================');
console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log('==================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

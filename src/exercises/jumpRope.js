// ============================================================
// JUMP ROPE COUNTER — Peak Detection on Hip Vertical Movement
//
// Instead of angle-based state machines (no joint flex to track),
// we detect each jump by finding local peaks in the hip Y position.
//
// KEY IMPROVEMENT over fixed-pixel thresholds:
//   Displacement is normalized against TORSO LENGTH (shoulder→hip dist),
//   so it works whether you're 1m or 3m from the camera.
//   Threshold = JUMP_HIP_DISPLACEMENT_RATIO × torsoLength
//
// Algorithm:
//   1. Buffer the last N hip Y positions (rolling window)
//   2. A "jump" = hip rises (Y decreases in screen coords) then falls back
//   3. Peak detected when: center of buffer is a local minimum AND
//      the rise exceeds our normalized threshold
//   4. Cooldown (MIN_INTERVAL_MS) prevents double-counting
//
// Y coordinate note: MediaPipe uses normalized coords where Y=0 is top,
// so "jumping up" = Y value DECREASING.
// ============================================================
import { JUMP_ROPE } from '../constants.js';
import { getLandmark, avgLandmarks, getTorsoLength, LM , FEEDBACK_TYPE } from '../utils/poseUtils.js';

export class JumpRopeCounter {
  constructor() {
    this.reset();
  }

  reset() {
    this.reps = 0;
    this.lastRepTime = 0;
    this.hipYBuffer = [];       // rolling window of hip Y values
    this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Start jumping!' };
    this.stage = 'ground';      // 'ground' | 'air'
  }

  update(landmarks, timestamp) {
    let repCounted = false;

    const lHip = getLandmark(landmarks, LM.L_HIP, 0.4);
    const rHip = getLandmark(landmarks, LM.R_HIP, 0.4);

    if (!lHip && !rHip) {
      this.feedback = { type: FEEDBACK_TYPE.CAMERA, message: 'Move into frame — need hips visible' };
      return { repCounted, feedback: this.feedback, stage: this.stage };
    }

    const hip = lHip && rHip ? avgLandmarks(lHip, rHip) : (lHip || rHip);

    // Get torso length for normalization
    const torsoLength = getTorsoLength(landmarks);
    if (!torsoLength) {
      this.feedback = { type: FEEDBACK_TYPE.CAMERA, message: 'Need upper body visible for calibration' };
      return { repCounted, feedback: this.feedback, stage: this.stage };
    }

    // Normalized displacement threshold (distance-invariant)
    const threshold = JUMP_ROPE.HIP_DISPLACEMENT_RATIO * torsoLength;

    // Update rolling buffer
    this.hipYBuffer.push(hip.y);
    if (this.hipYBuffer.length > JUMP_ROPE.BUFFER_SIZE) {
      this.hipYBuffer.shift();
    }

    // Need full buffer before peak detection
    if (this.hipYBuffer.length < JUMP_ROPE.BUFFER_SIZE) {
      return { repCounted, feedback: 'Calibrating...', stage: this.stage };
    }

    // ── Local minimum detection ───────────────────────────────
    // "minimum Y" = highest point in the frame = peak of jump
    const midIdx = Math.floor(JUMP_ROPE.BUFFER_SIZE / 2);
    const midY = this.hipYBuffer[midIdx];

    // Check if midpoint is a local minimum (peak of jump)
    const leftMax  = Math.max(...this.hipYBuffer.slice(0, midIdx));
    const rightMax = Math.max(...this.hipYBuffer.slice(midIdx + 1));
    const isLocalMin = midY < leftMax && midY < rightMax;

    // Check if the displacement (rise above resting position) exceeds threshold
    const resting = Math.max(...this.hipYBuffer); // highest Y = lowest position
    const rise = resting - midY;                   // how much hip rose (Y decreased)
    const significantRise = rise > threshold;

    if (isLocalMin && significantRise) {
      const timeSinceLast = timestamp - this.lastRepTime;
      if (timeSinceLast > JUMP_ROPE.MIN_INTERVAL_MS) {
        this.reps++;
        this.lastRepTime = timestamp;
        repCounted = true;
        this.stage = 'air';
        this.feedback = `Jump! (${this.reps})`;
      }
    } else {
      this.stage = 'ground';
      if (!repCounted) this.feedback = `Keep jumping! (${this.reps})`;
    }

    return { repCounted, feedback: this.feedback, stage: this.stage };
  }
}

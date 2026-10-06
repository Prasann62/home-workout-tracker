// ============================================================
// SIT-UP STATE MACHINE
//
// Detects sit-up/crunch reps by tracking the torso angle.
//
// BUG-06 FIX: Previous version used angle(shoulder, hip, floor_point)
// where floor_point was an arbitrary +0.3 offset below the hip.
// This was sensitive to camera height/tilt and body proportions.
//
// New approach: measure the angle between the shoulder→hip vector
// and a fixed downward vertical axis {x:0, y:1}.
// This is equivalent to how far the torso leans from vertical,
// which is directly what we want to measure.
//
//   - Torso vertical (lying flat): shoulder is roughly level with or
//     slightly above hip → shoulder→hip vector points mostly horizontally
//     → angle from vertical ≈ 80-90°
//   - Torso crunched (fully up): shoulder is above hip in the frame →
//     vector points downward → angle from vertical ≈ 0-30°
//
// State flow: FLAT → CRUNCHED → FLAT = 1 rep
//
// Camera position: side-on works best (torso lean clearly visible)
// ============================================================
import { SITUP } from '../constants.js';
import { getLandmark, avgLandmarks, LM , FEEDBACK_TYPE } from '../utils/poseUtils.js';

/**
 * Compute angle between the shoulder→hip vector and the downward vertical.
 * Returns degrees in [0, 90].
 *   0° = fully upright (sitting straight)
 *   90° = lying flat
 */
function getTorsoAngle(shoulder, hip) {
  // Vector from hip to shoulder
  const vx = shoulder.x - hip.x;
  const vy = shoulder.y - hip.y; // negative when shoulder is above hip (normal)

  // Vertical axis pointing down in screen coords: {x:0, y:1}
  // Angle between (vx, vy) and (0, 1):
  const mag = Math.sqrt(vx * vx + vy * vy);
  if (mag < 1e-6) return null;

  // dot(v, down) = vy, so angle = acos(vy / mag)
  // Clamp for numerical safety
  const cosA = Math.max(-1, Math.min(1, vy / mag));
  return Math.acos(cosA) * (180 / Math.PI);
}

export class SitUpCounter {
  constructor() {
    this.reset();
  }

  reset() {
    this.reps = 0;
    this.stage = 'idle'; // 'idle' | 'flat' | 'crunched'
    this.lastRepTime = 0;
    this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Lie down for sit-ups' };
    this.torsoAngle = null;
  }

  update(landmarks, timestamp) {
    let repCounted = false;

    const lShoulder = getLandmark(landmarks, LM.L_SHOULDER);
    const rShoulder = getLandmark(landmarks, LM.R_SHOULDER);
    const lHip      = getLandmark(landmarks, LM.L_HIP);
    const rHip      = getLandmark(landmarks, LM.R_HIP);

    if ((!lShoulder && !rShoulder) || (!lHip && !rHip)) {
      this.feedback = { type: FEEDBACK_TYPE.CAMERA, message: 'Move into frame — need shoulders & hips visible (side view)' };
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    const shoulder = lShoulder && rShoulder
      ? avgLandmarks(lShoulder, rShoulder)
      : (lShoulder || rShoulder);
    const hip = lHip && rHip
      ? avgLandmarks(lHip, rHip)
      : (lHip || rHip);

    const torsoAngle = getTorsoAngle(shoulder, hip);
    if (torsoAngle === null) {
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }
    this.torsoAngle = torsoAngle;

    // SITUP.CRUNCH_ANGLE: below this → crunched (e.g. 75°)
    // SITUP.FLAT_ANGLE:   above this → lying flat (e.g. 110°)
    const isCrunched = torsoAngle < SITUP.CRUNCH_ANGLE;
    const isFlat     = torsoAngle > SITUP.FLAT_ANGLE;

    // ── State machine ─────────────────────────────────────────
    if (this.stage === 'idle' || this.stage === 'flat') {
      if (isFlat) this.stage = 'flat';
      if (isCrunched) {
        this.stage = 'crunched';
        this.feedback = { type: FEEDBACK_TYPE.GOOD, message: 'Good! Now lower back down' };
      }
    }

    if (this.stage === 'crunched' && isFlat) {
      if (timestamp - this.lastRepTime > SITUP.COOLDOWN_MS) {
        this.reps++;
        this.lastRepTime = timestamp;
        repCounted = true;
        this.feedback = `Sit-up counted! (${this.reps})`;
      }
      this.stage = 'flat';
    }

    if (!repCounted) {
      if (this.stage === 'flat') {
        this.feedback = `Crunch up! (${Math.round(torsoAngle)}°)`;
      } else if (this.stage === 'crunched') {
        this.feedback = { type: FEEDBACK_TYPE.GOOD, message: 'Good! Now lower back down' };
      }
    }

    return { repCounted, feedback: this.feedback, stage: this.stage, angle: torsoAngle };
  }
}

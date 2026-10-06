// ============================================================
// SQUAT STATE MACHINE
//
// Detects squat reps using DUAL signals for robustness at
// different camera angles (side, front, 3/4):
//
//   Signal 1 — Knee angle (hip-knee-ankle)
//     Best from side or ~45° angle.
//     Unreliable when camera is directly front-on (knees overlap).
//
//   Signal 2 — Hip Y vs Knee Y height comparison
//     Works even when camera is front-facing, because vertical
//     pixel positions are still meaningful even without a side view.
//
// A "down" position is detected when EITHER signal fires.
// This makes detection robust across camera positions.
//
// BUG-04 FIX: HIP_KNEE_OFFSET_RATIO raised to 0.15 (in constants.js)
//   so hips must be clearly below knees, not just at the same Y level.
//   (With ratio=0, standing naturally could trigger a false "squat".)
//
// BUG-16 FIX: "Good squat!" is not overwritten by "Squat down" on same frame.
//
// State flow: STANDING → SQUAT → STANDING = 1 rep
// Key landmarks: hip (23/24), knee (25/26), ankle (27/28)
// ============================================================
import { SQUAT } from '../constants.js';
import { getAngle, getLandmark, getTorsoLength, LM , FEEDBACK_TYPE } from '../utils/poseUtils.js';

export class SquatCounter {
  constructor() {
    this.reset();
  }

  reset() {
    this.reps = 0;
    this.stage = 'idle'; // 'idle' | 'standing' | 'squat'
    this.lastRepTime = 0;
    this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Stand in front of camera' };
    this.kneeAngle = null;
  }

  update(landmarks, timestamp) {
    let repCounted = false;

    // Extract left and right leg landmarks
    const lHip   = getLandmark(landmarks, LM.L_HIP);
    const rHip   = getLandmark(landmarks, LM.R_HIP);
    const lKnee  = getLandmark(landmarks, LM.L_KNEE);
    const rKnee  = getLandmark(landmarks, LM.R_KNEE);
    const lAnkle = getLandmark(landmarks, LM.L_ANKLE);
    const rAnkle = getLandmark(landmarks, LM.R_ANKLE);

    const leftOk  = lHip && lKnee && lAnkle;
    const rightOk = rHip && rKnee && rAnkle;

    if (!leftOk && !rightOk) {
      this.feedback = { type: FEEDBACK_TYPE.CAMERA, message: 'Move into frame — need hips, knees & ankles visible' };
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    // ── Signal 1: Knee angle ─────────────────────────────────
    // getAngle now returns null for degenerate zero-vectors (BUG-01 fix)
    let kneeAngle = null;
    if (leftOk && rightOk) {
      const lAngle = getAngle(lHip, lKnee, lAnkle);
      const rAngle = getAngle(rHip, rKnee, rAnkle);
      if (lAngle !== null && rAngle !== null) kneeAngle = Math.min(lAngle, rAngle);
      else kneeAngle = lAngle ?? rAngle;
    } else if (leftOk) {
      kneeAngle = getAngle(lHip, lKnee, lAnkle);
    } else {
      kneeAngle = getAngle(rHip, rKnee, rAnkle);
    }
    this.kneeAngle = kneeAngle;

    // ── Signal 2: Hip height vs Knee height ──────────────────
    // BUG-04 FIX: Use HIP_KNEE_OFFSET_RATIO (now 0.15 in constants.js).
    // Hips must be CLEARLY below knees (by at least 15% of torso length),
    // not just at the same Y level, to prevent false "down" when standing.
    let hipBelowKnee = false;
    if (SQUAT.HIP_BELOW_KNEE) {
      const torso = getTorsoLength(landmarks);
      if (torso) {
        const lHipLm  = lHip  || getLandmark(landmarks, LM.L_HIP, 0.3);
        const rHipLm  = rHip  || getLandmark(landmarks, LM.R_HIP, 0.3);
        const lKneeLm = lKnee || getLandmark(landmarks, LM.L_KNEE, 0.3);
        const rKneeLm = rKnee || getLandmark(landmarks, LM.R_KNEE, 0.3);
        if ((lHipLm || rHipLm) && (lKneeLm || rKneeLm)) {
          const hipMidY  = lHipLm && rHipLm ? (lHipLm.y + rHipLm.y) / 2 : (lHipLm || rHipLm).y;
          const kneeMidY = lKneeLm && rKneeLm ? (lKneeLm.y + rKneeLm.y) / 2 : (lKneeLm || rKneeLm).y;
          // Must exceed the offset threshold to count as "below knee"
          hipBelowKnee = hipMidY > kneeMidY + torso * SQUAT.HIP_KNEE_OFFSET_RATIO;
        }
      }
    }

    // Combine signals: "down" if EITHER fires
    const angleDown  = kneeAngle !== null && kneeAngle < SQUAT.KNEE_DOWN_ANGLE;
    const isDown     = angleDown || hipBelowKnee;
    const isStanding = kneeAngle !== null && kneeAngle > SQUAT.KNEE_UP_ANGLE;

    // ── State machine ─────────────────────────────────────────
    if (this.stage === 'idle' || this.stage === 'standing') {
      if (isStanding) this.stage = 'standing';
      if (isDown) {
        this.stage = 'squat';
        this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Hold — now push up!' };
      }
    }

    if (this.stage === 'squat' && isStanding) {
      if (timestamp - this.lastRepTime > SQUAT.COOLDOWN_MS) {
        this.reps++;
        this.lastRepTime = timestamp;
        repCounted = true;
        this.feedback = { type: FEEDBACK_TYPE.GOOD, message: `Good squat! (${this.reps})` };
      }
      this.stage = 'standing';
    }

    // Form hints — BUG-16 FIX: never overwrite a just-counted rep message
    if (!repCounted) {
      if (this.stage === 'standing') {
        this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Squat down' };
      } else if (this.stage === 'squat') {
        if (!isDown && kneeAngle !== null) {
          this.feedback = { type: FEEDBACK_TYPE.WARNING, message: `Go lower! (${Math.round(kneeAngle)}°)` };
        }
      }
    }

    return { repCounted, feedback: this.feedback, stage: this.stage, angle: kneeAngle };
  }
}

// ============================================================
// LUNGE STATE MACHINE
//
// Detects lunges by tracking the front knee angle.
// Picks the more-flexed knee (left or right) as the "working" leg.
//
// State flow: STANDING → LUNGE (knee bent) → STANDING = 1 rep
// Key landmarks: hip (23/24), knee (25/26), ankle (27/28)
//
// BUG-01 FIX: getAngle() may return null for degenerate landmarks.
//   All angle results are now null-checked before use.
// ============================================================
import { LUNGE } from '../constants.js';
import { getAngle, getLandmark, LM , FEEDBACK_TYPE } from '../utils/poseUtils.js';

export class LungeCounter {
  constructor() {
    this.reset();
  }

  reset() {
    this.reps = 0;
    this.stage = 'idle'; // 'idle' | 'standing' | 'lunge'
    this.lastRepTime = 0;
    this.feedback = { type: FEEDBACK_TYPE.CAMERA, message: 'Step forward into a lunge' };
    this.kneeAngle = null;
  }

  update(landmarks, timestamp) {
    let repCounted = false;

    const lHip   = getLandmark(landmarks, LM.L_HIP);
    const rHip   = getLandmark(landmarks, LM.R_HIP);
    const lKnee  = getLandmark(landmarks, LM.L_KNEE);
    const rKnee  = getLandmark(landmarks, LM.R_KNEE);
    const lAnkle = getLandmark(landmarks, LM.L_ANKLE);
    const rAnkle = getLandmark(landmarks, LM.R_ANKLE);

    const leftOk  = lHip && lKnee && lAnkle;
    const rightOk = rHip && rKnee && rAnkle;

    if (!leftOk && !rightOk) {
      this.feedback = { type: FEEDBACK_TYPE.CAMERA, message: 'Move into frame — need legs visible' };
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    // Use the more flexed (smaller angle) knee — that's the "front" leg in a lunge
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

    if (kneeAngle === null) {
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    const isDown     = kneeAngle < LUNGE.KNEE_DOWN_ANGLE;
    const isStanding = kneeAngle > LUNGE.KNEE_UP_ANGLE;

    if (this.stage === 'idle' || this.stage === 'standing') {
      if (isStanding) this.stage = 'standing';
      if (isDown) {
        this.stage = 'lunge';
        this.feedback = { type: FEEDBACK_TYPE.GOOD, message: 'Good lunge! Stand back up' };
      }
    }

    if (this.stage === 'lunge' && isStanding) {
      if (timestamp - this.lastRepTime > LUNGE.COOLDOWN_MS) {
        this.reps++;
        this.lastRepTime = timestamp;
        repCounted = true;
        this.feedback = `Lunge counted! (${this.reps})`;
      }
      this.stage = 'standing';
    }

    if (!repCounted && this.stage === 'standing') {
      this.feedback = `Step forward — lunge deeper (${Math.round(kneeAngle)}°)`;
    }

    return { repCounted, feedback: this.feedback, stage: this.stage, angle: kneeAngle };
  }
}

// ============================================================
// PLANK TIMER + FORM CHECKER
//
// No rep counting — this is a timed hold exercise.
// Tracks shoulder-hip-ankle alignment to detect form breakdowns.
//
// Good plank: shoulder, hip, and ankle form a roughly straight line
// (angle ≈ 180°).
//
// Bad plank indicators:
//   - Hips sagging: hip Y much lower than shoulder-ankle line
//   - Hips piking: hip Y much higher than shoulder-ankle line
// ============================================================
import { PLANK } from '../constants.js';
import { getAngle, getLandmark, avgLandmarks, LM , FEEDBACK_TYPE } from '../utils/poseUtils.js';

export class PlankTimer {
  constructor() {
    this.reset();
  }

  reset() {
    this.activeHoldSeconds = 0;
    this.lastTimestamp = null;
    this.stage = 'idle'; // 'idle' | 'holding' | 'broken'
    this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Get into plank position' };
    this.bodyAngle = null;
    this.isActive = false;
  }

  start() {
    this.isActive = true;
    this.lastTimestamp = null;
  }

  pause() {
    this.isActive = false;
    this.lastTimestamp = null;
  }

  update(landmarks, timestamp) {
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
    }
    const deltaSeconds = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    const lShoulder = getLandmark(landmarks, LM.L_SHOULDER);
    const rShoulder = getLandmark(landmarks, LM.R_SHOULDER);
    const lHip      = getLandmark(landmarks, LM.L_HIP);
    const rHip      = getLandmark(landmarks, LM.R_HIP);
    const lAnkle    = getLandmark(landmarks, LM.L_ANKLE);
    const rAnkle    = getLandmark(landmarks, LM.R_ANKLE);

    // Need all three body segments visible
    const hasBody = (lShoulder || rShoulder) && (lHip || rHip) && (lAnkle || rAnkle);
    if (!hasBody) {
      this.stage = 'broken';
      this.feedback = { type: FEEDBACK_TYPE.CAMERA, message: '⏸️ TIMER PAUSED — Move into frame in plank position' };
      return {
        elapsedSeconds: Math.floor(this.activeHoldSeconds),
        feedback: this.feedback.message,
        stage: this.stage,
      };
    }

    const shoulder = lShoulder && rShoulder ? avgLandmarks(lShoulder, rShoulder) : (lShoulder || rShoulder);
    const hip      = lHip && rHip ? avgLandmarks(lHip, rHip) : (lHip || rHip);
    const ankle    = lAnkle && rAnkle ? avgLandmarks(lAnkle, rAnkle) : (lAnkle || rAnkle);

    // Body angle at hip: shoulder → hip → ankle (should be ~180° for straight plank)
    const bodyAngle = getAngle(shoulder, hip, ankle);
    this.bodyAngle = bodyAngle;

    // Straight plank check
    const isGoodForm = bodyAngle >= PLANK.MIN_STRAIGHT_ANGLE;

    if (isGoodForm) {
      this.stage = 'holding';
      this.feedback = { type: FEEDBACK_TYPE.INFO, message: '💪 GREAT FORM! TIMER COUNTING...' };
      // ACCUMULATE HOLD TIME ONLY WHEN FORM IS GOOD
      if (this.isActive && deltaSeconds > 0 && deltaSeconds < 0.5) {
        this.activeHoldSeconds += deltaSeconds;
      }
    } else if (hip.y > shoulder.y + 0.05 && hip.y > ankle.y + 0.05) {
      // Hips sagging
      this.stage = 'broken';
      this.feedback = { type: FEEDBACK_TYPE.FORM, message: '⏸️ TIMER PAUSED — Hips sagging! Lift your hips up!' };
    } else {
      // Hips piking
      this.stage = 'broken';
      this.feedback = { type: FEEDBACK_TYPE.FORM, message: '⏸️ TIMER PAUSED — Hips too high! Flatten your body!' };
    }

    return {
      elapsedSeconds: Math.floor(this.activeHoldSeconds),
      feedback: this.feedback.message,
      stage: this.stage,
      angle: bodyAngle,
    };
  }
}

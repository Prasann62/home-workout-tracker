// ============================================================
// BICEP CURL STATE MACHINE
//
// Tracks elbow flex/extension:
//   IDLE -> UP (arm extended ~140°+) -> DOWN (arm flexed at top ~45°-) -> UP = 1 rep
//
// Key landmarks: shoulder (11/12), elbow (13/14), wrist (15/16)
// ============================================================
import { BICEP_CURL } from '../constants.js';
import { getAngle, getLandmark, LM, FEEDBACK_TYPE } from '../utils/poseUtils.js';

export class BicepCurlCounter {
  constructor() {
    this.reset();
  }

  reset() {
    this.reps = 0;
    this.stage = 'idle'; // 'idle' | 'up' (extended) | 'down' (flexed/curled)
    this.lastRepTime = 0;
    this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Hold weights at your sides' };
    this.elbowAngle = null;
  }

  update(landmarks, timestamp) {
    let repCounted = false;

    const lShoulder = getLandmark(landmarks, LM.L_SHOULDER);
    const rShoulder = getLandmark(landmarks, LM.R_SHOULDER);
    const lElbow    = getLandmark(landmarks, LM.L_ELBOW);
    const rElbow    = getLandmark(landmarks, LM.R_ELBOW);
    const lWrist    = getLandmark(landmarks, LM.L_WRIST);
    const rWrist    = getLandmark(landmarks, LM.R_WRIST);

    const leftOk  = lShoulder && lElbow && lWrist;
    const rightOk = rShoulder && rElbow && rWrist;

    if (!leftOk && !rightOk) {
      this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Move into frame — need shoulder, elbow & wrist' };
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    let angle;
    if (leftOk && rightOk) {
      const lAngle = getAngle(lShoulder, lElbow, lWrist);
      const rAngle = getAngle(rShoulder, rElbow, rWrist);
      if (lAngle !== null && rAngle !== null) angle = (lAngle + rAngle) / 2;
      else angle = lAngle || rAngle;
    } else if (leftOk) {
      angle = getAngle(lShoulder, lElbow, lWrist);
    } else {
      angle = getAngle(rShoulder, rElbow, rWrist);
    }

    if (angle === null) {
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    this.elbowAngle = angle;

    // Hysteresis State Machine
    if (this.stage === 'idle') {
      if (angle >= BICEP_CURL.ELBOW_UP_ANGLE - 10) {
        this.stage = 'up';
        this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Curl weights up toward shoulders' };
      }
    }

    if (this.stage === 'up' && angle <= BICEP_CURL.ELBOW_DOWN_ANGLE) {
      this.stage = 'down'; // Flexed at top of curl
      this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Lower slowly to full extension' };
    }

    if (this.stage === 'down' && angle >= BICEP_CURL.ELBOW_UP_ANGLE) {
      if (timestamp - this.lastRepTime > BICEP_CURL.COOLDOWN_MS) {
        this.reps++;
        this.lastRepTime = timestamp;
        repCounted = true;
        this.feedback = `Strong curl! (${this.reps})`;
      }
      this.stage = 'up';
    }

    return { repCounted, feedback: this.feedback, stage: this.stage, angle };
  }
}

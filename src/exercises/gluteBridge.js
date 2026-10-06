// ============================================================
// GLUTE BRIDGE COUNTER
// Camera: side-on view; person lying on back with knees bent.
// Logic: Counts hip raises using hip-knee-shoulder angle.
// ============================================================
import { getAngle, getLandmark, LM , FEEDBACK_TYPE } from '../utils/poseUtils.js';

const HIP_UP_ANGLE   = 155; // hip fully extended at top
const HIP_DOWN_ANGLE = 120; // hip returned to floor
const COOLDOWN_MS    = 800;

export class GluteBridgeCounter {
  constructor() {
    this.reset();
  }

  reset() {
    this.reps = 0;
    this.stage = 'idle';
    this.lastRepTime = 0;
    this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Lie on back, knees bent, feet flat — push hips up' };
    this.hipAngle = null;
  }

  update(landmarks, timestamp) {
    let repCounted = false;

    const lShoulder = getLandmark(landmarks, LM.L_SHOULDER, 0.4);
    const rShoulder = getLandmark(landmarks, LM.R_SHOULDER, 0.4);
    const lHip      = getLandmark(landmarks, LM.L_HIP, 0.4);
    const rHip      = getLandmark(landmarks, LM.R_HIP, 0.4);
    const lKnee     = getLandmark(landmarks, LM.L_KNEE, 0.4);
    const rKnee     = getLandmark(landmarks, LM.R_KNEE, 0.4);

    const leftOk  = lShoulder && lHip && lKnee;
    const rightOk = rShoulder && rHip && rKnee;

    if (!leftOk && !rightOk) {
      this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Side camera view works best — need shoulders, hips, knees' };
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    let angle;
    if (leftOk && rightOk) {
      const la = getAngle(lShoulder, lHip, lKnee);
      const ra = getAngle(rShoulder, rHip, rKnee);
      if (la !== null && ra !== null) angle = (la + ra) / 2;
      else angle = la ?? ra;
    } else if (leftOk) {
      angle = getAngle(lShoulder, lHip, lKnee);
    } else {
      angle = getAngle(rShoulder, rHip, rKnee);
    }

    if (angle === null) return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };

    this.hipAngle = angle;

    // State machine: flat → bridge → flat = 1 rep
    if (this.stage === 'idle' || this.stage === 'flat') {
      if (angle >= HIP_UP_ANGLE) {
        this.stage = 'bridge';
        this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Hips up! Squeeze glutes — hold for a beat!' };
      } else {
        this.stage = 'flat';
        this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Drive hips up — push through your heels' };
      }
    }

    if (this.stage === 'bridge' && angle < HIP_DOWN_ANGLE) {
      if (timestamp - this.lastRepTime > COOLDOWN_MS) {
        this.reps++;
        this.lastRepTime = timestamp;
        repCounted = true;
        this.feedback = `Glute bridge! Rep ${this.reps}`;
      }
      this.stage = 'flat';
    }

    return { repCounted, feedback: this.feedback, stage: this.stage, angle };
  }
}

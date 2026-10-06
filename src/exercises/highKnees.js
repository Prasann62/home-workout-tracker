// ============================================================
// HIGH KNEES COUNTER
// Camera: front-facing, full body in frame.
// Logic: Counts each time a knee rises above hip level.
// ============================================================
import { getLandmark, getTorsoLength, LM , FEEDBACK_TYPE } from '../utils/poseUtils.js';

const COOLDOWN_MS = 300;
const KNEE_HIP_THRESHOLD = 0.92; // knee.y must be < hip.y * this (normalized Y, 0=top)

export class HighKneesCounter {
  constructor() {
    this.reset();
  }

  reset() {
    this.reps = 0;
    this.stage = 'idle';
    this.lastRepTime = 0;
    this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Stand ready — drive your knees high alternately' };
    this._lastKneeSide = null;
  }

  update(landmarks, timestamp) {
    let repCounted = false;

    const lKnee  = getLandmark(landmarks, LM.L_KNEE, 0.4);
    const rKnee  = getLandmark(landmarks, LM.R_KNEE, 0.4);
    const lHip   = getLandmark(landmarks, LM.L_HIP, 0.4);
    const rHip   = getLandmark(landmarks, LM.R_HIP, 0.4);

    if ((!lKnee && !rKnee) || (!lHip && !rHip)) {
      this.feedback = { type: FEEDBACK_TYPE.CAMERA, message: 'Full body needed — step back until legs visible' };
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    const torso = getTorsoLength(landmarks);
    if (!torso) {
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    // Check left knee above left hip
    let leftUp = lKnee && lHip && (lHip.y - lKnee.y) > torso * 0.25;
    // Check right knee above right hip
    let rightUp = rKnee && rHip && (rHip.y - rKnee.y) > torso * 0.25;

    const now = timestamp;

    if (leftUp && this._lastKneeSide !== 'left' && now - this.lastRepTime > COOLDOWN_MS) {
      this._lastKneeSide = 'left';
      this.reps++;
      this.lastRepTime = now;
      repCounted = true;
      this.stage = 'leftUp';
      this.feedback = `Left knee! (${this.reps})`;
    } else if (rightUp && this._lastKneeSide !== 'right' && now - this.lastRepTime > COOLDOWN_MS) {
      this._lastKneeSide = 'right';
      this.reps++;
      this.lastRepTime = now;
      repCounted = true;
      this.stage = 'rightUp';
      this.feedback = `Right knee! (${this.reps})`;
    } else if (!leftUp && !rightUp) {
      this.stage = 'idle';
      this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Drive knees — higher and faster!' };
    }

    return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
  }
}

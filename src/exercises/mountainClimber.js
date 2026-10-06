// ============================================================
// MOUNTAIN CLIMBER COUNTER
// Camera: side-on or front; full body from push-up position.
// Logic: Counts each alternating knee drive toward the chest.
// ============================================================
import { getLandmark, getTorsoLength, LM , FEEDBACK_TYPE } from '../utils/poseUtils.js';

const COOLDOWN_MS = 250;
const KNEE_DRIVE_RATIO = 0.4; // knee must come within 40% of torso length toward shoulder

export class MountainClimberCounter {
  constructor() {
    this.reset();
  }

  reset() {
    this.reps = 0;
    this.stage = 'idle';
    this.lastRepTime = 0;
    this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Get into plank position — drive knees to chest alternately' };
    this._lastSide = null;
  }

  update(landmarks, timestamp) {
    let repCounted = false;

    const lShoulder = getLandmark(landmarks, LM.L_SHOULDER, 0.4);
    const rShoulder = getLandmark(landmarks, LM.R_SHOULDER, 0.4);
    const lKnee     = getLandmark(landmarks, LM.L_KNEE, 0.4);
    const rKnee     = getLandmark(landmarks, LM.R_KNEE, 0.4);
    const lHip      = getLandmark(landmarks, LM.L_HIP, 0.4);
    const rHip      = getLandmark(landmarks, LM.R_HIP, 0.4);

    if (!lShoulder && !rShoulder) {
      this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Get into plank — hands under shoulders' };
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    const torso = getTorsoLength(landmarks);
    if (!torso || torso < 0.05) {
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    const shoulderY = lShoulder && rShoulder
      ? (lShoulder.y + rShoulder.y) / 2
      : (lShoulder || rShoulder).y;

    // Left knee drive: knee Y approaches shoulder Y
    const lDriving = lKnee && lHip &&
      (lHip.y - lKnee.y) > torso * KNEE_DRIVE_RATIO;

    // Right knee drive
    const rDriving = rKnee && rHip &&
      (rHip.y - rKnee.y) > torso * KNEE_DRIVE_RATIO;

    const now = timestamp;

    if (lDriving && this._lastSide !== 'left' && now - this.lastRepTime > COOLDOWN_MS) {
      this._lastSide = 'left';
      this.reps++;
      this.lastRepTime = now;
      repCounted = true;
      this.stage = 'leftDrive';
      this.feedback = `Left drive! Switch → right! (${this.reps})`;
    } else if (rDriving && this._lastSide !== 'right' && now - this.lastRepTime > COOLDOWN_MS) {
      this._lastSide = 'right';
      this.reps++;
      this.lastRepTime = now;
      repCounted = true;
      this.stage = 'rightDrive';
      this.feedback = `Right drive! Switch → left! (${this.reps})`;
    } else if (!lDriving && !rDriving) {
      this.stage = 'plank';
      this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Plank locked — drive those knees!' };
    }

    return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
  }
}

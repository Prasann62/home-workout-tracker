// ============================================================
// BURPEE COUNTER
// Camera: front-facing, full body visible.
// Logic: Tracks the 4-phase sequence: standing → squat/plank →
//        push-up → jump. Counts complete sequences as reps.
// ============================================================
import { getLandmark, getAngle, getTorsoLength, LM , FEEDBACK_TYPE } from '../utils/poseUtils.js';

const COOLDOWN_MS = 1000;

export class BurpeeCounter {
  constructor() {
    this.reset();
  }

  reset() {
    this.reps = 0;
    this.stage = 'standing';
    this.lastRepTime = 0;
    this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Stand ready — squat down → plank → push-up → jump!' };
    this.angle = null;
  }

  update(landmarks, timestamp) {
    let repCounted = false;

    const lShoulder = getLandmark(landmarks, LM.L_SHOULDER, 0.4);
    const rShoulder = getLandmark(landmarks, LM.R_SHOULDER, 0.4);
    const lHip      = getLandmark(landmarks, LM.L_HIP, 0.4);
    const rHip      = getLandmark(landmarks, LM.R_HIP, 0.4);
    const lKnee     = getLandmark(landmarks, LM.L_KNEE, 0.4);
    const rKnee     = getLandmark(landmarks, LM.R_KNEE, 0.4);
    const lAnkle    = getLandmark(landmarks, LM.L_ANKLE, 0.3);
    const rAnkle    = getLandmark(landmarks, LM.R_ANKLE, 0.3);

    if ((!lShoulder && !rShoulder) || (!lHip && !rHip)) {
      this.feedback = { type: FEEDBACK_TYPE.CAMERA, message: 'Full body in frame — step back to show head to feet' };
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    const torso = getTorsoLength(landmarks);
    if (!torso) return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };

    const shoulderY = lShoulder && rShoulder
      ? (lShoulder.y + rShoulder.y) / 2 : (lShoulder || rShoulder).y;
    const hipY = lHip && rHip
      ? (lHip.y + rHip.y) / 2 : (lHip || rHip).y;
    const kneeY = lKnee && rKnee
      ? (lKnee.y + rKnee.y) / 2 : lKnee ? lKnee.y : rKnee ? rKnee.y : null;
    const ankleY = lAnkle && rAnkle
      ? (lAnkle.y + rAnkle.y) / 2 : lAnkle ? lAnkle.y : rAnkle ? rAnkle.y : null;

    // Determine body configuration:
    // Standing: shoulders high relative to hips
    // Plank/down: shoulders low, near hip level
    // Jump: hips suddenly high (negative change)

    const hipToShoulderDiff = shoulderY - hipY; // positive means shoulders higher on screen (lower Y = higher)
    const isUpright = hipToShoulderDiff > torso * 0.4;
    const isHorizontal = Math.abs(hipToShoulderDiff) < torso * 0.25;

    // Get knee angle for squat detection
    let kneeAngle = null;
    if (lHip && lKnee && lAnkle) kneeAngle = getAngle(lHip, lKnee, lAnkle);
    else if (rHip && rKnee && rAnkle) kneeAngle = getAngle(rHip, rKnee, rAnkle);

    this.angle = kneeAngle;

    // ── Burpee state machine ──────────────────────────────────
    switch (this.stage) {
      case 'standing':
        if (!isUpright && kneeAngle !== null && kneeAngle < 130) {
          this.stage = 'squat';
          this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'In squat! Jump feet back to plank position' };
        } else {
          this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Squat down to start your burpee!' };
        }
        break;

      case 'squat':
        if (isHorizontal) {
          this.stage = 'plank';
          this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'In plank! Do one push-up — chest to floor!' };
        }
        break;

      case 'plank':
        // In plank look for elbow bend (push-up)
        const lElbow = getLandmark(landmarks, LM.L_ELBOW, 0.4);
        const rElbow = getLandmark(landmarks, LM.R_ELBOW, 0.4);
        if (lElbow && lShoulder) {
          const lWrist = getLandmark(landmarks, LM.L_WRIST, 0.4);
          if (lWrist) {
            const elbowA = getAngle(lShoulder, lElbow, lWrist);
            if (elbowA !== null && elbowA < 90) {
              this.stage = 'pushup';
              this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Push-up depth! Now jump feet forward & LEAP UP!' };
            } else {
              this.feedback = { type: FEEDBACK_TYPE.FORM, message: 'Do a push-up — lower your chest!' };
            }
          }
        } else {
          // Approximate: just wait for standing
          if (isUpright) {
            this.stage = 'pushup'; // skip detection, trust user
          }
        }
        break;

      case 'pushup':
        if (isUpright) {
          this.stage = 'jump';
          this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Now JUMP — reach arms overhead!' };
        }
        break;

      case 'jump':
        // Rep counted once they return to standing after jump peak
        if (isUpright && timestamp - this.lastRepTime > COOLDOWN_MS) {
          this.reps++;
          this.lastRepTime = timestamp;
          repCounted = true;
          this.feedback = `Burpee complete! Rep ${this.reps} 💥`;
          this.stage = 'standing';
        }
        break;
    }

    return { repCounted, feedback: this.feedback, stage: this.stage, angle: this.angle };
  }
}

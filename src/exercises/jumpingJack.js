// ============================================================
// JUMPING JACK STATE MACHINE
//
// Detects jumping jacks by tracking wrist position relative
// to shoulder and hip levels (arms up vs arms down).
//
// State flow: DOWN (arms at sides) → UP (arms overhead) → DOWN = 1 rep
//
// BUG-14 FIX: armsUp and armsDown had overlapping thresholds and
// could both be true simultaneously, causing phantom transitions.
// Fix: added a dead-band (neutral zone) between the two thresholds,
// and restructured the state machine to use if/else-if so both
// conditions cannot fire in the same frame.
//
// Thresholds are normalized against torso length to be
// camera-distance invariant (same approach as jump rope).
// ============================================================
import { JUMPING_JACK } from '../constants.js';
import { getLandmark, getTorsoLength, LM , FEEDBACK_TYPE } from '../utils/poseUtils.js';

export class JumpingJackCounter {
  constructor() {
    this.reset();
  }

  reset() {
    this.reps = 0;
    this.stage = 'idle'; // 'idle' | 'down' | 'up'
    this.lastRepTime = 0;
    this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Start jumping jacks!' };
  }

  update(landmarks, timestamp) {
    let repCounted = false;

    const lShoulder = getLandmark(landmarks, LM.L_SHOULDER);
    const rShoulder = getLandmark(landmarks, LM.R_SHOULDER);
    const lWrist    = getLandmark(landmarks, LM.L_WRIST);
    const rWrist    = getLandmark(landmarks, LM.R_WRIST);
    const lHip      = getLandmark(landmarks, LM.L_HIP);
    const rHip      = getLandmark(landmarks, LM.R_HIP);

    if (!lShoulder || !rShoulder || !lWrist || !rWrist) {
      this.feedback = { type: FEEDBACK_TYPE.CAMERA, message: 'Move into frame — need arms visible' };
      return { repCounted, feedback: this.feedback, stage: this.stage };
    }

    const torso = getTorsoLength(landmarks);
    if (!torso) return { repCounted, feedback: this.feedback, stage: this.stage };

    const shoulderMidY = (lShoulder.y + rShoulder.y) / 2;
    const wristMidY    = (lWrist.y + rWrist.y) / 2;
    const hipMidY      = lHip && rHip
      ? (lHip.y + rHip.y) / 2
      : shoulderMidY + torso;

    // BUG-14 FIX: Clear dead-band between armsUp and armsDown thresholds.
    // armsUp:   wrists must be ABOVE shoulder level (wristY < shoulderY)
    // armsDown: wrists must be BELOW hip level (wristY > hipY)
    // Zone between shoulder and hip = neutral / transition zone — no state change.
    const armsUp   = wristMidY < shoulderMidY + torso * JUMPING_JACK.WRIST_ABOVE_SHOULDER_RATIO;
    const armsDown = wristMidY > hipMidY      - torso * JUMPING_JACK.WRIST_BELOW_HIP_RATIO;

    // ── State machine — mutually exclusive branches (BUG-14 FIX) ─
    if (armsUp && !armsDown) {
      // Arms clearly up — advance toward 'up' state
      if (this.stage === 'idle' || this.stage === 'down') {
        this.stage = 'up';
        this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Arms up! Now bring them down' };
      }
    } else if (armsDown && !armsUp) {
      // Arms clearly down — complete a rep if we were in 'up'
      if (this.stage === 'up') {
        if (timestamp - this.lastRepTime > JUMPING_JACK.COOLDOWN_MS) {
          this.reps++;
          this.lastRepTime = timestamp;
          repCounted = true;
          this.feedback = `Good jack! (${this.reps})`;
        }
        this.stage = 'down';
      } else if (this.stage === 'idle') {
        this.stage = 'down';
      }
    }
    // else: neutral zone — keep current stage, no update

    if (!repCounted && this.stage === 'down') {
      this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Jump and raise arms!' };
    }
    if (!repCounted && this.stage === 'idle') {
      this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Stand with arms at sides to begin' };
    }

    return { repCounted, feedback: this.feedback, stage: this.stage };
  }
}

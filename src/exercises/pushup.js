// ============================================================
// PUSH-UP STATE MACHINE
//
// Detects push-up reps by tracking the elbow angle.
// Camera position: front-facing or ~45° side works best.
//
// State flow:
//   IDLE → UP (elbows extended) → DOWN (elbows flexed) → UP = 1 rep
//
// BUG-02 FIX: idle→up no longer requires fully locked elbows.
//   Previously: user had to reach >155° before state machine started.
//   Now: any angle above DOWN_ANGLE unlocks the 'up' state so a rep
//   can be counted even if the person never fully locks out.
//
// Key landmarks: shoulder (11/12), elbow (13/14), wrist (15/16)
// Angle computed: shoulder–elbow–wrist (elbow as vertex)
// ============================================================
import { PUSHUP } from '../constants.js';
import { getAngle, getLandmark, getTorsoLength, LM, FEEDBACK_TYPE } from '../utils/poseUtils.js';

export class PushUpCounter {
  constructor() {
    this.reset();
  }

  reset() {
    this.reps = 0;
    this.stage = 'idle'; // 'idle' | 'up' | 'down'
    this.lastRepTime = 0;
    this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Get into push-up position' };
    this.elbowAngle = null;
  }

  /**
   * Process one frame of pose landmarks.
   * @param {Array} landmarks - MediaPipe poseLandmarks
   * @param {number} [timestamp=performance.now()] - timestamp in ms
   * @returns {{ repCounted: boolean, feedback: string, stage: string, angle: number|null }}
   */
  update(landmarks, timestamp = performance.now()) {
    let repCounted = false;

    // Extract landmarks (use average of left + right for robustness)
    const lShoulder = getLandmark(landmarks, LM.L_SHOULDER);
    const rShoulder = getLandmark(landmarks, LM.R_SHOULDER);
    const lElbow    = getLandmark(landmarks, LM.L_ELBOW);
    const rElbow    = getLandmark(landmarks, LM.R_ELBOW);
    const lWrist    = getLandmark(landmarks, LM.L_WRIST);
    const rWrist    = getLandmark(landmarks, LM.R_WRIST);

    const leftOk  = lShoulder && lElbow && lWrist;
    const rightOk = rShoulder && rElbow && rWrist;

    if (!leftOk && !rightOk) {
      this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Move into frame — need shoulders, elbows & wrists' };
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    // Pick the side with better visibility, or average both
    let angle;
    if (leftOk && rightOk) {
      const lAngle = getAngle(lShoulder, lElbow, lWrist);
      const rAngle = getAngle(rShoulder, rElbow, rWrist);
      // getAngle returns null for degenerate zero-vectors (BUG-01 fix)
      if (lAngle !== null && rAngle !== null) angle = (lAngle + rAngle) / 2;
      else if (lAngle !== null) angle = lAngle;
      else if (rAngle !== null) angle = rAngle;
      else return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    } else if (leftOk) {
      angle = getAngle(lShoulder, lElbow, lWrist);
    } else {
      angle = getAngle(rShoulder, rElbow, rWrist);
    }

    // Skip frame if angle is null (degenerate landmark positions)
    if (angle === null) {
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    this.elbowAngle = angle;

    // ── State machine ────────────────────────────────────────
    // BUG-02 FIX: idle state now transitions to 'up' as long as angle is above
    // DOWN threshold — does NOT require full lockout (>UP_ANGLE).
    // Only the down→up rep-count transition enforces the strict UP_ANGLE.
    if (this.stage === 'idle') {
      if (angle > PUSHUP.ELBOW_DOWN_ANGLE) {
        this.stage = 'up';
        this.feedback = { type: FEEDBACK_TYPE.FORM, message: 'Lower your chest' };
      }
    }

    if (this.stage === 'up') {
      // In the 'up' stage, show a form cue if arms aren't fully extended yet
      if (angle >= PUSHUP.ELBOW_UP_ANGLE) {
        this.feedback = { type: FEEDBACK_TYPE.FORM, message: 'Lower your chest' };
      } else if (angle > PUSHUP.ELBOW_DOWN_ANGLE) {
        this.feedback = `Go lower! (${Math.round(angle)}°)`;
      }
    }

    if (this.stage === 'up' && angle < PUSHUP.ELBOW_DOWN_ANGLE) {
      // Reached bottom of push-up
      this.stage = 'down';
      this.feedback = { type: FEEDBACK_TYPE.INFO, message: 'Push back up!' };
    }

    if (this.stage === 'down' && angle > PUSHUP.ELBOW_UP_ANGLE) {
      // Returned to top — count the rep (strict UP_ANGLE required to count)
      if (timestamp - this.lastRepTime > PUSHUP.COOLDOWN_MS) {
        this.reps++;
        this.lastRepTime = timestamp;
        repCounted = true;
        this.feedback = `Good rep! (${this.reps})`;
      }
      this.stage = 'up';
    }

    // Optional form check: hip sag/pike (only during active rep, not after counting)
    if (!repCounted) {
      const lHip = getLandmark(landmarks, LM.L_HIP, 0.4);
      const rHip = getLandmark(landmarks, LM.R_HIP, 0.4);
      if (lShoulder && rShoulder && lHip && rHip) {
        const shoulderMidY = (lShoulder.y + rShoulder.y) / 2;
        const hipMidY      = (lHip.y + rHip.y) / 2;
        const torso = getTorsoLength(landmarks);
        if (torso) {
          const hipDev = Math.abs(hipMidY - shoulderMidY) / torso;
          if (hipDev > 1.0 + PUSHUP.FORM_HIP_DEVIATION_RATIO && this.stage === 'down') {
            this.feedback = { type: FEEDBACK_TYPE.FORM, message: 'Keep hips level — no sagging!' };
          }
        }
      }
    }

    return { repCounted, feedback: this.feedback, stage: this.stage, angle };
  }
}

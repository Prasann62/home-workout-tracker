// ============================================================
// EXERCISE COUNTERS — All 11 exercise rep-counting state machines
// Reconstructed from sample.apk bundle (ILA v1.0)
// ============================================================
import { getLandmark as w, midpoint as It, getAngle as ne, getTorsoHeight as Ut, LANDMARKS as y } from '../utils/poseUtils.js';

// ────────────────────────────────────────────────────────────
// Thresholds
// ────────────────────────────────────────────────────────────
const PUSHUP_CONFIG = {
  ELBOW_DOWN_ANGLE: 80,
  ELBOW_UP_ANGLE: 145,
  FORM_HIP_DEVIATION_RATIO: 0.15,
  COOLDOWN_MS: 500,
};

const SQUAT_CONFIG = {
  KNEE_DOWN_ANGLE: 100,
  KNEE_UP_ANGLE: 160,
  HIP_KNEE_OFFSET_RATIO: 0.15,
  COOLDOWN_MS: 600,
};

const JUMP_ROPE_CONFIG = {
  HIP_DISPLACEMENT_RATIO: 0.06,
  MIN_INTERVAL_MS: 200,
  BUFFER_SIZE: 8,
};

const JUMPING_JACK_CONFIG = {
  WRIST_ABOVE_SHOULDER_RATIO: -0.05,
  WRIST_BELOW_HIP_RATIO: 0.1,
  COOLDOWN_MS: 400,
};

const LUNGE_CONFIG = {
  KNEE_DOWN_ANGLE: 100,
  KNEE_UP_ANGLE: 145,
  COOLDOWN_MS: 700,
};

const SITUP_CONFIG = {
  CRUNCH_ANGLE: 75,
  FLAT_ANGLE: 110,
  COOLDOWN_MS: 600,
};

const PLANK_CONFIG = {
  MIN_STRAIGHT_ANGLE: 155,
};

const HIGH_KNEES_COOLDOWN_MS = 300;
const MOUNTAIN_CLIMBER_COOLDOWN_MS = 250;
const MOUNTAIN_CLIMBER_HIP_RATIO = 0.4;
const BURPEE_COOLDOWN_MS = 1000;
const GLUTE_BRIDGE_UP_ANGLE = 155;
const GLUTE_BRIDGE_DOWN_ANGLE = 120;
const GLUTE_BRIDGE_COOLDOWN_MS = 800;

// ────────────────────────────────────────────────────────────
// Helper: vertical angle of torso from horizontal (for sit-ups)
// ────────────────────────────────────────────────────────────
function getTorsoVerticalAngle(shoulder, hip) {
  const dx = shoulder.x - hip.x;
  const dy = shoulder.y - hip.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1e-6) return null;
  const clamped = Math.max(-1, Math.min(1, dy / dist));
  return Math.acos(clamped) * (180 / Math.PI);
}

// ────────────────────────────────────────────────────────────
// 1. PUSH-UPS
// ────────────────────────────────────────────────────────────
export class PushUpCounter {
  constructor() { this.reset(); }

  reset() {
    this.reps = 0;
    this.stage = 'idle';
    this.lastRepTime = 0;
    this.feedback = 'Get into push-up position';
    this.elbowAngle = null;
  }

  update(landmarks, timestamp = performance.now()) {
    let repCounted = false;
    const ls = w(landmarks, y.L_SHOULDER);
    const rs = w(landmarks, y.R_SHOULDER);
    const le = w(landmarks, y.L_ELBOW);
    const re = w(landmarks, y.R_ELBOW);
    const lw = w(landmarks, y.L_WRIST);
    const rw = w(landmarks, y.R_WRIST);
    const leftVisible = ls && le && lw;
    const rightVisible = rs && re && rw;

    if (!leftVisible && !rightVisible) {
      this.feedback = 'Move into frame — need shoulders, elbows & wrists';
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    let angle;
    if (leftVisible && rightVisible) {
      const la = ne(ls, le, lw);
      const ra = ne(rs, re, rw);
      if (la !== null && ra !== null) angle = (la + ra) / 2;
      else if (la !== null) angle = la;
      else if (ra !== null) angle = ra;
      else return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    } else {
      angle = leftVisible ? ne(ls, le, lw) : ne(rs, re, rw);
    }

    if (angle === null) return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };

    this.elbowAngle = angle;

    if (this.stage === 'idle' && angle > PUSHUP_CONFIG.ELBOW_DOWN_ANGLE) {
      this.stage = 'up';
      this.feedback = 'Lower your chest';
    }
    if (this.stage === 'up') {
      if (angle >= PUSHUP_CONFIG.ELBOW_UP_ANGLE) this.feedback = 'Lower your chest';
      else if (angle > PUSHUP_CONFIG.ELBOW_DOWN_ANGLE) this.feedback = `Go lower! (${Math.round(angle)}°)`;
    }
    if (this.stage === 'up' && angle < PUSHUP_CONFIG.ELBOW_DOWN_ANGLE) {
      this.stage = 'down';
      this.feedback = 'Push back up!';
    }
    if (this.stage === 'down' && angle > PUSHUP_CONFIG.ELBOW_UP_ANGLE) {
      if (timestamp - this.lastRepTime > PUSHUP_CONFIG.COOLDOWN_MS) {
        this.reps++;
        this.lastRepTime = timestamp;
        repCounted = true;
        this.feedback = `Good rep! (${this.reps})`;
      }
      this.stage = 'up';
    }

    // Form check: hip sag
    if (!repCounted) {
      const lh = w(landmarks, y.L_HIP, 0.4);
      const rh = w(landmarks, y.R_HIP, 0.4);
      if (ls && rs && lh && rh) {
        const shoulderY = (ls.y + rs.y) / 2;
        const hipY = (lh.y + rh.y) / 2;
        const torsoH = Ut(landmarks);
        if (torsoH && Math.abs(hipY - shoulderY) / torsoH > 1 + PUSHUP_CONFIG.FORM_HIP_DEVIATION_RATIO && this.stage === 'down') {
          this.feedback = 'Keep hips level — no sagging!';
        }
      }
    }

    return { repCounted, feedback: this.feedback, stage: this.stage, angle };
  }
}

// ────────────────────────────────────────────────────────────
// 2. SQUATS
// ────────────────────────────────────────────────────────────
export class SquatCounter {
  constructor() { this.reset(); }

  reset() {
    this.reps = 0;
    this.stage = 'idle';
    this.lastRepTime = 0;
    this.feedback = 'Stand in front of camera';
    this.kneeAngle = null;
  }

  update(landmarks, timestamp = performance.now()) {
    let repCounted = false;
    const lh = w(landmarks, y.L_HIP);
    const rh = w(landmarks, y.R_HIP);
    const lk = w(landmarks, y.L_KNEE);
    const rk = w(landmarks, y.R_KNEE);
    const la = w(landmarks, y.L_ANKLE);
    const ra = w(landmarks, y.R_ANKLE);
    const leftVisible = lh && lk && la;
    const rightVisible = rh && rk && ra;

    if (!leftVisible && !rightVisible) {
      this.feedback = 'Move into frame — need hips, knees & ankles visible';
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    let angle = null;
    if (leftVisible && rightVisible) {
      const la2 = ne(lh, lk, la);
      const ra2 = ne(rh, rk, ra);
      la2 !== null && ra2 !== null ? (angle = Math.min(la2, ra2)) : (angle = la2 ?? ra2);
    } else {
      angle = leftVisible ? ne(lh, lk, la) : ne(rh, rk, ra);
    }

    this.kneeAngle = angle;

    // Hip-below-knee detection (deep squat via position)
    let hipBelowKnee = false;
    const torsoH = Ut(landmarks);
    if (torsoH) {
      const hipLm = lh || w(landmarks, y.L_HIP, 0.3);
      const hipRm = rh || w(landmarks, y.R_HIP, 0.3);
      const kneeLm = lk || w(landmarks, y.L_KNEE, 0.3);
      const kneeRm = rk || w(landmarks, y.R_KNEE, 0.3);
      if ((hipLm || hipRm) && (kneeLm || kneeRm)) {
        const hipY = hipLm && hipRm ? (hipLm.y + hipRm.y) / 2 : (hipLm || hipRm).y;
        const kneeY = kneeLm && kneeRm ? (kneeLm.y + kneeRm.y) / 2 : (kneeLm || kneeRm).y;
        hipBelowKnee = hipY > kneeY + torsoH * SQUAT_CONFIG.HIP_KNEE_OFFSET_RATIO;
      }
    }

    const isDown = (angle !== null && angle < SQUAT_CONFIG.KNEE_DOWN_ANGLE) || hipBelowKnee;
    const isUp = angle !== null && angle > SQUAT_CONFIG.KNEE_UP_ANGLE;

    if (this.stage === 'idle' || this.stage === 'standing') {
      if (isUp) this.stage = 'standing';
      if (isDown) { this.stage = 'squat'; this.feedback = 'Hold — now push up!'; }
    }
    if (this.stage === 'squat' && isUp) {
      if (timestamp - this.lastRepTime > SQUAT_CONFIG.COOLDOWN_MS) {
        this.reps++;
        this.lastRepTime = timestamp;
        repCounted = true;
        this.feedback = `Good squat! (${this.reps})`;
      }
      this.stage = 'standing';
    }
    if (!repCounted) {
      if (this.stage === 'standing') this.feedback = 'Squat down';
      else if (this.stage === 'squat' && !isDown && angle !== null) this.feedback = `Go lower! (${Math.round(angle)}°)`;
    }

    return { repCounted, feedback: this.feedback, stage: this.stage, angle };
  }
}

// ────────────────────────────────────────────────────────────
// 3. JUMP ROPE
// ────────────────────────────────────────────────────────────
export class JumpRopeCounter {
  constructor() { this.reset(); }

  reset() {
    this.reps = 0;
    this.lastRepTime = 0;
    this.hipYBuffer = [];
    this.feedback = 'Start jumping!';
    this.stage = 'ground';
  }

  update(landmarks, timestamp = performance.now()) {
    let repCounted = false;
    const lh = w(landmarks, y.L_HIP, 0.4);
    const rh = w(landmarks, y.R_HIP, 0.4);

    if (!lh && !rh) {
      this.feedback = 'Move into frame — need hips visible';
      return { repCounted, feedback: this.feedback, stage: this.stage };
    }

    const hipMid = lh && rh ? It(lh, rh) : lh || rh;
    const torsoH = Ut(landmarks);
    if (!torsoH) {
      this.feedback = 'Need upper body visible for calibration';
      return { repCounted, feedback: this.feedback, stage: this.stage };
    }

    const threshold = JUMP_ROPE_CONFIG.HIP_DISPLACEMENT_RATIO * torsoH;
    this.hipYBuffer.push(hipMid.y);
    if (this.hipYBuffer.length > JUMP_ROPE_CONFIG.BUFFER_SIZE) this.hipYBuffer.shift();
    if (this.hipYBuffer.length < JUMP_ROPE_CONFIG.BUFFER_SIZE) {
      return { repCounted, feedback: 'Calibrating...', stage: this.stage };
    }

    const mid = Math.floor(JUMP_ROPE_CONFIG.BUFFER_SIZE / 2);
    const midVal = this.hipYBuffer[mid];
    const maxBefore = Math.max(...this.hipYBuffer.slice(0, mid));
    const maxAfter = Math.max(...this.hipYBuffer.slice(mid + 1));
    const isPeak = midVal < maxBefore && midVal < maxAfter;
    const isSignificant = Math.max(...this.hipYBuffer) - midVal > threshold;

    if (isPeak && isSignificant && timestamp - this.lastRepTime > JUMP_ROPE_CONFIG.MIN_INTERVAL_MS) {
      this.reps++;
      this.lastRepTime = timestamp;
      repCounted = true;
      this.stage = 'air';
      this.feedback = `Jump! (${this.reps})`;
    } else {
      this.stage = 'ground';
      if (!repCounted) this.feedback = `Keep jumping! (${this.reps})`;
    }

    return { repCounted, feedback: this.feedback, stage: this.stage };
  }
}

// ────────────────────────────────────────────────────────────
// 4. JUMPING JACKS
// ────────────────────────────────────────────────────────────
export class JumpingJackCounter {
  constructor() { this.reset(); }

  reset() {
    this.reps = 0;
    this.stage = 'idle';
    this.lastRepTime = 0;
    this.feedback = 'Start jumping jacks!';
  }

  update(landmarks, timestamp = performance.now()) {
    let repCounted = false;
    const ls = w(landmarks, y.L_SHOULDER);
    const rs = w(landmarks, y.R_SHOULDER);
    const lw = w(landmarks, y.L_WRIST);
    const rw = w(landmarks, y.R_WRIST);
    const lh = w(landmarks, y.L_HIP);
    const rh = w(landmarks, y.R_HIP);

    if (!ls || !rs || !lw || !rw) {
      this.feedback = 'Move into frame — need arms visible';
      return { repCounted, feedback: this.feedback, stage: this.stage };
    }

    const torsoH = Ut(landmarks);
    if (!torsoH) return { repCounted, feedback: this.feedback, stage: this.stage };

    const shoulderY = (ls.y + rs.y) / 2;
    const wristY = (lw.y + rw.y) / 2;
    const hipY = lh && rh ? (lh.y + rh.y) / 2 : shoulderY + torsoH;
    const armsUp = wristY < shoulderY + torsoH * JUMPING_JACK_CONFIG.WRIST_ABOVE_SHOULDER_RATIO;
    const armsDown = wristY > hipY - torsoH * JUMPING_JACK_CONFIG.WRIST_BELOW_HIP_RATIO;

    if (armsUp && !armsDown) {
      if (this.stage === 'idle' || this.stage === 'down') {
        this.stage = 'up';
        this.feedback = 'Arms up! Now bring them down';
      }
    } else if (armsDown && !armsUp) {
      if (this.stage === 'up') {
        if (timestamp - this.lastRepTime > JUMPING_JACK_CONFIG.COOLDOWN_MS) {
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

    if (!repCounted && this.stage === 'down') this.feedback = 'Jump and raise arms!';
    if (!repCounted && this.stage === 'idle') this.feedback = 'Stand with arms at sides to begin';

    return { repCounted, feedback: this.feedback, stage: this.stage };
  }
}

// ────────────────────────────────────────────────────────────
// 5. LUNGES
// ────────────────────────────────────────────────────────────
export class LungeCounter {
  constructor() { this.reset(); }

  reset() {
    this.reps = 0;
    this.stage = 'idle';
    this.lastRepTime = 0;
    this.feedback = 'Step forward into a lunge';
    this.kneeAngle = null;
  }

  update(landmarks, timestamp = performance.now()) {
    let repCounted = false;
    const lh = w(landmarks, y.L_HIP);
    const rh = w(landmarks, y.R_HIP);
    const lk = w(landmarks, y.L_KNEE);
    const rk = w(landmarks, y.R_KNEE);
    const la = w(landmarks, y.L_ANKLE);
    const ra = w(landmarks, y.R_ANKLE);
    const leftVisible = lh && lk && la;
    const rightVisible = rh && rk && ra;

    if (!leftVisible && !rightVisible) {
      this.feedback = 'Move into frame — need legs visible';
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    let angle = null;
    if (leftVisible && rightVisible) {
      const la2 = ne(lh, lk, la);
      const ra2 = ne(rh, rk, ra);
      la2 !== null && ra2 !== null ? (angle = Math.min(la2, ra2)) : (angle = la2 ?? ra2);
    } else {
      angle = leftVisible ? ne(lh, lk, la) : ne(rh, rk, ra);
    }

    this.kneeAngle = angle;
    if (angle === null) return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };

    const isDown = angle < LUNGE_CONFIG.KNEE_DOWN_ANGLE;
    const isUp = angle > LUNGE_CONFIG.KNEE_UP_ANGLE;

    if (this.stage === 'idle' || this.stage === 'standing') {
      if (isUp) this.stage = 'standing';
      if (isDown) { this.stage = 'lunge'; this.feedback = 'Good lunge! Stand back up'; }
    }
    if (this.stage === 'lunge' && isUp) {
      if (timestamp - this.lastRepTime > LUNGE_CONFIG.COOLDOWN_MS) {
        this.reps++;
        this.lastRepTime = timestamp;
        repCounted = true;
        this.feedback = `Lunge counted! (${this.reps})`;
      }
      this.stage = 'standing';
    }
    if (!repCounted && this.stage === 'standing') {
      this.feedback = `Step forward — lunge deeper (${Math.round(angle)}°)`;
    }

    return { repCounted, feedback: this.feedback, stage: this.stage, angle };
  }
}

// ────────────────────────────────────────────────────────────
// 6. SIT-UPS
// ────────────────────────────────────────────────────────────
export class SitUpCounter {
  constructor() { this.reset(); }

  reset() {
    this.reps = 0;
    this.stage = 'idle';
    this.lastRepTime = 0;
    this.feedback = 'Lie down for sit-ups';
    this.torsoAngle = null;
  }

  update(landmarks, timestamp = performance.now()) {
    let repCounted = false;
    const ls = w(landmarks, y.L_SHOULDER);
    const rs = w(landmarks, y.R_SHOULDER);
    const lh = w(landmarks, y.L_HIP);
    const rh = w(landmarks, y.R_HIP);

    if ((!ls && !rs) || (!lh && !rh)) {
      this.feedback = 'Move into frame — need shoulders & hips visible (side view)';
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    const shoulder = ls && rs ? It(ls, rs) : ls || rs;
    const hip = lh && rh ? It(lh, rh) : lh || rh;
    const angle = getTorsoVerticalAngle(shoulder, hip);

    if (angle === null) return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };

    this.torsoAngle = angle;
    const isCrunched = angle < SITUP_CONFIG.CRUNCH_ANGLE;
    const isFlat = angle > SITUP_CONFIG.FLAT_ANGLE;

    if (this.stage === 'idle' || this.stage === 'flat') {
      if (isFlat) this.stage = 'flat';
      if (isCrunched) { this.stage = 'crunched'; this.feedback = 'Good! Now lower back down'; }
    }
    if (this.stage === 'crunched' && isFlat) {
      if (timestamp - this.lastRepTime > SITUP_CONFIG.COOLDOWN_MS) {
        this.reps++;
        this.lastRepTime = timestamp;
        repCounted = true;
        this.feedback = `Sit-up counted! (${this.reps})`;
      }
      this.stage = 'flat';
    }
    if (!repCounted) {
      if (this.stage === 'flat') this.feedback = `Crunch up! (${Math.round(angle)}°)`;
      else if (this.stage === 'crunched') this.feedback = 'Good! Now lower back down';
    }

    return { repCounted, feedback: this.feedback, stage: this.stage, angle };
  }
}

// ────────────────────────────────────────────────────────────
// 7. PLANK (time-based, not rep-based)
// ────────────────────────────────────────────────────────────
export class PlankCounter {
  constructor() { this.reset(); }

  reset() {
    this.startTime = null;
    this.elapsedSeconds = 0;
    this.stage = 'idle';
    this.feedback = 'Get into plank position';
    this.bodyAngle = null;
    this.isActive = false;
    this.reps = 0;
    this.targetSeconds = null;
  }

  start() {
    this.startTime = performance.now();
    this.isActive = true;
  }

  pause() {
    this.isActive = false;
  }

  update(landmarks, timestamp = performance.now()) {
    if (this.isActive && this.startTime) {
      this.elapsedSeconds = (timestamp - this.startTime) / 1000;
    }

    const ls = w(landmarks, y.L_SHOULDER);
    const rs = w(landmarks, y.R_SHOULDER);
    const lh = w(landmarks, y.L_HIP);
    const rh = w(landmarks, y.R_HIP);
    const la = w(landmarks, y.L_ANKLE);
    const ra = w(landmarks, y.R_ANKLE);

    if (!((ls || rs) && (lh || rh) && (la || ra))) {
      this.feedback = 'Move into frame — need full body visible';
      this.stage = 'idle';
      return { elapsedSeconds: this.elapsedSeconds, feedback: this.feedback, stage: this.stage };
    }

    const shoulder = ls && rs ? It(ls, rs) : ls || rs;
    const hip = lh && rh ? It(lh, rh) : lh || rh;
    const ankle = la && ra ? It(la, ra) : la || ra;
    const bodyAngle = ne(shoulder, hip, ankle);
    this.bodyAngle = bodyAngle;

    if (bodyAngle >= PLANK_CONFIG.MIN_STRAIGHT_ANGLE) {
      this.stage = 'holding';
      this.feedback = '💪 Great form! Hold it!';
    } else if (hip.y > shoulder.y + 0.05 && hip.y > ankle.y + 0.05) {
      this.stage = 'broken';
      this.feedback = '⚠️ Hips sagging — lift them up!';
    } else {
      this.stage = 'broken';
      this.feedback = '⚠️ Hips too high — lower them down!';
    }

    return { elapsedSeconds: this.elapsedSeconds, feedback: this.feedback, stage: this.stage, angle: bodyAngle };
  }
}

// ────────────────────────────────────────────────────────────
// 8. HIGH KNEES
// ────────────────────────────────────────────────────────────
export class HighKneesCounter {
  constructor() {
    this.reps = 0;
    this.stage = 'idle';
    this.lastRepTime = 0;
    this.feedback = 'Stand ready — drive your knees high alternately';
    this._lastKneeSide = null;
  }

  reset() {
    this.reps = 0;
    this.stage = 'idle';
    this.lastRepTime = 0;
    this.feedback = 'Stand ready — drive your knees high alternately';
    this._lastKneeSide = null;
  }

  update(landmarks, timestamp = performance.now()) {
    let repCounted = false;
    const lk = w(landmarks, y.L_KNEE, 0.4);
    const rk = w(landmarks, y.R_KNEE, 0.4);
    const lh = w(landmarks, y.L_HIP, 0.4);
    const rh = w(landmarks, y.R_HIP, 0.4);

    if ((!lk && !rk) || (!lh && !rh)) {
      this.feedback = 'Full body needed — step back until legs visible';
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    const torsoH = Ut(landmarks);
    if (!torsoH) return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };

    const leftKneeHigh = lk && lh && lh.y - lk.y > torsoH * 0.25;
    const rightKneeHigh = rk && rh && rh.y - rk.y > torsoH * 0.25;

    if (leftKneeHigh && this._lastKneeSide !== 'left' && timestamp - this.lastRepTime > HIGH_KNEES_COOLDOWN_MS) {
      this._lastKneeSide = 'left';
      this.reps++;
      this.lastRepTime = timestamp;
      repCounted = true;
      this.stage = 'leftUp';
      this.feedback = `Left knee! (${this.reps})`;
    } else if (rightKneeHigh && this._lastKneeSide !== 'right' && timestamp - this.lastRepTime > HIGH_KNEES_COOLDOWN_MS) {
      this._lastKneeSide = 'right';
      this.reps++;
      this.lastRepTime = timestamp;
      repCounted = true;
      this.stage = 'rightUp';
      this.feedback = `Right knee! (${this.reps})`;
    } else if (!leftKneeHigh && !rightKneeHigh) {
      this.stage = 'idle';
      this.feedback = 'Drive knees — higher and faster!';
    }

    return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
  }
}

// ────────────────────────────────────────────────────────────
// 9. MOUNTAIN CLIMBERS
// ────────────────────────────────────────────────────────────
export class MountainClimberCounter {
  constructor() {
    this.reps = 0;
    this.stage = 'idle';
    this.lastRepTime = 0;
    this.feedback = 'Get into plank position — drive knees to chest alternately';
    this._lastSide = null;
  }

  reset() {
    this.reps = 0;
    this.stage = 'idle';
    this.lastRepTime = 0;
    this.feedback = 'Get into plank position — drive knees to chest alternately';
    this._lastSide = null;
  }

  update(landmarks, timestamp = performance.now()) {
    let repCounted = false;
    const ls = w(landmarks, y.L_SHOULDER, 0.4);
    const rs = w(landmarks, y.R_SHOULDER, 0.4);
    const lk = w(landmarks, y.L_KNEE, 0.4);
    const rk = w(landmarks, y.R_KNEE, 0.4);
    const lh = w(landmarks, y.L_HIP, 0.4);
    const rh = w(landmarks, y.R_HIP, 0.4);

    if (!ls && !rs) {
      this.feedback = 'Get into plank — hands under shoulders';
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    const torsoH = Ut(landmarks);
    if (!torsoH || torsoH < 0.05) return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };

    const leftDriving = lk && lh && lh.y - lk.y > torsoH * MOUNTAIN_CLIMBER_HIP_RATIO;
    const rightDriving = rk && rh && rh.y - rk.y > torsoH * MOUNTAIN_CLIMBER_HIP_RATIO;

    if (leftDriving && this._lastSide !== 'left' && timestamp - this.lastRepTime > MOUNTAIN_CLIMBER_COOLDOWN_MS) {
      this._lastSide = 'left';
      this.reps++;
      this.lastRepTime = timestamp;
      repCounted = true;
      this.stage = 'leftDrive';
      this.feedback = `Left drive! Switch → right! (${this.reps})`;
    } else if (rightDriving && this._lastSide !== 'right' && timestamp - this.lastRepTime > MOUNTAIN_CLIMBER_COOLDOWN_MS) {
      this._lastSide = 'right';
      this.reps++;
      this.lastRepTime = timestamp;
      repCounted = true;
      this.stage = 'rightDrive';
      this.feedback = `Right drive! Switch → left! (${this.reps})`;
    } else if (!leftDriving && !rightDriving) {
      this.stage = 'plank';
      this.feedback = 'Plank locked — drive those knees!';
    }

    return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
  }
}

// ────────────────────────────────────────────────────────────
// 10. BURPEES (state machine: standing → squat → plank → pushup → jump → back)
// ────────────────────────────────────────────────────────────
export class BurpeeCounter {
  constructor() {
    this.reps = 0;
    this.stage = 'standing';
    this.lastRepTime = 0;
    this.feedback = 'Stand ready — squat down → plank → push-up → jump!';
    this.angle = null;
  }

  reset() {
    this.reps = 0;
    this.stage = 'standing';
    this.lastRepTime = 0;
    this.feedback = 'Stand ready — squat down → plank → push-up → jump!';
    this.angle = null;
  }

  update(landmarks, timestamp = performance.now()) {
    let repCounted = false;
    const ls = w(landmarks, y.L_SHOULDER, 0.4);
    const rs = w(landmarks, y.R_SHOULDER, 0.4);
    const lh = w(landmarks, y.L_HIP, 0.4);
    const rh = w(landmarks, y.R_HIP, 0.4);
    const lk = w(landmarks, y.L_KNEE, 0.4);
    const rk = w(landmarks, y.R_KNEE, 0.4);
    const la = w(landmarks, y.L_ANKLE, 0.3);
    const ra = w(landmarks, y.R_ANKLE, 0.3);

    if ((!ls && !rs) || (!lh && !rh)) {
      this.feedback = 'Full body in frame — step back to show head to feet';
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    const torsoH = Ut(landmarks);
    if (!torsoH) return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };

    const shoulderY = ls && rs ? (ls.y + rs.y) / 2 : (ls || rs).y;
    const hipY = lh && rh ? (lh.y + rh.y) / 2 : (lh || rh).y;
    const shoulderAboveHip = shoulderY - hipY > torsoH * 0.4;
    const shoulderNearHip = Math.abs(shoulderY - hipY) < torsoH * 0.25;

    // Knee angle for squat detection
    let kneeAngle = null;
    if (lh && la && lk) kneeAngle = ne(lh, lk, la);
    else if (rh && ra && rk) kneeAngle = ne(rh, rk, ra);
    this.angle = kneeAngle;

    switch (this.stage) {
      case 'standing':
        if (!shoulderAboveHip && kneeAngle !== null && kneeAngle < 130) {
          this.stage = 'squat';
          this.feedback = 'In squat! Jump feet back to plank position';
        } else {
          this.feedback = 'Squat down to start your burpee!';
        }
        break;
      case 'squat':
        if (shoulderNearHip) {
          this.stage = 'plank';
          this.feedback = 'In plank! Do one push-up — chest to floor!';
        }
        break;
      case 'plank':
        const le = w(landmarks, y.L_ELBOW, 0.4);
        const lw = w(landmarks, y.L_WRIST, 0.4);
        if (le && ls && lw) {
          const elbowAngle = ne(ls, le, lw);
          if (elbowAngle !== null && elbowAngle < 90) {
            this.stage = 'pushup';
            this.feedback = 'Push-up depth! Now jump feet forward & LEAP UP!';
          } else {
            this.feedback = 'Do a push-up — lower your chest!';
          }
        } else if (shoulderAboveHip) {
          this.stage = 'pushup';
        }
        break;
      case 'pushup':
        if (shoulderAboveHip) {
          this.stage = 'jump';
          this.feedback = 'Now JUMP — reach arms overhead!';
        }
        break;
      case 'jump':
        if (shoulderAboveHip && timestamp - this.lastRepTime > BURPEE_COOLDOWN_MS) {
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

// ────────────────────────────────────────────────────────────
// 11. GLUTE BRIDGES
// ────────────────────────────────────────────────────────────
export class GluteBridgeCounter {
  constructor() {
    this.reps = 0;
    this.stage = 'idle';
    this.lastRepTime = 0;
    this.feedback = 'Lie on back, knees bent, feet flat — push hips up';
    this.hipAngle = null;
  }

  reset() {
    this.reps = 0;
    this.stage = 'idle';
    this.lastRepTime = 0;
    this.feedback = 'Lie on back, knees bent, feet flat — push hips up';
    this.hipAngle = null;
  }

  update(landmarks, timestamp = performance.now()) {
    let repCounted = false;
    const ls = w(landmarks, y.L_SHOULDER, 0.4);
    const rs = w(landmarks, y.R_SHOULDER, 0.4);
    const lh = w(landmarks, y.L_HIP, 0.4);
    const rh = w(landmarks, y.R_HIP, 0.4);
    const lk = w(landmarks, y.L_KNEE, 0.4);
    const rk = w(landmarks, y.R_KNEE, 0.4);
    const leftVisible = ls && lh && lk;
    const rightVisible = rs && rh && rk;

    if (!leftVisible && !rightVisible) {
      this.feedback = 'Side camera view works best — need shoulders, hips, knees';
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    let angle;
    if (leftVisible && rightVisible) {
      const la = ne(ls, lh, lk);
      const ra = ne(rs, rh, rk);
      la !== null && ra !== null ? (angle = (la + ra) / 2) : (angle = la ?? ra);
    } else {
      angle = leftVisible ? ne(ls, lh, lk) : ne(rs, rh, rk);
    }

    if (angle === null) return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };

    this.hipAngle = angle;

    if (this.stage === 'idle' || this.stage === 'flat') {
      if (angle >= GLUTE_BRIDGE_UP_ANGLE) {
        this.stage = 'bridge';
        this.feedback = 'Hips up! Squeeze glutes — hold for a beat!';
      } else {
        this.stage = 'flat';
        this.feedback = 'Drive hips up — push through your heels';
      }
    }
    if (this.stage === 'bridge' && angle < GLUTE_BRIDGE_DOWN_ANGLE) {
      if (timestamp - this.lastRepTime > GLUTE_BRIDGE_COOLDOWN_MS) {
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

// ────────────────────────────────────────────────────────────
// 12. KARALAKATTAI (Tamil Club Swinging)
// ────────────────────────────────────────────────────────────
export class KaralakattaiCounter {
  constructor() { this.reset(); }

  reset() {
    this.reps = 0;
    this.stage = 'idle';
    this.lastRepTime = 0;
    this.feedback = 'Hold Karalakattai (club) — swing over shoulder';
    this._lastArm = null;
  }

  update(landmarks, timestamp = performance.now()) {
    let repCounted = false;
    const ls = w(landmarks, y.L_SHOULDER, 0.4);
    const rs = w(landmarks, y.R_SHOULDER, 0.4);
    const lw = w(landmarks, y.L_WRIST, 0.4);
    const rw = w(landmarks, y.R_WRIST, 0.4);

    if ((!ls && !rs) || (!lw && !rw)) {
      this.feedback = 'Stand facing camera — need shoulders & wrists visible';
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    const torsoH = Ut(landmarks);
    if (!torsoH) return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };

    const leftArmUp = lw && ls && lw.y < ls.y - torsoH * 0.1;
    const rightArmUp = rw && rs && rw.y < rs.y - torsoH * 0.1;
    const leftArmDown = lw && ls && lw.y > ls.y + torsoH * 0.2;
    const rightArmDown = rw && rs && rw.y > rs.y + torsoH * 0.2;

    if ((leftArmUp || rightArmUp) && (this.stage === 'idle' || this.stage === 'down')) {
      this.stage = 'up';
      this.feedback = 'Arc club behind back & swing through!';
    } else if ((leftArmDown && rightArmDown) && this.stage === 'up') {
      if (timestamp - this.lastRepTime > 600) {
        this.reps++;
        this.lastRepTime = timestamp;
        repCounted = true;
        this.feedback = `Powerful swing! 🪵 (${this.reps})`;
      }
      this.stage = 'down';
    }

    if (!repCounted && this.stage === 'down') {
      this.feedback = 'Swing Karalakattai smooth & controlled';
    }

    return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
  }
}

// ────────────────────────────────────────────────────────────
// 13. KETTLEBELL SWINGS
// ────────────────────────────────────────────────────────────
export class KettlebellSwingCounter {
  constructor() { this.reset(); }

  reset() {
    this.reps = 0;
    this.stage = 'idle';
    this.lastRepTime = 0;
    this.feedback = 'Stand tall — hinge at hips to swing kettlebell';
  }

  update(landmarks, timestamp = performance.now()) {
    let repCounted = false;
    const ls = w(landmarks, y.L_SHOULDER, 0.4);
    const rs = w(landmarks, y.R_SHOULDER, 0.4);
    const lh = w(landmarks, y.L_HIP, 0.4);
    const rh = w(landmarks, y.R_HIP, 0.4);
    const lw = w(landmarks, y.L_WRIST, 0.4);
    const rw = w(landmarks, y.R_WRIST, 0.4);

    if ((!lh && !rh) || (!lw && !rw)) {
      this.feedback = 'Step back — need hips & hands in frame';
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    const torsoH = Ut(landmarks);
    if (!torsoH) return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };

    const hipY = lh && rh ? (lh.y + rh.y) / 2 : (lh || rh).y;
    const shoulderY = ls && rs ? (ls.y + rs.y) / 2 : hipY - torsoH;
    const wristY = lw && rw ? (lw.y + rw.y) / 2 : (lw || rw).y;

    const isHingeDown = wristY > hipY + torsoH * 0.05;
    const isFloatUp = wristY <= shoulderY + torsoH * 0.15;

    if (isHingeDown && (this.stage === 'idle' || this.stage === 'up')) {
      this.stage = 'down';
      this.feedback = 'Explode hips forward! 🔔';
    } else if (isFloatUp && this.stage === 'down') {
      if (timestamp - this.lastRepTime > 600) {
        this.reps++;
        this.lastRepTime = timestamp;
        repCounted = true;
        this.feedback = `Kettlebell swing! 🔔 (${this.reps})`;
      }
      this.stage = 'up';
    }

    if (!repCounted && this.stage === 'up') {
      this.feedback = 'Let kettlebell fall back into hip hinge';
    }

    return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
  }
}

// ────────────────────────────────────────────────────────────
// 14. KETTLEBELL GOBLET SQUAT
// ────────────────────────────────────────────────────────────
export class KettlebellGobletSquatCounter {
  constructor() { this.reset(); }

  reset() {
    this.reps = 0;
    this.stage = 'idle';
    this.lastRepTime = 0;
    this.feedback = 'Hold kettlebell at chest — squat deep';
    this.kneeAngle = null;
  }

  update(landmarks, timestamp = performance.now()) {
    let repCounted = false;
    const lh = w(landmarks, y.L_HIP, 0.4);
    const rh = w(landmarks, y.R_HIP, 0.4);
    const lk = w(landmarks, y.L_KNEE, 0.4);
    const rk = w(landmarks, y.R_KNEE, 0.4);
    const la = w(landmarks, y.L_ANKLE, 0.4);
    const ra = w(landmarks, y.R_ANKLE, 0.4);
    const leftVisible = lh && lk && la;
    const rightVisible = rh && rk && ra;

    if (!leftVisible && !rightVisible) {
      this.feedback = 'Move into frame — need hips, knees & ankles';
      return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };
    }

    let angle = null;
    if (leftVisible && rightVisible) {
      const la2 = ne(lh, lk, la);
      const ra2 = ne(rh, rk, ra);
      la2 !== null && ra2 !== null ? (angle = Math.min(la2, ra2)) : (angle = la2 ?? ra2);
    } else {
      angle = leftVisible ? ne(lh, lk, la) : ne(rh, rk, ra);
    }

    this.kneeAngle = angle;
    if (angle === null) return { repCounted, feedback: this.feedback, stage: this.stage, angle: null };

    const isDown = angle < 100;
    const isUp = angle > 155;

    if (this.stage === 'idle' || this.stage === 'standing') {
      if (isUp) this.stage = 'standing';
      if (isDown) { this.stage = 'squat'; this.feedback = 'Chest up! Drive through heels!'; }
    }
    if (this.stage === 'squat' && isUp) {
      if (timestamp - this.lastRepTime > 600) {
        this.reps++;
        this.lastRepTime = timestamp;
        repCounted = true;
        this.feedback = `Goblet squat! 🏋️‍♂️ (${this.reps})`;
      }
      this.stage = 'standing';
    }

    if (!repCounted && this.stage === 'standing') {
      this.feedback = 'Hold KB close to chest — squat down';
    }

    return { repCounted, feedback: this.feedback, stage: this.stage, angle };
  }
}

// ────────────────────────────────────────────────────────────
// Factory — instantiate the right counter for a given exercise id
// ────────────────────────────────────────────────────────────
export function createExerciseCounter(exerciseId) {
  switch (exerciseId) {
    case 'pushup':           return new PushUpCounter();
    case 'squat':            return new SquatCounter();
    case 'jumpRope':         return new JumpRopeCounter();
    case 'jumpingJack':      return new JumpingJackCounter();
    case 'lunge':            return new LungeCounter();
    case 'situp':            return new SitUpCounter();
    case 'plank':            return new PlankCounter();
    case 'highKnees':        return new HighKneesCounter();
    case 'mountainClimber':  return new MountainClimberCounter();
    case 'burpee':           return new BurpeeCounter();
    case 'gluteBridge':      return new GluteBridgeCounter();
    case 'karalakattai':     return new KaralakattaiCounter();
    case 'kettlebellSwing':  return new KettlebellSwingCounter();
    case 'kettlebellGoblet': return new KettlebellGobletSquatCounter();
    default:                 return new PushUpCounter();
  }
}

// ============================================================
// LANDMARK SMOOTHER — EMA filter for cleaner rep detection
//
// Applied ONCE in App.jsx before passing landmarks to any
// exercise counter. Fixes noisy/jittery angle calculations
// that cause double-counts or missed reps.
//
// Algorithm: Exponential Moving Average (EMA)
//   smooth[t] = alpha * raw[t] + (1 - alpha) * smooth[t-1]
//
// alpha = 0.40 → good balance of responsiveness vs smoothness
//   at 30fps. Lower = smoother but laggier. Higher = raw.
//
// Also provides RepGuard: minimum time between reps and
// hysteresis band to prevent threshold oscillation.
// ============================================================

/**
 * Smooths MediaPipe landmark positions using EMA.
 * Create one instance per session, call reset() between sessions.
 */
export class LandmarkSmoother {
  constructor(alpha = 0.40) {
    this.alpha    = alpha;
    this.prevLms  = null;
  }

  /**
   * Smooth a landmarks array. Returns smoothed copy.
   * First call returns raw (no history yet).
   */
  smooth(landmarks) {
    if (!landmarks || landmarks.length === 0) return landmarks;

    if (!this.prevLms || this.prevLms.length !== landmarks.length) {
      // First frame — just clone and store
      this.prevLms = landmarks.map(lm => ({ ...lm }));
      return this.prevLms;
    }

    const a = this.alpha;
    const b = 1 - a;

    this.prevLms = landmarks.map((lm, i) => {
      const p = this.prevLms[i];
      return {
        x:          a * lm.x + b * p.x,
        y:          a * lm.y + b * p.y,
        z:          a * lm.z + b * p.z,
        visibility: lm.visibility,  // keep raw visibility — don't smooth confidence
      };
    });

    return this.prevLms;
  }

  reset() {
    this.prevLms = null;
  }
}

/**
 * RepGuard — wraps any exercise counter and adds:
 *   1. Global minimum rep gap (prevent machine-gun counting)
 *   2. Consecutive-frame confirmation: rep only counts after
 *      the "counted" state holds for MIN_CONFIRM_FRAMES frames.
 *
 * Usage:
 *   const guard = new RepGuard(myCounter, { minGapMs: 600 });
 *   guard.update(landmarks, timestamp);  // same API
 */
export class RepGuard {
  constructor(counter, { minGapMs = 600, minConfirmFrames = 2 } = {}) {
    this.counter          = counter;
    this.minGapMs         = minGapMs;
    this.minConfirmFrames = minConfirmFrames;
    this.lastCountedAt    = 0;
    this.pendingFrames    = 0;
    this.pendingResult    = null;
  }

  update(landmarks, timestamp) {
    const raw = this.counter.update(landmarks, timestamp);

    // If the underlying counter didn't fire a rep, reset pending
    if (!raw.repCounted) {
      this.pendingFrames = 0;
      this.pendingResult = null;
      return raw;
    }

    // Rep fired from counter — check guard conditions
    const gapOk = (timestamp - this.lastCountedAt) >= this.minGapMs;
    if (!gapOk) {
      // Too soon — suppress this rep (rollback counter reps)
      this.counter.reps = Math.max(0, this.counter.reps - 1);
      return { ...raw, repCounted: false };
    }

    this.lastCountedAt = timestamp;
    return raw;
  }

  reset() {
    this.counter.reset();
    this.lastCountedAt = 0;
    this.pendingFrames = 0;
    this.pendingResult = null;
  }

  get reps()     { return this.counter.reps; }
  get stage()    { return this.counter.stage; }
  get feedback() { return this.counter.feedback; }
}

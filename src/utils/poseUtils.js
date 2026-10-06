// ============================================================
// POSE UTILITIES — Landmark helpers, angle math, body scale
// ============================================================

/** MediaPipe landmark indices */
export const LANDMARKS = {
  NOSE: 0,
  L_SHOULDER: 11,
  R_SHOULDER: 12,
  L_ELBOW: 13,
  R_ELBOW: 14,
  L_WRIST: 15,
  R_WRIST: 16,
  L_HIP: 23,
  R_HIP: 24,
  L_KNEE: 25,
  R_KNEE: 26,
  L_ANKLE: 27,
  R_ANKLE: 28,
  L_HEEL: 29,
  R_HEEL: 30,
  L_FOOT: 31,
  R_FOOT: 32,
};

/** Skeleton bones for drawing */
export const SKELETON_BONES = [
  [LANDMARKS.L_SHOULDER, LANDMARKS.R_SHOULDER],
  [LANDMARKS.L_SHOULDER, LANDMARKS.L_ELBOW],
  [LANDMARKS.L_ELBOW, LANDMARKS.L_WRIST],
  [LANDMARKS.R_SHOULDER, LANDMARKS.R_ELBOW],
  [LANDMARKS.R_ELBOW, LANDMARKS.R_WRIST],
  [LANDMARKS.L_SHOULDER, LANDMARKS.L_HIP],
  [LANDMARKS.R_SHOULDER, LANDMARKS.R_HIP],
  [LANDMARKS.L_HIP, LANDMARKS.R_HIP],
  [LANDMARKS.L_HIP, LANDMARKS.L_KNEE],
  [LANDMARKS.L_KNEE, LANDMARKS.L_ANKLE],
  [LANDMARKS.R_HIP, LANDMARKS.R_KNEE],
  [LANDMARKS.R_KNEE, LANDMARKS.R_ANKLE],
  [LANDMARKS.L_ANKLE, LANDMARKS.L_HEEL],
  [LANDMARKS.R_ANKLE, LANDMARKS.R_HEEL],
  [LANDMARKS.L_HEEL, LANDMARKS.L_FOOT],
  [LANDMARKS.R_HEEL, LANDMARKS.R_FOOT],
];

export const DEFAULT_VISIBILITY_THRESHOLD = 0.5;

export const DRAW_CONFIG = {
  JOINT_RADIUS: 6,
  BONE_WIDTH: 3,
  LOW_CONFIDENCE_ALPHA: 0.3,
};

/**
 * Get a landmark by index, returning null if visibility is below threshold.
 * @param {Array} landmarks - MediaPipe poseLandmarks array
 * @param {number} idx - Landmark index
 * @param {number} [minVis=0.5] - Minimum visibility threshold
 */
export function getLandmark(landmarks, idx, minVis = DEFAULT_VISIBILITY_THRESHOLD) {
  if (!landmarks || !landmarks[idx]) return null;
  const lm = landmarks[idx];
  return lm.visibility < minVis ? null : lm;
}

/**
 * Compute the midpoint of two landmarks.
 */
export function midpoint(a, b) {
  if (!a || !b) return null;
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: Math.min(a.visibility, b.visibility),
  };
}

/**
 * Compute the angle (in degrees) at vertex B, formed by points A–B–C.
 * Returns null if any point is too close (degenerate triangle).
 */
export function getAngle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const lenAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
  const lenCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y);
  if (lenAB < 1e-6 || lenCB < 1e-6) return null;
  const dot = ab.x * cb.x + ab.y * cb.y;
  const cross = ab.x * cb.y - ab.y * cb.x;
  return Math.abs(Math.atan2(Math.abs(cross), dot) * (180 / Math.PI));
}

/**
 * Estimate torso height (shoulder-to-hip distance in normalized units).
 * Used as a body-scale reference for relative distance thresholds.
 */
export function getTorsoHeight(landmarks) {
  const ls = getLandmark(landmarks, LANDMARKS.L_SHOULDER, 0.3);
  const rs = getLandmark(landmarks, LANDMARKS.R_SHOULDER, 0.3);
  const lh = getLandmark(landmarks, LANDMARKS.L_HIP, 0.3);
  const rh = getLandmark(landmarks, LANDMARKS.R_HIP, 0.3);
  const shoulders = ls && rs ? midpoint(ls, rs) : ls || rs;
  const hips = lh && rh ? midpoint(lh, rh) : lh || rh;
  if (!shoulders || !hips) return null;
  const dist = Math.abs(shoulders.y - hips.y);
  return dist > 0.01 ? dist : null;
}

/**
 * Draw the pose skeleton on a canvas element.
 */
export function drawSkeleton(canvas, landmarks) {
  if (!canvas || !landmarks) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const toX = (lm) => lm.x * canvas.width;
  const toY = (lm) => lm.y * canvas.height;

  // Draw bones
  for (const [ai, bi] of SKELETON_BONES) {
    const a = landmarks[ai];
    const b = landmarks[bi];
    if (!a || !b) continue;
    const conf = Math.min(a.visibility, b.visibility);
    if (conf < 0.3) continue;
    const alpha = conf < DEFAULT_VISIBILITY_THRESHOLD ? DRAW_CONFIG.LOW_CONFIDENCE_ALPHA : Math.min(1, conf);
    // Shadow
    ctx.lineWidth = DRAW_CONFIG.BONE_WIDTH + 2;
    ctx.strokeStyle = `rgba(0,0,0,${alpha * 0.7})`;
    ctx.beginPath();
    ctx.moveTo(toX(a), toY(a));
    ctx.lineTo(toX(b), toY(b));
    ctx.stroke();
    // Accent line
    ctx.lineWidth = DRAW_CONFIG.BONE_WIDTH;
    ctx.strokeStyle = `rgba(255,46,0,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(toX(a), toY(a));
    ctx.lineTo(toX(b), toY(b));
    ctx.stroke();
  }

  // Draw joints
  for (const lm of landmarks) {
    if (!lm || lm.visibility < 0.3) continue;
    const alpha = lm.visibility < DEFAULT_VISIBILITY_THRESHOLD
      ? DRAW_CONFIG.LOW_CONFIDENCE_ALPHA
      : Math.min(1, lm.visibility);
    const x = toX(lm);
    const y = toY(lm);
    const size = DRAW_CONFIG.JOINT_RADIUS * 2;
    ctx.fillStyle = `rgba(0,0,0,${alpha * 0.8})`;
    ctx.fillRect(x - size / 2 - 1, y - size / 2 - 1, size + 2, size + 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(x - size / 2 + 1, y - size / 2 + 1, size - 2, size - 2);
    ctx.fillStyle = `rgba(255,46,0,${alpha})`;
    ctx.fillRect(x - 2, y - 2, 4, 4);
  }
}

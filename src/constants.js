// ============================================================
// REPAI — CENTRALIZED THRESHOLDS & CONFIG
// All tunable values live here — change these to adjust sensitivity.
// ============================================================

// ── Push-Up ─────────────────────────────────────────────────
export const PUSHUP = {
  ELBOW_DOWN_ANGLE: 90,       // angle below this = "down"
  ELBOW_UP_ANGLE: 150,         // angle above this = "up"
  FORM_HIP_DEVIATION_RATIO: 0.40, // very forgiving on hip sag
  COOLDOWN_MS: 500,
};

// ── Squat ────────────────────────────────────────────────────
export const SQUAT = {
  KNEE_DOWN_ANGLE: 100,        // angle below this = "bottom" of squat
  KNEE_UP_ANGLE: 160,          // angle above this = "standing"
  // BUG-04 FIX: was 0.0 (caused false "down" when standing still).
  // 0.15 means hips must be clearly below knees by 15% of torso length.
  HIP_BELOW_KNEE: true,
  HIP_KNEE_OFFSET_RATIO: 0.15,
  COOLDOWN_MS: 600,
};

// ── Jump Rope ────────────────────────────────────────────────
export const JUMP_ROPE = {
  // Normalized against torso length — camera-distance invariant.
  // Lowered from 0.08 to 0.06 to catch smaller/faster jumps.
  HIP_DISPLACEMENT_RATIO: 0.06,
  MIN_INTERVAL_MS: 200,
  BUFFER_SIZE: 8,
};

// ── Jumping Jack ─────────────────────────────────────────────
export const JUMPING_JACK = {
  // Wrist Y relative to shoulder Y (0=same level, negative=above)
  WRIST_ABOVE_SHOULDER_RATIO: -0.05, // wrist_y < shoulder_y + torso * ratio = arms up
  WRIST_BELOW_HIP_RATIO: 0.1,        // wrist_y > hip_y - torso * ratio = arms down
  COOLDOWN_MS: 400,
};

// ── Lunge ────────────────────────────────────────────────────
export const LUNGE = {
  KNEE_DOWN_ANGLE: 100,
  KNEE_UP_ANGLE: 145,          // relaxed from 155 — easier to register standing
  COOLDOWN_MS: 700,
};

// ── Sit-Up ───────────────────────────────────────────────────
export const SITUP = {
  // Torso angle: angle between shoulder→hip vector and vertical axis (down = 0°).
  // See situp.js:getTorsoAngle() for the exact computation.
  // ~0-30°  = fully crunched (torso raised, shoulder above hip, vector points down)
  // ~80-90° = lying flat (torso horizontal, vector points sideways)
  // Updated thresholds for new vector-based measurement (BUG-06 fix).
  CRUNCH_ANGLE: 75,   // below this = fully crunched (was 60, most people reach ~75°)
  FLAT_ANGLE: 110,    // above this = lying flat (was 130, too strict; relaxed to 110)
  COOLDOWN_MS: 600,
};

// ── Plank ────────────────────────────────────────────────────
export const PLANK = {
  // Straight line check: shoulder-hip-ankle angle should be near 180°
  MIN_STRAIGHT_ANGLE: 155,     // below this = hips sagging or piking
  MAX_STRAIGHT_ANGLE: 205,     // (for piked hips — angle wraps)
};

// ── Bicep Curl ───────────────────────────────────────────────
export const BICEP_CURL = {
  ELBOW_DOWN_ANGLE: 45,       // flexed at top of curl (below 45°)
  ELBOW_UP_ANGLE: 140,        // extended at bottom of curl (above 140°)
  COOLDOWN_MS: 500,
};

// ── Visibility ───────────────────────────────────────────────
export const VISIBILITY_THRESHOLD = 0.6; // MediaPipe landmark visibility minimum (0.6 for high confidence)

// ── Skeleton Drawing ─────────────────────────────────────────
export const SKELETON = {
  JOINT_COLOR: '#00ff88',               // neon green — readable on any video background
  BONE_COLOR: 'rgba(255, 107, 53, 0.85)', // orange — matches app accent, visible on video
  JOINT_RADIUS: 6,
  BONE_WIDTH: 3,
  LOW_CONFIDENCE_ALPHA: 0.3,
};


// ── Calorie Estimates (MET × weight × duration) ──────────────
// MET values are rough estimates for moderate intensity
export const MET = {
  pushup: 3.8,
  squat: 5.0,
  jumpRope: 10.0,
  jumpingJack: 8.0,
  lunge: 4.0,
  situp: 3.5,
  plank: 3.0,
};

// Default user weight (kg) — used for calorie estimation
export const DEFAULT_WEIGHT_KG = 70;

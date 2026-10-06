// ============================================================
// ILA FORM COACH — Real-time AI Pose Analysis & Coaching
//
// Analyses live landmarks each frame and returns specific,
// actionable coaching tips beyond simple stage feedback.
// Covers posture, depth, alignment, tempo — not just counting.
// ============================================================
import { getLandmark, getAngle, getTorsoLength, LM } from './poseUtils.js';

// ── Body Alignment Helper ─────────────────────────────────────
/**
 * Check if shoulders, hips and ankles form a straight plank line.
 * Returns deviation ratio relative to torso length. 0 = perfect.
 */
function getBodyAlignmentDeviation(landmarks) {
  const lS = getLandmark(landmarks, LM.L_SHOULDER, 0.4);
  const rS = getLandmark(landmarks, LM.R_SHOULDER, 0.4);
  const lH = getLandmark(landmarks, LM.L_HIP, 0.4);
  const rH = getLandmark(landmarks, LM.R_HIP, 0.4);
  const lA = getLandmark(landmarks, LM.L_ANKLE, 0.3);
  const rA = getLandmark(landmarks, LM.R_ANKLE, 0.3);
  if (!lS && !rS) return null;
  if (!lH && !rH) return null;
  const torso = getTorsoLength(landmarks);
  if (!torso) return null;
  const sY = lS && rS ? (lS.y + rS.y) / 2 : (lS || rS).y;
  const hY = lH && rH ? (lH.y + rH.y) / 2 : (lH || rH).y;
  const aY = lA && rA ? (lA.y + rA.y) / 2 : lA ? lA.y : rA ? rA.y : null;
  if (!aY) return null;
  // Ideal: shoulder < hip < ankle (Y increases downward in normalized coords)
  // Deviation: how far hips deviate from a straight shoulder-ankle line
  const expectedHipY = sY + (aY - sY) * ((hY - sY) / (aY - sY));
  return Math.abs(hY - expectedHipY) / torso;
}

// ── Individual Exercise Coaching ──────────────────────────────

function coachPushup(landmarks, stage, angle) {
  const tips = [];

  // Hip alignment (plank line)
  const dev = getBodyAlignmentDeviation(landmarks);
  if (dev !== null) {
    const lH = getLandmark(landmarks, LM.L_HIP, 0.3);
    const rH = getLandmark(landmarks, LM.R_HIP, 0.3);
    const lS = getLandmark(landmarks, LM.L_SHOULDER, 0.3);
    const rS = getLandmark(landmarks, LM.R_SHOULDER, 0.3);
    if (lH && rH && lS && rS) {
      const hipY = (lH.y + rH.y) / 2;
      const shoulderY = (lS.y + rS.y) / 2;
      if (hipY < shoulderY - 0.08) tips.push('🚨 Hips are piking up — flatten your back');
      else if (dev > 0.18) tips.push('⚠️ Hips sagging — engage your core to stay flat');
    }
  }

  // Depth coaching
  if (angle !== null) {
    if (stage === 'up' && angle > 155) tips.push('✅ Arms locked — now lower your chest to floor');
    else if (stage === 'up' && angle > 100) tips.push('💪 Good position — lower deeper next rep');
    if (stage === 'down' && angle > 90) tips.push('⬇️ Go lower — chest should touch the floor');
    if (stage === 'down' && angle <= 90) tips.push('✅ Great depth! Push explosively back up');
  }

  // Head position (nose relative to shoulders)
  const nose = getLandmark(landmarks, LM.NOSE, 0.4);
  const lS = getLandmark(landmarks, LM.L_SHOULDER, 0.4);
  const rS = getLandmark(landmarks, LM.R_SHOULDER, 0.4);
  if (nose && lS && rS) {
    const sX = (lS.x + rS.x) / 2;
    if (Math.abs(nose.x - sX) > 0.15) tips.push('👀 Keep head neutral — look at floor below you');
  }

  return tips.length ? tips[0] : null;
}

function coachSquat(landmarks, stage, angle) {
  const tips = [];

  const lK = getLandmark(landmarks, LM.L_KNEE, 0.4);
  const rK = getLandmark(landmarks, LM.R_KNEE, 0.4);
  const lA = getLandmark(landmarks, LM.L_ANKLE, 0.4);
  const rA = getLandmark(landmarks, LM.R_ANKLE, 0.4);

  // Knee cave check (knees should track over toes - align with ankles)
  if (lK && rK && lA && rA) {
    const kneeGap = Math.abs(lK.x - rK.x);
    const ankleGap = Math.abs(lA.x - rA.x);
    if (kneeGap < ankleGap * 0.75 && stage === 'squat') {
      tips.push('🦵 Knees caving in — push them outward over your toes');
    }
  }

  // Depth coaching
  if (angle !== null) {
    if (stage === 'standing' && angle < 160) tips.push('🔼 Stand tall — fully extend your hips at the top');
    if (stage === 'squat' && angle > 100) tips.push('⬇️ Squat deeper — thighs parallel to floor or below');
    if (stage === 'squat' && angle <= 100) tips.push('✅ Good depth! Drive through your heels to stand');
  }

  // Forward lean check
  const lShoulder = getLandmark(landmarks, LM.L_SHOULDER, 0.4);
  const rShoulder = getLandmark(landmarks, LM.R_SHOULDER, 0.4);
  const lHip = getLandmark(landmarks, LM.L_HIP, 0.4);
  const rHip = getLandmark(landmarks, LM.R_HIP, 0.4);
  if (lShoulder && rShoulder && lHip && rHip) {
    const sX = (lShoulder.x + rShoulder.x) / 2;
    const hX = (lHip.x + rHip.x) / 2;
    if (Math.abs(sX - hX) > 0.12 && stage === 'squat') {
      tips.push('🔺 Too much forward lean — chest up, keep torso more vertical');
    }
  }

  return tips.length ? tips[0] : null;
}

function coachLunge(landmarks, stage, angle) {
  if (angle !== null) {
    if (stage === 'standing' && angle < 155) return '🔼 Stand up fully — lock out both legs';
    if (stage === 'lunge' && angle > 110) return '⬇️ Lower deeper — front knee to 90° bend';
    if (stage === 'lunge' && angle <= 90) return '✅ Perfect depth! Push back up through front heel';
    if (stage === 'lunge' && angle <= 110) return '💪 Good! Try going a little deeper';
  }

  // Check if front knee is tracking over foot (not caving inward)
  const lK = getLandmark(landmarks, LM.L_KNEE, 0.4);
  const lA = getLandmark(landmarks, LM.L_ANKLE, 0.4);
  if (lK && lA && Math.abs(lK.x - lA.x) > 0.1) {
    return '⚠️ Front knee tracking off — keep it in line with your foot';
  }

  return null;
}

function coachSitup(landmarks, stage, angle) {
  const tips = [];
  if (angle !== null) {
    if (stage === 'flat' && angle < 80) return '🔽 Lie flat — relax your torso fully down';
    if (stage === 'crunched' && angle > 75) return '🔺 Crunch higher — bring chest to knees';
    if (stage === 'crunched' && angle <= 75) return '✅ Great crunch! Now lower slowly back down';
  }

  // Check for neck strain (nose position)
  const nose = getLandmark(landmarks, LM.NOSE, 0.5);
  const lShoulder = getLandmark(landmarks, LM.L_SHOULDER, 0.5);
  const rShoulder = getLandmark(landmarks, LM.R_SHOULDER, 0.5);
  if (nose && lShoulder && rShoulder && stage === 'crunched') {
    // If nose is way forward of shoulders in X they're pulling on neck
    const sX = (lShoulder.x + rShoulder.x) / 2;
    if (Math.abs(nose.x - sX) > 0.18) tips.push('🧠 Don\'t pull your neck — hands light behind head');
  }

  return tips.length ? tips[0] : null;
}

function coachJumpingJack(landmarks, stage) {
  const lW = getLandmark(landmarks, LM.L_WRIST, 0.4);
  const rW = getLandmark(landmarks, LM.R_WRIST, 0.4);
  const lShoulder = getLandmark(landmarks, LM.L_SHOULDER, 0.4);
  const rShoulder = getLandmark(landmarks, LM.R_SHOULDER, 0.4);

  if (stage === 'armsDown') return '⬆️ Full rep — raise both arms above head & jump feet apart';
  if (stage === 'armsUp') {
    if (lW && rW && lShoulder && rShoulder) {
      const wristAvgY = (lW.y + rW.y) / 2;
      const shoulderAvgY = (lShoulder.y + rShoulder.y) / 2;
      if (wristAvgY > shoulderAvgY) return '⬆️ Raise arms fully overhead — above your shoulders';
    }
    return '✅ Arms up! Jump feet back together';
  }
  return '🙆 Stand ready — arms at sides, feet together';
}

function coachPlank(landmarks) {
  const dev = getBodyAlignmentDeviation(landmarks);
  if (dev === null) return '📐 Get into plank — hands under shoulders, body straight';
  if (dev > 0.2) return '⚠️ Hips off line — squeeze glutes and core to straighten';
  if (dev > 0.1) return '💪 Good plank — keep squeezing your core';
  return '✅ Perfect alignment — breathe steadily, hold strong';
}

function coachHighKnees(landmarks, stage) {
  const lK = getLandmark(landmarks, LM.L_KNEE, 0.4);
  const rK = getLandmark(landmarks, LM.R_KNEE, 0.4);
  const lH = getLandmark(landmarks, LM.L_HIP, 0.4);
  const rH = getLandmark(landmarks, LM.R_HIP, 0.4);
  if (!lK && !rK) return '🏃 Stand ready — begin driving your knees high';
  if (lH && lK && lK.y > lH.y - 0.04) return '🦵 Drive left knee to hip height — higher!';
  if (rH && rK && rK.y > rH.y - 0.04) return '🦵 Drive right knee to hip height — higher!';
  return '✅ Great height! Maintain your running posture';
}

function coachMountainClimber(landmarks, stage) {
  const lK = getLandmark(landmarks, LM.L_KNEE, 0.4);
  const rK = getLandmark(landmarks, LM.R_KNEE, 0.4);
  const lShoulder = getLandmark(landmarks, LM.L_SHOULDER, 0.4);
  const rShoulder = getLandmark(landmarks, LM.R_SHOULDER, 0.4);

  if (!lShoulder && !rShoulder) return '🏔️ Get into plank position — arms straight, core tight';

  const dev = getBodyAlignmentDeviation(landmarks);
  if (dev !== null && dev > 0.2) return '⚠️ Hips rising — keep your plank position flat';

  if (stage === 'leftDrive') return '✅ Left knee driving! Switch — right knee up now!';
  if (stage === 'rightDrive') return '✅ Right knee driving! Switch — left knee up now!';
  return '🔥 Faster alternating drives — keep hips low!';
}

function coachBurpee(landmarks, stage) {
  if (stage === 'standing') return '🔽 Squat down — place hands on floor and jump back';
  if (stage === 'plank') return '⬇️ Do a push-up — chest to floor!';
  if (stage === 'pushup') return '🔺 Jump feet to hands — then leap up!';
  if (stage === 'jump') return '✅ Full extension — reach arms overhead!';
  return '💥 Full body — squat, plank, push-up, jump!';
}

function coachGluteBridge(landmarks, stage, angle) {
  if (angle !== null) {
    if (stage === 'flat') return '🔺 Push hips to ceiling — squeeze your glutes hard';
    if (stage === 'bridge') {
      if (angle > 160) return '✅ Peak contraction — hold for 1 second!';
      return '🔺 Push higher — full hip extension at the top';
    }
  }
  return '🍑 Lie on back, knees bent, feet flat. Drive hips up.';
}

// ── Main Coaching Dispatcher ──────────────────────────────────
/**
 * Returns one real-time coaching tip for the current exercise and pose.
 *
 * @param {string} exercise - exercise ID
 * @param {Array} landmarks - full MediaPipe poseLandmarks array
 * @param {string} stage - current state machine stage
 * @param {number|null} angle - primary joint angle (degrees) or null
 * @returns {string|null} - coaching tip string, or null if no special tip
 */
export function getCoachingTip(exercise, landmarks, stage, angle) {
  if (!landmarks) return null;
  try {
    switch (exercise) {
      case 'pushup':       return coachPushup(landmarks, stage, angle);
      case 'squat':        return coachSquat(landmarks, stage, angle);
      case 'lunge':        return coachLunge(landmarks, stage, angle);
      case 'situp':        return coachSitup(landmarks, stage, angle);
      case 'jumpingJack':  return coachJumpingJack(landmarks, stage);
      case 'plank':        return coachPlank(landmarks);
      case 'highKnees':    return coachHighKnees(landmarks, stage);
      case 'mountainClimber': return coachMountainClimber(landmarks, stage);
      case 'burpee':       return coachBurpee(landmarks, stage);
      case 'gluteBridge':  return coachGluteBridge(landmarks, stage, angle);
      default:             return null;
    }
  } catch (e) {
    return null; // Never crash the frame loop
  }
}

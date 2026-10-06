// ============================================================
// AUDIO UTILITIES — Web Audio API beeps + mobile vibration
// ============================================================

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (browsers require user gesture)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a short synthesized beep tone.
 * @param {number} freq - Frequency in Hz (default 880 = A5, satisfying "ding")
 * @param {number} duration - Duration in seconds
 * @param {string} type - Oscillator type: 'sine' | 'square' | 'triangle' | 'sawtooth'
 * @param {number} gain - Volume 0-1
 */
export function playBeep(freq = 880, duration = 0.12, type = 'sine', gain = 0.4) {
  try {
    const ctx = getAudioCtx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

    // Envelope: fast attack, quick decay to avoid clicks
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    // Silently ignore audio errors (e.g. no audio hardware)
    console.warn('Audio playback failed:', e);
  }
}

/**
 * Play a "good rep" sound — two ascending tones.
 */
export function playRepSound() {
  playBeep(660, 0.08, 'sine', 0.35);
  setTimeout(() => playBeep(880, 0.12, 'sine', 0.4), 80);
}

/**
 * Trigger device vibration (mobile only, requires user gesture).
 * @param {number} duration - Duration in ms
 */
export function triggerVibration(duration = 50) {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration);
  }
}

/**
 * Combined rep feedback: sound + vibration.
 * @param {boolean} soundEnabled
 * @param {boolean} vibrationEnabled
 */
export function repFeedback(soundEnabled = true, vibrationEnabled = true) {
  if (soundEnabled) playRepSound();
  if (vibrationEnabled) triggerVibration(60);
}

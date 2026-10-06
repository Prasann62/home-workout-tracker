// Audio & haptic feedback utilities
let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

export function playTone(freq = 880, duration = 0.12, type = 'sine', volume = 0.4) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
}

export function playRepSound() {
  playTone(660, 0.08, 'sine', 0.35);
  setTimeout(() => playTone(880, 0.12, 'sine', 0.4), 80);
}

export function vibrate(ms = 50) {
  if ('vibrate' in navigator) navigator.vibrate(ms);
}

export function onRepCounted(soundEnabled = true, vibrationEnabled = true) {
  if (soundEnabled) playRepSound();
  if (vibrationEnabled) vibrate(60);
}

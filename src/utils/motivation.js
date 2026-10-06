// ============================================================
// MOTIVATION SYSTEM
//
// Provides:
//  - Quote pools for each trigger type (30+ lines each)
//  - A picker that avoids repeating the same quote twice in a row
//  - Web Speech API wrapper for optional voice hype
//  - Trigger helpers called from App.jsx
// ============================================================

// ── Quote Pools ───────────────────────────────────────────────

const QUOTES_EVERY_5 = [
  "Let's go! 🔥",
  "You're on fire!",
  "Keep that rhythm!",
  "That's how it's done!",
  "Crushing it! 💪",
  "Don't stop now!",
  "Feel the burn!",
  "Momentum is everything!",
  "5 more — you've got this!",
  "Machine mode activated 🤖",
  "Every rep counts!",
  "Breathe and push!",
  "You're stronger than you think!",
  "That's the spirit!",
  "No days off! 🏋️",
  "Lock in — stay focused!",
  "Champions don't quit!",
  "Push through the pain!",
  "Beast mode: ON 🦁",
  "Look how far you've come!",
  "Consistency is the key!",
  "Outwork yesterday!",
  "Dig deep!",
  "One rep at a time!",
  "Your future self is watching!",
  "Pain is temporary — glory is forever!",
  "Grind now, shine later ✨",
  "Keep the bar moving!",
  "No excuses, only results!",
  "You started — now FINISH!",
];

const QUOTES_PERSONAL_BEST = [
  "NEW PERSONAL BEST! 🏆",
  "Record shattered! Keep going!",
  "You just set a new standard! 🎯",
  "HISTORY MADE! 💥",
  "That's a PR! Own it!",
  "Unstoppable! New high score! 🚀",
  "You broke your own record! 🏅",
  "Personal best! The bar just got higher!",
  "That's elite level right there! ⭐",
  "New record! Don't you dare stop! 🔥",
  "You just leveled up! 🎮",
  "Legendary! PB destroyed! 💪",
];

const QUOTES_START = [
  "Let's work! 💥",
  "Time to get after it! 🔥",
  "Session started — no excuses!",
  "Game time! Show up and show out! 💪",
  "This is YOUR time. Make it count!",
  "Warm up done, now WORK!",
  "Every rep brings you closer to your goal!",
  "Let's build something great today!",
  "Focus. Breathe. Execute. 🎯",
  "Your only competition is yesterday's you!",
  "Go time! 🚀",
  "Today we get better!",
];

const QUOTES_STOP = [
  "Great session! Recovery earned 🙌",
  "That's a wrap! Well done! 🎉",
  "Another day stronger! 💪",
  "Session complete! You showed up — that's everything!",
  "Rest now. Attack harder tomorrow!",
  "Results take time. You're building them! ✨",
  "Proud of you! Now refuel and rest 🍎",
  "Job done! Your body is saying thank you!",
  "Finished! Now let's see those gains! 💥",
  "Every session moves the needle. Solid work!",
];

const QUOTES_PLANK_HALFWAY = [
  "Halfway! Hold that form! 🧘",
  "You're through the hardest part — HOLD!",
  "Core of steel — keep it tight!",
  "50% done! Don't you dare drop! 🔥",
  "Breathe! You're almost there!",
  "Halfway through! Finish what you started!",
  "Iron core — don't break! 💪",
  "Plank game strong! Keep going!",
  "Midpoint — this is where champions are made!",
  "Stay still. Stay strong. You've got this!",
];

const QUOTES_MILESTONE = {
  10: ["10 reps! Double digits! 🔟", "Perfect 10! Keep stacking! 💪"],
  20: ["20 reps! You're in the zone! 🔥", "Twenty and counting — unstoppable!"],
  25: ["25 reps! A quarter century! 💥", "25 down — let's push for 50!"],
  50: ["FIFTY REPS! Legend! 🏆", "50 reps — absolute beast mode! 🦁"],
  100: ["ONE HUNDRED! You're a machine! 🤖", "100 reps! Hall of fame material! ⭐"],
};

// ── Anti-Repeat Picker ────────────────────────────────────────
const lastPicked = {};

/**
 * Pick a random quote from a pool, avoiding the last shown quote.
 * @param {string} poolName - key for tracking last pick
 * @param {string[]} pool - array of quotes
 * @returns {string}
 */
function pickQuote(poolName, pool) {
  if (pool.length === 1) return pool[0];
  let idx;
  do {
    idx = Math.floor(Math.random() * pool.length);
  } while (idx === lastPicked[poolName]);
  lastPicked[poolName] = idx;
  return pool[idx];
}

// ── Voice / Speech Synthesis ─────────────────────────────────

let voiceEnabled = true;
let voiceMuted   = false;
let lastSpokenTime = 0;
const SPEECH_THROTTLE_MS = 2500;

/**
 * Set whether voice hype is active.
 */
export function setVoiceEnabled(enabled) {
  voiceEnabled = enabled;
}

export function setVoiceMuted(muted) {
  voiceMuted = muted;
}

/**
 * Speak a string using the Web Speech API.
 * Works offline, no API cost, supported in Capacitor WebView.
 * @param {string} text
 */
export function speak(text, priority = false) {
  if (!voiceEnabled || voiceMuted) return;
  if (!window.speechSynthesis) return;

  const now = Date.now();
  if (!priority && now - lastSpokenTime < SPEECH_THROTTLE_MS) return;

  // Cancel any ongoing speech so new quote fires immediately
  window.speechSynthesis.cancel();

  // Strip emoji for cleaner speech
  const cleaned = text.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim();
  if (!cleaned) return;

  lastSpokenTime = now;

  const utter = new SpeechSynthesisUtterance(cleaned);
  utter.rate   = 1.1;   // slightly faster — energetic feel
  utter.pitch  = 1.1;   // slightly higher — enthusiastic
  utter.volume = 0.9;

  // Prefer a female English voice if available (tends to feel more encouraging)
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')
  ) || voices.find(
    (v) => v.lang.startsWith('en')
  );
  if (preferred) utter.voice = preferred;

  window.speechSynthesis.speak(utter);
}

// ── Trigger Functions (called from App.jsx) ───────────────────

/**
 * Returns the motivational quote for a 5-rep milestone.
 * Call this whenever reps % 5 === 0.
 */
export function getEvery5Quote() {
  return pickQuote('every5', QUOTES_EVERY_5);
}

/**
 * Returns a personal-best quote.
 */
export function getPersonalBestQuote() {
  return pickQuote('pb', QUOTES_PERSONAL_BEST);
}

/**
 * Returns a session-start quote.
 */
export function getStartQuote() {
  return pickQuote('start', QUOTES_START);
}

/**
 * Returns a session-end quote.
 */
export function getStopQuote() {
  return pickQuote('stop', QUOTES_STOP);
}

/**
 * Returns a plank halfway quote.
 */
export function getPlankHalfwayQuote() {
  return pickQuote('plankHalf', QUOTES_PLANK_HALFWAY);
}

/**
 * Returns a milestone quote for a specific rep count, or null if no milestone.
 */
export function getMilestoneQuote(reps) {
  const milestones = Object.keys(QUOTES_MILESTONE).map(Number).sort((a, b) => a - b);
  if (milestones.includes(reps)) {
    const pool = QUOTES_MILESTONE[reps];
    return pickQuote(`milestone_${reps}`, pool);
  }
  return null;
}

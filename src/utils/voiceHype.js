// ============================================================
// VOICE HYPE — Speech synthesis motivational messages
// Reconstructed from sample.apk
// ============================================================

let voiceEnabled = true;
let voiceBlocked = false;

const EVERY5_PHRASES = [
  "Let's go! 🔥", "You're on fire!", "Keep that rhythm!",
  "That's how it's done!", "Crushing it! 💪", "Don't stop now!",
  "Feel the burn!", "Momentum is everything!", "5 more — you've got this!",
  "Machine mode activated 🤖", "Every rep counts!", "Breathe and push!",
  "You're stronger than you think!", "That's the spirit!", "No days off! 🏋️",
  "Lock in — stay focused!", "Champions don't quit!", "Push through the pain!",
  "Beast mode: ON 🦁", "Look how far you've come!", "Consistency is the key!",
  "Outwork yesterday!", "Dig deep!", "One rep at a time!",
  "Your future self is watching!", "Pain is temporary — glory is forever!",
  "Grind now, shine later ✨", "Keep the bar moving!",
  "No excuses, only results!", "You started — now FINISH!",
];

const PB_PHRASES = [
  "NEW PERSONAL BEST! 🏆", "Record shattered! Keep going!",
  "You just set a new standard! 🎯", "HISTORY MADE! 💥",
  "That's a PR! Own it!", "Unstoppable! New high score! 🚀",
  "You broke your own record! 🏅", "Personal best! The bar just got higher!",
  "That's elite level right there! ⭐", "New record! Don't you dare stop! 🔥",
  "You just leveled up! 🎮", "Legendary! PB destroyed! 💪",
];

const START_PHRASES = [
  "Let's work! 💥", "Time to get after it! 🔥",
  "Session started — no excuses!", "Game time! Show up and show out! 💪",
  "This is YOUR time. Make it count!", "Warm up done, now WORK!",
  "Every rep brings you closer to your goal!", "Let's build something great today!",
  "Focus. Breathe. Execute. 🎯", "Your only competition is yesterday's you!",
  "Go time! 🚀", "Today we get better!",
];

const STOP_PHRASES = [
  "Great session! Recovery earned 🙌", "That's a wrap! Well done! 🎉",
  "Another day stronger! 💪", "Session complete! You showed up — that's everything!",
  "Rest now. Attack harder tomorrow!", "Results take time. You're building them! ✨",
  "Proud of you! Now refuel and rest 🍎", "Job done! Your body is saying thank you!",
  "Finished! Now let's see those gains! 💥", "Every session moves the needle. Solid work!",
];

const PLANK_HALF_PHRASES = [
  "Halfway! Hold that form! 🧘", "You're through the hardest part — HOLD!",
  "Core of steel — keep it tight!", "50% done! Don't you dare drop! 🔥",
  "Breathe! You're almost there!", "Halfway through! Finish what you started!",
  "Iron core — don't break! 💪", "Plank game strong! Keep going!",
  "Midpoint — this is where champions are made!", "Stay still. Stay strong. You've got this!",
];

const MILESTONE_PHRASES = {
  10:  ["10 reps! Double digits! 🔟", "Perfect 10! Keep stacking! 💪"],
  20:  ["20 reps! You're in the zone! 🔥", "Twenty and counting — unstoppable!"],
  25:  ["25 reps! A quarter century! 💥", "25 down — let's push for 50!"],
  50:  ["FIFTY REPS! Legend! 🏆", "50 reps — absolute beast mode! 🦁"],
  100: ["ONE HUNDRED! You're a machine! 🤖", "100 reps! Hall of fame material! ⭐"],
};

// Avoid same phrase twice in a row
const lastIndices = {};
function pickRandom(key, phrases) {
  if (phrases.length === 1) return phrases[0];
  let idx;
  do { idx = Math.floor(Math.random() * phrases.length); }
  while (idx === lastIndices[key]);
  lastIndices[key] = idx;
  return phrases[idx];
}

export function setVoiceEnabled(enabled) { voiceEnabled = enabled; }

export function speak(text) {
  if (!voiceEnabled || voiceBlocked || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim();
  if (!clean) return;
  const utt = new SpeechSynthesisUtterance(clean);
  utt.rate = 1.1;
  utt.pitch = 1.1;
  utt.volume = 0.9;
  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')) ||
    voices.find(v => v.lang.startsWith('en'));
  if (voice) utt.voice = voice;
  window.speechSynthesis.speak(utt);
}

export function getEvery5Phrase()    { return pickRandom('every5', EVERY5_PHRASES); }
export function getPBPhrase()        { return pickRandom('pb', PB_PHRASES); }
export function getStartPhrase()     { return pickRandom('start', START_PHRASES); }
export function getStopPhrase()      { return pickRandom('stop', STOP_PHRASES); }
export function getPlankHalfPhrase() { return pickRandom('plankHalf', PLANK_HALF_PHRASES); }

export function getMilestonePhrase(repCount) {
  const key = Number(repCount);
  const milestone = Object.keys(MILESTONE_PHRASES).map(Number).sort((a,b) => b-a).find(m => m === key);
  if (!milestone) return null;
  return pickRandom(`milestone_${milestone}`, MILESTONE_PHRASES[milestone]);
}

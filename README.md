<div align="center">

# 🏋️ ILA — Intelligent Lift Assistant

### AI-Powered Home Workout Tracker with Real-Time Pose Detection

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Pose-FF6F00?style=for-the-badge&logo=google)](https://google.github.io/mediapipe/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android-119EFF?style=for-the-badge&logo=capacitor)](https://capacitorjs.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> **ILA** counts your reps, checks your form, and tracks your progress — all using your phone camera, completely offline.

</div>

---

## ✨ Features

### 🤖 AI-Powered Rep Counting
- **Real-time pose detection** using MediaPipe (fully offline — no internet needed)
- **14 exercises** tracked with AI landmark analysis
- **Auto form feedback** — live cues to correct your posture
- **Plank auto-pause** — timer stops automatically when your form breaks

### 🥊 Fight Sports Trainer
- AI strike detection (jab, cross, hook, uppercut)
- **Guard rating system** with hands-up warning
- Audio impact sounds & PPM (punches per minute) gauge
- Special training modes: Burnout Speed Sprint, Reflex Guard, Combo Master, MMA Total Combat

### 🪵 Classic Tamil Workouts
- **Karalakattai** (Tamil club swinging) — AI swing arc detection
- Traditional exercise heritage meets modern AI tracking

### 🔔 Kettlebell Training
- **Kettlebell Swing** — explosive hip hinge counter
- **Goblet Squat** — front-loaded deep squat tracker

### 📊 Progress & Gamification
- 🔥 Daily streak tracking
- ⭐ XP system & level-up rewards
- 🎯 Daily quests & challenges
- 🏆 Personal records board
- 📅 GitHub-style activity heatmap calendar
- 📈 Body stats tracker (weight, measurements)

### 🎨 Premium UI
- Dark glassmorphism design
- Bebas Neue / Outfit / Syne typography
- Smooth micro-animations
- Android APK via Capacitor

---

## 🏃 Supported Exercises

| # | Exercise | Icon | AI Method |
|---|----------|------|-----------|
| 01 | Push-Ups | 💪 | Elbow flex angle |
| 02 | Squats | 🏋️ | Knee depth tracking |
| 03 | Lunges | 🦵 | Front knee flex |
| 04 | Sit-Ups | 🤸 | Torso crunch angle |
| 05 | Jumping Jacks | 🙆 | Arm jump sequence |
| 06 | Jump Rope | 🪢 | Hip peak detection |
| 07 | High Knees | 🏃 | Knee elevation |
| 08 | Mountain Climbers | 🏔️ | Plank knee drive |
| 09 | Burpees | 💥 | Full body state machine |
| 10 | Glute Bridge | 🍑 | Hip extension angle |
| 11 | Plank | 🧱 | Isometric hold timer |
| 12 | **Karalakattai** 🆕 | 🪵 | Tamil club swing arc |
| 13 | **Kettlebell Swing** 🆕 | 🔔 | Explosive hip hinge |
| 14 | **Goblet Squat** 🆕 | 🏋️‍♂️ | Front-loaded squat depth |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [npm](https://npmjs.com/) v9+
- A webcam or phone camera

### Installation

```bash
# Clone the repository
git clone https://github.com/Prasann62/home-workout-tracker.git
cd home-workout-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

Open your browser at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

---

## 📱 Android APK Build

> Requires: JDK 21 and Capacitor CLI

```bash
# 1. Build the web app
npm run build

# 2. Copy assets to Android
npx cap copy android

# 3. Build the APK
cd android
./gradlew assembleDebug

# APK output:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🗂️ Project Structure

```
home-workout-tracker/
├── src/
│   ├── App.jsx                      # Main app with tab routing
│   ├── components/                  # UI components
│   │   ├── FightSportsTrainer.jsx   # 🥊 Fight training suite
│   │   ├── ExerciseSelector.jsx     # Exercise picker grid
│   │   ├── WorkoutHUD.jsx           # Live workout overlay
│   │   ├── HomeDashboard.jsx        # Home tab dashboard
│   │   ├── ProgressTab.jsx          # Stats & history
│   │   ├── ActivityCalendar.jsx     # GitHub-style heatmap
│   │   ├── BodyStats.jsx            # Weight/measurement tracker
│   │   └── ...
│   ├── exercises/                   # Per-exercise AI state machines
│   │   ├── counters.js              # All 14 AI rep counters
│   │   └── ...
│   ├── data/
│   │   ├── exercises.js             # Exercise catalog (14 entries)
│   │   ├── fightSports.js           # Fight training workouts
│   │   └── programs.js              # Built-in workout programs
│   └── utils/
│       ├── poseUtils.js             # MediaPipe landmark helpers
│       ├── performanceAI.js         # Score & streak engine
│       ├── gamificationEngine.js    # XP, quests, rewards
│       └── bodyStats.js             # Weight history storage
├── public/
│   ├── mediapipe/pose/              # Self-hosted WASM models (offline)
│   └── fonts/                       # Bebas Neue, Outfit, Syne, Inter
├── android/                         # Capacitor Android project
├── backend/                         # Node.js REST API (optional sync)
├── index.html
├── vite.config.js
└── package.json
```

---

## 🧠 How AI Pose Detection Works

ILA uses **Google MediaPipe Pose** to detect 33 body landmarks in real time from your camera feed.

```
Camera Frame → MediaPipe WASM → 33 Landmarks (x, y, visibility)
                                        ↓
                              Exercise Counter
                       (angle calculations + state machine)
                                        ↓
                          Rep Counted + Form Feedback
```

All models run **100% on-device** — no data is ever sent to any server.

### Key Angles Tracked

| Exercise | Joint Angle |
|----------|-------------|
| Push-Up | Shoulder → Elbow → Wrist |
| Squat / Lunge | Hip → Knee → Ankle |
| Sit-Up | Hip → Shoulder vertical |
| Glute Bridge | Shoulder → Hip → Knee |
| Plank | Shoulder → Hip → Ankle |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary Accent | `#FF2E00` |
| Background | `#0D0D0D` |
| Surface | `#1A1A1A` |
| Heading Font | Bebas Neue / Syne 800 |
| Body Font | Outfit / Inter |
| Mono Font | DM Mono |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 |
| AI / ML | MediaPipe Pose (WASM, fully offline) |
| Styling | Vanilla CSS with custom design tokens |
| Mobile | Capacitor (Android APK) |
| Backend | Node.js + Express + SQLite (optional) |
| Storage | localStorage (primary), REST API (cloud sync) |

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/new-exercise`
3. Commit your changes: `git commit -m 'feat: add new exercise counter'`
4. Push to the branch: `git push origin feature/new-exercise`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👤 Author

**Prasann Kumar**
- GitHub: [@Prasann62](https://github.com/Prasann62)

---

<div align="center">

Made with ❤️ for fitness enthusiasts everywhere

⭐ **Star this repo if it helped your workout!** ⭐

</div>

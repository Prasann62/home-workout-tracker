# 🏋️ RepAI Personal Backend Service

A lightweight, single-user Node.js + Express + TypeScript + SQLite backend for the RepAI workout counter app (`com.repai.workoutcounter`). Designed to run on a home server, Raspberry Pi, or low-cost VPS.

---

## ⚡ Quick Start

### Option A: Run directly with Node.js
```bash
cd backend
npm install
npm run dev
# Server will start at http://localhost:4000
```

### Option B: Run with Docker Compose (One Command)
```bash
cd backend
docker compose up -d
```

---

## 🔒 Configuration (`.env`)

Copy `.env.example` to `.env`:
```ini
PORT=4000
API_KEY=your_secure_personal_api_key_here
DB_PATH=./data/repai.db
BACKUP_DIR=./backups
AUTO_BACKUP_CRON=true
```

> **Security Note**: All endpoints (except `/health`) require the static API key header:
> `x-api-key: your_secure_personal_api_key_here` or `Authorization: Bearer your_secure_personal_api_key_here`.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/health` | Health check & uptime info | ❌ No |
| `GET` | `/exercises` | List all exercise definitions | ✅ Yes |
| `POST` | `/exercises` | Create or update exercise | ✅ Yes |
| `POST` | `/workouts` | Start a new workout session | ✅ Yes |
| `PATCH` | `/workouts/:id` | End session / update notes | ✅ Yes |
| `GET` | `/workouts?from=&to=` | Fetch workout history list | ✅ Yes |
| `GET` | `/workouts/:id` | Fetch single workout + sets array | ✅ Yes |
| `POST` | `/workouts/:id/sets` | Add a completed exercise set | ✅ Yes |
| `DELETE` | `/sets/:id` | Delete a mistaken set entry | ✅ Yes |
| `GET` | `/progress?exerciseId=&period=week\|month\|year` | Volume, rep totals & trends | ✅ Yes |
| `GET` | `/bodyweight?from=&to=` | Fetch bodyweight log entries | ✅ Yes |
| `POST` | `/bodyweight` | Log a bodyweight entry | ✅ Yes |
| `GET` | `/goals` | List current fitness goals | ✅ Yes |
| `POST` | `/goals` | Create a new goal | ✅ Yes |
| `PATCH` | `/goals/:id` | Update goal progress or target | ✅ Yes |
| `POST` | `/sync/batch` | Offline-first batch sync upsert/pull | ✅ Yes |
| `GET` | `/export` | Full database JSON export dump | ✅ Yes |
| `POST` | `/import` | Restore database state from JSON | ✅ Yes |

---

## 💾 Backup & Data Safety

1. **Automated Daily Backups**: The server automatically copies `repai.db` to `./backups/repai-backup-YYYY-MM-DD.sqlite` every 24 hours.
2. **JSON Export**: Send a `GET` request to `http://<server-ip>:4000/export` with your `x-api-key` header to download a complete JSON backup.
3. **JSON Restore**: Send a `POST` request to `http://<server-ip>:4000/import` containing `{ "data": <exported_json_data> }` to restore your data.

---

## 📱 Connecting the Mobile App

To connect your RepAI app (`com.repai.workoutcounter`) to this backend:

1. Open the app and navigate to **Settings** (⚙️).
2. Under **Backend Sync Server**:
   - **Server URL**: `http://<YOUR_SERVER_IP>:4000` (e.g. `http://192.168.1.100:4000`)
   - **API Key**: `your_secure_personal_api_key_here`
3. Tap **SAVE & SYNC NOW**.
4. The app will push all locally recorded sessions, sets, and bodyweight logs to the backend database.

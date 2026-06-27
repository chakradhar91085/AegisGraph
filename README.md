# AegisGraph — Privacy-Aware Graph Intelligence

> **Detect probing behavior. Control access. Secure enterprise knowledge systems.**

AegisGraph is a full-stack security framework that wraps a knowledge graph QA system with real-time behavioral analysis, risk scoring, and adaptive response control. It prevents sensitive data exfiltration through intelligent query monitoring and escalating access restrictions.

---

## 🖥️ Live Preview

| Dark Mode | Light Mode |
|---|---|
| ![Dark Mode](https://img.shields.io/badge/theme-dark-1e1b4b?style=flat-square) | ![Light Mode](https://img.shields.io/badge/theme-light-e0e7ff?style=flat-square&labelColor=4f46e5&color=eef2ff) |

---

## ✨ Features

### 🔐 Authentication
- **Firebase Authentication** — Email/Password + Google OAuth (popup)
- **Custom username support** — sign up with a username, login with username or email
- **Persistent sessions** — Firebase Auth state listener + sessionStorage
- **Forgot Password** — Firebase `sendPasswordResetEmail`
- **Role-based access** — `Employee` or `External` roles stored in Firestore

### 🧠 Core Intelligence Pipeline
- **Behavioral Analysis** — detects query similarity, entity repetition, probing keywords, and rapid-fire querying
- **Risk Scoring** — dynamic scoring engine (LOW / MEDIUM / HIGH) with per-user profiling
- **Decision Engine** — maps risk levels to response modes: `FULL`, `FILTERED`, `RESTRICTED`
- **Graph Query Engine** — knowledge graph traversal using NetworkX
- **Response Control** — filters or blocks results based on computed risk

### 🎨 UI / UX
- **Split-screen premium login** — animated neon gradient left panel, clean white right panel
- **3.5s "Access Granted" animation** — professional post-login confirmation sequence
- **Light/Dark theme** — full system-wide toggle with CSS variables + localStorage persistence
- **Animated dashboard** — Framer Motion transitions, SpotlightNavbar, FlipText reveals
- **LightLines background** — theme-aware canvas animation

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React, TypeScript, Tailwind CSS |
| **Animations** | Framer Motion |
| **Authentication** | Firebase Authentication + Firestore |
| **Backend** | FastAPI (Python), Uvicorn |
| **Graph Engine** | NetworkX |
| **NLP / Embeddings** | sentence-transformers (`all-MiniLM-L6-v2`) |
| **Database** | SQLite (query logs + user profiles) |
| **Deployment** | Docker-ready |

---

## 📁 Project Structure

```
AegisGraph/
├── api.py                  # FastAPI backend — all REST endpoints
├── app.py                  # Legacy Streamlit interface (optional)
├── config.py               # Thresholds, constants, risk mappings
├── db.py                   # SQLite connection helper
├── data_loader.py          # Graph data loader (CSV → NetworkX)
├── graph_data.csv          # Knowledge graph edges
├── graph_query.py          # Graph traversal engine
├── preprocessing.py        # Query cleaning + entity extraction + embeddings
├── behavior_analysis.py    # Similarity, frequency, probing detection
├── risk_scoring.py         # Risk score computation
├── decision_engine.py      # FULL / FILTERED / RESTRICTED mapping
├── response_control.py     # Output filtering logic
├── logger.py               # SQLite query logging
├── user_profile.py         # Per-user behavioral profile tracking
├── requirements.txt        # Python dependencies
├── Dockerfile              # Container configuration
│
└── frontend/               # Next.js application
    ├── app/
    │   ├── globals.css     # Design tokens + light/dark theme overrides
    │   ├── layout.tsx      # Root layout with ThemeProvider
    │   ├── page.tsx        # Protected dashboard (Query / Logs / Profile)
    │   └── login/
    │       └── page.tsx    # Split-screen login page
    ├── components/
    │   ├── AuthCard.tsx        # Login/Signup/ForgotPassword form
    │   ├── LoginConfirm.tsx    # 3.5s post-login animation
    │   ├── ThemeToggle.tsx     # Animated sun/moon toggle
    │   ├── LightLines.tsx      # Animated canvas background
    │   ├── SpotlightNavbar.tsx # Spotlight-effect navigation
    │   ├── RevealLoader.tsx    # Entry reveal animation
    │   ├── FlipText.tsx        # Text flip animation
    │   ├── FlipFadeText.tsx    # Processing state text animation
    │   └── AnimatedButton.tsx  # Hover-animated CTA button
    └── lib/
        ├── firebase.ts         # Firebase SDK initialization
        ├── firebaseAuth.ts     # Auth functions (sign in, sign up, Google, etc.)
        ├── api.ts              # API client with Firebase token injection
        └── theme.tsx           # ThemeProvider context
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Firebase project with **Email/Password** and **Google** providers enabled

### 1. Clone the repository
```bash
git clone https://github.com/chakradhar91085/AegisGraph-prototype.git
cd AegisGraph-prototype
```

### 2. Backend setup
```bash
pip install -r requirements.txt
python api.py
```
Backend runs at **http://localhost:8000**

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at **http://localhost:3000**

### 4. Firebase configuration

Update `frontend/lib/firebase.ts` with your Firebase project config:
```ts
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
}
```

### 5. Firestore security rules
In Firebase Console → Firestore → Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/query` | Run a knowledge graph query |
| `GET` | `/logs/{user_id}` | Get query history for a user |
| `GET` | `/profile/{user_id}` | Get behavioral profile |
| `GET` | `/graph/topology` | Get graph nodes + edges |
| `GET` | `/health` | Health check |

### Query Request Body
```json
{
  "raw_query": "Who manages Alice?",
  "user_id": "firebase_uid_here",
  "role": "Employee"
}
```

---

## ⚠️ Risk Level Mapping

| Score | Risk Level | Response Mode | Behavior |
|---|---|---|---|
| 0 – 3 | 🟢 LOW | FULL | Complete graph results returned |
| 4 – 6 | 🟡 MEDIUM | FILTERED | Sensitive fields redacted |
| 7+ | 🔴 HIGH | RESTRICTED | Query blocked entirely |

---

## 🐳 Docker

```bash
docker build -t aegisgraph .
docker run -p 8000:8000 aegisgraph
```

---

## 📄 License

This project is for academic and demonstration purposes.

---

<p align="center">
  Built by <strong>Chakradhar Reddy</strong>
</p>

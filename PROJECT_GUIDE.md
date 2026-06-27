# PROJECT_GUIDE.md — AegisGraph Beginner's Guide

> 🗓️ Last Updated: 2026-06-13  
> 📌 This is a living document. It will be updated whenever important changes are made.

---

## 📖 What This Project Does

**AegisGraph** is a **privacy-aware security framework** for knowledge graph systems.

In simple words: imagine a company has a database that shows how employees, projects, servers, and secrets are all connected (this is called a "knowledge graph"). AegisGraph acts like an **intelligent security guard** sitting between users and that database.

When someone asks a question like *"Who manages Alice?"*, AegisGraph:
1. **Cleans up** the question (removes special characters, lowercases it)
2. **Figures out** which people/things in the database the question is about
3. **Checks** if the user has been asking suspicious questions (too many, too fast, probing for secrets)
4. **Scores the risk** (LOW, MEDIUM, or HIGH)
5. **Decides** how much information to show:
   - 🟢 **LOW risk** → Show everything (FULL mode)
   - 🟡 **MEDIUM risk** → Hide sensitive labels (FILTERED mode)
   - 🔴 **HIGH risk** → Block the query entirely (RESTRICTED mode)
6. **Logs** the query and **updates** the user's behavioral profile

This prevents **data exfiltration** — when someone tries to map out sensitive company data by asking clever sequences of questions.

---

## 🚀 How to Run the Project

You need **two terminals** — one for the Python backend, one for the Next.js frontend.

### Terminal 1: Start the Backend (Python + FastAPI)

```powershell
# Navigate to the project root
cd "c:\Projects\AegisGraph-MP1-Demo-main\AegisGraph-MP1-Demo-main"

# Install Python dependencies (first time only)
pip install -r requirements.txt

# Start the API server
uvicorn api:app --reload --port 8000
```

The backend runs at **http://localhost:8000**

### Terminal 2: Start the Frontend (Next.js)

```powershell
# Navigate to the frontend folder
cd "c:\Projects\AegisGraph-MP1-Demo-main\AegisGraph-MP1-Demo-main\frontend"

# Install Node dependencies (first time only)
npm install

# Start the development server
npm run dev
```

The frontend runs at **http://localhost:3000**

### Optional: Legacy Streamlit UI

```powershell
streamlit run app.py
```

The Streamlit UI runs at **http://localhost:8501** — this was the original interface before the Next.js frontend was built.

---

## 📁 Folder Structure

```
AegisGraph-MP1-Demo-main/
│
│── ── BACKEND (Python files) ────────────────────
│
├── config.py               # All settings and thresholds in one place
├── db.py                   # Creates and connects to the SQLite database
├── data_loader.py          # Loads company data (CSV) into a graph structure
├── graph_data.csv          # The actual company data (employees, projects, etc.)
├── preprocessing.py        # Cleans user questions + finds matching entities
├── behavior_analysis.py    # Checks if the user is behaving suspiciously
├── risk_scoring.py         # Calculates a risk score (number) and risk level
├── decision_engine.py      # Maps risk level to a response mode
├── graph_query.py          # Searches the knowledge graph for answers
├── response_control.py     # Filters/hides/blocks the answer based on risk
├── logger.py               # Saves every query to the database for auditing
├── user_profile.py         # Tracks each user's behavior over time
├── api.py                  # FastAPI server — exposes all logic as REST endpoints
├── app.py                  # Old Streamlit interface (still works, but not primary)
├── requirements.txt        # Python libraries this project needs
├── Dockerfile              # Instructions to run in a Docker container
├── aegisgraph.db           # SQLite database file (auto-created)
│
│── ── FRONTEND (Next.js files) ──────────────────
│
├── frontend/
│   ├── app/
│   │   ├── globals.css         # Styles: colors, dark theme, scrollbar
│   │   ├── layout.tsx          # Root layout (wraps every page)
│   │   ├── page.tsx            # Main dashboard (Query / Logs / Profile tabs)
│   │   └── login/
│   │       └── page.tsx        # Login page (split-screen design)
│   │
│   ├── components/             # Reusable UI building blocks
│   │   ├── AnimatedButton.tsx  # Button with hover/tap animations
│   │   ├── AuthCard.tsx        # Login/Register form card
│   │   ├── FlipText.tsx        # Text that flips in letter by letter
│   │   ├── FlipFadeText.tsx    # Rotating status words during loading
│   │   ├── LightLines.tsx      # Animated glowing vertical lines background
│   │   ├── LineHoverLink.tsx   # Links with animated underline on hover
│   │   ├── LoginConfirm.tsx    # "Access Granted" animation after login
│   │   ├── RevealLoader.tsx    # Startup loading animation
│   │   ├── SpotlightNavbar.tsx # Navigation bar with spotlight effect
│   │   └── ThemeToggle.tsx     # Light/dark mode switch
│   │
│   └── lib/                    # Utility files
│       ├── api.ts              # Functions to call the Python backend
│       ├── firebase.ts         # Firebase configuration (for auth)
│       ├── firebaseAuth.ts     # Firebase login/register/Google sign-in
│       └── theme.tsx           # Light/dark theme context provider
│
│── ── DOCS ──────────────────────────────────────
│
├── README.md               # Project overview (for GitHub)
├── BEGINNER_GUIDE.md       # Another beginner explanation (older)
├── FULL_CODEBASE.md        # Complete copy of all code in one file
└── PROJECT_GUIDE.md        # ← YOU ARE HERE (this file!)
```

---

## 🔍 What Each Important File Does

### Backend Files (Python)

| File | What It Does | Beginner Analogy |
|---|---|---|
| `config.py` | Stores all settings — thresholds, point values, risk levels | The "rules book" |
| `db.py` | Creates the SQLite database and tables on startup | The "storage room builder" |
| `data_loader.py` | Reads `graph_data.csv` and builds a graph of nodes/edges | The "map builder" |
| `preprocessing.py` | Cleans the query text, finds entities, creates embeddings | The "translator" |
| `behavior_analysis.py` | Compares current query to past queries to detect patterns | The "detective" |
| `risk_scoring.py` | Adds up risk points based on behavior flags | The "judge" |
| `decision_engine.py` | Converts a risk level into a response mode | The "traffic light" |
| `graph_query.py` | Walks through the knowledge graph to find answers | The "librarian" |
| `response_control.py` | Formats the answer (full, filtered, or restricted) | The "redactor" |
| `logger.py` | Records every query in the database | The "diary keeper" |
| `user_profile.py` | Keeps a running record of each user's risk history | The "reputation tracker" |
| `api.py` | Wraps everything above into HTTP endpoints the frontend can call | The "front desk" |

### Frontend Files (TypeScript/React)

| File | What It Does |
|---|---|
| `page.tsx` | The main app page — has tabs for Query, Logs, and Profile |
| `layout.tsx` | Wraps every page with fonts, metadata, and global styles |
| `globals.css` | Defines colors, scrollbar styles, and the dark theme |
| `api.ts` | Helper functions to talk to the Python backend via HTTP |
| `SpotlightNavbar.tsx` | Navigation bar that follows your mouse with a light effect |
| `RevealLoader.tsx` | The "AEGISGRAPH" text animation you see on first load |
| `LightLines.tsx` | Those glowing vertical light beams in the background |
| `AnimatedButton.tsx` | Buttons that scale up/down when you hover/click |

---

## ⚙️ How the Main Parts Work Together

Here's the flow when a user submits a query, step by step:

```
User types: "Who manages Alice?"
        │
        ▼
┌─── page.tsx (Frontend) ───┐
│ Sends POST to /query      │
│ with query + username +   │
│ role                      │
└───────────┬───────────────┘
            │  HTTP request
            ▼
┌─── api.py (Backend) ──────────────────────────────────┐
│                                                        │
│  Step 1: preprocessing.preprocess()                    │
│    → Clean query: "who manages alice"                  │
│    → Find entities: ["Alice"]                          │
│    → Create embedding (a list of numbers)              │
│                                                        │
│  Step 2: behavior_analysis.analyze_behavior()          │
│    → Compare to past queries (similarity check)        │
│    → Check for probing keywords ("salary", "ssn"...)   │
│    → Count how fast queries are coming in              │
│                                                        │
│  Step 3: risk_scoring.compute_risk()                   │
│    → Add up points for each suspicious signal          │
│    → Result: score=0, level="LOW"                      │
│                                                        │
│  Step 4: decision_engine.get_response_mode()           │
│    → LOW → "FULL" (show everything)                    │
│                                                        │
│  Step 5: graph_query.execute_query()                   │
│    → Walk the graph from "Alice" node                  │
│    → Find: Alice reports_to Bob_Manager                │
│                                                        │
│  Step 6: response_control.apply_response_control()     │
│    → Format the answer (full details shown)            │
│                                                        │
│  Step 7: logger.log_query()                            │
│    → Save this query + results to SQLite               │
│                                                        │
│  Step 8: user_profile.update_user_profile()            │
│    → Update user's query count and avg risk            │
│                                                        │
│  Return JSON response to frontend                      │
└───────────┬────────────────────────────────────────────┘
            │
            ▼
┌─── page.tsx (Frontend) ───┐
│ Show risk dashboard       │
│ (score, level, mode)      │
│ Show formatted answer     │
└───────────────────────────┘
```

---

## 🧩 Important Components, Functions & Logic

### Risk Scoring Rules (`risk_scoring.py`)

The risk score starts at 0 and points are added for each suspicious behavior:

| Rule | Condition | Points Added |
|---|---|---|
| External user | Role is "External" | +2 (baseline) |
| High similarity | Current query is very similar to a past query | +2 |
| Entity repetition | Same entity queried again | +3 |
| Probing keywords | Query contains "salary", "ssn", "secret", etc. | +2 |
| Graph traversal | User is walking node-by-node through the graph | +2 |
| Rapid queries | 2+ queries in the last 30 seconds | +2 |
| Time decay | User took a 2+ minute break (cools down risk) | -1 |
| Past violations | User has previous suspicious queries | +1 per past violation |

### Graph Query Modes (`graph_query.py`)

| # of Entities Found | Query Type | Example |
|---|---|---|
| 1 entity | BFS (direct neighbors) | "Who manages Alice?" |
| 1 entity + "deep"/"all" | DFS (2-hop deep search) | "Show deep graph for Alice" |
| 2 entities | Path finding | "How is Alice connected to Bob?" |
| 3+ entities | Subgraph extraction | "Alice Bob Carol" |

### Response Modes (`response_control.py`)

| Mode | What Happens | Example Output |
|---|---|---|
| FULL | Complete info with relationships | `Alice [reports_to] Bob_Manager` |
| FILTERED | Names shown but relationships hidden | `Alice -> <HIDDEN> -> Bob_Manager` |
| RESTRICTED | Only abstract types shown | `A [Employee] is generally linked to...` |

---

## ✅ Current Features

- [x] User registration and login (via FastAPI backend)
- [x] Firebase authentication support (Email/Password + Google)
- [x] Knowledge graph query engine (BFS, DFS, pathfinding, subgraph)
- [x] Real-time behavioral analysis (similarity, frequency, probing)
- [x] Dynamic risk scoring with 3 levels (LOW, MEDIUM, HIGH)
- [x] Adaptive response control (FULL, FILTERED, RESTRICTED)
- [x] Query logging and user profiling
- [x] Next.js frontend with dark theme, animations, 3 tabs
- [x] Animated loading screen and spotlight navbar
- [x] Legacy Streamlit UI (still functional)
- [x] Docker support

---

## ⚠️ Known Issues

1. **Firebase config is hardcoded** — The `firebase.ts` file contains project-specific API keys. You need to replace these with your own Firebase project credentials.
2. **No token-based auth on the API** — The FastAPI backend accepts `user_id` and `role` in the request body directly. A real app would validate a JWT token.
3. **Embeddings re-computed on every history check** — In `behavior_analysis.py`, past query embeddings are re-generated every time instead of being stored. This is slow with many queries.
4. **SQLite isn't production-ready** — SQLite works great for demos but doesn't handle multiple simultaneous users well. A production app would use PostgreSQL or similar.
5. **`temp_graph.html` left on disk** — The Streamlit graph visualization writes a temp file and never cleans it up.

---

## 📜 Change History

| Date | What Changed | Files Affected | Why |
|---|---|---|---|
| 2026-06-13 | Initial `PROJECT_GUIDE.md` created | `PROJECT_GUIDE.md` (new) | To provide a beginner-friendly living document that explains the entire project |

---

## 📝 Beginner Learning Notes

### Concepts You'll Encounter in This Project

1. **Knowledge Graph** — A database where information is stored as *nodes* (things like people, projects) connected by *edges* (relationships like "reports_to", "works_on"). Think of it like a mind map.

2. **REST API** — A way for the frontend (what you see in the browser) to talk to the backend (the Python code). The frontend sends HTTP requests like `POST /query`, and the backend responds with JSON data.

3. **FastAPI** — A Python framework for building REST APIs. It's like Flask but faster and with automatic documentation. Visit `http://localhost:8000/docs` to see all endpoints when the backend is running.

4. **Next.js** — A React framework for building web apps. It handles routing (each folder in `app/` becomes a URL), server-side rendering, and more.

5. **NetworkX** — A Python library for working with graphs (the mathematical kind, not charts). In this project, it stores the company's organizational data and lets us traverse it.

6. **Cosine Similarity** — A way to measure how "similar" two sentences are. It converts text to numbers (vectors) and calculates the angle between them. Used in `behavior_analysis.py` to detect repeated probing.

7. **Sentence Transformers** — An AI model that converts text into a list of numbers (called an "embedding"). Two sentences with similar meanings will have similar embeddings.

8. **SQLite** — A lightweight database stored in a single file (`aegisgraph.db`). Good for demos and small apps. The project uses it to store users, query logs, and profiles.

9. **Framer Motion** — A React animation library. It's what makes the text flip in, buttons bounce, and loading screens transition smoothly.

10. **Tailwind CSS** — A CSS framework where you style elements using short class names directly in your HTML/JSX (like `bg-white/5` for a nearly transparent white background).

### Tips for Exploring the Code

- **Start with `config.py`** — It's short and shows you all the rules the system uses.
- **Read `api.py` next** — It's the "glue" that connects everything. Each endpoint calls the other modules in order.
- **Use the FastAPI docs** — Run the backend and visit `http://localhost:8000/docs` for an interactive API explorer.
- **Try different queries** — Log in and try simple queries, then try rapid-fire queries or queries with words like "salary" or "secret" to see how the risk score changes.

"""
AegisGraph FastAPI Backend
Wraps all existing Python logic and exposes REST endpoints for the Next.js frontend.
The Streamlit app.py remains untouched — this runs on port 8000 alongside it.
"""

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import bcrypt
import json

# ── Import all existing AegisGraph modules (unchanged) ────────────────────────
from db import get_connection
import preprocessing
import behavior_analysis
import risk_scoring
import decision_engine
import graph_query
import response_control
import logger
import user_profile
from data_loader import GRAPH_NODES, G

# ── App Setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AegisGraph API",
    description="Privacy-Aware Security Framework for Knowledge Graph QA Systems",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic Models ───────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str  # "Employee" or "External"

class LoginRequest(BaseModel):
    username: str
    password: str

class QueryRequest(BaseModel):
    raw_query: str
    user_id: str
    role: str

# ── Auth Endpoints ────────────────────────────────────────────────────────────
@app.post("/auth/register")
def register(req: RegisterRequest):
    if req.role not in ["Employee", "External"]:
        raise HTTPException(status_code=400, detail="Role must be 'Employee' or 'External'")
    
    salt = bcrypt.gensalt()
    pwd_hash = bcrypt.hashpw(req.password.encode("utf-8"), salt).decode("utf-8")
    
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            (req.username, pwd_hash, req.role)
        )
        conn.commit()
        return {"success": True, "message": f"User '{req.username}' registered successfully."}
    except Exception:
        raise HTTPException(status_code=409, detail="Username already exists.")
    finally:
        conn.close()


@app.post("/auth/login")
def login(req: LoginRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT password_hash, role FROM users WHERE username = ?", (req.username,)
    )
    result = cursor.fetchone()
    conn.close()

    if not result:
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    
    stored_hash, role = result
    if not bcrypt.checkpw(req.password.encode("utf-8"), stored_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    
    return {"success": True, "username": req.username, "role": role}


# ── Query Endpoint (core pipeline) ───────────────────────────────────────────
@app.post("/query")
def run_query(req: QueryRequest, request: Request):
    user_id = req.user_id
    role = req.role
    raw_query = req.raw_query

    # Mock IP consistent with existing Streamlit logic
    mock_ip = f"192.168.1.{sum(ord(c) for c in user_id) % 255}"

    # 1. Preprocess
    prep_data = preprocessing.preprocess(raw_query, GRAPH_NODES)

    # 2. Behavior Analysis
    behavior_signals = behavior_analysis.analyze_behavior(
        current_query=raw_query,
        current_clean=prep_data["clean_query"],
        current_entities=prep_data["entities"],
        current_embedding=prep_data["embedding"],
        user_id=user_id
    )

    # 3. Risk Scoring
    current_profile = user_profile.get_user_profile(user_id)
    risk_score, risk_level = risk_scoring.compute_risk(behavior_signals, role, current_profile)

    # 4. Response Mode
    response_mode = decision_engine.get_response_mode(risk_level)

    # 5. Graph Query (gated)
    if response_mode == "RESTRICTED":
        raw_graph_results = []
    else:
        raw_graph_results = graph_query.execute_query(
            prep_data["entities"], prep_data["clean_query"]
        )

    # 6. Response Control
    final_output = response_control.apply_response_control(
        raw_graph_results, response_mode, prep_data["entities"]
    )

    # 7. Log
    logger.log_query(
        user_id=user_id,
        user_role=role,
        raw_query=raw_query,
        clean_query=prep_data["clean_query"],
        entities=prep_data["entities"],
        similarity_score=behavior_signals["similarity_score"],
        risk_score=risk_score,
        risk_level=risk_level,
        response_mode=response_mode,
        ip_address=mock_ip
    )

    # 8. Update Profile
    user_profile.update_user_profile(user_id, role, risk_score, risk_level)

    return {
        "output": final_output,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "response_mode": response_mode,
        "entities": prep_data["entities"],
        "behavior_signals": {
            k: v for k, v in behavior_signals.items()
            if k != "embedding"  # don't serialize the full vector
        },
        "raw_graph_results": raw_graph_results if response_mode != "RESTRICTED" else None,
    }


# ── Logs Endpoint ─────────────────────────────────────────────────────────────
@app.get("/logs/{user_id}")
def get_logs(user_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """SELECT id, user_role, raw_query, entities, risk_score, risk_level,
                  response_mode, ip_address, timestamp
           FROM logs WHERE user_id = ? ORDER BY id DESC LIMIT 10""",
        (user_id,)
    )
    rows = cursor.fetchall()
    conn.close()

    cols = ["id", "user_role", "raw_query", "entities", "risk_score",
            "risk_level", "response_mode", "ip_address", "timestamp"]
    return {"logs": [dict(zip(cols, row)) for row in rows]}


# ── User Profile Endpoint ─────────────────────────────────────────────────────
@app.get("/profile/{user_id}")
def get_profile(user_id: str):
    profile = user_profile.get_user_profile(user_id)
    if not profile:
        return {"profile": None}
    return {"profile": profile}


# ── Graph Topology Endpoint ───────────────────────────────────────────────────
@app.get("/graph/topology")
def get_graph_topology():
    nodes = []
    for node, attrs in G.nodes(data=True):
        nodes.append({"id": node, "type": attrs.get("type", "Entity")})

    edges = []
    for source, target, attrs in G.edges(data=True):
        edges.append({"source": source, "target": target, "relation": attrs.get("relation", "")})

    return {"nodes": nodes, "edges": edges}


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "healthy", "version": "2.0.0"}


# ── Entry Point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)

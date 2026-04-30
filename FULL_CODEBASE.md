# AegisGraph — Full Codebase

## Project Overview
AegisGraph is a Privacy-Aware Security Framework for Knowledge Graph QA Systems.
- **Backend**: FastAPI (port 8000) + SQLite + SentenceTransformers
- **Frontend**: Next.js 16 + Tailwind CSS v4 + Framer Motion (port 3000)
- **Legacy UI**: Streamlit (port 8501)

## Architecture
Query → Preprocessing → Behavior Analysis → Risk Scoring → Decision Engine → Graph Query → Response Control → Log → Update Profile

---

## `requirements.txt`

```text
streamlit
pandas
networkx
sentence-transformers
scikit-learn
bcrypt
pyvis
```

---

## `Dockerfile`

```
# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt ./

# Install any essential system packages and Python dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /app
COPY . .

# Make port 8501 available to the world outside this container
EXPOSE 8501

# Run the Streamlit application
CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]
```

---

## `config.py`

```python
import os

# Database Path
DB_PATH = os.path.join(os.path.dirname(__file__), "aegisgraph.db")
DATA_CSV_PATH = os.path.join(os.path.dirname(__file__), "graph_data.csv")

# Behavior Analysis Thresholds
SIMILARITY_THRESHOLD = 0.7
SHORT_TIME_GAP_SECONDS = 30
QUERY_FREQUENCY_WINDOW_SECONDS = 60
HIGH_FREQUENCY_THRESHOLD = 5

# Risk Scoring Points
POINTS_SIMILARITY = 2
POINTS_ENTITY_REPEAT = 3
POINTS_PROBING = 2
POINTS_RAPID = 2

# Risk Mapping
# 0-3  -> LOW
# 4-6  -> MEDIUM
# 7+   -> HIGH
RISK_LEVEL_LOW = "LOW"
RISK_LEVEL_MEDIUM = "MEDIUM"
RISK_LEVEL_HIGH = "HIGH"

# Decision Engine Mapping
RESPONSE_MODE_FULL = "FULL"
RESPONSE_MODE_FILTERED = "FILTERED"
RESPONSE_MODE_RESTRICTED = "RESTRICTED"

# Suspicious Keywords for Probing Detection
PROBING_KEYWORDS = ["salary", "ssn", "secret", "all", "hidden", "password", "confidential"]
```

---

## `db.py`

```python
import sqlite3
from config import DB_PATH

def get_connection():
    return sqlite3.connect(DB_PATH, check_same_thread=False)

def initialize_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password_hash TEXT,
            role TEXT
        )
    ''')

    # Logs Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            user_role TEXT,
            raw_query TEXT,
            clean_query TEXT,
            entities TEXT,
            similarity_score REAL,
            risk_score INTEGER,
            risk_level TEXT,
            response_mode TEXT,
            ip_address TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # User Profile Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_profiles (
            user_id TEXT PRIMARY KEY,
            role TEXT,
            total_queries INTEGER DEFAULT 0,
            avg_risk REAL DEFAULT 0.0,
            suspicious_count INTEGER DEFAULT 0,
            last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize upon module load
initialize_db()
```

---

## `graph_data.csv`

```csv
source,relation,target,source_type,target_type
Eve_CEO,runs,TechCorp,Executive,Organization
Dave_VP_Eng,reports_to,Eve_CEO,Executive,Executive
Sarah_VP_Fin,reports_to,Eve_CEO,Executive,Executive
Tom_VP_HR,reports_to,Eve_CEO,Executive,Executive
Bob_Manager,reports_to,Dave_VP_Eng,Management,Executive
Carol_Manager,reports_to,Dave_VP_Eng,Management,Executive
Dan_Manager,reports_to,Sarah_VP_Fin,Management,Executive
Frank_Manager,reports_to,Tom_VP_HR,Management,Executive
Bob_Manager,manages,Engineering_Core,Management,Department
Carol_Manager,manages,Engineering_Ops,Management,Department
Dan_Manager,manages,Finance,Management,Department
Frank_Manager,manages,HR,Management,Department
Alice,reports_to,Bob_Manager,Employee,Management
John,reports_to,Bob_Manager,Employee,Management
Mark,reports_to,Bob_Manager,Employee,Management
Emily,reports_to,Bob_Manager,Employee,Management
Chris,reports_to,Bob_Manager,Employee,Management
Nancy,reports_to,Carol_Manager,Employee,Management
Peter,reports_to,Carol_Manager,Employee,Management
Rachel,reports_to,Carol_Manager,Employee,Management
Sam,reports_to,Carol_Manager,Employee,Management
Tina,reports_to,Carol_Manager,Employee,Management
Charlie,reports_to,Dan_Manager,Employee,Management
George,reports_to,Dan_Manager,Employee,Management
Hannah,reports_to,Dan_Manager,Employee,Management
Ivan,reports_to,Dan_Manager,Employee,Management
Jenny,reports_to,Dan_Manager,Employee,Management
Kelly,reports_to,Frank_Manager,Employee,Management
Laura,reports_to,Frank_Manager,Employee,Management
Mike,reports_to,Frank_Manager,Employee,Management
Nina,reports_to,Frank_Manager,Employee,Management
Oscar,reports_to,Frank_Manager,Employee,Management
Alice,works_on,Project_Titan,Employee,Project
John,works_on,Project_Titan,Employee,Project
Charlie,works_on,Project_Oasis,Employee,Project
Nancy,works_on,Project_Apollo,Employee,Project
Sam,works_on,Project_Apollo,Employee,Project
Frank_Manager,owns,Project_Zeus,Management,Project
Rachel,works_on,Project_Hermes,Employee,Project
Engineering_Core,maintains,Auth_Gateway,Department,Microservice
Finance,audits,Payment_Queue,Department,Microservice
Project_Titan,reads_from,Customer_DB,Project,Database
Project_Apollo,writes_to,S3_Logs_Bucket,Project,Database
Auth_Gateway,writes_to,Auth_DB,Microservice,Database
Customer_DB,contains,PII_Records,Database,Data_Asset
Customer_DB,deployed_in,AWS_VPC_Prod,Database,Network_Zone
S3_Logs_Bucket,deployed_in,AWS_VPC_Prod,Database,Network_Zone
Auth_Gateway,deployed_in,AWS_VPC_Prod,Microservice,Network_Zone
Project_Oasis,deployed_in,AWS_VPC_Dev,Project,Network_Zone
AWS_VPC_Prod,enforces,Zero_Trust_Policy,Network_Zone,Security_Policy
```

---

## `data_loader.py`

```python
import pandas as pd
import networkx as nx
import os
from config import DATA_CSV_PATH

def generate_mock_data():
    """Generates a massive professional company graph."""
    data = [
        # Executives
        {"source": "Eve_CEO", "relation": "runs", "target": "TechCorp", "source_type": "Executive", "target_type": "Organization"},
        {"source": "Dave_VP_Eng", "relation": "reports_to", "target": "Eve_CEO", "source_type": "Executive", "target_type": "Executive"},
        {"source": "Sarah_VP_Fin", "relation": "reports_to", "target": "Eve_CEO", "source_type": "Executive", "target_type": "Executive"},
        {"source": "Tom_VP_HR", "relation": "reports_to", "target": "Eve_CEO", "source_type": "Executive", "target_type": "Executive"},
        
        # Management Layer
        {"source": "Bob_Manager", "relation": "reports_to", "target": "Dave_VP_Eng", "source_type": "Management", "target_type": "Executive"},
        {"source": "Carol_Manager", "relation": "reports_to", "target": "Dave_VP_Eng", "source_type": "Management", "target_type": "Executive"},
        {"source": "Dan_Manager", "relation": "reports_to", "target": "Sarah_VP_Fin", "source_type": "Management", "target_type": "Executive"},
        {"source": "Frank_Manager", "relation": "reports_to", "target": "Tom_VP_HR", "source_type": "Management", "target_type": "Executive"},
        
        {"source": "Bob_Manager", "relation": "manages", "target": "Engineering_Core", "source_type": "Management", "target_type": "Department"},
        {"source": "Carol_Manager", "relation": "manages", "target": "Engineering_Ops", "source_type": "Management", "target_type": "Department"},
        {"source": "Dan_Manager", "relation": "manages", "target": "Finance", "source_type": "Management", "target_type": "Department"},
        {"source": "Frank_Manager", "relation": "manages", "target": "HR", "source_type": "Management", "target_type": "Department"},

        # Employees (Core Engineering) -> Bob
        {"source": "Alice", "relation": "reports_to", "target": "Bob_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "John", "relation": "reports_to", "target": "Bob_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Mark", "relation": "reports_to", "target": "Bob_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Emily", "relation": "reports_to", "target": "Bob_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Chris", "relation": "reports_to", "target": "Bob_Manager", "source_type": "Employee", "target_type": "Management"},
        
        # Employees (Eng Ops) -> Carol
        {"source": "Nancy", "relation": "reports_to", "target": "Carol_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Peter", "relation": "reports_to", "target": "Carol_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Rachel", "relation": "reports_to", "target": "Carol_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Sam", "relation": "reports_to", "target": "Carol_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Tina", "relation": "reports_to", "target": "Carol_Manager", "source_type": "Employee", "target_type": "Management"},

        # Employees (Finance) -> Dan
        {"source": "Charlie", "relation": "reports_to", "target": "Dan_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "George", "relation": "reports_to", "target": "Dan_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Hannah", "relation": "reports_to", "target": "Dan_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Ivan", "relation": "reports_to", "target": "Dan_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Jenny", "relation": "reports_to", "target": "Dan_Manager", "source_type": "Employee", "target_type": "Management"},
        
        # Employees (HR) -> Frank
        {"source": "Kelly", "relation": "reports_to", "target": "Frank_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Laura", "relation": "reports_to", "target": "Frank_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Mike", "relation": "reports_to", "target": "Frank_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Nina", "relation": "reports_to", "target": "Frank_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Oscar", "relation": "reports_to", "target": "Frank_Manager", "source_type": "Employee", "target_type": "Management"},

        # Projects and Assignees
        {"source": "Alice", "relation": "works_on", "target": "Project_Titan", "source_type": "Employee", "target_type": "Project"},
        {"source": "John", "relation": "works_on", "target": "Project_Titan", "source_type": "Employee", "target_type": "Project"},
        {"source": "Charlie", "relation": "works_on", "target": "Project_Oasis", "source_type": "Employee", "target_type": "Project"},
        {"source": "Nancy", "relation": "works_on", "target": "Project_Apollo", "source_type": "Employee", "target_type": "Project"},
        {"source": "Sam", "relation": "works_on", "target": "Project_Apollo", "source_type": "Employee", "target_type": "Project"},
        {"source": "Frank_Manager", "relation": "owns", "target": "Project_Zeus", "source_type": "Management", "target_type": "Project"},
        {"source": "Rachel", "relation": "works_on", "target": "Project_Hermes", "source_type": "Employee", "target_type": "Project"},

        # Tech Stack and Assets
        {"source": "Engineering_Core", "relation": "maintains", "target": "Auth_Gateway", "source_type": "Department", "target_type": "Microservice"},
        {"source": "Finance", "relation": "audits", "target": "Payment_Queue", "source_type": "Department", "target_type": "Microservice"},
        
        # Data Stores
        {"source": "Project_Titan", "relation": "reads_from", "target": "Customer_DB", "source_type": "Project", "target_type": "Database"},
        {"source": "Project_Apollo", "relation": "writes_to", "target": "S3_Logs_Bucket", "source_type": "Project", "target_type": "Database"},
        {"source": "Auth_Gateway", "relation": "writes_to", "target": "Auth_DB", "source_type": "Microservice", "target_type": "Database"},
        {"source": "Customer_DB", "relation": "contains", "target": "PII_Records", "source_type": "Database", "target_type": "Data_Asset"},
        
        # Infrastructure and Networking
        {"source": "Customer_DB", "relation": "deployed_in", "target": "AWS_VPC_Prod", "source_type": "Database", "target_type": "Network_Zone"},
        {"source": "S3_Logs_Bucket", "relation": "deployed_in", "target": "AWS_VPC_Prod", "source_type": "Database", "target_type": "Network_Zone"},
        {"source": "Auth_Gateway", "relation": "deployed_in", "target": "AWS_VPC_Prod", "source_type": "Microservice", "target_type": "Network_Zone"},
        {"source": "Project_Oasis", "relation": "deployed_in", "target": "AWS_VPC_Dev", "source_type": "Project", "target_type": "Network_Zone"},
        {"source": "AWS_VPC_Prod", "relation": "enforces", "target": "Zero_Trust_Policy", "source_type": "Network_Zone", "target_type": "Security_Policy"}
    ]
    df = pd.DataFrame(data)
    df.to_csv(DATA_CSV_PATH, index=False)
    return df

def load_graph():
    """Loads the dataset and builds a NetworkX DiGraph."""
    if not os.path.exists(DATA_CSV_PATH):
        df = generate_mock_data()
    else:
        df = pd.read_csv(DATA_CSV_PATH)
        
    G = nx.DiGraph()
    for _, row in df.iterrows():
        source = str(row['source'])
        target = str(row['target'])
        relation = str(row['relation'])
        source_type = str(row.get('source_type', 'Entity'))
        target_type = str(row.get('target_type', 'Entity'))
        
        G.add_node(source, type=source_type)
        G.add_node(target, type=target_type)
        G.add_edge(source, target, relation=relation)
        
    return G, df

G, df = load_graph()
GRAPH_NODES = list(G.nodes())
```

---

## `preprocessing.py`

```python
from sentence_transformers import SentenceTransformer
import re

# Load the lightweight model once
model = SentenceTransformer('all-MiniLM-L6-v2')

def clean_query(text: str) -> str:
    """Removes special characters and normalizes spaces."""
    text = re.sub(r'[^\w\s]', '', text)
    return text.lower().strip()

def extract_entities(query: str, graph_nodes: list) -> list:
    """Extract entities from the query that match graph nodes."""
    query_lower = query.lower()
    query_words = set(query_lower.split())
    entities = []
    for node in graph_nodes:
        node_lower = node.lower()
        node_clean = node_lower.replace("_", " ")
        base_name = node_lower.split("_")[0]
        
        if node_clean in query_lower or node_lower in query_lower:
            entities.append(node)
        elif base_name in query_words:
            entities.append(node)
    # Removing duplicates while preserving order
    return list(dict.fromkeys(entities))

def generate_embedding(query: str) -> list:
    """Returns vector embedding for the query."""
    embedding = model.encode(query).tolist()
    return embedding

def preprocess(query: str, graph_nodes: list) -> dict:
    clean_q = clean_query(query)
    entities = extract_entities(clean_q, graph_nodes)
    embedding = generate_embedding(clean_q)
    return {
        "clean_query": clean_q,
        "entities": entities,
        "embedding": embedding
    }
```

---

## `behavior_analysis.py`

```python
import sqlite3
import pandas as pd
import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from db import get_connection
from config import SIMILARITY_THRESHOLD, PROBING_KEYWORDS, SHORT_TIME_GAP_SECONDS

def get_recent_queries(user_id: str, limit: int = 5):
    """Fetch the most recent queries for a user."""
    conn = get_connection()
    query = """
        SELECT raw_query, clean_query, entities, timestamp
        FROM logs
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
    """
    df = pd.read_sql_query(query, conn, params=(user_id, limit))
    conn.close()
    return df

def analyze_behavior(current_query: str, current_clean: str, current_entities: list, current_embedding: list, user_id: str) -> dict:
    """Compares current query with recent history to detect anomalies."""
    history_df = get_recent_queries(user_id)
    
    similarity_score = 0.0
    entity_focus_flag = False
    intent_shift_flag = False
    query_frequency_score = 0
    graph_traversal_flag = False
    time_decay_flag = False
    
    # Check Intent Shift Tracking (via probing keywords)
    if any(keyword in current_clean for keyword in PROBING_KEYWORDS):
        intent_shift_flag = True

    if not history_df.empty:
        # We only really have one embedding, but let's just do text similarity or import model here
        # To avoid circular dependency / reloading model, we compare clean_query string similarity 
        # using character level or just re-embed history. Since we don't store embedding, let's
        # just re-embed history text for true semantic check.
        from preprocessing import generate_embedding
        
        hist_texts = history_df['clean_query'].tolist()
        hist_embeddings = [generate_embedding(t) for t in hist_texts]
        
        # Calculate semantic similarity
        if hist_embeddings:
            similarities = cosine_similarity([current_embedding], hist_embeddings)[0]
            similarity_score = float(max(similarities))
            
        # Check Entity Focus Tracking (Repetition) and Subgraph Step Traversal
        hist_entities = []
        for e_str in history_df['entities']:
            try:
                hist_entities.append(json.loads(e_str))
            except:
                pass
        
        flat_hist_entities = [e for sublist in hist_entities for e in sublist]
        
        for entity in current_entities:
            if entity in flat_hist_entities:
                entity_focus_flag = True
                break
                
        # To detect graph traversal (moving deeper into graph step-by-step),
        # check if any current entity is a neighbor of any recently queried entity.
        if not entity_focus_flag and hist_entities:
            from data_loader import G
            recently_queried = hist_entities[0] # Just the last query
            for r_ent in recently_queried:
                for c_ent in current_entities:
                    if r_ent in G and c_ent in G:
                        if G.has_edge(r_ent, c_ent) or G.has_edge(c_ent, r_ent):
                            graph_traversal_flag = True
                            
        # Check Temporal Pattern Analysis (frequency)
        # Convert timestamp to datetime and measure gaps
        history_df['timestamp'] = pd.to_datetime(history_df['timestamp'])
        now = pd.Timestamp.utcnow().tz_localize(None)
        
        recent_count = 0
        for ts in history_df['timestamp']:
            # Assuming sqlite current_timestamp is UTC
            gap = (now - pd.to_datetime(ts)).total_seconds()
            if gap < SHORT_TIME_GAP_SECONDS:
                recent_count += 1
                
        query_frequency_score = recent_count
        
        # Check Time Decay (Cooling down risk if last query was a while ago)
        # e.g., > 120 seconds (2 minutes)
        last_gap = (now - pd.to_datetime(history_df['timestamp'].iloc[0])).total_seconds()
        if last_gap > 120:
            time_decay_flag = True

    return {
        "similarity_score": similarity_score,
        "entity_focus_flag": entity_focus_flag, # Matches Entity Focus Tracking
        "intent_shift_flag": intent_shift_flag, # Matches Intent Shift Detection
        "query_frequency_score": query_frequency_score, # Matches Temporal Pattern
        "graph_traversal_flag": graph_traversal_flag,
        "time_decay_flag": time_decay_flag
    }
```

---

## `risk_scoring.py`

```python
from config import (
    SIMILARITY_THRESHOLD, POINTS_SIMILARITY, 
    POINTS_ENTITY_REPEAT, POINTS_PROBING, POINTS_RAPID,
    RISK_LEVEL_LOW, RISK_LEVEL_MEDIUM, RISK_LEVEL_HIGH, HIGH_FREQUENCY_THRESHOLD
)

def compute_risk(behavior_signals: dict, user_role: str, user_profile: dict = None) -> tuple:
    """Computes risk score and determines risk level."""
    score = 0
    
    # External users have a stricter baseline evaluation
    if user_role == "External":
        score += 2

    
    # Rule 1: High Similarity
    if behavior_signals.get("similarity_score", 0) > SIMILARITY_THRESHOLD:
        score += POINTS_SIMILARITY
        
    # Rule 2: Entity Focus (Repetition)
    if behavior_signals.get("entity_focus_flag"):
        score += POINTS_ENTITY_REPEAT
        
    # Rule 3: Intent Shift (Probing keywords)
    if behavior_signals.get("intent_shift_flag"):
        score += POINTS_PROBING
        
    # Rule 4: Graph Traversal (moving node by node)
    if behavior_signals.get("graph_traversal_flag"):
        score += 2
        
    # Rule 5: Rapid queries
    if behavior_signals.get("query_frequency_score", 0) >= 2: # any recent rapid query
        score += POINTS_RAPID
        
    # Intuitive Feature: Risk Decay
    # If the user took a long break, cool down their evaluation slightly
    if behavior_signals.get("time_decay_flag"):
        score -= 1
        
    # Profile Driven Feature: Penalize historical abusers
    if user_profile and user_profile.get("suspicious_count", 0) > 0:
        # For every past suspicious query, add a permanent baseline point
        score += user_profile.get("suspicious_count")
        
    # Clean score clamp (don't go below 0 + role baseline)
    baseline = 2 if user_role == "External" else 0
    score = max(baseline, score)
        
    # Mapping
    if score <= 3:
        level = RISK_LEVEL_LOW
    elif 4 <= score <= 6:
        level = RISK_LEVEL_MEDIUM
    else:
        level = RISK_LEVEL_HIGH
        
    return score, level
```

---

## `decision_engine.py`

```python
from config import (
    RISK_LEVEL_LOW, RISK_LEVEL_MEDIUM, RISK_LEVEL_HIGH,
    RESPONSE_MODE_FULL, RESPONSE_MODE_FILTERED, RESPONSE_MODE_RESTRICTED
)

def get_response_mode(risk_level: str) -> str:
    """Maps risk level to response mode."""
    if risk_level == RISK_LEVEL_LOW:
        return RESPONSE_MODE_FULL
    elif risk_level == RISK_LEVEL_MEDIUM:
        return RESPONSE_MODE_FILTERED
    elif risk_level == RISK_LEVEL_HIGH:
        return RESPONSE_MODE_RESTRICTED
    else:
        # Fallback to restricted on unknown
        return RESPONSE_MODE_RESTRICTED
```

---

## `graph_query.py`

```python
import networkx as nx
from data_loader import G

def bfs_traversal(entity: str, clean_query: str = "") -> list:
    """Detect breadth exploration (direct neighbors)."""
    if entity not in G:
        return []
    neighbors = []
    # Both successors and predecessors for breadth
    for neighbor in G.successors(entity):
        rel = G.edges[entity, neighbor]['relation']
        neighbors.append({"source": entity, "relation": rel, "target": neighbor})
    for neighbor in G.predecessors(entity):
        rel = G.edges[neighbor, entity]['relation']
        neighbors.append({"source": neighbor, "relation": rel, "target": entity})
        
    # Intent Filtering based on query context
    filtered = []
    if "manage" in clean_query:
        for n in neighbors:
            if n['relation'] == 'manages' or (n['relation'] == 'reports_to' and n['target'] == entity):
                filtered.append(n)
    elif "report" in clean_query:
        for n in neighbors:
            if n['relation'] == 'reports_to' and n['source'] == entity:
                filtered.append(n)
                
    if filtered:
        return filtered
    return neighbors

def dfs_traversal(entity: str, k: int = 2) -> list:
    """Detect deep traversal (k-hop depth search)."""
    if entity not in G:
        return []
    edges = set()
    current_layer = {entity}
    for _ in range(k):
        next_layer = set()
        for node in current_layer:
            for neighbor in G.successors(node):
                rel = G.edges[node, neighbor]['relation']
                edges.add((node, rel, neighbor))
                next_layer.add(neighbor)
            for prev in G.predecessors(node):
                rel = G.edges[prev, node]['relation']
                edges.add((prev, rel, node))
                next_layer.add(prev)
        current_layer = next_layer
    return [{"source": s, "relation": r, "target": t} for s, r, t in edges]

def find_simple_paths(source: str, target: str) -> list:
    """Detect relationship queries between specific entities."""
    if source not in G or target not in G:
        return []
    try:
        paths = list(nx.all_simple_paths(G, source=source, target=target, cutoff=3))
        formatted_paths = []
        for path in paths:
            path_edges = []
            for i in range(len(path)-1):
                u, v = path[i], path[i+1]
                rel = G.edges[u, v]['relation']
                path_edges.append({"source": u, "relation": rel, "target": v})
            formatted_paths.append(path_edges)
        return formatted_paths
    except nx.NetworkXNoPath:
        return []

def subgraph_tracking(entities: list) -> list:
    """Monitor extracted nodes/edges for a subset of entities."""
    subgraph = G.subgraph(entities)
    edges = []
    for u, v, data in subgraph.edges(data=True):
        edges.append({"source": u, "relation": data['relation'], "target": v})
    return edges

def execute_query(entities: list, clean_query: str) -> list:
    """Simple router to decide which graph traversal to use."""
    if not entities:
        return []
    
    if len(entities) == 1:
        # Check basic keywords for depth
        if "deep" in clean_query or "all" in clean_query:
            return dfs_traversal(entities[0], k=2)
        else:
            return bfs_traversal(entities[0], clean_query)
    elif len(entities) == 2:
        return find_simple_paths(entities[0], entities[1])
    elif len(entities) > 2:
        return subgraph_tracking(entities)
    return []
```

---

## `response_control.py`

```python
from config import RESPONSE_MODE_FULL, RESPONSE_MODE_FILTERED, RESPONSE_MODE_RESTRICTED
from data_loader import G

def format_filtered_response(raw_results: list) -> str:
    """Hides relation labels."""
    if not raw_results:
        return "No data found or entities unrecognized."
    
    output = "Filtered Results:\n"
    for item in raw_results:
        # Handle path list
        if isinstance(item, list):
            for step in item:
                output += f"- {step['source']} -> <HIDDEN> -> {step['target']}\n"
        else:
            output += f"- {item['source']} -> <HIDDEN> -> {item['target']}\n"
    return output

def format_full_response(raw_results: list) -> str:
    """Returns full graph relations."""
    if not raw_results:
        return "No data found or entities unrecognized."
        
    output = "Full Results:\n"
    for item in raw_results:
        # Handle path
        if isinstance(item, list):
             output += "Path: " + " => ".join([f"{step['source']} ({step['relation']}) {step['target']}" for step in item]) + "\n"
        else:
            output += f"- {item['source']} [{item['relation']}] {item['target']}\n"
    return output

def format_restricted_response(entities: list) -> str:
    """Provides a vague, abstracted response based purely on targeted entities without hitting the database."""
    if not entities:
        return "Internal details are unavailable."
        
    output = "Abstracted System Topology:\n"
    for entity in entities:
        if entity in G.nodes:
            entity_type = G.nodes[entity].get('type', 'Entity')
            output += f"- A [{entity_type}] is generally linked to internal corporate structures.\n"
            
    if len(entities) >= 2 and entities[0] in G.nodes and entities[1] in G.nodes:
        type1 = G.nodes[entities[0]].get('type', 'Entity')
        type2 = G.nodes[entities[1]].get('type', 'Entity')
        output = f"Abstracted System Topology:\n- A [{type1}] interacts with a [{type2}].\n"
        
    output += "\n*(Details abstractified per corporate security policy)*"
    return output

def apply_response_control(raw_results: list, response_mode: str, entities: list = None) -> str:
    """Applies the decided response mode to the raw graph results."""
    if response_mode == RESPONSE_MODE_RESTRICTED:
        return format_restricted_response(entities if entities else [])
    elif response_mode == RESPONSE_MODE_FILTERED:
        return format_filtered_response(raw_results)
    else:
        return format_full_response(raw_results)
```

---

## `logger.py`

```python
import json
from db import get_connection
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))

def _now_ist() -> str:
    """Returns the current IST time as a formatted string."""
    return datetime.now(IST).strftime("%Y-%m-%d %H:%M:%S")

def log_query(user_id: str, user_role: str, raw_query: str, clean_query: str, entities: list, 
              similarity_score: float, risk_score: int, risk_level: str, response_mode: str, ip_address: str):
    """Logs the query transaction into SQLite."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO logs (
            user_id, user_role, raw_query, clean_query, entities, 
            similarity_score, risk_score, risk_level, response_mode, ip_address, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        user_id,
        user_role,
        raw_query,
        clean_query,
        json.dumps(entities),
        float(similarity_score),
        risk_score,
        risk_level,
        response_mode,
        ip_address,
        _now_ist()
    ))
    conn.commit()
    conn.close()
```

---

## `user_profile.py`

```python
from db import get_connection
from config import RISK_LEVEL_MEDIUM, RISK_LEVEL_HIGH
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))

def _now_ist() -> str:
    """Returns the current IST time as a formatted string."""
    return datetime.now(IST).strftime("%Y-%m-%d %H:%M:%S")

def update_user_profile(user_id: str, user_role: str, risk_score: int, risk_level: str):
    """Updates user tracking stats in SQLite."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if exists
    cursor.execute("SELECT total_queries, avg_risk, suspicious_count FROM user_profiles WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    
    if row is None:
        total = 1
        avg_risk = float(risk_score)
        susp = 1 if risk_level in [RISK_LEVEL_MEDIUM, RISK_LEVEL_HIGH] else 0
        cursor.execute('''
            INSERT INTO user_profiles (user_id, role, total_queries, avg_risk, suspicious_count, last_seen)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, user_role, total, avg_risk, susp, _now_ist()))
    else:
        total = row[0] + 1
        avg_risk = ((row[1] * row[0]) + risk_score) / total
        susp = row[2] + (1 if risk_level in [RISK_LEVEL_MEDIUM, RISK_LEVEL_HIGH] else 0)
        
        cursor.execute('''
            UPDATE user_profiles 
            SET total_queries = ?, avg_risk = ?, suspicious_count = ?, last_seen = ?
            WHERE user_id = ?
        ''', (total, avg_risk, susp, _now_ist(), user_id))
        
    conn.commit()
    conn.close()

def get_user_profile(user_id: str):
    """Retrieves user profile stats."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT total_queries, avg_risk, suspicious_count, last_seen FROM user_profiles WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "total_queries": row[0],
            "avg_risk": row[1],
            "suspicious_count": row[2],
            "last_seen": row[3]
        }
    return None
```

---

## `app.py`

```python
import streamlit as st
import pandas as pd

# Important: set page config before any other st calls
st.set_page_config(page_title="AegisGraph", layout="wide")

import ui
import preprocessing
import behavior_analysis
import risk_scoring
import decision_engine
import graph_query
import response_control
import logger
import user_profile
from data_loader import GRAPH_NODES

# 1. Render UI components that don't depend on query state
role, user_id = ui.render_sidebar()

st.title("AegisGraph: Dynamic Query Playground")

if not user_id:
    st.warning("Please login via the sidebar to continue.")
    st.stop()

st.markdown("Try querying the graph (e.g., `Who manages Alice?` or `What classification does Project_Titan have?`). Probe multiple times to trigger risk rules.")

# Input box
with st.form("query_form"):
    raw_query = st.text_input("Enter your query:", "")
    submit = st.form_submit_button("Submit")

# Hardcoded mock IP for the demonstration to match the architectural diagram
mock_ip_address = f"192.168.1.{sum(ord(c) for c in user_id) % 255}" if user_id else "127.0.0.1"

if submit and raw_query:
    # 2. Preprocessing
    prep_data = preprocessing.preprocess(raw_query, GRAPH_NODES)
    
    # 3. Behavior Analysis
    behavior_signals = behavior_analysis.analyze_behavior(
        current_query=raw_query,
        current_clean=prep_data["clean_query"],
        current_entities=prep_data["entities"],
        current_embedding=prep_data["embedding"],
        user_id=user_id
    )
    
    # Fetch profile to evaluate historical risk
    current_profile = user_profile.get_user_profile(user_id)
    
    # 4. Compute Risk (Now profiled)
    risk_score, risk_level = risk_scoring.compute_risk(behavior_signals, role, current_profile)
    
    # 5. Decide Response Mode
    response_mode = decision_engine.get_response_mode(risk_level)
    
    # 6. Gate Graph Query Check
    # We DO NOT query the graph if the user is in highly restricted mode.
    if response_mode == "RESTRICTED":
        raw_graph_results = []
    else:
        raw_graph_results = graph_query.execute_query(prep_data["entities"], prep_data["clean_query"])
    
    # 7. Apply Response Control
    final_output = response_control.apply_response_control(raw_graph_results, response_mode, prep_data["entities"])
    
    # 8. Log Everything
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
        ip_address=mock_ip_address
    )
    
    # 9. Update Profile
    user_profile.update_user_profile(user_id, role, risk_score, risk_level)
    
    # Render Dynamic Dashboard
    st.markdown("---")
    ui.render_dashboard(risk_score, risk_level, response_mode)
    
    st.subheader("Response")
    st.text_area("Output", final_output, height=150, disabled=True)

    with st.expander("Debug Metadata"):
        st.write("Entities Extracted:", prep_data["entities"])
        st.write("Behavior Signals:", behavior_signals)
        if response_mode != "RESTRICTED":
            st.write("Raw Graph Traversal Result:", raw_graph_results)
        else:
            st.warning("Graph Traversal aborted due to HIGH risk policy. Database untouched.")

st.markdown("---")
ui.render_logs(user_id)
ui.render_user_profile(user_profile.get_user_profile(user_id))
```

---

## `ui.py`

```python
import streamlit as st
import pandas as pd
import bcrypt
import streamlit.components.v1 as components
from pyvis.network import Network
from db import get_connection

def render_sidebar():
    st.sidebar.title("🛡️ AegisGraph")
    st.sidebar.markdown("Privacy-Aware Security Framework for Knowledge Graph QA Systems")
    
    st.sidebar.subheader("Authentication")
    if "authenticated_user" not in st.session_state:
        st.session_state.authenticated_user = None
        st.session_state.user_role = None

    if st.session_state.authenticated_user is None:
        auth_mode = st.sidebar.radio("Mode", ["Login", "Register"])
        
        with st.sidebar.form("auth_form"):
            username = st.text_input("Username", "")
            password = st.text_input("Password", type="password")
            
            if auth_mode == "Register":
                role = st.selectbox("Select Role", ["Employee", "External"])
                submit = st.form_submit_button("Register")
                if submit and username and password:
                    salt = bcrypt.gensalt()
                    pwd_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
                    conn = get_connection()
                    try:
                        conn.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", 
                                    (username, pwd_hash, role))
                        conn.commit()
                        st.sidebar.success(f"User {username} registered! You can now login.")
                    except:
                        st.sidebar.error("Username already exists.")
                    finally:
                        conn.close()
            else:
                submit = st.form_submit_button("Login")
                if submit and username and password:
                    conn = get_connection()
                    cursor = conn.cursor()
                    cursor.execute("SELECT password_hash, role FROM users WHERE username = ?", (username,))
                    result = cursor.fetchone()
                    conn.close()
                    if result:
                        stored_hash = result[0]
                        role = result[1]
                        if bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
                            st.session_state.authenticated_user = username
                            st.session_state.user_role = role
                            st.rerun()
                        else:
                            st.sidebar.error("Invalid credentials.")
                    else:
                        st.sidebar.error("Invalid credentials.")
    else:
        st.sidebar.success(f"Logged in as: {st.session_state.authenticated_user}")
        st.sidebar.info(f"Role: {st.session_state.user_role}")
        if st.sidebar.button("Logout"):
            st.session_state.authenticated_user = None
            st.session_state.user_role = None
            st.rerun()
            
    st.sidebar.markdown("---")
    st.sidebar.subheader("Dataset Node Classifications")
    with st.sidebar.expander("View Graph Topography", expanded=False):
        st.write("- **Executives:** Eve_CEO, Dave_VP_Eng, Sarah_VP_Fin, Tom_VP_HR")
        st.write("- **Management:** Bob_Manager, Carol_Manager, Dan_Manager, Frank_Manager")
        st.write("- **Employees (20+):** Alice, John, Mark, Emily, Chris, Nancy, Peter, Rachel, Sam, Tina, Charlie, George, Hannah, Ivan, Jenny, Kelly, Laura, Mike, Nina, Oscar")
        st.write("- **Projects:** Project_Titan, Project_Oasis, Project_Apollo, Project_Zeus, Project_Hermes")
        st.write("- **Databases:** Customer_DB, Auth_DB, S3_Logs_Bucket")
        st.write("- **Network Zones:** AWS_VPC_Prod, AWS_VPC_Dev")
        st.write("- **Security Policies:** Zero_Trust_Policy")
    
    return st.session_state.user_role, st.session_state.authenticated_user

def render_dashboard(risk_score, risk_level, response_mode):
    col1, col2, col3 = st.columns(3)
    col1.metric("Risk Score", risk_score)
    
    if risk_level == "LOW":
        color = "🟢"
    elif risk_level == "MEDIUM":
        color = "🟡"
    else:
        color = "🔴"
        
    col2.metric("Risk Level", f"{color} {risk_level}")
    col3.metric("Response Mode", response_mode)

def render_logs(user_id: str):
    st.subheader("Query Logs (Your History)")
    if not user_id:
        st.write("Please authenticate to view logs.")
        return
        
    conn = get_connection()
    df = pd.read_sql_query("SELECT id, user_role, raw_query, entities, risk_score, risk_level, response_mode, ip_address, timestamp FROM logs WHERE user_id = ? ORDER BY id DESC LIMIT 10", conn, params=(user_id,))
    conn.close()
    st.dataframe(df, use_container_width=True)

def render_user_profile(profile_data):
    st.subheader("User Profile Metrics")
    if profile_data:
        c1, c2, c3 = st.columns(3)
        c1.metric("Total Queries", profile_data["total_queries"])
        c2.metric("Avg Risk Score", f"{profile_data['avg_risk']:.2f}")
        c3.metric("Suspicious Queries", profile_data["suspicious_count"])
    else:
        st.write("No profile data yet.")

def render_interactive_graph(G):
    net = Network(height='600px', width='100%', bgcolor='#0E1117', font_color='white', directed=True)
    # Give different colors based on type
    for node, node_attrs in G.nodes(data=True):
        n_type = node_attrs.get('type', 'Entity')
        if n_type == 'Executive':
            color = '#FF4B4B'
        elif n_type == 'Management':
            color = '#FFAA00'
        elif n_type == 'Employee':
            color = '#00B4D8'
        elif n_type == 'Project':
            color = '#00FF00'
        elif n_type == 'Microservice':
            color = '#FF00FF'
        elif n_type == 'Database':
            color = '#FFFF00'
        elif n_type == 'Network_Zone':
            color = '#8A2BE2'
        else:
            color = '#AAAAAA'
            
        net.add_node(node, label=node, title=n_type, color=color)
        
    for source, target, edge_attrs in G.edges(data=True):
        rel = edge_attrs.get('relation', '')
        net.add_edge(source, target, title=rel)
        
    net.toggle_physics(True)
    
    # Save the file out temporarily to sidestep generate_html string handling issues in some versions
    net.save_graph('temp_graph.html')
    with open('temp_graph.html', 'r', encoding='utf-8') as f:
        html = f.read()
    return html

def show_graph_ui(G):
    st.markdown("---")
    st.subheader("Interactive Topology Map")
    with st.expander("Visualize the Knowledge Graph", expanded=False):
        st.write("Zoom and drag around the physical structure of our Mock Corporate Dataset!")
        html_data = render_interactive_graph(G)
        components.html(html_data, height=600)

```

---

## `api.py`

```python
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
```

---

## `frontend\package.json`

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "framer-motion": "^12.38.0",
    "lucide-react": "^1.11.0",
    "next": "16.2.4",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "vis-network": "^10.0.2"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.4",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

---

## `frontend\tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
```

---

## `frontend\next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

---

## `frontend\app\globals.css`

```css
@import "tailwindcss";

:root {
  --background: #070711;
  --foreground: #ffffff;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  background: #070711;
  color: #ffffff;
  font-family: var(--font-sans, ui-sans-serif, system-ui, sans-serif);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #0e0e20; }
::-webkit-scrollbar-thumb { background: #3730a3; border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: #4338ca; }
```

---

## `frontend\app\layout.tsx`

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AegisGraph — Privacy-Aware Security Framework",
  description: "Knowledge Graph QA System with dynamic risk analysis, behavior detection, and privacy-aware response control.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} bg-[#070711] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

---

## `frontend\app\page.tsx`

```tsx
'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LightLines from '@/components/LightLines'
import RevealLoader from '@/components/RevealLoader'
import SpotlightNavbar from '@/components/SpotlightNavbar'
import FlipText from '@/components/FlipText'
import FlipFadeText from '@/components/FlipFadeText'
import AnimatedButton from '@/components/AnimatedButton'
import LineHoverLink from '@/components/LineHoverLink'
import { Auth, Query, Logs, Profile } from '@/lib/api'
import { LogOut, Terminal, BarChart2, GitBranch, User, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react'

type Tab = 'query' | 'logs' | 'profile'
type AuthMode = 'login' | 'register'

interface QueryResult {
  output: string
  risk_score: number
  risk_level: string
  response_mode: string
  entities: string[]
  behavior_signals: Record<string, any>
}

const RISK_COLOR: Record<string, string> = {
  LOW: 'text-emerald-400',
  MEDIUM: 'text-amber-400',
  HIGH: 'text-red-400',
}
const RISK_BG: Record<string, string> = {
  LOW: 'bg-emerald-400/10 border-emerald-400/30',
  MEDIUM: 'bg-amber-400/10 border-amber-400/30',
  HIGH: 'bg-red-400/10 border-red-400/30',
}

export default function Home() {
  const [loaded, setLoaded] = useState(false)
  const [user, setUser] = useState<{ username: string; role: string } | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authForm, setAuthForm] = useState({ username: '', password: '', role: 'Employee' })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [tab, setTab] = useState<Tab>('query')
  const [query, setQuery] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [queryError, setQueryError] = useState('')

  const [logs, setLogs] = useState<any[]>([])
  const [profile, setProfileData] = useState<any>(null)

  const navItems = [
    { label: 'Query', onClick: () => setTab('query') },
    { label: 'Logs', onClick: () => { setTab('logs'); fetchLogs() } },
    { label: 'Profile', onClick: () => { setTab('profile'); fetchProfile() } },
  ]
  const tabIndex = tab === 'query' ? 0 : tab === 'logs' ? 1 : 2

  const fetchLogs = useCallback(async () => {
    if (!user) return
    try { const d = await Logs.get(user.username); setLogs(d.logs) } catch {}
  }, [user])

  const fetchProfile = useCallback(async () => {
    if (!user) return
    try { const d = await Profile.get(user.username); setProfileData(d.profile) } catch {}
  }, [user])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(''); setAuthLoading(true)
    try {
      if (authMode === 'register') {
        await Auth.register(authForm.username, authForm.password, authForm.role)
        setAuthMode('login')
        setAuthError('Registered! Now login.')
      } else {
        const data = await Auth.login(authForm.username, authForm.password)
        setUser({ username: data.username, role: data.role })
      }
    } catch (err: any) {
      setAuthError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !query.trim()) return
    setProcessing(true); setResult(null); setQueryError('')
    try {
      const data = await Query.run(query, user.username, user.role)
      setResult(data)
    } catch (err: any) {
      setQueryError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      <RevealLoader onComplete={() => setLoaded(true)} />
      <LightLines />

      <AnimatePresence>
        {loaded && (
          <motion.div
            className="relative z-10 min-h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* ── NOT LOGGED IN ── */}
            {!user ? (
              <div className="min-h-screen flex items-center justify-center px-4">
                <motion.div
                  className="w-full max-w-md"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  {/* Logo */}
                  <div className="text-center mb-10">
                    <FlipText
                      className="text-4xl font-black tracking-tight text-white"
                      delay={0.1}
                    >
                      AegisGraph
                    </FlipText>
                    <p className="text-indigo-400 text-sm mt-2 tracking-widest uppercase">
                      Privacy-Aware Security Framework
                    </p>
                  </div>

                  {/* Auth Card */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 shadow-2xl">
                    {/* Tab switcher */}
                    <div className="flex gap-1 mb-8 bg-white/5 rounded-lg p-1">
                      {(['login', 'register'] as AuthMode[]).map(m => (
                        <button
                          key={m}
                          onClick={() => { setAuthMode(m); setAuthError('') }}
                          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                            authMode === m
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-indigo-400 hover:text-white'
                          }`}
                        >
                          {m === 'login' ? 'Login' : 'Register'}
                        </button>
                      ))}
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                      <div>
                        <label className="block text-xs text-indigo-300 uppercase tracking-wider mb-1.5">Username</label>
                        <input
                          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                          placeholder="Enter username"
                          value={authForm.username}
                          onChange={e => setAuthForm(p => ({ ...p, username: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-indigo-300 uppercase tracking-wider mb-1.5">Password</label>
                        <input
                          type="password"
                          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                          placeholder="Enter password"
                          value={authForm.password}
                          onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))}
                          required
                        />
                      </div>
                      {authMode === 'register' && (
                        <div>
                          <label className="block text-xs text-indigo-300 uppercase tracking-wider mb-1.5">Role</label>
                          <select
                            className="w-full px-4 py-2.5 rounded-lg bg-[#0e0e20] border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                            value={authForm.role}
                            onChange={e => setAuthForm(p => ({ ...p, role: e.target.value }))}
                          >
                            <option value="Employee">Employee</option>
                            <option value="External">External</option>
                          </select>
                        </div>
                      )}

                      {authError && (
                        <p className={`text-sm ${authError.includes('Registered') ? 'text-emerald-400' : 'text-red-400'}`}>
                          {authError}
                        </p>
                      )}

                      <AnimatedButton type="submit" className="w-full" disabled={authLoading}>
                        {authLoading ? 'Please wait…' : authMode === 'login' ? 'Login' : 'Create Account'}
                      </AnimatedButton>
                    </form>

                  </div>

                  {/* Query hint chips — outside the card */}
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <span className="text-xs text-white/20">Try:</span>
                    {['Who manages Alice?', 'What does Project_Titan classify as?'].map(q => (
                      <span key={q} className="text-xs px-3 py-1 rounded-full border border-indigo-500/20 text-indigo-400/70 bg-indigo-500/5">
                        {q}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </div>
            ) : (
              /* ── LOGGED IN ── */
              <div className="min-h-screen pt-20">
                <SpotlightNavbar items={navItems} activeIndex={tabIndex} />

                {/* User badge + logout anchored right inside navbar height */}
                <div className="fixed top-0 right-6 z-50 h-[52px] flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-indigo-300">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-medium text-white">{user.username}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-600/40 text-indigo-200 font-semibold">{user.role}</span>
                  </div>
                  <button
                    onClick={() => { setUser(null); setResult(null) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/50 hover:text-red-400 hover:bg-red-400/10 border border-white/10 hover:border-red-400/30 transition-all duration-200"
                  >
                    <LogOut className="w-3.5 h-3.5" />Logout
                  </button>
                </div>

                <div className="max-w-5xl mx-auto px-8 py-10">
                  {/* ── QUERY TAB ── */}
                  {tab === 'query' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                      <div className="mb-8">
                        <FlipText className="text-3xl font-black text-white" delay={0}>
                          Dynamic Query Playground
                        </FlipText>
                        <p className="text-indigo-400 mt-2 text-sm">
                          Probe the knowledge graph. Repeated probing triggers escalating risk rules.
                        </p>
                      </div>

                      <form onSubmit={handleQuery} className="mb-6">
                        <div className="flex gap-3">
                          <input
                            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder='e.g. "Who manages Alice?" or "What is Project_Titan?"'
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            disabled={processing}
                          />
                          <AnimatedButton type="submit" disabled={processing || !query.trim()}>
                            <Terminal className="w-4 h-4 inline mr-2" />
                            {processing ? 'Running…' : 'Execute'}
                          </AnimatedButton>
                        </div>
                      </form>

                      {/* Query suggestions */}
                      <div className="flex flex-wrap gap-2 mb-8">
                        {['Who manages Alice?', 'What classification does Project_Titan have?', 'Show deep graph for Alice', 'Alice Bob'].map(s => (
                          <button
                            key={s}
                            onClick={() => setQuery(s)}
                            className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-indigo-300 hover:bg-white/10 hover:text-white transition-all"
                          >
                            {s}
                          </button>
                        ))}
                      </div>

                      {/* Processing animation */}
                      <AnimatePresence>
                        {processing && (
                          <motion.div
                            className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 mb-6"
                            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                          >
                            <FlipFadeText />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {queryError && (
                        <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 mb-6 text-red-400 text-sm">
                          {queryError}
                        </div>
                      )}

                      {/* Result */}
                      <AnimatePresence>
                        {result && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="space-y-5"
                          >
                            {/* Risk dashboard */}
                            <div className="grid grid-cols-3 gap-5">
                              {[
                                { label: 'Risk Score', value: result.risk_score, icon: <BarChart2 className="w-5 h-5" /> },
                                { label: 'Risk Level', value: result.risk_level, icon: <ShieldAlert className="w-5 h-5" />, color: RISK_COLOR[result.risk_level] },
                                { label: 'Response Mode', value: result.response_mode, icon: <GitBranch className="w-5 h-5" /> },
                              ].map(m => (
                                <div key={m.label} className={`rounded-2xl border p-6 flex flex-col gap-3 ${RISK_BG[result.risk_level]}`}>
                                  <div className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-widest">
                                    {m.icon}<span>{m.label}</span>
                                  </div>
                                  <p className={`text-3xl font-black tracking-tight ${m.color || 'text-white'}`}>{m.value}</p>
                                </div>
                              ))}
                            </div>

                            {/* Output */}
                            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                              <p className="text-xs text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <CheckCircle className="w-3.5 h-3.5" /> Response
                              </p>
                              <div className="space-y-2">
                                {result.output.split('\n').filter(Boolean).map((line, i) => (
                                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] transition-colors border border-white/5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/70 shrink-0" />
                                    <span className="text-sm text-white/80 font-mono">{line.replace(/^- /, '')}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Debug */}
                            <details className="rounded-xl border border-white/10 bg-white/[0.02]">
                              <summary className="px-5 py-3 text-xs text-white/40 cursor-pointer hover:text-white/60 transition-colors uppercase tracking-wider">
                                Debug Metadata
                              </summary>
                              <div className="px-5 pb-5 space-y-2">
                                <p className="text-xs text-indigo-300">Entities: <span className="text-white">{result.entities.join(', ') || 'none'}</span></p>
                                {Object.entries(result.behavior_signals).map(([k, v]) => (
                                  <p key={k} className="text-xs text-indigo-300">{k}: <span className="text-white">{String(v)}</span></p>
                                ))}
                              </div>
                            </details>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {/* ── LOGS TAB ── */}
                  {tab === 'logs' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <h2 className="text-2xl font-bold mb-6">Query Logs</h2>
                      {logs.length === 0 ? (
                        <p className="text-white/40 text-sm">No logs yet. Run a query first.</p>
                      ) : (
                        <div className="space-y-3">
                          {logs.map((log, i) => (
                            <motion.div
                              key={log.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <p className="text-sm text-white font-mono">"{log.raw_query}"</p>
                                <span className={`text-xs font-bold shrink-0 ${RISK_COLOR[log.risk_level] || 'text-white'}`}>{log.risk_level}</span>
                              </div>
                              <div className="flex gap-4 mt-2 text-xs text-white/40">
                                <span>Score: {log.risk_score}</span>
                                <span>{log.response_mode}</span>
                                <span>{log.timestamp} IST</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ── PROFILE TAB ── */}
                  {tab === 'profile' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <h2 className="text-2xl font-bold mb-6">User Profile</h2>
                      {!profile ? (
                        <p className="text-white/40 text-sm">No profile data yet. Run a query first.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { label: 'Total Queries', value: profile.total_queries },
                            { label: 'Avg Risk Score', value: profile.avg_risk?.toFixed(2) },
                            { label: 'Suspicious Queries', value: profile.suspicious_count },
                            { label: 'Last Seen', value: profile.last_seen ? `${profile.last_seen} IST` : null },
                          ].map(item => (
                            <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                              <p className="text-xs text-indigo-400 uppercase tracking-wider mb-1">{item.label}</p>
                              <p className="text-2xl font-bold text-white">{item.value ?? '—'}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

---

## `frontend\lib\api.ts`

```typescript
const BASE = 'http://localhost:8000'

async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const Auth = {
  login: (username: string, password: string) =>
    api('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username: string, password: string, role: string) =>
    api('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, role }) }),
}

export const Query = {
  run: (raw_query: string, user_id: string, role: string) =>
    api('/query', { method: 'POST', body: JSON.stringify({ raw_query, user_id, role }) }),
}

export const Logs = {
  get: (user_id: string) => api(`/logs/${user_id}`),
}

export const Profile = {
  get: (user_id: string) => api(`/profile/${user_id}`),
}

export const Graph = {
  topology: () => api('/graph/topology'),
}
```

---

## `frontend\components\AnimatedButton.tsx`

```tsx
'use client'
import { motion } from 'framer-motion'
import { ButtonHTMLAttributes } from 'react'

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
}

export default function AnimatedButton({ children, className = '', variant = 'primary', ...props }: AnimatedButtonProps) {
  const base = 'px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30',
    ghost:   'bg-white/5 hover:bg-white/10 text-indigo-300 border border-white/10',
    danger:  'bg-red-600/80 hover:bg-red-500 text-white',
  }

  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`${base} ${variants[variant]} ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.button>
  )
}
```

---

## `frontend\components\FlipFadeText.tsx`

```tsx
'use client'
import { useEffect, useState, useMemo, memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const WORDS = ['ANALYZING', 'COMPUTING', 'RETRIEVING', 'TRAVERSING', 'EVALUATING']

const Letter = memo(function Letter({ char }: { char: string }) {
  return (
    <motion.span
      style={{ display: 'inline-block', transformStyle: 'preserve-3d' }}
      variants={{
        initial: { rotateX: 90, y: 20, opacity: 0, filter: 'blur(8px)' },
        animate: { rotateX: 0, y: 0, opacity: 1, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.2, 0.65, 0.3, 0.9] } },
        exit:    { rotateX: -90, y: -20, opacity: 0, filter: 'blur(8px)', transition: { duration: 0.3, ease: 'easeIn' } },
      }}
    >
      {char}
    </motion.span>
  )
})

const Word = memo(function Word({ text }: { text: string }) {
  return (
    <motion.div
      className="flex gap-[0.08em] text-2xl font-bold text-indigo-300 tracking-widest uppercase"
      initial="initial" animate="animate" exit="exit"
      variants={{ initial: { opacity: 1 }, animate: { opacity: 1, transition: { staggerChildren: 0.06 } }, exit: { opacity: 1, transition: { staggerChildren: 0.03 } } }}
    >
      {text.split('').map((c, i) => <Letter key={`${c}-${i}`} char={c} />)}
    </motion.div>
  )
})

export default function FlipFadeText() {
  const [index, setIndex] = useState(0)
  const next = useCallback(() => setIndex(p => (p + 1) % WORDS.length), [])
  useEffect(() => { const t = setInterval(next, 1800); return () => clearInterval(t) }, [next])
  const word = useMemo(() => WORDS[index], [index])

  return (
    <div className="flex items-center justify-center py-6" style={{ perspective: '800px' }}>
      <AnimatePresence mode="wait">
        <Word key={word} text={word} />
      </AnimatePresence>
    </div>
  )
}
```

---

## `frontend\components\FlipText.tsx`

```tsx
'use client'
import { motion } from 'framer-motion'

interface FlipTextProps {
  children: string
  className?: string
  delay?: number
}

export default function FlipText({ children, className = '', delay = 0 }: FlipTextProps) {
  return (
    <span className={className} aria-label={children} style={{ display: 'inline-flex', gap: '0.04em', perspective: '600px' }}>
      {children.split('').map((char, i) => (
        <motion.span
          key={i}
          style={{ display: 'inline-block', transformStyle: 'preserve-3d' }}
          initial={{ rotateX: 90, opacity: 0, filter: 'blur(6px)' }}
          animate={{ rotateX: 0, opacity: 1, filter: 'blur(0px)' }}
          transition={{
            duration: 0.55,
            delay: delay + i * 0.04,
            ease: [0.2, 0.65, 0.3, 0.9],
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  )
}
```

---

## `frontend\components\LightLines.tsx`

```tsx
'use client'
import { useEffect, useRef } from 'react'

export default function LightLines() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const NUM_LINES = 12
    const balls = Array.from({ length: NUM_LINES }, (_, i) => ({
      x: (window.innerWidth / NUM_LINES) * i + window.innerWidth / NUM_LINES / 2,
      y: Math.random() * window.innerHeight,
      speed: 0.6 + Math.random() * 1.2,
      length: 80 + Math.random() * 120,
      opacity: 0.3 + Math.random() * 0.5,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw vertical track lines
      balls.forEach(b => {
        ctx.beginPath()
        ctx.moveTo(b.x, 0)
        ctx.lineTo(b.x, canvas.height)
        ctx.strokeStyle = 'rgba(99,102,241,0.06)'
        ctx.lineWidth = 1
        ctx.stroke()
      })

      // Draw moving light balls
      balls.forEach(b => {
        const grad = ctx.createLinearGradient(b.x, b.y - b.length, b.x, b.y + b.length)
        grad.addColorStop(0, 'transparent')
        grad.addColorStop(0.4, `rgba(129,140,248,${b.opacity * 0.4})`)
        grad.addColorStop(0.5, `rgba(199,210,254,${b.opacity})`)
        grad.addColorStop(0.6, `rgba(129,140,248,${b.opacity * 0.4})`)
        grad.addColorStop(1, 'transparent')

        ctx.beginPath()
        ctx.moveTo(b.x, b.y - b.length)
        ctx.lineTo(b.x, b.y + b.length)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.stroke()

        b.y += b.speed
        if (b.y - b.length > canvas.height) b.y = -b.length
      })

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  )
}
```

---

## `frontend\components\LineHoverLink.tsx`

```tsx
'use client'
import Link from 'next/link'

interface LineHoverLinkProps {
  href?: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  active?: boolean
}

export default function LineHoverLink({ href = '#', children, className = '', onClick, active }: LineHoverLinkProps) {
  const cls = `
    relative inline-block text-sm font-medium cursor-pointer transition-colors duration-200
    text-indigo-300 hover:text-white
    after:content-[''] after:absolute after:bottom-0 after:left-0
    after:h-[1.5px] after:bg-indigo-400
    after:transition-all after:duration-300 after:ease-out
    ${active ? 'text-white after:w-full' : 'after:w-0 hover:after:w-full'}
    ${className}
  `

  if (onClick) {
    return <span className={cls} onClick={onClick}>{children}</span>
  }

  return <Link href={href} className={cls}>{children}</Link>
}
```

---

## `frontend\components\RevealLoader.tsx`

```tsx
'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface RevealLoaderProps {
  onComplete?: () => void
}

export default function RevealLoader({ onComplete }: RevealLoaderProps) {
  const [show, setShow] = useState(true)
  const [exit, setExit] = useState(false)
  const text = 'AEGISGRAPH'

  useEffect(() => {
    const already = sessionStorage.getItem('aegis_loaded')
    if (already) { setShow(false); onComplete?.(); return }

    const t1 = setTimeout(() => setExit(true), 2400)
    const t2 = setTimeout(() => {
      setShow(false)
      sessionStorage.setItem('aegis_loaded', '1')
      onComplete?.()
    }, 3000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onComplete])

  if (!show) return null

  return (
    <AnimatePresence>
      {!exit && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a1a]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Gradient shutter bars */}
          <div className="absolute inset-0 grid grid-rows-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-full"
                style={{ background: i % 2 === 0 ? '#0f172a' : '#1e293b' }}
                initial={{ scaleY: 1 }}
                animate={{ scaleY: exit ? 0 : 1 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
              />
            ))}
          </div>

          {/* Text */}
          <div className="relative z-10 flex gap-[0.05em]" style={{ perspective: '600px' }}>
            {text.split('').map((char, i) => (
              <motion.span
                key={i}
                className="text-6xl md:text-8xl font-black text-white tracking-widest"
                style={{ display: 'inline-block', fontFamily: 'Anton, sans-serif', transformStyle: 'preserve-3d' }}
                initial={{ rotateX: 90, y: 30, opacity: 0, filter: 'blur(8px)' }}
                animate={{ rotateX: 0, y: 0, opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.07, ease: [0.2, 0.65, 0.3, 0.9] }}
              >
                {char}
              </motion.span>
            ))}
          </div>

          {/* Subtitle */}
          <motion.p
            className="absolute bottom-[38%] text-indigo-400 text-sm tracking-[0.3em] uppercase"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            Privacy-Aware Security Framework
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

---

## `frontend\components\SpotlightNavbar.tsx`

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import LineHoverLink from './LineHoverLink'
import { Shield } from 'lucide-react'

interface NavItem { label: string; onClick: () => void }

interface SpotlightNavbarProps {
  items: NavItem[]
  activeIndex: number
}

export default function SpotlightNavbar({ items, activeIndex }: SpotlightNavbarProps) {
  const navRef = useRef<HTMLDivElement>(null)
  const [hoverX, setHoverX] = useState<number | null>(null)
  const spotlightX = useRef(0)
  const ambienceX = useRef(0)

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const handleMove = (e: MouseEvent) => {
      const rect = nav.getBoundingClientRect()
      const x = e.clientX - rect.left
      setHoverX(x)
      spotlightX.current = x
      nav.style.setProperty('--spotlight-x', `${x}px`)
    }

    const handleLeave = () => {
      setHoverX(null)
      const activeItem = nav.querySelector(`[data-index="${activeIndex}"]`)
      if (activeItem) {
        const navRect = nav.getBoundingClientRect()
        const itemRect = activeItem.getBoundingClientRect()
        const targetX = itemRect.left - navRect.left + itemRect.width / 2
        animate(spotlightX.current, targetX, {
          type: 'spring', stiffness: 200, damping: 20,
          onUpdate: v => { spotlightX.current = v; nav.style.setProperty('--spotlight-x', `${v}px`) }
        })
      }
    }

    nav.addEventListener('mousemove', handleMove)
    nav.addEventListener('mouseleave', handleLeave)
    return () => { nav.removeEventListener('mousemove', handleMove); nav.removeEventListener('mouseleave', handleLeave) }
  }, [activeIndex])

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const activeItem = nav.querySelector(`[data-index="${activeIndex}"]`)
    if (activeItem) {
      const navRect = nav.getBoundingClientRect()
      const itemRect = activeItem.getBoundingClientRect()
      const targetX = itemRect.left - navRect.left + itemRect.width / 2
      animate(ambienceX.current, targetX, {
        type: 'spring', stiffness: 200, damping: 20,
        onUpdate: v => { ambienceX.current = v; nav.style.setProperty('--ambience-x', `${v}px`) }
      })
    }
  }, [activeIndex])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-3 flex items-center backdrop-blur-md bg-[#0a0a1a]/80 border-b border-white/5">
      {/* Logo — left */}
      <div className="flex items-center gap-2 text-white font-bold text-lg w-48 shrink-0">
        <Shield className="w-5 h-5 text-indigo-400" />
        <span className="tracking-tight">AegisGraph</span>
      </div>

      {/* Spotlight Nav — center */}
      <div className="flex-1 flex justify-center">
      <div
        ref={navRef}
        className="relative h-10 rounded-full flex items-center px-2 gap-0 overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}
      >
        <ul className="relative flex items-center h-full gap-0 z-10">
          {items.map((item, idx) => (
            <li key={idx} className="relative h-full flex items-center">
              <button
                data-index={idx}
                onClick={item.onClick}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-full focus:outline-none ${
                  activeIndex === idx ? 'text-white' : 'text-indigo-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Moving spotlight */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] transition-opacity duration-300"
          style={{
            opacity: hoverX !== null ? 1 : 0,
            background: `radial-gradient(100px circle at var(--spotlight-x, 50%) 100%, rgba(129,140,248,0.15) 0%, transparent 50%)`,
          }}
        />
        {/* Active ambience line */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 w-full h-[2px] z-[2]"
          style={{
            background: `radial-gradient(60px circle at var(--ambience-x, 50%) 0%, rgba(129,140,248,0.9) 0%, transparent 100%)`,
          }}
        />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/5 z-0" />
      </div>
      </div>
      {/* Right spacer — mirrors logo width so nav stays centered */}
      <div className="w-48 shrink-0" />
    </header>
  )
}
```

---


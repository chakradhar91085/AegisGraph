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

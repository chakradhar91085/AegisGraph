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

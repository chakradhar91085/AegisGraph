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

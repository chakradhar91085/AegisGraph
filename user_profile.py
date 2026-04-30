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

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

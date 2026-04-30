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

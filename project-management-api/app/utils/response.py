# app/utils/response.py

from typing import Any, Dict, Optional


def success(message: str = "Success", data=None):
    """
    Unified API response shape that matches all response models.
    """
    if isinstance(data, dict):
        return {
            "message": message,
            **data
        }

    return {
        "message": message,
        "data": data
    }



def error(
    message: str,
    error_code: Optional[str] = None,
    status_code: int = 400
) -> Dict[str, Any]:
    """
    Standard error response wrapper.
    Note: Global exception handler manages actual HTTP status codes.
    """
    return {
        "success": False,
        "message": message,
        "error_code": error_code,
        "status_code": status_code
    }

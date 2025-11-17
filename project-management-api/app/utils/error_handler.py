from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from datetime import datetime, timezone

# Standard API error format
def format_error(detail: str, status_code: int):
    return {
        "detail": detail,
        "status_code": status_code,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# -------------------------
# Validation Errors (Pydantic)
# -------------------------
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []

    for error in exc.errors():
        field = ".".join(str(x) for x in error.get("loc", []))
        msg = error.get("msg")
        val = error.get("ctx", {}).get("given") if "ctx" in error else None

        errors.append({
            "field": field,
            "message": msg,
            "value": val,
        })

    return JSONResponse(
        status_code=422,
        content={
            "detail": errors,
            "status_code": 422,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
    )


# -------------------------
# HTTP Exceptions (404, 409, etc.)
# -------------------------
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=format_error(str(exc.detail), exc.status_code)
    )


# -------------------------
# Unhandled / Unexpected Errors (500)
# -------------------------
async def global_exception_handler(request: Request, exc: Exception):
    # Log exception here if needed
    print("🔥 Internal server error:", exc)

    return JSONResponse(
        status_code=500,
        content=format_error("Internal server error", 500)
    )

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from fastapi.openapi.utils import get_openapi
from datetime import datetime


# Load models (side-effect import)
import app.models as _models
assert _models

# Routers
from app.routers.auth import router as auth_router
from app.routers.projects import router as project_router
from app.routers.tasks import router as task_router
from app.routers.users import router as user_router
from app.routers.sessions import router as session_router
from app.routers.stats import router as stats_router

# Error Handlers
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.utils.error_handler import (
    validation_exception_handler,
    http_exception_handler,
    global_exception_handler,
)


# ---------------------------------------------------------
# SECURITY SCHEME (adds "Authorize" button in Swagger)
# ---------------------------------------------------------
bearer_scheme = HTTPBearer()


def custom_openapi(app: FastAPI):
    """Inject BearerAuth into Swagger UI automatically."""

    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description="API for Project Management System",
        routes=app.routes,
    )

    # Add security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }

    # Apply it globally to all secured endpoints
    openapi_schema["security"] = [{"bearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


# ---------------------------------------------------------
# APPLICATION FACTORY
# ---------------------------------------------------------
def create_app():
    app = FastAPI(
        title="Project Management API",
        version="1.0.0",
        swagger_ui_parameters={"persistAuthorization": True}  # ⭐ Keep token saved
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_origin_regex="http://localhost:3000",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )


    # Routers
    app.include_router(auth_router)
    app.include_router(user_router)
    app.include_router(project_router)
    app.include_router(task_router)
    app.include_router(session_router)
    app.include_router(stats_router)

    # Error handlers
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, global_exception_handler)

    # Custom OpenAPI with JWT support
    app.openapi = lambda: custom_openapi(app)

    # ---------------------------------------------------------
    # ROOT & HEALTH CHECK ENDPOINTS
    # ---------------------------------------------------------
    @app.get("/")
    async def root():
        """Root endpoint - API welcome message"""
        return {
            "message": "Welcome to Project Management API",
            "version": "1.0.0",
            "docs": "http://localhost:8000/docs",
            "redoc": "http://localhost:8000/redoc"
        }

    @app.get("/health")
    async def health_check():
        """Health check endpoint"""
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "Project Management API"
        }

    @app.get("/api/v1/health")
    async def api_health_check():
        """API v1 health check endpoint"""
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0"
        }

    return app


app = create_app()
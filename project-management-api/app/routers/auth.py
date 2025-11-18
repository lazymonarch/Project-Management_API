# app/routers/auth.py
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID, uuid4

from pydantic import BaseModel
from jose import jwt

from app.database import get_db
from app.config import get_settings
from app.schemas.user import UserPublic, UserRegister # Correct import
from app.services.user_service import UserService
from app.services.session_service import SessionService
from app.services.auth_service import AuthService
from app.models.user import User, UserRole
from app.models.session import Session
from app.utils.device import extract_ip, extract_device_info
from app.utils.response import success  
from app.utils.auth import hash_password, create_access_token_for_user


settings = get_settings()
router = APIRouter(prefix="/api/v1/auth")


# ============================
#  AUTH DEPENDENCY (the source of truth)
# ============================
async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Extract current authenticated user from Bearer token."""

    auth = request.headers.get("Authorization")

    if not auth:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    token_parts = auth.split(" ")
    if len(token_parts) != 2 or token_parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header")

    token = token_parts[1]

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"verify_exp": False},  # timeless access token (your design)
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("user_id")
    session_id = payload.get("session_id")

    if not user_id or not session_id:
        raise HTTPException(status_code=401, detail="Token missing user/session ID")

    # Validate session
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session or not session.is_active:
        raise HTTPException(status_code=401, detail="Session is inactive")

    # Fetch user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


# ============================
#  ROUTER CONFIG
# ============================
router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Auth"]
)


# ============================
#  Pydantic Schemas
# ============================
class RegisterRequest(BaseModel):
    email: str
    username: str
    full_name: str
    password: str
    role: str


class RefreshRequest(BaseModel):
    session_id: UUID
    refresh_token: str


class LogoutRequest(BaseModel):
    session_id: UUID


# ============================
#  ROUTES
# ============================

# REGISTER
@router.post("/register", status_code=201, response_model=dict)
async def register(
    payload: UserRegister, 
    db: AsyncSession = Depends(get_db), 
    request: Request = None
):
    
    try:
        # This part remains the same: create the user
        user = await UserService.register_user(db, payload)
    except HTTPException as e:
        # Re-raise validation errors (e.g., 409 Conflict)
        raise e
    except Exception as e:
        # Catch other potential errors
        print(f"Error during user registration: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

    # ✅ FIX: REMOVED the automatic call to UserService.authenticate
    # We no longer automatically log the user in.

    # Return plain JSON message. We send no 'data' or tokens.
    return {
        "message": "Registration successful. Please log in.",
        "data": None
    }


# LOGIN (returns access + refresh)
@router.post("/login", response_model=dict)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
    request: Request = None
):
    email = form_data.username
    password = form_data.password

    device = extract_device_info(request)
    ip = extract_ip(request)

    tokens = await UserService.authenticate(
        db=db,
        email=email,
        password=password,
        device_name=device.get("device_name"),
        device_os=device.get("device_os"),
        user_agent=device.get("user_agent"),
        ip=ip
    )

    # Debug print — remove after verifying frontend works
    print("🔥 LOGIN TOKENS:", tokens)

    # Return plain JSON
    return {
        "message": "Login successful",
        "data": tokens
    }


# REFRESH TOKENS
@router.post("/refresh", response_model=dict)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    result = await AuthService.refresh_tokens(
        db=db,
        session_id=str(payload.session_id),
        refresh_token=payload.refresh_token
    )

    if not result:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    return {
        "message": "Token refreshed",
        "data": result
    }


# LOGOUT CURRENT SESSION
@router.post("/logout", response_model=dict)
async def logout(
    payload: LogoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # FIXED LINE HERE 👇
    session = await SessionService.get_session(db, payload.session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if str(session.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")

    await SessionService.invalidate_session(db, payload.session_id)
    return success("Logged out from this device")



# LOGOUT ALL SESSIONS
@router.post("/logout_all", response_model=dict)
async def logout_all(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await SessionService.invalidate_all(db, current_user.id)
    return {
        "message": "Logged out from all devices",
        "data": None
    }


# LIST ALL SESSIONS OF CURRENT USER
@router.get("/sessions", response_model=dict)
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sessions = await SessionService.list_user_sessions(db, current_user.id)

    return {
        "message": "Active sessions",
        "data": [
            {
                "id": str(s.id),
                "device_name": s.device_name,
                "device_os": s.device_os,
                "user_agent": s.user_agent,
                "ip_address": s.ip_address,
                "is_active": s.is_active,
                "created_at": s.created_at,
                "last_used_at": s.last_used_at,
            }
            for s in sessions
        ]
    }


# GET CURRENT USER PROFILE
@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {
        "message": "User profile",
        "data": {
            "id": str(current_user.id),
            "email": current_user.email,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "created_at": current_user.created_at,
        }
    }
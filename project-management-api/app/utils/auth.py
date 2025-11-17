# app/utils/auth.py

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from passlib.context import CryptContext
from jose import jwt, JWTError

# Config — ensure these env vars exist in your .env
import os
SECRET_KEY = os.getenv("SECRET_KEY", "please_change_me")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))  # e.g., 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ------------------------
# Password helpers (existing)
# ------------------------
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ------------------------
# Refresh token helpers
# ------------------------
def hash_refresh_token(token: str) -> str:
    # use the same bcrypt hash for refresh tokens
    return pwd_context.hash(token)


def verify_refresh_token(plain_token: str, hashed: str) -> bool:
    return pwd_context.verify(plain_token, hashed)


# ------------------------
# JWT helpers
# ------------------------
def create_access_token(data: Dict[str, Any], expires_minutes: Optional[int] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=(expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": int(expire.timestamp()), "iat": int(now.timestamp())})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def create_access_token_for_user(user: Any, expires_minutes: Optional[int] = None) -> str:
    """
    Create JWT for a User model instance. Include minimal claims:
    - sub: user.id
    - email
    - role
    - iat, exp
    """
    payload: Dict[str, Any] = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role if isinstance(user.role, str) else getattr(user.role, "value", str(user.role)),
    }
    return create_access_token(payload, expires_minutes=expires_minutes)
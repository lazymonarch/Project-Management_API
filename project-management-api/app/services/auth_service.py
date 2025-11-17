# app/services/auth_service.py

from uuid import uuid4
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.session_service import SessionService
from app.utils.auth import (
    create_access_token,
    hash_refresh_token,
)
from app.models.session import Session


class AuthService:
    REFRESH_TTL_DAYS = 30

    @staticmethod
    async def rotate_refresh_token(db: AsyncSession, session: Session):
        """
        Rotate refresh token (security best practice):
        - Generate new token
        - Hash + store
        - Extend expiration
        """
        new_refresh = str(uuid4())
        new_hash = hash_refresh_token(new_refresh)

        session.refresh_token_hash = new_hash
        session.refresh_token_expires_at = (
            datetime.now(timezone.utc) + timedelta(days=AuthService.REFRESH_TTL_DAYS)
        )
        session.is_active = True

        await db.commit()
        await db.refresh(session)

        return new_refresh, session

    @staticmethod
    async def refresh_tokens(db: AsyncSession, session_id: str, refresh_token: str):
        """
        FULL REFRESH FLOW:
        1. Validate session & refresh token
        2. Rotate token
        3. Issue new access token
        """
        session = await SessionService.validate_refresh_token(db, session_id, refresh_token)
        if not session:
            return None

        # 1) Rotate refresh
        new_refresh_token, session = await AuthService.rotate_refresh_token(db, session)

        # 2) Issue new access token
        new_access_token = create_access_token({
            "user_id": str(session.user_id),
            "session_id": str(session.id)
        })

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "session_id": str(session.id),
            "token_type": "bearer"
        }

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, or_
from datetime import datetime, timezone, timedelta

from app.models.session import Session
from app.utils.pagination import paginate, build_pagination_metadata
from app.utils.auth import hash_refresh_token, verify_refresh_token


class SessionService:

    # ---------------------------------------------------------
    # CREATE NEW SESSION
    # ---------------------------------------------------------
    @staticmethod
    async def create_session(
        db: AsyncSession,
        user_id,
        refresh_token: str,
        device_name: str = "unknown",
        device_os: str = "unknown",
        user_agent: str = "unknown",
        ip: str = "unknown",
    ):
        now = datetime.now(timezone.utc)

        session = Session(
            user_id=user_id,
            refresh_token_hash=hash_refresh_token(refresh_token),
            device_name=device_name,
            device_os=device_os,
            user_agent=user_agent,
            ip_address=ip,
            is_active=True,
            refresh_token_expires_at=now + timedelta(days=30),
        )

        db.add(session)
        await db.commit()
        await db.refresh(session)
        return session

    # ---------------------------------------------------------
    # 🔥 REQUIRED: GET ONE SESSION (BY ID)
    # ---------------------------------------------------------
    @staticmethod
    async def get_session(db: AsyncSession, session_id):
        result = await db.execute(
            select(Session).where(Session.id == session_id)
        )
        return result.scalar_one_or_none()

    # ---------------------------------------------------------
    # 🔥 REQUIRED: ALIAS FOR COMPATIBILITY (old code used this)
    # ---------------------------------------------------------
    @staticmethod
    async def get_session_by_id(db: AsyncSession, session_id):
        return await SessionService.get_session(db, session_id)

    # ---------------------------------------------------------
    # VALIDATE REFRESH TOKEN
    # ---------------------------------------------------------
    @staticmethod
    async def validate_refresh_token(db: AsyncSession, session_id, refresh_token: str):
        session = await SessionService.get_session(db, session_id)
        if not session:
            return None

        if not session.is_active:
            return None

        # expiration
        if session.refresh_token_expires_at and session.refresh_token_expires_at < datetime.now(timezone.utc):
            return None

        if not verify_refresh_token(refresh_token, session.refresh_token_hash):
            return None

        return session

    # ---------------------------------------------------------
    # INVALIDATE ONE SESSION
    # ---------------------------------------------------------
    @staticmethod
    async def invalidate_session(db: AsyncSession, session_id):
        session = await SessionService.get_session(db, session_id)
        if not session:
            return False

        session.is_active = False
        await db.commit()
        await db.refresh(session)
        return True

    # ---------------------------------------------------------
    # INVALIDATE ALL USER SESSIONS
    # ---------------------------------------------------------
    @staticmethod
    async def invalidate_all(db: AsyncSession, user_id):
        await db.execute(
            update(Session)
            .where(Session.user_id == user_id)
            .values(is_active=False)
        )
        await db.commit()
        return True

    # ---------------------------------------------------------
    # LIST USER SESSIONS
    # ---------------------------------------------------------
    @staticmethod
    async def list_user_sessions(db: AsyncSession, user_id):
        result = await db.execute(
            select(Session)
            .where(Session.user_id == user_id)
            .order_by(Session.created_at.desc())
        )
        return result.scalars().all()

    # ---------------------------------------------------------
    # FILTER + SEARCH + PAGINATE SESSIONS
    # ---------------------------------------------------------
    @staticmethod
    async def list_sessions(
        db: AsyncSession,
        user_id: str | None = None,
        device_name: str | None = None,
        device_os: str | None = None,
        ip: str | None = None,
        search: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        include_inactive: bool = False,
        page: int = 1,
        limit: int = 20,
    ):
        skip, limit = paginate(page, limit)

        conditions = []

        if user_id:
            conditions.append(Session.user_id == user_id)

        if device_name:
            conditions.append(Session.device_name.ilike(f"%{device_name}%"))

        if device_os:
            conditions.append(Session.device_os.ilike(f"%{device_os}%"))

        if ip:
            conditions.append(Session.ip_address.ilike(f"%{ip}%"))

        if search:
            like = f"%{search.lower()}%"
            conditions.append(
                or_(
                    func.lower(Session.device_name).like(like),
                    func.lower(Session.device_os).like(like),
                    func.lower(Session.user_agent).like(like),
                    func.lower(Session.ip_address).like(like),
                )
            )

        if date_from:
            conditions.append(Session.created_at >= date_from)

        if date_to:
            conditions.append(Session.created_at <= date_to)

        if not include_inactive:
            conditions.append(Session.is_active == True)

        # Count
        count_q = select(func.count()).select_from(Session)
        if conditions:
            count_q = count_q.where(*conditions)

        total = await db.scalar(count_q)

        # Query
        query = (
            select(Session)
            .where(*conditions)
            .order_by(Session.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await db.execute(query)
        rows = result.scalars().all()

        pagination = build_pagination_metadata(page, limit, total)

        return rows, pagination

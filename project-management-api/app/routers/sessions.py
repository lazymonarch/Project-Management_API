# app/routers/sessions.py

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.services.session_service import SessionService
from app.routers.auth import get_current_user
from app.utils.response import success
from app.models.user import User
from app.models.enums import UserRole


router = APIRouter(
    prefix="/api/v1/sessions",
    tags=["Sessions"],
    dependencies=[Depends(get_current_user)]   # 🔥 Global auth
)


# ---------------------------------------------------------
# LIST SESSIONS 
# Admin → sees all sessions, can filter by user
# User → sees only their own sessions
# ---------------------------------------------------------
@router.get("/", response_model=dict)
async def list_sessions(
    device_name: str | None = Query(None),
    device_os: str | None = Query(None),
    ip: str | None = Query(None),
    search: str | None = Query(None),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    include_inactive: bool = Query(False),
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Rules:
    - Admins can filter by any user_id
    - Normal users can see ONLY their own sessions
    """

    sessions, pagination = await SessionService.list_sessions(
        db=db,
        user_id=current_user.id,
        device_name=device_name,
        device_os=device_os,
        ip=ip,
        search=search,
        date_from=date_from,
        date_to=date_to,
        include_inactive=include_inactive,
        page=page,
        limit=limit
    )

    return success("Session list", {
        "data": sessions,
        "pagination": pagination
    })

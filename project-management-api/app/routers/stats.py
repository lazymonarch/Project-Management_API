# app/routers/stats.py

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.response import StatsResponse
from app.services.stats_service import StatsService
from app.routers.auth import get_current_user
from app.models.enums import UserRole
from app.models.user import User
from app.utils.permissions import require_roles
from app.utils.response import success


router = APIRouter(
    prefix="/api/v1/stats",
    tags=["Stats"],
    dependencies=[Depends(get_current_user)]    
)


# -------------------------
# DASHBOARD STATS (ADMIN ONLY)
# -------------------------
@router.get("/", response_model=StatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin))  # 🔐 Only admins allowed
):
    stats = await StatsService.get_dashboard_stats(db)
    return success("Dashboard stats", stats)

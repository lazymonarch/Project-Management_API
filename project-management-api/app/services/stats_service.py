# app/services/stats_service.py

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, datetime, timezone

from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.session import Session
from datetime import datetime, timezone, timedelta



class StatsService:

    @staticmethod
    async def get_dashboard_stats(db: AsyncSession):
        # -----------------------------------------------
        # TOTAL COUNTS
        # -----------------------------------------------
        total_users = await db.scalar(select(func.count()).select_from(User))
        total_projects = await db.scalar(select(func.count()).select_from(Project))
        total_tasks = await db.scalar(select(func.count()).select_from(Task))

        # -----------------------------------------------
        # TASK STATUS COUNTS
        # -----------------------------------------------
        status_counts_query = await db.execute(
            select(Task.status, func.count())
            .group_by(Task.status)
        )
        status_counts = {status: count for status, count in status_counts_query.all()}

        # Ensure all keys exist
        for key in ["todo", "in_progress", "review", "done"]:
            status_counts.setdefault(key, 0)

        # -----------------------------------------------
        # OVERDUE TASKS
        # -----------------------------------------------
        now = datetime.now(timezone.utc)
        overdue_tasks = await db.scalar(
            select(func.count()).select_from(Task)
            .where(Task.due_date < now)
            .where(Task.status != "done")
        )

        # -----------------------------------------------
        # ACTIVE SESSIONS
        # -----------------------------------------------
        active_sessions = await db.scalar(
            select(func.count()).select_from(Session)
            .where(Session.is_active == True)
        )

        # -----------------------------------------------
        # NEW USERS (LAST 30 DAYS)
        # -----------------------------------------------
        thirty_days_ago = now - timedelta(days=30)
        new_users = await db.scalar(
            select(func.count()).select_from(User)
            .where(User.created_at >= thirty_days_ago)
        )

        # -----------------------------------------------
        # FINAL RESPONSE
        # -----------------------------------------------
        return {
            "users": {
                "total": total_users,
                "new_last_30_days": new_users
            },
            "projects": {
                "total": total_projects
            },
            "tasks": {
                "total": total_tasks,
                "overdue": overdue_tasks,
                "by_status": status_counts
            },
            "sessions": {
                "active": active_sessions
            }
        }

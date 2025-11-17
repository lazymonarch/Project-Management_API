# app/services/project_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from fastapi import HTTPException
from uuid import UUID
from datetime import datetime, timezone, timedelta

from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.utils.pagination import paginate, build_pagination_metadata
from app.models.task import Task
from app.models.enums import UserRole

class ProjectService:

    # CREATE
    @staticmethod
    async def create_project(db: AsyncSession, data: ProjectCreate, owner_id: UUID):
        project = Project(
            name=data.name,
            description=data.description,
            status=data.status,
            owner_id=owner_id,
            start_date=data.start_date,
            end_date=data.end_date
        )

        db.add(project)
        await db.commit()
        await db.refresh(project)
        return project

    # GET ONE
    @staticmethod
    async def get_project(db: AsyncSession, project_id: UUID):
        result = await db.execute(select(Project).where(Project.id == project_id))
        project = result.scalar_one_or_none()
        if not project:
            raise HTTPException(404, "Project not found")
        return project

    # UPDATE (ADMIN/MANAGER)
    @staticmethod
    async def update_project(db: AsyncSession, project_id: UUID, data: ProjectUpdate):
        result = await db.execute(select(Project).where(Project.id == project_id))
        project = result.scalar_one_or_none()
        if not project:
            raise HTTPException(404, "Project not found")

        for field, value in data.dict(exclude_unset=True).items():
            setattr(project, field, value)

        project.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(project)
        return project

    # DELETE
    @staticmethod
    async def delete_project(db: AsyncSession, project_id: UUID):
        result = await db.execute(select(Project).where(Project.id == project_id))
        project = result.scalar_one_or_none()

        if not project:
            raise HTTPException(404, "Project not found")

        await db.delete(project)
        await db.commit()
        return True

    @staticmethod
    async def get_projects(db: AsyncSession, page: int, limit: int):
        skip, limit = paginate(page, limit)

        # Count total projects
        total = await db.scalar(select(func.count()).select_from(Project))

        # Fetch paginated projects
        result = await db.execute(
            select(Project)
            .offset(skip)
            .limit(limit)
            .order_by(Project.created_at.desc())
        )

        projects = result.scalars().all()

        pagination = build_pagination_metadata(page, limit, total)

        return projects, pagination
    
    #LIST WITH FILTERS
    @staticmethod
    async def list_projects(
        db: AsyncSession,
        status: str | None = None,
        search: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        page: int = 1,
        limit: int = 20,
        current_user=None,
    ):
        skip, limit = paginate(page, limit)

        # ------------------------------------------------------------
        # 1. Build dynamic WHERE conditions
        # ------------------------------------------------------------
        conditions = []

        # RBAC
        if current_user:
            role = current_user.role
            if isinstance(role, UserRole):
                role = role.value

            if role == UserRole.manager.value:
                conditions.append(Project.owner_id == current_user.id)
            elif role == UserRole.developer.value:
                subquery = (
                    select(Task.project_id)
                    .where(Task.assigned_to == current_user.id)
                ).scalar_subquery()
                conditions.append(Project.id.in_(subquery))

        # Status filter
        if status:
            conditions.append(Project.status == status)

        # Search (title or description)
        if search:
            like = f"%{search.lower()}%"
            conditions.append(
                or_(
                    func.lower(Project.name).like(like),
                    func.lower(Project.description).like(like)
                )
            )

        # Date range filter
        if date_from:
            conditions.append(Project.created_at >= date_from)

        if date_to:
            conditions.append(Project.created_at <= date_to)

        # ------------------------------------------------------------
        # 2. Count total (with filters)
        # ------------------------------------------------------------
        count_query = select(func.count()).select_from(Project)
        if conditions:
            count_query = count_query.where(*conditions)

        total = await db.scalar(count_query)

        # ------------------------------------------------------------
        # 3. Fetch paginated projects
        # ------------------------------------------------------------
        query = (
            select(Project)
            .where(*conditions)
            .order_by(Project.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await db.execute(query)
        projects = result.scalars().all()

        # ------------------------------------------------------------
        # 4. Build pagination block
        # ------------------------------------------------------------
        pagination = build_pagination_metadata(page, limit, total)

        return projects, pagination

    @staticmethod
    async def ensure_project_access(db: AsyncSession, project: Project, current_user):
        if not current_user:
            return

        role = current_user.role
        if isinstance(role, UserRole):
            role = role.value

        if role == UserRole.admin.value:
            return

        if role == UserRole.manager.value:
            if project.owner_id != current_user.id:
                raise HTTPException(status_code=403, detail="Managers can access only their own projects")
            return

        if role == UserRole.developer.value:
            has_assignment = await db.scalar(
                select(func.count())
                .select_from(Task)
                .where(Task.project_id == project.id)
                .where(Task.assigned_to == current_user.id)
            )
            if not has_assignment:
                raise HTTPException(status_code=403, detail="Developers can access only assigned projects")
            return

        raise HTTPException(status_code=403, detail="Access denied")

    @staticmethod
    async def get_project_summary(db, project_id: str):
        # -----------------------------------------
        # 1. Validate project exists
        # -----------------------------------------
        project = await db.scalar(
            select(Project).where(Project.id == project_id)
        )
        if not project:
            return None

        # -----------------------------------------
        # 2. Total tasks
        # -----------------------------------------
        total_tasks = await db.scalar(
            select(func.count()).select_from(Task)
            .where(Task.project_id == project_id)
        )

        # -----------------------------------------
        # 3. Tasks by status
        # -----------------------------------------
        status_query = await db.execute(
            select(Task.status, func.count())
            .where(Task.project_id == project_id)
            .group_by(Task.status)
        )
        status_counts = {status: count for status, count in status_query.all()}

        # Ensure all statuses exist
        for key in ["todo", "in_progress", "review", "done"]:
            status_counts.setdefault(key, 0)

        # -----------------------------------------
        # 4. Completed percentage
        # -----------------------------------------
        completed = status_counts["done"]
        completion_rate = (
            round((completed / total_tasks) * 100, 2) if total_tasks > 0 else 0
        )

        # -----------------------------------------
        # 5. Overdue tasks
        # -----------------------------------------
        now = datetime.now(timezone.utc)
        overdue_tasks = await db.scalar(
            select(func.count()).select_from(Task)
            .where(Task.project_id == project_id)
            .where(Task.due_date < now)
            .where(Task.status != "done")
        )

        # -----------------------------------------
        # 6. Tasks due in next 7 days
        # -----------------------------------------
        upcoming_tasks = await db.scalar(
            select(func.count()).select_from(Task)
            .where(Task.project_id == project_id)
            .where(Task.due_date >= now)
            .where(Task.due_date <= now + timedelta(days=7))
            .where(Task.status != "done")
        )

        # -----------------------------------------
        # 7. Estimated hours (total + completed)
        # -----------------------------------------
        total_estimated = await db.scalar(
            select(func.coalesce(func.sum(Task.estimated_hours), 0))
            .where(Task.project_id == project_id)
        )

        completed_estimated = await db.scalar(
            select(func.coalesce(func.sum(Task.estimated_hours), 0))
            .where(Task.project_id == project_id)
            .where(Task.status == "done")
        )

        # -----------------------------------------
        # 8. Prepare final response
        # -----------------------------------------
        return {
            "project_id": str(project.id),
            "name": project.name,
            "description": project.description,
            "status": project.status,
            "start_date": project.start_date,
            "end_date": project.end_date,
            "task_overview": {
                "total": total_tasks,
                "by_status": status_counts,
                "completed_percentage": completion_rate,
                "overdue": overdue_tasks,
                "due_next_7_days": upcoming_tasks,
            },
            "estimates": {
                "total_estimated_hours": total_estimated,
                "completed_estimated_hours": completed_estimated
            }
        }
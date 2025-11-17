# app/services/task_service.py

from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import UserRole
from app.models.project import Project
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate
from app.utils.pagination import paginate, build_pagination_metadata



class TaskService:

    @staticmethod
    def _role_value(user) -> str:
        role = getattr(user, "role", None)
        if isinstance(role, UserRole):
            return role.value
        return str(role)

    @staticmethod
    async def _get_project(db: AsyncSession, project_id: UUID):
        result = await db.execute(select(Project).where(Project.id == project_id))
        project = result.scalar_one_or_none()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project

    @staticmethod
    async def _ensure_project_visibility(db: AsyncSession, project_id: UUID, user):
        role = TaskService._role_value(user)

        if role == UserRole.admin.value:
            return

        project = await TaskService._get_project(db, project_id)

        if role == UserRole.manager.value:
            if project.owner_id != user.id:
                raise HTTPException(status_code=403, detail="Managers can access only their projects")
            return

        if role == UserRole.developer.value:
            assigned = await db.scalar(
                select(func.count())
                .select_from(Task)
                .where(Task.project_id == project_id)
                .where(Task.assigned_to == user.id)
            )
            if not assigned:
                raise HTTPException(status_code=403, detail="Developers can view only assigned projects")
            return

        raise HTTPException(status_code=403, detail="Access denied")

    @staticmethod
    async def _ensure_project_management(db: AsyncSession, project_id: UUID, user):
        role = TaskService._role_value(user)

        if role == UserRole.admin.value:
            return

        project = await TaskService._get_project(db, project_id)

        if role == UserRole.manager.value and project.owner_id == user.id:
            return

        raise HTTPException(status_code=403, detail="Only project owners can manage tasks")

    @staticmethod
    async def _ensure_task_access(db: AsyncSession, task: Task, user):
        role = TaskService._role_value(user)

        if role == UserRole.admin.value:
            return

        if role == UserRole.manager.value:
            project = await TaskService._get_project(db, task.project_id)
            if project.owner_id != user.id:
                raise HTTPException(status_code=403, detail="Managers can access only their tasks")
            return

        if role == UserRole.developer.value:
            if task.assigned_to != user.id:
                raise HTTPException(status_code=403, detail="Developers can access only their tasks")
            return

        raise HTTPException(status_code=403, detail="Access denied")

    # CREATE TASK
    @staticmethod
    async def create_task(db: AsyncSession, data: TaskCreate, user):
        await TaskService._ensure_project_management(db, data.project_id, user)

        new_task = Task(
            title=data.title,
            description=data.description,
            status=data.status,
            priority=data.priority,
            project_id=data.project_id,
            assigned_to=data.assigned_to,
            created_by=user.id,
            due_date=data.due_date,
            estimated_hours=data.estimated_hours,
        )

        db.add(new_task)
        await db.commit()
        await db.refresh(new_task)
        return new_task

    # GET TASK
    @staticmethod
    async def get_task(db: AsyncSession, task_id: UUID, current_user=None):
        result = await db.execute(select(Task).where(Task.id == task_id))
        task = result.scalar_one_or_none()
        if not task:
            raise HTTPException(404, "Task not found")

        if current_user:
            await TaskService._ensure_task_access(db, task, current_user)

        return task

    # LIST
    @staticmethod
    async def list_tasks(
        db: AsyncSession,
        project_id: UUID | None = None,
        assigned_to: UUID | None = None,
        status: str | None = None,
        priority: str | None = None,
        search: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        page: int = 1,
        limit: int = 20,
        current_user=None,
    ):
        skip, limit = paginate(page, limit)

        # ------------------------------------------------------------
        # 1. Dynamic Filters
        # ------------------------------------------------------------
        conditions = []

        if project_id:
            conditions.append(Task.project_id == project_id)

        if assigned_to:
            conditions.append(Task.assigned_to == assigned_to)

        if status:
            conditions.append(Task.status == status)

        if priority:
            conditions.append(Task.priority == priority)

        # Search across task title & description
        if search:
            like = f"%{search.lower()}%"
            conditions.append(
                or_(
                    func.lower(Task.title).like(like),
                    func.lower(Task.description).like(like)
                )
            )

        # Date range filter (due_date)
        if date_from:
            conditions.append(Task.created_at >= date_from)

        if date_to:
            conditions.append(Task.created_at <= date_to)

        if current_user:
            role = TaskService._role_value(current_user)
            if role == UserRole.manager.value:
                project_subquery = (
                    select(Project.id)
                    .where(Project.owner_id == current_user.id)
                ).scalar_subquery()
                conditions.append(Task.project_id.in_(project_subquery))
            elif role == UserRole.developer.value:
                conditions.append(Task.assigned_to == current_user.id)

        # ------------------------------------------------------------
        # 2. Count total tasks with filters
        # ------------------------------------------------------------
        count_query = select(func.count()).select_from(Task)

        if conditions:
            count_query = count_query.where(*conditions)

        total = await db.scalar(count_query)

        # ------------------------------------------------------------
        # 3. Fetch paginated tasks
        # ------------------------------------------------------------
        query = (
            select(Task)
            .where(*conditions)
            .order_by(Task.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await db.execute(query)
        tasks = result.scalars().all()

        # ------------------------------------------------------------
        # 4. Pagination metadata
        # ------------------------------------------------------------
        pagination = build_pagination_metadata(page, limit, total)

        return tasks, pagination

    # UPDATE TASK
    @staticmethod
    async def update_task(db: AsyncSession, task_id: UUID, data, user):

        task = await TaskService.get_task(db, task_id)

        role = TaskService._role_value(user)
        if role == UserRole.developer.value:
            raise HTTPException(status_code=403, detail="Developers cannot update tasks")

        await TaskService._ensure_task_access(db, task, user)

        for field, value in data.dict(exclude_unset=True).items():
            setattr(task, field, value)

        task.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(task)
        return task

    # UPDATE STATUS
    @staticmethod
    async def update_status(db: AsyncSession, task_id: UUID, new_status, user):

        task = await TaskService.get_task(db, task_id)
        await TaskService._ensure_task_access(db, task, user)

        task.status = new_status
        task.updated_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(task)
        return task

    # DELETE TASK
    @staticmethod
    async def delete_task(db: AsyncSession, task_id: UUID, user):

        task = await TaskService.get_task(db, task_id)

        role = TaskService._role_value(user)
        if role == UserRole.developer.value:
            raise HTTPException(status_code=403, detail="Developers cannot delete tasks")

        await TaskService._ensure_task_access(db, task, user)
        await db.delete(task)
        await db.commit()
        return True

    @staticmethod
    async def list_project_tasks(db: AsyncSession, project_id: UUID, current_user):
        await TaskService._ensure_project_visibility(db, project_id, current_user)

        query = select(Task).where(Task.project_id == project_id)

        if TaskService._role_value(current_user) == UserRole.developer.value:
            query = query.where(Task.assigned_to == current_user.id)

        result = await db.execute(query)
        return result.scalars().all()

    # TASK BOARD
    @staticmethod
    async def get_task_board(
        db: AsyncSession,
        project_id: UUID,
        current_user,
        assigned_to: UUID | None = None
    ):
        await TaskService._ensure_project_visibility(db, project_id, current_user)

        # Base query
        query = select(Task).where(Task.project_id == project_id)

        # Optional filter: only tasks assigned to a specific user
        if assigned_to:
            query = query.where(Task.assigned_to == assigned_to)

        if TaskService._role_value(current_user) == UserRole.developer.value:
            query = query.where(Task.assigned_to == current_user.id)

        result = await db.execute(query)
        tasks = result.scalars().all()

        # Prepare board structure
        board = {
            "todo": [],
            "in_progress": [],
            "review": [],
            "done": [],
        }

        # Distribute tasks into columns
        for task in tasks:
            board[task.status].append(task)

        return board


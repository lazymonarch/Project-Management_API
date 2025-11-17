# app/routers/tasks.py

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.schemas.response import TaskBoardResponse, TaskListResponse
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskStatusUpdate,
    TaskPublic
)
from app.services.task_service import TaskService
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.enums import UserRole
from app.utils.permissions import require_roles
from app.utils.response import success


router = APIRouter(
    prefix="/api/v1/tasks",
    tags=["Tasks"],
    dependencies=[Depends(get_current_user)]   # 🔥 All routes protected globally
)


# -------------------------
# CREATE TASK
# -------------------------
@router.post("/", response_model=TaskPublic)
async def create_task(
    data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.manager))
):
    task = await TaskService.create_task(db, data, current_user)
    return success("Task created successfully", task)


# -------------------------
# GET TASK BY ID
# -------------------------
@router.get("/{task_id}", response_model=TaskPublic)
async def get_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = await TaskService.get_task(db, task_id, current_user)
    return success("Task details", task)


# -------------------------
# LIST TASKS (FILTER + SEARCH + PAGINATION)
# -------------------------
@router.get("/", response_model=TaskListResponse)
async def list_tasks(
    status: str | None = Query(None),
    priority: str | None = Query(None),
    project_id: UUID | None = Query(None),
    assigned_to: UUID | None = Query(None),
    search: str | None = Query(None),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks, pagination = await TaskService.list_tasks(
        db=db,
        project_id=project_id,
        assigned_to=assigned_to,
        status=status,
        priority=priority,
        search=search,
        date_from=date_from,
        date_to=date_to,
        page=page,
        limit=limit,
        current_user=current_user
    )

    return success("Task list", {
        "data": tasks,
        "pagination": pagination
    })


# -------------------------
# LIST TASKS FOR A PROJECT (NO PAGINATION)
# -------------------------
@router.get("/project/{project_id}", response_model=TaskListResponse)
async def list_project_tasks(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks = await TaskService.list_project_tasks(db, project_id, current_user)
    serialized = [TaskPublic.model_validate(t) for t in tasks]
    return success("Task list", serialized)


# -------------------------
# UPDATE TASK
# -------------------------
@router.patch("/{task_id}", response_model=TaskPublic)
async def update_task(
    task_id: UUID,
    data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.manager))
):
    task = await TaskService.update_task(db, task_id, data, current_user)
    return success("Task updated successfully", task)


# -------------------------
# UPDATE STATUS ONLY
# -------------------------
@router.patch("/{task_id}/status", response_model=TaskPublic)
async def update_task_status(
    task_id: UUID,
    data: TaskStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = await TaskService.update_status(db, task_id, data.status, current_user)
    return success("Task status updated", task)


# -------------------------
# DELETE TASK
# -------------------------
@router.delete("/{task_id}", response_model=TaskPublic)
async def delete_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.manager))
):
    await TaskService.delete_task(db, task_id, current_user)
    return success("Task deleted successfully")


# -------------------------
# TASK BOARD (KANBAN)
# -------------------------
@router.get("/board", response_model=TaskBoardResponse)
async def task_board(
    project_id: UUID,
    assigned_to: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    board = await TaskService.get_task_board(
        db=db,
        project_id=project_id,
        current_user=current_user,
        assigned_to=assigned_to
    )

    return success("Task board", board)

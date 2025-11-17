# app/schemas/response.py

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List, Optional, Dict, Any

from app.models.enums import (
    UserRole,
    ProjectStatus,
    TaskStatus,
    TaskPriority
)

# ============================================================
# GENERIC SUCCESS RESPONSE (optional)
# ============================================================

class SuccessResponse(BaseModel):
    message: str
    data: Optional[Any] = None


# ============================================================
# USER RESPONSE MODELS
# ============================================================

class UserResponse(BaseModel):
    id: UUID
    email: str
    username: str
    full_name: str
    role: UserRole
    created_at: datetime


class UserListItem(BaseModel):
    id: UUID
    email: str
    username: str
    full_name: str
    role: UserRole


class Pagination(BaseModel):
    page: int
    limit: int
    total: int
    pages: int


class UserListResponse(BaseModel):
    message: str
    data: List[UserListItem]
    pagination: Pagination


# ============================================================
# PROJECT RESPONSE MODELS
# ============================================================

class ProjectPublic(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    status: ProjectStatus
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    owner_id: UUID


class ProjectListItem(BaseModel):
    id: UUID
    name: str
    status: ProjectStatus


class ProjectListResponse(BaseModel):
    message: str
    data: List[ProjectListItem]
    pagination: Pagination


# -------- Project Summary (MATCHES SERVICE OUTPUT PERFECTLY) -------- #

class TaskOverview(BaseModel):
    total: int
    by_status: Dict[str, int]
    completed_percentage: float
    overdue: int
    due_next_7_days: int


class Estimates(BaseModel):
    total_estimated_hours: int
    completed_estimated_hours: int


class ProjectSummary(BaseModel):
    project_id: UUID
    name: str
    description: Optional[str]
    status: ProjectStatus
    start_date: Optional[datetime]
    end_date: Optional[datetime]

    task_overview: TaskOverview
    estimates: Estimates


class ProjectSummaryResponse(BaseModel):
    message: str
    data: ProjectSummary


# ============================================================
# TASK RESPONSE MODELS
# ============================================================

class TaskResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    project_id: UUID
    assigned_to: Optional[UUID]
    created_by: UUID
    due_date: Optional[datetime]
    estimated_hours: Optional[int]
    created_at: datetime
    updated_at: datetime


class TaskListItem(BaseModel):
    id: UUID
    title: str
    status: TaskStatus
    priority: TaskPriority
    project_id: UUID


class TaskListResponse(BaseModel):
    message: str
    data: List[TaskListItem]
    pagination: Pagination


class TaskBoardColumn(BaseModel):
    status: TaskStatus
    tasks: List[TaskListItem]


class TaskBoardResponse(BaseModel):
    message: str
    data: List[TaskBoardColumn]


# ============================================================
# SESSION RESPONSE MODELS
# ============================================================

class SessionResponse(BaseModel):
    id: UUID
    device_name: str
    device_os: str
    user_agent: str
    ip_address: str
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime]


class SessionListResponse(BaseModel):
    message: str
    data: List[SessionResponse]
    pagination: Pagination


# ============================================================
# STATS RESPONSE MODELS
# ============================================================

class StatsResponse(BaseModel):
    total_users: int
    total_projects: int
    total_tasks: int
    tasks_todo: int
    tasks_in_progress: int
    tasks_review: int
    tasks_done: int


class StatsSuccessResponse(BaseModel):
    message: str
    data: StatsResponse

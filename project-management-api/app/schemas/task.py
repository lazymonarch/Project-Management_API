# app/schemas/task.py
from uuid import UUID
from pydantic import BaseModel, ConfigDict 
from datetime import datetime
from app.models.enums import TaskPriority, TaskStatus
from typing import Optional


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    status: TaskStatus
    priority: TaskPriority
    project_id: UUID
    assigned_to: UUID | None = None
    due_date: datetime | None = None
    estimated_hours: int | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: TaskPriority | None = None
    assigned_to: UUID | None = None
    due_date: datetime | None = None
    estimated_hours: int | None = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskPublic(BaseModel):
    id: UUID
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    project_id: UUID
    assigned_to: UUID | None
    created_by: UUID
    due_date: datetime | None
    estimated_hours: int | None
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
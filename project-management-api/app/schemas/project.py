# app/schemas/project.py

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.enums import ProjectStatus


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: ProjectStatus


class ProjectCreate(ProjectBase):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class ProjectResponse(ProjectBase):
    id: UUID
    owner_id: UUID
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v)
        }

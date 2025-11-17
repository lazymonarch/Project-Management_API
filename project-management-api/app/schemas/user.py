# app/schemas/user.py

from uuid import UUID
from pydantic import BaseModel, EmailStr
from app.models.enums import UserRole
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    password: str
    role: UserRole


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: UserRole | None = None


class UserPublic(BaseModel):
    id: UUID
    email: EmailStr
    username: str
    full_name: str
    role: UserRole
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        json_encoders = {UUID: lambda v: str(v)}
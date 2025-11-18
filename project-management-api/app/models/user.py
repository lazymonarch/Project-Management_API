# app/models/user.py

import uuid
from sqlalchemy import Column, String, Enum, TIMESTAMP, func, Boolean 
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False
    )

    email = Column(String(255), unique=True, nullable=False)
    username = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)

    role = Column(Enum(UserRole, name="user_role", create_type=False), nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # Relationships
    projects = relationship("Project", back_populates="owner")
    created_tasks = relationship("Task", back_populates="creator", foreign_keys="Task.created_by")
    assigned_tasks = relationship("Task", back_populates="assignee", foreign_keys="Task.assigned_to")
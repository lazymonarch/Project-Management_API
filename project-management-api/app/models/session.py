# app/models/session.py
import uuid
from sqlalchemy import (
    Column, String, Boolean, TIMESTAMP, ForeignKey, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Session(Base):
    __tablename__ = "sessions"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    refresh_token_hash = Column(String(255), nullable=False)

    device_name = Column(String(255), nullable=True)
    device_os = Column(String(255), nullable=True)
    user_agent = Column(String(1024), nullable=True)
    ip_address = Column(String(255), nullable=True)

    is_active = Column(Boolean, default=True)

    created_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now()
    )

    last_used_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # New column: when the refresh token expires (UTC aware stored)
    refresh_token_expires_at = Column(TIMESTAMP(timezone=True), nullable=True)

    user = relationship("User")

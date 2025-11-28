import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.models.base import Base


class UserRole(str, enum.Enum):
    superadmin = "superadmin"
    manager = "manager"
    client = "client"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20))
    role = Column(Enum(UserRole, name="user_role"), nullable=False, default=UserRole.client, index=True)
    is_active = Column(Boolean, nullable=False, default=False, index=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def is_manager_like(self) -> bool:
        return self.role in {UserRole.manager, UserRole.superadmin}

import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models.base import Base


class SystemConfig(Base):
    __tablename__ = "system_config"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String(100), nullable=False, unique=True)
    value = Column(String, nullable=False)
    value_type = Column(String(20), nullable=False, default="string")
    description = Column(String(500))
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))

import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.dialects.postgresql import JSONB, INET
from sqlalchemy.sql import func

from app.models.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(UUID(as_uuid=True))
    old_values = Column(JSONB)
    new_values = Column(JSONB)
    ip_address = Column(INET)
    user_agent = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

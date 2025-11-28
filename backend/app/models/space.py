import enum
import uuid
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models.base import Base


class SpaceStatus(str, enum.Enum):
    available = "available"
    reserved = "reserved"
    blocked = "blocked"
    on_hold = "on_hold"
    internal = "internal"


class Space(Base):
    __tablename__ = "spaces"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    space_number = Column(Integer, nullable=False)
    status = Column(Enum(SpaceStatus, name="space_status"), nullable=False, default=SpaceStatus.available, index=True)
    price = Column(Numeric(10, 2))
    hold_expires_at = Column(DateTime(timezone=True))
    held_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

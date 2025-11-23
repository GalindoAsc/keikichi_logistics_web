import uuid
from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class SpaceStatus(str, enum.Enum):
    AVAILABLE = "Available"
    RESERVED = "Reserved"
    BLOCKED = "Blocked"


class Space(Base):
    __tablename__ = "spaces"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=False, index=True)
    space_number = Column(Integer, nullable=False)
    status = Column(Enum(SpaceStatus), default=SpaceStatus.AVAILABLE, nullable=False)
    cargo_type = Column(String, nullable=True)
    weight = Column(Numeric(10, 2), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    trip = relationship("Trip", back_populates="spaces")
    reservation_spaces = relationship("ReservationSpace", back_populates="space")

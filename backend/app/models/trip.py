import uuid
from sqlalchemy import Column, String, Date, Time, Integer, Text, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class TripStatus(str, enum.Enum):
    SCHEDULED = "Scheduled"
    IN_TRANSIT = "InTransit"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class Trip(Base):
    __tablename__ = "trips"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    departure_date = Column(Date, nullable=False, index=True)
    departure_time = Column(Time, nullable=True)
    status = Column(Enum(TripStatus), default=TripStatus.SCHEDULED, nullable=False)
    total_spaces = Column(Integer, nullable=False)
    notes_admin = Column(Text, nullable=True)
    notes_client = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    creator = relationship("User", back_populates="trips")
    spaces = relationship("Space", back_populates="trip", cascade="all, delete-orphan")
    reservations = relationship("Reservation", back_populates="trip", cascade="all, delete-orphan")

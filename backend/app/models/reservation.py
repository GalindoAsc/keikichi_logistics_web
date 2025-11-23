import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class ReservationStatus(str, enum.Enum):
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    CANCELLED = "Cancelled"


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=False, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    status = Column(Enum(ReservationStatus), default=ReservationStatus.PENDING, nullable=False)
    payment_receipt_url = Column(String, nullable=True)
    bank_details_shown = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    trip = relationship("Trip", back_populates="reservations")
    client = relationship("User", back_populates="reservations")
    reservation_spaces = relationship("ReservationSpace", back_populates="reservation", cascade="all, delete-orphan")


class ReservationSpace(Base):
    __tablename__ = "reservation_spaces"

    reservation_id = Column(UUID(as_uuid=True), ForeignKey("reservations.id"), primary_key=True)
    space_id = Column(UUID(as_uuid=True), ForeignKey("spaces.id"), primary_key=True)

    reservation = relationship("Reservation", back_populates="reservation_spaces")
    space = relationship("Space", back_populates="reservation_spaces")

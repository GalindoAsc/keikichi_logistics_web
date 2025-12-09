"""
Waitlist Model - Allow clients to join a waitlist when trip is full
"""
import uuid
from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models.base import Base


class Waitlist(Base):
    """
    Stores users waiting for spaces on full trips.
    Users are notified when spaces become available.
    """
    __tablename__ = "waitlists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    spaces_requested = Column(Integer, default=1)  # How many spaces they want
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    notified_at = Column(DateTime(timezone=True), nullable=True)  # When they were last notified
    
    # Each user can only be on waitlist once per trip
    __table_args__ = (
        UniqueConstraint('trip_id', 'user_id', name='uq_waitlist_trip_user'),
    )

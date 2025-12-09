import enum
import uuid
from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, Time, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models.base import Base


class TripStatus(str, enum.Enum):
    scheduled = "scheduled"
    in_transit = "in_transit"
    completed = "completed"
    cancelled = "cancelled"


class PickupCostType(str, enum.Enum):
    flat_rate = "flat_rate"
    per_pallet = "per_pallet"


class Trip(Base):
    __tablename__ = "trips"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    origin = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    departure_date = Column(Date, nullable=False)
    departure_time = Column(Time)
    status = Column(Enum(TripStatus, name="trip_status"), nullable=False, default=TripStatus.scheduled, index=True)
    is_international = Column(Boolean, nullable=False, default=False)
    total_spaces = Column(Integer, nullable=False)
    price_per_space = Column(Numeric(10, 2), nullable=False)
    pickup_cost = Column(Numeric(10, 2), nullable=True, default=0)
    pickup_cost_type = Column(Enum(PickupCostType, name="pickup_cost_type"), nullable=False, default=PickupCostType.flat_rate)
    bond_cost = Column(Numeric(10, 2), nullable=False, default=500.00)
    currency = Column(String(3), nullable=False, default="USD")
    exchange_rate = Column(Numeric(10, 4), nullable=False, default=1.0)
    individual_pricing = Column(Boolean, nullable=False, default=False)
    tax_included = Column(Boolean, nullable=False, default=True)
    tax_rate = Column(Numeric(5, 4), nullable=False, default=0.16)
    payment_deadline_hours = Column(Integer, nullable=False, default=24)
    max_spaces_per_client = Column(Integer, nullable=True)  # NULL means no limit
    notes_internal = Column(Text)
    notes_public = Column(Text)
    truck_identifier = Column(String(50))
    trailer_identifier = Column(String(50))
    truck_plate = Column(String(20))
    trailer_plate = Column(String(20))
    driver_name = Column(String(255))
    driver_phone = Column(String(20))
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

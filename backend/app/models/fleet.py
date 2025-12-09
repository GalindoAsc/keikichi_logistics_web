from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.models.base import Base

class VehicleType(str, enum.Enum):
    truck = "truck"
    trailer = "trailer"

class FleetDriver(Base):
    __tablename__ = "fleet_drivers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    license_number = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class FleetVehicle(Base):
    __tablename__ = "fleet_vehicles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    type = Column(Enum(VehicleType), nullable=False)
    plate = Column(String, nullable=False, unique=True)
    brand = Column(String, nullable=True)
    model = Column(String, nullable=True)
    year = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

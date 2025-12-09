from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.fleet import VehicleType


class FleetDriverBase(BaseModel):
    full_name: str
    phone: Optional[str] = None
    license_number: Optional[str] = None
    is_active: bool = True


class FleetDriverCreate(FleetDriverBase):
    pass


class FleetDriverUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    is_active: Optional[bool] = None


class FleetDriverOut(FleetDriverBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FleetVehicleBase(BaseModel):
    type: VehicleType
    plate: str
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[str] = None
    is_active: bool = True


class FleetVehicleCreate(FleetVehicleBase):
    pass


class FleetVehicleUpdate(BaseModel):
    type: Optional[VehicleType] = None
    plate: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[str] = None
    is_active: Optional[bool] = None


class FleetVehicleOut(FleetVehicleBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

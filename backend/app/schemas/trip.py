from datetime import date, time, datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel

from app.models.trip import TripStatus, PickupCostType


class TripBase(BaseModel):
    origin: str
    destination: str
    departure_date: date
    departure_time: Optional[time] = None
    status: TripStatus = TripStatus.scheduled
    is_international: bool = False
    total_spaces: int
    price_per_space: float
    pickup_cost: Optional[float] = 0.0
    pickup_cost_type: PickupCostType = PickupCostType.flat_rate
    bond_cost: float = 500.00
    currency: str = "USD"
    exchange_rate: float = 1.0
    individual_pricing: bool = False
    tax_included: bool = True
    tax_rate: float = 0.16
    payment_deadline_hours: int = 24
    notes_public: Optional[str] = None
    notes_internal: Optional[str] = None
    truck_identifier: Optional[str] = None
    trailer_identifier: Optional[str] = None
    truck_plate: Optional[str] = None
    trailer_plate: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    departure_date: Optional[date] = None
    departure_time: Optional[time] = None
    status: Optional[TripStatus] = None
    is_international: Optional[bool] = None
    total_spaces: Optional[int] = None
    price_per_space: Optional[float] = None
    pickup_cost: Optional[float] = None
    pickup_cost_type: Optional[PickupCostType] = None
    bond_cost: Optional[float] = None
    currency: Optional[str] = None
    exchange_rate: Optional[float] = None
    individual_pricing: Optional[bool] = None
    tax_included: Optional[bool] = None
    tax_rate: Optional[float] = None
    payment_deadline_hours: Optional[int] = None
    notes_public: Optional[str] = None
    notes_internal: Optional[str] = None
    truck_identifier: Optional[str] = None
    trailer_identifier: Optional[str] = None
    truck_plate: Optional[str] = None
    trailer_plate: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None


class TripOut(TripBase):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    available_spaces: Optional[int] = None
    reserved_spaces: Optional[int] = None
    blocked_spaces: Optional[int] = None
    on_hold_spaces: Optional[int] = None

    model_config = {"from_attributes": True}

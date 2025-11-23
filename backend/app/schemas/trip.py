from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime, date, time
from app.models.trip import TripStatus
from app.schemas.space import SpaceResponse


class TripBase(BaseModel):
    origin: str
    destination: str
    departure_date: date
    departure_time: Optional[time] = None
    total_spaces: int
    notes_admin: Optional[str] = None
    notes_client: Optional[str] = None


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    departure_date: Optional[date] = None
    departure_time: Optional[time] = None
    status: Optional[TripStatus] = None
    notes_admin: Optional[str] = None
    notes_client: Optional[str] = None


class TripResponse(TripBase):
    id: UUID4
    status: TripStatus
    created_by: UUID4
    created_at: datetime
    updated_at: datetime
    spaces: List[SpaceResponse] = []

    class Config:
        from_attributes = True


class TripListResponse(BaseModel):
    id: UUID4
    origin: str
    destination: str
    departure_date: date
    departure_time: Optional[time]
    status: TripStatus
    total_spaces: int
    available_spaces: int
    created_at: datetime

    class Config:
        from_attributes = True

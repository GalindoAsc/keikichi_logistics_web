from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.models.space import SpaceStatus


class SpaceBase(BaseModel):
    space_number: int
    cargo_type: Optional[str] = None
    weight: Optional[Decimal] = None
    notes: Optional[str] = None


class SpaceCreate(SpaceBase):
    trip_id: UUID4


class SpaceUpdate(BaseModel):
    status: Optional[SpaceStatus] = None
    cargo_type: Optional[str] = None
    weight: Optional[Decimal] = None
    notes: Optional[str] = None


class SpaceResponse(SpaceBase):
    id: UUID4
    trip_id: UUID4
    status: SpaceStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

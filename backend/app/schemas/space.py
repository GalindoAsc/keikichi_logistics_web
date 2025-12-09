from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel

from app.models.space import SpaceStatus


class SpaceBase(BaseModel):
    id: UUID
    space_number: int
    status: SpaceStatus
    price: Optional[float] = None
    hold_expires_at: Optional[datetime] = None
    held_by: Optional[UUID] = None
    is_mine: Optional[bool] = None
    has_pending_reservation: Optional[bool] = None

    model_config = {"from_attributes": True}


class SpaceSummary(BaseModel):
    available: int = 0
    reserved: int = 0
    blocked: int = 0
    on_hold: int = 0
    internal: int = 0


class TripSpacesResponse(BaseModel):
    trip_id: str
    total_spaces: int
    spaces: List[SpaceBase]
    summary: SpaceSummary

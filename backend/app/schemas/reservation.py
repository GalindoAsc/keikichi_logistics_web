from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime
from app.models.reservation import ReservationStatus
from app.schemas.space import SpaceResponse


class ReservationBase(BaseModel):
    trip_id: UUID4
    space_ids: List[UUID4]


class ReservationCreate(ReservationBase):
    pass


class ReservationUpdate(BaseModel):
    status: Optional[ReservationStatus] = None
    payment_receipt_url: Optional[str] = None


class ReservationResponse(BaseModel):
    id: UUID4
    trip_id: UUID4
    client_id: UUID4
    status: ReservationStatus
    payment_receipt_url: Optional[str]
    bank_details_shown: bool
    created_at: datetime
    updated_at: datetime
    spaces: List[SpaceResponse] = []

    class Config:
        from_attributes = True


class BankDetailsResponse(BaseModel):
    bank_name: str
    account_number: str
    account_holder: str
    routing_number: str

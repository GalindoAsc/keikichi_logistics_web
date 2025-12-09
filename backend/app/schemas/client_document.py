from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.models.client_document import DocumentType


class ClientDocumentBase(BaseModel):
    doc_type: DocumentType
    display_name: Optional[str] = None
    description: Optional[str] = None
    expires_at: Optional[date] = None


class ClientDocumentCreate(ClientDocumentBase):
    client_id: UUID
    reservation_id: Optional[UUID] = None


class ClientDocumentUpdate(BaseModel):
    doc_type: Optional[DocumentType] = None
    display_name: Optional[str] = None
    expires_at: Optional[date] = None
    is_approved: Optional[bool] = None
    rejection_reason: Optional[str] = None


class ClientDocumentOut(ClientDocumentBase):
    id: UUID
    client_id: UUID
    reservation_id: Optional[UUID] = None
    display_name: Optional[str] = None
    filename: str
    file_path: str
    is_approved: bool
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

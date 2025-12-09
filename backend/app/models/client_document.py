import enum
import uuid
from sqlalchemy import Boolean, Column, Date, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models.base import Base


class DocumentType(str, enum.Enum):
    fianza = "fianza"
    contrato = "contrato"
    etiquetas = "etiquetas"
    comprobante_pago = "comprobante_pago"
    constancia_fiscal = "constancia_fiscal"
    ine_front = "ine_front"
    ine_back = "ine_back"
    ine_selfie = "ine_selfie"
    otro = "otro"


class ClientDocument(Base):
    __tablename__ = "client_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reservation_id = Column(UUID(as_uuid=True), ForeignKey("reservations.id", ondelete="SET NULL"))
    doc_type = Column(Enum(DocumentType, name="document_type"), nullable=False)
    display_name = Column(String(255), nullable=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    expires_at = Column(Date)
    is_approved = Column(Boolean, nullable=False, default=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    approved_at = Column(DateTime(timezone=True))
    rejection_reason = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

import enum
import uuid
from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models.base import Base


class ReservationStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"


class PaymentMethod(str, enum.Enum):
    cash = "cash"
    bank_transfer = "bank_transfer"
    mercadopago = "mercadopago"


class PaymentStatus(str, enum.Enum):
    unpaid = "unpaid"
    pending_review = "pending_review"
    paid = "paid"
    refunded = "refunded"


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=False)
    status = Column(Enum(ReservationStatus, name="reservation_status"), nullable=False, default=ReservationStatus.pending, index=True)
    payment_method = Column(Enum(PaymentMethod, name="payment_method"), nullable=False)
    payment_status = Column(Enum(PaymentStatus, name="payment_status"), nullable=False, default=PaymentStatus.unpaid, index=True)
    subtotal = Column(Numeric(10, 2), nullable=False)
    tax_amount = Column(Numeric(10, 2), nullable=False, default=0)
    total_amount = Column(Numeric(10, 2), nullable=False)
    discount_amount = Column(Numeric(10, 2), nullable=False, default=0)
    discount_reason = Column(String(255))
    cargo_type = Column(String(100))
    cargo_description = Column(Text)
    cargo_weight = Column(Numeric(10, 2))
    cargo_value = Column(Numeric(12, 2))
    requires_invoice = Column(Boolean, nullable=False, default=False)
    invoice_pdf_path = Column(String(500))
    invoice_xml_path = Column(String(500))
    ticket_pdf_path = Column(String(500))
    payment_proof_path = Column(String(500))
    payment_confirmed_at = Column(DateTime(timezone=True))
    payment_confirmed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

from sqlalchemy import Boolean, Column, DateTime, String, UniqueConstraint, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.models.base import Base


class ClientProfile(Base):
    __tablename__ = "client_profiles"
    __table_args__ = (UniqueConstraint("user_id"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    business_name = Column(String(255))
    rfc = Column(String(13))
    cfdi_use = Column(String(10))
    fiscal_zip_code = Column(String(5))
    invoice_email = Column(String(255))
    contact_phone = Column(String(20))
    fiscal_constancy_path = Column(String(500))
    is_fiscal_verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

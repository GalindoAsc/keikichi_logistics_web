import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, Enum, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import validates
import uuid

from app.models.base import Base


class UserRole(str, enum.Enum):
    superadmin = "superadmin"
    manager = "manager"
    client = "client"


class VerificationStatus(str, enum.Enum):
    pending_documents = "pending_documents"  # Needs to upload INE
    pending_review = "pending_review"        # Waiting for admin approval
    verified = "verified"                     # Fully verified
    rejected = "rejected"                     # Admin rejected


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Contact info - at least one required
    email = Column(String(255), unique=True, nullable=True, index=True)
    phone = Column(String(20), unique=True, nullable=True, index=True)
    
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, name="user_role"), nullable=False, default=UserRole.client, index=True)
    is_active = Column(Boolean, nullable=False, default=False, index=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    
    # Identity Verification
    verification_status = Column(
        Enum(VerificationStatus, name="verification_status"),
        nullable=False,
        default=VerificationStatus.pending_documents,
        index=True
    )
    
    # INE Documents (3 photos required)
    ine_front_file_id = Column(UUID(as_uuid=True), ForeignKey("client_documents.id"), nullable=True)
    ine_back_file_id = Column(UUID(as_uuid=True), ForeignKey("client_documents.id"), nullable=True)
    ine_selfie_file_id = Column(UUID(as_uuid=True), ForeignKey("client_documents.id"), nullable=True)
    
    # Verification Review
    verification_notes = Column(String, nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    rejection_reason = Column(String, nullable=True)
    
    # Billing Info
    billing_name = Column(String(255), nullable=True)
    billing_address = Column(String, nullable=True)
    billing_rfc = Column(String(20), nullable=True)
    billing_email = Column(String(255), nullable=True)
    billing_phone = Column(String(50), nullable=True)
    billing_cfdi_usage = Column(String(50), nullable=True)
    constancia_file_id = Column(UUID(as_uuid=True), ForeignKey("client_documents.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # @validates('email', 'phone')
    # def validate_contact(self, key, value):
    #     """Ensure at least email OR phone is provided"""
    #     # Validation handled in Service layer to avoid initialization issues
    #     return value

    def is_manager_like(self) -> bool:
        return self.role in {UserRole.manager, UserRole.superadmin}

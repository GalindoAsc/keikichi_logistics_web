from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, field_validator

from app.models.user import UserRole, VerificationStatus


class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    is_verified: bool
    verification_status: VerificationStatus = VerificationStatus.pending_documents
    
    # Verification Files
    ine_front_file_id: Optional[UUID] = None
    ine_back_file_id: Optional[UUID] = None
    ine_selfie_file_id: Optional[UUID] = None
    
    # Verification Review
    verification_notes: Optional[str] = None
    rejection_reason: Optional[str] = None

    model_config = {"from_attributes": True}


class UserResponse(UserBase):
    """User response with ID and timestamps"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    verified_at: Optional[datetime] = None
    verified_by: Optional[UUID] = None
    
    # Verification Files
    ine_front_file_id: Optional[UUID] = None
    ine_back_file_id: Optional[UUID] = None
    ine_selfie_file_id: Optional[UUID] = None
    
    # Verification Review
    verification_notes: Optional[str] = None
    rejection_reason: Optional[str] = None

    model_config = {"from_attributes": True}


class UserDetail(UserBase):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserUpdate(BaseModel):
    """Fields that can be updated by admin"""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    verification_status: Optional[VerificationStatus] = None


class UserCreate(BaseModel):
    """Fields for creating a user by admin"""
    email: Optional[EmailStr] = None
    password: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.client
    is_active: bool = True
    is_verified: bool = True
    
    @field_validator('phone')
    @classmethod
    def check_contact_method(cls, v, info):
        """At least one contact method required"""
        email = info.data.get('email') if info.data else None
        if not v and not email:
            raise ValueError('Email or phone number required')
        return v


class PasswordChange(BaseModel):
    old_password: str
    new_password: str

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, model_validator

from app.models.user import UserRole


class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int
    user: Optional["UserOut"] = None


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenRefresh(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class LoginRequest(BaseModel):
    email: str  # Can be email or phone
    password: str


class RegisterRequest(BaseModel):
    email: Optional[EmailStr] = None
    password: str
    full_name: str
    phone: Optional[str] = None

    @model_validator(mode='after')
    def check_contact_method(self) -> 'RegisterRequest':
        if not self.email and not self.phone:
            raise ValueError('Email or phone number required')
        return self


class UserOut(BaseModel):
    id: UUID
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    full_name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    verification_status: Optional[str] = None

    model_config = {"from_attributes": True}


Token.model_rebuild()

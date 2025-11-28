from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    is_verified: bool

    class Config:
        from_attributes = True


class UserDetail(UserBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str

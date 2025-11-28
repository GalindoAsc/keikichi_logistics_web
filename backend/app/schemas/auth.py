from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int
    user: Optional["UserOut"] = None


class TokenRefresh(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    is_verified: bool

    class Config:
        from_attributes = True


Token.model_rebuild()

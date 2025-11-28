from datetime import timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_user
from app.core.security import create_access_token, create_refresh_token, verify_token
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, Token, TokenRefresh, UserOut
from app.services.user_service import UserService
from app.core.exceptions import UnauthorizedException
from app.config import settings

router = APIRouter()


@router.post("/register", response_model=UserOut)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db_session)):
    service = UserService(db)
    user = await service.create_user(payload.email, payload.password, payload.full_name, payload.phone)
    return user


@router.post("/login", response_model=Token)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db_session)):
    service = UserService(db)
    user = await service.authenticate(payload.email, payload.password)
    if not user or not user.is_active:
        raise UnauthorizedException("Invalid credentials or inactive account")
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.access_token_expire_minutes * 60,
        user=user,
    )


@router.post("/refresh", response_model=TokenRefresh)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db_session)):
    try:
        token_data = verify_token(payload.refresh_token)
    except ValueError:
        raise UnauthorizedException()

    if token_data.get("type") != "refresh":
        raise UnauthorizedException()

    user_id = token_data.get("sub")
    if not user_id:
        raise UnauthorizedException()

    service = UserService(db)
    user = await service.get_user_by_id(user_id)
    if not user or not user.is_active:
        raise UnauthorizedException()

    new_access = create_access_token(user_id)
    return TokenRefresh(access_token=new_access, expires_in=settings.access_token_expire_minutes * 60)


@router.post("/logout")
async def logout():
    return {"message": "Logged out"}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password")
async def forgot_password(payload: dict):
    return {"message": "Password reset requested", "email": payload.get("email")}


@router.post("/reset-password")
async def reset_password(payload: dict):
    return {"message": "Password reset", "token": payload.get("token")}

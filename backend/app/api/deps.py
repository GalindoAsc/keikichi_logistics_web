from typing import Optional
from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import UnauthorizedException
from app.core.security import verify_token
from app.database import get_db
from app.models.user import User
from app.services.user_service import UserService


async def get_db_session() -> AsyncSession:
    async for session in get_db():
        yield session


async def get_current_user(
    db: AsyncSession = Depends(get_db_session),
    authorization: Optional[str] = Header(None),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise UnauthorizedException()
    token = authorization.split(" ", 1)[1]
    try:
        payload = verify_token(token)
    except ValueError:
        raise UnauthorizedException()
    if payload.get("type") != "access":
        raise UnauthorizedException()
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException()
    service = UserService(db)
    user = await service.get_user_by_id(user_id)
    if not user:
        raise UnauthorizedException()
    return user


async def require_manager_or_superadmin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_manager_like():
        raise UnauthorizedException("Not enough permissions")
    return current_user


async def require_verified(current_user: User = Depends(get_current_user)) -> User:
    from app.models.user import VerificationStatus
    if current_user.verification_status != VerificationStatus.verified:
        # Also check if they are manager/admin, they should bypass this?
        # Maybe not, but usually admins are verified by default or manually.
        # Let's allow managers/admins to bypass
        if current_user.is_manager_like():
            return current_user
            
        raise UnauthorizedException("Account not verified. Please complete identity verification.")
    return current_user

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

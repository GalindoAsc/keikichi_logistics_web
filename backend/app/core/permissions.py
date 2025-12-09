from fastapi import Depends
from app.core.exceptions import ForbiddenException
from app.api.deps import get_current_user
from app.models.user import User, UserRole


def require_role(*roles: UserRole):
    async def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise ForbiddenException()
        return user

    return checker


def require_manager_or_superadmin(user: User = Depends(get_current_user)) -> User:
    if user.role not in {UserRole.manager, UserRole.superadmin}:
        raise ForbiddenException()
    return user


def require_superadmin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.superadmin:
        raise ForbiddenException()
    return user


def require_active_user(user: User = Depends(get_current_user)) -> User:
    if not user.is_active:
        raise ForbiddenException()
    return user

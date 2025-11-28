from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_user
from app.core.permissions import require_manager_or_superadmin, require_superadmin
from app.models.user import User, UserRole
from app.schemas.user import UserDetail, UserUpdate, PasswordChange
from app.services.user_service import UserService

router = APIRouter()


@router.get("/", response_model=list[UserDetail])
async def list_users(role: UserRole | None = None, db: AsyncSession = Depends(get_db_session), _: User = Depends(require_manager_or_superadmin)):
    service = UserService(db)
    users = await service.list_users(role)
    return users


@router.get("/{user_id}", response_model=UserDetail)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db_session), _: User = Depends(require_manager_or_superadmin)):
    service = UserService(db)
    user = await service.get_user_by_id(user_id)
    if not user:
        raise RuntimeError("User not found")
    return user


@router.post("/{user_id}/approve", response_model=UserDetail)
async def approve_user(user_id: str, db: AsyncSession = Depends(get_db_session), _: User = Depends(require_manager_or_superadmin)):
    service = UserService(db)
    return await service.approve_client(user_id)


@router.post("/{user_id}/reject", response_model=UserDetail)
async def reject_user(user_id: str, db: AsyncSession = Depends(get_db_session), _: User = Depends(require_manager_or_superadmin)):
    service = UserService(db)
    return await service.reject_client(user_id)


@router.patch("/me", response_model=UserDetail)
async def update_me(payload: UserUpdate, db: AsyncSession = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    service = UserService(db)
    user = await service.update_profile(current_user, payload.full_name, payload.phone)
    return user


@router.patch("/me/password")
async def change_password(payload: PasswordChange, db: AsyncSession = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    service = UserService(db)
    await service.change_password(current_user, payload.old_password, payload.new_password)
    return {"message": "Password updated"}

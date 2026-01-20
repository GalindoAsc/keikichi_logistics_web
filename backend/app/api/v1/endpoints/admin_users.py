from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.api import deps
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserUpdate, UserCreate

router = APIRouter()


@router.get("", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    role: Optional[str] = Query(None),
):
    """List all users with pagination and optional role filter (admin only)"""
    if current_user.role not in ["superadmin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    query = select(User).order_by(User.created_at.desc())
    if role:
        query = query.where(User.role == role)
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    users = result.scalars().all()
    return users


@router.post("", response_model=UserResponse)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
):
    """Create a new user (admin only)"""
    if current_user.role not in ["superadmin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    from app.services.user_service import UserService
    service = UserService(db)
    
    # Check if user exists
    if await service.get_user_by_email(user_in.email):
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )
    
    # Create user with specific role and status
    # We need to manually create it because service.create_user defaults to inactive for non-clients
    # and doesn't allow setting is_active/is_verified directly in arguments easily without modifying service
    
    # Actually, let's use service.create_user and then update if needed, OR just create manually here
    # Reuse service logic but override status
    
    from app.core.security import get_password_hash
    
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone=user_in.phone,
        role=user_in.role,
        is_active=user_in.is_active,
        is_verified=user_in.is_verified,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    db: AsyncSession = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
):
    """Update user details (admin only)"""
    if current_user.role not in ["superadmin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Track previous state
    was_verified = user.is_verified
    was_active = user.is_active

    # Update fields
    for field, value in user_update.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)

    # Notifications
    try:
        from app.services.notification_service import notification_service
        
        # Check for verification approval
        if not was_verified and user.is_verified:
            await notification_service.send_in_app(
                user_id=str(user.id),
                title="Cuenta Verificada",
                message="Tu cuenta ha sido verificada. Ya puedes realizar reservaciones.",
                link="/",
                type="success"
            )
            await notification_service.send_data_update(str(user.id), "ACCOUNT_VERIFIED", {})
            
        # Check for activation (if distinct from verification)
        elif not was_active and user.is_active and not (not was_verified and user.is_verified): 
            # Only notify if it wasn't just verified (to avoid double notif if both happen)
            await notification_service.send_in_app(
                user_id=str(user.id),
                title="Cuenta Activada",
                message="Tu cuenta ha sido reactivada.",
                link="/",
                type="success"
            )
            
    except Exception as e:
        print(f"Error sending update notifications: {e}")

    return user


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
):
    """Delete a user (admin only)"""
    if current_user.role not in ["superadmin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    if str(current_user.id) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 1. Check for existing reservations
    from app.models.reservation import Reservation
    res_query = await db.execute(select(Reservation).where(Reservation.client_id == user_id))
    if res_query.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete user with existing reservations. Please cancel/delete them first."
        )

    # 2. Release any held spaces
    from app.models.space import Space, SpaceStatus
    from sqlalchemy import update
    
    # Release holds where this user is the holder
    await db.execute(
        update(Space)
        .where(Space.held_by == user_id)
        .values(
            held_by=None,
            status=SpaceStatus.available,
            hold_expires_at=None
        )
    )
    
    await db.delete(user)
    await db.commit()
    
    return {"message": "User deleted successfully"}

import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash, verify_password
from app.models.user import User, UserRole
from app.core.exceptions import ConflictException, NotFoundException


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_email(self, email: str) -> Optional[User]:
        if not email:
            return None
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalars().first()
    
    async def get_user_by_phone(self, phone: str) -> Optional[User]:
        if not phone:
            return None
        result = await self.db.execute(select(User).where(User.phone == phone))
        return result.scalars().first()

    async def get_user_by_id(self, user_id: str | uuid.UUID) -> Optional[User]:
        if isinstance(user_id, str):
            try:
                user_id = uuid.UUID(user_id)
            except ValueError:
                return None
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    async def create_user(self, email: str | None, password: str, full_name: str, phone: str | None, role: UserRole = UserRole.client) -> User:
        if email and await self.get_user_by_email(email):
            raise ConflictException("Email already registered")
        if phone and await self.get_user_by_phone(phone):
            raise ConflictException("Phone already registered")
            
        if not email and not phone:
            raise ConflictException("Email or phone required")
            
        from app.models.user import VerificationStatus
        
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            phone=phone,
            role=role,
            is_active=role != UserRole.client,
            is_verified=role != UserRole.client,
            verification_status=VerificationStatus.verified if role != UserRole.client else VerificationStatus.pending_documents
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        
        # Notify admins about new user
        try:
            from app.services.notification_service import notification_service
            await notification_service.notify_new_user(user)
        except Exception as e:
            # Don't fail registration if notification fails
            print(f"Failed to notify admins: {e}")
            
        return user

    async def authenticate(self, email_or_phone: str, password: str) -> Optional[User]:
        # Try as email first
        user = await self.get_user_by_email(email_or_phone)
        
        # If not found, try as phone
        if not user:
            user = await self.get_user_by_phone(email_or_phone)
            
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    async def list_users(self, role: UserRole | None = None) -> List[User]:
        stmt = select(User)
        if role:
            stmt = stmt.where(User.role == role)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def approve_client(self, user_id: str) -> User:
        user = await self.get_user_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        user.is_active = True
        user.is_verified = True
        from app.models.user import VerificationStatus
        user.verification_status = VerificationStatus.verified
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def reject_client(self, user_id: str) -> User:
        user = await self.get_user_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
    
        from app.models.user import VerificationStatus
    
        user.is_active = False # Or should rejected users be inactive? Yes, usually.
        user.is_verified = False
        user.verification_status = VerificationStatus.rejected
    
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_profile(self, user: User, full_name: str | None, phone: str | None) -> User:
        if full_name:
            user.full_name = full_name
        if phone:
            user.phone = phone
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def change_password(self, user: User, old_password: str, new_password: str) -> User:
        if not verify_password(old_password, user.hashed_password):
            raise ConflictException("Invalid current password")
        user.hashed_password = get_password_hash(new_password)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def get_packaging_history(self, user_id: str) -> List[str]:
        """Get distinct packaging types used by the user"""
        from app.models.load_item import LoadItem
        from app.models.reservation import Reservation
        
        stmt = (
            select(LoadItem.packaging_type)
            .join(Reservation, LoadItem.reservation_id == Reservation.id)
            .where(Reservation.client_id == user_id)
            .where(LoadItem.packaging_type.isnot(None))
            .distinct()
        )
        result = await self.db.execute(stmt)
        return [r for r in result.scalars().all() if r]

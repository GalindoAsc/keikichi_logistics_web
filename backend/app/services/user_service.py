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
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    async def create_user(self, email: str, password: str, full_name: str, phone: str | None, role: UserRole = UserRole.client) -> User:
        if await self.get_user_by_email(email):
            raise ConflictException("Email already registered")
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            phone=phone,
            role=role,
            is_active=role != UserRole.client,
            is_verified=role != UserRole.client,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def authenticate(self, email: str, password: str) -> Optional[User]:
        user = await self.get_user_by_email(email)
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
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def reject_client(self, user_id: str) -> User:
        user = await self.get_user_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        user.is_active = False
        user.is_verified = False
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

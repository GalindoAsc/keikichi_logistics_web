from datetime import datetime
from datetime import timedelta
from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import NotFoundException
from app.models.space import Space, SpaceStatus
from app.models.trip import Trip, TripStatus
from app.schemas.trip import TripCreate, TripUpdate


class TripService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_trips(self, status: TripStatus | None = None, future_only: bool = False) -> List[Trip]:
        stmt = select(Trip)
        if status:
            stmt = stmt.where(Trip.status == status)
        if future_only:
            today = datetime.utcnow().date()
            stmt = stmt.where(Trip.departure_date >= today)
        result = await self.db.execute(stmt.order_by(Trip.departure_date))
        return list(result.scalars().all())

    async def get_trip(self, trip_id: str) -> Trip:
        from uuid import UUID
        try:
            uuid_id = UUID(trip_id)
        except (ValueError, TypeError):
             # If valid UUID string passed but fails, or bad string.
             # Ideally we validates before.
             # But for safety:
             raise NotFoundException("Invalid Trip ID")
             
        result = await self.db.execute(select(Trip).where(Trip.id == uuid_id))
        trip = result.scalars().first()
        if not trip:
            raise NotFoundException("Trip not found")
        return trip

    async def create_trip(self, payload: TripCreate, created_by: Optional[str]) -> Trip:
        trip = Trip(**payload.model_dump(), created_by=created_by)
        self.db.add(trip)
        await self.db.flush()
        await self._ensure_spaces(trip, payload.total_spaces, payload.price_per_space)
        await self.db.commit()
        await self.db.refresh(trip)
        return trip

    async def update_trip(self, trip: Trip, payload: TripUpdate) -> Trip:
        # Track if total_spaces or price changed for space adjustment
        total_spaces_changed = False
        price_changed = False
        old_price = trip.price_per_space
        
        payload_dict = payload.model_dump(exclude_unset=True)
        
        # Check if total_spaces is being updated
        if 'total_spaces' in payload_dict:
            new_total = payload_dict['total_spaces']
            if new_total != trip.total_spaces:
                total_spaces_changed = True
        
        # Check if price changed
        if 'price_per_space' in payload_dict:
            if payload_dict['price_per_space'] != old_price:
                price_changed = True
        
        # Update trip fields
        for field, value in payload_dict.items():
            setattr(trip, field, value)
        
        # Adjust spaces if total_spaces changed
        if total_spaces_changed:
            await self._adjust_spaces(trip, trip.total_spaces, trip.price_per_space)
        elif price_changed:
            # Update price on existing available spaces
            await self._update_space_prices(trip, trip.price_per_space)
            
        await self.db.commit()
        await self.db.refresh(trip)
        return trip

    async def change_status(self, trip: Trip, status: TripStatus) -> Trip:
        trip.status = status
        await self.db.commit()
        await self.db.refresh(trip)
        return trip

    async def delete_trip(self, trip: Trip) -> None:
        await self.db.delete(trip)
        await self.db.commit()

    async def list_spaces(self, trip: Trip) -> List[Space]:
        result = await self.db.execute(select(Space).where(Space.trip_id == trip.id).order_by(Space.space_number))
        return list(result.scalars().all())

    async def hold_space(self, space: Space, user_id: str) -> Space:
        space.status = SpaceStatus.on_hold
        space.held_by = user_id
        space.hold_expires_at = datetime.utcnow() + timedelta(minutes=settings.space_hold_minutes)
        await self.db.commit()
        await self.db.refresh(space)
        return space

    async def _ensure_spaces(self, trip: Trip, total_spaces: int, price: float) -> None:
        """Create initial spaces for a new trip"""
        existing = await self.list_spaces(trip)
        if len(existing) > 0:
            # Spaces already exist, don't create duplicates
            return
            
        for idx in range(1, total_spaces + 1):
            self.db.add(
                Space(
                    trip_id=trip.id,
                    space_number=idx,
                    status=SpaceStatus.available,
                    price=price,
                )
            )
    
    async def _adjust_spaces(self, trip: Trip, new_total: int, price: float) -> None:
        """Adjust spaces when total_spaces is updated"""
        existing_spaces = await self.list_spaces(trip)
        current_total = len(existing_spaces)
        
        if new_total > current_total:
            # Add more spaces
            # Determine starting number safely
            max_num = max([s.space_number for s in existing_spaces]) if existing_spaces else 0
            spaces_to_add = new_total - current_total
            
            for idx in range(1, spaces_to_add + 1):
                self.db.add(
                    Space(
                        trip_id=trip.id,
                        space_number=max_num + idx,
                        status=SpaceStatus.available,
                        price=price,
                    )
                )
        elif new_total < current_total:
            # Remove excess spaces (only if they're available and not reserved/held)
            spaces_to_remove = current_total - new_total
            available_spaces = [s for s in existing_spaces if s.status == SpaceStatus.available]
            available_spaces.sort(key=lambda x: x.space_number, reverse=True)
            
            # Remove as many as we can (up to the excess amount)
            removed = 0
            for space in available_spaces:
                if removed >= spaces_to_remove:
                    break
                await self.db.delete(space)
                removed += 1
            
            # If we couldn't remove all excess spaces (some are reserved), log a warning
            # but don't fail - just update the trip's total_spaces to reflect reality
            if removed < spaces_to_remove:
                remaining_excess = spaces_to_remove - removed
                print(f"WARNING: Could only remove {removed}/{spaces_to_remove} spaces. "
                      f"{remaining_excess} spaces are reserved/blocked and cannot be removed.")
                # Update total_spaces to reflect actual available count
                trip.total_spaces = current_total - removed
    
    async def _update_space_prices(self, trip: Trip, new_price: float) -> None:
        """Update prices for all available spaces"""
        spaces = await self.list_spaces(trip)
        for space in spaces:
            if space.status == SpaceStatus.available:
                space.price = new_price

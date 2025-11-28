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

    async def list_trips(self, status: TripStatus | None = None) -> List[Trip]:
        stmt = select(Trip)
        if status:
            stmt = stmt.where(Trip.status == status)
        result = await self.db.execute(stmt.order_by(Trip.departure_date))
        return list(result.scalars().all())

    async def get_trip(self, trip_id: str) -> Trip:
        result = await self.db.execute(select(Trip).where(Trip.id == trip_id))
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
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(trip, field, value)
        await self.db.commit()
        await self.db.refresh(trip)
        return trip

    async def change_status(self, trip: Trip, status: TripStatus) -> Trip:
        trip.status = status
        await self.db.commit()
        await self.db.refresh(trip)
        return trip

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
        existing = await self.list_spaces(trip)
        start = len(existing) + 1
        for idx in range(start, total_spaces + 1):
            self.db.add(
                Space(
                    trip_id=trip.id,
                    space_number=idx,
                    status=SpaceStatus.available,
                    price=price,
                )
            )

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db_session
from app.models.space import Space, SpaceStatus
from app.schemas.space import TripSpacesResponse, SpaceBase, SpaceSummary
from app.services.trip_service import TripService

router = APIRouter()


@router.get("/trip/{trip_id}", response_model=TripSpacesResponse)
async def get_trip_spaces(trip_id: str, db: AsyncSession = Depends(get_db_session), current_user=Depends(get_current_user)):
    service = TripService(db)
    trip = await service.get_trip(trip_id)
    spaces = await service.list_spaces(trip)
    summary = SpaceSummary()
    for space in spaces:
        setattr(summary, space.status.value, getattr(summary, space.status.value) + 1)
    return TripSpacesResponse(
        trip_id=str(trip.id),
        total_spaces=trip.total_spaces,
        spaces=[SpaceBase.from_orm(s) for s in spaces],
        summary=summary,
    )


@router.post("/{space_id}/hold", response_model=SpaceBase)
async def hold_space(space_id: str, db: AsyncSession = Depends(get_db_session), current_user=Depends(get_current_user)):
    service = TripService(db)
    trip_list = await service.list_trips()
    space: Space | None = None
    for trip in trip_list:
        for s in await service.list_spaces(trip):
            if str(s.id) == space_id:
                space = s
                break
    if not space:
        raise RuntimeError("Space not found")
    updated = await service.hold_space(space, str(current_user.id))
    return SpaceBase.from_orm(updated)


@router.post("/{space_id}/block", response_model=SpaceBase)
async def block_space(space_id: str, db: AsyncSession = Depends(get_db_session), current_user=Depends(get_current_user)):
    service = TripService(db)
    trip_list = await service.list_trips()
    target: Space | None = None
    for trip in trip_list:
        for s in await service.list_spaces(trip):
            if str(s.id) == space_id:
                target = s
                break
    if not target:
        raise RuntimeError("Space not found")
    target.status = SpaceStatus.blocked
    target.held_by = None
    target.hold_expires_at = None
    await db.commit()
    await db.refresh(target)
    return SpaceBase.from_orm(target)

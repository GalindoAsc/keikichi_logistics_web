from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db_session
from app.core.permissions import require_manager_or_superadmin
from app.models.trip import TripStatus, Trip
from app.schemas.trip import TripCreate, TripOut, TripUpdate
from app.schemas.space import TripSpacesResponse, SpaceSummary, SpaceBase
from app.services.trip_service import TripService

router = APIRouter()


@router.get("/", response_model=list[TripOut])
async def list_trips(status: TripStatus | None = None, db: AsyncSession = Depends(get_db_session)):
    service = TripService(db)
    trips = await service.list_trips(status)
    enriched: list[TripOut] = []
    for trip in trips:
        spaces = await service.list_spaces(trip)
        summary = _build_summary(spaces)
        enriched.append(
            TripOut.from_orm(trip).model_copy(update={
                "available_spaces": summary.available,
                "reserved_spaces": summary.reserved,
                "blocked_spaces": summary.blocked,
                "on_hold_spaces": summary.on_hold,
            })
        )
    return enriched


@router.get("/{trip_id}", response_model=TripOut)
async def get_trip(trip_id: str, db: AsyncSession = Depends(get_db_session)):
    service = TripService(db)
    trip = await service.get_trip(trip_id)
    spaces = await service.list_spaces(trip)
    summary = _build_summary(spaces)
    return TripOut.from_orm(trip).model_copy(update={
        "available_spaces": summary.available,
        "reserved_spaces": summary.reserved,
        "blocked_spaces": summary.blocked,
        "on_hold_spaces": summary.on_hold,
    })


@router.post("/", response_model=TripOut)
async def create_trip(payload: TripCreate, db: AsyncSession = Depends(get_db_session), current_user=Depends(require_manager_or_superadmin)):
    service = TripService(db)
    trip = await service.create_trip(payload, getattr(current_user, "id", None))
    return TripOut.from_orm(trip)


@router.patch("/{trip_id}", response_model=TripOut)
async def update_trip(trip_id: str, payload: TripUpdate, db: AsyncSession = Depends(get_db_session), current_user=Depends(require_manager_or_superadmin)):
    service = TripService(db)
    trip = await service.get_trip(trip_id)
    trip = await service.update_trip(trip, payload)
    return TripOut.from_orm(trip)


@router.patch("/{trip_id}/status", response_model=TripOut)
async def change_status(trip_id: str, status: TripStatus, db: AsyncSession = Depends(get_db_session), current_user=Depends(require_manager_or_superadmin)):
    service = TripService(db)
    trip = await service.get_trip(trip_id)
    trip = await service.change_status(trip, status)
    return TripOut.from_orm(trip)


def _build_summary(spaces: list) -> SpaceSummary:
    summary = SpaceSummary()
    for space in spaces:
        summary_value = getattr(summary, space.status.value)
        setattr(summary, space.status.value, summary_value + 1)
    return summary

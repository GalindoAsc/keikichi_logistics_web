import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db_session
from app.core.permissions import require_manager_or_superadmin
from app.models.trip import TripStatus, Trip
from app.schemas.trip import TripCreate, TripOut, TripUpdate
from app.schemas.space import TripSpacesResponse, SpaceSummary, SpaceBase
from app.services.trip_service import TripService
from app.services.notification_service import notification_service

router = APIRouter()


@router.get("/", response_model=list[TripOut])
async def list_trips(status: TripStatus | None = None, future_only: bool = False, db: AsyncSession = Depends(get_db_session)):
    service = TripService(db)
    trips_data = await service.list_trips_with_stats(status, future_only)
    
    enriched: list[TripOut] = []
    for item in trips_data:
        trip = item["trip"]
        # Use model_validate to create the base Pydantic model from ORM object
        trip_out = TripOut.model_validate(trip)
        
        # Manually copied logic from previous model_copy approach but using the pre-calculated stats
        enriched.append(
            trip_out.model_copy(update={
                "available_spaces": item["available_spaces"],
                "reserved_spaces": item["reserved_spaces"],
                "blocked_spaces": item["blocked_spaces"],
                "on_hold_spaces": item["on_hold_spaces"],
            })
        )
    return enriched


@router.get("/{trip_id}", response_model=TripOut)
async def get_trip(trip_id: str, db: AsyncSession = Depends(get_db_session)):
    service = TripService(db)
    trip = await service.get_trip(trip_id)
    spaces = await service.list_spaces(trip)
    summary = _build_summary(spaces)
    return TripOut.model_validate(trip).model_copy(update={
        "available_spaces": summary.available,
        "reserved_spaces": summary.reserved,
        "blocked_spaces": summary.blocked,
        "on_hold_spaces": summary.on_hold,
    })


@router.get("/{trip_id}/spaces", response_model=list[SpaceBase])
async def list_trip_spaces(trip_id: str, db: AsyncSession = Depends(get_db_session)):
    service = TripService(db)
    trip = await service.get_trip(trip_id)
    spaces = await service.list_spaces(trip)
    return spaces


@router.post("/", response_model=TripOut, status_code=201)
async def create_trip(payload: TripCreate, db: AsyncSession = Depends(get_db_session), current_user=Depends(require_manager_or_superadmin)):
    service = TripService(db)
    trip = await service.create_trip(payload, getattr(current_user, "id", None))
    
    # Notify about new trip
    await notification_service.notify_trip_created(trip, admins_only=False)
    
    # Send DATA_UPDATE event to refresh trip lists in real-time
    from app.api.v1.endpoints.notifications import manager
    await manager.broadcast({
        "type": "DATA_UPDATE",
        "event": "TRIP_CREATED",
        "data": {
            "trip_id": str(trip.id),
            "message": f"Nuevo viaje: {trip.origin} → {trip.destination}"
        }
    })
    
    return TripOut.model_validate(trip)


@router.patch("/{trip_id}", response_model=TripOut)
async def update_trip(trip_id: str, payload: TripUpdate, db: AsyncSession = Depends(get_db_session), current_user=Depends(require_manager_or_superadmin)):
    service = TripService(db)
    trip = await service.get_trip(trip_id)
    
    # Track what changed to determine if notification is needed
    payload_dict = payload.model_dump(exclude_unset=True)
    significant_changes = []
    
    # Check for significant changes that affect clients
    if 'departure_date' in payload_dict:
        significant_changes.append('fecha de salida')
    if 'departure_time' in payload_dict:
        significant_changes.append('hora de salida')
    if 'origin' in payload_dict or 'destination' in payload_dict:
        significant_changes.append('ruta')
    if 'price_per_space' in payload_dict:
        significant_changes.append('precio')
    if 'total_spaces' in payload_dict:
        significant_changes.append('espacios disponibles')
    
    # Get affected users (those with reservations for this trip) before updating
    from app.models.reservation import Reservation
    from sqlalchemy import select
    from uuid import UUID
    query = select(Reservation.client_id).where(Reservation.trip_id == UUID(trip_id))
    result = await db.execute(query)
    affected_user_ids = [str(row[0]) for row in result.all()]
    
    trip = await service.update_trip(trip, payload)
    
    # Only notify if there are significant changes AND there are affected users
    if significant_changes and affected_user_ids:
        # Notify affected users about important changes
        await notification_service.notify_trip_updated(trip, affected_user_ids)
    
    # Always notify admins about any trip update
    await notification_service.notify_admins(
        "Viaje Actualizado",
        f"Viaje {trip.origin} → {trip.destination} modificado",
        f"/admin/trips/{trip.id}",
        "info"
    )
    
    # Send DATA_UPDATE event to refresh trip lists in real-time
    from app.api.v1.endpoints.notifications import manager
    await manager.broadcast({
        "type": "DATA_UPDATE",
        "event": "TRIP_UPDATED",
        "data": {
            "trip_id": str(trip.id),
            "changes": significant_changes
        }
    })
    
    return TripOut.model_validate(trip)


@router.patch("/{trip_id}/status", response_model=TripOut)
async def change_status(trip_id: str, status: TripStatus, db: AsyncSession = Depends(get_db_session), current_user=Depends(require_manager_or_superadmin)):
    logger = logging.getLogger(__name__)
    logger.info(f"Changing status for trip {trip_id} to {status}")
    try:
        service = TripService(db)
        trip = await service.get_trip(trip_id)
        logger.debug(f"Trip found: {trip.id}, current status: {trip.status}")
        trip = await service.change_status(trip, status)
        logger.info(f"Status changed successfully to {trip.status}")
        
        # Notify affected users (passengers with active reservations)
        try:
            # 1. Get users with active reservations (Confirmed/PendingPayment)
            from app.models.reservation import Reservation, ReservationStatus
            from sqlalchemy import select
            
            # Assuming 'active' means not cancelled or rejected, so they care about the trip status
            stmt = select(Reservation.client_id).where(
                Reservation.trip_id == trip.id,
                Reservation.status.in_([ReservationStatus.confirmed, ReservationStatus.pending]) 
            )
            result = await db.execute(stmt)
            affected_user_ids = [str(row[0]) for row in result.all()]
            
            await notification_service.notify_trip_status_changed(trip, status, affected_user_ids)
            
        except Exception as ne:
            logger.error(f"Error sending status notifications: {ne}", exc_info=True)
            # Don't fail request
        
        return TripOut.model_validate(trip)
    except Exception as e:
        logger.error(f"Error in change_status: {e}", exc_info=True)
        raise e


@router.delete("/{trip_id}", status_code=204)
async def delete_trip(trip_id: str, db: AsyncSession = Depends(get_db_session), current_user=Depends(require_manager_or_superadmin)):
    try:
        service = TripService(db)
        trip = await service.get_trip(trip_id)
        
        # Capture critical info for log/notification BEFORE deletion
        trip_info = f"{trip.origin} → {trip.destination}"
        trip_id_str = str(trip.id)
        
        # Attempt deletion
        await service.delete_trip(trip)
        
        # If successful, assume no active reservations existed (DB constraint held)
        # Notify broadly (we don't have list of affected users since they are gone or weren't fetched to save performance/risk)
        # Or better: Just broadcast the deletion event
        from app.api.v1.endpoints.notifications import manager
        await manager.broadcast({
            "type": "DATA_UPDATE",
            "event": "TRIP_DELETED",
            "data": {
                "trip_id": trip_id_str,
                "message": f"Viaje {trip_info} eliminado"
            }
        })

    except Exception as e:
        # Check for Integrity Error
        error_str = str(e).lower()
        if "integrity" in error_str or "constraint" in error_str or "foreign key" in error_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede eliminar el viaje porque tiene reservaciones o relaciones activas. Cancele las reservaciones primero."
            )
        
        # Allow 404 to pass through if raised by service.get_trip
        if isinstance(e, HTTPException):
            raise e
            
        # Catch unexpected
        logger = logging.getLogger(__name__)
        logger.error(f\"Error deleting trip: {e}\", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno eliminando viaje: {str(e)}"
        )


# ==================== WAITLIST ENDPOINTS ====================

@router.post("/{trip_id}/waitlist")
async def join_waitlist(
    trip_id: str,
    spaces_requested: int = 1,
    db: AsyncSession = Depends(get_db_session),
    current_user=Depends(get_current_user)
):
    """
    Join waitlist for a trip when it's full.
    """
    from sqlalchemy import select
    from app.models.waitlist import Waitlist
    from uuid import UUID
    
    # Check if already on waitlist
    existing_stmt = select(Waitlist).where(
        Waitlist.trip_id == UUID(trip_id),
        Waitlist.user_id == current_user.id
    )
    existing = await db.scalar(existing_stmt)
    
    if existing:
        return {"message": "Ya estás en la lista de espera para este viaje", "waitlist_id": str(existing.id)}
    
    # Add to waitlist
    waitlist_entry = Waitlist(
        trip_id=UUID(trip_id),
        user_id=current_user.id,
        spaces_requested=spaces_requested
    )
    db.add(waitlist_entry)
    await db.commit()
    await db.refresh(waitlist_entry)
    
    return {
        "message": "Te has unido a la lista de espera. Te notificaremos cuando haya espacios disponibles.",
        "waitlist_id": str(waitlist_entry.id)
    }


@router.delete("/{trip_id}/waitlist")
async def leave_waitlist(
    trip_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user=Depends(get_current_user)
):
    """
    Leave waitlist for a trip.
    """
    from sqlalchemy import select, delete
    from app.models.waitlist import Waitlist
    from uuid import UUID
    
    stmt = delete(Waitlist).where(
        Waitlist.trip_id == UUID(trip_id),
        Waitlist.user_id == current_user.id
    )
    await db.execute(stmt)
    await db.commit()
    
    return {"message": "Has salido de la lista de espera"}


@router.get("/{trip_id}/waitlist/status")
async def get_waitlist_status(
    trip_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user=Depends(get_current_user)
):
    """
    Check if current user is on waitlist for a trip and get position.
    """
    from sqlalchemy import select, func
    from app.models.waitlist import Waitlist
    from uuid import UUID
    
    # Check if user is on waitlist
    user_entry_stmt = select(Waitlist).where(
        Waitlist.trip_id == UUID(trip_id),
        Waitlist.user_id == current_user.id
    )
    user_entry = await db.scalar(user_entry_stmt)
    
    if not user_entry:
        return {"on_waitlist": False, "position": None, "total_waiting": 0}
    
    # Get position (count entries before this one)
    position_stmt = select(func.count(Waitlist.id)).where(
        Waitlist.trip_id == UUID(trip_id),
        Waitlist.created_at < user_entry.created_at
    )
    position = await db.scalar(position_stmt) or 0
    
    # Total on waitlist
    total_stmt = select(func.count(Waitlist.id)).where(Waitlist.trip_id == UUID(trip_id))
    total_waiting = await db.scalar(total_stmt) or 0
    
    return {
        "on_waitlist": True,
        "position": position + 1,  # 1-indexed
        "total_waiting": total_waiting,
        "spaces_requested": user_entry.spaces_requested
    }


def _build_summary(spaces: list) -> SpaceSummary:
    summary = SpaceSummary()
    for space in spaces:
        summary_value = getattr(summary, space.status.value)
        setattr(summary, space.status.value, summary_value + 1)
    return summary

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List
import json

from app.api.deps import get_current_user, get_db_session
from app.models.space import Space, SpaceStatus
from app.schemas.space import TripSpacesResponse, SpaceBase, SpaceSummary
from app.services.trip_service import TripService
from app.core.security import verify_token

router = APIRouter()


# WebSocket Manager for Space Updates (per-trip rooms)
class SpaceConnectionManager:
    def __init__(self):
        # Dict of trip_id -> list of websocket connections
        self.trip_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, trip_id: str):
        await websocket.accept()
        if trip_id not in self.trip_connections:
            self.trip_connections[trip_id] = []
        self.trip_connections[trip_id].append(websocket)
        print(f"[SpaceWS] Client connected to trip {trip_id}. Total: {len(self.trip_connections[trip_id])}")

    def disconnect(self, websocket: WebSocket, trip_id: str):
        if trip_id in self.trip_connections:
            if websocket in self.trip_connections[trip_id]:
                self.trip_connections[trip_id].remove(websocket)
            if len(self.trip_connections[trip_id]) == 0:
                del self.trip_connections[trip_id]
        print(f"[SpaceWS] Client disconnected from trip {trip_id}")

    async def broadcast_to_trip(self, trip_id: str, message: dict):
        """Send update to all clients watching a specific trip"""
        if trip_id in self.trip_connections:
            text = json.dumps(message)
            dead_connections = []
            for connection in self.trip_connections[trip_id]:
                try:
                    await connection.send_text(text)
                except Exception:
                    dead_connections.append(connection)
            # Clean up dead connections
            for conn in dead_connections:
                self.trip_connections[trip_id].remove(conn)


space_ws_manager = SpaceConnectionManager()


@router.get("/trip/{trip_id}", response_model=TripSpacesResponse)
async def get_trip_spaces(trip_id: str, db: AsyncSession = Depends(get_db_session), current_user=Depends(get_current_user)):
    from sqlalchemy import select
    from app.models.reservation import Reservation, ReservationStatus
    from app.models.reservation_space import ReservationSpace
    
    service = TripService(db)
    trip = await service.get_trip(trip_id)
    spaces = await service.list_spaces(trip)
    
    # Get all spaces that belong to user's pending reservations for this trip
    pending_res_stmt = select(ReservationSpace.space_id).join(
        Reservation, Reservation.id == ReservationSpace.reservation_id
    ).where(
        Reservation.trip_id == trip.id,
        Reservation.client_id == current_user.id,
        Reservation.status == ReservationStatus.pending
    )
    result = await db.execute(pending_res_stmt)
    my_pending_space_ids = {str(row[0]) for row in result.fetchall()}
    
    summary = SpaceSummary()
    for space in spaces:
        setattr(summary, space.status.value, getattr(summary, space.status.value) + 1)
    
    spaces_out = []
    for s in spaces:
        sb = SpaceBase.model_validate(s)
        # is_mine is true if:
        # 1. Space is on_hold and held_by current user, OR
        # 2. Space belongs to user's pending reservation
        is_mine_from_hold = s.status == SpaceStatus.on_hold and str(s.held_by) == str(current_user.id)
        is_mine_from_reservation = str(s.id) in my_pending_space_ids
        sb.is_mine = is_mine_from_hold or is_mine_from_reservation
        sb.has_pending_reservation = is_mine_from_reservation
        spaces_out.append(sb)

    return TripSpacesResponse(
        trip_id=str(trip.id),
        total_spaces=trip.total_spaces,
        spaces=spaces_out,
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
    
    # Broadcast space update
    await space_ws_manager.broadcast_to_trip(str(updated.trip_id), {
        "event": "space_update",
        "data": {
            "space_id": str(updated.id),
            "space_number": updated.space_number,
            "status": updated.status.value,
            "trip_id": str(updated.trip_id)
        }
    })
    
    return SpaceBase.model_validate(updated)


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
    
    # Broadcast space update
    await space_ws_manager.broadcast_to_trip(str(target.trip_id), {
        "event": "space_update",
        "data": {
            "space_id": str(target.id),
            "space_number": target.space_number,
            "status": target.status.value,
            "trip_id": str(target.trip_id)
        }
    })
    
    return SpaceBase.model_validate(target)


@router.put("/{space_id}/status", response_model=SpaceBase)
async def update_space_status(
    space_id: str, 
    status: SpaceStatus, 
    db: AsyncSession = Depends(get_db_session), 
    current_user=Depends(get_current_user)
):
    """
    Update space status (Admin/Manager only)
    Useful for marking spaces as 'internal' or 'blocked'
    """
    from app.models.user import UserRole
    from fastapi import HTTPException
    from sqlalchemy import select

    if current_user.role not in [UserRole.superadmin, UserRole.manager]:
        raise HTTPException(status_code=403, detail="Not authorized")

    stmt = select(Space).where(Space.id == space_id)
    result = await db.execute(stmt)
    space = result.scalars().first()

    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    # If setting to available, clear hold info
    if status == SpaceStatus.available:
        space.held_by = None
        space.hold_expires_at = None
    
    # If setting to internal/blocked, also clear hold info to be safe
    if status in [SpaceStatus.internal, SpaceStatus.blocked]:
        space.held_by = None
        space.hold_expires_at = None

    space.status = status
    await db.commit()
    await db.refresh(space)
    
    # Broadcast space update to all clients watching this trip
    await space_ws_manager.broadcast_to_trip(str(space.trip_id), {
        "event": "space_update",
        "data": {
            "space_id": str(space.id),
            "space_number": space.space_number,
            "status": space.status.value,
            "trip_id": str(space.trip_id)
        }
    })
    
    return SpaceBase.model_validate(space)


# WebSocket endpoint for real-time space updates
@router.websocket("/ws/trip/{trip_id}")
async def space_websocket(websocket: WebSocket, trip_id: str, token: str = Query(...)):
    """
    WebSocket for real-time space updates.
    Clients connect to a specific trip and receive updates when spaces change.
    """
    # Verify token
    user_id = verify_token(token)
    if not user_id:
        await websocket.close(code=4001, reason="Invalid token")
        return
    
    await space_ws_manager.connect(websocket, trip_id)
    
    try:
        while True:
            # Just keep connection alive, we only send from server
            data = await websocket.receive_text()
            # Optionally handle ping/pong or client messages here
    except WebSocketDisconnect:
        space_ws_manager.disconnect(websocket, trip_id)

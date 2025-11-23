from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date

from app.database import get_db
from app.api.deps import get_current_active_user, get_current_admin_user
from app.models.user import User
from app.models.trip import Trip, TripStatus
from app.models.space import Space, SpaceStatus
from app.schemas.trip import TripCreate, TripUpdate, TripResponse, TripListResponse

router = APIRouter()


@router.post("/", response_model=TripResponse)
def create_trip(
    trip_in: TripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """
    Create new trip with automatic space generation
    """
    trip = Trip(
        **trip_in.model_dump(exclude={'total_spaces'}),
        total_spaces=trip_in.total_spaces,
        created_by=current_user.id
    )
    db.add(trip)
    db.flush()

    # Generate spaces automatically
    for i in range(1, trip_in.total_spaces + 1):
        space = Space(
            trip_id=trip.id,
            space_number=i,
            status=SpaceStatus.AVAILABLE
        )
        db.add(space)

    db.commit()
    db.refresh(trip)
    return trip


@router.get("/", response_model=List[TripListResponse])
def get_trips(
    skip: int = 0,
    limit: int = 100,
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    departure_date: Optional[date] = None,
    status: Optional[TripStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Retrieve trips with filters
    """
    query = db.query(Trip)

    if origin:
        query = query.filter(Trip.origin.ilike(f"%{origin}%"))
    if destination:
        query = query.filter(Trip.destination.ilike(f"%{destination}%"))
    if departure_date:
        query = query.filter(Trip.departure_date == departure_date)
    if status:
        query = query.filter(Trip.status == status)

    trips = query.offset(skip).limit(limit).all()

    # Calculate available spaces for each trip
    result = []
    for trip in trips:
        available_spaces = db.query(Space).filter(
            Space.trip_id == trip.id,
            Space.status == SpaceStatus.AVAILABLE
        ).count()

        result.append(TripListResponse(
            id=trip.id,
            origin=trip.origin,
            destination=trip.destination,
            departure_date=trip.departure_date,
            departure_time=trip.departure_time,
            status=trip.status,
            total_spaces=trip.total_spaces,
            available_spaces=available_spaces,
            created_at=trip.created_at
        ))

    return result


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get trip by ID
    """
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.put("/{trip_id}", response_model=TripResponse)
def update_trip(
    trip_id: str,
    trip_in: TripUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """
    Update a trip
    """
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    update_data = trip_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(trip, field, value)

    db.commit()
    db.refresh(trip)
    return trip


@router.delete("/{trip_id}")
def delete_trip(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """
    Delete a trip
    """
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    db.delete(trip)
    db.commit()
    return {"message": "Trip deleted successfully"}

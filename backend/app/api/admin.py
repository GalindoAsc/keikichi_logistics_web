from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.api.deps import get_current_admin_user, get_current_super_admin_user
from app.models.user import User, UserRole
from app.models.trip import Trip, TripStatus
from app.models.space import Space, SpaceStatus
from app.models.reservation import Reservation, ReservationStatus
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter()


@router.get("/users", response_model=List[UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin_user)
) -> Any:
    """
    Get all users (super admin only)
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin_user)
) -> Any:
    """
    Update user (super admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.get("/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """
    Get dashboard statistics
    """
    # Total trips
    total_trips = db.query(Trip).count()

    # Active trips
    active_trips = db.query(Trip).filter(
        Trip.status.in_([TripStatus.SCHEDULED, TripStatus.IN_TRANSIT])
    ).count()

    # Total reservations
    total_reservations = db.query(Reservation).count()

    # Pending reservations
    pending_reservations = db.query(Reservation).filter(
        Reservation.status == ReservationStatus.PENDING
    ).count()

    # Confirmed reservations
    confirmed_reservations = db.query(Reservation).filter(
        Reservation.status == ReservationStatus.CONFIRMED
    ).count()

    # Total spaces
    total_spaces = db.query(Space).count()

    # Available spaces
    available_spaces = db.query(Space).filter(
        Space.status == SpaceStatus.AVAILABLE
    ).count()

    # Reserved spaces
    reserved_spaces = db.query(Space).filter(
        Space.status == SpaceStatus.RESERVED
    ).count()

    # Occupancy rate
    occupancy_rate = (reserved_spaces / total_spaces * 100) if total_spaces > 0 else 0

    # Total users
    total_users = db.query(User).count()

    # Active users
    active_users = db.query(User).filter(User.is_active == True).count()

    return {
        "total_trips": total_trips,
        "active_trips": active_trips,
        "total_reservations": total_reservations,
        "pending_reservations": pending_reservations,
        "confirmed_reservations": confirmed_reservations,
        "total_spaces": total_spaces,
        "available_spaces": available_spaces,
        "reserved_spaces": reserved_spaces,
        "occupancy_rate": round(occupancy_rate, 2),
        "total_users": total_users,
        "active_users": active_users,
    }

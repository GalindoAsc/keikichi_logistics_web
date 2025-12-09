from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.api.deps import get_db_session
from app.core.permissions import require_manager_or_superadmin
from app.models.user import User
from app.models.reservation import Reservation, PaymentStatus, ReservationStatus
from app.models.trip import Trip, TripStatus
from app.models.space import Space, SpaceStatus

router = APIRouter()

@router.get("/stats", response_model=Dict[str, Any])
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(require_manager_or_superadmin)
):
    """
    Get comprehensive dashboard statistics for admin/manager
    """
    
    # 1. Pending Payments (Reservations with payment_status='pending_review')
    pending_payments_stmt = select(func.count(Reservation.id)).where(
        Reservation.payment_status == PaymentStatus.pending_review
    )
    pending_payments = await db.scalar(pending_payments_stmt) or 0
    
    # 2. Total Revenue (Grouped by Currency)
    # Join Reservation -> Trip to get currency
    revenue_stmt = select(Trip.currency, func.sum(Reservation.total_amount)).join(
        Trip, Reservation.trip_id == Trip.id
    ).where(
        Reservation.payment_status == PaymentStatus.paid
    ).group_by(Trip.currency)
    
    revenue_rows = await db.execute(revenue_stmt)
    total_revenue_map = {row[0]: float(row[1]) for row in revenue_rows.all()}
    
    # 3. Monthly Revenue (Grouped by Currency)
    first_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_revenue_stmt = select(Trip.currency, func.sum(Reservation.total_amount)).join(
        Trip, Reservation.trip_id == Trip.id
    ).where(
        and_(
            Reservation.payment_status == PaymentStatus.paid,
            Reservation.created_at >= first_of_month
        )
    ).group_by(Trip.currency)
    
    monthly_rows = await db.execute(monthly_revenue_stmt)
    monthly_revenue_map = {row[0]: float(row[1]) for row in monthly_rows.all()}
    
    # 4. Active Trips (Departure date >= today, not cancelled)
    today = datetime.now().date()
    active_trips_stmt = select(func.count(Trip.id)).where(
        and_(
            Trip.departure_date >= today,
            Trip.status != TripStatus.cancelled
        )
    )
    active_trips = await db.scalar(active_trips_stmt) or 0
    
    # 5. Total Reservations (All time)
    total_reservations_stmt = select(func.count(Reservation.id))
    total_reservations = await db.scalar(total_reservations_stmt) or 0
    
    # 6. Upcoming Trips with availability (next 7 days)
    next_week = today + timedelta(days=7)
    upcoming_trips_stmt = select(Trip).where(
        and_(
            Trip.departure_date >= today,
            Trip.departure_date <= next_week,
            Trip.status == TripStatus.scheduled
        )
    ).order_by(Trip.departure_date).limit(5)
    upcoming_result = await db.execute(upcoming_trips_stmt)
    upcoming_trips = upcoming_result.scalars().all()
    
    upcoming_trips_data = []
    for trip in upcoming_trips:
        # Get space counts
        spaces_stmt = select(Space.status, func.count(Space.id)).where(
            Space.trip_id == trip.id
        ).group_by(Space.status)
        spaces_result = await db.execute(spaces_stmt)
        space_counts = {status: count for status, count in spaces_result.all()}
        
        available = space_counts.get(SpaceStatus.available, 0)
        on_hold = space_counts.get(SpaceStatus.on_hold, 0)
        reserved = space_counts.get(SpaceStatus.reserved, 0)
        total = trip.total_spaces
        
        occupancy_pct = round((reserved / total * 100) if total > 0 else 0, 1)
        
        upcoming_trips_data.append({
            "id": str(trip.id),
            "origin": trip.origin,
            "destination": trip.destination,
            "departure_date": str(trip.departure_date),
            "total_spaces": total,
            "available": available,
            "on_hold": on_hold,
            "reserved": reserved,
            "occupancy_percent": occupancy_pct
        })
    
    # 7. Recent Activity (Last 5 reservations)
    # Join Trip to get currency logic or fetch separately? Joining is cleaner.
    # But current logic is simple selection.
    recent_stmt = select(Reservation, Trip).join(Trip, Reservation.trip_id == Trip.id).order_by(Reservation.created_at.desc()).limit(5)
    recent_result = await db.execute(recent_stmt)
    recent_rows = recent_result.all()  # List of tuples (Reservation, Trip)
    
    recent_data = []
    for res, trip in recent_rows:
        client_stmt = select(User).where(User.id == res.client_id)
        client = await db.scalar(client_stmt)
        client_name = client.full_name if client else "Unknown"
        
        recent_data.append({
            "id": str(res.id),
            "client_name": client_name,
            "amount": float(res.total_amount),
            "currency": trip.currency,
            "status": res.status.value if hasattr(res.status, 'value') else str(res.status),
            "payment_status": res.payment_status.value if hasattr(res.payment_status, 'value') else str(res.payment_status),
            "created_at": res.created_at.isoformat() if res.created_at else None
        })

    return {
        "pending_payments": pending_payments,
        "revenue_by_currency": {
            "total": total_revenue_map,
            "monthly": monthly_revenue_map
        },
        # Keep old fields for safety (default to USD or 0)
        "total_revenue": total_revenue_map.get("USD", 0) + total_revenue_map.get("MXN", 0), # Imprecise fallback
        "monthly_revenue": monthly_revenue_map.get("USD", 0) + monthly_revenue_map.get("MXN", 0), # Imprecise fallback
        "active_trips": active_trips,
        "total_reservations": total_reservations,
        "upcoming_trips": upcoming_trips_data,
        "recent_reservations": recent_data
    }

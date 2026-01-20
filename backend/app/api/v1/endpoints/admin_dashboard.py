from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, and_, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta

from app.api.deps import get_db_session
from app.core.permissions import require_manager_or_superadmin
from app.models.user import User
from app.models.reservation import Reservation, PaymentStatus
from app.models.trip import Trip, TripStatus
from app.models.space import Space, SpaceStatus
from app.models.trip_quote import TripQuote, QuoteStatus

router = APIRouter()


@router.get("/stats", response_model=Dict[str, Any])
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(require_manager_or_superadmin)
):
    """
    Get comprehensive dashboard statistics for admin/manager.
    Optimized to minimize database queries.
    """
    today = datetime.now().date()
    first_of_month = datetime.now().replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )

    # Execute multiple simple counts in parallel-ish
    # 1. Pending Payments
    pending_payments = await db.scalar(
        select(func.count(Reservation.id)).where(
            Reservation.payment_status == PaymentStatus.pending_review
        )
    ) or 0

    # 2. Total Revenue (Grouped by Currency)
    revenue_stmt = (
        select(Trip.currency, func.sum(Reservation.total_amount))
        .join(Trip, Reservation.trip_id == Trip.id)
        .where(Reservation.payment_status == PaymentStatus.paid)
        .group_by(Trip.currency)
    )
    revenue_rows = await db.execute(revenue_stmt)
    total_revenue_map = {row[0]: float(row[1]) for row in revenue_rows.all()}

    # 3. Monthly Revenue (Grouped by Currency)
    monthly_revenue_stmt = (
        select(Trip.currency, func.sum(Reservation.total_amount))
        .join(Trip, Reservation.trip_id == Trip.id)
        .where(
            and_(
                Reservation.payment_status == PaymentStatus.paid,
                Reservation.created_at >= first_of_month
            )
        )
        .group_by(Trip.currency)
    )
    monthly_rows = await db.execute(monthly_revenue_stmt)
    monthly_revenue_map = {row[0]: float(row[1]) for row in monthly_rows.all()}

    # 4. Active Trips count
    active_trips = await db.scalar(
        select(func.count(Trip.id)).where(
            and_(
                Trip.departure_date >= today,
                Trip.status != TripStatus.cancelled
            )
        )
    ) or 0

    # 5. Total Reservations count
    total_reservations = await db.scalar(
        select(func.count(Reservation.id))
    ) or 0

    # 6. Upcoming Trips with space stats - OPTIMIZED with subquery
    next_week = today + timedelta(days=7)

    # Get trips first
    upcoming_trips_stmt = (
        select(Trip)
        .where(
            and_(
                Trip.departure_date >= today,
                Trip.departure_date <= next_week,
                Trip.status == TripStatus.scheduled
            )
        )
        .order_by(Trip.departure_date)
        .limit(5)
    )
    upcoming_result = await db.execute(upcoming_trips_stmt)
    upcoming_trips = upcoming_result.scalars().all()

    # Get all space counts in ONE query for all trips
    trip_ids = [t.id for t in upcoming_trips]
    upcoming_trips_data = []

    if trip_ids:
        space_stats_stmt = (
            select(
                Space.trip_id,
                Space.status,
                func.count(Space.id).label('cnt')
            )
            .where(Space.trip_id.in_(trip_ids))
            .group_by(Space.trip_id, Space.status)
        )
        space_stats_result = await db.execute(space_stats_stmt)
        space_stats_rows = space_stats_result.all()

        # Build a dict: {trip_id: {status: count}}
        space_counts_map: Dict[str, Dict] = {}
        for row in space_stats_rows:
            tid = str(row.trip_id)
            if tid not in space_counts_map:
                space_counts_map[tid] = {}
            space_counts_map[tid][row.status] = row.cnt

        for trip in upcoming_trips:
            tid = str(trip.id)
            counts = space_counts_map.get(tid, {})
            available = counts.get(SpaceStatus.available, 0)
            on_hold = counts.get(SpaceStatus.on_hold, 0)
            reserved = counts.get(SpaceStatus.reserved, 0)
            total = trip.total_spaces
            occupancy_pct = round((reserved / total * 100) if total > 0 else 0, 1)

            upcoming_trips_data.append({
                "id": tid,
                "origin": trip.origin,
                "destination": trip.destination,
                "departure_date": str(trip.departure_date),
                "total_spaces": total,
                "available": available,
                "on_hold": on_hold,
                "reserved": reserved,
                "occupancy_percent": occupancy_pct
            })

    # 7. Recent Reservations - OPTIMIZED with JOIN
    recent_stmt = (
        select(Reservation, Trip, User)
        .join(Trip, Reservation.trip_id == Trip.id)
        .join(User, Reservation.client_id == User.id)
        .order_by(Reservation.created_at.desc())
        .limit(5)
    )
    recent_result = await db.execute(recent_stmt)
    recent_rows = recent_result.all()

    recent_data = []
    for res, trip, client in recent_rows:
        recent_data.append({
            "id": str(res.id),
            "client_name": client.full_name if client else "Unknown",
            "amount": float(res.total_amount),
            "currency": trip.currency,
            "status": res.status.value if hasattr(res.status, 'value') else str(res.status),
            "payment_status": (
                res.payment_status.value
                if hasattr(res.payment_status, 'value')
                else str(res.payment_status)
            ),
            "created_at": res.created_at.isoformat() if res.created_at else None
        })

    # 8. Quote Statistics
    pending_quotes = await db.scalar(
        select(func.count(TripQuote.id)).where(
            TripQuote.status == QuoteStatus.pending
        )
    ) or 0

    total_quotes = await db.scalar(
        select(func.count(TripQuote.id))
    ) or 0

    # Recent quotes
    recent_quotes_stmt = (
        select(TripQuote)
        .order_by(TripQuote.created_at.desc())
        .limit(5)
    )
    recent_quotes_result = await db.execute(recent_quotes_stmt)
    recent_quotes = recent_quotes_result.scalars().all()

    recent_quotes_data = [
        {
            "id": str(q.id),
            "client_name": q.client_name or "N/A",
            "client_email": q.client_email or "N/A",
            "origin": q.origin,
            "destination": q.destination,
            "status": q.status.value if hasattr(q.status, 'value') else str(q.status),
            "created_at": q.created_at.isoformat() if q.created_at else None
        }
        for q in recent_quotes
    ]

    return {
        "pending_payments": pending_payments,
        "revenue_by_currency": {
            "total": total_revenue_map,
            "monthly": monthly_revenue_map
        },
        "total_revenue": sum(total_revenue_map.values()),
        "monthly_revenue": sum(monthly_revenue_map.values()),
        "active_trips": active_trips,
        "total_reservations": total_reservations,
        "upcoming_trips": upcoming_trips_data,
        "recent_reservations": recent_data,
        "pending_quotes": pending_quotes,
        "total_quotes": total_quotes,
        "recent_quotes": recent_quotes_data
    }

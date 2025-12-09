from datetime import datetime, timedelta
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.reservation import Reservation, ReservationStatus, PaymentStatus
from app.models.space import Space, SpaceStatus
from app.models.reservation_space import ReservationSpace
from app.models.trip import Trip


async def cancel_unpaid_reservations():
    """
    Cancel reservations that haven't been paid by the deadline
   
    This task runs every hour and:
    - Finds reservations with status=pending and payment_status=unpaid or pending_review
    - Checks if created_at + trip.payment_deadline_hours < now()
    - Cancels the reservation and releases spaces
    - Could optionally send notification to client
    """
    async with AsyncSessionLocal() as db:
        try:
            now = datetime.now()
           
            # Find all pending reservations
            stmt = select(Reservation).where(
                and_(
                    Reservation.status == ReservationStatus.pending,
                    Reservation.payment_status.in_([PaymentStatus.unpaid, PaymentStatus.pending_review])
                )
            )
           
            result = await db.execute(stmt)
            pending_reservations = list(result.scalars().all())
           
            cancelled_count = 0
           
            for reservation in pending_reservations:
                # Get trip to check payment deadline
                trip_stmt = select(Trip).where(Trip.id == reservation.trip_id)
                trip_result = await db.execute(trip_stmt)
                trip = trip_result.scalars().first()
               
                if not trip:
                    continue
               
                # Calculate deadline
                deadline = reservation.created_at + timedelta(hours=trip.payment_deadline_hours)
               
                if now > deadline:
                    print(f"[Payment Deadline Task] Cancelling reservation {reservation.id} - payment deadline exceeded")
                   
                    # Cancel reservation
                    reservation.status = ReservationStatus.cancelled
                   
                    # Release spaces
                    res_spaces_stmt = select(ReservationSpace).where(
                        ReservationSpace.reservation_id == reservation.id
                    )
                    res_spaces_result = await db.execute(res_spaces_stmt)
                    res_spaces = list(res_spaces_result.scalars().all())
                   
                    space_ids = [rs.space_id for rs in res_spaces]
                   
                    if space_ids:
                        spaces_stmt = select(Space).where(Space.id.in_(space_ids))
                        spaces_result = await db.execute(spaces_stmt)
                        spaces = list(spaces_result.scalars().all())
                       
                        for space in spaces:
                            space.status = SpaceStatus.available
                   
                    cancelled_count += 1
                   
                    # TODO: Send notification to client
                    # Could use email service or message system
           
            if cancelled_count > 0:
                await db.commit()
                print(f"[Payment Deadline Task] Cancelled {cancelled_count} unpaid reservations")
            else:
                print("[Payment Deadline Task] No unpaid reservations to cancel")
               
        except Exception as e:
            print(f"[Payment Deadline Task] Error: {str(e)}")
            await db.rollback()

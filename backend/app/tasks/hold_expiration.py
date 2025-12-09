from datetime import datetime
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.space import Space, SpaceStatus


async def release_expired_holds():
    """
    Release holds that have expired
   
    This task runs every 5 minutes and:
    - Finds all spaces with status=on_hold and hold_expires_at < now()
    - Changes them back to available
    - Clears held_by and hold_expires_at fields
    - Broadcasts updates via WebSocket
    """
    from app.api.v1.spaces import space_ws_manager
    
    async with AsyncSessionLocal() as db:
        try:
            now = datetime.now()
           
            # Find expired holds
            stmt = select(Space).where(
                and_(
                    Space.status == SpaceStatus.on_hold,
                    Space.hold_expires_at < now
                )
            )
           
            result = await db.execute(stmt)
            expired_spaces = list(result.scalars().all())
           
            if expired_spaces:
                count = len(expired_spaces)
                print(f"[Hold Expiration Task] Releasing {count} expired holds")
               
                # Group by trip for WebSocket broadcasts
                trip_updates = {}
                
                for space in expired_spaces:
                    trip_id = str(space.trip_id)
                    space.status = SpaceStatus.available
                    space.held_by = None
                    space.hold_expires_at = None
                    
                    # Collect for WebSocket broadcast
                    if trip_id not in trip_updates:
                        trip_updates[trip_id] = []
                    trip_updates[trip_id].append({
                        "space_id": str(space.id),
                        "space_number": space.space_number,
                        "status": "available",
                        "trip_id": trip_id
                    })
               
                await db.commit()
                print(f"[Hold Expiration Task] Successfully released {count} spaces")
                
                # Broadcast via WebSocket
                for trip_id, updates in trip_updates.items():
                    for update in updates:
                        await space_ws_manager.broadcast_to_trip(trip_id, {
                            "event": "space_update",
                            "data": update
                        })
                print(f"[Hold Expiration Task] Broadcasted updates to {len(trip_updates)} trips")
            else:
                pass  # Silent when no expired holds
               
        except Exception as e:
            print(f"[Hold Expiration Task] Error: {str(e)}")
            await db.rollback()

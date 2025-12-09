"""
Cleanup script to fix duplicate spaces in existing trips
Run this once to clean up the database
"""
import asyncio
from sqlalchemy import select, func
from app.database import AsyncSessionLocal
from app.models.trip import Trip
from app.models.space import Space, SpaceStatus

async def cleanup_duplicate_spaces():
    """Remove duplicate spaces from trips, keeping only the configured amount"""
    async with AsyncSessionLocal() as db:
        # Get all trips
        result = await db.execute(select(Trip))
        trips = result.scalars().all()
        
        for trip in trips:
            # Get all spaces for this trip
            spaces_result = await db.execute(
                select(Space)
                .where(Space.trip_id == trip.id)
                .order_by(Space.space_number)
            )
            all_spaces = list(spaces_result.scalars().all())
            
            current_count = len(all_spaces)
            expected_count = trip.total_spaces
            
            if current_count > expected_count:
                print(f"Trip {trip.id} ({trip.origin} → {trip.destination})")
                print(f"  Has {current_count} spaces, should have {expected_count}")
                
                # Remove excess spaces (only available ones, from highest number down)
                excess = current_count - expected_count
                available_spaces = [s for s in all_spaces if s.status == SpaceStatus.available]
                available_spaces.sort(key=lambda x: x.space_number, reverse=True)
                
                removed = 0
                for space in available_spaces:
                    if removed >= excess:
                        break
                    await db.delete(space)
                    removed += 1
                    print(f"  Removed space #{space.space_number}")
                
                if removed < excess:
                    print(f"  WARNING: Could only remove {removed}/{excess} excess spaces")
                    print(f"  Remaining {excess - removed} spaces are reserved/blocked")
                else:
                    print(f"  ✓ Cleaned up successfully")
        
        await db.commit()
        print("\n✓ Cleanup complete")

if __name__ == "__main__":
    asyncio.run(cleanup_duplicate_spaces())

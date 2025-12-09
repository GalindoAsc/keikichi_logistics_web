
import asyncio
import uuid
from app.db.session import SessionLocal
from app.services.trip_service import TripService
from app.schemas.trip import TripCreate, TripUpdate
from app.models.space import Space, SpaceStatus

async def reproduce():
    async with SessionLocal() as db:
        service = TripService(db)
        
        # 1. Create a trip with 4 spaces
        payload = TripCreate(
            origin="BugTest",
            destination="BugDest",
            departure_date="2025-12-31",
            total_spaces=4,
            price_per_space=100.0,
            is_international=False,
            pickup_cost=0,
            pickup_cost_type="flat_rate",
            currency="USD",
            exchange_rate=1.0,
            payment_deadline_hours=24
        )
        trip = await service.create_trip(payload, created_by=None)
        print(f"Created trip {trip.id} with 4 spaces")
        
        # 2. Simulate a gap: Delete space #3
        spaces = await service.list_spaces(trip)
        space_3 = next(s for s in spaces if s.space_number == 3)
        await db.delete(space_3)
        await db.commit()
        print("Deleted space #3")
        
        # 3. Validation: We now have spaces 1, 2, 4. (Count = 3)
        # 4. Try to update total_spaces to 5.
        # Logic uses len(spaces) = 3. Range(4, 6) -> Adds 4, 5.
        # But Space #4 already exists! -> ERROR expected.
        
        try:
            print("Attempting to update total_spaces to 5...")
            update_payload = TripUpdate(total_spaces=5)
            await service.update_trip(trip, update_payload)
            print("Update SUCCESS (Unexpected)")
        except Exception as e:
            print(f"Update FAILED as expected: {e}")
            
if __name__ == "__main__":
    asyncio.run(reproduce())

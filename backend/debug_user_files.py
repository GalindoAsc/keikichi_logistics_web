import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.config import settings

# Use localhost for connection since we are running from host
database_url = settings.database_url.replace("db", "localhost")

async def main():
    engine = create_async_engine(database_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # User ID we suspect is Carmen Solorio
        user_id = 'daaef830-2c72-4aa6-8934-271e6ed77bd8'
        
        result = await session.execute(
            text("SELECT id, full_name, ine_front_file_id, ine_back_file_id, ine_selfie_file_id FROM users WHERE id = :uid"),
            {"uid": user_id}
        )
        user = result.first()
        
        if user:
            print(f"User: {user.full_name} ({user.id})")
            print(f"INE Front ID: {user.ine_front_file_id}")
            print(f"INE Back ID: {user.ine_back_file_id}")
            print(f"Selfie ID: {user.ine_selfie_file_id}")
        else:
            print("User not found")

if __name__ == "__main__":
    asyncio.run(main())

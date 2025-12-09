import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.config import settings

# Use settings.database_url directly as we will run this inside the container
database_url = settings.database_url

async def main():
    engine = create_async_engine(database_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    print(f"DEBUG: settings.upload_dir = {settings.upload_dir}")

    async with async_session() as session:
        # Search for Carmen Solorio
        result = await session.execute(
            text("SELECT id, full_name, ine_front_file_id, ine_back_file_id, ine_selfie_file_id FROM users WHERE full_name ILIKE '%Carmen Solorio%'")
        )
        users = result.fetchall()
        
        for user in users:
            print(f"User: {user.full_name} ({user.id})")
            print(f"INE Front ID: {user.ine_front_file_id}")
            print(f"INE Back ID: {user.ine_back_file_id}")
            print(f"Selfie ID: {user.ine_selfie_file_id}")

if __name__ == "__main__":
    asyncio.run(main())

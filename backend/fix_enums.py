import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings

async def fix_enums():
    print("Connecting to database...")
    # Override host for local execution
    db_url = settings.database_url.replace(settings.postgres_host, "localhost")
    engine = create_async_engine(db_url)
    
    async with engine.connect() as conn:
        print("Adding 'ine_front' to document_type...")
        await conn.execute(text("ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'ine_front'"))
        print("Adding 'ine_back' to document_type...")
        await conn.execute(text("ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'ine_back'"))
        print("Adding 'ine_selfie' to document_type...")
        await conn.execute(text("ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'ine_selfie'"))
        await conn.commit()
        
    print("Done!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix_enums())

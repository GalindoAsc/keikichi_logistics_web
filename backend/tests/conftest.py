
import os
import sys
import pytest
import pytest_asyncio
import sqlalchemy
from sqlalchemy import event, Engine

# --- PATCHING FOR SQLITE COMPATIBILITY ---
# Patch PostgreSQL UUID to use generic Uuid (which works with SQLite)
from sqlalchemy.dialects import postgresql
postgresql.UUID = sqlalchemy.types.Uuid
postgresql.JSONB = sqlalchemy.types.JSON # Patch JSONB to generic JSON
postgresql.INET = sqlalchemy.types.String # Patch INET if used
postgresql.CIDR = sqlalchemy.types.String # Patch CIDR if used

# Set environment to use In-Memory SQLite
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["ENVIRONMENT"] = "testing"

# Ensure we don't try to use Postgres-specific drivers in config defaults if any
os.environ["POSTGRES_USER"] = "user"
os.environ["POSTGRES_PASSWORD"] = "password"
os.environ["POSTGRES_DB"] = "db"
os.environ["POSTGRES_HOST"] = "localhost"

# ------------------------------------------

from typing import AsyncGenerator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.config import settings
from app.database import get_db
from app.api.deps import get_db_session

# Import models to register them with Base.metadata
from app.models.base import Base
# We need to import all models that we want to create tables for.
# App imports usually handle this, but to be safe:
from app.models import user, trip, reservation, client_document, system_config

# Configure SQLite engine
# Note: check_same_thread=False is needed for sqlite with asyncio sometimes, but aiosqlite handles it.
engine = create_async_engine(
    settings.database_url,
    echo=False,  # Set to True if you need to debug SQL
    connect_args={"check_same_thread": False}
)

TestingSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False, 
    autoflush=False,
    autocommit=False
)

# Enable foreign key constraints for SQLite (disabled by default)
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    """
    Create tables at start of session and drop at end.
    """
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    # Drop tables handling foreign keys
    # SQLite requires disabling FK checks before dropping tables with circular deps or complex relations
    async with engine.connect() as conn:
        await conn.execute(sqlalchemy.text("PRAGMA foreign_keys=OFF"))
        await conn.commit()
        
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        
    async with engine.connect() as conn:
        await conn.execute(sqlalchemy.text("PRAGMA foreign_keys=ON"))
        await conn.commit()

@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session
        # Rollback is handled by session context usually, but explicitly:
        await session.rollback()

@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Override get_db/get_db_session dependency to use our test DB session.
    """
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_db_session] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test", follow_redirects=True) as ac:
        yield ac
    
    app.dependency_overrides.clear()

# --- AUTH FIXTURES ---

@pytest_asyncio.fixture
async def user_token(client: AsyncClient, db_session: AsyncSession):
    # Create a user directly in DB or via API
    # Via API ensures password hashing etc is correct
    email = "testuser@example.com"
    password = "password123"
    
    # Check if exists first (due to session scope reuse potentially)
    from app.services.user_service import UserService
    service = UserService(db_session)
    existing = await service.get_user_by_email(email)
    
    user_id = None
    if not existing:
        res = await client.post("/api/v1/auth/register", json={
            "email": email,
            "password": password,
            "full_name": "Test User",
            "phone": "5555555555"
        })
        if res.status_code == 200:
             user_id = res.json()["id"]
             
             # Manually verify user in DB
             from app.models.user import VerificationStatus
             user = await service.get_user_by_id(user_id)
             user.is_verified = True
             user.is_active = True
             user.verification_status = VerificationStatus.verified
             db_session.add(user)
             await db_session.commit()
             
    else:
        user_id = existing.id
        # Ensure existing is verified too just in case
        from app.models.user import VerificationStatus
        if existing.verification_status != VerificationStatus.verified:
             existing.is_verified = True
             existing.verification_status = VerificationStatus.verified
             db_session.add(existing)
             await db_session.commit()

    # Login
    login_res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password
    })
    
    if login_res.status_code == 200:
        return login_res.json()["access_token"]
    return None

@pytest_asyncio.fixture
async def admin_token(client: AsyncClient, db_session: AsyncSession):
    email = "admin@keikichi.com"
    password = "adminpassword"
    
    from app.services.user_service import UserService
    from app.models.user import UserRole
    service = UserService(db_session)
    existing = await service.get_user_by_email(email)
    
    if not existing:
        # Register doesn't allow setting role usually. We might need to manually update DB.
        # Create via API then update role
        res = await client.post("/api/v1/auth/register", json={
            "email": email,
            "password": password,
            "full_name": "Admin User",
            "phone": "9999999999"
        })
        user_id = res.json()["id"]
        
        # Update role manually
        user = await service.get_user_by_id(user_id)
        user.role = UserRole.superadmin
        db_session.add(user)
        await db_session.commit()
    
    # Login
    login_res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password
    })
    
    if login_res.status_code == 200:
        return login_res.json()["access_token"]
    return None

@pytest.fixture(autouse=True)
def mock_notification_service(monkeypatch):
    from unittest.mock import AsyncMock
    from app.services.notification_service import notification_service
    
    # Mock all notification methods to avoid DB calls (which fail with sqlite :memory: due to separate sessions)
    monkeypatch.setattr(notification_service, "notify_trip_created", AsyncMock())
    monkeypatch.setattr(notification_service, "notify_trip_updated", AsyncMock())
    monkeypatch.setattr(notification_service, "notify_admins", AsyncMock())
    monkeypatch.setattr(notification_service, "notify_account_verified", AsyncMock())
    monkeypatch.setattr(notification_service, "notify_reservation_created", AsyncMock())
    monkeypatch.setattr(notification_service, "notify_payment_approved", AsyncMock())
    monkeypatch.setattr(notification_service, "notify_payment_pending", AsyncMock())
    monkeypatch.setattr(notification_service, "notify_payment_rejected", AsyncMock())
    monkeypatch.setattr(notification_service, "notify_reservation_cancelled", AsyncMock())
    monkeypatch.setattr(notification_service, "notify_trip_cancelled", AsyncMock())
    monkeypatch.setattr(notification_service, "notify_space_available", AsyncMock())
    monkeypatch.setattr(notification_service, "notify_new_user", AsyncMock())
    monkeypatch.setattr(notification_service, "send_email", AsyncMock())
    monkeypatch.setattr(notification_service, "send_in_app", AsyncMock())
    monkeypatch.setattr(notification_service, "send_data_update", AsyncMock())

import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.user_service import UserService
from app.config import settings
from app.models.user import UserRole

logger = logging.getLogger(__name__)

async def init_db(db: AsyncSession) -> None:
    """Initialize database with default data"""
    service = UserService(db)
    
    # Create default admin if not exists
    try:
        user = await service.get_user_by_email(settings.default_admin_email)
        if not user:
            logger.info(f"Creating default admin user: {settings.default_admin_email}")
            await service.create_user(
                email=settings.default_admin_email,
                password=settings.default_admin_password,
                full_name=settings.default_admin_name,
                phone=None,
                role=UserRole.superadmin
            )
        else:
            logger.info(f"Default admin user already exists: {settings.default_admin_email}")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")

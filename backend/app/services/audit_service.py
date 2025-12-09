"""
Audit Service - Helper to log changes to audit_logs table
"""
from typing import Optional, Any, Dict
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


async def log_audit(
    db: AsyncSession,
    action: str,
    entity_type: str,
    entity_id: UUID,
    user_id: Optional[UUID] = None,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """
    Log an audit event.
    
    Args:
        db: Database session
        action: Action performed (e.g., 'payment_confirmed', 'status_changed', 'cancelled')
        entity_type: Type of entity (e.g., 'reservation', 'trip', 'user')
        entity_id: ID of the entity
        user_id: ID of user who performed the action
        old_values: Previous values (as dict)
        new_values: New values (as dict)
        ip_address: Client IP address
        user_agent: Client user agent string
    """
    log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_values=old_values,
        new_values=new_values,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(log)
    # Don't commit here - let the caller handle the transaction


async def get_entity_audit_history(
    db: AsyncSession,
    entity_type: str,
    entity_id: UUID,
    limit: int = 20
):
    """
    Get audit history for a specific entity.
    """
    from sqlalchemy import select
    
    stmt = select(AuditLog).where(
        AuditLog.entity_type == entity_type,
        AuditLog.entity_id == entity_id
    ).order_by(AuditLog.created_at.desc()).limit(limit)
    
    result = await db.execute(stmt)
    return result.scalars().all()

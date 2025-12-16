import logging
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc

logger = logging.getLogger(__name__)

from app.api.deps import get_current_user, get_db_session
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, NotificationUpdate
from app.core.security import verify_token

router = APIRouter()

# Store active connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: dict = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.user_connections:
            self.user_connections[user_id] = []
        self.user_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)

    async def send_personal_message(self, message: str | dict, user_id: str):
        if user_id in self.user_connections:
            if isinstance(message, dict):
                import json
                text = json.dumps(message)
            else:
                text = message
                
            for connection in self.user_connections[user_id]:
                await connection.send_text(text)

    async def broadcast(self, message: dict):
        """Send a message to all connected users"""
        import json
        text = json.dumps(message)
        for user_id, connections in self.user_connections.items():
            for connection in connections:
                try:
                    await connection.send_text(text)
                except Exception as e:
                    logger.warning(f"Failed to send message to user {user_id}: {e}")

manager = ConnectionManager()


@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db_session),
    current_user = Depends(get_current_user)
):
    """
    List current user's notifications
    """
    stmt = select(Notification).where(
        Notification.user_id == current_user.id
    ).order_by(desc(Notification.created_at)).offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    return result.scalars().all()


@router.put("/{id}/read", response_model=NotificationResponse)
async def mark_as_read(
    id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user = Depends(get_current_user)
):
    """
    Mark notification as read
    """
    stmt = select(Notification).where(
        Notification.id == id,
        Notification.user_id == current_user.id
    )
    result = await db.execute(stmt)
    notification = result.scalars().first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    return notification


@router.put("/read-all", response_model=Dict[str, str])
async def mark_all_as_read(
    db: AsyncSession = Depends(get_db_session),
    current_user = Depends(get_current_user)
):
    """
    Mark all notifications as read for current user
    """
    stmt = update(Notification).where(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).values(is_read=True)
    
    await db.execute(stmt)
    await db.commit()
    return {"message": "All notifications marked as read"}


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    user_id: str,
    token: str = Query(...)
):
    try:
        payload = verify_token(token)
        token_user_id = payload.get("sub")
        # Verify token belongs to the user_id requested or is admin (optional, for now strict)
        if not token_user_id or str(token_user_id) != str(user_id):
             # You could also allow admins to subscribe to others, but for now strict check
             await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
             return
    except Exception as e:
        logger.error(f"WebSocket auth failed for user {user_id}: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


@router.delete("/{id}")
async def delete_notification(
    id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user = Depends(get_current_user)
):
    """
    Delete a specific notification
    """
    stmt = select(Notification).where(
        Notification.id == id,
        Notification.user_id == current_user.id
    )
    result = await db.execute(stmt)
    notification = result.scalars().first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    await db.delete(notification)
    await db.commit()
    return {"message": "Notification deleted"}


@router.delete("")
async def clear_all_notifications(
    db: AsyncSession = Depends(get_db_session),
    current_user = Depends(get_current_user)
):
    """
    Delete all notifications for current user
    """
    from sqlalchemy import delete
    stmt = delete(Notification).where(Notification.user_id == current_user.id)
    await db.execute(stmt)
    await db.commit()
    return {"message": "All notifications cleared"}

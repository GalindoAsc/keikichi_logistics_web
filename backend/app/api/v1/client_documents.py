import shutil
import os
import logging
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

logger = logging.getLogger(__name__)

from app.api.deps import get_db_session, get_current_user
from app.core.permissions import require_manager_or_superadmin
from app.models.user import User, UserRole
from app.models.client_document import ClientDocument, DocumentType
from app.schemas.client_document import ClientDocumentOut, ClientDocumentUpdate
from app.services.notification_service import notification_service

router = APIRouter()

UPLOAD_DIR = "uploads/client_documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=ClientDocumentOut)
async def upload_document(
    doc_type: DocumentType = Form(...),
    file: UploadFile = File(...),
    client_id: Optional[UUID] = Form(None), # Optional, defaults to current_user if not admin
    display_name: Optional[str] = Form(None),
    expires_at: Optional[date] = Form(None),
    reservation_id: Optional[UUID] = Form(None),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    # Determine target user
    target_user_id = current_user.id
    is_admin = current_user.role in [UserRole.superadmin, UserRole.manager]
    
    if client_id:
        if not is_admin and client_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to upload for this user")
        target_user_id = client_id
    
    # Create user directory
    user_dir = os.path.join(UPLOAD_DIR, str(target_user_id))
    os.makedirs(user_dir, exist_ok=True)
    
    # Generate safe filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(user_dir, safe_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Create DB record
    db_doc = ClientDocument(
        client_id=target_user_id,
        doc_type=doc_type,
        display_name=display_name,
        filename=file.filename,
        file_path=file_path,
        expires_at=expires_at,
        reservation_id=reservation_id,
        is_approved=True if is_admin else False, # Auto-approve only if admin
        approved_by=current_user.id if is_admin else None,
        approved_at=datetime.now() if is_admin else None
    )
    
    db.add(db_doc)
    await db.commit()
    await db.refresh(db_doc)
    
    logger.info(f"Document uploaded: {db_doc.id} by user {current_user.id}")
    
    # Schedule notifications in background
    background_tasks.add_task(
        handle_upload_notifications,
        is_admin=is_admin,
        current_user_id=current_user.id,
        current_user_name=current_user.full_name,
        target_user_id=target_user_id,
        doc_type=doc_type
    )
    
    return db_doc

async def handle_upload_notifications(is_admin, current_user_id, current_user_name, target_user_id, doc_type):
    from app.database import AsyncSessionLocal
    from app.models.user import User, UserRole
    from sqlalchemy import select, or_
    
    logger.debug(f"Starting upload notifications, is_admin={is_admin}")
    
    if not is_admin:
        try:
            doc_type_display = doc_type.replace("_", " ").title()
            
            async with AsyncSessionLocal() as session:
                query = select(User).where(
                    or_(
                        User.role == UserRole.superadmin,
                        User.role == UserRole.manager
                    )
                )
                result = await session.execute(query)
                admins = result.scalars().all()
                
                logger.info(f"Notifying {len(admins)} admins about document upload")
                
                for admin in admins:
                    # Send persistent notification (Bell)
                    await notification_service.send_in_app(
                        user_id=str(admin.id),
                        title="Nuevo Documento",
                        message=f"El cliente {current_user_name} ha subido un nuevo documento: {doc_type_display}",
                        link=f"/admin/accounts/{target_user_id}/files",
                        type="info"
                    )
                    
                    # Send real-time data update (List refresh)
                    await notification_service.send_data_update(
                        str(admin.id), 
                        "DOCUMENT_UPLOADED", 
                        {"client_id": str(target_user_id)}
                    )
                
            logger.info("Upload notifications completed successfully")
        except Exception as e:
            logger.error(f"Error sending upload notifications: {e}", exc_info=True)
            import traceback
            traceback.print_exc()

@router.get("/user/{user_id}", response_model=List[ClientDocumentOut])
async def list_user_documents(
    user_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    # Check permissions
    if current_user.role not in [UserRole.superadmin, UserRole.manager] and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view these documents")

    query = select(ClientDocument).where(ClientDocument.client_id == user_id).order_by(ClientDocument.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{doc_id}/download")
async def download_document(
    doc_id: UUID,
    inline: bool = False,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    doc = await db.get(ClientDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check permissions
    is_admin = current_user.role in [UserRole.superadmin, UserRole.manager]
    is_owner = doc.client_id == current_user.id
    
    if not is_admin and not is_owner:
        raise HTTPException(status_code=403, detail="Not authorized to download this document")
        
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
        
    content_disposition_type = "inline" if inline else "attachment"
    return FileResponse(
        doc.file_path, 
        filename=doc.filename,
        content_disposition_type=content_disposition_type
    )

@router.delete("/{doc_id}")
async def delete_document(
    doc_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    doc = await db.get(ClientDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check permissions
    is_admin = current_user.role in [UserRole.superadmin, UserRole.manager]
    is_owner = doc.client_id == current_user.id
    
    if not is_admin:
        if not is_owner:
             raise HTTPException(status_code=403, detail="Not authorized to delete this document")
        if doc.is_approved:
             raise HTTPException(status_code=403, detail="Cannot delete approved documents")
        
    # Delete file from disk
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
        
    client_id = doc.client_id
    doc_name = doc.display_name or doc.filename
    await db.delete(doc)
    await db.commit()
    
    # Notify admins if deleted by client
    if not is_admin:
         # Find all admins and managers
        from sqlalchemy import select, or_
        query = select(User).where(or_(User.role == UserRole.superadmin, User.role == UserRole.manager))
        result = await db.execute(query)
        admins = result.scalars().all()
        for admin in admins:
            await notification_service.send_data_update(str(admin.id), "DOCUMENT_DELETED", {"client_id": str(client_id)})
    
    # Notify client if deleted by admin
    elif is_admin:
        try:
            # Send persistent notification
            await notification_service.send_in_app(
                user_id=str(client_id),
                title="Documento Eliminado",
                message=f"El administrador ha eliminado tu documento: {doc_name}",
                type="warning"
            )
            
            # Send real-time update
            await notification_service.send_data_update(
                str(client_id), 
                "DOCUMENT_DELETED", 
                {"doc_id": str(doc_id)}
            )
        except Exception as e:
            print(f"Error sending deletion notification: {e}")
            
    return {"message": "Document deleted successfully"}

@router.patch("/{doc_id}/approve", response_model=ClientDocumentOut)
async def approve_document(
    doc_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(require_manager_or_superadmin)
):
    doc = await db.get(ClientDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc.is_approved = True
    doc.approved_by = current_user.id
    doc.approved_at = datetime.now()
    
    await db.commit()
    await db.refresh(doc)
    
    # Send notification to client
    try:
        await notification_service.send_in_app(
            user_id=doc.client_id,
            title="Documento Aprobado",
            message=f"Tu documento '{doc.display_name or doc.filename}' ha sido aprobado.",
            link="/my-files",
            type="success"
        )
        # Send data update to client
        await notification_service.send_data_update(
            str(doc.client_id), 
            "DOCUMENT_APPROVED", 
            {"doc_id": str(doc.id)}
        )
    except Exception as e:
        print(f"Error sending notification: {e}")
        # Don't fail the request if notification fails
    
    return doc

@router.patch("/{doc_id}", response_model=ClientDocumentOut)
async def update_document(
    doc_id: UUID,
    payload: ClientDocumentUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    doc = await db.get(ClientDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check permissions
    is_admin = current_user.role in [UserRole.superadmin, UserRole.manager]
    is_owner = doc.client_id == current_user.id
    
    if not is_admin and not is_owner:
        raise HTTPException(status_code=403, detail="Not authorized to update this document")
        
    # Only admin can update approval status
    if payload.is_approved is not None and not is_admin:
         raise HTTPException(status_code=403, detail="Only admins can change approval status")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(doc, key, value)
        
    await db.commit()
    await db.refresh(doc)
    
    # Notify if updated by admin
    if is_admin:
         await notification_service.send_data_update(
            str(doc.client_id), 
            "DOCUMENT_UPDATED", 
            {"doc_id": str(doc.id)}
        )
        
    return doc

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db_session, get_current_user, require_manager_or_superadmin
from app.models.user import User, VerificationStatus
from app.services.verification_service import VerificationService
from app.services.files import FileService
from app.schemas.user import UserResponse

router = APIRouter()

# --- Client Endpoints ---

@router.post("/ine", status_code=202)
async def upload_ine_documents(
    ine_front: UploadFile = File(...),
    ine_back: UploadFile = File(...),
    ine_selfie: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Upload INE documents (front, back, selfie) for verification"""
    file_service = FileService(db)
    verification_service = VerificationService(db)
    
    # Upload files
    front_doc = await file_service.upload_file(
        ine_front, 
        current_user.id, 
        "ine_front", 
        is_public=False
    )
    
    back_doc = await file_service.upload_file(
        ine_back, 
        current_user.id, 
        "ine_back", 
        is_public=False
    )
    
    selfie_doc = await file_service.upload_file(
        ine_selfie, 
        current_user.id, 
        "ine_selfie", 
        is_public=False
    )
    
    # Update user status
    await verification_service.upload_ine_documents(
        current_user,
        front_doc.id,
        back_doc.id,
        selfie_doc.id
    )
    
    return {"message": "Documentos subidos exitosamente para revisión"}


# --- Admin Endpoints ---

@router.get("/pending", response_model=List[UserResponse])
async def get_pending_verifications(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(require_manager_or_superadmin)
):
    """Get list of users pending verification"""
    query = select(User).where(
        User.verification_status == VerificationStatus.pending_review
    )
    result = await db.execute(query)
    users = result.scalars().all()
    return users

@router.post("/{user_id}/approve")
async def approve_verification(
    user_id: str,
    notes: str = Form(None),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(require_manager_or_superadmin)
):
    """Approve user verification"""
    service = VerificationService(db)
    
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
        
    await service.approve_user(user, current_user.id, notes)
    return {"message": "Usuario verificado exitosamente"}

@router.post("/{user_id}/reject")
async def reject_verification(
    user_id: str,
    reason: str = Form(...),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(require_manager_or_superadmin)
):
    """Reject user verification"""
    service = VerificationService(db)
    
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
        
    await service.reject_user(user, reason, current_user.id)
    return {"message": "Verificación rechazada"}

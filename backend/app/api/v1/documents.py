import os
import uuid
import shutil
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db_session as get_db, get_current_user
from app.models.user import User
from app.models.client_document import ClientDocument, DocumentType

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    doc_type: DocumentType = Form(...),
    reservation_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a document (label, bond, tax info, etc.)
    """
    # Validate file type/size if needed (omitted for brevity, relying on frontend + basic checks)
    
    file_ext = file.filename.split(".")[-1]
    new_filename = f"{current_user.id}_{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, new_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
        
    # Create DB record
    new_doc = ClientDocument(
        client_id=current_user.id,
        reservation_id=uuid.UUID(reservation_id) if reservation_id else None,
        doc_type=doc_type,
        filename=file.filename,
        file_path=new_filename, # Store relative or absolute path as needed. Storing filename relative to UPLOAD_DIR is safer.
        is_approved=False # Default to unapproved
    )
    
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)
    
    return {
        "id": str(new_doc.id),
        "filename": new_doc.filename,
        "doc_type": new_doc.doc_type
    }

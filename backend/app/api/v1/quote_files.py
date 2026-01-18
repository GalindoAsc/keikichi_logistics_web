"""
API endpoints for quote file uploads (labels, bonds, etc.)
"""
import os
import shutil
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/quote-files", tags=["Quote Files"])

UPLOAD_DIR = "uploads/quote_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


class FileUploadResponse(BaseModel):
    file_path: str
    filename: str
    file_type: str


@router.post("/upload", response_model=FileUploadResponse)
async def upload_quote_file(
    file: UploadFile = File(...),
    file_type: str = Form(...),  # "label" or "bond"
    current_user: User = Depends(get_current_user)
):
    """
    Upload a file for a quote (label or bond document).
    Returns the file path to be stored in the quote.
    """
    # Validate file type parameter
    if file_type not in ["label", "bond"]:
        raise HTTPException(status_code=400, detail="file_type must be 'label' or 'bond'")
    
    # Validate file extension
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file to check size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    
    # Reset file position
    await file.seek(0)
    
    # Create user directory
    user_dir = os.path.join(UPLOAD_DIR, str(current_user.id), file_type)
    os.makedirs(user_dir, exist_ok=True)
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(user_dir, safe_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return FileUploadResponse(
        file_path=file_path,
        filename=file.filename or safe_filename,
        file_type=file_type
    )


@router.delete("/{file_type}/{filename}")
async def delete_quote_file(
    file_type: str,
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete an uploaded quote file.
    """
    if file_type not in ["label", "bond"]:
        raise HTTPException(status_code=400, detail="file_type must be 'label' or 'bond'")
    
    file_path = os.path.join(UPLOAD_DIR, str(current_user.id), file_type, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    os.remove(file_path)
    return {"message": "File deleted successfully"}

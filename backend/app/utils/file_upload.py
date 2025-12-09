import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import UploadFile, HTTPException

from app.config import settings


ALLOWED_EXTENSIONS = {
    'pdf': ['application/pdf'],
    'jpg': ['image/jpeg'],
    'jpeg': ['image/jpeg'],
    'png': ['image/png'],
    'xml': ['application/xml', 'text/xml']
}


def validate_file_type(filename: str, allowed_types: list[str]) -> bool:
    """
    Validate file extension against allowed types
    
    Args:
        filename: Name of the file
        allowed_types: List of allowed extensions (e.g. ['pdf', 'jpg', 'png'])
    
    Returns:
        True if valid, raises HTTPException if not
    """
    if not filename:
        raise HTTPException(status_code=400, detail="Nombre de archivo requerido")
    
    extension = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    
    if extension not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no permitido. Solo se permiten: {', '.join(allowed_types)}"
        )
    
    return True


async def save_upload_file(
    file: UploadFile,
    subdirectory: str,
    allowed_types: Optional[list[str]] = None
) -> str:
    """
    Save an uploaded file with a unique name
    
    Args:
        file: UploadFile from FastAPI
        subdirectory: Subdirectory within UPLOAD_DIR (e.g. 'payments', 'documents')
        allowed_types: List of allowed extensions, defaults to all supported types
    
    Returns:
        Relative path to saved file (e.g. 'payments/abc-123.pdf')
    
    Raises:
        HTTPException if file type not allowed or save fails
    """
    if allowed_types is None:
        allowed_types = list(ALLOWED_EXTENSIONS.keys())
    
    # Validate file type
    validate_file_type(file.filename, allowed_types)
    
    # Get file extension
    extension = file.filename.rsplit('.', 1)[-1].lower()
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}.{extension}"
    
    # Create full path
    upload_dir = Path(settings.upload_dir) / subdirectory
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = upload_dir / unique_filename
    
    # Save file
    try:
        with open(file_path, 'wb') as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al guardar archivo: {str(e)}"
        )
    
    # Return relative path
    relative_path = f"{subdirectory}/{unique_filename}"
    return relative_path


def delete_file(file_path: str) -> bool:
    """
    Delete a file from the uploads directory
    
    Args:
        file_path: Relative path to file (e.g. 'payments/abc-123.pdf')
    
    Returns:
        True if deleted, False if file doesn't exist
    """
    if not file_path:
        return False
    
    full_path = Path(settings.upload_dir) / file_path
    
    if full_path.exists() and full_path.is_file():
        try:
            full_path.unlink()
            return True
        except Exception:
            return False
    
    return False


def get_file_url(file_path: Optional[str]) -> Optional[str]:
    """
    Get full URL for a file
    
    Args:
        file_path: Relative path to file
    
    Returns:
        Full URL or None if no path provided
    """
    if not file_path:
        return None
    
    # In production, this could point to a CDN or static file server
    # For now, we'll use the backend URL
    base_url = settings.BACKEND_URL if hasattr(settings, 'BACKEND_URL') else "http://localhost:8000"
    return f"{base_url}/uploads/{file_path}"


def ensure_upload_directories():
    """
    Ensure all upload subdirectories exist
    Called at app startup
    """
    subdirs = ['payments', 'documents', 'invoices', 'tickets']
    
    for subdir in subdirs:
        dir_path = Path(settings.upload_dir) / subdir
        dir_path.mkdir(parents=True, exist_ok=True)

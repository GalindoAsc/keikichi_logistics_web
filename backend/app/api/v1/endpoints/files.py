import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/payments/{filename}")
async def get_payment_proof(filename: str):
    """
    Serve payment proof files
    """
    file_path = Path(settings.upload_dir) / "payments" / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(file_path)


@router.get("/{file_id}/content")
async def get_file_content(file_id: str):
    """
    Serve file content by ID
    """
    # Determine the correct upload directory
    upload_path = Path(settings.upload_dir)
    
    logger.debug(f"Requesting file_id: {file_id}, upload_path: {upload_path}")

    # Fallback for local development if /app/uploads doesn't exist
    if not upload_path.exists():
        # Try relative to current working directory
        cwd = Path.cwd()
        potential_paths = [
            cwd / "uploads",
            cwd / "backend" / "uploads",
            cwd.parent / "uploads"
        ]
        
        for path in potential_paths:
            if path.exists():
                upload_path = path
                logger.debug(f"Using fallback upload_path: {upload_path}")
                break

    # Search recursively for the file with this ID
    # We assume files are named {file_id}.{ext} or similar
    for file_path in upload_path.rglob(f"{file_id}.*"):
        if file_path.is_file():
            logger.debug(f"Found file: {file_path}")
            return FileResponse(file_path)
            
    logger.warning(f"File not found for ID: {file_id}")
            
    raise HTTPException(status_code=404, detail="File not found")

import shutil
from pathlib import Path
from uuid import UUID
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.client_document import ClientDocument, DocumentType
from app.config import settings
import uuid
import os

class FileService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upload_file(self, file: UploadFile, user_id: UUID, doc_type: str, is_public: bool = False) -> ClientDocument:
        # Create upload directory if it doesn't exist
        upload_dir = Path(settings.upload_dir) / "documents" / str(user_id)
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique ID for the document
        document_id = uuid.uuid4()
        
        # Generate filename using the same ID
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{document_id}{file_ext}"
        file_path = upload_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Create database record
        # Determine relative path for storage
        relative_path = f"documents/{user_id}/{unique_filename}"
        
        # Validate doc_type
        try:
            doc_type_enum = DocumentType(doc_type)
        except ValueError:
            doc_type_enum = DocumentType.otro
            
        document = ClientDocument(
            id=document_id,  # Explicitly set the ID
            client_id=user_id,
            doc_type=doc_type_enum,
            display_name=file.filename,
            filename=unique_filename,
            file_path=relative_path,
            is_approved=False
        )
        
        self.db.add(document)
        await self.db.commit()
        await self.db.refresh(document)
        
        return document

    async def get_file_path(self, file_id: UUID) -> Path:
        from sqlalchemy import select
        result = await self.db.execute(select(ClientDocument).where(ClientDocument.id == file_id))
        document = result.scalars().first()
        
        if not document:
            return None
            
        return Path(settings.upload_dir) / document.file_path

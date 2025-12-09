from datetime import datetime
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, VerificationStatus
from app.services.notification_service import notification_service
from app.services.whatsapp_service import whatsapp_service

class VerificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def _validate_files(self, file_ids: list[UUID]) -> bool:
        """
        Validate that files exist in database
        TODO: Implement actual file validation against ClientDocument table
        For now assuming they exist if IDs are provided
        """
        return True

    async def upload_ine_documents(
        self, 
        user: User, 
        front_file_id: UUID,
        back_file_id: UUID,
        selfie_file_id: UUID
    ) -> None:
        """Store all 3 INE documents and update status"""
        
        # Validate all 3 files exist
        await self._validate_files([front_file_id, back_file_id, selfie_file_id])
        
        user.ine_front_file_id = front_file_id
        user.ine_back_file_id = back_file_id
        user.ine_selfie_file_id = selfie_file_id
        user.verification_status = VerificationStatus.pending_review
        
        await self.db.commit()
        await self.db.refresh(user)
        
        # Notify admins
        await notification_service.notify_admins(
            "Nueva verificación pendiente",
            f"{user.full_name} subió documentos de identidad",
            f"/admin/verifications/{user.id}",
            "info"
        )
    
    async def approve_user(self, user: User, admin_id: UUID, notes: str = None) -> None:
        """Admin approves verification"""
        user.verification_status = VerificationStatus.verified
        user.is_verified = True  # Explicitly set verified flag
        user.verified_at = datetime.utcnow()
        user.verified_by = admin_id
        user.verification_notes = notes
        user.is_active = True  # Activate account
        
        await self.db.commit()
        await self.db.refresh(user)
        
        # Send notification
        contact = user.email or user.phone
        
        # In-app notification
        await notification_service.send_in_app(
            str(user.id),
            "¡Cuenta Verificada! ✓",
            "Tu identidad ha sido verificada. Ya puedes hacer reservaciones.",
            "/",
            "success"
        )
        
        # WhatsApp notification (if enabled and phone exists)
        if user.phone:
            await whatsapp_service.send_template(
                user.phone,
                "verification_approved",
                {"name": user.full_name}
            )
    
    async def reject_user(self, user: User, reason: str, admin_id: UUID) -> None:
        """Admin rejects verification"""
        user.verification_status = VerificationStatus.rejected
        user.rejection_reason = reason
        user.verified_by = admin_id
        
        await self.db.commit()
        await self.db.refresh(user)
        
        # Notify with specific reason
        await notification_service.send_in_app(
            str(user.id),
            "Documentos Rechazados",
            f"Motivo: {reason}. Por favor vuelve a subir tus documentos.",
            "/profile/verification",
            "error"
        )
        
        # WhatsApp notification (if enabled and phone exists)
        if user.phone:
            await whatsapp_service.send_template(
                user.phone,
                "verification_rejected",
                {"name": user.full_name, "reason": reason}
            )

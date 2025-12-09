"""
WhatsApp notification service - Placeholder for future implementation
Compatible providers: Twilio, MessageBird, Meta Business API, Wassenger
"""
from typing import Optional, Dict, Any

class WhatsAppService:
    def __init__(self):
        self.enabled = False  # Set to True when ready
        self.provider = None  # Will store provider client
    
    async def send_message(self, phone: str, message: str) -> bool:
        """Send WhatsApp message"""
        if not self.enabled:
            print(f"[WhatsApp Mock] To: {phone}, Message: {message}")
            return True
        
        # TODO: Implement with chosen provider
        # return await self.provider.send(phone, message)
        return False
    
    async def send_template(self, phone: str, template_name: str, params: Dict[str, Any]) -> bool:
        """Send WhatsApp template message (for notifications)"""
        if not self.enabled:
            print(f"[WhatsApp Mock] Template: {template_name}, To: {phone}, Params: {params}")
            return True
        
        # TODO: Implement template sending
        return False
    
    async def send_media(self, phone: str, media_url: str, caption: Optional[str] = None) -> bool:
        """Send media (PDF receipts, invoices, tickets)"""
        if not self.enabled:
            print(f"[WhatsApp Mock] Media: {media_url}, To: {phone}, Caption: {caption}")
            return True
        
        # TODO: Implement media sending
        return False

# Global instance
whatsapp_service = WhatsAppService()

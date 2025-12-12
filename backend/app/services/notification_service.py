import logging
from typing import List, Optional, Dict, Any
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from app.config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Email Configuration
conf = ConnectionConfig(
    MAIL_USERNAME=settings.mail_username,
    MAIL_PASSWORD=settings.mail_password,
    MAIL_FROM=settings.mail_from,
    MAIL_PORT=settings.mail_port,
    MAIL_SERVER=settings.mail_server,
    MAIL_FROM_NAME=settings.mail_from_name,
    MAIL_STARTTLS=settings.mail_starttls,
    MAIL_SSL_TLS=settings.mail_ssl_tls,
    USE_CREDENTIALS=settings.use_credentials,
    VALIDATE_CERTS=settings.validate_certs
)

class NotificationService:
    def __init__(self):
        self.fastmail = FastMail(conf)

    async def send_email(
        self, 
        subject: str, 
        recipients: List[EmailStr], 
        body: str, 
        subtype: MessageType = MessageType.html
    ):
        """
        Send an email using FastAPI-Mail
        """
        message = MessageSchema(
            subject=subject,
            recipients=recipients,
            body=body,
            subtype=subtype
        )
        
        try:
            await self.fastmail.send_message(message)
            logger.info(f"Email sent to {recipients}")
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            # Don't raise exception to avoid blocking main flow, just log it
            # In production, you might want to queue this or handle it more robustly

    async def send_whatsapp(self, phone: str, message: str):
        """
        Send a WhatsApp message (Placeholder)
        """
        # Integration with Twilio or Meta API would go here
        # For now, we just log it as requested
        logger.info(f"WHATSAPP to {phone}: {message}")
        print(f"WHATSAPP to {phone}: {message}")

    async def send_in_app(self, user_id: str, title: str, message: str, link: str = None, type: str = "info"):
        """
        Save notification to DB and send via WebSocket
        """
        from app.database import AsyncSessionLocal
        from app.models.notification import Notification, NotificationType
        from app.api.v1.endpoints.notifications import manager
        
        # Save to DB
        try:
            print(f"[NOTIFICATION] Attempting to save notification for user {user_id}: {title}")
            async with AsyncSessionLocal() as db:
                notification = Notification(
                    user_id=user_id,
                    title=title,
                    message=message,
                    link=link,
                    type=type
                )
                db.add(notification)
                await db.commit()
                print(f"[NOTIFICATION] Successfully saved to DB with ID: {notification.id}")
                
        except Exception as e:
            print(f"[NOTIFICATION] CRITICAL ERROR saving to DB: {e}")
            import traceback
            traceback.print_exc()

        # Send via WebSocket
        try:
            payload = {
                "type": "NOTIFICATION",
                "payload": {
                    "title": title,
                    "message": message,
                    "link": link,
                    "type": type
                }
            }
            await manager.send_personal_message(payload, str(user_id))
            print(f"[NOTIFICATION] WebSocket message sent to {user_id}")
        except Exception as e:
            print(f"[NOTIFICATION] WebSocket error: {e}")

    async def send_data_update(self, user_id: str, event: str, data: Dict[str, Any] = None):
        """
        Send a silent data update event via WebSocket
        """
        from app.api.v1.endpoints.notifications import manager
        
        payload = {
            "type": "DATA_UPDATE",
            "event": event,
            "data": data or {}
        }
        await manager.send_personal_message(payload, str(user_id))

    async def notify_reservation_created(self, reservation, client):
        """
        Notify client and admin about new reservation
        """
        # Email to Client
        subject = f"Confirmación de Reservación #{str(reservation.id)[:8]}"
        body = f"""
        <h1>¡Gracias por tu reservación, {client.full_name}!</h1>
        <p>Hemos recibido tu solicitud de reservación.</p>
        <p><strong>ID:</strong> {reservation.id}</p>
        <p><strong>Total:</strong> ${reservation.total_amount}</p>
        <p>Por favor, realiza tu pago y sube el comprobante en la plataforma.</p>
        <br>
        <p>Atentamente,<br>Equipo Keikichi Logistics</p>
        """
        await self.send_email(subject, [client.email], body)

        # WhatsApp to Client (Placeholder)
        if client.phone:
            wa_msg = f"Hola {client.full_name}, tu reservación {str(reservation.id)[:8]} ha sido creada. Total: ${reservation.total_amount}. Sube tu comprobante en la web."
            await self.send_whatsapp(client.phone, wa_msg)
            
        # In-App to Client
        await self.send_in_app(
            str(client.id), 
            "Reservación Creada", 
            f"Tu reservación #{str(reservation.id)[:8]} ha sido creada exitosamente.",
            f"/reservations",
            "success"
        )

        # Email to Admin
        admin_subject = f"Nueva Reservación: {str(reservation.id)[:8]}"
        admin_body = f"""
        <h1>Nueva Reservación Recibida</h1>
        <p><strong>Cliente:</strong> {client.full_name} ({client.email})</p>
        <p><strong>ID:</strong> {reservation.id}</p>
        <p><strong>Total:</strong> ${reservation.total_amount}</p>
        """
        await self.send_email(admin_subject, [settings.default_admin_email], admin_body)
        
        # In-App to Admin (Need to find admin ID, for now skipping or broadcasting if we had a broadcast method)
        # Assuming we want to notify the default admin if they are logged in
        # We would need to look up admin users. For simplicity, we'll skip DB lookup here to avoid circular deps complexity
        # unless we pass admin user to this method.

    async def notify_payment_approved(self, reservation, client):
        """
        Notify client about payment approval
        """
        subject = f"Pago Aprobado - Reservación #{str(reservation.id)[:8]}"
        body = f"""
        <h1>¡Pago Confirmado!</h1>
        <p>Hola {client.full_name},</p>
        <p>Tu pago para la reservación <strong>{str(reservation.id)[:8]}</strong> ha sido aprobado.</p>
        <p>Ya puedes descargar tu ticket de abordaje en la plataforma.</p>
        <br>
        <p>Atentamente,<br>Equipo Keikichi Logistics</p>
        """
        await self.send_email(subject, [client.email], body)

        if client.phone:
            wa_msg = f"Tu pago para la reservación {str(reservation.id)[:8]} ha sido aprobado. Descarga tu ticket en la web."
            await self.send_whatsapp(client.phone, wa_msg)
            
        # In-App to Client
        await self.send_in_app(
            str(client.id), 
            "Pago Aprobado", 
            f"Tu pago para la reservación #{str(reservation.id)[:8]} ha sido aprobado.",
            f"/reservations",
            "success"
        )

    async def notify_reservation_cancelled(self, reservation, client):
        """
        Notify client about cancellation
        """
        subject = f"Reservación Cancelada #{str(reservation.id)[:8]}"
        body = f"""
        <h1>Reservación Cancelada</h1>
        <p>Hola {client.full_name},</p>
        <p>Tu reservación <strong>{str(reservation.id)[:8]}</strong> ha sido cancelada.</p>
        <p>Si crees que esto es un error, por favor contáctanos.</p>
        <br>
        <p>Atentamente,<br>Equipo Keikichi Logistics</p>
        """
        await self.send_email(subject, [client.email], body)
        
        # In-App to Client
        await self.send_in_app(
            str(client.id), 
            "Reservación Cancelada", 
            f"Tu reservación #{str(reservation.id)[:8]} ha sido cancelada.",
            f"/reservations",
            "error"
        )

    async def notify_trip_created(self, trip, admins_only: bool = False):
        """
        Notify about new trip creation
        """
        from app.database import AsyncSessionLocal
        from app.models.user import User, UserRole
        from sqlalchemy import select
        
        title = "Nuevo Viaje Disponible"
        message = f"Viaje {trip.origin} → {trip.destination} - Salida: {trip.departure_date.strftime('%d/%m/%Y')}"
        link = f"/admin/trips/{trip.id}"
        
        # Notify admins
        await self.notify_admins(title, message, link, "info")
        
        # Notify all clients if not admin-only
        if not admins_only:
            async with AsyncSessionLocal() as db:
                query = select(User).where(User.role == UserRole.client, User.is_active == True)
                result = await db.execute(query)
                clients = result.scalars().all()
                
                for client in clients:
                    await self.send_in_app(
                        str(client.id),
                        title,
                        message,
                        f"/trips/{trip.id}",
                        "info"
                    )

    async def notify_trip_updated(self, trip, affected_user_ids: list = None):
        """
        Notify users about trip updates
        """
        title = "Viaje Modificado"
        message = f"El viaje {trip.origin} → {trip.destination} ha sido actualizado"
        
        # If specific users affected, notify them
        if affected_user_ids:
            for user_id in affected_user_ids:
                await self.send_in_app(
                    str(user_id),
                    title,
                    message,
                    f"/trips/{trip.id}",
                    "warning"
                )
        
        # Always notify admins
        await self.notify_admins(title, message, f"/admin/trips/{trip.id}", "info")

    async def notify_trip_cancelled(self, trip, affected_user_ids: list = None):
        """
        Notify about trip cancellation
        """
        from app.database import AsyncSessionLocal
        from app.models.user import User, UserRole
        from sqlalchemy import select
        
        title = "Viaje Cancelado"
        message = f"El viaje {trip.origin} → {trip.destination} ha sido cancelado"
        
        # Notify affected users (those with reservations)
        if affected_user_ids:
            for user_id in affected_user_ids:
                await self.send_in_app(
                    str(user_id),
                    title,
                    f"{message}. Tu reservación será reembolsada.",
                    "/reservations",
                    "error"
                )
        else:
            # No reservations - notify all clients about trip removal
            async with AsyncSessionLocal() as db:
                query = select(User).where(User.role == UserRole.client, User.is_active == True)
                result = await db.execute(query)
                clients = result.scalars().all()
                
                for client in clients:
                    await self.send_in_app(
                        str(client.id),
                        title,
                        f"{message}. Ya no está disponible para reservar.",
                        "/trips",
                        "warning"
                    )
        
        # Notify admins
        await self.notify_admins(title, message, f"/admin/trips/{trip.id}", "warning")

    async def notify_payment_pending(self, reservation, client):
        """
        Notify admins about payment pending review
        """
        title = "Pago Pendiente de Revisión"
        message = f"Nuevo comprobante de pago de {client.full_name} - Reservación #{str(reservation.id)[:8]}"
        
        await self.notify_admins(
            title,
            message,
            f"/admin/reservations?id={reservation.id}",
            "info"
        )

    async def notify_payment_rejected(self, reservation, client, reason: str = None):
        """
        Notify client about payment rejection
        """
        title = "Pago Rechazado"
        message = f"Tu comprobante de pago para la reservación #{str(reservation.id)[:8]} ha sido rechazado."
        if reason:
            message += f" Motivo: {reason}"
        message += " Por favor, sube un nuevo comprobante."
        
        await self.send_in_app(
            str(client.id),
            title,
            message,
            "/reservations",
            "error"
        )
        
        # Also send email
        subject = f"Pago Rechazado - Reservación #{str(reservation.id)[:8]}"
        body = f"""
        <h1>Pago Rechazado</h1>
        <p>Hola {client.full_name},</p>
        <p>{message}</p>
        <br>
        <p>Atentamente,<br>Equipo Keikichi Logistics</p>
        """
        await self.send_email(subject, [client.email], body)

    async def notify_space_available(self, trip):
        """
        Notify all clients about newly available spaces
        """
        from app.database import AsyncSessionLocal
        from app.models.user import User, UserRole
        from app.models.waitlist import Waitlist
        from sqlalchemy import select
        
        title = "Espacios Disponibles"
        message = f"Nuevos espacios en {trip.origin} → {trip.destination} - {trip.departure_date.strftime('%d/%m/%Y')}"
        
        async with AsyncSessionLocal() as db:
            # 1. Check Waitlist first
            waitlist_stmt = select(Waitlist).where(Waitlist.trip_id == trip.id).order_by(Waitlist.created_at)
            waitlist_result = await db.execute(waitlist_stmt)
            waitlist_entries = waitlist_result.scalars().all()
            
            if waitlist_entries:
                # Notify only waitlisted users
                print(f"Notifying {len(waitlist_entries)} users on waitlist for trip {trip.id}")
                for entry in waitlist_entries:
                    await self.send_in_app(
                        str(entry.user_id),
                        title,
                        f"¡Buenas noticias! Se han liberado espacios en el viaje que esperabas: {trip.origin} → {trip.destination}. ¡Reserva ahora!",
                        f"/trips/{trip.id}",
                        "success"
                    )
                    # We could verify if they have email/phone here too
            else:
                # 2. No waitlist? Notify everyone (Broadcast)
                # Only if it makes sense to spam everyone. Maybe limit this?
                # For now, keeping original logic: Notify all active clients
                query = select(User).where(User.role == UserRole.client, User.is_active == True)
                result = await db.execute(query)
                clients = result.scalars().all()
                
                for client in clients:
                    await self.send_in_app(
                        str(client.id),
                        title,
                        message,
                        f"/trips/{trip.id}",
                        "success"
                    )

    async def notify_account_verified(self, user):
        """
        Notify user their account has been verified
        """
        title = "Cuenta Verificada"
        message = "¡Tu cuenta ha sido verificada! Ya puedes hacer reservaciones."
        
        await self.send_in_app(
            str(user.id),
            title,
            message,
            "/",
            "success"
        )

    async def notify_admins(self, title: str, message: str, link: str = None, type: str = "info"):
        """
        Notify all admins and managers
        """
        from app.database import AsyncSessionLocal
        from app.models.user import User, UserRole
        from sqlalchemy import select, or_
        
        async with AsyncSessionLocal() as db:
            # Find all admins and managers
            query = select(User).where(
                or_(
                    User.role == UserRole.superadmin,
                    User.role == UserRole.manager
                )
            )
            result = await db.execute(query)
            admins = result.scalars().all()
            
            for admin in admins:
                await self.send_in_app(
                    user_id=str(admin.id),
                    title=title,
                    message=message,
                    link=link,
                    type=type
                )

    async def notify_new_user(self, user):
        """
        Notify admins about a new user registration
        """
        title = "Nuevo Usuario Registrado"
        message = f"El usuario {user.full_name} ({user.email or user.phone}) se ha registrado."
        link = "/admin/users"
        
        await self.notify_admins(title, message, link, "info")

    async def notify_payment_deadline_expired(self, reservation, client):
        """
        Notify client that their reservation was cancelled due to non-payment
        """
        title = "Reservación Cancelada (Plazo Vencido)"
        message = f"El plazo de pago para tu reservación #{str(reservation.id)[:8]} ha vencido. Los espacios han sido liberados."
        
        await self.send_in_app(
            str(client.id),
            title,
            message,
            "/reservations",
            "error"
        )
        
        # Email
        subject = f"Reservación Cancelada - Plazo de Pago Vencido #{str(reservation.id)[:8]}"
        body = f"""
        <h1>Plazo de Pago Vencido</h1>
        <p>Hola {client.full_name},</p>
        <p>Lamentamos informarte que el plazo para realizar el pago de tu reservación <strong>{str(reservation.id)[:8]}</strong> ha vencido.</p>
        <p>Tu reservación ha sido cancelada automáticamente y los espacios han sido liberados.</p>
        <p>Si deseas viajar, por favor realiza una nueva reservación.</p>
        <br>
        <p>Atentamente,<br>Equipo Keikichi Logistics</p>
        """
        await self.send_email(subject, [client.email], body)

    async def notify_trip_status_changed(self, trip, status, affected_user_ids: list = None):
        """
        Notify users about trip status changes (e.g. Departed, Arrived)
        """
        # Map status to friendly message
        status_messages = {
            "scheduled": "El viaje ha sido programado.",
            "boarding": "¡El abordaje ha comenzado! Por favor preséntate en el punto de encuentro.",
            "in_transit": "El viaje ha comenzado y está en tránsito.",
            "arrived": "El viaje ha llegado a su destino.",
            "completed": "El viaje ha sido completado. ¡Gracias por viajar con nosotros!",
            "cancelled": "El viaje ha sido cancelado."
        }
        
        # Determine status string (handle enum or string)
        status_val = status.value if hasattr(status, 'value') else str(status)
        status_msg = status_messages.get(status_val, f"El estado del viaje ha cambiado a: {status_val}")
        
        title = f"Actualización de Viaje: {trip.origin} → {trip.destination}"
        
        # 1. Notify affected passengers (priority)
        if affected_user_ids:
            for user_id in affected_user_ids:
                await self.send_in_app(
                    str(user_id),
                    title,
                    status_msg,
                    f"/reservations", # Direct them to reservations to see details
                    "info"
                )
        
        # 2. Notify admins
        await self.notify_admins(
            "Estado de Viaje Actualizado",
            f"Viaje {trip.origin} → {trip.destination} cambió a: {status_val}",
            f"/admin/trips/{trip.id}",
            "info"
        )


notification_service = NotificationService()

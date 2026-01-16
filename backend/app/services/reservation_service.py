from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, UploadFile
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.core.exceptions import NotFoundException, ConflictException, ForbiddenException
from app.models.space import Space, SpaceStatus
from app.models.trip import Trip
from app.models.reservation import Reservation, ReservationStatus, PaymentStatus, PaymentMethod
from app.models.reservation_space import ReservationSpace
from app.models.user import User, UserRole
from app.schemas.reservation import (
    ReservationCreate,
    ReservationUpdate,
    PriceCalculation,
    ReservationListItem,
)
from app.utils.file_upload import save_upload_file, delete_file
from app.utils.pdf_generator import generate_reservation_ticket


class ReservationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def check_spaces_availability(
        self,
        trip_id: UUID,
        space_ids: List[UUID],
        user_id: Optional[UUID] = None
    ) -> bool:
        """
        Check if all spaces are available for reservation.
        Allows spaces that are ON_HOLD by the same user.
       
        Raises HTTPException if any space is not available
        """
        stmt = select(Space).where(
            and_(
                Space.trip_id == trip_id,
                Space.id.in_(space_ids)
            )
        )
        result = await self.db.execute(stmt)
        spaces = list(result.scalars().all())

        # Check trip date
        trip_stmt = select(Trip).where(Trip.id == trip_id)
        trip_result = await self.db.execute(trip_stmt)
        trip = trip_result.scalars().first()
        
        if not trip:
             raise NotFoundException("Viaje no encontrado")
             
        today = datetime.utcnow().date()
        if trip.departure_date < today:
             raise ConflictException("Este viaje ya ha pasado y no se pueden hacer reservaciones.")

        if len(spaces) != len(space_ids):
            raise NotFoundException("Algunos espacios no existen")

        unavailable = []
        for s in spaces:
            if s.status == SpaceStatus.available:
                continue
            
            # If space is on hold, check if it belongs to the current user
            if s.status == SpaceStatus.on_hold and user_id and s.held_by == user_id:
                # Check if hold is expired
                if s.hold_expires_at and s.hold_expires_at > datetime.now():
                    continue
            
            unavailable.append(s)

        if unavailable:
            numbers = [s.space_number for s in unavailable]
            raise ConflictException(
                f"Los siguientes espacios no están disponibles: {', '.join(map(str, numbers))}"
            )

        return True

    async def create_hold(
        self,
        user_id: UUID,
        trip_id: UUID,
        space_ids: List[UUID]
    ) -> dict:
        """
        Create a temporary hold on spaces
       
        Spaces are locked for SPACE_HOLD_MINUTES minutes
        """
        # Load trip to check max_spaces_per_client
        trip_stmt = select(Trip).where(Trip.id == trip_id)
        trip_result = await self.db.execute(trip_stmt)
        trip = trip_result.scalars().first()
        
        if not trip:
            raise NotFoundException("Viaje no encontrado")
        
        # Check max_spaces_per_client limit
        if trip.max_spaces_per_client:
            # Count spaces this client already has (on_hold or reserved)
            existing_spaces_stmt = select(func.count(Space.id)).where(
                and_(
                    Space.trip_id == trip_id,
                    or_(
                        and_(Space.status == SpaceStatus.on_hold, Space.held_by == user_id),
                        and_(
                            Space.status == SpaceStatus.reserved,
                            Space.id.in_(
                                select(ReservationSpace.space_id).join(
                                    Reservation,
                                    ReservationSpace.reservation_id == Reservation.id
                                ).where(
                                    Reservation.client_id == user_id,
                                    Reservation.status != ReservationStatus.cancelled
                                )
                            )
                        )
                    )
                )
            )
            existing_count = await self.db.scalar(existing_spaces_stmt) or 0
            
            # Check if new selection would exceed limit
            new_total = existing_count + len(space_ids)
            if new_total > trip.max_spaces_per_client:
                raise ConflictException(
                    f"Límite de espacios por cliente: máximo {trip.max_spaces_per_client}. "
                    f"Ya tienes {existing_count} espacio(s) en este viaje."
                )
        
        # Lock spaces for update to prevent race conditions
        stmt = select(Space).where(Space.id.in_(space_ids)).with_for_update()
        result = await self.db.execute(stmt)
        spaces = list(result.scalars().all())

        if len(spaces) != len(space_ids):
            raise NotFoundException("Algunos espacios no existen")

        hold_expires_at = datetime.now() + timedelta(minutes=settings.space_hold_minutes)

        for space in spaces:
            # Re-check availability under lock
            if space.status != SpaceStatus.available:
                # Allow re-holding if it's already held by SAME user and not expired
                is_rehold = (
                    space.status == SpaceStatus.on_hold and 
                    space.held_by == user_id and 
                    space.hold_expires_at and 
                    space.hold_expires_at > datetime.now()
                )
                if not is_rehold:
                    raise ConflictException(f"El espacio {space.space_number} ya no está disponible")

            space.status = SpaceStatus.on_hold
            space.held_by = user_id
            space.hold_expires_at = hold_expires_at

        await self.db.commit()

        return {
            "message": "Espacios reservados temporalmente",
            "trip_id": str(trip_id),
            "space_ids": [str(sid) for sid in space_ids],
            "spaces_count": len(space_ids),
            "hold_expires_at": hold_expires_at,
            "expires_in_minutes": settings.space_hold_minutes
        }

    async def release_hold(self, space_ids: List[UUID]) -> None:
        """Release hold on spaces"""
        stmt = select(Space).where(Space.id.in_(space_ids))
        result = await self.db.execute(stmt)
        spaces = list(result.scalars().all())

        for space in spaces:
            if space.status == SpaceStatus.on_hold:
                space.status = SpaceStatus.available
                space.held_by = None
                space.hold_expires_at = None

        await self.db.commit()

    async def calculate_pricing(
        self,
        trip: Trip,
        num_spaces: int,
        discount_amount: Optional[Decimal] = None
    ) -> PriceCalculation:
        """
        Calculate pricing breakdown for reservation
        """
        price_per_space = trip.price_per_space
        subtotal = price_per_space * num_spaces

        # Apply discount
        discount = discount_amount or Decimal(0)
        subtotal_after_discount = subtotal - discount

        # Calculate tax
        if trip.tax_included:
            # Tax is already included in price
            tax_rate = trip.tax_rate
            tax_amount = subtotal_after_discount * tax_rate / (1 + tax_rate)
        else:
            # Tax needs to be added
            tax_amount = subtotal_after_discount * trip.tax_rate

        total_amount = subtotal_after_discount if trip.tax_included else subtotal_after_discount + tax_amount

        return PriceCalculation(
            subtotal=subtotal,
            tax_amount=tax_amount,
            discount_amount=discount,
            total_amount=total_amount,
            spaces_count=num_spaces,
            price_per_space=price_per_space,
            tax_rate=trip.tax_rate,
            tax_included=trip.tax_included
        )

    async def create_reservation(
        self,
        user_id: UUID,
        data: ReservationCreate
    ) -> Reservation:
        """
        Create reservation from existing hold
        """
        # Convert string IDs to UUID objects
        trip_id_uuid = UUID(data.trip_id) if isinstance(data.trip_id, str) else data.trip_id
        space_ids_uuid = [UUID(sid) if isinstance(sid, str) else sid for sid in data.space_ids]
        
        # Get trip
        trip_stmt = select(Trip).where(Trip.id == trip_id_uuid)
        trip_result = await self.db.execute(trip_stmt)
        trip = trip_result.scalars().first()

        if not trip:
            raise NotFoundException("Viaje no encontrado")

        # Verify user has hold on these spaces
        spaces_stmt = select(Space).where(
            and_(
                Space.id.in_(space_ids_uuid),
                Space.status == SpaceStatus.on_hold,
                Space.held_by == user_id,
                Space.hold_expires_at.is_not(None)  # Critical: Only allow converting temporary holds
            )
        )
        spaces_result = await self.db.execute(spaces_stmt)
        spaces = list(spaces_result.scalars().all())

        if len(spaces) != len(space_ids_uuid):
            raise ConflictException(
                "No tienes un hold activo en todos los espacios seleccionados. El hold pudo haber expirado."
            )

        # Calculate base pricing
        pricing = await self.calculate_pricing(trip, len(space_ids_uuid), data.discount_amount)
        
        # Load system config for extra costs
        from app.models.system_config import SystemConfig
        config_stmt = select(SystemConfig)
        config_result = await self.db.execute(config_stmt)
        config_result = await self.db.execute(config_stmt)
        configs = {}
        for c in config_result.scalars().all():
            try:
                configs[c.key] = Decimal(c.value)
            except:
                continue # Skip non-numeric config values for pricing
        
        # Calculate extra costs
        extra_costs = Decimal(0)
        
        # 1. Labeling (per-item)
        for item in data.items:
            if item.labeling_required and item.label_quantity:
                # Determine price based on dimensions (simplified logic)
                price_key = f"price_label_{item.label_dimensions}" if item.label_dimensions else "price_label_1x1"
                price_per_label = configs.get(price_key, configs.get("price_label_1x1", Decimal(1)))
                extra_costs += price_per_label * item.label_quantity
        
        # 2. Bond Service
        if data.is_international and not data.use_own_bond:
             extra_costs += configs.get("price_bond_service", Decimal(500))
             
        # 3. Pickup Service
        if data.request_pickup:
            # Use trip-specific cost if set, otherwise fallback to system config
            pickup_cost = trip.pickup_cost if trip.pickup_cost is not None else configs.get("price_pickup_service", Decimal(300))
            extra_costs += pickup_cost
            
        # Update totals
        pricing.subtotal += extra_costs
        # Recalculate tax if needed (assuming extra services are taxed same way)
        if not trip.tax_included:
            pricing.tax_amount = (pricing.subtotal - pricing.discount_amount) * trip.tax_rate
        else:
             # If tax included, we might need to back-calculate or just add tax on top for services?
             # For simplicity, assuming services follow trip tax rule.
             # If trip tax included, services price is gross.
             pass
             
        pricing.total_amount = pricing.subtotal + pricing.tax_amount - pricing.discount_amount

        # Calculate legacy fields from items
        total_weight = sum(item.total_weight for item in data.items)
        
        # Create summary description
        item_summaries = [f"{item.box_count}x {item.product_name}" for item in data.items]
        description = ", ".join(item_summaries)
            
        primary_type = data.items[0].product_name if data.items else "General"

        # Create reservation
        reservation = Reservation(
            client_id=user_id,
            trip_id=trip_id_uuid,
            status=ReservationStatus.pending,
            payment_method=data.payment_method,
            payment_status=PaymentStatus.unpaid,
            subtotal=pricing.subtotal,
            tax_amount=pricing.tax_amount,
            total_amount=pricing.total_amount,
            discount_amount=pricing.discount_amount,
            discount_reason=data.discount_reason,
            requires_invoice=data.requires_invoice,
            
            # New fields
            is_international=data.is_international,
            use_own_bond=data.use_own_bond,
            bond_file_id=data.bond_file_id,
            request_pickup=data.request_pickup,
            pickup_details=data.pickup_details
        )

        self.db.add(reservation)
        await self.db.flush()

        # Create LoadItems
        from app.models.load_item import LoadItem
        for item_data in data.items:
            load_item = LoadItem(
                reservation_id=reservation.id,
                product_name=item_data.product_name,
                box_count=item_data.box_count,
                total_weight=item_data.total_weight,
                weight_unit=item_data.weight_unit,
                packaging_type=item_data.packaging_type,
                services=item_data.services,
                space_id=item_data.space_id
            )
            self.db.add(load_item)

        # Create reservation_spaces associations
        for space in spaces:
            res_space = ReservationSpace(
                reservation_id=reservation.id,
                space_id=space.id
            )
            self.db.add(res_space)

            # Keep space as on_hold (not reserved) until payment is confirmed
            # This prevents showing red spaces for unpaid reservations
            space.status = SpaceStatus.on_hold
            space.held_by = user_id
            space.hold_expires_at = None  # No expiration for reservation holds
            
        # Update User Billing Info if provided
        if data.requires_invoice and data.invoice_data_id:
             # Logic to link invoice data or update user profile could go here
             # For now, assuming frontend handles profile update separately or we just use what's in User
             pass

        await self.db.commit()
        await self.db.refresh(reservation)

        # Send Notification
        try:
            from app.services.notification_service import notification_service
            from app.models.user import User
            client_stmt = select(User).where(User.id == user_id)
            client_result = await self.db.execute(client_stmt)
            client = client_result.scalars().first()
            if client:
                await notification_service.notify_reservation_created(reservation, client)
        except Exception as e:
            # Log error but don't fail the request
            print(f"Failed to send notification: {e}")

        return reservation
        return reservation

    async def create_admin_reservation(
        self,
        admin_user: User,
        data: "ReservationCreateAdmin"
    ) -> Reservation:
        """
        Create reservation as admin (bypassing payment and strict validation)
        """
        # Get trip
        trip_stmt = select(Trip).where(Trip.id == data.trip_id)
        trip_result = await self.db.execute(trip_stmt)
        trip = trip_result.scalars().first()

        if not trip:
            raise NotFoundException("Viaje no encontrado")

        # Verify spaces availability (ignoring holds for now, or respecting them?)
        # For admin, we should probably respect existing reservations but override holds if needed?
        # Let's stick to standard availability check for safety
        await self.check_spaces_availability(UUID(data.trip_id), [UUID(sid) for sid in data.space_ids])

        # Determine client
        client_id = UUID(data.client_id) if data.client_id else admin_user.id

        # Calculate pricing (standard calculation, though it will be marked paid)
        pricing = await self.calculate_pricing(trip, len(data.space_ids))

        # Create reservation
        reservation = Reservation(
            client_id=client_id,
            trip_id=UUID(data.trip_id),
            status=ReservationStatus.confirmed, # Auto-confirmed
            payment_method=PaymentMethod.cash, # Default to cash/internal
            payment_status=PaymentStatus.paid, # Auto-paid
            subtotal=pricing.subtotal,
            tax_amount=pricing.tax_amount,
            total_amount=pricing.total_amount,
            discount_amount=Decimal(0),
            discount_reason=data.notes or "Reservación Interna / Admin",
            requires_invoice=False,
            is_international=False,
            use_own_bond=False,
            request_pickup=False
        )

        self.db.add(reservation)
        await self.db.flush()

        # Create LoadItems (Optional)
        from app.models.load_item import LoadItem
        if data.items:
            for item_data in data.items:
                load_item = LoadItem(
                    reservation_id=reservation.id,
                    product_name=item_data.product_name,
                    box_count=item_data.box_count,
                    total_weight=item_data.total_weight,
                    weight_unit=item_data.weight_unit,
                    packaging_type=item_data.packaging_type,
                    services=item_data.services,
                    space_id=item_data.space_id
                )
                self.db.add(load_item)
        else:
            # Create a dummy item if none provided
            load_item = LoadItem(
                reservation_id=reservation.id,
                product_name="Carga General (Admin)",
                box_count=1,
                total_weight=1.0,
                weight_unit="kg"
            )
            self.db.add(load_item)

        # Create reservation_spaces associations
        # We need to fetch space objects first
        spaces_stmt = select(Space).where(Space.id.in_([UUID(sid) for sid in data.space_ids]))
        spaces_result = await self.db.execute(spaces_stmt)
        spaces = list(spaces_result.scalars().all())

        for space in spaces:
            res_space = ReservationSpace(
                reservation_id=reservation.id,
                space_id=space.id
            )
            self.db.add(res_space)

            # Mark space as reserved immediately
            space.status = SpaceStatus.reserved
            space.held_by = None
            space.hold_expires_at = None
            
        await self.db.commit()
        await self.db.refresh(reservation)

        return reservation
    async def get_reservation_by_id(
        self,
        reservation_id: UUID,
        user: User
    ) -> Optional[Reservation]:
        """
        Get reservation by ID with permission check
        """
        stmt = select(Reservation).where(Reservation.id == reservation_id)
        result = await self.db.execute(stmt)
        reservation = result.scalars().first()

        if not reservation:
            raise NotFoundException("Reservación no encontrada")

        # Check permissions
        if user.role == UserRole.client and reservation.client_id != user.id:
            raise ForbiddenException("No tienes permiso para ver esta reservación")

        return reservation

    async def get_user_reservations(
        self,
        user_id: UUID,
        status: Optional[ReservationStatus] = None,
        payment_status: Optional[PaymentStatus] = None,
        skip: int = 0,
        limit: int = 20
    ) -> List[Reservation]:
        """
        Get reservations for a specific user
        """
        stmt = select(Reservation).where(Reservation.client_id == user_id)

        if status:
            stmt = stmt.where(Reservation.status == status)
        if payment_status:
            stmt = stmt.where(Reservation.payment_status == payment_status)

        stmt = stmt.order_by(Reservation.created_at.desc())
        stmt = stmt.offset(skip).limit(limit)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_all_reservations(
        self,
        trip_id: Optional[UUID] = None,
        client_id: Optional[UUID] = None,
        status: Optional[ReservationStatus] = None,
        payment_status: Optional[PaymentStatus] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[Reservation]:
        """
        Get all reservations with filters (admin/manager only)
        """
        stmt = select(Reservation)

        if trip_id:
            stmt = stmt.where(Reservation.trip_id == trip_id)
        if client_id:
            stmt = stmt.where(Reservation.client_id == client_id)
        if status:
            stmt = stmt.where(Reservation.status == status)
        if payment_status:
            stmt = stmt.where(Reservation.payment_status == payment_status)

        stmt = stmt.order_by(Reservation.created_at.desc())
        stmt = stmt.offset(skip).limit(limit)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def count_reservations(
        self,
        user_id: Optional[UUID] = None,
        trip_id: Optional[UUID] = None,
        status: Optional[ReservationStatus] = None,
        payment_status: Optional[PaymentStatus] = None
    ) -> int:
        """Count reservations with filters"""
        stmt = select(func.count(Reservation.id))

        if user_id:
            stmt = stmt.where(Reservation.client_id == user_id)
        if trip_id:
            stmt = stmt.where(Reservation.trip_id == trip_id)
        if status:
            stmt = stmt.where(Reservation.status == status)
        if payment_status:
            stmt = stmt.where(Reservation.payment_status == payment_status)

        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def update_reservation(
        self,
        reservation_id: UUID,
        user: User,
        data: ReservationUpdate
    ) -> Reservation:
        """
        Update reservation (only before payment)
        """
        reservation = await self.get_reservation_by_id(reservation_id, user)

        # Only client who owns the reservation can update
        if user.role == UserRole.client and reservation.client_id != user.id:
            raise ForbiddenException("No puedes modificar esta reservación")

        # Can only update if pending
        if reservation.status != ReservationStatus.pending:
            raise ConflictException("Solo puedes modificar reservaciones pendientes")

        # Update fields
        # Note: cargo fields are derived from items, not directly updatable
        if data.requires_invoice is not None:
            reservation.requires_invoice = data.requires_invoice
        
        if data.payment_method is not None:
            # Only allow changing payment method if not yet paid
            if reservation.payment_status != PaymentStatus.unpaid:
                raise ConflictException("No puedes cambiar el método de pago después de pagar")
            reservation.payment_method = data.payment_method

        await self.db.commit()
        await self.db.refresh(reservation)

        return reservation

    async def cancel_reservation(
        self,
        reservation_id: UUID,
        user: User,
        reason: Optional[str] = None
    ) -> None:
        """
        Cancel reservation and release spaces
        """
        from datetime import datetime
        
        reservation = await self.get_reservation_by_id(reservation_id, user)

        # Check permissions
        is_admin = user.role in [UserRole.superadmin, UserRole.manager]
        is_owner = reservation.client_id == user.id

        if not (is_admin or is_owner):
            raise ForbiddenException("No tienes permiso para cancelar esta reservación")

        # Clients can only cancel pending reservations
        if user.role == UserRole.client and reservation.status != ReservationStatus.pending:
            raise ConflictException("Solo puedes cancelar reservaciones pendientes")

        # Update reservation status with cancellation details
        reservation.status = ReservationStatus.cancelled
        reservation.cancellation_reason = reason
        reservation.cancelled_at = datetime.now()
        reservation.cancelled_by = user.id

        # Get and release spaces
        res_spaces_stmt = select(ReservationSpace).where(
            ReservationSpace.reservation_id == reservation_id
        )
        res_spaces_result = await self.db.execute(res_spaces_stmt)
        res_spaces = list(res_spaces_result.scalars().all())

        space_ids = [rs.space_id for rs in res_spaces]

        if space_ids:
            spaces_stmt = select(Space).where(Space.id.in_(space_ids))
            spaces_result = await self.db.execute(spaces_stmt)
            spaces = list(spaces_result.scalars().all())

            for space in spaces:
                space.status = SpaceStatus.available

        await self.db.commit()

        # Send Notification
        try:
            from app.services.notification_service import notification_service
            # User passed to this method might be admin, so we need to fetch the client
            if reservation.client_id != user.id:
                 from app.models.user import User
                 client_stmt = select(User).where(User.id == reservation.client_id)
                 client_result = await self.db.execute(client_stmt)
                 client = client_result.scalars().first()
            else:
                 client = user
            
            if client:
                await notification_service.notify_reservation_cancelled(reservation, client)
        except Exception as e:
            print(f"Failed to send notification: {e}")

    async def delete_reservation(
        self,
        reservation_id: UUID,
        user: User
    ) -> None:
        """
        Hard delete reservation (Superadmin only)
        
        This also:
        - Releases associated spaces
        - Deletes ticket PDF
        - Deletes summary PDF
        - Deletes payment proof file
        """
        # Check permissions
        if user.role != UserRole.superadmin:
            raise ForbiddenException("Solo superadmin puede eliminar reservaciones permanentemente")

        reservation = await self.get_reservation_by_id(reservation_id, user)

        # Release spaces first if not already released
        if reservation.status != ReservationStatus.cancelled:
             # Get and release spaces
            res_spaces_stmt = select(ReservationSpace).where(
                ReservationSpace.reservation_id == reservation_id
            )
            res_spaces_result = await self.db.execute(res_spaces_stmt)
            res_spaces = list(res_spaces_result.scalars().all())

            space_ids = [rs.space_id for rs in res_spaces]

            if space_ids:
                spaces_stmt = select(Space).where(Space.id.in_(space_ids))
                spaces_result = await self.db.execute(spaces_stmt)
                spaces = list(spaces_result.scalars().all())

                for space in spaces:
                    space.status = SpaceStatus.available
                    space.held_by = None
                    space.hold_expires_at = None

        # Delete associated files
        from app.utils.pdf_generator import delete_ticket, delete_summary
        from app.utils.file_upload import delete_file
        
        reservation_id_str = str(reservation_id)
        
        # Delete ticket PDF
        delete_ticket(reservation_id_str)
        
        # Delete summary PDF
        delete_summary(reservation_id_str)
        
        # Delete payment proof if exists
        if reservation.payment_proof_path:
            try:
                delete_file(reservation.payment_proof_path)
            except Exception:
                pass  # Log but don't fail deletion

        await self.db.delete(reservation)
        await self.db.commit()

    async def upload_payment_proof(
        self,
        reservation_id: UUID,
        user: User,
        file: UploadFile
    ) -> str:
        """
        Upload payment proof and update status
        """
        reservation = await self.get_reservation_by_id(reservation_id, user)

        # Only owner can upload
        if reservation.client_id != user.id:
            raise ForbiddenException("No puedes subir comprobante para esta reservación")

        # Can only upload if unpaid or pending_review (to replace)
        if reservation.payment_status not in [PaymentStatus.unpaid, PaymentStatus.pending_review]:
            raise ConflictException("No puedes subir comprobante en este estado")

        # Delete old proof if exists
        if reservation.payment_proof_path:
            delete_file(reservation.payment_proof_path)

        # Save new file
        file_path = await save_upload_file(
            file,
            subdirectory='payments',
            allowed_types=['pdf', 'jpg', 'jpeg', 'png']
        )

        # Update reservation
        reservation.payment_proof_path = file_path
        reservation.payment_status = PaymentStatus.pending_review

        await self.db.commit()
        await self.db.refresh(reservation)

        return file_path

    async def confirm_payment(
        self,
        reservation_id: UUID,
        user: User,
        approved: bool,
        notes: Optional[str] = None
    ) -> Reservation:
        """
        Confirm or reject payment (admin/manager only)
        """
        # Check permissions
        if user.role not in [UserRole.superadmin, UserRole.manager]:
            raise ForbiddenException("Solo admins y managers pueden confirmar pagos")

        reservation = await self.get_reservation_by_id(reservation_id, user)

        if approved:
            # Approve payment
            reservation.payment_status = PaymentStatus.paid
            reservation.payment_confirmed_at = datetime.now()
            reservation.payment_confirmed_by = user.id
            reservation.status = ReservationStatus.confirmed

            # Generate ticket PDF
            await self._generate_ticket(reservation)

            # Send Notification
            try:
                from app.services.notification_service import notification_service
                from app.models.user import User
                client_stmt = select(User).where(User.id == reservation.client_id)
                client_result = await self.db.execute(client_stmt)
                client = client_result.scalars().first()
                if client:
                    await notification_service.notify_payment_approved(reservation, client)
            except Exception as e:
                print(f"Failed to send notification: {e}")
        else:
            # Reject payment
            reservation.payment_status = PaymentStatus.unpaid
            # Could store notes in a separate table or message system

        await self.db.commit()
        await self.db.refresh(reservation)

        return reservation

    async def _generate_ticket(self, reservation: Reservation) -> None:
        """
        Generate PDF ticket for confirmed reservation
        """
        # Load trip data
        trip_stmt = select(Trip).where(Trip.id == reservation.trip_id)
        trip_result = await self.db.execute(trip_stmt)
        trip = trip_result.scalars().first()

        # Load client data
        from app.models.user import User
        client_stmt = select(User).where(User.id == reservation.client_id)
        client_result = await self.db.execute(client_stmt)
        client = client_result.scalars().first()

        # Load spaces
        res_spaces_stmt = select(ReservationSpace).where(
            ReservationSpace.reservation_id == reservation.id
        )
        res_spaces_result = await self.db.execute(res_spaces_stmt)
        res_spaces = list(res_spaces_result.scalars().all())

        space_ids = [rs.space_id for rs in res_spaces]
        spaces_stmt = select(Space).where(Space.id.in_(space_ids))
        spaces_result = await self.db.execute(spaces_stmt)
        spaces = list(spaces_result.scalars().all())
        space_numbers = sorted([s.space_number for s in spaces])

        # Generate PDF
        payment_method_labels = {
            PaymentMethod.cash: "Efectivo (bodega/OXXO/banco)",
            PaymentMethod.bank_transfer: "Transferencia Bancaria",
            PaymentMethod.mercadopago: "MercadoPago"
        }

        # Load system config for PDF Customization
        from app.models.system_config import SystemConfig
        config_stmt = select(SystemConfig)
        config_result = await self.db.execute(config_stmt)
        pdf_config = {c.key: c.value for c in config_result.scalars().all()}

        # Load items
        from app.models.load_item import LoadItem
        items_stmt = select(LoadItem).where(LoadItem.reservation_id == reservation.id)
        items_result = await self.db.execute(items_stmt)
        items = list(items_result.scalars().all())
        
        cargo_description = ", ".join([f"{item.box_count}x {item.product_name}" for item in items])

        ticket_path = generate_reservation_ticket(
            reservation_id=str(reservation.id),
            client_name=client.full_name if client else "Cliente",
            client_email=client.email if client else "",
            trip_origin=trip.origin if trip else "",
            trip_destination=trip.destination if trip else "",
            departure_date=str(trip.departure_date) if trip else "",
            departure_time=str(trip.departure_time) if trip and trip.departure_time else None,
            space_numbers=space_numbers,
            subtotal=reservation.subtotal,
            tax_amount=reservation.tax_amount,
            total_amount=reservation.total_amount,
            payment_method=payment_method_labels.get(reservation.payment_method, str(reservation.payment_method)),
            cargo_description=cargo_description,
            requires_invoice=reservation.requires_invoice,
            pdf_config=pdf_config,
            currency=trip.currency if trip else "USD",
            exchange_rate=float(trip.exchange_rate) if trip and trip.exchange_rate else 1.0
        )

        reservation.ticket_pdf_path = ticket_path

    async def get_reservation_spaces(self, reservation_id: UUID) -> List[Space]:
        """Get all spaces for a reservation"""
        res_spaces_stmt = select(ReservationSpace).where(
            ReservationSpace.reservation_id == reservation_id
        )
        res_spaces_result = await self.db.execute(res_spaces_stmt)
        res_spaces = list(res_spaces_result.scalars().all())

        if not res_spaces:
            return []

        space_ids = [rs.space_id for rs in res_spaces]
        spaces_stmt = select(Space).where(Space.id.in_(space_ids))
        spaces_result = await self.db.execute(spaces_stmt)
        return list(spaces_result.scalars().all())

    async def get_reservation_items(self, reservation_id: UUID) -> List["LoadItem"]:
        """Get all load items for a reservation"""
        from app.models.load_item import LoadItem
        stmt = select(LoadItem).where(LoadItem.reservation_id == reservation_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

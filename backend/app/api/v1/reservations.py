from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, Response
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pathlib import Path

from app.api.deps import get_current_user, get_db_session, require_verified
from app.config import settings
from app.core.permissions import require_manager_or_superadmin
from app.models.user import User, UserRole
from app.models.reservation import ReservationStatus, PaymentStatus, PaymentMethod
from app.schemas.reservation import (
    HoldSpacesRequest,
    HoldSpacesResponse,
    ReservationCreate,
    ReservationCreateAdmin,
    ReservationUpdate,
    ReservationResponse,
    ReservationListResponse,
    ReservationListItem,
    ReservationSpaceDetail,
    ReservationTripDetail,
    PaymentProofUploadResponse,
    ConfirmPaymentRequest,
    ConfirmPaymentResponse
)
from app.services.reservation_service import ReservationService
from app.services.notification_service import notification_service

router = APIRouter()


@router.post("/hold", response_model=HoldSpacesResponse)
async def create_hold(
    payload: HoldSpacesRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(require_verified)
):
    """
    Create a temporary hold on spaces (10 minutes)
    """
    service = ReservationService(db)
    
    result = await service.create_hold(
        user_id=UUID(str(current_user.id)),
        trip_id=UUID(payload.trip_id),
        space_ids=[UUID(sid) for sid in payload.space_ids]
    )
    
    return HoldSpacesResponse(**result)


@router.post("/", response_model=ReservationResponse, status_code=201)
async def create_reservation(
    payload: ReservationCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(require_verified)
):
    """
    Create a reservation from an existing hold
    """
    service = ReservationService(db)
    
    reservation = await service.create_reservation(
        user_id=UUID(str(current_user.id)),
        data=payload
    )
    
    # Load related data
    spaces = await service.get_reservation_spaces(reservation.id)
    
    # Load items
    items = await service.get_reservation_items(reservation.id)
    from app.schemas.reservation import LoadItemResponse
    
    # Build response manually to avoid lazy loading issues
    response = ReservationResponse(
        id=reservation.id,
        client_id=reservation.client_id,
        trip_id=reservation.trip_id,
        status=reservation.status,
        payment_method=reservation.payment_method,
        payment_status=reservation.payment_status,
        subtotal=reservation.subtotal,
        tax_amount=reservation.tax_amount,
        total_amount=reservation.total_amount,
        discount_amount=reservation.discount_amount,
        discount_reason=reservation.discount_reason,
        is_international=reservation.is_international,
        use_own_bond=reservation.use_own_bond,
        bond_file_id=reservation.bond_file_id,
        request_pickup=reservation.request_pickup,
        pickup_details=reservation.pickup_details,
        invoice_data_id=reservation.invoice_data_id,
        billing_company_name=None,
        billing_rfc=None,
        cfdi_use=None,
        billing_contact_methods=None,
        requires_invoice=reservation.requires_invoice,
        invoice_pdf_path=reservation.invoice_pdf_path,
        invoice_xml_path=reservation.invoice_xml_path,
        ticket_pdf_path=reservation.ticket_pdf_path,
        payment_proof_path=reservation.payment_proof_path,
        payment_confirmed_at=reservation.payment_confirmed_at,
        payment_confirmed_by=reservation.payment_confirmed_by,
        created_at=reservation.created_at,
        updated_at=reservation.updated_at,
        spaces=[
            ReservationSpaceDetail(
                id=str(s.id),
                space_number=s.space_number,
                price=s.price
            ) for s in spaces
        ],
        items=[LoadItemResponse.model_validate(item) for item in items]
    )
    
    # Notify about new reservation
    await notification_service.notify_reservation_created(reservation, current_user)
    
    return response


@router.post("/admin", response_model=ReservationResponse, status_code=201)
async def create_admin_reservation(
    payload: ReservationCreateAdmin,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(require_manager_or_superadmin)
):
    """
    Create a reservation as admin (bypassing payment and strict validation)
    """
    service = ReservationService(db)
    
    reservation = await service.create_admin_reservation(
        admin_user=current_user,
        data=payload
    )
    
    # Load related data (reusing logic from create_reservation)
    spaces = await service.get_reservation_spaces(reservation.id)
    items = await service.get_reservation_items(reservation.id)
    from app.schemas.reservation import LoadItemResponse
    
    # Build response manually
    response = ReservationResponse(
        id=reservation.id,
        client_id=reservation.client_id,
        trip_id=reservation.trip_id,
        status=reservation.status,
        payment_method=reservation.payment_method,
        payment_status=reservation.payment_status,
        subtotal=reservation.subtotal,
        tax_amount=reservation.tax_amount,
        total_amount=reservation.total_amount,
        discount_amount=reservation.discount_amount,
        discount_reason=reservation.discount_reason,
        is_international=reservation.is_international,
        use_own_bond=reservation.use_own_bond,
        bond_file_id=reservation.bond_file_id,
        request_pickup=reservation.request_pickup,
        pickup_details=reservation.pickup_details,
        invoice_data_id=reservation.invoice_data_id,
        billing_company_name=None,
        billing_rfc=None,
        cfdi_use=None,
        billing_contact_methods=None,
        requires_invoice=reservation.requires_invoice,
        invoice_pdf_path=reservation.invoice_pdf_path,
        invoice_xml_path=reservation.invoice_xml_path,
        ticket_pdf_path=reservation.ticket_pdf_path,
        payment_proof_path=reservation.payment_proof_path,
        payment_confirmed_at=reservation.payment_confirmed_at,
        payment_confirmed_by=reservation.payment_confirmed_by,
        created_at=reservation.created_at,
        updated_at=reservation.updated_at,
        spaces=[
            ReservationSpaceDetail(
                id=str(s.id),
                space_number=s.space_number,
                price=s.price
            ) for s in spaces
        ],
        items=[LoadItemResponse.model_validate(item) for item in items]
    )
    
    return response


@router.get("/", response_model=ReservationListResponse)
async def list_reservations(
    trip_id: Optional[str] = None,
    client_id: Optional[str] = None,
    status: Optional[ReservationStatus] = None,
    payment_status: Optional[PaymentStatus] = None,
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    List reservations
    - Clients see only their own
    - Admins/Managers see all with filters
    """
    service = ReservationService(db)
    skip = (page - 1) * page_size
    
    if current_user.role == UserRole.client:
        # Clients can only see their own reservations
        reservations = await service.get_user_reservations(
            user_id=UUID(str(current_user.id)),
            status=status,
            payment_status=payment_status,
            skip=skip,
            limit=page_size
        )
        total = await service.count_reservations(
            user_id=UUID(str(current_user.id)),
            status=status,
            payment_status=payment_status
        )
    else:
        # Admin/Manager can see all
        reservations = await service.get_all_reservations(
            trip_id=UUID(trip_id) if trip_id else None,
            client_id=UUID(client_id) if client_id else None,
            status=status,
            payment_status=payment_status,
            skip=skip,
            limit=page_size
        )
        total = await service.count_reservations(
            user_id=UUID(client_id) if client_id else None,
            trip_id=UUID(trip_id) if trip_id else None,
            status=status,
            payment_status=payment_status
        )
    
    # Build list items
    items = []
    for reservation in reservations:
        spaces = await service.get_reservation_spaces(reservation.id)
        
        # Load trip for summary
        from app.models.trip import Trip
        from sqlalchemy import select
        trip_stmt = select(Trip).where(Trip.id == reservation.trip_id)
        trip_result = await db.execute(trip_stmt)
        trip = trip_result.scalars().first()
        
        # Load client for name
        from app.models.user import User
        client_stmt = select(User).where(User.id == reservation.client_id)
        client_result = await db.execute(client_stmt)
        client = client_result.scalars().first()

        items.append(ReservationListItem(
            id=str(reservation.id),
            trip_id=str(reservation.trip_id),
            status=reservation.status,
            payment_status=reservation.payment_status,
            payment_method=reservation.payment_method,
            total_amount=reservation.total_amount,
            spaces_count=len(spaces),
            created_at=reservation.created_at,
            trip_origin=trip.origin if trip else None,
            trip_destination=trip.destination if trip else None,
            trip_departure_date=str(trip.departure_date) if trip else None,
            client_name=client.full_name if client else "Desconocido",
            currency=trip.currency if trip else "USD"
        ))
    
    pages = (total + page_size - 1) // page_size
    
    return ReservationListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )


@router.get("/{reservation_id}", response_model=ReservationResponse)
async def get_reservation(
    reservation_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get reservation details
    """
    service = ReservationService(db)
    
    reservation = await service.get_reservation_by_id(
        reservation_id=UUID(reservation_id),
        user=current_user
    )
    
    # Load related data
    spaces = await service.get_reservation_spaces(reservation.id)
    
    # Load trip
    from app.models.trip import Trip
    from sqlalchemy import select
    trip_stmt = select(Trip).where(Trip.id == reservation.trip_id)
    trip_result = await db.execute(trip_stmt)
    trip = trip_result.scalars().first()
    
    # Load items
    items = await service.get_reservation_items(reservation.id)
    from app.schemas.reservation import LoadItemResponse

    # Load client for name
    from app.models.user import User
    from sqlalchemy import select
    client_stmt = select(User).where(User.id == reservation.client_id)
    client_result = await db.execute(client_stmt)
    client = client_result.scalars().first()

    # Build response manually to avoid lazy loading issues
    response = ReservationResponse(
        id=reservation.id,
        client_id=reservation.client_id,
        client_name=client.full_name if client else "Desconocido",
        client_email=client.email if client else "",
        client_phone=client.phone if client else "",
        trip_id=reservation.trip_id,
        status=reservation.status,
        payment_method=reservation.payment_method,
        payment_status=reservation.payment_status,
        subtotal=reservation.subtotal,
        tax_amount=reservation.tax_amount,
        total_amount=reservation.total_amount,
        discount_amount=reservation.discount_amount,
        discount_reason=reservation.discount_reason,
        is_international=reservation.is_international,
        use_own_bond=reservation.use_own_bond,
        bond_file_id=reservation.bond_file_id,
        request_pickup=reservation.request_pickup,
        pickup_details=reservation.pickup_details,
        invoice_data_id=reservation.invoice_data_id,
        billing_company_name=None,
        billing_rfc=None,
        cfdi_use=None,
        billing_contact_methods=None,
        requires_invoice=reservation.requires_invoice,
        invoice_pdf_path=reservation.invoice_pdf_path,
        invoice_xml_path=reservation.invoice_xml_path,
        ticket_pdf_path=reservation.ticket_pdf_path,
        payment_proof_path=reservation.payment_proof_path,
        payment_confirmed_at=reservation.payment_confirmed_at,
        payment_confirmed_by=reservation.payment_confirmed_by,
        created_at=reservation.created_at,
        updated_at=reservation.updated_at,
        spaces=[
            ReservationSpaceDetail(
                id=str(s.id),
                space_number=s.space_number,
                price=s.price
            ) for s in spaces
        ],
        items=[LoadItemResponse.model_validate(item) for item in items]
    )
    
    if trip:
        response.trip = ReservationTripDetail(
            id=str(trip.id),
            origin=trip.origin,
            destination=trip.destination,
            departure_date=str(trip.departure_date),
            departure_time=str(trip.departure_time) if trip.departure_time else None,
            price_per_space=trip.price_per_space,
            tax_rate=trip.tax_rate,
            tax_included=trip.tax_included
        )
    
    return response


@router.patch("/{reservation_id}", response_model=ReservationResponse)
async def update_reservation(
    reservation_id: str,
    payload: ReservationUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Update reservation details (only before payment confirmation)
    """
    service = ReservationService(db)
    
    reservation = await service.update_reservation(
        reservation_id=UUID(reservation_id),
        user=current_user,
        data=payload
    )
    
    return ReservationResponse.model_validate(reservation)


@router.post("/{reservation_id}/cancel", status_code=204)
async def cancel_reservation(
    reservation_id: str,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Cancel reservation and release spaces (Soft Delete/Cancel)
    
    Args:
        reason: Optional cancellation reason provided by user
    """
    service = ReservationService(db)
    
    await service.cancel_reservation(
        reservation_id=UUID(reservation_id),
        user=current_user,
        reason=reason
    )
    
    # Notify about cancellation
    from app.models.reservation import Reservation
    from sqlalchemy import select
    reservation_stmt = select(Reservation).where(Reservation.id == UUID(reservation_id))
    reservation_result = await db.execute(reservation_stmt)
    reservation = reservation_result.scalars().first()
    
    if reservation:
        # Get client
        from app.models.user import User
        client_stmt = select(User).where(User.id == reservation.client_id)
        client_result = await db.execute(client_stmt)
        client = client_result.scalars().first()
        
        await notification_service.notify_reservation_cancelled(reservation, client or current_user)
        
        # If there's a trip, notify about space availability
        from app.models.trip import Trip
        trip_stmt = select(Trip).where(Trip.id == reservation.trip_id)
        trip_result = await db.execute(trip_stmt)
        trip = trip_result.scalars().first()
        if trip:
            await notification_service.notify_space_available(trip)
    
    return Response(status_code=204)


@router.delete("/{reservation_id}", status_code=204)
async def delete_reservation(
    reservation_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Hard delete reservation (Superadmin only)
    """
    service = ReservationService(db)
    
    await service.delete_reservation(
        reservation_id=UUID(reservation_id),
        user=current_user
    )
    
    return Response(status_code=204)


@router.post("/{reservation_id}/payment-proof", response_model=PaymentProofUploadResponse)
async def upload_payment_proof(
    reservation_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Upload payment proof (image or PDF)
    """
    service = ReservationService(db)
    
    file_path = await service.upload_payment_proof(
        reservation_id=UUID(reservation_id),
        user=current_user,
        file=file
    )
    
    # Notify admins about pending payment review
    from app.models.reservation import Reservation
    from sqlalchemy import select
    reservation_stmt = select(Reservation).where(Reservation.id == UUID(reservation_id))
    reservation_result = await db.execute(reservation_stmt)
    reservation = reservation_result.scalars().first()
    
    if reservation:
        await notification_service.notify_payment_pending(reservation, current_user)
    
    return PaymentProofUploadResponse(
        message="Comprobante de pago subido exitosamente",
        reservation_id=reservation_id,
        payment_status=PaymentStatus.pending_review,
        payment_proof_path=file_path
    )


@router.post("/{reservation_id}/confirm-payment", response_model=ConfirmPaymentResponse)
async def confirm_payment(
    reservation_id: str,
    payload: ConfirmPaymentRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(require_manager_or_superadmin)
):
    """
    Confirm or reject payment (Admin/Manager only)
    """
    service = ReservationService(db)
    
    # Get current status for audit
    from sqlalchemy import select
    from app.models.reservation import Reservation
    current_reservation = await db.scalar(
        select(Reservation).where(Reservation.id == UUID(reservation_id))
    )
    old_payment_status = current_reservation.payment_status.value if current_reservation else None
    old_status = current_reservation.status.value if current_reservation else None
    
    reservation = await service.confirm_payment(
        reservation_id=UUID(reservation_id),
        user=current_user,
        approved=payload.approved,
        notes=payload.notes
    )
    
    # Log audit event
    from app.services.audit_service import log_audit
    await log_audit(
        db=db,
        action="payment_approved" if payload.approved else "payment_rejected",
        entity_type="reservation",
        entity_id=UUID(reservation_id),
        user_id=current_user.id,
        old_values={
            "payment_status": old_payment_status,
            "status": old_status
        },
        new_values={
            "payment_status": reservation.payment_status.value,
            "status": reservation.status.value,
            "notes": payload.notes
        }
    )
    await db.commit()  # Commit the audit log
    
    # Notify client about payment decision
    from app.models.user import User
    client_stmt = select(User).where(User.id == reservation.client_id)
    client_result = await db.execute(client_stmt)
    client = client_result.scalars().first()
    
    if client:
        if payload.approved:
            await notification_service.notify_payment_approved(reservation, client)
        else:
            await notification_service.notify_payment_rejected(reservation, client, payload.notes)
    
    message = "Pago aprobado exitosamente" if payload.approved else "Pago rechazado"
    
    return ConfirmPaymentResponse(
        message=message,
        reservation_id=reservation_id,
        payment_status=reservation.payment_status,
        ticket_pdf_path=reservation.ticket_pdf_path
    )


@router.get("/{reservation_id}/audit-history")
async def get_reservation_audit_history(
    reservation_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(require_manager_or_superadmin)
):
    """
    Get audit history for a reservation (Admin/Manager only)
    Returns list of changes made to the reservation with timestamps and user info.
    """
    from app.services.audit_service import get_entity_audit_history
    from sqlalchemy import select
    
    logs = await get_entity_audit_history(
        db=db,
        entity_type="reservation",
        entity_id=UUID(reservation_id),
        limit=50
    )
    
    result = []
    for log in logs:
        # Get user name
        user_name = "Sistema"
        if log.user_id:
            user = await db.scalar(select(User).where(User.id == log.user_id))
            if user:
                user_name = user.full_name
        
        result.append({
            "id": str(log.id),
            "action": log.action,
            "performed_by": user_name,
            "old_values": log.old_values,
            "new_values": log.new_values,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })
    
    return {"audit_history": result}

@router.get("/{reservation_id}/ticket")
async def download_ticket(
    reservation_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Download reservation ticket PDF
    """
    service = ReservationService(db)
    
    reservation = await service.get_reservation_by_id(
        reservation_id=UUID(reservation_id),
        user=current_user
    )
    
    # Check if ticket exists
    if not reservation.ticket_pdf_path:
        raise HTTPException(status_code=404, detail="Ticket not generated")
        
    file_path = Path(settings.upload_dir) / reservation.ticket_pdf_path
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Ticket file not found")
    
    return FileResponse(
        path=str(file_path),
        filename=f"ticket_{reservation_id}.pdf",
        media_type="application/pdf"
    )


@router.get("/{reservation_id}/summary-pdf")
async def download_summary(
    reservation_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Download pre-reservation summary PDF (with bank details and payment instructions)
    """
    service = ReservationService(db)
    
    reservation = await service.get_reservation_by_id(
        reservation_id=UUID(reservation_id),
        user=current_user
    )
    
    # Load trip
    from app.models.trip import Trip
    from sqlalchemy import select
    trip_stmt = select(Trip).where(Trip.id == reservation.trip_id)
    trip_result = await db.execute(trip_stmt)
    trip = trip_result.scalars().first()
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Load spaces
    spaces = await service.get_reservation_spaces(reservation.id)
    space_numbers = sorted([s.space_number for s in spaces])
    
    # Load all system config for PDF
    from app.models.system_config import SystemConfig
    config_keys = [
        'bank_details_invoice', 'bank_details_no_invoice',
        'company_name', 'company_email', 'company_website', 'company_phone',
        'pdf_footer_text', 'terms_and_conditions', 'payment_instructions', 'whatsapp_number',
        'payment_instructions_cash', 'payment_instructions_transfer', 
        'payment_instructions_mercadopago', 'cash_payment_info'
    ]
    config_stmt = select(SystemConfig).where(SystemConfig.key.in_(config_keys))
    config_result = await db.execute(config_stmt)
    configs = {c.key: c.value for c in config_result.scalars().all()}
    
    # Generate PDF
    from app.utils.pdf_generator import generate_pre_reservation_summary
    
    payment_method_labels = {
        PaymentMethod.cash: "Efectivo (bodega/OXXO/banco)",
        PaymentMethod.bank_transfer: "Transferencia Bancaria",
        PaymentMethod.mercadopago: "MercadoPago"
    }
    
    summary_path = generate_pre_reservation_summary(
        reservation_id=str(reservation.id),
        client_name=current_user.full_name,
        client_email=current_user.email,
        trip_origin=trip.origin,
        trip_destination=trip.destination,
        departure_date=str(trip.departure_date),
        departure_time=str(trip.departure_time) if trip.departure_time else None,
        space_numbers=space_numbers,
        subtotal=reservation.subtotal,
        tax_amount=reservation.tax_amount,
        total_amount=reservation.total_amount,
        payment_method=payment_method_labels.get(reservation.payment_method, str(reservation.payment_method)),
        payment_deadline_hours=trip.payment_deadline_hours or 24,
        bank_details_invoice=configs.get('bank_details_invoice'),
        bank_details_no_invoice=configs.get('bank_details_no_invoice'),
        requires_invoice=reservation.requires_invoice,
        pdf_config=configs,
        currency=trip.currency or "USD",
        exchange_rate=float(trip.exchange_rate or 1.0)
    )
    
    file_path = Path(settings.upload_dir) / summary_path
    
    return FileResponse(
        path=str(file_path),
        filename=f"resumen_{reservation_id[:8]}.pdf",
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="resumen_{reservation_id[:8]}.pdf"'
        }
    )


# ==================== PUBLIC ENDPOINTS (No Auth Required) ====================
# These endpoints use the reservation UUID as the only authentication
# Since UUIDs are cryptographically random, they're secure for share links

@router.get("/public/summary/{reservation_id}")
async def public_download_summary(
    reservation_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Public endpoint for downloading pre-reservation summary PDF.
    No authentication required - uses UUID as security.
    """
    from sqlalchemy import select
    from app.models.reservation import Reservation
    from app.models.trip import Trip
    from app.models.user import User as UserModel
    from app.models.system_config import SystemConfig
    from app.utils.pdf_generator import generate_pre_reservation_summary
    
    # Load reservation without auth check
    res_stmt = select(Reservation).where(Reservation.id == UUID(reservation_id))
    res_result = await db.execute(res_stmt)
    reservation = res_result.scalars().first()
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservación no encontrada")
    
    # Load client
    client_stmt = select(UserModel).where(UserModel.id == reservation.client_id)
    client_result = await db.execute(client_stmt)
    client = client_result.scalars().first()
    
    # Load trip
    trip_stmt = select(Trip).where(Trip.id == reservation.trip_id)
    trip_result = await db.execute(trip_stmt)
    trip = trip_result.scalars().first()
    
    if not trip:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")
    
    # Load spaces
    service = ReservationService(db)
    spaces = await service.get_reservation_spaces(reservation.id)
    space_numbers = sorted([s.space_number for s in spaces])
    
    # Load config
    config_keys = [
        'bank_details_invoice', 'bank_details_no_invoice',
        'company_name', 'company_email', 'company_website', 'company_phone',
        'pdf_footer_text', 'terms_and_conditions', 'payment_instructions', 'whatsapp_number',
        'payment_instructions_cash', 'payment_instructions_transfer', 
        'payment_instructions_mercadopago', 'cash_payment_info'
    ]
    config_stmt = select(SystemConfig).where(SystemConfig.key.in_(config_keys))
    config_result = await db.execute(config_stmt)
    configs = {c.key: c.value for c in config_result.scalars().all()}
    
    payment_method_labels = {
        PaymentMethod.cash: "Efectivo (bodega/OXXO/banco)",
        PaymentMethod.bank_transfer: "Transferencia Bancaria",
        PaymentMethod.mercadopago: "MercadoPago"
    }
    
    summary_path = generate_pre_reservation_summary(
        reservation_id=str(reservation.id),
        client_name=client.full_name if client else "Cliente",
        client_email=client.email if client else "",
        trip_origin=trip.origin,
        trip_destination=trip.destination,
        departure_date=str(trip.departure_date),
        departure_time=str(trip.departure_time) if trip.departure_time else None,
        space_numbers=space_numbers,
        subtotal=reservation.subtotal,
        tax_amount=reservation.tax_amount,
        total_amount=reservation.total_amount,
        payment_method=payment_method_labels.get(reservation.payment_method, str(reservation.payment_method)),
        payment_deadline_hours=trip.payment_deadline_hours or 24,
        bank_details_invoice=configs.get('bank_details_invoice'),
        bank_details_no_invoice=configs.get('bank_details_no_invoice'),
        requires_invoice=reservation.requires_invoice,
        pdf_config=configs,
        currency=trip.currency or "USD",
        exchange_rate=float(trip.exchange_rate or 1.0)
    )
    
    file_path = Path(settings.upload_dir) / summary_path
    
    return FileResponse(
        path=str(file_path),
        filename=f"resumen_{reservation_id[:8]}.pdf",
        media_type="application/pdf"
    )


@router.get("/public/ticket/{reservation_id}")
async def public_download_ticket(
    reservation_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Public endpoint for downloading reservation ticket PDF.
    No authentication required - uses UUID as security.
    Only works if payment has been confirmed.
    """
    from sqlalchemy import select
    from app.models.reservation import Reservation
    
    # Load reservation without auth check
    res_stmt = select(Reservation).where(Reservation.id == UUID(reservation_id))
    res_result = await db.execute(res_stmt)
    reservation = res_result.scalars().first()
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservación no encontrada")
    
    # Check payment status
    if reservation.payment_status != PaymentStatus.paid:
        raise HTTPException(status_code=400, detail="El pago aún no ha sido confirmado")
    
    if not reservation.ticket_pdf_path:
        raise HTTPException(status_code=404, detail="Ticket no generado")
    
    file_path = Path(settings.upload_dir) / reservation.ticket_pdf_path
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Archivo de ticket no encontrado")
    
    return FileResponse(
        path=str(file_path),
        filename=f"ticket_{reservation_id[:8]}.pdf",
        media_type="application/pdf"
    )

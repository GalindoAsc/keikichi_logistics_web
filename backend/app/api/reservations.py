from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os
import uuid
import aiofiles

from app.database import get_db
from app.api.deps import get_current_active_user, get_current_admin_user
from app.models.user import User
from app.models.reservation import Reservation, ReservationSpace, ReservationStatus
from app.models.space import Space, SpaceStatus
from app.schemas.reservation import ReservationCreate, ReservationUpdate, ReservationResponse, BankDetailsResponse
from app.config import settings

router = APIRouter()


@router.post("/", response_model=ReservationResponse)
async def create_reservation(
    reservation_in: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create a new reservation
    """
    # Check if all spaces are available
    spaces = db.query(Space).filter(Space.id.in_(reservation_in.space_ids)).all()

    if len(spaces) != len(reservation_in.space_ids):
        raise HTTPException(status_code=404, detail="One or more spaces not found")

    for space in spaces:
        if space.status != SpaceStatus.AVAILABLE:
            raise HTTPException(
                status_code=400,
                detail=f"Space {space.space_number} is not available"
            )
        if space.trip_id != reservation_in.trip_id:
            raise HTTPException(
                status_code=400,
                detail=f"Space {space.space_number} does not belong to this trip"
            )

    # Create reservation
    reservation = Reservation(
        trip_id=reservation_in.trip_id,
        client_id=current_user.id,
        status=ReservationStatus.PENDING
    )
    db.add(reservation)
    db.flush()

    # Link spaces to reservation and update their status
    for space in spaces:
        reservation_space = ReservationSpace(
            reservation_id=reservation.id,
            space_id=space.id
        )
        db.add(reservation_space)
        space.status = SpaceStatus.RESERVED

    db.commit()
    db.refresh(reservation)
    return reservation


@router.get("/my-reservations", response_model=List[ReservationResponse])
def get_my_reservations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get current user's reservations
    """
    reservations = db.query(Reservation).filter(
        Reservation.client_id == current_user.id
    ).offset(skip).limit(limit).all()
    return reservations


@router.get("/", response_model=List[ReservationResponse])
def get_all_reservations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """
    Get all reservations (admin only)
    """
    reservations = db.query(Reservation).offset(skip).limit(limit).all()
    return reservations


@router.get("/{reservation_id}", response_model=ReservationResponse)
def get_reservation(
    reservation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get reservation by ID
    """
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    # Check if user has permission to view this reservation
    if current_user.role.value == "Client" and reservation.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this reservation")

    return reservation


@router.put("/{reservation_id}", response_model=ReservationResponse)
def update_reservation(
    reservation_id: str,
    reservation_in: ReservationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """
    Update reservation status (admin only)
    """
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    update_data = reservation_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(reservation, field, value)

    # If cancelled, free up the spaces
    if reservation_in.status == ReservationStatus.CANCELLED:
        spaces = db.query(Space).join(ReservationSpace).filter(
            ReservationSpace.reservation_id == reservation_id
        ).all()
        for space in spaces:
            space.status = SpaceStatus.AVAILABLE

    db.commit()
    db.refresh(reservation)
    return reservation


@router.post("/{reservation_id}/upload-receipt")
async def upload_payment_receipt(
    reservation_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Upload payment receipt for a reservation
    """
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    if reservation.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Validate file type
    allowed_extensions = {".jpg", ".jpeg", ".png", ".pdf"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type")

    # Create upload directory if it doesn't exist
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)

    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    # Save file
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        if len(content) > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(status_code=400, detail="File too large")
        await out_file.write(content)

    # Update reservation
    reservation.payment_receipt_url = f"/uploads/{unique_filename}"
    db.commit()

    return {"message": "Receipt uploaded successfully", "file_url": reservation.payment_receipt_url}


@router.get("/{reservation_id}/bank-details", response_model=BankDetailsResponse)
def get_bank_details(
    reservation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get bank details for payment and mark as shown
    """
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    if reservation.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Mark bank details as shown
    reservation.bank_details_shown = True
    db.commit()

    return BankDetailsResponse(
        bank_name=settings.BANK_NAME,
        account_number=settings.BANK_ACCOUNT,
        account_holder=settings.BANK_ACCOUNT_HOLDER,
        routing_number=settings.BANK_ROUTING
    )


@router.delete("/{reservation_id}")
def cancel_reservation(
    reservation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Cancel a reservation
    """
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    if reservation.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Free up spaces
    spaces = db.query(Space).join(ReservationSpace).filter(
        ReservationSpace.reservation_id == reservation_id
    ).all()
    for space in spaces:
        space.status = SpaceStatus.AVAILABLE

    reservation.status = ReservationStatus.CANCELLED
    db.commit()

    return {"message": "Reservation cancelled successfully"}

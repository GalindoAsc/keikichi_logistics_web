from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models import User, UserRole, Trip, TripStatus
from app.models.trip_quote import TripQuote, QuoteStatus

router = APIRouter(prefix="/trip-quotes", tags=["Trip Quotes"])


# === Schemas ===

class TripQuoteCreate(BaseModel):
    origin: str
    destination: str
    is_international: bool = False
    pallet_count: int = Field(ge=1)
    preferred_date: str  # YYYY-MM-DD
    flexible_dates: bool = False
    preferred_currency: str = "USD"  # USD or MXN
    tiradas: Optional[int] = 0
    requires_bond: bool = False
    requires_refrigeration: bool = False
    temperature_min: Optional[float] = None
    temperature_max: Optional[float] = None
    pickup_address: Optional[str] = None
    special_requirements: Optional[str] = None


class AdminQuotePrice(BaseModel):
    quoted_price: Decimal = Field(ge=0)
    quoted_currency: str = "USD"
    free_tiradas: int = 0
    price_per_extra_tirada: Optional[Decimal] = None
    admin_notes: Optional[str] = None


class ClientQuoteResponse(BaseModel):
    action: str  # "accept", "negotiate", "reject"
    message: Optional[str] = None


class TripQuoteOut(BaseModel):
    id: UUID
    origin: str
    destination: str
    is_international: bool
    pallet_count: int
    preferred_date: str
    flexible_dates: bool
    preferred_currency: str
    tiradas: Optional[int]
    requires_bond: bool
    requires_refrigeration: bool
    temperature_min: Optional[float]
    temperature_max: Optional[float]
    pickup_address: Optional[str]
    special_requirements: Optional[str]
    quoted_price: Optional[float]
    quoted_currency: Optional[str]
    free_tiradas: Optional[int]
    price_per_extra_tirada: Optional[float]
    admin_notes: Optional[str]
    status: str
    client_response: Optional[str]
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    created_at: datetime
    expires_at: Optional[datetime]
    created_trip_id: Optional[UUID]

    class Config:
        from_attributes = True


# === Endpoints ===

@router.post("", response_model=TripQuoteOut, status_code=201)
async def create_quote_request(
    data: TripQuoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cliente solicita una cotización de viaje completo."""
    from datetime import date as dt_date
    
    preferred_date = dt_date.fromisoformat(data.preferred_date)
    
    # Expira 3 días antes de la fecha preferida
    expires_at = datetime.combine(preferred_date, datetime.min.time()) - timedelta(days=3)
    if expires_at <= datetime.now():
        raise HTTPException(status_code=400, detail="La fecha preferida debe ser al menos 4 días en el futuro")
    
    quote = TripQuote(
        client_id=current_user.id,
        origin=data.origin,
        destination=data.destination,
        is_international=data.is_international,
        pallet_count=data.pallet_count,
        preferred_date=preferred_date,
        flexible_dates=data.flexible_dates,
        preferred_currency=data.preferred_currency,
        tiradas=data.tiradas if data.is_international else 0,
        requires_bond=data.requires_bond,
        requires_refrigeration=data.requires_refrigeration,
        temperature_min=data.temperature_min,
        temperature_max=data.temperature_max,
        pickup_address=data.pickup_address,
        special_requirements=data.special_requirements,
        status=QuoteStatus.pending,
        expires_at=expires_at
    )
    
    db.add(quote)
    await db.commit()
    await db.refresh(quote)
    
    return TripQuoteOut(
        **{
            "id": quote.id,
            "origin": quote.origin,
            "destination": quote.destination,
            "is_international": quote.is_international,
            "pallet_count": quote.pallet_count,
            "preferred_date": str(quote.preferred_date),
            "flexible_dates": quote.flexible_dates,
            "preferred_currency": quote.preferred_currency,
            "tiradas": quote.tiradas,
            "requires_bond": quote.requires_bond,
            "requires_refrigeration": quote.requires_refrigeration,
            "temperature_min": float(quote.temperature_min) if quote.temperature_min else None,
            "temperature_max": float(quote.temperature_max) if quote.temperature_max else None,
            "pickup_address": quote.pickup_address,
            "special_requirements": quote.special_requirements,
            "quoted_price": None,
            "quoted_currency": None,
            "free_tiradas": None,
            "price_per_extra_tirada": None,
            "admin_notes": None,
            "status": quote.status.value,
            "client_response": None,
            "created_at": quote.created_at,
            "expires_at": quote.expires_at,
            "created_trip_id": None
        }
    )


@router.get("", response_model=List[TripQuoteOut])
async def list_quotes(
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista cotizaciones. Clientes ven las suyas, admins ven todas."""
    query = select(TripQuote).options(selectinload(TripQuote.client))
    
    if current_user.role == UserRole.client:
        query = query.where(TripQuote.client_id == current_user.id)
    
    if status:
        query = query.where(TripQuote.status == status)
    
    query = query.order_by(TripQuote.created_at.desc())
    
    result = await db.execute(query)
    quotes = result.scalars().all()
    
    return [
        TripQuoteOut(
            id=q.id,
            origin=q.origin,
            destination=q.destination,
            is_international=q.is_international,
            pallet_count=q.pallet_count,
            preferred_date=str(q.preferred_date),
            flexible_dates=q.flexible_dates,
            preferred_currency=q.preferred_currency,
            tiradas=q.tiradas,
            requires_bond=q.requires_bond,
            requires_refrigeration=q.requires_refrigeration,
            temperature_min=float(q.temperature_min) if q.temperature_min else None,
            temperature_max=float(q.temperature_max) if q.temperature_max else None,
            pickup_address=q.pickup_address,
            special_requirements=q.special_requirements,
            quoted_price=float(q.quoted_price) if q.quoted_price else None,
            quoted_currency=q.quoted_currency,
            free_tiradas=q.free_tiradas,
            price_per_extra_tirada=float(q.price_per_extra_tirada) if q.price_per_extra_tirada else None,
            admin_notes=q.admin_notes if current_user.role != UserRole.client else None,
            status=q.status.value,
            client_response=q.client_response,
            client_name=q.client.full_name if q.client else None,
            client_email=q.client.email if q.client else None,
            created_at=q.created_at,
            expires_at=q.expires_at,
            created_trip_id=q.created_trip_id
        )
        for q in quotes
    ]


@router.get("/{quote_id}", response_model=TripQuoteOut)
async def get_quote(
    quote_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener detalle de una cotización."""
    result = await db.execute(
        select(TripQuote)
        .options(selectinload(TripQuote.client))
        .where(TripQuote.id == quote_id)
    )
    quote = result.scalar_one_or_none()
    
    if not quote:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    
    if current_user.role == UserRole.client and quote.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta cotización")
    
    return TripQuoteOut(
        id=quote.id,
        origin=quote.origin,
        destination=quote.destination,
        is_international=quote.is_international,
        pallet_count=quote.pallet_count,
        preferred_date=str(quote.preferred_date),
        flexible_dates=quote.flexible_dates,
        preferred_currency=quote.preferred_currency,
        tiradas=quote.tiradas,
        requires_bond=quote.requires_bond,
        requires_refrigeration=quote.requires_refrigeration,
        temperature_min=float(quote.temperature_min) if quote.temperature_min else None,
        temperature_max=float(quote.temperature_max) if quote.temperature_max else None,
        pickup_address=quote.pickup_address,
        special_requirements=quote.special_requirements,
        quoted_price=float(quote.quoted_price) if quote.quoted_price else None,
        quoted_currency=quote.quoted_currency,
        free_tiradas=quote.free_tiradas,
        price_per_extra_tirada=float(quote.price_per_extra_tirada) if quote.price_per_extra_tirada else None,
        admin_notes=quote.admin_notes if current_user.role != UserRole.client else None,
        status=quote.status.value,
        client_response=quote.client_response,
        client_name=quote.client.full_name if quote.client else None,
        client_email=quote.client.email if quote.client else None,
        created_at=quote.created_at,
        expires_at=quote.expires_at,
        created_trip_id=quote.created_trip_id
    )


@router.patch("/{quote_id}/quote")
async def admin_set_quote(
    quote_id: UUID,
    data: AdminQuotePrice,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.manager, UserRole.superadmin]))
):
    """Admin asigna un precio a la cotización."""
    result = await db.execute(select(TripQuote).where(TripQuote.id == quote_id))
    quote = result.scalar_one_or_none()
    
    if not quote:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    
    if quote.status not in [QuoteStatus.pending, QuoteStatus.negotiating]:
        raise HTTPException(status_code=400, detail="No se puede cotizar en este estado")
    
    quote.quoted_price = data.quoted_price
    quote.quoted_currency = data.quoted_currency
    quote.free_tiradas = data.free_tiradas
    quote.price_per_extra_tirada = data.price_per_extra_tirada
    quote.admin_notes = data.admin_notes
    quote.quoted_by = current_user.id
    quote.quoted_at = datetime.now()
    quote.status = QuoteStatus.quoted
    
    await db.commit()
    
    return {"message": "Cotización enviada al cliente", "status": quote.status.value}


@router.patch("/{quote_id}/respond")
async def client_respond(
    quote_id: UUID,
    data: ClientQuoteResponse,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cliente responde a la cotización: aceptar, negociar o rechazar."""
    result = await db.execute(select(TripQuote).where(TripQuote.id == quote_id))
    quote = result.scalar_one_or_none()
    
    if not quote:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    
    if quote.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta cotización")
    
    if quote.status != QuoteStatus.quoted:
        raise HTTPException(status_code=400, detail="Solo puedes responder a cotizaciones con precio asignado")
    
    if data.action == "accept":
        # Crear viaje automáticamente
        new_trip = Trip(
            origin=quote.origin,
            destination=quote.destination,
            departure_date=quote.preferred_date,
            is_international=quote.is_international,
            total_spaces=quote.pallet_count,
            price_per_space=quote.quoted_price / quote.pallet_count if quote.pallet_count > 0 else quote.quoted_price,
            currency=quote.quoted_currency,
            status=TripStatus.scheduled,
            notes_internal=f"Viaje creado desde cotización {quote.id}. Cliente: {current_user.full_name}",
            created_by=current_user.id
        )
        db.add(new_trip)
        await db.flush()
        
        quote.created_trip_id = new_trip.id
        quote.status = QuoteStatus.accepted
        quote.client_response = data.message
        
        await db.commit()
        
        return {
            "message": "Cotización aceptada. Viaje creado.",
            "status": quote.status.value,
            "trip_id": str(new_trip.id)
        }
    
    elif data.action == "negotiate":
        quote.status = QuoteStatus.negotiating
        quote.client_response = data.message
        await db.commit()
        
        return {"message": "Solicitud de negociación enviada", "status": quote.status.value}
    
    elif data.action == "reject":
        quote.status = QuoteStatus.rejected
        quote.client_response = data.message
        await db.commit()
        
        return {"message": "Cotización rechazada", "status": quote.status.value}
    
    else:
        raise HTTPException(status_code=400, detail="Acción inválida. Usa: accept, negotiate, reject")


@router.delete("/{quote_id}")
async def delete_quote(
    quote_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.manager, UserRole.superadmin]))
):
    """Admin elimina una cotización."""
    result = await db.execute(select(TripQuote).where(TripQuote.id == quote_id))
    quote = result.scalar_one_or_none()
    
    if not quote:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    
    await db.delete(quote)
    await db.commit()
    
    return {"message": "Cotización eliminada"}

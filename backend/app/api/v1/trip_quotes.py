from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db_session, get_current_user
from app.core.permissions import require_manager_or_superadmin
from app.models import User, UserRole, Trip, TripStatus
from app.models.trip_quote import TripQuote, QuoteStatus
from app.models.space import Space, SpaceStatus
from app.services.notification_service import notification_service

router = APIRouter(prefix="/trip-quotes", tags=["Trip Quotes"])


# === Schemas ===

class PalletProduct(BaseModel):
    """Producto dentro de una tarima"""
    product: str  # Nombre del producto
    boxes: int = 0  # Cantidad de cajas
    weight_per_box: float = 0  # Peso por caja
    unit: str = "lbs"  # Unidad de peso (lbs o kg)

class StopPallet(BaseModel):
    """Tarima con sus productos"""
    products: List[PalletProduct] = []

class QuoteStop(BaseModel):
    name: Optional[str] = None  # Nombre identificador de la parada
    address: str
    address_reference: Optional[str] = Field(default=None, alias="address_reference")
    contact: Optional[str] = None
    phone: Optional[str] = None
    time: Optional[str] = None  # Hora de apertura (HH:MM)
    unknown_time: Optional[bool] = Field(default=False, alias="unknownTime")  # Accept camelCase
    notes: Optional[str] = None
    pallets: Optional[List[StopPallet]] = []  # Tarimas para esta parada
    
    class Config:
        populate_by_name = True  # Accept both field name and alias

class TripQuoteCreate(BaseModel):
    origin: str
    destination: str
    is_international: bool = False
    preferred_date: str  # YYYY-MM-DD
    flexible_dates: bool = False
    preferred_currency: str = "USD"  # USD or MXN
    
    # Paradas detalladas con tarimas y productos
    stops: Optional[List[QuoteStop]] = []
    
    # Opciones Internacionales
    requires_bond: bool = False
    bond_type: Optional[str] = None  # "keikichi" or "own"
    
    # Servicios
    requires_refrigeration: bool = False
    temperature_min: Optional[float] = None
    temperature_max: Optional[float] = None
    
    # Labeling
    requires_labeling: bool = False
    labeling_type: Optional[str] = None  # "keikichi" or "own"
    labeling_size: Optional[str] = None  # ID del tamaño de etiqueta
    labeling_quantity: Optional[int] = None
    
    # Pickup
    requires_pickup: bool = False
    pickup_address: Optional[str] = None
    pickup_address_reference: Optional[str] = None  # Referencia de dirección pickup
    pickup_date: Optional[datetime] = None
    pickup_contact_name: Optional[str] = None
    pickup_contact_phone: Optional[str] = None
    pickup_notes: Optional[str] = None
    
    special_requirements: Optional[str] = None


class AdminQuotePrice(BaseModel):
    quoted_price: Decimal = Field(ge=0)
    quoted_currency: str = "USD"
    free_stops: int = 0
    price_per_extra_stop: Optional[Decimal] = None
    admin_notes: Optional[str] = None


class ClientQuoteResponse(BaseModel):
    action: str  # "accept", "negotiate", "reject"
    message: Optional[str] = None


class TripQuoteOut(BaseModel):
    id: UUID
    origin: str
    destination: str
    is_international: bool
    pallet_count: Optional[int] = None  # Calculado de las tarimas
    preferred_date: str
    flexible_dates: bool
    
    @field_validator('preferred_date', mode='before')
    @classmethod
    def serialize_date(cls, v):
        """Convert date object to string for JSON serialization."""
        if hasattr(v, 'isoformat'):
            return v.isoformat()
        return v
    preferred_currency: str
    stops: Optional[List[QuoteStop]]
    requires_bond: bool
    
    requires_refrigeration: bool
    temperature_min: Optional[float]
    temperature_max: Optional[float]
    requires_labeling: bool
    labeling_type: Optional[str] = None
    labeling_size: Optional[str] = None
    labeling_quantity: Optional[int] = None
    requires_pickup: bool
    pickup_address: Optional[str]
    pickup_address_reference: Optional[str] = None
    pickup_date: Optional[datetime]
    pickup_contact_name: Optional[str] = None
    pickup_contact_phone: Optional[str] = None
    pickup_notes: Optional[str] = None
    bond_type: Optional[str] = None
    
    special_requirements: Optional[str]
    quoted_price: Optional[float]
    quoted_currency: Optional[str]
    free_stops: Optional[int]
    price_per_extra_stop: Optional[float]
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
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Cliente solicita una cotización de viaje completo."""
    from datetime import date as dt_date
    
    preferred_date = dt_date.fromisoformat(data.preferred_date)
    
    # Expira 3 días antes de la fecha preferida
    expires_at = datetime.combine(preferred_date, datetime.min.time()) - timedelta(days=3)
    if expires_at <= datetime.now():
        expires_at = datetime.now() + timedelta(days=7) # Fallback seguro
    
    # Serializar stops a dicts para JSON
    stops_data = [stop.model_dump() for stop in data.stops] if data.stops else []
    
    # Calcular el conteo total de tarimas de todas las paradas
    total_pallets = 0
    for stop in (data.stops or []):
        total_pallets += len(stop.pallets or [])

    quote = TripQuote(
        client_id=current_user.id,
        origin=data.origin,
        destination=data.destination,
        is_international=data.is_international,
        pallet_count=total_pallets if total_pallets > 0 else 1,  # Mínimo 1
        preferred_date=preferred_date,
        flexible_dates=data.flexible_dates,
        preferred_currency=data.preferred_currency,
        stops=stops_data,
        requires_bond=data.requires_bond,
        bond_type=data.bond_type,
        
        requires_refrigeration=data.requires_refrigeration,
        temperature_min=data.temperature_min,
        temperature_max=data.temperature_max,
        
        # Labeling
        requires_labeling=data.requires_labeling,
        labeling_type=data.labeling_type,
        labeling_size=data.labeling_size,
        labeling_quantity=data.labeling_quantity,
        
        # Pickup
        requires_pickup=data.requires_pickup,
        pickup_address=data.pickup_address,
        pickup_address_reference=data.pickup_address_reference,
        pickup_date=data.pickup_date,
        pickup_contact_name=data.pickup_contact_name,
        pickup_contact_phone=data.pickup_contact_phone,
        pickup_notes=data.pickup_notes,
        
        special_requirements=data.special_requirements,
        status=QuoteStatus.pending,
        expires_at=expires_at
    )
    
    db.add(quote)
    await db.commit()
    await db.refresh(quote)

    # Notify admins about new quote request
    await notification_service.notify_quote_created(quote, current_user)

    return quote # Pydantic v2 handles from_attributes mapping gracefully


@router.get("", response_model=List[TripQuoteOut])
async def list_quotes(
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db_session),
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
    
    return quotes


@router.get("/{quote_id}", response_model=TripQuoteOut)
async def get_quote(
    quote_id: UUID,
    db: AsyncSession = Depends(get_db_session),
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
    
    return quote


@router.patch("/{quote_id}/quote")
async def admin_set_quote(
    quote_id: UUID,
    data: AdminQuotePrice,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(require_manager_or_superadmin)
):
    """Admin asigna un precio a la cotización."""
    result = await db.execute(
        select(TripQuote)
        .options(selectinload(TripQuote.client))
        .where(TripQuote.id == quote_id)
    )
    quote = result.scalar_one_or_none()

    if not quote:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")

    if quote.status not in [QuoteStatus.pending, QuoteStatus.negotiating]:
        raise HTTPException(status_code=400, detail="No se puede cotizar en este estado")

    quote.quoted_price = data.quoted_price
    quote.quoted_currency = data.quoted_currency
    quote.free_stops = data.free_stops
    quote.price_per_extra_stop = data.price_per_extra_stop
    quote.admin_notes = data.admin_notes
    quote.quoted_by = current_user.id
    quote.quoted_at = datetime.now()
    quote.status = QuoteStatus.quoted

    await db.commit()
    
    # Refresh to get updated data including client relationship
    await db.refresh(quote, ["client"])

    # Notify client about the price (only if client has email)
    if quote.client and quote.client.email:
        await notification_service.notify_quote_priced(quote, quote.client)

    return {"message": "Cotización enviada al cliente", "status": quote.status.value}


@router.patch("/{quote_id}/respond")
async def client_respond(
    quote_id: UUID,
    data: ClientQuoteResponse,
    db: AsyncSession = Depends(get_db_session),
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

    # Validar que la cotización no haya expirado
    if quote.expires_at and quote.expires_at < datetime.now():
        quote.status = QuoteStatus.expired
        await db.commit()
        raise HTTPException(status_code=400, detail="Esta cotización ha expirado")

    if data.action == "accept":
        # Crear viaje automáticamente
        price_per_space = quote.quoted_price / quote.pallet_count if quote.pallet_count > 0 else quote.quoted_price
        new_trip = Trip(
            origin=quote.origin,
            destination=quote.destination,
            departure_date=quote.preferred_date,
            is_international=quote.is_international,
            total_spaces=quote.pallet_count,
            price_per_space=price_per_space,
            currency=quote.quoted_currency,
            status=TripStatus.scheduled,
            notes_internal=f"Viaje creado desde cotización {quote.id}. Cliente: {current_user.full_name}",
            created_by=current_user.id
        )
        db.add(new_trip)
        await db.flush()

        # Crear espacios para el viaje
        for idx in range(1, quote.pallet_count + 1):
            space = Space(
                trip_id=new_trip.id,
                space_number=idx,
                status=SpaceStatus.available,
                price=price_per_space
            )
            db.add(space)

        quote.created_trip_id = new_trip.id
        quote.status = QuoteStatus.accepted
        quote.client_response = data.message

        await db.commit()

        # Notify admins
        await notification_service.notify_quote_response(
            quote, current_user, "accept"
        )

        return {
            "message": "Cotización aceptada. Viaje creado.",
            "status": quote.status.value,
            "trip_id": str(new_trip.id)
        }

    elif data.action == "negotiate":
        quote.status = QuoteStatus.negotiating
        quote.client_response = data.message
        await db.commit()

        # Notify admins
        await notification_service.notify_quote_response(
            quote, current_user, "negotiate"
        )

        return {
            "message": "Solicitud de negociación enviada",
            "status": quote.status.value
        }

    elif data.action == "reject":
        quote.status = QuoteStatus.rejected
        quote.client_response = data.message
        await db.commit()

        # Notify admins
        await notification_service.notify_quote_response(
            quote, current_user, "reject"
        )

        return {
            "message": "Cotización rechazada",
            "status": quote.status.value
        }
    
    else:
        raise HTTPException(status_code=400, detail="Acción inválida. Usa: accept, negotiate, reject")


@router.delete("/{quote_id}")
async def delete_quote(
    quote_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(require_manager_or_superadmin)
):
    """Admin elimina una cotización."""
    result = await db.execute(select(TripQuote).where(TripQuote.id == quote_id))
    quote = result.scalar_one_or_none()
    
    if not quote:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    
    await db.delete(quote)
    await db.commit()
    
    return {"message": "Cotización eliminada"}

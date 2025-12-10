import enum
import uuid
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.models.base import Base


class QuoteStatus(str, enum.Enum):
    pending = "pending"             # Esperando precio de admin
    quoted = "quoted"               # Admin envió precio
    negotiating = "negotiating"     # Cliente pidió mejor precio
    accepted = "accepted"           # Cliente aceptó → crea viaje
    rejected = "rejected"           # Cliente rechazó
    expired = "expired"             # Expiró sin respuesta


class TripQuote(Base):
    """
    Solicitud de viaje completo/privado por parte de un cliente.
    El admin cotiza y el cliente puede aceptar, negociar o rechazar.
    """
    __tablename__ = "trip_quotes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Cliente que solicita
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Detalles del viaje
    origin = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    is_international = Column(Boolean, nullable=False, default=False)
    pallet_count = Column(Integer, nullable=False)
    preferred_date = Column(Date, nullable=False)
    flexible_dates = Column(Boolean, nullable=False, default=False)
    preferred_currency = Column(String(3), nullable=False, default="USD")  # USD o MXN
    
    # Internacional: tiradas (paradas en bodegas)
    tiradas = Column(Integer, nullable=True, default=0)
    requires_bond = Column(Boolean, nullable=False, default=False)  # Usa fianza Keikichi
    
    # Carga con temperatura controlada
    requires_refrigeration = Column(Boolean, nullable=False, default=False)
    temperature_min = Column(Numeric(5, 2), nullable=True)  # Grados Celsius
    temperature_max = Column(Numeric(5, 2), nullable=True)
    
    # Información adicional
    pickup_address = Column(Text, nullable=True)
    special_requirements = Column(Text, nullable=True)
    
    # Cotización del admin
    quoted_price = Column(Numeric(12, 2), nullable=True)
    quoted_currency = Column(String(3), nullable=True)
    free_tiradas = Column(Integer, nullable=True, default=0)  # Tiradas incluidas en precio
    price_per_extra_tirada = Column(Numeric(10, 2), nullable=True)
    admin_notes = Column(Text, nullable=True)
    quoted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    quoted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Estado y respuesta del cliente
    status = Column(Enum(QuoteStatus, name="quote_status"), nullable=False, default=QuoteStatus.pending, index=True)
    client_response = Column(Text, nullable=True)  # Mensaje al negociar o rechazar
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)  # 3 días antes de preferred_date
    
    # Si se acepta, referencia al viaje creado
    created_trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=True)
    
    # Relaciones
    client = relationship("User", foreign_keys=[client_id])
    quoted_by_user = relationship("User", foreign_keys=[quoted_by])
    created_trip = relationship("Trip", foreign_keys=[created_trip_id])

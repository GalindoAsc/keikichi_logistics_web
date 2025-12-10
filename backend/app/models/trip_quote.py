import enum
import uuid
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, Boolean, JSON

# ... (imports)

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
    
    # Paradas / Tiradas (JSON con lista de direcciones)
    # Estructura: [{"address": "...", "date": "...", "contact": "...", "notes": "..."}]
    stops = Column(JSON, nullable=True)
    
    # Opciones Internacionales
    requires_bond = Column(Boolean, nullable=False, default=False)  # Usa fianza Keikichi
    
    # Detalles de Mercancía
    merchandise_type = Column(String(100), nullable=True)  # Ej: Perecederos, Secos, etc.
    merchandise_weight = Column(String(50), nullable=True) # Ej: 20 toneladas
    merchandise_description = Column(Text, nullable=True)
    
    # Servicios Adicionales
    requires_refrigeration = Column(Boolean, nullable=False, default=False)
    temperature_min = Column(Numeric(5, 2), nullable=True)
    temperature_max = Column(Numeric(5, 2), nullable=True)
    
    requires_labeling = Column(Boolean, nullable=False, default=False)
    requires_pickup = Column(Boolean, nullable=False, default=False)
    pickup_address = Column(Text, nullable=True)
    pickup_date = Column(DateTime(timezone=True), nullable=True)
    
    # Información adicional
    special_requirements = Column(Text, nullable=True)
    
    # Cotización del admin
    quoted_price = Column(Numeric(12, 2), nullable=True)
    quoted_currency = Column(String(3), nullable=True)
    free_stops = Column(Integer, nullable=True, default=0) # Reemplaza free_tiradas
    price_per_extra_stop = Column(Numeric(10, 2), nullable=True) # Reemplaza price_per_extra_tirada
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

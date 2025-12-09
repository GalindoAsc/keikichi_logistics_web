from datetime import datetime, time, date
from decimal import Decimal
from typing import List, Optional, Dict, Any, Union
from uuid import UUID
from pydantic import BaseModel, Field, field_validator

from app.models.reservation import PaymentMethod, PaymentStatus, ReservationStatus


# ==================== Hold Requests ====================

class HoldSpacesRequest(BaseModel):
    """Request to create a temporary hold on spaces"""
    trip_id: str = Field(..., description="ID del viaje")
    space_ids: List[str] = Field(..., min_length=1, description="IDs de espacios a reservar (mínimo 1)")

    @field_validator('space_ids')
    @classmethod
    def validate_space_ids(cls, v):
        if len(v) < 1:
            raise ValueError('Debe seleccionar al menos un espacio')
        if len(set(v)) != len(v):
            raise ValueError('No puede seleccionar el mismo espacio dos veces')
        return v


class HoldSpacesResponse(BaseModel):
    """Response after creating a hold"""
    message: str
    trip_id: str
    space_ids: List[str]
    spaces_count: int
    hold_expires_at: datetime
    expires_in_minutes: int

    model_config = {"from_attributes": True}


# ==================== Load Items ====================

class LabelingDetail(BaseModel):
    quantity: int
    dimensions: str
    file_id: Optional[UUID] = None


class LoadItemCreate(BaseModel):
    product_name: str
    box_count: int
    total_weight: float
    weight_unit: str = "kg"
    packaging_type: Optional[str] = None
    space_id: Optional[UUID] = None
    
    # Labeling
    labeling_required: bool = False
    label_quantity: Optional[int] = None
    label_dimensions: Optional[str] = None
    label_file_id: Optional[UUID] = None
    
    services: Optional[Dict[str, Any]] = None

class LoadItemResponse(LoadItemCreate):
    id: UUID
    reservation_id: UUID

    model_config = {"from_attributes": True}


# ==================== Reservation Create/Update ====================

class ReservationCreate(BaseModel):
    """Create a new reservation from an existing hold"""
    trip_id: str = Field(..., description="ID del viaje")
    space_ids: List[str] = Field(..., min_length=1, description="IDs de espacios reservados")
    payment_method: PaymentMethod = Field(..., description="Método de pago")
    
    # Items (New)
    items: List[LoadItemCreate] = Field(..., min_length=1, description="Lista de productos")

    # International & Bond
    is_international: bool = False
    use_own_bond: bool = False
    bond_file_id: Optional[UUID] = None

    # Labeling (General)
    labeling_required: bool = False
    label_quantity: Optional[int] = None
    label_dimensions: Optional[str] = None
    label_file_id: Optional[UUID] = None

    # Pickup
    request_pickup: bool = False
    pickup_details: Optional[Dict[str, Any]] = None

    # Invoice
    requires_invoice: bool = Field(default=False, description="¿Requiere factura?")
    invoice_data_id: Optional[UUID] = None
    billing_company_name: Optional[str] = None
    billing_rfc: Optional[str] = None
    cfdi_use: Optional[str] = None
    billing_contact_methods: Optional[str] = None
    
    # Optional discount
    discount_amount: Optional[Decimal] = Field(default=None, ge=0, description="Monto de descuento (opcional)")
    discount_reason: Optional[str] = Field(default=None, max_length=255, description="Razón del descuento")

    @field_validator('space_ids')
    @classmethod
    def validate_space_ids(cls, v):
        if len(v) < 1:
            raise ValueError('Debe seleccionar al menos un espacio')
        if len(set(v)) != len(v):
            raise ValueError('No puede seleccionar el mismo espacio dos veces')
        return v


class ReservationUpdate(BaseModel):
    """Update reservation details (only before payment)"""

    requires_invoice: Optional[bool] = None
    payment_method: Optional[PaymentMethod] = None


class ReservationCreateAdmin(BaseModel):
    """Create a reservation as admin (simplified, no payment)"""
    trip_id: str = Field(..., description="ID del viaje")
    space_ids: List[str] = Field(..., min_length=1, description="IDs de espacios reservados")
    
    # Optional items (if not provided, creates a default "Internal" item)
    items: Optional[List[LoadItemCreate]] = None
    
    # Optional client (if not provided, assigned to current admin/manager)
    client_id: Optional[str] = None
    
    notes: Optional[str] = None

    @field_validator('space_ids')
    @classmethod
    def validate_space_ids(cls, v):
        if len(v) < 1:
            raise ValueError('Debe seleccionar al menos un espacio')
        if len(set(v)) != len(v):
            raise ValueError('No puede seleccionar el mismo espacio dos veces')
        return v


# ==================== Reservation Response ====================

class ReservationSpaceDetail(BaseModel):
    """Space details within a reservation"""
    id: str
    space_number: int
    price: Optional[Decimal] = None

    model_config = {"from_attributes": True}


class ReservationTripDetail(BaseModel):
    """Trip summary for reservation"""
    id: str
    origin: str
    destination: str
    departure_date: str
    departure_time: Optional[str] = None
    price_per_space: Decimal
    tax_rate: Decimal
    tax_included: bool
    is_international: bool = False

    model_config = {"from_attributes": True}


class ReservationResponse(BaseModel):
    """Complete reservation details"""
    id: UUID
    client_id: UUID
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    trip_id: UUID
    
    # Status
    status: ReservationStatus
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    
    # Amounts
    subtotal: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    discount_amount: Decimal
    discount_reason: Optional[str] = None
    
    # International & Bond
    is_international: bool
    use_own_bond: bool
    bond_file_id: Optional[UUID] = None

    # Labeling (General) - optional since model doesn't have these
    labeling_required: Optional[bool] = False
    labeling_details: Optional[List[LabelingDetail]] = None

    # Pickup
    request_pickup: bool
    pickup_details: Optional[Dict[str, Any]] = None

    # Invoice Data
    invoice_data_id: Optional[UUID] = None
    billing_company_name: Optional[str] = None
    billing_rfc: Optional[str] = None
    cfdi_use: Optional[str] = None
    billing_contact_methods: Optional[str] = None
    
    # Invoice
    requires_invoice: bool
    invoice_pdf_path: Optional[str] = None
    invoice_xml_path: Optional[str] = None
    ticket_pdf_path: Optional[str] = None
    
    # Payment
    payment_proof_path: Optional[str] = None
    payment_confirmed_at: Optional[datetime] = None
    payment_confirmed_by: Optional[Union[UUID, str]] = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    # Relations (optional - loaded separately if needed)
    spaces: Optional[List[ReservationSpaceDetail]] = None
    items: Optional[List[LoadItemResponse]] = None
    trip: Optional[ReservationTripDetail] = None

    model_config = {"from_attributes": True}


class ReservationListItem(BaseModel):
    """Simplified reservation for list view"""
    id: str
    trip_id: str
    status: ReservationStatus
    payment_status: PaymentStatus
    payment_method: PaymentMethod
    total_amount: Decimal
    spaces_count: int
    created_at: datetime
    
    # Trip summary
    trip_origin: Optional[str] = None
    trip_destination: Optional[str] = None
    trip_departure_date: Optional[str] = None
    
    # Client info
    client_name: Optional[str] = None
    
    # Currency
    currency: Optional[str] = "USD"

    model_config = {"from_attributes": True}


class ReservationListResponse(BaseModel):
    """Paginated list of reservations"""
    items: List[ReservationListItem]
    total: int
    page: int
    page_size: int
    pages: int


# ==================== Payment Proof ====================

class PaymentProofUploadResponse(BaseModel):
    """Response after uploading payment proof"""
    message: str
    reservation_id: str
    payment_status: PaymentStatus
    payment_proof_path: str


class ConfirmPaymentRequest(BaseModel):
    """Admin/Manager confirms or rejects payment"""
    approved: bool = Field(..., description="¿Aprobar el pago?")
    notes: Optional[str] = Field(None, max_length=500, description="Notas del revisor")


class ConfirmPaymentResponse(BaseModel):
    """Response after payment confirmation"""
    message: str
    reservation_id: str
    payment_status: PaymentStatus
    ticket_pdf_path: Optional[str] = None


# ==================== Price Calculation ====================

class PriceCalculation(BaseModel):
    """Price breakdown"""
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    spaces_count: int
    price_per_space: Decimal
    tax_rate: Decimal
    tax_included: bool

// Reservation Types for Keikichi Logistics

export enum ReservationStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    CANCELLED = 'cancelled'
}

export enum PaymentMethod {
    CASH = 'cash',
    BANK_TRANSFER = 'bank_transfer',
    MERCADOPAGO = 'mercadopago'
}

export enum PaymentStatus {
    UNPAID = 'unpaid',
    PENDING_REVIEW = 'pending_review',
    PAID = 'paid',
    REFUNDED = 'refunded'
}

export interface ReservationSpace {
    id: string;
    space_number: number;
    price: number | null;
}

export interface ReservationTrip {
    id: string;
    origin: string;
    destination: string;
    departure_date: string;
    departure_time: string | null;
    price_per_space: number;
    tax_rate: number;
    tax_included: boolean;
    currency?: string;
}

export interface Reservation {
    id: string;
    client_id: string;
    client_name?: string;
    client_email?: string;
    client_phone?: string;
    trip_id: string;

    // Status
    status: ReservationStatus;
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;

    // Amounts
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    discount_amount: number;
    discount_reason: string | null;

    // International & Bond
    is_international: boolean;
    use_own_bond: boolean;
    bond_file_id: string | null;

    // Pickup
    request_pickup: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pickup_details: any;

    // Invoice
    requires_invoice: boolean;
    invoice_data_id: string | null;
    invoice_pdf_path: string | null;
    invoice_xml_path: string | null;
    ticket_pdf_path: string | null;

    // Payment
    payment_proof_path: string | null;
    payment_confirmed_at: string | null;
    payment_confirmed_by: string | null;

    // Timestamps
    created_at: string;
    updated_at: string;

    // Relations
    spaces?: ReservationSpace[];
    items?: LoadItem[];
    trip?: ReservationTrip;
}

export interface ReservationListItem {
    id: string;
    trip_id: string;
    status: ReservationStatus;
    payment_status: PaymentStatus;
    payment_method: PaymentMethod;
    total_amount: number;
    spaces_count: number;
    created_at: string;

    // Trip summary
    trip_origin: string | null;
    trip_destination: string | null;
    trip_departure_date: string | null;
    client_name?: string;
    currency?: string;
}

export interface HoldSpacesRequest {
    trip_id: string;
    space_ids: string[];
}

export interface HoldSpacesResponse {
    message: string;
    trip_id: string;
    space_ids: string[];
    spaces_count: number;
    hold_expires_at: string;
    expires_in_minutes: number;
}

export interface LabelingDetail {
    quantity: number;
    dimensions: string;
    file_id?: string;
}

export interface LoadItemCreate {
    product_name: string;
    box_count: number;
    total_weight: number;
    weight_unit?: string;
    packaging_type?: string;

    // Labeling
    labeling_required?: boolean;
    label_quantity?: number;
    label_dimensions?: string;
    label_file_id?: string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    services?: Record<string, any>;
}

export interface LoadItem extends LoadItemCreate {
    id: string;
    reservation_id: string;
}

export interface ReservationCreateData {
    trip_id: string;
    space_ids: string[];
    items: LoadItemCreate[];

    // International Trip
    is_international: boolean;
    use_own_bond: boolean;
    bond_file_id?: string;

    // Pickup
    request_pickup?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pickup_details?: Record<string, any>;

    // Invoice
    requires_invoice: boolean;
    billing_company_name?: string;
    billing_rfc?: string;
    cfdi_use?: string;
    billing_contact_methods?: string;
    invoice_data_id?: string;

    payment_method: PaymentMethod;

    // Labeling (Aggregated)
    labeling_details?: LabelingDetail[];

    discount_amount?: number;
    discount_reason?: string;
}

export interface ReservationUpdateData {
    cargo_type?: string;
    cargo_description?: string;
    cargo_weight?: number;
    cargo_value?: number;
    requires_invoice?: boolean;
    payment_method?: PaymentMethod;
}

export interface ConfirmPaymentRequest {
    approved: boolean;
    notes?: string;
}

export interface PaginatedReservations {
    items: ReservationListItem[];
    total: number;
    page: number;
    page_size: number;
    pages: number;
}

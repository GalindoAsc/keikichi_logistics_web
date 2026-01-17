import api from "./client";

export interface QuoteStop {
    name?: string;  // Nombre identificador de la parada (para autocompletado)
    address: string;
    contact?: string;
    phone?: string;
    time?: string;  // Hora de apertura (HH:MM)
    unknownTime?: boolean;  // No conoce la hora
    notes?: string;
}

export interface TripQuoteCreate {
    origin: string;
    destination: string;
    is_international: boolean;
    pallet_count: number;
    preferred_date: string;
    flexible_dates: boolean;
    preferred_currency: "USD" | "MXN";
    stops?: QuoteStop[];
    requires_bond: boolean;
    merchandise_type?: string;
    merchandise_weight?: string;
    merchandise_description?: string;
    requires_refrigeration: boolean;
    temperature_min?: number;
    temperature_max?: number;
    requires_labeling: boolean;
    requires_pickup: boolean;
    pickup_address?: string;
    pickup_date?: string;
    special_requirements?: string;
}

export interface AdminQuotePrice {
    quoted_price: number;
    quoted_currency: "USD" | "MXN";
    free_stops: number;
    price_per_extra_stop?: number;
    admin_notes?: string;
}

export interface ClientQuoteResponse {
    action: "accept" | "negotiate" | "reject";
    message?: string;
}

export interface TripQuote {
    id: string;
    origin: string;
    destination: string;
    status: "pending" | "quoted" | "negotiating" | "accepted" | "rejected";
    created_at: string;
    client_name?: string;
    // Add other fields as needed for list view
}

export interface TripQuoteDetail extends TripQuote {
    pallet_count: number;
    preferred_date: string;
    stops: QuoteStop[];
    merchandise_description?: string;
    quoted_price?: number;
    quoted_currency?: string;
    admin_notes?: string;
    // ... all other fields
}

export const createQuote = async (data: TripQuoteCreate): Promise<TripQuote> => {
    const { data: response } = await api.post<TripQuote>("/trip-quotes", data);
    return response;
};

export const getQuotes = async (status?: string): Promise<TripQuote[]> => {
    const { data } = await api.get<TripQuote[]>("/trip-quotes", { params: { status } });
    return data;
};

export const getQuote = async (id: string): Promise<TripQuoteDetail> => {
    const { data } = await api.get<TripQuoteDetail>(`/trip-quotes/${id}`);
    return data;
};

export const setAdminQuote = async (id: string, data: AdminQuotePrice): Promise<void> => {
    await api.patch(`/trip-quotes/${id}/quote`, data);
};

export const respondToQuote = async (id: string, data: ClientQuoteResponse): Promise<any> => {
    const { data: response } = await api.patch(`/trip-quotes/${id}/respond`, data);
    return response;
};

export const deleteQuote = async (id: string): Promise<void> => {
    await api.delete(`/trip-quotes/${id}`);
};

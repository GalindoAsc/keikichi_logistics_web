import api from './client';
import type {
    Reservation,
    PaginatedReservations,
    HoldSpacesRequest,
    HoldSpacesResponse,
    ReservationCreateData,
    ReservationUpdateData,
    ConfirmPaymentRequest,
    ReservationStatus,
    PaymentStatus
} from '../types/reservation';

/**
 * Create temporary hold on spaces
 */
export const createHold = async (data: HoldSpacesRequest): Promise<HoldSpacesResponse> => {
    const response = await api.post('/reservations/hold', data);
    return response.data;
};

/**
 * Create reservation from hold
 */
export const createReservation = async (data: ReservationCreateData): Promise<Reservation> => {
    const response = await api.post('/reservations', data);
    return response.data;
};

/**
 * Get paginated list of reservations
 */
export const getReservations = async (
    page: number = 1,
    page_size: number = 20,
    filters?: {
        trip_id?: string;
        client_id?: string;
        status?: ReservationStatus;
        payment_status?: PaymentStatus;
    }
): Promise<PaginatedReservations> => {
    const params = {
        page,
        page_size,
        ...filters
    };
    const response = await api.get('/reservations', { params });
    return response.data;
};

/**
 * Get reservation by ID
 */
export const getReservationById = async (id: string): Promise<Reservation> => {
    const response = await api.get(`/reservations/${id}`);
    return response.data;
};

/**
 * Update reservation
 */
export const updateReservation = async (
    id: string,
    data: ReservationUpdateData
): Promise<Reservation> => {
    const response = await api.patch(`/reservations/${id}`, data);
    return response.data;
};

/**
 * Cancel reservation
 */
export const cancelReservation = async (id: string): Promise<void> => {
    await api.post(`/reservations/${id}/cancel`);
};

/**
 * Hard delete reservation (Admin only)
 */
export const deleteReservation = async (id: string): Promise<void> => {
    await api.delete(`/reservations/${id}`);
};

/**
 * Upload payment proof
 */
export const uploadPaymentProof = async (
    id: string,
    file: File
): Promise<{ message: string; payment_status: PaymentStatus; payment_proof_path: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/reservations/${id}/payment-proof`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

/**
 * Confirm or reject payment (Admin/Manager only)
 */
export const confirmPayment = async (
    id: string,
    data: ConfirmPaymentRequest
): Promise<{ message: string; payment_status: PaymentStatus; ticket_pdf_path: string | null }> => {
    const response = await api.post(`/reservations/${id}/confirm-payment`, data);
    return response.data;
};

/**
 * Download ticket PDF
 */
export const downloadTicket = async (id: string): Promise<Blob> => {
    const response = await api.get(`/reservations/${id}/ticket`, {
        responseType: 'blob'
    });
    return response.data;
};

/**
 * Helper to download ticket and trigger browser download
 */
export const downloadAndSaveTicket = async (id: string, filename?: string): Promise<void> => {
    const blob = await downloadTicket(id);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `ticket_${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

/**
 * Download pre-reservation summary PDF
 */
export const downloadSummary = async (id: string): Promise<Blob> => {
    const response = await api.get(`/reservations/${id}/summary-pdf`, {
        responseType: 'blob'
    });
    return response.data;
};

/**
 * Helper to download summary and trigger browser download
 */
export const downloadAndSaveSummary = async (id: string): Promise<void> => {
    try {
        // Use axios api instance which handles auth and has correct baseURL
        const response = await api.get(`/reservations/${id}/summary-pdf`, {
            responseType: 'blob',
            headers: {
                'Accept': 'application/pdf'
            }
        });

        // Ensure we have valid data
        if (!response.data || response.data.size === 0) {
            throw new Error('Empty response received');
        }

        // Create blob with explicit PDF type
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        // Open in new window - this works better on Mac Chrome
        // User can then save from the PDF viewer
        const newWindow = window.open(blobUrl, '_blank');

        if (!newWindow) {
            // If popup blocked, fallback to download link
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `resumen_${id.slice(0, 8)}.pdf`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Cleanup after delay
        setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
        }, 10000);

    } catch (error) {
        console.error('Download error:', error);
        throw error;
    }
};

/**
 * Get audit history for a reservation (Admin only)
 */
export interface AuditLogEntry {
    id: string;
    action: string;
    performed_by: string;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    created_at: string;
}

export const getAuditHistory = async (reservationId: string): Promise<{ audit_history: AuditLogEntry[] }> => {
    const response = await api.get(`/reservations/${reservationId}/audit-history`);
    return response.data;
};

// Translation utilities for status labels and enums
import { ReservationStatus, PaymentStatus, PaymentMethod } from './reservation';
import { TripStatus } from './trip';

// Reservation Status Labels
export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
    [ReservationStatus.PENDING]: 'Pendiente',
    [ReservationStatus.CONFIRMED]: 'Confirmada',
    [ReservationStatus.CANCELLED]: 'Cancelada',
};

// Payment Status Labels
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    [PaymentStatus.UNPAID]: 'Por Pagar',
    [PaymentStatus.PENDING_REVIEW]: 'Pago Pendiente',
    [PaymentStatus.PAID]: 'Pagado',
    [PaymentStatus.REFUNDED]: 'Reembolsado',
};

// Trip Status Labels
export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
    'scheduled': 'Programado',
    'in_transit': 'En Tránsito',
    'completed': 'Completado',
    'cancelled': 'Cancelado',
};

// Payment Method Labels
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    [PaymentMethod.CASH]: 'Efectivo',
    [PaymentMethod.BANK_TRANSFER]: 'Transferencia',
    [PaymentMethod.MERCADOPAGO]: 'MercadoPago',
};

// Space Status Labels
export const SPACE_STATUS_LABELS: Record<string, string> = {
    'available': 'Disponible',
    'reserved': 'Reservado',
    'blocked': 'Bloqueado',
    'on_hold': 'En Espera',
    'internal': 'Interno',
};

// Helper function to get translated label safely
export function getStatusLabel<T extends string>(
    status: T,
    labels: Record<T, string>,
    fallback?: string
): string {
    return labels[status] || fallback || status;
}

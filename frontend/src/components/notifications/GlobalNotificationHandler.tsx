import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSocketStore } from '../../stores/socketStore';
import { authStore } from '../../stores/authStore';

/**
 * Global notification handler for real-time events
 * Handles DATA_UPDATE events and invalidates queries for UI updates
 */
export function GlobalNotificationHandler() {
    const queryClient = useQueryClient();
    const { subscribe, unsubscribe, connect } = useSocketStore();
    const { user } = authStore();

    useEffect(() => {
        if (user) {
            connect();
        }
    }, [user, connect]);

    useEffect(() => {
        const handleDataUpdate = (data: any) => {
            if (import.meta.env.DEV) {
                console.log('[GlobalNotificationHandler] DATA_UPDATE:', data);
            }

            const { event, data: eventData } = data;

            // Invalidate queries based on event type
            switch (event) {
                case 'TRIP_CREATED':
                case 'TRIP_UPDATED':
                case 'TRIP_CANCELLED':
                case 'TRIP_DELETED':
                    // Invalidate trips list
                    queryClient.invalidateQueries({ queryKey: ['trips'] });
                    queryClient.invalidateQueries({ queryKey: ['admin-trips'] });
                    toast.info(eventData?.message || 'Viajes actualizados');
                    break;

                case 'RESERVATION_CREATED':
                case 'RESERVATION_UPDATED':
                case 'RESERVATION_CANCELLED':
                case 'RESERVATION_CONFIRMED':
                    // Invalidate reservations
                    queryClient.invalidateQueries({ queryKey: ['reservations'] });
                    queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
                    toast.info(eventData?.message || 'Reservaciones actualizadas');
                    break;

                case 'PAYMENT_APPROVED':
                case 'PAYMENT_REJECTED':
                case 'PAYMENT_PENDING':
                    // Invalidate reservations
                    queryClient.invalidateQueries({ queryKey: ['reservations'] });
                    queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
                    break;

                case 'SPACE_RELEASED':
                    // Invalidate trips to show updated space availability
                    queryClient.invalidateQueries({ queryKey: ['trips'] });
                    queryClient.invalidateQueries({ queryKey: ['trip-spaces'] });
                    toast.success('Nuevos espacios disponibles');
                    break;

                case 'ACCOUNT_VERIFIED':
                    // Invalidate user data
                    queryClient.invalidateQueries({ queryKey: ['users'] });
                    break;

                default:
                    if (import.meta.env.DEV) {
                        console.log('[GlobalNotificationHandler] Unknown event:', event);
                    }
            }
        };

        subscribe('DATA_UPDATE', handleDataUpdate);

        return () => {
            unsubscribe('DATA_UPDATE', handleDataUpdate);
        };
    }, [subscribe, unsubscribe, queryClient]);

    // This component doesn't render anything
    return null;
}

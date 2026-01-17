import { useEffect, useRef, useCallback } from 'react';
import { authStore } from '../stores/authStore';

interface SpaceUpdateData {
    space_id: string;
    space_number: number;
    status: string;
    trip_id: string;
}

interface UseSpaceSocketOptions {
    tripId: string;
    onSpaceUpdate?: (data: SpaceUpdateData) => void;
    enabled?: boolean;
}

/**
 * Hook to connect to the space WebSocket for real-time updates.
 * Each client watching a trip gets instant updates when spaces change.
 */
export function useSpaceSocket({ tripId, onSpaceUpdate, enabled = true }: UseSpaceSocketOptions) {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const connect = useCallback(() => {
        const { accessToken } = authStore.getState();
        if (!accessToken || !tripId || !enabled) return;

        // Close existing connection if any
        if (wsRef.current) {
            wsRef.current.close();
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // In production, connect through nginx proxy (same host as frontend)
        // In development, connect directly to backend on localhost:8000
        const host = import.meta.env.DEV ? 'localhost:8000' : window.location.host;
        const wsUrl = `${protocol}//${host}/api/v1/spaces/ws/trip/${tripId}?token=${accessToken}`;

        if (import.meta.env.DEV) {
            console.log('[SpaceSocket] Connecting to:', wsUrl);
        }

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            if (import.meta.env.DEV) {
                console.log('[SpaceSocket] Connected to trip:', tripId);
            }
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (import.meta.env.DEV) {
                    console.log('[SpaceSocket] Received:', message);
                }

                if (message.event === 'space_update' && onSpaceUpdate) {
                    onSpaceUpdate(message.data);
                }
            } catch (error) {
                if (import.meta.env.DEV) {
                    console.error('[SpaceSocket] Parse error:', error);
                }
            }
        };

        ws.onclose = (event) => {
            if (import.meta.env.DEV) {
                console.log('[SpaceSocket] Disconnected:', event.code, event.reason);
            }
            wsRef.current = null;

            // Reconnect after 3 seconds if still enabled
            if (enabled && event.code !== 4001) { // 4001 = invalid token
                reconnectTimeoutRef.current = setTimeout(() => {
                    connect();
                }, 3000);
            }
        };

        ws.onerror = (error) => {
            if (import.meta.env.DEV) {
                console.error('[SpaceSocket] Error:', error);
            }
        };

        wsRef.current = ws;
    }, [tripId, onSpaceUpdate, enabled]);

    useEffect(() => {
        if (enabled && tripId) {
            connect();
        }

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [connect, enabled, tripId]);

    return {
        isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    };
}

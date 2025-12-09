import { create } from 'zustand';
import { authStore } from './authStore';

interface SocketState {
    socket: WebSocket | null;
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;
    listeners: Map<string, Set<(data: any, event: string) => void>>;
    subscribe: (event: string, callback: (data: any, event: string) => void) => void;
    unsubscribe: (event: string, callback: (data: any, event: string) => void) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
    socket: null,
    isConnected: false,
    listeners: new Map(),

    connect: () => {
        const { socket, isConnected } = get();
        const { user, accessToken } = authStore.getState();

        console.log('[SocketStore] Connect called', {
            hasSocket: !!socket,
            isConnected,
            hasUser: !!user,
            hasToken: !!accessToken
        });

        if (socket || isConnected || !user || !accessToken) {
            console.log('[SocketStore] Connect aborted:', {
                reason: socket ? 'already has socket' : isConnected ? 'already connected' : !user ? 'no user' : 'no token'
            });
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Use the backend host (port 8000), not the frontend host (port 5173)
        const wsUrl = `${protocol}//localhost:8000/api/v1/notifications/ws/${user.id}?token=${accessToken}`;

        console.log('[SocketStore] Attempting to connect to:', wsUrl);

        const newSocket = new WebSocket(wsUrl);

        newSocket.onopen = () => {
            console.log('WS Connected');
            set({ isConnected: true });
        };

        newSocket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('[SocketStore] Received message:', message);
                const { listeners } = get();

                // Handle specific events
                if (message.event && listeners.has(message.event)) {
                    console.log(`[SocketStore] Dispatching event '${message.event}' to ${listeners.get(message.event)?.size} listeners`);
                    listeners.get(message.event)?.forEach(cb => cb(message.data, message.event));
                }

                // Handle generic types (like NOTIFICATION)
                if (message.type && listeners.has(message.type)) {
                    console.log(`[SocketStore] Dispatching type '${message.type}' to ${listeners.get(message.type)?.size} listeners`);
                    listeners.get(message.type)?.forEach(cb => cb(message, message.type));
                }

            } catch (error) {
                console.error('WS Message Error:', error);
            }
        };

        newSocket.onclose = () => {
            console.log('WS Disconnected');
            set({ isConnected: false, socket: null });
            // Simple reconnect logic could go here
            setTimeout(() => {
                if (authStore.getState().user) {
                    get().connect();
                }
            }, 3000);
        };

        set({ socket: newSocket });
    },

    disconnect: () => {
        const { socket } = get();
        if (socket) {
            socket.close();
        }
        set({ socket: null, isConnected: false });
    },

    subscribe: (event: string, callback: (data: any, event: string) => void) => {
        const { listeners } = get();
        if (!listeners.has(event)) {
            listeners.set(event, new Set());
        }
        listeners.get(event)?.add(callback);
    },

    unsubscribe: (event: string, callback: (data: any, event: string) => void) => {
        const { listeners } = get();
        listeners.get(event)?.delete(callback);
        if (listeners.get(event)?.size === 0) {
            listeners.delete(event);
        }
    }
}));

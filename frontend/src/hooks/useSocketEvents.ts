import { useEffect, useRef } from 'react';
import { useSocketStore } from '../stores/socketStore';
import { authStore } from '../stores/authStore';

type EventHandler = (data: any, event?: string) => void;

export function useSocketEvents(event: string | string[], handler: EventHandler) {
    const { subscribe, unsubscribe, connect } = useSocketStore();
    const { user } = authStore();
    const handlerRef = useRef(handler);

    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
        if (user) {
            connect();
        }
    }, [user, connect]);

    useEffect(() => {
        const events = Array.isArray(event) ? event : [event];

        const handleEvent = (data: any, eventName: string) => {
            handlerRef.current(data, eventName);
        };

        // We need separate callbacks for each event to know which one triggered it?
        // Or we can just subscribe the same handler to all events.

        events.forEach(evt => {
            subscribe(evt, handleEvent);
        });

        return () => {
            events.forEach(evt => {
                unsubscribe(evt, handleEvent);
            });
        };
    }, [JSON.stringify(event), subscribe, unsubscribe]);
}

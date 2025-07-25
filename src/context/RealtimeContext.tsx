import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRealtimeSync, RealtimeEvent } from '../hooks/useRealtimeSync';

interface RealtimeContextType {
    emit: (type: string, payload: any, source?: 'local' | 'server') => void;
    subscribe: (type: string, listener: (event: RealtimeEvent) => void) => () => void;
    addOptimisticUpdate: <T>(id: string, type: string, data: T, revertFn?: () => void) => void;
    confirmOptimisticUpdate: (id: string) => void;
    revertOptimisticUpdate: (id: string) => void;
    getPendingUpdates: () => any[];
    isOnline: boolean;
    lastSyncTime: number;
    pendingCount: number;
    isSyncing: boolean;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const [isSyncing, setIsSyncing] = useState(false);

    const {
        emit,
        subscribe,
        addOptimisticUpdate,
        confirmOptimisticUpdate,
        revertOptimisticUpdate,
        getPendingUpdates,
        isOnline,
        lastSyncTime,
        pendingCount
    } = useRealtimeSync({
        syncInterval: 30000, // 30 seconds
        enableBroadcast: true
    });

    // Subscribe to sync events to update UI state
    useEffect(() => {
        const unsubscribeSyncStart = subscribe('sync:start', () => {
            setIsSyncing(true);
        });

        const unsubscribeSyncComplete = subscribe('sync:complete', () => {
            setIsSyncing(false);
        });

        const unsubscribeSyncError = subscribe('sync:error', () => {
            setIsSyncing(false);
        });

        return () => {
            unsubscribeSyncStart();
            unsubscribeSyncComplete();
            unsubscribeSyncError();
        };
    }, [subscribe]);

    // Auto-emit events for debugging in development
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            const unsubscribe = subscribe('*', (event: RealtimeEvent) => {
                console.log('🔄 Realtime Event:', event);
            });
            return unsubscribe;
        }
    }, [subscribe]);

    const value: RealtimeContextType = {
        isSyncing,
        subscribe,
        emit,
        addOptimisticUpdate,
        confirmOptimisticUpdate,
        revertOptimisticUpdate,
        getPendingUpdates,
        isOnline,
        lastSyncTime,
        pendingCount,
    };

    return (
        <RealtimeContext.Provider value={value}>
            {children}
        </RealtimeContext.Provider>
    );
}

export function useRealtime() {
    const context = useContext(RealtimeContext);
    if (context === undefined) {
        throw new Error('useRealtime must be used within a RealtimeProvider');
    }
    return context;
}

// Convenience hooks for specific functionality
export function useRealtimeEvent(eventType: string, handler: (event: RealtimeEvent) => void) {
    const { subscribe } = useRealtime();

    useEffect(() => {
        return subscribe(eventType, handler);
    }, [subscribe, eventType, handler]);
}

export function useOptimisticState<T>(
    initialValue: T,
    id: string,
    type: string
): [T, (newValue: T, revertFn?: () => void) => void] {
    const [value, setValue] = useState<T>(initialValue);
    const { addOptimisticUpdate } = useRealtime();

    const updateValue = (newValue: T, revertFn?: () => void) => {
        const previousValue = value;
        setValue(newValue);

        addOptimisticUpdate(
            id,
            type,
            newValue,
            revertFn || (() => setValue(previousValue))
        );
    };

    return [value, updateValue];
} 
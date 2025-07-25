import { useEffect, useRef, useCallback } from 'react';

export interface RealtimeEvent {
    type: string;
    payload: any;
    timestamp: number;
    source: 'local' | 'server';
}

export interface OptimisticUpdate<T = any> {
    id: string;
    type: string;
    data: T;
    timestamp: number;
    revert?: () => void;
}

interface UseRealtimeSyncOptions {
    syncInterval?: number;
    maxRetries?: number;
    enableBroadcast?: boolean;
}

export function useRealtimeSync(options: UseRealtimeSyncOptions = {}) {
    const {
        syncInterval = 30000, // 30 seconds
        maxRetries = 3,
        enableBroadcast = true
    } = options;

    const listeners = useRef<Map<string, Set<(event: RealtimeEvent) => void>>>(new Map());
    const pendingUpdates = useRef<Map<string, OptimisticUpdate>>(new Map());
    const lastSync = useRef<number>(Date.now());
    const syncTimer = useRef<NodeJS.Timeout>();
    const isOnline = useRef<boolean>(navigator.onLine);

    // Event broadcasting system
    const emit = useCallback((type: string, payload: any, source: 'local' | 'server' = 'local') => {
        if (!enableBroadcast) return;

        const event: RealtimeEvent = {
            type,
            payload,
            timestamp: Date.now(),
            source
        };

        const typeListeners = listeners.current.get(type);
        if (typeListeners) {
            typeListeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    console.error('Error in realtime event listener:', error);
                }
            });
        }

        // Emit to global listeners
        const globalListeners = listeners.current.get('*');
        if (globalListeners) {
            globalListeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    console.error('Error in global realtime event listener:', error);
                }
            });
        }
    }, [enableBroadcast]);

    const subscribe = useCallback((type: string, listener: (event: RealtimeEvent) => void) => {
        if (!listeners.current.has(type)) {
            listeners.current.set(type, new Set());
        }
        listeners.current.get(type)!.add(listener);

        // Return unsubscribe function
        return () => {
            const typeListeners = listeners.current.get(type);
            if (typeListeners) {
                typeListeners.delete(listener);
                if (typeListeners.size === 0) {
                    listeners.current.delete(type);
                }
            }
        };
    }, []);

    // Optimistic update management
    const addOptimisticUpdate = useCallback(<T>(
        id: string,
        type: string,
        data: T,
        revertFn?: () => void
    ) => {
        const update: OptimisticUpdate<T> = {
            id,
            type,
            data,
            timestamp: Date.now(),
            revert: revertFn
        };

        pendingUpdates.current.set(id, update);
        emit(`optimistic:${type}`, { id, data }, 'local');

        // Auto-remove after timeout if not confirmed
        setTimeout(() => {
            if (pendingUpdates.current.has(id)) {
                console.warn(`Optimistic update ${id} timed out`);
                revertOptimisticUpdate(id);
            }
        }, 10000); // 10 second timeout
    }, [emit]);

    const confirmOptimisticUpdate = useCallback((id: string) => {
        const update = pendingUpdates.current.get(id);
        if (update) {
            pendingUpdates.current.delete(id);
            emit(`confirmed:${update.type}`, { id, data: update.data }, 'server');
        }
    }, [emit]);

    const revertOptimisticUpdate = useCallback((id: string) => {
        const update = pendingUpdates.current.get(id);
        if (update) {
            if (update.revert) {
                update.revert();
            }
            pendingUpdates.current.delete(id);
            emit(`reverted:${update.type}`, { id, data: update.data }, 'local');
        }
    }, [emit]);

    // Network status monitoring
    const handleOnline = useCallback(() => {
        isOnline.current = true;
        emit('network:online', {}, 'local');
    }, [emit]);

    const handleOffline = useCallback(() => {
        isOnline.current = false;
        emit('network:offline', {}, 'local');
    }, [emit]);

    // Background sync simulation
    const performBackgroundSync = useCallback(async (
        fetchFn: () => Promise<any>,
        onConflict?: (serverData: any, localData: any) => any
    ) => {
        if (!isOnline.current) return;

        try {
            emit('sync:start', {}, 'local');
            const serverData = await fetchFn();

            // Check for conflicts with pending updates
            const conflicts = Array.from(pendingUpdates.current.values()).filter(update => {
                // This is a simplified conflict detection
                // In a real app, you'd have more sophisticated logic
                return update.timestamp > lastSync.current;
            });

            if (conflicts.length > 0 && onConflict) {
                const localData = conflicts.map(c => c.data);
                const resolvedData = onConflict(serverData, localData);
                emit('sync:conflict', { serverData, localData, resolvedData }, 'server');
                lastSync.current = Date.now();
                return resolvedData;
            }

            lastSync.current = Date.now();
            emit('sync:complete', { data: serverData }, 'server');
            return serverData;
        } catch (error) {
            emit('sync:error', { error: error instanceof Error ? error.message : 'Unknown error' }, 'local');
            throw error;
        }
    }, [emit]);

    // Auto-sync timer
    const startAutoSync = useCallback((syncFn: () => Promise<void>) => {
        if (syncTimer.current) {
            clearInterval(syncTimer.current);
        }

        syncTimer.current = setInterval(async () => {
            if (isOnline.current && document.visibilityState === 'visible') {
                try {
                    await syncFn();
                } catch (error) {
                    console.error('Auto-sync error:', error);
                }
            }
        }, syncInterval);
    }, [syncInterval]);

    const stopAutoSync = useCallback(() => {
        if (syncTimer.current) {
            clearInterval(syncTimer.current);
            syncTimer.current = undefined;
        }
    }, []);

    // Visibility change handling
    const handleVisibilityChange = useCallback(() => {
        if (document.visibilityState === 'visible') {
            emit('app:focus', {}, 'local');
        } else {
            emit('app:blur', {}, 'local');
        }
    }, [emit]);

    // Setup event listeners
    useEffect(() => {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            stopAutoSync();
        };
    }, [handleOnline, handleOffline, handleVisibilityChange, stopAutoSync]);

    return {
        // Event system
        emit,
        subscribe,

        // Optimistic updates
        addOptimisticUpdate,
        confirmOptimisticUpdate,
        revertOptimisticUpdate,
        getPendingUpdates: () => Array.from(pendingUpdates.current.values()),

        // Background sync
        performBackgroundSync,
        startAutoSync,
        stopAutoSync,

        // Status
        isOnline: isOnline.current,
        lastSyncTime: lastSync.current,
        pendingCount: pendingUpdates.current.size
    };
} 
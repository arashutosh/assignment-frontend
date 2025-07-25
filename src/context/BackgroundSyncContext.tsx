import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import { useRealtime } from './RealtimeContext';

interface BackgroundSyncContextType {
  forceSync: () => Promise<void>;
  isAutoSyncEnabled: boolean;
  toggleAutoSync: (enabled: boolean) => void;
}

const BackgroundSyncContext = createContext<BackgroundSyncContextType | undefined>(undefined);

export function BackgroundSyncProvider({ children }: { children: React.ReactNode }) {
    const app = useApp();
    const realtime = useRealtime();
    const syncIntervalRef = useRef<NodeJS.Timeout>();
    const isAutoSyncEnabledRef = useRef(true);
    const lastSyncDataRef = useRef<{
        engineers: any[];
        projects: any[];
        assignments: any[];
    } | null>(null);

    const API_BASE = 'http://localhost:5001/api';

    // Get auth headers helper
    const getAuthHeaders = (): HeadersInit => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (app.token) {
            headers.Authorization = `Bearer ${app.token}`;
        }
        return headers;
    };

    // Fetch all data from server
    const fetchServerData = async () => {
        if (!app.token) throw new Error('No authentication token');

        const [engineersRes, projectsRes, assignmentsRes] = await Promise.all([
            fetch(`${API_BASE}/engineers`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/projects`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/assignments`, { headers: getAuthHeaders() }),
        ]);

        if (!engineersRes.ok || !projectsRes.ok || !assignmentsRes.ok) {
            throw new Error('Failed to fetch server data');
        }

        const [engineers, projects, assignments] = await Promise.all([
            engineersRes.json(),
            projectsRes.json(),
            assignmentsRes.json(),
        ]);

        return { engineers, projects, assignments };
    };

    // Simple conflict resolution - server wins for now
    const resolveConflicts = (serverData: any, localData: any) => {
        console.log('🔄 Resolving conflicts between server and local data');

        // For this implementation, we'll use server data as the source of truth
        // In a real app, you'd have more sophisticated conflict resolution:
        // - Last-write-wins based on timestamps
        // - Merge strategies for different types of changes
        // - User intervention for complex conflicts

        realtime.emit('sync:conflict-resolved', {
            strategy: 'server-wins',
            serverData,
            localData
        });

        return serverData;
    };

    // Check for data changes and emit events
    const checkForChanges = (newData: any, oldData: any) => {
        if (!oldData) return;

        // Check for new items
        const newEngineers = newData.engineers.filter((e: any) =>
            !oldData.engineers.find((old: any) => old.id === e.id)
        );
        const newProjects = newData.projects.filter((p: any) =>
            !oldData.projects.find((old: any) => old.id === p.id)
        );
        const newAssignments = newData.assignments.filter((a: any) =>
            !oldData.assignments.find((old: any) => old.id === a.id)
        );

        // Check for removed items
        const removedEngineers = oldData.engineers.filter((e: any) =>
            !newData.engineers.find((new_: any) => new_.id === e.id)
        );
        const removedProjects = oldData.projects.filter((p: any) =>
            !newData.projects.find((new_: any) => new_.id === p.id)
        );
        const removedAssignments = oldData.assignments.filter((a: any) =>
            !newData.assignments.find((new_: any) => new_.id === a.id)
        );

        // Check for updated items
        const updatedEngineers = newData.engineers.filter((e: any) => {
            const old = oldData.engineers.find((old: any) => old.id === e.id);
            return old && JSON.stringify(old) !== JSON.stringify(e);
        });
        const updatedProjects = newData.projects.filter((p: any) => {
            const old = oldData.projects.find((old: any) => old.id === p.id);
            return old && JSON.stringify(old) !== JSON.stringify(p);
        });
        const updatedAssignments = newData.assignments.filter((a: any) => {
            const old = oldData.assignments.find((old: any) => old.id === a.id);
            return old && JSON.stringify(old) !== JSON.stringify(a);
        });

        // Emit events for external changes (from other users)
        newEngineers.forEach((engineer: any) => {
            realtime.emit('external:engineer:added', engineer, 'server');
        });
        newProjects.forEach((project: any) => {
            realtime.emit('external:project:added', project, 'server');
        });
        newAssignments.forEach((assignment: any) => {
            realtime.emit('external:assignment:added', assignment, 'server');
        });

        removedEngineers.forEach((engineer: any) => {
            realtime.emit('external:engineer:removed', engineer, 'server');
        });
        removedProjects.forEach((project: any) => {
            realtime.emit('external:project:removed', project, 'server');
        });
        removedAssignments.forEach((assignment: any) => {
            realtime.emit('external:assignment:removed', assignment, 'server');
        });

        updatedEngineers.forEach((engineer: any) => {
            realtime.emit('external:engineer:updated', engineer, 'server');
        });
        updatedProjects.forEach((project: any) => {
            realtime.emit('external:project:updated', project, 'server');
        });
        updatedAssignments.forEach((assignment: any) => {
            realtime.emit('external:assignment:updated', assignment, 'server');
        });

        if (newEngineers.length || newProjects.length || newAssignments.length ||
            removedEngineers.length || removedProjects.length || removedAssignments.length ||
            updatedEngineers.length || updatedProjects.length || updatedAssignments.length) {

            realtime.emit('external:changes-detected', {
                added: {
                    engineers: newEngineers.length,
                    projects: newProjects.length,
                    assignments: newAssignments.length
                },
                removed: {
                    engineers: removedEngineers.length,
                    projects: removedProjects.length,
                    assignments: removedAssignments.length
                },
                updated: {
                    engineers: updatedEngineers.length,
                    projects: updatedProjects.length,
                    assignments: updatedAssignments.length
                }
            }, 'server');
        }
    };

    // Perform background sync
    const performSync = async () => {
        if (!app.currentUser || !app.token) return;

        try {
            realtime.emit('sync:start', {}, 'local');

            const serverData = await fetchServerData();
            const currentData = {
                engineers: app.engineers,
                projects: app.projects,
                assignments: app.assignments
            };

            // Check for external changes
            if (lastSyncDataRef.current) {
                checkForChanges(serverData, lastSyncDataRef.current);
            }

            // Check for conflicts with pending optimistic updates
            const pendingUpdates = realtime.getPendingUpdates();

            if (pendingUpdates.length > 0) {
                const resolvedData = resolveConflicts(serverData, currentData);

                // Update app state with resolved data
                app.dispatch?.({ type: 'SET_ENGINEERS', payload: resolvedData.engineers });
                app.dispatch?.({ type: 'SET_PROJECTS', payload: resolvedData.projects });
                app.dispatch?.({ type: 'SET_ASSIGNMENTS', payload: resolvedData.assignments });
            } else {
                // No conflicts, just update with server data
                app.dispatch?.({ type: 'SET_ENGINEERS', payload: serverData.engineers });
                app.dispatch?.({ type: 'SET_PROJECTS', payload: serverData.projects });
                app.dispatch?.({ type: 'SET_ASSIGNMENTS', payload: serverData.assignments });
            }

            // Store current data for next comparison
            lastSyncDataRef.current = serverData;

            realtime.emit('sync:complete', { data: serverData }, 'server');
        } catch (error) {
            console.error('Background sync failed:', error);
            realtime.emit('sync:error', {
                error: error instanceof Error ? error.message : 'Unknown sync error'
            }, 'local');
        }
    };

    // Force immediate sync
    const forceSync = async () => {
        await performSync();
    };

    // Toggle auto-sync
    const toggleAutoSync = (enabled: boolean) => {
        isAutoSyncEnabledRef.current = enabled;

        if (enabled) {
            startAutoSync();
        } else {
            stopAutoSync();
        }

        realtime.emit('sync:auto-sync-toggled', { enabled }, 'local');
    };

    // Start auto-sync
    const startAutoSync = () => {
        if (syncIntervalRef.current) {
            clearInterval(syncIntervalRef.current);
        }

        syncIntervalRef.current = setInterval(() => {
            if (isAutoSyncEnabledRef.current &&
                realtime.isOnline &&
                document.visibilityState === 'visible') {
                performSync();
            }
        }, 30000); // 30 seconds
    };

    // Stop auto-sync
    const stopAutoSync = () => {
        if (syncIntervalRef.current) {
            clearInterval(syncIntervalRef.current);
            syncIntervalRef.current = undefined;
        }
    };

    // Listen for app focus to trigger sync
    useEffect(() => {
        const handleFocus = () => {
            if (isAutoSyncEnabledRef.current) {
                // Sync when app comes back into focus
                setTimeout(performSync, 1000);
            }
        };

        const unsubscribe = realtime.subscribe('app:focus', handleFocus);
        return unsubscribe;
    }, [realtime]);

    // Listen for online/offline events
    useEffect(() => {
        const handleOnline = () => {
            if (isAutoSyncEnabledRef.current) {
                // Sync when coming back online
                setTimeout(performSync, 2000);
            }
        };

        const unsubscribe = realtime.subscribe('network:online', handleOnline);
        return unsubscribe;
    }, [realtime]);

    // Start auto-sync when user logs in
    useEffect(() => {
        if (app.currentUser && app.token) {
            // Initial sync when user logs in
            performSync();
            startAutoSync();
        } else {
            stopAutoSync();
            lastSyncDataRef.current = null;
        }

        return () => {
            stopAutoSync();
        };
    }, [app.currentUser, app.token]);

      const value: BackgroundSyncContextType = {
    forceSync: forceSync,
    isAutoSyncEnabled: isAutoSyncEnabledRef.current,
    toggleAutoSync
  };

    return (
        <BackgroundSyncContext.Provider value={value}>
            {children}
        </BackgroundSyncContext.Provider>
    );
}

export function useBackgroundSync() {
    const context = useContext(BackgroundSyncContext);
    if (context === undefined) {
        throw new Error('useBackgroundSync must be used within a BackgroundSyncProvider');
    }
    return context;
} 
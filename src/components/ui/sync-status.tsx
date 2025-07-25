import React from 'react';
import { Badge } from './badge';
import { Loader2, Wifi, WifiOff, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SyncStatusProps {
    isOnline?: boolean;
    isSyncing?: boolean;
    pendingCount?: number;
    lastSyncTime?: number;
    error?: string;
    className?: string;
}

export function SyncStatus({
    isOnline = true,
    isSyncing = false,
    pendingCount = 0,
    lastSyncTime,
    error,
    className
}: SyncStatusProps) {
    const getStatusIcon = () => {
        if (error) return <AlertCircle className="h-3 w-3 text-destructive" />;
        if (isSyncing) return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
        if (!isOnline) return <WifiOff className="h-3 w-3 text-gray-400" />;
        if (pendingCount > 0) return <Clock className="h-3 w-3 text-orange-500" />;
        return <CheckCircle className="h-3 w-3 text-green-500" />;
    };

    const getStatusText = () => {
        if (error) return 'Sync error';
        if (isSyncing) return 'Syncing...';
        if (!isOnline) return 'Offline';
        if (pendingCount > 0) return `${pendingCount} pending`;
        return 'Synced';
    };

    const getStatusVariant = (): "default" | "secondary" | "destructive" | "outline" => {
        if (error) return 'destructive';
        if (isSyncing) return 'default';
        if (!isOnline) return 'secondary';
        if (pendingCount > 0) return 'outline';
        return 'secondary';
    };

    const formatLastSync = () => {
        if (!lastSyncTime) return '';
        const now = Date.now();
        const diff = now - lastSyncTime;
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'Just now';
        if (minutes === 1) return '1 min ago';
        if (minutes < 60) return `${minutes} mins ago`;

        const hours = Math.floor(minutes / 60);
        if (hours === 1) return '1 hour ago';
        if (hours < 24) return `${hours} hours ago`;

        return 'Over 1 day ago';
    };

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <Badge variant={getStatusVariant()} className="text-xs">
                {getStatusIcon()}
                <span className="ml-1">{getStatusText()}</span>
            </Badge>
            {lastSyncTime && !isSyncing && (
                <span className="text-xs text-muted-foreground">
                    {formatLastSync()}
                </span>
            )}
        </div>
    );
}

export interface PendingIndicatorProps {
    isPending?: boolean;
    className?: string;
    children: React.ReactNode;
}

export function PendingIndicator({ isPending = false, className, children }: PendingIndicatorProps) {
    return (
        <div className={cn('relative', className)}>
            {children}
            {isPending && (
                <div className="absolute inset-0 bg-blue-50/50 border border-blue-200 rounded-md flex items-center justify-center">
                    <div className="bg-white px-2 py-1 rounded shadow-sm border">
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Saving...</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export interface OptimisticBadgeProps {
    isOptimistic?: boolean;
    className?: string;
}

export function OptimisticBadge({ isOptimistic = false, className }: OptimisticBadgeProps) {
    if (!isOptimistic) return null;

    return (
        <Badge variant="outline" className={cn('text-xs border-orange-200 text-orange-600', className)}>
            <Clock className="h-3 w-3 mr-1" />
            Pending
        </Badge>
    );
} 
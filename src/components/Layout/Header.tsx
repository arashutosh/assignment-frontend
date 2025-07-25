import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SyncStatus } from '@/components/ui/sync-status';
import { useApp } from '../../context/AppContext';
import { useRealtime } from '../../context/RealtimeContext';
import { LogOut, User } from 'lucide-react';

export function Header() {
  const { currentUser, logout } = useApp();
  const { isOnline, isSyncing, pendingCount, lastSyncTime } = useRealtime();

  if (!currentUser) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-6 py-4 h-16">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Project Management System
          </h1>
          <SyncStatus
            isOnline={isOnline}
            isSyncing={isSyncing}
            pendingCount={pendingCount}
            lastSyncTime={lastSyncTime}
          />
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium text-gray-900">{currentUser.name}</p>
              <div className="flex items-center space-x-2">
                <p className="text-gray-500">{currentUser.email}</p>
                <Badge variant="outline" className="text-xs">
                  {currentUser.role}
                </Badge>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
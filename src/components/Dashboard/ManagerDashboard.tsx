import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useRealtime, useRealtimeEvent } from '../../context/RealtimeContext';
import { useBackgroundSync } from '../../context/BackgroundSyncContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  FolderOpen,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Wifi,
  Bell,
  X
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

export function ManagerDashboard() {
  const { engineers, projects, assignments, getEngineerWorkload } = useApp();
  const { pendingCount, isOnline } = useRealtime();
  const { forceSync, isAutoSyncEnabled, toggleAutoSync } = useBackgroundSync();
  const { toast } = useToast();
  const [recentNotifications, setRecentNotifications] = useState<Array<{
    id: string;
    type: string;
    message: string;
    timestamp: number;
  }>>([]);

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalAssignments = assignments.length;

  // Calculate team utilization
  const overloadedEngineers = engineers.filter(eng => getEngineerWorkload(eng.id) > eng.capacity);
  const underutilizedEngineers = engineers.filter(eng => getEngineerWorkload(eng.id) < eng.capacity * 0.7);
  const wellUtilizedEngineers = engineers.filter(eng => {
    const workload = getEngineerWorkload(eng.id);
    return workload >= eng.capacity * 0.7 && workload <= eng.capacity;
  });

  const averageUtilization = engineers.length > 0 ? engineers.reduce((acc, eng) => {
    return acc + (getEngineerWorkload(eng.id) / eng.capacity);
  }, 0) / engineers.length * 100 : 0;

  // Listen for external changes (from other users)
  useRealtimeEvent('external:changes-detected', (event) => {
    const changes = event.payload;
    const totalChanges = Object.values(changes.added).reduce((a, b) => a + b, 0) +
      Object.values(changes.removed).reduce((a, b) => a + b, 0) +
      Object.values(changes.updated).reduce((a, b) => a + b, 0);

    if (totalChanges > 0) {
      const notification = {
        id: `external-${Date.now()}`,
        type: 'external-changes',
        message: `${totalChanges} external change${totalChanges > 1 ? 's' : ''} detected from other users`,
        timestamp: Date.now()
      };

      setRecentNotifications(prev => [notification, ...prev.slice(0, 4)]);

      toast({
        title: "External Changes Detected",
        description: notification.message,
        duration: 5000,
      });
    }
  });

  // Listen for sync events
  useRealtimeEvent('sync:complete', (event) => {
    if (event.source === 'server') {
      const notification = {
        id: `sync-${Date.now()}`,
        type: 'sync-complete',
        message: 'Data synchronized successfully',
        timestamp: Date.now()
      };

      setRecentNotifications(prev => [notification, ...prev.slice(0, 4)]);
    }
  });

  useRealtimeEvent('sync:error', (event) => {
    const notification = {
      id: `sync-error-${Date.now()}`,
      type: 'sync-error',
      message: `Sync failed: ${event.payload.error}`,
      timestamp: Date.now()
    };

    setRecentNotifications(prev => [notification, ...prev.slice(0, 4)]);

    toast({
      title: "Sync Error",
      description: event.payload.error,
      variant: "destructive",
      duration: 5000,
    });
  });

  // Listen for assignment events
  useRealtimeEvent('assignment:added', (event) => {
    if (event.source === 'local') {
      const notification = {
        id: `assignment-added-${Date.now()}`,
        type: 'assignment-added',
        message: 'New assignment created',
        timestamp: Date.now()
      };

      setRecentNotifications(prev => [notification, ...prev.slice(0, 4)]);
    }
  });

  const handleForceSync = async () => {
    try {
      await forceSync();
      toast({
        title: "Sync Completed",
        description: "Data has been synchronized with the server.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to synchronize with the server.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const dismissNotification = (id: string) => {
    setRecentNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'external-changes':
        return <Users className="h-4 w-4" />;
      case 'sync-complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'sync-error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'assignment-added':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manager Dashboard</h1>
          <p className="text-gray-600 text-lg">Team overview and resource management</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleForceSync}
            disabled={!isOnline}
            className="flex items-center gap-2 px-4 py-2 shadow-sm hover:shadow-md transition-shadow"
          >
            <RefreshCw className="h-4 w-4" />
            Sync Now
          </Button>
          <Button
            variant={isAutoSyncEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => toggleAutoSync(!isAutoSyncEnabled)}
            className="flex items-center gap-2 px-4 py-2 shadow-sm hover:shadow-md transition-shadow"
          >
            <Wifi className="h-4 w-4" />
            Auto-sync {isAutoSyncEnabled ? 'On' : 'Off'}
          </Button>
        </div>
      </div>

      {/* Real-time status indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 bg-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Connection Status</CardTitle>
            <div className={`p-2 rounded-full ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
              <Wifi className={`h-5 w-5 ${isOnline ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className={`text-3xl font-bold mb-2 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <p className="text-sm text-gray-500">
              {pendingCount > 0 ? `${pendingCount} pending changes` : 'All synced'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 bg-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Active Projects</CardTitle>
            <div className="p-2 rounded-full bg-blue-100">
              <FolderOpen className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold text-blue-600 mb-2">{activeProjects}</div>
            <p className="text-sm text-gray-500">
              of {projects.length} total projects
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 bg-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Total Assignments</CardTitle>
            <div className="p-2 rounded-full bg-purple-100">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold text-purple-600 mb-2">{totalAssignments}</div>
            <p className="text-sm text-gray-500">
              Active assignments
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 bg-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Team Utilization</CardTitle>
            <div className="p-2 rounded-full bg-orange-100">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold text-orange-600 mb-2">{averageUtilization.toFixed(1)}%</div>
            <p className="text-sm text-gray-500">
              Average utilization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent notifications */}
      {recentNotifications.length > 0 && (
        <Card className="shadow-md bg-white border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
              <div className="p-2 rounded-full bg-blue-100">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              Recent Activity
            </CardTitle>
            <CardDescription className="text-base text-gray-600 ml-11">
              Real-time updates and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {recentNotifications.map((notification) => (
                <Alert key={notification.id} className="relative border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <AlertDescription className="text-sm font-medium text-gray-800 mb-1">
                        {notification.message}
                      </AlertDescription>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissNotification(notification.id)}
                      className="h-8 w-8 p-0 hover:bg-gray-200 rounded-full flex-shrink-0"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team utilization breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="shadow-md bg-white border-0 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center font-semibold">
              <div className="p-2 rounded-full bg-green-100 mr-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              Well Utilized
            </CardTitle>
            <CardDescription className="text-base text-gray-600 ml-11">
              Engineers with optimal workload (70-100%)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-green-600 mb-4">
              {wellUtilizedEngineers.length}
            </div>
            <div className="space-y-4">
              {wellUtilizedEngineers.slice(0, 3).map(engineer => {
                const workload = getEngineerWorkload(engineer.id);
                const percentage = (workload / engineer.capacity) * 100;
                return (
                  <div key={engineer.id} className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg border border-green-100">
                    <Avatar className="h-10 w-10 ring-2 ring-green-200">
                      <AvatarFallback className="text-sm font-semibold text-green-700 bg-green-100">
                        {engineer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate mb-1">{engineer.name}</p>
                      <div className="flex items-center space-x-3">
                        <Progress value={percentage} className="h-2 flex-1 bg-green-200" />
                        <span className="text-sm font-medium text-green-700 min-w-0">{percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {wellUtilizedEngineers.length > 3 && (
                <p className="text-sm text-gray-600 text-center pt-2 border-t border-green-200">
                  +{wellUtilizedEngineers.length - 3} more engineers
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-white border-0 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center font-semibold">
              <div className="p-2 rounded-full bg-yellow-100 mr-3">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              Underutilized
            </CardTitle>
            <CardDescription className="text-base text-gray-600 ml-11">
              Engineers with low workload (&lt;70%)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-yellow-600 mb-4">
              {underutilizedEngineers.length}
            </div>
            <div className="space-y-4">
              {underutilizedEngineers.slice(0, 3).map(engineer => {
                const workload = getEngineerWorkload(engineer.id);
                const percentage = (workload / engineer.capacity) * 100;
                return (
                  <div key={engineer.id} className="flex items-center space-x-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                    <Avatar className="h-10 w-10 ring-2 ring-yellow-200">
                      <AvatarFallback className="text-sm font-semibold text-yellow-700 bg-yellow-100">
                        {engineer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate mb-1">{engineer.name}</p>
                      <div className="flex items-center space-x-3">
                        <Progress value={percentage} className="h-2 flex-1 bg-yellow-200 [&>div]:bg-yellow-500" />
                        <span className="text-sm font-medium text-yellow-700 min-w-0">{percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {underutilizedEngineers.length > 3 && (
                <p className="text-sm text-gray-600 text-center pt-2 border-t border-yellow-200">
                  +{underutilizedEngineers.length - 3} more engineers
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-white border-0 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center font-semibold">
              <div className="p-2 rounded-full bg-red-100 mr-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              Overloaded
            </CardTitle>
            <CardDescription className="text-base text-gray-600 ml-11">
              Engineers exceeding capacity (&gt;100%)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-red-600 mb-4">
              {overloadedEngineers.length}
            </div>
            <div className="space-y-4">
              {overloadedEngineers.slice(0, 3).map(engineer => {
                const workload = getEngineerWorkload(engineer.id);
                const percentage = (workload / engineer.capacity) * 100;
                return (
                  <div key={engineer.id} className="flex items-center space-x-4 p-3 bg-red-50 rounded-lg border border-red-100">
                    <Avatar className="h-10 w-10 ring-2 ring-red-200">
                      <AvatarFallback className="text-sm font-semibold text-red-700 bg-red-100">
                        {engineer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate mb-1">{engineer.name}</p>
                      <div className="flex items-center space-x-3">
                        <Progress value={Math.min(percentage, 100)} className="h-2 flex-1 bg-red-200 [&>div]:bg-red-500" />
                        <span className="text-sm font-medium text-red-700 min-w-0">{percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                    <Badge variant="destructive" className="text-xs font-medium px-2 py-1">
                      Overloaded
                    </Badge>
                  </div>
                );
              })}
              {overloadedEngineers.length > 3 && (
                <p className="text-sm text-gray-600 text-center pt-2 border-t border-red-200">
                  +{overloadedEngineers.length - 3} more engineers
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
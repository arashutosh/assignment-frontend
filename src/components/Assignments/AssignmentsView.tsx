import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useRealtime, useRealtimeEvent } from '../../context/RealtimeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { PendingIndicator, OptimisticBadge } from '@/components/ui/sync-status';
import { Plus, Calendar, Users, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { AddAssignmentDialog } from './AddAssignmentDialog';
import { useToast } from '../../hooks/use-toast';

export function AssignmentsView() {
  const { assignments, engineers, projects, removeAssignment, getEngineerWorkload } = useApp();
  const { pendingCount } = useRealtime();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Listen for real-time assignment events
  useRealtimeEvent('assignment:added', (event) => {
    if (event.source === 'local') {
      toast({
        title: "Assignment Created",
        description: "Creating new assignment...",
        duration: 2000,
      });
    } else {
      toast({
        title: "Assignment Added",
        description: "Assignment has been successfully created.",
        duration: 3000,
      });
    }
  });

  useRealtimeEvent('assignment:confirmed', (event) => {
    setPendingOperations(prev => {
      const newSet = new Set(prev);
      newSet.delete(event.payload.id);
      return newSet;
    });

    toast({
      title: "Assignment Confirmed",
      description: "Assignment changes have been saved.",
      duration: 2000,
    });
  });

  useRealtimeEvent('assignment:error', (event) => {
    toast({
      title: "Assignment Error",
      description: event.payload.error || "Failed to save assignment changes.",
      variant: "destructive",
      duration: 4000,
    });
  });

  useRealtimeEvent('optimistic:assignment:add', (event) => {
    setPendingOperations(prev => new Set(prev).add(event.payload.id));
  });

  useRealtimeEvent('optimistic:assignment:remove', (event) => {
    setPendingOperations(prev => new Set(prev).add(event.payload.id));
  });

  // Get assignment data with engineer and project info
  const assignmentData = assignments.map(assignment => {
    // Handle both populated objects and IDs
    let engineer, project;
    
    if (typeof assignment.engineerId === 'object' && assignment.engineerId !== null) {
      // Backend returned populated engineer object (only name and email are populated)
      // We need to find the full engineer data from the engineers array
      const populatedEngineer = assignment.engineerId as any;
      engineer = engineers.find(eng => eng.id === populatedEngineer._id) || {
        id: populatedEngineer._id,
        name: populatedEngineer.name,
        email: populatedEngineer.email,
        skills: [],
        seniorityLevel: 'mid' as const,
        employmentType: 'full-time' as const,
        capacity: 100,
        currentAllocation: 0,
        joinDate: new Date().toISOString()
      };
    } else {
      // Backend returned engineer ID, look it up
      engineer = engineers.find(eng => eng.id === assignment.engineerId);
    }
    
    if (typeof assignment.projectId === 'object' && assignment.projectId !== null) {
      // Backend returned populated project object (only name is populated)
      // We need to find the full project data from the projects array
      const populatedProject = assignment.projectId as any;
      project = projects.find(proj => proj.id === populatedProject._id) || {
        id: populatedProject._id,
        name: populatedProject.name,
        description: '',
        status: 'active' as const,
        priority: 'medium' as const,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        requiredTeamSize: 1,
        requiredSkills: [],
        createdAt: new Date().toISOString(),
        createdBy: ''
      };
    } else {
      // Backend returned project ID, look it up
      project = projects.find(proj => proj.id === assignment.projectId);
    }
    
    const isPending = Boolean(pendingOperations.has(assignment.id) || (assignment.id && assignment.id.startsWith('temp-')));
    
    return { assignment, engineer, project, isPending };
  });

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (confirm('Are you sure you want to remove this assignment?')) {
      setPendingOperations(prev => new Set(prev).add(assignmentId));
      try {
        await removeAssignment(assignmentId);
      } catch (error) {
        setPendingOperations(prev => {
          const newSet = new Set(prev);
          newSet.delete(assignmentId);
          return newSet;
        });
      }
    }
  };

  const getAssignmentStatus = (assignment: any, project: any) => {
    const now = new Date();
    const startDate = new Date(assignment.startDate);
    const endDate = new Date(assignment.endDate);

    if (now < startDate) return { status: 'Upcoming', color: 'outline' };
    if (now > endDate) return { status: 'Completed', color: 'secondary' };
    if (project.status === 'active') return { status: 'Active', color: 'default' };
    return { status: 'Paused', color: 'outline' };
  };

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignments</h1>
          <p className="text-gray-600 text-lg">Manage engineer assignments and project allocations</p>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-blue-600 font-medium">{pendingCount} pending changes</span>
            </div>
          )}
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="px-4 py-2 shadow-sm hover:shadow-md transition-shadow"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Assignment
        </Button>
      </div>

      <div className="grid gap-6">
        {assignmentData.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No assignments yet</h3>
            <p className="text-gray-600 text-lg">Get started by creating your first assignment.</p>
          </div>
        ) : (
          assignmentData.map(({ assignment, engineer, project, isPending }) => {
            if (!engineer || !project) {
              console.log('Skipping assignment with missing data:', { assignment, engineer, project });
              return null;
            }
            const status = getAssignmentStatus(assignment, project);
            const workload = getEngineerWorkload(engineer!.id);
            const utilizationPercentage = engineer ? (workload / engineer.capacity) * 100 : 0;
            const isOverloaded = utilizationPercentage > 100;

            return (
              <PendingIndicator key={assignment.id} isPending={isPending}>
                <Card className={isPending ? 'opacity-75' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {engineer!.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{engineer!.name}</CardTitle>
                          <CardDescription>
                            Assigned to <span className="font-medium">{project!.name}</span>
                          </CardDescription>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={status.color as any}>
                              {status.status}
                            </Badge>
                            <OptimisticBadge isOptimistic={isPending} />
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        disabled={isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          Duration
                        </div>
                        <p className="text-sm font-medium">
                          {new Date(assignment.startDate).toLocaleDateString()} - {' '}
                          {new Date(assignment.endDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <Users className="h-4 w-4 mr-1" />
                          Allocation
                        </div>
                        <p className="text-sm font-medium">{assignment.allocationPercentage}%</p>
                      </div>

                      <div>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <AlertTriangle className={`h-4 w-4 mr-1 ${isOverloaded ? 'text-red-500' : 'text-green-500'}`} />
                          Current Workload
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{workload}% / {engineer!.capacity}%</span>
                            <span className={isOverloaded ? 'text-red-600 font-medium' : 'text-green-600'}>
                              {isOverloaded ? 'Overloaded' : 'Available'}
                            </span>
                          </div>
                          <Progress
                            value={Math.min(utilizationPercentage, 100)}
                            className={`h-2 ${isOverloaded ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'}`}
                          />
                        </div>
                      </div>
                    </div>

                    {assignment.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">{assignment.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </PendingIndicator>
            );
          })
        )}
      </div>

      <AddAssignmentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}
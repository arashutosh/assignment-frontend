import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Calendar,
  Clock,
  FolderOpen,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function EngineerDashboard() {
  const { currentUser, engineers, projects, assignments, getEngineerWorkload } = useApp();

  const currentEngineer = engineers.find(eng => eng.id === currentUser?.id);
  const myAssignments = assignments.filter(assignment => assignment.engineerId === currentUser?.id);
  const myProjects = projects.filter(project =>
    myAssignments.some(assignment => assignment.projectId === project.id)
  );

  const currentWorkload = currentEngineer ? getEngineerWorkload(currentEngineer.id) : 0;
  const capacityPercentage = currentEngineer ? (currentWorkload / currentEngineer.capacity) * 100 : 0;

  const activeAssignments = myAssignments.filter(assignment => {
    const project = projects.find(p => p.id === assignment.projectId);
    return project?.status === 'active';
  }).length;

  if (!currentEngineer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Profile Not Found</h3>
          <p className="text-gray-600">Your engineer profile could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
        <p className="text-gray-600 text-lg">Your current assignments and workload</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 bg-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Current Workload</CardTitle>
            <div className={`p-2 rounded-full ${capacityPercentage > 100 ? 'bg-red-100' : capacityPercentage >= 70 ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <User className={`h-5 w-5 ${capacityPercentage > 100 ? 'text-red-600' : capacityPercentage >= 70 ? 'text-green-600' : 'text-yellow-600'}`} />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className={`text-3xl font-bold mb-2 ${capacityPercentage > 100 ? 'text-red-600' : capacityPercentage >= 70 ? 'text-green-600' : 'text-yellow-600'}`}>
              {capacityPercentage.toFixed(0)}%
            </div>
            <p className="text-sm text-gray-500">
              of {currentEngineer.capacity}% capacity
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
            <div className="text-3xl font-bold text-blue-600 mb-2">{myProjects.filter(p => p.status === 'active').length}</div>
            <p className="text-sm text-gray-500">
              Currently working on
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 bg-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Active Assignments</CardTitle>
            <div className="p-2 rounded-full bg-purple-100">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold text-purple-600 mb-2">{activeAssignments}</div>
            <p className="text-sm text-gray-500">
              Current assignments
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 bg-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Available Capacity</CardTitle>
            <div className="p-2 rounded-full bg-teal-100">
              <Clock className="h-5 w-5 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold text-teal-600 mb-2">{Math.max(0, currentEngineer.capacity - currentWorkload)}%</div>
            <p className="text-sm text-gray-500">
              Remaining capacity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-md bg-white border-0 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-800">My Profile</CardTitle>
            <CardDescription className="text-base text-gray-600">Your skills and current status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-0">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {currentEngineer.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{currentEngineer.name}</h3>
                <p className="text-gray-600 capitalize">{currentEngineer.seniorityLevel} Engineer</p>
                <p className="text-sm text-gray-500">{currentEngineer.employmentType}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {currentEngineer.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Capacity Usage</h4>
              <Progress value={capacityPercentage} className="h-3" />
              <p className="text-sm text-gray-600 mt-1">
                {currentWorkload}% used of {currentEngineer.capacity}% total capacity
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-white border-0 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-800">Current Assignments</CardTitle>
            <CardDescription className="text-base text-gray-600">Your active project assignments</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {myAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No Active Assignments</h3>
                  <p className="text-gray-600">You're currently not assigned to any projects.</p>
                </div>
              ) : (
                myAssignments.map((assignment) => {
                  const project = projects.find(p => p.id === assignment.projectId);
                  if (!project) return null;

                  return (
                    <div key={assignment.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800">{project.name}</h4>
                        <Badge
                          variant={
                            project.status === 'active' ? 'default' :
                              project.status === 'completed' ? 'secondary' : 'outline'
                          }
                          className="font-medium"
                        >
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{project.description}</p>
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-gray-600 font-medium">
                          Role: {assignment.role || 'Developer'}
                        </span>
                        <span className="font-semibold text-blue-600">
                          {assignment.allocationPercentage}% allocation
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
                        <span>
                          Start: {new Date(assignment.startDate).toLocaleDateString()}
                        </span>
                        <span>
                          End: {new Date(assignment.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Timeline */}
      <Card className="shadow-md bg-white border-0 hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-800">Project Timeline</CardTitle>
          <CardDescription className="text-base text-gray-600">Upcoming project deadlines and milestones</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {myProjects.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Projects</h3>
                <p className="text-gray-600">You're not currently assigned to any projects.</p>
              </div>
            ) : (
              myProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 mb-2">{project.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-gray-600 font-medium">
                        Priority: <span className={`font-semibold ${project.priority === 'high' ? 'text-red-600' :
                            project.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                          }`}>{project.priority}</span>
                      </span>
                      <span className="text-xs text-gray-600 font-medium">
                        Team Size: <span className="font-semibold text-blue-600">{project.requiredTeamSize}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <Badge
                      variant={
                        project.status === 'active' ? 'default' :
                          project.status === 'completed' ? 'secondary' : 'outline'
                      }
                      className="font-medium mb-2"
                    >
                      {project.status}
                    </Badge>
                    <p className="text-xs text-gray-500 font-medium">
                      Due: {new Date(project.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
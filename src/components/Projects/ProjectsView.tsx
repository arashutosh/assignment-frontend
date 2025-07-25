import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Search, Filter, FolderOpen, Calendar, Users, Target } from 'lucide-react';
import { AddProjectDialog } from './AddProjectDialog';

export function ProjectsView() {
  const { projects, assignments, engineers, currentUser, getProjectAssignments } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Filter projects based on search term and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.requiredSkills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'planning': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProjectProgress = (projectId: string) => {
    const projectAssignments = getProjectAssignments(projectId);
    const project = projects.find(p => p.id === projectId);
    
    if (!project || projectAssignments.length === 0) return 0;
    
    // Simple progress calculation based on time elapsed
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    const currentDate = new Date();
    
    if (currentDate < startDate) return 0;
    if (currentDate > endDate) return 100;
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = currentDate.getTime() - startDate.getTime();
    
    return Math.min(100, (elapsed / totalDuration) * 100);
  };

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
          <p className="text-gray-600 text-lg">Manage your engineering projects</p>
        </div>
        {currentUser?.role === 'manager' && (
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="px-4 py-2 shadow-sm hover:shadow-md transition-shadow"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects by name, description, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredProjects.map((project) => {
          const projectAssignments = getProjectAssignments(project.id);
          const assignedEngineers = projectAssignments.map(assignment => 
            engineers.find(eng => eng.id === assignment.engineerId)
          ).filter(Boolean);
          const progress = getProjectProgress(project.id);
          
          return (
            <Card key={project.id} className="shadow-md hover:shadow-lg transition-shadow duration-200 bg-white border-0">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl font-semibold text-gray-800 mb-2">{project.name}</CardTitle>
                    <CardDescription className="text-base text-gray-600">
                      {project.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                    <Badge variant={getStatusColor(project.status)} className="font-medium">
                      {project.status}
                    </Badge>
                    <Badge className={`${getPriorityColor(project.priority)} font-medium border`}>
                      {project.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-5 pt-0">
                {/* Project Timeline */}
                <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center text-gray-700 font-medium">
                    <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                    Start: {new Date(project.startDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-gray-700 font-medium">
                    <Target className="h-4 w-4 mr-2 text-red-600" />
                    End: {new Date(project.endDate).toLocaleDateString()}
                  </div>
                </div>

                {/* Progress Bar */}
                {project.status === 'active' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700">Progress</span>
                      <span className="text-sm font-semibold text-blue-600">{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="h-3 bg-blue-200" />
                  </div>
                )}

                {/* Required Skills */}
                <div>
                  <p className="text-sm font-semibold mb-3 text-gray-700">Required Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {project.requiredSkills.slice(0, 4).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs font-medium">
                        {skill}
                      </Badge>
                    ))}
                    {project.requiredSkills.length > 4 && (
                      <Badge variant="secondary" className="text-xs font-medium">
                        +{project.requiredSkills.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Team Assignment */}
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">
                      {assignedEngineers.length} / {project.requiredTeamSize} assigned
                    </span>
                  </div>
                  <div className="flex -space-x-2">
                    {assignedEngineers.slice(0, 3).map((engineer) => (
                      <div
                        key={engineer!.id}
                        className="h-9 w-9 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-semibold text-blue-700 shadow-sm"
                        title={engineer!.name}
                      >
                        {engineer!.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    ))}
                    {assignedEngineers.length > 3 && (
                      <div className="h-9 w-9 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-semibold text-gray-600 shadow-sm">
                        +{assignedEngineers.length - 3}
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Dates */}
                <div className="flex items-center justify-between text-xs font-medium pt-3 border-t border-gray-200">
                  <span className="text-gray-600">Created {new Date(project.createdAt).toLocaleDateString()}</span>
                  <span className={`${
                    project.status === 'active' ? 'text-blue-600' :
                    project.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {project.status === 'active' 
                      ? `${Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left`
                      : project.status === 'completed' 
                      ? 'Completed' 
                      : 'Planning phase'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Found</h3>
          <p className="text-gray-600 text-lg mb-6">
            {searchTerm || statusFilter 
              ? 'No projects match your search criteria.' 
              : 'No projects have been created yet.'
            }
          </p>
          {currentUser?.role === 'manager' && !searchTerm && !statusFilter && (
            <Button 
              className="px-6 py-3 shadow-sm hover:shadow-md transition-shadow" 
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Project
            </Button>
          )}
        </div>
      )}

      {currentUser?.role === 'manager' && (
        <AddProjectDialog 
          open={showAddDialog} 
          onOpenChange={setShowAddDialog}
        />
      )}
    </div>
  );
}
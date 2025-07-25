import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Plus, Search, Filter, User, Mail, Calendar } from 'lucide-react';
import { AddEngineerDialog } from './AddEngineerDialog';

export function EngineersView() {
  const { engineers, getEngineerWorkload } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [skillFilter, setSkillFilter] = useState('');

  // Get all unique skills for filtering
  const allSkills = Array.from(new Set(engineers.flatMap(eng => eng.skills || [])));

  // Filter engineers based on search term and skill filter
  const filteredEngineers = engineers.filter(engineer => {
    const matchesSearch = engineer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      engineer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (engineer.skills || []).some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSkill = !skillFilter || (engineer.skills || []).includes(skillFilter);

    return matchesSearch && matchesSkill;
  });

  const getSeniorityColor = (level: string) => {
    switch (level) {
      case 'junior': return 'bg-green-100 text-green-800';
      case 'mid': return 'bg-blue-100 text-blue-800';
      case 'senior': return 'bg-purple-100 text-purple-800';
      case 'lead': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUtilizationStatus = (workload: number, capacity: number) => {
    const percentage = (workload / capacity) * 100;
    if (percentage > 100) return { status: 'Overloaded', color: 'text-red-600' };
    if (percentage < 70) return { status: 'Underutilized', color: 'text-amber-600' };
    return { status: 'Well Utilized', color: 'text-green-600' };
  };

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Engineers</h1>
          <p className="text-gray-600 text-lg">Manage your engineering team</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="px-4 py-2 shadow-sm hover:shadow-md transition-shadow"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Engineer
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search engineers by name, email, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Skills</option>
              {allSkills.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Engineers Grid */}
      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl">
          {filteredEngineers.map((engineer) => {
            const workload = getEngineerWorkload(engineer.id);
            const utilizationPercentage = (workload / engineer.capacity) * 100;
            const utilizationStatus = getUtilizationStatus(workload, engineer.capacity);

            return (
              <Card key={engineer.id} className="shadow-md hover:shadow-lg transition-shadow duration-200 bg-white border-0">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-14 w-14 ring-2 ring-blue-200">
                      <AvatarFallback className="text-blue-700 bg-blue-100 font-semibold">
                        {engineer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-gray-800 truncate">{engineer.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1 text-gray-600">
                        <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{engineer.email}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5 pt-0">
                  {/* Employment Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getSeniorityColor(engineer.seniorityLevel || 'unknown')} font-medium`}>
                        {engineer.seniorityLevel || 'Unknown'}
                      </Badge>
                      <Badge variant="outline" className="font-medium">
                        {engineer.employmentType || 'full-time'}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-blue-600">{engineer.capacity}% capacity</p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <p className="text-sm font-semibold mb-3 text-gray-700">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {(engineer.skills || []).slice(0, 4).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs font-medium">
                          {skill}
                        </Badge>
                      ))}
                      {(engineer.skills || []).length > 4 && (
                        <Badge variant="secondary" className="text-xs font-medium">
                          +{(engineer.skills || []).length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Utilization */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-gray-700">Current Utilization</p>
                      <span className={`text-sm font-semibold ${utilizationStatus.color}`}>
                        {utilizationStatus.status}
                      </span>
                    </div>
                    <Progress
                      value={utilizationPercentage}
                      className={`h-2 ${utilizationPercentage > 100 ? 'bg-red-200 [&>div]:bg-red-500' :
                          utilizationPercentage >= 70 ? 'bg-green-200 [&>div]:bg-green-500' :
                            'bg-yellow-200 [&>div]:bg-yellow-500'
                        }`}
                    />
                    <p className="text-xs text-gray-600 mt-2 font-medium">
                      {workload}% allocated of {engineer.capacity}% capacity
                    </p>
                  </div>

                  {/* Join Date */}
                  {engineer.joinDate && (
                    <div className="flex items-center text-xs text-gray-500 pt-2 border-t border-gray-200">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span className="font-medium">Joined {new Date(engineer.joinDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {filteredEngineers.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Engineers Found</h3>
          <p className="text-gray-600 text-lg">
            {searchTerm || skillFilter
              ? 'No engineers match your search criteria.'
              : 'No engineers have been added yet.'
            }
          </p>
        </div>
      )}

      <AddEngineerDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}
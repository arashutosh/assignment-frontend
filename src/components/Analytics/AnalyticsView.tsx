import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  FolderOpen,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  TrendingUp
} from 'lucide-react';

export function AnalyticsView() {
  const { engineers, projects, assignments, getEngineerWorkload } = useApp();

  // Calculate team statistics
  const totalCapacity = engineers.reduce((acc, eng) => acc + eng.capacity, 0);
  const totalWorkload = engineers.reduce((acc, eng) => acc + getEngineerWorkload(eng.id), 0);
  const overallUtilization = totalCapacity > 0 ? (totalWorkload / totalCapacity) * 100 : 0;

  // Categorize engineers by utilization
  const wellUtilized = engineers.filter(eng => {
    const workload = getEngineerWorkload(eng.id);
    return workload >= eng.capacity * 0.7 && workload <= eng.capacity;
  });

  const underutilized = engineers.filter(eng => {
    const workload = getEngineerWorkload(eng.id);
    return workload < eng.capacity * 0.7;
  });

  const overloaded = engineers.filter(eng => {
    const workload = getEngineerWorkload(eng.id);
    return workload > eng.capacity;
  });

  // Project statistics
  const activeProjects = projects.filter(p => p.status === 'active');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const planningProjects = projects.filter(p => p.status === 'planning');

  // Skills analysis
  const skillCounts = engineers.reduce((acc, eng) => {
    eng.skills.forEach(skill => {
      acc[skill] = (acc[skill] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topSkills = Object.entries(skillCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 8);

  // Seniority distribution
  const seniorityDistribution = engineers.reduce((acc, eng) => {
    acc[eng.seniorityLevel] = (acc[eng.seniorityLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Employment type distribution
  const employmentDistribution = engineers.reduce((acc, eng) => {
    acc[eng.employmentType] = (acc[eng.employmentType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
        <p className="text-gray-600 text-lg">Team utilization insights and project metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallUtilization.toFixed(1)}%</div>
            <Progress value={overallUtilization} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {totalWorkload}% used of {totalCapacity}% total capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              {planningProjects.length} planning, {completedProjects.length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engineers.length}</div>
            <p className="text-xs text-muted-foreground">
              {employmentDistribution['full-time'] || 0} full-time, {employmentDistribution['part-time'] || 0} part-time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">
              Active engineer assignments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Utilization Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Utilization Breakdown</CardTitle>
            <CardDescription>Engineer capacity utilization categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Well Utilized (70-100%)</span>
                </div>
                <Badge variant="secondary">{wellUtilized.length}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span className="font-medium">Underutilized (&lt;70%)</span>
                </div>
                <Badge variant="secondary">{underutilized.length}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="font-medium">Overloaded (&gt;100%)</span>
                </div>
                <Badge variant={overloaded.length > 0 ? "destructive" : "secondary"}>
                  {overloaded.length}
                </Badge>
              </div>
            </div>

            {/* Visual breakdown */}
            <div className="mt-6">
              <div className="flex rounded-lg overflow-hidden h-4">
                <div
                  className="bg-green-500"
                  style={{ width: `${(wellUtilized.length / engineers.length) * 100}%` }}
                />
                <div
                  className="bg-amber-500"
                  style={{ width: `${(underutilized.length / engineers.length) * 100}%` }}
                />
                <div
                  className="bg-red-500"
                  style={{ width: `${(overloaded.length / engineers.length) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>{wellUtilized.length} well utilized</span>
                <span>{underutilized.length} underutilized</span>
                <span>{overloaded.length} overloaded</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
            <CardDescription>Current state of all projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-3 w-3 bg-blue-500 rounded-full" />
                  <span className="font-medium">Active</span>
                </div>
                <Badge variant="default">{activeProjects.length}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-3 w-3 bg-gray-400 rounded-full" />
                  <span className="font-medium">Planning</span>
                </div>
                <Badge variant="outline">{planningProjects.length}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-3 w-3 bg-green-500 rounded-full" />
                  <span className="font-medium">Completed</span>
                </div>
                <Badge variant="secondary">{completedProjects.length}</Badge>
              </div>
            </div>

            {/* Visual breakdown */}
            <div className="mt-6">
              <div className="flex rounded-lg overflow-hidden h-4">
                <div
                  className="bg-blue-500"
                  style={{ width: `${(activeProjects.length / projects.length) * 100}%` }}
                />
                <div
                  className="bg-gray-400"
                  style={{ width: `${(planningProjects.length / projects.length) * 100}%` }}
                />
                <div
                  className="bg-green-500"
                  style={{ width: `${(completedProjects.length / projects.length) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>{activeProjects.length} active</span>
                <span>{planningProjects.length} planning</span>
                <span>{completedProjects.length} completed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills and Team Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Skills in Team</CardTitle>
            <CardDescription>Most common technical skills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSkills.map(([skill, count]) => (
                <div key={skill} className="flex items-center justify-between">
                  <span className="font-medium">{skill}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / engineers.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Seniority Distribution</CardTitle>
            <CardDescription>Experience levels across the team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(seniorityDistribution).map(([level, count]) => {
                const percentage = (count / engineers.length) * 100;
                return (
                  <div key={level} className="flex items-center justify-between">
                    <span className="font-medium capitalize">{level}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Engineer Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Engineer Utilization</CardTitle>
          <CardDescription>Detailed view of each engineer's current workload</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {engineers.map((engineer) => {
              const workload = getEngineerWorkload(engineer.id);
              const percentage = (workload / engineer.capacity) * 100;
              const status =
                percentage > 100 ? { label: 'Overloaded', color: 'text-red-600' } :
                  percentage < 70 ? { label: 'Underutilized', color: 'text-amber-600' } :
                    { label: 'Well Utilized', color: 'text-green-600' };

              return (
                <div key={engineer.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {engineer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">{engineer.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{engineer.seniorityLevel}</span>
                        <span>•</span>
                        <span>{engineer.employmentType}</span>
                        <span>•</span>
                        <span className={status.color}>{status.label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-lg font-bold">{percentage.toFixed(0)}%</div>
                      <div className="text-xs text-gray-500">
                        {workload}% of {engineer.capacity}%
                      </div>
                    </div>
                    <div className="w-32">
                      <Progress value={percentage} className="h-3" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
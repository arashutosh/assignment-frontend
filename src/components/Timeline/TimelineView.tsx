import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
    CalendarDays,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Search,
    Target,
    Users,
    BarChart3
} from 'lucide-react';
import { Project, Assignment, Engineer } from '../../types';

type ViewMode = 'timeline' | 'calendar' | 'gantt';
type TimeRange = 'week' | 'month' | 'quarter' | 'year';

interface TimelineEvent {
    id: string;
    title: string;
    type: 'project' | 'assignment';
    startDate: Date;
    endDate: Date;
    project?: Project;
    assignment?: Assignment;
    engineer?: Engineer;
    color: string;
    allocation?: number;
}

export function TimelineView() {
    const { projects, assignments, engineers } = useApp();
    const [viewMode, setViewMode] = useState<ViewMode>('timeline');
    const [timeRange, setTimeRange] = useState<TimeRange>('month');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [filterEngineer, setFilterEngineer] = useState<string>('all');
    const [filterProject, setFilterProject] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Helper functions for color mapping
    const getProjectColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-500';
            case 'medium': return 'bg-yellow-500';
            case 'low': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    const getAssignmentColor = (allocation: number) => {
        if (allocation >= 80) return 'bg-blue-500';
        if (allocation >= 50) return 'bg-purple-500';
        return 'bg-cyan-500';
    };

    // Calculate timeline events
    const timelineEvents = useMemo(() => {
        const events: TimelineEvent[] = [];

        // Add project events
        projects.forEach(project => {
            if (filterProject && filterProject !== 'all' && project.id !== filterProject) return;

            const matchesSearch = !searchTerm ||
                project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.description.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return;

            events.push({
                id: `project-${project.id}`,
                title: project.name,
                type: 'project',
                startDate: new Date(project.startDate),
                endDate: new Date(project.endDate),
                project,
                color: getProjectColor(project.priority),
            });
        });

        // Add assignment events
        assignments.forEach(assignment => {
            const engineer = engineers.find(e => e.id === assignment.engineerId);
            const project = projects.find(p => p.id === assignment.projectId);

            if (!engineer || !project) return;
            if (filterEngineer && filterEngineer !== 'all' && engineer.id !== filterEngineer) return;
            if (filterProject && filterProject !== 'all' && project.id !== filterProject) return;

            const matchesSearch = !searchTerm ||
                engineer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.name.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return;

            events.push({
                id: `assignment-${assignment.id}`,
                title: `${engineer.name} → ${project.name}`,
                type: 'assignment',
                startDate: new Date(assignment.startDate),
                endDate: new Date(assignment.endDate),
                assignment,
                engineer,
                project,
                allocation: assignment.allocationPercentage,
                color: getAssignmentColor(assignment.allocationPercentage),
            });
        });

        return events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    }, [projects, assignments, engineers, filterEngineer, filterProject, searchTerm]);

    const navigateTime = (direction: 'prev' | 'next') => {
        const newDate = new Date(selectedDate);

        switch (timeRange) {
            case 'week':
                newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
                break;
            case 'month':
                newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
                break;
            case 'quarter':
                newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
                break;
            case 'year':
                newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
                break;
        }

        setSelectedDate(newDate);
    };

    const getTimeRangeLabel = () => {
        const options: Intl.DateTimeFormatOptions = {
            month: 'long',
            year: 'numeric'
        };

        switch (timeRange) {
            case 'week':
                const weekStart = new Date(selectedDate);
                weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
            case 'month':
                return selectedDate.toLocaleDateString('en-US', options);
            case 'quarter':
                const quarter = Math.floor(selectedDate.getMonth() / 3) + 1;
                return `Q${quarter} ${selectedDate.getFullYear()}`;
            case 'year':
                return selectedDate.getFullYear().toString();
        }
    };

    const renderTimelineView = () => {
        const startDate = new Date(selectedDate);
        const endDate = new Date(selectedDate);

        switch (timeRange) {
            case 'week':
                startDate.setDate(selectedDate.getDate() - selectedDate.getDay());
                endDate.setDate(startDate.getDate() + 6);
                break;
            case 'month':
                startDate.setDate(1);
                endDate.setMonth(endDate.getMonth() + 1, 0);
                break;
            case 'quarter':
                const quarterStart = Math.floor(selectedDate.getMonth() / 3) * 3;
                startDate.setMonth(quarterStart, 1);
                endDate.setMonth(quarterStart + 3, 0);
                break;
            case 'year':
                startDate.setMonth(0, 1);
                endDate.setMonth(11, 31);
                break;
        }

        const filteredEvents = timelineEvents.filter(event =>
            event.endDate >= startDate && event.startDate <= endDate
        );

        const days = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            days.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return (
            <div className="space-y-4">
                {filteredEvents.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Found</h3>
                        <p className="text-gray-600 text-lg">No projects or assignments in the selected time range.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredEvents.map(event => (
                            <Card key={event.id} className="shadow-md hover:shadow-lg transition-shadow duration-200 bg-white border-0">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-4">
                                            <div className={`w-4 h-4 rounded-full ${event.color} mt-1 shadow-sm`} />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-gray-800 mb-2">{event.title}</h4>
                                                <p className="text-sm text-gray-600 font-medium mb-2">
                                                    {event.startDate.toLocaleDateString()} - {event.endDate.toLocaleDateString()}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    {event.type === 'assignment' && event.allocation && (
                                                        <Badge variant="secondary" className="font-medium">
                                                            {event.allocation}% allocation
                                                        </Badge>
                                                    )}
                                                    {event.type === 'project' && event.project && (
                                                        <Badge variant="outline" className="font-medium">
                                                            {event.project.status}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right ml-4 flex-shrink-0">
                                            <Badge variant="secondary" className="font-medium mb-2">
                                                {event.type === 'project' ? 'Project' : 'Assignment'}
                                            </Badge>
                                            {event.project && (
                                                <p className="text-xs text-gray-600 font-medium">
                                                    Priority: <span className={`font-semibold ${event.project.priority === 'high' ? 'text-red-600' :
                                                        event.project.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                                                        }`}>{event.project.priority}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderCalendarView = () => {
        const eventsOnSelectedDate = timelineEvents.filter(event => {
            const selected = selectedDate.toDateString();
            return event.startDate.toDateString() <= selected && event.endDate.toDateString() >= selected;
        });

        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card className="shadow-md bg-white border-0">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-semibold text-gray-800">Calendar</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date: Date | undefined) => date && setSelectedDate(date)}
                                modifiers={{
                                    hasEvents: timelineEvents.map(e => e.startDate)
                                }}
                                modifiersStyles={{
                                    hasEvents: { backgroundColor: '#dbeafe', color: '#1e40af' }
                                }}
                                className="rounded-md border"
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card className="shadow-md bg-white border-0">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-semibold text-gray-800">Events on {selectedDate.toLocaleDateString()}</CardTitle>
                            <CardDescription className="text-base text-gray-600">
                                {eventsOnSelectedDate.length} event(s) scheduled
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {eventsOnSelectedDate.length === 0 ? (
                                <p className="text-gray-500 text-center py-8 text-lg">No events on this date</p>
                            ) : (
                                <div className="space-y-4">
                                    {eventsOnSelectedDate.map(event => (
                                        <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors bg-gray-50">
                                            <div className="flex items-center space-x-4">
                                                <div className={`w-4 h-4 rounded-full ${event.color} shadow-sm`} />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-800 mb-1">{event.title}</h4>
                                                    <p className="text-sm text-gray-600 font-medium">
                                                        {event.startDate.toLocaleDateString()} - {event.endDate.toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="font-medium">
                                                    {event.type}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    };

    const renderGanttView = () => {
        const projectGroups = projects.map(project => {
            const projectAssignments = assignments.filter(a => a.projectId === project.id);
            return { project, assignments: projectAssignments };
        });

        return (
            <div className="space-y-6">
                {projectGroups.map(({ project, assignments: projectAssignments }) => (
                    <Card key={project.id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>{project.name}</CardTitle>
                                    <CardDescription>
                                        {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Badge variant="outline">{project.status}</Badge>
                                    <Badge className={getProjectColor(project.priority)}>{project.priority}</Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {projectAssignments.map(assignment => {
                                    const engineer = engineers.find(e => e.id === assignment.engineerId);
                                    if (!engineer) return null;

                                    return (
                                        <div key={assignment.id} className="flex items-center space-x-4 p-2 border rounded">
                                            <div className="flex-shrink-0 w-32">
                                                <p className="font-medium text-sm">{engineer.name}</p>
                                                <p className="text-xs text-gray-500">{assignment.role}</p>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span>{new Date(assignment.startDate).toLocaleDateString()}</span>
                                                    <span>{assignment.allocationPercentage}%</span>
                                                    <span>{new Date(assignment.endDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                                    <div
                                                        className={`h-2 rounded-full ${getAssignmentColor(assignment.allocationPercentage)}`}
                                                        style={{ width: `${assignment.allocationPercentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {projectAssignments.length === 0 && (
                                    <p className="text-gray-500 text-sm">No assignments for this project</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Timeline</h1>
                    <p className="text-gray-600 text-lg">Visualize projects and assignments over time</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateTime('prev')}
                        className="shadow-sm hover:shadow-md transition-shadow"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-semibold min-w-0 text-center px-3">
                        {getTimeRangeLabel()}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateTime('next')}
                        className="shadow-sm hover:shadow-md transition-shadow"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex items-center space-x-4">
                        <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                            <SelectTrigger className="w-32 shadow-sm">
                                <SelectValue placeholder="View" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="timeline">Timeline</SelectItem>
                                <SelectItem value="calendar">Calendar</SelectItem>
                                <SelectItem value="gantt">Gantt</SelectItem>
                            </SelectContent>
                        </Select>

                        {viewMode !== 'calendar' && (
                            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                                <SelectTrigger className="w-32 shadow-sm">
                                    <SelectValue placeholder="Range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="week">Week</SelectItem>
                                    <SelectItem value="month">Month</SelectItem>
                                    <SelectItem value="quarter">Quarter</SelectItem>
                                    <SelectItem value="year">Year</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="flex-1 flex items-center space-x-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search projects, engineers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 border-gray-300 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <Select value={filterEngineer} onValueChange={setFilterEngineer}>
                            <SelectTrigger className="w-48 shadow-sm">
                                <SelectValue placeholder="Filter by engineer" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Engineers</SelectItem>
                                {engineers.map(engineer => (
                                    <SelectItem key={engineer.id} value={engineer.id}>
                                        {engineer.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterProject} onValueChange={setFilterProject}>
                            <SelectTrigger className="w-48 shadow-sm">
                                <SelectValue placeholder="Filter by project" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Projects</SelectItem>
                                {projects.map(project => (
                                    <SelectItem key={project.id} value={project.id}>
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 bg-white border-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-gray-700">Active Projects</CardTitle>
                        <div className="p-2 rounded-full bg-blue-100">
                            <Target className="h-5 w-5 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="text-3xl font-bold text-blue-600 mb-2">{projects.filter(p => p.status === 'active').length}</div>
                        <p className="text-sm text-gray-500">Currently active</p>
                    </CardContent>
                </Card>

                <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 bg-white border-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-gray-700">Total Assignments</CardTitle>
                        <div className="p-2 rounded-full bg-purple-100">
                            <Users className="h-5 w-5 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="text-3xl font-bold text-purple-600 mb-2">{assignments.length}</div>
                        <p className="text-sm text-gray-500">All assignments</p>
                    </CardContent>
                </Card>

                <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 bg-white border-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-gray-700">Events This Month</CardTitle>
                        <div className="p-2 rounded-full bg-green-100">
                            <CalendarDays className="h-5 w-5 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                            {timelineEvents.filter(e => {
                                const eventMonth = e.startDate.getMonth();
                                const currentMonth = new Date().getMonth();
                                return eventMonth === currentMonth;
                            }).length}
                        </div>
                        <p className="text-sm text-gray-500">This month</p>
                    </CardContent>
                </Card>

                <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 bg-white border-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-gray-700">High Priority</CardTitle>
                        <div className="p-2 rounded-full bg-red-100">
                            <BarChart3 className="h-5 w-5 text-red-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="text-3xl font-bold text-red-600 mb-2">
                            {projects.filter(p => p.priority === 'high').length}
                        </div>
                        <p className="text-sm text-gray-500">High priority</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="min-h-96">
                {viewMode === 'timeline' && renderTimelineView()}
                {viewMode === 'calendar' && renderCalendarView()}
                {viewMode === 'gantt' && renderGanttView()}
            </div>
        </div>
    );
} 
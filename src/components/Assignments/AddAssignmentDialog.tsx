import React from 'react';
import { useForm } from 'react-hook-form';
import { useApp } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Assignment } from '../../types';

interface AddAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormData = Omit<Assignment, 'id' | 'createdAt' | 'createdBy'>;

export function AddAssignmentDialog({ open, onOpenChange }: AddAssignmentDialogProps) {
  const { addAssignment, engineers, projects, getEngineerWorkload } = useApp();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      engineerId: '',
      projectId: '',
      allocationPercentage: 50,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      role: '',
    }
  });

  const selectedEngineerId = watch('engineerId');
  const selectedProjectId = watch('projectId');
  const allocationPercentage = watch('allocationPercentage');

  const selectedEngineer = engineers.find(eng => eng.id === selectedEngineerId);
  const selectedProject = projects.find(proj => proj.id === selectedProjectId);

  // Calculate current workload and remaining capacity
  const currentWorkload = selectedEngineer ? getEngineerWorkload(selectedEngineer.id) : 0;
  const remainingCapacity = selectedEngineer ? selectedEngineer.capacity - currentWorkload : 0;
  const newTotalWorkload = currentWorkload + (allocationPercentage || 0);

  const onSubmit = (data: FormData) => {
    addAssignment(data);
    reset();
    onOpenChange(false);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  // Filter available projects (not completed)
  const availableProjects = projects.filter(project => project.status !== 'completed');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Assignment</DialogTitle>
          <DialogDescription>
            Assign an engineer to a project with specific allocation and timeline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="engineerId">Engineer</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(e) => setValue('engineerId', e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>Select an engineer</option>
              {engineers.map((engineer) => {
                const workload = getEngineerWorkload(engineer.id);
                const available = engineer.capacity - workload;

                return (
                  <option key={engineer.id} value={engineer.id}>
                    {engineer.name} - {available}% available
                  </option>
                );
              })}
            </select>
            {errors.engineerId && (
              <p className="text-sm text-red-600">Please select an engineer</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectId">Project</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(e) => setValue('projectId', e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>Select a project</option>
              {availableProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.status} - {project.priority} priority)
                </option>
              ))}
            </select>
            {errors.projectId && (
              <p className="text-sm text-red-600">Please select a project</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="allocationPercentage">Allocation Percentage</Label>
            <Input
              id="allocationPercentage"
              type="number"
              min="1"
              max="100"
              {...register('allocationPercentage', {
                required: 'Allocation percentage is required',
                min: { value: 1, message: 'Allocation must be at least 1%' },
                max: { value: 100, message: 'Allocation cannot exceed 100%' }
              })}
            />
            {errors.allocationPercentage && (
              <p className="text-sm text-red-600">{errors.allocationPercentage.message}</p>
            )}

            {/* Capacity Warning */}
            {selectedEngineer && allocationPercentage && (
              <div className={`text-sm p-2 rounded ${newTotalWorkload > selectedEngineer.capacity
                ? 'bg-red-50 text-red-700 border border-red-200'
                : newTotalWorkload > selectedEngineer.capacity * 0.9
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                <div className="font-medium">Capacity Check:</div>
                <div>Current: {currentWorkload}% | New Total: {newTotalWorkload}%</div>
                <div>Available: {remainingCapacity}% of {selectedEngineer.capacity}%</div>
                {newTotalWorkload > selectedEngineer.capacity && (
                  <div className="font-medium">⚠️ This assignment will overload the engineer!</div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role (Optional)</Label>
            <Input
              id="role"
              {...register('role')}
              placeholder="e.g., Lead Developer, Frontend Engineer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate', { required: 'Start date is required' })}
              />
              {errors.startDate && (
                <p className="text-sm text-red-600">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate', { required: 'End date is required' })}
              />
              {errors.endDate && (
                <p className="text-sm text-red-600">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Skills Match Preview */}
          {selectedEngineer && selectedProject && (
            <div className="space-y-2">
              <Label>Skills Match</Label>
              <div className="flex flex-wrap gap-1">
                {selectedProject.requiredSkills.map(skill => {
                  const hasSkill = selectedEngineer.skills.includes(skill);
                  return (
                    <Badge
                      key={skill}
                      variant={hasSkill ? "default" : "outline"}
                      className={hasSkill ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                    >
                      {skill} {hasSkill ? '✓' : '×'}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Create Assignment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import React from 'react';
import { useForm } from 'react-hook-form';
import { useApp } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, AlertTriangle } from 'lucide-react';
import { Project } from '../../types';
import { commonValidationRules, validationHelpers } from '../../utils/validation';
import { handleError } from '../../utils/errorHandler';

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormData = Omit<Project, 'id' | 'createdAt' | 'createdBy'>;

const commonSkills = [
  'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'C#',
  'Go', 'Rust', 'PHP', 'Ruby', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'GraphQL', 'REST API',
  'Vue.js', 'Angular', 'Django', 'Flask', 'Spring Boot', 'Express.js'
];

export function AddProjectDialog({ open, onOpenChange }: AddProjectDialogProps) {
  const { addProject } = useApp();
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>([]);
  const [skillInput, setSkillInput] = React.useState('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      requiredTeamSize: 1,
      requiredSkills: [],
      status: 'planning',
      priority: 'medium',
    }
  });

  React.useEffect(() => {
    setValue('requiredSkills', selectedSkills);
  }, [selectedSkills, setValue]);

  const addSkill = (skill: string) => {
    if (skill && !selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSelectedSkills(selectedSkills.filter(skill => skill !== skillToRemove));
  };

  const onSubmit = async (data: FormData) => {
    try {
      await addProject({
        ...data,
        requiredSkills: selectedSkills,
      });

      // Reset form only on success
      reset();
      setSelectedSkills([]);
      setSkillInput('');
      onOpenChange(false);
    } catch (error) {
      handleError(error, {
        context: 'AddProjectDialog.onSubmit'
      });
    }
  };

  const handleClose = () => {
    reset();
    setSelectedSkills([]);
    setSkillInput('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new project with required skills and team size.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              {...register('name', commonValidationRules.projectName)}
              placeholder="Enter project name"
              className={errors.name ? 'border-red-500 focus:border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description', {
                required: 'Description is required',
                ...commonValidationRules.description
              })}
              placeholder="Describe the project objectives and scope"
              rows={3}
              className={errors.description ? 'border-red-500 focus:border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate', commonValidationRules.date)}
                className={errors.startDate ? 'border-red-500 focus:border-red-500' : ''}
              />
              {errors.startDate && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate', {
                  ...commonValidationRules.endDate,
                  required: 'End date is required'
                })}
                className={errors.endDate ? 'border-red-500 focus:border-red-500' : ''}
              />
              {errors.endDate && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requiredTeamSize">Team Size</Label>
              <Input
                id="requiredTeamSize"
                type="number"
                min="1"
                max="50"
                {...register('requiredTeamSize', {
                  ...commonValidationRules.teamSize,
                  valueAsNumber: true
                })}
                className={errors.requiredTeamSize ? 'border-red-500 focus:border-red-500' : ''}
              />
              {errors.requiredTeamSize && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.requiredTeamSize.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => setValue('status', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select onValueChange={(value) => setValue('priority', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Required Skills</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedSkills.map((skill) => (
                <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Type a skill and press Enter"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill(skillInput);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addSkill(skillInput)}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {commonSkills.filter(skill => !selectedSkills.includes(skill)).slice(0, 8).map((skill) => (
                <Button
                  key={skill}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => addSkill(skill)}
                >
                  + {skill}
                </Button>
              ))}
            </div>
          </div>

          {validationHelpers.hasErrors(errors) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please fix the errors above before submitting.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={validationHelpers.hasErrors(errors)}
            >
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
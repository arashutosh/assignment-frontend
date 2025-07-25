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
import { Engineer } from '../../types';
import { commonValidationRules, validationHelpers } from '../../utils/validation';
import { handleError } from '../../utils/errorHandler';

interface AddEngineerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormData = Omit<Engineer, 'id' | 'currentAllocation'>;

const commonSkills = [
  'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'C#',
  'Go', 'Rust', 'PHP', 'Ruby', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'GraphQL', 'REST API',
  'Vue.js', 'Angular', 'Django', 'Flask', 'Spring Boot', 'Express.js'
];

export function AddEngineerDialog({ open, onOpenChange }: AddEngineerDialogProps) {
  const { addEngineer } = useApp();
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>([]);
  const [skillInput, setSkillInput] = React.useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      email: '',
      skills: [],
      seniorityLevel: 'mid',
      employmentType: 'full-time',
      capacity: 100,
      joinDate: new Date().toISOString().split('T')[0],
    }
  });

  const employmentType = watch('employmentType');

  React.useEffect(() => {
    setValue('capacity', employmentType === 'full-time' ? 100 : 50);
  }, [employmentType, setValue]);

  React.useEffect(() => {
    setValue('skills', selectedSkills);
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
      await addEngineer({
        ...data,
        skills: selectedSkills,
        currentAllocation: 0,
      });

      // Reset form only on success
      reset();
      setSelectedSkills([]);
      setSkillInput('');
      onOpenChange(false);
    } catch (error) {
      handleError(error, {
        context: 'AddEngineerDialog.onSubmit'
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Engineer</DialogTitle>
          <DialogDescription>
            Add a new engineer to your team with their skills and information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                {...register('name', commonValidationRules.name)}
                placeholder="John Doe"
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email', commonValidationRules.email)}
                placeholder="john@company.com"
                className={errors.email ? 'border-red-500 focus:border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seniorityLevel">Seniority Level</Label>
              <Select onValueChange={(value) => setValue('seniorityLevel', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="mid">Mid-level</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment Type</Label>
              <Select onValueChange={(value) => setValue('employmentType', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="joinDate">Join Date</Label>
            <Input
              id="joinDate"
              type="date"
              {...register('joinDate', commonValidationRules.date)}
              className={errors.joinDate ? 'border-red-500 focus:border-red-500' : ''}
            />
            {errors.joinDate && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.joinDate.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Skills</Label>
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
              Add Engineer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
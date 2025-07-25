import React from 'react';
import { useForm } from 'react-hook-form';
import { useApp } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { X, Plus, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const commonSkills = [
    'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'C#',
    'Go', 'Rust', 'PHP', 'Ruby', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'GraphQL', 'REST API',
    'Vue.js', 'Angular', 'Django', 'Flask', 'Spring Boot', 'Express.js'
];

interface FormData {
    name: string;
    email: string;
    skills: string[];
    seniorityLevel: 'junior' | 'mid' | 'senior' | 'lead';
    department?: string;
}

export function EditProfileView() {
    const { currentUser, engineers, updateEngineer } = useApp();
    const { toast } = useToast();
    const [selectedSkills, setSelectedSkills] = React.useState<string[]>([]);
    const [skillInput, setSkillInput] = React.useState('');
    const [isEditing, setIsEditing] = React.useState(false);

    const currentEngineer = engineers.find(eng => eng.id === currentUser?.id);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors, isDirty }
    } = useForm<FormData>({
        defaultValues: {
            name: currentEngineer?.name || '',
            email: currentEngineer?.email || '',
            skills: currentEngineer?.skills || [],
            seniorityLevel: currentEngineer?.seniorityLevel || 'mid',
            department: currentEngineer?.department || '',
        }
    });

    React.useEffect(() => {
        if (currentEngineer) {
            setSelectedSkills(currentEngineer.skills || []);
            setValue('name', currentEngineer.name);
            setValue('email', currentEngineer.email);
            setValue('seniorityLevel', currentEngineer.seniorityLevel || 'mid');
            setValue('department', currentEngineer.department || '');
        }
    }, [currentEngineer, setValue]);

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
        if (!currentEngineer) return;

        try {
            await updateEngineer(currentEngineer.id, {
                ...data,
                skills: selectedSkills,
            });

            setIsEditing(false);
            toast({
                title: "Profile Updated",
                description: "Your profile has been successfully updated.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update profile. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleCancel = () => {
        if (currentEngineer) {
            reset({
                name: currentEngineer.name,
                email: currentEngineer.email,
                seniorityLevel: currentEngineer.seniorityLevel || 'mid',
                department: currentEngineer.department || '',
            });
            setSelectedSkills(currentEngineer.skills || []);
        }
        setIsEditing(false);
    };

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
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
                    <p className="text-gray-600 text-lg">Manage your professional information and skills</p>
                </div>
                {!isEditing && (
                    <Button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 shadow-sm hover:shadow-md transition-shadow"
                    >
                        Edit Profile
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                        {isEditing ? 'Edit your professional details below' : 'Your current professional information'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isEditing ? (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        {...register('name', { required: 'Name is required' })}
                                        placeholder="John Doe"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-600">{errors.name.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        {...register('email', {
                                            required: 'Email is required',
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: 'Invalid email address'
                                            }
                                        })}
                                        placeholder="john@company.com"
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-600">{errors.email.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="seniorityLevel">Seniority Level</Label>
                                    <Select onValueChange={(value: any) => setValue('seniorityLevel', value)} defaultValue={currentEngineer.seniorityLevel}>
                                        <SelectTrigger>
                                            <SelectValue />
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
                                    <Label htmlFor="department">Department</Label>
                                    <Input
                                        id="department"
                                        {...register('department')}
                                        placeholder="Engineering"
                                    />
                                </div>
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
                                        <Plus className="h-4 w-4" />
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

                            <div className="flex gap-3 pt-6">
                                <Button type="submit" disabled={!isDirty}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </Button>
                                <Button type="button" variant="outline" onClick={handleCancel}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarFallback className="text-xl">
                                        {currentEngineer.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-2xl font-semibold">{currentEngineer.name}</h3>
                                    <p className="text-gray-600 capitalize text-lg">{currentEngineer.seniorityLevel} Engineer</p>
                                    <p className="text-sm text-gray-500">{currentEngineer.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium mb-2">Employment Details</h4>
                                    <div className="space-y-1 text-sm">
                                        <p><span className="font-medium">Type:</span> {currentEngineer.employmentType}</p>
                                        <p><span className="font-medium">Capacity:</span> {currentEngineer.capacity}%</p>
                                        {currentEngineer.department && (
                                            <p><span className="font-medium">Department:</span> {currentEngineer.department}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-2">
                                            Employment type and capacity are managed by your manager
                                        </p>
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
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useApp } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, AlertTriangle } from 'lucide-react';
import { commonValidationRules, validationHelpers } from '@/utils/validation';

interface LoginFormProps {
  role: 'manager' | 'engineer';
}

interface FormData {
  email: string;
  password: string;
}

export function LoginForm({ role }: LoginFormProps) {
  const { login, isLoading } = useApp();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  useEffect(() => {
    // Reset form when role changes
    reset();
    clearErrors();
  }, [role, reset, clearErrors]);

  const onSubmit = async (data: FormData) => {
    clearErrors();

    const success = await login(data.email, data.password, role);
    if (!success) {
      setError('root', {
        type: 'manual',
        message: 'Invalid email or password. Please check your credentials and try again.'
      });
    }
  };

  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-xl p-8 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
            <Users className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">ResourceHub</CardTitle>
          <CardDescription className="text-lg mt-2">
            Sign in as <span className="font-semibold text-blue-600">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email', commonValidationRules.email)}
                placeholder="Enter your email"
                className={`h-12 text-lg px-4 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base">Password</Label>
              <Input
                id="password"
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 1, message: 'Password is required' }
                })}
                placeholder="Enter your password"
                className={`h-12 text-lg px-4 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              {errors.password && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {errors.root && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errors.root.message}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold"
              disabled={isLoading || validationHelpers.hasErrors(errors)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
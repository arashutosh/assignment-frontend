import React from 'react';
import { ValidationErrorDetail } from '@/types/errors';

export interface ValidationRule {
    required?: boolean | string;
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
    pattern?: { value: RegExp; message: string };
    min?: { value: number; message: string };
    max?: { value: number; message: string };
    custom?: (value: any) => string | undefined;
}

export interface ValidationRules {
    [key: string]: ValidationRule;
}

// Common validation patterns
export const validationPatterns = {
    email: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: 'Please enter a valid email address'
    },
    name: {
        value: /^[a-zA-Z\s'-]+$/,
        message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
    },
    strongPassword: {
        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
    },
    projectName: {
        value: /^[a-zA-Z0-9\s\-_.]+$/,
        message: 'Project name can only contain letters, numbers, spaces, hyphens, underscores, and dots'
    },
    percentage: {
        value: /^(100|[1-9]?[0-9])$/,
        message: 'Please enter a valid percentage (0-100)'
    }
};

// Predefined validation rules for common fields
export const commonValidationRules: ValidationRules = {
    name: {
        required: 'Full name is required',
        minLength: { value: 2, message: 'Name must be at least 2 characters' },
        maxLength: { value: 50, message: 'Name cannot exceed 50 characters' },
        pattern: validationPatterns.name
    },
    email: {
        required: 'Email address is required',
        pattern: validationPatterns.email
    },
    password: {
        required: 'Password is required',
        minLength: { value: 8, message: 'Password must be at least 8 characters' },
        pattern: validationPatterns.strongPassword
    },
    projectName: {
        required: 'Project name is required',
        minLength: { value: 3, message: 'Project name must be at least 3 characters' },
        maxLength: { value: 100, message: 'Project name cannot exceed 100 characters' },
        pattern: validationPatterns.projectName
    },
    description: {
        maxLength: { value: 500, message: 'Description cannot exceed 500 characters' }
    },
    capacity: {
        required: 'Capacity is required',
        min: { value: 1, message: 'Capacity must be at least 1%' },
        max: { value: 100, message: 'Capacity cannot exceed 100%' }
    },
    teamSize: {
        required: 'Team size is required',
        min: { value: 1, message: 'Team size must be at least 1' },
        max: { value: 50, message: 'Team size cannot exceed 50' }
    },
    skills: {
        custom: (value: string[]) => {
            if (!value || value.length === 0) {
                return 'At least one skill is required';
            }
            if (value.length > 20) {
                return 'Cannot have more than 20 skills';
            }
            return undefined;
        }
    },
    date: {
        required: 'Date is required',
        custom: (value: string) => {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return 'Please enter a valid date';
            }
            return undefined;
        }
    },
    endDate: {
        custom: (value: string) => {
            if (!value) return undefined;
            // Note: Cross-field validation should be handled at the form level
            // This is just a basic date format validation
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return 'Invalid date format';
            }
            return undefined;
        }
    }
};

// Enhanced validation function
export function validateField(
    value: any,
    rules: ValidationRule,
    fieldName: string = 'Field'
): string | undefined {
    // Check required
    if (rules.required) {
        const isEmpty = value === undefined || value === null ||
            (typeof value === 'string' && value.trim() === '') ||
            (Array.isArray(value) && value.length === 0);

        if (isEmpty) {
            return typeof rules.required === 'string' ? rules.required : `${fieldName} is required`;
        }
    }

    // Skip other validations if value is empty (and not required)
    if (!value || (typeof value === 'string' && value.trim() === '')) {
        return undefined;
    }

    // Check minLength
    if (rules.minLength && typeof value === 'string') {
        if (value.length < rules.minLength.value) {
            return rules.minLength.message;
        }
    }

    // Check maxLength
    if (rules.maxLength && typeof value === 'string') {
        if (value.length > rules.maxLength.value) {
            return rules.maxLength.message;
        }
    }

    // Check pattern
    if (rules.pattern && typeof value === 'string') {
        if (!rules.pattern.value.test(value)) {
            return rules.pattern.message;
        }
    }

    // Check min
    if (rules.min && typeof value === 'number') {
        if (value < rules.min.value) {
            return rules.min.message;
        }
    }

    // Check max
    if (rules.max && typeof value === 'number') {
        if (value > rules.max.value) {
            return rules.max.message;
        }
    }

    // Check custom validation
    if (rules.custom) {
        return rules.custom(value);
    }

    return undefined;
}

// Validate entire form
export function validateForm(
    formData: Record<string, any>,
    validationRules: ValidationRules
): ValidationErrorDetail[] {
    const errors: ValidationErrorDetail[] = [];

    Object.keys(validationRules).forEach(fieldName => {
        const rules = validationRules[fieldName];
        const value = formData[fieldName];
        const error = validateField(value, rules, fieldName);

        if (error) {
            errors.push({
                field: fieldName,
                message: error
            });
        }
    });

    return errors;
}

// Real-time validation hook
export function useFieldValidation(
    value: any,
    rules: ValidationRule,
    fieldName: string = 'Field'
) {
    const [error, setError] = React.useState<string | undefined>();
    const [touched, setTouched] = React.useState(false);

    React.useEffect(() => {
        if (touched) {
            const validationError = validateField(value, rules, fieldName);
            setError(validationError);
        }
    }, [value, rules, fieldName, touched]);

    const markTouched = React.useCallback(() => {
        setTouched(true);
    }, []);

    const clearError = React.useCallback(() => {
        setError(undefined);
        setTouched(false);
    }, []);

    return {
        error,
        touched,
        markTouched,
        clearError,
        isValid: !error && touched
    };
}

// Form validation status helpers
export const validationHelpers = {
    hasErrors: (errors: Record<string, any>): boolean => {
        return Object.keys(errors).length > 0;
    },

    getErrorCount: (errors: Record<string, any>): number => {
        return Object.keys(errors).length;
    },

    getFieldError: (errors: Record<string, any>, fieldName: string): string | undefined => {
        return errors[fieldName]?.message;
    },

    isFieldValid: (errors: Record<string, any>, fieldName: string): boolean => {
        return !errors[fieldName];
    },

    formatErrorMessage: (error: ValidationErrorDetail): string => {
        return error.message;
    },

    // Convert react-hook-form errors to our format
    convertRHFErrors: (errors: Record<string, any>): ValidationErrorDetail[] => {
        return Object.keys(errors).map(field => ({
            field,
            message: errors[field]?.message || 'Invalid value'
        }));
    }
}; 
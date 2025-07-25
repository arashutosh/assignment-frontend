export interface ApiError {
    message: string;
    code?: string;
    field?: string;
    details?: Record<string, any>;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
}

export class ApplicationError extends Error {
  public readonly code?: string;
  public readonly statusCode?: number;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    code?: string,
    statusCode?: number,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NetworkError extends ApplicationError {
  constructor(message: string = 'Network connection failed') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends ApplicationError {
  public readonly validationErrors: ValidationErrorDetail[];

  constructor(message: string, validationErrors: ValidationErrorDetail[] = []) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
  }
}

// Error severity levels
export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

export interface ErrorContext {
    userId?: string;
    action?: string;
    component?: string;
    timestamp: string;
    severity: ErrorSeverity;
}

// Utility functions for error handling
export const errorUtils = {
    // Extract user-friendly message from various error types
    getUserMessage: (error: unknown): string => {
        if (error instanceof ApplicationError) {
            return error.message;
        }

        if (error instanceof Error) {
            return error.message;
        }

        if (typeof error === 'string') {
            return error;
        }

        return 'An unexpected error occurred. Please try again.';
    },

    // Determine error severity
    getSeverity: (error: unknown): ErrorSeverity => {
        if (error instanceof AuthenticationError) {
            return ErrorSeverity.HIGH;
        }

        if (error instanceof NetworkError) {
            return ErrorSeverity.MEDIUM;
        }

        if (error instanceof ValidationError) {
            return ErrorSeverity.LOW;
        }

        return ErrorSeverity.MEDIUM;
    },

    // Check if error should be retryable
    isRetryable: (error: unknown): boolean => {
        if (error instanceof NetworkError) {
            return true;
        }

        if (error instanceof ApplicationError) {
            return error.statusCode === undefined || error.statusCode >= 500;
        }

        return false;
    },

    // Format error for logging
    formatForLogging: (error: unknown, context?: Partial<ErrorContext>): Record<string, any> => {
        const baseContext: ErrorContext = {
            timestamp: new Date().toISOString(),
            severity: errorUtils.getSeverity(error),
            ...context,
        };

        if (error instanceof ApplicationError) {
            return {
                ...baseContext,
                message: error.message,
                code: error.code,
                statusCode: error.statusCode,
                details: error.details,
                stack: error.stack,
            };
        }

        if (error instanceof Error) {
            return {
                ...baseContext,
                message: error.message,
                name: error.name,
                stack: error.stack,
            };
        }

        return {
            ...baseContext,
            message: String(error),
            type: typeof error,
        };
    },
}; 
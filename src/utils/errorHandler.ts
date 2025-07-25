import { toast } from '@/hooks/use-toast';
import {
    ApplicationError,
    NetworkError,
    AuthenticationError,
    ValidationError,
    errorUtils,
    ErrorSeverity,
    type ApiError
} from '@/types/errors';

interface ErrorHandlerOptions {
    showToast?: boolean;
    logError?: boolean;
    context?: string;
    retryAction?: () => void;
}

export class ErrorHandler {
    private static instance: ErrorHandler;

    private constructor() { }

    public static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    // Parse API response errors
    public async parseApiError(response: Response): Promise<ApplicationError> {
        let errorData: ApiError;

        try {
            errorData = await response.json();
        } catch {
            // If response doesn't contain JSON, create a generic error
            errorData = {
                message: `Request failed with status ${response.status}`,
            };
        }

        const message = errorData.message || `Request failed with status ${response.status}`;

        switch (response.status) {
            case 401:
                return new AuthenticationError(message);
            case 422:
            case 400:
                return new ValidationError(message);
            case 429:
                return new ApplicationError('Too many requests. Please try again later.', 'RATE_LIMIT', 429);
            case 500:
            case 502:
            case 503:
            case 504:
                return new ApplicationError('Server error. Please try again later.', 'SERVER_ERROR', response.status);
            default:
                return new ApplicationError(message, errorData.code, response.status, errorData.details);
        }
    }

    // Handle different types of errors
    public handle(error: unknown, options: ErrorHandlerOptions = {}): void {
        const {
            showToast = true,
            logError = true,
            context = 'Unknown',
            retryAction
        } = options;

        // Log error if enabled
        if (logError) {
            const logData = errorUtils.formatForLogging(error, {
                component: context,
                action: 'error_handling',
            });
            console.error('Error handled:', logData);
        }

        // Show user-friendly toast notification
        if (showToast) {
            this.showErrorToast(error, retryAction);
        }

        // Handle specific error types
        if (error instanceof AuthenticationError) {
            this.handleAuthError();
        }
    }

    // Show appropriate toast based on error type
    private showErrorToast(error: unknown, retryAction?: () => void): void {
        const message = errorUtils.getUserMessage(error);
        const severity = errorUtils.getSeverity(error);
        const isRetryable = errorUtils.isRetryable(error);

        const toastConfig: any = {
            title: this.getErrorTitle(severity),
            description: message,
            variant: severity === ErrorSeverity.LOW ? 'default' : 'destructive',
        };

        // Add retry action if applicable
        if (retryAction && isRetryable) {
            toastConfig.action = {
                altText: 'Retry',
                label: 'Retry',
                onClick: retryAction,
            };
        }

        toast(toastConfig);
    }

    private getErrorTitle(severity: ErrorSeverity): string {
        switch (severity) {
            case ErrorSeverity.CRITICAL:
                return 'Critical Error';
            case ErrorSeverity.HIGH:
                return 'Error';
            case ErrorSeverity.MEDIUM:
                return 'Warning';
            case ErrorSeverity.LOW:
                return 'Notice';
            default:
                return 'Error';
        }
    }

    // Handle authentication errors
    private handleAuthError(): void {
        // Clear local storage and redirect to login
        localStorage.removeItem('token');

        // Dispatch logout event or redirect
        window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    // Wrapper for fetch requests with automatic error handling
    public async fetchWithErrorHandling(
        url: string,
        options: RequestInit = {},
        errorOptions: ErrorHandlerOptions = {}
    ): Promise<Response> {
        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                const error = await this.parseApiError(response);
                this.handle(error, errorOptions);
                throw error;
            }

            return response;
        } catch (error) {
            // Handle network errors
            if (error instanceof TypeError && error.message.includes('fetch')) {
                const networkError = new NetworkError('Unable to connect to server. Please check your internet connection.');
                this.handle(networkError, errorOptions);
                throw networkError;
            }

            // Re-throw if it's already been handled
            if (error instanceof ApplicationError) {
                throw error;
            }

            // Handle unknown errors
            this.handle(error, errorOptions);
            throw error;
        }
    }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions
export const handleError = (error: unknown, options?: ErrorHandlerOptions) => {
    errorHandler.handle(error, options);
};

export const fetchWithErrorHandling = (
    url: string,
    options?: RequestInit,
    errorOptions?: ErrorHandlerOptions
) => {
    return errorHandler.fetchWithErrorHandling(url, options, errorOptions);
}; 
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error Boundary caught an error:', error, errorInfo);

        // Log error to external service (e.g., Sentry, LogRocket)
        // logErrorToService(error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const isDevelopment = process.env.NODE_ENV === 'development';

            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="max-w-lg w-full">
                        <Alert variant="destructive" className="mb-6">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Something went wrong</AlertTitle>
                            <AlertDescription className="mt-2">
                                An unexpected error occurred. We apologize for the inconvenience.
                                {isDevelopment && this.state.error && (
                                    <details className="mt-4 p-3 bg-gray-100 rounded text-sm text-gray-700">
                                        <summary className="cursor-pointer font-medium">
                                            Error Details (Development)
                                        </summary>
                                        <div className="mt-2 space-y-2">
                                            <div>
                                                <strong>Error:</strong> {this.state.error.message}
                                            </div>
                                            <div>
                                                <strong>Stack:</strong>
                                                <pre className="text-xs mt-1 overflow-auto">
                                                    {this.state.error.stack}
                                                </pre>
                                            </div>
                                            {this.state.errorInfo && (
                                                <div>
                                                    <strong>Component Stack:</strong>
                                                    <pre className="text-xs mt-1 overflow-auto">
                                                        {this.state.errorInfo.componentStack}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </details>
                                )}
                            </AlertDescription>
                        </Alert>

                        <div className="flex gap-3">
                            <Button onClick={this.handleRetry} variant="outline" className="flex-1">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Try Again
                            </Button>
                            <Button onClick={this.handleReload} className="flex-1">
                                Reload Page
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Hook version for functional components
export function useErrorBoundary() {
    const [error, setError] = React.useState<Error | null>(null);

    const resetError = React.useCallback(() => {
        setError(null);
    }, []);

    const captureError = React.useCallback((error: Error) => {
        setError(error);
    }, []);

    React.useEffect(() => {
        if (error) {
            throw error;
        }
    }, [error]);

    return { captureError, resetError };
} 
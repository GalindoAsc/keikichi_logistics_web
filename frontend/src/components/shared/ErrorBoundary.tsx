import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Check if in development mode
const isDev = import.meta.env.DEV;

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary component to catch and display errors gracefully.
 * Wraps components that might throw during rendering.
 */
export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center">
                    <div className="text-center p-8 bg-white dark:bg-keikichi-forest-800 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-lg max-w-md mx-4">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-keikichi-forest-800 dark:text-white mb-2">
                            Algo salió mal
                        </h2>
                        <p className="text-keikichi-forest-500 dark:text-keikichi-lime-300 mb-4 text-sm">
                            Ha ocurrido un error inesperado. Por favor intenta de nuevo.
                        </p>
                        {isDev && this.state.error && (
                            <pre className="text-left text-xs bg-keikichi-forest-50 dark:bg-keikichi-forest-900 p-3 rounded-lg mb-4 overflow-auto max-h-32 text-red-600 dark:text-red-400">
                                {this.state.error.message}
                            </pre>
                        )}
                        <button
                            onClick={this.handleRetry}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-keikichi-lime-600 text-white rounded-lg hover:bg-keikichi-lime-700 transition-colors font-medium"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Intentar de nuevo
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

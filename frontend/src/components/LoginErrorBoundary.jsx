import React from 'react';
import Button from './Button';

/**
 * Error Boundary specifically designed for login flow failures
 * Catches JavaScript errors during role detection, redirect, and authentication
 */
class LoginErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('LoginErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log to security monitoring if available
    this.logSecurityEvent(error, errorInfo);
  }

  logSecurityEvent = async (error, errorInfo) => {
    try {
      const securityUtils = await import('../utils/securityUtils');
      await securityUtils.securityLogger.logSecurityEvent(
        securityUtils.SECURITY_EVENT_TYPES.LOGIN_FLOW_ERROR,
        securityUtils.SECURITY_SEVERITY.HIGH,
        'Login flow JavaScript error occurred',
        {
          error_message: error.message,
          error_stack: error.stack,
          component_stack: errorInfo.componentStack,
          error_id: this.state.errorId,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      );
    } catch (logError) {
      console.warn('Failed to log login error boundary event:', logError);
    }
  };

  handleRetry = () => {
    // Clear error state and retry
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    // Navigate to home page as fallback
    window.location.href = '/';
  };

  handleReload = () => {
    // Reload the page to reset state
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const { fallbackComponent: FallbackComponent } = this.props;

      // Use custom fallback component if provided
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            errorId={this.state.errorId}
            onRetry={this.handleRetry}
            onGoHome={this.handleGoHome}
            onReload={this.handleReload}
          />
        );
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-app-background flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-app-surface border border-app-border rounded-pro p-8 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>

            {/* Error Title */}
            <h2 className="text-xl font-semibold text-app-main mb-4">
              Login Error Occurred
            </h2>

            {/* Error Message */}
            <p className="text-app-muted mb-6">
              We encountered an unexpected error during the login process. 
              This might be due to a temporary system issue.
            </p>

            {/* Error ID for support */}
            {this.state.errorId && (
              <div className="bg-app-secondary rounded-pro p-3 mb-6">
                <p className="text-xs text-app-muted">
                  Error ID: <span className="font-mono">{this.state.errorId}</span>
                </p>
                <p className="text-xs text-app-muted mt-1">
                  Please provide this ID if you contact support
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={this.handleRetry}
                className="w-full"
              >
                Try Again
              </Button>
              
              <div className="flex space-x-3">
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1"
                >
                  Reload Page
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  Go Home
                </Button>
              </div>
            </div>

            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-app-muted hover:text-app-main">
                  Show Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs">
                  <pre className="whitespace-pre-wrap text-red-800">
                    {error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook version for functional components
 */
export const useLoginErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const handleError = React.useCallback((error, errorInfo = {}) => {
    console.error('Login error handled:', error);
    
    // Log security event
    const logSecurityEvent = async () => {
      try {
        const securityUtils = await import('../utils/securityUtils');
        await securityUtils.securityLogger.logSecurityEvent(
          securityUtils.SECURITY_EVENT_TYPES.LOGIN_FLOW_ERROR,
          securityUtils.SECURITY_SEVERITY.MEDIUM,
          'Login flow error handled',
          {
            error_message: error.message || error.toString(),
            error_context: errorInfo,
            timestamp: new Date().toISOString()
          }
        );
      } catch (logError) {
        console.warn('Failed to log login error:', logError);
      }
    };

    logSecurityEvent();
    setError({ error, errorInfo });
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError
  };
};

/**
 * Higher-order component to wrap components with login error boundary
 */
export const withLoginErrorBoundary = (Component, fallbackComponent = null) => {
  return function WrappedComponent(props) {
    return (
      <LoginErrorBoundary fallbackComponent={fallbackComponent}>
        <Component {...props} />
      </LoginErrorBoundary>
    );
  };
};

export default LoginErrorBoundary;
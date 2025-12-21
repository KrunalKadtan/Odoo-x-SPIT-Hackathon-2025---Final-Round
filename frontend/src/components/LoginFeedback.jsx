import React from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * User-friendly error messages for different login failure scenarios
 * Implements requirement 5.5: user-friendly error messages
 */
export const LoginErrorMessages = {
  // Authentication errors
  INVALID_CREDENTIALS: {
    title: 'Invalid Login Credentials',
    message: 'The email or password you entered is incorrect. Please check your credentials and try again.',
    type: 'error',
    suggestions: [
      'Double-check your email address for typos',
      'Make sure Caps Lock is off when entering your password',
      'Try using the "Forgot Password" link if you can\'t remember your password'
    ]
  },

  ACCOUNT_NOT_FOUND: {
    title: 'Account Not Found',
    message: 'No account exists with this email address.',
    type: 'error',
    suggestions: [
      'Check if you\'re using the correct email address',
      'Create a new account if you haven\'t registered yet',
      'Contact support if you believe this is an error'
    ]
  },

  ACCOUNT_DISABLED: {
    title: 'Account Disabled',
    message: 'Your account has been temporarily disabled. Please contact support for assistance.',
    type: 'error',
    suggestions: [
      'Contact customer support for account reactivation',
      'Check your email for any account-related notifications'
    ]
  },

  // Rate limiting
  TOO_MANY_ATTEMPTS: {
    title: 'Too Many Login Attempts',
    message: 'You\'ve made too many login attempts. Please wait a few minutes before trying again.',
    type: 'warning',
    suggestions: [
      'Wait 5-10 minutes before attempting to log in again',
      'Use the "Forgot Password" option if you\'re having trouble remembering your password',
      'Clear your browser cache and cookies if the issue persists'
    ]
  },

  // Role detection errors
  ROLE_DETECTION_FAILED: {
    title: 'Role Detection Issue',
    message: 'We couldn\'t determine your account permissions. You\'ll be logged in with limited access.',
    type: 'warning',
    suggestions: [
      'Some features may not be available',
      'Try logging out and back in if you experience issues',
      'Contact support if this problem continues'
    ]
  },

  // Network and server errors
  NETWORK_ERROR: {
    title: 'Connection Problem',
    message: 'Unable to connect to our servers. Please check your internet connection and try again.',
    type: 'error',
    suggestions: [
      'Check your internet connection',
      'Try refreshing the page',
      'Disable any VPN or proxy if you\'re using one'
    ]
  },

  SERVER_ERROR: {
    title: 'Server Temporarily Unavailable',
    message: 'Our servers are experiencing issues. Please try again in a few moments.',
    type: 'error',
    suggestions: [
      'Wait a few minutes and try again',
      'Check our status page for any ongoing maintenance',
      'Contact support if the problem persists'
    ]
  },

  // Redirect errors
  REDIRECT_FAILED: {
    title: 'Navigation Issue',
    message: 'We couldn\'t redirect you to your intended destination. You\'ll be taken to the home page instead.',
    type: 'warning',
    suggestions: [
      'You can navigate to your desired page manually',
      'Try logging out and back in if you continue having issues'
    ]
  },

  INVALID_RETURN_URL: {
    title: 'Invalid Destination',
    message: 'The page you were trying to access is not available. You\'ll be redirected to the home page.',
    type: 'info',
    suggestions: [
      'The link you followed may be outdated or incorrect',
      'Use the navigation menu to find what you\'re looking for'
    ]
  },

  // Security errors
  SECURITY_VIOLATION: {
    title: 'Security Check Failed',
    message: 'For your security, this login attempt has been blocked. Please try again or contact support.',
    type: 'error',
    suggestions: [
      'Make sure you\'re accessing the site from a trusted location',
      'Clear your browser cache and cookies',
      'Contact support if you believe this is an error'
    ]
  },

  // Generic fallback
  UNKNOWN_ERROR: {
    title: 'Unexpected Error',
    message: 'Something went wrong during the login process. Please try again.',
    type: 'error',
    suggestions: [
      'Try refreshing the page and logging in again',
      'Clear your browser cache and cookies',
      'Contact support if the problem continues'
    ]
  }
};

/**
 * Enhanced error display component with user-friendly messages
 */
export const LoginErrorDisplay = ({ 
  errorType, 
  customMessage = null, 
  showSuggestions = true,
  onRetry = null,
  onDismiss = null,
  className = ''
}) => {
  const errorConfig = LoginErrorMessages[errorType] || LoginErrorMessages.UNKNOWN_ERROR;
  const message = customMessage || errorConfig.message;

  const getIconForType = (type) => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getBgColorForType = (type) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColorForType = (type) => {
    switch (type) {
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <div className={`border rounded-pro p-4 ${getBgColorForType(errorConfig.type)} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIconForType(errorConfig.type)}
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${getTextColorForType(errorConfig.type)}`}>
            {errorConfig.title}
          </h3>
          
          <p className={`mt-1 text-sm ${getTextColorForType(errorConfig.type)} opacity-90`}>
            {message}
          </p>

          {showSuggestions && errorConfig.suggestions && errorConfig.suggestions.length > 0 && (
            <div className="mt-3">
              <p className={`text-xs font-medium ${getTextColorForType(errorConfig.type)}`}>
                What you can try:
              </p>
              <ul className={`mt-1 text-xs ${getTextColorForType(errorConfig.type)} opacity-80 space-y-1`}>
                {errorConfig.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(onRetry || onDismiss) && (
            <div className="mt-4 flex space-x-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`text-xs font-medium ${getTextColorForType(errorConfig.type)} hover:opacity-80 underline`}
                >
                  Try Again
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className={`text-xs font-medium ${getTextColorForType(errorConfig.type)} hover:opacity-80 underline`}
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>

        {onDismiss && (
          <div className="flex-shrink-0 ml-4">
            <button
              onClick={onDismiss}
              className={`${getTextColorForType(errorConfig.type)} hover:opacity-80`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Loading states for different phases of the login process
 */
export const LoginLoadingStates = {
  AUTHENTICATING: {
    text: 'Signing you in...',
    description: 'Verifying your credentials'
  },
  DETECTING_ROLE: {
    text: 'Detecting user role...',
    description: 'Determining your account permissions'
  },
  VALIDATING_RETURN_URL: {
    text: 'Validating destination...',
    description: 'Checking redirect permissions'
  },
  REDIRECTING: {
    text: 'Redirecting...',
    description: 'Taking you to your destination'
  },
  FETCHING_PROFILE: {
    text: 'Loading profile...',
    description: 'Getting your account information'
  },
  SECURITY_CHECK: {
    text: 'Security check...',
    description: 'Validating login security'
  }
};

/**
 * Enhanced loading display component for login process
 */
export const LoginLoadingDisplay = ({ 
  stage, 
  customText = null, 
  customDescription = null,
  progress = null,
  className = ''
}) => {
  const loadingConfig = LoginLoadingStates[stage] || LoginLoadingStates.AUTHENTICATING;
  const text = customText || loadingConfig.text;
  const description = customDescription || loadingConfig.description;

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-pro p-4 ${className}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <LoadingSpinner size="small" color="primary" />
        </div>
        
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-blue-800">
            {text}
          </p>
          {description && (
            <p className="text-xs text-blue-600 mt-1">
              {description}
            </p>
          )}
          
          {progress !== null && (
            <div className="mt-2">
              <div className="bg-blue-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Success message component for completed login
 */
export const LoginSuccessDisplay = ({ 
  message = 'Login successful!', 
  destination = null,
  className = ''
}) => {
  return (
    <div className={`bg-green-50 border border-green-200 rounded-pro p-4 ${className}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <div className="ml-3">
          <p className="text-sm font-medium text-green-800">
            {message}
          </p>
          {destination && (
            <p className="text-xs text-green-600 mt-1">
              Redirecting to {destination}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Utility function to map error types from API responses or exceptions
 */
export const mapErrorToType = (error) => {
  if (!error) return 'UNKNOWN_ERROR';

  // Network errors
  if (!navigator.onLine) return 'NETWORK_ERROR';
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    return 'NETWORK_ERROR';
  }

  // HTTP status codes
  if (error.response?.status) {
    switch (error.response.status) {
      case 401:
        const detail = error.response.data?.detail?.toLowerCase() || '';
        if (detail.includes('no active account')) return 'ACCOUNT_NOT_FOUND';
        if (detail.includes('credentials')) return 'INVALID_CREDENTIALS';
        return 'INVALID_CREDENTIALS';
      
      case 403:
        return 'ACCOUNT_DISABLED';
      
      case 429:
        return 'TOO_MANY_ATTEMPTS';
      
      case 500:
      case 502:
      case 503:
      case 504:
        return 'SERVER_ERROR';
      
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  // Custom error types
  if (error.type) {
    switch (error.type) {
      case 'ROLE_DETECTION_FAILED':
        return 'ROLE_DETECTION_FAILED';
      case 'REDIRECT_FAILED':
        return 'REDIRECT_FAILED';
      case 'INVALID_RETURN_URL':
        return 'INVALID_RETURN_URL';
      case 'SECURITY_VIOLATION':
        return 'SECURITY_VIOLATION';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  // Error message patterns
  const message = error.message?.toLowerCase() || '';
  if (message.includes('role detection')) return 'ROLE_DETECTION_FAILED';
  if (message.includes('redirect')) return 'REDIRECT_FAILED';
  if (message.includes('network')) return 'NETWORK_ERROR';
  if (message.includes('server')) return 'SERVER_ERROR';

  return 'UNKNOWN_ERROR';
};

export default {
  LoginErrorMessages,
  LoginErrorDisplay,
  LoginLoadingStates,
  LoginLoadingDisplay,
  LoginSuccessDisplay,
  mapErrorToType
};
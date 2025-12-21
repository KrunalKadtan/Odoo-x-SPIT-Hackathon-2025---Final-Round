import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import LoginErrorBoundary, { useLoginErrorHandler } from '../components/LoginErrorBoundary';
import { LoginErrorDisplay, LoginLoadingDisplay, LoginSuccessDisplay, mapErrorToType } from '../components/LoginFeedback';
import { LoginLoadingManager } from '../components/LoginLoadingStates';
import { authAPI, tokenUtils, auditLogger } from '../utils/api';
import { validateSigninForm } from '../utils/validation';
import { roleDetectionService } from '../services/roleDetectionService';
import { redirectManager } from '../services/redirectManager';
import { securityValidator } from '../services/securityValidator';

const SignIn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { error: boundaryError, handleError, clearError } = useLoginErrorHandler();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(null);
  const [loadingData, setLoadingData] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);

  // Extract return URL from query parameters on component mount
  useEffect(() => {
    const returnUrl = searchParams.get('returnUrl') || searchParams.get('return') || searchParams.get('redirect');
    if (returnUrl) {
      console.log('Return URL detected from query parameters:', returnUrl);
      // Store return URL for use after login
      localStorage.setItem('pending_return_url', returnUrl);
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors and success messages
    setErrors({});
    setSuccessMessage(null);
    clearError();
    
    // Validate form
    const validationErrors = validateSigninForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      // Step 1: Authenticate user
      setLoadingStage('AUTHENTICATING');
      setLoadingData({});
      
      const response = await authAPI.signin(formData);
      
      // Store tokens
      tokenUtils.setTokens(response);
      
      // Store user profile data if available
      if (response.profile_data) {
        localStorage.setItem('user_data', JSON.stringify(response.profile_data));
        console.log('Stored user profile data:', response.profile_data);
      }
      
      // Step 2: Detect user role with fallback chain
      setLoadingStage('DETECTING_ROLE');
      setLoadingData({
        attempts: [
          { method: 'Profile API', status: 'active', description: 'Fetching user profile data' },
          { method: 'JWT Token', status: 'pending', description: 'Extracting role from token' },
          { method: 'Default Role', status: 'pending', description: 'Using fallback role' }
        ],
        currentAttempt: 'Profile API'
      });
      
      let userRole = null;
      let userId = null;
      let roleDetectionAttempts = [];
      
      try {
        // Use the role detection service with fallback chain
        userRole = await roleDetectionService.detectRole(
          response.profile_data, 
          response.access
        );
        
        // Get user ID for logging
        userId = response.profile_data?.id || 
                 response.profile_data?.user_id || 
                 tokenUtils.getUserId() || 
                 formData.email;
        
        console.log('Role detection successful:', { userRole, userId });
        
        // Update loading state to show success
        setLoadingData(prev => ({
          ...prev,
          attempts: prev.attempts.map(attempt => 
            attempt.method === 'Profile API' 
              ? { ...attempt, status: 'success' }
              : attempt
          )
        }));
        
      } catch (roleError) {
        console.error('Role detection failed:', roleError);
        
        // Handle role detection error with user-friendly feedback
        handleError(
          { type: 'ROLE_DETECTION_FAILED', originalError: roleError },
          { context: 'role_detection', email: formData.email }
        );
        
        // Log role detection failure for audit
        try {
          await auditLogger.logRoleDetectionFailure(
            formData.email,
            roleError,
            ['profile_api', 'jwt_token', 'default_fallback']
          );
        } catch (logError) {
          console.warn('Failed to log role detection failure:', logError);
        }
        
        // Use default role as final fallback
        userRole = 'customer';
        userId = formData.email;
        
        // Show warning but continue
        setErrors({ 
          general: 'Role detection failed, using default permissions. Some features may be limited.' 
        });
      }
      
      // Step 3: Handle return URL and determine redirect destination
      setLoadingStage('VALIDATING_RETURN_URL');
      
      let finalDestination = null;
      let returnUrl = null;
      
      try {
        // Get return URL from various sources
        returnUrl = localStorage.getItem('pending_return_url') || 
                   localStorage.getItem('return_url') ||
                   searchParams.get('returnUrl') ||
                   searchParams.get('return') ||
                   searchParams.get('redirect');
        
        // Use redirect manager to determine final destination
        finalDestination = redirectManager.determineRedirectUrl(userRole, returnUrl);
        
        setLoadingData({
          returnUrl,
          finalDestination,
          validationSteps: [
            { step: 'URL Sanitization', status: 'success' },
            { step: 'Domain Validation', status: 'success' },
            { step: 'Permission Check', status: 'success' },
            { step: 'Security Validation', status: 'success' }
          ]
        });
        
        console.log('Redirect manager determined destination:', finalDestination);
        
        // Log return URL validation failure if fallback was used
        if (returnUrl && finalDestination !== returnUrl) {
          try {
            await auditLogger.logReturnUrlValidationFailure(
              userId,
              returnUrl,
              'URL validation or role permission check failed, used fallback'
            );
          } catch (logError) {
            console.warn('Failed to log return URL validation failure:', logError);
          }
        }
        
      } catch (redirectError) {
        console.error('Redirect determination failed:', redirectError);
        
        // Handle redirect error
        handleError(
          { type: 'REDIRECT_FAILED', originalError: redirectError },
          { context: 'redirect_determination', returnUrl }
        );
        
        // Final fallback to home page
        finalDestination = '/';
        
        setErrors({ 
          general: 'Redirect determination failed, redirecting to home page.' 
        });
      }
      
      // Step 4: Complete login and redirect
      setLoadingStage('REDIRECTING');
      setLoadingData({});
      
      try {
        // Clear stored return URLs
        localStorage.removeItem('pending_return_url');
        localStorage.removeItem('return_url');
        
        // Log successful redirect for audit
        await auditLogger.logSuccessfulRedirect(
          userId,
          userRole,
          finalDestination,
          returnUrl
        );
        
        console.log('Login successful, redirecting to:', finalDestination);
        
        // Show success message briefly
        setSuccessMessage({
          message: 'Login successful!',
          destination: finalDestination
        });
        
        // Small delay to show success message
        setTimeout(() => {
          navigate(finalDestination, { replace: true });
        }, 1000);
        
      } catch (cleanupError) {
        console.error('Cleanup or redirect failed:', cleanupError);
        
        // Even if cleanup fails, try to redirect
        navigate(finalDestination || '/', { replace: true });
      }
      
    } catch (error) {
      console.error('Signin error:', error);
      setLoadingStage(null);
      setLoadingData({});
      
      // Map error to user-friendly type and display
      const errorType = mapErrorToType(error);
      setErrors({ errorType, originalError: error });
      
      // Log failed login attempt for security monitoring
      try {
        const securityLogger = await import('../utils/securityUtils');
        await securityLogger.securityLogger.logSecurityEvent(
          securityLogger.SECURITY_EVENT_TYPES.FAILED_LOGIN,
          securityLogger.SECURITY_SEVERITY.MEDIUM,
          `Failed login attempt for ${formData.email}`,
          {
            email: formData.email,
            error_status: error.response?.status,
            error_message: error.message,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        );
      } catch (logError) {
        console.warn('Failed to log security event:', logError);
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryError = () => {
    setErrors({});
    clearError();
    setSuccessMessage(null);
  };

  const handleDismissError = () => {
    setErrors({});
    clearError();
  };

  // Render the main SignIn form
  const renderSignInForm = () => (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Sign in to your ApparelDesk account"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Boundary Error Display */}
        {boundaryError && (
          <LoginErrorDisplay
            errorType="UNKNOWN_ERROR"
            customMessage="A technical error occurred during login. Please try again."
            onRetry={handleRetryError}
            onDismiss={handleDismissError}
            className="mb-4"
          />
        )}

        {/* Enhanced Error Display */}
        {errors.errorType && (
          <LoginErrorDisplay
            errorType={errors.errorType}
            onRetry={handleRetryError}
            onDismiss={handleDismissError}
            className="mb-4"
          />
        )}

        {/* Legacy error display for backward compatibility */}
        {errors.general && !errors.errorType && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-pro text-sm">
            {errors.general}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <LoginSuccessDisplay
            message={successMessage.message}
            destination={successMessage.destination}
            className="mb-4"
          />
        )}

        {/* Enhanced Loading States */}
        {isLoading && loadingStage && (
          <LoginLoadingManager
            stage={loadingStage}
            data={loadingData}
            className="mb-4"
          />
        )}

        {/* Legacy loading display for backward compatibility */}
        {isLoading && !loadingStage && (
          <LoginLoadingDisplay
            stage="AUTHENTICATING"
            className="mb-4"
          />
        )}

        <FormInput
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="Enter your email address"
          required
          disabled={isLoading}
        />

        <FormInput
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Enter your password"
          required
          disabled={isLoading}
        />

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link 
              to="/forgot-password" 
              className="text-app-accent hover:text-app-accent/80 font-medium transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </div>

        <div className="text-center pt-4">
          <p className="text-sm text-app-muted font-sans">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="text-app-accent hover:text-app-accent/80 font-medium transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );

  return (
    <LoginErrorBoundary>
      {renderSignInForm()}
    </LoginErrorBoundary>
  );
};

export default SignIn;
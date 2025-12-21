import React from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * Specialized loading states for the login process
 * Provides detailed feedback during role detection and redirect phases
 */

/**
 * Multi-stage login loading component
 * Shows progress through different phases of the login process
 */
export const LoginProcessLoader = ({ 
  currentStage, 
  stages = [],
  className = ''
}) => {
  const defaultStages = [
    { key: 'AUTHENTICATING', label: 'Authenticating', description: 'Verifying credentials' },
    { key: 'DETECTING_ROLE', label: 'Detecting Role', description: 'Determining permissions' },
    { key: 'VALIDATING_RETURN_URL', label: 'Validating Destination', description: 'Checking redirect' },
    { key: 'REDIRECTING', label: 'Redirecting', description: 'Completing login' }
  ];

  const stageList = stages.length > 0 ? stages : defaultStages;
  const currentIndex = stageList.findIndex(stage => stage.key === currentStage);

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-pro p-6 ${className}`}>
      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <LoadingSpinner size="medium" color="primary" />
        </div>
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          Signing You In
        </h3>
        <p className="text-sm text-blue-700">
          Please wait while we complete your login...
        </p>
      </div>

      {/* Progress Steps */}
      <div className="space-y-3">
        {stageList.map((stage, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={stage.key} className="flex items-center">
              {/* Step indicator */}
              <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center">
                {isCompleted ? (
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : isActive ? (
                  <LoadingSpinner size="small" color="primary" />
                ) : (
                  <div className="w-2 h-2 bg-gray-300 rounded-full" />
                )}
              </div>

              {/* Step content */}
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${
                  isActive ? 'text-blue-900' : 
                  isCompleted ? 'text-green-700' : 
                  'text-gray-500'
                }`}>
                  {stage.label}
                </p>
                {stage.description && (
                  <p className={`text-xs ${
                    isActive ? 'text-blue-700' : 
                    isCompleted ? 'text-green-600' : 
                    'text-gray-400'
                  }`}>
                    {stage.description}
                  </p>
                )}
              </div>

              {/* Status indicator */}
              <div className="flex-shrink-0">
                {isActive && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    In Progress
                  </span>
                )}
                {isCompleted && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Complete
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Role detection specific loading component
 */
export const RoleDetectionLoader = ({ 
  attempts = [],
  currentAttempt = null,
  className = ''
}) => {
  const defaultAttempts = [
    { method: 'Profile API', status: 'pending', description: 'Fetching user profile data' },
    { method: 'JWT Token', status: 'pending', description: 'Extracting role from token' },
    { method: 'Default Role', status: 'pending', description: 'Using fallback role' }
  ];

  const attemptList = attempts.length > 0 ? attempts : defaultAttempts;

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-pro p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <LoadingSpinner size="small" color="primary" />
        </div>
        
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">
            Detecting User Role
          </h4>
          
          <p className="text-xs text-yellow-700 mb-3">
            Determining your account permissions using multiple methods...
          </p>

          <div className="space-y-2">
            {attemptList.map((attempt, index) => (
              <div key={index} className="flex items-center text-xs">
                <div className="w-4 h-4 mr-2 flex items-center justify-center">
                  {attempt.status === 'success' ? (
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : attempt.status === 'failed' ? (
                    <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  ) : attempt.method === currentAttempt ? (
                    <LoadingSpinner size="small" color="primary" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-300 rounded-full" />
                  )}
                </div>
                
                <span className={`${
                  attempt.status === 'success' ? 'text-green-700' :
                  attempt.status === 'failed' ? 'text-red-700' :
                  attempt.method === currentAttempt ? 'text-yellow-800' :
                  'text-gray-500'
                }`}>
                  {attempt.method}: {attempt.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Redirect validation loading component
 */
export const RedirectValidationLoader = ({ 
  returnUrl = null,
  validationSteps = [],
  className = ''
}) => {
  const defaultSteps = [
    { step: 'URL Sanitization', status: 'pending' },
    { step: 'Domain Validation', status: 'pending' },
    { step: 'Permission Check', status: 'pending' },
    { step: 'Security Validation', status: 'pending' }
  ];

  const steps = validationSteps.length > 0 ? validationSteps : defaultSteps;

  return (
    <div className={`bg-purple-50 border border-purple-200 rounded-pro p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <LoadingSpinner size="small" color="primary" />
        </div>
        
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium text-purple-800 mb-2">
            Validating Redirect Destination
          </h4>
          
          {returnUrl && (
            <p className="text-xs text-purple-700 mb-3 font-mono bg-purple-100 px-2 py-1 rounded">
              {returnUrl}
            </p>
          )}

          <div className="space-y-1">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center text-xs">
                <div className="w-4 h-4 mr-2 flex items-center justify-center">
                  {step.status === 'success' ? (
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : step.status === 'active' ? (
                    <LoadingSpinner size="small" color="primary" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-300 rounded-full" />
                  )}
                </div>
                
                <span className={`${
                  step.status === 'success' ? 'text-green-700' :
                  step.status === 'active' ? 'text-purple-800' :
                  'text-gray-500'
                }`}>
                  {step.step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Network retry loading component
 */
export const NetworkRetryLoader = ({ 
  attempt = 1,
  maxAttempts = 3,
  operation = 'profile fetch',
  className = ''
}) => {
  return (
    <div className={`bg-orange-50 border border-orange-200 rounded-pro p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <LoadingSpinner size="small" color="primary" />
        </div>
        
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium text-orange-800 mb-2">
            Network Issue Detected
          </h4>
          
          <p className="text-xs text-orange-700 mb-3">
            Retrying {operation}... (Attempt {attempt} of {maxAttempts})
          </p>

          {/* Progress bar */}
          <div className="bg-orange-200 rounded-full h-2">
            <div 
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(attempt / maxAttempts) * 100}%` }}
            />
          </div>

          <p className="text-xs text-orange-600 mt-2">
            {attempt < maxAttempts 
              ? `Will retry ${maxAttempts - attempt} more time${maxAttempts - attempt !== 1 ? 's' : ''}...`
              : 'Final attempt...'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Security check loading component
 */
export const SecurityCheckLoader = ({ 
  checks = [],
  className = ''
}) => {
  const defaultChecks = [
    { name: 'IP Validation', status: 'pending' },
    { name: 'Device Fingerprint', status: 'pending' },
    { name: 'Rate Limiting', status: 'pending' },
    { name: 'Suspicious Activity', status: 'pending' }
  ];

  const checkList = checks.length > 0 ? checks : defaultChecks;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-pro p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-red-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            Security Validation
          </h4>
          
          <p className="text-xs text-red-700 mb-3">
            Performing security checks to protect your account...
          </p>

          <div className="space-y-1">
            {checkList.map((check, index) => (
              <div key={index} className="flex items-center text-xs">
                <div className="w-4 h-4 mr-2 flex items-center justify-center">
                  {check.status === 'success' ? (
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : check.status === 'active' ? (
                    <LoadingSpinner size="small" color="primary" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-300 rounded-full" />
                  )}
                </div>
                
                <span className={`${
                  check.status === 'success' ? 'text-green-700' :
                  check.status === 'active' ? 'text-red-800' :
                  'text-gray-500'
                }`}>
                  {check.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Comprehensive login loading manager
 * Handles all loading states and transitions
 */
export const LoginLoadingManager = ({ 
  stage,
  data = {},
  className = ''
}) => {
  switch (stage) {
    case 'AUTHENTICATING':
      return (
        <LoginProcessLoader 
          currentStage="AUTHENTICATING"
          className={className}
        />
      );

    case 'DETECTING_ROLE':
      return (
        <RoleDetectionLoader 
          attempts={data.attempts}
          currentAttempt={data.currentAttempt}
          className={className}
        />
      );

    case 'VALIDATING_RETURN_URL':
      return (
        <RedirectValidationLoader 
          returnUrl={data.returnUrl}
          validationSteps={data.validationSteps}
          className={className}
        />
      );

    case 'NETWORK_RETRY':
      return (
        <NetworkRetryLoader 
          attempt={data.attempt}
          maxAttempts={data.maxAttempts}
          operation={data.operation}
          className={className}
        />
      );

    case 'SECURITY_CHECK':
      return (
        <SecurityCheckLoader 
          checks={data.checks}
          className={className}
        />
      );

    case 'REDIRECTING':
      return (
        <LoginProcessLoader 
          currentStage="REDIRECTING"
          className={className}
        />
      );

    default:
      return (
        <LoginProcessLoader 
          currentStage={stage}
          className={className}
        />
      );
  }
};

export default {
  LoginProcessLoader,
  RoleDetectionLoader,
  RedirectValidationLoader,
  NetworkRetryLoader,
  SecurityCheckLoader,
  LoginLoadingManager
};
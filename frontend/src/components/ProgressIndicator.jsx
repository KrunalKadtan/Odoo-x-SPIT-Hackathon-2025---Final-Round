import React, { useState, useEffect } from 'react';

/**
 * Progress Bar Component
 * Shows progress for long-running operations like report generation
 */
export const ProgressBar = ({
  progress = 0,
  max = 100,
  showPercentage = true,
  showLabel = true,
  label = '',
  size = 'medium',
  color = 'primary',
  animated = true,
  striped = false,
  className = ''
}) => {
  const percentage = Math.min(Math.max((progress / max) * 100, 0), 100);

  const sizeClasses = {
    small: 'h-2',
    medium: 'h-4',
    large: 'h-6'
  };

  const colorClasses = {
    primary: 'bg-app-accent',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {showLabel && label && (
            <span className="text-sm font-medium text-app-main">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm text-app-muted">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      
      <div className={`w-full bg-app-secondary rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`
            ${sizeClasses[size]} 
            ${colorClasses[color]}
            ${animated ? 'transition-all duration-300 ease-out' : ''}
            ${striped ? 'bg-stripes' : ''}
            rounded-full
          `}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};

/**
 * Circular Progress Component
 * Shows circular progress indicator
 */
export const CircularProgress = ({
  progress = 0,
  max = 100,
  size = 64,
  strokeWidth = 4,
  showPercentage = true,
  color = 'primary',
  backgroundColor = '#e5e7eb',
  className = ''
}) => {
  const percentage = Math.min(Math.max((progress / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorMap = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4'
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorMap[color]}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-app-main">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Step Progress Component
 * Shows progress through multiple steps
 */
export const StepProgress = ({
  steps = [],
  currentStep = 0,
  completedSteps = [],
  orientation = 'horizontal',
  showLabels = true,
  className = ''
}) => {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div className={`${isHorizontal ? 'flex items-center' : 'flex flex-col'} ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index) || index < currentStep;
        const isCurrent = index === currentStep;
        const isUpcoming = index > currentStep;

        return (
          <div
            key={index}
            className={`
              flex items-center
              ${isHorizontal ? 'flex-row' : 'flex-col'}
              ${index < steps.length - 1 ? (isHorizontal ? 'flex-1' : 'mb-4') : ''}
            `}
          >
            {/* Step indicator */}
            <div className="flex items-center">
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium
                  ${isCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isCurrent 
                      ? 'bg-app-accent border-app-accent text-white'
                      : 'bg-app-surface border-app-border text-app-muted'
                  }
                `}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              
              {showLabels && (
                <div className={`${isHorizontal ? 'ml-3' : 'mt-2 text-center'}`}>
                  <div
                    className={`
                      text-sm font-medium
                      ${isCurrent ? 'text-app-main' : 'text-app-muted'}
                    `}
                  >
                    {step.title || `Step ${index + 1}`}
                  </div>
                  {step.description && (
                    <div className="text-xs text-app-muted mt-1">
                      {step.description}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  ${isHorizontal 
                    ? 'flex-1 h-0.5 mx-4' 
                    : 'w-0.5 h-8 my-2 ml-4'
                  }
                  ${isCompleted ? 'bg-green-500' : 'bg-app-border'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Animated Progress Dots
 * Shows animated loading dots
 */
export const ProgressDots = ({
  count = 3,
  size = 'medium',
  color = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-2 h-2',
    medium: 'w-3 h-3',
    large: 'w-4 h-4'
  };

  const colorClasses = {
    primary: 'bg-app-accent',
    secondary: 'bg-app-main',
    muted: 'bg-app-muted'
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`
            ${sizeClasses[size]} 
            ${colorClasses[color]} 
            rounded-full animate-pulse
          `}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
};

/**
 * Progress with Time Estimate
 * Shows progress with estimated time remaining
 */
export const ProgressWithTime = ({
  progress = 0,
  max = 100,
  startTime,
  estimatedDuration,
  label = '',
  className = ''
}) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(elapsed);

      if (progress > 0) {
        const estimatedTotal = (elapsed / progress) * max;
        const remaining = Math.max(0, estimatedTotal - elapsed);
        setTimeRemaining(remaining);
      } else if (estimatedDuration) {
        setTimeRemaining(Math.max(0, estimatedDuration - elapsed));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, progress, max, estimatedDuration]);

  const formatTime = (ms) => {
    if (!ms) return '';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className={className}>
      <ProgressBar
        progress={progress}
        max={max}
        label={label}
        showPercentage={true}
      />
      
      <div className="flex justify-between text-xs text-app-muted mt-2">
        <span>Elapsed: {formatTime(elapsedTime)}</span>
        {timeRemaining !== null && (
          <span>Remaining: {formatTime(timeRemaining)}</span>
        )}
      </div>
    </div>
  );
};

/**
 * Multi-step Progress with Details
 * Shows detailed progress for complex operations
 */
export const DetailedProgress = ({
  steps = [],
  currentStep = 0,
  currentStepProgress = 0,
  overallProgress = 0,
  showStepDetails = true,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall progress */}
      <div>
        <ProgressBar
          progress={overallProgress}
          label="Overall Progress"
          showPercentage={true}
          color="primary"
        />
      </div>

      {/* Current step progress */}
      {steps[currentStep] && (
        <div>
          <ProgressBar
            progress={currentStepProgress}
            label={`Current: ${steps[currentStep].title}`}
            showPercentage={true}
            color="info"
            size="small"
          />
        </div>
      )}

      {/* Step details */}
      {showStepDetails && (
        <div className="space-y-2">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isUpcoming = index > currentStep;

            return (
              <div
                key={index}
                className={`
                  flex items-center text-sm
                  ${isCompleted ? 'text-green-600' : isCurrent ? 'text-app-main' : 'text-app-muted'}
                `}
              >
                <div className="w-4 h-4 mr-3 flex items-center justify-center">
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isCurrent ? (
                    <ProgressDots count={3} size="small" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-current opacity-30" />
                  )}
                </div>
                <span>{step.title}</span>
                {step.description && (
                  <span className="ml-2 text-xs opacity-75">- {step.description}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
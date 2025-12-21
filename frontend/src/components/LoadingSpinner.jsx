import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  className = '',
  text = '',
  overlay = false,
  fullScreen = false
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'border-app-accent border-t-transparent',
    secondary: 'border-app-main border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent'
  };

  const spinnerElement = (
    <div className="flex flex-col items-center justify-center">
      <div 
        className={`
          animate-spin rounded-full border-2
          ${sizeClasses[size]} 
          ${colorClasses[color]}
          ${className}
        `}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {text && (
        <p className="mt-2 text-sm text-app-muted font-sans">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {spinnerElement}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
};

// Skeleton loader component for content placeholders
export const SkeletonLoader = ({ 
  width = '100%', 
  height = '1rem', 
  className = '',
  count = 1,
  spacing = '0.5rem'
}) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse bg-gray-200 rounded"
          style={{
            width,
            height,
            marginBottom: index < count - 1 ? spacing : 0
          }}
          role="status"
          aria-label="Loading content"
        >
          <span className="sr-only">Loading...</span>
        </div>
      ))}
    </div>
  );
};

// Button loading state component
export const LoadingButton = ({ 
  children, 
  loading = false, 
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  ...props 
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative inline-flex items-center justify-center
        ${loading ? 'cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="small" color="white" />
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  );
};

export default LoadingSpinner;
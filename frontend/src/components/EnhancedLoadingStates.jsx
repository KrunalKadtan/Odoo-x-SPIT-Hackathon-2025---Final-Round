import React from 'react';
import LoadingSpinner, { SkeletonLoader } from './LoadingSpinner';
import { ProgressBar, CircularProgress, ProgressDots } from './ProgressIndicator';

/**
 * Table Loading State
 * Skeleton loader specifically designed for table data
 */
export const TableLoadingState = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = ''
}) => {
  return (
    <div className={`bg-app-surface border border-app-border rounded-pro overflow-hidden ${className}`}>
      {/* Header skeleton */}
      {showHeader && (
        <div className="bg-app-secondary px-6 py-3 border-b border-app-border">
          <div className="flex space-x-6">
            {Array.from({ length: columns }).map((_, index) => (
              <SkeletonLoader
                key={index}
                height="1rem"
                width={index === 0 ? '25%' : index === columns - 1 ? '15%' : '20%'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rows skeleton */}
      <div className="divide-y divide-app-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex items-center space-x-6">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className={colIndex === 0 ? 'flex items-center space-x-3' : ''}>
                  {colIndex === 0 && (
                    <div className="w-8 h-8 bg-app-secondary rounded-full animate-pulse" />
                  )}
                  <SkeletonLoader
                    height="1rem"
                    width={
                      colIndex === 0 ? '60%' :
                      colIndex === columns - 1 ? '40%' : '80%'
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Card Grid Loading State
 * Skeleton loader for card-based layouts
 */
export const CardGridLoadingState = ({
  cards = 6,
  columns = 3,
  showImage = true,
  className = ''
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="bg-app-surface border border-app-border rounded-pro p-6 animate-pulse">
          {showImage && (
            <SkeletonLoader height="12rem" className="mb-4" />
          )}
          <SkeletonLoader height="1.5rem" width="75%" className="mb-2" />
          <SkeletonLoader height="1rem" count={2} spacing="0.5rem" className="mb-4" />
          <div className="flex justify-between items-center">
            <SkeletonLoader height="1rem" width="30%" />
            <SkeletonLoader height="2rem" width="25%" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Dashboard Loading State
 * Comprehensive loading state for dashboard components
 */
export const DashboardLoadingState = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Metrics cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-app-surface border border-app-border rounded-pro p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <SkeletonLoader height="1rem" width="60%" />
              <div className="w-6 h-6 bg-app-secondary rounded" />
            </div>
            <SkeletonLoader height="2rem" width="40%" className="mb-2" />
            <SkeletonLoader height="0.75rem" width="30%" />
          </div>
        ))}
      </div>

      {/* Charts and activity skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-app-surface border border-app-border rounded-pro p-6 animate-pulse">
          <SkeletonLoader height="1.5rem" width="40%" className="mb-4" />
          <SkeletonLoader height="16rem" />
        </div>
        
        <div className="bg-app-surface border border-app-border rounded-pro p-6 animate-pulse">
          <SkeletonLoader height="1.5rem" width="35%" className="mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-app-secondary rounded-pro" />
                <div className="flex-1 space-y-2">
                  <SkeletonLoader height="1rem" width="80%" />
                  <SkeletonLoader height="0.75rem" width="40%" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Form Loading State
 * Loading state for forms with various field types
 */
export const FormLoadingState = ({
  fields = 6,
  showButtons = true,
  className = ''
}) => {
  return (
    <div className={`bg-app-surface border border-app-border rounded-pro p-6 animate-pulse ${className}`}>
      <SkeletonLoader height="1.5rem" width="30%" className="mb-6" />
      
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index}>
            <SkeletonLoader height="1rem" width="25%" className="mb-2" />
            <SkeletonLoader height="2.5rem" />
          </div>
        ))}
      </div>

      {showButtons && (
        <div className="flex justify-end space-x-3 mt-6">
          <SkeletonLoader height="2.5rem" width="6rem" />
          <SkeletonLoader height="2.5rem" width="8rem" />
        </div>
      )}
    </div>
  );
};

/**
 * Report Generation Loading
 * Specialized loading state for report generation with progress
 */
export const ReportGenerationLoading = ({
  reportType = 'Report',
  progress = 0,
  currentStep = '',
  estimatedTime = null,
  className = ''
}) => {
  return (
    <div className={`bg-app-surface border border-app-border rounded-pro p-8 text-center ${className}`}>
      <div className="max-w-md mx-auto">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-4 bg-app-secondary rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-app-accent animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-app-main mb-2">
          Generating {reportType}
        </h3>

        {/* Current step */}
        {currentStep && (
          <p className="text-app-muted mb-4">{currentStep}</p>
        )}

        {/* Progress bar */}
        <div className="mb-4">
          <ProgressBar
            progress={progress}
            showPercentage={true}
            animated={true}
            color="primary"
          />
        </div>

        {/* Estimated time */}
        {estimatedTime && (
          <p className="text-sm text-app-muted">
            Estimated time remaining: {estimatedTime}
          </p>
        )}

        {/* Loading dots */}
        <div className="mt-6">
          <ProgressDots count={3} size="medium" color="primary" />
        </div>
      </div>
    </div>
  );
};

/**
 * Data Export Loading
 * Loading state for data export operations
 */
export const DataExportLoading = ({
  exportType = 'CSV',
  recordCount = 0,
  processedCount = 0,
  className = ''
}) => {
  const progress = recordCount > 0 ? (processedCount / recordCount) * 100 : 0;

  return (
    <div className={`bg-app-surface border border-app-border rounded-pro p-6 ${className}`}>
      <div className="flex items-center space-x-4">
        {/* Icon */}
        <div className="w-12 h-12 bg-app-secondary rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-app-accent animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h4 className="font-medium text-app-main mb-1">
            Exporting to {exportType}
          </h4>
          
          {recordCount > 0 && (
            <p className="text-sm text-app-muted mb-2">
              Processing {processedCount.toLocaleString()} of {recordCount.toLocaleString()} records
            </p>
          )}

          <ProgressBar
            progress={progress}
            showPercentage={true}
            size="small"
            color="success"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Search Loading State
 * Loading state for search operations
 */
export const SearchLoadingState = ({
  searchTerm = '',
  className = ''
}) => {
  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="w-12 h-12 mx-auto mb-4 bg-app-secondary rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-app-accent animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-app-main mb-2">
        Searching...
      </h3>
      
      {searchTerm && (
        <p className="text-app-muted">
          Looking for "{searchTerm}"
        </p>
      )}
      
      <ProgressDots count={3} size="medium" color="primary" className="mt-4" />
    </div>
  );
};

/**
 * Upload Loading State
 * Loading state for file uploads
 */
export const UploadLoadingState = ({
  fileName = '',
  progress = 0,
  uploadSpeed = '',
  className = ''
}) => {
  return (
    <div className={`bg-app-surface border border-app-border rounded-pro p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        {/* File icon */}
        <div className="w-10 h-10 bg-app-secondary rounded flex items-center justify-center">
          <svg className="w-5 h-5 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        {/* Upload info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-app-main truncate">
            {fileName || 'Uploading file...'}
          </p>
          
          <div className="mt-1">
            <ProgressBar
              progress={progress}
              showPercentage={true}
              size="small"
              color="info"
            />
          </div>
          
          {uploadSpeed && (
            <p className="text-xs text-app-muted mt-1">
              {uploadSpeed}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Inline Loading State
 * Small loading indicator for inline operations
 */
export const InlineLoading = ({
  text = 'Loading...',
  size = 'small',
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <LoadingSpinner size={size} color="primary" />
      <span className="text-sm text-app-muted">{text}</span>
    </div>
  );
};

/**
 * Button Loading State
 * Loading state for buttons during async operations
 */
export const ButtonLoading = ({
  children,
  loading = false,
  loadingText = 'Loading...',
  disabled = false,
  onClick,
  className = '',
  variant = 'primary',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-pro focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200';
  
  const variantClasses = {
    primary: 'border-transparent bg-app-accent text-white hover:bg-app-accent/90 focus:ring-app-accent',
    secondary: 'border-app-border bg-app-surface text-app-main hover:bg-app-secondary focus:ring-app-accent',
    outline: 'border-app-border bg-transparent text-app-main hover:bg-app-secondary focus:ring-app-accent'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <LoadingSpinner size="small" color="white" className="mr-2" />
      )}
      {loading ? loadingText : children}
    </button>
  );
};

export default {
  TableLoadingState,
  CardGridLoadingState,
  DashboardLoadingState,
  FormLoadingState,
  ReportGenerationLoading,
  DataExportLoading,
  SearchLoadingState,
  UploadLoadingState,
  InlineLoading,
  ButtonLoading
};
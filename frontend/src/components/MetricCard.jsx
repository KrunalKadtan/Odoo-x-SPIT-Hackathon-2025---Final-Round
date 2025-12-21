import React from 'react';

/**
 * MetricCard - Reusable card component for displaying dashboard metrics
 * Uses existing card styling for consistency with customer application
 */
const MetricCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  onClick,
  loading = false 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-app-surface rounded-pro shadow-sm border border-app-border 
        p-6 transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-app-accent' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-sans font-medium text-app-muted mb-1">
            {title}
          </h3>
          {loading ? (
            <div className="h-8 w-24 bg-app-secondary rounded animate-pulse"></div>
          ) : (
            <p className="text-2xl font-mono font-bold text-app-main">
              {value}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="w-12 h-12 bg-app-secondary rounded-pro flex items-center justify-center text-app-accent">
              {icon}
            </div>
          </div>
        )}
      </div>
      
      {(trend || trendValue) && !loading && (
        <div className="flex items-center text-sm">
          {trend === 'up' && (
            <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          )}
          {trend === 'down' && (
            <svg className="w-4 h-4 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          <span className={`font-sans ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-app-muted'}`}>
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;

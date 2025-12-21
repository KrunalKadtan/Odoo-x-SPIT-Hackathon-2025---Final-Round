import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * SystemAlerts - Component for displaying system alerts and notifications
 * Uses existing notification styling for consistency with customer application
 */
const SystemAlerts = ({ alerts = [], loading = false }) => {
  const navigate = useNavigate();

  // Get alert icon and color based on priority
  const getAlertStyle = (priority) => {
    switch (priority) {
      case 'high':
        return {
          icon: (
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          badgeColor: 'bg-red-500'
        };
      case 'medium':
        return {
          icon: (
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          badgeColor: 'bg-yellow-500'
        };
      case 'low':
        return {
          icon: (
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          badgeColor: 'bg-blue-500'
        };
      default:
        return {
          icon: (
            <svg className="w-5 h-5 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-app-secondary',
          borderColor: 'border-app-border',
          textColor: 'text-app-main',
          badgeColor: 'bg-app-muted'
        };
    }
  };

  // Handle alert click for navigation
  const handleAlertClick = (alert) => {
    if (alert.actionUrl) {
      navigate(alert.actionUrl);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="flex items-start space-x-3 p-4 bg-app-secondary rounded-pro">
              <div className="w-5 h-5 bg-app-border rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-app-border rounded w-3/4"></div>
                <div className="h-3 bg-app-border rounded w-1/2"></div>
              </div>
              <div className="w-6 h-6 bg-app-border rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-app-muted font-sans">All systems running smoothly</p>
        <p className="text-sm text-app-muted font-sans mt-1">No alerts at this time</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => {
        const style = getAlertStyle(alert.priority);
        
        return (
          <div
            key={alert.id}
            onClick={() => handleAlertClick(alert)}
            className={`
              ${style.bgColor} ${style.borderColor} border rounded-pro p-4 transition-all duration-200
              ${alert.actionUrl ? 'cursor-pointer hover:shadow-sm' : ''}
            `}
          >
            <div className="flex items-start space-x-3">
              {/* Alert Icon */}
              <div className="flex-shrink-0">
                {style.icon}
              </div>

              {/* Alert Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-sm font-sans font-medium ${style.textColor}`}>
                    {alert.title}
                  </h3>
                  {alert.count > 0 && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-mono font-medium text-white ${style.badgeColor}`}>
                      {alert.count}
                    </span>
                  )}
                </div>
                <p className={`text-sm ${style.textColor} opacity-90`}>
                  {alert.message}
                </p>
              </div>

              {/* Navigation Arrow (if clickable) */}
              {alert.actionUrl && (
                <div className="flex-shrink-0">
                  <svg className={`w-4 h-4 ${style.textColor} opacity-60`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* View All Alerts Link */}
      <div className="pt-4 border-t border-app-border">
        <button
          onClick={() => navigate('/admin/alerts')}
          className="w-full text-center text-sm font-sans font-medium text-app-accent hover:text-app-main transition-colors duration-200"
        >
          View All Alerts
        </button>
      </div>
    </div>
  );
};

export default SystemAlerts;
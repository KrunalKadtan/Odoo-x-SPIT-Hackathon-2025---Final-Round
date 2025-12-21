import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import Badge from './Badge';
import LoadingSpinner from './LoadingSpinner';
import Modal from './Modal';

/**
 * SecurityMonitor - Component for monitoring security events and alerts
 * Displays security incidents, suspicious activities, and system alerts
 */
const SecurityMonitor = () => {
  const [securityEvents, setSecurityEvents] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [filters, setFilters] = useState({
    severity: 'all',
    event_type: 'all',
    time_range: 'last_24_hours'
  });
  const { showError, showWarning } = useNotification();

  // Fetch security events and alerts
  const fetchSecurityData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [eventsData, alertsData] = await Promise.all([
        adminAPI.getSecurityEvents(filters),
        adminAPI.getSecurityAlerts()
      ]);
      
      setSecurityEvents(eventsData.events || []);
      setSecurityAlerts(alertsData.alerts || []);
    } catch (err) {
      console.error('Failed to fetch security data:', err);
      setError('Failed to load security data');
      showError('Failed to load security monitoring data');
    } finally {
      setLoading(false);
    }
  }, [filters, showError]);

  // Acknowledge security alert
  const acknowledgeAlert = useCallback(async (alertId) => {
    try {
      await adminAPI.acknowledgeSecurityAlert(alertId);
      setSecurityAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, acknowledged: true, acknowledged_at: new Date().toISOString() }
            : alert
        )
      );
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
      showError('Failed to acknowledge security alert');
    }
  }, [showError]);

  // Dismiss security alert
  const dismissAlert = useCallback(async (alertId) => {
    try {
      await adminAPI.dismissSecurityAlert(alertId);
      setSecurityAlerts(prev => 
        prev.filter(alert => alert.id !== alertId)
      );
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
      showError('Failed to dismiss security alert');
    }
  }, [showError]);

  // Get severity badge
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return { variant: 'error', text: 'Critical', color: 'text-red-600' };
      case 'high':
        return { variant: 'warning', text: 'High', color: 'text-orange-600' };
      case 'medium':
        return { variant: 'warning', text: 'Medium', color: 'text-yellow-600' };
      case 'low':
        return { variant: 'info', text: 'Low', color: 'text-blue-600' };
      default:
        return { variant: 'secondary', text: severity, color: 'text-gray-600' };
    }
  };

  // Get event type icon
  const getEventTypeIcon = (eventType) => {
    const iconClass = "w-5 h-5";
    
    switch (eventType) {
      case 'failed_login':
        return (
          <svg className={`${iconClass} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'suspicious_activity':
        return (
          <svg className={`${iconClass} text-orange-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'rate_limit_exceeded':
        return (
          <svg className={`${iconClass} text-yellow-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'unauthorized_access':
        return (
          <svg className={`${iconClass} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
        );
      case 'data_breach_attempt':
        return (
          <svg className={`${iconClass} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      default:
        return (
          <svg className={`${iconClass} text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now - date) / (1000 * 60);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Load security data on mount and when filters change
  useEffect(() => {
    fetchSecurityData();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchSecurityData, 60000); // 1 minute
    
    return () => clearInterval(interval);
  }, [fetchSecurityData]);

  // Show warning for critical alerts
  useEffect(() => {
    const criticalAlerts = securityAlerts.filter(
      alert => alert.severity === 'critical' && !alert.acknowledged
    );
    
    if (criticalAlerts.length > 0) {
      showWarning(
        `${criticalAlerts.length} critical security alert${criticalAlerts.length > 1 ? 's' : ''} require attention`,
        'Security Alert'
      );
    }
  }, [securityAlerts, showWarning]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-semibold text-app-main">
          Security Monitor
        </h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-app-muted">
            Last updated: {formatTimestamp(new Date())}
          </div>
          <button
            onClick={fetchSecurityData}
            disabled={loading}
            className="px-3 py-1 text-sm font-sans font-medium text-app-accent hover:bg-app-secondary rounded-pro transition-colors duration-200 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Security Alerts */}
      {securityAlerts.length > 0 && (
        <div className="bg-app-surface rounded-pro border border-app-border">
          <div className="p-4 border-b border-app-border">
            <h3 className="text-lg font-display font-semibold text-app-main">
              Active Security Alerts
            </h3>
          </div>
          <div className="divide-y divide-app-border">
            {securityAlerts.map((alert) => {
              const severityBadge = getSeverityBadge(alert.severity);
              return (
                <div key={alert.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getEventTypeIcon(alert.event_type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-sans font-semibold text-app-main">
                            {alert.title}
                          </h4>
                          <Badge variant={severityBadge.variant} size="sm">
                            {severityBadge.text}
                          </Badge>
                        </div>
                        <p className="text-sm text-app-muted mb-2">
                          {alert.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-app-muted">
                          <span>{formatTimestamp(alert.created_at)}</span>
                          {alert.ip_address && (
                            <span>IP: {alert.ip_address}</span>
                          )}
                          {alert.user_agent && (
                            <span>User Agent: {alert.user_agent.substring(0, 50)}...</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="px-3 py-1 text-xs font-sans font-medium text-app-accent hover:bg-app-secondary rounded-pro transition-colors duration-200"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="px-3 py-1 text-xs font-sans font-medium text-app-error hover:bg-red-50 rounded-pro transition-colors duration-200"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-app-surface rounded-pro p-4 border border-app-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-sans font-medium text-app-main mb-2">
              Severity
            </label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="w-full px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-app-main mb-2">
              Event Type
            </label>
            <select
              value={filters.event_type}
              onChange={(e) => setFilters(prev => ({ ...prev, event_type: e.target.value }))}
              className="w-full px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent"
            >
              <option value="all">All Types</option>
              <option value="failed_login">Failed Login</option>
              <option value="suspicious_activity">Suspicious Activity</option>
              <option value="rate_limit_exceeded">Rate Limit Exceeded</option>
              <option value="unauthorized_access">Unauthorized Access</option>
              <option value="data_breach_attempt">Data Breach Attempt</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-app-main mb-2">
              Time Range
            </label>
            <select
              value={filters.time_range}
              onChange={(e) => setFilters(prev => ({ ...prev, time_range: e.target.value }))}
              className="w-full px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent"
            >
              <option value="last_hour">Last Hour</option>
              <option value="last_24_hours">Last 24 Hours</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security Events */}
      <div className="bg-app-surface rounded-pro border border-app-border">
        <div className="p-4 border-b border-app-border">
          <h3 className="text-lg font-display font-semibold text-app-main">
            Security Events
          </h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-app-error text-sm mb-4">{error}</p>
            <button
              onClick={fetchSecurityData}
              className="px-4 py-2 bg-app-accent text-white rounded-pro hover:bg-app-accent-dark transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        ) : securityEvents.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-app-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-app-muted text-sm">
              No security events found for the selected filters
            </p>
          </div>
        ) : (
          <div className="divide-y divide-app-border max-h-96 overflow-y-auto">
            {securityEvents.map((event) => {
              const severityBadge = getSeverityBadge(event.severity);
              return (
                <div
                  key={event.id}
                  className="p-4 hover:bg-app-secondary transition-colors duration-200 cursor-pointer"
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowEventModal(true);
                  }}
                >
                  <div className="flex items-start space-x-3">
                    {getEventTypeIcon(event.event_type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-sans font-semibold text-app-main">
                          {event.title}
                        </h4>
                        <Badge variant={severityBadge.variant} size="sm">
                          {severityBadge.text}
                        </Badge>
                      </div>
                      <p className="text-sm text-app-muted mb-2">
                        {event.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-app-muted">
                        <span>{formatTimestamp(event.timestamp)}</span>
                        {event.ip_address && (
                          <span>IP: {event.ip_address}</span>
                        )}
                        {event.user_email && (
                          <span>User: {event.user_email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title="Security Event Details"
        size="large"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-sans font-medium text-app-main mb-1">
                  Event Type
                </label>
                <div className="flex items-center space-x-2">
                  {getEventTypeIcon(selectedEvent.event_type)}
                  <span className="text-sm text-app-muted">
                    {selectedEvent.event_type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-sans font-medium text-app-main mb-1">
                  Severity
                </label>
                <Badge variant={getSeverityBadge(selectedEvent.severity).variant} size="sm">
                  {getSeverityBadge(selectedEvent.severity).text}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-sans font-medium text-app-main mb-1">
                  Timestamp
                </label>
                <p className="text-sm text-app-muted">
                  {new Date(selectedEvent.timestamp).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-sans font-medium text-app-main mb-1">
                  IP Address
                </label>
                <p className="text-sm font-mono text-app-muted">
                  {selectedEvent.ip_address || 'N/A'}
                </p>
              </div>
              {selectedEvent.user_email && (
                <div>
                  <label className="block text-sm font-sans font-medium text-app-main mb-1">
                    User Email
                  </label>
                  <p className="text-sm text-app-muted">
                    {selectedEvent.user_email}
                  </p>
                </div>
              )}
              {selectedEvent.resource_type && (
                <div>
                  <label className="block text-sm font-sans font-medium text-app-main mb-1">
                    Resource
                  </label>
                  <p className="text-sm text-app-muted">
                    {selectedEvent.resource_type}
                    {selectedEvent.resource_id && ` (ID: ${selectedEvent.resource_id})`}
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-sans font-medium text-app-main mb-1">
                Description
              </label>
              <p className="text-sm text-app-muted">
                {selectedEvent.description}
              </p>
            </div>

            {selectedEvent.user_agent && (
              <div>
                <label className="block text-sm font-sans font-medium text-app-main mb-1">
                  User Agent
                </label>
                <p className="text-sm text-app-muted break-all">
                  {selectedEvent.user_agent}
                </p>
              </div>
            )}

            {selectedEvent.details && (
              <div>
                <label className="block text-sm font-sans font-medium text-app-main mb-1">
                  Additional Details
                </label>
                <pre className="text-xs bg-app-secondary p-3 rounded-pro overflow-auto max-h-40">
                  {JSON.stringify(selectedEvent.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SecurityMonitor;
import { useCallback, useEffect, useState } from 'react';
import { adminAPI } from '../utils/api';
import { securityLogger, threatDetector, rateLimiter, SECURITY_EVENT_TYPES, SECURITY_SEVERITY } from '../utils/securityUtils';
import { useNotification } from '../context/NotificationContext';

/**
 * useSecurityMonitoring - Hook for integrating security monitoring into admin functions
 * Provides security-aware versions of admin API functions with automatic logging and threat detection
 */
export const useSecurityMonitoring = () => {
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const { showWarning, showError } = useNotification();

  // Fetch active security alerts
  const fetchSecurityAlerts = useCallback(async () => {
    try {
      const data = await adminAPI.getSecurityAlerts({ status: 'active' });
      setSecurityAlerts(data.alerts || []);
      
      // Show notifications for critical alerts
      const criticalAlerts = data.alerts?.filter(
        alert => alert.severity === 'critical' && !alert.acknowledged
      ) || [];
      
      if (criticalAlerts.length > 0) {
        showWarning(
          `${criticalAlerts.length} critical security alert${criticalAlerts.length > 1 ? 's' : ''} require attention`,
          'Security Alert'
        );
      }
    } catch (error) {
      console.error('Failed to fetch security alerts:', error);
    }
  }, [showWarning]);

  // Security-aware wrapper for admin functions
  const withSecurityMonitoring = useCallback((fn, actionType, resourceType) => {
    return async (...args) => {
      if (!isMonitoring) {
        return fn(...args);
      }

      const adminUser = JSON.parse(localStorage.getItem('user_data') || '{}');
      const adminEmail = adminUser.email || 'unknown';
      const ipAddress = 'unknown'; // In real app, get from server
      
      try {
        // Pre-action security checks
        const rateLimitKey = `admin_${adminEmail}_${actionType}`;
        
        // Check rate limiting
        if (rateLimiter.isRateLimited(rateLimitKey, 'admin_action')) {
          const error = new Error('Rate limit exceeded. Please wait before performing more actions.');
          
          await securityLogger.logSecurityEvent(
            SECURITY_EVENT_TYPES.RATE_LIMIT_EXCEEDED,
            SECURITY_SEVERITY.HIGH,
            `Admin rate limit exceeded: ${adminEmail} attempted ${actionType} on ${resourceType}`,
            {
              admin_email: adminEmail,
              action: actionType,
              resource_type: resourceType,
              rate_limit_key: rateLimitKey
            }
          );
          
          showError('Rate limit exceeded. Please wait before performing more actions.');
          throw error;
        }

        // Record the attempt
        rateLimiter.recordAttempt(rateLimitKey, 'admin_action');

        // Detect suspicious activity
        const isSuspicious = threatDetector.detectSuspiciousAdminActivity(
          adminEmail,
          actionType,
          resourceType,
          { arguments: args }
        );

        if (isSuspicious) {
          showWarning('Unusual activity detected. Action has been logged for review.');
        }

        // Execute the original function
        const result = await fn(...args);

        // Log successful action
        await securityLogger.logSecurityEvent(
          SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
          SECURITY_SEVERITY.LOW,
          `Admin action completed: ${actionType} on ${resourceType}`,
          {
            admin_email: adminEmail,
            action: actionType,
            resource_type: resourceType,
            success: true,
            result_summary: typeof result === 'object' ? Object.keys(result).join(', ') : 'success'
          }
        );

        return result;
      } catch (error) {
        // Log failed action
        await securityLogger.logSecurityEvent(
          SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
          error.message.includes('Rate limit') ? SECURITY_SEVERITY.HIGH : SECURITY_SEVERITY.MEDIUM,
          `Admin action failed: ${actionType} on ${resourceType} - ${error.message}`,
          {
            admin_email: adminEmail,
            action: actionType,
            resource_type: resourceType,
            success: false,
            error: error.message
          }
        );

        throw error;
      }
    };
  }, [isMonitoring, showError, showWarning]);

  // Security-aware admin API functions
  const secureAdminAPI = {
    // User management
    blockUser: withSecurityMonitoring(adminAPI.blockUser, 'block', 'user'),
    unblockUser: withSecurityMonitoring(adminAPI.unblockUser, 'unblock', 'user'),
    
    // Vendor management
    approveVendor: withSecurityMonitoring(adminAPI.approveVendor, 'approve', 'vendor'),
    rejectVendor: withSecurityMonitoring(adminAPI.rejectVendor, 'reject', 'vendor'),
    suspendVendor: withSecurityMonitoring(adminAPI.suspendVendor, 'suspend', 'vendor'),
    reactivateVendor: withSecurityMonitoring(adminAPI.reactivateVendor, 'reactivate', 'vendor'),
    
    // System settings
    updateSystemSettings: withSecurityMonitoring(
      (settings) => adminAPI.updateSystemSettings?.(settings) || Promise.resolve(settings),
      'update',
      'system_settings'
    ),
    
    // Bulk operations
    bulkUserAction: withSecurityMonitoring(
      (userIds, action) => adminAPI.bulkUserAction?.(userIds, action) || Promise.resolve({ userIds, action }),
      'bulk_action',
      'user'
    ),
    
    bulkVendorAction: withSecurityMonitoring(
      (vendorIds, action) => adminAPI.bulkVendorAction?.(vendorIds, action) || Promise.resolve({ vendorIds, action }),
      'bulk_action',
      'vendor'
    )
  };

  // Log admin login
  const logAdminLogin = useCallback(async (adminEmail, success = true, error = null) => {
    const eventType = success ? SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY : SECURITY_EVENT_TYPES.FAILED_LOGIN;
    const severity = success ? SECURITY_SEVERITY.LOW : SECURITY_SEVERITY.MEDIUM;
    const description = success 
      ? `Admin login successful: ${adminEmail}`
      : `Admin login failed: ${adminEmail} - ${error}`;

    await securityLogger.logSecurityEvent(eventType, severity, description, {
      admin_email: adminEmail,
      success,
      error,
      login_attempt: true
    });

    if (!success) {
      // Check for multiple failed attempts
      const rateLimitKey = `login_${adminEmail}`;
      rateLimiter.recordAttempt(rateLimitKey, 'admin_login');
      
      if (rateLimiter.isRateLimited(rateLimitKey, 'admin_login')) {
        await securityLogger.logSecurityEvent(
          SECURITY_EVENT_TYPES.MULTIPLE_FAILED_ATTEMPTS,
          SECURITY_SEVERITY.HIGH,
          `Multiple failed login attempts for admin: ${adminEmail}`,
          {
            admin_email: adminEmail,
            attempts: rateLimiter.getRemainingAttempts(rateLimitKey, 'admin_login')
          }
        );
      }
    }
  }, []);

  // Log admin logout
  const logAdminLogout = useCallback(async (adminEmail) => {
    await securityLogger.logSecurityEvent(
      SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
      SECURITY_SEVERITY.LOW,
      `Admin logout: ${adminEmail}`,
      {
        admin_email: adminEmail,
        logout: true
      }
    );
  }, []);

  // Check if action should be blocked
  const shouldBlockAction = useCallback((actionType, resourceType) => {
    const adminUser = JSON.parse(localStorage.getItem('user_data') || '{}');
    const adminEmail = adminUser.email || 'unknown';
    const rateLimitKey = `admin_${adminEmail}_${actionType}`;
    
    return rateLimiter.isRateLimited(rateLimitKey, 'admin_action');
  }, []);

  // Get remaining actions for rate limiting
  const getRemainingActions = useCallback((actionType) => {
    const adminUser = JSON.parse(localStorage.getItem('user_data') || '{}');
    const adminEmail = adminUser.email || 'unknown';
    const rateLimitKey = `admin_${adminEmail}_${actionType}`;
    
    return rateLimiter.getRemainingAttempts(rateLimitKey, 'admin_action');
  }, []);

  // Toggle security monitoring
  const toggleMonitoring = useCallback((enabled) => {
    setIsMonitoring(enabled);
  }, []);

  // Initialize security monitoring
  useEffect(() => {
    if (isMonitoring) {
      fetchSecurityAlerts();
      
      // Set up periodic alert checking
      const interval = setInterval(fetchSecurityAlerts, 60000); // 1 minute
      
      return () => clearInterval(interval);
    }
  }, [isMonitoring, fetchSecurityAlerts]);

  return {
    // Security-aware API functions
    secureAdminAPI,
    
    // Security monitoring functions
    logAdminLogin,
    logAdminLogout,
    shouldBlockAction,
    getRemainingActions,
    
    // Security state
    securityAlerts,
    isMonitoring,
    toggleMonitoring,
    
    // Utility functions
    withSecurityMonitoring,
    fetchSecurityAlerts
  };
};

export default useSecurityMonitoring;
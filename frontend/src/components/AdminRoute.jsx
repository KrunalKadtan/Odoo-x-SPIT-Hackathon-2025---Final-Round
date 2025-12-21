import React from 'react';
import { Navigate } from 'react-router-dom';
import { adminUtils } from '../utils/adminUtils';
import { securityValidator } from '../services/securityValidator';
import { SECURITY_EVENT_TYPES, SECURITY_SEVERITY } from '../utils/securityUtils';
import { tokenUtils } from '../utils/api';

/**
 * AdminRoute component for protecting admin-only routes
 * Ensures only authenticated users with 'internal' role can access admin pages
 * Enhanced with comprehensive security logging and return URL capture
 */
const AdminRoute = ({ children }) => {
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;
  const fullUrl = currentPath + currentSearch;
  
  // Get user data for enhanced logging
  const userData = tokenUtils.getUserData();
  const isAuthenticated = tokenUtils.isAuthenticated();
  const isAdmin = adminUtils.isAdmin();
  const isAuthenticatedAdmin = adminUtils.isAuthenticatedAdmin();

  // Check if user is authenticated and has admin role
  if (!isAuthenticatedAdmin) {
    // Capture return URL for post-login redirect
    const returnUrl = encodeURIComponent(fullUrl);
    
    // Enhanced error logging for unauthorized access attempts
    const accessAttemptDetails = {
      timestamp: new Date().toISOString(),
      attempted_path: currentPath,
      attempted_url: fullUrl,
      user_authenticated: isAuthenticated,
      user_has_admin_role: isAdmin,
      user_id: userData?.id || 'anonymous',
      user_email: userData?.email || 'unknown',
      user_role: userData?.role || 'none',
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      ip_address: 'client-side', // Would be populated server-side in real implementation
      session_id: tokenUtils.getToken()?.substring(0, 10) + '...' || 'none'
    };

    // Log detailed warning for monitoring
    console.warn('Unauthorized admin access attempt:', accessAttemptDetails);

    // Create security event for admin access violation
    let securityEventType;
    let securitySeverity;
    let securityDescription;

    if (!isAuthenticated) {
      // Unauthenticated user trying to access admin route
      securityEventType = SECURITY_EVENT_TYPES.UNAUTHORIZED_ACCESS;
      securitySeverity = SECURITY_SEVERITY.MEDIUM;
      securityDescription = `Unauthenticated user attempted to access admin route: ${currentPath}`;
    } else if (!isAdmin) {
      // Authenticated but non-admin user trying to access admin route
      securityEventType = SECURITY_EVENT_TYPES.PRIVILEGE_ESCALATION;
      securitySeverity = SECURITY_SEVERITY.HIGH;
      securityDescription = `Non-admin user attempted privilege escalation to access admin route: ${currentPath}`;
    } else {
      // Edge case: authenticated admin but failed isAuthenticatedAdmin check
      securityEventType = SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY;
      securitySeverity = SECURITY_SEVERITY.MEDIUM;
      securityDescription = `Admin user failed authentication check for admin route: ${currentPath}`;
    }

    // Log security event with comprehensive details
    securityValidator.logSecurityEvent(
      securityEventType,
      securitySeverity,
      securityDescription,
      {
        ...accessAttemptDetails,
        return_url: returnUrl,
        access_denied_reason: !isAuthenticated ? 'not_authenticated' : 'insufficient_privileges',
        security_action: 'redirect_to_signin',
        admin_route_accessed: true,
        potential_threat_level: securitySeverity
      }
    );

    // Track suspicious activity if this is a repeated attempt
    if (userData?.id) {
      const isSuspicious = securityValidator.detectSuspiciousActivity(
        userData.id.toString(), 
        fullUrl
      );
      
      if (isSuspicious) {
        // Additional logging for suspicious patterns
        securityValidator.logSecurityEvent(
          SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
          SECURITY_SEVERITY.HIGH,
          `Repeated unauthorized admin access attempts detected`,
          {
            user_id: userData.id,
            user_email: userData.email,
            attempted_url: fullUrl,
            pattern_detected: 'repeated_admin_access_attempts'
          }
        );
      }
    }

    // Enhanced admin action logging for the access denial
    adminUtils.logAdminAction('admin_access_denied', {
      path: currentPath,
      url: fullUrl,
      user_id: userData?.id,
      user_email: userData?.email,
      user_role: userData?.role,
      authenticated: isAuthenticated,
      has_admin_role: isAdmin,
      denial_reason: !isAuthenticated ? 'not_authenticated' : 'insufficient_privileges',
      return_url: returnUrl,
      security_event_logged: true
    });

    // Redirect to signin with return URL
    return <Navigate to={`/signin?returnUrl=${returnUrl}`} replace />;
  }

  // Enhanced logging for successful admin access
  const successDetails = {
    path: currentPath,
    url: fullUrl,
    user_id: userData?.id,
    user_email: userData?.email,
    user_role: userData?.role,
    timestamp: new Date().toISOString(),
    access_granted: true
  };

  // Log successful admin access with enhanced details
  adminUtils.logAdminAction('admin_page_access', successDetails);

  // Log security event for successful admin access (for audit trail)
  securityValidator.logSecurityEvent(
    SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY, // Using this as a general audit event
    SECURITY_SEVERITY.LOW,
    `Admin user successfully accessed admin route: ${currentPath}`,
    {
      ...successDetails,
      access_type: 'admin_route_access',
      security_check_passed: true,
      admin_privileges_verified: true
    }
  );

  return children;
};

export default AdminRoute;
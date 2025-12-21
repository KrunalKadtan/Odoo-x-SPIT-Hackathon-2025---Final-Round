import { securityLogger, threatDetector, SECURITY_EVENT_TYPES, SECURITY_SEVERITY } from '../utils/securityUtils';
import { roleDetectionService } from './roleDetectionService';

/**
 * Security Validator Service
 * Provides comprehensive security validation for the role-based login redirect system
 * Handles URL sanitization, suspicious activity detection, and admin access validation
 */

// Malicious URL patterns to detect and block
const MALICIOUS_URL_PATTERNS = [
  // XSS patterns
  /javascript:/i,
  /data:/i,
  /vbscript:/i,
  /onload=/i,
  /onerror=/i,
  /onclick=/i,
  /onmouseover=/i,
  /<script/i,
  /<\/script>/i,
  /eval\(/i,
  /alert\(/i,
  /confirm\(/i,
  /prompt\(/i,
  
  // SQL injection patterns
  /union\s+select/i,
  /drop\s+table/i,
  /insert\s+into/i,
  /delete\s+from/i,
  /update\s+set/i,
  /exec\s*\(/i,
  
  // Path traversal patterns
  /\.\.\//,
  /\.\.\\\//,
  /\/\.\.\//,
  /\\\.\.\\\//,
  
  // Protocol confusion
  /file:/i,
  /ftp:/i,
  /ldap:/i,
  /gopher:/i
];

// Suspicious parameter patterns
const SUSPICIOUS_PARAM_PATTERNS = [
  /[<>'"&]/,
  /javascript:/i,
  /data:/i,
  /vbscript:/i,
  /%3c/i, // URL encoded <
  /%3e/i, // URL encoded >
  /%22/i, // URL encoded "
  /%27/i, // URL encoded '
  /%26/i  // URL encoded &
];

// Admin route patterns that require special validation
const ADMIN_ROUTE_PATTERNS = [
  /^\/admin/,
  /^\/dashboard\/admin/,
  /^\/management/,
  /^\/settings\/admin/,
  /^\/reports\/admin/,
  /^\/users\/manage/,
  /^\/vendors\/manage/,
  /^\/system/,
  /^\/security/,
  /^\/audit/
];

// Allowed domains for redirect validation
const ALLOWED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  window.location.hostname
];

// Suspicious activity tracking
const suspiciousActivityTracker = new Map();
const SUSPICIOUS_ACTIVITY_THRESHOLD = 5;
const SUSPICIOUS_ACTIVITY_WINDOW = 15 * 60 * 1000; // 15 minutes

/**
 * Security Validator Service
 */
export const securityValidator = {
  /**
   * Validate domain to prevent open redirects
   * @param {string} url - URL to validate
   * @returns {boolean} True if domain is allowed
   */
  validateDomain: (url) => {
    try {
      if (!url || typeof url !== 'string') {
        return false;
      }

      // Relative URLs are always allowed
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return true;
      }

      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // Check against allowed domains
      const isAllowed = ALLOWED_DOMAINS.some(domain => {
        const domainLower = domain.toLowerCase();
        return hostname === domainLower || 
               hostname.endsWith('.' + domainLower);
      });

      if (!isAllowed) {
        securityValidator.logSecurityEvent(
          SECURITY_EVENT_TYPES.UNAUTHORIZED_ACCESS,
          SECURITY_SEVERITY.MEDIUM,
          `Blocked redirect to unauthorized domain: ${hostname}`,
          { 
            attempted_url: url, 
            hostname,
            allowed_domains: ALLOWED_DOMAINS
          }
        );
      }

      return isAllowed;

    } catch (error) {
      console.error('Domain validation error:', error);
      securityValidator.logSecurityEvent(
        SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
        SECURITY_SEVERITY.LOW,
        `Domain validation error: ${error.message}`,
        { attempted_url: url, error: error.message }
      );
      return false;
    }
  },

  /**
   * Sanitize URL parameters to prevent XSS attacks
   * @param {string} url - URL with parameters to sanitize
   * @returns {string} URL with sanitized parameters
   */
  sanitizeUrlParameters: (url) => {
    try {
      if (!url || typeof url !== 'string') {
        return '';
      }

      const [pathname, search] = url.split('?');
      
      if (!search) {
        return pathname;
      }

      const params = new URLSearchParams(search);
      const sanitizedParams = new URLSearchParams();

      for (const [key, value] of params) {
        // Check for suspicious patterns in parameters
        if (securityValidator.containsSuspiciousPatterns(key) || 
            securityValidator.containsSuspiciousPatterns(value)) {
          
          securityValidator.logSecurityEvent(
            SECURITY_EVENT_TYPES.DATA_BREACH_ATTEMPT,
            SECURITY_SEVERITY.HIGH,
            `Suspicious URL parameter detected and removed`,
            { 
              original_url: url,
              suspicious_key: key,
              suspicious_value: value
            }
          );
          continue; // Skip this parameter
        }

        // Sanitize the parameter key and value
        const sanitizedKey = securityValidator.sanitizeString(key);
        const sanitizedValue = securityValidator.sanitizeString(value);
        
        // Only add if both key and value are valid after sanitization
        if (sanitizedKey && sanitizedValue) {
          sanitizedParams.set(sanitizedKey, sanitizedValue);
        }
      }

      const sanitizedSearch = sanitizedParams.toString();
      return sanitizedSearch ? `${pathname}?${sanitizedSearch}` : pathname;

    } catch (error) {
      console.error('URL parameter sanitization error:', error);
      securityValidator.logSecurityEvent(
        SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
        SECURITY_SEVERITY.MEDIUM,
        `URL parameter sanitization error: ${error.message}`,
        { original_url: url, error: error.message }
      );
      // Return just the pathname if parameter sanitization fails
      return url.split('?')[0];
    }
  },

  /**
   * Check if a string contains suspicious patterns
   * @param {string} str - String to check
   * @returns {boolean} True if suspicious patterns are found
   */
  containsSuspiciousPatterns: (str) => {
    if (!str || typeof str !== 'string') {
      return false;
    }

    return SUSPICIOUS_PARAM_PATTERNS.some(pattern => pattern.test(str));
  },

  /**
   * Sanitize a string by removing dangerous characters
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeString: (str) => {
    if (!str || typeof str !== 'string') {
      return '';
    }

    // Remove potentially dangerous characters
    return str
      .replace(/[<>'"&]/g, '') // Remove HTML/JS dangerous chars
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .trim();
  },

  /**
   * Check admin access permissions for a given URL
   * @param {string} url - URL to check
   * @param {string} userRole - User's role
   * @returns {boolean} True if user has access to the URL
   */
  checkAdminAccess: (url, userRole) => {
    try {
      if (!url || typeof url !== 'string') {
        return false;
      }

      // Extract pathname from URL
      let pathname = url;
      try {
        if (url.startsWith('http')) {
          pathname = new URL(url).pathname;
        } else {
          pathname = url.split('?')[0]; // Remove query parameters
        }
      } catch (error) {
        console.warn('Error parsing URL for admin access check:', error);
        return false;
      }

      // Check if URL is an admin route
      const isAdminRoute = ADMIN_ROUTE_PATTERNS.some(pattern => pattern.test(pathname));
      
      if (isAdminRoute) {
        // Only admin users can access admin routes
        const hasAdminAccess = roleDetectionService.isAdminRole(userRole);
        
        if (!hasAdminAccess) {
          securityValidator.logSecurityEvent(
            SECURITY_EVENT_TYPES.UNAUTHORIZED_ACCESS,
            SECURITY_SEVERITY.HIGH,
            `Non-admin user attempted to access admin route: ${pathname}`,
            { 
              user_role: userRole,
              attempted_url: url,
              pathname,
              is_admin_route: true
            }
          );
          
          // Track suspicious activity
          securityValidator.trackSuspiciousActivity(userRole, 'unauthorized_admin_access');
        }
        
        return hasAdminAccess;
      }

      // Non-admin routes are accessible to all authenticated users
      return true;

    } catch (error) {
      console.error('Admin access check error:', error);
      securityValidator.logSecurityEvent(
        SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
        SECURITY_SEVERITY.MEDIUM,
        `Admin access check error: ${error.message}`,
        { 
          user_role: userRole,
          attempted_url: url,
          error: error.message
        }
      );
      return false;
    }
  },

  /**
   * Log security events with enhanced context
   * @param {string} eventType - Type of security event
   * @param {string} severity - Severity level
   * @param {string} description - Event description
   * @param {Object} details - Additional event details
   */
  logSecurityEvent: (eventType, severity, description, details = {}) => {
    try {
      const enhancedDetails = {
        ...details,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer,
        screen_resolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform
      };

      // Use the existing security logger
      securityLogger.logSecurityEvent(eventType, severity, description, enhancedDetails);

      // Additional logging for critical events
      if (severity === SECURITY_SEVERITY.CRITICAL || severity === SECURITY_SEVERITY.HIGH) {
        console.warn(`SECURITY EVENT [${severity.toUpperCase()}]: ${description}`, enhancedDetails);
      }

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  },

  /**
   * Detect suspicious activity patterns
   * @param {string} userId - User identifier
   * @param {string} attemptedUrl - URL that was attempted
   * @returns {boolean} True if suspicious activity is detected
   */
  detectSuspiciousActivity: (userId, attemptedUrl) => {
    try {
      if (!userId || !attemptedUrl) {
        return false;
      }

      // Check for malicious URL patterns
      const containsMaliciousPattern = MALICIOUS_URL_PATTERNS.some(pattern => 
        pattern.test(attemptedUrl)
      );

      if (containsMaliciousPattern) {
        securityValidator.logSecurityEvent(
          SECURITY_EVENT_TYPES.DATA_BREACH_ATTEMPT,
          SECURITY_SEVERITY.CRITICAL,
          `Malicious URL pattern detected in redirect attempt`,
          { 
            user_id: userId,
            attempted_url: attemptedUrl,
            malicious_patterns: MALICIOUS_URL_PATTERNS.filter(pattern => 
              pattern.test(attemptedUrl)
            ).map(p => p.toString())
          }
        );
        
        securityValidator.trackSuspiciousActivity(userId, 'malicious_url_pattern');
        return true;
      }

      // Check for repeated suspicious attempts
      const suspiciousCount = securityValidator.getSuspiciousActivityCount(userId);
      if (suspiciousCount >= SUSPICIOUS_ACTIVITY_THRESHOLD) {
        securityValidator.logSecurityEvent(
          SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
          SECURITY_SEVERITY.HIGH,
          `User exceeded suspicious activity threshold`,
          { 
            user_id: userId,
            suspicious_count: suspiciousCount,
            threshold: SUSPICIOUS_ACTIVITY_THRESHOLD,
            attempted_url: attemptedUrl
          }
        );
        return true;
      }

      // Check for unusual redirect patterns
      if (securityValidator.isUnusualRedirectPattern(attemptedUrl)) {
        securityValidator.logSecurityEvent(
          SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
          SECURITY_SEVERITY.MEDIUM,
          `Unusual redirect pattern detected`,
          { 
            user_id: userId,
            attempted_url: attemptedUrl
          }
        );
        
        securityValidator.trackSuspiciousActivity(userId, 'unusual_redirect_pattern');
        return true;
      }

      return false;

    } catch (error) {
      console.error('Suspicious activity detection error:', error);
      securityValidator.logSecurityEvent(
        SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
        SECURITY_SEVERITY.LOW,
        `Suspicious activity detection error: ${error.message}`,
        { 
          user_id: userId,
          attempted_url: attemptedUrl,
          error: error.message
        }
      );
      return false;
    }
  },

  /**
   * Track suspicious activity for a user
   * @param {string} userId - User identifier
   * @param {string} activityType - Type of suspicious activity
   */
  trackSuspiciousActivity: (userId, activityType) => {
    try {
      if (!userId || !activityType) {
        return;
      }

      const now = Date.now();
      const key = `${userId}_${activityType}`;
      
      if (!suspiciousActivityTracker.has(key)) {
        suspiciousActivityTracker.set(key, []);
      }
      
      const activities = suspiciousActivityTracker.get(key);
      activities.push(now);
      
      // Clean up old activities outside the window
      const windowStart = now - SUSPICIOUS_ACTIVITY_WINDOW;
      const recentActivities = activities.filter(timestamp => timestamp > windowStart);
      suspiciousActivityTracker.set(key, recentActivities);

    } catch (error) {
      console.error('Error tracking suspicious activity:', error);
    }
  },

  /**
   * Get suspicious activity count for a user
   * @param {string} userId - User identifier
   * @returns {number} Count of suspicious activities
   */
  getSuspiciousActivityCount: (userId) => {
    try {
      if (!userId) {
        return 0;
      }

      const now = Date.now();
      const windowStart = now - SUSPICIOUS_ACTIVITY_WINDOW;
      let totalCount = 0;

      // Count all suspicious activities for this user across all types
      for (const [key, activities] of suspiciousActivityTracker.entries()) {
        if (key.startsWith(userId + '_')) {
          const recentActivities = activities.filter(timestamp => timestamp > windowStart);
          totalCount += recentActivities.length;
        }
      }

      return totalCount;

    } catch (error) {
      console.error('Error getting suspicious activity count:', error);
      return 0;
    }
  },

  /**
   * Check if a redirect pattern is unusual
   * @param {string} url - URL to check
   * @returns {boolean} True if pattern is unusual
   */
  isUnusualRedirectPattern: (url) => {
    try {
      if (!url || typeof url !== 'string') {
        return false;
      }

      // Check for unusual patterns
      const unusualPatterns = [
        // Multiple redirects in URL
        /redirect.*redirect/i,
        /return.*return/i,
        
        // Encoded redirects
        /%2F%2F/, // //
        /%3A%2F%2F/, // ://
        
        // Suspicious query parameters
        /[?&](redirect|return|url|goto|next)=.*[?&](redirect|return|url|goto|next)=/i,
        
        // Very long URLs (potential buffer overflow attempts)
        /.{500,}/,
        
        // Multiple protocol specifications
        /https?:\/\/.*https?:\/\//i
      ];

      return unusualPatterns.some(pattern => pattern.test(url));

    } catch (error) {
      console.error('Error checking unusual redirect pattern:', error);
      return false;
    }
  },

  /**
   * Validate and sanitize a complete URL
   * @param {string} url - URL to validate and sanitize
   * @returns {string|null} Sanitized URL or null if invalid
   */
  validateAndSanitizeUrl: (url) => {
    try {
      if (!url || typeof url !== 'string') {
        return null;
      }

      // Remove leading/trailing whitespace
      url = url.trim();

      if (!url) {
        return null;
      }

      // Check for malicious patterns first
      const containsMaliciousPattern = MALICIOUS_URL_PATTERNS.some(pattern => 
        pattern.test(url)
      );

      if (containsMaliciousPattern) {
        securityValidator.logSecurityEvent(
          SECURITY_EVENT_TYPES.DATA_BREACH_ATTEMPT,
          SECURITY_SEVERITY.HIGH,
          `Blocked malicious URL pattern`,
          { attempted_url: url }
        );
        return null;
      }

      // Validate domain
      if (!securityValidator.validateDomain(url)) {
        return null;
      }

      // Sanitize URL parameters
      const sanitizedUrl = securityValidator.sanitizeUrlParameters(url);

      // Final validation of sanitized URL
      if (!sanitizedUrl || sanitizedUrl.length === 0) {
        return null;
      }

      return sanitizedUrl;

    } catch (error) {
      console.error('URL validation and sanitization error:', error);
      securityValidator.logSecurityEvent(
        SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
        SECURITY_SEVERITY.MEDIUM,
        `URL validation and sanitization error: ${error.message}`,
        { attempted_url: url, error: error.message }
      );
      return null;
    }
  },

  /**
   * Clear suspicious activity tracking for a user
   * @param {string} userId - User identifier
   */
  clearSuspiciousActivity: (userId) => {
    try {
      if (!userId) {
        return;
      }

      const keysToDelete = [];
      for (const key of suspiciousActivityTracker.keys()) {
        if (key.startsWith(userId + '_')) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => suspiciousActivityTracker.delete(key));

    } catch (error) {
      console.error('Error clearing suspicious activity:', error);
    }
  },

  /**
   * Get security validation statistics
   * @returns {Object} Security validation statistics
   */
  getValidationStats: () => {
    try {
      const now = Date.now();
      const windowStart = now - SUSPICIOUS_ACTIVITY_WINDOW;
      
      let totalSuspiciousActivities = 0;
      let activeUsers = new Set();
      const activityTypes = {};

      for (const [key, activities] of suspiciousActivityTracker.entries()) {
        const [userId, activityType] = key.split('_');
        const recentActivities = activities.filter(timestamp => timestamp > windowStart);
        
        if (recentActivities.length > 0) {
          totalSuspiciousActivities += recentActivities.length;
          activeUsers.add(userId);
          activityTypes[activityType] = (activityTypes[activityType] || 0) + recentActivities.length;
        }
      }

      return {
        total_suspicious_activities: totalSuspiciousActivities,
        active_suspicious_users: activeUsers.size,
        activity_types: activityTypes,
        tracking_window_minutes: SUSPICIOUS_ACTIVITY_WINDOW / (60 * 1000),
        threshold: SUSPICIOUS_ACTIVITY_THRESHOLD,
        allowed_domains: ALLOWED_DOMAINS.length,
        admin_route_patterns: ADMIN_ROUTE_PATTERNS.length,
        malicious_patterns: MALICIOUS_URL_PATTERNS.length
      };

    } catch (error) {
      console.error('Error getting validation stats:', error);
      return {
        total_suspicious_activities: 0,
        active_suspicious_users: 0,
        activity_types: {},
        error: error.message
      };
    }
  },

  /**
   * Add a new allowed domain
   * @param {string} domain - Domain to add
   */
  addAllowedDomain: (domain) => {
    if (domain && typeof domain === 'string' && !ALLOWED_DOMAINS.includes(domain)) {
      ALLOWED_DOMAINS.push(domain.toLowerCase());
      securityValidator.logSecurityEvent(
        SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
        SECURITY_SEVERITY.LOW,
        `Added new allowed domain: ${domain}`,
        { domain, total_allowed_domains: ALLOWED_DOMAINS.length }
      );
    }
  },

  /**
   * Remove an allowed domain
   * @param {string} domain - Domain to remove
   */
  removeAllowedDomain: (domain) => {
    const index = ALLOWED_DOMAINS.indexOf(domain.toLowerCase());
    if (index > -1) {
      ALLOWED_DOMAINS.splice(index, 1);
      securityValidator.logSecurityEvent(
        SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
        SECURITY_SEVERITY.LOW,
        `Removed allowed domain: ${domain}`,
        { domain, total_allowed_domains: ALLOWED_DOMAINS.length }
      );
    }
  },

  /**
   * Get current allowed domains
   * @returns {Array<string>} Array of allowed domains
   */
  getAllowedDomains: () => {
    return [...ALLOWED_DOMAINS];
  },

  /**
   * Cleanup expired suspicious activity tracking
   */
  cleanupExpiredTracking: () => {
    try {
      const now = Date.now();
      const windowStart = now - SUSPICIOUS_ACTIVITY_WINDOW;
      let cleanedCount = 0;

      for (const [key, activities] of suspiciousActivityTracker.entries()) {
        const recentActivities = activities.filter(timestamp => timestamp > windowStart);
        
        if (recentActivities.length === 0) {
          suspiciousActivityTracker.delete(key);
          cleanedCount++;
        } else if (recentActivities.length < activities.length) {
          suspiciousActivityTracker.set(key, recentActivities);
        }
      }

      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} expired suspicious activity entries`);
      }

      return cleanedCount;

    } catch (error) {
      console.error('Error cleaning up expired tracking:', error);
      return 0;
    }
  }
};

// Setup automatic cleanup of expired tracking (runs every 5 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    securityValidator.cleanupExpiredTracking();
  }, 5 * 60 * 1000);
}

export default securityValidator;
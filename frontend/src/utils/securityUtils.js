import { adminAPI } from './api';

/**
 * Security Utilities
 * Provides functions for security monitoring, rate limiting, and threat detection
 */

// Security event types
export const SECURITY_EVENT_TYPES = {
  FAILED_LOGIN: 'failed_login',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  DATA_BREACH_ATTEMPT: 'data_breach_attempt',
  PRIVILEGE_ESCALATION: 'privilege_escalation',
  UNUSUAL_ADMIN_ACTIVITY: 'unusual_admin_activity',
  MULTIPLE_FAILED_ATTEMPTS: 'multiple_failed_attempts',
  SUSPICIOUS_IP: 'suspicious_ip',
  UNUSUAL_USER_AGENT: 'unusual_user_agent'
};

// Security severity levels
export const SECURITY_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Rate limiting configuration
const RATE_LIMITS = {
  admin_login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  admin_action: { maxAttempts: 100, windowMs: 60 * 1000 }, // 100 actions per minute
  api_request: { maxAttempts: 1000, windowMs: 60 * 1000 }, // 1000 requests per minute
  password_reset: { maxAttempts: 3, windowMs: 60 * 60 * 1000 } // 3 attempts per hour
};

// In-memory rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map();

/**
 * Rate limiting implementation
 */
export const rateLimiter = {
  // Check if action is rate limited
  isRateLimited: (key, type = 'api_request') => {
    const limit = RATE_LIMITS[type];
    if (!limit) return false;

    const now = Date.now();
    const windowStart = now - limit.windowMs;
    
    // Get or create rate limit data for this key
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, []);
    }
    
    const attempts = rateLimitStore.get(key);
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(timestamp => timestamp > windowStart);
    rateLimitStore.set(key, validAttempts);
    
    // Check if limit exceeded
    return validAttempts.length >= limit.maxAttempts;
  },

  // Record an attempt
  recordAttempt: (key, type = 'api_request') => {
    const now = Date.now();
    
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, []);
    }
    
    const attempts = rateLimitStore.get(key);
    attempts.push(now);
    
    // Log rate limit exceeded event
    if (rateLimiter.isRateLimited(key, type)) {
      securityLogger.logSecurityEvent(
        SECURITY_EVENT_TYPES.RATE_LIMIT_EXCEEDED,
        SECURITY_SEVERITY.MEDIUM,
        `Rate limit exceeded for ${type}`,
        {
          key,
          type,
          attempts: attempts.length,
          limit: RATE_LIMITS[type]?.maxAttempts
        }
      );
    }
  },

  // Get remaining attempts
  getRemainingAttempts: (key, type = 'api_request') => {
    const limit = RATE_LIMITS[type];
    if (!limit) return Infinity;

    const now = Date.now();
    const windowStart = now - limit.windowMs;
    
    if (!rateLimitStore.has(key)) {
      return limit.maxAttempts;
    }
    
    const attempts = rateLimitStore.get(key);
    const validAttempts = attempts.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, limit.maxAttempts - validAttempts.length);
  },

  // Clear rate limit data for a key
  clearRateLimit: (key) => {
    rateLimitStore.delete(key);
  }
};

/**
 * Security event logging
 */
export const securityLogger = {
  // Log a security event
  logSecurityEvent: async (eventType, severity, description, details = {}) => {
    try {
      const eventData = {
        event_type: eventType,
        severity,
        title: securityLogger.generateEventTitle(eventType),
        description,
        details: {
          ...details,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          url: window.location.href,
          referrer: document.referrer
        }
      };

      await adminAPI.createSecurityEvent(eventData);
      
      // Create alert for high/critical events
      if (severity === SECURITY_SEVERITY.HIGH || severity === SECURITY_SEVERITY.CRITICAL) {
        await securityLogger.createSecurityAlert(eventData);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  },

  // Generate event title based on type
  generateEventTitle: (eventType) => {
    const titles = {
      [SECURITY_EVENT_TYPES.FAILED_LOGIN]: 'Failed Login Attempt',
      [SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY]: 'Suspicious Activity Detected',
      [SECURITY_EVENT_TYPES.RATE_LIMIT_EXCEEDED]: 'Rate Limit Exceeded',
      [SECURITY_EVENT_TYPES.UNAUTHORIZED_ACCESS]: 'Unauthorized Access Attempt',
      [SECURITY_EVENT_TYPES.DATA_BREACH_ATTEMPT]: 'Potential Data Breach Attempt',
      [SECURITY_EVENT_TYPES.PRIVILEGE_ESCALATION]: 'Privilege Escalation Attempt',
      [SECURITY_EVENT_TYPES.UNUSUAL_ADMIN_ACTIVITY]: 'Unusual Admin Activity',
      [SECURITY_EVENT_TYPES.MULTIPLE_FAILED_ATTEMPTS]: 'Multiple Failed Attempts',
      [SECURITY_EVENT_TYPES.SUSPICIOUS_IP]: 'Suspicious IP Address',
      [SECURITY_EVENT_TYPES.UNUSUAL_USER_AGENT]: 'Unusual User Agent'
    };
    
    return titles[eventType] || 'Security Event';
  },

  // Create security alert
  createSecurityAlert: async (eventData) => {
    try {
      const alertData = {
        event_type: eventData.event_type,
        severity: eventData.severity,
        title: eventData.title,
        description: eventData.description,
        details: eventData.details
      };

      await adminAPI.createSecurityAlert(alertData);
    } catch (error) {
      console.error('Failed to create security alert:', error);
    }
  }
};

/**
 * Threat detection utilities
 */
export const threatDetector = {
  // Detect suspicious login patterns
  detectSuspiciousLogin: (email, ipAddress, userAgent) => {
    const key = `login_${email}_${ipAddress}`;
    
    // Check for multiple failed attempts
    if (rateLimiter.isRateLimited(key, 'admin_login')) {
      securityLogger.logSecurityEvent(
        SECURITY_EVENT_TYPES.MULTIPLE_FAILED_ATTEMPTS,
        SECURITY_SEVERITY.HIGH,
        `Multiple failed login attempts for ${email} from ${ipAddress}`,
        { email, ip_address: ipAddress, user_agent: userAgent }
      );
      return true;
    }
    
    // Check for unusual user agent
    if (threatDetector.isUnusualUserAgent(userAgent)) {
      securityLogger.logSecurityEvent(
        SECURITY_EVENT_TYPES.UNUSUAL_USER_AGENT,
        SECURITY_SEVERITY.MEDIUM,
        `Unusual user agent detected for login attempt: ${email}`,
        { email, ip_address: ipAddress, user_agent: userAgent }
      );
    }
    
    return false;
  },

  // Detect unusual user agents
  isUnusualUserAgent: (userAgent) => {
    if (!userAgent) return true;
    
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /go-http-client/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  },

  // Detect suspicious admin activity
  detectSuspiciousAdminActivity: (adminEmail, action, resourceType, details = {}) => {
    const key = `admin_activity_${adminEmail}`;
    
    // Record the action
    rateLimiter.recordAttempt(key, 'admin_action');
    
    // Check for excessive admin actions
    if (rateLimiter.isRateLimited(key, 'admin_action')) {
      securityLogger.logSecurityEvent(
        SECURITY_EVENT_TYPES.UNUSUAL_ADMIN_ACTIVITY,
        SECURITY_SEVERITY.HIGH,
        `Excessive admin activity detected for ${adminEmail}`,
        { admin_email: adminEmail, action, resource_type: resourceType, ...details }
      );
      return true;
    }
    
    // Check for high-risk actions
    const highRiskActions = ['delete', 'suspend', 'reject', 'block'];
    if (highRiskActions.includes(action)) {
      securityLogger.logSecurityEvent(
        SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
        SECURITY_SEVERITY.MEDIUM,
        `High-risk admin action performed: ${action} on ${resourceType}`,
        { admin_email: adminEmail, action, resource_type: resourceType, ...details }
      );
    }
    
    return false;
  },

  // Detect potential data breach attempts
  detectDataBreachAttempt: (endpoint, params, userAgent, ipAddress) => {
    const suspiciousPatterns = [
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /<script/i,
      /javascript:/i,
      /eval\(/i,
      /exec\(/i
    ];
    
    const queryString = JSON.stringify(params);
    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(queryString) || pattern.test(endpoint)
    );
    
    if (isSuspicious) {
      securityLogger.logSecurityEvent(
        SECURITY_EVENT_TYPES.DATA_BREACH_ATTEMPT,
        SECURITY_SEVERITY.CRITICAL,
        `Potential data breach attempt detected on ${endpoint}`,
        {
          endpoint,
          params,
          user_agent: userAgent,
          ip_address: ipAddress,
          suspicious_patterns: suspiciousPatterns.filter(pattern => 
            pattern.test(queryString) || pattern.test(endpoint)
          ).map(p => p.toString())
        }
      );
      return true;
    }
    
    return false;
  }
};

/**
 * Security middleware for admin actions
 */
export const securityMiddleware = {
  // Wrap admin functions with security monitoring
  withSecurityMonitoring: (fn, actionType, resourceType) => {
    return async (...args) => {
      const adminUser = JSON.parse(localStorage.getItem('user_data') || '{}');
      const adminEmail = adminUser.email;
      const ipAddress = 'unknown'; // In real app, get from server
      
      try {
        // Check for suspicious activity before action
        const isSuspicious = threatDetector.detectSuspiciousAdminActivity(
          adminEmail,
          actionType,
          resourceType,
          { arguments: args }
        );
        
        if (isSuspicious) {
          throw new Error('Action blocked due to suspicious activity');
        }
        
        // Execute the original function
        const result = await fn(...args);
        
        // Log successful action
        securityLogger.logSecurityEvent(
          SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
          SECURITY_SEVERITY.LOW,
          `Admin action completed: ${actionType} on ${resourceType}`,
          {
            admin_email: adminEmail,
            action: actionType,
            resource_type: resourceType,
            success: true,
            arguments: args
          }
        );
        
        return result;
      } catch (error) {
        // Log failed action
        securityLogger.logSecurityEvent(
          SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
          SECURITY_SEVERITY.MEDIUM,
          `Admin action failed: ${actionType} on ${resourceType} - ${error.message}`,
          {
            admin_email: adminEmail,
            action: actionType,
            resource_type: resourceType,
            success: false,
            error: error.message,
            arguments: args
          }
        );
        
        throw error;
      }
    };
  },

  // Check if user should be blocked
  shouldBlockUser: (identifier, type = 'api_request') => {
    return rateLimiter.isRateLimited(identifier, type);
  },

  // Get security headers for requests
  getSecurityHeaders: () => {
    return {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Client-Version': '1.0.0',
      'X-Timestamp': Date.now().toString()
    };
  }
};

/**
 * Security configuration
 */
export const securityConfig = {
  // Enable/disable security features
  features: {
    rateLimiting: true,
    threatDetection: true,
    auditLogging: true,
    securityAlerts: true
  },

  // Update rate limits
  updateRateLimit: (type, maxAttempts, windowMs) => {
    RATE_LIMITS[type] = { maxAttempts, windowMs };
  },

  // Get current rate limits
  getRateLimits: () => ({ ...RATE_LIMITS }),

  // Clear all rate limit data
  clearAllRateLimits: () => {
    rateLimitStore.clear();
  }
};

export default {
  rateLimiter,
  securityLogger,
  threatDetector,
  securityMiddleware,
  securityConfig,
  SECURITY_EVENT_TYPES,
  SECURITY_SEVERITY
};
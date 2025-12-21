import { roleDetectionService } from './roleDetectionService';
import { securityLogger, SECURITY_EVENT_TYPES, SECURITY_SEVERITY } from '../utils/securityUtils';

/**
 * Redirect Manager Service
 * Handles navigation decisions based on user role and return URLs
 * Implements security validation and URL sanitization
 */

// Route mapping for different user roles
const ROLE_ROUTES = {
  internal: '/admin/dashboard',  // Admin users
  customer: '/',                 // Regular customers
  vendor: '/',                   // Vendor users
  default: '/'                   // Fallback route
};

// Admin route patterns that require admin role
const ADMIN_ROUTE_PATTERNS = [
  /^\/admin/,
  /^\/dashboard\/admin/,
  /^\/management/,
  /^\/settings\/admin/,
  /^\/reports\/admin/,
  /^\/users\/manage/,
  /^\/vendors\/manage/
];

// Allowed domains for return URLs (security measure)
const ALLOWED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  window.location.hostname
];

/**
 * Redirect Manager Service
 */
export const redirectManager = {
  /**
   * Determine the appropriate redirect URL based on user role and return URL
   * @param {string} role - User role ('internal', 'customer', 'vendor')
   * @param {string} returnUrl - Optional return URL from query parameters
   * @returns {string} Final redirect URL
   */
  determineRedirectUrl: (role, returnUrl = null) => {
    try {
      // Validate role
      if (!roleDetectionService.validateRole(role)) {
        console.warn('Invalid role provided to redirect manager:', role);
        role = roleDetectionService.getDefaultRole();
      }

      // If no return URL, use default route for role
      if (!returnUrl) {
        return redirectManager.getDefaultRouteForRole(role);
      }

      // Sanitize and validate return URL
      const sanitizedUrl = redirectManager.sanitizeUrl(returnUrl);
      if (!sanitizedUrl) {
        console.warn('Return URL failed sanitization, using default route');
        return redirectManager.getDefaultRouteForRole(role);
      }

      // Validate return URL against user permissions
      if (!redirectManager.validateReturnUrl(sanitizedUrl, role)) {
        console.warn('Return URL validation failed, using default route');
        securityLogger.logSecurityEvent(
          SECURITY_EVENT_TYPES.UNAUTHORIZED_ACCESS,
          SECURITY_SEVERITY.MEDIUM,
          `User attempted to access unauthorized return URL: ${returnUrl}`,
          {
            user_role: role,
            attempted_url: returnUrl,
            sanitized_url: sanitizedUrl
          }
        );
        return redirectManager.getDefaultRouteForRole(role);
      }

      // Log successful redirect decision
      console.log(`Redirect decision: ${role} -> ${sanitizedUrl}`);
      return sanitizedUrl;

    } catch (error) {
      console.error('Error in redirect determination:', error);
      securityLogger.logSecurityEvent(
        SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
        SECURITY_SEVERITY.LOW,
        `Redirect determination error: ${error.message}`,
        {
          user_role: role,
          return_url: returnUrl,
          error: error.message
        }
      );
      return redirectManager.getDefaultRouteForRole(role || roleDetectionService.getDefaultRole());
    }
  },

  /**
   * Validate return URL against user role and security policies
   * @param {string} url - URL to validate
   * @param {string} userRole - User's role
   * @returns {boolean} True if URL is valid for the user role
   */
  validateReturnUrl: (url, userRole) => {
    try {
      if (!url || typeof url !== 'string') {
        return false;
      }

      // Check domain validation first
      if (!redirectManager.validateDomain(url)) {
        return false;
      }

      // Check if URL is an admin route
      if (redirectManager.isAdminRoute(url)) {
        // Only admin users can access admin routes
        return roleDetectionService.isAdminRole(userRole);
      }

      // For non-admin routes, all authenticated users can access
      return true;

    } catch (error) {
      console.error('Return URL validation error:', error);
      return false;
    }
  },

  /**
   * Get default route for a given user role
   * @param {string} role - User role
   * @returns {string} Default route for the role
   */
  getDefaultRouteForRole: (role) => {
    if (!role || !roleDetectionService.validateRole(role)) {
      return ROLE_ROUTES.default;
    }
    return ROLE_ROUTES[role] || ROLE_ROUTES.default;
  },

  /**
   * Sanitize URL to prevent XSS and other security issues
   * @param {string} url - URL to sanitize
   * @returns {string|null} Sanitized URL or null if invalid
   */
  sanitizeUrl: (url) => {
    try {
      if (!url || typeof url !== 'string') {
        return null;
      }

      // Remove any leading/trailing whitespace
      url = url.trim();

      // Check for empty URL
      if (!url) {
        return null;
      }

      // Prevent javascript: and data: URLs
      if (url.toLowerCase().startsWith('javascript:') || 
          url.toLowerCase().startsWith('data:') ||
          url.toLowerCase().startsWith('vbscript:')) {
        console.warn('Blocked potentially malicious URL:', url);
        securityLogger.logSecurityEvent(
          SECURITY_EVENT_TYPES.DATA_BREACH_ATTEMPT,
          SECURITY_SEVERITY.HIGH,
          `Blocked malicious URL attempt: ${url}`,
          { attempted_url: url }
        );
        return null;
      }

      // If it's a relative URL, ensure it starts with /
      if (!url.startsWith('/') && !url.startsWith('http')) {
        url = '/' + url;
      }

      // If it's an absolute URL, validate the domain
      if (url.startsWith('http')) {
        try {
          const urlObj = new URL(url);
          if (!ALLOWED_DOMAINS.includes(urlObj.hostname)) {
            console.warn('URL domain not allowed:', urlObj.hostname);
            return null;
          }
          // Return the pathname for internal routing
          return urlObj.pathname + urlObj.search + urlObj.hash;
        } catch (urlError) {
          console.warn('Invalid URL format:', url);
          return null;
        }
      }

      // Sanitize URL parameters to prevent XSS
      return redirectManager.sanitizeUrlParameters(url);

    } catch (error) {
      console.error('URL sanitization error:', error);
      return null;
    }
  },

  /**
   * Sanitize URL parameters to prevent XSS attacks
   * @param {string} url - URL with parameters
   * @returns {string} URL with sanitized parameters
   */
  sanitizeUrlParameters: (url) => {
    try {
      const [pathname, search] = url.split('?');
      
      if (!search) {
        return pathname;
      }

      const params = new URLSearchParams(search);
      const sanitizedParams = new URLSearchParams();

      for (const [key, value] of params) {
        // Remove potentially dangerous characters
        const sanitizedKey = key.replace(/[<>'"&]/g, '');
        const sanitizedValue = value.replace(/[<>'"&]/g, '');
        
        // Skip empty keys or values after sanitization
        if (sanitizedKey && sanitizedValue) {
          sanitizedParams.set(sanitizedKey, sanitizedValue);
        }
      }

      const sanitizedSearch = sanitizedParams.toString();
      return sanitizedSearch ? `${pathname}?${sanitizedSearch}` : pathname;

    } catch (error) {
      console.error('URL parameter sanitization error:', error);
      // Return just the pathname if parameter sanitization fails
      return url.split('?')[0];
    }
  },

  /**
   * Check if a URL is an admin route
   * @param {string} url - URL to check
   * @returns {boolean} True if URL is an admin route
   */
  isAdminRoute: (url) => {
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
      console.warn('Error parsing URL for admin route check:', error);
      return false;
    }

    // Check against admin route patterns
    return ADMIN_ROUTE_PATTERNS.some(pattern => pattern.test(pathname));
  },

  /**
   * Validate domain for security (prevent open redirects)
   * @param {string} url - URL to validate
   * @returns {boolean} True if domain is allowed
   */
  validateDomain: (url) => {
    try {
      // Relative URLs are always allowed
      if (!url.startsWith('http')) {
        return true;
      }

      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // Check against allowed domains
      const isAllowed = ALLOWED_DOMAINS.some(domain => {
        return hostname === domain.toLowerCase() || 
               hostname.endsWith('.' + domain.toLowerCase());
      });

      if (!isAllowed) {
        securityLogger.logSecurityEvent(
          SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
          SECURITY_SEVERITY.MEDIUM,
          `Blocked redirect to unauthorized domain: ${hostname}`,
          { attempted_url: url, hostname }
        );
      }

      return isAllowed;

    } catch (error) {
      console.error('Domain validation error:', error);
      return false;
    }
  },

  /**
   * Add a new allowed domain (for configuration)
   * @param {string} domain - Domain to add
   */
  addAllowedDomain: (domain) => {
    if (domain && typeof domain === 'string' && !ALLOWED_DOMAINS.includes(domain)) {
      ALLOWED_DOMAINS.push(domain.toLowerCase());
      console.log('Added allowed domain:', domain);
    }
  },

  /**
   * Remove an allowed domain (for configuration)
   * @param {string} domain - Domain to remove
   */
  removeAllowedDomain: (domain) => {
    const index = ALLOWED_DOMAINS.indexOf(domain.toLowerCase());
    if (index > -1) {
      ALLOWED_DOMAINS.splice(index, 1);
      console.log('Removed allowed domain:', domain);
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
   * Update role route mapping (for configuration)
   * @param {string} role - User role
   * @param {string} route - Route for the role
   */
  updateRoleRoute: (role, route) => {
    if (roleDetectionService.validateRole(role) && route && typeof route === 'string') {
      ROLE_ROUTES[role] = route;
      console.log(`Updated route for ${role}: ${route}`);
    }
  },

  /**
   * Get current role route mappings
   * @returns {Object} Role to route mappings
   */
  getRoleRoutes: () => {
    return { ...ROLE_ROUTES };
  },

  /**
   * Add admin route pattern (for configuration)
   * @param {RegExp|string} pattern - Pattern to add
   */
  addAdminRoutePattern: (pattern) => {
    try {
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
      if (regex instanceof RegExp && !ADMIN_ROUTE_PATTERNS.some(p => p.toString() === regex.toString())) {
        ADMIN_ROUTE_PATTERNS.push(regex);
        console.log('Added admin route pattern:', regex.toString());
      }
    } catch (error) {
      console.error('Error adding admin route pattern:', error);
    }
  },

  /**
   * Get current admin route patterns
   * @returns {Array<RegExp>} Array of admin route patterns
   */
  getAdminRoutePatterns: () => {
    return [...ADMIN_ROUTE_PATTERNS];
  },

  /**
   * Perform redirect with proper navigation
   * @param {string} url - URL to redirect to
   * @param {boolean} replace - Whether to replace current history entry
   */
  performRedirect: (url, replace = false) => {
    try {
      if (!url || typeof url !== 'string') {
        console.error('Invalid URL for redirect:', url);
        return;
      }

      // Log the redirect
      console.log(`Performing redirect to: ${url}`);
      
      // Use React Router navigation if available, otherwise use window.location
      if (window.history && window.history.pushState) {
        if (replace) {
          window.history.replaceState(null, '', url);
        } else {
          window.history.pushState(null, '', url);
        }
        // Trigger a popstate event to notify React Router
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        // Fallback to window.location
        if (replace) {
          window.location.replace(url);
        } else {
          window.location.href = url;
        }
      }

    } catch (error) {
      console.error('Error performing redirect:', error);
      // Fallback to window.location
      window.location.href = url || '/';
    }
  },

  /**
   * Get redirect statistics for monitoring
   * @returns {Object} Redirect statistics
   */
  getRedirectStats: () => {
    return {
      roleRoutes: Object.keys(ROLE_ROUTES).length,
      adminPatterns: ADMIN_ROUTE_PATTERNS.length,
      allowedDomains: ALLOWED_DOMAINS.length,
      configuration: {
        roleRoutes: { ...ROLE_ROUTES },
        allowedDomains: [...ALLOWED_DOMAINS],
        adminPatterns: ADMIN_ROUTE_PATTERNS.map(p => p.toString())
      }
    };
  }
};

export default redirectManager;
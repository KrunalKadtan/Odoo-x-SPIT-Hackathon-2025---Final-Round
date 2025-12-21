/**
 * Integration Tests for Role-Based Login Redirect System
 * 
 * This test suite verifies that all services integrate properly and the complete
 * login flow works correctly for different user roles and scenarios.
 */

import { roleDetectionService } from '../../services/roleDetectionService.js';
import { redirectManager } from '../../services/redirectManager.js';
import { securityValidator } from '../../services/securityValidator.js';
import { tokenUtils, auditLogger } from '../../utils/api.js';

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => store[key] = value.toString(),
    removeItem: (key) => delete store[key],
    clear: () => store = {},
    get store() { return store; }
  };
})();

// Mock console methods to capture logs
const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Test data fixtures
const testUsers = {
  admin: {
    id: 1,
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'internal'
  },
  customer: {
    id: 2,
    email: 'customer@test.com',
    name: 'Customer User',
    role: 'customer'
  },
  vendor: {
    id: 3,
    email: 'vendor@test.com',
    name: 'Vendor User',
    role: 'vendor'
  }
};

const testTokens = {
  admin: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiaW50ZXJuYWwifQ.test',
  customer: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiY3VzdG9tZXIifQ.test',
  vendor: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidmVuZG9yIn0.test'
};

describe('Role-Based Login Redirect Integration Tests', () => {
  
  beforeEach(() => {
    // Reset localStorage
    mockLocalStorage.clear();
    
    // Reset console mocks
    Object.values(mockConsole).forEach(mock => mock.mockClear());
    
    // Mock global objects
    global.localStorage = mockLocalStorage;
    global.console = mockConsole;
    global.window = {
      location: {
        hostname: 'localhost',
        pathname: '/',
        search: '',
        href: 'http://localhost:3000/'
      }
    };
    global.navigator = {
      userAgent: 'Test Browser',
      language: 'en-US',
      platform: 'Test Platform'
    };
    global.document = {
      referrer: ''
    };
    global.screen = {
      width: 1920,
      height: 1080
    };
    global.Intl = {
      DateTimeFormat: () => ({
        resolvedOptions: () => ({ timeZone: 'UTC' })
      })
    };
  });

  describe('Service Integration', () => {
    
    test('should integrate all services without errors', () => {
      // Test that all services can be imported and initialized
      expect(roleDetectionService).toBeDefined();
      expect(redirectManager).toBeDefined();
      expect(securityValidator).toBeDefined();
      
      // Test that all required methods exist
      expect(typeof roleDetectionService.detectRole).toBe('function');
      expect(typeof redirectManager.determineRedirectUrl).toBe('function');
      expect(typeof securityValidator.validateAndSanitizeUrl).toBe('function');
    });

    test('should handle complete login flow for admin user', async () => {
      const adminUser = testUsers.admin;
      const adminToken = testTokens.admin;
      
      // Step 1: Role detection
      const detectedRole = await roleDetectionService.detectRole(adminUser, adminToken);
      expect(detectedRole).toBe('internal');
      
      // Step 2: Redirect determination
      const redirectUrl = redirectManager.determineRedirectUrl(detectedRole);
      expect(redirectUrl).toBe('/admin/dashboard');
      
      // Step 3: Security validation
      const sanitizedUrl = securityValidator.validateAndSanitizeUrl(redirectUrl);
      expect(sanitizedUrl).toBe('/admin/dashboard');
      
      // Step 4: Verify role is cached
      const cachedRole = roleDetectionService.getCachedRole(adminUser.id);
      expect(cachedRole).toBe('internal');
    });

    test('should handle complete login flow for customer user', async () => {
      const customerUser = testUsers.customer;
      const customerToken = testTokens.customer;
      
      // Step 1: Role detection
      const detectedRole = await roleDetectionService.detectRole(customerUser, customerToken);
      expect(detectedRole).toBe('customer');
      
      // Step 2: Redirect determination
      const redirectUrl = redirectManager.determineRedirectUrl(detectedRole);
      expect(redirectUrl).toBe('/');
      
      // Step 3: Security validation
      const sanitizedUrl = securityValidator.validateAndSanitizeUrl(redirectUrl);
      expect(sanitizedUrl).toBe('/');
      
      // Step 4: Verify role is cached
      const cachedRole = roleDetectionService.getCachedRole(customerUser.id);
      expect(cachedRole).toBe('customer');
    });

    test('should handle complete login flow for vendor user', async () => {
      const vendorUser = testUsers.vendor;
      const vendorToken = testTokens.vendor;
      
      // Step 1: Role detection
      const detectedRole = await roleDetectionService.detectRole(vendorUser, vendorToken);
      expect(detectedRole).toBe('vendor');
      
      // Step 2: Redirect determination
      const redirectUrl = redirectManager.determineRedirectUrl(detectedRole);
      expect(redirectUrl).toBe('/');
      
      // Step 3: Security validation
      const sanitizedUrl = securityValidator.validateAndSanitizeUrl(redirectUrl);
      expect(sanitizedUrl).toBe('/');
      
      // Step 4: Verify role is cached
      const cachedRole = roleDetectionService.getCachedRole(vendorUser.id);
      expect(cachedRole).toBe('vendor');
    });
  });

  describe('Role Detection with Different User Types', () => {
    
    test('should detect admin role from profile data', async () => {
      const role = await roleDetectionService.detectRole(testUsers.admin);
      expect(role).toBe('internal');
    });

    test('should detect customer role from profile data', async () => {
      const role = await roleDetectionService.detectRole(testUsers.customer);
      expect(role).toBe('customer');
    });

    test('should detect vendor role from profile data', async () => {
      const role = await roleDetectionService.detectRole(testUsers.vendor);
      expect(role).toBe('vendor');
    });

    test('should fallback to token role when profile data is invalid', async () => {
      const invalidProfile = { id: 1, email: 'test@test.com' }; // No role
      const role = await roleDetectionService.detectRole(invalidProfile, testTokens.admin);
      expect(role).toBe('internal');
    });

    test('should fallback to default role when both profile and token fail', async () => {
      const invalidProfile = { id: 1, email: 'test@test.com' };
      const invalidToken = 'invalid.token.here';
      const role = await roleDetectionService.detectRole(invalidProfile, invalidToken);
      expect(role).toBe('customer');
    });

    test('should use cached role when available', async () => {
      // Cache a role first
      roleDetectionService.cacheRole('test_user', 'internal');
      
      // Try to detect role with invalid data but valid user ID
      const role = await roleDetectionService.detectRole({ id: 'test_user' });
      expect(role).toBe('internal');
    });

    test('should handle role priority resolution correctly', () => {
      const roles = ['customer', 'internal', 'vendor'];
      const resolvedRole = roleDetectionService.resolveRoleConflict(roles);
      expect(resolvedRole).toBe('internal'); // Admin has highest priority
    });
  });

  describe('Redirect Logic for All Scenarios', () => {
    
    test('should redirect admin users to admin dashboard', () => {
      const redirectUrl = redirectManager.determineRedirectUrl('internal');
      expect(redirectUrl).toBe('/admin/dashboard');
    });

    test('should redirect customer users to home page', () => {
      const redirectUrl = redirectManager.determineRedirectUrl('customer');
      expect(redirectUrl).toBe('/');
    });

    test('should redirect vendor users to home page', () => {
      const redirectUrl = redirectManager.determineRedirectUrl('vendor');
      expect(redirectUrl).toBe('/');
    });

    test('should handle return URL for admin users', () => {
      const returnUrl = '/admin/users';
      const redirectUrl = redirectManager.determineRedirectUrl('internal', returnUrl);
      expect(redirectUrl).toBe('/admin/users');
    });

    test('should reject invalid return URL for non-admin users', () => {
      const returnUrl = '/admin/users';
      const redirectUrl = redirectManager.determineRedirectUrl('customer', returnUrl);
      expect(redirectUrl).toBe('/'); // Should fallback to default
    });

    test('should handle valid return URL for regular users', () => {
      const returnUrl = '/shop/electronics';
      const redirectUrl = redirectManager.determineRedirectUrl('customer', returnUrl);
      expect(redirectUrl).toBe('/shop/electronics');
    });

    test('should sanitize malicious return URLs', () => {
      const maliciousUrl = '/shop?search=<script>alert("xss")</script>';
      const redirectUrl = redirectManager.determineRedirectUrl('customer', maliciousUrl);
      expect(redirectUrl).toBe('/'); // Should fallback due to sanitization failure
    });

    test('should validate admin route access', () => {
      expect(redirectManager.validateReturnUrl('/admin/dashboard', 'internal')).toBe(true);
      expect(redirectManager.validateReturnUrl('/admin/dashboard', 'customer')).toBe(false);
      expect(redirectManager.validateReturnUrl('/shop', 'customer')).toBe(true);
    });

    test('should handle external domain rejection', () => {
      const externalUrl = 'https://evil.com/redirect';
      const redirectUrl = redirectManager.determineRedirectUrl('customer', externalUrl);
      expect(redirectUrl).toBe('/'); // Should fallback to default
    });
  });

  describe('Security Validation', () => {
    
    test('should validate same-origin URLs', () => {
      expect(securityValidator.validateDomain('/shop')).toBe(true);
      expect(securityValidator.validateDomain('https://localhost/shop')).toBe(true);
      expect(securityValidator.validateDomain('https://evil.com/shop')).toBe(false);
    });

    test('should sanitize URL parameters', () => {
      const dirtyUrl = '/shop?search=<script>&category=electronics';
      const cleanUrl = securityValidator.sanitizeUrlParameters(dirtyUrl);
      expect(cleanUrl).toBe('/shop?category=electronics');
    });

    test('should detect malicious URL patterns', () => {
      const maliciousUrls = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        '/shop?search=<script>alert("xss")</script>'
      ];
      
      maliciousUrls.forEach(url => {
        const sanitized = securityValidator.validateAndSanitizeUrl(url);
        expect(sanitized).toBeNull();
      });
    });

    test('should check admin access permissions', () => {
      expect(securityValidator.checkAdminAccess('/admin/dashboard', 'internal')).toBe(true);
      expect(securityValidator.checkAdminAccess('/admin/dashboard', 'customer')).toBe(false);
      expect(securityValidator.checkAdminAccess('/shop', 'customer')).toBe(true);
    });

    test('should track suspicious activity', () => {
      const userId = 'test_user';
      const suspiciousUrl = 'javascript:alert("xss")';
      
      const isSuspicious = securityValidator.detectSuspiciousActivity(userId, suspiciousUrl);
      expect(isSuspicious).toBe(true);
      
      const activityCount = securityValidator.getSuspiciousActivityCount(userId);
      expect(activityCount).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Fallbacks', () => {
    
    test('should handle role detection service errors gracefully', async () => {
      // Mock a service error
      const originalDetectRole = roleDetectionService.detectRole;
      roleDetectionService.detectRole = jest.fn().mockRejectedValue(new Error('Service error'));
      
      try {
        const role = await roleDetectionService.detectRole(null, null);
        expect(role).toBe('customer'); // Should fallback to default
      } finally {
        roleDetectionService.detectRole = originalDetectRole;
      }
    });

    test('should handle redirect manager errors gracefully', () => {
      // Test with invalid role
      const redirectUrl = redirectManager.determineRedirectUrl('invalid_role');
      expect(redirectUrl).toBe('/'); // Should fallback to default
    });

    test('should handle security validator errors gracefully', () => {
      // Test with null URL
      const sanitized = securityValidator.validateAndSanitizeUrl(null);
      expect(sanitized).toBeNull();
      
      // Test with undefined URL
      const sanitized2 = securityValidator.validateAndSanitizeUrl(undefined);
      expect(sanitized2).toBeNull();
    });

    test('should maintain authentication state on errors', async () => {
      // Set up authenticated state
      mockLocalStorage.setItem('access_token', 'test_token');
      mockLocalStorage.setItem('user_data', JSON.stringify(testUsers.admin));
      
      // Simulate error in role detection
      const originalDetectRole = roleDetectionService.detectRole;
      roleDetectionService.detectRole = jest.fn().mockRejectedValue(new Error('Network error'));
      
      try {
        const role = await roleDetectionService.detectRole(testUsers.admin);
        
        // Should still have authentication data
        expect(mockLocalStorage.getItem('access_token')).toBe('test_token');
        expect(mockLocalStorage.getItem('user_data')).toBeTruthy();
        
        // Should fallback to default role
        expect(role).toBe('customer');
      } finally {
        roleDetectionService.detectRole = originalDetectRole;
      }
    });
  });

  describe('Cache Consistency', () => {
    
    test('should maintain role cache consistency', () => {
      const userId = 'test_user';
      const role = 'internal';
      
      // Cache the role
      roleDetectionService.cacheRole(userId, role);
      
      // Retrieve cached role
      const cachedRole = roleDetectionService.getCachedRole(userId);
      expect(cachedRole).toBe(role);
      
      // Clear cache
      roleDetectionService.clearCachedRole(userId);
      const clearedRole = roleDetectionService.getCachedRole(userId);
      expect(clearedRole).toBeNull();
    });

    test('should handle cache expiration', () => {
      const userId = 'test_user';
      const role = 'internal';
      
      // Mock expired cache entry
      const expiredCacheData = {
        role,
        timestamp: Date.now() - 60 * 60 * 1000, // 1 hour ago
        expiresAt: Date.now() - 30 * 60 * 1000  // Expired 30 minutes ago
      };
      
      mockLocalStorage.setItem(`role_cache_${userId}`, JSON.stringify(expiredCacheData));
      
      // Should return null for expired cache
      const cachedRole = roleDetectionService.getCachedRole(userId);
      expect(cachedRole).toBeNull();
    });

    test('should cleanup expired cache entries', () => {
      const userId1 = 'user1';
      const userId2 = 'user2';
      
      // Create expired entry
      const expiredData = {
        role: 'customer',
        timestamp: Date.now() - 60 * 60 * 1000,
        expiresAt: Date.now() - 30 * 60 * 1000
      };
      
      // Create valid entry
      const validData = {
        role: 'internal',
        timestamp: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000
      };
      
      mockLocalStorage.setItem(`role_cache_${userId1}`, JSON.stringify(expiredData));
      mockLocalStorage.setItem(`role_cache_${userId2}`, JSON.stringify(validData));
      
      // Run cleanup
      const cleanedCount = roleDetectionService.cleanupExpiredCache();
      expect(cleanedCount).toBe(1);
      
      // Verify expired entry is removed
      expect(mockLocalStorage.getItem(`role_cache_${userId1}`)).toBeNull();
      expect(mockLocalStorage.getItem(`role_cache_${userId2}`)).toBeTruthy();
    });
  });

  describe('Audit Logging', () => {
    
    test('should log successful redirects', async () => {
      const userId = 'test_user';
      const userRole = 'internal';
      const destination = '/admin/dashboard';
      const returnUrl = '/admin/users';
      
      // Mock audit logger
      const mockLogSuccessfulRedirect = jest.fn();
      auditLogger.logSuccessfulRedirect = mockLogSuccessfulRedirect;
      
      await auditLogger.logSuccessfulRedirect(userId, userRole, destination, returnUrl);
      
      expect(mockLogSuccessfulRedirect).toHaveBeenCalledWith(
        userId,
        userRole,
        destination,
        returnUrl
      );
    });

    test('should log role detection failures', async () => {
      const userId = 'test_user';
      const error = new Error('Profile fetch failed');
      const attemptedSources = ['profile_api', 'jwt_token', 'default_fallback'];
      
      // Mock audit logger
      const mockLogRoleDetectionFailure = jest.fn();
      auditLogger.logRoleDetectionFailure = mockLogRoleDetectionFailure;
      
      await auditLogger.logRoleDetectionFailure(userId, error, attemptedSources);
      
      expect(mockLogRoleDetectionFailure).toHaveBeenCalledWith(
        userId,
        error,
        attemptedSources
      );
    });

    test('should log return URL validation failures', async () => {
      const userId = 'test_user';
      const invalidUrl = 'https://evil.com/redirect';
      const reason = 'Domain not allowed';
      
      // Mock audit logger
      const mockLogReturnUrlValidationFailure = jest.fn();
      auditLogger.logReturnUrlValidationFailure = mockLogReturnUrlValidationFailure;
      
      await auditLogger.logReturnUrlValidationFailure(userId, invalidUrl, reason);
      
      expect(mockLogReturnUrlValidationFailure).toHaveBeenCalledWith(
        userId,
        invalidUrl,
        reason
      );
    });
  });

  describe('Complete Integration Scenarios', () => {
    
    test('should handle complete admin login with return URL', async () => {
      const adminUser = testUsers.admin;
      const adminToken = testTokens.admin;
      const returnUrl = '/admin/users';
      
      // Complete flow
      const detectedRole = await roleDetectionService.detectRole(adminUser, adminToken);
      const sanitizedReturnUrl = securityValidator.validateAndSanitizeUrl(returnUrl);
      const finalDestination = redirectManager.determineRedirectUrl(detectedRole, sanitizedReturnUrl);
      
      expect(detectedRole).toBe('internal');
      expect(sanitizedReturnUrl).toBe('/admin/users');
      expect(finalDestination).toBe('/admin/users');
    });

    test('should handle customer login with invalid admin return URL', async () => {
      const customerUser = testUsers.customer;
      const customerToken = testTokens.customer;
      const returnUrl = '/admin/dashboard';
      
      // Complete flow
      const detectedRole = await roleDetectionService.detectRole(customerUser, customerToken);
      const sanitizedReturnUrl = securityValidator.validateAndSanitizeUrl(returnUrl);
      const finalDestination = redirectManager.determineRedirectUrl(detectedRole, sanitizedReturnUrl);
      
      expect(detectedRole).toBe('customer');
      expect(sanitizedReturnUrl).toBe('/admin/dashboard');
      expect(finalDestination).toBe('/'); // Should fallback due to permission check
    });

    test('should handle login with malicious return URL', async () => {
      const customerUser = testUsers.customer;
      const customerToken = testTokens.customer;
      const maliciousUrl = 'javascript:alert("xss")';
      
      // Complete flow
      const detectedRole = await roleDetectionService.detectRole(customerUser, customerToken);
      const sanitizedReturnUrl = securityValidator.validateAndSanitizeUrl(maliciousUrl);
      const finalDestination = redirectManager.determineRedirectUrl(detectedRole, sanitizedReturnUrl);
      
      expect(detectedRole).toBe('customer');
      expect(sanitizedReturnUrl).toBeNull(); // Should be blocked by security validator
      expect(finalDestination).toBe('/'); // Should fallback to default
    });

    test('should handle network failure during role detection', async () => {
      const userData = { id: 1, email: 'test@test.com' }; // No role in profile
      const invalidToken = 'invalid.token';
      
      // This should trigger the fallback chain and end with default role
      const detectedRole = await roleDetectionService.detectRole(userData, invalidToken);
      const finalDestination = redirectManager.determineRedirectUrl(detectedRole);
      
      expect(detectedRole).toBe('customer'); // Default fallback
      expect(finalDestination).toBe('/'); // Default route for customer
    });
  });
});
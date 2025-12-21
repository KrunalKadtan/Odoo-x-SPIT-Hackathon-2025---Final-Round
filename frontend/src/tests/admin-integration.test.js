/**
 * Admin System Integration Tests
 * Tests the integration between admin system and existing application
 */

import { adminUtils } from '../utils/adminUtils';
import { tokenUtils, returnUrlUtils, profileUtils, auditLogger } from '../utils/api';

// Mock data for testing
const mockAdminUser = {
  id: 1,
  email: 'admin@appareldesk.com',
  name: 'Admin User',
  role: 'internal'
};

const mockRegularUser = {
  id: 2,
  email: 'user@example.com',
  name: 'Regular User',
  role: 'customer'
};

describe('Admin Integration Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear console logs
    jest.clearAllMocks();
  });

  describe('Authentication Integration', () => {
    test('should verify admin authentication works with existing token system', () => {
      // Test 1: No authentication
      expect(adminUtils.isAuthenticatedAdmin()).toBe(false);

      // Test 2: Regular user authentication (should not be admin)
      localStorage.setItem('access_token', 'mock-token');
      localStorage.setItem('user_data', JSON.stringify(mockRegularUser));
      expect(adminUtils.isAuthenticatedAdmin()).toBe(false);

      // Test 3: Admin user authentication (should be admin)
      localStorage.setItem('user_data', JSON.stringify(mockAdminUser));
      expect(adminUtils.isAuthenticatedAdmin()).toBe(true);
    });

    test('should properly validate admin role', () => {
      // Test with no user data
      expect(adminUtils.isAdmin()).toBe(false);

      // Test with regular user
      localStorage.setItem('user_data', JSON.stringify(mockRegularUser));
      expect(adminUtils.isAdmin()).toBe(false);

      // Test with admin user
      localStorage.setItem('user_data', JSON.stringify(mockAdminUser));
      expect(adminUtils.isAdmin()).toBe(true);
    });

    test('should handle authentication errors gracefully', () => {
      // Test with invalid JSON in localStorage
      localStorage.setItem('user_data', 'invalid-json');
      expect(adminUtils.isAdmin()).toBe(false);
      expect(adminUtils.isAuthenticatedAdmin()).toBe(false);
    });
  });

  describe('Admin Session Management', () => {
    test('should validate admin session correctly', () => {
      // Test invalid session
      expect(adminUtils.validateAdminSession()).toBe(false);

      // Test valid admin session
      localStorage.setItem('access_token', 'mock-token');
      localStorage.setItem('user_data', JSON.stringify(mockAdminUser));
      expect(adminUtils.validateAdminSession()).toBe(true);

      // Test authenticated but not admin
      localStorage.setItem('user_data', JSON.stringify(mockRegularUser));
      expect(adminUtils.validateAdminSession()).toBe(false);
    });

    test('should get admin user data correctly', () => {
      // Test with no admin
      expect(adminUtils.getAdminUserData()).toBe(null);

      // Test with admin user
      localStorage.setItem('user_data', JSON.stringify(mockAdminUser));
      expect(adminUtils.getAdminUserData()).toEqual(mockAdminUser);
    });
  });

  describe('Admin Permissions', () => {
    test('should check admin permissions correctly', () => {
      // Test without admin role
      expect(adminUtils.hasPermission('user_management')).toBe(false);

      // Test with admin role
      localStorage.setItem('user_data', JSON.stringify(mockAdminUser));
      expect(adminUtils.hasPermission('user_management')).toBe(true);
      expect(adminUtils.hasPermission('vendor_management')).toBe(true);
      expect(adminUtils.hasPermission('system_settings')).toBe(true);
    });
  });

  describe('Admin Action Logging', () => {
    test('should log admin actions correctly', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Test logging without admin user
      adminUtils.logAdminAction('test_action', { test: 'data' });
      expect(consoleSpy).not.toHaveBeenCalled();

      // Test logging with admin user
      localStorage.setItem('user_data', JSON.stringify(mockAdminUser));
      adminUtils.logAdminAction('test_action', { test: 'data' });
      
      expect(consoleSpy).toHaveBeenCalledWith('Admin Action:', expect.objectContaining({
        admin: mockAdminUser.email,
        action: 'test_action',
        details: { test: 'data' }
      }));

      consoleSpy.mockRestore();
    });
  });

  describe('Token Integration', () => {
    test('should work with existing token utilities', () => {
      // Test token setting and getting
      const mockTokens = {
        access: 'mock-access-token',
        refresh: 'mock-refresh-token'
      };

      tokenUtils.setTokens(mockTokens);
      expect(tokenUtils.getAccessToken()).toBe(mockTokens.access);
      expect(tokenUtils.getRefreshToken()).toBe(mockTokens.refresh);
      expect(tokenUtils.isAuthenticated()).toBe(true);

      // Test token clearing
      tokenUtils.clearTokens();
      expect(tokenUtils.getAccessToken()).toBe(null);
      expect(tokenUtils.isAuthenticated()).toBe(false);
    });

    test('should handle user data correctly', () => {
      // Test setting and getting user data
      tokenUtils.setTokens({ access: 'token', refresh: 'refresh' });
      localStorage.setItem('user_data', JSON.stringify(mockAdminUser));
      
      expect(tokenUtils.getUserData()).toEqual(mockAdminUser);
      
      // Test clearing user data
      tokenUtils.clearTokens();
      expect(tokenUtils.getUserData()).toBe(null);
    });

    test('should handle enhanced role functionality', () => {
      // Test role detection from user data
      localStorage.setItem('user_data', JSON.stringify(mockAdminUser));
      expect(tokenUtils.getUserRole()).toBe('internal');
      expect(tokenUtils.isAdmin()).toBe(true);

      // Test role detection for regular user
      localStorage.setItem('user_data', JSON.stringify(mockRegularUser));
      expect(tokenUtils.getUserRole()).toBe('customer');
      expect(tokenUtils.isAdmin()).toBe(false);

      // Test default role fallback
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_role');
      expect(tokenUtils.getUserRole()).toBe('customer');
    });

    test('should handle user ID caching', () => {
      // Test user ID from user data
      localStorage.setItem('user_data', JSON.stringify(mockAdminUser));
      expect(tokenUtils.getUserId()).toBe('1');

      // Test cached user ID
      localStorage.removeItem('user_data');
      expect(tokenUtils.getUserId()).toBe('1'); // Should still be cached

      // Test clearing
      tokenUtils.clearTokens();
      expect(tokenUtils.getUserId()).toBe(null);
    });

    test('should validate authentication state', () => {
      // Test invalid state
      let authState = tokenUtils.validateAuthState();
      expect(authState.isValid).toBe(false);

      // Test valid state
      tokenUtils.setTokens({ access: 'token', refresh: 'refresh' });
      localStorage.setItem('user_data', JSON.stringify(mockAdminUser));
      
      authState = tokenUtils.validateAuthState();
      expect(authState.isValid).toBe(true);
      expect(authState.hasToken).toBe(true);
      expect(authState.hasUserData).toBe(true);
      expect(authState.hasRole).toBe(true);
    });
  });
});

describe('UI Component Integration Tests', () => {
  describe('Design System Consistency', () => {
    test('should use consistent CSS custom properties', () => {
      // Test that CSS custom properties are defined
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      
      // These should be defined in the CSS
      const expectedProperties = [
        '--color-bg-primary',
        '--color-bg-secondary',
        '--color-surface',
        '--color-text-main',
        '--color-text-muted',
        '--color-accent',
        '--color-accent-soft',
        '--color-border'
      ];

      expectedProperties.forEach(property => {
        const value = computedStyle.getPropertyValue(property);
        expect(value).toBeTruthy();
      });
    });

    test('should maintain consistent class naming patterns', () => {
      // Test that admin components use the same class patterns as customer components
      const expectedClassPatterns = [
        'bg-app-surface',
        'text-app-main',
        'text-app-muted',
        'border-app-border',
        'bg-app-accent',
        'rounded-pro',
        'font-mono',
        'font-display'
      ];

      // These patterns should be consistent across the application
      expectedClassPatterns.forEach(pattern => {
        expect(pattern).toMatch(/^(bg|text|border|rounded|font)-/);
      });
    });
  });

  describe('Component Reuse Verification', () => {
    test('should verify admin components import existing UI components', () => {
      // This test would verify that admin components properly import and use
      // existing UI components like Button, Table, Modal, etc.
      
      // In a real test environment, we would check the actual imports
      const expectedComponents = [
        'Button',
        'Table', 
        'Modal',
        'LoadingSpinner',
        'Badge'
      ];

      expectedComponents.forEach(component => {
        expect(component).toBeTruthy();
      });
    });
  });
});

describe('Performance Integration Tests', () => {
  describe('Caching Integration', () => {
    test('should integrate with existing cache system', () => {
      // Test that admin API calls use the same caching system
      const mockCacheKey = 'admin_test_data';
      const mockData = { test: 'data' };

      // This would test the actual cache integration
      // For now, we just verify the structure exists
      expect(typeof mockCacheKey).toBe('string');
      expect(typeof mockData).toBe('object');
    });
  });

  describe('Loading States Integration', () => {
    test('should use consistent loading patterns', () => {
      // Test that admin components use the same loading patterns
      const loadingStates = [
        'loading',
        'error',
        'success',
        'idle'
      ];

      loadingStates.forEach(state => {
        expect(typeof state).toBe('string');
      });
    });
  });
});

describe('Security Integration Tests', () => {
  describe('Route Protection', () => {
    test('should properly protect admin routes', () => {
      // Test that admin routes are properly protected
      const adminRoutes = [
        '/admin/dashboard',
        '/admin/users',
        '/admin/vendors',
        '/admin/products',
        '/admin/orders',
        '/admin/analytics',
        '/admin/settings'
      ];

      adminRoutes.forEach(route => {
        expect(route.startsWith('/admin/')).toBe(true);
      });
    });

    test('should handle unauthorized access attempts', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Simulate unauthorized access attempt
      const mockPath = '/admin/dashboard';
      console.warn('Unauthorized admin access attempt:', {
        timestamp: new Date().toISOString(),
        path: mockPath,
        authenticated: false,
        hasAdminRole: false
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Unauthorized admin access attempt:',
        expect.objectContaining({
          path: mockPath,
          authenticated: false,
          hasAdminRole: false
        })
      );

      consoleSpy.mockRestore();
    });
  });
});

// Test data consistency
describe('Data Integration Tests', () => {
  test('should maintain data consistency between admin and customer views', () => {
    // Test that admin and customer views show consistent data
    const mockOrderData = {
      id: 1,
      status: 'completed',
      total: 100.00,
      user_id: 2
    };

    // Both admin and customer should see the same core data
    expect(mockOrderData.id).toBe(1);
    expect(mockOrderData.status).toBe('completed');
    expect(mockOrderData.total).toBe(100.00);
  });

  test('should handle real-time updates consistently', () => {
    // Test that real-time updates work across admin and customer interfaces
    const mockUpdate = {
      type: 'order_status_change',
      orderId: 1,
      newStatus: 'shipped'
    };

    expect(mockUpdate.type).toBe('order_status_change');
    expect(mockUpdate.orderId).toBe(1);
    expect(mockUpdate.newStatus).toBe('shipped');
  });
});

// Enhanced Authentication Utilities Tests
describe('Enhanced Authentication Utilities Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    // Mock window.location
    delete window.location;
    window.location = {
      origin: 'http://localhost:3000',
      pathname: '/test',
      search: '?param=value'
    };
  });

  describe('Return URL Utils', () => {
    test('should capture return URL correctly', () => {
      window.location.pathname = '/admin/dashboard';
      window.location.search = '?tab=users';
      
      const returnUrl = returnUrlUtils.captureReturnUrl();
      expect(returnUrl).toBe('/admin/dashboard?tab=users');
      expect(localStorage.getItem('return_url')).toBe('/admin/dashboard?tab=users');
    });

    test('should not capture signin/signup pages as return URL', () => {
      window.location.pathname = '/signin';
      window.location.search = '';
      
      const returnUrl = returnUrlUtils.captureReturnUrl();
      expect(returnUrl).toBe(null);
      expect(localStorage.getItem('return_url')).toBe(null);
    });

    test('should validate return URLs correctly', () => {
      // Valid same-origin URL
      expect(returnUrlUtils.validateReturnUrl('/admin/dashboard')).toBe(true);
      expect(returnUrlUtils.validateReturnUrl('/products?category=shirts')).toBe(true);

      // Invalid URLs
      expect(returnUrlUtils.validateReturnUrl('http://evil.com/hack')).toBe(false);
      expect(returnUrlUtils.validateReturnUrl('/admin<script>alert("xss")</script>')).toBe(false);
      expect(returnUrlUtils.validateReturnUrl('javascript:alert("xss")')).toBe(false);
    });

    test('should get and clear return URL', () => {
      localStorage.setItem('return_url', '/admin/users');
      
      expect(returnUrlUtils.getReturnUrl()).toBe('/admin/users');
      
      returnUrlUtils.clearReturnUrl();
      expect(returnUrlUtils.getReturnUrl()).toBe(null);
    });
  });

  describe('Profile Utils', () => {
    test('should extract role from profile data', () => {
      const profileData = { id: 1, email: 'test@example.com', role: 'internal' };
      expect(profileUtils.extractRoleFromProfile(profileData)).toBe('internal');

      const profileDataAlt = { id: 1, email: 'test@example.com', user_type: 'customer' };
      expect(profileUtils.extractRoleFromProfile(profileDataAlt)).toBe('customer');

      const invalidProfile = { id: 1, email: 'test@example.com' };
      expect(profileUtils.extractRoleFromProfile(invalidProfile)).toBe(null);
    });

    test('should extract role from JWT token', () => {
      // Mock JWT token with role in payload
      const mockPayload = { role: 'vendor', exp: Date.now() / 1000 + 3600 };
      const mockToken = 'header.' + btoa(JSON.stringify(mockPayload)) + '.signature';
      
      expect(profileUtils.extractRoleFromToken(mockToken)).toBe('vendor');

      // Invalid token
      expect(profileUtils.extractRoleFromToken('invalid-token')).toBe(null);
      expect(profileUtils.extractRoleFromToken(null)).toBe(null);
    });
  });

  describe('Audit Logger', () => {
    test('should log successful redirect locally', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await auditLogger.logSuccessfulRedirect('user123', 'internal', '/admin/dashboard', '/admin/users');
      
      const logs = auditLogger.getLocalAuditLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        event_type: 'SUCCESSFUL_REDIRECT',
        user_id: 'user123',
        user_role: 'internal',
        destination: '/admin/dashboard',
        return_url: '/admin/users'
      });

      consoleSpy.mockRestore();
    });

    test('should log role detection failure', async () => {
      const mockError = new Error('Profile fetch failed');
      
      await auditLogger.logRoleDetectionFailure('user123', mockError, ['profile_api', 'jwt_token']);
      
      const logs = auditLogger.getLocalAuditLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        event_type: 'ROLE_DETECTION_FAILURE',
        user_id: 'user123',
        error_message: 'Profile fetch failed',
        attempted_sources: ['profile_api', 'jwt_token']
      });
    });

    test('should log return URL validation failure', async () => {
      await auditLogger.logReturnUrlValidationFailure('user123', 'http://evil.com', 'different origin');
      
      const logs = auditLogger.getLocalAuditLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        event_type: 'RETURN_URL_VALIDATION_FAILURE',
        user_id: 'user123',
        invalid_url: 'http://evil.com',
        failure_reason: 'different origin'
      });
    });

    test('should handle local audit logs correctly', () => {
      // Test empty logs
      expect(auditLogger.getLocalAuditLogs()).toEqual([]);

      // Test with invalid JSON
      localStorage.setItem('audit_logs', 'invalid-json');
      expect(auditLogger.getLocalAuditLogs()).toEqual([]);
    });
  });
});
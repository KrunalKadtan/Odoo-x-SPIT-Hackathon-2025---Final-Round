/**
 * Simple Test Runner for Role-Based Login Redirect System
 * 
 * This is a lightweight test runner that executes integration tests
 * without requiring a full testing framework like Jest.
 */

import { roleDetectionService } from '../services/roleDetectionService.js';
import { redirectManager } from '../services/redirectManager.js';
import { securityValidator } from '../services/securityValidator.js';

// Simple test framework implementation
class SimpleTestFramework {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      failures: []
    };
  }

  describe(description, testSuite) {
    console.log(`\n📋 ${description}`);
    console.log('='.repeat(50));
    testSuite();
  }

  test(description, testFunction) {
    this.tests.push({ description, testFunction });
  }

  async runTests() {
    console.log('🚀 Starting Role-Based Login Redirect Integration Tests\n');
    
    for (const { description, testFunction } of this.tests) {
      try {
        await testFunction();
        this.results.passed++;
        console.log(`✅ ${description}`);
      } catch (error) {
        this.results.failed++;
        this.results.failures.push({ description, error: error.message });
        console.log(`❌ ${description}`);
        console.log(`   Error: ${error.message}`);
      }
      this.results.total++;
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed} ✅`);
    console.log(`Failed: ${this.results.failed} ❌`);
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.failures.length > 0) {
      console.log('\n❌ FAILURES:');
      this.results.failures.forEach((failure, index) => {
        console.log(`${index + 1}. ${failure.description}`);
        console.log(`   ${failure.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
  }

  expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, but got ${actual}`);
        }
      },
      toBeNull: () => {
        if (actual !== null) {
          throw new Error(`Expected null, but got ${actual}`);
        }
      },
      toBeTruthy: () => {
        if (!actual) {
          throw new Error(`Expected truthy value, but got ${actual}`);
        }
      },
      toBeFalsy: () => {
        if (actual) {
          throw new Error(`Expected falsy value, but got ${actual}`);
        }
      },
      toBeGreaterThan: (expected) => {
        if (actual <= expected) {
          throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
      },
      toContain: (expected) => {
        if (!actual.includes(expected)) {
          throw new Error(`Expected ${actual} to contain ${expected}`);
        }
      }
    };
  }
}

// Create test framework instance
const testFramework = new SimpleTestFramework();
const { describe, test, expect } = testFramework;

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

// Mock global objects
global.localStorage = mockLocalStorage;
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
global.document = { referrer: '' };
global.screen = { width: 1920, height: 1080 };
global.Intl = {
  DateTimeFormat: () => ({
    resolvedOptions: () => ({ timeZone: 'UTC' })
  })
};

// Test data
const testUsers = {
  admin: { id: 1, email: 'admin@test.com', name: 'Admin User', role: 'internal' },
  customer: { id: 2, email: 'customer@test.com', name: 'Customer User', role: 'customer' },
  vendor: { id: 3, email: 'vendor@test.com', name: 'Vendor User', role: 'vendor' }
};

const testTokens = {
  admin: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiaW50ZXJuYWwifQ.test',
  customer: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiY3VzdG9tZXIifQ.test',
  vendor: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidmVuZG9yIn0.test'
};

// Test suites
describe('Service Integration Tests', () => {
  
  test('All services should be available and functional', () => {
    expect(roleDetectionService).toBeTruthy();
    expect(redirectManager).toBeTruthy();
    expect(securityValidator).toBeTruthy();
    
    expect(typeof roleDetectionService.detectRole).toBe('function');
    expect(typeof redirectManager.determineRedirectUrl).toBe('function');
    expect(typeof securityValidator.validateAndSanitizeUrl).toBe('function');
  });

  test('Admin user complete login flow', async () => {
    mockLocalStorage.clear();
    
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

  test('Customer user complete login flow', async () => {
    mockLocalStorage.clear();
    
    const customerUser = testUsers.customer;
    const customerToken = testTokens.customer;
    
    const detectedRole = await roleDetectionService.detectRole(customerUser, customerToken);
    expect(detectedRole).toBe('customer');
    
    const redirectUrl = redirectManager.determineRedirectUrl(detectedRole);
    expect(redirectUrl).toBe('/');
    
    const sanitizedUrl = securityValidator.validateAndSanitizeUrl(redirectUrl);
    expect(sanitizedUrl).toBe('/');
  });

  test('Vendor user complete login flow', async () => {
    mockLocalStorage.clear();
    
    const vendorUser = testUsers.vendor;
    const vendorToken = testTokens.vendor;
    
    const detectedRole = await roleDetectionService.detectRole(vendorUser, vendorToken);
    expect(detectedRole).toBe('vendor');
    
    const redirectUrl = redirectManager.determineRedirectUrl(detectedRole);
    expect(redirectUrl).toBe('/');
    
    const sanitizedUrl = securityValidator.validateAndSanitizeUrl(redirectUrl);
    expect(sanitizedUrl).toBe('/');
  });
});

describe('Role Detection Tests', () => {
  
  test('Should detect admin role from profile data', async () => {
    const role = await roleDetectionService.detectRole(testUsers.admin);
    expect(role).toBe('internal');
  });

  test('Should detect customer role from profile data', async () => {
    const role = await roleDetectionService.detectRole(testUsers.customer);
    expect(role).toBe('customer');
  });

  test('Should detect vendor role from profile data', async () => {
    const role = await roleDetectionService.detectRole(testUsers.vendor);
    expect(role).toBe('vendor');
  });

  test('Should fallback to token role when profile is invalid', async () => {
    const invalidProfile = { id: 1, email: 'test@test.com' }; // No role
    const role = await roleDetectionService.detectRole(invalidProfile, testTokens.admin);
    expect(role).toBe('internal');
  });

  test('Should fallback to default role when both profile and token fail', async () => {
    const invalidProfile = { id: 1, email: 'test@test.com' };
    const invalidToken = 'invalid.token.here';
    const role = await roleDetectionService.detectRole(invalidProfile, invalidToken);
    expect(role).toBe('customer');
  });

  test('Should use cached role when available', async () => {
    mockLocalStorage.clear();
    roleDetectionService.cacheRole('test_user', 'internal');
    
    const role = await roleDetectionService.detectRole({ id: 'test_user' });
    expect(role).toBe('internal');
  });
});

describe('Redirect Logic Tests', () => {
  
  test('Should redirect admin users to admin dashboard', () => {
    const redirectUrl = redirectManager.determineRedirectUrl('internal');
    expect(redirectUrl).toBe('/admin/dashboard');
  });

  test('Should redirect customer users to home page', () => {
    const redirectUrl = redirectManager.determineRedirectUrl('customer');
    expect(redirectUrl).toBe('/');
  });

  test('Should redirect vendor users to home page', () => {
    const redirectUrl = redirectManager.determineRedirectUrl('vendor');
    expect(redirectUrl).toBe('/');
  });

  test('Should handle valid return URL for admin users', () => {
    const returnUrl = '/admin/users';
    const redirectUrl = redirectManager.determineRedirectUrl('internal', returnUrl);
    expect(redirectUrl).toBe('/admin/users');
  });

  test('Should reject invalid return URL for non-admin users', () => {
    const returnUrl = '/admin/users';
    const redirectUrl = redirectManager.determineRedirectUrl('customer', returnUrl);
    expect(redirectUrl).toBe('/'); // Should fallback to default
  });

  test('Should handle valid return URL for regular users', () => {
    const returnUrl = '/shop/electronics';
    const redirectUrl = redirectManager.determineRedirectUrl('customer', returnUrl);
    expect(redirectUrl).toBe('/shop/electronics');
  });

  test('Should validate admin route access correctly', () => {
    expect(redirectManager.validateReturnUrl('/admin/dashboard', 'internal')).toBe(true);
    expect(redirectManager.validateReturnUrl('/admin/dashboard', 'customer')).toBe(false);
    expect(redirectManager.validateReturnUrl('/shop', 'customer')).toBe(true);
  });
});

describe('Security Validation Tests', () => {
  
  test('Should validate same-origin URLs', () => {
    expect(securityValidator.validateDomain('/shop')).toBe(true);
    expect(securityValidator.validateDomain('https://localhost/shop')).toBe(true);
    expect(securityValidator.validateDomain('https://evil.com/shop')).toBe(false);
  });

  test('Should sanitize URL parameters', () => {
    const dirtyUrl = '/shop?search=<script>&category=electronics';
    const cleanUrl = securityValidator.sanitizeUrlParameters(dirtyUrl);
    expect(cleanUrl).toBe('/shop?category=electronics');
  });

  test('Should detect and block malicious URLs', () => {
    const maliciousUrls = [
      'javascript:alert("xss")',
      'data:text/html,<script>alert("xss")</script>'
    ];
    
    maliciousUrls.forEach(url => {
      const sanitized = securityValidator.validateAndSanitizeUrl(url);
      expect(sanitized).toBeNull();
    });
  });

  test('Should check admin access permissions', () => {
    expect(securityValidator.checkAdminAccess('/admin/dashboard', 'internal')).toBe(true);
    expect(securityValidator.checkAdminAccess('/admin/dashboard', 'customer')).toBe(false);
    expect(securityValidator.checkAdminAccess('/shop', 'customer')).toBe(true);
  });

  test('Should track suspicious activity', () => {
    const userId = 'test_user';
    const suspiciousUrl = 'javascript:alert("xss")';
    
    const isSuspicious = securityValidator.detectSuspiciousActivity(userId, suspiciousUrl);
    expect(isSuspicious).toBe(true);
    
    const activityCount = securityValidator.getSuspiciousActivityCount(userId);
    expect(activityCount).toBeGreaterThan(0);
  });
});

describe('Error Handling Tests', () => {
  
  test('Should handle invalid role gracefully', () => {
    const redirectUrl = redirectManager.determineRedirectUrl('invalid_role');
    expect(redirectUrl).toBe('/'); // Should fallback to default
  });

  test('Should handle null URL in security validator', () => {
    const sanitized = securityValidator.validateAndSanitizeUrl(null);
    expect(sanitized).toBeNull();
  });

  test('Should handle undefined URL in security validator', () => {
    const sanitized = securityValidator.validateAndSanitizeUrl(undefined);
    expect(sanitized).toBeNull();
  });
});

describe('Cache Consistency Tests', () => {
  
  test('Should maintain role cache consistency', () => {
    mockLocalStorage.clear();
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

  test('Should handle cache expiration', () => {
    mockLocalStorage.clear();
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
});

describe('Complete Integration Scenarios', () => {
  
  test('Should handle complete admin login with return URL', async () => {
    mockLocalStorage.clear();
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

  test('Should handle customer login with invalid admin return URL', async () => {
    mockLocalStorage.clear();
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

  test('Should handle login with malicious return URL', async () => {
    mockLocalStorage.clear();
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

  test('Should handle network failure during role detection', async () => {
    mockLocalStorage.clear();
    const userData = { id: 1, email: 'test@test.com' }; // No role in profile
    const invalidToken = 'invalid.token';
    
    // This should trigger the fallback chain and end with default role
    const detectedRole = await roleDetectionService.detectRole(userData, invalidToken);
    const finalDestination = redirectManager.determineRedirectUrl(detectedRole);
    
    expect(detectedRole).toBe('customer'); // Default fallback
    expect(finalDestination).toBe('/'); // Default route for customer
  });
});

// Run the tests
testFramework.runTests().then(() => {
  console.log('\n🎉 Role-Based Login Redirect Integration Tests Complete!');
}).catch((error) => {
  console.error('❌ Test runner failed:', error);
});
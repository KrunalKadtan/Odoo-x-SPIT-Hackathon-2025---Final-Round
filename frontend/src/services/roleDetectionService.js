import { userAPI, tokenUtils } from '../utils/api';

/**
 * Role Detection Service
 * Handles role detection from various sources with fallback mechanisms
 * Implements caching and validation for reliable role determination
 */

// Valid user roles in the system
const VALID_ROLES = ['internal', 'customer', 'vendor'];
const DEFAULT_ROLE = 'customer';
const CACHE_KEY_PREFIX = 'role_cache_';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Role Detection Service
 */
export const roleDetectionService = {
  /**
   * Detect user role from available sources with fallback chain
   * Priority: Profile API -> JWT Token -> Default Role
   * @param {Object} userData - User data from authentication
   * @param {string} tokenData - JWT token data
   * @returns {Promise<string>} Detected user role
   */
  detectRole: async (userData = null, tokenData = null) => {
    try {
      // Try to get role from user profile (primary source)
      if (userData && userData.role) {
        const profileRole = roleDetectionService.extractRoleFromProfile(userData);
        if (profileRole) {
          roleDetectionService.cacheRole(userData.id || userData.email, profileRole);
          return profileRole;
        }
      }

      // Fallback 1: Try to fetch fresh profile data
      try {
        const profileData = await userAPI.getProfile();
        const profileRole = roleDetectionService.extractRoleFromProfile(profileData);
        if (profileRole) {
          roleDetectionService.cacheRole(profileData.id || profileData.email, profileRole);
          return profileRole;
        }
      } catch (profileError) {
        console.warn('Profile fetch failed during role detection:', profileError);
      }

      // Fallback 2: Try to extract role from JWT token
      const token = tokenData || tokenUtils.getAccessToken();
      if (token) {
        const tokenRole = roleDetectionService.extractRoleFromToken(token);
        if (tokenRole) {
          const userId = userData?.id || userData?.email || 'unknown';
          roleDetectionService.cacheRole(userId, tokenRole);
          return tokenRole;
        }
      }

      // Fallback 3: Check cached role
      const userId = userData?.id || userData?.email;
      if (userId) {
        const cachedRole = roleDetectionService.getCachedRole(userId);
        if (cachedRole) {
          return cachedRole;
        }
      }

      // Final fallback: Default role
      console.warn('Role detection failed, using default role:', DEFAULT_ROLE);
      return DEFAULT_ROLE;

    } catch (error) {
      console.error('Role detection error:', error);
      return DEFAULT_ROLE;
    }
  },

  /**
   * Extract role from user profile data
   * @param {Object} profileData - User profile data
   * @returns {string|null} Extracted role or null if invalid
   */
  extractRoleFromProfile: (profileData) => {
    if (!profileData || typeof profileData !== 'object') {
      return null;
    }

    const role = profileData.role || profileData.user_role || profileData.userRole;
    return roleDetectionService.validateRole(role) ? role : null;
  },

  /**
   * Extract role from JWT token payload
   * @param {string} token - JWT token string
   * @returns {string|null} Extracted role or null if invalid
   */
  extractRoleFromToken: (token) => {
    try {
      if (!token || typeof token !== 'string') {
        return null;
      }

      // JWT tokens have 3 parts separated by dots
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // Decode the payload (second part)
      const payload = JSON.parse(atob(parts[1]));
      
      // Look for role in various possible fields
      const role = payload.role || payload.user_role || payload.userRole || payload.user?.role;
      
      return roleDetectionService.validateRole(role) ? role : null;
    } catch (error) {
      console.warn('Failed to extract role from token:', error);
      return null;
    }
  },

  /**
   * Validate if a role is valid
   * @param {string} role - Role to validate
   * @returns {boolean} True if role is valid
   */
  validateRole: (role) => {
    return typeof role === 'string' && VALID_ROLES.includes(role);
  },

  /**
   * Resolve role conflicts when multiple roles are detected
   * Priority: internal > vendor > customer
   * @param {Array<string>} roles - Array of detected roles
   * @returns {string} Resolved role
   */
  resolveRoleConflict: (roles) => {
    if (!Array.isArray(roles) || roles.length === 0) {
      return DEFAULT_ROLE;
    }

    // Filter valid roles
    const validRoles = roles.filter(role => roleDetectionService.validateRole(role));
    
    if (validRoles.length === 0) {
      return DEFAULT_ROLE;
    }

    // Priority order: internal (admin) > vendor > customer
    const priorityOrder = ['internal', 'vendor', 'customer'];
    
    for (const priorityRole of priorityOrder) {
      if (validRoles.includes(priorityRole)) {
        return priorityRole;
      }
    }

    return validRoles[0]; // Fallback to first valid role
  },

  /**
   * Cache role information in localStorage
   * @param {string} userId - User identifier
   * @param {string} role - User role to cache
   */
  cacheRole: (userId, role) => {
    try {
      if (!userId || !roleDetectionService.validateRole(role)) {
        return;
      }

      const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
      const cacheData = {
        role,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_EXPIRY_MS
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache role:', error);
    }
  },

  /**
   * Get cached role information
   * @param {string} userId - User identifier
   * @returns {string|null} Cached role or null if not found/expired
   */
  getCachedRole: (userId) => {
    try {
      if (!userId) {
        return null;
      }

      const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (!cachedData) {
        return null;
      }

      const parsed = JSON.parse(cachedData);
      
      // Check if cache is expired
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      // Validate cached role
      if (!roleDetectionService.validateRole(parsed.role)) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return parsed.role;
    } catch (error) {
      console.warn('Failed to get cached role:', error);
      return null;
    }
  },

  /**
   * Clear cached role for a user
   * @param {string} userId - User identifier
   */
  clearCachedRole: (userId) => {
    try {
      if (userId) {
        const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
        localStorage.removeItem(cacheKey);
      }
    } catch (error) {
      console.warn('Failed to clear cached role:', error);
    }
  },

  /**
   * Clear all cached roles
   */
  clearAllCachedRoles: () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear all cached roles:', error);
    }
  },

  /**
   * Get role detection statistics for monitoring
   * @returns {Object} Role detection statistics
   */
  getDetectionStats: () => {
    try {
      const keys = Object.keys(localStorage);
      const roleCacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      
      const stats = {
        totalCachedRoles: roleCacheKeys.length,
        roleDistribution: {},
        expiredEntries: 0,
        validEntries: 0
      };

      roleCacheKeys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          const isExpired = Date.now() > data.expiresAt;
          
          if (isExpired) {
            stats.expiredEntries++;
          } else {
            stats.validEntries++;
            stats.roleDistribution[data.role] = (stats.roleDistribution[data.role] || 0) + 1;
          }
        } catch (error) {
          // Invalid cache entry
          stats.expiredEntries++;
        }
      });

      return stats;
    } catch (error) {
      console.warn('Failed to get detection stats:', error);
      return {
        totalCachedRoles: 0,
        roleDistribution: {},
        expiredEntries: 0,
        validEntries: 0
      };
    }
  },

  /**
   * Cleanup expired role cache entries
   */
  cleanupExpiredCache: () => {
    try {
      const keys = Object.keys(localStorage);
      const roleCacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      
      let cleanedCount = 0;
      
      roleCacheKeys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (Date.now() > data.expiresAt) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        } catch (error) {
          // Invalid cache entry, remove it
          localStorage.removeItem(key);
          cleanedCount++;
        }
      });

      console.log(`Cleaned up ${cleanedCount} expired role cache entries`);
      return cleanedCount;
    } catch (error) {
      console.warn('Failed to cleanup expired cache:', error);
      return 0;
    }
  },

  /**
   * Check if user has admin role
   * @param {string} role - User role to check
   * @returns {boolean} True if user has admin role
   */
  isAdminRole: (role) => {
    return role === 'internal';
  },

  /**
   * Check if user has vendor role
   * @param {string} role - User role to check
   * @returns {boolean} True if user has vendor role
   */
  isVendorRole: (role) => {
    return role === 'vendor';
  },

  /**
   * Check if user has customer role
   * @param {string} role - User role to check
   * @returns {boolean} True if user has customer role
   */
  isCustomerRole: (role) => {
    return role === 'customer';
  },

  /**
   * Get all valid roles
   * @returns {Array<string>} Array of valid roles
   */
  getValidRoles: () => {
    return [...VALID_ROLES];
  },

  /**
   * Get default role
   * @returns {string} Default role
   */
  getDefaultRole: () => {
    return DEFAULT_ROLE;
  }
};

// Setup automatic cache cleanup (runs every 10 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    roleDetectionService.cleanupExpiredCache();
  }, 10 * 60 * 1000);
}

export default roleDetectionService;
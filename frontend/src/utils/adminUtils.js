import { tokenUtils } from './api';

/**
 * Admin utility functions for role verification and access control
 */
export const adminUtils = {
  /**
   * Check if current user has admin role (internal)
   * @returns {boolean} True if user is admin, false otherwise
   */
  isAdmin: () => {
    try {
      const userData = tokenUtils.getUserData();
      return userData && userData.role === 'internal';
    } catch (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
  },

  /**
   * Check if current user is authenticated and has admin role
   * @returns {boolean} True if user is authenticated admin, false otherwise
   */
  isAuthenticatedAdmin: () => {
    return tokenUtils.isAuthenticated() && adminUtils.isAdmin();
  },

  /**
   * Get admin user data
   * @returns {Object|null} Admin user data or null if not admin
   */
  getAdminUserData: () => {
    if (adminUtils.isAdmin()) {
      return tokenUtils.getUserData();
    }
    return null;
  },

  /**
   * Check if user has specific admin permissions
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  hasPermission: (permission) => {
    // For now, all internal users have all admin permissions
    // This can be extended later for granular permissions
    return adminUtils.isAdmin();
  },

  /**
   * Validate admin session and redirect if invalid
   * @returns {boolean} True if valid admin session
   */
  validateAdminSession: () => {
    if (!tokenUtils.isAuthenticated()) {
      console.warn('Admin access denied: Not authenticated');
      return false;
    }

    if (!adminUtils.isAdmin()) {
      console.warn('Admin access denied: Insufficient privileges');
      return false;
    }

    return true;
  },

  /**
   * Clear admin session and redirect to login
   */
  clearAdminSession: () => {
    tokenUtils.clearTokens();
    window.location.href = '/signin';
  },

  /**
   * Log admin action for audit trail
   * @param {string} action - Action performed
   * @param {Object} details - Additional details
   */
  logAdminAction: (action, details = {}) => {
    const adminUser = adminUtils.getAdminUserData();
    if (adminUser) {
      console.log('Admin Action:', {
        timestamp: new Date().toISOString(),
        admin: adminUser.email,
        action,
        details
      });
      
      // TODO: Send to backend audit logging API
      // This would be implemented when audit logging API is available
    }
  }
};

export default adminUtils;
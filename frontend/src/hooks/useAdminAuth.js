import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminUtils } from '../utils/adminUtils';
import { tokenUtils } from '../utils/api';

/**
 * Custom hook for admin authentication and authorization
 * Provides admin session management and security monitoring
 */
export const useAdminAuth = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAuth = () => {
      try {
        const isAuthenticated = tokenUtils.isAuthenticated();
        const isAdmin = adminUtils.isAdmin();
        const userData = tokenUtils.getUserData();

        if (isAuthenticated && isAdmin) {
          setIsAdminAuthenticated(true);
          setAdminUser(userData);
        } else {
          setIsAdminAuthenticated(false);
          setAdminUser(null);
          
          // Log unauthorized access attempt
          console.warn('Admin authentication failed:', {
            authenticated: isAuthenticated,
            hasAdminRole: isAdmin,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Admin authentication check failed:', error);
        setIsAdminAuthenticated(false);
        setAdminUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();

    // Set up periodic auth check (every 5 minutes)
    const authCheckInterval = setInterval(checkAdminAuth, 5 * 60 * 1000);

    return () => clearInterval(authCheckInterval);
  }, []);

  /**
   * Logout admin user and redirect to signin
   */
  const logoutAdmin = () => {
    adminUtils.logAdminAction('admin_logout');
    adminUtils.clearAdminSession();
    setIsAdminAuthenticated(false);
    setAdminUser(null);
    navigate('/signin');
  };

  /**
   * Check if admin has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} True if admin has permission
   */
  const hasPermission = (permission) => {
    return isAdminAuthenticated && adminUtils.hasPermission(permission);
  };

  /**
   * Require admin authentication, redirect if not authenticated
   */
  const requireAdminAuth = () => {
    if (!isLoading && !isAdminAuthenticated) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/signin?returnUrl=${returnUrl}`, { replace: true });
    }
  };

  return {
    isAdminAuthenticated,
    isLoading,
    adminUser,
    logoutAdmin,
    hasPermission,
    requireAdminAuth
  };
};

export default useAdminAuth;
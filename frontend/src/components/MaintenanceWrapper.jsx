import React, { useState, useEffect } from 'react';
import { adminUtils } from '../utils/adminUtils';
import settingsService from '../services/settingsService';
import MaintenancePage from '../pages/MaintenancePage';
import LoadingSpinner from './LoadingSpinner';

/**
 * Maintenance Wrapper Component
 * Checks maintenance mode status and shows maintenance page when active
 * Allows admin users to bypass maintenance mode
 */
const MaintenanceWrapper = ({ children }) => {
  const [maintenanceStatus, setMaintenanceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Check maintenance status on mount and periodically
  useEffect(() => {
    checkMaintenanceStatus();
    
    // Check maintenance status every 30 seconds
    const interval = setInterval(checkMaintenanceStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  /**
   * Check if maintenance mode is active
   */
  const checkMaintenanceStatus = async () => {
    try {
      const status = await settingsService.getMaintenanceStatus();
      setMaintenanceStatus(status);
      setError(false);
    } catch (error) {
      console.error('Failed to check maintenance status:', error);
      setError(true);
      // If we can't check maintenance status, assume it's not active
      // This prevents the app from being completely inaccessible
      setMaintenanceStatus({ isActive: false });
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking maintenance status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // If there was an error checking maintenance status, show the app normally
  // This ensures the app remains accessible even if the maintenance check fails
  if (error) {
    console.warn('Maintenance status check failed, allowing normal access');
    return children;
  }

  // Check if maintenance mode is active
  const isMaintenanceActive = maintenanceStatus?.isActive || maintenanceStatus?.maintenanceMode;
  
  // If maintenance is not active, show normal app
  if (!isMaintenanceActive) {
    return children;
  }

  // If maintenance is active but user is admin and admin access is allowed, show normal app
  const isAdmin = adminUtils.isAuthenticatedAdmin();
  const allowAdminAccess = maintenanceStatus?.allowAdminAccess !== false; // Default to true
  
  if (isAdmin && allowAdminAccess) {
    return children;
  }

  // Show maintenance page for non-admin users or when admin access is disabled
  return <MaintenancePage />;
};

export default MaintenanceWrapper;
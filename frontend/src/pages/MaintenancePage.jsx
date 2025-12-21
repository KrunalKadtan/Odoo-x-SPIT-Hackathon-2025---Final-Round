import React, { useState, useEffect } from 'react';
import { adminUtils } from '../utils/adminUtils';
import settingsService from '../services/settingsService';

/**
 * Maintenance Page - Displayed to users when maintenance mode is active
 * Shows maintenance message and estimated completion time
 */
const MaintenancePage = () => {
  const [maintenanceInfo, setMaintenanceInfo] = useState({
    message: 'We are currently performing scheduled maintenance. Please check back soon.',
    estimatedDuration: null,
    startTime: null,
    reason: null
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Load maintenance information
  useEffect(() => {
    loadMaintenanceInfo();
  }, []);

  /**
   * Load maintenance information from API
   */
  const loadMaintenanceInfo = async () => {
    try {
      const status = await settingsService.getMaintenanceStatus();
      if (status) {
        setMaintenanceInfo({
          message: status.message || maintenanceInfo.message,
          estimatedDuration: status.estimatedDuration,
          startTime: status.startTime,
          reason: status.reason
        });
      }
    } catch (error) {
      console.error('Failed to load maintenance info:', error);
      // Use default message if API fails
    }
  };

  /**
   * Calculate estimated completion time
   */
  const getEstimatedCompletion = () => {
    if (!maintenanceInfo.startTime || !maintenanceInfo.estimatedDuration) {
      return null;
    }

    try {
      const startTime = new Date(maintenanceInfo.startTime);
      const durationMatch = maintenanceInfo.estimatedDuration.match(/(\d+)\s*(hour|minute)s?/i);
      
      if (durationMatch) {
        const amount = parseInt(durationMatch[1]);
        const unit = durationMatch[2].toLowerCase();
        
        const completionTime = new Date(startTime);
        if (unit === 'hour') {
          completionTime.setHours(completionTime.getHours() + amount);
        } else if (unit === 'minute') {
          completionTime.setMinutes(completionTime.getMinutes() + amount);
        }
        
        return completionTime;
      }
    } catch (error) {
      console.error('Error calculating completion time:', error);
    }
    
    return null;
  };

  /**
   * Format time remaining
   */
  const getTimeRemaining = () => {
    const completionTime = getEstimatedCompletion();
    if (!completionTime) return null;

    const now = new Date();
    const timeDiff = completionTime.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      return 'Maintenance should be completed soon';
    }

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `Estimated completion: ${hours}h ${minutes}m`;
    } else {
      return `Estimated completion: ${minutes}m`;
    }
  };

  // Check if user is admin and can bypass maintenance mode
  const isAdmin = adminUtils.isAuthenticatedAdmin();
  
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-app-background flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-pro shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Maintenance Mode Active</h1>
            <p className="text-gray-600 mb-4">
              The system is currently in maintenance mode, but you have admin access.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Admin Notice:</strong> You can continue using the system normally. 
              Regular users will see the maintenance page until maintenance mode is disabled.
            </p>
          </div>

          <button
            onClick={() => window.location.href = '/admin/settings'}
            className="w-full bg-app-accent text-white py-3 px-4 rounded-pro font-medium hover:bg-app-accent/90 transition-colors duration-200"
          >
            Go to System Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-pro shadow-lg p-8 text-center">
        {/* Maintenance Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Under Maintenance</h1>
          <p className="text-gray-600">
            {maintenanceInfo.message}
          </p>
        </div>

        {/* Maintenance Details */}
        {(maintenanceInfo.reason || maintenanceInfo.estimatedDuration) && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            {maintenanceInfo.reason && (
              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-900 mb-1">Reason:</h3>
                <p className="text-sm text-gray-600">{maintenanceInfo.reason}</p>
              </div>
            )}
            
            {maintenanceInfo.estimatedDuration && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Duration:</h3>
                <p className="text-sm text-gray-600">{maintenanceInfo.estimatedDuration}</p>
                {getTimeRemaining() && (
                  <p className="text-sm text-blue-600 mt-1">{getTimeRemaining()}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Current Time */}
        <div className="text-sm text-gray-500 mb-6">
          Current time: {currentTime.toLocaleString()}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-app-accent text-white py-3 px-4 rounded-pro font-medium hover:bg-app-accent/90 transition-colors duration-200"
          >
            Refresh Page
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full border border-app-border text-app-main py-3 px-4 rounded-pro font-medium hover:bg-app-secondary transition-colors duration-200"
          >
            Go Back
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            We apologize for any inconvenience. Please try again later.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
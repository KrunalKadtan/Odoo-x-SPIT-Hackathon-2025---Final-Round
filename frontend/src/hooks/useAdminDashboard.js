import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../utils/api';
import { useCachedMetrics, useCachedActivity, useCachedData } from './useAdminCache';
import adminCacheService from '../services/adminCacheService';

/**
 * Custom hook for admin dashboard data management with caching
 * Handles fetching and caching of dashboard metrics, activity, and alerts
 */
export const useAdminDashboard = () => {
  const [activityPage, setActivityPage] = useState(1);
  const [allActivity, setAllActivity] = useState([]);

  // Use cached metrics with auto-refresh every minute
  const {
    data: metrics = {
      totalUsers: 0,
      totalVendors: 0,
      totalOrders: 0,
      totalRevenue: 0,
      pendingApprovals: 0,
      failedPayments: 0
    },
    loading: metricsLoading,
    error: metricsError,
    refresh: refreshMetrics
  } = useCachedMetrics(60000); // Refresh every minute

  // Use cached activity feed with auto-refresh every 30 seconds
  const {
    data: recentActivity = [],
    loading: activityLoading,
    error: activityError,
    refresh: refreshActivity
  } = useCachedActivity({ page: 1, limit: 10 }, 30000);

  // Use cached system alerts
  const {
    data: systemAlerts = [],
    loading: alertsLoading,
    error: alertsError,
    refresh: refreshAlerts
  } = useCachedData({
    type: 'systemAlerts',
    fetchFunction: async () => {
      try {
        const healthData = await adminAPI.getSystemHealth();
        // Convert system health data to alerts format
        const alerts = [];
        
        if (healthData.database !== 'healthy') {
          alerts.push({
            id: 'db_health',
            type: 'system_error',
            title: 'Database Health Issue',
            message: 'Database connection issues detected',
            priority: 'high',
            actionUrl: '/admin/system'
          });
        }
        
        // Add mock alerts for development
        alerts.push(
          {
            id: 1,
            type: 'pending_approvals',
            title: 'Pending Vendor Approvals',
            message: '12 vendor applications awaiting approval',
            count: 12,
            priority: 'medium',
            actionUrl: '/admin/vendors?status=pending'
          },
          {
            id: 2,
            type: 'failed_payments',
            title: 'Failed Payments',
            message: '3 payments failed in the last 24 hours',
            count: 3,
            priority: 'high',
            actionUrl: '/admin/orders?payment_status=failed'
          },
          {
            id: 3,
            type: 'low_stock',
            title: 'Low Stock Alert',
            message: '8 products are running low on stock',
            count: 8,
            priority: 'low',
            actionUrl: '/admin/products?stock=low'
          }
        );
        
        return alerts;
      } catch (error) {
        console.error('Error fetching system alerts:', error);
        // Return mock data for development
        return [
          {
            id: 1,
            type: 'pending_approvals',
            title: 'Pending Vendor Approvals',
            message: '12 vendor applications awaiting approval',
            count: 12,
            priority: 'medium',
            actionUrl: '/admin/vendors?status=pending'
          },
          {
            id: 2,
            type: 'failed_payments',
            title: 'Failed Payments',
            message: '3 payments failed in the last 24 hours',
            count: 3,
            priority: 'high',
            actionUrl: '/admin/orders?payment_status=failed'
          },
          {
            id: 3,
            type: 'low_stock',
            title: 'Low Stock Alert',
            message: '8 products are running low on stock',
            count: 8,
            priority: 'low',
            actionUrl: '/admin/products?stock=low'
          }
        ];
      }
    },
    refetchInterval: 120000 // Refresh every 2 minutes
  });

  // Combine loading states
  const loading = metricsLoading || activityLoading || alertsLoading;
  const error = metricsError || activityError || alertsError;

  // Load more activity for infinite scroll
  const loadMoreActivity = useCallback(async () => {
    try {
      const nextPage = activityPage + 1;
      const moreActivity = await adminAPI.getRecentActivity(10, nextPage);
      
      if (moreActivity && moreActivity.length > 0) {
        setAllActivity(prev => [...prev, ...moreActivity]);
        setActivityPage(nextPage);
        
        // Update cache with combined activity
        const combinedActivity = [...allActivity, ...moreActivity];
        adminCacheService.set('activity', combinedActivity, { page: 'all' });
        
        return moreActivity;
      }
      return [];
    } catch (error) {
      console.error('Error loading more activity:', error);
      return [];
    }
  }, [activityPage, allActivity]);

  // Check if there's more activity to load
  const hasMoreActivity = allActivity.length > 0 ? allActivity.length % 10 === 0 : true;

  // Initialize all activity with recent activity
  useEffect(() => {
    if (recentActivity && recentActivity.length > 0 && allActivity.length === 0) {
      setAllActivity(recentActivity);
    }
  }, [recentActivity, allActivity.length]);

  /**
   * Refresh all dashboard data and clear cache
   */
  const refreshDashboard = useCallback(async () => {
    try {
      // Clear relevant caches
      adminCacheService.invalidate('metrics');
      adminCacheService.invalidate('activity');
      adminCacheService.invalidate('systemAlerts');
      
      // Reset activity pagination
      setActivityPage(1);
      setAllActivity([]);
      
      // Refresh all data
      await Promise.all([
        refreshMetrics(),
        refreshActivity(),
        refreshAlerts()
      ]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    }
  }, [refreshMetrics, refreshActivity, refreshAlerts]);

  /**
   * Invalidate specific data type cache
   */
  const invalidateCache = useCallback((type) => {
    adminCacheService.invalidate(type);
  }, []);

  /**
   * Preload dashboard data
   */
  const preloadDashboard = useCallback(async () => {
    await adminCacheService.preloadDashboardData();
  }, []);

  return {
    // Data
    metrics,
    recentActivity: allActivity.length > 0 ? allActivity : recentActivity,
    systemAlerts,
    
    // Loading states
    loading,
    error,
    
    // Actions
    refreshDashboard,
    loadMoreActivity,
    hasMoreActivity,
    invalidateCache,
    preloadDashboard,
    
    // Individual refresh functions
    refreshMetrics,
    refreshActivity,
    refreshAlerts
  };
};

export default useAdminDashboard;
import { SmartCache, cacheStrategies, cacheUtils } from '../utils/cache';

/**
 * Admin Dashboard Cache Service
 * Provides intelligent caching for admin dashboard data with different strategies
 */
class AdminCacheService {
  constructor() {
    this.cache = new SmartCache({
      memoryTTL: 2 * 60 * 1000, // 2 minutes for memory
      persistentTTL: 10 * 60 * 1000, // 10 minutes for persistent
      maxMemorySize: 200,
      prefix: 'admin_cache_'
    });

    // Cache strategies for different data types
    this.strategies = {
      // Dashboard metrics - cache for 1 minute (frequently updated)
      metrics: {
        memoryTTL: 1 * 60 * 1000,
        persistentTTL: 2 * 60 * 1000,
        key: 'dashboard_metrics'
      },

      // User data - cache for 5 minutes
      users: {
        memoryTTL: 5 * 60 * 1000,
        persistentTTL: 10 * 60 * 1000,
        keyPrefix: 'users_'
      },

      // Vendor data - cache for 3 minutes
      vendors: {
        memoryTTL: 3 * 60 * 1000,
        persistentTTL: 8 * 60 * 1000,
        keyPrefix: 'vendors_'
      },

      // Order data - cache for 2 minutes
      orders: {
        memoryTTL: 2 * 60 * 1000,
        persistentTTL: 5 * 60 * 1000,
        keyPrefix: 'orders_'
      },

      // Product data - cache for 5 minutes
      products: {
        memoryTTL: 5 * 60 * 1000,
        persistentTTL: 15 * 60 * 1000,
        keyPrefix: 'products_'
      },

      // Analytics data - cache for 10 minutes
      analytics: {
        memoryTTL: 10 * 60 * 1000,
        persistentTTL: 30 * 60 * 1000,
        keyPrefix: 'analytics_'
      },

      // Reports - cache for 15 minutes
      reports: {
        memoryTTL: 15 * 60 * 1000,
        persistentTTL: 60 * 60 * 1000, // 1 hour
        keyPrefix: 'reports_'
      },

      // System settings - cache for 30 minutes
      settings: {
        memoryTTL: 30 * 60 * 1000,
        persistentTTL: 2 * 60 * 60 * 1000, // 2 hours
        key: 'system_settings'
      },

      // Activity feed - cache for 30 seconds
      activity: {
        memoryTTL: 30 * 1000,
        persistentTTL: 2 * 60 * 1000,
        keyPrefix: 'activity_'
      },

      // Audit logs - cache for 5 minutes
      auditLogs: {
        memoryTTL: 5 * 60 * 1000,
        persistentTTL: 15 * 60 * 1000,
        keyPrefix: 'audit_logs_'
      },

      // System alerts - cache for 1 minute
      systemAlerts: {
        memoryTTL: 1 * 60 * 1000,
        persistentTTL: 3 * 60 * 1000,
        keyPrefix: 'system_alerts_'
      },

      // Security events - cache for 2 minutes
      securityEvents: {
        memoryTTL: 2 * 60 * 1000,
        persistentTTL: 5 * 60 * 1000,
        keyPrefix: 'security_events_'
      },

      // Notifications - cache for 30 seconds
      notifications: {
        memoryTTL: 30 * 1000,
        persistentTTL: 2 * 60 * 1000,
        keyPrefix: 'notifications_'
      }
    };

    // Initialize cache cleanup interval
    this.setupCleanupInterval();
  }

  /**
   * Generate cache key with parameters
   */
  generateKey(type, params = {}) {
    const strategy = this.strategies[type];
    if (!strategy) {
      throw new Error(`Unknown cache type: ${type}`);
    }

    if (strategy.key) {
      return strategy.key;
    }

    return cacheUtils.generateKey(strategy.keyPrefix, params);
  }

  /**
   * Get cached data
   */
  get(type, params = {}) {
    const key = this.generateKey(type, params);
    return this.cache.get(key);
  }

  /**
   * Set cached data
   */
  set(type, data, params = {}) {
    const key = this.generateKey(type, params);
    const strategy = this.strategies[type];
    
    return this.cache.set(key, data, {
      memoryTTL: strategy.memoryTTL,
      persistentTTL: strategy.persistentTTL
    });
  }

  /**
   * Cached API call wrapper
   */
  async cachedApiCall(type, apiFunction, params = {}) {
    const key = this.generateKey(type, params);
    const strategy = this.strategies[type];

    return cacheUtils.cachedApiCall(key, apiFunction, {
      memoryTTL: strategy.memoryTTL,
      persistentTTL: strategy.persistentTTL
    });
  }

  /**
   * Invalidate cache by type
   */
  invalidate(type, params = {}) {
    if (params && Object.keys(params).length > 0) {
      // Invalidate specific cache entry
      const key = this.generateKey(type, params);
      this.cache.delete(key);
    } else {
      // Invalidate all entries of this type
      const strategy = this.strategies[type];
      if (strategy.key) {
        this.cache.delete(strategy.key);
      } else if (strategy.keyPrefix) {
        cacheUtils.invalidatePattern(`^${strategy.keyPrefix}`);
      }
    }
  }

  /**
   * Invalidate related caches when data changes
   */
  invalidateRelated(type, data = {}) {
    switch (type) {
      case 'user_updated':
        this.invalidate('users');
        this.invalidate('metrics');
        this.invalidate('activity');
        break;

      case 'vendor_updated':
        this.invalidate('vendors');
        this.invalidate('metrics');
        this.invalidate('activity');
        break;

      case 'order_updated':
        this.invalidate('orders');
        this.invalidate('metrics');
        this.invalidate('analytics');
        this.invalidate('activity');
        break;

      case 'product_updated':
        this.invalidate('products');
        this.invalidate('activity');
        if (data.vendorId) {
          this.invalidate('vendors', { vendorId: data.vendorId });
        }
        break;

      case 'settings_updated':
        this.invalidate('settings');
        break;

      case 'system_activity':
        this.invalidate('activity');
        this.invalidate('metrics');
        break;

      default:
        break;
    }
  }

  /**
   * Preload critical dashboard data
   */
  async preloadDashboardData() {
    const criticalData = [
      'metrics',
      'activity',
      'settings'
    ];

    const preloadPromises = criticalData.map(async (type) => {
      try {
        // This would be replaced with actual API calls
        const data = await this.fetchDataByType(type);
        this.set(type, data);
      } catch (error) {
        console.warn(`Failed to preload ${type}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Smart cache warming based on user behavior
   */
  warmCache(userBehavior = {}) {
    const { frequentlyAccessed = [], recentlyViewed = [] } = userBehavior;

    // Warm cache for frequently accessed data
    frequentlyAccessed.forEach(({ type, params }) => {
      this.prefetchData(type, params);
    });

    // Warm cache for recently viewed data
    recentlyViewed.forEach(({ type, params }) => {
      this.prefetchData(type, params);
    });
  }

  /**
   * Prefetch data in background
   */
  async prefetchData(type, params = {}) {
    try {
      const data = await this.fetchDataByType(type, params);
      this.set(type, data, params);
    } catch (error) {
      console.warn(`Failed to prefetch ${type}:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const stats = this.cache.getStats();
    
    return {
      ...stats,
      strategies: Object.keys(this.strategies).length,
      hitRate: this.calculateHitRate(),
      topCachedTypes: this.getTopCachedTypes()
    };
  }

  /**
   * Calculate cache hit rate
   */
  calculateHitRate() {
    // This would be implemented with actual hit/miss tracking
    return 0.85; // Placeholder
  }

  /**
   * Get most cached data types
   */
  getTopCachedTypes() {
    // This would analyze cache keys to determine most used types
    return ['metrics', 'users', 'activity', 'vendors', 'orders'];
  }

  /**
   * Setup automatic cache cleanup
   */
  setupCleanupInterval() {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cache.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Clear all admin cache
   */
  clearAll() {
    this.cache.clear();
  }

  /**
   * Export cache data for debugging
   */
  exportCacheData() {
    return {
      stats: this.getStats(),
      keys: this.cache.keys ? this.cache.keys() : [],
      strategies: this.strategies
    };
  }

  /**
   * Placeholder for actual data fetching
   * This would be replaced with real API calls
   */
  async fetchDataByType(type, params = {}) {
    // This is a placeholder - in real implementation,
    // this would make actual API calls based on type
    switch (type) {
      case 'metrics':
        return { totalUsers: 1500, totalVendors: 250, totalOrders: 5000, totalRevenue: 125000 };
      case 'users':
        return [];
      case 'vendors':
        return [];
      case 'orders':
        return [];
      case 'products':
        return [];
      case 'analytics':
        return {};
      case 'reports':
        return {};
      case 'settings':
        return {};
      case 'activity':
        return [];
      case 'auditLogs':
        return [];
      case 'systemAlerts':
        return [];
      case 'securityEvents':
        return [];
      case 'notifications':
        return [];
      default:
        throw new Error(`Unknown data type: ${type}`);
    }
  }
}

// Create singleton instance
const adminCacheService = new AdminCacheService();

// Cache-aware API wrapper functions
export const cachedApiCalls = {
  // Dashboard metrics
  getDashboardMetrics: () => 
    adminCacheService.cachedApiCall('metrics', async () => {
      // Replace with actual API call
      const response = await fetch('/api/admin/dashboard/metrics');
      return response.json();
    }),

  // User management
  getUsers: (params = {}) =>
    adminCacheService.cachedApiCall('users', async () => {
      const response = await fetch(`/api/admin/users?${new URLSearchParams(params)}`);
      return response.json();
    }, params),

  // Vendor management
  getVendors: (params = {}) =>
    adminCacheService.cachedApiCall('vendors', async () => {
      const response = await fetch(`/api/admin/vendors?${new URLSearchParams(params)}`);
      return response.json();
    }, params),

  // Order management
  getOrders: (params = {}) =>
    adminCacheService.cachedApiCall('orders', async () => {
      const response = await fetch(`/api/admin/orders?${new URLSearchParams(params)}`);
      return response.json();
    }, params),

  // Product management
  getProducts: (params = {}) =>
    adminCacheService.cachedApiCall('products', async () => {
      const response = await fetch(`/api/admin/products?${new URLSearchParams(params)}`);
      return response.json();
    }, params),

  // Analytics
  getAnalytics: (params = {}) =>
    adminCacheService.cachedApiCall('analytics', async () => {
      const response = await fetch(`/api/admin/analytics?${new URLSearchParams(params)}`);
      return response.json();
    }, params),

  // Reports
  getReports: (params = {}) =>
    adminCacheService.cachedApiCall('reports', async () => {
      const response = await fetch(`/api/admin/reports?${new URLSearchParams(params)}`);
      return response.json();
    }, params),

  // System settings
  getSystemSettings: () =>
    adminCacheService.cachedApiCall('settings', async () => {
      const response = await fetch('/api/admin/settings');
      return response.json();
    }),

  // Activity feed
  getActivity: (params = {}) =>
    adminCacheService.cachedApiCall('activity', async () => {
      const response = await fetch(`/api/admin/activity?${new URLSearchParams(params)}`);
      return response.json();
    }, params),

  // Audit logs
  getAuditLogs: (params = {}) =>
    adminCacheService.cachedApiCall('auditLogs', async () => {
      const response = await fetch(`/api/admin/audit-logs?${new URLSearchParams(params)}`);
      return response.json();
    }, params),

  // System alerts
  getSystemAlerts: (params = {}) =>
    adminCacheService.cachedApiCall('systemAlerts', async () => {
      const response = await fetch(`/api/admin/system/system-health?${new URLSearchParams(params)}`);
      return response.json();
    }, params),

  // Security events
  getSecurityEvents: (params = {}) =>
    adminCacheService.cachedApiCall('securityEvents', async () => {
      const response = await fetch(`/api/admin/security/events?${new URLSearchParams(params)}`);
      return response.json();
    }, params),

  // Notifications
  getNotifications: (params = {}) =>
    adminCacheService.cachedApiCall('notifications', async () => {
      const response = await fetch(`/api/admin/notifications?${new URLSearchParams(params)}`);
      return response.json();
    }, params)
};

export default adminCacheService;
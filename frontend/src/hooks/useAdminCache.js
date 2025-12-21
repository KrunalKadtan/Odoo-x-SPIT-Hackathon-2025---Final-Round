import { useState, useEffect, useCallback, useRef } from 'react';
import adminCacheService, { cachedApiCalls } from '../services/adminCacheService';

/**
 * Hook for using admin cache service
 */
export const useAdminCache = () => {
  const [cacheStats, setCacheStats] = useState(null);

  const updateStats = useCallback(() => {
    setCacheStats(adminCacheService.getStats());
  }, []);

  useEffect(() => {
    updateStats();
    
    // Update stats periodically
    const interval = setInterval(updateStats, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [updateStats]);

  const invalidate = useCallback((type, params) => {
    adminCacheService.invalidate(type, params);
    updateStats();
  }, [updateStats]);

  const invalidateRelated = useCallback((type, data) => {
    adminCacheService.invalidateRelated(type, data);
    updateStats();
  }, [updateStats]);

  const clearAll = useCallback(() => {
    adminCacheService.clearAll();
    updateStats();
  }, [updateStats]);

  const preloadDashboard = useCallback(async () => {
    await adminCacheService.preloadDashboardData();
    updateStats();
  }, [updateStats]);

  return {
    cacheStats,
    invalidate,
    invalidateRelated,
    clearAll,
    preloadDashboard,
    updateStats
  };
};

/**
 * Hook for cached data fetching with automatic cache management
 */
export const useCachedData = ({
  type,
  params = {},
  fetchFunction,
  dependencies = [],
  enabled = true,
  refetchOnWindowFocus = false,
  refetchInterval = 0
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const abortControllerRef = useRef();

  // Generate cache key
  const cacheKey = adminCacheService.generateKey(type, params);

  // Fetch data function
  const fetchData = useCallback(async (force = false) => {
    if (!enabled || loading) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache first (unless forced)
    if (!force) {
      const cachedData = adminCacheService.get(type, params);
      if (cachedData) {
        setData(cachedData);
        setError(null);
        return cachedData;
      }
    }

    setLoading(true);
    setError(null);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      let result;
      
      if (fetchFunction) {
        result = await fetchFunction(abortControllerRef.current.signal);
      } else if (cachedApiCalls[type]) {
        result = await cachedApiCalls[type](params);
      } else {
        throw new Error(`No fetch function provided for type: ${type}`);
      }

      // Cache the result
      adminCacheService.set(type, result, params);
      
      setData(result);
      setLastFetch(Date.now());
      return result;
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err);
        console.error(`Failed to fetch ${type}:`, err);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [type, params, fetchFunction, enabled, loading]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [fetchData, enabled, ...dependencies]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (enabled && !loading) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, enabled, loading, fetchData]);

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval || refetchInterval <= 0) return;

    const interval = setInterval(() => {
      if (enabled && !loading) {
        fetchData();
      }
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, enabled, loading, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Invalidate cache for this data
  const invalidate = useCallback(() => {
    adminCacheService.invalidate(type, params);
  }, [type, params]);

  return {
    data,
    loading,
    error,
    lastFetch,
    refresh,
    invalidate,
    cacheKey
  };
};

/**
 * Hook for cached dashboard metrics
 */
export const useCachedMetrics = (refetchInterval = 60000) => {
  return useCachedData({
    type: 'metrics',
    fetchFunction: async () => {
      const { adminAPI } = await import('../utils/api');
      return await adminAPI.getDashboardMetrics();
    },
    refetchInterval,
    refetchOnWindowFocus: true
  });
};

/**
 * Hook for cached user data
 */
export const useCachedUsers = (params = {}) => {
  return useCachedData({
    type: 'users',
    params,
    dependencies: [JSON.stringify(params)]
  });
};

/**
 * Hook for cached vendor data
 */
export const useCachedVendors = (params = {}) => {
  return useCachedData({
    type: 'vendors',
    params,
    dependencies: [JSON.stringify(params)]
  });
};

/**
 * Hook for cached order data
 */
export const useCachedOrders = (params = {}) => {
  return useCachedData({
    type: 'orders',
    params,
    dependencies: [JSON.stringify(params)]
  });
};

/**
 * Hook for cached product data
 */
export const useCachedProducts = (params = {}) => {
  return useCachedData({
    type: 'products',
    params,
    dependencies: [JSON.stringify(params)]
  });
};

/**
 * Hook for cached analytics data
 */
export const useCachedAnalytics = (params = {}) => {
  return useCachedData({
    type: 'analytics',
    params,
    dependencies: [JSON.stringify(params)]
  });
};

/**
 * Hook for cached activity feed
 */
export const useCachedActivity = (params = {}, refetchInterval = 30000) => {
  return useCachedData({
    type: 'activity',
    params,
    fetchFunction: async () => {
      const { adminAPI } = await import('../utils/api');
      return await adminAPI.getRecentActivity(params.limit || 10, params.page || 1);
    },
    refetchInterval,
    dependencies: [JSON.stringify(params)]
  });
};

/**
 * Hook for cached system settings
 */
export const useCachedSettings = () => {
  return useCachedData({
    type: 'settings',
    refetchOnWindowFocus: true
  });
};

/**
 * Hook for batch cache operations
 */
export const useBatchCache = () => {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(false);

  const addOperation = useCallback((type, params, fetchFunction) => {
    setOperations(prev => [...prev, { type, params, fetchFunction }]);
  }, []);

  const executeBatch = useCallback(async () => {
    if (operations.length === 0) return;

    setLoading(true);
    
    try {
      const promises = operations.map(async ({ type, params, fetchFunction }) => {
        try {
          if (fetchFunction) {
            const result = await fetchFunction();
            adminCacheService.set(type, result, params);
            return { type, params, result, success: true };
          } else if (cachedApiCalls[type]) {
            const result = await cachedApiCalls[type](params);
            return { type, params, result, success: true };
          }
        } catch (error) {
          return { type, params, error, success: false };
        }
      });

      const results = await Promise.allSettled(promises);
      setOperations([]);
      return results;
    } finally {
      setLoading(false);
    }
  }, [operations]);

  const clearOperations = useCallback(() => {
    setOperations([]);
  }, []);

  return {
    operations,
    loading,
    addOperation,
    executeBatch,
    clearOperations
  };
};

/**
 * Hook for cache warming based on user behavior
 */
export const useCacheWarming = () => {
  const [userBehavior, setUserBehavior] = useState({
    frequentlyAccessed: [],
    recentlyViewed: []
  });

  const trackAccess = useCallback((type, params = {}) => {
    setUserBehavior(prev => {
      const key = `${type}_${JSON.stringify(params)}`;
      const existing = prev.frequentlyAccessed.find(item => item.key === key);
      
      if (existing) {
        existing.count += 1;
        existing.lastAccessed = Date.now();
      } else {
        prev.frequentlyAccessed.push({
          key,
          type,
          params,
          count: 1,
          lastAccessed: Date.now()
        });
      }

      // Keep only top 10 most accessed
      prev.frequentlyAccessed.sort((a, b) => b.count - a.count);
      prev.frequentlyAccessed = prev.frequentlyAccessed.slice(0, 10);

      return { ...prev };
    });
  }, []);

  const trackView = useCallback((type, params = {}) => {
    setUserBehavior(prev => {
      const key = `${type}_${JSON.stringify(params)}`;
      const item = { key, type, params, viewedAt: Date.now() };
      
      // Add to recent views and keep only last 5
      prev.recentlyViewed = [item, ...prev.recentlyViewed.filter(v => v.key !== key)].slice(0, 5);
      
      return { ...prev };
    });
  }, []);

  const warmCache = useCallback(() => {
    adminCacheService.warmCache(userBehavior);
  }, [userBehavior]);

  return {
    userBehavior,
    trackAccess,
    trackView,
    warmCache
  };
};
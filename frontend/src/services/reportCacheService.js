import { SmartCache, cacheUtils } from '../utils/cache';

/**
 * Report Cache Service
 * Specialized caching for analytics reports and data exports
 */
class ReportCacheService {
  constructor() {
    this.cache = new SmartCache({
      memoryTTL: 10 * 60 * 1000, // 10 minutes for memory
      persistentTTL: 60 * 60 * 1000, // 1 hour for persistent
      maxMemorySize: 50, // Smaller memory cache for reports
      prefix: 'report_cache_'
    });

    // Report-specific cache strategies
    this.strategies = {
      // Revenue reports - cache for 15 minutes
      revenue: {
        memoryTTL: 15 * 60 * 1000,
        persistentTTL: 60 * 60 * 1000,
        keyPrefix: 'revenue_'
      },

      // User analytics - cache for 30 minutes
      userAnalytics: {
        memoryTTL: 30 * 60 * 1000,
        persistentTTL: 2 * 60 * 60 * 1000,
        keyPrefix: 'user_analytics_'
      },

      // Vendor performance - cache for 20 minutes
      vendorPerformance: {
        memoryTTL: 20 * 60 * 1000,
        persistentTTL: 90 * 60 * 1000,
        keyPrefix: 'vendor_performance_'
      },

      // Order analytics - cache for 10 minutes
      orderAnalytics: {
        memoryTTL: 10 * 60 * 1000,
        persistentTTL: 30 * 60 * 1000,
        keyPrefix: 'order_analytics_'
      },

      // Product analytics - cache for 25 minutes
      productAnalytics: {
        memoryTTL: 25 * 60 * 1000,
        persistentTTL: 2 * 60 * 60 * 1000,
        keyPrefix: 'product_analytics_'
      },

      // Custom reports - cache for 45 minutes
      customReports: {
        memoryTTL: 45 * 60 * 1000,
        persistentTTL: 4 * 60 * 60 * 1000,
        keyPrefix: 'custom_reports_'
      },

      // Export data - cache for 5 minutes (shorter due to potential size)
      exports: {
        memoryTTL: 5 * 60 * 1000,
        persistentTTL: 15 * 60 * 1000,
        keyPrefix: 'exports_'
      }
    };

    // Track report generation times for optimization
    this.generationTimes = new Map();
    
    // Setup cleanup
    this.setupCleanup();
  }

  /**
   * Generate cache key for reports
   */
  generateReportKey(reportType, params = {}) {
    const strategy = this.strategies[reportType];
    if (!strategy) {
      throw new Error(`Unknown report type: ${reportType}`);
    }

    // Include date range in key for time-sensitive reports
    const keyParams = {
      ...params,
      // Normalize date ranges to ensure consistent caching
      startDate: params.startDate ? new Date(params.startDate).toISOString().split('T')[0] : undefined,
      endDate: params.endDate ? new Date(params.endDate).toISOString().split('T')[0] : undefined
    };

    return cacheUtils.generateKey(strategy.keyPrefix, keyParams);
  }

  /**
   * Get cached report data
   */
  getReport(reportType, params = {}) {
    const key = this.generateReportKey(reportType, params);
    return this.cache.get(key);
  }

  /**
   * Cache report data
   */
  setReport(reportType, data, params = {}) {
    const key = this.generateReportKey(reportType, params);
    const strategy = this.strategies[reportType];
    
    // Track generation time
    this.generationTimes.set(key, Date.now());
    
    return this.cache.set(key, data, {
      memoryTTL: strategy.memoryTTL,
      persistentTTL: strategy.persistentTTL
    });
  }

  /**
   * Generate report with caching
   */
  async generateReport(reportType, params = {}, generatorFunction) {
    const key = this.generateReportKey(reportType, params);
    
    // Check cache first
    const cachedReport = this.cache.get(key);
    if (cachedReport) {
      return {
        ...cachedReport,
        fromCache: true,
        generatedAt: this.generationTimes.get(key)
      };
    }

    // Generate new report
    const startTime = Date.now();
    
    try {
      const reportData = await generatorFunction(params);
      const generationTime = Date.now() - startTime;
      
      const report = {
        ...reportData,
        fromCache: false,
        generatedAt: startTime,
        generationTime,
        reportType,
        params
      };

      // Cache the report
      this.setReport(reportType, report, params);
      
      return report;
    } catch (error) {
      console.error(`Failed to generate ${reportType} report:`, error);
      throw error;
    }
  }

  /**
   * Invalidate reports by type or pattern
   */
  invalidateReports(reportType, params = {}) {
    if (params && Object.keys(params).length > 0) {
      // Invalidate specific report
      const key = this.generateReportKey(reportType, params);
      this.cache.delete(key);
      this.generationTimes.delete(key);
    } else {
      // Invalidate all reports of this type
      const strategy = this.strategies[reportType];
      if (strategy) {
        cacheUtils.invalidatePattern(`^${strategy.keyPrefix}`);
        
        // Clear generation times for this type
        for (const [key] of this.generationTimes) {
          if (key.startsWith(strategy.keyPrefix)) {
            this.generationTimes.delete(key);
          }
        }
      }
    }
  }

  /**
   * Preload commonly requested reports
   */
  async preloadCommonReports() {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const commonReports = [
      // Daily revenue
      {
        type: 'revenue',
        params: {
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
          period: 'daily'
        }
      },
      // Weekly revenue
      {
        type: 'revenue',
        params: {
          startDate: lastWeek.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
          period: 'weekly'
        }
      },
      // Monthly user analytics
      {
        type: 'userAnalytics',
        params: {
          startDate: lastMonth.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
          period: 'monthly'
        }
      }
    ];

    const preloadPromises = commonReports.map(async ({ type, params }) => {
      try {
        // This would be replaced with actual report generation
        await this.generateReport(type, params, async () => {
          return await this.mockReportGeneration(type, params);
        });
      } catch (error) {
        console.warn(`Failed to preload ${type} report:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Get report generation statistics
   */
  getReportStats() {
    const stats = this.cache.getStats();
    const generationStats = Array.from(this.generationTimes.entries()).map(([key, time]) => ({
      key,
      generatedAt: time,
      age: Date.now() - time
    }));

    return {
      ...stats,
      totalReports: generationStats.length,
      averageAge: generationStats.reduce((sum, stat) => sum + stat.age, 0) / generationStats.length,
      oldestReport: Math.max(...generationStats.map(s => s.age)),
      newestReport: Math.min(...generationStats.map(s => s.age))
    };
  }

  /**
   * Optimize cache based on usage patterns
   */
  optimizeCache() {
    const stats = this.getReportStats();
    
    // Remove very old reports that are unlikely to be accessed
    const maxAge = 4 * 60 * 60 * 1000; // 4 hours
    
    for (const [key, time] of this.generationTimes) {
      if (Date.now() - time > maxAge) {
        this.cache.delete(key);
        this.generationTimes.delete(key);
      }
    }
  }

  /**
   * Setup automatic cleanup
   */
  setupCleanup() {
    // Clean up expired entries every 10 minutes
    setInterval(() => {
      this.cache.cleanup();
      this.optimizeCache();
    }, 10 * 60 * 1000);
  }

  /**
   * Clear all report cache
   */
  clearAll() {
    this.cache.clear();
    this.generationTimes.clear();
  }

  /**
   * Mock report generation for development
   */
  async mockReportGeneration(reportType, params) {
    // Simulate report generation delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    switch (reportType) {
      case 'revenue':
        return {
          totalRevenue: 125000 + Math.random() * 50000,
          period: params.period || 'daily',
          data: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            revenue: 1000 + Math.random() * 5000,
            orders: Math.floor(10 + Math.random() * 50)
          }))
        };

      case 'userAnalytics':
        return {
          totalUsers: 1500 + Math.floor(Math.random() * 500),
          newUsers: Math.floor(50 + Math.random() * 100),
          activeUsers: Math.floor(800 + Math.random() * 300),
          data: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            newUsers: Math.floor(Math.random() * 20),
            activeUsers: Math.floor(50 + Math.random() * 100)
          }))
        };

      case 'vendorPerformance':
        return {
          totalVendors: 250 + Math.floor(Math.random() * 50),
          topPerformers: Array.from({ length: 10 }, (_, i) => ({
            id: `vendor_${i}`,
            name: `Vendor ${i + 1}`,
            revenue: 10000 + Math.random() * 50000,
            orders: Math.floor(100 + Math.random() * 500),
            rating: 4 + Math.random()
          }))
        };

      case 'orderAnalytics':
        return {
          totalOrders: 5000 + Math.floor(Math.random() * 1000),
          averageOrderValue: 2500 + Math.random() * 1000,
          data: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            orders: Math.floor(50 + Math.random() * 100),
            value: 1000 + Math.random() * 5000
          }))
        };

      case 'productAnalytics':
        return {
          totalProducts: 1200 + Math.floor(Math.random() * 300),
          topProducts: Array.from({ length: 10 }, (_, i) => ({
            id: `product_${i}`,
            name: `Product ${i + 1}`,
            sales: Math.floor(100 + Math.random() * 500),
            revenue: 5000 + Math.random() * 20000
          }))
        };

      default:
        return {
          message: `Mock data for ${reportType}`,
          generatedAt: new Date().toISOString()
        };
    }
  }
}

// Create singleton instance
const reportCacheService = new ReportCacheService();

export default reportCacheService;
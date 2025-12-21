/**
 * Cache Management Utilities
 * Provides intelligent caching for API responses and application data
 */

/**
 * In-memory cache with TTL (Time To Live) support
 */
export class MemoryCache {
  constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.timers = new Map();
  }

  // Set cache entry with optional TTL
  set(key, value, ttl = this.defaultTTL) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Store the value
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });

    // Set expiration timer
    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttl);
      this.timers.set(key, timer);
    }

    return this;
  }

  // Get cache entry
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.ttl > 0 && Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return null;
    }

    return entry.value;
  }

  // Check if key exists and is not expired
  has(key) {
    return this.get(key) !== null;
  }

  // Delete cache entry
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    return this.cache.delete(key);
  }

  // Clear all cache entries
  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.cache.clear();
  }

  // Get cache size
  size() {
    return this.cache.size;
  }

  // Get all keys
  keys() {
    return Array.from(this.cache.keys());
  }

  // Get cache statistics
  getStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      totalEntries: entries.length,
      expiredEntries: entries.filter(entry => 
        entry.ttl > 0 && now - entry.timestamp > entry.ttl
      ).length,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // Estimate memory usage (rough calculation)
  estimateMemoryUsage() {
    let size = 0;
    this.cache.forEach((entry, key) => {
      size += key.length * 2; // Rough estimate for string key
      size += JSON.stringify(entry.value).length * 2; // Rough estimate for value
    });
    return size;
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];
    
    this.cache.forEach((entry, key) => {
      if (entry.ttl > 0 && now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.delete(key));
    return keysToDelete.length;
  }
}

/**
 * Persistent cache using localStorage with compression
 */
export class PersistentCache {
  constructor(prefix = 'cache_', maxSize = 5 * 1024 * 1024) { // 5MB default
    this.prefix = prefix;
    this.maxSize = maxSize;
    this.storage = this.getStorage();
  }

  getStorage() {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return localStorage;
    } catch (e) {
      return null;
    }
  }

  // Generate cache key
  getKey(key) {
    return `${this.prefix}${key}`;
  }

  // Set cache entry
  set(key, value, ttl = 0) {
    if (!this.storage) return false;

    try {
      const entry = {
        value,
        timestamp: Date.now(),
        ttl
      };

      const serialized = JSON.stringify(entry);
      const cacheKey = this.getKey(key);
      
      // Check storage size before setting
      if (this.getCurrentSize() + serialized.length > this.maxSize) {
        this.cleanup();
        
        // If still too large, don't cache
        if (this.getCurrentSize() + serialized.length > this.maxSize) {
          return false;
        }
      }

      this.storage.setItem(cacheKey, serialized);
      return true;
    } catch (error) {
      console.warn('Failed to set cache entry:', error);
      return false;
    }
  }

  // Get cache entry
  get(key) {
    if (!this.storage) return null;

    try {
      const cacheKey = this.getKey(key);
      const serialized = this.storage.getItem(cacheKey);
      
      if (!serialized) return null;

      const entry = JSON.parse(serialized);
      
      // Check if expired
      if (entry.ttl > 0 && Date.now() - entry.timestamp > entry.ttl) {
        this.delete(key);
        return null;
      }

      return entry.value;
    } catch (error) {
      console.warn('Failed to get cache entry:', error);
      return null;
    }
  }

  // Check if key exists
  has(key) {
    return this.get(key) !== null;
  }

  // Delete cache entry
  delete(key) {
    if (!this.storage) return false;

    try {
      const cacheKey = this.getKey(key);
      this.storage.removeItem(cacheKey);
      return true;
    } catch (error) {
      console.warn('Failed to delete cache entry:', error);
      return false;
    }
  }

  // Clear all cache entries
  clear() {
    if (!this.storage) return false;

    try {
      const keys = this.getAllKeys();
      keys.forEach(key => this.storage.removeItem(key));
      return true;
    } catch (error) {
      console.warn('Failed to clear cache:', error);
      return false;
    }
  }

  // Get all cache keys
  getAllKeys() {
    if (!this.storage) return [];

    const keys = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key);
      }
    }
    return keys;
  }

  // Get current storage size
  getCurrentSize() {
    if (!this.storage) return 0;

    let size = 0;
    const keys = this.getAllKeys();
    
    keys.forEach(key => {
      const value = this.storage.getItem(key);
      if (value) {
        size += key.length + value.length;
      }
    });
    
    return size;
  }

  // Clean up expired entries
  cleanup() {
    if (!this.storage) return 0;

    const now = Date.now();
    const keys = this.getAllKeys();
    let cleanedCount = 0;

    keys.forEach(cacheKey => {
      try {
        const serialized = this.storage.getItem(cacheKey);
        if (serialized) {
          const entry = JSON.parse(serialized);
          if (entry.ttl > 0 && now - entry.timestamp > entry.ttl) {
            this.storage.removeItem(cacheKey);
            cleanedCount++;
          }
        }
      } catch (error) {
        // Remove corrupted entries
        this.storage.removeItem(cacheKey);
        cleanedCount++;
      }
    });

    return cleanedCount;
  }
}

/**
 * Smart cache that combines memory and persistent caching
 */
export class SmartCache {
  constructor(options = {}) {
    const {
      memoryTTL = 5 * 60 * 1000, // 5 minutes
      persistentTTL = 60 * 60 * 1000, // 1 hour
      maxMemorySize = 100,
      prefix = 'smart_cache_'
    } = options;

    this.memoryCache = new MemoryCache(memoryTTL);
    this.persistentCache = new PersistentCache(prefix);
    this.persistentTTL = persistentTTL;
    this.maxMemorySize = maxMemorySize;
  }

  // Set cache entry
  set(key, value, options = {}) {
    const { 
      memoryTTL = this.memoryCache.defaultTTL,
      persistentTTL = this.persistentTTL,
      memoryOnly = false,
      persistentOnly = false
    } = options;

    // Set in memory cache
    if (!persistentOnly) {
      this.memoryCache.set(key, value, memoryTTL);
    }

    // Set in persistent cache
    if (!memoryOnly) {
      this.persistentCache.set(key, value, persistentTTL);
    }

    // Manage memory cache size
    if (this.memoryCache.size() > this.maxMemorySize) {
      this.memoryCache.cleanup();
    }

    return this;
  }

  // Get cache entry (memory first, then persistent)
  get(key) {
    // Try memory cache first
    let value = this.memoryCache.get(key);
    if (value !== null) {
      return value;
    }

    // Try persistent cache
    value = this.persistentCache.get(key);
    if (value !== null) {
      // Promote to memory cache
      this.memoryCache.set(key, value);
      return value;
    }

    return null;
  }

  // Check if key exists
  has(key) {
    return this.memoryCache.has(key) || this.persistentCache.has(key);
  }

  // Delete cache entry
  delete(key) {
    this.memoryCache.delete(key);
    this.persistentCache.delete(key);
    return this;
  }

  // Clear all cache entries
  clear() {
    this.memoryCache.clear();
    this.persistentCache.clear();
    return this;
  }

  // Get cache statistics
  getStats() {
    return {
      memory: this.memoryCache.getStats(),
      persistent: {
        size: this.persistentCache.getCurrentSize(),
        keys: this.persistentCache.getAllKeys().length
      }
    };
  }

  // Clean up expired entries
  cleanup() {
    const memoryCleanedCount = this.memoryCache.cleanup();
    const persistentCleanedCount = this.persistentCache.cleanup();
    
    return {
      memory: memoryCleanedCount,
      persistent: persistentCleanedCount
    };
  }
}

// Cache strategies for different data types
export const cacheStrategies = {
  // User profile - cache for 1 hour
  userProfile: {
    memoryTTL: 30 * 60 * 1000, // 30 minutes
    persistentTTL: 60 * 60 * 1000, // 1 hour
  },

  // Products - cache for 15 minutes
  products: {
    memoryTTL: 5 * 60 * 1000, // 5 minutes
    persistentTTL: 15 * 60 * 1000, // 15 minutes
  },

  // Orders - cache for 5 minutes
  orders: {
    memoryTTL: 2 * 60 * 1000, // 2 minutes
    persistentTTL: 5 * 60 * 1000, // 5 minutes
  },

  // Invoices - cache for 10 minutes
  invoices: {
    memoryTTL: 5 * 60 * 1000, // 5 minutes
    persistentTTL: 10 * 60 * 1000, // 10 minutes
  },

  // Static data - cache for 24 hours
  staticData: {
    memoryTTL: 60 * 60 * 1000, // 1 hour
    persistentTTL: 24 * 60 * 60 * 1000, // 24 hours
  }
};

// Global cache instances
export const memoryCache = new MemoryCache();
export const persistentCache = new PersistentCache();
export const smartCache = new SmartCache();

// Cache utility functions
export const cacheUtils = {
  // Generate cache key from parameters
  generateKey: (prefix, params = {}) => {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${prefix}${sortedParams ? `_${sortedParams}` : ''}`;
  },

  // Cached API call wrapper
  cachedApiCall: async (cacheKey, apiFunction, cacheOptions = {}) => {
    // Try to get from cache first
    const cachedResult = smartCache.get(cacheKey);
    if (cachedResult !== null) {
      return cachedResult;
    }

    // Make API call
    try {
      const result = await apiFunction();
      
      // Cache the result
      smartCache.set(cacheKey, result, cacheOptions);
      
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  },

  // Invalidate cache entries by pattern
  invalidatePattern: (pattern) => {
    const regex = new RegExp(pattern);
    
    // Clear from memory cache
    memoryCache.keys().forEach(key => {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    });

    // Clear from persistent cache
    persistentCache.getAllKeys().forEach(key => {
      if (regex.test(key)) {
        persistentCache.delete(key);
      }
    });
  },

  // Preload cache with data
  preload: (data, strategy = 'products') => {
    const options = cacheStrategies[strategy];
    
    Object.entries(data).forEach(([key, value]) => {
      smartCache.set(key, value, options);
    });
  }
};
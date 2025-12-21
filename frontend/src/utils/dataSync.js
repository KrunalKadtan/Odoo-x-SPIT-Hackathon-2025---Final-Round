/**
 * Data Synchronization and Consistency Utilities
 * Provides utilities for maintaining data consistency between frontend and backend
 */

import { errorUtils } from './api';

/**
 * Data synchronization manager
 */
export class DataSyncManager {
  constructor() {
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.listeners = new Set();
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  handleOnline() {
    this.isOnline = true;
    this.processSyncQueue();
    this.notifyListeners({ type: 'online' });
  }

  handleOffline() {
    this.isOnline = false;
    this.notifyListeners({ type: 'offline' });
  }

  // Add operation to sync queue
  queueSync(operation) {
    this.syncQueue.push({
      ...operation,
      timestamp: Date.now(),
      id: this.generateId()
    });
    
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  // Process pending sync operations
  async processSyncQueue() {
    if (this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    
    try {
      while (this.syncQueue.length > 0) {
        const operation = this.syncQueue.shift();
        
        try {
          await this.executeOperation(operation);
          this.notifyListeners({ 
            type: 'sync_success', 
            operation 
          });
        } catch (error) {
          console.error('Sync operation failed:', error);
          
          // Re-queue if it's a retryable error
          if (this.isRetryableError(error)) {
            operation.retryCount = (operation.retryCount || 0) + 1;
            
            if (operation.retryCount < 3) {
              this.syncQueue.unshift(operation);
            } else {
              this.notifyListeners({ 
                type: 'sync_failed', 
                operation, 
                error 
              });
            }
          } else {
            this.notifyListeners({ 
              type: 'sync_failed', 
              operation, 
              error 
            });
          }
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  async executeOperation(operation) {
    const { type, apiFunction, data } = operation;
    
    switch (type) {
      case 'create':
      case 'update':
      case 'delete':
        return await apiFunction(data);
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  isRetryableError(error) {
    return errorUtils.isNetworkError(error) || errorUtils.isServerError(error);
  }

  generateId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(event) {
    this.listeners.forEach(listener => listener(event));
  }

  // Get sync queue status
  getStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.syncQueue.length,
      syncInProgress: this.syncInProgress
    };
  }

  // Clear sync queue
  clearQueue() {
    this.syncQueue = [];
  }
}

/**
 * Data consistency checker
 */
export class DataConsistencyChecker {
  constructor() {
    this.checksumCache = new Map();
  }

  // Generate checksum for data
  generateChecksum(data) {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    return this.simpleHash(jsonString);
  }

  // Simple hash function
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Check if data has changed
  hasDataChanged(key, data) {
    const currentChecksum = this.generateChecksum(data);
    const cachedChecksum = this.checksumCache.get(key);
    
    if (cachedChecksum !== currentChecksum) {
      this.checksumCache.set(key, currentChecksum);
      return true;
    }
    
    return false;
  }

  // Validate data integrity
  validateDataIntegrity(data, schema) {
    const errors = [];
    
    // Check required fields
    if (schema.required) {
      schema.required.forEach(field => {
        if (!data.hasOwnProperty(field) || data[field] === null || data[field] === undefined) {
          errors.push(`Required field '${field}' is missing`);
        }
      });
    }
    
    // Check field types
    if (schema.properties) {
      Object.keys(schema.properties).forEach(field => {
        if (data.hasOwnProperty(field)) {
          const expectedType = schema.properties[field].type;
          const actualType = typeof data[field];
          
          if (expectedType && actualType !== expectedType) {
            errors.push(`Field '${field}' should be ${expectedType}, got ${actualType}`);
          }
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Compare frontend and backend data
  compareData(frontendData, backendData, options = {}) {
    const { ignoreFields = [], timestampTolerance = 1000 } = options;
    const differences = [];
    
    const allKeys = new Set([
      ...Object.keys(frontendData || {}),
      ...Object.keys(backendData || {})
    ]);
    
    allKeys.forEach(key => {
      if (ignoreFields.includes(key)) {
        return;
      }
      
      const frontendValue = frontendData?.[key];
      const backendValue = backendData?.[key];
      
      // Handle timestamp fields with tolerance
      if (options.timestampFields?.includes(key)) {
        const frontendTime = new Date(frontendValue).getTime();
        const backendTime = new Date(backendValue).getTime();
        
        if (Math.abs(frontendTime - backendTime) > timestampTolerance) {
          differences.push({
            field: key,
            frontend: frontendValue,
            backend: backendValue,
            type: 'timestamp_mismatch'
          });
        }
        return;
      }
      
      // Regular comparison
      if (JSON.stringify(frontendValue) !== JSON.stringify(backendValue)) {
        differences.push({
          field: key,
          frontend: frontendValue,
          backend: backendValue,
          type: 'value_mismatch'
        });
      }
    });
    
    return {
      isConsistent: differences.length === 0,
      differences
    };
  }
}

/**
 * State persistence manager
 */
export class StatePersistenceManager {
  constructor(storageKey = 'app_state') {
    this.storageKey = storageKey;
    this.storage = this.getStorage();
  }

  getStorage() {
    try {
      // Test if localStorage is available
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return localStorage;
    } catch (e) {
      // Fallback to memory storage
      return new Map();
    }
  }

  // Save state to storage
  saveState(state, key = null) {
    try {
      const storageKey = key || this.storageKey;
      const serializedState = JSON.stringify({
        data: state,
        timestamp: Date.now(),
        version: '1.0'
      });
      
      if (this.storage instanceof Map) {
        this.storage.set(storageKey, serializedState);
      } else {
        this.storage.setItem(storageKey, serializedState);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to save state:', error);
      return false;
    }
  }

  // Load state from storage
  loadState(key = null) {
    try {
      const storageKey = key || this.storageKey;
      let serializedState;
      
      if (this.storage instanceof Map) {
        serializedState = this.storage.get(storageKey);
      } else {
        serializedState = this.storage.getItem(storageKey);
      }
      
      if (!serializedState) {
        return null;
      }
      
      const parsedState = JSON.parse(serializedState);
      
      // Check if state is expired (older than 24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - parsedState.timestamp > maxAge) {
        this.clearState(key);
        return null;
      }
      
      return parsedState.data;
    } catch (error) {
      console.error('Failed to load state:', error);
      return null;
    }
  }

  // Clear state from storage
  clearState(key = null) {
    try {
      const storageKey = key || this.storageKey;
      
      if (this.storage instanceof Map) {
        this.storage.delete(storageKey);
      } else {
        this.storage.removeItem(storageKey);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to clear state:', error);
      return false;
    }
  }

  // Get all stored keys
  getAllKeys() {
    try {
      if (this.storage instanceof Map) {
        return Array.from(this.storage.keys());
      } else {
        return Object.keys(this.storage);
      }
    } catch (error) {
      console.error('Failed to get storage keys:', error);
      return [];
    }
  }

  // Clear all app-related storage
  clearAllAppData() {
    try {
      const keys = this.getAllKeys();
      const appKeys = keys.filter(key => key.startsWith('app_'));
      
      appKeys.forEach(key => this.clearState(key));
      return true;
    } catch (error) {
      console.error('Failed to clear app data:', error);
      return false;
    }
  }
}

// Global instances
export const dataSyncManager = new DataSyncManager();
export const dataConsistencyChecker = new DataConsistencyChecker();
export const statePersistenceManager = new StatePersistenceManager();

// Utility functions
export const syncUtils = {
  // Queue a create operation
  queueCreate: (apiFunction, data) => {
    dataSyncManager.queueSync({
      type: 'create',
      apiFunction,
      data
    });
  },

  // Queue an update operation
  queueUpdate: (apiFunction, data) => {
    dataSyncManager.queueSync({
      type: 'update',
      apiFunction,
      data
    });
  },

  // Queue a delete operation
  queueDelete: (apiFunction, data) => {
    dataSyncManager.queueSync({
      type: 'delete',
      apiFunction,
      data
    });
  },

  // Check if app is online
  isOnline: () => dataSyncManager.isOnline,

  // Get sync status
  getSyncStatus: () => dataSyncManager.getStatus(),

  // Subscribe to sync events
  onSyncEvent: (callback) => dataSyncManager.subscribe(callback)
};
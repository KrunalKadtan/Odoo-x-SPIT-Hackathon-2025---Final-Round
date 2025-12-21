/**
 * Loading State Management Utilities
 * Provides utilities for managing loading states during API calls
 */

import { useState, useCallback } from 'react';

/**
 * Custom hook for managing loading states
 * @returns {Object} Loading state and control functions
 */
export const useLoadingState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = useCallback((error) => {
    setIsLoading(false);
    setError(error);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    reset
  };
};

/**
 * Custom hook for managing async operations with loading state
 * @param {Function} asyncFunction - The async function to execute
 * @returns {Object} Execute function and loading state
 */
export const useAsyncOperation = (asyncFunction) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (...args) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await asyncFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    isLoading,
    error,
    data,
    reset
  };
};

/**
 * Higher-order function to wrap API calls with loading state
 * @param {Function} apiFunction - The API function to wrap
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 * @returns {Function} Wrapped function with loading state
 */
export const withLoadingState = (apiFunction, onSuccess, onError) => {
  return async (...args) => {
    try {
      const result = await apiFunction(...args);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (error) {
      if (onError) onError(error);
      throw error;
    }
  };
};

/**
 * Loading state manager for multiple concurrent operations
 */
export class LoadingStateManager {
  constructor() {
    this.operations = new Map();
    this.listeners = new Set();
  }

  startOperation(operationId) {
    this.operations.set(operationId, { status: 'loading', error: null });
    this.notifyListeners();
  }

  completeOperation(operationId, data = null) {
    this.operations.set(operationId, { status: 'success', data, error: null });
    this.notifyListeners();
  }

  failOperation(operationId, error) {
    this.operations.set(operationId, { status: 'error', error, data: null });
    this.notifyListeners();
  }

  getOperationState(operationId) {
    return this.operations.get(operationId) || { status: 'idle', error: null, data: null };
  }

  isAnyLoading() {
    return Array.from(this.operations.values()).some(op => op.status === 'loading');
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.operations));
  }

  clear() {
    this.operations.clear();
    this.notifyListeners();
  }
}

// Global loading state manager instance
export const globalLoadingManager = new LoadingStateManager();

/**
 * Loading spinner component props helper
 */
export const getLoadingSpinnerProps = (isLoading, size = 'medium') => {
  return {
    isLoading,
    size,
    className: `loading-spinner loading-spinner-${size}`
  };
};

/**
 * Skeleton loader props helper
 */
export const getSkeletonProps = (isLoading, count = 1) => {
  return {
    isLoading,
    count,
    className: 'skeleton-loader'
  };
};

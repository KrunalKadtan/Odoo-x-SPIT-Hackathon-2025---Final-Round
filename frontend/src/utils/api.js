import axios from 'axios';
import { cacheUtils, cacheStrategies, smartCache } from './cache';
import { syncUtils, dataConsistencyChecker } from './dataSync';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Utility function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility function to determine if error is retryable
const isRetryableError = (error) => {
  if (!error.response) {
    // Network errors are retryable
    return true;
  }
  
  const status = error.response.status;
  // Retry on server errors (5xx) and some client errors
  return status >= 500 || status === 408 || status === 429;
};

// Enhanced API call with retry logic
const apiWithRetry = async (config, retryCount = 0) => {
  try {
    return await api(config);
  } catch (error) {
    if (retryCount < MAX_RETRIES && isRetryableError(error)) {
      console.warn(`API call failed, retrying... (${retryCount + 1}/${MAX_RETRIES})`, error.message);
      await delay(RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
      return apiWithRetry(config, retryCount + 1);
    }
    throw error;
  }
};

// Enhanced API call with caching support
const cachedApiCall = async (cacheKey, apiCall, cacheStrategy = 'products') => {
  return cacheUtils.cachedApiCall(
    cacheKey,
    apiCall,
    cacheStrategies[cacheStrategy]
  );
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post('http://localhost:8000/api/token/refresh/', {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Refresh failed, redirect to login
        tokenUtils.clearTokens();
        window.location.href = '/signin';
      }
    }

    // Enhanced error logging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    return Promise.reject(error);
  }
);

// Error handling utility functions
export const errorUtils = {
  // Extract user-friendly error message
  getErrorMessage: (error) => {
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
  },

  // Extract field-specific validation errors
  getFieldErrors: (error) => {
    if (error.response?.data && typeof error.response.data === 'object') {
      const fieldErrors = {};
      Object.keys(error.response.data).forEach(field => {
        if (Array.isArray(error.response.data[field])) {
          fieldErrors[field] = error.response.data[field][0];
        } else if (typeof error.response.data[field] === 'string') {
          fieldErrors[field] = error.response.data[field];
        }
      });
      return fieldErrors;
    }
    return {};
  },

  // Check if error is a network error
  isNetworkError: (error) => {
    return !error.response && error.request;
  },

  // Check if error is a server error
  isServerError: (error) => {
    return error.response && error.response.status >= 500;
  },

  // Check if error is a client error
  isClientError: (error) => {
    return error.response && error.response.status >= 400 && error.response.status < 500;
  },

  // Format error for display
  formatErrorForDisplay: (error) => {
    const message = errorUtils.getErrorMessage(error);
    const fieldErrors = errorUtils.getFieldErrors(error);
    
    return {
      message,
      fieldErrors,
      isNetworkError: errorUtils.isNetworkError(error),
      isServerError: errorUtils.isServerError(error),
      status: error.response?.status
    };
  }
};

// Return URL utilities for role-based redirect
export const returnUrlUtils = {
  // Capture return URL from current location
  captureReturnUrl: () => {
    const currentPath = window.location.pathname + window.location.search;
    const returnUrl = currentPath !== '/signin' && currentPath !== '/signup' ? currentPath : null;
    
    if (returnUrl) {
      localStorage.setItem('return_url', returnUrl);
      console.log('Return URL captured:', returnUrl);
    }
    
    return returnUrl;
  },

  // Get stored return URL
  getReturnUrl: () => {
    return localStorage.getItem('return_url');
  },

  // Clear stored return URL
  clearReturnUrl: () => {
    localStorage.removeItem('return_url');
  },

  // Validate return URL for security
  validateReturnUrl: (url) => {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url, window.location.origin);
      
      // Only allow same-origin URLs
      if (urlObj.origin !== window.location.origin) {
        console.warn('Return URL rejected: different origin', url);
        return false;
      }
      
      // Sanitize URL to prevent XSS
      const sanitizedPath = urlObj.pathname.replace(/[<>'"]/g, '');
      if (sanitizedPath !== urlObj.pathname) {
        console.warn('Return URL rejected: contains suspicious characters', url);
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('Return URL rejected: invalid URL format', url, error);
      return false;
    }
  }
};

// Enhanced profile fetching with retry logic and exponential backoff
export const profileUtils = {
  // Fetch user profile with retry logic
  fetchProfileWithRetry: async (accessToken, maxRetries = 3) => {
    let lastError = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Fetching user profile (attempt ${attempt + 1}/${maxRetries})`);
        
        const response = await api.get('/accounts/profile/', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          timeout: 5000 // 5 second timeout for profile fetch
        });
        
        console.log('Profile fetch successful:', response.data);
        return response.data;
        
      } catch (error) {
        lastError = error;
        console.warn(`Profile fetch attempt ${attempt + 1} failed:`, error.message);
        
        // Don't retry on authentication errors (401, 403)
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Authentication error, not retrying');
          throw error;
        }
        
        // Don't retry on client errors (4xx except 408, 429)
        if (error.response?.status >= 400 && error.response?.status < 500 && 
            error.response?.status !== 408 && error.response?.status !== 429) {
          console.log('Client error, not retrying');
          throw error;
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries - 1) {
          console.error('All profile fetch attempts failed');
          throw error;
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${delayMs}ms before retry...`);
        await delay(delayMs);
      }
    }
    
    throw lastError;
  },

  // Extract role from profile data with fallback
  extractRoleFromProfile: (profileData) => {
    if (!profileData) return null;
    
    // Try different possible role field names
    const role = profileData.role || profileData.user_type || profileData.account_type;
    
    if (role && ['internal', 'customer', 'vendor'].includes(role)) {
      return role;
    }
    
    console.warn('Invalid or missing role in profile data:', profileData);
    return null;
  },

  // Extract role from JWT token as fallback
  extractRoleFromToken: (token) => {
    if (!token) return null;
    
    try {
      // Decode JWT token (basic decode, not verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role || payload.user_type || payload.account_type;
      
      if (role && ['internal', 'customer', 'vendor'].includes(role)) {
        console.log('Role extracted from token:', role);
        return role;
      }
      
      console.warn('Invalid or missing role in token payload:', payload);
      return null;
    } catch (error) {
      console.warn('Failed to extract role from token:', error);
      return null;
    }
  }
};

// Audit logging utilities
export const auditLogger = {
  // Log successful redirect
  logSuccessfulRedirect: async (userId, userRole, destination, returnUrl = null) => {
    const logData = {
      event_type: 'SUCCESSFUL_REDIRECT',
      user_id: userId,
      user_role: userRole,
      destination: destination,
      return_url: returnUrl,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      ip_address: 'client-side' // Will be populated by backend
    };
    
    try {
      // Store locally first for immediate availability
      const auditLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      auditLogs.push(logData);
      
      // Keep only last 100 logs locally
      if (auditLogs.length > 100) {
        auditLogs.splice(0, auditLogs.length - 100);
      }
      
      localStorage.setItem('audit_logs', JSON.stringify(auditLogs));
      
      // Send to backend if available
      if (tokenUtils.isAuthenticated()) {
        await api.post('/admin/audit-logs/', logData);
        console.log('Redirect audit log sent to backend:', logData);
      }
    } catch (error) {
      console.warn('Failed to send audit log to backend:', error);
      // Log is still stored locally
    }
  },

  // Log role detection failure
  logRoleDetectionFailure: async (userId, error, attemptedSources) => {
    const logData = {
      event_type: 'ROLE_DETECTION_FAILURE',
      user_id: userId,
      error_message: error.message,
      attempted_sources: attemptedSources,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    };
    
    try {
      const auditLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      auditLogs.push(logData);
      localStorage.setItem('audit_logs', JSON.stringify(auditLogs));
      
      if (tokenUtils.isAuthenticated()) {
        await api.post('/admin/audit-logs/', logData);
      }
    } catch (logError) {
      console.warn('Failed to log role detection failure:', logError);
    }
  },

  // Log return URL validation failure
  logReturnUrlValidationFailure: async (userId, invalidUrl, reason) => {
    const logData = {
      event_type: 'RETURN_URL_VALIDATION_FAILURE',
      user_id: userId,
      invalid_url: invalidUrl,
      failure_reason: reason,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    };
    
    try {
      const auditLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      auditLogs.push(logData);
      localStorage.setItem('audit_logs', JSON.stringify(auditLogs));
      
      if (tokenUtils.isAuthenticated()) {
        await api.post('/admin/audit-logs/', logData);
      }
    } catch (logError) {
      console.warn('Failed to log return URL validation failure:', logError);
    }
  },

  // Get local audit logs
  getLocalAuditLogs: () => {
    try {
      return JSON.parse(localStorage.getItem('audit_logs') || '[]');
    } catch (error) {
      console.warn('Failed to parse local audit logs:', error);
      return [];
    }
  }
};

// Auth API functions
export const authAPI = {
  // Sign up
  signup: async (userData) => {
    const response = await api.post('/accounts/signup/', userData);
    
    // Store user data for navigation component
    if (response.data.user) {
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  // Enhanced sign in with role-based redirect support
  signin: async (credentials) => {
    const response = await api.post('/token/', credentials);
    let profileData = null;
    let userRole = null;
    let userId = null;
    
    // Enhanced profile fetching with retry logic
    try {
      profileData = await profileUtils.fetchProfileWithRetry(response.data.access);
      userRole = profileUtils.extractRoleFromProfile(profileData);
      userId = profileData.id || profileData.user_id;
      
      // Store user data
      localStorage.setItem('user_data', JSON.stringify(profileData));
      
      // Cache role information
      if (userRole && userId) {
        localStorage.setItem('user_role', userRole);
        localStorage.setItem('user_id', userId.toString());
      }
      
    } catch (profileError) {
      console.warn('Profile fetch failed, attempting token fallback:', profileError);
      
      // Fallback: try to extract role from token
      userRole = profileUtils.extractRoleFromToken(response.data.access);
      
      if (!userRole) {
        // Final fallback: default to customer role
        userRole = 'customer';
        console.log('Using default role: customer');
        
        // Log role detection failure
        try {
          await auditLogger.logRoleDetectionFailure(
            'unknown',
            profileError,
            ['profile_api', 'jwt_token', 'default_fallback']
          );
        } catch (logError) {
          console.warn('Failed to log role detection failure:', logError);
        }
      }
      
      // Store basic user info from credentials if profile fetch fails
      const fallbackUserData = {
        email: credentials.email,
        name: credentials.email.split('@')[0], // fallback name
        role: userRole
      };
      localStorage.setItem('user_data', JSON.stringify(fallbackUserData));
      localStorage.setItem('user_role', userRole);
    }
    
    // Enhanced response with role information
    return {
      ...response.data,
      user_role: userRole,
      profile_data: profileData
    };
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/token/refresh/', { refresh: refreshToken });
    return response.data;
  },
};

// Products API functions
export const productsAPI = {
  // Get all products with filtering (cached)
  getProducts: async (params = {}) => {
    const cacheKey = cacheUtils.generateKey('products', params);
    return cachedApiCall(cacheKey, async () => {
      const response = await api.get('/products/', { params });
      return response.data;
    }, 'products');
  },

  // Get single product by ID (cached)
  getProduct: async (id) => {
    const cacheKey = `product_${id}`;
    return cachedApiCall(cacheKey, async () => {
      const response = await api.get(`/products/${id}/`);
      return response.data;
    }, 'products');
  },

  // Get product categories (cached)
  getCategories: async () => {
    const cacheKey = 'product_categories';
    return cachedApiCall(cacheKey, async () => {
      const response = await api.get('/products/categories/');
      return response.data;
    }, 'staticData');
  },

  // Clear products cache
  clearCache: () => {
    cacheUtils.invalidatePattern('^products');
    cacheUtils.invalidatePattern('^product_');
  },
};

// User Profile API functions
export const userAPI = {
  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/accounts/profile/');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/accounts/profile/', profileData);
    return response.data;
  },
};

// Invoices API functions
export const invoicesAPI = {
  // Get all invoices for current user (cached)
  getUserInvoices: async () => {
    const cacheKey = 'user_invoices';
    return cachedApiCall(cacheKey, async () => {
      const response = await api.get('/products/invoices/');
      return response.data;
    }, 'invoices');
  },

  // Get single invoice by ID (cached)
  getInvoice: async (invoiceId) => {
    const cacheKey = `invoice_${invoiceId}`;
    return cachedApiCall(cacheKey, async () => {
      const response = await api.get(`/products/invoices/${invoiceId}/`);
      return response.data;
    }, 'invoices');
  },

  // Confirm invoice
  confirmInvoice: async (invoiceId) => {
    try {
      const response = await api.post(`/products/invoices/${invoiceId}/confirm/`);
      
      // Clear related cache
      cacheUtils.invalidatePattern('^user_invoices');
      cacheUtils.invalidatePattern(`^invoice_${invoiceId}`);
      
      return response.data;
    } catch (error) {
      if (errorUtils.isNetworkError(error)) {
        syncUtils.queueUpdate(invoicesAPI.confirmInvoice, invoiceId);
      }
      throw error;
    }
  },

  // Download invoice PDF
  downloadInvoice: async (invoiceId) => {
    const response = await api.get(`/products/invoices/${invoiceId}/download/`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Print invoice
  printInvoice: async (invoiceId) => {
    const response = await api.get(`/products/invoices/${invoiceId}/print/`);
    return response.data;
  },

  // Validate invoice data consistency
  validateInvoiceConsistency: async (invoiceId, frontendData) => {
    try {
      const backendData = await invoicesAPI.getInvoice(invoiceId);
      
      return dataConsistencyChecker.compareData(frontendData, backendData, {
        ignoreFields: ['updated_at', 'created_at'],
        timestampFields: ['invoice_date', 'due_date'],
        timestampTolerance: 5000 // 5 seconds
      });
    } catch (error) {
      console.error('Invoice consistency check failed:', error);
      return { isConsistent: false, differences: [] };
    }
  },
};

// Cart API functions
export const cartAPI = {
  // Get user's cart
  getCart: async () => {
    const response = await api.get('/products/cart/');
    return response.data;
  },

  // Add item to cart
  addToCart: async (productId, quantity = 1) => {
    const response = await api.post('/products/cart/add/', {
      product_id: productId,
      quantity: quantity
    });
    return response.data;
  },

  // Update cart item quantity
  updateCartItem: async (itemId, quantity) => {
    const response = await api.put(`/products/cart/items/${itemId}/`, {
      quantity: quantity
    });
    return response.data;
  },

  // Remove item from cart
  removeFromCart: async (itemId) => {
    const response = await api.delete(`/products/cart/items/${itemId}/remove/`);
    return response.data;
  },

  // Clear entire cart
  clearCart: async () => {
    const response = await api.delete('/products/cart/clear/');
    return response.data;
  },
};

// Orders API functions
export const ordersAPI = {
  // Get all orders for current user (cached)
  getUserOrders: async () => {
    const cacheKey = 'user_orders';
    return cachedApiCall(cacheKey, async () => {
      const response = await api.get('/products/orders/');
      return response.data;
    }, 'orders');
  },

  // Get single order by ID (cached)
  getOrder: async (orderId) => {
    const cacheKey = `order_${orderId}`;
    return cachedApiCall(cacheKey, async () => {
      const response = await api.get(`/products/orders/${orderId}/`);
      return response.data;
    }, 'orders');
  },

  // Create order from cart (checkout)
  checkout: async (orderData = {}) => {
    try {
      const response = await api.post('/products/checkout/', orderData);
      
      // Clear orders cache after successful checkout
      cacheUtils.invalidatePattern('^user_orders');
      cacheUtils.invalidatePattern('^order_');
      
      // Queue for offline sync if needed
      if (!syncUtils.isOnline()) {
        syncUtils.queueCreate(ordersAPI.checkout, orderData);
      }
      
      return response.data;
    } catch (error) {
      // Queue for retry if network error
      if (errorUtils.isNetworkError(error)) {
        syncUtils.queueCreate(ordersAPI.checkout, orderData);
      }
      throw error;
    }
  },

  // Confirm order
  confirmOrder: async (orderId) => {
    try {
      const response = await api.post(`/products/orders/${orderId}/confirm/`);
      
      // Clear related cache
      cacheUtils.invalidatePattern('^user_orders');
      cacheUtils.invalidatePattern(`^order_${orderId}`);
      
      return response.data;
    } catch (error) {
      if (errorUtils.isNetworkError(error)) {
        syncUtils.queueUpdate(ordersAPI.confirmOrder, orderId);
      }
      throw error;
    }
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    try {
      const response = await api.post(`/products/orders/${orderId}/cancel/`);
      
      // Clear related cache
      cacheUtils.invalidatePattern('^user_orders');
      cacheUtils.invalidatePattern(`^order_${orderId}`);
      
      return response.data;
    } catch (error) {
      if (errorUtils.isNetworkError(error)) {
        syncUtils.queueUpdate(ordersAPI.cancelOrder, orderId);
      }
      throw error;
    }
  },

  // Apply coupon to order
  applyCoupon: async (orderId, couponCode) => {
    try {
      const response = await api.post(`/products/orders/${orderId}/apply-coupon/`, {
        coupon_code: couponCode
      });
      
      // Clear related cache
      cacheUtils.invalidatePattern(`^order_${orderId}`);
      
      return response.data;
    } catch (error) {
      if (errorUtils.isNetworkError(error)) {
        syncUtils.queueUpdate(ordersAPI.applyCoupon, { orderId, couponCode });
      }
      throw error;
    }
  },

  // Validate order data consistency
  validateOrderConsistency: async (orderId, frontendData) => {
    try {
      const backendData = await ordersAPI.getOrder(orderId);
      
      return dataConsistencyChecker.compareData(frontendData, backendData, {
        ignoreFields: ['updated_at', 'created_at'],
        timestampFields: ['order_date'],
        timestampTolerance: 5000 // 5 seconds
      });
    } catch (error) {
      console.error('Order consistency check failed:', error);
      return { isConsistent: false, differences: [] };
    }
  },
};
export const paymentsAPI = {
  // Create Razorpay payment order
  createPaymentOrder: async (invoiceId, amount = null) => {
    const response = await api.post('/products/payments/create-order/', {
      invoice_id: invoiceId,
      ...(amount && { amount })
    });
    return response.data;
  },

  // Verify Razorpay payment
  verifyPayment: async (paymentId, razorpayPaymentId, razorpaySignature) => {
    const response = await api.post('/products/payments/verify/', {
      payment_id: paymentId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature
    });
    return response.data;
  },

  // Get payment details
  getPayment: async (paymentId) => {
    const response = await api.get(`/products/payments/${paymentId}/`);
    return response.data;
  },

  // Get all payments for current user
  getUserPayments: async () => {
    const response = await api.get('/products/payments/');
    return response.data;
  },

  // Handle payment failure
  handlePaymentFailure: async (paymentId, errorDetails) => {
    const response = await api.post(`/products/payments/${paymentId}/failure/`, {
      error_details: errorDetails
    });
    return response.data;
  },

  // Process refund
  processRefund: async (paymentId, refundData) => {
    const response = await api.post(`/products/payments/${paymentId}/refund/`, refundData);
    return response.data;
  },

  // Get refund status
  getRefundStatus: async (refundId) => {
    const response = await api.get(`/products/payments/refunds/${refundId}/`);
    return response.data;
  },

  // Get all refunds for a payment
  getPaymentRefunds: async (paymentId) => {
    const response = await api.get(`/products/payments/${paymentId}/refunds/`);
    return response.data;
  },
};

// Utility functions for token management
export const tokenUtils = {
  setTokens: (tokens) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  },

  getAccessToken: () => {
    return localStorage.getItem('access_token');
  },

  getRefreshToken: () => {
    return localStorage.getItem('refresh_token');
  },

  getUserData: () => {
    try {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  // Enhanced user role retrieval with caching
  getUserRole: () => {
    // First try cached role
    const cachedRole = localStorage.getItem('user_role');
    if (cachedRole && ['internal', 'customer', 'vendor'].includes(cachedRole)) {
      return cachedRole;
    }
    
    // Fallback to user data
    const userData = tokenUtils.getUserData();
    if (userData?.role) {
      // Cache the role for future use
      localStorage.setItem('user_role', userData.role);
      return userData.role;
    }
    
    // Final fallback to token
    const token = tokenUtils.getAccessToken();
    if (token) {
      const roleFromToken = profileUtils.extractRoleFromToken(token);
      if (roleFromToken) {
        localStorage.setItem('user_role', roleFromToken);
        return roleFromToken;
      }
    }
    
    // Default fallback
    return 'customer';
  },

  // Get user ID with caching
  getUserId: () => {
    // First try cached ID
    const cachedId = localStorage.getItem('user_id');
    if (cachedId) {
      return cachedId;
    }
    
    // Fallback to user data
    const userData = tokenUtils.getUserData();
    if (userData?.id) {
      localStorage.setItem('user_id', userData.id.toString());
      return userData.id.toString();
    }
    
    return null;
  },

  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    localStorage.removeItem('return_url');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  // Check if user has admin role
  isAdmin: () => {
    return tokenUtils.getUserRole() === 'internal';
  },

  // Validate authentication state
  validateAuthState: () => {
    const token = tokenUtils.getAccessToken();
    const userData = tokenUtils.getUserData();
    const userRole = tokenUtils.getUserRole();
    
    return {
      hasToken: !!token,
      hasUserData: !!userData,
      hasRole: !!userRole,
      isValid: !!(token && userData && userRole)
    };
  }
};

// Coupons API functions
export const couponsAPI = {
  // Validate coupon code
  validateCoupon: async (couponCode) => {
    const response = await api.post('/products/coupons/validate/', {
      coupon_code: couponCode
    });
    return response.data;
  },

  // Get user's available coupons
  getUserCoupons: async () => {
    const response = await api.get('/products/coupons/my-coupons/');
    return response.data;
  },
};

// Discount Offers API functions
export const offersAPI = {
  // Get active offers
  getActiveOffers: async () => {
    const response = await api.get('/products/offers/');
    return response.data;
  },

  // Get specific offer details
  getOffer: async (offerId) => {
    const response = await api.get(`/products/offers/${offerId}/`);
    return response.data;
  },
};

// System Settings API functions
export const settingsAPI = {
  // Get system settings
  getSettings: async () => {
    const response = await api.get('/products/settings/');
    return response.data;
  },
};

// Admin API functions
export const adminAPI = {
  // Get dashboard metrics
  getDashboardMetrics: async () => {
    const cacheKey = 'admin_dashboard_metrics';
    return cachedApiCall(cacheKey, async () => {
      const response = await api.get('/admin/dashboard/metrics/');
      const data = response.data;
      
      // Transform backend response to match frontend expectations
      return {
        totalUsers: data.users?.total || 0,
        totalCustomers: data.users?.customers || 0,
        totalVendors: data.users?.vendors || 0,
        totalOrders: data.orders?.total || 0,
        pendingOrders: data.orders?.pending || 0,
        confirmedOrders: data.orders?.confirmed || 0,
        totalRevenue: data.revenue?.total || 0,
        totalProducts: data.products?.total || 0,
        publishedProducts: data.products?.published || 0,
        recentUsers: data.users?.recent || 0,
        recentOrders: data.orders?.recent || 0,
        // Add computed metrics for dashboard cards
        pendingApprovals: (data.orders?.pending || 0) + (data.users?.vendors || 0), // Approximate pending approvals
        failedPayments: 0 // Will be implemented when payment failure tracking is added
      };
    }, 'staticData');
  },

  // Get recent activity
  getRecentActivity: async (limit = 10, page = 1) => {
    const response = await api.get(`/admin/dashboard/recent_activity/?limit=${limit}&page=${page}`);
    // Handle both old format (array) and new format (object with activities)
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.activities || [];
  },

  // Get system alerts (placeholder - will implement system health)
  getSystemAlerts: async () => {
    const response = await api.get('/admin/system/system-health/');
    return response.data;
  },

  // User Management
  // Get all users (for user management)
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users/', { params });
    return response.data;
  },

  // Get single user details
  getUser: async (userId) => {
    const response = await api.get(`/admin/users/${userId}/`);
    return response.data;
  },

  // Get user statistics
  getUserStats: async () => {
    const response = await api.get('/admin/users/stats/');
    return response.data;
  },

  // Toggle user active status (block/unblock)
  toggleUserActive: async (userId) => {
    const response = await api.post(`/admin/users/${userId}/toggle-active/`);
    // Clear users cache
    cacheUtils.invalidatePattern('^admin_users');
    return response.data;
  },

  // Block user (legacy - use toggleUserActive)
  blockUser: async (userId) => {
    const response = await api.post(`/admin/users/${userId}/toggle-active/`);
    // Clear users cache
    cacheUtils.invalidatePattern('^admin_users');
    return response.data;
  },

  // Unblock user (legacy - use toggleUserActive)
  unblockUser: async (userId) => {
    const response = await api.post(`/admin/users/${userId}/toggle-active/`);
    // Clear users cache
    cacheUtils.invalidatePattern('^admin_users');
    return response.data;
  },

  // Change user role
  changeUserRole: async (userId, role) => {
    const response = await api.post(`/admin/users/${userId}/change-role/`, { role });
    // Clear users cache
    cacheUtils.invalidatePattern('^admin_users');
    return response.data;
  },

  // Get user order history (placeholder - not implemented in backend yet)
  getUserOrders: async (userId, params = {}) => {
    // This would need to be implemented in backend
    console.warn('getUserOrders not implemented in backend yet');
    return { results: [] };
  },

  // Get user activity log (placeholder - not implemented in backend yet)
  getUserActivity: async (userId, params = {}) => {
    // This would need to be implemented in backend
    console.warn('getUserActivity not implemented in backend yet');
    return { results: [] };
  },

  // Vendor Management
  // Get all vendors (for vendor management)
  getVendors: async (params = {}) => {
    const response = await api.get('/admin/vendors/', { params });
    return response.data;
  },

  // Get single vendor details
  getVendor: async (vendorId) => {
    const response = await api.get(`/admin/vendors/${vendorId}/`);
    return response.data;
  },

  // Approve vendor (placeholder - not implemented in backend yet)
  approveVendor: async (vendorId, approvalData = {}) => {
    console.warn('approveVendor not implemented in backend yet');
    return { message: 'Vendor approval not implemented' };
  },

  // Reject vendor (placeholder - not implemented in backend yet)
  rejectVendor: async (vendorId, rejectionData = {}) => {
    console.warn('rejectVendor not implemented in backend yet');
    return { message: 'Vendor rejection not implemented' };
  },

  // Suspend vendor (placeholder - not implemented in backend yet)
  suspendVendor: async (vendorId, suspensionData = {}) => {
    console.warn('suspendVendor not implemented in backend yet');
    return { message: 'Vendor suspension not implemented' };
  },

  // Reactivate vendor (placeholder - not implemented in backend yet)
  reactivateVendor: async (vendorId) => {
    console.warn('reactivateVendor not implemented in backend yet');
    return { message: 'Vendor reactivation not implemented' };
  },

  // Get vendor products
  getVendorProducts: async (vendorId, params = {}) => {
    const response = await api.get(`/admin/vendors/${vendorId}/products/`, { params });
    return response.data;
  },

  // Get vendor orders (placeholder - not implemented in backend yet)
  getVendorOrders: async (vendorId, params = {}) => {
    console.warn('getVendorOrders not implemented in backend yet');
    return { results: [] };
  },

  // Get vendor earnings (placeholder - not implemented in backend yet)
  getVendorEarnings: async (vendorId, params = {}) => {
    console.warn('getVendorEarnings not implemented in backend yet');
    return { results: [] };
  },

  // Get vendor documents (placeholder - not implemented in backend yet)
  getVendorDocuments: async (vendorId) => {
    console.warn('getVendorDocuments not implemented in backend yet');
    return { results: [] };
  },

  // Verify vendor document (placeholder - not implemented in backend yet)
  verifyVendorDocument: async (vendorId, documentId, verificationData = {}) => {
    console.warn('verifyVendorDocument not implemented in backend yet');
    return { message: 'Document verification not implemented' };
  },

  // Get all orders (for order management)
  getAllOrders: async (params = {}) => {
    const response = await api.get('/admin/purchase-orders/', { params });
    return response.data;
  },

  // Admin Security Monitoring (placeholder - not fully implemented in backend yet)
  // Get security events
  getSecurityEvents: async (params = {}) => {
    try {
      const response = await api.get('/admin/system/security-events/', { params });
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch security events:', error);
      return { results: [] };
    }
  },

  // Get security alerts
  getSecurityAlerts: async (params = {}) => {
    try {
      const response = await api.get('/admin/system/security-alerts/', { params });
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch security alerts:', error);
      return { results: [] };
    }
  },

  // Create security event
  createSecurityEvent: async (eventData) => {
    try {
      const response = await api.post('/admin/system/security-events/', eventData);
      return response.data;
    } catch (error) {
      console.error('Failed to create security event:', error);
      // Fallback: store locally if backend fails
      const localEvents = JSON.parse(localStorage.getItem('security_events') || '[]');
      localEvents.push({
        ...eventData,
        timestamp: new Date().toISOString(),
        id: `local_${Date.now()}`
      });
      localStorage.setItem('security_events', JSON.stringify(localEvents));
      return { message: 'Security event stored locally' };
    }
  },

  // Create security alert
  createSecurityAlert: async (alertData) => {
    try {
      const response = await api.post('/admin/system/security-alerts/', alertData);
      return response.data;
    } catch (error) {
      console.error('Failed to create security alert:', error);
      return { message: 'Security alert creation failed' };
    }
  },

  // Acknowledge security alert
  acknowledgeSecurityAlert: async (alertId) => {
    console.warn('acknowledgeSecurityAlert not implemented in backend yet');
    return { message: 'Security alert acknowledgement not implemented' };
  },

  // Dismiss security alert
  dismissSecurityAlert: async (alertId) => {
    console.warn('dismissSecurityAlert not implemented in backend yet');
    return { message: 'Security alert dismissal not implemented' };
  },

  // Get security statistics
  getSecurityStats: async (params = {}) => {
    console.warn('getSecurityStats not implemented in backend yet');
    return { results: [] };
  },

  // Admin Audit Logs
  // Get audit logs
  getAuditLogs: async (params = {}) => {
    const response = await api.get('/admin/system/audit-logs/', { params });
    return response.data;
  },

  // Get single audit log (placeholder - not implemented in backend yet)
  getAuditLog: async (logId) => {
    console.warn('getAuditLog not implemented in backend yet');
    return {};
  },

  // Create audit log entry
  createAuditLog: async (logData) => {
    const response = await api.post('/admin/system/audit-logs/', logData);
    return response.data;
  },

  // Export audit logs (placeholder - not implemented in backend yet)
  exportAuditLogs: async (params = {}, format = 'csv') => {
    console.warn('exportAuditLogs not implemented in backend yet');
    return new Blob([''], { type: 'text/csv' });
  },

  // Admin Notifications (placeholder - not implemented in backend yet)
  // Get admin notifications
  getAdminNotifications: async (params = {}) => {
    console.warn('getAdminNotifications not implemented in backend yet');
    return { results: [] };
  },

  // Get unread notification count
  getUnreadNotificationCount: async () => {
    console.warn('getUnreadNotificationCount not implemented in backend yet');
    return { count: 0 };
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    console.warn('markNotificationAsRead not implemented in backend yet');
    return { message: 'Notification marking not implemented' };
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: async () => {
    console.warn('markAllNotificationsAsRead not implemented in backend yet');
    return { message: 'Notification marking not implemented' };
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    console.warn('deleteNotification not implemented in backend yet');
    return { message: 'Notification deletion not implemented' };
  },

  // Create admin notification (for system use)
  createAdminNotification: async (notificationData) => {
    console.warn('createAdminNotification not implemented in backend yet');
    return { message: 'Notification creation not implemented' };
  },

  // System Settings Management (placeholder - not implemented in backend yet)
  // Get system settings
  getSystemSettings: async () => {
    console.warn('getSystemSettings not implemented in backend yet');
    return {};
  },

  // Update system settings
  updateSystemSettings: async (settings) => {
    console.warn('updateSystemSettings not implemented in backend yet');
    return { message: 'Settings update not implemented' };
  },

  // Update single system setting
  updateSystemSetting: async (key, value) => {
    console.warn('updateSystemSetting not implemented in backend yet');
    return { message: 'Setting update not implemented' };
  },

  // Maintenance Mode Management (placeholder - not implemented in backend yet)
  // Enable maintenance mode
  enableMaintenanceMode: async (maintenanceData = {}) => {
    console.warn('enableMaintenanceMode not implemented in backend yet');
    return { message: 'Maintenance mode not implemented' };
  },

  // Disable maintenance mode
  disableMaintenanceMode: async () => {
    console.warn('disableMaintenanceMode not implemented in backend yet');
    return { message: 'Maintenance mode not implemented' };
  },

  // Get maintenance mode status
  getMaintenanceStatus: async () => {
    console.warn('getMaintenanceStatus not implemented in backend yet');
    return { enabled: false };
  },

  // Schedule maintenance mode
  scheduleMaintenanceMode: async (scheduleData) => {
    console.warn('scheduleMaintenanceMode not implemented in backend yet');
    return { message: 'Maintenance scheduling not implemented' };
  },

  // Cancel scheduled maintenance
  cancelScheduledMaintenance: async (scheduleId) => {
    console.warn('cancelScheduledMaintenance not implemented in backend yet');
    return { message: 'Maintenance cancellation not implemented' };
  },

  // Analytics endpoints
  getUserGrowth: async () => {
    const response = await api.get('/admin/analytics/user-growth/');
    return response.data;
  },

  getRevenueAnalytics: async () => {
    const response = await api.get('/admin/analytics/revenue-analytics/');
    return response.data;
  },

  getOrderAnalytics: async () => {
    const response = await api.get('/admin/analytics/order-analytics/');
    return response.data;
  },

  // System health
  getSystemHealth: async () => {
    const response = await api.get('/admin/system/system-health/');
    return response.data;
  },

  // Clear admin cache
  clearAdminCache: () => {
    cacheUtils.invalidatePattern('^admin_');
  },
};

// Data consistency utilities
export const consistencyUtils = {
  // Validate all cached data against backend
  validateAllCachedData: async () => {
    const results = {
      orders: [],
      invoices: [],
      products: []
    };

    try {
      // Get cached orders and validate
      const cachedOrders = smartCache.get('user_orders');
      if (cachedOrders) {
        for (const order of cachedOrders) {
          const consistency = await ordersAPI.validateOrderConsistency(order.id, order);
          results.orders.push({
            id: order.id,
            ...consistency
          });
        }
      }

      // Get cached invoices and validate
      const cachedInvoices = smartCache.get('user_invoices');
      if (cachedInvoices) {
        for (const invoice of cachedInvoices) {
          const consistency = await invoicesAPI.validateInvoiceConsistency(invoice.id, invoice);
          results.invoices.push({
            id: invoice.id,
            ...consistency
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Data consistency validation failed:', error);
      return results;
    }
  },

  // Sync all inconsistent data
  syncInconsistentData: async (validationResults) => {
    const syncPromises = [];

    // Sync inconsistent orders
    validationResults.orders
      .filter(result => !result.isConsistent)
      .forEach(result => {
        syncPromises.push(
          ordersAPI.getOrder(result.id).then(freshData => {
            smartCache.set(`order_${result.id}`, freshData, cacheStrategies.orders);
          })
        );
      });

    // Sync inconsistent invoices
    validationResults.invoices
      .filter(result => !result.isConsistent)
      .forEach(result => {
        syncPromises.push(
          invoicesAPI.getInvoice(result.id).then(freshData => {
            smartCache.set(`invoice_${result.id}`, freshData, cacheStrategies.invoices);
          })
        );
      });

    try {
      await Promise.all(syncPromises);
      return { success: true, syncedCount: syncPromises.length };
    } catch (error) {
      console.error('Data sync failed:', error);
      return { success: false, error };
    }
  },

  // Clear all cache and force fresh data
  forceRefreshAllData: () => {
    smartCache.clear();
    cacheUtils.invalidatePattern('.*'); // Clear all patterns
  }
};

export default api;
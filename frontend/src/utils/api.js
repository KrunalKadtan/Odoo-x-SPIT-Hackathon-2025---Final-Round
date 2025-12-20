import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

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
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        window.location.href = '/signin';
      }
    }

    return Promise.reject(error);
  }
);

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

  // Sign in
  signin: async (credentials) => {
    console.log('Attempting signin with:', { email: credentials.email });
    try {
      const response = await api.post('/token/', credentials);
      console.log('Signin response:', response.data);
      
      // Get user profile after successful login
      try {
        const profileResponse = await api.get('/accounts/profile/', {
          headers: {
            Authorization: `Bearer ${response.data.access}`
          }
        });
        
        console.log('Profile response:', profileResponse.data);
        
        // Store user data
        localStorage.setItem('user_data', JSON.stringify(profileResponse.data));
      } catch (profileError) {
        console.warn('Could not fetch user profile:', profileError);
        // Store basic user info from token if profile fetch fails
        const userData = {
          email: credentials.email,
          name: credentials.email.split('@')[0], // fallback name
          role: 'internal' // assume internal for admin signin
        };
        localStorage.setItem('user_data', JSON.stringify(userData));
      }
      
      return response.data;
    } catch (error) {
      console.error('Signin error details:', error.response?.data || error.message);
      throw error;
    }
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/token/refresh/', { refresh: refreshToken });
    return response.data;
  },
};

// Products API functions
export const productsAPI = {
  // Get all products with filtering
  getProducts: async (params = {}) => {
    const response = await api.get('/products/', { params });
    return response.data;
  },

  // Get single product by ID
  getProduct: async (id) => {
    const response = await api.get(`/products/${id}/`);
    return response.data;
  },

  // Get product categories
  getCategories: async () => {
    const response = await api.get('/products/categories/');
    return response.data;
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

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.post('/accounts/change-password/', passwordData);
    return response.data;
  },
};

// Invoices API functions
export const invoicesAPI = {
  // Get all invoices for current user
  getUserInvoices: async () => {
    try {
      const response = await api.get('/products/invoices/');
      return response.data.results || response.data || [];
    } catch (error) {
      console.error('Error fetching user invoices:', error);
      return []; // Return empty array on error
    }
  },

  // Get single invoice by ID
  getInvoice: async (invoiceId) => {
    try {
      const response = await api.get(`/products/invoices/${invoiceId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
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
  // Get all orders for current user
  getUserOrders: async () => {
    try {
      const response = await api.get('/products/orders/');
      return response.data.results || response.data || [];
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return []; // Return empty array on error
    }
  },

  // Get single order by ID
  getOrder: async (orderId) => {
    try {
      const response = await api.get(`/products/orders/${orderId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  // Create order from cart (checkout)
  checkout: async () => {
    try {
      const response = await api.post('/products/checkout/');
      return response.data;
    } catch (error) {
      console.error('Error during checkout:', error);
      throw error;
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

  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  getUserRole: () => {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        return user.role || 'portal'; // default to portal if role not found
      }
      return null;
    } catch (error) {
      console.error('Error parsing user role:', error);
      return null;
    }
  },
};

export default api;
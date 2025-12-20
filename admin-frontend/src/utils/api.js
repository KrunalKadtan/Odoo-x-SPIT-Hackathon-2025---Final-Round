import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_access_token');
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
      
      const refreshToken = localStorage.getItem('admin_refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post('http://localhost:8000/api/token/refresh/', {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          localStorage.setItem('admin_access_token', access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          adminTokenUtils.clearTokens();
          window.location.href = '/signin';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Admin token utilities
export const adminTokenUtils = {
  setTokens: (tokens) => {
    localStorage.setItem('admin_access_token', tokens.access);
    localStorage.setItem('admin_refresh_token', tokens.refresh);
  },

  clearTokens: () => {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user_data');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('admin_access_token');
  },

  getUserRole: () => {
    try {
      const userData = localStorage.getItem('admin_user_data');
      if (userData) {
        const user = JSON.parse(userData);
        return user.role || 'internal';
      }
      return null;
    } catch (error) {
      console.error('Error parsing admin user role:', error);
      return null;
    }
  },

  getUserData: () => {
    try {
      const userData = localStorage.getItem('admin_user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing admin user data:', error);
      return null;
    }
  }
};

// Admin authentication API
export const adminAuthAPI = {
  // Sign in
  signin: async (credentials) => {
    console.log('Admin attempting signin with:', { email: credentials.email });
    try {
      const response = await api.post('/token/', credentials);
      console.log('Admin signin response:', response.data);
      
      // Get user profile after successful login
      try {
        const profileResponse = await api.get('/accounts/profile/', {
          headers: {
            Authorization: `Bearer ${response.data.access}`
          }
        });
        
        console.log('Admin profile response:', profileResponse.data);
        
        // Verify user is internal
        if (profileResponse.data.role !== 'internal') {
          throw new Error('Access denied. Internal users only.');
        }
        
        // Store user data
        localStorage.setItem('admin_user_data', JSON.stringify(profileResponse.data));
      } catch (profileError) {
        console.warn('Could not fetch admin profile:', profileError);
        // Store basic user info from token if profile fetch fails
        const userData = {
          email: credentials.email,
          name: credentials.email.split('@')[0],
          role: 'internal'
        };
        localStorage.setItem('admin_user_data', JSON.stringify(userData));
      }
      
      return response.data;
    } catch (error) {
      console.error('Admin signin error details:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get user profile
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

// Admin Products API
export const adminProductsAPI = {
  // Get all products with filtering
  getProducts: async (params = {}) => {
    const response = await api.get('/products/admin/products/', { params });
    return response.data;
  },

  // Get single product by ID
  getProduct: async (id) => {
    const response = await api.get(`/products/admin/products/${id}/`);
    return response.data;
  },

  // Create new product
  createProduct: async (productData) => {
    const response = await api.post('/products/admin/products/', productData);
    return response.data;
  },

  // Update product
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/admin/products/${id}/`, productData);
    return response.data;
  },

  // Delete product
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/admin/products/${id}/`);
    return response.data;
  },

  // Toggle published status
  togglePublished: async (id, published) => {
    const response = await api.patch(`/products/admin/products/${id}/toggle-published/`, {
      published: published
    });
    return response.data;
  },

  // Upload product image
  uploadImage: async (formData) => {
    const response = await api.post('/products/admin/images/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api;
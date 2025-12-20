import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
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
    const response = await api.post('/token/', credentials);
    
    // Get user profile after successful login
    try {
      const profileResponse = await api.get('/accounts/profile/', {
        headers: {
          Authorization: `Bearer ${response.data.access}`
        }
      });
      
      // Store user data
      localStorage.setItem('user_data', JSON.stringify(profileResponse.data));
    } catch (profileError) {
      console.warn('Could not fetch user profile:', profileError);
      // Store basic user info from token if profile fetch fails
      const userData = {
        email: credentials.email,
        name: credentials.email.split('@')[0] // fallback name
      };
      localStorage.setItem('user_data', JSON.stringify(userData));
    }
    
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/token/refresh/', { refresh: refreshToken });
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

  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },
};

export default api;
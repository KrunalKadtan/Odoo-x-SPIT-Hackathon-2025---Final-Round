import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuthAPI, adminTokenUtils } from '../utils/api';
import { useNotification } from '../context/NotificationContext';

const SignIn = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsLoading(true);
    setErrors({});

    try {
      const response = await adminAuthAPI.signin(formData);
      
      // Store tokens
      adminTokenUtils.setTokens(response);
      
      // Check if user is internal
      const userRole = adminTokenUtils.getUserRole();
      if (userRole === 'internal') {
        showNotification('Welcome to ApparelDesk Admin Panel', 'success');
        navigate('/products');
      } else {
        setErrors({ general: 'Access denied. Internal users only.' });
        adminTokenUtils.clearTokens();
      }
      
    } catch (error) {
      console.error('Admin signin error:', error);
      
      if (error.response?.status === 401) {
        setErrors({ general: 'Invalid credentials' });
      } else if (error.message === 'Access denied. Internal users only.') {
        setErrors({ general: 'Access denied. Internal users only.' });
      } else {
        setErrors({ general: 'An error occurred during sign in. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-primary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="bg-app-accent text-white px-6 py-3 rounded-pro font-mono text-xl tracking-wider inline-block mb-6">
            APPARELDESK
          </div>
          <h2 className="text-3xl font-display font-bold text-app-main mb-2">
            Admin Access
          </h2>
          <p className="text-app-muted font-sans">
            Sign in to ApparelDesk Admin Panel
          </p>
        </div>

        {/* Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-pro text-sm">
                {errors.general}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="form-label">
                Admin Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter admin email"
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="form-label">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input pr-12"
                  placeholder="Enter admin password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-app-muted hover:text-app-main transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="loading-spinner w-5 h-5 mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Admin Sign In'
                )}
              </button>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-app-muted font-sans">
                For internal staff only
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
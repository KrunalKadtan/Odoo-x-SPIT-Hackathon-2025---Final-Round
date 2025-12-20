import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import PasswordInput from '../components/PasswordInput';
import Button from '../components/Button';
import { authAPI, tokenUtils } from '../utils/api';

const AdminSignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: 'admin@appareldesk.com', // Pre-filled for testing
    password: 'admin123'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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
      const response = await authAPI.signin(formData);
      
      // Store tokens
      tokenUtils.setTokens(response);
      
      // Check if user is internal
      const userRole = tokenUtils.getUserRole();
      if (userRole === 'internal') {
        navigate('/admin/products');
      } else {
        setErrors({ general: 'Access denied. Internal users only.' });
        tokenUtils.clearTokens();
      }
      
    } catch (error) {
      console.error('Admin signin error:', error);
      
      if (error.response?.status === 401) {
        setErrors({ general: 'Invalid credentials' });
      } else {
        setErrors({ general: 'An error occurred during sign in. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Admin Access" 
      subtitle="Sign in to ApparelDesk Admin Panel"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {errors.general}
          </div>
        )}

        <FormInput
          label="Admin Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="Enter admin email"
          required
        />

        <PasswordInput
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Enter admin password"
          required
        />

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Admin Sign In'}
          </Button>
        </div>

        <div className="text-center pt-4">
          <p className="text-sm text-app-muted font-sans">
            For internal staff only
          </p>
          <p className="text-sm text-app-muted font-sans mt-2">
            Portal user?{' '}
            <Link 
              to="/signin" 
              className="text-app-accent hover:text-app-accent/80 font-medium transition-colors"
            >
              Customer Sign In
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default AdminSignIn;
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import PasswordInput from '../components/PasswordInput';
import Button from '../components/Button';
import { authAPI, tokenUtils } from '../utils/api';
import { validateSigninForm } from '../utils/validation';

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateSigninForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await authAPI.signin(formData);
      
      // Store tokens
      tokenUtils.setTokens(response);
      
      // Redirect to home page
      navigate('/');
      
    } catch (error) {
      console.error('Signin error:', error);
      
      if (error.response?.status === 401) {
        // Handle authentication errors
        const errorDetail = error.response.data?.detail;
        
        if (errorDetail?.includes('No active account found')) {
          setErrors({ email: 'Account not exist' });
        } else if (errorDetail?.includes('credentials')) {
          setErrors({ password: 'Invalid Password' });
        } else {
          setErrors({ general: 'Invalid email or password' });
        }
      } else if (error.response?.data?.errors) {
        // Handle validation errors from backend
        const backendErrors = error.response.data.errors;
        const formattedErrors = {};
        
        Object.keys(backendErrors).forEach(field => {
          if (Array.isArray(backendErrors[field])) {
            formattedErrors[field] = backendErrors[field][0];
          } else {
            formattedErrors[field] = backendErrors[field];
          }
        });
        
        setErrors(formattedErrors);
      } else {
        setErrors({ general: 'An error occurred during sign in. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Sign in to your ApparelDesk account"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-pro text-sm">
            {errors.general}
          </div>
        )}

        <FormInput
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="Enter your email address"
          required
        />

        <PasswordInput
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Enter your password"
          required
        />

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link 
              to="/forgot-password" 
              className="text-app-accent hover:text-app-accent/80 font-medium transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </div>

        <div className="text-center pt-4">
          <p className="text-sm text-app-muted font-sans">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="text-app-accent hover:text-app-accent/80 font-medium transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default SignIn;
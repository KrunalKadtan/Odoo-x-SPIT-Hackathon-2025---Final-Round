import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import PasswordInput from '../components/PasswordInput';
import Button from '../components/Button';
import { authAPI, tokenUtils } from '../utils/api';
import { validateSignupForm } from '../utils/validation';

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    city: '',
    state: '',
    pincode: ''
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
    const validationErrors = validateSignupForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Prepare data for API (exclude confirmPassword)
      const { confirmPassword, ...apiData } = formData;
      
      // Remove empty optional fields
      Object.keys(apiData).forEach(key => {
        if (!apiData[key].trim() && ['mobile', 'city', 'state', 'pincode'].includes(key)) {
          delete apiData[key];
        }
      });

      const response = await authAPI.signup(apiData);
      
      // Don't store tokens, let user sign in manually
      // tokenUtils.setTokens(response.tokens);
      
      // Show success message and redirect to signin
      alert('Account created successfully! Please sign in with your credentials.');
      navigate('/signin');
      
    } catch (error) {
      console.error('Signup error:', error);
      
      if (error.response?.data?.errors) {
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
      } else if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
      } else {
        setErrors({ general: 'An error occurred during signup. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Create Account" 
      subtitle="Join ApparelDesk to manage your apparel business"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-pro text-sm">
            {errors.general}
          </div>
        )}

        <FormInput
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Enter your full name"
          required
        />

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
          placeholder="Create a strong password"
          required
        />

        <PasswordInput
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          placeholder="Confirm your password"
          required
        />

        <FormInput
          label="Mobile Number"
          type="tel"
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
          error={errors.mobile}
          placeholder="+1234567890 (optional)"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
            error={errors.city}
            placeholder="City (optional)"
          />

          <FormInput
            label="State"
            name="state"
            value={formData.state}
            onChange={handleChange}
            error={errors.state}
            placeholder="State (optional)"
          />
        </div>

        <FormInput
          label="Pincode"
          name="pincode"
          value={formData.pincode}
          onChange={handleChange}
          error={errors.pincode}
          placeholder="6-digit pincode (optional)"
        />

        <div className="pt-4">
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </div>

        <div className="text-center pt-4">
          <p className="text-sm text-app-muted font-sans">
            Already have an account?{' '}
            <Link 
              to="/signin" 
              className="text-app-accent hover:text-app-accent/80 font-medium transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default SignUp;
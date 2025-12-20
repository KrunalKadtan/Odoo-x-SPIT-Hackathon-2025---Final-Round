import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import { validateEmail } from '../utils/validation';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    
    // Clear error when user starts typing
    if (errors.email) {
      setErrors({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }
    
    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // TODO: Implement forgot password API call
      // For now, we'll simulate the request
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSubmitted(true);
      
    } catch (error) {
      console.error('Forgot password error:', error);
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout 
        title="Check Your Email" 
        subtitle="We've sent password reset instructions to your email"
      >
        <div className="text-center space-y-6">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-pro text-sm">
            If an account with email <strong>{email}</strong> exists, you will receive password reset instructions shortly.
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-app-muted font-sans">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            
            <Button
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
              }}
              variant="outline"
            >
              Try Again
            </Button>
          </div>

          <div className="text-center pt-4">
            <Link 
              to="/signin" 
              className="text-app-accent hover:text-app-accent/80 font-medium transition-colors text-sm"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Forgot Password" 
      subtitle="Enter your email to receive reset instructions"
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
          value={email}
          onChange={handleChange}
          error={errors.email}
          placeholder="Enter your email address"
          required
        />

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Sending Instructions...' : 'Send Reset Instructions'}
          </Button>
        </div>

        <div className="text-center pt-4">
          <p className="text-sm text-app-muted font-sans">
            Remember your password?{' '}
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

export default ForgotPassword;
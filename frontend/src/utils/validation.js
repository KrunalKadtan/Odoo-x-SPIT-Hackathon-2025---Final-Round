import { errorUtils } from './api';

// Password validation function
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return errors;
};

// Email validation function
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone number validation function
export const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Pincode validation function
export const validatePincode = (pincode) => {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
};

// Form validation for signup
export const validateSignupForm = (formData) => {
  const errors = {};
  
  // Name validation
  if (!formData.name?.trim()) {
    errors.name = 'Name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  }
  
  // Email validation
  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Password validation
  if (!formData.password) {
    errors.password = 'Password is required';
  } else {
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      errors.password = passwordErrors[0]; // Show first error
    }
  }
  
  // Confirm password validation
  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  // Optional field validations
  if (formData.mobile && !validatePhone(formData.mobile)) {
    errors.mobile = 'Please enter a valid phone number';
  }
  
  if (formData.pincode && !validatePincode(formData.pincode)) {
    errors.pincode = 'Please enter a valid 6-digit pincode';
  }
  
  return errors;
};

// Form validation for signin
export const validateSigninForm = (formData) => {
  const errors = {};
  
  // Email validation
  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Password validation
  if (!formData.password) {
    errors.password = 'Password is required';
  }
  
  return errors;
};

// Form validation for profile update
export const validateProfileForm = (formData) => {
  const errors = {};
  
  // Name validation
  if (!formData.name?.trim()) {
    errors.name = 'Name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  }
  
  // Email validation
  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Optional field validations
  if (formData.mobile && !validatePhone(formData.mobile)) {
    errors.mobile = 'Please enter a valid phone number';
  }
  
  if (formData.pincode && !validatePincode(formData.pincode)) {
    errors.pincode = 'Please enter a valid 6-digit pincode';
  }
  
  return errors;
};

// Form validation for checkout
export const validateCheckoutForm = (formData) => {
  const errors = {};
  
  // Shipping address validation
  if (!formData.address?.trim()) {
    errors.address = 'Address is required';
  }
  
  if (!formData.city?.trim()) {
    errors.city = 'City is required';
  }
  
  if (!formData.state?.trim()) {
    errors.state = 'State is required';
  }
  
  if (!formData.pincode?.trim()) {
    errors.pincode = 'Pincode is required';
  } else if (!validatePincode(formData.pincode)) {
    errors.pincode = 'Please enter a valid 6-digit pincode';
  }
  
  return errors;
};

// Generic form validation utility
export const validateForm = (formData, validationRules) => {
  const errors = {};
  
  Object.keys(validationRules).forEach(field => {
    const rules = validationRules[field];
    const value = formData[field];
    
    // Required field validation
    if (rules.required && (!value || !value.toString().trim())) {
      errors[field] = rules.requiredMessage || `${field} is required`;
      return;
    }
    
    // Skip other validations if field is empty and not required
    if (!value || !value.toString().trim()) {
      return;
    }
    
    // Min length validation
    if (rules.minLength && value.toString().length < rules.minLength) {
      errors[field] = rules.minLengthMessage || `${field} must be at least ${rules.minLength} characters long`;
      return;
    }
    
    // Max length validation
    if (rules.maxLength && value.toString().length > rules.maxLength) {
      errors[field] = rules.maxLengthMessage || `${field} must be no more than ${rules.maxLength} characters long`;
      return;
    }
    
    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value.toString())) {
      errors[field] = rules.patternMessage || `${field} format is invalid`;
      return;
    }
    
    // Custom validation function
    if (rules.validator && typeof rules.validator === 'function') {
      const customError = rules.validator(value, formData);
      if (customError) {
        errors[field] = customError;
        return;
      }
    }
  });
  
  return errors;
};

// Form error display utilities
export const formErrorUtils = {
  // Merge API errors with client-side validation errors
  mergeErrors: (validationErrors, apiError) => {
    const apiFieldErrors = errorUtils.getFieldErrors(apiError);
    return { ...validationErrors, ...apiFieldErrors };
  },
  
  // Check if form has any errors
  hasErrors: (errors) => {
    return Object.keys(errors).length > 0;
  },
  
  // Get first error message
  getFirstError: (errors) => {
    const firstKey = Object.keys(errors)[0];
    return firstKey ? errors[firstKey] : null;
  },
  
  // Format errors for display
  formatErrorsForDisplay: (errors) => {
    return Object.entries(errors).map(([field, message]) => ({
      field,
      message
    }));
  },
  
  // Clear specific field error
  clearFieldError: (errors, field) => {
    const newErrors = { ...errors };
    delete newErrors[field];
    return newErrors;
  },
  
  // Set field error
  setFieldError: (errors, field, message) => {
    return { ...errors, [field]: message };
  }
};
import React from 'react';

const FormInput = ({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  error, 
  placeholder,
  required = false,
  disabled = false,
  loading = false,
  helperText,
  autoComplete,
  maxLength,
  minLength,
  pattern,
  onBlur,
  onFocus,
  className = '',
  inputClassName = '',
  ...props
}) => {
  const inputId = `input-${name}`;
  const errorId = `error-${name}`;
  const helperId = `helper-${name}`;

  return (
    <div className={`mb-4 ${className}`}>
      <label 
        htmlFor={inputId} 
        className="block text-sm font-sans font-normal text-app-main mb-2"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      <div className="relative">
        <input
          type={type}
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled || loading}
          autoComplete={autoComplete}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${error ? errorId : ''} ${helperText ? helperId : ''}`.trim()}
          className={`w-full px-4 py-3 rounded-pro border font-sans text-sm
            ${error 
              ? 'border-red-500 focus:border-red-500' 
              : 'border-app-border focus:border-app-accent'
            }
            ${disabled || loading 
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
              : 'bg-app-surface text-app-main'
            }
            placeholder-app-muted
            focus:outline-none focus:ring-1 focus:ring-app-accent/20
            transition-colors duration-200
            ${inputClassName}
          `}
          required={required}
          {...props}
        />
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-app-accent border-t-transparent"></div>
          </div>
        )}
      </div>
      
      {error && (
        <p 
          id={errorId}
          className="mt-1 text-sm text-red-500 font-sans flex items-center"
          role="alert"
        >
          <svg 
            className="w-4 h-4 mr-1 flex-shrink-0" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p 
          id={helperId}
          className="mt-1 text-sm text-app-muted font-sans"
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default FormInput;
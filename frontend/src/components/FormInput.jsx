import React from 'react';

const FormInput = ({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  error, 
  placeholder,
  required = false 
}) => {
  return (
    <div className="mb-4">
      <label 
        htmlFor={name} 
        className="block text-sm font-sans font-normal text-app-main mb-2"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-pro border font-sans text-sm
          ${error 
            ? 'border-red-500 focus:border-red-500' 
            : 'border-app-border focus:border-app-accent'
          }
          bg-app-surface text-app-main placeholder-app-muted
          focus:outline-none focus:ring-1 focus:ring-app-accent/20
          transition-colors duration-200
        `}
        required={required}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500 font-sans">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;
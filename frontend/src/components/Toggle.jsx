import React from 'react';

const Toggle = ({
  id,
  name,
  checked = false,
  onChange,
  disabled = false,
  label,
  description,
  size = 'medium',
  variant = 'primary',
  className = '',
  labelClassName = '',
  ...props
}) => {
  const sizeStyles = {
    small: {
      switch: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4'
    },
    medium: {
      switch: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5'
    },
    large: {
      switch: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7'
    }
  };

  const variantStyles = {
    primary: {
      enabled: 'bg-app-accent',
      disabled: 'bg-app-accent/50'
    },
    secondary: {
      enabled: 'bg-app-secondary',
      disabled: 'bg-app-secondary/50'
    },
    success: {
      enabled: 'bg-green-500',
      disabled: 'bg-green-300'
    },
    warning: {
      enabled: 'bg-yellow-500',
      disabled: 'bg-yellow-300'
    },
    error: {
      enabled: 'bg-red-500',
      disabled: 'bg-red-300'
    }
  };

  const currentSize = sizeStyles[size];
  const currentVariant = variantStyles[variant];

  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`flex items-start space-x-3 ${className}`}>
      <div className="flex-shrink-0">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={id ? `${id}-label` : undefined}
          aria-describedby={id && description ? `${id}-description` : undefined}
          disabled={disabled}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className={`
            relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-app-accent/20 focus:ring-offset-2
            ${currentSize.switch}
            ${checked 
              ? (disabled ? currentVariant.disabled : currentVariant.enabled)
              : 'bg-gray-200'
            }
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          `}
          {...props}
        >
          <span
            className={`
              inline-block rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out
              ${currentSize.thumb}
              ${checked ? currentSize.translate : 'translate-x-0.5'}
            `}
          />
        </button>
        
        {/* Hidden input for form compatibility */}
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={() => {}} // Controlled by button
          className="sr-only"
          tabIndex={-1}
        />
      </div>

      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <label
              id={id ? `${id}-label` : undefined}
              htmlFor={id}
              className={`
                block text-sm font-sans font-medium text-app-main cursor-pointer
                ${disabled ? 'opacity-50' : ''}
                ${labelClassName}
              `}
              onClick={handleToggle}
            >
              {label}
            </label>
          )}
          {description && (
            <p
              id={id ? `${id}-description` : undefined}
              className={`
                mt-1 text-sm text-app-muted
                ${disabled ? 'opacity-50' : ''}
              `}
            >
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Toggle;
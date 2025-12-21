import React from 'react';

const Button = ({ 
  children, 
  type = 'button', 
  onClick, 
  variant = 'primary',
  disabled = false,
  fullWidth = true 
}) => {
  const baseStyles = `
    px-6 py-3 rounded-pro font-mono text-sm tracking-widest uppercase
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    primary: `
      bg-app-accent text-white hover:bg-app-accent/90
      focus:ring-app-accent/50
    `,
    secondary: `
      bg-app-accent-soft text-app-main hover:bg-app-accent-soft/80
      focus:ring-app-accent-soft/50
    `,
    outline: `
      border border-app-border text-app-main hover:bg-app-secondary
      focus:ring-app-border
    `,
    warning: `
      bg-yellow-500 text-white hover:bg-yellow-600
      focus:ring-yellow-500/50
    `,
    error: `
      bg-red-500 text-white hover:bg-red-600
      focus:ring-red-500/50
    `,
    success: `
      bg-green-500 text-white hover:bg-green-600
      focus:ring-green-500/50
    `
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${fullWidth ? 'w-full' : ''}
      `}
    >
      {children}
    </button>
  );
};

export default Button;
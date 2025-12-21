import React from 'react';

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'medium',
  className = '',
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center font-mono font-medium rounded-pro';
  
  const sizeStyles = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1 text-sm',
    large: 'px-4 py-2 text-base'
  };

  const variantStyles = {
    default: 'bg-app-secondary text-app-main',
    primary: 'bg-app-accent text-white',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    error: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    
    // Status-specific variants
    active: 'bg-green-100 text-green-800 border border-green-200',
    inactive: 'bg-gray-100 text-gray-800 border border-gray-200',
    blocked: 'bg-red-100 text-red-800 border border-red-200',
    suspended: 'bg-orange-100 text-orange-800 border border-orange-200',
    pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    approved: 'bg-green-100 text-green-800 border border-green-200',
    rejected: 'bg-red-100 text-red-800 border border-red-200',
    
    // Risk level variants
    low: 'bg-green-100 text-green-800 border border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    high: 'bg-red-100 text-red-800 border border-red-200'
  };

  return (
    <span 
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

// Status Badge component for common status indicators
export const StatusBadge = ({ status, ...props }) => {
  const getVariantFromStatus = (status) => {
    const statusLower = status?.toLowerCase();
    
    switch (statusLower) {
      case 'active':
      case 'approved':
      case 'completed':
      case 'paid':
      case 'verified':
        return 'success';
      
      case 'inactive':
      case 'draft':
      case 'cancelled':
        return 'default';
      
      case 'blocked':
      case 'rejected':
      case 'failed':
      case 'error':
        return 'error';
      
      case 'suspended':
      case 'warning':
        return 'warning';
      
      case 'pending':
      case 'processing':
      case 'waiting':
        return 'pending';
      
      default:
        return 'default';
    }
  };

  const formatStatus = (status) => {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  return (
    <Badge variant={getVariantFromStatus(status)} {...props}>
      {formatStatus(status)}
    </Badge>
  );
};

// Risk Level Badge component
export const RiskBadge = ({ level, ...props }) => {
  const riskVariants = {
    low: 'low',
    medium: 'medium', 
    high: 'high'
  };

  return (
    <Badge variant={riskVariants[level?.toLowerCase()] || 'default'} {...props}>
      {level?.toUpperCase() || 'UNKNOWN'} RISK
    </Badge>
  );
};

export default Badge;
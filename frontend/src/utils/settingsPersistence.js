import { auditLogger, ACTION_TYPES, RESOURCE_TYPES } from './auditLogger';
import { adminUtils } from './adminUtils';

/**
 * Settings Persistence Utility
 * Handles settings validation, persistence, and real-time application
 */

// Settings categories for organization
export const SETTINGS_CATEGORIES = {
  PLATFORM: 'platform',
  BUSINESS: 'business',
  FEATURES: 'features',
  PAYMENT: 'payment',
  SECURITY: 'security',
  MAINTENANCE: 'maintenance',
  NOTIFICATIONS: 'notifications',
  SEO: 'seo'
};

// Settings that require immediate application
export const IMMEDIATE_APPLY_SETTINGS = [
  'maintenanceMode',
  'enableUserRegistration',
  'enableVendorRegistration',
  'enableGuestCheckout',
  'sessionTimeoutMinutes',
  'maxLoginAttempts'
];

// Settings that require server restart (for information purposes)
export const RESTART_REQUIRED_SETTINGS = [
  'enableTwoFactorAuth',
  'enableSMSNotifications'
];

/**
 * Settings Persistence Manager
 */
export class SettingsPersistenceManager {
  constructor() {
    this.pendingChanges = new Map();
    this.validationRules = this.initializeValidationRules();
    this.changeListeners = new Set();
  }

  /**
   * Initialize validation rules for different settings
   */
  initializeValidationRules() {
    return {
      // Platform settings
      platformName: {
        required: true,
        minLength: 2,
        maxLength: 100,
        pattern: /^[a-zA-Z0-9\s\-_]+$/,
        message: 'Platform name must be 2-100 characters and contain only letters, numbers, spaces, hyphens, and underscores'
      },
      
      supportEmail: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address'
      },
      
      platformDescription: {
        maxLength: 500,
        message: 'Platform description must be less than 500 characters'
      },

      // Business settings
      commissionPercentage: {
        required: true,
        type: 'number',
        min: 0,
        max: 100,
        message: 'Commission percentage must be between 0 and 100'
      },
      
      minimumOrderAmount: {
        required: true,
        type: 'number',
        min: 0,
        message: 'Minimum order amount must be a positive number'
      },
      
      maximumOrderAmount: {
        required: true,
        type: 'number',
        min: 0,
        message: 'Maximum order amount must be a positive number'
      },

      // Security settings
      sessionTimeoutMinutes: {
        required: true,
        type: 'number',
        min: 5,
        max: 480,
        message: 'Session timeout must be between 5 and 480 minutes'
      },
      
      maxLoginAttempts: {
        required: true,
        type: 'number',
        min: 3,
        max: 10,
        message: 'Max login attempts must be between 3 and 10'
      },

      // Maintenance settings
      maintenanceMessage: {
        maxLength: 500,
        message: 'Maintenance message must be less than 500 characters'
      }
    };
  }

  /**
   * Validate a single setting
   */
  validateSetting(key, value) {
    const rule = this.validationRules[key];
    if (!rule) return { isValid: true };

    const errors = [];

    // Required check
    if (rule.required && (value === null || value === undefined || value === '')) {
      errors.push(`${key} is required`);
      return { isValid: false, errors };
    }

    // Skip other validations if value is empty and not required
    if (!rule.required && (value === null || value === undefined || value === '')) {
      return { isValid: true };
    }

    // Type validation
    if (rule.type === 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        errors.push(`${key} must be a valid number`);
        return { isValid: false, errors };
      }
      value = numValue;
    }

    // Min/Max validation for numbers
    if (rule.type === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(rule.message || `${key} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(rule.message || `${key} must be at most ${rule.max}`);
      }
    }

    // Length validation for strings
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(rule.message || `${key} must be at least ${rule.minLength} characters`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(rule.message || `${key} must be at most ${rule.maxLength} characters`);
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push(rule.message || `${key} format is invalid`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate multiple settings
   */
  validateSettings(settings) {
    const allErrors = {};
    const warnings = [];
    let isValid = true;

    // Validate individual settings
    Object.entries(settings).forEach(([key, value]) => {
      const validation = this.validateSetting(key, value);
      if (!validation.isValid) {
        allErrors[key] = validation.errors[0]; // Take first error
        isValid = false;
      }
    });

    // Cross-field validation
    if (settings.minimumOrderAmount && settings.maximumOrderAmount) {
      const min = parseFloat(settings.minimumOrderAmount);
      const max = parseFloat(settings.maximumOrderAmount);
      if (!isNaN(min) && !isNaN(max) && max < min) {
        allErrors.maximumOrderAmount = 'Maximum order amount must be greater than minimum order amount';
        isValid = false;
      }
    }

    // Business logic warnings
    if (settings.commissionPercentage && parseFloat(settings.commissionPercentage) > 50) {
      warnings.push('Commission percentage is unusually high (>50%)');
    }

    if (settings.sessionTimeoutMinutes && parseInt(settings.sessionTimeoutMinutes) < 15) {
      warnings.push('Session timeout is very short (<15 minutes)');
    }

    return {
      isValid,
      errors: allErrors,
      warnings
    };
  }

  /**
   * Queue a setting change for batch processing
   */
  queueChange(key, value, oldValue) {
    this.pendingChanges.set(key, {
      key,
      value,
      oldValue,
      timestamp: new Date().toISOString(),
      category: this.getSettingCategory(key)
    });
  }

  /**
   * Get the category of a setting
   */
  getSettingCategory(key) {
    const categoryMap = {
      platformName: SETTINGS_CATEGORIES.PLATFORM,
      platformDescription: SETTINGS_CATEGORIES.PLATFORM,
      supportEmail: SETTINGS_CATEGORIES.PLATFORM,
      
      commissionPercentage: SETTINGS_CATEGORIES.BUSINESS,
      minimumOrderAmount: SETTINGS_CATEGORIES.BUSINESS,
      maximumOrderAmount: SETTINGS_CATEGORIES.BUSINESS,
      
      enableUserRegistration: SETTINGS_CATEGORIES.FEATURES,
      enableVendorRegistration: SETTINGS_CATEGORIES.FEATURES,
      enableGuestCheckout: SETTINGS_CATEGORIES.FEATURES,
      enableProductReviews: SETTINGS_CATEGORIES.FEATURES,
      enableWishlist: SETTINGS_CATEGORIES.FEATURES,
      enableCoupons: SETTINGS_CATEGORIES.FEATURES,
      
      enableRazorpay: SETTINGS_CATEGORIES.PAYMENT,
      enableCOD: SETTINGS_CATEGORIES.PAYMENT,
      enableWalletPayments: SETTINGS_CATEGORIES.PAYMENT,
      
      enableTwoFactorAuth: SETTINGS_CATEGORIES.SECURITY,
      sessionTimeoutMinutes: SETTINGS_CATEGORIES.SECURITY,
      maxLoginAttempts: SETTINGS_CATEGORIES.SECURITY,
      
      maintenanceMode: SETTINGS_CATEGORIES.MAINTENANCE,
      maintenanceMessage: SETTINGS_CATEGORIES.MAINTENANCE,
      allowAdminAccess: SETTINGS_CATEGORIES.MAINTENANCE,
      
      enableEmailNotifications: SETTINGS_CATEGORIES.NOTIFICATIONS,
      enableSMSNotifications: SETTINGS_CATEGORIES.NOTIFICATIONS,
      enablePushNotifications: SETTINGS_CATEGORIES.NOTIFICATIONS,
      
      metaTitle: SETTINGS_CATEGORIES.SEO,
      metaDescription: SETTINGS_CATEGORIES.SEO,
      metaKeywords: SETTINGS_CATEGORIES.SEO
    };

    return categoryMap[key] || 'other';
  }

  /**
   * Apply settings changes immediately (client-side)
   */
  applyImmediateChanges(settings) {
    const appliedChanges = [];

    Object.entries(settings).forEach(([key, value]) => {
      if (IMMEDIATE_APPLY_SETTINGS.includes(key)) {
        try {
          this.applySettingClientSide(key, value);
          appliedChanges.push(key);
        } catch (error) {
          console.error(`Failed to apply setting ${key} immediately:`, error);
        }
      }
    });

    return appliedChanges;
  }

  /**
   * Apply a single setting on the client side
   */
  applySettingClientSide(key, value) {
    switch (key) {
      case 'sessionTimeoutMinutes':
        // Update session timeout
        this.updateSessionTimeout(value);
        break;
        
      case 'maintenanceMode':
        // Maintenance mode is handled by MaintenanceWrapper
        // Just notify listeners
        this.notifyChangeListeners(key, value);
        break;
        
      default:
        // For other settings, just notify listeners
        this.notifyChangeListeners(key, value);
    }
  }

  /**
   * Update session timeout
   */
  updateSessionTimeout(minutes) {
    // This would integrate with the authentication system
    // For now, just store in localStorage for reference
    localStorage.setItem('sessionTimeoutMinutes', minutes.toString());
    
    // Notify authentication system if available
    if (window.authManager && window.authManager.updateSessionTimeout) {
      window.authManager.updateSessionTimeout(minutes);
    }
  }

  /**
   * Add a change listener
   */
  addChangeListener(listener) {
    this.changeListeners.add(listener);
  }

  /**
   * Remove a change listener
   */
  removeChangeListener(listener) {
    this.changeListeners.delete(listener);
  }

  /**
   * Notify all change listeners
   */
  notifyChangeListeners(key, value) {
    this.changeListeners.forEach(listener => {
      try {
        listener(key, value);
      } catch (error) {
        console.error('Error in settings change listener:', error);
      }
    });
  }

  /**
   * Create audit trail for settings changes
   */
  async createAuditTrail(changes) {
    const adminUser = adminUtils.getAdminUserData();
    if (!adminUser) return;

    try {
      // Group changes by category
      const changesByCategory = {};
      changes.forEach(change => {
        const category = change.category;
        if (!changesByCategory[category]) {
          changesByCategory[category] = [];
        }
        changesByCategory[category].push(change);
      });

      // Log each category of changes
      for (const [category, categoryChanges] of Object.entries(changesByCategory)) {
        const settingNames = categoryChanges.map(c => c.key).join(', ');
        const description = `Updated ${category} settings: ${settingNames}`;
        
        await auditLogger.systemSettingsUpdated(
          settingNames,
          categoryChanges.map(c => ({ [c.key]: c.oldValue })),
          categoryChanges.map(c => ({ [c.key]: c.value }))
        );
      }
    } catch (error) {
      console.error('Failed to create audit trail for settings changes:', error);
    }
  }

  /**
   * Process all pending changes
   */
  async processPendingChanges() {
    if (this.pendingChanges.size === 0) return;

    const changes = Array.from(this.pendingChanges.values());
    
    try {
      // Create audit trail
      await this.createAuditTrail(changes);
      
      // Clear pending changes
      this.pendingChanges.clear();
      
      return { success: true, processedCount: changes.length };
    } catch (error) {
      console.error('Failed to process pending settings changes:', error);
      return { success: false, error };
    }
  }

  /**
   * Get settings that require restart
   */
  getRestartRequiredSettings(changedSettings) {
    return Object.keys(changedSettings).filter(key => 
      RESTART_REQUIRED_SETTINGS.includes(key)
    );
  }

  /**
   * Clear all pending changes
   */
  clearPendingChanges() {
    this.pendingChanges.clear();
  }

  /**
   * Get pending changes count
   */
  getPendingChangesCount() {
    return this.pendingChanges.size;
  }
}

// Create singleton instance
export const settingsPersistence = new SettingsPersistenceManager();

export default settingsPersistence;
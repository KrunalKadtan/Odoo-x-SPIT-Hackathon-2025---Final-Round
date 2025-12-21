import { adminAPI } from '../utils/api';
import { auditLogger } from '../utils/auditLogger';
import { settingsPersistence } from '../utils/settingsPersistence';

/**
 * System Settings Service
 * Handles all system settings related API calls and business logic
 */
export const settingsService = {
  /**
   * Get all system settings
   * @returns {Promise<Object>} System settings object
   */
  getSettings: async () => {
    try {
      const response = await adminAPI.getSystemSettings();
      return response;
    } catch (error) {
      console.error('Failed to fetch system settings:', error);
      throw error;
    }
  },

  /**
   * Update system settings with validation and persistence
   * @param {Object} settings - Settings to update
   * @param {Object} originalSettings - Original settings for comparison
   * @returns {Promise<Object>} Updated settings
   */
  updateSettings: async (settings, originalSettings = {}) => {
    try {
      // Validate settings
      const validation = settingsPersistence.validateSettings(settings);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`);
      }

      // Queue changes for audit trail
      Object.entries(settings).forEach(([key, value]) => {
        const oldValue = originalSettings[key];
        if (oldValue !== value) {
          settingsPersistence.queueChange(key, value, oldValue);
        }
      });

      // Update settings via API
      const response = await adminAPI.updateSystemSettings(settings);
      
      // Apply immediate changes on client side
      const appliedChanges = settingsPersistence.applyImmediateChanges(settings);
      
      // Process pending changes for audit trail
      await settingsPersistence.processPendingChanges();

      // Log the settings update for audit trail
      auditLogger.logAdminAction('settings_update', {
        updatedSettings: Object.keys(settings),
        appliedImmediately: appliedChanges,
        timestamp: new Date().toISOString()
      });

      return {
        ...response,
        appliedImmediately: appliedChanges,
        restartRequired: settingsPersistence.getRestartRequiredSettings(settings),
        warnings: validation.warnings
      };
    } catch (error) {
      console.error('Failed to update system settings:', error);
      // Clear pending changes on error
      settingsPersistence.clearPendingChanges();
      throw error;
    }
  },

  /**
   * Update a single setting with validation
   * @param {string} key - Setting key
   * @param {any} value - Setting value
   * @param {any} oldValue - Previous value for audit trail
   * @returns {Promise<Object>} Updated settings
   */
  updateSetting: async (key, value, oldValue = null) => {
    try {
      // Validate single setting
      const validation = settingsPersistence.validateSetting(key, value);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Queue change for audit trail
      settingsPersistence.queueChange(key, value, oldValue);

      const response = await adminAPI.updateSystemSetting(key, value);
      
      // Apply immediate change if needed
      if (settingsPersistence.IMMEDIATE_APPLY_SETTINGS.includes(key)) {
        settingsPersistence.applySettingClientSide(key, value);
      }
      
      // Process pending changes for audit trail
      await settingsPersistence.processPendingChanges();

      // Log the individual setting update
      auditLogger.logAdminAction('setting_update', {
        settingKey: key,
        newValue: value,
        oldValue,
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error) {
      console.error(`Failed to update setting ${key}:`, error);
      settingsPersistence.clearPendingChanges();
      throw error;
    }
  },

  /**
   * Validate settings without saving
   * @param {Object} settings - Settings to validate
   * @returns {Object} Validation result
   */
  validateSettings: (settings) => {
    return settingsPersistence.validateSettings(settings);
  },

  /**
   * Enable maintenance mode
   * @param {Object} maintenanceData - Maintenance mode configuration
   * @returns {Promise<Object>} Updated settings
   */
  enableMaintenanceMode: async (maintenanceData = {}) => {
    try {
      const response = await adminAPI.enableMaintenanceMode(maintenanceData);
      
      // Apply maintenance mode immediately
      settingsPersistence.applySettingClientSide('maintenanceMode', true);
      
      // Log maintenance mode activation
      auditLogger.logAdminAction('maintenance_mode_enabled', {
        scheduledStart: maintenanceData.scheduledStart,
        estimatedDuration: maintenanceData.estimatedDuration,
        reason: maintenanceData.reason,
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error) {
      console.error('Failed to enable maintenance mode:', error);
      throw error;
    }
  },

  /**
   * Disable maintenance mode
   * @returns {Promise<Object>} Updated settings
   */
  disableMaintenanceMode: async () => {
    try {
      const response = await adminAPI.disableMaintenanceMode();
      
      // Apply maintenance mode change immediately
      settingsPersistence.applySettingClientSide('maintenanceMode', false);
      
      // Log maintenance mode deactivation
      auditLogger.logAdminAction('maintenance_mode_disabled', {
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error) {
      console.error('Failed to disable maintenance mode:', error);
      throw error;
    }
  },

  /**
   * Get maintenance mode status
   * @returns {Promise<Object>} Maintenance mode status
   */
  getMaintenanceStatus: async () => {
    try {
      const response = await adminAPI.getMaintenanceStatus();
      return response;
    } catch (error) {
      console.error('Failed to get maintenance status:', error);
      throw error;
    }
  },

  /**
   * Schedule maintenance mode
   * @param {Object} scheduleData - Maintenance schedule data
   * @returns {Promise<Object>} Scheduled maintenance info
   */
  scheduleMaintenanceMode: async (scheduleData) => {
    try {
      const response = await adminAPI.scheduleMaintenanceMode(scheduleData);
      
      // Log maintenance mode scheduling
      auditLogger.logAdminAction('maintenance_mode_scheduled', {
        scheduledStart: scheduleData.scheduledStart,
        scheduledEnd: scheduleData.scheduledEnd,
        reason: scheduleData.reason,
        notifyUsers: scheduleData.notifyUsers,
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error) {
      console.error('Failed to schedule maintenance mode:', error);
      throw error;
    }
  },

  /**
   * Cancel scheduled maintenance
   * @param {string} scheduleId - Maintenance schedule ID
   * @returns {Promise<Object>} Cancellation result
   */
  cancelScheduledMaintenance: async (scheduleId) => {
    try {
      const response = await adminAPI.cancelScheduledMaintenance(scheduleId);
      
      // Log maintenance cancellation
      auditLogger.logAdminAction('maintenance_mode_cancelled', {
        scheduleId,
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error) {
      console.error('Failed to cancel scheduled maintenance:', error);
      throw error;
    }
  },

  /**
   * Get default settings structure
   * @returns {Object} Default settings
   */
  getDefaultSettings: () => ({
    // Platform Configuration
    platformName: 'ApparelDesk',
    platformDescription: 'Your one-stop shop for quality apparel',
    supportEmail: 'support@appareldesk.com',
    
    // Business Settings
    commissionPercentage: 10.0,
    minimumOrderAmount: 50.0,
    maximumOrderAmount: 10000.0,
    
    // Feature Toggles
    enableUserRegistration: true,
    enableVendorRegistration: true,
    enableGuestCheckout: false,
    enableProductReviews: true,
    enableWishlist: true,
    enableCoupons: true,
    enableDiscountOffers: true,
    
    // Payment Settings
    enableRazorpay: true,
    enableCOD: false,
    enableWalletPayments: false,
    
    // Notification Settings
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    enablePushNotifications: true,
    
    // Security Settings
    enableTwoFactorAuth: false,
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    
    // Maintenance Settings
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.',
    allowAdminAccess: true,
    
    // SEO Settings
    metaTitle: 'ApparelDesk - Quality Apparel Online',
    metaDescription: 'Discover quality apparel from trusted vendors at ApparelDesk',
    metaKeywords: 'apparel, clothing, fashion, online shopping'
  }),

  /**
   * Add settings change listener
   * @param {Function} listener - Change listener function
   */
  addChangeListener: (listener) => {
    settingsPersistence.addChangeListener(listener);
  },

  /**
   * Remove settings change listener
   * @param {Function} listener - Change listener function
   */
  removeChangeListener: (listener) => {
    settingsPersistence.removeChangeListener(listener);
  },

  /**
   * Get settings that require restart
   * @param {Object} changedSettings - Changed settings
   * @returns {Array} Settings that require restart
   */
  getRestartRequiredSettings: (changedSettings) => {
    return settingsPersistence.getRestartRequiredSettings(changedSettings);
  }
};

export default settingsService;
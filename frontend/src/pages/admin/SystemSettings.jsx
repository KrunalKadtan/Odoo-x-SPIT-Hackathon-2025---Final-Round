import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import FormInput from '../../components/FormInput';
import Button from '../../components/Button';
import Toggle from '../../components/Toggle';
import Modal, { ConfirmationModal } from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import MaintenanceScheduler from '../../components/MaintenanceScheduler';
import settingsService from '../../services/settingsService';

/**
 * System Settings - Admin interface for managing system configuration
 * Allows admins to configure platform settings and maintenance mode
 */
const SystemSettings = () => {
  const { addNotification } = useNotification();
  
  // State management
  const [settings, setSettings] = useState(settingsService.getDefaultSettings());
  const [originalSettings, setOriginalSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [validationWarnings, setValidationWarnings] = useState([]);
  
  // Modal states
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [maintenanceData, setMaintenanceData] = useState({
    reason: '',
    estimatedDuration: '',
    notifyUsers: true,
    scheduledStart: '',
    allowAdminAccess: true
  });

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Check for changes
  useEffect(() => {
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(hasChanges);
  }, [settings, originalSettings]);

  /**
   * Load system settings from API
   */
  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      setSettings({ ...settingsService.getDefaultSettings(), ...data });
      setOriginalSettings({ ...settingsService.getDefaultSettings(), ...data });
    } catch (error) {
      console.error('Failed to load settings:', error);
      addNotification('Failed to load system settings', 'error');
      // Use default settings if API fails
      setSettings(settingsService.getDefaultSettings());
      setOriginalSettings(settingsService.getDefaultSettings());
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle input changes
   */
  const handleInputChange = (name, value) => {
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Handle toggle changes
   */
  const handleToggleChange = (name, value) => {
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Validate settings before saving
   */
  const validateSettings = () => {
    const validation = settingsService.validateSettings(settings);
    setValidationErrors(validation.errors);
    setValidationWarnings(validation.warnings);
    return validation.isValid;
  };

  /**
   * Save settings
   */
  const handleSaveSettings = async () => {
    if (!validateSettings()) {
      addNotification('Please fix validation errors before saving', 'error');
      return;
    }

    try {
      setSaving(true);
      const result = await settingsService.updateSettings(settings, originalSettings);
      setOriginalSettings({ ...settings });
      
      // Show success message
      addNotification('System settings updated successfully', 'success');
      
      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          addNotification(warning, 'warning');
        });
      }

      // Show restart required notification if needed
      if (result.restartRequired && result.restartRequired.length > 0) {
        addNotification(
          `Settings updated. Server restart required for: ${result.restartRequired.join(', ')}`,
          'warning'
        );
      }

      // Show immediately applied settings
      if (result.appliedImmediately && result.appliedImmediately.length > 0) {
        addNotification(
          `Applied immediately: ${result.appliedImmediately.join(', ')}`,
          'info'
        );
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      addNotification('Failed to save system settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Discard changes
   */
  const handleDiscardChanges = () => {
    setSettings({ ...originalSettings });
    setValidationErrors({});
    setValidationWarnings([]);
    setShowDiscardModal(false);
    addNotification('Changes discarded', 'info');
  };

  /**
   * Handle maintenance mode toggle
   */
  const handleMaintenanceModeToggle = (enabled) => {
    if (enabled) {
      setShowMaintenanceModal(true);
    } else {
      // Disable maintenance mode immediately
      disableMaintenanceMode();
    }
  };

  /**
   * Enable maintenance mode
   */
  const enableMaintenanceMode = async () => {
    try {
      setSaving(true);
      await settingsService.enableMaintenanceMode(maintenanceData);
      setSettings(prev => ({ ...prev, maintenanceMode: true }));
      setOriginalSettings(prev => ({ ...prev, maintenanceMode: true }));
      setShowMaintenanceModal(false);
      addNotification('Maintenance mode enabled', 'warning');
    } catch (error) {
      console.error('Failed to enable maintenance mode:', error);
      addNotification('Failed to enable maintenance mode', 'error');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Disable maintenance mode
   */
  const disableMaintenanceMode = async () => {
    try {
      setSaving(true);
      await settingsService.disableMaintenanceMode();
      setSettings(prev => ({ ...prev, maintenanceMode: false }));
      setOriginalSettings(prev => ({ ...prev, maintenanceMode: false }));
      addNotification('Maintenance mode disabled', 'success');
    } catch (error) {
      console.error('Failed to disable maintenance mode:', error);
      addNotification('Failed to disable maintenance mode', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600">Configure platform settings and system behavior</p>
      </div>

      {/* Settings Form */}
      <div className="space-y-8">
        {/* Platform Configuration */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Platform Name"
              name="platformName"
              value={settings.platformName}
              onChange={(e) => handleInputChange('platformName', e.target.value)}
              error={validationErrors.platformName}
              placeholder="Enter platform name"
            />
            <FormInput
              label="Support Email"
              name="supportEmail"
              type="email"
              value={settings.supportEmail}
              onChange={(e) => handleInputChange('supportEmail', e.target.value)}
              error={validationErrors.supportEmail}
              placeholder="support@example.com"
            />
            <div className="md:col-span-2">
              <FormInput
                label="Platform Description"
                name="platformDescription"
                value={settings.platformDescription}
                onChange={(e) => handleInputChange('platformDescription', e.target.value)}
                error={validationErrors.platformDescription}
                placeholder="Brief description of your platform"
              />
            </div>
          </div>
        </div>

        {/* Business Settings */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput
              label="Commission Percentage (%)"
              name="commissionPercentage"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={settings.commissionPercentage}
              onChange={(e) => handleInputChange('commissionPercentage', parseFloat(e.target.value))}
              error={validationErrors.commissionPercentage}
              placeholder="10.0"
            />
            <FormInput
              label="Minimum Order Amount"
              name="minimumOrderAmount"
              type="number"
              min="0"
              step="0.01"
              value={settings.minimumOrderAmount}
              onChange={(e) => handleInputChange('minimumOrderAmount', parseFloat(e.target.value))}
              error={validationErrors.minimumOrderAmount}
              placeholder="50.00"
            />
            <FormInput
              label="Maximum Order Amount"
              name="maximumOrderAmount"
              type="number"
              min="0"
              step="0.01"
              value={settings.maximumOrderAmount}
              onChange={(e) => handleInputChange('maximumOrderAmount', parseFloat(e.target.value))}
              error={validationErrors.maximumOrderAmount}
              placeholder="10000.00"
            />
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Feature Settings</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Toggle
                id="enableUserRegistration"
                checked={settings.enableUserRegistration}
                onChange={(value) => handleToggleChange('enableUserRegistration', value)}
                label="User Registration"
                description="Allow new users to register accounts"
              />
              <Toggle
                id="enableVendorRegistration"
                checked={settings.enableVendorRegistration}
                onChange={(value) => handleToggleChange('enableVendorRegistration', value)}
                label="Vendor Registration"
                description="Allow new vendors to apply for accounts"
              />
              <Toggle
                id="enableGuestCheckout"
                checked={settings.enableGuestCheckout}
                onChange={(value) => handleToggleChange('enableGuestCheckout', value)}
                label="Guest Checkout"
                description="Allow users to checkout without creating an account"
              />
              <Toggle
                id="enableProductReviews"
                checked={settings.enableProductReviews}
                onChange={(value) => handleToggleChange('enableProductReviews', value)}
                label="Product Reviews"
                description="Allow customers to review products"
              />
              <Toggle
                id="enableWishlist"
                checked={settings.enableWishlist}
                onChange={(value) => handleToggleChange('enableWishlist', value)}
                label="Wishlist"
                description="Allow users to save products to wishlist"
              />
              <Toggle
                id="enableCoupons"
                checked={settings.enableCoupons}
                onChange={(value) => handleToggleChange('enableCoupons', value)}
                label="Coupons"
                description="Enable coupon code functionality"
              />
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Toggle
              id="enableRazorpay"
              checked={settings.enableRazorpay}
              onChange={(value) => handleToggleChange('enableRazorpay', value)}
              label="Razorpay Payments"
              description="Enable Razorpay payment gateway"
            />
            <Toggle
              id="enableCOD"
              checked={settings.enableCOD}
              onChange={(value) => handleToggleChange('enableCOD', value)}
              label="Cash on Delivery"
              description="Allow cash on delivery payments"
            />
            <Toggle
              id="enableWalletPayments"
              checked={settings.enableWalletPayments}
              onChange={(value) => handleToggleChange('enableWalletPayments', value)}
              label="Wallet Payments"
              description="Enable digital wallet payments"
            />
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Toggle
              id="enableTwoFactorAuth"
              checked={settings.enableTwoFactorAuth}
              onChange={(value) => handleToggleChange('enableTwoFactorAuth', value)}
              label="Two-Factor Authentication"
              description="Require 2FA for admin accounts"
            />
            <FormInput
              label="Session Timeout (minutes)"
              name="sessionTimeoutMinutes"
              type="number"
              min="5"
              max="480"
              value={settings.sessionTimeoutMinutes}
              onChange={(e) => handleInputChange('sessionTimeoutMinutes', parseInt(e.target.value))}
              error={validationErrors.sessionTimeoutMinutes}
              placeholder="60"
            />
            <FormInput
              label="Max Login Attempts"
              name="maxLoginAttempts"
              type="number"
              min="3"
              max="10"
              value={settings.maxLoginAttempts}
              onChange={(e) => handleInputChange('maxLoginAttempts', parseInt(e.target.value))}
              error={validationErrors.maxLoginAttempts}
              placeholder="5"
            />
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Mode</h2>
          <div className="space-y-4">
            <Toggle
              id="maintenanceMode"
              checked={settings.maintenanceMode}
              onChange={handleMaintenanceModeToggle}
              label="Maintenance Mode"
              description="Enable maintenance mode to restrict access during updates"
              variant={settings.maintenanceMode ? 'warning' : 'primary'}
            />
            {settings.maintenanceMode && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Maintenance mode is currently active.</strong> Only administrators can access the system.
                </p>
              </div>
            )}
            <FormInput
              label="Maintenance Message"
              name="maintenanceMessage"
              value={settings.maintenanceMessage}
              onChange={(e) => handleInputChange('maintenanceMessage', e.target.value)}
              error={validationErrors.maintenanceMessage}
              placeholder="Message to display to users during maintenance"
              helperText="This message will be shown to users when maintenance mode is active"
            />
          </div>
        </div>

        {/* Maintenance Scheduler */}
        <MaintenanceScheduler />
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end space-x-4">
        {hasChanges && (
          <Button
            variant="outline"
            onClick={() => setShowDiscardModal(true)}
            disabled={saving}
            fullWidth={false}
          >
            Discard Changes
          </Button>
        )}
        <Button
          variant="primary"
          onClick={handleSaveSettings}
          disabled={!hasChanges || saving}
          fullWidth={false}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Maintenance Mode Modal */}
      <Modal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        title="Enable Maintenance Mode"
        size="medium"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Enabling maintenance mode will restrict access to the platform. Only administrators will be able to access the system.
          </p>
          
          <FormInput
            label="Reason for Maintenance"
            name="reason"
            value={maintenanceData.reason}
            onChange={(e) => setMaintenanceData(prev => ({ ...prev, reason: e.target.value }))}
            placeholder="e.g., System updates, Database maintenance"
          />
          
          <FormInput
            label="Estimated Duration"
            name="estimatedDuration"
            value={maintenanceData.estimatedDuration}
            onChange={(e) => setMaintenanceData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
            placeholder="e.g., 2 hours, 30 minutes"
          />
          
          <Toggle
            id="notifyUsers"
            checked={maintenanceData.notifyUsers}
            onChange={(value) => setMaintenanceData(prev => ({ ...prev, notifyUsers: value }))}
            label="Notify Users"
            description="Send notification to all users about the maintenance"
          />
          
          <Toggle
            id="allowAdminAccess"
            checked={maintenanceData.allowAdminAccess}
            onChange={(value) => setMaintenanceData(prev => ({ ...prev, allowAdminAccess: value }))}
            label="Allow Admin Access"
            description="Allow administrators to access the system during maintenance"
          />
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowMaintenanceModal(false)}
            disabled={saving}
            fullWidth={false}
          >
            Cancel
          </Button>
          <Button
            variant="warning"
            onClick={enableMaintenanceMode}
            disabled={saving}
            fullWidth={false}
          >
            {saving ? 'Enabling...' : 'Enable Maintenance Mode'}
          </Button>
        </div>
      </Modal>

      {/* Discard Changes Confirmation */}
      <ConfirmationModal
        isOpen={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        onConfirm={handleDiscardChanges}
        title="Discard Changes"
        message="Are you sure you want to discard all unsaved changes? This action cannot be undone."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        confirmVariant="outline"
      />
    </div>
  );
};

export default SystemSettings;
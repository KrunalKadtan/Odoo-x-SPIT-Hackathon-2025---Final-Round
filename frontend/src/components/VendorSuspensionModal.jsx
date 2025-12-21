import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import FormInput from './FormInput';

const VendorSuspensionModal = ({
  vendor,
  isOpen,
  onClose,
  onConfirm,
  loading = false
}) => {
  const [suspensionData, setSuspensionData] = useState({
    reason: '',
    duration: 'indefinite', // 'indefinite', '7_days', '30_days', '90_days'
    notes: '',
    notifyVendor: true,
    hideProducts: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(vendor, suspensionData);
  };

  const handleInputChange = (field, value) => {
    setSuspensionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setSuspensionData({
      reason: '',
      duration: 'indefinite',
      notes: '',
      notifyVendor: true,
      hideProducts: true
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!vendor) return null;

  const suspensionReasons = [
    { value: 'policy_violation', label: 'Policy Violation' },
    { value: 'quality_issues', label: 'Product Quality Issues' },
    { value: 'customer_complaints', label: 'Multiple Customer Complaints' },
    { value: 'payment_issues', label: 'Payment/Financial Issues' },
    { value: 'fraudulent_activity', label: 'Suspected Fraudulent Activity' },
    { value: 'non_compliance', label: 'Non-compliance with Terms' },
    { value: 'other', label: 'Other (specify in notes)' }
  ];

  const durationOptions = [
    { value: 'indefinite', label: 'Indefinite (until resolved)' },
    { value: '7_days', label: '7 Days' },
    { value: '30_days', label: '30 Days' },
    { value: '90_days', label: '90 Days' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Suspend Vendor - ${vendor.displayName || vendor.name}`}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Warning Message */}
        <div className="bg-orange-50 border border-orange-200 rounded-pro p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-orange-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-orange-800 font-medium">Vendor Suspension Warning</h4>
              <p className="text-orange-700 text-sm mt-1">
                Suspending this vendor will temporarily disable their account and may affect their ongoing orders. 
                This action should be taken only after careful consideration.
              </p>
            </div>
          </div>
        </div>

        {/* Vendor Information */}
        <div className="bg-app-surface border border-app-border rounded-pro p-4">
          <h4 className="text-md font-medium text-app-main mb-2">Vendor Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-app-muted">Business Name:</span>
              <div className="font-medium">{vendor.business_name || 'N/A'}</div>
            </div>
            <div>
              <span className="text-app-muted">Email:</span>
              <div className="font-medium">{vendor.email}</div>
            </div>
            <div>
              <span className="text-app-muted">Total Products:</span>
              <div className="font-medium">{vendor.productCount || 0}</div>
            </div>
            <div>
              <span className="text-app-muted">Total Earnings:</span>
              <div className="font-medium">₹{(vendor.totalEarnings || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Suspension Reason */}
        <div>
          <label className="block text-sm font-medium text-app-main mb-2">
            Suspension Reason *
          </label>
          <select
            value={suspensionData.reason}
            onChange={(e) => handleInputChange('reason', e.target.value)}
            required
            className="w-full px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent/20"
          >
            <option value="">Select a reason...</option>
            {suspensionReasons.map(reason => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </div>

        {/* Suspension Duration */}
        <div>
          <label className="block text-sm font-medium text-app-main mb-2">
            Suspension Duration
          </label>
          <select
            value={suspensionData.duration}
            onChange={(e) => handleInputChange('duration', e.target.value)}
            className="w-full px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent/20"
          >
            {durationOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-app-main mb-2">
            Additional Notes
          </label>
          <textarea
            value={suspensionData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Provide additional details about the suspension..."
            rows={4}
            className="w-full px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent/20 resize-none"
          />
        </div>

        {/* Options */}
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="notifyVendor"
              checked={suspensionData.notifyVendor}
              onChange={(e) => handleInputChange('notifyVendor', e.target.checked)}
              className="h-4 w-4 text-app-accent focus:ring-app-accent/20 border-app-border rounded"
            />
            <label htmlFor="notifyVendor" className="ml-2 text-sm text-app-main">
              Send notification email to vendor
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hideProducts"
              checked={suspensionData.hideProducts}
              onChange={(e) => handleInputChange('hideProducts', e.target.checked)}
              className="h-4 w-4 text-app-accent focus:ring-app-accent/20 border-app-border rounded"
            />
            <label htmlFor="hideProducts" className="ml-2 text-sm text-app-main">
              Hide all vendor products from marketplace
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-app-border">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
            disabled={!suspensionData.reason}
          >
            {loading ? 'Suspending...' : 'Suspend Vendor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default VendorSuspensionModal;
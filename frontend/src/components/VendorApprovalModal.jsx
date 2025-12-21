import React, { useState, useEffect } from 'react';
import { adminAPI, errorUtils } from '../utils/api';
import Modal from './Modal';
import Button from './Button';
import { StatusBadge } from './Badge';
import VendorDocumentViewer from './VendorDocumentViewer';
import LoadingSpinner from './LoadingSpinner';

const VendorApprovalModal = ({
  vendor,
  isOpen,
  onClose,
  onApprovalComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vendorDetails, setVendorDetails] = useState(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'

  // Load detailed vendor information
  const loadVendorDetails = async () => {
    if (!vendor?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAPI.getVendor(vendor.id);
      setVendorDetails(response);
    } catch (err) {
      console.error('Failed to load vendor details:', err);
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Load vendor details when modal opens
  useEffect(() => {
    if (isOpen && vendor) {
      loadVendorDetails();
      setApprovalNotes('');
      setRejectionReason('');
      setActionType(null);
    }
  }, [isOpen, vendor]);

  // Handle approval action
  const handleApproval = async () => {
    if (!vendor || !actionType) return;
    
    try {
      setLoading(true);
      
      const actionData = {
        notes: actionType === 'approve' ? approvalNotes : rejectionReason
      };
      
      if (actionType === 'approve') {
        await adminAPI.approveVendor(vendor.id, actionData);
      } else {
        await adminAPI.rejectVendor(vendor.id, actionData);
      }
      
      if (onApprovalComplete) {
        onApprovalComplete(vendor, actionType, actionData);
      }
      
      onClose();
    } catch (err) {
      console.error(`Failed to ${actionType} vendor:`, err);
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  if (!vendor) return null;

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={`Vendor Approval - ${vendor.displayName || vendor.name}`}
        size="large"
      >
        {loading && !vendorDetails ? (
          <LoadingSpinner size="large" text="Loading vendor details..." />
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-pro">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* Vendor Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-app-main">Basic Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-app-muted">Business Name</label>
                    <p className="text-app-main">{vendorDetails?.business_name || vendor.business_name || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-app-muted">Contact Person</label>
                    <p className="text-app-main">{vendorDetails?.contact_person || vendor.name || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-app-muted">Email</label>
                    <p className="text-app-main">{vendor.email}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-app-muted">Phone</label>
                    <p className="text-app-main">{vendor.phone || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-app-muted">Status</label>
                    <div className="mt-1">
                      <StatusBadge status={vendor.status} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-app-main">Application Details</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-app-muted">Application Date</label>
                    <p className="text-app-main">{formatDate(vendor.application_date)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-app-muted">Business Type</label>
                    <p className="text-app-main">{vendorDetails?.business_type || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-app-muted">GST Number</label>
                    <p className="text-app-main">{vendorDetails?.gst_number || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-app-muted">Address</label>
                    <p className="text-app-main text-sm">
                      {vendorDetails?.address || vendor.address || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Description */}
            {(vendorDetails?.business_description || vendor.business_description) && (
              <div>
                <h3 className="text-lg font-medium text-app-main mb-2">Business Description</h3>
                <p className="text-app-main text-sm bg-app-secondary/30 p-3 rounded-pro">
                  {vendorDetails?.business_description || vendor.business_description}
                </p>
              </div>
            )}

            {/* Documents Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-app-main">Documents</h3>
                <Button
                  variant="outline"
                  onClick={() => setShowDocuments(true)}
                  fullWidth={false}
                  className="px-4 py-2 text-sm"
                >
                  Review Documents
                </Button>
              </div>
              <p className="text-sm text-app-muted">
                Click "Review Documents" to view and verify uploaded documents before making approval decision.
              </p>
            </div>

            {/* Action Selection */}
            {vendor.status === 'pending' && (
              <div className="border-t border-app-border pt-6">
                <h3 className="text-lg font-medium text-app-main mb-4">Approval Decision</h3>
                
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <Button
                      variant={actionType === 'approve' ? 'primary' : 'outline'}
                      onClick={() => setActionType('approve')}
                      fullWidth={false}
                      className="px-6 py-2"
                    >
                      Approve Vendor
                    </Button>
                    <Button
                      variant={actionType === 'reject' ? 'primary' : 'outline'}
                      onClick={() => setActionType('reject')}
                      fullWidth={false}
                      className="px-6 py-2"
                    >
                      Reject Application
                    </Button>
                  </div>

                  {actionType === 'approve' && (
                    <div>
                      <label className="block text-sm font-medium text-app-main mb-2">
                        Approval Notes (Optional)
                      </label>
                      <textarea
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder="Add any notes about the approval..."
                        rows={3}
                        className="w-full px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent/20 focus:border-app-accent"
                      />
                    </div>
                  )}

                  {actionType === 'reject' && (
                    <div>
                      <label className="block text-sm font-medium text-app-main mb-2">
                        Rejection Reason <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a reason for rejection..."
                        rows={3}
                        className="w-full px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent/20 focus:border-app-accent"
                        required
                      />
                    </div>
                  )}

                  {actionType && (
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setActionType(null)}
                        fullWidth={false}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleApproval}
                        disabled={loading || (actionType === 'reject' && !rejectionReason.trim())}
                        fullWidth={false}
                      >
                        {loading ? 'Processing...' : `Confirm ${actionType === 'approve' ? 'Approval' : 'Rejection'}`}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Document Viewer Modal */}
      <VendorDocumentViewer
        vendorId={vendor?.id}
        isOpen={showDocuments}
        onClose={() => setShowDocuments(false)}
        onDocumentVerified={(document, verified) => {
          console.log('Document verification updated:', document, verified);
        }}
      />
    </>
  );
};

export default VendorApprovalModal;
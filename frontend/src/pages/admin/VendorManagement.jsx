import React, { useState, useEffect } from 'react';
import { adminAPI, errorUtils } from '../../utils/api';
import VendorTable from '../../components/VendorTable';
import VendorApprovalModal from '../../components/VendorApprovalModal';
import VendorDetailModal from '../../components/VendorDetailModal';
import VendorSuspensionModal from '../../components/VendorSuspensionModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ConfirmationModal } from '../../components/Modal';

/**
 * Vendor Management - Admin interface for managing vendor accounts
 * Allows admins to approve/reject vendor applications and manage vendor status
 */
const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all'
  });
  
  // Modal states
  const [approvalModal, setApprovalModal] = useState({
    isOpen: false,
    vendor: null
  });
  
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    vendor: null
  });
  
  const [suspensionModal, setSuspensionModal] = useState({
    isOpen: false,
    vendor: null,
    loading: false
  });
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    vendor: null,
    action: null,
    loading: false
  });

  // Load vendors data
  const loadVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (filters.status !== 'all') params.status = filters.status;
      
      const response = await adminAPI.getVendors(params);
      setVendors(response.results || response);
    } catch (err) {
      console.error('Failed to load vendors:', err);
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Load vendors on component mount and filter changes
  useEffect(() => {
    loadVendors();
  }, [filters]);

  // Handle vendor actions
  const handleVendorAction = (vendor, action) => {
    if (action === 'approve' || action === 'reject') {
      // Use approval modal for approve/reject actions
      setApprovalModal({
        isOpen: true,
        vendor
      });
    } else if (action === 'suspend') {
      // Use specialized suspension modal for suspend action
      setSuspensionModal({
        isOpen: true,
        vendor,
        loading: false
      });
    } else {
      // Use confirmation modal for other actions (reactivate)
      setConfirmModal({
        isOpen: true,
        vendor,
        action,
        loading: false
      });
    }
  };

  // Handle approval completion
  const handleApprovalComplete = (vendor, action, actionData) => {
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    // Update vendor status in local state
    setVendors(prevVendors => 
      prevVendors.map(v => 
        v.id === vendor.id 
          ? { 
              ...v, 
              status: newStatus, 
              approval_date: action === 'approve' ? new Date().toISOString() : v.approval_date,
              rejection_reason: action === 'reject' ? actionData.notes : v.rejection_reason
            }
          : v
      )
    );
    
    setApprovalModal({ isOpen: false, vendor: null });
  };

  // Confirm other vendor actions (reactivate)
  const confirmVendorAction = async () => {
    const { vendor, action } = confirmModal;
    
    try {
      setConfirmModal(prev => ({ ...prev, loading: true }));
      
      let newStatus = vendor.status;
      
      switch (action) {
        case 'reactivate':
          await adminAPI.reactivateVendor(vendor.id);
          newStatus = 'approved';
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      // Update vendor status in local state
      setVendors(prevVendors => 
        prevVendors.map(v => 
          v.id === vendor.id 
            ? { ...v, status: newStatus }
            : v
        )
      );
      
      setConfirmModal({ isOpen: false, vendor: null, action: null, loading: false });
    } catch (err) {
      console.error(`Failed to ${action} vendor:`, err);
      setError(errorUtils.getErrorMessage(err));
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Handle vendor suspension with detailed data
  const handleVendorSuspension = async (vendor, suspensionData) => {
    try {
      setSuspensionModal(prev => ({ ...prev, loading: true }));
      
      await adminAPI.suspendVendor(vendor.id, suspensionData);
      
      // Update vendor status in local state
      setVendors(prevVendors => 
        prevVendors.map(v => 
          v.id === vendor.id 
            ? { 
                ...v, 
                status: 'suspended',
                suspension_reason: suspensionData.reason,
                suspension_notes: suspensionData.notes,
                suspension_date: new Date().toISOString()
              }
            : v
        )
      );
      
      setSuspensionModal({ isOpen: false, vendor: null, loading: false });
    } catch (err) {
      console.error('Failed to suspend vendor:', err);
      setError(errorUtils.getErrorMessage(err));
      setSuspensionModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Handle vendor detail view
  const handleVendorDetail = (vendor) => {
    setDetailModal({
      isOpen: true,
      vendor
    });
  };

  // Handle search change
  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const getConfirmationMessage = () => {
    const { vendor, action } = confirmModal;
    if (!vendor || !action) return '';
    
    const vendorName = vendor.displayName || vendor.name || vendor.email;
    
    switch (action) {
      case 'reactivate':
        return `Are you sure you want to reactivate ${vendorName}? This will restore their account and make their products visible again.`;
      default:
        return `Are you sure you want to ${action} ${vendorName}?`;
    }
  };

  const getConfirmButtonText = () => {
    const { action } = confirmModal;
    switch (action) {
      case 'reactivate':
        return 'Reactivate Vendor';
      default:
        return 'Confirm';
    }
  };

  if (loading && vendors.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-app-main">Vendor Management</h1>
          <p className="text-app-muted">Manage vendor applications and accounts</p>
        </div>
        <LoadingSpinner size="large" text="Loading vendors..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-app-main">Vendor Management</h1>
        <p className="text-app-muted">Manage vendor applications and accounts</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-pro">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      <VendorTable
        vendors={vendors}
        loading={loading}
        onVendorAction={handleVendorAction}
        onVendorDetail={handleVendorDetail}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Vendor Detail Modal */}
      <VendorDetailModal
        vendor={detailModal.vendor}
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, vendor: null })}
        onVendorAction={handleVendorAction}
      />

      {/* Vendor Approval Modal */}
      <VendorApprovalModal
        vendor={approvalModal.vendor}
        isOpen={approvalModal.isOpen}
        onClose={() => setApprovalModal({ isOpen: false, vendor: null })}
        onApprovalComplete={handleApprovalComplete}
      />

      {/* Vendor Suspension Modal */}
      <VendorSuspensionModal
        vendor={suspensionModal.vendor}
        isOpen={suspensionModal.isOpen}
        onClose={() => setSuspensionModal({ isOpen: false, vendor: null, loading: false })}
        onConfirm={handleVendorSuspension}
        loading={suspensionModal.loading}
      />

      {/* Confirmation Modal for other actions */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, vendor: null, action: null, loading: false })}
        onConfirm={confirmVendorAction}
        title={`${confirmModal.action ? confirmModal.action.charAt(0).toUpperCase() + confirmModal.action.slice(1) : ''} Vendor`}
        message={getConfirmationMessage()}
        confirmText={getConfirmButtonText()}
        confirmVariant="outline"
        loading={confirmModal.loading}
      />
    </div>
  );
};

export default VendorManagement;
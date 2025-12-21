import React, { useState, useEffect } from 'react';
import { adminAPI, errorUtils } from '../../utils/api';
import UserTable from '../../components/UserTable';
import UserDetailModal from '../../components/UserDetailModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ConfirmationModal } from '../../components/Modal';

/**
 * User Management - Admin interface for managing user accounts
 * Allows admins to view, search, block/unblock users
 */
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    riskLevel: 'all'
  });
  
  // Modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    user: null,
    action: null,
    loading: false
  });
  
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    user: null
  });

  // Load users data
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.riskLevel !== 'all') params.risk_level = filters.riskLevel;
      
      const response = await adminAPI.getUsers(params);
      setUsers(response.results || response);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Load users on component mount and filter changes
  useEffect(() => {
    loadUsers();
  }, [filters]);

  // Handle user actions (block/unblock)
  const handleUserAction = (user, action) => {
    setConfirmModal({
      isOpen: true,
      user,
      action,
      loading: false
    });
  };

  // Confirm user action
  const confirmUserAction = async () => {
    const { user, action } = confirmModal;
    
    try {
      setConfirmModal(prev => ({ ...prev, loading: true }));
      
      // Use the toggle active endpoint for both block and unblock
      const response = await adminAPI.toggleUserActive(user.id);
      
      // Update user status in local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === user.id 
            ? { ...u, is_active: response.is_active }
            : u
        )
      );
      
      setConfirmModal({ isOpen: false, user: null, action: null, loading: false });
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      setError(errorUtils.getErrorMessage(err));
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Handle user detail view
  const handleUserDetail = (user) => {
    setDetailModal({
      isOpen: true,
      user
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
    const { user, action } = confirmModal;
    if (!user || !action) return '';
    
    const actionText = action === 'block' ? 'block' : 'unblock';
    const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
    
    return `Are you sure you want to ${actionText} ${userName}? ${
      action === 'block' 
        ? 'This will prevent them from accessing their account.' 
        : 'This will restore their account access.'
    }`;
  };

  if (loading && users.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-app-main">User Management</h1>
          <p className="text-app-muted">Manage customer accounts and user access</p>
        </div>
        <LoadingSpinner size="large" text="Loading users..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-app-main">User Management</h1>
        <p className="text-app-muted">Manage customer accounts and user access</p>
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

      <UserTable
        users={users}
        loading={loading}
        onUserAction={handleUserAction}
        onUserDetail={handleUserDetail}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, user: null, action: null, loading: false })}
        onConfirm={confirmUserAction}
        title={`${confirmModal.action === 'block' ? 'Block' : 'Unblock'} User`}
        message={getConfirmationMessage()}
        confirmText={confirmModal.action === 'block' ? 'Block User' : 'Unblock User'}
        confirmVariant={confirmModal.action === 'block' ? 'error' : 'primary'}
        loading={confirmModal.loading}
      />

      {/* User Detail Modal */}
      <UserDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, user: null })}
        user={detailModal.user}
        onUserAction={handleUserAction}
      />
    </div>
  );
};

export default UserManagement;
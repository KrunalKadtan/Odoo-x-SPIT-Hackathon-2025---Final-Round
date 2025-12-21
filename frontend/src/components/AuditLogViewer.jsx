import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import Table from './Table';
import Badge from './Badge';
import LoadingSpinner from './LoadingSpinner';
import Modal from './Modal';

/**
 * AuditLogViewer - Component for viewing and filtering admin audit logs
 * Displays all administrative actions with filtering and search capabilities
 */
const AuditLogViewer = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    action_type: 'all',
    admin_user: 'all',
    date_range: 'all',
    start_date: '',
    end_date: ''
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const { showError } = useNotification();

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters
      };

      // Remove 'all' values and empty strings
      Object.keys(params).forEach(key => {
        if (params[key] === 'all' || params[key] === '') {
          delete params[key];
        }
      });

      const data = await adminAPI.getAuditLogs(params);
      setAuditLogs(data.results || []);
      setPagination({
        page: data.page || 1,
        limit: data.limit || 50,
        total: data.count || 0,
        totalPages: Math.ceil((data.count || 0) / (data.limit || 50))
      });
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError('Failed to load audit logs');
      showError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, pagination.limit, showError]);

  // Handle search
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  // View log details
  const viewLogDetails = useCallback((log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  }, []);

  // Get action type badge variant
  const getActionTypeBadge = (actionType) => {
    switch (actionType) {
      case 'create':
        return { variant: 'success', text: 'Create' };
      case 'update':
        return { variant: 'warning', text: 'Update' };
      case 'delete':
        return { variant: 'error', text: 'Delete' };
      case 'approve':
        return { variant: 'success', text: 'Approve' };
      case 'reject':
        return { variant: 'error', text: 'Reject' };
      case 'suspend':
        return { variant: 'warning', text: 'Suspend' };
      case 'login':
        return { variant: 'info', text: 'Login' };
      case 'logout':
        return { variant: 'secondary', text: 'Logout' };
      default:
        return { variant: 'secondary', text: actionType };
    }
  };

  // Get resource type icon
  const getResourceIcon = (resourceType) => {
    const iconClass = "w-4 h-4";
    
    switch (resourceType) {
      case 'user':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'vendor':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'product':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'order':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        );
      case 'system':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Table columns
  const columns = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      render: (log) => (
        <span className="text-sm text-app-main">
          {formatTimestamp(log.timestamp)}
        </span>
      )
    },
    {
      key: 'admin_user',
      label: 'Admin User',
      render: (log) => (
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-app-accent rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-mono font-semibold">
              {(log.admin_user_name || 'A').charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-sans font-medium text-app-main">
            {log.admin_user_name || log.admin_user_email}
          </span>
        </div>
      )
    },
    {
      key: 'action',
      label: 'Action',
      render: (log) => {
        const badge = getActionTypeBadge(log.action_type);
        return (
          <div className="flex items-center space-x-2">
            {getResourceIcon(log.resource_type)}
            <Badge variant={badge.variant} size="sm">
              {badge.text}
            </Badge>
          </div>
        );
      }
    },
    {
      key: 'resource',
      label: 'Resource',
      render: (log) => (
        <div>
          <span className="text-sm font-sans font-medium text-app-main">
            {log.resource_type}
          </span>
          {log.resource_id && (
            <span className="text-xs text-app-muted block">
              ID: {log.resource_id}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (log) => (
        <span className="text-sm text-app-main line-clamp-2">
          {log.description}
        </span>
      )
    },
    {
      key: 'ip_address',
      label: 'IP Address',
      render: (log) => (
        <span className="text-sm font-mono text-app-muted">
          {log.ip_address || 'N/A'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (log) => (
        <button
          onClick={() => viewLogDetails(log)}
          className="text-app-accent hover:text-app-accent-dark text-sm font-sans font-medium"
        >
          View Details
        </button>
      )
    }
  ];

  // Load audit logs on mount and when dependencies change
  useEffect(() => {
    fetchAuditLogs(pagination.page);
  }, [fetchAuditLogs, pagination.page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-semibold text-app-main">
          Audit Logs
        </h2>
        <div className="text-sm text-app-muted">
          Total: {pagination.total} logs
        </div>
      </div>

      {/* Filters */}
      <div className="bg-app-surface rounded-pro p-4 border border-app-border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-sans font-medium text-app-main mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent"
            />
          </div>

          {/* Action Type Filter */}
          <div>
            <label className="block text-sm font-sans font-medium text-app-main mb-2">
              Action Type
            </label>
            <select
              value={filters.action_type}
              onChange={(e) => handleFilterChange('action_type', e.target.value)}
              className="w-full px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent"
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
              <option value="suspend">Suspend</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-sans font-medium text-app-main mb-2">
              Date Range
            </label>
            <select
              value={filters.date_range}
              onChange={(e) => handleFilterChange('date_range', e.target.value)}
              className="w-full px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {filters.date_range === 'custom' && (
            <div className="col-span-full grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-sans font-medium text-app-main mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="w-full px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-sans font-medium text-app-main mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="w-full px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-app-surface rounded-pro border border-app-border">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-app-error text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchAuditLogs(pagination.page)}
              className="px-4 py-2 bg-app-accent text-white rounded-pro hover:bg-app-accent-dark transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        ) : (
          <Table
            data={auditLogs}
            columns={columns}
            pagination={{
              ...pagination,
              onPageChange: handlePageChange
            }}
            emptyMessage="No audit logs found"
          />
        )}
      </div>

      {/* Log Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Audit Log Details"
        size="large"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-sans font-medium text-app-main mb-1">
                  Timestamp
                </label>
                <p className="text-sm text-app-muted">
                  {formatTimestamp(selectedLog.timestamp)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-sans font-medium text-app-main mb-1">
                  Admin User
                </label>
                <p className="text-sm text-app-muted">
                  {selectedLog.admin_user_name || selectedLog.admin_user_email}
                </p>
              </div>
              <div>
                <label className="block text-sm font-sans font-medium text-app-main mb-1">
                  Action Type
                </label>
                <div className="flex items-center space-x-2">
                  {getResourceIcon(selectedLog.resource_type)}
                  <Badge variant={getActionTypeBadge(selectedLog.action_type).variant} size="sm">
                    {getActionTypeBadge(selectedLog.action_type).text}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="block text-sm font-sans font-medium text-app-main mb-1">
                  Resource
                </label>
                <p className="text-sm text-app-muted">
                  {selectedLog.resource_type}
                  {selectedLog.resource_id && ` (ID: ${selectedLog.resource_id})`}
                </p>
              </div>
              <div>
                <label className="block text-sm font-sans font-medium text-app-main mb-1">
                  IP Address
                </label>
                <p className="text-sm font-mono text-app-muted">
                  {selectedLog.ip_address || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-sans font-medium text-app-main mb-1">
                  User Agent
                </label>
                <p className="text-sm text-app-muted line-clamp-2">
                  {selectedLog.user_agent || 'N/A'}
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-sans font-medium text-app-main mb-1">
                Description
              </label>
              <p className="text-sm text-app-muted">
                {selectedLog.description}
              </p>
            </div>

            {selectedLog.details && (
              <div>
                <label className="block text-sm font-sans font-medium text-app-main mb-1">
                  Additional Details
                </label>
                <pre className="text-xs bg-app-secondary p-3 rounded-pro overflow-auto max-h-40">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogViewer;
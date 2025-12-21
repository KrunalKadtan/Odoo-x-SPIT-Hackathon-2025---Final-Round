import React, { useState, useMemo } from 'react';
import Table from './Table';
import { StatusBadge } from './Badge';
import Button from './Button';

const VendorTable = ({
  vendors = [],
  loading = false,
  onVendorAction,
  onVendorDetail,
  searchTerm = '',
  onSearchChange,
  filters = {},
  onFilterChange
}) => {
  const [selectedVendors, setSelectedVendors] = useState([]);

  // Format vendor data for display
  const formattedVendors = useMemo(() => {
    return vendors.map(vendor => ({
      ...vendor,
      displayName: vendor.name || vendor.business_name || vendor.email.split('@')[0],
      applicationDate: vendor.application_date ? new Date(vendor.application_date).toLocaleDateString() : 'N/A',
      approvalDate: vendor.approval_date ? new Date(vendor.approval_date).toLocaleDateString() : 'N/A',
      productCount: vendor.product_count || 0,
      totalEarnings: vendor.total_earnings || 0,
      rating: vendor.rating || 0,
      status: vendor.status || 'pending'
    }));
  }, [vendors]);

  // Filter vendors based on current filters
  const filteredVendors = useMemo(() => {
    let filtered = formattedVendors;

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(vendor => vendor.status === filters.status);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(vendor =>
        vendor.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [formattedVendors, filters, searchTerm]);

  // Table columns configuration
  const columns = [
    {
      key: 'displayName',
      label: 'Vendor',
      render: (value, vendor) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8">
            <div className="h-8 w-8 rounded-full bg-app-accent flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {vendor.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-app-main">{vendor.displayName}</div>
            <div className="text-sm text-app-muted">{vendor.email}</div>
            {vendor.business_name && vendor.business_name !== vendor.displayName && (
              <div className="text-xs text-app-muted">{vendor.business_name}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value) => value || 'N/A'
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} size="small" />
    },
    {
      key: 'productCount',
      label: 'Products',
      render: (value) => (
        <span className="text-sm font-mono">{value}</span>
      )
    },
    {
      key: 'totalEarnings',
      label: 'Total Earnings',
      render: (value) => (
        <span className="text-sm font-mono">₹{value.toLocaleString()}</span>
      )
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (value) => (
        <div className="flex items-center">
          <span className="text-sm font-mono mr-1">{value.toFixed(1)}</span>
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      )
    },
    {
      key: 'applicationDate',
      label: 'Applied',
      render: (value) => (
        <span className="text-sm text-app-muted">{value}</span>
      )
    },
    {
      key: 'approvalDate',
      label: 'Approved',
      render: (value, vendor) => (
        <span className="text-sm text-app-muted">
          {vendor.status === 'approved' ? value : '-'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, vendor) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onVendorDetail(vendor);
            }}
            fullWidth={false}
            className="px-3 py-1 text-xs"
          >
            View
          </Button>
          {vendor.status === 'pending' && (
            <>
              <Button
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onVendorAction(vendor, 'approve');
                }}
                fullWidth={false}
                className="px-3 py-1 text-xs"
              >
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onVendorAction(vendor, 'reject');
                }}
                fullWidth={false}
                className="px-3 py-1 text-xs text-red-600 border-red-300 hover:bg-red-50"
              >
                Reject
              </Button>
            </>
          )}
          {vendor.status === 'approved' && (
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onVendorAction(vendor, 'suspend');
              }}
              fullWidth={false}
              className="px-3 py-1 text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              Suspend
            </Button>
          )}
          {vendor.status === 'suspended' && (
            <Button
              variant="primary"
              onClick={(e) => {
                e.stopPropagation();
                onVendorAction(vendor, 'reactivate');
              }}
              fullWidth={false}
              className="px-3 py-1 text-xs"
            >
              Reactivate
            </Button>
          )}
        </div>
      )
    }
  ];

  const handleRowClick = (vendor) => {
    onVendorDetail(vendor);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-app-surface border border-app-border rounded-pro">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-app-main">Status:</label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="px-3 py-1 border border-app-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-app-accent/20"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search vendors by name, email, business name, or phone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-1 border border-app-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-app-accent/20"
          />
        </div>
      </div>

      {/* Table */}
      <Table
        data={filteredVendors}
        columns={columns}
        loading={loading}
        pagination={true}
        sortable={true}
        onRowClick={handleRowClick}
        emptyMessage="No vendors found"
        pageSize={10}
      />

      {/* Summary */}
      <div className="flex justify-between items-center text-sm text-app-muted p-4 bg-app-surface border border-app-border rounded-pro">
        <div>
          Total Vendors: {filteredVendors.length}
        </div>
        <div className="flex space-x-4">
          <span>Pending: {filteredVendors.filter(v => v.status === 'pending').length}</span>
          <span>Approved: {filteredVendors.filter(v => v.status === 'approved').length}</span>
          <span>Rejected: {filteredVendors.filter(v => v.status === 'rejected').length}</span>
          <span>Suspended: {filteredVendors.filter(v => v.status === 'suspended').length}</span>
        </div>
      </div>
    </div>
  );
};

export default VendorTable;
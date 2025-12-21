import React, { useState, useMemo } from 'react';
import Table from './Table';
import { StatusBadge, RiskBadge } from './Badge';
import Button from './Button';

const UserTable = ({
  users = [],
  loading = false,
  onUserAction,
  onUserDetail,
  searchTerm = '',
  onSearchChange,
  filters = {},
  onFilterChange
}) => {
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Format user data for display
  const formattedUsers = useMemo(() => {
    return users.map(user => ({
      ...user,
      fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email.split('@')[0],
      registrationDate: user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A',
      lastLoginDate: user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never',
      totalSpent: user.total_spent || 0,
      orderCount: user.order_count || 0,
      riskLevel: user.risk_level || 'low'
    }));
  }, [users]);

  // Filter users based on current filters
  const filteredUsers = useMemo(() => {
    let filtered = formattedUsers;

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(user => user.status === filters.status);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [formattedUsers, filters, searchTerm]);

  // Table columns configuration
  const columns = [
    {
      key: 'fullName',
      label: 'Name',
      render: (value, user) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8">
            <div className="h-8 w-8 rounded-full bg-app-accent flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-app-main">{user.fullName}</div>
            <div className="text-sm text-app-muted">{user.email}</div>
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
      key: 'riskLevel',
      label: 'Risk Level',
      render: (value) => <RiskBadge level={value} size="small" />
    },
    {
      key: 'orderCount',
      label: 'Orders',
      render: (value) => (
        <span className="text-sm font-mono">{value}</span>
      )
    },
    {
      key: 'totalSpent',
      label: 'Total Spent',
      render: (value) => (
        <span className="text-sm font-mono">₹{value.toLocaleString()}</span>
      )
    },
    {
      key: 'registrationDate',
      label: 'Registered',
      render: (value) => (
        <span className="text-sm text-app-muted">{value}</span>
      )
    },
    {
      key: 'lastLoginDate',
      label: 'Last Login',
      render: (value) => (
        <span className="text-sm text-app-muted">{value}</span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, user) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onUserDetail(user);
            }}
            fullWidth={false}
            className="px-3 py-1 text-xs"
          >
            View
          </Button>
          <Button
            variant={user.status === 'blocked' ? 'primary' : 'outline'}
            onClick={(e) => {
              e.stopPropagation();
              onUserAction(user, user.status === 'blocked' ? 'unblock' : 'block');
            }}
            fullWidth={false}
            className="px-3 py-1 text-xs"
          >
            {user.status === 'blocked' ? 'Unblock' : 'Block'}
          </Button>
        </div>
      )
    }
  ];

  const handleRowClick = (user) => {
    onUserDetail(user);
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
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-app-main">Risk Level:</label>
          <select
            value={filters.riskLevel || 'all'}
            onChange={(e) => onFilterChange({ ...filters, riskLevel: e.target.value })}
            className="px-3 py-1 border border-app-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-app-accent/20"
          >
            <option value="all">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-1 border border-app-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-app-accent/20"
          />
        </div>
      </div>

      {/* Table */}
      <Table
        data={filteredUsers}
        columns={columns}
        loading={loading}
        pagination={true}
        enhancedPagination={true}
        sortable={true}
        onRowClick={handleRowClick}
        emptyMessage="No users found"
        pageSize={10}
        serverSide={false}
      />

      {/* Summary */}
      <div className="flex justify-between items-center text-sm text-app-muted p-4 bg-app-surface border border-app-border rounded-pro">
        <div>
          Total Users: {filteredUsers.length}
        </div>
        <div className="flex space-x-4">
          <span>Active: {filteredUsers.filter(u => u.status === 'active').length}</span>
          <span>Blocked: {filteredUsers.filter(u => u.status === 'blocked').length}</span>
          <span>High Risk: {filteredUsers.filter(u => u.riskLevel === 'high').length}</span>
        </div>
      </div>
    </div>
  );
};

export default UserTable;
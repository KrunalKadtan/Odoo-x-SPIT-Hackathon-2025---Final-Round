import React, { useState, useEffect, useMemo } from 'react';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { StatusBadge } from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import { adminAPI, paymentsAPI, errorUtils } from '../../utils/api';

/**
 * Order Management - Admin interface for managing orders and transactions
 * Allows admins to view orders, manage payments, and handle refunds
 */
const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    vendor: '',
    user: '',
    paymentStatus: 'all'
  });

  // Fetch orders data
  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters from filters
      const params = {};
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.paymentStatus !== 'all') params.payment_status = filters.paymentStatus;
      if (filters.vendor) params.vendor = filters.vendor;
      if (filters.user) params.user = filters.user;
      if (filters.dateRange !== 'all') {
        const now = new Date();
        switch (filters.dateRange) {
          case 'today':
            params.date_from = now.toISOString().split('T')[0];
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            params.date_from = weekAgo.toISOString().split('T')[0];
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            params.date_from = monthAgo.toISOString().split('T')[0];
            break;
        }
      }

      const response = await adminAPI.getAllOrders(params);
      setOrders(response.results || response);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle order row click
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  // Handle refund initiation
  const handleRefundClick = (order, e) => {
    e.stopPropagation(); // Prevent row click
    setSelectedOrder(order);
    setShowRefundModal(true);
  };

  // Process refund
  const processRefund = async (refundAmount) => {
    if (!selectedOrder) return;

    try {
      setRefundLoading(true);
      
      // Call refund API (this would need to be implemented in the backend)
      await paymentsAPI.processRefund(selectedOrder.payment_id, {
        amount: refundAmount,
        reason: 'Admin initiated refund'
      });

      // Refresh orders list
      await fetchOrders();
      
      setShowRefundModal(false);
      setSelectedOrder(null);
    } catch (err) {
      console.error('Error processing refund:', err);
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setRefundLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get payment status badge variant
  const getPaymentStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'success';
      case 'pending':
      case 'processing':
        return 'warning';
      case 'failed':
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Table columns configuration
  const columns = [
    {
      key: 'id',
      label: 'Order ID',
      render: (value) => `#${String(value).padStart(4, '0')}`
    },
    {
      key: 'order_date',
      label: 'Date',
      render: (value) => formatDate(value)
    },
    {
      key: 'customer_name',
      label: 'Customer',
      render: (value, row) => (
        <div>
          <div className="font-medium text-app-main">{value || row.user?.name || 'N/A'}</div>
          <div className="text-sm text-app-muted">{row.user?.email || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'vendor_name',
      label: 'Vendor',
      render: (value, row) => value || row.vendor?.name || 'N/A'
    },
    {
      key: 'total_amount',
      label: 'Amount',
      render: (value) => (
        <span className="font-mono font-medium text-app-accent">
          {formatCurrency(value)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Order Status',
      render: (value) => <StatusBadge status={value} size="small" />
    },
    {
      key: 'payment_status',
      label: 'Payment',
      render: (value) => (
        <StatusBadge 
          status={value} 
          variant={getPaymentStatusVariant(value)}
          size="small" 
        />
      )
    },
    {
      key: 'payment_method',
      label: 'Payment Method',
      render: (value) => (
        <span className="text-sm text-app-main capitalize">
          {value === 'razorpay' ? 'Online' : value === 'cod' ? 'COD' : value || 'N/A'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleOrderClick(row);
            }}
          >
            View
          </Button>
          {row.payment_status === 'paid' && (
            <Button
              variant="outline"
              size="small"
              onClick={(e) => handleRefundClick(row, e)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Refund
            </Button>
          )}
        </div>
      )
    }
  ];

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const paymentStatusOptions = [
    { value: 'all', label: 'All Payments' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' }
  ];

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-app-main">Order Management</h1>
          <p className="text-app-muted">Manage orders, payments, and transactions</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-pro p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading orders</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <Button
                variant="outline"
                size="small"
                onClick={fetchOrders}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-app-main">Order Management</h1>
        <p className="text-app-muted">Manage orders, payments, and transactions</p>
      </div>

      {/* Filters */}
      <div className="bg-app-surface border border-app-border rounded-pro p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-app-main mb-1">
              Order Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent/20 focus:border-app-accent"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-app-main mb-1">
              Payment Status
            </label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
              className="w-full px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent/20 focus:border-app-accent"
            >
              {paymentStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-app-main mb-1">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="w-full px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent/20 focus:border-app-accent"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-app-main mb-1">
              Vendor
            </label>
            <input
              type="text"
              placeholder="Search vendor..."
              value={filters.vendor}
              onChange={(e) => setFilters(prev => ({ ...prev, vendor: e.target.value }))}
              className="w-full px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent/20 focus:border-app-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app-main mb-1">
              Customer
            </label>
            <input
              type="text"
              placeholder="Search customer..."
              value={filters.user}
              onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
              className="w-full px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent/20 focus:border-app-accent"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            onClick={() => setFilters({
              status: 'all',
              dateRange: 'all',
              vendor: '',
              user: '',
              paymentStatus: 'all'
            })}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <Table
        data={orders}
        columns={columns}
        loading={loading}
        searchable={true}
        sortable={true}
        pagination={true}
        enhancedPagination={true}
        pageSize={20}
        onRowClick={handleOrderClick}
        searchPlaceholder="Search orders..."
        emptyMessage="No orders found"
        className="cursor-pointer"
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={showOrderDetail}
        onClose={() => {
          setShowOrderDetail(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onRefund={(order) => {
          setShowOrderDetail(false);
          setSelectedOrder(order);
          setShowRefundModal(true);
        }}
      />

      {/* Refund Modal */}
      <RefundModal
        isOpen={showRefundModal}
        onClose={() => {
          setShowRefundModal(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onRefund={processRefund}
        loading={refundLoading}
      />
    </div>
  );
};

// Order Detail Modal Component
const OrderDetailModal = ({ isOpen, onClose, order, onRefund }) => {
  if (!order) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order #${String(order.id).padStart(4, '0')}`}
      size="large"
    >
      <div className="space-y-6">
        {/* Order Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-app-main mb-3">Order Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-app-muted">Order Date:</span>
                <span className="text-app-main">{formatDate(order.order_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-app-muted">Status:</span>
                <StatusBadge status={order.status} size="small" />
              </div>
              <div className="flex justify-between">
                <span className="text-app-muted">Payment Status:</span>
                <StatusBadge status={order.payment_status} size="small" />
              </div>
              <div className="flex justify-between">
                <span className="text-app-muted">Payment Method:</span>
                <span className="text-app-main capitalize">
                  {order.payment_method === 'razorpay' ? 'Online' : order.payment_method === 'cod' ? 'COD' : order.payment_method || 'N/A'}
                </span>
              </div>
              {order.payment_id && (
                <div className="flex justify-between">
                  <span className="text-app-muted">Payment ID:</span>
                  <span className="text-app-main font-mono text-xs">{order.payment_id}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-app-main mb-3">Customer Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-app-muted">Name:</span>
                <span className="text-app-main">{order.customer_name || order.user?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-app-muted">Email:</span>
                <span className="text-app-main">{order.user?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-app-muted">Phone:</span>
                <span className="text-app-main">{order.customer_phone || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div>
          <h4 className="font-medium text-app-main mb-3">Order Items</h4>
          <div className="border border-app-border rounded-pro overflow-hidden">
            <table className="w-full">
              <thead className="bg-app-secondary">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-app-main uppercase">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-app-main uppercase">Quantity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-app-main uppercase">Unit Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-app-main uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {order.lines?.map((line, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">
                      <div className="font-medium text-app-main">
                        {line.product?.product_name || 'Product'}
                      </div>
                      {line.product?.vendor_name && (
                        <div className="text-sm text-app-muted">
                          by {line.product.vendor_name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-app-main">{line.quantity}</td>
                    <td className="px-4 py-2 text-app-main font-mono">{formatCurrency(line.unit_price)}</td>
                    <td className="px-4 py-2 text-app-accent font-mono font-medium">{formatCurrency(line.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Totals */}
        <div className="border-t border-app-border pt-4">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-app-muted">Subtotal:</span>
                <span className="text-app-main font-mono">{formatCurrency(order.subtotal || order.total_amount)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-app-muted">Discount:</span>
                  <span className="text-green-600 font-mono">-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-app-muted">Tax:</span>
                <span className="text-app-main font-mono">{formatCurrency(order.tax_amount || 0)}</span>
              </div>
              <div className="flex justify-between font-medium text-lg border-t border-app-border pt-2">
                <span className="text-app-main">Total:</span>
                <span className="text-app-accent font-mono">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-app-border">
          {order.payment_status === 'paid' && (
            <Button
              variant="outline"
              onClick={() => onRefund(order)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Process Refund
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Refund Modal Component
const RefundModal = ({ isOpen, onClose, order, onRefund, loading }) => {
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    if (order && isOpen) {
      setRefundAmount(order.total_amount.toString());
      setRefundReason('');
    }
  }, [order, isOpen]);

  const handleRefund = () => {
    if (!refundAmount || parseFloat(refundAmount) <= 0) return;
    onRefund(parseFloat(refundAmount), refundReason);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Process Refund"
      size="medium"
    >
      <div className="space-y-4">
        <div className="bg-app-secondary/30 p-4 rounded-pro">
          <h4 className="font-medium text-app-main mb-2">Order Details</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-app-muted">Order ID:</span>
              <span className="text-app-main">#{String(order.id).padStart(4, '0')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-app-muted">Total Amount:</span>
              <span className="text-app-main font-mono">{formatCurrency(order.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-app-muted">Payment ID:</span>
              <span className="text-app-main font-mono text-xs">{order.payment_id || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-app-main mb-1">
            Refund Amount
          </label>
          <input
            type="number"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            max={order.total_amount}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent/20 focus:border-app-accent"
            placeholder="Enter refund amount"
          />
          <p className="text-xs text-app-muted mt-1">
            Maximum refundable amount: {formatCurrency(order.total_amount)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-app-main mb-1">
            Refund Reason
          </label>
          <textarea
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent/20 focus:border-app-accent"
            placeholder="Enter reason for refund..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-app-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleRefund}
            disabled={loading || !refundAmount || parseFloat(refundAmount) <= 0}
          >
            {loading ? 'Processing...' : 'Process Refund'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default OrderManagement;
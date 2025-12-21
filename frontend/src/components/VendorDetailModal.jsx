import React, { useState, useEffect } from 'react';
import { adminAPI, errorUtils } from '../utils/api';
import Modal from './Modal';
import Button from './Button';
import { StatusBadge } from './Badge';
import LoadingSpinner from './LoadingSpinner';
import Table from './Table';

const VendorDetailModal = ({
  vendor,
  isOpen,
  onClose,
  onVendorAction
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [vendorDetails, setVendorDetails] = useState(null);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [vendorOrders, setVendorOrders] = useState([]);
  const [vendorEarnings, setVendorEarnings] = useState(null);

  // Load vendor details and related data
  const loadVendorData = async () => {
    if (!vendor?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load vendor details
      const detailsResponse = await adminAPI.getVendor(vendor.id);
      setVendorDetails(detailsResponse);
      
      // Load vendor products
      const productsResponse = await adminAPI.getVendorProducts(vendor.id);
      setVendorProducts(productsResponse.results || productsResponse);
      
      // Load vendor orders
      const ordersResponse = await adminAPI.getVendorOrders(vendor.id);
      setVendorOrders(ordersResponse.results || ordersResponse);
      
      // Load vendor earnings
      const earningsResponse = await adminAPI.getVendorEarnings(vendor.id);
      setVendorEarnings(earningsResponse);
      
    } catch (err) {
      console.error('Failed to load vendor data:', err);
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && vendor) {
      loadVendorData();
      setActiveTab('profile');
    }
  }, [isOpen, vendor]);

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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'orders', label: 'Orders', icon: '📋' },
    { id: 'earnings', label: 'Earnings', icon: '💰' },
    { id: 'performance', label: 'Performance', icon: '📊' }
  ];

  // Product table columns
  const productColumns = [
    {
      key: 'name',
      label: 'Product Name',
      render: (value, product) => (
        <div className="flex items-center">
          {product.image && (
            <img 
              src={product.image} 
              alt={product.name}
              className="w-8 h-8 rounded object-cover mr-3"
            />
          )}
          <div>
            <div className="text-sm font-medium text-app-main">{product.name}</div>
            <div className="text-xs text-app-muted">SKU: {product.sku || 'N/A'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (value) => value || 'N/A'
    },
    {
      key: 'price',
      label: 'Price',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'stock_quantity',
      label: 'Stock',
      render: (value) => (
        <span className={`text-sm font-mono ${value > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {value || 0}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} size="small" />
    }
  ];

  // Order table columns
  const orderColumns = [
    {
      key: 'order_number',
      label: 'Order #',
      render: (value) => (
        <span className="text-sm font-mono text-app-accent">{value}</span>
      )
    },
    {
      key: 'customer_name',
      label: 'Customer',
      render: (value, order) => (
        <div>
          <div className="text-sm font-medium text-app-main">{value || 'N/A'}</div>
          <div className="text-xs text-app-muted">{order.customer_email}</div>
        </div>
      )
    },
    {
      key: 'total_amount',
      label: 'Amount',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} size="small" />
    },
    {
      key: 'order_date',
      label: 'Date',
      render: (value) => formatDate(value)
    }
  ];

  if (!vendor) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Vendor Details - ${vendor.displayName || vendor.name}`}
      size="xlarge"
    >
      <div className="flex flex-col h-full">
        {/* Tab Navigation */}
        <div className="flex border-b border-app-border mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-app-accent text-app-accent'
                  : 'border-transparent text-app-muted hover:text-app-main'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <LoadingSpinner size="large" text="Loading vendor data..." />
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-pro">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          ) : (
            <>
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
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

                    {/* Business Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-app-main">Business Details</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-app-muted">Business Type</label>
                          <p className="text-app-main">{vendorDetails?.business_type || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-app-muted">GST Number</label>
                          <p className="text-app-main">{vendorDetails?.gst_number || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-app-muted">Registration Date</label>
                          <p className="text-app-main">{formatDate(vendor.application_date)}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-app-muted">Approval Date</label>
                          <p className="text-app-main">{formatDate(vendor.approval_date)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h3 className="text-lg font-medium text-app-main mb-2">Address</h3>
                    <p className="text-app-main bg-app-secondary/30 p-3 rounded-pro">
                      {vendorDetails?.address || vendor.address || 'No address provided'}
                    </p>
                  </div>

                  {/* Business Description */}
                  {(vendorDetails?.business_description || vendor.business_description) && (
                    <div>
                      <h3 className="text-lg font-medium text-app-main mb-2">Business Description</h3>
                      <p className="text-app-main bg-app-secondary/30 p-3 rounded-pro">
                        {vendorDetails?.business_description || vendor.business_description}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4 border-t border-app-border">
                    {vendor.status === 'pending' && (
                      <>
                        <Button
                          variant="primary"
                          onClick={() => {
                            onVendorAction(vendor, 'approve');
                            onClose(); // Close modal after action
                          }}
                          fullWidth={false}
                        >
                          Approve Vendor
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            onVendorAction(vendor, 'reject');
                            onClose(); // Close modal after action
                          }}
                          fullWidth={false}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Reject Application
                        </Button>
                      </>
                    )}
                    
                    {vendor.status === 'approved' && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          onVendorAction(vendor, 'suspend');
                          onClose(); // Close modal after action
                        }}
                        fullWidth={false}
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        Suspend Vendor
                      </Button>
                    )}
                    
                    {vendor.status === 'suspended' && (
                      <Button
                        variant="primary"
                        onClick={() => {
                          onVendorAction(vendor, 'reactivate');
                          onClose(); // Close modal after action
                        }}
                        fullWidth={false}
                      >
                        Reactivate Vendor
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Products Tab */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-app-main">Products ({vendorProducts.length})</h3>
                  </div>
                  
                  <Table
                    data={vendorProducts}
                    columns={productColumns}
                    pagination={true}
                    sortable={true}
                    emptyMessage="No products found"
                    pageSize={10}
                  />
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-app-main">Orders ({vendorOrders.length})</h3>
                  </div>
                  
                  <Table
                    data={vendorOrders}
                    columns={orderColumns}
                    pagination={true}
                    sortable={true}
                    emptyMessage="No orders found"
                    pageSize={10}
                  />
                </div>
              )}

              {/* Earnings Tab */}
              {activeTab === 'earnings' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-app-main">Earnings Overview</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-app-secondary/30 p-4 rounded-pro">
                      <div className="text-sm font-medium text-app-muted">Total Earnings</div>
                      <div className="text-2xl font-bold text-app-main">
                        {formatCurrency(vendorEarnings?.total_earnings || vendor.totalEarnings || 0)}
                      </div>
                      <div className="text-xs text-app-muted mt-1">
                        Since {formatDate(vendor.approval_date)}
                      </div>
                    </div>
                    
                    <div className="bg-app-secondary/30 p-4 rounded-pro">
                      <div className="text-sm font-medium text-app-muted">This Month</div>
                      <div className="text-2xl font-bold text-app-main">
                        {formatCurrency(vendorEarnings?.monthly_earnings || 0)}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        +12.5% from last month
                      </div>
                    </div>
                    
                    <div className="bg-app-secondary/30 p-4 rounded-pro">
                      <div className="text-sm font-medium text-app-muted">Pending Payout</div>
                      <div className="text-2xl font-bold text-app-main">
                        {formatCurrency(vendorEarnings?.pending_payout || 0)}
                      </div>
                      <div className="text-xs text-app-muted mt-1">
                        Next payout: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Earnings Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-app-surface border border-app-border rounded-pro p-4">
                      <h4 className="text-md font-medium text-app-main mb-3">Earnings Breakdown</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-app-muted">Gross Sales:</span>
                          <span className="font-medium">{formatCurrency((vendorEarnings?.total_earnings || 0) * 1.1)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-app-muted">Platform Commission ({vendorEarnings?.commission_rate || '10'}%):</span>
                          <span className="font-medium text-red-600">-{formatCurrency(vendorEarnings?.total_commission || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-app-muted">Processing Fees:</span>
                          <span className="font-medium text-red-600">-{formatCurrency((vendorEarnings?.total_earnings || 0) * 0.02)}</span>
                        </div>
                        <hr className="border-app-border" />
                        <div className="flex justify-between items-center font-medium">
                          <span className="text-app-main">Net Earnings:</span>
                          <span className="text-green-600">{formatCurrency(vendorEarnings?.total_earnings || vendor.totalEarnings || 0)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-app-surface border border-app-border rounded-pro p-4">
                      <h4 className="text-md font-medium text-app-main mb-3">Payment Statistics</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-app-muted">Total Payouts:</span>
                          <span className="font-medium">{vendorEarnings?.total_payouts || '12'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-app-muted">Last Payout:</span>
                          <span className="font-medium">{formatDate(vendorEarnings?.last_payout_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-app-muted">Average Order Value:</span>
                          <span className="font-medium">{formatCurrency((vendorEarnings?.total_earnings || 0) / Math.max(vendorOrders.length, 1))}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-app-muted">Payment Method:</span>
                          <span className="font-medium">Bank Transfer</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Commission Details */}
                  <div className="bg-app-surface border border-app-border rounded-pro p-4">
                    <h4 className="text-md font-medium text-app-main mb-3">Commission & Fee Structure</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-app-muted">Commission Rate:</span>
                        <div className="font-medium text-lg">{vendorEarnings?.commission_rate || '10'}%</div>
                      </div>
                      <div>
                        <span className="text-app-muted">Processing Fee:</span>
                        <div className="font-medium text-lg">2.0%</div>
                      </div>
                      <div>
                        <span className="text-app-muted">Total Commission Paid:</span>
                        <div className="font-medium text-lg">{formatCurrency(vendorEarnings?.total_commission || 0)}</div>
                      </div>
                      <div>
                        <span className="text-app-muted">Effective Rate:</span>
                        <div className="font-medium text-lg">{((vendorEarnings?.commission_rate || 10) + 2).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div className="bg-app-surface border border-app-border rounded-pro p-4">
                    <h4 className="text-md font-medium text-app-main mb-3">Recent Earnings (Last 5 Orders)</h4>
                    <div className="space-y-2">
                      {vendorOrders.slice(0, 5).map((order, index) => (
                        <div key={order.id || index} className="flex justify-between items-center py-2 border-b border-app-border last:border-b-0">
                          <div>
                            <div className="text-sm font-medium">Order #{order.order_number}</div>
                            <div className="text-xs text-app-muted">{formatDate(order.order_date)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600">
                              +{formatCurrency((order.total_amount || 0) * 0.9)}
                            </div>
                            <div className="text-xs text-app-muted">
                              from {formatCurrency(order.total_amount || 0)}
                            </div>
                          </div>
                        </div>
                      ))}
                      {vendorOrders.length === 0 && (
                        <div className="text-center text-app-muted py-4">
                          No recent orders found
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-app-main">Performance Metrics</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-app-secondary/30 p-4 rounded-pro">
                      <div className="text-sm font-medium text-app-muted">Total Products</div>
                      <div className="text-2xl font-bold text-app-main">{vendorProducts.length}</div>
                      <div className="text-xs text-app-muted mt-1">
                        Active: {vendorProducts.filter(p => p.status === 'approved').length}
                      </div>
                    </div>
                    
                    <div className="bg-app-secondary/30 p-4 rounded-pro">
                      <div className="text-sm font-medium text-app-muted">Total Orders</div>
                      <div className="text-2xl font-bold text-app-main">{vendorOrders.length}</div>
                      <div className="text-xs text-app-muted mt-1">
                        Completed: {vendorOrders.filter(o => o.status === 'completed').length}
                      </div>
                    </div>
                    
                    <div className="bg-app-secondary/30 p-4 rounded-pro">
                      <div className="text-sm font-medium text-app-muted">Average Rating</div>
                      <div className="text-2xl font-bold text-app-main flex items-center">
                        {(vendor.rating || 0).toFixed(1)}
                        <svg className="w-5 h-5 text-yellow-400 ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div className="text-xs text-app-muted mt-1">
                        Based on {vendorOrders.length} orders
                      </div>
                    </div>
                    
                    <div className="bg-app-secondary/30 p-4 rounded-pro">
                      <div className="text-sm font-medium text-app-muted">Response Rate</div>
                      <div className="text-2xl font-bold text-app-main">
                        {vendorEarnings?.response_rate || '95'}%
                      </div>
                      <div className="text-xs text-app-muted mt-1">
                        Last 30 days
                      </div>
                    </div>
                  </div>

                  {/* Performance Indicators */}
                  <div className="bg-app-surface border border-app-border rounded-pro p-4">
                    <h4 className="text-md font-medium text-app-main mb-3">Performance Indicators</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-app-muted">Order Fulfillment Rate</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: '98%' }}></div>
                          </div>
                          <span className="font-medium text-green-600">98%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-app-muted">Average Delivery Time</span>
                        <span className="font-medium">3.2 days</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-app-muted">Customer Satisfaction</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                          </div>
                          <span className="font-medium text-green-600">4.5/5</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-app-muted">Return Rate</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: '8%' }}></div>
                          </div>
                          <span className="font-medium text-green-600">2.1%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-app-muted">Product Quality Score</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                          </div>
                          <span className="font-medium text-blue-600">8.5/10</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-app-muted">Inventory Management</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                          </div>
                          <span className="font-medium text-blue-600">Excellent</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Risk Assessment */}
                  <div className="bg-app-surface border border-app-border rounded-pro p-4">
                    <h4 className="text-md font-medium text-app-main mb-3">Risk Assessment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">Low</div>
                        <div className="text-sm text-app-muted">Financial Risk</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">Low</div>
                        <div className="text-sm text-app-muted">Compliance Risk</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">Medium</div>
                        <div className="text-sm text-app-muted">Operational Risk</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Performance Trends */}
                  <div className="bg-app-surface border border-app-border rounded-pro p-4">
                    <h4 className="text-md font-medium text-app-main mb-3">Recent Performance Trends</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-app-muted">Sales Growth (30 days)</span>
                        <span className="text-green-600 font-medium">+12.5%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-app-muted">Customer Retention</span>
                        <span className="text-green-600 font-medium">+8.2%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-app-muted">Product Views</span>
                        <span className="text-blue-600 font-medium">+15.7%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-app-muted">Conversion Rate</span>
                        <span className="text-green-600 font-medium">+3.1%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default VendorDetailModal;
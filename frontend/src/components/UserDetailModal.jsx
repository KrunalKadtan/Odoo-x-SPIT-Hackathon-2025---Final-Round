import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { StatusBadge, RiskBadge } from './Badge';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { adminAPI, errorUtils } from '../utils/api';

const UserDetailModal = ({
  isOpen,
  onClose,
  user,
  onUserAction
}) => {
  const [userDetails, setUserDetails] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Load user details when modal opens
  useEffect(() => {
    if (isOpen && user) {
      loadUserDetails();
    }
  }, [isOpen, user]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load user details, orders, and activity in parallel
      const [detailsResponse, ordersResponse, activityResponse] = await Promise.all([
        adminAPI.getUser(user.id),
        adminAPI.getUserOrders(user.id, { limit: 10 }),
        adminAPI.getUserActivity(user.id, { limit: 10 })
      ]);
      
      setUserDetails(detailsResponse);
      setUserOrders(ordersResponse.results || ordersResponse);
      setUserActivity(activityResponse.results || activityResponse);
    } catch (err) {
      console.error('Failed to load user details:', err);
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = (action) => {
    onUserAction(user, action);
    onClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString()}`;
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'orders', label: 'Orders' },
    { id: 'activity', label: 'Activity' }
  ];

  const renderProfileTab = () => {
    const details = userDetails || user;
    
    return (
      <div className="space-y-6">
        {/* Basic Information */}
        <div>
          <h4 className="text-lg font-medium text-app-main mb-4">Basic Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-app-muted">Full Name</label>
              <p className="mt-1 text-sm text-app-main">
                {details.name || 'N/A'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-app-muted">Email</label>
              <p className="mt-1 text-sm text-app-main">{details.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-app-muted">Phone</label>
              <p className="mt-1 text-sm text-app-main">{details.phone || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-app-muted">Status</label>
              <div className="mt-1">
                <StatusBadge status={details.status || 'active'} size="small" />
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div>
          <h4 className="text-lg font-medium text-app-main mb-4">Account Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-app-muted">Registration Date</label>
              <p className="mt-1 text-sm text-app-main">{formatDate(details.date_joined)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-app-muted">Last Login</label>
              <p className="mt-1 text-sm text-app-main">{formatDate(details.last_login)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-app-muted">Risk Level</label>
              <div className="mt-1">
                <RiskBadge level={details.risk_level || 'low'} size="small" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-app-muted">Email Verified</label>
              <p className="mt-1 text-sm text-app-main">
                {details.is_email_verified ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div>
          <h4 className="text-lg font-medium text-app-main mb-4">Statistics</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-app-secondary/30 p-4 rounded-pro">
              <div className="text-2xl font-bold text-app-accent">{details.order_count || 0}</div>
              <div className="text-sm text-app-muted">Total Orders</div>
            </div>
            <div className="bg-app-secondary/30 p-4 rounded-pro">
              <div className="text-2xl font-bold text-app-accent">{formatCurrency(details.total_spent)}</div>
              <div className="text-sm text-app-muted">Total Spent</div>
            </div>
            <div className="bg-app-secondary/30 p-4 rounded-pro">
              <div className="text-2xl font-bold text-app-accent">
                {details.order_count > 0 ? formatCurrency(details.total_spent / details.order_count) : '₹0'}
              </div>
              <div className="text-sm text-app-muted">Avg Order Value</div>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div>
          <h4 className="text-lg font-medium text-app-main mb-4">Risk Assessment</h4>
          <div className="bg-app-secondary/30 p-4 rounded-pro">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-app-main">Overall Risk Level</span>
              <RiskBadge level={details.risk_level || 'low'} />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-app-muted">Account Age</span>
                <span className="text-sm text-app-main">
                  {details.date_joined ? 
                    Math.floor((new Date() - new Date(details.date_joined)) / (1000 * 60 * 60 * 24)) + ' days'
                    : 'N/A'
                  }
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-app-muted">Failed Login Attempts</span>
                <span className="text-sm text-app-main">{details.failed_login_attempts || 0}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-app-muted">Cancelled Orders</span>
                <span className="text-sm text-app-main">{details.cancelled_orders || 0}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-app-muted">Refund Requests</span>
                <span className="text-sm text-app-main">{details.refund_requests || 0}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-app-muted">Payment Failures</span>
                <span className="text-sm text-app-main">{details.payment_failures || 0}</span>
              </div>
            </div>
            
            {/* Risk Factors */}
            {(details.risk_factors && details.risk_factors.length > 0) && (
              <div className="mt-4 pt-4 border-t border-app-border">
                <span className="text-sm font-medium text-app-main mb-2 block">Risk Factors:</span>
                <div className="flex flex-wrap gap-2">
                  {details.risk_factors.map((factor, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-pro"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Address Information */}
        {details.addresses && details.addresses.length > 0 && (
          <div>
            <h4 className="text-lg font-medium text-app-main mb-4">Addresses</h4>
            <div className="space-y-3">
              {details.addresses.map((address, index) => (
                <div key={index} className="border border-app-border rounded-pro p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-app-main">{address.type || 'Address'}</span>
                    {address.is_default && (
                      <span className="px-2 py-1 bg-app-accent text-white text-xs rounded-pro">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-app-muted">
                    <p>{address.street_address}</p>
                    {address.apartment && <p>{address.apartment}</p>}
                    <p>{address.city}, {address.state} {address.postal_code}</p>
                    {address.country && <p>{address.country}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOrdersTab = () => {
    if (userOrders.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-app-muted">No orders found</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-medium text-app-main">Recent Orders</h4>
          <div className="text-sm text-app-muted">
            Showing {userOrders.length} of {userDetails?.order_count || 0} total orders
          </div>
        </div>
        
        <div className="space-y-3">
          {userOrders.map((order) => (
            <div key={order.id} className="border border-app-border rounded-pro p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-app-main">Order #{order.id}</div>
                  <div className="text-sm text-app-muted">{formatDate(order.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-app-main">{formatCurrency(order.total_amount)}</div>
                  <StatusBadge status={order.status} size="small" />
                </div>
              </div>
              
              {/* Order Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-app-muted">Items: </span>
                  <span className="text-app-main">{order.items?.length || 0}</span>
                </div>
                <div>
                  <span className="text-app-muted">Payment: </span>
                  <span className="text-app-main">{order.payment_method || 'N/A'}</span>
                </div>
                {order.shipping_address && (
                  <div className="col-span-2">
                    <span className="text-app-muted">Shipping: </span>
                    <span className="text-app-main">
                      {order.shipping_address.city}, {order.shipping_address.state}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Order Items Preview */}
              {order.items && order.items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-app-border">
                  <div className="text-sm text-app-muted mb-2">Items:</div>
                  <div className="space-y-1">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-app-main">{item.product_name || item.name}</span>
                        <span className="text-app-muted">
                          {item.quantity}x {formatCurrency(item.price)}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="text-sm text-app-muted">
                        +{order.items.length - 3} more items
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Order Summary */}
        <div className="bg-app-secondary/30 p-4 rounded-pro">
          <h5 className="font-medium text-app-main mb-3">Order Summary</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-app-muted">Completed Orders:</span>
              <span className="text-app-main">
                {userOrders.filter(o => o.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-app-muted">Pending Orders:</span>
              <span className="text-app-main">
                {userOrders.filter(o => o.status === 'pending').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-app-muted">Cancelled Orders:</span>
              <span className="text-app-main">
                {userOrders.filter(o => o.status === 'cancelled').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-app-muted">Total Value:</span>
              <span className="text-app-main">
                {formatCurrency(userOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderActivityTab = () => {
    if (userActivity.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-app-muted">No activity found</p>
        </div>
      );
    }

    const getActivityIcon = (type) => {
      switch (type) {
        case 'login':
          return (
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          );
        case 'order':
          return (
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          );
        case 'payment':
          return (
            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          );
        case 'profile':
          return (
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          );
        case 'security':
          return (
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          );
        default:
          return (
            <svg className="w-4 h-4 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
      }
    };

    return (
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-app-main">Recent Activity</h4>
        <div className="space-y-3">
          {userActivity.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 border border-app-border rounded-pro">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <div className="text-sm text-app-main">{activity.description}</div>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="text-xs text-app-muted">{formatDate(activity.timestamp)}</div>
                  {activity.ip_address && (
                    <div className="text-xs text-app-muted">IP: {activity.ip_address}</div>
                  )}
                  {activity.user_agent && (
                    <div className="text-xs text-app-muted">
                      {activity.user_agent.includes('Mobile') ? 'Mobile' : 'Desktop'}
                    </div>
                  )}
                </div>
                {activity.details && (
                  <div className="text-xs text-app-muted mt-1 bg-app-secondary/30 p-2 rounded">
                    {activity.details}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Activity Summary */}
        <div className="bg-app-secondary/30 p-4 rounded-pro">
          <h5 className="font-medium text-app-main mb-3">Activity Summary</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-app-muted">Login Events:</span>
              <span className="text-app-main">
                {userActivity.filter(a => a.type === 'login').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-app-muted">Order Events:</span>
              <span className="text-app-main">
                {userActivity.filter(a => a.type === 'order').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-app-muted">Payment Events:</span>
              <span className="text-app-main">
                {userActivity.filter(a => a.type === 'payment').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-app-muted">Security Events:</span>
              <span className="text-app-main">
                {userActivity.filter(a => a.type === 'security').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const footer = (
    <div className="flex justify-between">
      <div className="flex space-x-3">
        <Button
          variant={user?.status === 'blocked' ? 'primary' : 'outline'}
          onClick={() => handleUserAction(user?.status === 'blocked' ? 'unblock' : 'block')}
          fullWidth={false}
        >
          {user?.status === 'blocked' ? 'Unblock User' : 'Block User'}
        </Button>
      </div>
      <Button
        variant="outline"
        onClick={onClose}
        fullWidth={false}
      >
        Close
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`User Details - ${user?.email || 'Unknown'}`}
      size="large"
      footer={footer}
    >
      {loading ? (
        <div className="py-8">
          <LoadingSpinner size="medium" text="Loading user details..." />
        </div>
      ) : error ? (
        <div className="py-8 text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Button
            variant="outline"
            onClick={loadUserDetails}
            fullWidth={false}
          >
            Retry
          </Button>
        </div>
      ) : (
        <div>
          {/* Tabs */}
          <div className="border-b border-app-border mb-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-app-accent text-app-accent'
                      : 'border-transparent text-app-muted hover:text-app-main hover:border-app-border'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-96">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'orders' && renderOrdersTab()}
            {activeTab === 'activity' && renderActivityTab()}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default UserDetailModal;
import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from './LoadingSpinner';
import Badge from './Badge';

/**
 * AdminNotificationPanel - Admin-specific notification management panel
 * Displays admin notifications with filtering, search, and unread count management
 */
const AdminNotificationPanel = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, unread, read
  const [filterCategory, setFilterCategory] = useState('all'); // all, user, vendor, order, system
  const [unreadCount, setUnreadCount] = useState(0);
  const { showError, showSuccess } = useNotification();

  // Fetch admin notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getAdminNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch admin notifications:', err);
      setError('Failed to load notifications');
      showError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await adminAPI.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      showError('Failed to mark notification as read');
    }
  }, [showError]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await adminAPI.markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);
      showSuccess('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      showError('Failed to mark all notifications as read');
    }
  }, [showError, showSuccess]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await adminAPI.deleteNotification(notificationId);
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      showSuccess('Notification deleted');
    } catch (err) {
      console.error('Failed to delete notification:', err);
      showError('Failed to delete notification');
    }
  }, [showError, showSuccess]);

  // Filter notifications based on search and filters
  const filteredNotifications = notifications.filter(notification => {
    // Search filter
    if (searchTerm && !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !notification.message.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Read/unread filter
    if (filterType === 'unread' && notification.is_read) return false;
    if (filterType === 'read' && !notification.is_read) return false;

    // Category filter
    if (filterCategory !== 'all' && notification.category !== filterCategory) return false;

    return true;
  });

  // Get notification icon based on category
  const getNotificationIcon = (category, type) => {
    const iconClass = "w-5 h-5";
    
    switch (category) {
      case 'user':
        return (
          <svg className={`${iconClass} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'vendor':
        return (
          <svg className={`${iconClass} text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'order':
        return (
          <svg className={`${iconClass} text-purple-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        );
      case 'system':
        return (
          <svg className={`${iconClass} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className={`${iconClass} text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Load notifications on mount
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-96 bg-app-surface shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-app-border">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-display font-semibold text-app-main">
              Admin Notifications
            </h2>
            {unreadCount > 0 && (
              <Badge variant="error" size="sm">
                {unreadCount}
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-app-muted hover:text-app-main transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-app-border space-y-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filters */}
          <div className="flex space-x-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent text-sm"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="flex-1 px-3 py-2 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent text-sm"
            >
              <option value="all">All Categories</option>
              <option value="user">Users</option>
              <option value="vendor">Vendors</option>
              <option value="order">Orders</option>
              <option value="system">System</option>
            </select>
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="w-full px-3 py-2 text-sm font-sans font-medium text-app-accent hover:bg-app-secondary rounded-pro transition-colors duration-200"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner size="md" />
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-app-error text-sm">{error}</p>
              <button
                onClick={fetchNotifications}
                className="mt-2 px-4 py-2 text-sm font-sans font-medium text-app-accent hover:bg-app-secondary rounded-pro transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 text-app-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 0 0-15 0v5h5l-5 5-5-5h5V7a9.5 9.5 0 0 1 19 0v10z" />
              </svg>
              <p className="text-app-muted text-sm">
                {searchTerm || filterType !== 'all' || filterCategory !== 'all' 
                  ? 'No notifications match your filters'
                  : 'No notifications yet'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-app-border">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-app-secondary transition-colors duration-200 ${
                    !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.category, notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`text-sm font-sans font-medium ${
                            !notification.is_read ? 'text-app-main' : 'text-app-muted'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-app-muted mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-app-muted">
                              {formatTimestamp(notification.created_at)}
                            </span>
                            <Badge variant="secondary" size="xs">
                              {notification.category}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-app-muted hover:text-app-accent transition-colors duration-200"
                              title="Mark as read"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-app-muted hover:text-app-error transition-colors duration-200"
                            title="Delete notification"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationPanel;
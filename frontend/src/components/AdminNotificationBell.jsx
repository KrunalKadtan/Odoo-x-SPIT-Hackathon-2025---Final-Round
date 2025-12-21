import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../utils/api';
import AdminNotificationPanel from './AdminNotificationPanel';
import Badge from './Badge';

/**
 * AdminNotificationBell - Notification bell icon with unread count for admin header
 * Shows unread notification count and opens notification panel on click
 */
const AdminNotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getUnreadNotificationCount();
      setUnreadCount(data.count || 0);
    } catch (err) {
      console.error('Failed to fetch unread notification count:', err);
      // Silently fail for notification count - not critical
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    
    const interval = setInterval(fetchUnreadCount, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Handle bell click
  const handleBellClick = () => {
    setShowPanel(true);
  };

  // Handle panel close
  const handlePanelClose = () => {
    setShowPanel(false);
    // Refresh count when panel closes
    fetchUnreadCount();
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={handleBellClick}
          className={`
            relative p-2 rounded-pro transition-all duration-200
            ${unreadCount > 0 
              ? 'text-app-accent hover:bg-app-accent hover:text-white' 
              : 'text-app-muted hover:text-app-main hover:bg-app-secondary'
            }
            ${loading ? 'opacity-50' : ''}
          `}
          title={`${unreadCount} unread notifications`}
          disabled={loading}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 0 0-15 0v5h5l-5 5-5-5h5V7a9.5 9.5 0 0 1 19 0v10z" 
            />
          </svg>
          
          {/* Unread count badge */}
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1">
              <Badge variant="error" size="xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            </div>
          )}
          
          {/* Loading indicator */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-app-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </button>
      </div>

      {/* Notification Panel */}
      <AdminNotificationPanel 
        isOpen={showPanel} 
        onClose={handlePanelClose}
      />
    </>
  );
};

export default AdminNotificationBell;
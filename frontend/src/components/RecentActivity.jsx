import React from 'react';
import { useNavigate } from 'react-router-dom';
import { InfiniteScrollActivityFeed } from './LazyDashboardComponent';

/**
 * RecentActivity - Component for displaying recent system activity
 * Uses existing list styling for consistency with customer application
 * Supports infinite scroll for large activity feeds
 */
const RecentActivity = ({ 
  activities = [], 
  loading = false, 
  hasMore = false,
  onLoadMore,
  infiniteScroll = false,
  maxDisplayed = 10
}) => {
  const navigate = useNavigate();

  // Get activity icon based on type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_signup':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      case 'vendor_application':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'order_created':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case 'payment_failed':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'product_approved':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'product_rejected':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Format timestamp to relative time
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  // Handle activity item click for navigation
  const handleActivityClick = (activity) => {
    switch (activity.type) {
      case 'user_signup':
        if (activity.userId) {
          navigate(`/admin/users?search=${activity.userId}`);
        }
        break;
      case 'vendor_application':
        if (activity.vendorId) {
          navigate(`/admin/vendors?search=${activity.vendorId}`);
        }
        break;
      case 'order_created':
      case 'payment_failed':
        if (activity.orderId) {
          navigate(`/admin/orders?search=${activity.orderId}`);
        }
        break;
      case 'product_approved':
      case 'product_rejected':
        if (activity.productId) {
          navigate(`/admin/products?search=${activity.productId}`);
        }
        break;
      default:
        break;
    }
  };

  // Render individual activity item
  const renderActivity = (activity, index) => (
    <div
      key={activity.id}
      onClick={() => handleActivityClick(activity)}
      className={`
        flex items-start space-x-3 p-3 rounded-pro transition-colors duration-200
        ${activity.userId || activity.vendorId || activity.orderId || activity.productId 
          ? 'cursor-pointer hover:bg-app-secondary' 
          : ''
        }
      `}
    >
      {/* Activity Icon */}
      <div className="flex-shrink-0 w-10 h-10 bg-app-secondary rounded-pro flex items-center justify-center">
        {getActivityIcon(activity.type)}
      </div>

      {/* Activity Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-sans text-app-main">
          {activity.description}
        </p>
        <p className="text-xs text-app-muted mt-1">
          {formatTimestamp(activity.timestamp)}
        </p>
      </div>

      {/* Navigation Arrow (if clickable) */}
      {(activity.userId || activity.vendorId || activity.orderId || activity.productId) && (
        <div className="flex-shrink-0">
          <svg className="w-4 h-4 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );

  // Use infinite scroll if enabled
  if (infiniteScroll && onLoadMore) {
    return (
      <InfiniteScrollActivityFeed
        activities={activities}
        hasMore={hasMore}
        isLoading={loading}
        onLoadMore={onLoadMore}
        renderActivity={renderActivity}
      />
    );
  }

  // Limit displayed activities if not using infinite scroll
  const displayedActivities = infiniteScroll ? activities : activities.slice(0, maxDisplayed);

  if (loading && activities.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-start space-x-3 animate-pulse">
            <div className="w-10 h-10 bg-app-secondary rounded-pro"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-app-secondary rounded w-3/4"></div>
              <div className="h-3 bg-app-secondary rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (displayedActivities.length === 0 && !loading) {
    return (
      <div className="text-center py-8">
        <svg className="w-12 h-12 text-app-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-app-muted font-sans">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayedActivities.map((activity) => renderActivity(activity))}

      {/* Show loading indicator for additional items */}
      {loading && activities.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <svg className="animate-spin w-4 h-4 text-app-accent mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-app-muted text-sm">Loading more...</span>
        </div>
      )}

      {/* View All Link */}
      {!infiniteScroll && (
        <div className="pt-4 border-t border-app-border">
          <button
            onClick={() => navigate('/admin/activity')}
            className="w-full text-center text-sm font-sans font-medium text-app-accent hover:text-app-main transition-colors duration-200"
          >
            View All Activity
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
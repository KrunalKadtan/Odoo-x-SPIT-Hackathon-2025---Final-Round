import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { useProgressiveLoading } from '../../hooks/useLazyLoading';
import MetricCard from '../../components/MetricCard';
import RecentActivity from '../../components/RecentActivity';
import SystemAlerts from '../../components/SystemAlerts';
import LazyDashboardComponent, { ProgressiveDashboardLoader } from '../../components/LazyDashboardComponent';

/**
 * Admin Dashboard - Main landing page for admin users
 * Shows system overview, metrics, and recent activity with lazy loading
 */
const AdminDashboard = () => {
  const { adminUser } = useAdminAuth();
  const { 
    metrics, 
    recentActivity, 
    systemAlerts, 
    loading, 
    error, 
    refreshDashboard,
    loadMoreActivity,
    hasMoreActivity
  } = useAdminDashboard();
  const navigate = useNavigate();

  // Progressive loading for dashboard components
  const dashboardComponents = [
    'metrics',
    'recentActivity', 
    'systemAlerts'
  ];

  const { isComponentLoaded } = useProgressiveLoading({
    components: dashboardComponents,
    delay: 100,
    staggerDelay: 150
  });

  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format numbers with commas
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  // Handle metric card clicks for navigation
  const handleMetricClick = (type) => {
    switch (type) {
      case 'users':
        navigate('/admin/users');
        break;
      case 'vendors':
        navigate('/admin/vendors');
        break;
      case 'orders':
        navigate('/admin/orders');
        break;
      case 'revenue':
        navigate('/admin/analytics');
        break;
      default:
        break;
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-pro p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
              <p className="text-sm text-red-700 mt-1">
                {typeof error === 'string' ? error : error?.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={refreshDashboard}
                className="mt-2 text-sm text-red-800 underline hover:text-red-900"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold text-app-main">
              Admin Dashboard
            </h1>
            <p className="text-app-muted font-sans">
              Welcome back, {adminUser?.name || 'Admin'}
            </p>
          </div>
          <button
            onClick={refreshDashboard}
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm font-sans font-medium text-app-accent border border-app-border rounded-pro hover:bg-app-secondary transition-colors duration-200 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Cards with Lazy Loading */}
      <LazyDashboardComponent
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        threshold={0.1}
        delay={0}
      >
        {isComponentLoaded('metrics') && (
          <>
            <MetricCard
              title="Total Users"
              value={formatNumber(metrics.totalUsers)}
              loading={loading}
              onClick={() => handleMetricClick('users')}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              }
            />
            
            <MetricCard
              title="Total Vendors"
              value={formatNumber(metrics.totalVendors)}
              loading={loading}
              onClick={() => handleMetricClick('vendors')}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />
            
            <MetricCard
              title="Total Orders"
              value={formatNumber(metrics.totalOrders)}
              loading={loading}
              onClick={() => handleMetricClick('orders')}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              }
            />
            
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(metrics.totalRevenue)}
              loading={loading}
              onClick={() => handleMetricClick('revenue')}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              }
            />
          </>
        )}
      </LazyDashboardComponent>

      {/* Recent Activity and System Alerts with Lazy Loading */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LazyDashboardComponent
          className="bg-app-surface p-6 rounded-pro shadow-sm border border-app-border"
          threshold={0.1}
          delay={200}
        >
          {isComponentLoaded('recentActivity') && (
            <>
              <h2 className="text-lg font-sans font-semibold text-app-main mb-4">Recent Activity</h2>
              <RecentActivity 
                activities={recentActivity} 
                loading={loading}
                hasMore={hasMoreActivity}
                onLoadMore={loadMoreActivity}
                infiniteScroll={true}
              />
            </>
          )}
        </LazyDashboardComponent>
        
        <LazyDashboardComponent
          className="bg-app-surface p-6 rounded-pro shadow-sm border border-app-border"
          threshold={0.1}
          delay={350}
        >
          {isComponentLoaded('systemAlerts') && (
            <>
              <h2 className="text-lg font-sans font-semibold text-app-main mb-4">System Alerts</h2>
              <SystemAlerts alerts={systemAlerts} loading={loading} />
            </>
          )}
        </LazyDashboardComponent>
      </div>
    </div>
  );
};

export default AdminDashboard;
import React from 'react';
import AdminLayout from '../../components/AdminLayout';

const AdminReports = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-app-surface px-6 py-6 rounded-pro border border-app-border shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="bg-app-accent/10 p-3 rounded-pro">
              <svg className="w-6 h-6 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-app-main mb-2">Reports & Analytics</h1>
              <p className="text-app-muted font-sans">
                View sales reports, analytics, and business insights
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-app-surface rounded-pro border border-app-border p-8 shadow-sm text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-app-secondary/50 p-4 rounded-pro mb-4">
              <svg className="w-12 h-12 text-app-muted mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-display font-semibold text-app-main mb-2">Coming Soon</h3>
            <p className="text-app-muted font-sans">
              Reports and analytics features are currently under development.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
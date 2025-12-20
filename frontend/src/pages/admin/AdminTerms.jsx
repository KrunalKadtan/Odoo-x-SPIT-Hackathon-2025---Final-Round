import React from 'react';
import AdminLayout from '../../components/AdminLayout';

const AdminTerms = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-app-surface px-6 py-6 rounded-pro border border-app-border shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="bg-app-accent/10 p-3 rounded-pro">
              <svg className="w-6 h-6 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-app-main mb-2">Terms & Offers</h1>
              <p className="text-app-muted font-sans">
                Manage terms of service, privacy policies, and promotional offers
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
              Terms and offers management features are currently under development.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTerms;
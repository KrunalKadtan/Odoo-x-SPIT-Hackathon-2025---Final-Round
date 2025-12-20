import React from 'react';
import AdminLayout from '../../components/AdminLayout';

const AdminUsers = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-app-surface px-6 py-6 rounded-pro border border-app-border shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="bg-app-accent/10 p-3 rounded-pro">
              <svg className="w-6 h-6 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-app-main mb-2">Users & Contacts</h1>
              <p className="text-app-muted font-sans">
                Manage customer accounts, contacts, and user permissions
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
              User and contact management features are currently under development.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
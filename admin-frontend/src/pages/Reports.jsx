import React from 'react';
import AdminLayout from '../components/AdminLayout';

const Reports = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="card px-6 py-6">
          <div className="flex items-start space-x-4">
            <div className="bg-app-accent/10 p-3 rounded-pro">
              <svg className="w-6 h-6 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-app-main mb-2">Reports</h1>
              <p className="text-app-muted font-sans">
                View analytics, sales reports, and business insights
              </p>
            </div>
          </div>
        </div>

        <div className="card p-8 text-center">
          <svg className="w-16 h-16 text-app-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-xl font-display font-semibold text-app-main mb-2">Coming Soon</h2>
          <p className="text-app-muted font-sans">
            Detailed reports and analytics will be available soon
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Reports;
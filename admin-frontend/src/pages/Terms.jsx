import React from 'react';
import AdminLayout from '../components/AdminLayout';

const Terms = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="card px-6 py-6">
          <div className="flex items-start space-x-4">
            <div className="bg-app-accent/10 p-3 rounded-pro">
              <svg className="w-6 h-6 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-app-main mb-2">Terms & Offers</h1>
              <p className="text-app-muted font-sans">
                Manage payment terms, credit limits, and special offers
              </p>
            </div>
          </div>
        </div>

        <div className="card p-8 text-center">
          <svg className="w-16 h-16 text-app-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-display font-semibold text-app-main mb-2">Coming Soon</h2>
          <p className="text-app-muted font-sans">
            Terms and offers management will be available soon
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Terms;
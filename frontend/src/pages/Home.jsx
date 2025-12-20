import React from 'react';
import Navigation from '../components/Navigation';

const Home = () => {
  return (
    <div className="min-h-screen bg-app-primary">
      <Navigation />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="font-display text-6xl font-light text-app-main tracking-tight mb-8">
            HOME PAGE
          </h1>
          
          <div className="max-w-3xl mx-auto">
            <p className="text-app-muted font-sans text-lg mb-8">
              Welcome to ApparelDesk - Your premium apparel business management platform
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {/* Feature Cards */}
              <div className="bg-app-surface rounded-pro shadow-lg border border-app-border p-6">
                <div className="text-app-accent mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-medium text-app-main mb-2">
                  Inventory Management
                </h3>
                <p className="text-app-muted font-sans text-sm">
                  Track your apparel inventory with precision and ease
                </p>
              </div>

              <div className="bg-app-surface rounded-pro shadow-lg border border-app-border p-6">
                <div className="text-app-accent mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-medium text-app-main mb-2">
                  Customer Management
                </h3>
                <p className="text-app-muted font-sans text-sm">
                  Manage your customer relationships and orders efficiently
                </p>
              </div>

              <div className="bg-app-surface rounded-pro shadow-lg border border-app-border p-6">
                <div className="text-app-accent mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-medium text-app-main mb-2">
                  Analytics & Reports
                </h3>
                <p className="text-app-muted font-sans text-sm">
                  Get insights into your business performance and trends
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
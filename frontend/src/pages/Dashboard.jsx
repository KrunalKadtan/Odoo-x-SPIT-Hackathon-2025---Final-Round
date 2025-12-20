import React from 'react';
import { tokenUtils } from '../utils/api';
import Button from '../components/Button';

const Dashboard = () => {
  const handleLogout = () => {
    tokenUtils.clearTokens();
    window.location.href = '/signin';
  };

  return (
    <div className="min-h-screen bg-app-primary">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-app-surface rounded-pro shadow-lg border border-app-border p-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-light text-app-main tracking-tight mb-4">
              Welcome to ApparelDesk
            </h1>
            <p className="text-app-muted font-sans text-lg">
              Your apparel business management dashboard
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-pro text-sm mb-6">
              🎉 You have successfully signed in to your account!
            </div>

            <Button
              onClick={handleLogout}
              variant="outline"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
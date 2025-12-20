import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { tokenUtils } from '../utils/api';

const MyAccount = () => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem('user_data');
    if (storedUserData) {
      try {
        const user = JSON.parse(storedUserData);
        setUserData(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-app-primary">
      <Navigation />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-5xl font-light text-app-main tracking-tight mb-8 text-center">
            My Account
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2">
              <div className="bg-app-surface rounded-pro shadow-lg border border-app-border p-6">
                <h2 className="font-display text-2xl font-medium text-app-main mb-6">
                  Profile Information
                </h2>
                
                {userData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-sans font-medium text-app-main mb-1">
                          Name
                        </label>
                        <p className="text-app-muted font-sans">{userData.name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-sans font-medium text-app-main mb-1">
                          Email
                        </label>
                        <p className="text-app-muted font-sans">{userData.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-sans font-medium text-app-main mb-1">
                          Mobile
                        </label>
                        <p className="text-app-muted font-sans">{userData.mobile || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-sans font-medium text-app-main mb-1">
                          Role
                        </label>
                        <p className="text-app-muted font-sans capitalize">{userData.role}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-sans font-medium text-app-main mb-1">
                          City
                        </label>
                        <p className="text-app-muted font-sans">{userData.city || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-sans font-medium text-app-main mb-1">
                          State
                        </label>
                        <p className="text-app-muted font-sans">{userData.state || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-sans font-medium text-app-main mb-1">
                          Pincode
                        </label>
                        <p className="text-app-muted font-sans">{userData.pincode || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-sans font-medium text-app-main mb-1">
                          Member Since
                        </label>
                        <p className="text-app-muted font-sans">
                          {userData.created_at ? new Date(userData.created_at).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-app-muted font-sans">Loading profile information...</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <div className="bg-app-surface rounded-pro shadow-lg border border-app-border p-6">
                <h3 className="font-display text-xl font-medium text-app-main mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button className="w-full text-left px-4 py-3 rounded-pro border border-app-border hover:bg-app-secondary transition-colors duration-200">
                    <div className="font-sans font-medium text-app-main">Edit Profile</div>
                    <div className="text-sm text-app-muted">Update your information</div>
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-pro border border-app-border hover:bg-app-secondary transition-colors duration-200">
                    <div className="font-sans font-medium text-app-main">Order History</div>
                    <div className="text-sm text-app-muted">View past orders</div>
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-pro border border-app-border hover:bg-app-secondary transition-colors duration-200">
                    <div className="font-sans font-medium text-app-main">Change Password</div>
                    <div className="text-sm text-app-muted">Update your password</div>
                  </button>
                </div>
              </div>

              <div className="bg-app-surface rounded-pro shadow-lg border border-app-border p-6">
                <h3 className="font-display text-xl font-medium text-app-main mb-4">
                  Account Status
                </h3>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-sans text-sm text-app-main">Active Account</span>
                </div>
                <p className="text-sm text-app-muted font-sans">
                  Your account is in good standing
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyAccount;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { tokenUtils, userAPI } from '../utils/api';
import { useNotification } from '../context/NotificationContext';

const MyAccount = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useNotification();
  const [userData, setUserData] = useState(null);
  const [activeSection, setActiveSection] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      if (tokenUtils.isAuthenticated()) {
        const profile = await userAPI.getProfile();
        setUserData(profile);
        setEditForm(profile);
      } else {
        // Fallback to localStorage
        const storedUserData = localStorage.getItem('user_data');
        if (storedUserData) {
          const user = JSON.parse(storedUserData);
          setUserData(user);
          setEditForm(user);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showError('Could not load profile data. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form
      setEditForm(userData);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format phone number (numbers only, max 10 digits)
    if (name === 'mobile') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 10) return; // Limit to 10 digits
    }

    // Format pincode (numbers only, max 6 digits)
    if (name === 'pincode') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 6) return; // Limit to 6 digits
    }

    setEditForm(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const handleSaveProfile = async () => {
    try {
      // Basic validation
      if (!editForm.name?.trim()) {
        showError('Name is required');
        return;
      }

      // Phone validation (if provided)
      if (editForm.mobile && editForm.mobile.length !== 10) {
        showError('Phone number must be exactly 10 digits');
        return;
      }

      // Pincode validation (if provided)
      if (editForm.pincode && editForm.pincode.length !== 6) {
        showError('Pincode must be exactly 6 digits');
        return;
      }

      showInfo('Updating profile...');
      const updatedProfile = await userAPI.updateProfile(editForm);
      setUserData(updatedProfile);
      localStorage.setItem('user_data', JSON.stringify(updatedProfile));
      setIsEditing(false);
      showSuccess('Profile updated successfully! Your address will now auto-fill during checkout.');
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        showError(`Update failed: ${errorMessages.join(', ')}`);
      } else {
        showError('Could not update profile. Please try again.');
      }
    }
  };

  const renderSidebarItem = (key, icon, title, description) => (
    <button
      key={key}
      onClick={() => setActiveSection(key)}
      className={`w-full text-left p-4 rounded-pro border transition-all duration-200 ${
        activeSection === key
          ? 'border-app-accent bg-app-accent/10 text-app-accent'
          : 'border-app-border hover:bg-app-secondary text-app-main'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 flex items-center justify-center rounded ${
          activeSection === key ? 'text-app-accent' : 'text-app-muted'
        }`}>
          {icon}
        </div>
        <div>
          <div className="font-sans font-medium">{title}</div>
          <div className="text-sm text-app-muted">{description}</div>
        </div>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-app-primary">
      <Navigation />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-light text-app-main tracking-tight mb-2">
              My Account
            </h1>
            <p className="text-app-muted font-sans">
              Manage your profile, orders, and account settings
            </p>
          </div>

          {/* User Info Bar */}
          <div className="bg-app-surface rounded-pro border border-app-border p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-app-accent text-white rounded-full flex items-center justify-center font-mono font-medium">
                  {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h2 className="font-sans font-medium text-app-main">
                    {userData?.name || 'User'}
                  </h2>
                  <p className="text-sm text-app-muted">{userData?.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-app-muted">Member since</p>
                <p className="font-sans font-medium text-app-main">
                  {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="space-y-3">
                {renderSidebarItem(
                  'profile',
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>,
                  'User Profile',
                  'Edit your personal information'
                )}
                
                {renderSidebarItem(
                  'orders',
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>,
                  'Your Orders',
                  'View your order history'
                )}
                
                {renderSidebarItem(
                  'invoices',
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>,
                  'Your Invoices',
                  'Download and view invoices'
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="bg-app-surface rounded-pro border border-app-border p-8">
                  <div className="flex items-center justify-center">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 animate-spin text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-app-muted font-sans">Loading account information...</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* User Profile Section */}
                  {activeSection === 'profile' && (
                    <div className="bg-app-surface rounded-pro border border-app-border p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-display text-2xl font-medium text-app-main">
                          User Profile
                        </h3>
                        <button
                          onClick={isEditing ? handleSaveProfile : handleEditToggle}
                          className={`px-4 py-2 rounded-pro font-sans text-sm transition-colors duration-200 ${
                            isEditing
                              ? 'bg-app-accent text-white hover:bg-app-accent/90'
                              : 'border border-app-border text-app-main hover:bg-app-secondary'
                          }`}
                        >
                          {isEditing ? 'Save Changes' : 'Edit Profile'}
                        </button>
                      </div>

                      {isEditing && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-pro">
                          <p className="text-blue-800 font-sans text-sm">
                            You can edit your profile information below. Your address will automatically fill during checkout. Click "Save Changes" to update your details.
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-sans font-medium text-app-main mb-2">
                            Full Name
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="name"
                              value={editForm.name || ''}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                            />
                          ) : (
                            <p className="text-app-main font-sans py-2">{userData?.name || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-sans font-medium text-app-main mb-2">
                            Email Address
                          </label>
                          <p className="text-app-muted font-sans py-2">{userData?.email}</p>
                          <p className="text-xs text-app-muted">Email cannot be changed</p>
                        </div>

                        <div>
                          <label className="block text-sm font-sans font-medium text-app-main mb-2">
                            Phone Number
                          </label>
                          {isEditing ? (
                            <input
                              type="tel"
                              name="mobile"
                              value={editForm.mobile || ''}
                              onChange={handleInputChange}
                              placeholder="Enter 10-digit phone number"
                              className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                            />
                          ) : (
                            <p className="text-app-main font-sans py-2">{userData?.mobile || 'Not provided'}</p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-sans font-medium text-app-main mb-2">
                            Address
                          </label>
                          {isEditing ? (
                            <textarea
                              name="address"
                              value={editForm.address || ''}
                              onChange={handleInputChange}
                              rows="3"
                              placeholder="Enter your complete address"
                              className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                            />
                          ) : (
                            <p className="text-app-main font-sans py-2">{userData?.address || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-sans font-medium text-app-main mb-2">
                            City
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="city"
                              value={editForm.city || ''}
                              onChange={handleInputChange}
                              placeholder="Enter your city"
                              className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                            />
                          ) : (
                            <p className="text-app-main font-sans py-2">{userData?.city || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-sans font-medium text-app-main mb-2">
                            State
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="state"
                              value={editForm.state || ''}
                              onChange={handleInputChange}
                              placeholder="Enter your state"
                              className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                            />
                          ) : (
                            <p className="text-app-main font-sans py-2">{userData?.state || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-sans font-medium text-app-main mb-2">
                            Pincode
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="pincode"
                              value={editForm.pincode || ''}
                              onChange={handleInputChange}
                              placeholder="Enter 6-digit pincode"
                              maxLength="6"
                              className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                            />
                          ) : (
                            <p className="text-app-main font-sans py-2">{userData?.pincode || 'Not provided'}</p>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <div className="mt-6 flex space-x-3">
                          <button
                            onClick={handleSaveProfile}
                            className="px-6 py-2 bg-app-accent text-white rounded-pro font-sans text-sm hover:bg-app-accent/90 transition-colors duration-200"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={handleEditToggle}
                            className="px-6 py-2 border border-app-border text-app-main rounded-pro font-sans text-sm hover:bg-app-secondary transition-colors duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Orders Section */}
                  {activeSection === 'orders' && (
                    <div className="bg-app-surface rounded-pro border border-app-border p-6">
                      <h3 className="font-display text-2xl font-medium text-app-main mb-6">
                        Your Orders
                      </h3>
                      
                      <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-app-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <h4 className="font-display text-xl text-app-main mb-2">No Orders Yet</h4>
                        <p className="text-app-muted mb-4">You haven't placed any orders yet. Start shopping to see your order history here.</p>
                        <button
                          onClick={() => navigate('/shop')}
                          className="bg-app-accent text-white px-6 py-2 rounded-pro font-mono text-sm tracking-wider hover:bg-app-accent/90 transition-all duration-200"
                        >
                          Start Shopping
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Invoices Section */}
                  {activeSection === 'invoices' && (
                    <div className="bg-app-surface rounded-pro border border-app-border p-6">
                      <h3 className="font-display text-2xl font-medium text-app-main mb-6">
                        Your Invoices
                      </h3>
                      
                      <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-app-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h4 className="font-display text-xl text-app-main mb-2">No Invoices Available</h4>
                        <p className="text-app-muted mb-4">Your invoices will appear here after you complete your first order.</p>
                        <button
                          onClick={() => navigate('/shop')}
                          className="bg-app-accent text-white px-6 py-2 rounded-pro font-mono text-sm tracking-wider hover:bg-app-accent/90 transition-all duration-200"
                        >
                          Start Shopping
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyAccount;
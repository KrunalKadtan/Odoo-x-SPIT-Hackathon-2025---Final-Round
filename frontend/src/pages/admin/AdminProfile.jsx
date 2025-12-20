import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import FormInput from '../../components/FormInput';
import PasswordInput from '../../components/PasswordInput';
import Button from '../../components/Button';
import { userAPI, tokenUtils } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';

const AdminProfile = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [errors, setErrors] = useState({});

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load user profile on component mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const profile = await userAPI.getProfile();
      setProfileData({
        name: profile.name || '',
        email: profile.email || '',
        mobile: profile.mobile || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      showNotification('Failed to load profile data', 'error');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const updatedProfile = await userAPI.updateProfile(profileData);
      
      // Update stored user data
      const userData = tokenUtils.getUserData();
      if (userData) {
        const updatedUserData = { ...userData, ...updatedProfile };
        localStorage.setItem('user_data', JSON.stringify(updatedUserData));
      }
      
      showNotification('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        const formattedErrors = {};
        
        Object.keys(backendErrors).forEach(field => {
          if (Array.isArray(backendErrors[field])) {
            formattedErrors[field] = backendErrors[field][0];
          } else {
            formattedErrors[field] = backendErrors[field];
          }
        });
        
        setErrors(formattedErrors);
      } else {
        showNotification('Failed to update profile', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (passwordData.newPassword.length < 8) {
      setErrors({ newPassword: 'Password must be at least 8 characters long' });
      setIsLoading(false);
      return;
    }

    try {
      // Note: You'll need to implement password change endpoint in backend
      await userAPI.changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      showNotification('Password updated successfully', 'success');
    } catch (error) {
      console.error('Error updating password:', error);
      
      if (error.response?.status === 400) {
        setErrors({ currentPassword: 'Current password is incorrect' });
      } else {
        showNotification('Failed to update password', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div className="bg-app-surface rounded-pro border border-app-border p-8 shadow-sm text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-app-accent mx-auto"></div>
            <p className="text-app-muted font-sans mt-4">Loading profile...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-app-surface px-6 py-6 rounded-pro border border-app-border shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="bg-app-accent/10 p-3 rounded-pro">
              <svg className="w-6 h-6 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-app-main mb-2">My Profile</h1>
              <p className="text-app-muted font-sans">
                Manage your personal information and account settings
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-app-surface rounded-pro border border-app-border shadow-sm">
          <div className="border-b border-app-border">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 text-sm font-sans font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'profile'
                    ? 'border-app-accent text-app-accent'
                    : 'border-transparent text-app-muted hover:text-app-main'
                }`}
              >
                Personal Information
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`py-4 text-sm font-sans font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'password'
                    ? 'border-app-accent text-app-accent'
                    : 'border-transparent text-app-muted hover:text-app-main'
                }`}
              >
                Change Password
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    label="Full Name"
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    error={errors.name}
                    placeholder="Enter your full name"
                    required
                  />

                  <FormInput
                    label="Email Address"
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    error={errors.email}
                    placeholder="Enter your email"
                    disabled
                  />

                  <FormInput
                    label="Mobile Number"
                    type="tel"
                    name="mobile"
                    value={profileData.mobile}
                    onChange={handleProfileChange}
                    error={errors.mobile}
                    placeholder="Enter your mobile number"
                  />

                  <FormInput
                    label="Pincode"
                    type="text"
                    name="pincode"
                    value={profileData.pincode}
                    onChange={handleProfileChange}
                    error={errors.pincode}
                    placeholder="Enter pincode"
                  />

                  <FormInput
                    label="City"
                    type="text"
                    name="city"
                    value={profileData.city}
                    onChange={handleProfileChange}
                    error={errors.city}
                    placeholder="Enter your city"
                  />

                  <FormInput
                    label="State"
                    type="text"
                    name="state"
                    value={profileData.state}
                    onChange={handleProfileChange}
                    error={errors.state}
                    placeholder="Enter your state"
                  />
                </div>

                <div>
                  <label className="block text-sm font-sans font-medium text-app-main mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={profileData.address}
                    onChange={handleProfileChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent bg-app-surface text-app-main font-sans transition-all duration-200"
                    placeholder="Enter your complete address"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-app-border">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/products')}
                    className="px-6 py-3 border border-app-border text-app-main font-sans font-medium rounded-pro hover:bg-app-secondary transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
                <PasswordInput
                  label="Current Password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  error={errors.currentPassword}
                  placeholder="Enter current password"
                  required
                />

                <PasswordInput
                  label="New Password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  error={errors.newPassword}
                  placeholder="Enter new password"
                  required
                />

                <PasswordInput
                  label="Confirm New Password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  error={errors.confirmPassword}
                  placeholder="Confirm new password"
                  required
                />

                <div className="flex justify-end space-x-4 pt-6 border-t border-app-border">
                  <button
                    type="button"
                    onClick={() => setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                    className="px-6 py-3 border border-app-border text-app-main font-sans font-medium rounded-pro hover:bg-app-secondary transition-all duration-200"
                  >
                    Clear
                  </button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
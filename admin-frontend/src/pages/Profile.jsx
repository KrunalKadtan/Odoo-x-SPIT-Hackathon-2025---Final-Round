import React from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminTokenUtils } from '../utils/api';

const Profile = () => {
  const userData = adminTokenUtils.getUserData();

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="card px-6 py-6">
          <div className="flex items-start space-x-4">
            <div className="bg-app-accent/10 p-3 rounded-pro">
              <svg className="w-6 h-6 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-app-main mb-2">My Profile</h1>
              <p className="text-app-muted font-sans">
                View and manage your admin account information
              </p>
            </div>
          </div>
        </div>

        <div className="card p-8">
          <div className="space-y-6">
            <div>
              <label className="form-label">Name</label>
              <p className="text-app-main font-sans">{userData?.name || 'Admin User'}</p>
            </div>

            <div>
              <label className="form-label">Email</label>
              <p className="text-app-main font-sans">{userData?.email || 'Not available'}</p>
            </div>

            <div>
              <label className="form-label">Role</label>
              <p className="text-app-main font-sans capitalize">{userData?.role || 'Internal'}</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Profile;
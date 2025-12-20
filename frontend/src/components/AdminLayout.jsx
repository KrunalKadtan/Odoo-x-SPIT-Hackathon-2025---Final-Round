import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { tokenUtils } from '../utils/api';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef(null);

  const handleSignOut = () => {
    tokenUtils.clearTokens();
    navigate('/signin');
  };

  const userData = tokenUtils.getUserData();
  const userName = userData?.name || 'Admin User';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems = [
    { path: '/admin/products', label: 'Products' },
    { path: '/admin/billing', label: 'Billing & Payments' },
    { path: '/admin/terms', label: 'Terms & Offers' },
    { path: '/admin/users', label: 'Users & contacts' },
    { path: '/admin/reports', label: 'Reports' },
  ];

  return (
    <div className="min-h-screen bg-app-primary">
      {/* Header - Matching customer navigation style */}
      <nav className="bg-app-surface border-b border-app-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link to="/admin" className="flex items-center">
                  <div className="bg-app-accent text-white px-4 py-2 rounded-pro font-mono text-lg tracking-wider">
                    APPARELDESK
                  </div>
                  <span className="ml-3 text-app-main font-sans font-medium text-sm">
                    Admin Panel
                  </span>
                </Link>
              </div>
            </div>

            {/* Right side - User Menu */}
            <div className="flex items-center">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-app-main hover:text-app-accent font-sans font-medium transition-colors duration-200"
                >
                  <span>{userName}</span>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-app-surface rounded-pro shadow-lg border border-app-border z-50">
                    <div className="py-1">
                      <Link
                        to="/admin/profile"
                        className="block px-4 py-2 text-sm text-app-main hover:bg-app-secondary transition-colors duration-200"
                        onClick={() => setShowUserMenu(false)}
                      >
                        My Profile
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-app-main hover:bg-app-secondary transition-colors duration-200"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t border-app-border">
            <div className="flex space-x-8 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 text-sm font-sans font-medium rounded-pro transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-app-accent text-white shadow-sm'
                      : 'text-app-main hover:text-app-accent hover:bg-app-secondary'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
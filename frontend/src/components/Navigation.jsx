import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tokenUtils } from '../utils/api';
import { useCart } from '../context/CartContext';

const Navigation = () => {
  const navigate = useNavigate();
  const { getCartItemsCount } = useCart();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const authenticated = tokenUtils.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        // Get user data from localStorage (stored during signup/signin)
        const userData = localStorage.getItem('user_data');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            setUserName(user.name || user.email);
          } catch (error) {
            console.error('Error parsing user data:', error);
            setUserName('User');
          }
        } else {
          setUserName('User');
        }
      }
    };

    checkAuth();
    
    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = () => {
    tokenUtils.clearTokens();
    localStorage.removeItem('user_data');
    setIsAuthenticated(false);
    setUserName('');
    setShowDropdown(false);
    navigate('/');
  };

  const handleSignIn = () => {
    navigate('/signin');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <nav className="bg-app-surface border-b border-app-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            {/* Company Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <div className="bg-app-accent text-white px-4 py-2 rounded-pro font-mono text-lg tracking-wider">
                  APPARELDESK
                </div>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link
                  to="/"
                  className="text-app-main hover:text-app-accent font-sans font-medium transition-colors duration-200"
                >
                  Home
                </Link>
                <Link
                  to="/shop"
                  className="text-app-main hover:text-app-accent font-sans font-medium transition-colors duration-200"
                >
                  Shop
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/my-account"
                    className="text-app-main hover:text-app-accent font-sans font-medium transition-colors duration-200"
                  >
                    My Account
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Cart and User */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon */}
            <button 
              onClick={() => navigate('/cart')}
              className="relative text-app-main hover:text-app-accent transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9m-9 0V19a2 2 0 002 2h9a2 2 0 002-2v-6" />
              </svg>
              {/* Cart Count Badge */}
              {getCartItemsCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-app-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-mono">
                  {getCartItemsCount()}
                </span>
              )}
            </button>

            {/* User Authentication */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="flex items-center space-x-2 text-app-main hover:text-app-accent font-sans font-medium transition-colors duration-200"
                >
                  <span>{userName}</span>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-app-surface rounded-pro shadow-lg border border-app-border z-50">
                    <div className="py-1">
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
            ) : (
              <button
                onClick={handleSignIn}
                className="bg-app-accent text-white px-4 py-2 rounded-pro font-mono text-sm tracking-wider hover:bg-app-accent/90 transition-all duration-200"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-app-main hover:text-app-accent">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
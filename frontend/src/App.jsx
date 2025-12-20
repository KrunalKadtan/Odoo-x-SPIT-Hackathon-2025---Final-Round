import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { tokenUtils } from './utils/api';
import { setupLazyLoading, setupScrollAnimations, measurePerformance } from './utils/lazyLoading';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderError from './pages/OrderError';
import MyAccount from './pages/MyAccount';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  return tokenUtils.isAuthenticated() ? children : <Navigate to="/signin" />;
};

// Public Route component (redirect to home if already authenticated)
const PublicRoute = ({ children }) => {
  return tokenUtils.isAuthenticated() ? <Navigate to="/" /> : children;
};

function App() {
  useEffect(() => {
    // Setup performance optimizations
    setupLazyLoading();
    setupScrollAnimations();
    measurePerformance();
  }, []);

  return (
    <NotificationProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:category" element={<Shop />} />
            <Route path="/product/:category/:productId" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/order-error" element={<OrderError />} />
            
            <Route 
              path="/signin" 
              element={
                <PublicRoute>
                  <SignIn />
                </PublicRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <PublicRoute>
                  <SignUp />
                </PublicRoute>
              } 
            />
            <Route 
              path="/forgot-password" 
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              } 
            />
            
            {/* Protected routes */}
            <Route 
              path="/my-account" 
              element={
                <ProtectedRoute>
                  <MyAccount />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all route */}
            <Route 
              path="*" 
              element={<Navigate to="/" />} 
            />
          </Routes>
        </Router>
      </CartProvider>
    </NotificationProvider>
  );
}

export default App;

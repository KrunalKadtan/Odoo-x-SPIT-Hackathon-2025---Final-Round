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
import Payment from './pages/Payment';
import AdminProducts from './pages/admin/AdminProducts';
import AdminBilling from './pages/admin/AdminBilling';
import AdminTerms from './pages/admin/AdminTerms';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import AdminProfile from './pages/admin/AdminProfile';
import AdminSignIn from './pages/AdminSignIn';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  return tokenUtils.isAuthenticated() ? children : <Navigate to="/signin" />;
};

// Admin Route component (only for internal users)
const AdminRoute = ({ children }) => {
  if (!tokenUtils.isAuthenticated()) {
    return <Navigate to="/signin" />;
  }
  
  const userRole = tokenUtils.getUserRole();
  if (userRole !== 'internal') {
    return <Navigate to="/" />;
  }
  
  return children;
};

// Public Route component (redirect based on role if already authenticated)
const PublicRoute = ({ children }) => {
  if (!tokenUtils.isAuthenticated()) {
    return children;
  }
  
  const userRole = tokenUtils.getUserRole();
  if (userRole === 'internal') {
    return <Navigate to="/admin/products" />;
  }
  
  return <Navigate to="/" />;
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
            
            <Route 
              path="/admin/signin" 
              element={
                <PublicRoute>
                  <AdminSignIn />
                </PublicRoute>
              } 
            />
            
            {/* Protected routes for portal users */}
            <Route 
              path="/payment" 
              element={
                <ProtectedRoute>
                  <Payment />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-account" 
              element={
                <ProtectedRoute>
                  <MyAccount />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin routes for internal users */}
            <Route 
              path="/admin" 
              element={<Navigate to="/admin/products" />} 
            />
            <Route 
              path="/admin/products" 
              element={
                <AdminRoute>
                  <AdminProducts />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/profile" 
              element={
                <AdminRoute>
                  <AdminProfile />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/billing" 
              element={
                <AdminRoute>
                  <AdminBilling />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/terms" 
              element={
                <AdminRoute>
                  <AdminTerms />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/reports" 
              element={
                <AdminRoute>
                  <AdminReports />
                </AdminRoute>
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

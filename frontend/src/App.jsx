import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { tokenUtils, returnUrlUtils } from './utils/api';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import MaintenanceWrapper from './components/MaintenanceWrapper';

// Lazy load components for performance optimization
const SignUp = React.lazy(() => import('./pages/SignUp'));
const SignIn = React.lazy(() => import('./pages/SignIn'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const Home = React.lazy(() => import('./pages/Home'));
const Shop = React.lazy(() => import('./pages/Shop'));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'));
const Cart = React.lazy(() => import('./pages/Cart'));
const MyAccount = React.lazy(() => import('./pages/MyAccount'));
const Payment = React.lazy(() => import('./pages/Payment'));
const OrderConfirmation = React.lazy(() => import('./pages/OrderConfirmation'));
const OrderError = React.lazy(() => import('./pages/OrderError'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const TestPage = React.lazy(() => import('./TestPage'));

// Admin components
const AdminRoute = React.lazy(() => import('./components/AdminRoute'));
const AdminLayout = React.lazy(() => import('./components/AdminLayout'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = React.lazy(() => import('./pages/admin/UserManagement'));
const VendorManagement = React.lazy(() => import('./pages/admin/VendorManagement'));
const ProductModeration = React.lazy(() => import('./pages/admin/ProductModeration'));
const OrderManagement = React.lazy(() => import('./pages/admin/OrderManagement'));
const Analytics = React.lazy(() => import('./pages/admin/Analytics'));
const SystemSettings = React.lazy(() => import('./pages/admin/SystemSettings'));
const AuditLogs = React.lazy(() => import('./pages/admin/AuditLogs'));
const SecurityMonitoring = React.lazy(() => import('./pages/admin/SecurityMonitoring'));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  
  if (!tokenUtils.isAuthenticated()) {
    // Capture return URL for post-login redirect
    const currentPath = location.pathname + location.search;
    if (currentPath !== '/signin' && currentPath !== '/signup') {
      returnUrlUtils.captureReturnUrl();
    }
    return <Navigate to="/signin" />;
  }
  
  return children;
};

// Public Route component (redirect to home if already authenticated)
// Enhanced to capture intended destinations for return URL functionality
const PublicRoute = ({ children }) => {
  const location = useLocation();
  
  if (tokenUtils.isAuthenticated()) {
    // User is already authenticated, redirect to home
    return <Navigate to="/" />;
  }
  
  // Check if there's a return URL in the query parameters
  const searchParams = new URLSearchParams(location.search);
  const returnUrl = searchParams.get('returnUrl') || searchParams.get('return') || searchParams.get('redirect');
  
  if (returnUrl) {
    // Validate and store the return URL for use after login
    if (returnUrlUtils.validateReturnUrl(returnUrl)) {
      localStorage.setItem('pending_return_url', returnUrl);
      console.log('PublicRoute: Captured return URL from query parameters:', returnUrl);
    } else {
      console.warn('PublicRoute: Invalid return URL detected and ignored:', returnUrl);
    }
  }
  
  return children;
};

// Catch-all route component with enhanced return URL handling
const CatchAllRoute = () => {
  const location = useLocation();
  
  if (tokenUtils.isAuthenticated()) {
    // User is authenticated but accessing unknown route, redirect to home
    return <Navigate to="/" />;
  } else {
    // User is not authenticated, capture current path as return URL and redirect to signin
    const currentPath = location.pathname + location.search;
    
    // Only capture return URL if it's not a signin/signup page
    if (currentPath !== '/signin' && currentPath !== '/signup' && currentPath !== '/forgot-password') {
      // Validate the URL before storing
      if (returnUrlUtils.validateReturnUrl(currentPath)) {
        localStorage.setItem('pending_return_url', currentPath);
        console.log('CatchAllRoute: Captured return URL for unknown route:', currentPath);
        
        // Redirect to signin with return URL parameter
        const encodedReturnUrl = encodeURIComponent(currentPath);
        return <Navigate to={`/signin?returnUrl=${encodedReturnUrl}`} />;
      } else {
        console.warn('CatchAllRoute: Invalid return URL, redirecting to signin without return URL:', currentPath);
      }
    }
    
    // Default redirect to signin
    return <Navigate to="/signin" />;
  }
};

function App() {
  return (
    <Router>
      <NotificationProvider>
        <CartProvider>
          <MaintenanceWrapper>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
              {/* Test route */}
              <Route path="/test" element={<TestPage />} />
              
              {/* Public routes */}
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
                path="/" 
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/shop" 
                element={
                  <ProtectedRoute>
                    <Shop />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/shop/:category" 
                element={
                  <ProtectedRoute>
                    <Shop />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/product/:category/:productId" 
                element={
                  <ProtectedRoute>
                    <ProductDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/product/:id" 
                element={
                  <ProtectedRoute>
                    <ProductDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/cart" 
                element={
                  <ProtectedRoute>
                    <Cart />
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
              <Route 
                path="/my-account/:section" 
                element={
                  <ProtectedRoute>
                    <MyAccount />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/payment" 
                element={
                  <ProtectedRoute>
                    <Payment />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/order-confirmation" 
                element={
                  <ProtectedRoute>
                    <OrderConfirmation />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/order-confirmation/:orderId" 
                element={
                  <ProtectedRoute>
                    <OrderConfirmation />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/order-error" 
                element={
                  <ProtectedRoute>
                    <OrderError />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/order/:id" 
                element={
                  <ProtectedRoute>
                    <MyAccount />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/invoice/:id" 
                element={
                  <ProtectedRoute>
                    <MyAccount />
                  </ProtectedRoute>
                } 
              />
              
              {/* Legacy dashboard route - redirect to home */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin routes */}
              <Route 
                path="/admin/*" 
                element={
                  <AdminRoute>
                    <AdminLayout>
                      <Routes>
                        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="/dashboard" element={<AdminDashboard />} />
                        <Route path="/users" element={<UserManagement />} />
                        <Route path="/vendors" element={<VendorManagement />} />
                        <Route path="/products" element={<ProductModeration />} />
                        <Route path="/orders" element={<OrderManagement />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/settings" element={<SystemSettings />} />
                        <Route path="/audit" element={<AuditLogs />} />
                        <Route path="/security" element={<SecurityMonitoring />} />
                        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                      </Routes>
                    </AdminLayout>
                  </AdminRoute>
                } 
              />
              
              {/* Catch all route - redirect to appropriate page with return URL handling */}
              <Route 
                path="*" 
                element={
                  <CatchAllRoute />
                } 
              />
            </Routes>
          </Suspense>
        </MaintenanceWrapper>
      </CartProvider>
    </NotificationProvider>
  </Router>
);
}

export default App;

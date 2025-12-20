import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { adminTokenUtils } from './utils/api';

// Pages
import SignIn from './pages/SignIn';
import Products from './pages/Products';
import Billing from './pages/Billing';
import Terms from './pages/Terms';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Profile from './pages/Profile';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = adminTokenUtils.isAuthenticated();
  const userRole = adminTokenUtils.getUserRole();
  
  if (!isAuthenticated || userRole !== 'internal') {
    return <Navigate to="/signin" replace />;
  }
  
  return children;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children }) => {
  const isAuthenticated = adminTokenUtils.isAuthenticated();
  const userRole = adminTokenUtils.getUserRole();
  
  if (isAuthenticated && userRole === 'internal') {
    return <Navigate to="/products" replace />;
  }
  
  return children;
};

function App() {
  return (
    <NotificationProvider>
      <Router>
        <div className="min-h-screen bg-app-primary">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/signin" 
              element={
                <PublicRoute>
                  <SignIn />
                </PublicRoute>
              } 
            />
            
            {/* Protected Routes */}
            <Route 
              path="/products" 
              element={
                <ProtectedRoute>
                  <Products />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/billing" 
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/terms" 
              element={
                <ProtectedRoute>
                  <Terms />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/products" replace />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/products" replace />} />
          </Routes>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;
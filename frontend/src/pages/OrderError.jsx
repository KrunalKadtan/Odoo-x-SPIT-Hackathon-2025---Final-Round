import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';

const OrderError = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [errorData, setErrorData] = useState(null);

  useEffect(() => {
    // Get error data from navigation state
    if (location.state && location.state.errorData) {
      setErrorData(location.state.errorData);
    } else {
      // Check URL params for error type
      const urlParams = new URLSearchParams(window.location.search);
      const errorType = urlParams.get('type');
      const errorMessage = urlParams.get('message');
      
      if (errorType) {
        setErrorData({
          type: errorType,
          message: errorMessage || 'An error occurred while processing your request.',
          details: 'URL_PARAMS_ERROR'
        });
      } else {
        // If no error data, redirect to cart
        navigate('/cart');
      }
    }
  }, [location.state, navigate]);

  const getErrorMessage = () => {
    if (!errorData) return 'An unknown error occurred';
    
    switch (errorData.type) {
      case 'payment_failed':
        return 'Payment processing failed. Please check your payment details and try again.';
      case 'network_error':
        return 'Network connection error. Please check your internet connection and try again.';
      case 'server_error':
        return 'Server error occurred. Please try again in a few minutes.';
      case 'validation_error':
        return 'Order validation failed. Please review your order details and try again.';
      case 'inventory_error':
        return 'Some items in your cart are no longer available. Please update your cart and try again.';
      default:
        return errorData.message || 'An unexpected error occurred while processing your order.';
    }
  };

  const getErrorIcon = () => {
    if (!errorData) return null;
    
    switch (errorData.type) {
      case 'payment_failed':
        return (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'network_error':
        return (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        );
      case 'inventory_error':
        return (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
    }
  };

  const getSuggestedActions = () => {
    if (!errorData) return [];
    
    switch (errorData.type) {
      case 'payment_failed':
        return [
          'Check your card details and try again',
          'Try a different payment method',
          'Contact your bank if the issue persists',
          'Use UPI or Cash on Delivery as alternative'
        ];
      case 'network_error':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Switch to a different network if available',
          'Try again in a few minutes'
        ];
      case 'server_error':
        return [
          'Wait a few minutes and try again',
          'Clear your browser cache',
          'Try using a different browser',
          'Contact support if the issue persists'
        ];
      case 'inventory_error':
        return [
          'Remove unavailable items from cart',
          'Update quantities for limited stock items',
          'Check for similar products',
          'Try again later as stock may be replenished'
        ];
      default:
        return [
          'Try placing the order again',
          'Check your internet connection',
          'Clear browser cache and cookies',
          'Contact customer support for assistance'
        ];
    }
  };

  if (!errorData) {
    return (
      <div className="min-h-screen bg-app-primary">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-app-muted mb-4">
              <svg className="w-8 h-8 mx-auto animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-app-muted">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-primary">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {getErrorIcon()}
          </div>
          <h1 className="font-display text-3xl font-light text-app-main mb-2">
            Order Failed
          </h1>
          <p className="text-app-muted font-sans">
            We couldn't process your order
          </p>
        </div>

        {/* Error Details */}
        <div className="bg-red-50 border border-red-200 rounded-pro p-6 mb-8">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-red-800 font-sans font-medium mb-2">
                What went wrong?
              </h3>
              <p className="text-red-700 font-sans">
                {getErrorMessage()}
              </p>
              {errorData.details && (
                <p className="text-red-600 font-sans text-sm mt-2">
                  Error Code: {errorData.details}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Suggested Actions */}
        <div className="bg-app-surface rounded-pro border border-app-border p-6 mb-8">
          <h3 className="font-display text-xl font-medium text-app-main mb-4">
            What can you do?
          </h3>
          <ul className="space-y-2">
            {getSuggestedActions().map((action, index) => (
              <li key={index} className="flex items-start">
                <svg className="w-4 h-4 text-app-accent mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-app-main font-sans text-sm">{action}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Order Summary (if available) */}
        {errorData.orderSummary && (
          <div className="bg-app-surface rounded-pro border border-app-border p-6 mb-8">
            <h3 className="font-display text-xl font-medium text-app-main mb-4">
              Your Order Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-app-muted">Items:</span>
                <span className="text-app-main">{errorData.orderSummary.itemCount} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-app-muted">Total Amount:</span>
                <span className="text-app-main font-mono">₹{errorData.orderSummary.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-app-muted">Payment Method:</span>
                <span className="text-app-main capitalize">{errorData.orderSummary.paymentMethod}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/cart')}
            className="w-full bg-app-accent text-white py-3 rounded-pro font-mono text-sm tracking-widest uppercase hover:bg-app-accent/90 transition-all duration-200"
          >
            Return to Cart
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/shop')}
              className="border border-app-border text-app-main py-3 rounded-pro font-sans text-sm hover:bg-app-secondary transition-all duration-200"
            >
              Continue Shopping
            </button>
            
            <button
              onClick={() => window.location.href = 'mailto:support@appareldesk.com?subject=Order Failed - Need Help'}
              className="border border-app-border text-app-main py-3 rounded-pro font-sans text-sm hover:bg-app-secondary transition-all duration-200"
            >
              Contact Support
            </button>
          </div>
        </div>

        {/* Support Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-pro p-4 mt-8">
          <h4 className="font-sans font-medium text-blue-800 mb-2">
            Still Need Help?
          </h4>
          <p className="text-blue-700 font-sans text-sm mb-2">
            Our customer support team is here to help you complete your order.
          </p>
          <div className="text-blue-700 font-sans text-sm space-y-1">
            <p>📧 Email: support@appareldesk.com</p>
            <p>📞 Phone: +91 98765 43210</p>
            <p>🕒 Hours: Mon-Sat 9AM-8PM IST</p>
          </div>
        </div>

        {/* Retry Information */}
        <div className="text-center mt-8">
          <p className="text-app-muted font-sans text-sm">
            Your cart items are still saved. You can try placing the order again anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderError;
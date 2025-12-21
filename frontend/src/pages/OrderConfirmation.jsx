import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { order, address, paymentMethod, paymentSuccess, paymentId } = location.state || {};

  useEffect(() => {
    // Redirect if no order data
    if (!order) {
      // Try to get order data from URL params if available
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get('orderId');
      
      if (orderId) {
        // Could fetch order data here if needed
        console.log('Order ID from URL:', orderId);
      } else {
        // No order data available, redirect to cart
        navigate('/cart');
      }
    }
  }, [order, navigate]);

  const handlePrint = () => {
    window.print();
  };

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-app-primary">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-4xl font-light text-app-main tracking-tight mb-2">
            Thank you for your order.
          </h1>
          <p className="text-app-muted font-sans">
            Order S{String(order.id).padStart(4, '0')}
          </p>
        </div>

        {/* Order Status */}
        <div className={`border rounded-pro p-4 mb-8 text-center ${
          paymentMethod === 'razorpay' && paymentSuccess 
            ? 'bg-green-50 border-green-200' 
            : paymentMethod === 'cod' 
            ? 'bg-blue-50 border-blue-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <p className={`font-sans ${
            paymentMethod === 'razorpay' && paymentSuccess 
              ? 'text-green-800' 
              : paymentMethod === 'cod' 
              ? 'text-blue-800'
              : 'text-green-800'
          }`}>
            {paymentMethod === 'razorpay' && paymentSuccess 
              ? 'Your payment has been processed successfully.' 
              : paymentMethod === 'cod' 
              ? 'Your order has been confirmed. Pay cash on delivery.'
              : 'Your order has been confirmed.'}
          </p>
          {paymentId && (
            <p className="text-sm text-app-muted mt-1">
              Payment ID: {paymentId}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="bg-app-surface rounded-pro border border-app-border p-6">
            <h3 className="font-display text-xl font-medium text-app-main mb-6">
              Order Details
            </h3>
            
            <div className="space-y-4">
              {order.lines?.map((line, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-app-secondary rounded border border-app-border flex items-center justify-center">
                    <span className="text-app-accent font-mono text-sm">{line.quantity}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-sans font-medium text-app-main">
                      {line.product?.product_name || 'Product'}
                    </h4>
                    <p className="text-sm text-app-muted">
                      ₹{line.unit_price} each
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium text-app-accent">
                      ₹{line.line_total}
                    </p>
                  </div>
                </div>
              ))}
              
              {order.discount_amount > 0 && (
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded border border-green-200 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-sans font-medium text-app-main">
                      10% on your order
                    </h4>
                    <p className="text-sm text-app-muted">
                      Code: DISCOUNT10
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium text-green-600">
                      -₹{order.discount_amount}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <hr className="border-app-border my-6" />
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-sans font-medium text-app-main">Subtotal:</span>
                <span className="font-mono text-app-main">₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-app-main">Taxes:</span>
                <span className="font-mono text-app-main">₹{Math.round(order.total_amount * 0.1)}</span>
              </div>
              <hr className="border-app-border" />
              <div className="flex justify-between font-medium text-lg">
                <span className="font-sans text-app-main">Total:</span>
                <span className="font-mono text-app-accent">₹{Math.round(order.total_amount * 1.1)}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Payment Info */}
          <div className="space-y-6">
            {/* Delivery Address */}
            <div className="bg-app-surface rounded-pro border border-app-border p-6">
              <h3 className="font-display text-xl font-medium text-app-main mb-4">
                Delivery Address
              </h3>
              <div className="text-app-main font-sans space-y-1">
                <p className="font-medium">{address?.name}</p>
                <p>{address?.address}</p>
                <p>{address?.city} - {address?.pincode}</p>
                <p>{address?.state}</p>
                <p>{address?.phone}</p>
                {address?.email && <p>{address.email}</p>}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-app-surface rounded-pro border border-app-border p-6">
              <h3 className="font-display text-xl font-medium text-app-main mb-4">
                Payment Method
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {paymentMethod === 'razorpay' ? (
                    <>
                      <svg className="w-5 h-5 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span className="font-sans text-app-main">Razorpay</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="font-sans text-app-main">Cash on Delivery</span>
                    </>
                  )}
                </div>
                {paymentMethod === 'razorpay' && paymentSuccess && (
                  <div className="text-sm text-green-600 font-sans">
                    ✓ Payment completed successfully
                  </div>
                )}
                {paymentMethod === 'cod' && (
                  <div className="text-sm text-blue-600 font-sans">
                    Pay ₹{Math.round(order.total_amount * 1.1)} when delivered
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handlePrint}
                className="w-full py-3 bg-app-accent text-white rounded-pro font-mono text-sm tracking-wider hover:bg-app-accent/90 transition-colors"
              >
                Print
              </button>
              <button
                onClick={() => navigate('/my-account', { state: { activeSection: 'orders' } })}
                className="w-full py-3 border border-app-border text-app-main rounded-pro font-sans text-sm hover:bg-app-secondary transition-colors"
              >
                View Orders
              </button>
              <button
                onClick={() => navigate('/shop')}
                className="w-full py-3 border border-app-border text-app-main rounded-pro font-sans text-sm hover:bg-app-secondary transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
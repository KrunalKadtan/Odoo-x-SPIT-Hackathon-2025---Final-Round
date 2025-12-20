import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useCart } from '../context/CartContext';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [orderData, setOrderData] = useState(null);
  const cartClearedRef = useRef(false);

  useEffect(() => {
    // Get order data from navigation state
    if (location.state && location.state.orderData) {
      setOrderData(location.state.orderData);
      
      // Clear the cart after successful order (only once)
      if (!cartClearedRef.current) {
        clearCart();
        cartClearedRef.current = true;
      }
    } else {
      // If no order data, redirect to cart
      navigate('/cart');
    }
  }, [location.state, navigate]); // Removed clearCart and cartCleared from dependencies

  const handlePrint = () => {
    window.print();
  };

  if (!orderData) {
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
            <p className="text-app-muted">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-primary">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-light text-app-main mb-2">
            Thank you for your order!
          </h1>
          <p className="text-app-muted font-sans">
            Order #{orderData.orderNumber || `S${Date.now().toString().slice(-6)}`}
          </p>
        </div>

        {/* Payment Status */}
        <div className="bg-green-50 border border-green-200 rounded-pro p-4 mb-8">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-800 font-sans font-medium">
              Your payment has been processed.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Order Details */}
          <div className="space-y-6">
            {/* Delivery Address */}
            <div className="bg-app-surface rounded-pro border border-app-border p-6">
              <h3 className="font-display text-xl font-medium text-app-main mb-4">
                Delivery Address
              </h3>
              <div className="text-app-main font-sans space-y-1">
                <p className="font-medium">{orderData.address.fullName}</p>
                <p>{orderData.address.address}</p>
                <p>{orderData.address.city}, {orderData.address.state} {orderData.address.pincode}</p>
                <p>{orderData.address.country}</p>
                <p className="text-app-muted mt-2">
                  Phone: {orderData.address.phone}
                </p>
                <p className="text-app-muted">
                  Email: {orderData.address.email}
                </p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-app-surface rounded-pro border border-app-border p-6">
              <h3 className="font-display text-xl font-medium text-app-main mb-4">
                Payment Method
              </h3>
              <div className="text-app-main font-sans">
                {orderData.payment.method === 'card' && (
                  <div>
                    <p className="font-medium">Credit/Debit Card</p>
                    <p className="text-app-muted">**** **** **** {orderData.payment.details.cardNumber}</p>
                    <p className="text-app-muted">{orderData.payment.details.cardName}</p>
                  </div>
                )}
                {orderData.payment.method === 'upi' && (
                  <div>
                    <p className="font-medium">UPI Payment</p>
                    <p className="text-app-muted">{orderData.payment.details.upiId}</p>
                  </div>
                )}
                {orderData.payment.method === 'cod' && (
                  <div>
                    <p className="font-medium">Cash on Delivery</p>
                    <p className="text-app-muted">Pay ₹{orderData.totals.total} when delivered</p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-app-surface rounded-pro border border-app-border p-6">
              <h3 className="font-display text-xl font-medium text-app-main mb-4">
                Delivery Information
              </h3>
              <div className="text-app-main font-sans space-y-2">
                <div className="flex justify-between">
                  <span>Estimated Delivery:</span>
                  <span className="font-medium">2-3 Business Days</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span className="font-medium">
                    {orderData.totals.total >= 999 ? 'Free' : '₹50'}
                  </span>
                </div>
                <p className="text-app-muted text-sm mt-3">
                  You will receive a tracking number via email once your order is shipped.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Order Summary */}
          <div className="space-y-6">
            {/* Order Items */}
            <div className="bg-app-surface rounded-pro border border-app-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl font-medium text-app-main">
                  Order Summary
                </h3>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 border border-app-border text-app-main rounded-pro font-sans text-sm hover:bg-app-secondary transition-colors duration-200"
                >
                  Print
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-4 mb-6">
                {orderData.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-app-secondary border border-app-border rounded-pro flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-pro" />
                      ) : (
                        <div className="text-center">
                          <div className="text-xs text-app-muted font-mono">{item.category}</div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-sans font-medium text-app-main text-sm">{item.name}</h4>
                      <div className="text-xs text-app-muted space-y-1">
                        {item.color && <p>Color: {item.color}</p>}
                        {item.size && <p>Size: {item.size}</p>}
                        <p>Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium text-app-accent text-sm">
                        ₹{item.price * item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Totals */}
              <div className="border-t border-app-border pt-4 space-y-2">
                <div className="flex justify-between text-app-main font-sans">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{orderData.totals.subtotal}</span>
                </div>
                
                {orderData.appliedDiscount && (
                  <div className="flex justify-between text-green-600 font-sans">
                    <span>Discount ({orderData.appliedDiscount.description})</span>
                    <span className="font-mono">-₹{Math.round(orderData.totals.discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-app-main font-sans">
                  <span>Taxes (GST)</span>
                  <span className="font-mono">₹{orderData.totals.taxes}</span>
                </div>
                
                <hr className="border-app-border" />
                
                <div className="flex justify-between font-medium text-lg">
                  <span className="text-app-main font-sans">Total</span>
                  <span className="text-app-accent font-mono">₹{orderData.totals.total}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/shop')}
                className="w-full bg-app-accent text-white py-3 rounded-pro font-mono text-sm tracking-widest uppercase hover:bg-app-accent/90 transition-all duration-200"
              >
                Continue Shopping
              </button>
              
              <button
                onClick={() => navigate('/my-account')}
                className="w-full border border-app-border text-app-main py-3 rounded-pro font-sans text-sm hover:bg-app-secondary transition-all duration-200"
              >
                View Order History
              </button>
            </div>

            {/* Support Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-pro p-4">
              <h4 className="font-sans font-medium text-blue-800 mb-2">
                Need Help?
              </h4>
              <p className="text-blue-700 font-sans text-sm mb-2">
                If you have any questions about your order, please contact our support team.
              </p>
              <p className="text-blue-700 font-sans text-sm">
                Email: support@appareldesk.com | Phone: +91 98765 43210
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
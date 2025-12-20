import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { tokenUtils, userAPI, ordersAPI, paymentsAPI } from '../utils/api';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, loading, updateQuantity, removeFromCart, clearCart, loadCart } = useCart();
  const { showSuccess, showError, showInfo } = useNotification();
  
  const [currentStep, setCurrentStep] = useState('order'); // order, address, payment
  const [addressForm, setAddressForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!tokenUtils.isAuthenticated()) {
      navigate('/signin');
      return;
    }
    loadCart();
    loadUserAddress();
  }, []);

  const loadUserAddress = async () => {
    try {
      const profile = await userAPI.getProfile();
      setAddressForm({
        name: profile.name || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || '',
        phone: profile.mobile || '',
        email: profile.email || ''
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleQuantityUpdate = async (itemId, newQuantity) => {
    try {
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await removeFromCart(itemId);
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      showSuccess('Cart cleared successfully');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to clear cart');
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateAddress = () => {
    const required = ['name', 'address', 'city', 'state', 'pincode', 'phone'];
    const missing = required.filter(field => !addressForm[field].trim());
    
    if (missing.length > 0) {
      showError(`Please fill in: ${missing.join(', ')}`);
      return false;
    }
    
    if (addressForm.pincode.length !== 6) {
      showError('Please enter a valid 6-digit pincode');
      return false;
    }
    
    if (addressForm.phone.length !== 10) {
      showError('Please enter a valid 10-digit phone number');
      return false;
    }
    
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 'order') {
      setCurrentStep('address');
    } else if (currentStep === 'address') {
      if (validateAddress()) {
        setCurrentStep('payment');
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'payment') {
      setCurrentStep('address');
    } else if (currentStep === 'address') {
      setCurrentStep('order');
    }
  };

  const handleConfirmOrder = async () => {
    if (!validateAddress()) return;
    
    setIsProcessing(true);
    try {
      showInfo('Creating your order...');
      
      // Create the order first
      const response = await ordersAPI.checkout();
      
      if (paymentMethod === 'cod') {
        // For Cash on Delivery, just show success and navigate
        showSuccess('Order created successfully! You will pay cash on delivery.');
        
        navigate('/order-confirmation', {
          state: {
            order: response.order,
            address: addressForm,
            paymentMethod: paymentMethod
          }
        });
      } else if (paymentMethod === 'razorpay') {
        // For Razorpay, initiate payment process
        showInfo('Redirecting to payment gateway...');
        
        // Get the invoice ID from the response
        const invoiceId = response.invoice_id;
        
        // Calculate total amount including taxes (10%)
        const totalWithTaxes = Math.round((cart?.total || 0) * 1.1);
        
        // Create Razorpay payment order with correct amount including taxes
        const paymentOrderData = await paymentsAPI.createPaymentOrder(invoiceId, totalWithTaxes);
        
        // Process Razorpay payment
        await processRazorpayPayment(paymentOrderData, response.order);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showError(error.response?.data?.error || 'Failed to create order. Please try again.');
      setIsProcessing(false);
    }
  };

  const processRazorpayPayment = async (orderData, orderDetails) => {
    // Load Razorpay script if not already loaded
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => initiateRazorpayPayment(orderData, orderDetails);
      script.onerror = () => {
        showError('Failed to load Razorpay payment gateway. Please try again.');
        setIsProcessing(false);
      };
      document.body.appendChild(script);
    } else {
      initiateRazorpayPayment(orderData, orderDetails);
    }
  };

  const initiateRazorpayPayment = (orderData, orderDetails) => {
    const options = {
      key: orderData.razorpay_key,
      amount: orderData.amount * 100, // Amount in paise
      currency: orderData.currency,
      name: 'ApparelDesk',
      description: `Payment for Order #${orderDetails.id}`,
      order_id: orderData.razorpay_order_id,
      handler: async function (response) {
        try {
          setIsProcessing(true);
          showInfo('Verifying payment...');

          // Verify payment
          const verificationResult = await paymentsAPI.verifyPayment(
            orderData.payment_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );

          if (verificationResult.success) {
            showSuccess('Payment successful! Your order has been confirmed.');
            
            // Navigate to order confirmation
            navigate('/order-confirmation', {
              state: {
                order: orderDetails,
                address: addressForm,
                paymentMethod: paymentMethod,
                paymentSuccess: true,
                paymentId: verificationResult.payment.id
              }
            });
          } else {
            throw new Error('Payment verification failed');
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          showError('Payment verification failed. Please contact support.');
          setIsProcessing(false);
        }
      },
      prefill: {
        name: addressForm.name,
        email: addressForm.email,
        contact: addressForm.phone
      },
      notes: {
        order_id: orderDetails.id,
        customer_name: addressForm.name
      },
      theme: {
        color: '#8B5A3C'
      },
      modal: {
        ondismiss: function() {
          showInfo('Payment cancelled. Your order is still saved.');
          setIsProcessing(false);
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  if (!tokenUtils.isAuthenticated()) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-app-primary">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 animate-spin text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-app-muted">Loading cart...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-primary">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-light text-app-main tracking-tight mb-2">
            Cart
          </h1>
          <p className="text-app-muted font-sans">
            Review your items and complete your order
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${currentStep === 'order' ? 'text-app-accent' : 'text-app-muted'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'order' ? 'bg-app-accent text-white' : 'bg-app-secondary text-app-muted'}`}>
                1
              </div>
              <span className="font-sans">Order</span>
            </div>
            <div className="w-8 h-px bg-app-border"></div>
            <div className={`flex items-center space-x-2 ${currentStep === 'address' ? 'text-app-accent' : 'text-app-muted'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'address' ? 'bg-app-accent text-white' : 'bg-app-secondary text-app-muted'}`}>
                2
              </div>
              <span className="font-sans">Address</span>
            </div>
            <div className="w-8 h-px bg-app-border"></div>
            <div className={`flex items-center space-x-2 ${currentStep === 'payment' ? 'text-app-accent' : 'text-app-muted'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'payment' ? 'bg-app-accent text-white' : 'bg-app-secondary text-app-muted'}`}>
                3
              </div>
              <span className="font-sans">Payment</span>
            </div>
          </div>
        </div>

        {!cart || cart.items.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-app-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="font-display text-xl text-app-main mb-2">Your cart is empty</h3>
            <p className="text-app-muted mb-4">Add some products to get started</p>
            <button
              onClick={() => navigate('/shop')}
              className="bg-app-accent text-white px-6 py-2 rounded-pro font-mono text-sm tracking-wider hover:bg-app-accent/90 transition-all duration-200"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Order Step */}
              {currentStep === 'order' && (
                <div className="bg-app-surface rounded-pro border border-app-border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-xl font-medium text-app-main">
                      Your Items ({cart.item_count})
                    </h3>
                    {cart.items.length > 1 && (
                      <button
                        onClick={handleClearCart}
                        className="text-red-600 hover:text-red-700 text-sm font-sans"
                      >
                        Clear Cart
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 bg-app-secondary rounded-pro p-4">
                        <img
                          src={`https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=100&q=80`}
                          alt={item.product.product_name}
                          className="w-16 h-16 object-cover rounded border border-app-border"
                        />
                        <div className="flex-1">
                          <h4 className="font-sans font-medium text-app-main">
                            {item.product.product_name}
                          </h4>
                          <p className="text-sm text-app-muted">
                            ₹{item.product.sales_price} each
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQuantityUpdate(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded border border-app-border text-app-main hover:bg-app-primary transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-mono text-app-main">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityUpdate(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded border border-app-border text-app-main hover:bg-app-primary transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-medium text-app-accent">
                            ₹{item.total}
                          </p>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Address Step */}
              {currentStep === 'address' && (
                <div className="bg-app-surface rounded-pro border border-app-border p-6">
                  <h3 className="font-display text-xl font-medium text-app-main mb-6">
                    Delivery Address
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-sans font-medium text-app-main mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={addressForm.name}
                        onChange={handleAddressChange}
                        className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-sans font-medium text-app-main mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={addressForm.phone}
                        onChange={handleAddressChange}
                        className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-sans font-medium text-app-main mb-2">
                        Address *
                      </label>
                      <textarea
                        name="address"
                        value={addressForm.address}
                        onChange={handleAddressChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-sans font-medium text-app-main mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={addressForm.city}
                        onChange={handleAddressChange}
                        className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-sans font-medium text-app-main mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={addressForm.state}
                        onChange={handleAddressChange}
                        className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-sans font-medium text-app-main mb-2">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        value={addressForm.pincode}
                        onChange={handleAddressChange}
                        maxLength="6"
                        className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-sans font-medium text-app-main mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={addressForm.email}
                        onChange={handleAddressChange}
                        className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Step */}
              {currentStep === 'payment' && (
                <div className="bg-app-surface rounded-pro border border-app-border p-6">
                  <h3 className="font-display text-xl font-medium text-app-main mb-6">
                    Payment Method
                  </h3>
                  
                  {/* Payment Method Selection */}
                  <div className="mb-6">
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setPaymentMethod('razorpay')}
                        className={`px-6 py-3 rounded-pro font-sans text-sm transition-colors duration-200 ${
                          paymentMethod === 'razorpay'
                            ? 'bg-app-accent text-white'
                            : 'bg-app-secondary text-app-main hover:bg-app-border'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <span>Razorpay</span>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setPaymentMethod('cod')}
                        className={`px-6 py-3 rounded-pro font-sans text-sm transition-colors duration-200 ${
                          paymentMethod === 'cod'
                            ? 'bg-app-accent text-white'
                            : 'bg-app-secondary text-app-main hover:bg-app-border'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>Cash on Delivery</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Razorpay Payment Info */}
                  {paymentMethod === 'razorpay' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-pro p-4 mb-6">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h4 className="text-blue-800 font-sans font-medium mb-2">Secure Payment with Razorpay</h4>
                          <p className="text-blue-700 font-sans text-sm mb-3">
                            Click "Confirm Order" to open Razorpay's secure payment gateway where you can choose from:
                          </p>
                          <ul className="text-blue-700 font-sans text-sm space-y-1">
                            <li>• Credit/Debit Cards</li>
                            <li>• UPI (Google Pay, PhonePe, Paytm)</li>
                            <li>• Net Banking</li>
                            <li>• Digital Wallets</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Cash on Delivery Info */}
                  {paymentMethod === 'cod' && (
                    <div className="bg-green-50 border border-green-200 rounded-pro p-4 mb-6">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h4 className="text-green-800 font-sans font-medium mb-2">Cash on Delivery</h4>
                          <p className="text-green-700 font-sans text-sm">
                            Pay cash when your order is delivered to your doorstep. Additional handling charges may apply.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-app-surface rounded-pro border border-app-border p-6 sticky top-8">
                <h3 className="font-display text-xl font-medium text-app-main mb-6">
                  Order Summary
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-app-main font-sans">Subtotal:</span>
                    <span className="text-app-main font-mono">₹{cart?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-app-main font-sans">Taxes:</span>
                    <span className="text-app-main font-mono">₹{Math.round((cart?.total || 0) * 0.1)}</span>
                  </div>
                  <hr className="border-app-border" />
                  <div className="flex justify-between font-medium text-lg">
                    <span className="text-app-main font-sans">Total:</span>
                    <span className="text-app-accent font-mono">₹{Math.round((cart?.total || 0) * 1.1)}</span>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="space-y-3">
                  {currentStep === 'order' && (
                    <button
                      onClick={handleNextStep}
                      className="w-full py-3 bg-app-accent text-white rounded-pro font-mono text-sm tracking-wider hover:bg-app-accent/90 transition-colors"
                    >
                      Continue to Address
                    </button>
                  )}
                  
                  {currentStep === 'address' && (
                    <>
                      <button
                        onClick={handleNextStep}
                        className="w-full py-3 bg-app-accent text-white rounded-pro font-mono text-sm tracking-wider hover:bg-app-accent/90 transition-colors"
                      >
                        Continue to Payment
                      </button>
                      <button
                        onClick={handlePreviousStep}
                        className="w-full py-3 border border-app-border text-app-main rounded-pro font-sans text-sm hover:bg-app-secondary transition-colors"
                      >
                        Back to Order
                      </button>
                    </>
                  )}
                  
                  {currentStep === 'payment' && (
                    <>
                      <button
                        onClick={handleConfirmOrder}
                        disabled={isProcessing}
                        className={`w-full py-3 rounded-pro font-mono text-sm tracking-wider transition-colors ${
                          isProcessing
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-app-accent text-white hover:bg-app-accent/90'
                        }`}
                      >
                        {isProcessing ? (
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Processing...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            {paymentMethod === 'razorpay' ? (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span>Pay ₹{Math.round((cart?.total || 0) * 1.1)} via Razorpay</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Confirm Order (COD)</span>
                              </>
                            )}
                          </div>
                        )}
                      </button>
                      <button
                        onClick={handlePreviousStep}
                        disabled={isProcessing}
                        className="w-full py-3 border border-app-border text-app-main rounded-pro font-sans text-sm hover:bg-app-secondary transition-colors disabled:opacity-50"
                      >
                        Back to Address
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, getCartItemsCount } = useCart();
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountMessage, setDiscountMessage] = useState('');
  const [currentStep, setCurrentStep] = useState('order'); // order, address, payment
  
  // Address form state
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState('card'); // card, upi, cod
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    upiId: ''
  });

  const updateCartQuantity = (id, change) => {
    const item = cartItems.find(item => item.id === id);
    if (item) {
      updateQuantity(id, item.quantity + change);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountMessage('');
    setDiscountCode('');
  };

  const applyDiscount = async () => {
    if (!discountCode.trim()) return;

    try {
      const mockDiscounts = {
        'SAVE10': { type: 'percentage', value: 10, description: '10% on your order' },
        'FLAT100': { type: 'fixed', value: 100, description: '₹100 off on your order' },
        'WELCOME20': { type: 'percentage', value: 20, description: '20% welcome discount' }
      };

      const discount = mockDiscounts[discountCode.toUpperCase()];
      
      if (discount) {
        setAppliedDiscount({
          code: discountCode.toUpperCase(),
          ...discount
        });
        setDiscountMessage(`You have successfully applied the following code: ${discountCode.toUpperCase()}`);
      } else {
        alert('Invalid discount code');
      }
    } catch (error) {
      console.error('Error applying discount:', error);
      alert('Error applying discount code');
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format phone number (numbers only)
    if (name === 'phone') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 10) return; // Limit to 10 digits
    }

    // Format pincode (numbers only)
    if (name === 'pincode') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 6) return; // Limit to 6 digits
    }

    setAddressForm(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) return; // Limit to 16 digits + 3 spaces
    }

    // Format expiry date
    if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
      if (formattedValue.length > 5) return; // Limit to MM/YY
    }

    // Format CVV (numbers only)
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 4) return; // Limit to 4 digits
    }

    setPaymentForm(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const validateAddress = () => {
    const required = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'pincode'];
    const missingFields = required.filter(field => !addressForm[field].trim());
    
    if (missingFields.length > 0) {
      alert(`Please fill the following required fields: ${missingFields.join(', ')}`);
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(addressForm.email)) {
      alert('Please enter a valid email address');
      return false;
    }

    // Phone validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(addressForm.phone.replace(/\D/g, ''))) {
      alert('Please enter a valid 10-digit phone number');
      return false;
    }

    // Pincode validation (6 digits)
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(addressForm.pincode)) {
      alert('Please enter a valid 6-digit pincode');
      return false;
    }

    return true;
  };

  const validatePayment = () => {
    if (paymentMethod === 'cod') return true;
    
    if (paymentMethod === 'upi') {
      if (!paymentForm.upiId.trim()) {
        alert('Please enter your UPI ID');
        return false;
      }
      // Basic UPI ID validation
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
      if (!upiRegex.test(paymentForm.upiId)) {
        alert('Please enter a valid UPI ID (e.g., yourname@paytm)');
        return false;
      }
      return true;
    }
    
    if (paymentMethod === 'card') {
      const requiredFields = ['cardNumber', 'expiryDate', 'cvv', 'cardName'];
      const missingFields = requiredFields.filter(field => !paymentForm[field].trim());
      
      if (missingFields.length > 0) {
        alert(`Please fill the following card details: ${missingFields.join(', ')}`);
        return false;
      }

      // Card number validation (basic)
      const cardNumber = paymentForm.cardNumber.replace(/\s/g, '');
      if (cardNumber.length < 13 || cardNumber.length > 19) {
        alert('Please enter a valid card number');
        return false;
      }

      // Expiry date validation (MM/YY format)
      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
      if (!expiryRegex.test(paymentForm.expiryDate)) {
        alert('Please enter expiry date in MM/YY format');
        return false;
      }

      // CVV validation
      const cvvRegex = /^\d{3,4}$/;
      if (!cvvRegex.test(paymentForm.cvv)) {
        alert('Please enter a valid 3 or 4 digit CVV');
        return false;
      }

      return true;
    }
    
    return false;
  };

  const proceedToNextStep = () => {
    if (currentStep === 'order') {
      if (cartItems.length === 0) {
        alert('Your cart is empty. Please add some products first.');
        return;
      }
      setCurrentStep('address');
    } else if (currentStep === 'address') {
      if (validateAddress()) {
        setCurrentStep('payment');
      }
    } else if (currentStep === 'payment') {
      if (validatePayment()) {
        // Create order summary
        const orderSummary = {
          items: cartItems,
          address: addressForm,
          payment: {
            method: paymentMethod,
            details: paymentMethod === 'card' ? {
              cardNumber: paymentForm.cardNumber.slice(-4), // Only last 4 digits
              cardName: paymentForm.cardName
            } : paymentMethod === 'upi' ? {
              upiId: paymentForm.upiId
            } : null
          },
          totals: {
            subtotal,
            discount: discountAmount,
            taxes,
            total
          },
          appliedDiscount
        };

        console.log('Order placed:', orderSummary);
        alert(`Order placed successfully! Total: ₹${total}\n\nOrder will be delivered to:\n${addressForm.fullName}\n${addressForm.address}, ${addressForm.city}\n\nPayment Method: ${paymentMethod.toUpperCase()}`);
        
        // Here you would typically send the order to your backend
        // For now, we'll just clear the cart and reset the form
        // clearCart();
        // setCurrentStep('order');
        // setAddressForm({ fullName: '', email: '', phone: '', address: '', city: '', state: '', pincode: '', country: 'India' });
        // setPaymentForm({ cardNumber: '', expiryDate: '', cvv: '', cardName: '', upiId: '' });
      }
    }
  };

  // Calculate totals
  const subtotal = getCartTotal();
  const discountAmount = appliedDiscount 
    ? appliedDiscount.type === 'percentage' 
      ? (subtotal * appliedDiscount.value) / 100
      : appliedDiscount.value
    : 0;
  const discountedSubtotal = subtotal - discountAmount;
  const taxes = Math.round(discountedSubtotal * 0.18); // 18% GST
  const total = discountedSubtotal + taxes;

  const steps = [
    { key: 'order', label: 'Order', active: currentStep === 'order' },
    { key: 'address', label: 'Address', active: currentStep === 'address' },
    { key: 'payment', label: 'Payment', active: currentStep === 'payment' }
  ];

  return (
    <div className="min-h-screen bg-app-primary">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Debug Info - Shows current cart status */}
        {cartItems.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-pro">
            <p className="text-blue-800 text-sm font-mono">
              Debug: Cart has {cartItems.length} unique items, {getCartItemsCount()} total items
            </p>
          </div>
        )}

        {/* Breadcrumb Steps */}
        <div className="flex items-center space-x-4 mb-8">
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
              <button
                onClick={() => setCurrentStep(step.key)}
                className={`font-sans font-medium ${
                  step.active ? 'text-app-accent' : 'text-app-muted'
                }`}
              >
                {step.label}
              </button>
              {index < steps.length - 1 && (
                <svg className="w-4 h-4 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Dynamic Content Based on Step */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ORDER STEP - Cart Items */}
            {currentStep === 'order' && (
              <>
                {cartItems.map((item) => (
                  <div key={item.id} className="bg-app-surface rounded-pro border border-app-border p-6">
                    <div className="flex items-center space-x-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-app-secondary border border-app-border rounded-pro flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-pro" />
                        ) : (
                          <div className="text-center">
                            <svg className="w-8 h-8 text-app-muted mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <div className="text-xs text-app-muted font-mono">{item.category}</div>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <h3 className="font-sans font-medium text-app-main">{item.name}</h3>
                        <p className="text-sm text-app-muted mb-1">Category: {item.category}</p>
                        {item.color && <p className="text-sm text-app-muted">Color: {item.color}</p>}
                        {item.size && <p className="text-sm text-app-muted">Size: {item.size}</p>}
                        <p className="text-xs text-app-muted mt-1">Product ID: {item.productId}</p>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-mono font-medium text-app-accent">₹{item.price}</p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center border border-app-border rounded-pro">
                        <button
                          onClick={() => updateCartQuantity(item.id, -1)}
                          className="px-3 py-1 text-app-main hover:bg-app-secondary transition-colors duration-200"
                        >
                          -
                        </button>
                        <span className="px-4 py-1 text-app-main font-sans">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, 1)}
                          className="px-3 py-1 text-app-main hover:bg-app-secondary transition-colors duration-200"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="px-4 py-2 border border-orange-400 text-orange-600 rounded-pro font-sans text-sm hover:bg-orange-50 transition-colors duration-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {/* Applied Discount */}
                {appliedDiscount && (
                  <div className="bg-app-surface rounded-pro border border-app-border p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-green-100 border border-green-200 rounded-pro flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-sans font-medium text-app-main">{appliedDiscount.description}</h3>
                        <p className="text-sm text-app-muted">Code: {appliedDiscount.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-medium text-green-600">-₹{Math.round(discountAmount)}</p>
                      </div>
                      <button
                        onClick={removeDiscount}
                        className="px-4 py-2 border border-orange-400 text-orange-600 rounded-pro font-sans text-sm hover:bg-orange-50 transition-colors duration-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {/* Empty Cart Message */}
                {cartItems.length === 0 && (
                  <div className="bg-app-surface rounded-pro border border-app-border p-12 text-center">
                    <svg className="w-16 h-16 mx-auto text-app-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9m-9 0V19a2 2 0 002 2h9a2 2 0 002-2v-6" />
                    </svg>
                    <h3 className="font-display text-xl text-app-main mb-2">Your cart is empty</h3>
                    <p className="text-app-muted mb-4">Add some products to get started</p>
                    <button
                      onClick={() => window.location.href = '/shop'}
                      className="bg-app-accent text-white px-6 py-2 rounded-pro font-mono text-sm tracking-wider hover:bg-app-accent/90 transition-all duration-200"
                    >
                      Continue Shopping
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ADDRESS STEP - Address Form */}
            {currentStep === 'address' && (
              <div className="bg-app-surface rounded-pro border border-app-border p-6">
                <h3 className="font-display text-xl font-medium text-app-main mb-6">Shipping Address</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-sans font-medium text-app-main mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={addressForm.fullName}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-sans font-medium text-app-main mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={addressForm.email}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-sans font-medium text-app-main mb-2">Phone *</label>
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
                    <label className="block text-sm font-sans font-medium text-app-main mb-2">Address *</label>
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
                    <label className="block text-sm font-sans font-medium text-app-main mb-2">City *</label>
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
                    <label className="block text-sm font-sans font-medium text-app-main mb-2">State *</label>
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
                    <label className="block text-sm font-sans font-medium text-app-main mb-2">Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={addressForm.pincode}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-sans font-medium text-app-main mb-2">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={addressForm.country}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-secondary text-app-muted"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENT STEP - Payment Form */}
            {currentStep === 'payment' && (
              <div className="bg-app-surface rounded-pro border border-app-border p-6">
                <h3 className="font-display text-xl font-medium text-app-main mb-6">Payment Method</h3>
                
                {/* Payment Method Selection */}
                <div className="mb-6">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`px-4 py-2 rounded-pro font-sans text-sm transition-colors duration-200 ${
                        paymentMethod === 'card'
                          ? 'bg-app-accent text-white'
                          : 'bg-app-secondary text-app-main hover:bg-app-border'
                      }`}
                    >
                      Credit/Debit Card
                    </button>
                    <button
                      onClick={() => setPaymentMethod('upi')}
                      className={`px-4 py-2 rounded-pro font-sans text-sm transition-colors duration-200 ${
                        paymentMethod === 'upi'
                          ? 'bg-app-accent text-white'
                          : 'bg-app-secondary text-app-main hover:bg-app-border'
                      }`}
                    >
                      UPI
                    </button>
                    <button
                      onClick={() => setPaymentMethod('cod')}
                      className={`px-4 py-2 rounded-pro font-sans text-sm transition-colors duration-200 ${
                        paymentMethod === 'cod'
                          ? 'bg-app-accent text-white'
                          : 'bg-app-secondary text-app-main hover:bg-app-border'
                      }`}
                    >
                      Cash on Delivery
                    </button>
                  </div>
                </div>

                {/* Card Payment Form */}
                {paymentMethod === 'card' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-sans font-medium text-app-main mb-2">Card Number *</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={paymentForm.cardNumber}
                        onChange={handlePaymentChange}
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-sans font-medium text-app-main mb-2">Expiry Date *</label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={paymentForm.expiryDate}
                        onChange={handlePaymentChange}
                        placeholder="MM/YY"
                        className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-sans font-medium text-app-main mb-2">CVV *</label>
                      <input
                        type="text"
                        name="cvv"
                        value={paymentForm.cvv}
                        onChange={handlePaymentChange}
                        placeholder="123"
                        className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-sans font-medium text-app-main mb-2">Cardholder Name *</label>
                      <input
                        type="text"
                        name="cardName"
                        value={paymentForm.cardName}
                        onChange={handlePaymentChange}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* UPI Payment Form */}
                {paymentMethod === 'upi' && (
                  <div>
                    <label className="block text-sm font-sans font-medium text-app-main mb-2">UPI ID *</label>
                    <input
                      type="text"
                      name="upiId"
                      value={paymentForm.upiId}
                      onChange={handlePaymentChange}
                      placeholder="yourname@paytm"
                      className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                      required
                    />
                  </div>
                )}

                {/* COD Message */}
                {paymentMethod === 'cod' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-pro p-4">
                    <p className="text-yellow-800 font-sans text-sm">
                      You will pay ₹{total} in cash when your order is delivered.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side - Order Summary */}
          {cartItems.length > 0 && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-app-surface rounded-pro border border-app-border p-6">
                <h3 className="font-display text-xl font-medium text-app-main mb-4">Order Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-app-main font-sans">Subtotal</span>
                    <span className="text-app-main font-mono">₹{subtotal}</span>
                  </div>
                  
                  {appliedDiscount && (
                    <div className="flex justify-between text-green-600">
                      <span className="font-sans">Discount ({appliedDiscount.description})</span>
                      <span className="font-mono">-₹{Math.round(discountAmount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-app-main font-sans">Taxes</span>
                    <span className="text-app-main font-mono">₹{taxes}</span>
                  </div>
                  
                  <hr className="border-app-border" />
                  
                  <div className="flex justify-between font-medium">
                    <span className="text-app-main font-sans text-lg">Total</span>
                    <span className="text-app-accent font-mono text-lg">₹{total}</span>
                  </div>
                </div>
              </div>

              {/* Discount Code - Only show in order step */}
              {currentStep === 'order' && (
                <div className="bg-app-surface rounded-pro border border-app-border p-6">
                  <h4 className="font-sans font-medium text-app-main mb-4">Discount Code</h4>
                  
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Enter discount code"
                      className="flex-1 px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main placeholder-app-muted focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                    />
                    <button
                      onClick={applyDiscount}
                      className="px-4 py-2 bg-app-accent text-white rounded-pro font-mono text-sm tracking-wider hover:bg-app-accent/90 transition-all duration-200"
                    >
                      Apply
                    </button>
                  </div>

                  {/* Success Message */}
                  {discountMessage && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-pro">
                      <p className="text-green-700 font-sans text-sm">{discountMessage}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Compact Order Summary for Address/Payment Steps */}
              {(currentStep === 'address' || currentStep === 'payment') && (
                <div className="bg-app-surface rounded-pro border border-app-border p-6">
                  <h4 className="font-sans font-medium text-app-main mb-4">Items in Order</h4>
                  
                  {/* Compact Product List */}
                  <div className="space-y-3 mb-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-app-accent text-white rounded-full flex items-center justify-center text-sm font-mono">
                            {item.quantity}
                          </div>
                          <span className="text-sm text-app-main font-sans">{item.name}</span>
                        </div>
                        <span className="text-sm text-app-main font-mono">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    
                    {appliedDiscount && (
                      <div className="flex items-center justify-between text-green-600">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">
                            %
                          </div>
                          <span className="text-sm font-sans">{appliedDiscount.description}</span>
                        </div>
                        <span className="text-sm font-mono">-₹{Math.round(discountAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={proceedToNextStep}
                className="w-full bg-app-accent text-white py-3 rounded-pro font-mono text-sm tracking-widest uppercase hover:bg-app-accent/90 transition-all duration-200"
              >
                {currentStep === 'order' ? 'Checkout' : currentStep === 'address' ? 'Continue to Payment' : 'Place Order'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;
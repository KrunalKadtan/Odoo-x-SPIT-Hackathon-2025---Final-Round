import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartAPI, ordersAPI } from '../utils/api';
import { useNotification } from '../context/NotificationContext';

const Cart = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useNotification();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCart();
    }
  }, [isOpen]);

  const loadCart = async () => {
    setLoading(true);
    try {
      const cartData = await cartAPI.getCart();
      setCart(cartData);
    } catch (error) {
      console.error('Error loading cart:', error);
      showError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeItem(itemId);
      return;
    }

    try {
      const response = await cartAPI.updateCartItem(itemId, newQuantity);
      setCart(response.cart);
      showSuccess(response.message);
    } catch (error) {
      console.error('Error updating quantity:', error);
      showError(error.response?.data?.error || 'Failed to update quantity');
    }
  };

  const removeItem = async (itemId) => {
    try {
      const response = await cartAPI.removeFromCart(itemId);
      setCart(response.cart);
      showSuccess(response.message);
    } catch (error) {
      console.error('Error removing item:', error);
      showError(error.response?.data?.error || 'Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      const response = await cartAPI.clearCart();
      setCart(response.cart);
      showSuccess(response.message);
    } catch (error) {
      console.error('Error clearing cart:', error);
      showError(error.response?.data?.error || 'Failed to clear cart');
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      showError('Your cart is empty');
      return;
    }

    setCheckingOut(true);
    try {
      showInfo('Creating your order...');
      const response = await ordersAPI.checkout();
      
      showSuccess('Order created successfully!');
      setCart({ ...cart, items: [], total: 0, item_count: 0 });
      onClose();
      
      // Navigate to order confirmation or my account
      navigate('/my-account', {
        state: { 
          activeSection: 'orders',
          orderSuccess: {
            orderId: response.order.id,
            total: response.order.total_amount
          }
        }
      });
    } catch (error) {
      console.error('Error during checkout:', error);
      showError(error.response?.data?.error || 'Failed to create order');
    } finally {
      setCheckingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Cart Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-app-primary shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-app-border p-4">
            <h2 className="font-display text-xl font-medium text-app-main">
              Shopping Cart
            </h2>
            <button
              onClick={onClose}
              className="text-app-muted hover:text-app-main transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 animate-spin text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-app-muted">Loading cart...</span>
                </div>
              </div>
            ) : !cart || cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                <svg className="w-16 h-16 text-app-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="font-display text-lg text-app-main mb-2">Your cart is empty</h3>
                <p className="text-app-muted mb-4">Add some products to get started</p>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/shop');
                  }}
                  className="bg-app-accent text-white px-4 py-2 rounded-pro font-sans text-sm hover:bg-app-accent/90 transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 bg-app-surface rounded-pro border border-app-border p-3">
                    <img
                      src={`https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=100&q=80`}
                      alt={item.product.product_name}
                      className="w-16 h-16 object-cover rounded border border-app-border"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-sans font-medium text-app-main truncate">
                        {item.product.product_name}
                      </h4>
                      <p className="text-sm text-app-muted">
                        ₹{item.product.sales_price} each
                      </p>
                      <p className="text-sm font-medium text-app-accent">
                        ₹{item.total}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded border border-app-border text-app-main hover:bg-app-secondary transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono text-app-main">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded border border-app-border text-app-main hover:bg-app-secondary transition-colors"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 flex items-center justify-center rounded text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                
                {cart.items.length > 1 && (
                  <button
                    onClick={clearCart}
                    className="w-full text-center text-red-600 hover:text-red-700 text-sm font-sans py-2 transition-colors"
                  >
                    Clear Cart
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart && cart.items.length > 0 && (
            <div className="border-t border-app-border p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-sans font-medium text-app-main">Total:</span>
                <span className="font-mono text-lg font-medium text-app-accent">
                  ₹{cart.total}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className={`w-full py-3 rounded-pro font-mono text-sm tracking-wider uppercase transition-all duration-200 ${
                  checkingOut
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-app-accent text-white hover:bg-app-accent/90'
                }`}
              >
                {checkingOut ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Processing...</span>
                  </div>
                ) : (
                  `Checkout (${cart.item_count} items)`
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../utils/api';
import { tokenUtils } from '../utils/api';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize cart state
  useEffect(() => {
    initializeCart();
  }, []);

  // Listen for authentication changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'access_token') {
        if (e.newValue) {
          // User logged in, load cart
          loadCart();
        } else {
          // User logged out, clear cart
          setCart(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const initializeCart = useCallback(async () => {
    if (tokenUtils.isAuthenticated()) {
      await loadCart();
    } else {
      // Initialize empty cart for unauthenticated users
      setCart({ items: [], total: 0, item_count: 0 });
    }
  }, []);

  const loadCart = useCallback(async () => {
    if (!tokenUtils.isAuthenticated()) {
      setCart({ items: [], total: 0, item_count: 0 });
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const cartData = await cartAPI.getCart();
      setCart(cartData);
    } catch (error) {
      console.error('Error loading cart:', error);
      setError('Failed to load cart');
      // Initialize empty cart on error
      setCart({ items: [], total: 0, item_count: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    if (!tokenUtils.isAuthenticated()) {
      throw new Error('Please sign in to add items to cart');
    }

    setError(null);
    try {
      const response = await cartAPI.addToCart(productId, quantity);
      setCart(response.cart);
      return response;
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('Failed to add item to cart');
      throw error;
    }
  }, []);

  const removeFromCart = useCallback(async (itemId) => {
    if (!tokenUtils.isAuthenticated()) {
      throw new Error('Please sign in to manage cart');
    }

    setError(null);
    try {
      const response = await cartAPI.removeFromCart(itemId);
      setCart(response.cart);
      return response;
    } catch (error) {
      console.error('Error removing from cart:', error);
      setError('Failed to remove item from cart');
      throw error;
    }
  }, []);

  const updateQuantity = useCallback(async (itemId, newQuantity) => {
    if (!tokenUtils.isAuthenticated()) {
      throw new Error('Please sign in to manage cart');
    }

    if (newQuantity <= 0) {
      return await removeFromCart(itemId);
    }

    setError(null);
    try {
      const response = await cartAPI.updateCartItem(itemId, newQuantity);
      setCart(response.cart);
      return response;
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError('Failed to update item quantity');
      throw error;
    }
  }, [removeFromCart]);

  const clearCart = useCallback(async () => {
    if (!tokenUtils.isAuthenticated()) {
      throw new Error('Please sign in to manage cart');
    }

    setError(null);
    try {
      const response = await cartAPI.clearCart();
      setCart(response.cart);
      return response;
    } catch (error) {
      console.error('Error clearing cart:', error);
      setError('Failed to clear cart');
      throw error;
    }
  }, []);

  // Helper functions for cart calculations
  const getCartTotal = useCallback(() => {
    return cart?.total || 0;
  }, [cart]);

  const getCartItemsCount = useCallback(() => {
    return cart?.item_count || 0;
  }, [cart]);

  const getCartItems = useCallback(() => {
    return cart?.items || [];
  }, [cart]);

  const getCartSubtotal = useCallback(() => {
    return cart?.total || 0;
  }, [cart]);

  const getCartTaxAmount = useCallback(() => {
    const subtotal = getCartSubtotal();
    return Math.round(subtotal * 0.1); // 10% tax
  }, [getCartSubtotal]);

  const getCartTotalWithTax = useCallback(() => {
    const subtotal = getCartSubtotal();
    const tax = getCartTaxAmount();
    return subtotal + tax;
  }, [getCartSubtotal, getCartTaxAmount]);

  // Check if product is in cart
  const isProductInCart = useCallback((productId) => {
    if (!cart?.items) return false;
    return cart.items.some(item => item.product.id === productId);
  }, [cart]);

  // Get quantity of specific product in cart
  const getProductQuantityInCart = useCallback((productId) => {
    if (!cart?.items) return 0;
    const item = cart.items.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  }, [cart]);

  // Refresh cart data (useful after login/logout)
  const refreshCart = useCallback(async () => {
    await loadCart();
  }, [loadCart]);

  const value = {
    // State
    cart,
    loading,
    error,
    
    // Actions
    loadCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart,
    
    // Getters
    getCartTotal,
    getCartItemsCount,
    getCartItems,
    getCartSubtotal,
    getCartTaxAmount,
    getCartTotalWithTax,
    isProductInCart,
    getProductQuantityInCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
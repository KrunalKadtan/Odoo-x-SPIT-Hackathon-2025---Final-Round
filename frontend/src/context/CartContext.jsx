import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Load cart from backend when user is authenticated
  useEffect(() => {
    if (tokenUtils.isAuthenticated()) {
      loadCart();
    }
  }, []);

  const loadCart = async () => {
    if (!tokenUtils.isAuthenticated()) return;
    
    setLoading(true);
    try {
      const cartData = await cartAPI.getCart();
      setCart(cartData);
    } catch (error) {
      console.error('Error loading cart:', error);
      // Initialize empty cart on error
      setCart({ items: [], total: 0, item_count: 0 });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    if (!tokenUtils.isAuthenticated()) {
      throw new Error('Please sign in to add items to cart');
    }

    try {
      const response = await cartAPI.addToCart(productId, quantity);
      setCart(response.cart);
      return response;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (itemId) => {
    if (!tokenUtils.isAuthenticated()) return;

    try {
      const response = await cartAPI.removeFromCart(itemId);
      setCart(response.cart);
      return response;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (!tokenUtils.isAuthenticated()) return;

    if (newQuantity <= 0) {
      return await removeFromCart(itemId);
    }

    try {
      const response = await cartAPI.updateCartItem(itemId, newQuantity);
      setCart(response.cart);
      return response;
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    if (!tokenUtils.isAuthenticated()) return;

    try {
      const response = await cartAPI.clearCart();
      setCart(response.cart);
      return response;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  const getCartTotal = () => {
    return cart?.total || 0;
  };

  const getCartItemsCount = () => {
    return cart?.item_count || 0;
  };

  const getCartItems = () => {
    return cart?.items || [];
  };

  const value = {
    cart,
    loading,
    loadCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    getCartItems
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
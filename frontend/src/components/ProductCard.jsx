import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { tokenUtils } from '../utils/api';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useNotification();

  const handleProductClick = () => {
    navigate(`/product/${product.category?.toLowerCase() || 'products'}/${product.id}`);
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation(); // Prevent navigation when clicking add to cart
    
    // Check if user is authenticated
    if (!tokenUtils.isAuthenticated()) {
      showError('Please sign in to add items to cart');
      navigate('/signin');
      return;
    }
    
    try {
      const response = await addToCart(product.id, 1);
      showSuccess(response.message || `${product.name} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      showError(error.response?.data?.error || 'Failed to add item to cart');
    }
  };

  return (
    <div 
      onClick={handleProductClick}
      className="bg-app-surface rounded-pro shadow-sm border border-app-border hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer"
    >
      {/* Product Image */}
      <div className="aspect-square bg-app-secondary flex items-center justify-center relative">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-app-muted">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Add to Cart Button */}
        <button 
          onClick={handleAddToCart}
          className="absolute top-2 right-2 bg-app-surface border border-app-border rounded-pro p-2 hover:bg-app-secondary transition-colors duration-200"
        >
          <svg className="w-4 h-4 text-app-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9m-9 0V19a2 2 0 002 2h9a2 2 0 002-2v-6" />
          </svg>
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-sans font-medium text-app-main mb-1 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-sm text-app-muted mb-2 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-mono font-medium text-app-accent">
            ₹{product.price}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-app-muted line-through">
              ₹{product.originalPrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Breadcrumb from '../components/Breadcrumb';
import { productsAPI, tokenUtils } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';

const ProductDetail = () => {
  const { category, productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useNotification();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        navigate('/shop');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await productsAPI.getProduct(productId);
        
        // Transform backend data to frontend format
        const transformedProduct = {
          id: response.id,
          name: response.product_name,
          description: `${response.material ? response.material + ' ' : ''}${response.product_type}. Perfect for ${response.product_category.toLowerCase()} wear.`,
          price: parseFloat(response.sales_price),
          originalPrice: response.purchase_price ? parseFloat(response.purchase_price) * 1.5 : null, // Calculate original price
          category: response.product_category,
          material: response.material,
          stock: response.current_stock,
          colors: response.available_colors || [],
          // Generate color objects from available colors
          colorOptions: (response.available_colors || []).map(color => ({
            name: color,
            value: getColorValue(color)
          })),
          // Generate sizes based on category
          sizes: generateSizesForCategory(response.product_category),
          features: [
            `Premium ${response.material || 'quality'} material`,
            'Comfortable fit',
            'Machine washable',
            'Durable construction',
            `${response.current_stock} items in stock`
          ],
          images: [
            '/api/placeholder/400/400',
            '/api/placeholder/400/400',
            '/api/placeholder/400/400'
          ]
        };

        setProduct(transformedProduct);
        setSelectedColor(transformedProduct.colorOptions[0]?.name || '');
        setSelectedSize(transformedProduct.sizes[0] || '');
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Product not found or failed to load.');
        // Redirect to shop after a delay
        setTimeout(() => navigate('/shop'), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, navigate]);

  // Helper function to get color hex values
  const getColorValue = (colorName) => {
    const colorMap = {
      'Red': '#EF4444',
      'Blue': '#3B82F6',
      'Green': '#10B981',
      'Yellow': '#F59E0B',
      'Black': '#000000',
      'White': '#FFFFFF',
      'Gray': '#6B7280',
      'Pink': '#EC4899',
      'Purple': '#8B5CF6',
      'Orange': '#F97316',
      'Brown': '#A16207',
      'Navy': '#1E3A8A'
    };
    return colorMap[colorName] || '#6B7280';
  };

  // Helper function to generate sizes based on category
  const generateSizesForCategory = (category) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('jean') || categoryLower.includes('trouser')) {
      return ['28', '30', '32', '34', '36', '38'];
    } else if (categoryLower.includes('saree') || categoryLower.includes('dupatta')) {
      return ['Free Size'];
    } else {
      return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    }
  };

  const handleQuantityChange = (change) => {
    setQuantity(prev => Math.max(1, Math.min(product?.stock || 1, prev + change)));
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    if (!tokenUtils.isAuthenticated()) {
      showError('Please sign in to add items to cart');
      navigate('/signin');
      return;
    }
    
    try {
      const response = await addToCart(product.id, quantity);
      showSuccess(response.message || `${quantity} ${product.name} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      showError(error.response?.data?.error || 'Failed to add item to cart');
    }
  };

  if (loading) {
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
            <p className="text-app-muted">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-app-primary">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-app-muted mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-display text-xl text-app-main mb-2">Product Not Found</h3>
            <p className="text-app-muted mb-4">{error || 'The product you are looking for does not exist.'}</p>
            <button
              onClick={() => navigate('/shop')}
              className="text-app-accent hover:text-app-accent/80 font-medium"
            >
              Back to Shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generate breadcrumb items
  const breadcrumbItems = [
    { label: 'All Products', href: '/shop' },
    { label: product.category, href: `/shop/${product.category.toLowerCase()}` },
    { label: product.name }
  ];

  return (
    <div className="min-h-screen bg-app-primary">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Side - Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-app-surface border border-app-border rounded-pro overflow-hidden">
              {product.images && product.images[selectedImage] ? (
                <img 
                  src={product.images[selectedImage]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-app-muted">
                  <div className="text-center">
                    <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="font-sans text-lg">Selected image in big size</p>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            <div className="flex space-x-4">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 bg-app-surface border rounded-pro overflow-hidden flex items-center justify-center ${
                    selectedImage === index ? 'border-app-accent' : 'border-app-border'
                  }`}
                >
                  {product.images && product.images[index] ? (
                    <img 
                      src={product.images[index]} 
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-app-muted text-xs text-center">
                      <div className="text-xs">img {index + 1}</div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right Side - Product Details */}
          <div className="space-y-6">
            {/* Product Title and Price */}
            <div>
              <h1 className="font-display text-3xl font-light text-app-main mb-4">
                {product.name}
              </h1>
              <div className="flex items-center space-x-4 mb-4">
                <span className="font-mono text-2xl font-medium text-app-accent">
                  ₹{product.price}
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-app-muted line-through">
                    ₹{product.originalPrice}
                  </span>
                )}
              </div>
              <hr className="border-app-border" />
            </div>

            {/* Product Description */}
            <div>
              <p className="text-app-main font-sans leading-relaxed">
                {product.description}
              </p>
              {product.stock <= 5 && product.stock > 0 && (
                <p className="text-orange-600 font-sans text-sm mt-2">
                  Only {product.stock} items left in stock!
                </p>
              )}
              {product.stock === 0 && (
                <p className="text-red-600 font-sans text-sm mt-2">
                  Out of stock
                </p>
              )}
            </div>

            {/* Color Selection */}
            {product.colorOptions && product.colorOptions.length > 0 && (
              <div>
                <h3 className="font-sans font-medium text-app-main mb-3">Color</h3>
                <div className="flex space-x-3">
                  {product.colorOptions.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        selectedColor === color.name ? 'border-app-accent' : 'border-app-border'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h3 className="font-sans font-medium text-app-main mb-3">Size</h3>
                <div className="flex space-x-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border rounded-pro font-sans text-sm ${
                        selectedSize === size
                          ? 'border-app-accent bg-app-accent text-white'
                          : 'border-app-border text-app-main hover:bg-app-secondary'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="flex items-center space-x-4">
              {/* Quantity Selector */}
              <div className="flex items-center border border-app-border rounded-pro">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="px-3 py-2 text-app-main hover:bg-app-secondary transition-colors duration-200"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-4 py-2 text-app-main font-sans">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="px-3 py-2 text-app-main hover:bg-app-secondary transition-colors duration-200"
                  disabled={quantity >= (product.stock || 1)}
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex items-center space-x-2 px-6 py-3 rounded-pro font-mono text-sm tracking-wider transition-all duration-200 ${
                  product.stock === 0
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-app-accent text-white hover:bg-app-accent/90'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9m-9 0V19a2 2 0 002 2h9a2 2 0 002-2v-6" />
                </svg>
                <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
              </button>
            </div>

            {/* Terms and Conditions */}
            <div className="bg-app-surface border border-app-border rounded-pro p-4">
              <h4 className="font-sans font-medium text-app-main mb-2">
                Terms and Conditions
              </h4>
              <ul className="text-sm text-app-muted font-sans space-y-1">
                <li>• 30-day money-back guarantee</li>
                <li>• Shipping: 2-3 Business Days</li>
                <li>• Free shipping on orders above ₹999</li>
                <li>• Easy returns and exchanges</li>
              </ul>
            </div>

            {/* Product Features */}
            {product.features && (
              <div className="bg-app-surface border border-app-border rounded-pro p-4">
                <h4 className="font-sans font-medium text-app-main mb-2">
                  Product Features
                </h4>
                <ul className="text-sm text-app-muted font-sans space-y-1">
                  {product.features.map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
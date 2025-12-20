import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../utils/api';

const FeaturedProducts = () => {
  const navigate = useNavigate();
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch products from API
        const response = await productsAPI.getProducts();
        const products = response.results || response || [];
        
        // Mock new arrivals and best sellers for demo
        // In real app, these would be separate API endpoints
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        setNewArrivals(shuffled.slice(0, 4));
        setBestSellers(shuffled.slice(4, 8));
      } catch (error) {
        console.error('Error fetching products:', error);
        // Fallback mock data
        setNewArrivals(mockProducts.slice(0, 4));
        setBestSellers(mockProducts.slice(4, 8));
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Mock data for fallback
  const mockProducts = [
    {
      id: 1,
      name: 'Premium Cotton Kurta',
      price: 2499,
      image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&q=80',
      category: 'kurtas',
      badge: 'New',
      stock_status: 'in_stock'
    },
    {
      id: 2,
      name: 'Classic White Shirt',
      price: 1899,
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80',
      category: 'men',
      badge: 'Best Seller',
      stock_status: 'low_stock'
    },
    {
      id: 3,
      name: 'Elegant Silk Blouse',
      price: 3299,
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&q=80',
      category: 'women',
      badge: 'New',
      stock_status: 'in_stock'
    },
    {
      id: 4,
      name: 'Casual Linen Pants',
      price: 2199,
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&q=80',
      category: 'men',
      badge: 'Limited',
      stock_status: 'in_stock'
    }
  ];

  const ProductCard = ({ product, showBadge = true }) => (
    <div
      onClick={() => navigate(`/product/${product.category}/${product.id}`)}
      className="group cursor-pointer bg-app-surface rounded-pro overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Badge */}
        {showBadge && product.badge && (
          <div className={`absolute top-4 left-4 px-3 py-1 rounded-pro text-xs font-mono tracking-wider ${
            product.badge === 'New' ? 'bg-app-accent text-white' :
            product.badge === 'Best Seller' ? 'bg-green-600 text-white' :
            product.badge === 'Limited' ? 'bg-red-600 text-white' :
            'bg-app-secondary text-app-main'
          }`}>
            {product.badge}
          </div>
        )}

        {/* Stock Status */}
        {product.stock_status === 'low_stock' && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-orange-500 text-white rounded-pro text-xs font-mono tracking-wider">
            LOW STOCK
          </div>
        )}

        {/* Quick Add Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button className="bg-white text-app-main px-6 py-2 rounded-pro font-mono text-sm tracking-wider transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            QUICK VIEW
          </button>
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-display text-lg font-medium text-app-main mb-2 group-hover:text-app-accent transition-colors duration-300">
          {product.name}
        </h3>
        <p className="font-mono text-app-accent font-medium">
          ₹{product.price?.toLocaleString() || 'Price on request'}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <section className="py-20 bg-app-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-app-border rounded w-64 mx-auto mb-16"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-app-surface rounded-pro p-4">
                  <div className="aspect-[3/4] bg-app-border rounded mb-4"></div>
                  <div className="h-4 bg-app-border rounded mb-2"></div>
                  <div className="h-4 bg-app-border rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-app-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* New Arrivals */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl font-light text-app-main tracking-tight mb-4">
              New Arrivals
            </h2>
            <p className="font-sans text-lg text-app-muted max-w-2xl mx-auto">
              Fresh styles crafted with attention to detail and premium materials
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {newArrivals.map((product) => (
              <ProductCard key={`new-${product.id}`} product={product} />
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate('/shop/new-arrivals')}
              className="border border-app-accent text-app-accent px-8 py-3 rounded-pro font-mono text-sm tracking-wider hover:bg-app-accent hover:text-white transition-all duration-300"
            >
              VIEW ALL NEW ARRIVALS
            </button>
          </div>
        </div>

        {/* Best Sellers */}
        <div>
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl font-light text-app-main tracking-tight mb-4">
              Best Sellers
            </h2>
            <p className="font-sans text-lg text-app-muted max-w-2xl mx-auto">
              Customer favorites that define timeless style and exceptional quality
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {bestSellers.map((product) => (
              <ProductCard key={`best-${product.id}`} product={product} />
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate('/shop/best-sellers')}
              className="border border-app-accent text-app-accent px-8 py-3 rounded-pro font-mono text-sm tracking-wider hover:bg-app-accent hover:text-white transition-all duration-300"
            >
              VIEW ALL BEST SELLERS
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
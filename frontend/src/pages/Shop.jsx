import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Breadcrumb from '../components/Breadcrumb';
import FilterSidebar from '../components/FilterSidebar';
import ProductCard from '../components/ProductCard';
import SortDropdown from '../components/SortDropdown';
import { productsAPI } from '../utils/api';

const Shop = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filters, setFilters] = useState({});
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All Products']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sort options with icons
  const sortOptions = [
    {
      value: 'name',
      label: 'Sort By: Name',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
    },
    {
      value: 'price_low',
      label: 'Sort By: Price (Low to High)',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
    },
    {
      value: 'price_high',
      label: 'Sort By: Price (High to Low)',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
    }
  ];

  // Set category from URL parameter
  useEffect(() => {
    if (category) {
      const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
      setSelectedCategory(formattedCategory);
    }
  }, [category]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productsAPI.getCategories();
        const backendCategories = response.categories || [];
        setCategories(['All Products', ...backendCategories]);
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Use fallback categories if API fails
        setCategories([
          'All Products',
          'T-shirts',
          'Shirts', 
          'Kurtas',
          'Formals',
          'Jeans',
          'Hoodies',
          'Sarees',
          'Nightwear'
        ]);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products based on filters and search
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = {};

        // Add category filter
        if (selectedCategory !== 'All Products') {
          params.category = selectedCategory;
        }

        // Add search query
        if (searchQuery) {
          params.search = searchQuery;
        }

        // Add sorting
        params.sort = sortBy;

        // Add material filter
        if (filters.material && filters.material.length > 0) {
          params.material = filters.material[0]; // API expects single material for now
        }

        // Add price range filter
        if (filters.priceRange && filters.priceRange.length > 0) {
          const priceRange = filters.priceRange[0];
          const [min, max] = priceRange.split('-').map(Number);
          if (min !== undefined) params.min_price = min;
          if (max !== undefined && max !== Infinity) params.max_price = max;
        }

        const response = await productsAPI.getProducts(params);
        
        // Transform backend data to frontend format
        // Handle both paginated (response.results) and direct array responses
        const productsData = response.results || response;
        const transformedProducts = Array.isArray(productsData) ? productsData.map(product => ({
          id: product.id,
          name: product.product_name,
          description: `${product.material ? product.material + ' ' : ''}${product.product_type}`,
          price: parseFloat(product.sales_price),
          category: product.product_category,
          image: null, // No images in current backend model
          material: product.material,
          colors: product.available_colors || [],
          stock: product.current_stock
        })) : [];

        setProducts(transformedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products. Please try again.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, searchQuery, sortBy, filters]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    // Update URL
    if (category === 'All Products') {
      navigate('/shop');
    } else {
      navigate(`/shop/${category.toLowerCase()}`);
    }
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'clear') {
      setFilters({});
    } else {
      setFilters(prev => ({
        ...prev,
        [filterType]: value
      }));
    }
  };

  // Generate breadcrumb items
  const breadcrumbItems = [
    { label: 'All Products', href: '/shop' }
  ];

  if (selectedCategory !== 'All Products') {
    breadcrumbItems.push({ 
      label: selectedCategory, 
      href: `/shop/${selectedCategory.toLowerCase()}` 
    });
  }

  return (
    <div className="min-h-screen bg-app-primary">
      <Navigation />
      
      <div className="flex">
        {/* Filter Sidebar */}
        <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Breadcrumb */}
          <Breadcrumb items={breadcrumbItems} />

          {/* Category Tabs */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map(categoryItem => (
                <button
                  key={categoryItem}
                  onClick={() => handleCategoryChange(categoryItem)}
                  className={`px-4 py-2 rounded-pro font-sans text-sm transition-colors duration-200 ${
                    selectedCategory === categoryItem
                      ? 'bg-app-accent text-white'
                      : 'bg-app-surface border border-app-border text-app-main hover:bg-app-secondary'
                  }`}
                >
                  {categoryItem}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Sort */}
          <div className="flex items-center justify-between mb-6">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-app-border rounded-pro bg-app-surface text-app-main placeholder-app-muted focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-app-muted"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Sort Dropdown */}
            <div className="ml-4">
              <SortDropdown
                value={sortBy}
                onChange={setSortBy}
                options={sortOptions}
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-app-muted mb-4">
                  <svg className="w-8 h-8 mx-auto animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-app-muted">Loading products...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-pro text-sm mb-6">
              {error}
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.length > 0 ? (
                products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="text-app-muted mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="font-display text-xl text-app-main mb-2">No products found</h3>
                  <p className="text-app-muted">Try adjusting your filters or search terms</p>
                </div>
              )}
            </div>
          )}

          {/* Results Count */}
          {!loading && !error && products.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-app-muted font-sans text-sm">
                Showing {products.length} product{products.length !== 1 ? 's' : ''}
                {selectedCategory !== 'All Products' && ` in ${selectedCategory}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
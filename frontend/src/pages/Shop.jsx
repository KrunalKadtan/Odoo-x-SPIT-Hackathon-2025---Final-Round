import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Breadcrumb from '../components/Breadcrumb';
import FilterSidebar from '../components/FilterSidebar';
import ProductCard from '../components/ProductCard';

const Shop = () => {
  const { category, productId } = useParams();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filters, setFilters] = useState({});
  const [products, setProducts] = useState([]);

  // Product categories
  const categories = [
    'All Products',
    'T-shirts',
    'Shirts', 
    'Kurtas',
    'Formals',
    'Jeans',
    'Hoodies',
    'Sarees',
    'Nightwear'
  ];

  // Sample products data (in real app, this would come from backend)
  const sampleProducts = [
    {
      id: 1,
      name: 'Highlander Men\'s Striped Shirt',
      description: 'Premium cotton striped shirt for men',
      price: 1299,
      originalPrice: 1999,
      category: 'Shirts',
      image: null,
      size: ['M', 'L', 'XL'],
      color: 'Blue',
      material: 'Cotton'
    },
    {
      id: 2,
      name: 'Classic White T-Shirt',
      description: 'Comfortable cotton t-shirt',
      price: 599,
      category: 'T-shirts',
      image: null,
      size: ['S', 'M', 'L'],
      color: 'White',
      material: 'Cotton'
    },
    {
      id: 3,
      name: 'Designer Kurta',
      description: 'Traditional designer kurta',
      price: 2499,
      category: 'Kurtas',
      image: null,
      size: ['M', 'L', 'XL'],
      color: 'White',
      material: 'Cotton'
    },
    {
      id: 4,
      name: 'Formal Black Shirt',
      description: 'Professional formal shirt',
      price: 1599,
      category: 'Formals',
      image: null,
      size: ['M', 'L', 'XL'],
      color: 'Black',
      material: 'Cotton'
    },
    {
      id: 5,
      name: 'Blue Denim Jeans',
      description: 'Classic fit denim jeans',
      price: 1899,
      category: 'Jeans',
      image: null,
      size: ['30', '32', '34'],
      color: 'Blue',
      material: 'Denim'
    },
    {
      id: 6,
      name: 'Comfortable Hoodie',
      description: 'Warm and comfortable hoodie',
      price: 1799,
      category: 'Hoodies',
      image: null,
      size: ['M', 'L', 'XL'],
      color: 'Gray',
      material: 'Cotton'
    },
    {
      id: 7,
      name: 'Silk Saree',
      description: 'Beautiful silk saree',
      price: 4999,
      category: 'Sarees',
      image: null,
      size: ['Free Size'],
      color: 'Red',
      material: 'Silk'
    },
    {
      id: 8,
      name: 'Cotton Nightwear',
      description: 'Comfortable cotton nightwear',
      price: 899,
      category: 'Nightwear',
      image: null,
      size: ['M', 'L', 'XL'],
      color: 'Pink',
      material: 'Cotton'
    }
  ];

  // Set category from URL parameter
  useEffect(() => {
    if (category) {
      const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
      if (categories.includes(formattedCategory)) {
        setSelectedCategory(formattedCategory);
      }
    }
  }, [category]);

  useEffect(() => {
    // Filter products based on selected category and filters
    let filteredProducts = sampleProducts;

    // Filter by category
    if (selectedCategory !== 'All Products') {
      filteredProducts = filteredProducts.filter(product => 
        product.category === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply additional filters
    Object.keys(filters).forEach(filterType => {
      if (filters[filterType] && filters[filterType].length > 0) {
        switch (filterType) {
          case 'color':
            filteredProducts = filteredProducts.filter(product =>
              filters[filterType].includes(product.color)
            );
            break;
          case 'material':
            filteredProducts = filteredProducts.filter(product =>
              filters[filterType].includes(product.material)
            );
            break;
          case 'priceRange':
            filteredProducts = filteredProducts.filter(product => {
              return filters[filterType].some(range => {
                const [min, max] = range.split('-').map(Number);
                return product.price >= min && (max === Infinity || product.price <= max);
              });
            });
            break;
        }
      }
    });

    // Sort products
    filteredProducts.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setProducts(filteredProducts);
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

  // If viewing a specific product, add it to breadcrumb
  if (productId) {
    const product = sampleProducts.find(p => p.id === parseInt(productId));
    if (product) {
      breadcrumbItems.push({ label: product.name });
    }
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
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-app-border rounded-pro bg-app-surface text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
              >
                <option value="name">Sort By: Name</option>
                <option value="price-low">Sort By: Price (Low to High)</option>
                <option value="price-high">Sort By: Price (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
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

          {/* Results Count */}
          {products.length > 0 && (
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
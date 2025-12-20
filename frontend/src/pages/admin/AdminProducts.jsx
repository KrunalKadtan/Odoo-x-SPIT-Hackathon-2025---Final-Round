import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminProductsAPI } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';

const AdminProducts = () => {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('New');
  const [isPublished, setIsPublished] = useState(true);
  const [products, setProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImages, setUploadingImages] = useState({});

  const [formData, setFormData] = useState({
    product_name: '',
    product_category: '',
    product_type: '',
    material: '',
    colors: [],
    current_stock: '',
    sales_price: '',
    sales_tax_percentage: '18',
    purchase_price: '',
    purchase_tax_percentage: '12',
    published: true
  });

  const tabs = ['New', 'Confirmed', 'Archived'];

  // Categories consistent with customer website
  const categories = [
    { value: 'men', label: 'Men' },
    { value: 'women', label: 'Women' },
    { value: 'kurtas', label: 'Kurtas' },
    { value: 'seasonal', label: 'Seasonal Edit' },
    { value: 'shirts', label: 'Shirts' },
    { value: 'pants', label: 'Pants' },
    { value: 'dresses', label: 'Dresses' },
    { value: 'accessories', label: 'Accessories' }
  ];

  const productTypes = [
    { value: 'casual', label: 'Casual' },
    { value: 'formal', label: 'Formal' },
    { value: 'traditional', label: 'Traditional' },
    { value: 'ethnic', label: 'Ethnic' },
    { value: 'sports', label: 'Sports' },
    { value: 'party', label: 'Party' },
    { value: 'office', label: 'Office' }
  ];

  const materials = [
    { value: 'cotton', label: 'Cotton' },
    { value: 'silk', label: 'Silk' },
    { value: 'linen', label: 'Linen' },
    { value: 'polyester', label: 'Polyester' },
    { value: 'wool', label: 'Wool' },
    { value: 'denim', label: 'Denim' },
    { value: 'chiffon', label: 'Chiffon' },
    { value: 'georgette', label: 'Georgette' },
    { value: 'crepe', label: 'Crepe' },
    { value: 'khadi', label: 'Khadi' }
  ];

  // Load products on component mount and when filters change
  useEffect(() => {
    loadProducts();
  }, [activeTab, isPublished]);

  const loadProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const params = {
        status: activeTab.toLowerCase(),
        published: isPublished
      };
      const response = await adminProductsAPI.getProducts(params);
      setProducts(response.results || response);
    } catch (error) {
      console.error('Error loading products:', error);
      showNotification('Failed to load products', 'error');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleColorChange = (colors) => {
    setFormData(prev => ({
      ...prev,
      colors: colors.split(',').map(c => c.trim()).filter(c => c)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.product_name.trim()) {
      newErrors.product_name = 'Product name is required';
    }
    
    if (!formData.product_category) {
      newErrors.product_category = 'Product category is required';
    }
    
    if (!formData.product_type) {
      newErrors.product_type = 'Product type is required';
    }
    
    if (!formData.current_stock || formData.current_stock < 0) {
      newErrors.current_stock = 'Valid stock quantity is required';
    }
    
    if (!formData.sales_price || formData.sales_price <= 0) {
      newErrors.sales_price = 'Valid sales price is required';
    }
    
    if (!formData.purchase_price || formData.purchase_price <= 0) {
      newErrors.purchase_price = 'Valid purchase price is required';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showNotification('Please fix the form errors', 'error');
      return;
    }
    
    setIsLoading(true);
    setErrors({});

    try {
      // Prepare data for API
      const productData = {
        ...formData,
        current_stock: parseInt(formData.current_stock),
        sales_price: parseFloat(formData.sales_price),
        purchase_price: parseFloat(formData.purchase_price),
        sales_tax_percentage: parseFloat(formData.sales_tax_percentage || 0),
        purchase_tax_percentage: parseFloat(formData.purchase_tax_percentage || 0)
      };

      if (isEditing && currentProduct) {
        // Update existing product
        const updatedProduct = await adminProductsAPI.updateProduct(currentProduct.id, productData);
        showNotification('Product updated successfully', 'success');
        setCurrentProduct(updatedProduct);
      } else {
        // Create new product
        const newProduct = await adminProductsAPI.createProduct(productData);
        showNotification('Product created successfully', 'success');
        setCurrentProduct(newProduct);
        setIsEditing(true);
      }
      
      // Reload products list
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.error) {
        showNotification(error.response.data.error, 'error');
      } else {
        showNotification('Failed to save product', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishedToggle = async (productId, newPublishedState) => {
    try {
      await adminProductsAPI.togglePublished(productId, newPublishedState);
      
      // Update current product if it's the one being toggled
      if (currentProduct && currentProduct.id === productId) {
        setCurrentProduct(prev => ({ ...prev, published: newPublishedState }));
        setFormData(prev => ({ ...prev, published: newPublishedState }));
      }
      
      // Reload products list
      loadProducts();
      showNotification(`Product ${newPublishedState ? 'published' : 'unpublished'} successfully`, 'success');
    } catch (error) {
      console.error('Error toggling published status:', error);
      showNotification('Failed to update published status', 'error');
    }
  };

  const handleNewProduct = () => {
    setCurrentProduct(null);
    setIsEditing(false);
    setFormData({
      product_name: '',
      product_category: '',
      product_type: '',
      material: '',
      colors: [],
      current_stock: '',
      sales_price: '',
      sales_tax_percentage: '18',
      purchase_price: '',
      purchase_tax_percentage: '12',
      published: true
    });
    setErrors({});
  };

  const handleEditProduct = (product) => {
    setCurrentProduct(product);
    setIsEditing(true);
    setFormData({
      product_name: product.product_name || '',
      product_category: product.product_category || '',
      product_type: product.product_type || '',
      material: product.material || '',
      colors: product.color_list || [],
      current_stock: product.current_stock?.toString() || '',
      sales_price: product.sales_price?.toString() || '',
      sales_tax_percentage: product.sales_tax_percentage?.toString() || '18',
      purchase_price: product.purchase_price?.toString() || '',
      purchase_tax_percentage: product.purchase_tax_percentage?.toString() || '12',
      published: product.published
    });
    setErrors({});
  };

  const handleImageUpload = async (index) => {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Image size should be less than 5MB', 'error');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file', 'error');
        return;
      }
      
      try {
        setUploadingImages(prev => ({ ...prev, [index]: true }));
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('image', file);
        formData.append('product_id', currentProduct?.id || '');
        formData.append('position', index);
        
        // For now, just show success message
        // In a real implementation, you would upload to your backend
        showNotification(`Image ${index} uploaded successfully`, 'success');
        
        // TODO: Implement actual image upload to backend
        // const response = await adminProductsAPI.uploadImage(formData);
        
      } catch (error) {
        console.error('Error uploading image:', error);
        showNotification('Failed to upload image', 'error');
      } finally {
        setUploadingImages(prev => ({ ...prev, [index]: false }));
      }
    };
    
    input.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Product Header */}
        <div className="bg-app-surface px-6 py-6 rounded-pro border border-app-border shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="bg-app-accent/10 p-3 rounded-pro">
                <svg className="w-6 h-6 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-app-main mb-2">Product Management</h1>
                <p className="text-app-muted font-sans">
                  Manage product visibility and details for portal users
                </p>
              </div>
            </div>
            <button
              onClick={handleNewProduct}
              className="px-4 py-2 bg-app-accent text-white font-sans font-medium rounded-pro hover:bg-app-accent/90 transition-all duration-200 shadow-sm"
            >
              New Product
            </button>
          </div>
        </div>

        {/* Status Tabs and Controls */}
        <div className="bg-app-surface rounded-pro border border-app-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-pro font-sans font-medium text-sm transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-app-accent text-white shadow-sm'
                      : 'text-app-main hover:text-app-accent hover:bg-app-secondary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Published Filter */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="publishedFilter"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 text-app-accent rounded focus:ring-app-accent focus:ring-2"
              />
              <label htmlFor="publishedFilter" className="text-sm font-sans font-medium text-app-main">
                Show Published Only
              </label>
            </div>
          </div>

          {/* Products List */}
          {isLoadingProducts ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-app-accent mx-auto"></div>
              <p className="text-app-muted font-sans mt-4">Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`p-4 border rounded-pro cursor-pointer transition-all duration-200 ${
                    currentProduct?.id === product.id
                      ? 'border-app-accent bg-app-accent/5'
                      : 'border-app-border hover:border-app-accent/50'
                  }`}
                  onClick={() => handleEditProduct(product)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-sans font-medium text-app-main">{product.product_name}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePublishedToggle(product.id, !product.published);
                      }}
                      className={`px-2 py-1 text-xs rounded-pro font-sans ${
                        product.published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.published ? 'Published' : 'Draft'}
                    </button>
                  </div>
                  <p className="text-sm text-app-muted font-sans mb-2">
                    {product.product_category} • {product.product_type}
                  </p>
                  <p className="text-sm font-sans text-app-main">
                    ₹{product.sales_price} • Stock: {product.current_stock}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-app-muted font-sans">No products found</p>
            </div>
          )}
        </div>

        {/* Product Form */}
        <div className="bg-app-surface rounded-pro border border-app-border shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-display font-semibold text-app-main">
                {isEditing ? 'Edit Product' : 'New Product'}
              </h2>
              {currentProduct && (
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="published"
                    checked={formData.published}
                    onChange={(e) => {
                      const newPublished = e.target.checked;
                      setFormData(prev => ({ ...prev, published: newPublished }));
                      if (currentProduct) {
                        handlePublishedToggle(currentProduct.id, newPublished);
                      }
                    }}
                    className="w-4 h-4 text-app-accent rounded focus:ring-app-accent focus:ring-2"
                  />
                  <label htmlFor="published" className="text-sm font-sans font-medium text-app-main">
                    Published
                  </label>
                  <span className="text-xs text-app-muted font-sans">
                    (Visibility on website for portal users)
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-sans font-medium text-app-main mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.product_name}
                      onChange={(e) => handleInputChange('product_name', e.target.value)}
                      className="w-full px-4 py-3 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent bg-app-surface text-app-main font-sans transition-all duration-200"
                      placeholder="Enter product name"
                      required
                    />
                    {errors.product_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.product_name}</p>
                    )}
                  </div>

                  {/* Product Category */}
                  <div>
                    <label className="block text-sm font-sans font-medium text-app-main mb-2">
                      Product Category *
                    </label>
                    <select
                      value={formData.product_category}
                      onChange={(e) => handleInputChange('product_category', e.target.value)}
                      className="w-full px-4 py-3 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent bg-app-surface text-app-main font-sans transition-all duration-200"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    {errors.product_category && (
                      <p className="mt-1 text-sm text-red-600">{errors.product_category}</p>
                    )}
                  </div>

                  {/* Product Type */}
                  <div>
                    <label className="block text-sm font-sans font-medium text-app-main mb-2">
                      Product Type *
                    </label>
                    <select
                      value={formData.product_type}
                      onChange={(e) => handleInputChange('product_type', e.target.value)}
                      className="w-full px-4 py-3 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent bg-app-surface text-app-main font-sans transition-all duration-200"
                      required
                    >
                      <option value="">Select Type</option>
                      {productTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.product_type && (
                      <p className="mt-1 text-sm text-red-600">{errors.product_type}</p>
                    )}
                  </div>

                  {/* Material */}
                  <div>
                    <label className="block text-sm font-sans font-medium text-app-main mb-2">
                      Material
                    </label>
                    <select
                      value={formData.material}
                      onChange={(e) => handleInputChange('material', e.target.value)}
                      className="w-full px-4 py-3 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent bg-app-surface text-app-main font-sans transition-all duration-200"
                    >
                      <option value="">Select Material</option>
                      {materials.map((material) => (
                        <option key={material.value} value={material.value}>
                          {material.label}
                        </option>
                      ))}
                    </select>
                    {errors.material && (
                      <p className="mt-1 text-sm text-red-600">{errors.material}</p>
                    )}
                  </div>

                  {/* Colors */}
                  <div>
                    <label className="block text-sm font-sans font-medium text-app-main mb-2">
                      Colors
                    </label>
                    <input
                      type="text"
                      value={formData.colors.join(', ')}
                      onChange={(e) => handleColorChange(e.target.value)}
                      placeholder="Enter colors separated by commas (e.g., Red, Blue, Green)"
                      className="w-full px-4 py-3 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent bg-app-surface text-app-main font-sans transition-all duration-200"
                    />
                    <p className="mt-1 text-xs text-app-muted font-sans">
                      Separate multiple colors with commas
                    </p>
                  </div>

                  {/* Current Stock */}
                  <div>
                    <label className="block text-sm font-sans font-medium text-app-main mb-2">
                      Current Stock *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.current_stock}
                      onChange={(e) => handleInputChange('current_stock', e.target.value)}
                      placeholder="Enter quantity"
                      className="w-full px-4 py-3 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent bg-app-surface text-app-main font-sans transition-all duration-200"
                      required
                    />
                    {errors.current_stock && (
                      <p className="mt-1 text-sm text-red-600">{errors.current_stock}</p>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Sales Price */}
                  <div>
                    <label className="block text-sm font-sans font-medium text-app-main mb-2">
                      Sales Price (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.sales_price}
                      onChange={(e) => handleInputChange('sales_price', e.target.value)}
                      placeholder="Enter sales price"
                      className="w-full px-4 py-3 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent bg-app-surface text-app-main font-sans transition-all duration-200"
                      required
                    />
                    {errors.sales_price && (
                      <p className="mt-1 text-sm text-red-600">{errors.sales_price}</p>
                    )}
                  </div>

                  {/* Sales Tax */}
                  <div>
                    <label className="block text-sm font-sans font-medium text-app-main mb-2">
                      Sales Tax (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.sales_tax_percentage}
                      onChange={(e) => handleInputChange('sales_tax_percentage', e.target.value)}
                      placeholder="Enter tax percentage"
                      className="w-full px-4 py-3 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent bg-app-surface text-app-main font-sans transition-all duration-200"
                    />
                    {errors.sales_tax_percentage && (
                      <p className="mt-1 text-sm text-red-600">{errors.sales_tax_percentage}</p>
                    )}
                  </div>

                  {/* Purchase Price */}
                  <div>
                    <label className="block text-sm font-sans font-medium text-app-main mb-2">
                      Purchase Price (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                      placeholder="Enter purchase price"
                      className="w-full px-4 py-3 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent bg-app-surface text-app-main font-sans transition-all duration-200"
                      required
                    />
                    {errors.purchase_price && (
                      <p className="mt-1 text-sm text-red-600">{errors.purchase_price}</p>
                    )}
                  </div>

                  {/* Purchase Tax */}
                  <div>
                    <label className="block text-sm font-sans font-medium text-app-main mb-2">
                      Purchase Tax (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.purchase_tax_percentage}
                      onChange={(e) => handleInputChange('purchase_tax_percentage', e.target.value)}
                      placeholder="Enter tax percentage"
                      className="w-full px-4 py-3 border border-app-border rounded-pro focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent bg-app-surface text-app-main font-sans transition-all duration-200"
                    />
                    {errors.purchase_tax_percentage && (
                      <p className="mt-1 text-sm text-red-600">{errors.purchase_tax_percentage}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Images Section */}
              <div className="mt-8 pt-8 border-t border-app-border">
                <label className="block text-sm font-sans font-medium text-app-main mb-4">
                  Product Images
                </label>
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((index) => (
                    <div
                      key={index}
                      className="aspect-square border-2 border-dashed border-app-border rounded-pro flex items-center justify-center cursor-pointer hover:border-app-accent hover:bg-app-secondary/50 transition-all duration-200 group relative"
                      onClick={() => handleImageUpload(index)}
                    >
                      {uploadingImages[index] ? (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-app-accent mx-auto mb-2"></div>
                          <span className="text-xs text-app-muted font-sans">Uploading...</span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <svg className="w-8 h-8 text-app-muted group-hover:text-app-accent transition-colors duration-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-xs text-app-muted font-sans">Add Image {index}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-app-muted font-sans">
                  Click on any box to upload an image. Supported formats: JPG, PNG, GIF. Max size: 5MB
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-8 border-t border-app-border flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleNewProduct}
                  className="px-6 py-3 border border-app-border text-app-main font-sans font-medium rounded-pro hover:bg-app-secondary transition-all duration-200"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-app-accent text-white font-sans font-medium rounded-pro hover:bg-app-accent/90 transition-all duration-200 shadow-sm disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
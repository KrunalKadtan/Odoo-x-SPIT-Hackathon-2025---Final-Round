import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminProductsAPI } from '../utils/api';
import { useNotification } from '../context/NotificationContext';

const Products = () => {
  const { showNotification } = useNotification();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
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

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await adminProductsAPI.getProducts();
      setProducts(response.results || response);
    } catch (error) {
      console.error('Error loading products:', error);
      showNotification('Failed to load products', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleColorChange = (colors) => {
    setFormData(prev => ({
      ...prev,
      colors: colors.split(',').map(c => c.trim()).filter(c => c)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const productData = {
        ...formData,
        current_stock: parseInt(formData.current_stock),
        sales_price: parseFloat(formData.sales_price),
        purchase_price: parseFloat(formData.purchase_price),
        sales_tax_percentage: parseFloat(formData.sales_tax_percentage || 0),
        purchase_tax_percentage: parseFloat(formData.purchase_tax_percentage || 0)
      };

      if (isEditing && currentProduct) {
        await adminProductsAPI.updateProduct(currentProduct.id, productData);
        showNotification('Product updated successfully', 'success');
      } else {
        const newProduct = await adminProductsAPI.createProduct(productData);
        showNotification('Product created successfully', 'success');
        setCurrentProduct(newProduct);
        setIsEditing(true);
      }
      
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      showNotification('Failed to save product', 'error');
    }
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
  };

  const handleTogglePublished = async (productId, newPublishedState) => {
    try {
      await adminProductsAPI.togglePublished(productId, newPublishedState);
      loadProducts();
      showNotification(`Product ${newPublishedState ? 'published' : 'unpublished'} successfully`, 'success');
    } catch (error) {
      console.error('Error toggling published status:', error);
      showNotification('Failed to update published status', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="card px-6 py-6">
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
            <button onClick={handleNewProduct} className="btn-primary">
              New Product
            </button>
          </div>
        </div>

        {/* Products List */}
        <div className="card p-6">
          <h2 className="text-lg font-display font-semibold text-app-main mb-4">Products</h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="loading-spinner h-8 w-8 mx-auto"></div>
              <p className="text-app-muted font-sans mt-4">Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        handleTogglePublished(product.id, !product.published);
                      }}
                      className={`status-badge ${product.published ? 'published' : 'draft'}`}
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
        <div className="card p-6">
          <h2 className="text-lg font-display font-semibold text-app-main mb-6">
            {isEditing ? 'Edit Product' : 'New Product'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Name */}
              <div>
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={(e) => handleInputChange('product_name', e.target.value)}
                  className="form-input"
                  placeholder="Enter product name"
                  required
                />
              </div>

              {/* Product Category */}
              <div>
                <label className="form-label">Product Category *</label>
                <select
                  value={formData.product_category}
                  onChange={(e) => handleInputChange('product_category', e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Type */}
              <div>
                <label className="form-label">Product Type *</label>
                <select
                  value={formData.product_type}
                  onChange={(e) => handleInputChange('product_type', e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Select Type</option>
                  {productTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Material */}
              <div>
                <label className="form-label">Material</label>
                <select
                  value={formData.material}
                  onChange={(e) => handleInputChange('material', e.target.value)}
                  className="form-input"
                >
                  <option value="">Select Material</option>
                  {materials.map((material) => (
                    <option key={material.value} value={material.value}>
                      {material.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Colors */}
              <div>
                <label className="form-label">Colors</label>
                <input
                  type="text"
                  value={formData.colors.join(', ')}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="Enter colors separated by commas"
                  className="form-input"
                />
              </div>

              {/* Current Stock */}
              <div>
                <label className="form-label">Current Stock *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.current_stock}
                  onChange={(e) => handleInputChange('current_stock', e.target.value)}
                  placeholder="Enter quantity"
                  className="form-input"
                  required
                />
              </div>

              {/* Sales Price */}
              <div>
                <label className="form-label">Sales Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sales_price}
                  onChange={(e) => handleInputChange('sales_price', e.target.value)}
                  placeholder="Enter sales price"
                  className="form-input"
                  required
                />
              </div>

              {/* Purchase Price */}
              <div>
                <label className="form-label">Purchase Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                  placeholder="Enter purchase price"
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* Published Toggle */}
            <div className="mt-6 flex items-center space-x-3">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) => handleInputChange('published', e.target.checked)}
                className="w-4 h-4 text-app-accent rounded focus:ring-app-accent focus:ring-2"
              />
              <label htmlFor="published" className="text-sm font-sans font-medium text-app-main">
                Published (Visible to portal users)
              </label>
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <button type="submit" className="btn-primary">
                {isEditing ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Products;
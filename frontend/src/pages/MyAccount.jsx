import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { tokenUtils, userAPI, invoicesAPI, ordersAPI } from '../utils/api';
import { useNotification } from '../context/NotificationContext';

const MyAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError, showInfo } = useNotification();
  const [userData, setUserData] = useState(null);
  const [activeSection, setActiveSection] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    loadUserProfile();
    if (activeSection === 'orders') {
      loadOrders();
    } else if (activeSection === 'invoices') {
      loadInvoices();
    }
    
    // Handle payment success from payment page
    if (location.state?.paymentSuccess) {
      const { invoiceId, amount, method } = location.state.paymentSuccess;
      
      // Update invoice status to paid
      setInvoices(prevInvoices => 
        prevInvoices.map(inv => 
          inv.id === invoiceId 
            ? { ...inv, status: 'paid', amountDue: 0, paidOn: new Date().toISOString().split('T')[0] }
            : inv
        )
      );
      
      showSuccess(`Payment of ₹${amount} completed successfully via Razorpay!`);
      
      // Clear the state to prevent repeated notifications
      window.history.replaceState({}, document.title);
    }
    
    // Set active section from location state if provided
    if (location.state?.activeSection && location.state.activeSection !== activeSection) {
      setActiveSection(location.state.activeSection);
    }
  }, [activeSection, location.state, showSuccess]);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      if (tokenUtils.isAuthenticated()) {
        const profile = await userAPI.getProfile();
        setUserData(profile);
        setEditForm(profile);
      } else {
        // Fallback to localStorage
        const storedUserData = localStorage.getItem('user_data');
        if (storedUserData) {
          const user = JSON.parse(storedUserData);
          setUserData(user);
          setEditForm(user);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showError('Could not load profile data. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      // Fetch orders from API
      const ordersData = await ordersAPI.getUserOrders();
      
      // Transform API data to match frontend format
      const transformedOrders = ordersData.map(order => ({
        id: order.id,
        orderNumber: `S${String(order.id).padStart(4, '0')}`,
        orderDate: order.order_date,
        status: order.status === 'confirmed' ? 'delivered' : order.status,
        total: order.total_amount,
        items: order.lines.map(line => ({
          id: line.product.id,
          name: line.product.product_name,
          quantity: line.quantity,
          price: line.unit_price,
          image: `https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80` // Placeholder image
        })),
        discount: order.discount_amount > 0 ? {
          type: 'percentage',
          value: Math.round((order.discount_amount / order.subtotal) * 100),
          amount: order.discount_amount,
          code: order.coupon_code || 'DISCOUNT'
        } : null,
        address: {
          name: userData?.name || order.customer_name || 'Customer',
          address: userData?.address || '401, Tower-3 Infocity',
          city: userData?.city || 'Gandhinagar',
          state: userData?.state || 'Gujarat',
          pincode: userData?.pincode || '382421',
          phone: userData?.mobile || '',
          email: userData?.email || order.customer_email
        },
        invoice: order.invoice_info ? {
          number: order.invoice_info.invoice_number,
          date: order.invoice_info.invoice_date,
          status: order.invoice_info.payment_status
        } : {
          number: `INV/${String(order.id).padStart(4, '0')}`,
          date: order.order_date,
          status: 'pending'
        },
        paymentTerms: order.payment_term_name || 'Immediate Payment'
      }));

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      showError('Could not load orders. Please try refreshing the page.');
      
      // Fallback to empty array on error
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadInvoices = async () => {
    setInvoicesLoading(true);
    try {
      // Fetch invoices from API
      const invoicesData = await invoicesAPI.getUserInvoices();
      
      // Transform API data to match frontend format
      const transformedInvoices = invoicesData.map(invoice => ({
        id: invoice.invoice_number,
        invoiceNumber: invoice.invoice_number,
        saleOrder: `S${String(invoice.sale_order).padStart(4, '0')}`,
        invoiceDate: invoice.invoice_date,
        dueDate: invoice.due_date,
        status: invoice.payment_status,
        amountDue: invoice.amount_due,
        total: invoice.total_amount,
        source: `S${String(invoice.sale_order).padStart(4, '0')}`,
        items: [
          {
            id: 1,
            name: 'Product Item', // This would come from order details in a real implementation
            quantity: 1,
            price: invoice.total_amount,
            taxes: '10%',
            amount: invoice.total_amount
          }
        ],
        discount: invoice.amount_due < invoice.total_amount ? {
          type: 'percentage',
          value: 10,
          amount: invoice.total_amount - invoice.amount_due,
          description: 'Discount applied'
        } : null,
        address: {
          name: userData?.name || 'Customer',
          address: userData?.address || '401, Tower-3 Infocity',
          city: userData?.city || 'Gandhinagar',
          state: userData?.state || 'Gujarat',
          pincode: userData?.pincode || '382421',
          email: userData?.email || ''
        },
        paymentTerms: 'Immediate Payment',
        untaxedAmount: Math.round(invoice.total_amount * 0.9),
        taxAmount: Math.round(invoice.total_amount * 0.1),
        paidOn: invoice.payment_status === 'paid' ? invoice.invoice_date : null
      }));

      setInvoices(transformedInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      showError('Could not load invoices. Please try refreshing the page.');
      
      // Fallback to empty array on error
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const getInvoiceStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'waiting_for_payment':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getInvoiceStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'waiting_for_payment':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'overdue':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    // Don't navigate, just show the order details
  };

  const handleBackToOrders = () => {
    setSelectedOrder(null);
    // Stay on the same page, just change the view
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    // Don't navigate, just show the invoice details
  };

  const handleBackToInvoices = () => {
    setSelectedInvoice(null);
    // Stay on the same page, just change the view
  };

  const handlePrintInvoice = (invoice) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const printContent = generateInvoicePrintContent(invoice);
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePaymentAction = (invoice) => {
    if (invoice.status === 'waiting_for_payment') {
      // Navigate to payment page with invoice data
      navigate('/payment', {
        state: { invoice }
      });
    }
  };

  const generateInvoicePrintContent = (invoice) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f2f2f2; }
          .totals { text-align: right; margin-top: 20px; }
          .totals div { margin: 5px 0; }
          .status { padding: 5px 10px; border-radius: 3px; display: inline-block; }
          .status.paid { background-color: #d4edda; color: #155724; }
          .status.waiting { background-color: #cce5ff; color: #004085; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Invoice ${invoice.invoiceNumber}</h1>
        </div>
        
        <div class="invoice-info">
          <div>
            <h3>Invoice Details</h3>
            <p><strong>Invoice Date:</strong> ${formatDate(invoice.invoiceDate)}</p>
            <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
            <p><strong>Source:</strong> ${invoice.source}</p>
            <p><strong>Status:</strong> <span class="status ${invoice.status === 'paid' ? 'paid' : 'waiting'}">${invoice.status.replace('_', ' ').toUpperCase()}</span></p>
          </div>
          <div>
            <h3>Address</h3>
            <p>${invoice.address.name}</p>
            <p>${invoice.address.address}</p>
            <p>${invoice.address.city} - ${invoice.address.pincode}</p>
            <p>${invoice.address.email}</p>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Taxes</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price}</td>
                <td>${item.taxes}</td>
                <td>₹${item.amount}</td>
              </tr>
            `).join('')}
            ${invoice.discount ? `
              <tr>
                <td>${invoice.discount.description}</td>
                <td>1</td>
                <td>-₹${invoice.discount.amount}</td>
                <td></td>
                <td>-₹${invoice.discount.amount}</td>
              </tr>
            ` : ''}
          </tbody>
        </table>

        <div class="totals">
          <div><strong>Untaxed Amount: ₹${invoice.untaxedAmount}</strong></div>
          <div>Tax 10%: ₹${invoice.taxAmount}</div>
          <div><strong>Total: ₹${invoice.total}</strong></div>
          ${invoice.status === 'paid' ? `<div style="color: green;"><strong>Paid on ${formatDate(invoice.paidOn)}</strong></div>` : `<div style="color: red;"><strong>Amount Due: ₹${invoice.amountDue}</strong></div>`}
        </div>

        <div style="margin-top: 30px;">
          <h4>Payment Terms</h4>
          <p>${invoice.paymentTerms}</p>
        </div>
      </body>
      </html>
    `;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'shipped':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePrintOrder = (order) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const printContent = generateOrderPrintContent(order);
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const generateOrderPrintContent = (order) => {
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = order.discount ? order.discount.amount : 0;
    const untaxedAmount = subtotal - discountAmount;
    const taxAmount = Math.round(untaxedAmount * 0.10); // 10% tax
    const total = untaxedAmount + taxAmount;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order ${order.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .order-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f2f2f2; }
          .totals { text-align: right; margin-top: 20px; }
          .totals div { margin: 5px 0; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sale Order ${order.orderNumber}</h1>
          <p>Order Date: ${formatDate(order.orderDate)}</p>
        </div>
        
        <div class="order-info">
          <div>
            <h3>Invoice</h3>
            <p>${order.invoice.number}</p>
            <p>Date: ${formatDate(order.invoice.date)}</p>
            <p>Status: <span style="color: ${order.invoice.status === 'paid' ? 'green' : 'orange'}">${order.invoice.status.toUpperCase()}</span></p>
          </div>
          <div>
            <h3>Address</h3>
            <p>${order.address.name}</p>
            <p>${order.address.address}</p>
            <p>${order.address.city} - ${order.address.pincode}</p>
            <p>${order.address.email}</p>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price}</td>
                <td>₹${item.price * item.quantity}</td>
              </tr>
            `).join('')}
            ${order.discount ? `
              <tr>
                <td>Discount ${order.discount.value}% on your order</td>
                <td>1</td>
                <td>-₹${order.discount.amount}</td>
                <td>-₹${order.discount.amount}</td>
              </tr>
            ` : ''}
          </tbody>
        </table>

        <div class="totals">
          <div><strong>Untaxed Amount: ₹${untaxedAmount}</strong></div>
          <div>Tax 10%: ₹${taxAmount}</div>
          <div><strong>Total: ₹${total}</strong></div>
        </div>

        <div style="margin-top: 30px;">
          <h4>Payment Terms</h4>
          <p>${order.paymentTerms}</p>
        </div>
      </body>
      </html>
    `;
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form
      setEditForm(userData);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format phone number (numbers only, max 10 digits)
    if (name === 'mobile') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 10) return; // Limit to 10 digits
    }

    // Format pincode (numbers only, max 6 digits)
    if (name === 'pincode') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 6) return; // Limit to 6 digits
    }

    setEditForm(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const handleSaveProfile = async () => {
    try {
      // Basic validation
      if (!editForm.name?.trim()) {
        showError('Name is required');
        return;
      }

      // Phone validation (if provided)
      if (editForm.mobile && editForm.mobile.length !== 10) {
        showError('Phone number must be exactly 10 digits');
        return;
      }

      // Pincode validation (if provided)
      if (editForm.pincode && editForm.pincode.length !== 6) {
        showError('Pincode must be exactly 6 digits');
        return;
      }

      showInfo('Updating profile...');
      const updatedProfile = await userAPI.updateProfile(editForm);
      setUserData(updatedProfile);
      localStorage.setItem('user_data', JSON.stringify(updatedProfile));
      setIsEditing(false);
      showSuccess('Profile updated successfully! Your address will now auto-fill during checkout.');
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        showError(`Update failed: ${errorMessages.join(', ')}`);
      } else {
        showError('Could not update profile. Please try again.');
      }
    }
  };

  const renderSidebarItem = (key, icon, title, description) => (
    <button
      key={key}
      onClick={() => {
        setActiveSection(key);
        // Reset selected items when switching sections
        setSelectedOrder(null);
        setSelectedInvoice(null);
        // Load data for the new section
        if (key === 'orders') {
          loadOrders();
        } else if (key === 'invoices') {
          loadInvoices();
        }
      }}
      className={`w-full text-left p-4 rounded-pro border transition-all duration-200 ${
        activeSection === key
          ? 'border-app-accent bg-app-accent/10 text-app-accent'
          : 'border-app-border hover:bg-app-secondary text-app-main'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 flex items-center justify-center rounded ${
          activeSection === key ? 'text-app-accent' : 'text-app-muted'
        }`}>
          {icon}
        </div>
        <div>
          <div className="font-sans font-medium">{title}</div>
          <div className="text-sm text-app-muted">{description}</div>
        </div>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-app-primary">
      <Navigation />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-light text-app-main tracking-tight mb-2">
              My Account
            </h1>
            <p className="text-app-muted font-sans">
              Manage your profile, orders, and account settings
            </p>
          </div>

          {/* User Info Bar */}
          <div className="bg-app-surface rounded-pro border border-app-border p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-app-accent text-white rounded-full flex items-center justify-center font-mono font-medium">
                  {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h2 className="font-sans font-medium text-app-main">
                    {userData?.name || 'User'}
                  </h2>
                  <p className="text-sm text-app-muted">{userData?.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-app-muted">Member since</p>
                <p className="font-sans font-medium text-app-main">
                  {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="space-y-3">
                {renderSidebarItem(
                  'profile',
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>,
                  'User Profile',
                  'Edit your personal information'
                )}
                
                {renderSidebarItem(
                  'orders',
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>,
                  'Your Orders',
                  'View your order history'
                )}
                
                {renderSidebarItem(
                  'invoices',
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>,
                  'Your Invoices',
                  'Download and view invoices'
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="bg-app-surface rounded-pro border border-app-border p-8">
                  <div className="flex items-center justify-center">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 animate-spin text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-app-muted font-sans">Loading account information...</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* User Profile Section */}
                  {activeSection === 'profile' && (
                    <div className="bg-app-surface rounded-pro border border-app-border p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-display text-2xl font-medium text-app-main">
                          User Profile
                        </h3>
                        <button
                          onClick={isEditing ? handleSaveProfile : handleEditToggle}
                          className={`px-4 py-2 rounded-pro font-sans text-sm transition-colors duration-200 ${
                            isEditing
                              ? 'bg-app-accent text-white hover:bg-app-accent/90'
                              : 'border border-app-border text-app-main hover:bg-app-secondary'
                          }`}
                        >
                          {isEditing ? 'Save Changes' : 'Edit Profile'}
                        </button>
                      </div>

                      {isEditing && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-pro">
                          <p className="text-blue-800 font-sans text-sm">
                            You can edit your profile information below. Your address will automatically fill during checkout. Click "Save Changes" to update your details.
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-sans font-medium text-app-main mb-2">
                            Full Name
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="name"
                              value={editForm.name || ''}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                            />
                          ) : (
                            <p className="text-app-main font-sans py-2">{userData?.name || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-sans font-medium text-app-main mb-2">
                            Email Address
                          </label>
                          <p className="text-app-muted font-sans py-2">{userData?.email}</p>
                          <p className="text-xs text-app-muted">Email cannot be changed</p>
                        </div>

                        <div>
                          <label className="block text-sm font-sans font-medium text-app-main mb-2">
                            Phone Number
                          </label>
                          {isEditing ? (
                            <input
                              type="tel"
                              name="mobile"
                              value={editForm.mobile || ''}
                              onChange={handleInputChange}
                              placeholder="Enter 10-digit phone number"
                              className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                            />
                          ) : (
                            <p className="text-app-main font-sans py-2">{userData?.mobile || 'Not provided'}</p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-sans font-medium text-app-main mb-2">
                            Address
                          </label>
                          {isEditing ? (
                            <textarea
                              name="address"
                              value={editForm.address || ''}
                              onChange={handleInputChange}
                              rows="3"
                              placeholder="Enter your complete address"
                              className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                            />
                          ) : (
                            <p className="text-app-main font-sans py-2">{userData?.address || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-sans font-medium text-app-main mb-2">
                            City
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="city"
                              value={editForm.city || ''}
                              onChange={handleInputChange}
                              placeholder="Enter your city"
                              className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                            />
                          ) : (
                            <p className="text-app-main font-sans py-2">{userData?.city || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-sans font-medium text-app-main mb-2">
                            State
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="state"
                              value={editForm.state || ''}
                              onChange={handleInputChange}
                              placeholder="Enter your state"
                              className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                            />
                          ) : (
                            <p className="text-app-main font-sans py-2">{userData?.state || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-sans font-medium text-app-main mb-2">
                            Pincode
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="pincode"
                              value={editForm.pincode || ''}
                              onChange={handleInputChange}
                              placeholder="Enter 6-digit pincode"
                              maxLength="6"
                              className="w-full px-3 py-2 border border-app-border rounded-pro bg-app-primary text-app-main focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
                            />
                          ) : (
                            <p className="text-app-main font-sans py-2">{userData?.pincode || 'Not provided'}</p>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <div className="mt-6 flex space-x-3">
                          <button
                            onClick={handleSaveProfile}
                            className="px-6 py-2 bg-app-accent text-white rounded-pro font-sans text-sm hover:bg-app-accent/90 transition-colors duration-200"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={handleEditToggle}
                            className="px-6 py-2 border border-app-border text-app-main rounded-pro font-sans text-sm hover:bg-app-secondary transition-colors duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Orders Section */}
                  {activeSection === 'orders' && (
                    <div className="bg-app-surface rounded-pro border border-app-border p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-display text-2xl font-medium text-app-main">
                          Your Orders
                        </h3>
                        {orders.length > 0 && (
                          <div className="text-sm text-app-muted">
                            {orders.length} order{orders.length !== 1 ? 's' : ''} found
                          </div>
                        )}
                      </div>

                      {ordersLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="flex items-center space-x-3">
                            <svg className="w-5 h-5 animate-spin text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-app-muted font-sans">Loading your orders...</span>
                          </div>
                        </div>
                      ) : orders.length === 0 ? (
                        <div className="text-center py-12">
                          <svg className="w-16 h-16 mx-auto text-app-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          <h4 className="font-display text-xl text-app-main mb-2">No Orders Yet</h4>
                          <p className="text-app-muted mb-4">You haven't placed any orders yet. Start shopping to see your order history here.</p>
                          <button
                            onClick={() => navigate('/shop')}
                            className="bg-app-accent text-white px-6 py-2 rounded-pro font-mono text-sm tracking-wider hover:bg-app-accent/90 transition-all duration-200"
                          >
                            Start Shopping
                          </button>
                        </div>
                      ) : selectedOrder ? (
                        /* Order Detail View */
                        <div className="space-y-6">
                          {/* Back Button */}
                          <button
                            onClick={handleBackToOrders}
                            className="flex items-center space-x-2 text-app-accent hover:text-app-accent/80 transition-colors duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="font-sans text-sm">Back to Orders</span>
                          </button>

                          {/* Order Header */}
                          <div className="bg-app-secondary rounded-pro p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                              <div>
                                <h4 className="font-display text-2xl font-medium text-app-main mb-2">
                                  Sale Order {selectedOrder.orderNumber}
                                </h4>
                                <p className="text-app-muted font-sans">
                                  Order Date: {formatDate(selectedOrder.orderDate)}
                                </p>
                              </div>
                              <div className="flex items-center space-x-3 mt-4 md:mt-0">
                                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-pro text-xs font-mono tracking-wider border ${getStatusColor(selectedOrder.status)}`}>
                                  {getStatusIcon(selectedOrder.status)}
                                  <span>{selectedOrder.status.toUpperCase()}</span>
                                </span>
                                <button
                                  onClick={() => handlePrintOrder(selectedOrder)}
                                  className="bg-app-accent text-white px-4 py-2 rounded-pro font-sans text-sm hover:bg-app-accent/90 transition-colors duration-200"
                                >
                                  Print
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Invoice Info */}
                              <div>
                                <h5 className="font-sans font-medium text-app-main mb-3">Invoice</h5>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-app-muted">Number:</span>
                                    <span className="text-app-main font-mono">{selectedOrder.invoice.number}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-app-muted">Date:</span>
                                    <span className="text-app-main">{formatDate(selectedOrder.invoice.date)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-app-muted">Status:</span>
                                    <span className={`font-medium ${selectedOrder.invoice.status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                                      {selectedOrder.invoice.status.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Address Info */}
                              <div>
                                <h5 className="font-sans font-medium text-app-main mb-3">Shipping Address</h5>
                                <div className="text-sm text-app-main space-y-1">
                                  <p className="font-medium">{selectedOrder.address.name}</p>
                                  <p>{selectedOrder.address.address}</p>
                                  <p>{selectedOrder.address.city} - {selectedOrder.address.pincode}</p>
                                  <p>{selectedOrder.address.email}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="bg-app-surface border border-app-border rounded-pro overflow-hidden">
                            <div className="px-6 py-4 border-b border-app-border">
                              <h5 className="font-sans font-medium text-app-main">Order Items</h5>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-app-secondary">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-mono tracking-wider text-app-main uppercase">Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-mono tracking-wider text-app-main uppercase">Quantity</th>
                                    <th className="px-6 py-3 text-left text-xs font-mono tracking-wider text-app-main uppercase">Unit Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-mono tracking-wider text-app-main uppercase">Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-app-border">
                                  {selectedOrder.items.map((item, index) => (
                                    <tr key={index} className="hover:bg-app-secondary/50">
                                      <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                          <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-12 h-12 object-cover rounded border border-app-border"
                                          />
                                          <span className="font-sans text-app-main">{item.name}</span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-app-main font-mono">{item.quantity}</td>
                                      <td className="px-6 py-4 text-app-main font-mono">₹{item.price}</td>
                                      <td className="px-6 py-4 text-app-main font-mono">₹{item.price * item.quantity}</td>
                                    </tr>
                                  ))}
                                  {selectedOrder.discount && (
                                    <tr className="hover:bg-app-secondary/50">
                                      <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-12 h-12 bg-green-100 rounded border border-green-200 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                          </div>
                                          <span className="font-sans text-app-main">
                                            Discount {selectedOrder.discount.value}% on your order
                                            {selectedOrder.discount.code && (
                                              <span className="text-xs text-app-muted ml-2">({selectedOrder.discount.code})</span>
                                            )}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-app-main font-mono">1</td>
                                      <td className="px-6 py-4 text-green-600 font-mono">-₹{selectedOrder.discount.amount}</td>
                                      <td className="px-6 py-4 text-green-600 font-mono">-₹{selectedOrder.discount.amount}</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Order Totals */}
                          <div className="bg-app-secondary rounded-pro p-6">
                            <div className="max-w-md ml-auto space-y-3">
                              <div className="flex justify-between text-app-main">
                                <span className="font-sans">Untaxed Amount:</span>
                                <span className="font-mono">₹{selectedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) - (selectedOrder.discount?.amount || 0)}</span>
                              </div>
                              <div className="flex justify-between text-app-main">
                                <span className="font-sans">Tax 10%:</span>
                                <span className="font-mono">₹{Math.round((selectedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) - (selectedOrder.discount?.amount || 0)) * 0.10)}</span>
                              </div>
                              <div className="border-t border-app-border pt-3">
                                <div className="flex justify-between text-lg font-medium text-app-main">
                                  <span className="font-sans">Total:</span>
                                  <span className="font-mono text-app-accent">₹{selectedOrder.total}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Payment Terms */}
                          <div className="bg-app-surface border border-app-border rounded-pro p-6">
                            <h5 className="font-sans font-medium text-app-main mb-3">Payment Terms</h5>
                            <p className="text-app-muted font-sans">{selectedOrder.paymentTerms}</p>
                          </div>
                        </div>
                      ) : (
                        /* Orders List View */
                        <div className="space-y-4">
                          {orders.map((order) => (
                            <div
                              key={order.id}
                              className="bg-app-secondary rounded-pro border border-app-border p-6 hover:shadow-md transition-shadow duration-200"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-4 mb-3">
                                    <h4 className="font-display text-lg font-medium text-app-main">
                                      Sale Order {order.orderNumber}
                                    </h4>
                                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-mono tracking-wider border ${getStatusColor(order.status)}`}>
                                      {getStatusIcon(order.status)}
                                      <span>{order.status.toUpperCase()}</span>
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <span className="text-app-muted font-sans">Order Date:</span>
                                      <p className="text-app-main font-mono">{formatDate(order.orderDate)}</p>
                                    </div>
                                    <div>
                                      <span className="text-app-muted font-sans">Items:</span>
                                      <p className="text-app-main font-sans">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                                    </div>
                                    <div>
                                      <span className="text-app-muted font-sans">Total:</span>
                                      <p className="text-app-accent font-mono font-medium">₹{order.total}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-3 mt-4 md:mt-0">
                                  <button
                                    onClick={() => handleViewOrder(order)}
                                    className="bg-app-accent text-white px-4 py-2 rounded-pro font-sans text-sm hover:bg-app-accent/90 transition-colors duration-200"
                                  >
                                    View Details
                                  </button>
                                  <button
                                    onClick={() => handlePrintOrder(order)}
                                    className="border border-app-border text-app-main px-4 py-2 rounded-pro font-sans text-sm hover:bg-app-secondary transition-colors duration-200"
                                  >
                                    Print
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Invoices Section */}
                  {activeSection === 'invoices' && (
                    <div className="bg-app-surface rounded-pro border border-app-border p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-display text-2xl font-medium text-app-main">
                          Your Invoices
                        </h3>
                        {invoices.length > 0 && (
                          <div className="text-sm text-app-muted">
                            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} found
                          </div>
                        )}
                      </div>

                      {invoicesLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="flex items-center space-x-3">
                            <svg className="w-5 h-5 animate-spin text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-app-muted font-sans">Loading your invoices...</span>
                          </div>
                        </div>
                      ) : invoices.length === 0 ? (
                        <div className="text-center py-12">
                          <svg className="w-16 h-16 mx-auto text-app-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h4 className="font-display text-xl text-app-main mb-2">No Invoices Available</h4>
                          <p className="text-app-muted mb-4">Your invoices will appear here after you complete your first order.</p>
                          <button
                            onClick={() => navigate('/shop')}
                            className="bg-app-accent text-white px-6 py-2 rounded-pro font-mono text-sm tracking-wider hover:bg-app-accent/90 transition-all duration-200"
                          >
                            Start Shopping
                          </button>
                        </div>
                      ) : selectedInvoice ? (
                        /* Invoice Detail View */
                        <div className="space-y-6">
                          {/* Back Button */}
                          <button
                            onClick={handleBackToInvoices}
                            className="flex items-center space-x-2 text-app-accent hover:text-app-accent/80 transition-colors duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="font-sans text-sm">Back to Invoices</span>
                          </button>

                          {/* Invoice Header */}
                          <div className="bg-app-secondary rounded-pro p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                              <div>
                                <h4 className="font-display text-2xl font-medium text-app-main mb-2">
                                  Invoice {selectedInvoice.invoiceNumber}
                                </h4>
                              </div>
                              <div className="flex items-center space-x-3 mt-4 md:mt-0">
                                {selectedInvoice.status === 'waiting_for_payment' && selectedInvoice.amountDue > 0 && (
                                  <button
                                    onClick={() => handlePaymentAction(selectedInvoice)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-pro font-sans text-sm hover:bg-blue-700 transition-colors duration-200"
                                  >
                                    Payment
                                  </button>
                                )}
                                <button
                                  onClick={() => handlePrintInvoice(selectedInvoice)}
                                  className="bg-app-accent text-white px-4 py-2 rounded-pro font-sans text-sm hover:bg-app-accent/90 transition-colors duration-200"
                                >
                                  Print
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Invoice Info */}
                              <div>
                                <div className="space-y-3 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-app-muted">Invoice Date:</span>
                                    <span className="text-app-main">{formatDate(selectedInvoice.invoiceDate)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-app-muted">Due Date:</span>
                                    <span className="text-app-main">{formatDate(selectedInvoice.dueDate)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-app-muted">Source:</span>
                                    <span className="text-app-main font-mono">{selectedInvoice.source}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Address Info */}
                              <div>
                                <h5 className="font-sans font-medium text-app-main mb-3">Address</h5>
                                <div className="text-sm text-app-main space-y-1">
                                  <p className="font-medium">{selectedInvoice.address.name}</p>
                                  <p>{selectedInvoice.address.address}</p>
                                  <p>{selectedInvoice.address.city} - {selectedInvoice.address.pincode}</p>
                                  <p>{selectedInvoice.address.email}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Invoice Items */}
                          <div className="bg-app-surface border border-app-border rounded-pro overflow-hidden">
                            <div className="px-6 py-4 border-b border-app-border">
                              <h5 className="font-sans font-medium text-app-main">Invoice Items</h5>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-app-secondary">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-mono tracking-wider text-app-main uppercase">Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-mono tracking-wider text-app-main uppercase">Quantity</th>
                                    <th className="px-6 py-3 text-left text-xs font-mono tracking-wider text-app-main uppercase">Unit Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-mono tracking-wider text-app-main uppercase">Taxes</th>
                                    <th className="px-6 py-3 text-left text-xs font-mono tracking-wider text-app-main uppercase">Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-app-border">
                                  {selectedInvoice.items.map((item, index) => (
                                    <tr key={index} className="hover:bg-app-secondary/50">
                                      <td className="px-6 py-4 text-app-main font-sans">{item.name}</td>
                                      <td className="px-6 py-4 text-app-main font-mono">{item.quantity}</td>
                                      <td className="px-6 py-4 text-app-main font-mono">₹{item.price}</td>
                                      <td className="px-6 py-4 text-app-main font-mono">{item.taxes}</td>
                                      <td className="px-6 py-4 text-app-main font-mono">₹{item.amount}</td>
                                    </tr>
                                  ))}
                                  {selectedInvoice.discount && (
                                    <tr className="hover:bg-app-secondary/50">
                                      <td className="px-6 py-4 text-app-main font-sans">{selectedInvoice.discount.description}</td>
                                      <td className="px-6 py-4 text-app-main font-mono">1</td>
                                      <td className="px-6 py-4 text-green-600 font-mono">-₹{selectedInvoice.discount.amount}</td>
                                      <td className="px-6 py-4"></td>
                                      <td className="px-6 py-4 text-green-600 font-mono">-₹{selectedInvoice.discount.amount}</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Invoice Totals */}
                          <div className="bg-app-secondary rounded-pro p-6">
                            <div className="max-w-md ml-auto space-y-3">
                              <div className="flex justify-between text-app-main">
                                <span className="font-sans">Untaxed Amount:</span>
                                <span className="font-mono">₹{selectedInvoice.untaxedAmount}</span>
                              </div>
                              <div className="flex justify-between text-app-main">
                                <span className="font-sans">Tax 10%:</span>
                                <span className="font-mono">₹{selectedInvoice.taxAmount}</span>
                              </div>
                              <div className="border-t border-app-border pt-3">
                                <div className="flex justify-between text-lg font-medium text-app-main">
                                  <span className="font-sans">Total:</span>
                                  <span className="font-mono text-app-accent">₹{selectedInvoice.total}</span>
                                </div>
                              </div>
                              {selectedInvoice.status === 'paid' ? (
                                <div className="flex justify-between text-green-600 font-medium">
                                  <span className="font-sans">Paid on {formatDate(selectedInvoice.paidOn)}:</span>
                                  <span className="font-mono">₹{selectedInvoice.total}</span>
                                </div>
                              ) : (
                                <div className="flex justify-between text-red-600 font-medium">
                                  <span className="font-sans">Amount Due:</span>
                                  <span className="font-mono">₹{selectedInvoice.amountDue}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Payment Terms */}
                          <div className="bg-app-surface border border-app-border rounded-pro p-6">
                            <h5 className="font-sans font-medium text-app-main mb-3">Payment Terms</h5>
                            <p className="text-app-muted font-sans">{selectedInvoice.paymentTerms}</p>
                          </div>
                        </div>
                      ) : (
                        /* Invoices List View */
                        <div className="space-y-4">
                          {/* Invoices Table */}
                          <div className="bg-app-surface border border-app-border rounded-pro overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-app-secondary">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-mono tracking-wider text-app-main uppercase">Sale Order</th>
                                    <th className="px-6 py-3 text-left text-xs font-mono tracking-wider text-app-main uppercase">Invoice Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-mono tracking-wider text-app-main uppercase">Due Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-mono tracking-wider text-app-main uppercase">Amount Due</th>
                                    <th className="px-6 py-3 text-left text-xs font-mono tracking-wider text-app-main uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-mono tracking-wider text-app-main uppercase">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-app-border">
                                  {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-app-secondary/50">
                                      <td className="px-6 py-4">
                                        <div className="text-app-main font-mono font-medium">
                                          {invoice.invoiceNumber}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-app-main font-mono">
                                        {formatDate(invoice.invoiceDate)}
                                      </td>
                                      <td className="px-6 py-4 text-app-main font-mono">
                                        {formatDate(invoice.dueDate)}
                                      </td>
                                      <td className="px-6 py-4">
                                        <span className={`font-mono font-medium ${invoice.amountDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                          ₹{invoice.amountDue}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4">
                                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-mono tracking-wider border ${getInvoiceStatusColor(invoice.status)}`}>
                                          {getInvoiceStatusIcon(invoice.status)}
                                          <span>{invoice.status === 'waiting_for_payment' ? 'Waiting for payment' : invoice.status.toUpperCase()}</span>
                                        </span>
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={() => handleViewInvoice(invoice)}
                                            className="bg-app-accent text-white px-3 py-1 rounded text-xs font-sans hover:bg-app-accent/90 transition-colors duration-200"
                                          >
                                            View
                                          </button>
                                          <button
                                            onClick={() => handlePrintInvoice(invoice)}
                                            className="border border-app-border text-app-main px-3 py-1 rounded text-xs font-sans hover:bg-app-secondary transition-colors duration-200"
                                          >
                                            Print
                                          </button>
                                          {invoice.status === 'waiting_for_payment' && invoice.amountDue > 0 && (
                                            <button
                                              onClick={() => handlePaymentAction(invoice)}
                                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-sans hover:bg-blue-700 transition-colors duration-200"
                                            >
                                              Payment
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyAccount;
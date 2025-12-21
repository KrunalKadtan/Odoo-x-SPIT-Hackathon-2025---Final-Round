import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useNotification } from '../context/NotificationContext';
import { tokenUtils, paymentsAPI, ordersAPI, invoicesAPI } from '../utils/api';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError, showInfo } = useNotification();
  
  // Get invoice data from navigation state
  const invoiceData = location.state?.invoice;
  
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    // Razorpay handles all payment method details internally
    // No need to collect card/UPI details in frontend
  });

  useEffect(() => {
    // Redirect if no invoice data or user not authenticated
    if (!invoiceData || !tokenUtils.isAuthenticated()) {
      showError('Invalid payment request. Redirecting...');
      navigate('/my-account');
      return;
    }
  }, [invoiceData, navigate, showError]);

  const handleInputChange = (e) => {
    // Razorpay handles all input collection internally
    // No need for manual form handling
  };

  const validatePayment = () => {
    // Razorpay handles all validation internally
    // Just ensure we have invoice data
    if (!invoiceData || !invoiceData.amountDue || invoiceData.amountDue <= 0) {
      showError('Invalid invoice data for payment processing');
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validatePayment()) return;

    setIsProcessing(true);
    showInfo('Creating payment order... Please wait.');

    try {
      // Create Razorpay order via backend
      const orderData = await paymentsAPI.createPaymentOrder(
        parseInt(invoiceData.id.replace('INV/', '')), // Extract invoice ID from invoice number
        invoiceData.amountDue
      );

      if (paymentMethod === 'razorpay') {
        // Load Razorpay script if not already loaded
        if (!window.Razorpay) {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => processRazorpayPayment(orderData);
          script.onerror = () => {
            // Navigate to order error page for payment gateway loading failure
            navigate('/order-error', {
              state: {
                errorData: {
                  type: 'payment_failed',
                  message: 'Failed to load Razorpay payment gateway. Please try again.',
                  details: 'RAZORPAY_SCRIPT_LOAD_FAILED',
                  orderSummary: {
                    itemCount: 1,
                    total: invoiceData.amountDue,
                    paymentMethod: 'razorpay'
                  }
                }
              }
            });
            
            setIsProcessing(false);
          };
          document.body.appendChild(script);
        } else {
          processRazorpayPayment(orderData);
        }
      }
    } catch (error) {
      console.error('Payment order creation failed:', error);
      
      // Navigate to order error page for payment order creation failure
      navigate('/order-error', {
        state: {
          errorData: {
            type: error.response?.status === 400 ? 'validation_error' : 
                  error.code === 'NETWORK_ERROR' ? 'network_error' : 'server_error',
            message: error.response?.data?.error || 'Failed to create payment order. Please try again.',
            details: error.response?.data?.details || error.code,
            orderSummary: {
              itemCount: 1, // Single invoice payment
              total: invoiceData.amountDue,
              paymentMethod: 'razorpay'
            }
          }
        }
      });
      
      setIsProcessing(false);
    }
  };

  const processRazorpayPayment = (orderData) => {
    const options = {
      key: orderData.razorpay_key,
      amount: orderData.amount * 100, // Amount in paise
      currency: orderData.currency,
      name: 'ApparelDesk',
      description: `Payment for Invoice ${invoiceData.invoiceNumber}`,
      order_id: orderData.razorpay_order_id,
      handler: async function (response) {
        try {
          showInfo('Verifying payment... Please wait.');
          
          // Verify payment with backend
          const verificationResult = await paymentsAPI.verifyPayment(
            orderData.payment_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );

          if (verificationResult.success) {
            showInfo('Payment verified successfully. Updating order and invoice status...');
            
            // Update order and invoice status after successful payment
            await updatePaymentStatus(invoiceData, verificationResult);
            
            showSuccess('Payment completed successfully!');
            
            // Navigate back to invoices with success state
            navigate('/my-account', {
              state: { 
                activeSection: 'invoices',
                paymentSuccess: {
                  invoiceId: invoiceData.id,
                  amount: invoiceData.amountDue,
                  method: 'razorpay'
                }
              }
            });
          } else {
            // Navigate to order error page for payment verification failure
            navigate('/order-error', {
              state: {
                errorData: {
                  type: 'payment_failed',
                  message: 'Payment verification failed. Please contact support.',
                  details: 'PAYMENT_VERIFICATION_FAILED',
                  orderSummary: {
                    itemCount: 1,
                    total: invoiceData.amountDue,
                    paymentMethod: 'razorpay'
                  }
                }
              }
            });
          }
        } catch (error) {
          console.error('Payment verification failed:', error);
          
          // Navigate to order error page for payment verification failure
          navigate('/order-error', {
            state: {
              errorData: {
                type: 'payment_failed',
                message: 'Payment verification failed. Please contact support.',
                details: error.response?.data?.details || 'PAYMENT_VERIFICATION_ERROR',
                orderSummary: {
                  itemCount: 1,
                  total: invoiceData.amountDue,
                  paymentMethod: 'razorpay'
                }
              }
            }
          });
        } finally {
          setIsProcessing(false);
        }
      },
      prefill: {
        name: invoiceData.address?.name || '',
        email: invoiceData.address?.email || '',
        contact: invoiceData.address?.phone || ''
      },
      notes: {
        invoice_id: invoiceData.id,
        payment_for: 'invoice_payment'
      },
      theme: {
        color: '#8B6212' // App accent color
      },
      method: {
        netbanking: true,
        card: true,
        upi: true,
        wallet: true,
        emi: false,
        paylater: false
      },
      modal: {
        ondismiss: function() {
          // Navigate to order error page for payment cancellation
          navigate('/order-error', {
            state: {
              errorData: {
                type: 'payment_failed',
                message: 'Payment was cancelled. You can try again anytime.',
                details: 'PAYMENT_CANCELLED_BY_USER',
                orderSummary: {
                  itemCount: 1,
                  total: invoiceData.amountDue,
                  paymentMethod: 'razorpay'
                }
              }
            }
          });
          
          setIsProcessing(false);
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const handleCancel = () => {
    navigate('/my-account', { state: { activeSection: 'invoices' } });
  };

  const updatePaymentStatus = async (invoiceData, verificationResult) => {
    try {
      // Extract order ID from invoice data
      // The invoice data should have an 'order' field from the CustomerInvoiceSerializer
      const orderId = invoiceData.order || invoiceData.orderId || invoiceData.order_id || invoiceData.sale_order;
      const invoiceId = parseInt(invoiceData.id.replace('INV/', '')); // Extract numeric ID from invoice number
      
      // Update order status to confirmed (if not already confirmed)
      if (orderId) {
        try {
          await ordersAPI.confirmOrder(orderId);
          console.log('Order status updated to confirmed');
        } catch (orderError) {
          // Order might already be confirmed, log but don't fail the payment process
          console.warn('Order confirmation failed (might already be confirmed):', orderError);
        }
      }
      
      // Update invoice status to confirmed (if not already confirmed)
      try {
        await invoicesAPI.confirmInvoice(invoiceId);
        console.log('Invoice status updated to confirmed');
      } catch (invoiceError) {
        // Invoice might already be confirmed, log but don't fail the payment process
        console.warn('Invoice confirmation failed (might already be confirmed):', invoiceError);
      }
      
      // Payment transaction recording is already handled by the verifyPayment API
      console.log('Payment transaction recorded successfully');
      
    } catch (error) {
      // Log error but don't fail the payment process since payment verification succeeded
      console.error('Error updating payment status:', error);
      showError('Payment successful but there was an issue updating order/invoice status. Please contact support if needed.');
    }
  };

  if (!invoiceData) {
    return (
      <div className="min-h-screen bg-app-primary">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="font-display text-2xl text-app-main mb-4">Invalid Payment Request</h1>
            <p className="text-app-muted mb-6">No invoice data found for payment processing.</p>
            <button
              onClick={() => navigate('/my-account')}
              className="bg-app-accent text-white px-6 py-2 rounded-pro font-mono text-sm tracking-wider hover:bg-app-accent/90 transition-all duration-200"
            >
              Back to My Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-primary">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-light text-app-main tracking-tight mb-2">
            Payment
          </h1>
          <p className="text-app-muted font-sans">
            Complete your payment for Invoice {invoiceData.invoiceNumber}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-app-surface rounded-pro border border-app-border p-6">
              <h3 className="font-display text-xl font-medium text-app-main mb-6">
                Payment Method
              </h3>
              
              {/* Payment Method Selection */}
              <div className="mb-6">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`px-6 py-3 rounded-pro font-sans text-sm transition-colors duration-200 ${
                      paymentMethod === 'razorpay'
                        ? 'bg-app-accent text-white'
                        : 'bg-app-secondary text-app-main hover:bg-app-border'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span>Razorpay</span>
                    </div>
                  </button>
                  <div className="text-sm text-app-muted flex items-center">
                    <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Supports Cards, UPI, Net Banking & Wallets
                  </div>
                </div>
              </div>

              {/* Razorpay Payment Info */}
              {paymentMethod === 'razorpay' && (
                <div className="bg-blue-50 border border-blue-200 rounded-pro p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-blue-800 font-sans font-medium mb-2">Secure Payment with Razorpay</h4>
                      <p className="text-blue-700 font-sans text-sm mb-3">
                        Click "Pay Now" to open Razorpay's secure payment gateway where you can choose from:
                      </p>
                      <ul className="text-blue-700 font-sans text-sm space-y-1">
                        <li className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Credit & Debit Cards (Visa, Mastercard, RuPay)
                        </li>
                        <li className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          UPI (Google Pay, PhonePe, Paytm, BHIM)
                        </li>
                        <li className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Net Banking (All major banks)
                        </li>
                        <li className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Digital Wallets (Paytm, Mobikwik, etc.)
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 mt-8">
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className={`flex-1 py-3 rounded-pro font-mono text-sm tracking-widest uppercase transition-all duration-200 ${
                    isProcessing
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-app-accent text-white hover:bg-app-accent/90'
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Pay ₹{invoiceData.amountDue} via Razorpay</span>
                    </div>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isProcessing}
                  className="px-6 py-3 border border-app-border text-app-main rounded-pro font-sans text-sm hover:bg-app-secondary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-app-surface rounded-pro border border-app-border p-6 sticky top-8">
              <h3 className="font-display text-xl font-medium text-app-main mb-6">
                Payment Summary
              </h3>
              
              {/* Invoice Details */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-app-muted">Invoice Number:</span>
                  <span className="text-app-main font-mono">{invoiceData.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-app-muted">Invoice Date:</span>
                  <span className="text-app-main">{new Date(invoiceData.invoiceDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-app-muted">Due Date:</span>
                  <span className="text-app-main">{new Date(invoiceData.dueDate).toLocaleDateString()}</span>
                </div>
              </div>

              <hr className="border-app-border mb-6" />

              {/* Amount Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-app-main font-sans">Invoice Total:</span>
                  <span className="text-app-main font-mono">₹{invoiceData.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-app-main font-sans">Amount Paid:</span>
                  <span className="text-app-main font-mono">₹{invoiceData.total - invoiceData.amountDue}</span>
                </div>
                <hr className="border-app-border" />
                <div className="flex justify-between font-medium text-lg">
                  <span className="text-app-main font-sans">Amount Due:</span>
                  <span className="text-app-accent font-mono">₹{invoiceData.amountDue}</span>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-green-50 border border-green-200 rounded-pro p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <p className="text-green-800 font-sans text-sm font-medium">Secure Payment</p>
                    <p className="text-green-700 font-sans text-sm">
                      Your payment information is encrypted and secure.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
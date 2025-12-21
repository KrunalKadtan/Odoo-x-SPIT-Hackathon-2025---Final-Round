// Simple test to verify OrderConfirmation and OrderError pages are working
// This can be run in the browser console to test navigation

console.log('Testing OrderConfirmation and OrderError pages...');

// Test data for OrderConfirmation
const testOrderData = {
  id: 1,
  lines: [
    {
      product: { product_name: 'Test Product' },
      quantity: 2,
      unit_price: 100,
      line_total: 200
    }
  ],
  subtotal: 200,
  total_amount: 220,
  discount_amount: 0
};

const testAddress = {
  name: 'Test User',
  address: '123 Test Street',
  city: 'Test City',
  pincode: '123456',
  state: 'Test State',
  phone: '1234567890',
  email: 'test@example.com'
};

// Test data for OrderError
const testErrorData = {
  type: 'payment_failed',
  message: 'Test payment failure',
  details: 'TEST_ERROR',
  orderSummary: {
    itemCount: 2,
    total: 220,
    paymentMethod: 'razorpay'
  }
};

// Function to test OrderConfirmation navigation
function testOrderConfirmation() {
  if (window.location.pathname.includes('/cart') || window.location.pathname === '/') {
    console.log('Navigating to OrderConfirmation with test data...');
    window.history.pushState({
      order: testOrderData,
      address: testAddress,
      paymentMethod: 'razorpay',
      paymentSuccess: true,
      paymentId: 'test_payment_123'
    }, '', '/order-confirmation');
    window.location.reload();
  } else {
    console.log('Please navigate to /cart or / first, then run this function');
  }
}

// Function to test OrderError navigation
function testOrderError() {
  if (window.location.pathname.includes('/cart') || window.location.pathname === '/') {
    console.log('Navigating to OrderError with test data...');
    window.history.pushState({
      errorData: testErrorData
    }, '', '/order-error');
    window.location.reload();
  } else {
    console.log('Please navigate to /cart or / first, then run this function');
  }
}

// Make functions available globally
window.testOrderConfirmation = testOrderConfirmation;
window.testOrderError = testOrderError;

console.log('Test functions available:');
console.log('- testOrderConfirmation(): Test the order confirmation page');
console.log('- testOrderError(): Test the order error page');
console.log('Run these functions in the browser console after navigating to the app');
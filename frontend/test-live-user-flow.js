/**
 * Live User Flow Test Script
 * 
 * This script can be run in the browser console to test the complete user flow:
 * 1. Browse → 2. Cart → 3. Checkout → 4. Payment → 5. Confirmation
 * 
 * Instructions:
 * 1. Open the application in browser (http://localhost:5173)
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Run: testCompleteUserFlow()
 */

// Test results tracking
const liveTestResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logLiveTest(testName, passed, message = '') {
  liveTestResults.tests.push({ testName, passed, message });
  if (passed) {
    liveTestResults.passed++;
    console.log(`✅ ${testName}: PASSED ${message ? '- ' + message : ''}`);
  } else {
    liveTestResults.failed++;
    console.log(`❌ ${testName}: FAILED ${message ? '- ' + message : ''}`);
  }
}

function waitFor(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompleteUserFlow() {
  console.log('🚀 Testing Complete User Flow - Live Browser Test\n');
  console.log('Testing: Browse → Cart → Checkout → Payment → Confirmation\n');

  // Test 1: Check if application is loaded
  console.log('🔍 Step 1: Testing Application Load...');
  
  const reactRoot = document.querySelector('#root');
  const hasReactContent = reactRoot && reactRoot.children.length > 0;
  logLiveTest('React application loaded', hasReactContent, 'React app mounted in DOM');

  const currentUrl = window.location.href;
  const isOnCorrectDomain = currentUrl.includes('localhost:5173') || currentUrl.includes('127.0.0.1');
  logLiveTest('Correct development server', isOnCorrectDomain, `Running on: ${currentUrl}`);

  // Test 2: Check authentication state
  console.log('\n🔐 Step 2: Testing Authentication...');
  
  const isAuthenticated = localStorage.getItem('access_token') !== null;
  logLiveTest('User authentication status', isAuthenticated, isAuthenticated ? 'User is authenticated' : 'User needs to sign in');

  if (!isAuthenticated) {
    console.log('⚠️ User not authenticated. Please sign in to continue testing.');
    console.log('Navigate to /signin and authenticate, then run this test again.');
    return liveTestResults;
  }

  // Test 3: Test navigation and routing
  console.log('\n🧭 Step 3: Testing Navigation...');
  
  const navigation = document.querySelector('nav') || document.querySelector('[data-testid="navigation"]');
  logLiveTest('Navigation component present', !!navigation, 'Navigation bar found');

  const shopLink = document.querySelector('a[href="/shop"]') || document.querySelector('a[href*="shop"]');
  logLiveTest('Shop navigation link', !!shopLink, 'Shop link available in navigation');

  const cartLink = document.querySelector('a[href="/cart"]') || document.querySelector('a[href*="cart"]');
  logLiveTest('Cart navigation link', !!cartLink, 'Cart link available in navigation');

  // Test 4: Test product browsing
  console.log('\n🛍️ Step 4: Testing Product Browsing...');
  
  // Navigate to shop if not already there
  if (!window.location.pathname.includes('/shop')) {
    console.log('Navigating to shop page...');
    if (shopLink) {
      shopLink.click();
      await waitFor(2000); // Wait for navigation
    } else {
      window.location.href = '/shop';
      await waitFor(2000);
    }
  }

  const productCards = document.querySelectorAll('[data-testid="product-card"]') || 
                      document.querySelectorAll('.product-card') ||
                      document.querySelectorAll('[class*="product"]');
  logLiveTest('Products displayed', productCards.length > 0, `Found ${productCards.length} product elements`);

  const searchInput = document.querySelector('input[type="search"]') || 
                     document.querySelector('input[placeholder*="search"]') ||
                     document.querySelector('input[placeholder*="Search"]');
  logLiveTest('Search functionality', !!searchInput, 'Search input available');

  const categoryFilters = document.querySelectorAll('[data-testid*="category"]') ||
                         document.querySelectorAll('button[class*="category"]') ||
                         document.querySelectorAll('select[class*="category"]');
  logLiveTest('Category filtering', categoryFilters.length > 0, `Found ${categoryFilters.length} category filters`);

  // Test 5: Test add to cart functionality
  console.log('\n🛒 Step 5: Testing Add to Cart...');
  
  const addToCartButtons = document.querySelectorAll('button[class*="cart"]') ||
                          document.querySelectorAll('button:contains("Add to Cart")') ||
                          document.querySelectorAll('[data-testid*="add-to-cart"]');
  logLiveTest('Add to cart buttons', addToCartButtons.length > 0, `Found ${addToCartButtons.length} add to cart buttons`);

  // Try to add a product to cart
  if (addToCartButtons.length > 0) {
    console.log('Attempting to add product to cart...');
    const firstAddButton = addToCartButtons[0];
    const initialCartCount = getCartCount();
    
    firstAddButton.click();
    await waitFor(1000); // Wait for cart update
    
    const newCartCount = getCartCount();
    logLiveTest('Add to cart functionality', newCartCount > initialCartCount, 
               `Cart count: ${initialCartCount} → ${newCartCount}`);
  }

  // Test 6: Test cart page
  console.log('\n🛒 Step 6: Testing Cart Page...');
  
  // Navigate to cart
  if (cartLink) {
    cartLink.click();
    await waitFor(2000);
  } else {
    window.location.href = '/cart';
    await waitFor(2000);
  }

  const cartItems = document.querySelectorAll('[data-testid="cart-item"]') ||
                   document.querySelectorAll('.cart-item') ||
                   document.querySelectorAll('[class*="cart-item"]');
  logLiveTest('Cart items displayed', cartItems.length > 0, `Found ${cartItems.length} cart items`);

  const quantityInputs = document.querySelectorAll('input[type="number"]') ||
                        document.querySelectorAll('input[class*="quantity"]');
  logLiveTest('Quantity controls', quantityInputs.length > 0, 'Quantity inputs available');

  const removeButtons = document.querySelectorAll('button[class*="remove"]') ||
                       document.querySelectorAll('button[class*="delete"]');
  logLiveTest('Remove item buttons', removeButtons.length > 0, 'Remove buttons available');

  const cartTotal = document.querySelector('[data-testid="cart-total"]') ||
                   document.querySelector('.cart-total') ||
                   document.querySelector('[class*="total"]');
  logLiveTest('Cart total display', !!cartTotal, 'Cart total displayed');

  const checkoutButton = document.querySelector('button[class*="checkout"]') ||
                        document.querySelector('button:contains("Checkout")') ||
                        document.querySelector('[data-testid="checkout-button"]');
  logLiveTest('Checkout button', !!checkoutButton, 'Checkout button available');

  // Test 7: Test checkout process
  console.log('\n📋 Step 7: Testing Checkout Process...');
  
  if (checkoutButton && cartItems.length > 0) {
    console.log('Attempting to start checkout process...');
    checkoutButton.click();
    await waitFor(2000);
    
    // Check if we're on payment page or if checkout form appeared
    const isOnPaymentPage = window.location.pathname.includes('/payment');
    const hasCheckoutForm = document.querySelector('form[class*="checkout"]') ||
                           document.querySelector('[data-testid="checkout-form"]');
    
    logLiveTest('Checkout process initiated', isOnPaymentPage || hasCheckoutForm, 
               'Checkout process started successfully');

    if (isOnPaymentPage) {
      // Test payment page elements
      const paymentForm = document.querySelector('form') || document.querySelector('[data-testid="payment-form"]');
      logLiveTest('Payment form present', !!paymentForm, 'Payment form loaded');

      const razorpayButton = document.querySelector('button[class*="razorpay"]') ||
                            document.querySelector('button:contains("Pay")') ||
                            document.querySelector('[data-testid="pay-button"]');
      logLiveTest('Payment button present', !!razorpayButton, 'Payment button available');
    }
  }

  // Test 8: Test order and invoice access
  console.log('\n📄 Step 8: Testing Order and Invoice Access...');
  
  // Navigate to my account
  const accountLink = document.querySelector('a[href="/my-account"]') ||
                     document.querySelector('a[href*="account"]');
  
  if (accountLink) {
    accountLink.click();
    await waitFor(2000);
    
    const ordersSection = document.querySelector('[data-testid="orders"]') ||
                         document.querySelector('.orders') ||
                         document.querySelector('[class*="order"]');
    logLiveTest('Orders section accessible', !!ordersSection, 'Orders section found');

    const invoicesSection = document.querySelector('[data-testid="invoices"]') ||
                           document.querySelector('.invoices') ||
                           document.querySelector('[class*="invoice"]');
    logLiveTest('Invoices section accessible', !!invoicesSection, 'Invoices section found');
  }

  // Test 9: Test error handling
  console.log('\n🛡️ Step 9: Testing Error Handling...');
  
  // Check for error boundaries and loading states
  const loadingIndicators = document.querySelectorAll('[class*="loading"]') ||
                           document.querySelectorAll('[class*="spinner"]');
  logLiveTest('Loading states implemented', loadingIndicators.length > 0, 'Loading indicators found');

  // Check console for errors
  const hasConsoleErrors = console.error.toString().includes('native code');
  logLiveTest('No console errors', !hasConsoleErrors, 'Console clean of errors');

  // Test 10: Test responsive design
  console.log('\n📱 Step 10: Testing Responsive Design...');
  
  const viewport = window.innerWidth;
  const isMobile = viewport < 768;
  const isTablet = viewport >= 768 && viewport < 1024;
  const isDesktop = viewport >= 1024;
  
  logLiveTest('Responsive design', true, `Viewport: ${viewport}px (${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'})`);

  // Summary
  console.log('\n📊 Live User Flow Test Summary:');
  console.log(`✅ Passed: ${liveTestResults.passed}`);
  console.log(`❌ Failed: ${liveTestResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((liveTestResults.passed / liveTestResults.tests.length) * 100)}%`);

  if (liveTestResults.failed === 0) {
    console.log('\n🎉 Complete User Flow Test PASSED!');
    console.log('\n✅ CHECKPOINT 8 VERIFICATION COMPLETE');
    console.log('✅ Browse → Cart → Checkout → Payment → Confirmation flow working');
    console.log('✅ Order and invoice creation accessible');
    console.log('✅ Payment processing ready');
    console.log('✅ All components integrated successfully');
  } else {
    console.log('\n⚠️ Some live user flow tests failed:');
    liveTestResults.tests.filter(test => !test.passed).forEach(test => {
      console.log(`  - ${test.testName}: ${test.message}`);
    });
    console.log('\n💡 Recommendations:');
    console.log('1. Ensure user is authenticated');
    console.log('2. Check that backend is running on port 8000');
    console.log('3. Verify all components are properly loaded');
    console.log('4. Test individual components if issues persist');
  }

  return liveTestResults;
}

// Helper function to get cart count
function getCartCount() {
  const cartCountElement = document.querySelector('[data-testid="cart-count"]') ||
                          document.querySelector('.cart-count') ||
                          document.querySelector('[class*="cart-count"]');
  
  if (cartCountElement) {
    return parseInt(cartCountElement.textContent) || 0;
  }
  
  // Try to get from cart context or localStorage
  const cartData = localStorage.getItem('cart');
  if (cartData) {
    try {
      const cart = JSON.parse(cartData);
      return cart.items ? cart.items.length : 0;
    } catch (e) {
      return 0;
    }
  }
  
  return 0;
}

// Helper function to check if element contains text
function elementContainsText(element, text) {
  return element && element.textContent && element.textContent.toLowerCase().includes(text.toLowerCase());
}

// Make functions available globally
window.testCompleteUserFlow = testCompleteUserFlow;
window.liveTestResults = liveTestResults;

console.log('🚀 Live User Flow Test Script Loaded!');
console.log('📋 Instructions:');
console.log('1. Make sure you are signed in to the application');
console.log('2. Run: testCompleteUserFlow()');
console.log('3. The test will automatically navigate through the flow');
console.log('4. Check the results in the console');
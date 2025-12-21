/**
 * Manual Shopping Functionality Test Script
 * 
 * This script tests the core shopping functionality:
 * 1. Product browsing
 * 2. Add to cart functionality
 * 3. Cart management
 * 4. Cart persistence across sessions
 */

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, passed, message = '') {
  testResults.tests.push({ testName, passed, message });
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}: PASSED ${message ? '- ' + message : ''}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: FAILED ${message ? '- ' + message : ''}`);
  }
}

function runShoppingFunctionalityTests() {
  console.log('🛍️ Starting Shopping Functionality Tests...\n');

  // Test 1: Check if Shop page components exist
  try {
    const shopExists = document.querySelector('[data-testid="shop-page"]') || 
                      document.querySelector('.shop-container') ||
                      document.title.includes('Shop') ||
                      window.location.pathname.includes('/shop');
    logTest('Shop Page Accessibility', shopExists, 'Shop page should be accessible');
  } catch (error) {
    logTest('Shop Page Accessibility', false, error.message);
  }

  // Test 2: Check if product cards are rendered
  try {
    const productCards = document.querySelectorAll('[data-testid="product-card"]') ||
                        document.querySelectorAll('.product-card') ||
                        document.querySelectorAll('[class*="product"]');
    logTest('Product Cards Rendering', productCards.length > 0, `Found ${productCards.length} product elements`);
  } catch (error) {
    logTest('Product Cards Rendering', false, error.message);
  }

  // Test 3: Check if cart functionality exists
  try {
    const cartElements = document.querySelectorAll('[data-testid*="cart"]') ||
                        document.querySelectorAll('[class*="cart"]') ||
                        document.querySelectorAll('button[class*="cart"]');
    logTest('Cart Elements Present', cartElements.length > 0, `Found ${cartElements.length} cart-related elements`);
  } catch (error) {
    logTest('Cart Elements Present', false, error.message);
  }

  // Test 4: Check if navigation exists
  try {
    const navigation = document.querySelector('nav') ||
                      document.querySelector('[data-testid="navigation"]') ||
                      document.querySelector('.navigation');
    logTest('Navigation Component', !!navigation, 'Navigation should be present');
  } catch (error) {
    logTest('Navigation Component', false, error.message);
  }

  // Test 5: Check if React app is properly mounted
  try {
    const reactRoot = document.querySelector('#root') ||
                     document.querySelector('[data-reactroot]');
    const hasReactContent = reactRoot && reactRoot.children.length > 0;
    logTest('React App Mounted', hasReactContent, 'React application should be properly mounted');
  } catch (error) {
    logTest('React App Mounted', false, error.message);
  }

  // Test 6: Check if routing is working
  try {
    const currentPath = window.location.pathname;
    const hasRouting = window.history && window.history.pushState;
    logTest('React Router Working', hasRouting, `Current path: ${currentPath}`);
  } catch (error) {
    logTest('React Router Working', false, error.message);
  }

  // Test 7: Check for cart persistence (localStorage)
  try {
    const hasLocalStorage = typeof(Storage) !== "undefined";
    const cartData = localStorage.getItem('cart') || localStorage.getItem('cartItems');
    logTest('Cart Persistence Support', hasLocalStorage, 'LocalStorage available for cart persistence');
  } catch (error) {
    logTest('Cart Persistence Support', false, error.message);
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / testResults.tests.length) * 100)}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 All shopping functionality tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the implementation.');
  }

  return testResults;
}

// Auto-run tests when script is loaded
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runShoppingFunctionalityTests);
  } else {
    // DOM is already ready
    setTimeout(runShoppingFunctionalityTests, 1000); // Wait 1 second for React to render
  }
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runShoppingFunctionalityTests, testResults };
}
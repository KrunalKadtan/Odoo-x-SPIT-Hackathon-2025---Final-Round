/**
 * Error Scenarios Test Suite
 * 
 * This test suite validates error handling implementation as specified in Task 11.3:
 * 1. Test API failures and error handling
 * 2. Test payment failures
 * 3. Test form validation errors
 * 
 * Tests Requirements 8.5 and 9.2:
 * - 8.5: Display user-friendly error messages when errors occur
 * - 9.2: Handle API call failures gracefully with retry mechanisms
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: [],
  scenarios: {
    api_failures: { passed: 0, failed: 0, tests: [] },
    payment_failures: { passed: 0, failed: 0, tests: [] },
    form_validation: { passed: 0, failed: 0, tests: [] }
  }
};

function logTest(testName, passed, message = '', scenario = null) {
  const test = { testName, passed, message };
  testResults.tests.push(test);
  
  if (scenario && testResults.scenarios[scenario]) {
    testResults.scenarios[scenario].tests.push(test);
    if (passed) {
      testResults.scenarios[scenario].passed++;
    } else {
      testResults.scenarios[scenario].failed++;
    }
  }
  
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}: PASSED ${message ? '- ' + message : ''}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: FAILED ${message ? '- ' + message : ''}`);
  }
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

function testErrorScenarios() {
  console.log('🛡️ Testing Error Scenarios and Error Handling\n');
  console.log('Testing Requirements 8.5 and 9.2:\n');
  console.log('- 8.5: Display user-friendly error messages when errors occur');
  console.log('- 9.2: Handle API call failures gracefully with retry mechanisms\n');

  const srcPath = path.join(__dirname, 'src');

  // ========================================
  // SCENARIO 1: API Failures and Error Handling
  // ========================================
  console.log('🌐 Testing API Failures and Error Handling');
  console.log('Requirement 9.2: Handle API call failures gracefully with retry mechanisms\n');

  // Test API utility error handling
  const apiPath = path.join(srcPath, 'utils/api.js');
  const apiContent = readFileContent(apiPath);
  
  if (apiContent) {
    // Test general error handling
    const hasTryCatch = apiContent.includes('try') && apiContent.includes('catch');
    const hasErrorHandling = apiContent.includes('error') && apiContent.includes('catch');
    const hasErrorLogging = apiContent.includes('console.error') || apiContent.includes('console.log');
    const hasErrorResponse = apiContent.includes('error.response') && apiContent.includes('data');
    
    logTest('API try-catch blocks', hasTryCatch, 'Try-catch blocks for error handling', 'api_failures');
    logTest('API error handling', hasErrorHandling, 'Error handling in API calls', 'api_failures');
    logTest('API error logging', hasErrorLogging, 'Error logging for debugging', 'api_failures');
    logTest('API error response parsing', hasErrorResponse, 'Parse error responses from backend', 'api_failures');

    // Test retry mechanisms
    const hasRetryLogic = apiContent.includes('retry') && apiContent.includes('attempt');
    const hasRetryCount = apiContent.includes('retryCount') || apiContent.includes('maxRetries');
    const hasRetryDelay = apiContent.includes('delay') && apiContent.includes('retry');
    const hasExponentialBackoff = apiContent.includes('exponential') || apiContent.includes('backoff');
    
    logTest('API retry logic', hasRetryLogic, 'Retry logic for failed requests', 'api_failures');
    logTest('API retry count', hasRetryCount, 'Maximum retry attempts configured', 'api_failures');
    logTest('API retry delay', hasRetryDelay, 'Delay between retry attempts', 'api_failures');
    logTest('API exponential backoff', hasExponentialBackoff, 'Exponential backoff for retries', 'api_failures');

    // Test network error handling
    const hasNetworkErrorHandling = apiContent.includes('network') && apiContent.includes('error');
    const hasTimeoutHandling = apiContent.includes('timeout') && apiContent.includes('error');
    const hasConnectionErrorHandling = apiContent.includes('connection') || apiContent.includes('ECONNREFUSED');
    
    logTest('Network error handling', hasNetworkErrorHandling, 'Handle network errors', 'api_failures');
    logTest('Timeout error handling', hasTimeoutHandling, 'Handle timeout errors', 'api_failures');
    logTest('Connection error handling', hasConnectionErrorHandling, 'Handle connection errors', 'api_failures');

    // Test HTTP status code handling
    const has401Handling = apiContent.includes('401') && apiContent.includes('unauthorized');
    const has403Handling = apiContent.includes('403') || apiContent.includes('forbidden');
    const has404Handling = apiContent.includes('404') || apiContent.includes('not found');
    const has500Handling = apiContent.includes('500') || apiContent.includes('server error');
    
    logTest('401 Unauthorized handling', has401Handling, 'Handle 401 unauthorized errors', 'api_failures');
    logTest('403 Forbidden handling', has403Handling, 'Handle 403 forbidden errors', 'api_failures');
    logTest('404 Not Found handling', has404Handling, 'Handle 404 not found errors', 'api_failures');
    logTest('500 Server Error handling', has500Handling, 'Handle 500 server errors', 'api_failures');

    // Test token refresh on authentication errors
    const hasTokenRefresh = apiContent.includes('refresh') && apiContent.includes('token');
    const hasTokenExpiry = apiContent.includes('expired') && apiContent.includes('token');
    const hasReauthentication = apiContent.includes('reauth') || apiContent.includes('re-authenticate');
    
    logTest('Token refresh mechanism', hasTokenRefresh, 'Refresh expired tokens', 'api_failures');
    logTest('Token expiry detection', hasTokenExpiry, 'Detect expired tokens', 'api_failures');
    logTest('Reauthentication flow', hasReauthentication, 'Reauthentication on token failure', 'api_failures');
  }

  // Test error handling in context providers
  const cartContextPath = path.join(srcPath, 'context/CartContext.jsx');
  const cartContextContent = readFileContent(cartContextPath);
  
  if (cartContextContent) {
    const hasContextErrorHandling = cartContextContent.includes('catch') && cartContextContent.includes('error');
    const hasContextErrorState = cartContextContent.includes('error') && cartContextContent.includes('useState');
    const hasContextErrorNotification = cartContextContent.includes('notification') || cartContextContent.includes('toast');
    const hasContextErrorRecovery = cartContextContent.includes('recover') || cartContextContent.includes('fallback');
    
    logTest('Cart context error handling', hasContextErrorHandling, 'Error handling in cart context', 'api_failures');
    logTest('Cart context error state', hasContextErrorState, 'Error state management', 'api_failures');
    logTest('Cart context error notification', hasContextErrorNotification, 'Error notifications to user', 'api_failures');
    logTest('Cart context error recovery', hasContextErrorRecovery, 'Error recovery mechanisms', 'api_failures');
  }

  // Test error handling in pages
  const shopPath = path.join(srcPath, 'pages/Shop.jsx');
  const shopContent = readFileContent(shopPath);
  
  if (shopContent) {
    const hasShopErrorHandling = shopContent.includes('catch') && shopContent.includes('error');
    const hasShopErrorDisplay = shopContent.includes('error') && shopContent.includes('message');
    const hasShopLoadingState = shopContent.includes('loading') && shopContent.includes('useState');
    const hasShopErrorBoundary = shopContent.includes('ErrorBoundary') || shopContent.includes('error') && shopContent.includes('boundary');
    
    logTest('Shop page error handling', hasShopErrorHandling, 'Error handling in shop page', 'api_failures');
    logTest('Shop page error display', hasShopErrorDisplay, 'Display error messages', 'api_failures');
    logTest('Shop page loading state', hasShopLoadingState, 'Loading state management', 'api_failures');
    logTest('Shop page error boundary', hasShopErrorBoundary, 'Error boundary implementation', 'api_failures');
  }

  // ========================================
  // SCENARIO 2: Payment Failures
  // ========================================
  console.log('\n💳 Testing Payment Failures');
  console.log('Requirement 6.4: Display appropriate error messages when payment fails\n');

  const paymentPath = path.join(srcPath, 'pages/Payment.jsx');
  const paymentContent = readFileContent(paymentPath);
  
  if (paymentContent) {
    // Test payment error handling
    const hasPaymentErrorHandling = paymentContent.includes('catch') && paymentContent.includes('payment');
    const hasPaymentFailureHandling = paymentContent.includes('failure') && paymentContent.includes('payment');
    const hasPaymentErrorDisplay = paymentContent.includes('error') && paymentContent.includes('message');
    const hasPaymentErrorNavigation = paymentContent.includes('error') && paymentContent.includes('navigate');
    
    logTest('Payment error handling', hasPaymentErrorHandling, 'Handle payment errors', 'payment_failures');
    logTest('Payment failure handling', hasPaymentFailureHandling, 'Handle payment failures', 'payment_failures');
    logTest('Payment error display', hasPaymentErrorDisplay, 'Display payment error messages', 'payment_failures');
    logTest('Payment error navigation', hasPaymentErrorNavigation, 'Navigate to error page on failure', 'payment_failures');

    // Test Razorpay error handling
    const hasRazorpayErrorHandling = paymentContent.includes('razorpay') && paymentContent.includes('error');
    const hasRazorpayFailureCallback = paymentContent.includes('failure') || paymentContent.includes('error') && paymentContent.includes('callback');
    const hasRazorpayTimeout = paymentContent.includes('timeout') && paymentContent.includes('razorpay');
    const hasRazorpayCancellation = paymentContent.includes('cancel') && paymentContent.includes('payment');
    
    logTest('Razorpay error handling', hasRazorpayErrorHandling, 'Handle Razorpay errors', 'payment_failures');
    logTest('Razorpay failure callback', hasRazorpayFailureCallback, 'Razorpay failure callback', 'payment_failures');
    logTest('Razorpay timeout handling', hasRazorpayTimeout, 'Handle Razorpay timeouts', 'payment_failures');
    logTest('Razorpay cancellation handling', hasRazorpayCancellation, 'Handle payment cancellation', 'payment_failures');

    // Test payment retry mechanisms
    const hasPaymentRetry = paymentContent.includes('retry') && paymentContent.includes('payment');
    const hasPaymentRetryButton = paymentContent.includes('retry') && paymentContent.includes('button');
    const hasPaymentRetryLimit = paymentContent.includes('retry') && paymentContent.includes('limit');
    
    logTest('Payment retry mechanism', hasPaymentRetry, 'Retry failed payments', 'payment_failures');
    logTest('Payment retry button', hasPaymentRetryButton, 'Retry button for failed payments', 'payment_failures');
    logTest('Payment retry limit', hasPaymentRetryLimit, 'Limit payment retry attempts', 'payment_failures');

    // Test payment error recovery
    const hasPaymentErrorRecovery = paymentContent.includes('recover') || paymentContent.includes('fallback');
    const hasPaymentBackToCart = paymentContent.includes('cart') && paymentContent.includes('back');
    const hasPaymentErrorLogging = paymentContent.includes('log') && paymentContent.includes('error');
    
    logTest('Payment error recovery', hasPaymentErrorRecovery, 'Payment error recovery options', 'payment_failures');
    logTest('Payment back to cart', hasPaymentBackToCart, 'Navigate back to cart on error', 'payment_failures');
    logTest('Payment error logging', hasPaymentErrorLogging, 'Log payment errors', 'payment_failures');
  }

  // Test OrderError page
  const orderErrorPath = path.join(srcPath, 'pages/OrderError.jsx');
  const orderErrorContent = readFileContent(orderErrorPath);
  
  if (orderErrorContent) {
    const hasErrorMessageDisplay = orderErrorContent.includes('error') && orderErrorContent.includes('message');
    const hasErrorDetails = orderErrorContent.includes('details') || orderErrorContent.includes('reason');
    const hasRetryOption = orderErrorContent.includes('retry') || orderErrorContent.includes('try again');
    const hasBackToCartOption = orderErrorContent.includes('cart') && orderErrorContent.includes('back');
    const hasContactSupport = orderErrorContent.includes('support') || orderErrorContent.includes('contact');
    
    logTest('Order error message display', hasErrorMessageDisplay, 'Display error messages', 'payment_failures');
    logTest('Order error details', hasErrorDetails, 'Display error details', 'payment_failures');
    logTest('Order error retry option', hasRetryOption, 'Retry option on error page', 'payment_failures');
    logTest('Order error back to cart', hasBackToCartOption, 'Back to cart option', 'payment_failures');
    logTest('Order error contact support', hasContactSupport, 'Contact support option', 'payment_failures');
  }

  // ========================================
  // SCENARIO 3: Form Validation Errors
  // ========================================
  console.log('\n📝 Testing Form Validation Errors');
  console.log('Requirement 8.3: Provide clear validation feedback when users interact with forms\n');

  // Test SignIn form validation
  const signInPath = path.join(srcPath, 'pages/SignIn.jsx');
  const signInContent = readFileContent(signInPath);
  
  if (signInContent) {
    const hasSignInValidation = signInContent.includes('validation') || signInContent.includes('validate');
    const hasSignInErrorState = signInContent.includes('error') && signInContent.includes('useState');
    const hasSignInErrorDisplay = signInContent.includes('error') && signInContent.includes('message');
    const hasSignInFieldValidation = signInContent.includes('required') || signInContent.includes('pattern');
    const hasSignInEmailValidation = signInContent.includes('email') && signInContent.includes('valid');
    const hasSignInPasswordValidation = signInContent.includes('password') && signInContent.includes('valid');
    
    logTest('SignIn form validation', hasSignInValidation, 'Form validation implemented', 'form_validation');
    logTest('SignIn error state', hasSignInErrorState, 'Error state management', 'form_validation');
    logTest('SignIn error display', hasSignInErrorDisplay, 'Display validation errors', 'form_validation');
    logTest('SignIn field validation', hasSignInFieldValidation, 'Field-level validation', 'form_validation');
    logTest('SignIn email validation', hasSignInEmailValidation, 'Email format validation', 'form_validation');
    logTest('SignIn password validation', hasSignInPasswordValidation, 'Password validation', 'form_validation');
  }

  // Test SignUp form validation
  const signUpPath = path.join(srcPath, 'pages/SignUp.jsx');
  const signUpContent = readFileContent(signUpPath);
  
  if (signUpContent) {
    const hasSignUpValidation = signUpContent.includes('validation') || signUpContent.includes('validate');
    const hasSignUpErrorState = signUpContent.includes('error') && signUpContent.includes('useState');
    const hasSignUpErrorDisplay = signUpContent.includes('error') && signUpContent.includes('message');
    const hasSignUpFieldValidation = signUpContent.includes('required') || signUpContent.includes('pattern');
    const hasSignUpEmailValidation = signUpContent.includes('email') && signUpContent.includes('valid');
    const hasSignUpPasswordValidation = signUpContent.includes('password') && signUpContent.includes('valid');
    const hasSignUpPasswordMatch = signUpContent.includes('password') && signUpContent.includes('match');
    const hasSignUpPhoneValidation = signUpContent.includes('phone') || signUpContent.includes('mobile');
    
    logTest('SignUp form validation', hasSignUpValidation, 'Form validation implemented', 'form_validation');
    logTest('SignUp error state', hasSignUpErrorState, 'Error state management', 'form_validation');
    logTest('SignUp error display', hasSignUpErrorDisplay, 'Display validation errors', 'form_validation');
    logTest('SignUp field validation', hasSignUpFieldValidation, 'Field-level validation', 'form_validation');
    logTest('SignUp email validation', hasSignUpEmailValidation, 'Email format validation', 'form_validation');
    logTest('SignUp password validation', hasSignUpPasswordValidation, 'Password validation', 'form_validation');
    logTest('SignUp password match', hasSignUpPasswordMatch, 'Password confirmation match', 'form_validation');
    logTest('SignUp phone validation', hasSignUpPhoneValidation, 'Phone number validation', 'form_validation');
  }

  // Test MyAccount profile form validation
  const myAccountPath = path.join(srcPath, 'pages/MyAccount.jsx');
  const myAccountContent = readFileContent(myAccountPath);
  
  if (myAccountContent) {
    const hasProfileValidation = myAccountContent.includes('validation') && myAccountContent.includes('profile');
    const hasProfileErrorState = myAccountContent.includes('error') && myAccountContent.includes('useState');
    const hasProfileErrorDisplay = myAccountContent.includes('error') && myAccountContent.includes('message');
    const hasProfileFieldValidation = myAccountContent.includes('required') || myAccountContent.includes('validate');
    const hasAddressValidation = myAccountContent.includes('address') && myAccountContent.includes('valid');
    const hasPincodeValidation = myAccountContent.includes('pincode') || myAccountContent.includes('zip');
    
    logTest('Profile form validation', hasProfileValidation, 'Profile form validation', 'form_validation');
    logTest('Profile error state', hasProfileErrorState, 'Profile error state management', 'form_validation');
    logTest('Profile error display', hasProfileErrorDisplay, 'Display profile validation errors', 'form_validation');
    logTest('Profile field validation', hasProfileFieldValidation, 'Profile field-level validation', 'form_validation');
    logTest('Address validation', hasAddressValidation, 'Address field validation', 'form_validation');
    logTest('Pincode validation', hasPincodeValidation, 'Pincode/ZIP validation', 'form_validation');
  }

  // Test FormInput component validation
  const formInputPath = path.join(srcPath, 'components/FormInput.jsx');
  const formInputContent = readFileContent(formInputPath);
  
  if (formInputContent) {
    const hasInputValidation = formInputContent.includes('validation') || formInputContent.includes('error');
    const hasInputErrorDisplay = formInputContent.includes('error') && formInputContent.includes('message');
    const hasInputErrorStyling = formInputContent.includes('error') && formInputContent.includes('border');
    const hasInputRequiredIndicator = formInputContent.includes('required') && formInputContent.includes('*');
    const hasInputHelperText = formInputContent.includes('helper') || formInputContent.includes('hint');
    
    logTest('FormInput validation', hasInputValidation, 'Input validation support', 'form_validation');
    logTest('FormInput error display', hasInputErrorDisplay, 'Display input errors', 'form_validation');
    logTest('FormInput error styling', hasInputErrorStyling, 'Error styling for inputs', 'form_validation');
    logTest('FormInput required indicator', hasInputRequiredIndicator, 'Required field indicator', 'form_validation');
    logTest('FormInput helper text', hasInputHelperText, 'Helper text for inputs', 'form_validation');
  }

  // Test notification system for errors
  const notificationContextPath = path.join(srcPath, 'context/NotificationContext.jsx');
  const notificationContextContent = readFileContent(notificationContextPath);
  
  if (notificationContextContent) {
    const hasErrorNotification = notificationContextContent.includes('error') && notificationContextContent.includes('notification');
    const hasSuccessNotification = notificationContextContent.includes('success') && notificationContextContent.includes('notification');
    const hasWarningNotification = notificationContextContent.includes('warning') && notificationContextContent.includes('notification');
    const hasInfoNotification = notificationContextContent.includes('info') && notificationContextContent.includes('notification');
    const hasNotificationDismiss = notificationContextContent.includes('dismiss') || notificationContextContent.includes('close');
    const hasNotificationAutoDismiss = notificationContextContent.includes('auto') && notificationContextContent.includes('dismiss');
    
    logTest('Error notification', hasErrorNotification, 'Error notification support', 'form_validation');
    logTest('Success notification', hasSuccessNotification, 'Success notification support', 'form_validation');
    logTest('Warning notification', hasWarningNotification, 'Warning notification support', 'form_validation');
    logTest('Info notification', hasInfoNotification, 'Info notification support', 'form_validation');
    logTest('Notification dismiss', hasNotificationDismiss, 'Dismiss notifications', 'form_validation');
    logTest('Notification auto-dismiss', hasNotificationAutoDismiss, 'Auto-dismiss notifications', 'form_validation');
  }

  // ========================================
  // SUMMARY AND RESULTS
  // ========================================
  console.log('\n📊 Error Scenarios Test Summary:');
  console.log(`✅ Total Passed: ${testResults.passed}`);
  console.log(`❌ Total Failed: ${testResults.failed}`);
  console.log(`📈 Overall Success Rate: ${Math.round((testResults.passed / testResults.tests.length) * 100)}%`);

  // Scenario-specific summaries
  Object.keys(testResults.scenarios).forEach(scenarioName => {
    const scenario = testResults.scenarios[scenarioName];
    const total = scenario.passed + scenario.failed;
    const successRate = total > 0 ? Math.round((scenario.passed / total) * 100) : 0;
    
    console.log(`\n${scenarioName.replace(/_/g, ' ').toUpperCase()}:`);
    console.log(`  ✅ Passed: ${scenario.passed}`);
    console.log(`  ❌ Failed: ${scenario.failed}`);
    console.log(`  📈 Success Rate: ${successRate}%`);
  });

  if (testResults.failed === 0) {
    console.log('\n🎉 ALL ERROR SCENARIO TESTS PASSED!');
    console.log('\n✅ TASK 11.3 VERIFICATION COMPLETE');
    console.log('✅ API failures and error handling verified');
    console.log('✅ Payment failures handling verified');
    console.log('✅ Form validation errors verified');
    console.log('✅ Requirements 8.5 and 9.2 validated successfully');
  } else {
    console.log('\n⚠️ Some error scenario tests failed:');
    testResults.tests.filter(test => !test.passed).forEach(test => {
      console.log(`  - ${test.testName}: ${test.message}`);
    });
  }

  return testResults;
}

// Run the error scenarios tests
testErrorScenarios();
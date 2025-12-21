/**
 * Manual Verification Script for Role-Based Login Redirect System
 * 
 * This script performs manual verification of the integration between
 * all services and components in the role-based login redirect system.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(name, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const statusColor = passed ? colors.green : colors.red;
  
  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  log(`${status} - ${name}`, statusColor);
  if (message) {
    log(`   ${message}`, colors.cyan);
  }
}

function logWarning(name, message) {
  results.warnings++;
  results.tests.push({ name, passed: true, message, warning: true });
  log(`⚠️  WARN - ${name}`, colors.yellow);
  log(`   ${message}`, colors.cyan);
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function checkFileContent(filePath, patterns, description) {
  const content = readFile(filePath);
  if (!content) {
    logTest(`${description} - File readable`, false, `Could not read ${filePath}`);
    return false;
  }
  
  let allPassed = true;
  patterns.forEach(({ pattern, name, required = true }) => {
    const found = pattern.test(content);
    if (required) {
      logTest(`${description} - ${name}`, found, found ? 'Found' : 'Missing');
      if (!found) allPassed = false;
    } else if (!found) {
      logWarning(`${description} - ${name}`, 'Optional feature not found');
    }
  });
  
  return allPassed;
}

// Main verification function
function verifyRoleBasedRedirectSystem() {
  log('\n' + '='.repeat(70), colors.blue);
  log('🔍 ROLE-BASED LOGIN REDIRECT SYSTEM VERIFICATION', colors.blue);
  log('='.repeat(70) + '\n', colors.blue);

  const srcPath = path.join(__dirname, 'src');

  // 1. Verify Service Files Exist
  log('\n📁 Checking Service Files...', colors.cyan);
  const serviceFiles = [
    'services/roleDetectionService.js',
    'services/redirectManager.js',
    'services/securityValidator.js'
  ];

  serviceFiles.forEach(file => {
    const filePath = path.join(srcPath, file);
    const exists = fileExists(filePath);
    logTest(`Service file: ${file}`, exists, exists ? 'File exists' : 'File missing');
  });

  // 2. Verify Role Detection Service Implementation
  log('\n🔍 Checking Role Detection Service...', colors.cyan);
  const roleDetectionPath = path.join(srcPath, 'services/roleDetectionService.js');
  checkFileContent(roleDetectionPath, [
    { pattern: /detectRole.*async/, name: 'detectRole method' },
    { pattern: /extractRoleFromProfile/, name: 'extractRoleFromProfile method' },
    { pattern: /extractRoleFromToken/, name: 'extractRoleFromToken method' },
    { pattern: /validateRole/, name: 'validateRole method' },
    { pattern: /cacheRole/, name: 'cacheRole method' },
    { pattern: /getCachedRole/, name: 'getCachedRole method' },
    { pattern: /resolveRoleConflict/, name: 'resolveRoleConflict method' },
    { pattern: /internal.*customer.*vendor/, name: 'Valid roles defined' },
    { pattern: /localStorage/, name: 'Cache implementation' }
  ], 'Role Detection Service');

  // 3. Verify Redirect Manager Implementation
  log('\n🔍 Checking Redirect Manager...', colors.cyan);
  const redirectManagerPath = path.join(srcPath, 'services/redirectManager.js');
  checkFileContent(redirectManagerPath, [
    { pattern: /determineRedirectUrl/, name: 'determineRedirectUrl method' },
    { pattern: /validateReturnUrl/, name: 'validateReturnUrl method' },
    { pattern: /getDefaultRouteForRole/, name: 'getDefaultRouteForRole method' },
    { pattern: /sanitizeUrl/, name: 'sanitizeUrl method' },
    { pattern: /isAdminRoute/, name: 'isAdminRoute method' },
    { pattern: /validateDomain/, name: 'validateDomain method' },
    { pattern: /\/admin\/dashboard/, name: 'Admin route mapping' },
    { pattern: /ROLE_ROUTES/, name: 'Role routes configuration' },
    { pattern: /ADMIN_ROUTE_PATTERNS/, name: 'Admin route patterns' }
  ], 'Redirect Manager');

  // 4. Verify Security Validator Implementation
  log('\n🔍 Checking Security Validator...', colors.cyan);
  const securityValidatorPath = path.join(srcPath, 'services/securityValidator.js');
  checkFileContent(securityValidatorPath, [
    { pattern: /validateDomain/, name: 'validateDomain method' },
    { pattern: /sanitizeUrlParameters/, name: 'sanitizeUrlParameters method' },
    { pattern: /checkAdminAccess/, name: 'checkAdminAccess method' },
    { pattern: /logSecurityEvent/, name: 'logSecurityEvent method' },
    { pattern: /detectSuspiciousActivity/, name: 'detectSuspiciousActivity method' },
    { pattern: /validateAndSanitizeUrl/, name: 'validateAndSanitizeUrl method' },
    { pattern: /MALICIOUS_URL_PATTERNS/, name: 'Malicious URL patterns' },
    { pattern: /javascript:|data:|vbscript:/, name: 'XSS prevention patterns' },
    { pattern: /suspiciousActivityTracker/, name: 'Suspicious activity tracking' }
  ], 'Security Validator');

  // 5. Verify SignIn Component Integration
  log('\n🔍 Checking SignIn Component Integration...', colors.cyan);
  const signInPath = path.join(srcPath, 'pages/SignIn.jsx');
  checkFileContent(signInPath, [
    { pattern: /import.*roleDetectionService/, name: 'Role detection service import' },
    { pattern: /import.*redirectManager/, name: 'Redirect manager import' },
    { pattern: /import.*securityValidator/, name: 'Security validator import' },
    { pattern: /roleDetectionService\.detectRole/, name: 'Role detection usage' },
    { pattern: /redirectManager\.determineRedirectUrl/, name: 'Redirect determination usage' },
    { pattern: /securityValidator\.validateAndSanitizeUrl/, name: 'Security validation usage' },
    { pattern: /returnUrl.*searchParams/, name: 'Return URL parameter handling' },
    { pattern: /navigate.*replace/, name: 'Navigation implementation' },
    { pattern: /auditLogger/, name: 'Audit logging' }
  ], 'SignIn Component');

  // 6. Verify AdminRoute Component Integration
  log('\n🔍 Checking AdminRoute Component Integration...', colors.cyan);
  const adminRoutePath = path.join(srcPath, 'components/AdminRoute.jsx');
  checkFileContent(adminRoutePath, [
    { pattern: /import.*securityValidator/, name: 'Security validator import' },
    { pattern: /returnUrl.*encodeURIComponent/, name: 'Return URL capture' },
    { pattern: /securityValidator\.logSecurityEvent/, name: 'Security event logging' },
    { pattern: /securityValidator\.detectSuspiciousActivity/, name: 'Suspicious activity detection' },
    { pattern: /SECURITY_EVENT_TYPES/, name: 'Security event types usage' },
    { pattern: /SECURITY_SEVERITY/, name: 'Security severity levels usage' },
    { pattern: /Navigate.*signin\?returnUrl/, name: 'Redirect with return URL' }
  ], 'AdminRoute Component');

  // 7. Verify App.jsx Routing Integration
  log('\n🔍 Checking App.jsx Routing Integration...', colors.cyan);
  const appPath = path.join(srcPath, 'App.jsx');
  checkFileContent(appPath, [
    { pattern: /returnUrlUtils/, name: 'Return URL utilities import' },
    { pattern: /PublicRoute/, name: 'PublicRoute component' },
    { pattern: /ProtectedRoute/, name: 'ProtectedRoute component' },
    { pattern: /returnUrl.*searchParams/, name: 'Return URL parameter handling' },
    { pattern: /captureReturnUrl/, name: 'Return URL capture' },
    { pattern: /validateReturnUrl/, name: 'Return URL validation' },
    { pattern: /pending_return_url/, name: 'Return URL storage' }
  ], 'App.jsx Routing');

  // 8. Verify API Utilities Integration
  log('\n🔍 Checking API Utilities Integration...', colors.cyan);
  const apiPath = path.join(srcPath, 'utils/api.js');
  checkFileContent(apiPath, [
    { pattern: /returnUrlUtils/, name: 'Return URL utilities' },
    { pattern: /profileUtils/, name: 'Profile utilities' },
    { pattern: /auditLogger/, name: 'Audit logger' },
    { pattern: /fetchProfileWithRetry/, name: 'Profile fetch with retry' },
    { pattern: /extractRoleFromProfile/, name: 'Role extraction from profile' },
    { pattern: /extractRoleFromToken/, name: 'Role extraction from token' },
    { pattern: /logSuccessfulRedirect/, name: 'Successful redirect logging' },
    { pattern: /logRoleDetectionFailure/, name: 'Role detection failure logging' },
    { pattern: /logReturnUrlValidationFailure/, name: 'Return URL validation failure logging' }
  ], 'API Utilities');

  // 9. Verify Test Files
  log('\n🔍 Checking Test Files...', colors.cyan);
  const testFiles = [
    'tests/integration/roleBasedRedirect.test.js',
    'tests/testRunner.js'
  ];

  testFiles.forEach(file => {
    const filePath = path.join(srcPath, file);
    const exists = fileExists(filePath);
    logTest(`Test file: ${file}`, exists, exists ? 'File exists' : 'File missing');
  });

  // 10. Verify Integration Points
  log('\n🔍 Checking Integration Points...', colors.cyan);
  
  // Check if SignIn uses all three services
  const signInContent = readFile(signInPath);
  if (signInContent) {
    const hasAllServices = 
      signInContent.includes('roleDetectionService') &&
      signInContent.includes('redirectManager') &&
      signInContent.includes('securityValidator');
    
    logTest('SignIn integrates all services', hasAllServices, 
      hasAllServices ? 'All services integrated' : 'Missing service integration');
    
    const hasCompleteFlow = 
      signInContent.includes('detectRole') &&
      signInContent.includes('determineRedirectUrl') &&
      signInContent.includes('validateAndSanitizeUrl');
    
    logTest('SignIn implements complete flow', hasCompleteFlow,
      hasCompleteFlow ? 'Complete flow implemented' : 'Incomplete flow');
  }

  // Check if AdminRoute captures return URLs
  const adminRouteContent = readFile(adminRoutePath);
  if (adminRouteContent) {
    const capturesReturnUrl = 
      adminRouteContent.includes('returnUrl') &&
      adminRouteContent.includes('encodeURIComponent');
    
    logTest('AdminRoute captures return URLs', capturesReturnUrl,
      capturesReturnUrl ? 'Return URL capture implemented' : 'Missing return URL capture');
    
    const logsSecurityEvents = 
      adminRouteContent.includes('logSecurityEvent') &&
      adminRouteContent.includes('detectSuspiciousActivity');
    
    logTest('AdminRoute logs security events', logsSecurityEvents,
      logsSecurityEvents ? 'Security logging implemented' : 'Missing security logging');
  }

  // Check if App.jsx handles return URLs
  const appContent = readFile(appPath);
  if (appContent) {
    const handlesReturnUrls = 
      appContent.includes('returnUrl') &&
      appContent.includes('pending_return_url');
    
    logTest('App.jsx handles return URLs', handlesReturnUrls,
      handlesReturnUrls ? 'Return URL handling implemented' : 'Missing return URL handling');
  }

  // 11. Verify Error Handling
  log('\n🔍 Checking Error Handling...', colors.cyan);
  
  const roleDetectionContent = readFile(roleDetectionPath);
  if (roleDetectionContent) {
    const hasErrorHandling = 
      roleDetectionContent.includes('try') &&
      roleDetectionContent.includes('catch') &&
      roleDetectionContent.includes('console.error');
    
    logTest('Role Detection has error handling', hasErrorHandling,
      hasErrorHandling ? 'Error handling implemented' : 'Missing error handling');
  }

  const redirectManagerContent = readFile(redirectManagerPath);
  if (redirectManagerContent) {
    const hasErrorHandling = 
      redirectManagerContent.includes('try') &&
      redirectManagerContent.includes('catch') &&
      redirectManagerContent.includes('console.error');
    
    logTest('Redirect Manager has error handling', hasErrorHandling,
      hasErrorHandling ? 'Error handling implemented' : 'Missing error handling');
  }

  const securityValidatorContent = readFile(securityValidatorPath);
  if (securityValidatorContent) {
    const hasErrorHandling = 
      securityValidatorContent.includes('try') &&
      securityValidatorContent.includes('catch') &&
      securityValidatorContent.includes('console.error');
    
    logTest('Security Validator has error handling', hasErrorHandling,
      hasErrorHandling ? 'Error handling implemented' : 'Missing error handling');
  }

  // 12. Verify Security Features
  log('\n🔍 Checking Security Features...', colors.cyan);
  
  if (securityValidatorContent) {
    const hasXSSPrevention = 
      securityValidatorContent.includes('javascript:') &&
      securityValidatorContent.includes('data:') &&
      securityValidatorContent.includes('vbscript:');
    
    logTest('XSS prevention patterns', hasXSSPrevention,
      hasXSSPrevention ? 'XSS prevention implemented' : 'Missing XSS prevention');
    
    const hasDomainValidation = 
      securityValidatorContent.includes('validateDomain') &&
      securityValidatorContent.includes('ALLOWED_DOMAINS');
    
    logTest('Domain validation', hasDomainValidation,
      hasDomainValidation ? 'Domain validation implemented' : 'Missing domain validation');
    
    const hasSuspiciousActivityTracking = 
      securityValidatorContent.includes('suspiciousActivityTracker') &&
      securityValidatorContent.includes('trackSuspiciousActivity');
    
    logTest('Suspicious activity tracking', hasSuspiciousActivityTracking,
      hasSuspiciousActivityTracking ? 'Activity tracking implemented' : 'Missing activity tracking');
  }

  // Print Summary
  log('\n' + '='.repeat(70), colors.blue);
  log('📊 VERIFICATION SUMMARY', colors.blue);
  log('='.repeat(70), colors.blue);
  log(`Total Tests: ${results.passed + results.failed}`, colors.cyan);
  log(`Passed: ${results.passed} ✅`, colors.green);
  log(`Failed: ${results.failed} ❌`, colors.red);
  log(`Warnings: ${results.warnings} ⚠️`, colors.yellow);
  
  const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, colors.cyan);
  
  if (results.failed === 0) {
    log('\n🎉 ALL CHECKS PASSED! Role-Based Login Redirect System is properly integrated.', colors.green);
  } else {
    log('\n⚠️  SOME CHECKS FAILED. Please review the failed tests above.', colors.yellow);
  }
  
  log('='.repeat(70) + '\n', colors.blue);

  return results.failed === 0;
}

// Run verification
try {
  const success = verifyRoleBasedRedirectSystem();
  process.exit(success ? 0 : 1);
} catch (error) {
  log(`\n❌ Verification failed with error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
}

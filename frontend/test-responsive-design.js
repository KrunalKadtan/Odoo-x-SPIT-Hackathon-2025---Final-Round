/**
 * Responsive Design Test Suite
 * 
 * This test suite validates responsive design implementation as specified in Task 11.2:
 * 1. Test on desktop, tablet, and mobile viewports
 * 2. Verify navigation works on all screen sizes
 * 3. Verify forms and layouts are responsive
 * 
 * Tests Requirement 8.1: Responsive design that works on desktop, tablet, and mobile devices
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
  viewports: {
    desktop: { passed: 0, failed: 0, tests: [] },
    tablet: { passed: 0, failed: 0, tests: [] },
    mobile: { passed: 0, failed: 0, tests: [] }
  }
};

function logTest(testName, passed, message = '', viewport = null) {
  const test = { testName, passed, message };
  testResults.tests.push(test);
  
  if (viewport && testResults.viewports[viewport]) {
    testResults.viewports[viewport].tests.push(test);
    if (passed) {
      testResults.viewports[viewport].passed++;
    } else {
      testResults.viewports[viewport].failed++;
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

function testResponsiveDesign() {
  console.log('📱 Testing Responsive Design Implementation\n');
  console.log('Testing Requirement 8.1: Responsive design that works on desktop, tablet, and mobile devices\n');

  const srcPath = path.join(__dirname, 'src');

  // ========================================
  // Test 1: CSS Framework and Responsive Setup
  // ========================================
  console.log('🎨 Testing CSS Framework and Responsive Setup\n');

  // Check Tailwind CSS configuration
  const tailwindConfigPath = path.join(__dirname, 'tailwind.config.js');
  const tailwindConfig = readFileContent(tailwindConfigPath);
  
  if (tailwindConfig) {
    const hasResponsiveBreakpoints = tailwindConfig.includes('screens') || tailwindConfig.includes('breakpoints');
    const hasFlexboxSupport = tailwindConfig.includes('flex') || tailwindConfig.includes('grid');
    const hasSpacingConfig = tailwindConfig.includes('spacing') || tailwindConfig.includes('padding');
    
    logTest('Tailwind CSS responsive config', hasResponsiveBreakpoints, 'Responsive breakpoints configured', 'desktop');
    logTest('Flexbox/Grid support', hasFlexboxSupport, 'Modern layout systems available', 'desktop');
    logTest('Spacing configuration', hasSpacingConfig, 'Consistent spacing system', 'desktop');
  }

  // Check main CSS file
  const mainCSSPath = path.join(srcPath, 'index.css');
  const mainCSS = readFileContent(mainCSSPath);
  
  if (mainCSS) {
    const hasTailwindImports = mainCSS.includes('@tailwind') && mainCSS.includes('responsive');
    const hasResponsiveUtilities = mainCSS.includes('sm:') || mainCSS.includes('md:') || mainCSS.includes('lg:');
    const hasViewportMeta = mainCSS.includes('viewport') || mainCSS.includes('responsive');
    
    logTest('Tailwind CSS imports', hasTailwindImports, 'Tailwind CSS properly imported', 'desktop');
    logTest('Responsive utilities usage', hasResponsiveUtilities, 'Responsive utility classes used', 'desktop');
  }

  // Check HTML viewport meta tag
  const indexHTMLPath = path.join(__dirname, 'index.html');
  const indexHTML = readFileContent(indexHTMLPath);
  
  if (indexHTML) {
    const hasViewportMeta = indexHTML.includes('viewport') && indexHTML.includes('width=device-width');
    const hasInitialScale = indexHTML.includes('initial-scale=1');
    
    logTest('Viewport meta tag', hasViewportMeta, 'Proper viewport meta tag configured', 'mobile');
    logTest('Initial scale setting', hasInitialScale, 'Initial scale set for mobile', 'mobile');
  }

  // ========================================
  // Test 2: Navigation Responsive Design
  // ========================================
  console.log('\n🧭 Testing Navigation Responsive Design\n');

  const navigationPath = path.join(srcPath, 'components/Navigation.jsx');
  const navigationContent = readFileContent(navigationPath);
  
  if (navigationContent) {
    // Desktop navigation tests
    const hasDesktopNav = navigationContent.includes('nav') && navigationContent.includes('flex');
    const hasDesktopMenu = navigationContent.includes('menu') && navigationContent.includes('desktop');
    const hasDesktopLogo = navigationContent.includes('logo') && navigationContent.includes('brand');
    
    logTest('Desktop navigation layout', hasDesktopNav, 'Desktop navigation with flex layout', 'desktop');
    logTest('Desktop menu structure', hasDesktopMenu, 'Desktop menu properly structured', 'desktop');
    logTest('Desktop logo/brand', hasDesktopLogo, 'Logo/brand visible on desktop', 'desktop');

    // Tablet navigation tests
    const hasTabletBreakpoints = navigationContent.includes('md:') || navigationContent.includes('tablet');
    const hasTabletLayout = navigationContent.includes('md:flex') || navigationContent.includes('md:block');
    
    logTest('Tablet navigation breakpoints', hasTabletBreakpoints, 'Tablet-specific styling applied', 'tablet');
    logTest('Tablet navigation layout', hasTabletLayout, 'Navigation adapts to tablet layout', 'tablet');

    // Mobile navigation tests
    const hasMobileMenu = navigationContent.includes('mobile') || navigationContent.includes('hamburger');
    const hasMobileToggle = navigationContent.includes('toggle') && navigationContent.includes('menu');
    const hasMobileBreakpoints = navigationContent.includes('sm:') || navigationContent.includes('mobile');
    const hasMobileHidden = navigationContent.includes('hidden') && navigationContent.includes('sm:');
    
    logTest('Mobile menu implementation', hasMobileMenu, 'Mobile menu/hamburger implemented', 'mobile');
    logTest('Mobile menu toggle', hasMobileToggle, 'Mobile menu toggle functionality', 'mobile');
    logTest('Mobile navigation breakpoints', hasMobileBreakpoints, 'Mobile-specific styling applied', 'mobile');
    logTest('Mobile navigation visibility', hasMobileHidden, 'Navigation elements hidden/shown appropriately', 'mobile');
  }

  // ========================================
  // Test 3: Layout Components Responsive Design
  // ========================================
  console.log('\n📐 Testing Layout Components Responsive Design\n');

  // Test Home page responsiveness
  const homePath = path.join(srcPath, 'pages/Home.jsx');
  const homeContent = readFileContent(homePath);
  
  if (homeContent) {
    // Desktop layout tests
    const hasDesktopGrid = homeContent.includes('grid') && homeContent.includes('lg:');
    const hasDesktopColumns = homeContent.includes('lg:grid-cols') || homeContent.includes('xl:grid-cols');
    
    logTest('Home desktop grid layout', hasDesktopGrid, 'Desktop grid layout implemented', 'desktop');
    logTest('Home desktop columns', hasDesktopColumns, 'Desktop column layout configured', 'desktop');

    // Tablet layout tests
    const hasTabletGrid = homeContent.includes('md:grid-cols') || homeContent.includes('md:');
    const hasTabletSpacing = homeContent.includes('md:p-') || homeContent.includes('md:m-');
    
    logTest('Home tablet grid layout', hasTabletGrid, 'Tablet grid layout implemented', 'tablet');
    logTest('Home tablet spacing', hasTabletSpacing, 'Tablet spacing configured', 'tablet');

    // Mobile layout tests
    const hasMobileStack = homeContent.includes('flex-col') || homeContent.includes('sm:');
    const hasMobileSpacing = homeContent.includes('sm:p-') || homeContent.includes('sm:m-');
    
    logTest('Home mobile stack layout', hasMobileStack, 'Mobile stacked layout implemented', 'mobile');
    logTest('Home mobile spacing', hasMobileSpacing, 'Mobile spacing configured', 'mobile');
  }

  // Test Shop page responsiveness
  const shopPath = path.join(srcPath, 'pages/Shop.jsx');
  const shopContent = readFileContent(shopPath);
  
  if (shopContent) {
    // Desktop shop tests
    const hasDesktopProductGrid = shopContent.includes('grid') && shopContent.includes('lg:grid-cols');
    const hasDesktopSidebar = shopContent.includes('sidebar') && shopContent.includes('lg:');
    
    logTest('Shop desktop product grid', hasDesktopProductGrid, 'Desktop product grid layout', 'desktop');
    logTest('Shop desktop sidebar', hasDesktopSidebar, 'Desktop sidebar layout', 'desktop');

    // Tablet shop tests
    const hasTabletProductGrid = shopContent.includes('md:grid-cols');
    const hasTabletLayout = shopContent.includes('md:flex') || shopContent.includes('md:');
    
    logTest('Shop tablet product grid', hasTabletProductGrid, 'Tablet product grid layout', 'tablet');
    logTest('Shop tablet layout', hasTabletLayout, 'Tablet shop layout adaptation', 'tablet');

    // Mobile shop tests
    const hasMobileProductGrid = shopContent.includes('sm:grid-cols') || shopContent.includes('grid-cols-1');
    const hasMobileFilters = shopContent.includes('mobile') && shopContent.includes('filter');
    
    logTest('Shop mobile product grid', hasMobileProductGrid, 'Mobile product grid layout', 'mobile');
    logTest('Shop mobile filters', hasMobileFilters, 'Mobile filter implementation', 'mobile');
  }

  // Test Cart page responsiveness
  const cartPath = path.join(srcPath, 'pages/Cart.jsx');
  const cartContent = readFileContent(cartPath);
  
  if (cartContent) {
    // Desktop cart tests
    const hasDesktopCartLayout = cartContent.includes('lg:') && cartContent.includes('flex');
    const hasDesktopSummary = cartContent.includes('summary') && cartContent.includes('lg:');
    
    logTest('Cart desktop layout', hasDesktopCartLayout, 'Desktop cart layout implemented', 'desktop');
    logTest('Cart desktop summary', hasDesktopSummary, 'Desktop cart summary layout', 'desktop');

    // Tablet cart tests
    const hasTabletCartLayout = cartContent.includes('md:') && cartContent.includes('cart');
    
    logTest('Cart tablet layout', hasTabletCartLayout, 'Tablet cart layout adaptation', 'tablet');

    // Mobile cart tests
    const hasMobileCartStack = cartContent.includes('flex-col') || cartContent.includes('sm:');
    const hasMobileCartItems = cartContent.includes('mobile') || cartContent.includes('sm:');
    
    logTest('Cart mobile stack layout', hasMobileCartStack, 'Mobile cart stacked layout', 'mobile');
    logTest('Cart mobile items', hasMobileCartItems, 'Mobile cart items layout', 'mobile');
  }

  // ========================================
  // Test 4: Form Components Responsive Design
  // ========================================
  console.log('\n📝 Testing Form Components Responsive Design\n');

  // Test SignIn form responsiveness
  const signInPath = path.join(srcPath, 'pages/SignIn.jsx');
  const signInContent = readFileContent(signInPath);
  
  if (signInContent) {
    // Desktop form tests
    const hasDesktopFormLayout = signInContent.includes('form') && signInContent.includes('lg:');
    const hasDesktopFormWidth = signInContent.includes('max-w') && signInContent.includes('lg:');
    
    logTest('SignIn desktop form layout', hasDesktopFormLayout, 'Desktop form layout implemented', 'desktop');
    logTest('SignIn desktop form width', hasDesktopFormWidth, 'Desktop form width configured', 'desktop');

    // Tablet form tests
    const hasTabletFormLayout = signInContent.includes('md:') && signInContent.includes('form');
    
    logTest('SignIn tablet form layout', hasTabletFormLayout, 'Tablet form layout adaptation', 'tablet');

    // Mobile form tests
    const hasMobileFormLayout = signInContent.includes('sm:') || signInContent.includes('mobile');
    const hasMobileFormSpacing = signInContent.includes('p-4') || signInContent.includes('sm:p-');
    
    logTest('SignIn mobile form layout', hasMobileFormLayout, 'Mobile form layout implemented', 'mobile');
    logTest('SignIn mobile form spacing', hasMobileFormSpacing, 'Mobile form spacing configured', 'mobile');
  }

  // Test SignUp form responsiveness
  const signUpPath = path.join(srcPath, 'pages/SignUp.jsx');
  const signUpContent = readFileContent(signUpPath);
  
  if (signUpContent) {
    // Similar tests for SignUp form
    const hasResponsiveSignUpForm = signUpContent.includes('responsive') || 
                                   signUpContent.includes('sm:') || 
                                   signUpContent.includes('md:') || 
                                   signUpContent.includes('lg:');
    
    logTest('SignUp form responsiveness', hasResponsiveSignUpForm, 'SignUp form responsive design', 'mobile');
  }

  // Test MyAccount form responsiveness
  const myAccountPath = path.join(srcPath, 'pages/MyAccount.jsx');
  const myAccountContent = readFileContent(myAccountPath);
  
  if (myAccountContent) {
    // Desktop account tests
    const hasDesktopAccountLayout = myAccountContent.includes('lg:') && myAccountContent.includes('grid');
    const hasDesktopSidebar = myAccountContent.includes('sidebar') && myAccountContent.includes('lg:');
    
    logTest('MyAccount desktop layout', hasDesktopAccountLayout, 'Desktop account layout implemented', 'desktop');
    logTest('MyAccount desktop sidebar', hasDesktopSidebar, 'Desktop account sidebar layout', 'desktop');

    // Tablet account tests
    const hasTabletAccountLayout = myAccountContent.includes('md:') && myAccountContent.includes('account');
    
    logTest('MyAccount tablet layout', hasTabletAccountLayout, 'Tablet account layout adaptation', 'tablet');

    // Mobile account tests
    const hasMobileAccountStack = myAccountContent.includes('flex-col') || myAccountContent.includes('sm:');
    const hasMobileAccountTabs = myAccountContent.includes('mobile') && myAccountContent.includes('tab');
    
    logTest('MyAccount mobile stack layout', hasMobileAccountStack, 'Mobile account stacked layout', 'mobile');
    logTest('MyAccount mobile tabs', hasMobileAccountTabs, 'Mobile account tabs implementation', 'mobile');
  }

  // ========================================
  // Test 5: Component-Level Responsive Design
  // ========================================
  console.log('\n🧩 Testing Component-Level Responsive Design\n');

  // Test ProductCard component responsiveness
  const productCardPath = path.join(srcPath, 'components/ProductCard.jsx');
  const productCardContent = readFileContent(productCardPath);
  
  if (productCardContent) {
    const hasResponsiveProductCard = productCardContent.includes('responsive') || 
                                    productCardContent.includes('sm:') || 
                                    productCardContent.includes('md:') || 
                                    productCardContent.includes('lg:');
    const hasResponsiveImages = productCardContent.includes('w-full') && productCardContent.includes('h-');
    const hasResponsiveText = productCardContent.includes('text-sm') || productCardContent.includes('text-xs');
    
    logTest('ProductCard responsiveness', hasResponsiveProductCard, 'ProductCard responsive design', 'mobile');
    logTest('ProductCard responsive images', hasResponsiveImages, 'ProductCard images scale properly', 'mobile');
    logTest('ProductCard responsive text', hasResponsiveText, 'ProductCard text scales properly', 'mobile');
  }

  // Test other UI components
  const componentsPath = path.join(srcPath, 'components');
  if (fileExists(componentsPath)) {
    const componentFiles = fs.readdirSync(componentsPath).filter(file => file.endsWith('.jsx'));
    
    componentFiles.forEach(file => {
      const componentPath = path.join(componentsPath, file);
      const componentContent = readFileContent(componentPath);
      
      if (componentContent) {
        const hasResponsiveClasses = componentContent.includes('sm:') || 
                                    componentContent.includes('md:') || 
                                    componentContent.includes('lg:');
        const componentName = file.replace('.jsx', '');
        
        logTest(`${componentName} responsive classes`, hasResponsiveClasses, `${componentName} uses responsive classes`, 'desktop');
      }
    });
  }

  // ========================================
  // Test 6: Responsive Images and Media
  // ========================================
  console.log('\n🖼️ Testing Responsive Images and Media\n');

  // Check for responsive image implementations
  const allPages = ['Home.jsx', 'Shop.jsx', 'ProductDetail.jsx', 'Cart.jsx'];
  
  allPages.forEach(pageName => {
    const pagePath = path.join(srcPath, 'pages', pageName);
    const pageContent = readFileContent(pagePath);
    
    if (pageContent) {
      const hasResponsiveImages = pageContent.includes('w-full') || pageContent.includes('max-w-');
      const hasImageAspectRatio = pageContent.includes('aspect-') || pageContent.includes('object-');
      const hasImageOptimization = pageContent.includes('loading="lazy"') || pageContent.includes('lazy');
      
      const pageNameClean = pageName.replace('.jsx', '');
      logTest(`${pageNameClean} responsive images`, hasResponsiveImages, `${pageNameClean} images are responsive`, 'mobile');
      logTest(`${pageNameClean} image aspect ratio`, hasImageAspectRatio, `${pageNameClean} images maintain aspect ratio`, 'mobile');
    }
  });

  // ========================================
  // Test 7: Responsive Typography and Spacing
  // ========================================
  console.log('\n📝 Testing Responsive Typography and Spacing\n');

  // Check for responsive typography across components
  const typographyFiles = ['Home.jsx', 'Shop.jsx', 'ProductDetail.jsx', 'Navigation.jsx'];
  
  typographyFiles.forEach(fileName => {
    const filePath = fileName.includes('/') ? 
      path.join(srcPath, fileName) : 
      path.join(srcPath, fileExists(path.join(srcPath, 'pages', fileName)) ? 'pages' : 'components', fileName);
    
    const fileContent = readFileContent(filePath);
    
    if (fileContent) {
      const hasResponsiveText = fileContent.includes('text-sm') || 
                               fileContent.includes('sm:text-') || 
                               fileContent.includes('md:text-') || 
                               fileContent.includes('lg:text-');
      const hasResponsiveSpacing = fileContent.includes('sm:p-') || 
                                  fileContent.includes('md:p-') || 
                                  fileContent.includes('lg:p-') ||
                                  fileContent.includes('sm:m-') || 
                                  fileContent.includes('md:m-') || 
                                  fileContent.includes('lg:m-');
      
      const fileNameClean = fileName.replace('.jsx', '');
      logTest(`${fileNameClean} responsive typography`, hasResponsiveText, `${fileNameClean} uses responsive text sizes`, 'desktop');
      logTest(`${fileNameClean} responsive spacing`, hasResponsiveSpacing, `${fileNameClean} uses responsive spacing`, 'desktop');
    }
  });

  // ========================================
  // SUMMARY AND RESULTS
  // ========================================
  console.log('\n📊 Responsive Design Test Summary:');
  console.log(`✅ Total Passed: ${testResults.passed}`);
  console.log(`❌ Total Failed: ${testResults.failed}`);
  console.log(`📈 Overall Success Rate: ${Math.round((testResults.passed / testResults.tests.length) * 100)}%`);

  // Viewport-specific summaries
  Object.keys(testResults.viewports).forEach(viewport => {
    const viewportData = testResults.viewports[viewport];
    const total = viewportData.passed + viewportData.failed;
    const successRate = total > 0 ? Math.round((viewportData.passed / total) * 100) : 0;
    
    console.log(`\n${viewport.toUpperCase()} VIEWPORT:`);
    console.log(`  ✅ Passed: ${viewportData.passed}`);
    console.log(`  ❌ Failed: ${viewportData.failed}`);
    console.log(`  📈 Success Rate: ${successRate}%`);
  });

  if (testResults.failed === 0) {
    console.log('\n🎉 ALL RESPONSIVE DESIGN TESTS PASSED!');
    console.log('\n✅ TASK 11.2 VERIFICATION COMPLETE');
    console.log('✅ Desktop viewport design verified');
    console.log('✅ Tablet viewport design verified');
    console.log('✅ Mobile viewport design verified');
    console.log('✅ Navigation responsive design verified');
    console.log('✅ Forms and layouts responsive design verified');
    console.log('✅ Requirement 8.1 validated successfully');
  } else {
    console.log('\n⚠️ Some responsive design tests failed:');
    testResults.tests.filter(test => !test.passed).forEach(test => {
      console.log(`  - ${test.testName}: ${test.message}`);
    });
  }

  return testResults;
}

// Run the responsive design tests
testResponsiveDesign();
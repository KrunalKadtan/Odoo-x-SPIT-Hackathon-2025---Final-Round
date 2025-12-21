import { measurePerformance, preloadCriticalImages, preloadCriticalResources } from './lazyLoading';

// Initialize performance monitoring
export const initializePerformanceMonitoring = () => {
  // Start performance measurement
  measurePerformance();
  
  // Preload critical images
  const criticalImages = [
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80', // Hero image
    // Add other critical images here
  ];
  preloadCriticalImages(criticalImages);
  
  // Preload critical resources
  const criticalResources = [
    {
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap',
      as: 'style',
      crossorigin: 'anonymous'
    }
    // Add other critical resources here
  ];
  preloadCriticalResources(criticalResources);
};

// Web Vitals measurement (simplified version)
export const measureWebVitals = () => {
  // Largest Contentful Paint
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch {
      // Silently fail if not supported
    }
  }
  
  // First Input Delay
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log('FID:', entry.processingStart - entry.startTime);
        });
      });
      observer.observe({ entryTypes: ['first-input'] });
    } catch {
      // Silently fail if not supported
    }
  }
  
  // Cumulative Layout Shift
  if ('PerformanceObserver' in window) {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        console.log('CLS:', clsValue);
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch {
      // Silently fail if not supported
    }
  }
};

// Resource loading optimization
export const optimizeResourceLoading = () => {
  // Add resource hints
  const addResourceHint = (href, rel, as = null, crossorigin = null) => {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (as) link.as = as;
    if (crossorigin) link.crossOrigin = crossorigin;
    document.head.appendChild(link);
  };
  
  // DNS prefetch for external domains
  addResourceHint('//images.unsplash.com', 'dns-prefetch');
  addResourceHint('//fonts.googleapis.com', 'dns-prefetch');
  
  // Preconnect to critical origins
  addResourceHint('https://fonts.gstatic.com', 'preconnect', null, 'anonymous');
};

// Initialize all performance optimizations
export const initializePerformanceOptimizations = () => {
  initializePerformanceMonitoring();
  measureWebVitals();
  optimizeResourceLoading();
};
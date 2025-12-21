import React from 'react';
import { useEffect, useRef, useState } from 'react';

// Lazy loading utility for images
export const setupLazyLoading = () => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => imageObserver.observe(img));
  }
};

// Enhanced Intersection Observer for animations with staggered effects
export const setupScrollAnimations = () => {
  if ('IntersectionObserver' in window) {
    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const animationType = element.dataset.animation || 'animate-fade-in-up';
          const delay = element.dataset.delay || index * 100;
          
          setTimeout(() => {
            element.classList.add(animationType);
            element.classList.add('animate-in');
          }, delay);
          
          animationObserver.unobserve(element);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => animationObserver.observe(el));
  }
};

// React hook for lazy loading images
export const useLazyImage = (src, placeholder = '') => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    let observer;
    const currentRef = imgRef.current;
    
    if (currentRef && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '50px 0px', threshold: 0.01 }
      );
      
      observer.observe(currentRef);
    } else if (!imageSrc || imageSrc === placeholder) {
      // Fallback for browsers without IntersectionObserver
      setImageSrc(src);
    }

    return () => {
      if (observer && currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [src, placeholder, imageSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return { imgRef, imageSrc, isLoaded, handleLoad };
};

// React hook for scroll animations
export const useScrollAnimation = (animationType = 'animate-fade-in-up', delay = 0) => {
  const elementRef = useRef();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let observer;
    const currentRef = elementRef.current;
    
    if (currentRef && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !isVisible) {
              setTimeout(() => {
                setIsVisible(true);
                entry.target.classList.add(animationType);
              }, delay);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      );
      
      observer.observe(currentRef);
    } else if (!isVisible) {
      // Fallback for browsers without IntersectionObserver
      setIsVisible(true);
    }

    return () => {
      if (observer && currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [animationType, delay, isVisible]);

  return { elementRef, isVisible };
};

// Preload critical images
export const preloadCriticalImages = (imageUrls) => {
  imageUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
};

// Preload critical resources (CSS, JS, fonts)
export const preloadCriticalResources = (resources) => {
  resources.forEach(({ href, as, type, crossorigin }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    if (crossorigin) link.crossOrigin = crossorigin;
    document.head.appendChild(link);
  });
};

// Performance monitoring with detailed metrics
export const measurePerformance = () => {
  if ('performance' in window) {
    window.addEventListener('load', () => {
      // Wait a bit for all resources to load
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        const paintEntries = performance.getEntriesByType('paint');
        
        const metrics = {
          // Core Web Vitals
          firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
          largestContentfulPaint: 0, // Would need to be measured separately
          
          // Navigation timing
          domContentLoaded: (perfData.domContentLoadedEventEnd && perfData.domContentLoadedEventStart) 
            ? perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart : 0,
          pageLoad: (perfData.loadEventEnd && perfData.loadEventStart) 
            ? perfData.loadEventEnd - perfData.loadEventStart : 0,
          
          // Network timing
          dnsLookup: (perfData.domainLookupEnd && perfData.domainLookupStart) 
            ? perfData.domainLookupEnd - perfData.domainLookupStart : 0,
          tcpConnection: (perfData.connectEnd && perfData.connectStart) 
            ? perfData.connectEnd - perfData.connectStart : 0,
          serverResponse: (perfData.responseEnd && perfData.requestStart) 
            ? perfData.responseEnd - perfData.requestStart : 0,
          
          // Resource timing
          totalLoadTime: (perfData.loadEventEnd && perfData.navigationStart) 
            ? perfData.loadEventEnd - perfData.navigationStart : 0,
          timeToInteractive: (perfData.domInteractive && perfData.navigationStart) 
            ? perfData.domInteractive - perfData.navigationStart : 0
        };

        // Helper function to safely format numbers
        const formatMetric = (value) => {
          return (typeof value === 'number' && !isNaN(value)) ? value.toFixed(2) : '0.00';
        };

        // Log performance metrics (in production, send to analytics)
        console.group('🚀 Performance Metrics');
        console.log('First Contentful Paint:', formatMetric(metrics.firstContentfulPaint), 'ms');
        console.log('DOM Content Loaded:', formatMetric(metrics.domContentLoaded), 'ms');
        console.log('Page Load Time:', formatMetric(metrics.pageLoad), 'ms');
        console.log('Total Load Time:', formatMetric(metrics.totalLoadTime), 'ms');
        console.log('Time to Interactive:', formatMetric(metrics.timeToInteractive), 'ms');
        console.groupEnd();

        // Store metrics for potential analytics reporting
        window.performanceMetrics = metrics;
      }, 1000);
    });
  }
};

// Lazy load components (for code splitting)
export const createLazyComponent = (importFunc) => {
  return React.lazy(importFunc);
};

// Image optimization helper
export const getOptimizedImageUrl = (url, width, height) => {
  // This would integrate with your image optimization service
  // For now, return the original URL
  if (!url) return '';
  
  // Example for services like Cloudinary, ImageKit, etc.
  // return `${url}?w=${width}&h=${height}&q=${quality}&f=auto`;
  
  return url;
};

// Viewport detection hook
export const useInViewport = (options = {}) => {
  const elementRef = useRef();
  const [isInViewport, setIsInViewport] = useState(false);

  useEffect(() => {
    let observer;
    const currentRef = elementRef.current;
    
    if (currentRef && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            setIsInViewport(entry.isIntersecting);
          });
        },
        {
          threshold: options.threshold || 0.1,
          rootMargin: options.rootMargin || '0px',
          ...options
        }
      );
      
      observer.observe(currentRef);
    }

    return () => {
      if (observer && currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [options]);

  return { elementRef, isInViewport };
};
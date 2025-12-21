import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Enhanced lazy loading hook for components and data
 */
export const useLazyComponent = ({
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
  delay = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef();

  useEffect(() => {
    const currentElement = elementRef.current;
    if (!currentElement || (triggerOnce && hasTriggered)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delay > 0) {
              setTimeout(() => {
                setIsVisible(true);
                if (triggerOnce) {
                  setHasTriggered(true);
                  observer.unobserve(entry.target);
                }
              }, delay);
            } else {
              setIsVisible(true);
              if (triggerOnce) {
                setHasTriggered(true);
                observer.unobserve(entry.target);
              }
            }
          } else if (!triggerOnce) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(currentElement);

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [threshold, rootMargin, triggerOnce, delay, hasTriggered]);

  return {
    elementRef,
    isVisible,
    hasTriggered
  };
};

/**
 * Lazy data loading hook with caching
 */
export const useLazyData = ({
  fetchFunction,
  dependencies = [],
  cacheKey,
  cacheTime = 5 * 60 * 1000, // 5 minutes
  threshold = 0.1,
  rootMargin = '100px',
  enabled = true
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef();
  const cacheRef = useRef(new Map());

  // Check cache
  const getCachedData = useCallback(() => {
    if (!cacheKey) return null;
    
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.data;
    }
    return null;
  }, [cacheKey, cacheTime]);

  // Set cache
  const setCachedData = useCallback((newData) => {
    if (!cacheKey) return;
    
    cacheRef.current.set(cacheKey, {
      data: newData,
      timestamp: Date.now()
    });
  }, [cacheKey]);

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!enabled || loading) return;

    // Check cache first
    const cachedData = getCachedData();
    if (cachedData) {
      setData(cachedData);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction();
      setData(result);
      setCachedData(result);
    } catch (err) {
      setError(err);
      console.error('Lazy data loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled, loading, fetchFunction, getCachedData, setCachedData]);

  // Intersection observer for lazy loading
  useEffect(() => {
    const currentElement = elementRef.current;
    if (!currentElement || !enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(currentElement);

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [enabled, threshold, rootMargin, isVisible]);

  // Fetch data when visible
  useEffect(() => {
    if (isVisible && enabled) {
      fetchData();
    }
  }, [isVisible, enabled, fetchData, ...dependencies]);

  // Manual refresh function
  const refresh = useCallback(() => {
    if (cacheKey) {
      cacheRef.current.delete(cacheKey);
    }
    fetchData();
  }, [cacheKey, fetchData]);

  return {
    elementRef,
    data,
    loading,
    error,
    isVisible,
    refresh
  };
};

/**
 * Lazy image loading hook with progressive enhancement
 */
export const useLazyImage = ({
  src,
  placeholder = '',
  lowQualitySrc = '',
  threshold = 0.1,
  rootMargin = '50px'
}) => {
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const imgRef = useRef();

  useEffect(() => {
    const currentImg = imgRef.current;
    if (!currentImg || !src) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsLoading(true);
            
            // Load low quality image first if available
            if (lowQualitySrc && lowQualitySrc !== currentSrc) {
              const lowQualityImg = new Image();
              lowQualityImg.onload = () => {
                setCurrentSrc(lowQualitySrc);
              };
              lowQualityImg.src = lowQualitySrc;
            }

            // Load high quality image
            const highQualityImg = new Image();
            highQualityImg.onload = () => {
              setCurrentSrc(src);
              setIsLoaded(true);
              setIsLoading(false);
            };
            highQualityImg.onerror = () => {
              setError(new Error('Failed to load image'));
              setIsLoading(false);
            };
            highQualityImg.src = src;

            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(currentImg);

    return () => {
      if (currentImg) {
        observer.unobserve(currentImg);
      }
    };
  }, [src, lowQualitySrc, currentSrc, threshold, rootMargin]);

  return {
    imgRef,
    src: currentSrc,
    isLoaded,
    isLoading,
    error
  };
};

/**
 * Batch lazy loading for multiple items
 */
export const useBatchLazyLoading = ({
  items = [],
  batchSize = 10,
  threshold = 0.1,
  rootMargin = '100px',
  delay = 100
}) => {
  const [loadedBatches, setLoadedBatches] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef();

  const totalBatches = Math.ceil(items.length / batchSize);
  const visibleItems = items.slice(0, loadedBatches * batchSize);
  const hasMore = loadedBatches < totalBatches;

  const loadNextBatch = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    setTimeout(() => {
      setLoadedBatches(prev => prev + 1);
      setIsLoading(false);
    }, delay);
  }, [isLoading, hasMore, delay]);

  useEffect(() => {
    const currentSentinel = sentinelRef.current;
    if (!currentSentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadNextBatch();
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(currentSentinel);

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, loadNextBatch, threshold, rootMargin]);

  // Load first batch immediately
  useEffect(() => {
    if (loadedBatches === 0 && items.length > 0) {
      setLoadedBatches(1);
    }
  }, [items.length, loadedBatches]);

  return {
    sentinelRef,
    visibleItems,
    isLoading,
    hasMore,
    loadedBatches,
    totalBatches,
    loadNextBatch
  };
};

/**
 * Progressive loading hook for dashboard components
 */
export const useProgressiveLoading = ({
  components = [],
  delay = 200,
  staggerDelay = 100
}) => {
  const [loadedComponents, setLoadedComponents] = useState(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex >= components.length) return;

    const timer = setTimeout(() => {
      setLoadedComponents(prev => new Set([...prev, components[currentIndex]]));
      setCurrentIndex(prev => prev + 1);
    }, delay + (currentIndex * staggerDelay));

    return () => clearTimeout(timer);
  }, [currentIndex, components, delay, staggerDelay]);

  const isComponentLoaded = useCallback((componentName) => {
    return loadedComponents.has(componentName);
  }, [loadedComponents]);

  const loadAllComponents = useCallback(() => {
    setLoadedComponents(new Set(components));
    setCurrentIndex(components.length);
  }, [components]);

  return {
    isComponentLoaded,
    loadedComponents,
    loadAllComponents,
    isComplete: loadedComponents.size === components.length
  };
};

/**
 * Adaptive loading hook based on network conditions
 */
export const useAdaptiveLoading = () => {
  const [networkInfo, setNetworkInfo] = useState({
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false
  });

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      const updateNetworkInfo = () => {
        setNetworkInfo({
          effectiveType: connection.effectiveType || '4g',
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 100,
          saveData: connection.saveData || false
        });
      };

      updateNetworkInfo();
      connection.addEventListener('change', updateNetworkInfo);

      return () => {
        connection.removeEventListener('change', updateNetworkInfo);
      };
    }
  }, []);

  const getOptimalSettings = useCallback(() => {
    const { effectiveType, saveData, downlink } = networkInfo;

    // Adjust settings based on network conditions
    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
      return {
        pageSize: 5,
        imageQuality: 'low',
        enableLazyLoading: true,
        preloadCount: 1,
        cacheTime: 10 * 60 * 1000 // 10 minutes
      };
    } else if (effectiveType === '3g' || downlink < 1.5) {
      return {
        pageSize: 10,
        imageQuality: 'medium',
        enableLazyLoading: true,
        preloadCount: 2,
        cacheTime: 5 * 60 * 1000 // 5 minutes
      };
    } else {
      return {
        pageSize: 20,
        imageQuality: 'high',
        enableLazyLoading: false,
        preloadCount: 5,
        cacheTime: 2 * 60 * 1000 // 2 minutes
      };
    }
  }, [networkInfo]);

  return {
    networkInfo,
    optimalSettings: getOptimalSettings()
  };
};
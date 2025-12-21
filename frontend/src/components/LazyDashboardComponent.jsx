import React from 'react';
import { useLazyComponent, useLazyData } from '../hooks/useLazyLoading';
import LoadingSpinner, { SkeletonLoader } from './LoadingSpinner';

/**
 * Lazy Dashboard Component Wrapper
 * Provides lazy loading for dashboard components with skeleton loading states
 */
const LazyDashboardComponent = ({
  children,
  fallback,
  skeleton,
  threshold = 0.1,
  rootMargin = '50px',
  delay = 0,
  className = '',
  minHeight = '200px'
}) => {
  const { elementRef, isVisible } = useLazyComponent({
    threshold,
    rootMargin,
    triggerOnce: true,
    delay
  });

  const renderSkeleton = () => {
    if (skeleton) {
      return skeleton;
    }

    return (
      <div className="animate-pulse space-y-4">
        <SkeletonLoader height="2rem" width="60%" />
        <SkeletonLoader height="1rem" count={3} spacing="0.75rem" />
        <div className="grid grid-cols-3 gap-4">
          <SkeletonLoader height="4rem" />
          <SkeletonLoader height="4rem" />
          <SkeletonLoader height="4rem" />
        </div>
      </div>
    );
  };

  const renderFallback = () => {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="flex items-center justify-center" style={{ minHeight }}>
        <LoadingSpinner size="medium" text="Loading component..." />
      </div>
    );
  };

  return (
    <div
      ref={elementRef}
      className={className}
      style={{ minHeight }}
    >
      {isVisible ? children : renderSkeleton()}
    </div>
  );
};

/**
 * Lazy Data Component
 * Loads data when component becomes visible
 */
export const LazyDataComponent = ({
  fetchFunction,
  dependencies = [],
  cacheKey,
  cacheTime = 5 * 60 * 1000,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  threshold = 0.1,
  rootMargin = '100px',
  className = '',
  minHeight = '200px'
}) => {
  const {
    elementRef,
    data,
    loading,
    error,
    isVisible,
    refresh
  } = useLazyData({
    fetchFunction,
    dependencies,
    cacheKey,
    cacheTime,
    threshold,
    rootMargin
  });

  const renderLoading = () => {
    if (loadingComponent) {
      return loadingComponent;
    }

    return (
      <div className="flex items-center justify-center" style={{ minHeight }}>
        <LoadingSpinner size="medium" text="Loading data..." />
      </div>
    );
  };

  const renderError = () => {
    if (errorComponent) {
      return errorComponent;
    }

    return (
      <div className="flex flex-col items-center justify-center text-center p-6" style={{ minHeight }}>
        <svg className="w-12 h-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-app-main mb-2">Failed to load data</h3>
        <p className="text-app-muted mb-4">{error?.message || 'An error occurred while loading data'}</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-app-accent text-white rounded-pro hover:bg-app-accent/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  };

  const renderEmpty = () => {
    if (emptyComponent) {
      return emptyComponent;
    }

    return (
      <div className="flex flex-col items-center justify-center text-center p-6" style={{ minHeight }}>
        <svg className="w-12 h-12 text-app-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 className="text-lg font-medium text-app-main mb-2">No data available</h3>
        <p className="text-app-muted">There's no data to display at the moment.</p>
      </div>
    );
  };

  return (
    <div ref={elementRef} className={className}>
      {!isVisible ? (
        <div style={{ minHeight }}>
          <SkeletonLoader height="2rem" width="60%" className="mb-4" />
          <SkeletonLoader height="1rem" count={3} spacing="0.75rem" />
        </div>
      ) : error ? (
        renderError()
      ) : loading ? (
        renderLoading()
      ) : !data || (Array.isArray(data) && data.length === 0) ? (
        renderEmpty()
      ) : (
        children(data, { refresh, loading, error })
      )}
    </div>
  );
};

/**
 * Progressive Dashboard Loader
 * Loads dashboard components progressively with staggered animations
 */
export const ProgressiveDashboardLoader = ({
  components = [],
  delay = 200,
  staggerDelay = 100,
  className = ''
}) => {
  const [loadedComponents, setLoadedComponents] = React.useState(new Set());
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (currentIndex >= components.length) return;

    const timer = setTimeout(() => {
      setLoadedComponents(prev => new Set([...prev, currentIndex]));
      setCurrentIndex(prev => prev + 1);
    }, delay + (currentIndex * staggerDelay));

    return () => clearTimeout(timer);
  }, [currentIndex, components.length, delay, staggerDelay]);

  return (
    <div className={className}>
      {components.map((Component, index) => (
        <div
          key={index}
          className={`
            transition-all duration-500 ease-out
            ${loadedComponents.has(index) 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4'
            }
          `}
        >
          {loadedComponents.has(index) ? (
            <Component />
          ) : (
            <div className="h-48">
              <SkeletonLoader height="2rem" width="60%" className="mb-4" />
              <SkeletonLoader height="1rem" count={3} spacing="0.75rem" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Infinite Scroll Activity Feed
 * Specialized component for activity feeds with infinite scrolling
 */
export const InfiniteScrollActivityFeed = ({
  activities = [],
  hasMore = true,
  isLoading = false,
  onLoadMore,
  renderActivity,
  className = ''
}) => {
  const [displayedActivities, setDisplayedActivities] = React.useState([]);
  const loadMoreRef = React.useRef();

  // Update displayed activities when new activities are loaded
  React.useEffect(() => {
    setDisplayedActivities(activities);
  }, [activities]);

  // Intersection observer for infinite scroll
  React.useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef || isLoading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore?.();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isLoading, hasMore, onLoadMore]);

  return (
    <div className={`space-y-4 ${className}`}>
      {displayedActivities.map((activity, index) => (
        <div
          key={activity.id || index}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {renderActivity ? renderActivity(activity, index) : (
            <div className="p-4 bg-app-surface border border-app-border rounded-pro">
              <p className="text-app-main">{activity.description}</p>
              <p className="text-app-muted text-sm mt-1">{activity.timestamp}</p>
            </div>
          )}
        </div>
      ))}

      {/* Loading indicator */}
      <div ref={loadMoreRef} className="text-center py-4">
        {isLoading && (
          <div className="flex items-center justify-center">
            <LoadingSpinner size="small" />
            <span className="ml-2 text-app-muted text-sm">Loading more activities...</span>
          </div>
        )}
        {!hasMore && displayedActivities.length > 0 && (
          <p className="text-app-muted text-sm">No more activities to load</p>
        )}
      </div>
    </div>
  );
};

/**
 * Lazy Chart Component
 * Loads chart libraries and data only when needed
 */
export const LazyChartComponent = ({
  chartType = 'line',
  data,
  options = {},
  fetchData,
  cacheKey,
  className = '',
  height = '300px'
}) => {
  const [ChartComponent, setChartComponent] = React.useState(null);
  const [chartData, setChartData] = React.useState(data);

  const {
    elementRef,
    data: fetchedData,
    loading,
    error,
    isVisible
  } = useLazyData({
    fetchFunction: fetchData,
    cacheKey,
    enabled: isVisible && !data && fetchData
  });

  // Load chart library when component becomes visible
  React.useEffect(() => {
    if (isVisible && !ChartComponent) {
      // Dynamically import chart library
      import('react-chartjs-2').then(({ Line, Bar, Pie, Doughnut }) => {
        const chartComponents = {
          line: Line,
          bar: Bar,
          pie: Pie,
          doughnut: Doughnut
        };
        setChartComponent(() => chartComponents[chartType] || Line);
      });
    }
  }, [isVisible, ChartComponent, chartType]);

  // Update chart data
  React.useEffect(() => {
    if (fetchedData) {
      setChartData(fetchedData);
    }
  }, [fetchedData]);

  return (
    <div ref={elementRef} className={className} style={{ height }}>
      {!isVisible ? (
        <SkeletonLoader height={height} />
      ) : error ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-red-500">Failed to load chart</p>
        </div>
      ) : loading || !ChartComponent ? (
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="medium" text="Loading chart..." />
        </div>
      ) : (
        <ChartComponent data={chartData} options={options} />
      )}
    </div>
  );
};

export default LazyDashboardComponent;
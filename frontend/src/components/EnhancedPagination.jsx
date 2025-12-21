import React from 'react';
import { usePagination } from '../hooks/usePagination';

/**
 * Enhanced Pagination Component with advanced features
 * Supports different pagination modes and customizable UI
 */
const EnhancedPagination = ({
  data = [],
  pageSize = 10,
  serverSide = false,
  totalCount = 0,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  showPageInfo = true,
  showJumpToPage = false,
  maxVisiblePages = 5,
  pageSizeOptions = [5, 10, 20, 50, 100],
  className = '',
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const {
    currentPage,
    totalPages,
    pageSize: currentPageSize,
    totalCount: total,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
    isFirstPage,
    isLastPage,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    changePageSize,
    getPageNumbers
  } = usePagination({
    data,
    pageSize,
    serverSide,
    totalCount,
    onPageChange,
    onPageSizeChange
  });

  const sizeClasses = {
    small: {
      button: 'px-2 py-1 text-xs',
      select: 'px-2 py-1 text-xs',
      text: 'text-xs'
    },
    medium: {
      button: 'px-3 py-2 text-sm',
      select: 'px-3 py-2 text-sm',
      text: 'text-sm'
    },
    large: {
      button: 'px-4 py-2 text-base',
      select: 'px-4 py-2 text-base',
      text: 'text-base'
    }
  };

  const classes = sizeClasses[size];

  const PaginationButton = ({ onClick, disabled, active, children, ...props }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${classes.button}
        border border-app-border rounded transition-colors duration-200
        ${active 
          ? 'bg-app-accent text-white border-app-accent' 
          : 'bg-app-surface text-app-main hover:bg-app-secondary'
        }
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:border-app-accent'
        }
      `}
      {...props}
    >
      {children}
    </button>
  );

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Page Info */}
      {showPageInfo && (
        <div className={`${classes.text} text-app-muted`}>
          Showing {startIndex} to {endIndex} of {total} results
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* First Page */}
        <PaginationButton
          onClick={goToFirstPage}
          disabled={isFirstPage}
          title="First page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </PaginationButton>

        {/* Previous Page */}
        <PaginationButton
          onClick={goToPreviousPage}
          disabled={!hasPreviousPage}
          title="Previous page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </PaginationButton>

        {/* Page Numbers */}
        {getPageNumbers(maxVisiblePages).map((pageNum) => (
          <PaginationButton
            key={pageNum}
            onClick={() => goToPage(pageNum)}
            active={currentPage === pageNum}
          >
            {pageNum}
          </PaginationButton>
        ))}

        {/* Next Page */}
        <PaginationButton
          onClick={goToNextPage}
          disabled={!hasNextPage}
          title="Next page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </PaginationButton>

        {/* Last Page */}
        <PaginationButton
          onClick={goToLastPage}
          disabled={isLastPage}
          title="Last page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </PaginationButton>
      </div>

      {/* Page Size Selector */}
      {showPageSizeSelector && (
        <div className="flex items-center gap-2">
          <span className={`${classes.text} text-app-muted`}>Show:</span>
          <select
            value={currentPageSize}
            onChange={(e) => changePageSize(Number(e.target.value))}
            className={`
              ${classes.select}
              border border-app-border rounded bg-app-surface text-app-main
              focus:outline-none focus:ring-2 focus:ring-app-accent/20 focus:border-app-accent
            `}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className={`${classes.text} text-app-muted`}>per page</span>
        </div>
      )}

      {/* Jump to Page */}
      {showJumpToPage && totalPages > maxVisiblePages && (
        <div className="flex items-center gap-2">
          <span className={`${classes.text} text-app-muted`}>Go to:</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            placeholder="Page"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  goToPage(page);
                  e.target.value = '';
                }
              }
            }}
            className={`
              ${classes.select}
              w-20 border border-app-border rounded bg-app-surface text-app-main
              focus:outline-none focus:ring-2 focus:ring-app-accent/20 focus:border-app-accent
            `}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Infinite Scroll Component
 */
export const InfiniteScrollPagination = ({
  hasMore = true,
  isLoading = false,
  onLoadMore,
  loadingComponent,
  endMessage = 'No more items to load',
  className = ''
}) => {
  const loadMoreRef = React.useRef();

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
    <div className={`text-center py-4 ${className}`}>
      <div ref={loadMoreRef}>
        {isLoading && (
          loadingComponent || (
            <div className="flex items-center justify-center">
              <svg className="animate-spin w-5 h-5 text-app-accent mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-app-muted">Loading more...</span>
            </div>
          )
        )}
        {!hasMore && !isLoading && (
          <div className="text-app-muted text-sm">
            {endMessage}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Virtual Scroll Container
 */
export const VirtualScrollContainer = ({
  items = [],
  itemHeight = 50,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = ''
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = React.useRef();

  const visibleRange = React.useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);

    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = React.useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      ...item,
      index: visibleRange.start + index,
      offsetTop: (visibleRange.start + index) * itemHeight
    }));
  }, [items, visibleRange, itemHeight]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = React.useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item) => (
          <div
            key={item.id || item.index}
            style={{
              position: 'absolute',
              top: item.offsetTop,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, item.index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedPagination;
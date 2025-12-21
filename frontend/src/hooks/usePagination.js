import { useState, useMemo, useCallback } from 'react';

/**
 * Enhanced pagination hook with advanced features
 * Supports server-side pagination, infinite scroll, and virtual scrolling
 */
export const usePagination = ({
  data = [],
  pageSize = 10,
  serverSide = false,
  totalCount = 0,
  onPageChange,
  onPageSizeChange,
  initialPage = 1
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSizeState, setPageSizeState] = useState(pageSize);

  // Calculate pagination values
  const totalPages = useMemo(() => {
    if (serverSide) {
      return Math.ceil(totalCount / pageSizeState);
    }
    return Math.ceil(data.length / pageSizeState);
  }, [serverSide, totalCount, data.length, pageSizeState]);

  const startIndex = useMemo(() => {
    return (currentPage - 1) * pageSizeState;
  }, [currentPage, pageSizeState]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + pageSizeState, serverSide ? totalCount : data.length);
  }, [startIndex, pageSizeState, serverSide, totalCount, data.length]);

  // Get current page data (for client-side pagination)
  const currentData = useMemo(() => {
    if (serverSide) {
      return data; // Server provides already paginated data
    }
    return data.slice(startIndex, startIndex + pageSizeState);
  }, [data, startIndex, pageSizeState, serverSide]);

  // Navigation functions
  const goToPage = useCallback((page) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
    
    if (serverSide && onPageChange) {
      onPageChange(validPage, pageSizeState);
    }
  }, [totalPages, serverSide, onPageChange, pageSizeState]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const goToFirstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const goToLastPage = useCallback(() => {
    goToPage(totalPages);
  }, [goToPage, totalPages]);

  // Change page size
  const changePageSize = useCallback((newPageSize) => {
    setPageSizeState(newPageSize);
    setCurrentPage(1); // Reset to first page
    
    if (serverSide && onPageSizeChange) {
      onPageSizeChange(newPageSize);
    }
  }, [serverSide, onPageSizeChange]);

  // Get page numbers for pagination UI
  const getPageNumbers = useCallback((maxVisible = 5) => {
    const pages = [];
    const half = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }, [currentPage, totalPages]);

  // Pagination info
  const paginationInfo = useMemo(() => ({
    currentPage,
    totalPages,
    pageSize: pageSizeState,
    totalCount: serverSide ? totalCount : data.length,
    startIndex: startIndex + 1,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages
  }), [currentPage, totalPages, pageSizeState, serverSide, totalCount, data.length, startIndex, endIndex]);

  return {
    // Data
    currentData,
    
    // Pagination info
    ...paginationInfo,
    
    // Navigation functions
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    changePageSize,
    getPageNumbers,
    
    // State setters (for external control)
    setCurrentPage,
    setPageSize: setPageSizeState
  };
};

/**
 * Infinite scroll hook for loading more data
 */
export const useInfiniteScroll = ({
  hasMore = true,
  isLoading = false,
  onLoadMore,
  threshold = 100,
  rootMargin = '100px'
}) => {
  const [isFetching, setIsFetching] = useState(false);

  const loadMoreRef = useCallback((node) => {
    if (isLoading || !hasMore || !node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching) {
          setIsFetching(true);
          onLoadMore?.().finally(() => {
            setIsFetching(false);
          });
        }
      },
      {
        rootMargin,
        threshold: 0.1
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, isFetching, onLoadMore, rootMargin]);

  return {
    loadMoreRef,
    isFetching: isFetching || isLoading
  };
};

/**
 * Virtual scrolling hook for large datasets
 */
export const useVirtualScroll = ({
  items = [],
  itemHeight = 50,
  containerHeight = 400,
  overscan = 5
}) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);

    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      ...item,
      index: visibleRange.start + index,
      offsetTop: (visibleRange.start + index) * itemHeight
    }));
  }, [items, visibleRange, itemHeight]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    visibleRange
  };
};

/**
 * Smart pagination hook that combines regular and infinite scroll
 */
export const useSmartPagination = ({
  data = [],
  pageSize = 20,
  mode = 'pagination', // 'pagination' | 'infinite' | 'virtual'
  serverSide = false,
  totalCount = 0,
  onLoadMore,
  onPageChange,
  itemHeight = 50,
  containerHeight = 400
}) => {
  const pagination = usePagination({
    data,
    pageSize,
    serverSide,
    totalCount,
    onPageChange
  });

  const infiniteScroll = useInfiniteScroll({
    hasMore: serverSide ? pagination.hasNextPage : false,
    onLoadMore,
    isLoading: false
  });

  const virtualScroll = useVirtualScroll({
    items: data,
    itemHeight,
    containerHeight
  });

  // Return appropriate interface based on mode
  switch (mode) {
    case 'infinite':
      return {
        ...pagination,
        ...infiniteScroll,
        mode: 'infinite'
      };
    
    case 'virtual':
      return {
        ...virtualScroll,
        mode: 'virtual',
        totalCount: data.length
      };
    
    default:
      return {
        ...pagination,
        mode: 'pagination'
      };
  }
};
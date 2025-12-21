import React from 'react';
import { useLazyImage } from '../utils/lazyLoading';

const LazyImage = ({ 
  src, 
  alt, 
  placeholder = '', 
  className = '', 
  width, 
  height,
  loading = 'lazy',
  ...props 
}) => {
  const { imgRef, imageSrc, isLoaded, handleLoad } = useLazyImage(src, placeholder);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
      
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-app-secondary animate-pulse flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-app-muted" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default LazyImage;